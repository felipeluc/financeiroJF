// firebase.js
// Inicializa Firebase (apenas Firestore) — exporta db e helpers.
// Usa Firebase modular via CDN (versão 11).
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/*
  Config do Firebase (fornecida por você).
  NÃO remova. Está pronta para usar.
*/
const firebaseConfig = {
  apiKey: "AIzaSyAFyfqpl4rNBE4gIXllX7W66f43RSMaDCg",
  authDomain: "gestaoprojetos-18968.firebaseapp.com",
  projectId: "gestaoprojetos-18968",
  storageBucket: "gestaoprojetos-18968.firebasestorage.app",
  messagingSenderId: "862351920002",
  appId: "1:862351920002:web:97405d73b4804c2cb85d9b"
};

// Inicializa
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exporta helpers que o app.js usará
export { db, doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc, updateDoc };
export default app;
