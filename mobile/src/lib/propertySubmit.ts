import { uploadFiles, createProperty, updateProperty } from "../api/staff";
import { useDraftStore } from "../store/drafts";
import type { PropertyDraft } from "../store/drafts";

function mimeFor(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    mp4: "video/mp4", mov: "video/quicktime",
    m4a: "audio/m4a", mp3: "audio/mpeg", wav: "audio/wav", webm: "audio/webm",
  };
  return map[ext || ""] || "application/octet-stream";
}

async function uploadGroup(uris: string[], kind: string): Promise<string[]> {
  if (uris.length === 0) return [];
  const form = new FormData() as any;
  form.append("kind", kind);
  uris.forEach((uri, i) => {
    const ext = uri.split(".").pop() || "dat";
    form.append("files", { uri, name: `file${i}.${ext}`, type: mimeFor(uri) });
  });
  const res = await uploadFiles(form);
  return res.urls || [];
}

export function isNetworkError(e: any): boolean {
  // axios network failures have no `response` object
  return !e?.response && !!e;
}

/** Build a create/update payload from a draft and push it to the backend. */
export async function submitDraft(d: PropertyDraft): Promise<void> {
  const images = await uploadGroup(d.images || [], "image");
  const panoramas = await uploadGroup(d.panoramas || [], "panorama");
  const videos = await uploadGroup(d.videos || [], "video");
  const audioNotes = await uploadGroup(d.audioNotes || [], "audio");
  const documents = await uploadGroup(d.documents || [], "document");

  const payload = {
    titleFa: d.titleFa,
    titleEn: d.titleEn || d.titleFa,
    titleTr: d.titleTr || d.titleFa,
    titleRu: d.titleRu || d.titleFa,
    descriptionFa: d.descFa,
    descriptionEn: d.descEn || d.descFa,
    descriptionTr: d.descTr || d.descFa,
    descriptionRu: d.descRu || d.descFa,
    type: d.type,
    category: d.category,
    price: Number(d.price) || 0,
    currency: d.currency,
    bedrooms: Number(d.bedrooms) || 0,
    bathrooms: Number(d.bathrooms) || 0,
    area: Number(d.area) || 0,
    city: d.city,
    district: d.district,
    address: d.address,
    features: (d.features || "").split(",").map((s) => s.trim()).filter(Boolean),
    lat: d.lat != null ? Number(d.lat) : null,
    lng: d.lng != null ? Number(d.lng) : null,
    images,
    panoramas,
    videos,
    audioNotes,
    documents,
  };

  if (d.editId) await updateProperty(d.editId, payload);
  else await createProperty(payload);
}

/** Try to submit any drafts that were saved while offline. */
export async function syncPendingDrafts(): Promise<void> {
  const pending = useDraftStore.getState().drafts.filter((d) => d.pendingSync);
  for (const d of pending) {
    try {
      await submitDraft(d);
      await useDraftStore.getState().remove(d.id);
    } catch {
      // keep as pending for next attempt
    }
  }
}
