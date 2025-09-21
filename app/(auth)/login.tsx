import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  StyleSheet,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants/keys";
import { login } from "@/services/authService";
import { LinearGradient } from "expo-linear-gradient";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isLoadingLogin, setIsLoadingLogin] = useState<boolean>(false);

  const handleLogin = async () => {
    if (isLoadingLogin) return;
    setIsLoadingLogin(true);

    try {
      const loggedInUser = await login(email, password);
      Alert.alert("Success", "Logged in successfully!");

      const key = `${STORAGE_KEYS.ONBOARDED}:${
        loggedInUser.user?.uid || loggedInUser.user?.email
      }`;
      const seen = await AsyncStorage.getItem(key);

      if (seen) {
        router.replace("/dashboard/profile");
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center items-center p-6 bg-white">
          {/* Logo Section */}
          <View className="items-center mb-10">
            <LinearGradient
              colors={["#A8BBA3", "#ffffff"]}
              style={styles.logoCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Image
                source={require('../../assets/images/petgif.gif')} // add your image here
                style={styles.logoImage}
                resizeMode="contain"
              />
            </LinearGradient>

            <Text className="text-4xl font-extrabold text-black mt-4">PetCare</Text>
            <Text className="text-lg text-gray-700 mt-2 text-center px-4">
              Loving care for your furry friends
            </Text>
          </View>

          {/* Form Section */}
          <View className="w-full max-w-md">
            <Text className="text-4xl font-bold mb-6 text-black text-center">
              WELCOME BACK
            </Text>

            <View className="mb-5">
              <Text className="text-sm font-semibold text-black mb-2">Email</Text>
              <TextInput
                className="border border-gray-400 p-4 w-full rounded-xl bg-white shadow-md text-black text-base"
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-6 relative">
              <Text className="text-sm font-semibold text-black mb-2">Password</Text>
              <TextInput
                className="border border-gray-400 p-4 w-full rounded-xl bg-white shadow-md text-black text-base"
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                className="absolute right-4 top-12"
              >
                <Ionicons
                  name={isPasswordVisible ? "eye" : "eye-off"}
                  size={24}
                  color="#A8BBA3"
                />
              </Pressable>
            </View>

            <TouchableOpacity
              className={`p-5 rounded-xl mt-2 w-full shadow-lg ${
                isLoadingLogin ? "bg-[#A8BBA3]/50" : "bg-[#A8BBA3]"
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
                    <Ionicons name="paw" size={22} color="#fff" />
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Sign up Section */}
          <View className="flex-row mt-8">
            <Text className="text-gray-700 text-base">Don't have an account? </Text>
            <Pressable onPress={() => router.push("/register")}>
              <Text className="text-[#A8BBA3] font-bold text-base">Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  logoCircle: {
    width: 144,
    height: 144,
    borderRadius: 72,
    marginBottom: 16,
    shadowColor: "#A8BBA3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 200,
    height: 100,
  },
});

export default Login;
