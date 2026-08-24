import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyAxU2UG4_Ksq-fsA96Vu3Nuw7y6eB5DtHM",
  authDomain: "coachboard-76f5f.firebaseapp.com",
  projectId: "coachboard-76f5f",
  storageBucket: "coachboard-76f5f.firebasestorage.app",
  messagingSenderId: "804520043760",
  appId: "1:804520043760:web:e022bb79304409c4084e35",
  measurementId: "G-H2P69WV7ML"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let currentUser = null;
let unsubscribeFirestore = null;
let isApplyingCloudUpdate = false;
let cloudSyncTimeout = null;

// ─── Toast Notificaties ──────────────────────────────────────
export function showToast(message, type = "info", duration = 3500) {
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast-item toast-${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
window.showToast = showToast;

// ─── Update UI (Header Login / Profiel) ───────────────────────
function updateAuthUI(user) {
  const loginBtn = document.getElementById("googleLoginBtn");
  const profileWidget = document.getElementById("userProfileWidget");
  const userAvatar = document.getElementById("userAvatar");
  const userName = document.getElementById("userName");

  if (user) {
    if (loginBtn) loginBtn.style.display = "none";
    if (profileWidget) profileWidget.style.display = "flex";
    if (userName) userName.textContent = user.displayName || user.email.split("@")[0];
    if (userAvatar) {
      if (user.photoURL) {
        userAvatar.src = user.photoURL;
        userAvatar.style.display = "inline-block";
      } else {
        userAvatar.style.display = "none";
      }
    }
  } else {
    if (loginBtn) loginBtn.style.display = "inline-flex";
    if (profileWidget) profileWidget.style.display = "none";
  }
}

// ─── Initialiseer Gebruikersdata & Firestore Sync ────────────
async function initUserFirestoreData(user) {
  currentUser = user;
  updateAuthUI(user);

  try {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists() && docSnap.data()?.coachboardState) {
      // 1. Data bestaat al in Firestore -> inladen in CoachBoard
      const cloudState = docSnap.data().coachboardState;
      isApplyingCloudUpdate = true;
      if (typeof window.setCoachBoardState === "function") {
        window.setCoachBoardState(cloudState);
      }
      isApplyingCloudUpdate = false;
      showToast("Data gesynchroniseerd vanuit Firestore!", "success");
    } else {
      // 2. Eerste keer inloggen: zet huidige localStorage data direct over naar Firestore
      const localState = (typeof window.getCoachBoardState === "function") 
        ? window.getCoachBoardState() 
        : null;

      if (localState) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          updatedAt: new Date().toISOString(),
          coachboardState: localState
        }, { merge: true });
        showToast("Lokale data succesvol overgezet naar Firestore! ☁️", "success");
      }
    }

    // 3. Real-time luisteren naar cloud updates
    if (unsubscribeFirestore) unsubscribeFirestore();
    unsubscribeFirestore = onSnapshot(userDocRef, (snapshot) => {
      if (isApplyingCloudUpdate) return;
      if (snapshot.exists() && snapshot.data()?.coachboardState) {
        const cloudState = snapshot.data().coachboardState;
        isApplyingCloudUpdate = true;
        if (typeof window.setCoachBoardState === "function") {
          window.setCoachBoardState(cloudState);
        }
        isApplyingCloudUpdate = false;
      }
    }, (err) => {
      console.warn("Firestore snapshot listener:", err);
    });

  } catch (err) {
    console.error("Fout bij ophalen/migreren Firestore data:", err);
    showToast("Firestore verbinding: controleer Firestore Rules in console", "warning", 5000);
  }
}

// ─── Cloud Sync: Automatisch opslaan naar Firestore ───────────
window.syncStateToCloud = function(state) {
  if (!currentUser || isApplyingCloudUpdate) return;

  clearTimeout(cloudSyncTimeout);
  cloudSyncTimeout = setTimeout(async () => {
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        email: currentUser.email,
        displayName: currentUser.displayName || "",
        updatedAt: new Date().toISOString(),
        coachboardState: state
      }, { merge: true });
    } catch (err) {
      console.error("Fout bij opslaan naar Firestore:", err);
    }
  }, 400); // 400ms debounce
};

// ─── Auth State Listener ─────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    initUserFirestoreData(user);
  } else {
    currentUser = null;
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
      unsubscribeFirestore = null;
    }
    updateAuthUI(null);
  }
});

// ─── Inloggen met Google ──────────────────────────────────────
async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const name = result.user.displayName || result.user.email;
    showToast(`Welkom, ${name}!`, "success");
  } catch (err) {
    if (err.code === "auth/popup-closed-by-user") return;
    if (err.code === "auth/unauthorized-domain") {
      showToast("Domein nog niet geautoriseerd in Firebase Auth", "error", 5000);
      return;
    }
    showToast(`Inloggen mislukt: ${err.message}`, "error");
  }
}

// ─── Uitloggen ───────────────────────────────────────────────
async function handleLogout() {
  try {
    await signOut(auth);
    showToast("Uitgelogd", "info");
  } catch (err) {
    showToast("Uitloggen mislukt", "error");
  }
}

// ─── Event listeners koppelen ─────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("googleLoginBtn")?.addEventListener("click", handleGoogleSignIn);
  document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
});
