// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2aPw2cADiNyX8i4LdfSKBoGKy3VEcvF4",
  authDomain: "pet-care-tracker-4075a.firebaseapp.com",
  projectId: "pet-care-tracker-4075a",
  storageBucket: "pet-care-tracker-4075a.firebasestorage.app",
  messagingSenderId: "586451624157",
  appId: "1:586451624157:web:768beeb0b895e37f7f7b34",
  measurementId: "G-3GL3SXBHSP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const auth = getAuth(app);

export const db = getFirestore(app);