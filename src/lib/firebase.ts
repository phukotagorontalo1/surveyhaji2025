// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxUzF4YAu1GEqdHtEg_RXPmZ6IBIBPYI8",
  authDomain: "plhut-43c49.firebaseapp.com",
  projectId: "plhut-43c49",
  storageBucket: "plhut-43c49.firebasestorage.app",
  messagingSenderId: "976882934933",
  appId: "1:976882934933:web:806593a93ff6bef193e79c",
  measurementId: "G-55KHCK4E8C"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
