import React from "react";
import { View, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/auth";
import { useThemeStore } from "../store/theme";
import { t } from "../i18n";
import DashboardScreen from "../screens/DashboardScreen";
import PropertyListScreen from "../screens/PropertyListScreen";
import PropertyFormScreen from "../screens/PropertyFormScreen";
import PropertyDetailScreen from "../screens/PropertyDetailScreen";
import MapScreen from "../screens/MapScreen";
import LeadsScreen from "../screens/LeadsScreen";
import AppointmentsScreen from "../screens/AppointmentsScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ChatThreadScreen from "../screens/ChatThreadScreen";
import ProfileScreen from "../screens/ProfileScreen";
import InquiriesScreen from "../screens/InquiriesScreen";
import StaffManagementScreen from "../screens/StaffManagementScreen";
import ActivityScreen from "../screens/ActivityScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AgentsScreen from "../screens/AgentsScreen";
import SearchScreen from "../screens/SearchScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function PropertiesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PropertyList" component={PropertyListScreen} options={{ title: t("properties") }} />
      <Stack.Screen name="PropertyForm" component={PropertyFormScreen} options={{ title: t("addProperty") }} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: t("properties") }} />
      <Stack.Screen name="Map" component={MapScreen} options={{ title: t("map") }} />
    </Stack.Navigator>
  );
}

function ChatStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: t("chat") }} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={{ title: t("chat") }} />
    </Stack.Navigator>
  );
}

function LeadsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Leads" component={LeadsScreen} options={{ title: t("leads") }} />
    </Stack.Navigator>
  );
}

function InquiriesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Inquiries" component={InquiriesScreen} options={{ title: t("inquiries") }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t("profile") }} />
      <Stack.Screen name="StaffManagement" component={StaffManagementScreen} options={{ title: t("roleConsultant") + "s" }} />
      <Stack.Screen name="Agents" component={AgentsScreen} options={{ title: t("agents") }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t("settings") }} />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: t("dashboard") }} />
    </Stack.Navigator>
  );
}

function AppointmentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Appointments" component={AppointmentsScreen} options={{ title: t("appointments") }} />
    </Stack.Navigator>
  );
}

function ManagerTabs() {
  const { theme } = useThemeStore();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
      }}
    >
      <Tab.Screen name="DashboardT" component={DashboardStack} options={{ title: t("dashboard"), tabBarIcon: icon("🏠") }} />
      <Tab.Screen name="PropertiesT" component={PropertiesStack} options={{ title: t("properties"), tabBarIcon: icon("🏢") }} />
      <Tab.Screen name="AppointmentsT" component={AppointmentsStack} options={{ title: t("appointments"), tabBarIcon: icon("📅") }} />
      <Tab.Screen name="LeadsT" component={LeadsStack} options={{ title: t("leads"), tabBarIcon: icon("🎯") }} />
      <Tab.Screen name="InquiriesT" component={InquiriesStack} options={{ title: t("inquiries"), tabBarIcon: icon("📥") }} />
      <Tab.Screen name="ActivityT" component={ActivityScreen} options={{ title: t("activity"), tabBarIcon: icon("📊") }} />
      <Tab.Screen name="ChatT" component={ChatStack} options={{ title: t("chat"), tabBarIcon: icon("💬") }} />
      <Tab.Screen name="ProfileT" component={ProfileStack} options={{ title: t("profile"), tabBarIcon: icon("👤") }} />
      <Tab.Screen name="SearchT" component={SearchScreen} options={{ title: t("search"), tabBarIcon: icon("🔍") }} />
    </Tab.Navigator>
  );
}

function ConsultantTabs() {
  const { theme } = useThemeStore();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
      }}
    >
      <Tab.Screen name="MyPropertiesT" component={PropertiesStack} options={{ title: t("myProperties"), tabBarIcon: icon("🏢") }} />
      <Tab.Screen name="MyLeadsT" component={LeadsStack} options={{ title: t("leads"), tabBarIcon: icon("🎯") }} />
      <Tab.Screen name="MyInquiriesT" component={InquiriesStack} options={{ title: t("inquiries"), tabBarIcon: icon("📥") }} />
      <Tab.Screen name="MyChatT" component={ChatStack} options={{ title: t("chat"), tabBarIcon: icon("💬") }} />
      <Tab.Screen name="MyProfileT" component={ProfileStack} options={{ title: t("profile"), tabBarIcon: icon("👤") }} />
      <Tab.Screen name="MySearchT" component={SearchScreen} options={{ title: t("search"), tabBarIcon: icon("🔍") }} />
    </Tab.Navigator>
  );
}

function icon(emoji: string) {
  return () => (
    <View>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
    </View>
  );
}

export default function AppNavigator() {
  const role = useAuthStore((s) => s.staff?.role);
  return role === "manager" ? <ManagerTabs /> : <ConsultantTabs />;
}
