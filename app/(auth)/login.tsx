import { login } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants/keys";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoadingLogin, setIsLoadingLogin] = useState<boolean>(false);

  const handleLogin = async () => {
    if (isLoadingLogin) return;
    setIsLoadingLogin(true);

    try {
      const loggedInUser = await login(email, password); 
      // ⚠️ make sure login() returns user object + token

      Alert.alert("Success", "Logged in successfully!");

      const key = `${STORAGE_KEYS.ONBOARDED}:${loggedInUser.user?.uid || loggedInUser.user?.email}`;
      const seen = await AsyncStorage.getItem(key);

      if (seen) {
        router.replace("/dashboard/home");
      } else {
        router.replace("/welcome");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Login failed. Please try again.");
    } finally {
      setIsLoadingLogin(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center items-center p-6 bg-white">
          {/* Logo Section */}
          <View className="items-center mb-8">
            <View className="w-32 h-32 rounded-full bg-[#F3F7F0] justify-center items-center mb-4 shadow-sm">
              <Text className="text-5xl">🐾</Text>
            </View>
            <Text className="text-3xl font-bold text-[#5D688A] mt-4">
              PetCare
            </Text>
            <Text className="text-lg text-gray-600 mt-2">
              Loving care for your furry friends
            </Text>
          </View>

          {/* Form Section */}
          <View className="w-full max-w-md">
            <Text className="text-2xl font-bold mb-6 text-[#5D688A] text-center">
              Welcome Back
            </Text>

            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email
              </Text>
              <TextInput
                className="border border-[#D1D9E6] p-4 w-full rounded-xl bg-white shadow-sm"
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <TextInput
                className="border border-[#D1D9E6] p-4 w-full rounded-xl bg-white shadow-sm"
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              className={`p-5 rounded-xl mt-2 w-full shadow-sm ${
                isLoadingLogin ? "bg-[#9BA5C2]" : "bg-[#5D688A]"
              }`}
              onPress={handleLogin}
              disabled={isLoadingLogin}
            >
              <View className="flex-row justify-center items-center">
                {isLoadingLogin ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white text-center font-bold text-lg mr-2">
                      Sign In
                    </Text>
                    <Ionicons name="paw" size={20} color="#fff" />
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Sign up Section */}
          <View className="flex-row mt-8">
            <Text className="text-gray-600">Don't have an account? </Text>
            <Pressable onPress={() => router.push("/register")}>
              <Text className="text-[#5D688A] font-bold">Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
