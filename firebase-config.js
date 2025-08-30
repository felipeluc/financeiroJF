// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFyfqpl4rNBE4gIXllX7W66f43RSMaDCg",
  authDomain: "gestaoprojetos-18968.firebaseapp.com",
  projectId: "gestaoprojetos-18968",
  storageBucket: "gestaoprojetos-18968.firebasestorage.app",
  messagingSenderId: "862351920002",
  appId: "1:862351920002:web:97405d73b4804c2cb85d9b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;

