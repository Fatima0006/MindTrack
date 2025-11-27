import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, doc, setDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAcz4kzlZtHr1BTbygWAx2vS0OHnwumG5I",
  authDomain: "desmovil-70636.firebaseapp.com",
  projectId: "desmovil-70636",
  storageBucket: "desmovil-70636.firebasestorage.app",
  messagingSenderId: "871424086259",
  appId: "1:871424086259:web:a44577df397610e0326786",
  measurementId: "G-09DXH6Z0CP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.auth = auth;
window.db = db;

const API_BASE = "https://secure-api-ihgz.onrender.com";

if (!localStorage.getItem("username") && !window.location.href.includes("index.html")) {
  window.location.href = "index.html";
}

let listenersInitialized = false;

function initFormListeners() {
  if (listenersInitialized) return; 
  listenersInitialized = true;

  const signInForm = document.getElementById("sign-in-form");
  const signUpForm = document.getElementById("sign-up-form");

  if (signInForm) {
    signInForm.addEventListener("submit", (e) => {
      e.preventDefault();
      loginUser();
    });
  }

  if (signUpForm) {
    signUpForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSignUpClick(); 
    });
  }

  const signupUsername = document.getElementById("signup-username");
  const signupEmail = document.getElementById("signup-email");
  const signupPasswordInput = document.getElementById("signup-password");
  const doubleClickHint = document.getElementById("doubleClickHint");

  function checkFieldsForHint() {
    if (signupUsername.value.trim() && signupEmail.value.trim() && signupPasswordInput.value.trim()) {
      doubleClickHint.style.display = "block";
    } else {
      doubleClickHint.style.display = "none";
    }
  }

  [signupUsername, signupEmail, signupPasswordInput].forEach(input => {
    input.addEventListener("input", checkFieldsForHint);
  });

  const submitBtn = document.querySelector("#sign-up-form input[type=submit]");

  const reqLength = document.getElementById("req-length");
  const reqUpper = document.getElementById("req-uppercase");
  const reqLower = document.getElementById("req-lowercase");
  const reqNumber = document.getElementById("req-number");
  const reqSpecial = document.getElementById("req-special");

  function validatePassword(password) {
    let valid = true;

    if (password.length >= 6) {
      reqLength.style.color = "green";
      reqLength.textContent = "✔ Mínimo 6 caracteres";
    } else {
      reqLength.style.color = "gray";
      reqLength.textContent = "( ) Mínimo 6 caracteres";
      valid = false;
    }

    if (/[A-Z]/.test(password)) {
      reqUpper.style.color = "green";
      reqUpper.textContent = "✔ Al menos una mayúscula";
    } else {
      reqUpper.style.color = "gray";
      reqUpper.textContent = "( ) Al menos una mayúscula";
      valid = false;
    }

    if (/[a-z]/.test(password)) {
      reqLower.style.color = "green";
      reqLower.textContent = "✔ Al menos una minúscula";
    } else {
      reqLower.style.color = "gray";
      reqLower.textContent = "( ) Al menos una minúscula";
      valid = false;
    }

    if (/\d/.test(password)) {
      reqNumber.style.color = "green";
      reqNumber.textContent = "✔ Al menos un número";
    } else {
      reqNumber.style.color = "gray";
      reqNumber.textContent = "( ) Al menos un número";
      valid = false;
    }

    if (/[.!@#$%^&*]/.test(password)) {
      reqSpecial.style.color = "green";
      reqSpecial.textContent = "✔ Al menos un carácter especial (.!@#$%^&*)";
    } else {
      reqSpecial.style.color = "gray";
      reqSpecial.textContent = "( ) Al menos un carácter especial (.!@#$%^&*)";
      valid = false;
    }

    submitBtn.disabled = !valid; 
  }

  signupPasswordInput.addEventListener("input", (e) => {
    validatePassword(e.target.value);
  });
}

initFormListeners();

let firstClickTime = null;
let alreadyRegisteredEmail = null;

function handleSignUpClick() {
  const username = document.getElementById("signup-username").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();

  if (!username || !email || !password) {
    showAlert("Por favor llena todos los campos.", "error");
    return;
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!isMobile) {
    const now = Date.now();
    if (alreadyRegisteredEmail === email && firstClickTime && (now - firstClickTime < 7000)) {
      showSuccessModal();
      return;
    }
    firstClickTime = now;
    alreadyRegisteredEmail = email;
  }

  registerUser(username, email, password);
}

function showSuccessModal() {
  const modal = document.getElementById("successModal");
  modal.style.display = "flex";

  document.getElementById("acceptModal").onclick = () => {
    modal.style.display = "none";
    window.location.href = "index.html";
  };
}

async function loginUser() {
  const email = document.getElementById("signin-email").value.trim();
  const password = document.getElementById("signin-password").value.trim();

  if (!email || !password) {
    showAlert("Por favor llena todos los campos.", "error");
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    const token = await user.getIdToken();

    const resp = await fetch(`${API_BASE}/profile/me`, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!resp.ok) throw new Error("Error al obtener perfil");
    const profile = await resp.json();

    localStorage.setItem("username", email);

    window.location.href = profile.role === "admin"
      ? "admin-dashboard.html"
      : "dashboard.html";

  } catch (err) {
    console.error("Error login:", err);

    if (err.code === "auth/invalid-credential" || 
        err.code === "auth/wrong-password") {
      showAlert("Correo o contraseña incorrectos.", "error");
      return;
    }

    showAlert("No se pudo iniciar sesión.", "error");
  }
}

async function registerUser(username, email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    await user.reload(); 

    await setDoc(doc(db, "users", email), {
      username,
      email,
      createdAt: serverTimestamp()
    });

    try {
      const token = await user.getIdToken();
      await fetch(`${API_BASE}/admin/registerUser`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token 
        },
        body: JSON.stringify({
          email,
          display_name: username,
          role: "user"
        })
      });
    } catch (apiErr) {
      console.warn("API no respondió, pero usuario creado en Firebase.");
    }

    showSuccessModal();

  } catch (err) {
    console.error("Error registrando:", err);

    if (err.code === "auth/email-already-in-use") {
      showAlert("Este correo ya está registrado.", "error");
      return;
    }

    showAlert("Error al registrar. Intenta nuevamente.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.location.href.includes("users.html")) return;

  console.log("Cargando users.html desde app.js unificado...");

  onAuthStateChanged(auth, async (user) => {
    if (!user) return (window.location.href = "index.html");

    const token = await user.getIdToken();

    const resProfile = await fetch(`${API_BASE}/profile/me`, {
      headers: { "Authorization": "Bearer " + token }
    });

    const profile = await resProfile.json();

    if (profile.role !== "admin") {
      alert("Solo administradores pueden ver la lista de usuarios");
      return window.location.href = "admin-dashboard.html";
    }

    loadUsers(token);
  });
});

function showAlert(message, type = "success") {
  if (type === "success") {
    document.querySelector("#successModal p").textContent = message;
    document.getElementById("successModal").style.display = "flex";

    document.getElementById("acceptModal").onclick = () => {
      document.getElementById("successModal").style.display = "none";
    };

  } else {
    document.querySelector("#errorModal p").textContent = message;
    document.getElementById("errorModal").style.display = "flex";

    document.getElementById("acceptErrorModal").onclick = () => {
      document.getElementById("errorModal").style.display = "none";
    };
  }
}
