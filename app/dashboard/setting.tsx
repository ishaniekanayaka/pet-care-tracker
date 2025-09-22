import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import {
  logout,
  sendResetPasswordEmail,
  updateUserEmail,
  updateUserPassword,
} from "@/services/authService";

const Settings = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isChangeEmailModalVisible, setIsChangeEmailModalVisible] = useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Email change states
  const [newEmail, setNewEmail] = useState("");
  
  // Password change states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await logout();
              router.replace("../../(auth)/login");
            } catch (error: any) {
              Alert.alert("Error", error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      Alert.alert("Error", "No email found for current user");
      return;
    }

    Alert.alert(
      "Reset Password",
      `Send password reset email to ${user.email}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Send",
          onPress: async () => {
            if (!user?.email) {
                Alert.alert("Error", "No email found for current user");
                return;
            }

            try {
                setLoading(true);
                await sendResetPasswordEmail(user.email); // now guaranteed string
                Alert.alert(
                "Success",
                "Password reset email sent! Check your inbox."
                );
            } catch (error: any) {
                Alert.alert("Error", error.message);
            } finally {
                setLoading(false);
            }
            }

        },
      ]
    );
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim()) {
      Alert.alert("Error", "Please enter a new email");
      return;
    }

    if (newEmail === user?.email) {
      Alert.alert("Error", "This is already your current email");
      return;
    }

    try {
      setLoading(true);
      await updateUserEmail(newEmail);
      Alert.alert("Success", "Email updated successfully!");
      setIsChangeEmailModalVisible(false);
      setNewEmail("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in both password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      await updateUserPassword(newPassword);
      Alert.alert("Success", "Password updated successfully!");
      setIsChangePasswordModalVisible(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const SettingsItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    danger = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingsItem, danger && styles.dangerItem]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, danger && styles.dangerIconContainer]}>
          <MaterialIcons
            name={icon as any}
            size={24}
            color={danger ? "#ff6b6b" : "#A8BBA3"}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.settingsTitle, danger && styles.dangerText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingsSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {showArrow && (
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={danger ? "#ff6b6b" : "#A8BBA3"}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#A8BBA3" />
      <View style={styles.container}>
        {/* Header Gradient */}
        <LinearGradient
          colors={["#A8BBA3", "rgba(168, 187, 163, 0.1)"]}
          locations={[0, 1]}
          style={styles.headerGradient}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerRight}>
            <MaterialIcons name="pets" size={24} color="white" />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* User Info Section */}
          <View style={styles.section}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <MaterialIcons name="person" size={40} color="#A8BBA3" />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>Pet Parent</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>
          </View>

          {/* Account Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.settingsGroup}>
            <SettingsItem
                icon="email"
                title="Change Email"
                subtitle={user?.email ?? undefined} // <-- fix here
                onPress={() => setIsChangeEmailModalVisible(true)}
            />

              <SettingsItem
                icon="lock"
                title="Change Password"
                subtitle="Update your password"
                onPress={() => setIsChangePasswordModalVisible(true)}
              />
              <SettingsItem
                icon="lock-reset"
                title="Reset Password"
                subtitle="Send reset email"
                onPress={handlePasswordReset}
              />
            </View>
          </View>

          {/* App Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Settings</Text>
            <View style={styles.settingsGroup}>
              <SettingsItem
                icon="notifications"
                title="Notifications"
                subtitle="Manage pet reminders"
                onPress={() => {
                  Alert.alert("Coming Soon", "Notification settings will be available soon!");
                }}
              />
              <SettingsItem
                icon="palette"
                title="Theme"
                subtitle="Customize appearance"
                onPress={() => {
                  Alert.alert("Coming Soon", "Theme settings will be available soon!");
                }}
              />
              <SettingsItem
                icon="backup"
                title="Backup & Sync"
                subtitle="Keep your data safe"
                onPress={() => {
                  Alert.alert("Coming Soon", "Backup settings will be available soon!");
                }}
              />
            </View>
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.settingsGroup}>
              <SettingsItem
                icon="help"
                title="Help & FAQ"
                subtitle="Get support"
                onPress={() => {
                  Alert.alert("Help", "Contact us at support@petcare.com");
                }}
              />
              <SettingsItem
                icon="info"
                title="About"
                subtitle="App version & info"
                onPress={() => {
                  Alert.alert("PetCare", "Version 1.0.0\nBuilt with ❤️ for pet parents");
                }}
              />
            </View>
          </View>

          {/* Logout */}
          <View style={styles.section}>
            <View style={styles.settingsGroup}>
              <SettingsItem
                icon="logout"
                title="Logout"
                subtitle="Sign out of your account"
                onPress={handleLogout}
                danger={true}
              />
            </View>
          </View>

          {/* Bottom Decoration */}
          <View style={styles.bottomDecoration}>
            <MaterialIcons name="pets" size={16} color="rgba(168, 187, 163, 0.3)" />
            <MaterialIcons name="pets" size={12} color="rgba(168, 187, 163, 0.2)" />
          </View>
        </ScrollView>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#A8BBA3" />
          </View>
        )}

        {/* Change Email Modal */}
        <Modal
          visible={isChangeEmailModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new email"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsChangeEmailModalVisible(false);
                    setNewEmail("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleEmailChange}
                >
                  <Text style={styles.confirmButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={isChangePasswordModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TextInput
                style={styles.input}
                placeholder="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={true}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsChangePasswordModalVisible(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handlePasswordChange}
                >
                  <Text style={styles.confirmButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  headerRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#A8BBA3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(168, 187, 163, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666666",
  },
  settingsGroup: {
    backgroundColor: "white",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#A8BBA3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(168, 187, 163, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  dangerItem: {
    borderBottomColor: "rgba(255, 107, 107, 0.1)",
  },
  dangerIconContainer: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  textContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 2,
  },
  dangerText: {
    color: "#ff6b6b",
  },
  settingsSubtitle: {
    fontSize: 12,
    color: "#666666",
  },
  bottomDecoration: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
    marginBottom: 20,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    width: "100%",
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  confirmButton: {
    backgroundColor: "#A8BBA3",
  },
  cancelButtonText: {
    color: "#666666",
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Settings;