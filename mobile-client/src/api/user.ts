import AsyncStorage from "@react-native-async-storage/async-storage";
import { http } from "./client";

/**
 * Phase 8: User auth (client app).
 *
 * Manages the regular user JWT (web auth_token equivalent) in AsyncStorage.
 * This is separate from staff auth (mobile app).
 */

const TOKEN_KEY = "xerxes-client.userToken";
const USER_KEY = "xerxes-client.user";

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  isBlocked?: boolean;
}

let inMemoryToken: string | null = null;
let inMemoryUser: User | null = null;

// Initialize from storage on first import
AsyncStorage.getItem(TOKEN_KEY).then((t) => {
  inMemoryToken = t;
});
AsyncStorage.getItem(USER_KEY).then((u) => {
  if (u) {
    try {
      inMemoryUser = JSON.parse(u);
    } catch {}
  }
});

export async function getToken(): Promise<string | null> {
  if (inMemoryToken) return inMemoryToken;
  inMemoryToken = await AsyncStorage.getItem(TOKEN_KEY);
  return inMemoryToken;
}

export async function getCurrentUser(): Promise<User | null> {
  if (inMemoryUser) return inMemoryUser;
  const u = await AsyncStorage.getItem(USER_KEY);
  if (u) {
    try {
      inMemoryUser = JSON.parse(u);
    } catch {}
  }
  return inMemoryUser;
}

export async function loginUser(
  email: string,
  password: string
): Promise<User> {
  const res = await http.post<{ success: boolean; token: string; user: User; error?: string }>(
    "/api/auth/login",
    { email, password }
  );
  if (!res.data.success) {
    throw new Error(res.data.error || "Login failed");
  }
  await AsyncStorage.setItem(TOKEN_KEY, res.data.token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
  inMemoryToken = res.data.token;
  inMemoryUser = res.data.user;
  return res.data.user;
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<User> {
  const res = await http.post<{ success: boolean; user: User; error?: string }>(
    "/api/auth/register",
    { email, password, name, phone }
  );
  if (!res.data.success) {
    throw new Error(res.data.error || "Registration failed");
  }
  // Auto-login after register
  return await loginUser(email, password);
}

export async function logoutUser(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
  inMemoryToken = null;
  inMemoryUser = null;
}

// Attach token to all requests
http.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 -> logout
http.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      const data = err.response?.data;
      if (data?.code === "ACCOUNT_BLOCKED") {
        // Keep token but flag user as blocked
        const u = await getCurrentUser();
        if (u) {
          u.isBlocked = true;
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
          inMemoryUser = u;
        }
      }
    }
    return Promise.reject(err);
  }
);
