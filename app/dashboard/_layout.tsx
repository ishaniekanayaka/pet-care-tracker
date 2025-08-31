import React from 'react'
import { Tabs } from 'expo-router'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

const tabs = [
  { label: "Home", name: "home", icon: "home-filled" },
  { label: "Profile", name: "profile", icon: "person" },
  { label: "Setting", name: "settings", icon: "settings" },
]

const DashboardLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#999",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ccc",
        },
      }}
    >
      {tabs.map(({ name, icon, label }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name={icon as any} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  )
}

export default DashboardLayout
