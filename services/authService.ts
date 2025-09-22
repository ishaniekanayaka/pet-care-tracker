// services/authService.ts
import { auth } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  sendEmailVerification,
  reload,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

// Register user
export const register = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Login user
export const login = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Logout user
export const logout = () => {
  return signOut(auth);
};

// Send password reset email
export const sendResetPasswordEmail = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

// Send email verification (OTP alternative for email verification)
export const sendEmailVerificationCode = async () => {
  if (!auth.currentUser) throw new Error("No user logged in");
  return sendEmailVerification(auth.currentUser);
};

// Check if email is verified
export const isEmailVerified = async () => {
  if (!auth.currentUser) return false;
  await reload(auth.currentUser);
  return auth.currentUser.emailVerified;
};

// Re-authenticate user before sensitive operations
export const reauthenticateUser = (currentPassword: string) => {
  if (!auth.currentUser?.email) throw new Error("No user logged in");
  
  const credential = EmailAuthProvider.credential(
    auth.currentUser.email,
    currentPassword
  );
  
  return reauthenticateWithCredential(auth.currentUser, credential);
};

// Update email for logged-in user (with re-authentication)
export const updateUserEmail = async (newEmail: string, currentPassword?: string) => {
  if (!auth.currentUser) throw new Error("No user logged in");
  
  // Re-authenticate if password provided for security
  if (currentPassword) {
    await reauthenticateUser(currentPassword);
  }
  
  return updateEmail(auth.currentUser, newEmail);
};

// Update password for logged-in user (with re-authentication)
export const updateUserPassword = async (newPassword: string, currentPassword?: string) => {
  if (!auth.currentUser) throw new Error("No user logged in");
  
  // Re-authenticate if current password provided for security
  if (currentPassword) {
    await reauthenticateUser(currentPassword);
  }
  
  return updatePassword(auth.currentUser, newPassword);
};

// Refresh user data
export const refreshUserData = async () => {
  if (!auth.currentUser) throw new Error("No user logged in");
  return reload(auth.currentUser);
};