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


const mobileConsole = document.createElement("div");
mobileConsole.id = "mobileConsole";
mobileConsole.style.position = "fixed";
mobileConsole.style.bottom = "0";
mobileConsole.style.left = "0";
mobileConsole.style.width = "100%";
mobileConsole.style.maxHeight = "200px";
mobileConsole.style.overflowY = "auto";
mobileConsole.style.backgroundColor = "rgba(0,0,0,0.85)";
mobileConsole.style.color = "white";
mobileConsole.style.fontSize = "12px";
mobileConsole.style.fontFamily = "monospace";
mobileConsole.style.zIndex = "9999";
mobileConsole.style.padding = "5px";
mobileConsole.style.boxSizing = "border-box";
document.body.appendChild(mobileConsole);

function logMobile(...args) {
  const msg = args.map(a => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ");
  const p = document.createElement("div");
  p.textContent = msg;
  mobileConsole.appendChild(p);
  mobileConsole.scrollTop = mobileConsole.scrollHeight;
  console.log(...args);
}
console.log = (...args) => logMobile(...args);
console.error = (...args) => logMobile("ERROR:", ...args);
console.warn = (...args) => logMobile("WARN:", ...args);

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
  const signupPassword = document.querySelector("#sign-up-form input[type=password]");
  const doubleClickHint = document.getElementById("doubleClickHint");

  function checkFieldsForHint() {
    if (signupUsername.value.trim() && signupEmail.value.trim() && signupPassword.value.trim()) {
      doubleClickHint.style.display = "block";
    } else {
      doubleClickHint.style.display = "none";
    }
  }

  [signupUsername, signupEmail, signupPassword].forEach(input => {
    input.addEventListener("input", checkFieldsForHint);
  });

  const signupPasswordInput = document.querySelector("#sign-up-form input[type=password]");
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
  const password = document.querySelector("#sign-up-form input[type=password]").value.trim();

  logMobile("Intento de registro:", { username, email });

  if (!username || !email || !password) {
    showAlert("Por favor llena todos los campos.", "error");
    logMobile("Campos incompletos");
    return;
  }

  registerUser(username, email, password);
}

async function registerUser(username, email, password) {
  logMobile("Registrando usuario en Firebase...", { email });

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    logMobile("Usuario creado en Firebase:", cred.user.uid);

    await setDoc(doc(db, "users", email), {
      username,
      email,
      createdAt: serverTimestamp()
    });
    logMobile("Usuario agregado a Firestore");

    try {
      const token = await auth.currentUser.getIdToken();
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
      logMobile("Usuario agregado a API externa");
    } catch (apiErr) {
      logMobile("API no respondió, pero usuario creado en Firebase.");
    }

    showAlert("Usuario registrado correctamente.", "success");
    logMobile("Registro completado, redirigiendo...");
    window.location.href = "index.html";

  } catch (err) {
    logMobile("Error registrando:", err);

    if (err.code === "auth/email-already-in-use") {
      showAlert("Este correo ya está registrado.", "error");
      return;
    }

    showAlert("Error al registrar. Intenta nuevamente.", "error");
  }
}


async function loginUser() { 
  const email = document.getElementById("signin-email").value;
  const password = document.getElementById("signin-password").value;

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
    logMobile("Error login:", err);

    if (err.code === "auth/invalid-credential" || 
        err.code === "auth/wrong-password") {
      showAlert("Correo o contraseña incorrectos.", "error");
      return;
    }

    showAlert("No se pudo iniciar sesión.", "error");
  }
}


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
