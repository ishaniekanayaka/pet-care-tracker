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
import { register } from "@/services/authService";
import { LinearGradient } from "expo-linear-gradient";

const Register = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState<boolean>(false);
  const [isLoadingReg, setIsLoadingReg] = useState<boolean>(false);

  const handleRegister = async () => {
    if (isLoadingReg) return;

    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoadingReg(true);

    try {
      await register(email, password);
      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoadingReg(false);
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
                source={require("../../assets/images/petgif.gif")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </LinearGradient>

            <Text className="text-4xl font-extrabold text-black mt-4">Join PetCare</Text>
            <Text className="text-lg text-gray-700 mt-2 text-center px-4">
              Create your account to start caring for your furry friends
            </Text>
          </View>

          {/* Form Section */}
          <View className="w-full max-w-md">
            <Text className="text-4xl font-bold mb-6 text-black text-center">
              Create Account
            </Text>

            {/* Email */}
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

            {/* Password */}
            <View className="mb-5 relative">
              <Text className="text-sm font-semibold text-black mb-2">Password</Text>
              <TextInput
                className="border border-gray-400 p-4 w-full rounded-xl bg-white shadow-md text-black text-base"
                placeholder="Create your password"
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

            {/* Confirm Password */}
            <View className="mb-6 relative">
              <Text className="text-sm font-semibold text-black mb-2">Confirm Password</Text>
              <TextInput
                className="border border-gray-400 p-4 w-full rounded-xl bg-white shadow-md text-black text-base"
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!isConfirmVisible}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Pressable
                onPress={() => setIsConfirmVisible(!isConfirmVisible)}
                className="absolute right-4 top-12"
              >
                <Ionicons
                  name={isConfirmVisible ? "eye" : "eye-off"}
                  size={24}
                  color="#A8BBA3"
                />
              </Pressable>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              className={`p-5 rounded-xl mt-2 w-full shadow-lg ${
                isLoadingReg ? "bg-[#A8BBA3]/50" : "bg-[#A8BBA3]"
              }`}
              onPress={handleRegister}
              disabled={isLoadingReg}
            >
              <View className="flex-row justify-center items-center">
                {isLoadingReg ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white text-center font-bold text-lg mr-2">
                      Create Account
                    </Text>
                    <Ionicons name="paw" size={22} color="#fff" />
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Login Link */}
            <Pressable className="mt-6 p-2" onPress={() => router.replace("/login")}>
              <Text className="text-center text-base text-gray-600">
                Already have an account?{" "}
                <Text className="font-bold text-[#A8BBA3]">Sign In</Text>
              </Text>
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
    width: 120,
    height: 120,
  },
});

export default Register;
