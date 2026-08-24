// ============================================================
// firebase.js — CoachBoard Firebase initialization & Firestore
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxU2UG4_Ksq-fsA96Vu3Nuw7y6eB5DtHM",
  authDomain: "coachboard-76f5f.firebaseapp.com",
  projectId: "coachboard-76f5f",
  storageBucket: "coachboard-76f5f.firebasestorage.app",
  messagingSenderId: "804520043760",
  appId: "1:804520043760:web:e022bb79304409c4084e35",
  measurementId: "G-H2P69WV7ML"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  doc,
  getDoc,
  setDoc,
  onSnapshot
};
