import axios from "axios";
import { API_URL } from "../config";
import { useAuthStore, clearAuth } from "../store/auth";

export const http = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

// Attach auth token to every request
http.interceptors.request.use((config: any) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto logout on 401
http.interceptors.response.use(
  (res: any) => res,
  (error: any) => {
    if (error?.response?.status === 401) {
      clearAuth();
    }
    return Promise.reject(error);
  }
);
