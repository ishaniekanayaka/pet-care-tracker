import { STORAGE_KEYS } from "@/constants/keys";
import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

const Index = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!loading) {
        if (!user) {
          router.replace("/login");
        } else {
          const key = `${STORAGE_KEYS.ONBOARDED}:${user.email}`;
          const seen = await AsyncStorage.getItem(key);
          if (seen) {
            router.replace("/welcome");
          } else {
            router.replace("/welcome");
          }
        }
        setChecking(false);
      }
    };
    check();
  }, [user, loading]);

  if (loading || checking) {
    return (
      <View className="flex-1 w-full justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
};

export default Index;
