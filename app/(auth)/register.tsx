import { register } from '@/services/authService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Register = () => {
  const router = useRouter(); 
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoadingReg, setIsLoadingReg] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

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

    await register(email, password)
    .then((res)=>{
      console.log(res)
      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    })
    .catch((err)=>{
      console.error(err)
      Alert.alert("Error", "Registration failed. Please try again.")
    })
    .finally(() => {
        setIsLoadingReg(false)
    })
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center items-center p-6 bg-white">
          
          {/* Logo/Image Section */}
          <View className="items-center mb-6">
            <View className="w-32 h-32 rounded-full bg-[#F3F7F0] justify-center items-center mb-4 shadow-sm">
              <Text className="text-5xl">🐾</Text>
            </View>
            <Text className="text-3xl font-bold text-[#5D688A] mt-2">
              Join PetCare
            </Text>
            <Text className="text-lg text-gray-600 mt-2 text-center">
              Create your account to start caring for your furry friends
            </Text>
          </View>

          {/* Form Section */}
          <View className="w-full max-w-md">
            <Text className="text-2xl font-bold mb-6 text-[#5D688A] text-center">
              Create Account
            </Text>

            {/* Email Input */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
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

            {/* Password Input */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
              <View className="border border-[#D1D9E6] rounded-xl bg-white shadow-sm flex-row items-center">
                <TextInput
                  className="flex-1 p-4 text-gray-800"
                  placeholder="Create your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity 
                  className="pr-4"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Confirm Password</Text>
              <View className="border border-[#D1D9E6] rounded-xl bg-white shadow-sm flex-row items-center">
                <TextInput
                  className="flex-1 p-4 text-gray-800"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity 
                  className="pr-4"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              className={`p-5 rounded-xl mt-2 w-full shadow-sm ${isLoadingReg ? "bg-[#9BA5C2]" : "bg-[#5D688A]"}`}
              onPress={handleRegister}
              disabled={isLoadingReg}
            >
              <View className="flex-row justify-center items-center">
                {isLoadingReg ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white text-center font-bold text-lg mr-2">Create Account</Text>
                    <Ionicons name="paw" size={20} color="#fff" />
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Login Link */}
            <Pressable 
              className="mt-6 p-2"
              onPress={() => router.back()}
            >
              <Text className="text-center text-base text-gray-600">
                Already have an account?{' '}
                <Text className="font-bold text-[#5D688A]">Sign In</Text>
              </Text>
            </Pressable>
          </View>

          {/* Bottom Decoration */}
          <View className="flex-row justify-center items-center mt-8 space-x-4">
            <View className="rounded-full p-3 bg-[#F3F7F0]">
              <Text className="text-2xl">🐶</Text>
            </View>
            <View className="rounded-full p-3 bg-[#5D688A]">
              <Text className="text-2xl text-white">🐱</Text>
            </View>
            <View className="rounded-full p-3 bg-[#F3F7F0]">
              <Text className="text-2xl">🐰</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;