import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { STORAGE_KEYS } from "@/constants/keys";

const Welcome = () => {
  const router = useRouter();
  const { user } = useAuth();

  const handleContinue = async () => {
    const key = `${STORAGE_KEYS.ONBOARDED}:${user?.email}`;
    await AsyncStorage.setItem(key, "1");
    router.replace("/dashboard/profile");
  };

  return (
    <View className="flex-1 justify-center items-center p-6 bg-white">
      <Image
        source={require("../assets/images/pet3.jpg")}
        style={{ width: 120, height: 120 }}
      />
      <Text className="text-3xl font-bold mt-6 text-[#5D688A]">
        Welcome to PawPal 🐾
      </Text>
      <Text className="text-lg text-gray-600 mt-4 text-center">
        Track vaccinations, feeding times, vet visits & more.
      </Text>
      <TouchableOpacity
        onPress={handleContinue}
        className="mt-10 bg-[#5D688A] px-8 py-4 rounded-2xl shadow"
      >
        <Text className="text-white font-bold text-lg">Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Welcome;
