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

// ─── Toast Helper ─────────────────────────────────────────────
export function notifyToast(message, type = "info", duration = 3500) {
  if (typeof window.showToast === "function") {
    window.showToast(message, type, '', duration);
    return;
  }
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

// ─── Update UI (Settings & Badges) ───────────────────────────
function updateAuthUI(user) {
  const userAvatar = document.getElementById("userAvatar");
  const settingsEmail = document.getElementById("settingsEmail");
  const cloudBadge = document.getElementById("cloudStatusBadge");
  const cloudText = document.getElementById("cloudStatusText");

  if (user) {
    if (cloudBadge) {
      cloudBadge.className = "cloud-status-badge online";
      cloudBadge.title = "Status: Online (Firestore Cloud Sync)";
    }
    if (cloudText) cloudText.textContent = "Online (Cloud Sync)";
    if (settingsEmail) settingsEmail.textContent = user.email || user.displayName || "Ingelogd";
    if (userAvatar) {
      if (user.photoURL) {
        userAvatar.src = user.photoURL;
        userAvatar.style.display = "inline-block";
      } else {
        userAvatar.style.display = "none";
      }
    }
  } else {
    if (cloudBadge) {
      cloudBadge.className = "cloud-status-badge offline";
      cloudBadge.title = "Status: Lokaal opgeslagen";
    }
    if (cloudText) cloudText.textContent = "Offline / Lokaal";
    if (userAvatar) userAvatar.style.display = "none";
  }
}

let currentTeamCode = null;
let unsubscribeTeamListener = null;

// ─── Ophalen van teamdata op basis van Teamcode ───────────────
export async function fetchTeamDataByCode(code) {
  if (!code) return null;
  const formattedCode = code.toUpperCase().trim();
  try {
    const teamDocRef = doc(db, "teams", formattedCode);
    const snap = await getDoc(teamDocRef);
    if (snap.exists()) {
      const teamData = snap.data();
      if (teamData?.coachboardState) {
        // Laad in CoachBoard state
        isApplyingCloudUpdate = true;
        if (typeof window.setCoachBoardState === "function") {
          window.setCoachBoardState(teamData.coachboardState);
        }
        isApplyingCloudUpdate = false;
        listenToTeamUpdates(formattedCode);
        return teamData.coachboardState;
      }
    }
  } catch (err) {
    console.warn("Fout bij ophalen team via code:", err);
  }
  return null;
}
window.fetchTeamDataByCode = fetchTeamDataByCode;

// ─── Real-time luisteren naar team updates ────────────────────
function listenToTeamUpdates(teamCode) {
  if (!teamCode || teamCode === currentTeamCode) return;
  currentTeamCode = teamCode;

  if (unsubscribeTeamListener) {
    unsubscribeTeamListener();
    unsubscribeTeamListener = null;
  }

  const teamDocRef = doc(db, "teams", teamCode);
  unsubscribeTeamListener = onSnapshot(teamDocRef, (snapshot) => {
    if (isApplyingCloudUpdate) return;
    if (snapshot.exists()) {
      const snapData = snapshot.data();
      if (snapData?.coachboardState) {
        isApplyingCloudUpdate = true;
        if (typeof window.setCoachBoardState === "function") {
          window.setCoachBoardState(snapData.coachboardState);
        }
        isApplyingCloudUpdate = false;
      }
    }
  }, (err) => {
    console.warn("Team snapshot listener:", err);
  });
}

// ─── Initialiseer Gebruikersdata & Firestore Sync ────────────
async function initUserFirestoreData(user) {
  currentUser = user;
  updateAuthUI(user);

  try {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // 1. Data bestaat al in Firestore -> inladen in CoachBoard state
      if (data?.coachboardState) {
        const cloudState = data.coachboardState;
        isApplyingCloudUpdate = true;
        if (typeof window.setCoachBoardState === "function") {
          window.setCoachBoardState(cloudState);
        }
        isApplyingCloudUpdate = false;
      }

      // 2. Bestaat er al een opgeslagen rol voor deze gebruiker?
      const cloudAuth = data?.authData || (data?.userRole ? {
        loggedIn: true,
        email: user.email || user.displayName || 'Ingelogd',
        role: data.userRole,
        teamCode: data.teamCode || null,
        playerId: data.playerId || null
      } : null);

      if (cloudAuth && cloudAuth.role && (cloudAuth.role === 'coach' || (cloudAuth.role === 'player' && cloudAuth.playerId))) {
        cloudAuth.loggedIn = true;
        cloudAuth.email = user.email || user.displayName || cloudAuth.email;
        if (typeof window.setCoachBoardAuth === "function") {
          window.setCoachBoardAuth(cloudAuth);
        }
        if (cloudAuth.teamCode) {
          listenToTeamUpdates(cloudAuth.teamCode);
        }
        notifyToast(`Welkom terug, ${user.displayName || user.email || ''}!`, "success");
      } else {
        if (typeof window.onFirebaseAuthNeedsRole === "function") {
          window.onFirebaseAuthNeedsRole(user);
        }
      }
    } else {
      const localState = (typeof window.getCoachBoardState === "function") 
        ? window.getCoachBoardState() 
        : null;
      const localAuth = (typeof window.getCoachBoardAuth === "function")
        ? window.getCoachBoardAuth()
        : null;

      await setDoc(userDocRef, {
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        updatedAt: new Date().toISOString(),
        coachboardState: localState || {},
        authData: (localAuth && localAuth.role) ? localAuth : { loggedIn: true, email: user.email, role: null, teamCode: null }
      }, { merge: true });

      if (localAuth && localAuth.role && (localAuth.role === 'coach' || (localAuth.role === 'player' && localAuth.playerId))) {
        if (typeof window.setCoachBoardAuth === "function") {
          window.setCoachBoardAuth(localAuth);
        }
        if (localAuth.teamCode) {
          listenToTeamUpdates(localAuth.teamCode);
        }
      } else {
        if (typeof window.onFirebaseAuthNeedsRole === "function") {
          window.onFirebaseAuthNeedsRole(user);
        }
      }
    }

    // 3. Real-time luisteren naar cloud updates van de gebruiker
    if (unsubscribeFirestore) unsubscribeFirestore();
    unsubscribeFirestore = onSnapshot(userDocRef, (snapshot) => {
      if (isApplyingCloudUpdate) return;
      if (snapshot.exists()) {
        const snapData = snapshot.data();
        if (snapData?.coachboardState) {
          const cloudState = snapData.coachboardState;
          isApplyingCloudUpdate = true;
          if (typeof window.setCoachBoardState === "function") {
            window.setCoachBoardState(cloudState);
          }
          isApplyingCloudUpdate = false;
        }
      }
    }, (err) => {
      console.warn("Firestore snapshot listener:", err);
    });

  } catch (err) {
    console.error("Fout bij ophalen/migreren Firestore data:", err);
    notifyToast("Firestore verbinding: controleer Firestore Rules", "warning", 4500);
  }
}

// ─── Cloud Sync: Automatisch opslaan van app state naar Firestore (onder User én Team!) ───
window.syncStateToCloud = function(state) {
  if (isApplyingCloudUpdate) return;

  clearTimeout(cloudSyncTimeout);
  cloudSyncTimeout = setTimeout(async () => {
    try {
      const authData = (typeof window.getCoachBoardAuth === "function") ? window.getCoachBoardAuth() : null;
      const teamCode = (authData?.teamCode || state?.teamCode || "").toUpperCase().trim();

      // 1. Sla op onder /teams/{teamCode} zodat spelers en coaches direct synchroniseren!
      if (teamCode) {
        const teamDocRef = doc(db, "teams", teamCode);
        await setDoc(teamDocRef, {
          teamCode: teamCode,
          teamName: state.teamName || "Mijn Team",
          updatedAt: new Date().toISOString(),
          coachboardState: state
        }, { merge: true });
        listenToTeamUpdates(teamCode);
      }

      // 2. Sla op onder /users/{uid} als de gebruiker ingelogd is met Google/e-mail
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, {
          email: currentUser.email || "",
          displayName: currentUser.displayName || "",
          updatedAt: new Date().toISOString(),
          coachboardState: state
        }, { merge: true });
      }
    } catch (err) {
      console.error("Fout bij opslaan naar Firestore:", err);
    }
  }, 400); // 400ms debounce
};

// ─── Cloud Sync: Opslaan van gekozen rol en profiel naar Firestore ───
window.syncAuthToCloud = function(authData) {
  const teamCode = (authData?.teamCode || "").toUpperCase().trim();
  if (teamCode) {
    listenToTeamUpdates(teamCode);
  }

  if (!currentUser) return;
  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    setDoc(userDocRef, {
      authData: authData,
      userRole: authData?.role || null,
      teamCode: authData?.teamCode || null,
      playerId: authData?.playerId || null,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Fout bij opslaan auth naar Firestore:", err);
  }
};

// ─── Handmatige Sync Knop ────────────────────────────────────
async function handleManualSync() {
  if (!currentUser) {
    notifyToast("Log eerst in om naar de cloud te synchroniseren.", "warning");
    return;
  }
  const localState = typeof window.getCoachBoardState === "function" ? window.getCoachBoardState() : null;
  const localAuth = typeof window.getCoachBoardAuth === "function" ? window.getCoachBoardAuth() : null;
  if (!localState) return;

  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    await setDoc(userDocRef, {
      email: currentUser.email || "",
      displayName: currentUser.displayName || "",
      updatedAt: new Date().toISOString(),
      coachboardState: localState,
      authData: localAuth
    }, { merge: true });
    notifyToast("Data succesvol gesynchroniseerd met Firestore! ☁️", "success");
  } catch (err) {
    notifyToast("Synchronisatie mislukt: " + err.message, "error");
  }
}

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

// ─── Inloggen met Google OAuth ────────────────────────────────
export async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const name = user.displayName || user.email;
    notifyToast(`Ingelogd als ${name}`, "success");
  } catch (err) {
    if (err.code === "auth/popup-closed-by-user") return;
    if (err.code === "auth/unauthorized-domain") {
      notifyToast("Domein nog niet geautoriseerd in Firebase Auth", "error", 5000);
      return;
    }
    notifyToast(`Google login mislukt: ${err.message}`, "error");
  }
}
window.handleGoogleSignIn = handleGoogleSignIn;

// ─── Uitloggen ───────────────────────────────────────────────
export async function handleFirebaseLogout() {
  try {
    await signOut(auth);
    notifyToast("Uitgelogd", "info");
  } catch (err) {
    notifyToast("Uitloggen mislukt", "error");
  }
}
window.handleFirebaseLogout = handleFirebaseLogout;

// ─── Event listeners koppelen ─────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const loginGoogleBtn = document.getElementById("googleLoginBtn");
  const manualSyncBtn = document.getElementById("manualSyncBtn");

  loginGoogleBtn?.addEventListener("click", handleGoogleSignIn);
  manualSyncBtn?.addEventListener("click", handleManualSync);

  // ─── Herstel speler-sessie zonder Google-login ─────────────
  // Als een speler eerder zijn teamCode en playerId heeft opgeslagen in
  // localStorage, herstel dan de live Firestore-listener direct bij
  // het laden van de pagina (geen Google-login nodig!).
  try {
    const AUTH_KEY = "coachboard_v1_auth";
    const savedAuth = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    if (savedAuth?.role === "player" && savedAuth?.teamCode && savedAuth?.playerId) {
      const code = savedAuth.teamCode.toUpperCase().trim();
      // Start luisteren naar team updates zodat speler live data krijgt
      listenToTeamUpdates(code);
      // Laad de team data direct in
      fetchTeamDataByCode(code).catch(() => {});
    }
  } catch (e) {
    // Geen opgeslagen sessie, negeer
  }
});
