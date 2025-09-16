import { Stack } from "expo-router";
import React from "react";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#f8fafc" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    />
  );
}
