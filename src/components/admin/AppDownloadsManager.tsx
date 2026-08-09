"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, ExternalLink, Loader2, Pencil, Plus, Save, Smartphone, Trash2, Upload } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";
import { AppDownloadConfig, EMPTY_APP_DOWNLOAD_CONFIG, StoreLink, StorePlatform, parseAppDownloadConfig } from "@/lib/appDownloads";

type AppKind = "client" | "staff";
const names: Record<AppKind, string> = { client: "Customer app", staff: "Staff app" };
const platformLabels: Record<StorePlatform, string> = { google_play: "Google Play", app_store: "App Store", direct_apk: "Direct download", other: "Other store" };

export default function AppDownloadsManager() {
  const [active, setActive] = useState<AppKind>("client");
  const [configs, setConfigs] = useState<Record<AppKind, AppDownloadConfig>>({ client: { stores: [] }, staff: { stores: [] } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ label: "", url: "", platform: "google_play" as StorePlatform });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminFetch("/api/admin/content?section=app_downloads");
      const body = await response.json();
      const section = body.content?.app_downloads || {};
      setConfigs({ client: parseAppDownloadConfig(section.client), staff: parseAppDownloadConfig(section.staff) });
    } catch { setError("Could not load app distribution settings."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (next: AppDownloadConfig, app = active) => {
    setSaving(true); setError("");
    try {
      const res = await adminFetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "app_downloads", key: app, value: next }) });
      if (!res.ok) throw new Error();
      setConfigs((current) => ({ ...current, [app]: next }));
    } catch { setError("Could not save. Please try again."); }
    finally { setSaving(false); }
  };

  const addStore = async () => {
    const url = draft.url.trim(); const label = draft.label.trim() || platformLabels[draft.platform];
    if (!/^https?:\/\//i.test(url)) { setError("Enter a complete https:// store URL."); return; }
    const next = { ...configs[active], stores: [...configs[active].stores, { id: crypto.randomUUID(), label, url, platform: draft.platform }] };
    await save(next); setDraft({ label: "", url: "", platform: "google_play" });
  };
  const removeStore = async (id: string) => save({ ...configs[active], stores: configs[active].stores.filter((store) => store.id !== id) });
  const updateStore = async (store: StoreLink) => {
    const label = window.prompt("Button label", store.label); if (label === null) return;
    const url = window.prompt("Store URL", store.url); if (url === null) return;
    if (!/^https?:\/\//i.test(url.trim())) { setError("Enter a complete https:// store URL."); return; }
    await save({ ...configs[active], stores: configs[active].stores.map((item) => item.id === store.id ? { ...item, label: label.trim() || store.label, url: url.trim() } : item) });
  };
  const uploadApk = async (file?: File) => {
    if (!file) return;
    setUploading(true); setError("");
    try {
      const form = new FormData(); form.append("app", active); form.append("file", file);
      const response = await adminFetch("/api/admin/app-downloads/upload", { method: "POST", body: form });
      const body = await response.json(); if (!response.ok) throw new Error(body.error);
      await save({ ...configs[active], apkUrl: body.url, apkName: body.name });
    } catch (err) { setError(err instanceof Error ? err.message : "APK upload failed."); }
    finally { setUploading(false); }
  };
  const removeApk = async () => save({ ...configs[active], apkUrl: undefined, apkName: undefined });

  const config = configs[active] || EMPTY_APP_DOWNLOAD_CONFIG;
  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  return <div className="max-w-4xl space-y-6">
    <div><h2 className="text-xl font-bold text-gray-900">App downloads</h2><p className="text-sm text-gray-500 mt-1">Manage separate customer and staff distribution links. Only configured buttons appear publicly.</p></div>
    <div className="flex gap-2 border-b border-gray-200">{(["client", "staff"] as AppKind[]).map((app) => <button key={app} onClick={() => { setActive(app); setError(""); }} className={`px-4 py-2.5 text-sm font-semibold border-b-2 ${active === app ? "border-primary text-primary" : "border-transparent text-gray-500"}`}><Smartphone className="inline w-4 h-4 mr-2" />{names[app]}</button>)}</div>
    {active === "staff" && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Staff distribution is not shown on the public website. Use this APK link only from the protected admin area.</div>}
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4"><div><h3 className="font-semibold text-gray-900">Direct Android APK</h3><p className="text-xs text-gray-500 mt-1">Upload a signed APK (max 200 MB). This replaces the current direct-download file.</p></div>
      {config.apkUrl ? <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm"><Download className="w-4 h-4 text-primary" /><a className="text-primary hover:underline" href={config.apkUrl} target="_blank" rel="noreferrer">{config.apkName || "Current APK"}</a><button onClick={removeApk} disabled={saving} className="ml-auto text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button></div> : <p className="text-sm text-gray-500">No APK uploaded.</p>}
      <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark"><Upload className="w-4 h-4" />{uploading ? "Uploading…" : "Upload APK"}<input type="file" accept=".apk,application/vnd.android.package-archive" className="hidden" disabled={uploading} onChange={(event) => uploadApk(event.target.files?.[0])} /></label>
    </section>
    <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5"><div><h3 className="font-semibold text-gray-900">Store links</h3><p className="text-xs text-gray-500 mt-1">Add any store. Each saved link appears as its own button on the appropriate download page.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_150px_auto] gap-2"><select value={draft.platform} onChange={(e) => setDraft((old) => ({ ...old, platform: e.target.value as StorePlatform }))} className="border rounded-lg px-3 py-2 text-sm">{Object.entries(platformLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input value={draft.label} onChange={(e) => setDraft((old) => ({ ...old, label: e.target.value }))} placeholder="Optional button label" className="border rounded-lg px-3 py-2 text-sm" /><input value={draft.url} onChange={(e) => setDraft((old) => ({ ...old, url: e.target.value }))} placeholder="https://…" className="border rounded-lg px-3 py-2 text-sm" /><button onClick={addStore} disabled={saving} className="inline-flex justify-center items-center gap-1 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm"><Plus className="w-4 h-4" />Add</button></div>
      <div className="space-y-2">{config.stores.length === 0 ? <p className="text-sm text-gray-500">No store links configured.</p> : config.stores.map((store) => <div key={store.id} className="flex items-center gap-3 border rounded-lg px-3 py-3"><div className="flex-1 min-w-0"><p className="font-medium text-sm text-gray-900">{store.label}</p><p className="text-xs text-gray-500 truncate">{store.url}</p></div><a href={store.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary"><ExternalLink className="w-4 h-4" /></a><button onClick={() => updateStore(store)} className="text-gray-400 hover:text-primary"><Pencil className="w-4 h-4" /></button><button onClick={() => removeStore(store.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div>)}</div>
    </section>
    {saving && <div className="fixed bottom-5 right-5 bg-gray-900 text-white text-sm rounded-lg px-4 py-2"><Save className="inline w-4 h-4 mr-1" /> Saving…</div>}
  </div>;
}
