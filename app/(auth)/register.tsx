import { register } from '@/services/authService';
import { useRouter } from 'expo-router'; // ✅ correct import for expo-router
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';


const Register = () => {
  const router = useRouter(); 
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoadingReg, setIsLoadingReg] = useState<boolean>(false); 

  const handleRegister = async () => {

    if (isLoadingReg) return; // prevent double-click
    setIsLoadingReg(true);

    Alert.alert("Please wait", "Registering your account...");

    await register(email, password)
    .then((res)=>{
      //success
      console.log(res)
      router.back();
    })
    .catch((err)=>{
      //error
      console.error( err)
      Alert.alert("Error", "Registration failed. Please try again.")
    })
    .finally(() => {
        setIsLoadingReg(false)
    })
  }

  return (
    <View className="flex-1 w-full justify-center items-center p-4 bg-green-100">
      <Text className="text-lg font-bold mb-6 text-blue-950 text-center">
        REGISTER
      </Text>

      <TextInput
        className="border border-gray-300 p-2 mb-4 w-full"
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        className="border border-gray-300 p-2 mb-4 w-full"
        placeholder="Password"
        placeholderTextColor="#9CA3AF" 
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity className="bg-blue-500 p-4 rounded-lg mt-4" onPress={handleRegister}>
       
        {isLoadingReg ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white">Register</Text>
        )}
      </TouchableOpacity>

      <Pressable onPress={() => router.back()}>
        <Text className="text-blue-500 text-center">
          Already have an account? Login
        </Text>
      </Pressable>
    </View>
  );
};

export default Register;
