import { View, Pressable } from "react-native";
import React from "react";
import { useRouter, useSegments } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const tabs = [
  
  { label: "Vets", path: "/dashboard/vets", icon: "emergency" }, // 🩺 emergency icon
  { label: "Settings", path: "/dashboard/settings", icon: "settings-applications" },
  { label: "Profile", path: "/dashboard/profile", icon: "person" },
] as const;

const FooterNav = () => {
  const router = useRouter();
  const segment = useSegments();
  const activeRouter = "/" + (segment[0] || "");

  return (
    <View className="flex-row justify-around border-t border-gray-300 py-2 bg-white">
      {tabs.map((data) => (
        <Pressable
          key={data.path}
          className="items-center"
          onPress={() => router.push(data.path)}
        >
          <MaterialIcons
            name={data.icon}
            size={28}
            color={activeRouter === data.path ? "#5D688A" : "#666"}
          />
        </Pressable>
      ))}
    </View>
  );
};

export default FooterNav;
