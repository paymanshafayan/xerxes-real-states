import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import HomeScreen from "../screens/HomeScreen";
import SearchScreen from "../screens/SearchScreen";
import PriceDropsScreen from "../screens/PriceDropsScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import ChatScreen from "../screens/ChatScreen";
import MoreScreen from "../screens/MoreScreen";
import PropertyDetailScreen from "../screens/PropertyDetailScreen";
import CalculatorsScreen from "../screens/CalculatorsScreen";
import { colors } from "../theme";
import { useT } from "../store/locale";
import { useFavoritesStore } from "../store/favorites";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerShadowVisible: false,
} as const;

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: "" }} />
      <Stack.Screen name="Calculators" component={CalculatorsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: "" }} />
      <Stack.Screen name="Calculators" component={CalculatorsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function PriceDropsStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="PriceDrops" component={PriceDropsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: "" }} />
      <Stack.Screen name="Calculators" component={CalculatorsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="More" component={MoreScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: "" }} />
      <Stack.Screen name="Calculators" component={CalculatorsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function AppNavigator() {
  const t = useT();
  const favoritesCount = useFavoritesStore((s) => s.ids.length);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarBadgeStyle: { backgroundColor: colors.primary },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ title: t("tabHome"), tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{ title: t("tabSearch"), tabBarIcon: () => <TabIcon emoji="🔍" /> }}
      />
      <Tab.Screen
        name="PriceDropsTab"
        component={PriceDropsStack}
        options={{ title: t("tabPriceDrops"), tabBarIcon: () => <TabIcon emoji="📉" /> }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{ title: t("tabChat"), tabBarIcon: () => <TabIcon emoji="💬" /> }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStack}
        options={{
          title: t("tabMore"),
          tabBarIcon: () => <TabIcon emoji="⚙️" />,
          tabBarBadge: favoritesCount > 0 ? favoritesCount : undefined,
        }}
      />
    </Tab.Navigator>
  );
}
