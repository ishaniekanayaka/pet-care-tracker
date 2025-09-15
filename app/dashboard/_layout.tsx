import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";

const tabs = [
  { label: "Home", name: "index", icon: "home" },
  { label: "Health", name: "health", icon: "medical-services" },
  { label: "Diet", name: "diet", icon: "restaurant" },
  { label: "Vets", name: "vets", icon: "local-hospital" },
  { label: "Profile", name: "profile", icon: "person" },
];

const DashboardLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#666",
        headerShown: false,
        tabBarStyle: {
          display: 'flex',
          backgroundColor: "#fff",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: "#ddd",
        },
        tabBarLabelStyle: {
          fontSize: 12,
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
        name="health"
        options={{
          title: "Health",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="medical-services" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="diet"
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
  );
};

export default DashboardLayout;