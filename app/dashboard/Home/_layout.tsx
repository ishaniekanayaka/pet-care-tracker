import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";

const tabs = [
  { label: "Home", name: "home", icon: "home-filled" },
  { label: "Health", name: "health", icon: "pets" },
  { label: "Diet", name: "diet", icon: "restaurant" },
  { label: "Vets", name: "vets", icon: "local-hospital" },
  { label: "Profile", name: "profile", icon: "person" },
];

const DashboardLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#eee",
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name={tab.icon as any} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
};

export default DashboardLayout;
