// Firebase configuration and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAFyfqpl4rNBE4gIXllX7W66f43RSMaDCg",
  authDomain: "gestaoprojetos-18968.firebaseapp.com",
  projectId: "gestaoprojetos-18968",
  storageBucket: "gestaoprojetos-18968.firebasestorage.app",
  messagingSenderId: "862351920002",
  appId: "1:862351920002:web:97405d73b4804c2cb85d9b"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
