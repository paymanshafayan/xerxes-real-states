import React, { useEffect, useState } from "react";
import { NavigationContainer, type NavigationContainerRef } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, AppState } from "react-native";
import * as Notifications from "expo-notifications";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuthStore } from "./src/store/auth";
import { useThemeStore } from "./src/store/theme";
import { initI18n, i18n, isRTL } from "./src/i18n";
import { http } from "./src/api/client";
import { setQueryClient } from "./src/store/queryClient";
import { connectAbly, disconnectAbly } from "./src/lib/ably";
import { syncPendingDrafts } from "./src/lib/propertySubmit";
import LoginScreen from "./src/screens/LoginScreen";
import AppNavigator from "./src/navigation/AppNavigator";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
setQueryClient(queryClient);

function handleNotificationOpen(
  navRef: React.RefObject<NavigationContainerRef<any>>,
  sessionId?: string
) {
  if (!sessionId) return;
  // Ensure we're inside the app, then jump to the chat thread.
  setTimeout(() => {
    try {
      navRef.current?.navigate("ChatThread", { sessionId });
    } catch {
      /* ignore */
    }
  }, 300);
}

async function registerPushToken() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await http
      .post("/api/staff/push/register", { pushToken: tokenData.data })
      .catch(() => {});
  } catch {
    /* ignore */
  }
}

export default function App() {
  const token = useAuthStore((s) => s.token);
  const { theme } = useThemeStore();
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const navRef = React.useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    initI18n().finally(() => setReady(true));
  }, []);

  // Register push token + biometric gate + realtime once authenticated
  useEffect(() => {
    if (!token) {
      setLocked(false);
      disconnectAbly();
      return;
    }
    registerPushToken();
    connectAbly();
    (async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (compatible && enrolled) {
          const res = await LocalAuthentication.authenticateAsync({
            promptMessage: "Xerxes Realty",
          });
          setLocked(!res.success);
        } else {
          setLocked(false);
        }
      } catch {
        setLocked(false);
      }
    })();
  }, [token]);

  // Auto-sync drafts that were saved while offline
  useEffect(() => {
    const trySync = () => {
      if (useAuthStore.getState().token) syncPendingDrafts();
    };
    trySync();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") trySync();
    });
    return () => sub.remove();
  }, []);

  // Handle incoming push notifications (deep-link to chat).
  // This MUST run before the `if (!ready) return null` below — every hook
  // in a component must run on every render, in the same order, or React
  // throws and the whole app fails to mount (this was the root cause of
  // the blank white screen: this effect used to sit after the early
  // return, so it ran on some renders but not others).
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    const sub = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data as any;
      handleNotificationOpen(navRef, data?.sessionId);
    });
    Notifications.getLastNotificationResponseAsync().then((r: any) => {
      const data = r?.notification.request.content.data as any;
      if (data?.sessionId) handleNotificationOpen(navRef, data.sessionId);
    });
    return () => sub.remove();
  }, []);

  if (!ready) return null;

  const direction: "rtl" | "ltr" = isRTL(i18n.locale) ? "rtl" : "ltr";

  if (token && locked) {
    return (
      <View style={[styles.lock, { backgroundColor: theme.background }]}>
        <Text style={{ fontSize: 48, color: theme.primary, fontWeight: "700" }}>X</Text>
        <TouchableOpacity
          style={[styles.unlockBtn, { backgroundColor: theme.primary }]}
          onPress={() => setLocked(false)}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer ref={navRef} direction={direction}>
        <StatusBar />
        {token ? <AppNavigator /> : <LoginScreen />}
      </NavigationContainer>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  lock: { flex: 1, alignItems: "center", justifyContent: "center", gap: 24 },
  unlockBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
});
