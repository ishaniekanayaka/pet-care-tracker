import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const DashboardLayout = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={['bottom']}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#5D688A",
          tabBarInactiveTintColor: "#666",
          headerShown: false,
          tabBarShowLabel: true, // 👈 Text names hide karanna
          tabBarStyle: {
            backgroundColor: "#fff",
            height: 70,
            paddingBottom: 16,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: "#ddd",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="settings-applications" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="medical-services" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="feeding_shedule"
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="restaurant" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="vets"
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="emergency" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
};

export default DashboardLayout;
