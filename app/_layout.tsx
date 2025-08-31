import { View, Text } from 'react-native'
import React from 'react'
import "./../global.css"
import { LoaderProvider } from '@/context/LoaderContext'
import { AuthProvider } from '@/context/AuthContext'
import { Slot } from 'expo-router'

const RootLayout = () => {
  return (
    <LoaderProvider>
        <AuthProvider>
            <Slot />
        </AuthProvider>
    </LoaderProvider>
  )
}

export default RootLayout