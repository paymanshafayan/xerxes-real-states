import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkTheme, lightTheme, type Theme } from "../theme";

interface ThemeState {
  isDark: boolean;
  theme: Theme;
  toggle: () => void;
  setDark: (v: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  theme: lightTheme,
  toggle: () => {
    const next = !get().isDark;
    set({ isDark: next, theme: next ? darkTheme : lightTheme });
    AsyncStorage.setItem("xerxes.dark", next ? "1" : "0").catch(() => {});
  },
  setDark: (v) => set({ isDark: v, theme: v ? darkTheme : lightTheme }),
}));

(async () => {
  try {
    const v = await AsyncStorage.getItem("xerxes.dark");
    if (v !== null) {
      const dark = v === "1";
      useThemeStore.setState({ isDark: dark, theme: dark ? darkTheme : lightTheme });
    }
  } catch {
    /* ignore */
  }
})();
