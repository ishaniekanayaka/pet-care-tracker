import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const AuthLayout = () => {
  return (
//    <Stack screenOptions={{headerShown: false}}> header eka penne nathi krnnth puluwan
    <Stack screenOptions={{animation: 'slide_from_right' ,headerShown: false}}>
        <Stack.Screen name="Login" options={{title: "Login"}}/>
        <Stack.Screen name="Register"  />
    </Stack>
  )
}

export default AuthLayout