import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "xerxes-client.favorites";

interface FavoritesState {
  ids: number[];
  ready: boolean;
  init: () => Promise<void>;
  toggle: (id: number) => void;
  isFavorite: (id: number) => boolean;
}

async function persist(ids: number[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: [],
  ready: false,
  init: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const ids = raw ? (JSON.parse(raw) as number[]) : [];
      set({ ids, ready: true });
    } catch {
      set({ ready: true });
    }
  },
  toggle: (id: number) => {
    const current = get().ids;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    set({ ids: next });
    persist(next);
  },
  isFavorite: (id: number) => get().ids.includes(id),
}));
