import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { useLocaleStore } from "./src/store/locale";
import { useFavoritesStore } from "./src/store/favorites";
import { isRTL } from "./src/i18n";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 60_000 } },
});

export default function App() {
  const [ready, setReady] = useState(false);
  const initLocale = useLocaleStore((s) => s.init);
  const initFavorites = useFavoritesStore((s) => s.init);
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    Promise.all([initLocale(), initFavorites()]).finally(() => setReady(true));
  }, [initLocale, initFavorites]);

  if (!ready) return null;

  const direction: "rtl" | "ltr" = isRTL(locale) ? "rtl" : "ltr";

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <NavigationContainer direction={direction}>
          <AppNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
