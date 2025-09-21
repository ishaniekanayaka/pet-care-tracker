import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const DashboardLayout = () => {
  // Define your theme colors
  const COLORS = {
    background: "#fff", // white
    active: "#A8BBA3", // greenish
    inactive: "#000", // black
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['bottom']}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: COLORS.active,
          tabBarInactiveTintColor: COLORS.inactive,
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: COLORS.background,
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
        {/* <Tabs.Screen
          name="setting"
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="settings-applications" color={color} size={size} />
            ),
          }}
        /> */}
        <Tabs.Screen
          name="health"
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="medical-services" color={color} size={size} />
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
        <Tabs.Screen
          name="feeding_shedule"
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="restaurant" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="vet"
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="emergency" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
};

export default DashboardLayout;
