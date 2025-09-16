import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { logout } from "@/services/authService";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";
import Animated, { FadeInUp } from "react-native-reanimated";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login"); // navigate back to login
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleResetPassword = async () => {
    const email = auth.currentUser?.email;
    if (!email) {
      Alert.alert("Error", "No email found for this account.");
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "Password reset email sent to " + email);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={styles.container} entering={FadeInUp.duration(600)}>
      <Text style={styles.header}>⚙️ Settings</Text>

      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>
          {loading ? "Sending..." : "Reset Password"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: "#ef4444" }]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#111827",
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
});
