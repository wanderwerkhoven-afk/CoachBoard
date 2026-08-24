// ============================================================
// auth.js — CoachBoard Firebase Authentication & Cloud Sync
// ============================================================
import {
  auth,
  db,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "./firebase.js";

let currentUser = null;
let unsubscribeFirestore = null;
let isApplyingCloudUpdate = false;
let cloudSyncTimeout = null;

// ─── UI helpers ──────────────────────────────────────────────
function showAuthScreen() {
  const authScreen = document.getElementById("authScreen");
  const mainApp    = document.getElementById("mainApp");
  if (authScreen) authScreen.classList.remove("hidden");
  if (mainApp)    mainApp.style.display = "none";
}

function showMainApp() {
  const authScreen = document.getElementById("authScreen");
  const mainApp    = document.getElementById("mainApp");
  if (authScreen) authScreen.classList.add("hidden");
  if (mainApp)    mainApp.style.display = "";
  if (window.renderAll) window.renderAll();
}

// ─── Cloud Sync: Load & Listen per User ───────────────────────
async function initUserFirestoreData(user) {
  if (!user) return;
  currentUser = user;

  // Unsubscribe previous listener if any
  if (unsubscribeFirestore) {
    unsubscribeFirestore();
    unsubscribeFirestore = null;
  }

  const userDocRef = doc(db, "users", user.uid);

  try {
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists() && docSnap.data()?.coachboardState) {
      // User already has data in Firestore: load it into the app
      const cloudData = docSnap.data().coachboardState;
      isApplyingCloudUpdate = true;
      window.setCoachBoardState?.(cloudData);
      isApplyingCloudUpdate = false;
    } else {
      // Brand new user or no cloud data yet: migrate current local data or defaults to Firestore
      const currentState = window.getCoachBoardState?.() || window.defaultState?.();
      if (currentState) {
        await setDoc(userDocRef, {
          email: user.email,
          updatedAt: new Date().toISOString(),
          coachboardState: currentState
        }, { merge: true });
      }
    }

    // Real-time listener for multi-device sync
    unsubscribeFirestore = onSnapshot(userDocRef, (snapshot) => {
      if (isApplyingCloudUpdate) return;
      if (snapshot.exists() && snapshot.data()?.coachboardState) {
        const cloudState = snapshot.data().coachboardState;
        isApplyingCloudUpdate = true;
        window.setCoachBoardState?.(cloudState);
        isApplyingCloudUpdate = false;
      }
    }, (err) => {
      console.warn("Firestore snapshot listener error:", err);
    });

  } catch (err) {
    console.error("Fout bij ophalen gebruikersdata uit Firestore:", err);
  }
}

// ─── Cloud Sync: Save State to Firestore ──────────────────────
window.syncStateToCloud = function(state) {
  if (!currentUser || isApplyingCloudUpdate) return;

  clearTimeout(cloudSyncTimeout);
  cloudSyncTimeout = setTimeout(async () => {
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        email: currentUser.email,
        updatedAt: new Date().toISOString(),
        coachboardState: state
      }, { merge: true });
    } catch (err) {
      console.error("Fout bij opslaan naar Firestore:", err);
    }
  }, 400); // 400ms debounce
};

// ─── Auth state listener ─────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    initUserFirestoreData(user);
    showMainApp();
  } else {
    currentUser = null;
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
      unsubscribeFirestore = null;
    }
    showAuthScreen();
  }
});

// ─── Sign In (email/password) ─────────────────────────────────
async function handleSignIn(e) {
  e?.preventDefault();
  const userInput = document.getElementById("loginUser");
  const passInput = document.getElementById("loginPass");

  const email    = (userInput?.value || "").trim();
  const password = (passInput?.value || "").trim();

  if (!email && !password) {
    window.showToast?.("Vul een e-mailadres en wachtwoord in.", "warning");
    return;
  }
  if (!email) {
    window.showToast?.("Vul uw e-mailadres in.", "warning");
    userInput?.focus();
    return;
  }
  if (!password) {
    window.showToast?.("Vul uw wachtwoord in.", "warning");
    passInput?.focus();
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    if (userInput) userInput.value = "";
    if (passInput) passInput.value = "";
    window.showToast?.("Welkom terug!", "success");
  } catch (err) {
    const errorMsg = firebaseErrorMessage(err.code);
    window.showToast?.(errorMsg, "error", 4500);
  }
}

// ─── Sign In with Google ──────────────────────────────────────
async function handleGoogleSignIn(e) {
  e?.preventDefault();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const name = result.user.displayName || result.user.email;
    window.showToast?.(`Welkom, ${name}!`, "success");
  } catch (err) {
    if (err.code === "auth/popup-closed-by-user") return;
    window.showToast?.(firebaseErrorMessage(err.code), "error", 4500);
  }
}

// ─── Sign Up ─────────────────────────────────────────────────
async function handleSignUp(e) {
  e?.preventDefault();
  const emailInput  = document.getElementById("signupEmail");
  const passInput   = document.getElementById("signupPass");
  const repeatInput = document.getElementById("signupPassRepeat");

  const email    = (emailInput?.value  || "").trim();
  const password = (passInput?.value   || "").trim();
  const repeat   = (repeatInput?.value || "").trim();

  if (!email || !password) {
    window.showToast?.("Vul alle verplichte velden in.", "warning");
    return;
  }
  if (password !== repeat) {
    window.showToast?.("De wachtwoorden komen niet overeen.", "error");
    return;
  }
  if (password.length < 6) {
    window.showToast?.("Wachtwoord moet minimaal 6 tekens bevatten.", "warning");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    if (emailInput)  emailInput.value  = "";
    if (passInput)   passInput.value   = "";
    if (repeatInput) repeatInput.value = "";
    window.showToast?.("Account aangemaakt! Welkom bij CoachBoard.", "success");
  } catch (err) {
    window.showToast?.(firebaseErrorMessage(err.code), "error", 4500);
  }
}

// ─── Logout ──────────────────────────────────────────────────
async function handleLogout() {
  try {
    await signOut(auth);
    const tab1 = document.getElementById("tab-1");
    if (tab1) tab1.checked = true;
    window.showToast?.("Succesvol uitgelogd.", "info");
  } catch (err) {
    window.showToast?.("Uitloggen mislukt. Probeer opnieuw.", "error");
  }
}

// ─── Forgot password ─────────────────────────────────────────
async function handleForgotPassword(e) {
  e?.preventDefault();
  const userInput = document.getElementById("loginUser");
  const email = (userInput?.value || "").trim();

  if (!email || !email.includes("@")) {
    window.showToast?.("Vul eerst uw e-mailadres in het bovenste veld in.", "warning", 4000);
    userInput?.focus();
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    window.showToast?.(`Wachtwoord reset e-mail verstuurd naar ${email}.`, "success", 5000);
  } catch (err) {
    window.showToast?.(firebaseErrorMessage(err.code), "error", 4500);
  }
}

// ─── Translate Firebase error codes to Dutch ─────────────────
function firebaseErrorMessage(code) {
  switch (code) {
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "E-mailadres of wachtwoord is onjuist.";
    case "auth/email-already-in-use":
      return "Dit e-mailadres is al in gebruik.";
    case "auth/invalid-email":
      return "Ongeldig e-mailadres.";
    case "auth/weak-password":
      return "Wachtwoord is te kort. Gebruik minimaal 6 tekens.";
    case "auth/too-many-requests":
      return "Te veel mislukte pogingen. Probeer het later opnieuw.";
    case "auth/network-request-failed":
      return "Geen internetverbinding. Controleer je netwerk.";
    case "auth/cancelled-popup-request":
    case "auth/popup-blocked":
      return "Google popup geblokkeerd door de browser. Sta popups toe.";
    default:
      return `Inloggen mislukt: ${code || "onbekende fout"}`;
  }
}

// ─── Password visibility toggle ──────────────────────────────
document.querySelectorAll(".btn-toggle-pwd").forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    btn.classList.toggle("active", isPassword);
  });
});

// ─── Wire up event listeners ─────────────────────────────────
document.getElementById("signInForm")?.addEventListener("submit", handleSignIn);
document.getElementById("btnSignIn")?.addEventListener("click", handleSignIn);

document.getElementById("btnGoogleSignIn")?.addEventListener("click", handleGoogleSignIn);
document.getElementById("btnGoogleSignUp")?.addEventListener("click", handleGoogleSignIn);

document.getElementById("signUpForm")?.addEventListener("submit", handleSignUp);
document.getElementById("btnSignUp")?.addEventListener("click", handleSignUp);

document.getElementById("btnLogout")?.addEventListener("click", handleLogout);
document.getElementById("forgotPassLink")?.addEventListener("click", handleForgotPassword);
