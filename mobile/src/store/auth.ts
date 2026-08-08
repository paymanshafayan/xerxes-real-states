import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Staff {
  id: number;
  username: string;
  name: string;
  role: "manager" | "consultant";
  email?: string;
  phone?: string;
  avatar?: string | null;
  agentId?: number | null;
  permissions?: string[];
  status?: string;
}

interface AuthState {
  token: string | null;
  staff: Staff | null;
  setAuth: (token: string, staff: Staff) => void;
  setStaff: (staff: Staff) => void;
  logout: () => void;
  isManager: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  staff: null,
  setAuth: (token, staff) => set({ token, staff }),
  setStaff: (staff) => set({ staff }),
  logout: () => set({ token: null, staff: null }),
  isManager: () => get().staff?.role === "manager",
}));

// Persist token + staff
(async () => {
  try {
    const token = await AsyncStorage.getItem("xerxes.token");
    const staffRaw = await AsyncStorage.getItem("xerxes.staff");
    if (token && staffRaw) {
      useAuthStore.setState({ token, staff: JSON.parse(staffRaw) });
    }
  } catch {
    /* ignore */
  }
})();

export function persistAuth(token: string, staff: Staff) {
  useAuthStore.getState().setAuth(token, staff);
  AsyncStorage.setItem("xerxes.token", token).catch(() => {});
  AsyncStorage.setItem("xerxes.staff", JSON.stringify(staff)).catch(() => {});
}

export function clearAuth() {
  useAuthStore.getState().logout();
  AsyncStorage.removeItem("xerxes.token").catch(() => {});
  AsyncStorage.removeItem("xerxes.staff").catch(() => {});
}
