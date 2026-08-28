import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ─── Firebase configuratie ────────────────────────────────────
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
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

let currentUser = null;
let unsubscribeFirestore = null;
let unsubscribeTeamListener = null;
let unsubscribePlayersListener = null;
let isApplyingCloudUpdate = false;
let cloudSyncTimeout = null;
let currentTeamCode = null;

// ─── Toast Helper ─────────────────────────────────────────────
export function notifyToast(message, type = "info", duration = 3500) {
  if (typeof window.showToast === "function") {
    window.showToast(message, type, "", duration);
    return;
  }
  let el = document.getElementById("toastContainer");
  if (!el) {
    el = document.createElement("div");
    el.id = "toastContainer";
    el.className = "toast-container";
    document.body.appendChild(el);
  }
  const toast = document.createElement("div");
  toast.className = `toast-item toast-${type}`;
  toast.textContent = message;
  el.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── Update UI (Settings & Badges) ────────────────────────────
function updateAuthUI(user) {
  const userAvatar = document.getElementById("userAvatar");
  const settingsEmail = document.getElementById("settingsEmail");
  const cloudBadge = document.getElementById("cloudStatusBadge");
  const cloudText = document.getElementById("cloudStatusText");

  if (user && !user.isAnonymous) {
    if (cloudBadge) { cloudBadge.className = "cloud-status-badge online"; cloudBadge.title = "Online (Firestore Cloud Sync)"; }
    if (cloudText) cloudText.textContent = "Online (Cloud Sync)";
    if (settingsEmail) settingsEmail.textContent = user.email || user.displayName || "Ingelogd";
    if (userAvatar) {
      if (user.photoURL) { userAvatar.src = user.photoURL; userAvatar.style.display = "inline-block"; }
      else userAvatar.style.display = "none";
    }
  } else {
    if (cloudBadge) { cloudBadge.className = "cloud-status-badge offline"; cloudBadge.title = "Lokaal opgeslagen"; }
    if (cloudText) cloudText.textContent = user?.isAnonymous ? "Speler (anoniem)" : "Offline / Lokaal";
    if (userAvatar) userAvatar.style.display = "none";
  }
}

// ─── Anoniem inloggen voor spelers (geen Gmail nodig) ─────────
export async function signInPlayerAnonymously() {
  if (auth.currentUser) return auth.currentUser;
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (err) {
    console.warn("Anoniem inloggen mislukt:", err);
    return null;
  }
}
window.signInPlayerAnonymously = signInPlayerAnonymously;

// ─── Ophalen teamdata via teamcode (coach-state + spelers) ────
export async function fetchTeamDataByCode(code) {
  if (!code) return null;
  const tc = code.toUpperCase().trim();
  try {
    const teamDocRef = doc(db, "teams", tc);
    const snap = await getDoc(teamDocRef);
    if (!snap.exists()) return null;

    const teamData = snap.data();

    // Haal de coach-state op (wedstrijden, opstellingen, spelersdefinities)
    const coachState = teamData.coachboardState || teamData.coachState || null;
    if (!coachState) return null;

    // Haal speler-subcollectie op voor actuele beschikbaarheid
    const playersSnap = await getDocs(collection(db, "teams", tc, "players"));
    playersSnap.forEach(playerDoc => {
      const pData = playerDoc.data();
      const pid = playerDoc.id;
      const player = (coachState.players || []).find(p => p.id === pid);
      if (player && pData.availability) {
        // Merge speler-eigen beschikbaarheidsvoorkeur
        player.preferredAvailability = pData.preferredAvailability || player.preferredAvailability;
      }
      // Merge per-wedstrijd beschikbaarheid
      if (player && pData.matchAvailability) {
        Object.entries(pData.matchAvailability).forEach(([matchId, status]) => {
          const match = (coachState.matches || []).find(m => m.id === matchId);
          if (match) {
            if (!match.availability) match.availability = {};
            match.availability[pid] = status;
          }
        });
      }
    });

    // Laad state in
    isApplyingCloudUpdate = true;
    if (typeof window.setCoachBoardState === "function") {
      window.setCoachBoardState(coachState);
    }
    isApplyingCloudUpdate = false;

    listenToTeamUpdates(tc);
    return coachState;
  } catch (err) {
    console.warn("Fout bij ophalen team via code:", err);
    return null;
  }
}
window.fetchTeamDataByCode = fetchTeamDataByCode;

// ─── Live luisteren naar team én speler updates ───────────────
function listenToTeamUpdates(teamCode) {
  if (!teamCode || teamCode === currentTeamCode) return;
  currentTeamCode = teamCode;

  // Stop oude listeners
  if (unsubscribeTeamListener) { unsubscribeTeamListener(); unsubscribeTeamListener = null; }
  if (unsubscribePlayersListener) { unsubscribePlayersListener(); unsubscribePlayersListener = null; }

  // 1. Luister naar coach-state updates (wedstrijden, opstellingen)
  const teamDocRef = doc(db, "teams", teamCode);
  unsubscribeTeamListener = onSnapshot(teamDocRef, (snapshot) => {
    if (isApplyingCloudUpdate) return;
    if (!snapshot.exists()) return;
    const snapData = snapshot.data();
    const coachState = snapData.coachboardState || snapData.coachState;
    if (!coachState) return;

    isApplyingCloudUpdate = true;
    if (typeof window.setCoachBoardState === "function") {
      window.setCoachBoardState(coachState);
    }
    isApplyingCloudUpdate = false;
  }, err => console.warn("Team snapshot:", err));

  // 2. Luister naar speler beschikbaarheid updates (live)
  const playersColRef = collection(db, "teams", teamCode, "players");
  unsubscribePlayersListener = onSnapshot(playersColRef, (snapshot) => {
    if (isApplyingCloudUpdate) return;
    snapshot.docChanges().forEach(change => {
      if (change.type === "removed") return;
      const pData = change.doc.data();
      const pid = change.doc.id;
      if (typeof window.mergePlayerUpdate === "function") {
        window.mergePlayerUpdate(pid, pData);
      }
    });
  }, err => console.warn("Players snapshot:", err));
}

// ─── Initialiseer coach-sessie via Google Auth ────────────────
async function initUserFirestoreData(user) {
  currentUser = user;
  updateAuthUI(user);

  if (user.isAnonymous) {
    // Anonieme speler — geen user-document aanmaken; sessie loopt via team
    return;
  }

  try {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data?.coachboardState) {
        isApplyingCloudUpdate = true;
        if (typeof window.setCoachBoardState === "function") window.setCoachBoardState(data.coachboardState);
        isApplyingCloudUpdate = false;
      }
      const cloudAuth = data?.authData || (data?.userRole ? {
        loggedIn: true,
        email: user.email || "",
        role: data.userRole,
        teamCode: data.teamCode || null,
        playerId: data.playerId || null
      } : null);

      if (cloudAuth?.role === "coach" || (cloudAuth?.role === "player" && cloudAuth?.playerId)) {
        cloudAuth.loggedIn = true;
        cloudAuth.email = user.email || user.displayName || cloudAuth.email;
        if (typeof window.setCoachBoardAuth === "function") window.setCoachBoardAuth(cloudAuth);
        if (cloudAuth.teamCode) listenToTeamUpdates(cloudAuth.teamCode);
        notifyToast(`Welkom terug, ${user.displayName || user.email || ""}!`, "success");
      } else {
        if (typeof window.onFirebaseAuthNeedsRole === "function") window.onFirebaseAuthNeedsRole(user);
      }
    } else {
      const localState = typeof window.getCoachBoardState === "function" ? window.getCoachBoardState() : null;
      const localAuth = typeof window.getCoachBoardAuth === "function" ? window.getCoachBoardAuth() : null;
      await setDoc(userDocRef, {
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        updatedAt: new Date().toISOString(),
        coachboardState: localState || {},
        authData: (localAuth?.role) ? localAuth : { loggedIn: true, email: user.email, role: null, teamCode: null }
      }, { merge: true });

      if (localAuth?.role === "coach" || (localAuth?.role === "player" && localAuth?.playerId)) {
        if (typeof window.setCoachBoardAuth === "function") window.setCoachBoardAuth(localAuth);
        if (localAuth.teamCode) listenToTeamUpdates(localAuth.teamCode);
      } else {
        if (typeof window.onFirebaseAuthNeedsRole === "function") window.onFirebaseAuthNeedsRole(user);
      }
    }

    // Real-time listener op user-document
    if (unsubscribeFirestore) unsubscribeFirestore();
    unsubscribeFirestore = onSnapshot(userDocRef, (snapshot) => {
      if (isApplyingCloudUpdate) return;
      if (!snapshot.exists()) return;
      const snapData = snapshot.data();
      if (snapData?.coachboardState) {
        isApplyingCloudUpdate = true;
        if (typeof window.setCoachBoardState === "function") window.setCoachBoardState(snapData.coachboardState);
        isApplyingCloudUpdate = false;
      }
    }, err => console.warn("User snapshot:", err));

  } catch (err) {
    console.error("Fout bij Firestore initialisatie:", err);
    notifyToast("Firestore verbinding: controleer Firestore Rules", "warning", 4500);
  }
}

// ─── Coach: sla volledige state op + Speler: sla eigen data op ─
window.syncStateToCloud = function(state) {
  if (isApplyingCloudUpdate) return;
  clearTimeout(cloudSyncTimeout);
  cloudSyncTimeout = setTimeout(async () => {
    try {
      const authData = typeof window.getCoachBoardAuth === "function" ? window.getCoachBoardAuth() : null;
      const teamCode = (authData?.teamCode || state?.teamCode || "").toUpperCase().trim();

      if (authData?.role === "player" && authData?.playerId && teamCode) {
        // ── SPELER: schrijf alleen eigen beschikbaarheid naar player-subcollectie ──
        const playerId = authData.playerId;
        const firebaseUid = auth.currentUser?.uid || null;

        // Bouw matchAvailability object: {matchId: status}
        const matchAvailability = {};
        (state.matches || []).forEach(m => {
          if (m.availability && m.availability[playerId] !== undefined) {
            matchAvailability[m.id] = m.availability[playerId];
          }
        });

        const playerObj = (state.players || []).find(p => p.id === playerId);
        const playerDocRef = doc(db, "teams", teamCode, "players", playerId);
        await setDoc(playerDocRef, {
          playerId,
          firebaseUid,
          name: playerObj?.name || "",
          preferredAvailability: playerObj?.preferredAvailability || "fit",
          matchAvailability,
          updatedAt: new Date().toISOString()
        }, { merge: true });

      } else if (teamCode) {
        // ── COACH: schrijf volledige state naar /teams/{teamCode} ──
        const teamDocRef = doc(db, "teams", teamCode);
        await setDoc(teamDocRef, {
          teamCode,
          teamName: state.teamName || "Mijn Team",
          updatedAt: new Date().toISOString(),
          coachboardState: state
        }, { merge: true });
        listenToTeamUpdates(teamCode);

        // Sla ook op in user-document (voor coach-herstel na login)
        if (currentUser && !currentUser.isAnonymous) {
          const userDocRef = doc(db, "users", currentUser.uid);
          await setDoc(userDocRef, {
            email: currentUser.email || "",
            displayName: currentUser.displayName || "",
            updatedAt: new Date().toISOString(),
            coachboardState: state
          }, { merge: true });
        }
      }
    } catch (err) {
      console.error("Fout bij opslaan naar Firestore:", err);
    }
  }, 400);
};

// ─── Sync auth-data (rol + teamcode + playerId) naar Firestore ─
window.syncAuthToCloud = function(authData) {
  const teamCode = (authData?.teamCode || "").toUpperCase().trim();
  if (teamCode) listenToTeamUpdates(teamCode);
  if (!currentUser || currentUser.isAnonymous) return;
  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    setDoc(userDocRef, {
      authData,
      userRole: authData?.role || null,
      teamCode: authData?.teamCode || null,
      playerId: authData?.playerId || null,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Fout bij opslaan auth:", err);
  }
};

// ─── Sla firebaseUid op in het player-document bij eerste koppeling ─
window.linkPlayerToFirebase = async function(teamCode, playerId) {
  if (!auth.currentUser) return;
  const tc = teamCode.toUpperCase().trim();
  try {
    const playerDocRef = doc(db, "teams", tc, "players", playerId);
    await setDoc(playerDocRef, {
      playerId,
      firebaseUid: auth.currentUser.uid,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Fout bij koppelen player aan Firebase uid:", err);
  }
};

// ─── Handmatige sync knop ─────────────────────────────────────
async function handleManualSync() {
  if (!currentUser || currentUser.isAnonymous) {
    notifyToast("Log eerst in als coach om te synchroniseren.", "warning");
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
    notifyToast("Data gesynchroniseerd met Firestore! ☁️", "success");
  } catch (err) {
    notifyToast("Synchronisatie mislukt: " + err.message, "error");
  }
}

// ─── Auth State Listener ──────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    initUserFirestoreData(user);
  } else {
    currentUser = null;
    if (unsubscribeFirestore) { unsubscribeFirestore(); unsubscribeFirestore = null; }
    updateAuthUI(null);
  }
});

// ─── Google OAuth ─────────────────────────────────────────────
export async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    notifyToast(`Ingelogd als ${result.user.displayName || result.user.email}`, "success");
  } catch (err) {
    if (err.code === "auth/popup-closed-by-user") return;
    if (err.code === "auth/unauthorized-domain") {
      notifyToast("Domein niet geautoriseerd in Firebase Auth", "error", 5000);
      return;
    }
    notifyToast(`Google login mislukt: ${err.message}`, "error");
  }
}
window.handleGoogleSignIn = handleGoogleSignIn;

// ─── Uitloggen ────────────────────────────────────────────────
export async function handleFirebaseLogout() {
  try {
    await signOut(auth);
    notifyToast("Uitgelogd", "info");
  } catch (err) {
    notifyToast("Uitloggen mislukt", "error");
  }
}
window.handleFirebaseLogout = handleFirebaseLogout;

// ─── DOMContentLoaded: herstel sessies & koppel knoppen ──────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("googleLoginBtn")?.addEventListener("click", handleGoogleSignIn);
  document.getElementById("manualSyncBtn")?.addEventListener("click", handleManualSync);

  // Herstel speler-sessie: anoniem inloggen + live team listener
  try {
    const AUTH_KEY = "coachboard_v1_auth";
    const savedAuth = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    if (savedAuth?.role === "player" && savedAuth?.teamCode && savedAuth?.playerId) {
      const code = savedAuth.teamCode.toUpperCase().trim();
      // Log anoniem in zodat Firestore-regels werken, start daarna live listener
      signInPlayerAnonymously().then(() => {
        listenToTeamUpdates(code);
        fetchTeamDataByCode(code).catch(() => {});
      });
    }
  } catch (e) {
    // Geen opgeslagen sessie
  }
});
