import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";

const DashboardLayout = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={['bottom']}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#5D688A",
          tabBarInactiveTintColor: "#666",
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#fff",
            height: 70,
            paddingBottom: 16,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: "#ddd",
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="settings" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: "Health",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="medical-services" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="feeding_shedule"
          options={{
            title: "Diet",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="restaurant" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="vets"
          options={{
            title: "Vets",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="local-hospital" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
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