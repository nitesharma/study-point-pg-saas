import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDCJxiLMgleZqlIPHWsC8fDMvskgY5OXi8",
  authDomain: "serenity-stayz.firebaseapp.com",
  projectId: "serenity-stayz",
  storageBucket: "serenity-stayz.firebasestorage.app",
  messagingSenderId: "967966093412",
  appId: "1:967966093412:web:ff9d2903c39149fd526f71",
  measurementId: "G-WFW86SP7K7"
};

// Check for custom config in localStorage (only in browser)
let firebaseConfig = DEFAULT_FIREBASE_CONFIG;
if (typeof window !== "undefined") {
  const savedConfig = localStorage.getItem("pg_custom_firebase_config");
  if (savedConfig) {
    try {
      firebaseConfig = JSON.parse(savedConfig);
    } catch (e) {
      console.error("Error parsing saved firebase config, using default", e);
    }
  }
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
