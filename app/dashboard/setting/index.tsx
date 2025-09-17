import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { auth } from "@/firebase";
import { 
  sendPasswordResetEmail, 
  signOut, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  updatePassword,
  updateEmail,
  sendEmailVerification,
  deleteUser
} from "firebase/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Email change states
  const [showEmailSection, setShowEmailSection] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  
  // User info
  const [userInfo, setUserInfo] = useState({
    email: "",
    emailVerified: false,
    createdAt: "",
    lastSignIn: ""
  });

  // Load user information
  const loadUserInfo = async () => {
    setRefreshing(true);
    const user = auth.currentUser;
    if (user) {
      setUserInfo({
        email: user.email || "",
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime || "",
        lastSignIn: user.metadata.lastSignInTime || ""
      });
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadUserInfo();
  }, []);

  // Logout
  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace("/login");
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
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

  // In-app password change
  const handleChangePasswordInApp = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long.");
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
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      Alert.alert("Success", "Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Change email
  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      Alert.alert("Error", "Email and current password are required.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert("Error", "No user logged in.");
      return;
    }

    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(user.email, emailPassword);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);
      
      Alert.alert("Success", "Email updated successfully! Please verify your new email.");
      setNewEmail("");
      setEmailPassword("");
      setShowEmailSection(false);
      loadUserInfo();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Send email verification
  const handleSendEmailVerification = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "No user logged in.");
      return;
    }

    try {
      setLoading(true);
      await sendEmailVerification(user);
      Alert.alert("Success", "Verification email sent! Check your inbox.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.prompt(
              "Confirm Password",
              "Please enter your password to confirm account deletion:",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Account",
                  style: "destructive",
                  onPress: async (password) => {
                    if (!password) return;
                    
                    const user = auth.currentUser;
                    if (!user || !user.email) return;

                    try {
                      setLoading(true);
                      const credential = EmailAuthProvider.credential(user.email, password);
                      await reauthenticateWithCredential(user, credential);
                      await deleteUser(user);
                      router.replace("/login");
                    } catch (error: any) {
                      Alert.alert("Error", error.message);
                    } finally {
                      setLoading(false);
                    }
                  }
                }
              ],
              "secure-text"
            );
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7F3' }}>
      {/* Sticky Header */}
      <View style={{
        backgroundColor: '#5D688A',
        padding: 20,
        paddingTop: 50,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
      }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
          Settings ⚙️
        </Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 }}>
          Manage your account and preferences
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 120, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadUserInfo}
            colors={["#5D688A"]}
            tintColor="#5D688A"
            progressViewOffset={120}
          />
        }
      >
        {/* Account Information */}
        <View style={{
          backgroundColor: 'white',
          margin: 20,
          marginTop: 10,
          padding: 20,
          borderRadius: 15,
          shadowColor: '#5D688A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#5D688A', marginBottom: 15 }}>
            Account Information
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <MaterialIcons name="email" size={20} color="#896C6C" />
            <Text style={{ marginLeft: 10, fontSize: 16, color: '#666', flex: 1 }}>
              {userInfo.email}
            </Text>
            {userInfo.emailVerified ? (
              <MaterialIcons name="verified" size={20} color="#A8BBA3" />
            ) : (
              <TouchableOpacity onPress={handleSendEmailVerification}>
                <Text style={{ color: '#896C6C', fontWeight: 'bold' }}>Verify</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <MaterialIcons name="person" size={20} color="#896C6C" />
            <Text style={{ marginLeft: 10, fontSize: 16, color: '#666' }}>
              Member since {new Date(userInfo.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="schedule" size={20} color="#896C6C" />
            <Text style={{ marginLeft: 10, fontSize: 16, color: '#666' }}>
              Last login: {new Date(userInfo.lastSignIn).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Security Settings */}
        <View style={{
          backgroundColor: 'white',
          margin: 20,
          marginTop: 0,
          padding: 20,
          borderRadius: 15,
          shadowColor: '#5D688A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#5D688A', marginBottom: 15 }}>
            Security Settings
          </Text>

          {/* Change Password */}
          <TouchableOpacity
            onPress={() => setShowPasswordSection(!showPasswordSection)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#F0F0F0',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="lock" size={20} color="#896C6C" />
              <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '600', color: '#5D688A' }}>
                Change Password
              </Text>
            </View>
            <MaterialIcons 
              name={showPasswordSection ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={24} 
              color="#A8BBA3" 
            />
          </TouchableOpacity>

          {showPasswordSection && (
            <View style={{ paddingTop: 15 }}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 8,
                  backgroundColor: '#F9F9F9',
                }}
                placeholder="Current Password"
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
              />
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 8,
                  backgroundColor: '#F9F9F9',
                }}
                placeholder="New Password (min 6 characters)"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  padding: 12,
                  marginBottom: 15,
                  borderRadius: 8,
                  backgroundColor: '#F9F9F9',
                }}
                placeholder="Confirm New Password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: '#5D688A',
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={handleChangePasswordInApp}
                disabled={loading}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  {loading ? "Updating..." : "Update Password"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Change Email */}
          <TouchableOpacity
            onPress={() => setShowEmailSection(!showEmailSection)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#F0F0F0',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="alternate-email" size={20} color="#896C6C" />
              <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '600', color: '#5D688A' }}>
                Change Email
              </Text>
            </View>
            <MaterialIcons 
              name={showEmailSection ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={24} 
              color="#A8BBA3" 
            />
          </TouchableOpacity>

          {showEmailSection && (
            <View style={{ paddingTop: 15 }}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 8,
                  backgroundColor: '#F9F9F9',
                }}
                placeholder="New Email Address"
                keyboardType="email-address"
                value={newEmail}
                onChangeText={setNewEmail}
              />
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  padding: 12,
                  marginBottom: 15,
                  borderRadius: 8,
                  backgroundColor: '#F9F9F9',
                }}
                placeholder="Current Password"
                secureTextEntry
                value={emailPassword}
                onChangeText={setEmailPassword}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: '#A8BBA3',
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={handleChangeEmail}
                disabled={loading}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  {loading ? "Updating..." : "Update Email"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Password Reset via Email */}
          <TouchableOpacity
            onPress={handleResetPasswordEmail}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15,
            }}
          >
            <MaterialIcons name="mail-outline" size={20} color="#896C6C" />
            <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '600', color: '#5D688A' }}>
              Reset Password via Email
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={{ margin: 20, marginTop: 0 }}>
          {/* Logout Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#896C6C',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 15,
              borderRadius: 12,
              marginBottom: 15,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={24} color="white" />
            <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 }}>
              Logout
            </Text>
          </TouchableOpacity>

          {/* Delete Account Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#DC2626',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 15,
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={handleDeleteAccount}
          >
            <MaterialIcons name="delete-forever" size={24} color="white" />
            <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 }}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}