import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";

const DashboardLayout = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={['bottom']}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#007AFF",
          tabBarInactiveTintColor: "#666",
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#fff",
            height: 70, // thawa udata
            paddingBottom: 16, // extra bottom padding
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
            title: "Feeding-schedule",
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
