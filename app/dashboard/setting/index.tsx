import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { auth, updatePassword } from "@/firebase";
import { sendPasswordResetEmail, signOut, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login"); // Navigate to login page
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  // Password reset via email
  const handleResetPasswordEmail = async () => {
    const email = auth.currentUser?.email;
    if (!email) {
      Alert.alert("Error", "No email found for this account.");
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Check your inbox",
        `We sent a password reset link to ${email}. Open it in your email client to change your password.`
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // In-app password change (old password verification)
  const handleChangePasswordInApp = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password do not match.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert("Error", "No user logged in.");
      return;
    }

    try {
      setLoading(true);
      // Reauthenticate user with old password
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      Alert.alert("Success", "Password updated successfully!");
      // Clear input fields
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>⚙️ Settings</Text>

      {/* In-app Password Change */}
      <Text style={styles.subHeader}>Change Password (In-App)</Text>
      <TextInput
        style={styles.input}
        placeholder="Old Password"
        secureTextEntry
        value={oldPassword}
        onChangeText={setOldPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleChangePasswordInApp}>
        <Text style={styles.buttonText}>{loading ? "Updating..." : "Update Password"}</Text>
      </TouchableOpacity>

      {/* Email-based Password Reset */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#f59e0b", marginTop: 20 }]}
        onPress={handleResetPasswordEmail}
      >
        <Text style={styles.buttonText}>{loading ? "Sending..." : "Reset Password via Email"}</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#ef4444", marginTop: 20 }]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9fafb",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111827",
  },
  subHeader: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: "#374151",
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
