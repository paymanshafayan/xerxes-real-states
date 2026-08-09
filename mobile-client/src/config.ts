import Constants from "expo-constants";

// Backend API base URL. Override with EXPO_PUBLIC_API_URL (see eas.json / .env).
export const API_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string) ||
  process.env.EXPO_PUBLIC_API_URL ||
  "https://xerxes-real-states-production.up.railway.app";

export const APP_NAME = "Xerxes Realty";
export const DEFAULT_LOCALE = "fa";

// Polling interval (ms) for the guest chat widget.
export const CHAT_POLL_INTERVAL = 4000;
