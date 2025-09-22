import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { logout, sendResetPasswordEmail, updateUserEmail, updateUserPassword } from "@/services/authService";

const Settings = () => {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert("Success", "Logged out successfully");
      // navigate to login page if needed
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleUpdateEmail = async () => {
    try {
      await updateUserEmail(newEmail);
      Alert.alert("Success", "Email updated successfully");
      setNewEmail("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      await updateUserPassword(newPassword);
      Alert.alert("Success", "Password updated successfully");
      setNewPassword("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleResetPasswordEmail = async () => {
    try {
      await sendResetPasswordEmail(resetEmail);
      Alert.alert("Success", "Password reset email sent!");
      setResetEmail("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {/* Update Email */}
      <TextInput
        placeholder="New Email"
        value={newEmail}
        onChangeText={setNewEmail}
        style={styles.input}
        keyboardType="email-address"
      />
      <TouchableOpacity onPress={handleUpdateEmail} style={styles.button}>
        <Text style={styles.buttonText}>Update Email</Text>
      </TouchableOpacity>

      {/* Update Password */}
      <TextInput
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
        secureTextEntry
      />
      <TouchableOpacity onPress={handleUpdatePassword} style={styles.button}>
        <Text style={styles.buttonText}>Update Password</Text>
      </TouchableOpacity>

      {/* Password Reset Email */}
      <TextInput
        placeholder="Email for password reset"
        value={resetEmail}
        onChangeText={setResetEmail}
        style={styles.input}
        keyboardType="email-address"
      />
      <TouchableOpacity onPress={handleResetPasswordEmail} style={styles.button}>
        <Text style={styles.buttonText}>Send Reset Email</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={[styles.button, { backgroundColor: "red" }]}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
