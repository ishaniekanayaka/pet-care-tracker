import { View, ActivityIndicator } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  console.log("User data: ", user);

  useEffect(() => {
    if (!loading) {
      if (user) router.replace("/dashboard/home");
      else router.replace("/login");
    }
  }, [user, loading]); // ✅ properly closed useEffect

  if (loading) {
    return (
      <View className="flex-1 w-full justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
};

export default Index;
