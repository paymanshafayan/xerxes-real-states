import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PropertyDraft {
  id: string;
  // text fields mirror the form state keys (title*/desc* + meta)
  titleEn: string;
  titleFa: string;
  titleTr: string;
  titleRu: string;
  descEn: string;
  descFa: string;
  descTr: string;
  descRu: string;
  type: string;
  category: string;
  price: string;
  currency: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  city: string;
  district: string;
  address: string;
  features: string;
  documents: string[];
  editId?: number;
  pendingSync?: boolean;
  lat?: number | null;
  lng?: number | null;
  // Local (not yet uploaded) media URIs captured on device
  images: string[];
  panoramas: string[];
  videos: string[];
  audioNotes: string[];
  // Auto-translation result (once available)
  translations?: Record<string, string>;
  updatedAt: number;
}

const KEY = "xerxes.drafts";

interface DraftState {
  drafts: PropertyDraft[];
  load: () => Promise<void>;
  save: (draft: PropertyDraft) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

async function readAll(): Promise<PropertyDraft[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PropertyDraft[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(list: PropertyDraft[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export const useDraftStore = create<DraftState>((set, get) => ({
  drafts: [],
  load: async () => set({ drafts: await readAll() }),
  save: async (draft) => {
    const list = await readAll();
    const idx = list.findIndex((d) => d.id === draft.id);
    if (idx >= 0) list[idx] = draft;
    else list.unshift(draft);
    await writeAll(list);
    set({ drafts: list });
  },
  remove: async (id) => {
    const list = (await readAll()).filter((d) => d.id !== id);
    await writeAll(list);
    set({ drafts: list });
  },
  clear: async () => {
    await writeAll([]);
    set({ drafts: [] });
  },
}));
