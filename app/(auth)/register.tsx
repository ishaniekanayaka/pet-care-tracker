import { register } from '@/services/authService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  Image, 
  Pressable, 
  ScrollView,
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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
    <ScrollView className="flex-1 bg-gradient-to-br from-pink-50 to-purple-50">
      <View className="flex-1 justify-center items-center px-6 py-8">
        
        {/* Header Section with Pet Illustration */}
        <View className="items-center mb-8 mt-12">
          <View className="bg-white rounded-full p-6 shadow-lg mb-4">
            <Image 
              source={{
                uri: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200&h=200&fit=crop&crop=face'
              }}
              className="w-24 h-24 rounded-full"
              resizeMode="cover"
            />
          </View>
          <Text className="text-3xl font-bold mb-2" style={{ color: '#5D688A' }}>
            Join PetCare! 🐾
          </Text>
          <Text className="text-center text-base" style={{ color: '#5D688A' }}>
            Create your account to start caring for your furry friends
          </Text>
        </View>

        {/* Form Container */}
        <View className="w-full max-w-sm">
          
          {/* Email Input */}
          <View className="mb-4">
            <Text className="font-semibold mb-2 ml-1" style={{ color: '#5D688A' }}>Email Address</Text>
            <View className="bg-white rounded-2xl shadow-sm" style={{ borderColor: '#5D688A', borderWidth: 1 }}>
              <TextInput
                className="p-4 text-gray-800 text-base"
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-4">
            <Text className="font-semibold mb-2 ml-1" style={{ color: '#5D688A' }}>Password</Text>
            <View className="bg-white rounded-2xl shadow-sm flex-row items-center" style={{ borderColor: '#5D688A', borderWidth: 1 }}>
              <TextInput
                className="flex-1 p-4 text-gray-800 text-base"
                placeholder="Create a password"
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
            <Text className="font-semibold mb-2 ml-1" style={{ color: '#5D688A' }}>Confirm Password</Text>
            <View className="bg-white rounded-2xl shadow-sm flex-row items-center" style={{ borderColor: '#5D688A', borderWidth: 1 }}>
              <TextInput
                className="flex-1 p-4 text-gray-800 text-base"
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
            className="rounded-2xl p-4 shadow-lg"
            style={{ 
              backgroundColor: isLoadingReg ? '#9CA3AF' : '#5D688A'
            }}
            onPress={handleRegister}
            disabled={isLoadingReg}
          >
            <View className="flex-row justify-center items-center">
              {isLoadingReg ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text className="text-white text-lg font-bold mr-2">Create Account</Text>
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
            <Text className="text-center text-base" style={{ color: '#5D688A' }}>
              Already have an account? 
              <Text className="font-bold" style={{ color: '#5D688A' }}> Sign In</Text>
            </Text>
          </Pressable>
        </View>

        {/* Bottom Decoration */}
        <View className="flex-row justify-center items-center mt-8 space-x-4">
          <View className="rounded-full p-3" style={{ backgroundColor: '#E5BEB5' }}>
            <Text className="text-2xl">🐶</Text>
          </View>
          <View className="rounded-full p-3" style={{ backgroundColor: '#5D688A' }}>
            <Text className="text-2xl">🐱</Text>
          </View>
          <View className="rounded-full p-3" style={{ backgroundColor: '#E5BEB5' }}>
            <Text className="text-2xl">🐰</Text>
          </View>
        </View>
        
        {/* App Features Preview */}
        <View className="mt-8 bg-white/60 rounded-2xl p-4 w-full max-w-sm">
          <Text className="font-bold text-center mb-2" style={{ color: '#5D688A' }}>
            What you'll get:
          </Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <Ionicons name="medical" size={16} color="#5D688A" />
              <Text className="ml-2 text-sm" style={{ color: '#5D688A' }}>Health tracking for your pets</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={16} color="#5D688A" />
              <Text className="ml-2 text-sm" style={{ color: '#5D688A' }}>Appointment reminders</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="location" size={16} color="#5D688A" />
              <Text className="ml-2 text-sm" style={{ color: '#5D688A' }}>Find nearby vets & pet stores</Text>
            </View>
          </View>
        </View>

      </View>
    </ScrollView>
    
  );
};

export default Register;