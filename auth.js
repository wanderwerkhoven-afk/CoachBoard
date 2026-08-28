import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  updateDoc,
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
let unsubscribeNotificationsListener = null;
let isApplyingCloudUpdate = false;
let cloudSyncTimeout = null;
let currentTeamCode = null;
let currentPendingInvite = null; // Als de gebruiker via ?invite=... binnenkomt
const shownNotificationIds = new Set(); // Bijhouden welke coach-notificaties al getoond zijn

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

  if (user) {
    if (cloudBadge) { cloudBadge.className = "cloud-status-badge online"; cloudBadge.title = "Online (Verbonden met cloud)"; }
    if (cloudText) cloudText.textContent = "Online";
    if (settingsEmail) settingsEmail.textContent = user.email || user.displayName || "Ingelogd";
    if (userAvatar) {
      if (user.photoURL) { userAvatar.src = user.photoURL; userAvatar.style.display = "inline-block"; }
      else userAvatar.style.display = "none";
    }
  } else {
    if (cloudBadge) { cloudBadge.className = "cloud-status-badge offline"; cloudBadge.title = "Offline (Lokaal)"; }
    if (cloudText) cloudText.textContent = "Offline";
    if (userAvatar) userAvatar.style.display = "none";
  }
}

// ─── 1. Invite Management (Coach Genereert Unieke Link) ────────
window.createPlayerInvite = async function(playerId, playerName) {
  const state = (typeof window.getCoachBoardState === "function") ? window.getCoachBoardState() : null;
  const teamCode = (state?.teamCode || "TEAM").toUpperCase().trim();
  const teamName = state?.teamName || "Mijn Team";

  // Genereer veilige willekeurige token
  const token = `${playerId}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  
  try {
    const inviteDocRef = doc(db, "invites", token);
    await setDoc(inviteDocRef, {
      token,
      teamCode,
      playerId,
      playerName,
      teamName,
      linkedUid: null,
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser?.uid || null
    });

    // Sla ook de token op in het spelersobject in de lokale state zodat de coach weet dat er een link is
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      player.lastInviteToken = token;
      if (typeof window.saveCoachBoardStateDirect === "function") {
        window.saveCoachBoardStateDirect();
      }
    }

    const currentUrl = window.location.origin + window.location.pathname;
    const inviteUrl = `${currentUrl}?invite=${token}`;
    return inviteUrl;
  } catch (err) {
    console.error("Fout bij aanmaken uitnodiging:", err);
    throw err;
  }
};

// ─── 2. Invite Resolver (Speler Opent Link) ───────────────────
async function checkInviteFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const inviteToken = params.get("invite");
  if (!inviteToken) return;

  try {
    const inviteDocRef = doc(db, "invites", inviteToken);
    const snap = await getDoc(inviteDocRef);

    if (!snap.exists()) {
      notifyToast("Deze uitnodigingslink is niet geldig of verlopen.", "warning", 5000);
      return;
    }

    const inviteData = snap.data();
    currentPendingInvite = inviteData;

    // Toon welkomstpagina
    const shell = document.getElementById("authShell");
    if (shell) shell.hidden = false;

    // Verberg alle stappen, open #inviteStep
    ["loginStep", "registerStep", "roleStep", "playerCodeStep"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });

    const inviteStep = document.getElementById("inviteStep");
    if (inviteStep) {
      inviteStep.hidden = false;
      document.getElementById("inviteWelcomeTitle").textContent = `Welkom ${inviteData.playerName}! 👋`;
      document.getElementById("inviteWelcomeSubtitle").textContent = `Je coach wil je toevoegen aan team "${inviteData.teamName}". Maak een account aan of log in om te koppelen.`;
      document.getElementById("inviteTeamName").textContent = inviteData.teamName;
      document.getElementById("invitePlayerName").textContent = inviteData.playerName;
    }
  } catch (err) {
    console.warn("Fout bij ophalen uitnodiging:", err);
  }
}

// ─── 3. Account Koppelen aan Speler via Invite ────────────────
async function linkAccountToInvite(user) {
  if (!currentPendingInvite) return false;

  const { teamCode, playerId, playerName, token } = currentPendingInvite;

  try {
    // 1. Markeer invite als gebruikt
    const inviteDocRef = doc(db, "invites", token);
    await updateDoc(inviteDocRef, {
      linkedUid: user.uid,
      linkedEmail: user.email || user.displayName || "",
      claimedAt: new Date().toISOString()
    }).catch(async () => {
      await setDoc(inviteDocRef, { linkedUid: user.uid }, { merge: true });
    });

    // 2. Koppel in /teams/{teamCode}/players/{playerId}
    const playerDocRef = doc(db, "teams", teamCode, "players", playerId);
    await setDoc(playerDocRef, {
      playerId,
      firebaseUid: user.uid,
      name: playerName,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 3. Sla gebruikersprofiel op in /users/{uid}
    const userDocRef = doc(db, "users", user.uid);
    const authData = {
      loggedIn: true,
      email: user.email || user.displayName || playerName,
      role: "player",
      teamCode,
      playerId
    };

    await setDoc(userDocRef, {
      email: user.email || "",
      displayName: user.displayName || playerName,
      authData,
      userRole: "player",
      teamCode,
      playerId,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 4. Update lokale app auth & state
    if (typeof window.setCoachBoardAuth === "function") {
      window.setCoachBoardAuth(authData);
    }

    // 5. Laad teamdata direct in
    await fetchTeamDataByCode(teamCode);

    // Ruim URL parameter op
    window.history.replaceState({}, document.title, window.location.pathname);
    currentPendingInvite = null;

    notifyToast(`Gekoppeld aan team ${teamCode} als ${playerName}!`, "success");
    return true;
  } catch (err) {
    console.error("Fout bij koppelen account:", err);
    notifyToast("Koppelen mislukt: " + err.message, "error");
    return false;
  }
}

// ─── 4. Ophalen Teamdata via Teamcode ─────────────────────────
export async function fetchTeamDataByCode(code) {
  if (!code) return null;
  const tc = code.toUpperCase().trim();
  try {
    const teamDocRef = doc(db, "teams", tc);
    const snap = await getDoc(teamDocRef);
    if (!snap.exists()) return null;

    const teamData = snap.data();
    const coachState = teamData.coachboardState || teamData.coachState || null;
    if (!coachState) return null;

    // Haal speler-subcollectie op voor actuele statussen
    const playersSnap = await getDocs(collection(db, "teams", tc, "players"));
    playersSnap.forEach(playerDoc => {
      const pData = playerDoc.data();
      const pid = playerDoc.id;
      const player = (coachState.players || []).find(p => p.id === pid);
      if (player) {
        if (pData.name) player.name = pData.name;
        if (pData.preferredAvailability) player.preferredAvailability = pData.preferredAvailability;
        if (pData.firebaseUid) player.firebaseUid = pData.firebaseUid;
      }
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

    isApplyingCloudUpdate = true;
    if (typeof window.setCoachBoardState === "function") {
      window.setCoachBoardState(coachState);
    }
    isApplyingCloudUpdate = false;

    listenToTeamUpdates(tc);
    return coachState;
  } catch (err) {
    console.warn("Fout bij ophalen team:", err);
    return null;
  }
}
window.fetchTeamDataByCode = fetchTeamDataByCode;

// ─── 5. Realtime Luisteren naar Team & Spelers ────────────────
function listenToTeamUpdates(teamCode) {
  if (!teamCode || teamCode === currentTeamCode) return;
  currentTeamCode = teamCode;

  if (unsubscribeTeamListener) {
    unsubscribeTeamListener();
    unsubscribeTeamListener = null;
  }
  if (unsubscribePlayersListener) {
    unsubscribePlayersListener();
    unsubscribePlayersListener = null;
  }
  if (unsubscribeNotificationsListener) {
    unsubscribeNotificationsListener();
    unsubscribeNotificationsListener = null;
  }

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
  }, err => console.warn("Team listener snapshot:", err));

  // 2. Luister direct naar speler-beschikbaarheid wijzigingen (live realtime)
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
  }, err => console.warn("Players listener snapshot:", err));

  // 3. Luister naar coach-notificaties (last-minute afwezigheid e.d.)
  const notifColRef = collection(db, "teams", teamCode, "notifications");
  unsubscribeNotificationsListener = onSnapshot(notifColRef, (snapshot) => {
    const authData = typeof window.getCoachBoardAuth === "function" ? window.getCoachBoardAuth() : null;
    if (authData?.role !== "coach") return; // Alleen coach ontvangt notificaties
    snapshot.docChanges().forEach(change => {
      if (change.type !== "added" && change.type !== "modified") return;
      const notif = change.doc.data();
      const notifId = change.doc.id;
      if (shownNotificationIds.has(notifId)) return;
      shownNotificationIds.add(notifId);
      // Toon de coach-melding
      if (notif.type === "last_minute_absence") {
        const matchDate = notif.matchDate || "";
        const formattedDate = matchDate
          ? matchDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3-$2-$1")
          : "onbekende datum";
        const msg = `⚠️ ${notif.playerName} heeft zijn beschikbaarheid voor ${notif.matchOpponent} (${formattedDate}) gewijzigd naar "Afwezig".`;
        notifyToast(msg, "warning", 8000);
      }
    });
  }, err => console.warn("Notifications listener:", err));
}

// ─── 5b. Schrijf last-minute afwezigheidsmelding naar Firestore ────
window.writeLastMinuteAbsenceNotification = async function({ teamCode, playerId, playerName, matchId, matchOpponent, matchDate, previousStatus }) {
  if (!teamCode || !playerId || !matchId) return;
  try {
    const notifId = `lm_${playerId}_${matchId}`;
    const notifRef = doc(db, "teams", teamCode.toUpperCase().trim(), "notifications", notifId);
    await setDoc(notifRef, {
      type: "last_minute_absence",
      playerId,
      playerName,
      matchId,
      matchOpponent,
      matchDate,
      previousStatus,
      newStatus: "absent",
      timestamp: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn("writeLastMinuteAbsenceNotification fout:", err);
  }
};


// ─── 6. Initialiseer Gebruiker na Login ───────────────────────
async function initUserFirestoreData(user) {
  currentUser = user;
  updateAuthUI(user);

  // Als de gebruiker via een uitnodiging binnenkwam, koppel direct!
  if (currentPendingInvite) {
    const linked = await linkAccountToInvite(user);
    if (linked) return;
  }

  try {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // 1. Data inladen als coach
      if (data?.coachboardState) {
        isApplyingCloudUpdate = true;
        if (typeof window.setCoachBoardState === "function") window.setCoachBoardState(data.coachboardState);
        isApplyingCloudUpdate = false;
      }

      // 2. Rol en teamcode herstellen
      const cloudAuth = data?.authData || (data?.userRole ? {
        loggedIn: true,
        email: user.email || user.displayName || "Ingelogd",
        role: data.userRole,
        teamCode: data.teamCode || null,
        playerId: data.playerId || null
      } : null);

      if (cloudAuth?.role === "coach" || (cloudAuth?.role === "player" && cloudAuth?.playerId)) {
        cloudAuth.loggedIn = true;
        cloudAuth.email = user.email || user.displayName || cloudAuth.email;
        if (typeof window.setCoachBoardAuth === "function") window.setCoachBoardAuth(cloudAuth);
        if (cloudAuth.teamCode) {
          fetchTeamDataByCode(cloudAuth.teamCode);
        }
        notifyToast(`Welkom terug, ${user.displayName || user.email || ""}!`, "success");
      } else {
        if (typeof window.onFirebaseAuthNeedsRole === "function") window.onFirebaseAuthNeedsRole(user);
      }
    } else {
      // Eerste login (als Coach)
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
        if (localAuth.teamCode) fetchTeamDataByCode(localAuth.teamCode);
      } else {
        if (typeof window.onFirebaseAuthNeedsRole === "function") window.onFirebaseAuthNeedsRole(user);
      }
    }

    // Luister naar wijzigingen in het user doc
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
    }, err => console.warn("User listener:", err));

  } catch (err) {
    console.error("Fout bij Firestore initialisatie:", err);
  }
}

// ─── 7. Cloud Sync: Automatisch Opslaan ────────────────────────
window.syncStateToCloud = function(state) {
  if (isApplyingCloudUpdate) return;
  clearTimeout(cloudSyncTimeout);
  cloudSyncTimeout = setTimeout(async () => {
    try {
      const authData = typeof window.getCoachBoardAuth === "function" ? window.getCoachBoardAuth() : null;
      const teamCode = (authData?.teamCode || state?.teamCode || "").toUpperCase().trim();

      if (authData?.role === "player" && authData?.playerId && teamCode) {
        // Speler slaat eigen beschikbaarheid & naam op
        const pid = authData.playerId;
        const playerObj = (state.players || []).find(p => p.id === pid);
        const matchAvailability = {};
        (state.matches || []).forEach(m => {
          if (m.availability && m.availability[pid] !== undefined) {
            matchAvailability[m.id] = m.availability[pid];
          }
        });

        const playerDocRef = doc(db, "teams", teamCode, "players", pid);
        await setDoc(playerDocRef, {
          playerId: pid,
          firebaseUid: currentUser?.uid || null,
          name: playerObj?.name || "",
          preferredAvailability: playerObj?.preferredAvailability || "fit",
          matchAvailability,
          updatedAt: new Date().toISOString()
        }, { merge: true });

      } else if (teamCode) {
        // Coach slaat hele teamdata op.
        // Zet de vlag vóór het schrijven zodat de echo-onSnapshot wordt onderdrukt.
        isApplyingCloudUpdate = true;
        try {
          const teamDocRef = doc(db, "teams", teamCode);
          await setDoc(teamDocRef, {
            teamCode,
            teamName: state.teamName || "Mijn Team",
            updatedAt: new Date().toISOString(),
            coachboardState: state
          }, { merge: true });

          if (currentUser) {
            const userDocRef = doc(db, "users", currentUser.uid);
            await setDoc(userDocRef, {
              email: currentUser.email || "",
              displayName: currentUser.displayName || "",
              updatedAt: new Date().toISOString(),
              coachboardState: state
            }, { merge: true });
          }
        } finally {
          // Korte pauze zodat de Firestore echo-snapshot wordt afgeleverd en onderdrukt
          // voordat we de vlag terugzetten.
          setTimeout(() => { isApplyingCloudUpdate = false; }, 800);
        }
      }
    } catch (err) {
      isApplyingCloudUpdate = false;
      console.error("Fout bij syncStateToCloud:", err);
    }
  }, 100); // 100ms voor supersnelle realtime sync bij klik
};


window.syncAuthToCloud = function(authData) {
  const teamCode = (authData?.teamCode || "").toUpperCase().trim();
  if (teamCode) listenToTeamUpdates(teamCode);
  if (!currentUser) return;
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
    console.error("Fout bij syncAuthToCloud:", err);
  }
};

// ─── 8. Authenticatie Handlers (Google + Email) ───────────────
export async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    notifyToast(`Ingelogd als ${result.user.displayName || result.user.email}`, "success");
  } catch (err) {
    if (err.code === "auth/popup-closed-by-user") return;
    notifyToast(`Google login mislukt: ${err.message}`, "error");
  }
}
window.handleGoogleSignIn = handleGoogleSignIn;

export async function handleEmailSignIn(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    notifyToast(`Ingelogd als ${result.user.email}`, "success");
  } catch (err) {
    let msg = "Inloggen mislukt.";
    if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
      msg = "Onjuist e-mailadres of wachtwoord.";
    } else if (err.code === "auth/invalid-email") {
      msg = "Ongeldig e-mailadres.";
    }
    notifyToast(msg, "error");
  }
}
window.handleEmailSignIn = handleEmailSignIn;

export async function handleEmailRegister(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    notifyToast(`Account aangemaakt voor ${result.user.email}`, "success");
  } catch (err) {
    let msg = "Registreren mislukt.";
    if (err.code === "auth/email-already-in-use") {
      msg = "Dit e-mailadres is al in gebruik. Log in.";
    } else if (err.code === "auth/weak-password") {
      msg = "Wachtwoord moet minimaal 6 tekens zijn.";
    }
    notifyToast(msg, "error");
  }
}
window.handleEmailRegister = handleEmailRegister;

export async function handleFirebaseLogout() {
  try {
    await signOut(auth);
    notifyToast("Uitgelogd", "info");
  } catch (err) {
    notifyToast("Uitloggen mislukt", "error");
  }
}
window.handleFirebaseLogout = handleFirebaseLogout;

// ─── 9. Auth State & Event Listeners ──────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    initUserFirestoreData(user);
  } else {
    currentUser = null;
    if (unsubscribeFirestore) { unsubscribeFirestore(); unsubscribeFirestore = null; }
    updateAuthUI(null);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Check of de bezoeker via een ?invite= link binnenkomt
  checkInviteFromUrl();

  // Knoppen & formulieren
  document.getElementById("googleLoginBtn")?.addEventListener("click", handleGoogleSignIn);
  document.getElementById("inviteGoogleBtn")?.addEventListener("click", handleGoogleSignIn);

  // Invite keuze: Email Registratie openen
  document.getElementById("inviteShowEmailBtn")?.addEventListener("click", () => {
    document.getElementById("inviteStep").hidden = true;
    const regStep = document.getElementById("inviteEmailRegisterStep");
    if (regStep) {
      regStep.hidden = false;
      const playerName = currentPendingInvite?.playerName || "het team";
      const nameEl = document.getElementById("inviteEmailPlayerName");
      if (nameEl) nameEl.textContent = playerName;
    }
  });

  // Invite: Terug naar keuzemenu
  document.getElementById("inviteBackToChoiceBtn")?.addEventListener("click", () => {
    document.getElementById("inviteEmailRegisterStep").hidden = true;
    document.getElementById("inviteStep").hidden = false;
  });

  // Invite: Al een account? Ga naar login scherm
  document.getElementById("inviteAlreadyAccountBtn")?.addEventListener("click", () => {
    document.getElementById("inviteStep").hidden = true;
    document.getElementById("loginStep").hidden = false;
  });

  // Invite: E-mail registratie formulier met wachtwoord verificatie (2x invullen)
  document.getElementById("inviteEmailRegisterForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("inviteRegEmail")?.value.trim();
    const pass = document.getElementById("inviteRegPassword")?.value;
    const passConfirm = document.getElementById("inviteRegPasswordConfirm")?.value;

    if (!email || !pass) return;

    if (pass !== passConfirm) {
      notifyToast("Wachtwoorden komen niet overeen. Typ ze allebei opnieuw.", "error", 4000);
      return;
    }
    if (pass.length < 6) {
      notifyToast("Wachtwoord moet minimaal 6 tekens bevatten.", "error", 4000);
      return;
    }

    handleEmailRegister(email, pass);
  });

  // Standaard Login / Registratie formulieren
  document.getElementById("emailLoginForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail")?.value.trim();
    const pass = document.getElementById("loginPassword")?.value;
    if (email && pass) handleEmailSignIn(email, pass);
  });

  document.getElementById("emailRegisterForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("registerEmail")?.value.trim();
    const pass = document.getElementById("registerPassword")?.value;
    if (email && pass) handleEmailRegister(email, pass);
  });

  document.getElementById("showRegisterBtn")?.addEventListener("click", () => {
    document.getElementById("loginStep").hidden = true;
    document.getElementById("registerStep").hidden = false;
  });

  document.getElementById("backToLoginFromRegBtn")?.addEventListener("click", () => {
    document.getElementById("registerStep").hidden = true;
    document.getElementById("loginStep").hidden = false;
  });
});

