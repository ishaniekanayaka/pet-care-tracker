import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  TextInput, 
  Modal 
} from "react-native";
import { useRouter } from "expo-router";
import { logout } from "@/services/authService";
import { 
  sendPasswordResetEmail, 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential 
} from "firebase/auth";
import { auth } from "@/firebase";
import Animated, { FadeInUp } from "react-native-reanimated";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // For change password modal
  const [modalVisible, setModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login"); // back to login screen
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

  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (user && user.email) {
      try {
        // re-authenticate with old password
        const credential = EmailAuthProvider.credential(user.email, oldPassword);
        await reauthenticateWithCredential(user, credential);

        // update password
        await updatePassword(user, newPassword);
        Alert.alert("Success", "Password updated successfully!");
        setModalVisible(false);
        setOldPassword("");
        setNewPassword("");
      } catch (error: any) {
        if (error.code === "auth/wrong-password") {
          Alert.alert("Error", "Old password is incorrect.");
        } else if (error.code === "auth/weak-password") {
          Alert.alert("Error", "New password is too weak.");
        } else {
          Alert.alert("Error", error.message);
        }
      }
    } else {
      Alert.alert("Error", "No user logged in.");
    }
  };

  return (
    <Animated.View style={styles.container} entering={FadeInUp.duration(600)}>
      <Text style={styles.header}>⚙️ Settings</Text>

      {/* Reset Password */}
      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>
          {loading ? "Sending..." : "Reset Password (via Email)"}
        </Text>
      </TouchableOpacity>

      {/* Change Password (In-App) */}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: "#10b981" }]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>Change Password (In-App)</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: "#ef4444" }]} 
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      {/* Change Password Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>🔑 Change Password</Text>
            
            <TextInput
              placeholder="Old Password"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              style={styles.input}
            />
            <TextInput
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.input}
            />

            <TouchableOpacity style={styles.modalButton} onPress={handleChangePassword}>
              <Text style={styles.modalButtonText}>Update Password</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: "#9ca3af" }]} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    width: "85%",
    padding: 20,
    borderRadius: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
});
