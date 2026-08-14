"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Save,
  Smartphone,
  Trash2,
  Upload,
} from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";
import {
  AppDownloadConfig,
  EMPTY_APP_DOWNLOAD_CONFIG,
  StoreLink,
  StorePlatform,
  parseAppDownloadConfig,
} from "@/lib/appDownloads";

type AppKind = "client" | "staff";
const names: Record<AppKind, string> = { client: "Customer app", staff: "Staff app" };
const platformLabels: Record<StorePlatform, string> = {
  google_play: "Google Play",
  app_store: "App Store",
  direct_apk: "Direct download",
  other: "Other store",
};

const MAX_APK_BYTES = 160 * 1024 * 1024;
// Same transport strategy as the reference repository: small sequential
// requests prevent a reverse proxy/Cloudflare 524 on a 160 MB single request.
const APK_CHUNK_BYTES = 8 * 1024 * 1024;
const APK_CHUNK_TIMEOUT_MS = 5 * 60 * 1000;
const APK_CHUNK_MAX_RETRIES = 3;

type ApkUploadFailureReason = "http" | "network" | "timeout" | "aborted";
interface ApkUploadErrorDetails {
  httpStatus: number;
  responseBody: string;
  lastProgress: number;
  reason: ApkUploadFailureReason;
}

class ApkUploadRequestError extends Error {
  details: ApkUploadErrorDetails;

  constructor(details: ApkUploadErrorDetails) {
    super(`APK upload failed (${details.reason}, HTTP ${details.httpStatus || 0})`);
    this.name = "ApkUploadRequestError";
    this.details = details;
  }
}

function makeSessionId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // Use the fallback below.
  }
  return `apk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function responseTextOr(xhr: XMLHttpRequest, fallback: string) {
  try {
    return xhr.responseText || fallback;
  } catch {
    return fallback;
  }
}

function uploadApkChunk(
  app: AppKind,
  sessionId: string,
  index: number,
  blob: Blob,
  fileName: string,
  totalSize: number,
  authToken: string | null,
  onChunkProgress: (loaded: number) => void,
  onXhr: (xhr: XMLHttpRequest | null) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    onXhr(xhr);

    const fail = (reason: ApkUploadFailureReason, fallbackBody: string) => {
      if (settled) return;
      settled = true;
      onXhr(null);
      reject(
        new ApkUploadRequestError({
          httpStatus: xhr.status || 0,
          responseBody: responseTextOr(xhr, fallbackBody),
          lastProgress: 0,
          reason,
        })
      );
    };

    const query = new URLSearchParams({
      app,
      sessionId,
      index: String(index),
      fileName,
      totalSize: String(totalSize),
    }).toString();
    xhr.open("POST", `/api/admin/app-downloads/upload/chunk?${query}`);
    xhr.timeout = APK_CHUNK_TIMEOUT_MS;
    if (authToken) xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onChunkProgress(event.loaded);
    };
    xhr.onload = () => {
      if (settled) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        settled = true;
        onXhr(null);
        resolve();
        return;
      }
      fail("http", "(empty response body)");
    };
    xhr.onerror = () => fail("network", "Network error: no response body was received");
    xhr.ontimeout = () =>
      fail("timeout", `Chunk request timed out after ${APK_CHUNK_TIMEOUT_MS / 1000} seconds`);
    xhr.onabort = () => fail("aborted", "Chunk request was aborted before the server responded");

    try {
      xhr.send(blob);
    } catch (error) {
      fail("network", String(error));
    }
  });
}

async function finalizeApkUpload(
  app: AppKind,
  sessionId: string,
  fileName: string,
  authToken: string | null
) {
  const response = await fetch("/api/admin/app-downloads/upload/finalize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ app, sessionId, fileName }),
  });
  if (!response.ok) {
    let responseBody = "";
    try {
      responseBody = await response.text();
    } catch {
      // Keep an empty diagnostic when the proxy closed the response.
    }
    throw new ApkUploadRequestError({
      httpStatus: response.status,
      responseBody,
      lastProgress: 100,
      reason: "http",
    });
  }
  return response.json() as Promise<{
    success: boolean;
    key: string;
    url: string;
    name: string;
    size: number;
    config?: AppDownloadConfig;
  }>;
}

async function cancelApkUploadSession(sessionId: string, authToken: string | null) {
  try {
    await fetch(
      `/api/admin/app-downloads/upload/session?sessionId=${encodeURIComponent(sessionId)}`,
      {
        method: "DELETE",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      }
    );
  } catch {
    // The server's six-hour stale-session sweep is the final cleanup fallback.
  }
}

function sendApkInChunks(
  file: File,
  app: AppKind,
  authToken: string | null,
  onProgress: (percent: number) => void,
  onCancel: (cancel: () => void) => void
) {
  const sessionId = makeSessionId();
  const totalSize = file.size;
  const totalChunks = Math.max(1, Math.ceil(totalSize / APK_CHUNK_BYTES));
  let cancelled = false;
  let activeXhr: XMLHttpRequest | null = null;
  let lastProgress = 0;

  const cancel = () => {
    cancelled = true;
    try {
      activeXhr?.abort();
    } catch {
      // Ignore an already completed request.
    }
  };
  onCancel(cancel);

  const reportProgress = (doneBytes: number) => {
    lastProgress = Math.min(100, Math.max(0, Math.round((doneBytes / totalSize) * 100)));
    onProgress(lastProgress);
  };
  const abortedError = () =>
    new ApkUploadRequestError({
      httpStatus: 0,
      responseBody: "Upload cancelled by the user",
      lastProgress,
      reason: "aborted",
    });

  return (async () => {
    try {
      for (let index = 0; index < totalChunks; index += 1) {
        if (cancelled) throw abortedError();
        const start = index * APK_CHUNK_BYTES;
        const chunk = file.slice(start, Math.min(start + APK_CHUNK_BYTES, totalSize));
        let attempt = 0;

        for (;;) {
          if (cancelled) throw abortedError();
          try {
            await uploadApkChunk(
              app,
              sessionId,
              index,
              chunk,
              file.name,
              totalSize,
              authToken,
              (loaded) => reportProgress(start + loaded),
              (xhr) => {
                activeXhr = xhr;
              }
            );
            break;
          } catch (error) {
            attempt += 1;
            const details = error instanceof ApkUploadRequestError ? error.details : null;
            const permanentHttpError = details?.reason === "http" && details.httpStatus < 500;
            if (cancelled || permanentHttpError || attempt > APK_CHUNK_MAX_RETRIES) {
              throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * attempt, 5000)));
          }
        }
      }

      let finalizeAttempt = 0;
      let result: Awaited<ReturnType<typeof finalizeApkUpload>>;
      for (;;) {
        try {
          result = await finalizeApkUpload(app, sessionId, file.name, authToken);
          break;
        } catch (error) {
          finalizeAttempt += 1;
          const details = error instanceof ApkUploadRequestError ? error.details : null;
          const permanentHttpError = details?.reason === "http" && details.httpStatus < 500;
          if (permanentHttpError || finalizeAttempt > APK_CHUNK_MAX_RETRIES) throw error;
          await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * finalizeAttempt, 5000)));
        }
      }
      reportProgress(totalSize);
      return result;
    } catch (error) {
      void cancelApkUploadSession(sessionId, authToken);
      throw error;
    }
  })();
}

const formatBytes = (bytes?: number) =>
  bytes && bytes > 0 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : "";

export default function AppDownloadsManager() {
  const [active, setActive] = useState<AppKind>("client");
  const [configs, setConfigs] = useState<Record<AppKind, AppDownloadConfig>>({
    client: { stores: [] },
    staff: { stores: [] },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<ApkUploadErrorDetails | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ label: "", url: "", platform: "google_play" as StorePlatform });
  const cancelUploadRef = useRef<(() => void) | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminFetch("/api/admin/content?section=app_downloads");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json();
      const section = body.content?.app_downloads || {};
      setConfigs({
        client: parseAppDownloadConfig(section.client),
        staff: parseAppDownloadConfig(section.staff),
      });
    } catch {
      setError("Could not load app distribution settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (next: AppDownloadConfig, app = active) => {
    setSaving(true);
    setError("");
    try {
      const response = await adminFetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "app_downloads", key: app, value: next }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (HTTP ${response.status})`);
      }
      setConfigs((current) => ({ ...current, [app]: next }));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save. Please try again.");
      throw saveError;
    } finally {
      setSaving(false);
    }
  };

  const addStore = async () => {
    const url = draft.url.trim();
    const label = draft.label.trim() || platformLabels[draft.platform];
    if (!/^https?:\/\//i.test(url)) {
      setError("Enter a complete https:// store URL.");
      return;
    }
    const next = {
      ...configs[active],
      stores: [
        ...configs[active].stores,
        { id: crypto.randomUUID(), label, url, platform: draft.platform },
      ],
    };
    try {
      await save(next);
      setDraft({ label: "", url: "", platform: "google_play" });
    } catch {
      // save already displayed the server error
    }
  };

  const removeStore = async (id: string) => {
    try {
      await save({
        ...configs[active],
        stores: configs[active].stores.filter((store) => store.id !== id),
      });
    } catch {
      // save already displayed the server error
    }
  };

  const updateStore = async (store: StoreLink) => {
    const label = window.prompt("Button label", store.label);
    if (label === null) return;
    const url = window.prompt("Store URL", store.url);
    if (url === null) return;
    if (!/^https?:\/\//i.test(url.trim())) {
      setError("Enter a complete https:// store URL.");
      return;
    }
    try {
      await save({
        ...configs[active],
        stores: configs[active].stores.map((item) =>
          item.id === store.id ? { ...item, label: label.trim() || store.label, url: url.trim() } : item
        ),
      });
    } catch {
      // save already displayed the server error
    }
  };

  const uploadApk = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".apk")) {
      setError("Only .apk files are allowed.");
      return;
    }
    if (file.size < 1) {
      setError("The APK file is empty.");
      return;
    }
    if (file.size > MAX_APK_BYTES) {
      setError("APK file is larger than 160 MB.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setError("");
    const previous = configs[active];
    let lastProgress = 0;

    try {
      const result = await sendApkInChunks(
        file,
        active,
        typeof window !== "undefined" ? sessionStorage.getItem("admin_token") : null,
        (percent) => {
          lastProgress = percent;
          setUploadProgress(percent);
        },
        (cancel) => {
          cancelUploadRef.current = cancel;
        }
      );
      if (result.config) {
        // The finalize endpoint persists the URL and removes the previous
        // object server-side. This avoids losing the configuration if the
        // browser disconnects between upload and a second save request.
        setConfigs((current) => ({
          ...current,
          [active]: parseAppDownloadConfig(result.config),
        }));
      } else {
        // Compatibility with an older server that only returns the file.
        await save(
          {
            ...previous,
            apkUrl: result.url,
            apkName: result.name,
            apkKey: result.key,
            apkSize: result.size,
            apkUploadedAt: new Date().toISOString(),
          },
          active
        );
      }
      setUploadProgress(100);
    } catch (uploadFailure) {
      const details =
        uploadFailure instanceof ApkUploadRequestError
          ? uploadFailure.details
          : {
              httpStatus: 0,
              responseBody: String(uploadFailure),
              lastProgress,
              reason: "network" as const,
            };
      setUploadProgress(details.lastProgress);
      setUploadError(details);
      setError("APK upload failed; diagnostics are shown below.");
    } finally {
      cancelUploadRef.current = null;
      setUploading(false);
    }
  };

  const removeApk = async () => {
    const current = configs[active];
    if (!current.apkKey && !current.apkUrl) return;
    try {
      await save(
        {
          ...current,
          apkUrl: undefined,
          apkName: undefined,
          apkKey: undefined,
          apkSize: undefined,
          apkUploadedAt: undefined,
        },
        active
      );
      if (current.apkKey) {
        const response = await adminFetch("/api/admin/app-downloads/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: current.apkKey }),
        });
        if (!response.ok) throw new Error("The link was removed, but the old file could not be deleted.");
      }
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "APK removal failed.");
    }
  };

  const copyUploadError = async () => {
    if (!uploadError) return;
    const diagnostic = [
      `HTTP status: ${uploadError.httpStatus || 0}`,
      `Reason: ${uploadError.reason}`,
      `Last progress: ${uploadError.lastProgress}%`,
      "Response body:",
      uploadError.responseBody || "(empty response body)",
    ].join("\n");
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(diagnostic);
      else {
        const textarea = document.createElement("textarea");
        textarea.value = diagnostic;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
    } catch {
      setError("Could not copy the upload diagnostics.");
    }
  };

  const config = configs[active] || EMPTY_APP_DOWNLOAD_CONFIG;
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">App downloads</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage separate customer and staff distribution links. APK uploads use resumable 8 MB chunks and are published atomically only after every byte arrives.
        </p>
      </div>
      <div className="flex gap-2 border-b border-gray-200">
        {(["client", "staff"] as AppKind[]).map((app) => (
          <button
            key={app}
            disabled={uploading}
            onClick={() => {
              setActive(app);
              setError("");
              setUploadError(null);
            }}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
              active === app ? "border-primary text-primary" : "border-transparent text-gray-500"
            }`}
          >
            <Smartphone className="mr-2 inline h-4 w-4" />
            {names[app]}
          </button>
        ))}
      </div>
      {active === "staff" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Staff distribution is not shown on the public website. Use this APK link only from the protected admin area.
        </div>
      )}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div>
          <h3 className="font-semibold text-gray-900">Direct Android APK</h3>
          <p className="mt-1 text-xs text-gray-500">
            Upload a signed APK (max 160 MB). It is stored on the persistent download volume or Cloudflare R2 and replaces the current direct-download file only after the upload is complete.
          </p>
        </div>
        {config.apkUrl ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm">
            <Download className="h-4 w-4 text-primary" />
            <a className="font-medium text-primary hover:underline" href={config.apkUrl} target="_blank" rel="noreferrer">
              {config.apkName || "Current APK"}
            </a>
            {config.apkSize ? <span className="text-xs text-gray-500">{formatBytes(config.apkSize)}</span> : null}
            <button
              onClick={() => void removeApk()}
              disabled={saving || uploading}
              className="ml-auto text-red-600 hover:text-red-800 disabled:opacity-50"
              title="Remove APK"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No APK uploaded.</p>
        )}
        <div className="space-y-2">
          <label className={`inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors ${uploading ? "pointer-events-none cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-primary-dark"}`}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>{uploading ? `Uploading APK (${uploadProgress}%)…` : "Upload APK"}</span>
            <input
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                const selectedFile = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (selectedFile) void uploadApk(selectedFile);
              }}
            />
          </label>
          {(uploading || uploadProgress > 0) && (
            <div className="max-w-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Chunked upload progress</span>
                <span className="flex items-center gap-2">
                  {uploadProgress}%
                  {uploading && (
                    <button type="button" onClick={() => cancelUploadRef.current?.()} className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                      Cancel
                    </button>
                  )}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-primary transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </div>
        {uploadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900" role="alert">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="font-bold">APK upload error details</p>
                  <p className="mt-1">HTTP {uploadError.httpStatus || 0} · {uploadError.reason} · last progress {uploadError.lastProgress}%</p>
                </div>
              </div>
              <button type="button" onClick={() => void copyUploadError()} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-red-200 px-2.5 py-1.5 font-bold text-red-950">
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/10 p-3 text-[10px] leading-5" dir="ltr">
              {uploadError.responseBody || "(empty response body)"}
            </pre>
          </div>
        )}
      </section>

      <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5">
        <div>
          <h3 className="font-semibold text-gray-900">Store links</h3>
          <p className="mt-1 text-xs text-gray-500">Add any store. Each saved link appears as its own button on the appropriate download page.</p>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[160px_1fr_150px_auto]">
          <select value={draft.platform} onChange={(event) => setDraft((old) => ({ ...old, platform: event.target.value as StorePlatform }))} className="rounded-lg border px-3 py-2 text-sm">
            {Object.entries(platformLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input value={draft.label} onChange={(event) => setDraft((old) => ({ ...old, label: event.target.value }))} placeholder="Optional button label" className="rounded-lg border px-3 py-2 text-sm" />
          <input value={draft.url} onChange={(event) => setDraft((old) => ({ ...old, url: event.target.value }))} placeholder="https://…" className="rounded-lg border px-3 py-2 text-sm" />
          <button onClick={() => void addStore()} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {config.stores.length === 0 ? <p className="text-sm text-gray-500">No store links configured.</p> : config.stores.map((store) => (
            <div key={store.id} className="flex items-center gap-3 rounded-lg border px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{store.label}</p>
                <p className="truncate text-xs text-gray-500">{store.url}</p>
              </div>
              <a href={store.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary"><ExternalLink className="h-4 w-4" /></a>
              <button onClick={() => void updateStore(store)} className="text-gray-400 hover:text-primary"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => void removeStore(store.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </section>
      {saving && <div className="fixed bottom-5 right-5 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"><Save className="mr-1 inline h-4 w-4" /> Saving…</div>}
    </div>
  );
}
