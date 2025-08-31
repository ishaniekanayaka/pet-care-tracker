import { login } from '@/services/authService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoadingLogin, setIsLoadingLogin] = useState<boolean>(false);

  const handleLogin = async () => {
    if (isLoadingLogin) return;
    setIsLoadingLogin(true);

    try {
      await login(email, password); // your Firebase auth service
      Alert.alert("Success", "Logged in successfully!");
      router.push('/dashboard/home'); // navigate to home screen
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Login failed. Please try again.");
    } finally {
      setIsLoadingLogin(false);
    }
  };

  return (
    <View className="flex-1 w-full justify-center items-center p-4 bg-blue-100">
      <Text className="text-2xl font-bold mb-6 text-blue-950 text-center">
        Login to Task Manager
      </Text>

      <TextInput
        className="border border-gray-300 p-3 mb-4 w-full rounded"
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        className="border border-gray-300 p-3 mb-4 w-full rounded"
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        className={`p-4 rounded-lg mt-4 w-full ${isLoadingLogin ? "bg-gray-400" : "bg-blue-500"}`}
        onPress={handleLogin}
        disabled={isLoadingLogin}
      >
        {isLoadingLogin ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-bold">Login</Text>
        )}
      </TouchableOpacity>

      <Pressable className="mt-3" onPress={() => router.push('/register')}>
        <Text className="text-blue-500 text-center">
          Don't have an account? Register
        </Text>
      </Pressable>
    </View>
  );
};

export default Login;
