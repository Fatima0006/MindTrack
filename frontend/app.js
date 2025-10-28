const firebaseConfig = {
  apiKey: "AIzaSyCsoJC4FH-BMTlZFf6L_AtlhRlMCmmFV3c",
  authDomain: "mindtrack-58514.firebaseapp.com",
  projectId: "mindtrack-58514",
  storageBucket: "mindtrack-58514.firebasestorage.app",
  messagingSenderId: "138584951675",
  appId: "1:138584951675:web:38f4ce06df193d941d4bde",
  measurementId: "G-ZZNND9RBYF"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); 

const signUpBtn = document.getElementById('sign-up-btn');
const signInBtn = document.getElementById('sign-in-btn');
const container = document.querySelector('.container');

signUpBtn.addEventListener('click', () => {
  container.classList.add('sign-up-mode');
});

signInBtn.addEventListener('click', () => {
  container.classList.remove('sign-up-mode');
});

const signUpForm = document.getElementById('sign-up-form');
const signInForm = document.getElementById('sign-in-form');

signUpForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const username = signUpForm.querySelector('input[type="text"]').value;
  const email = signUpForm.querySelector('input[type="email"]').value;
  const password = signUpForm.querySelector('input[type="password"]').value;

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      db.collection("users").doc(user.uid).set({
        username: username,
        email: email
      })
      .then(() => {
        alert("Usuario registrado con éxito!");
        signUpForm.reset();
        container.classList.remove('sign-up-mode');
      })
      .catch((error) => {
        alert("Error al guardar el nombre de usuario: " + error.message);
      });
    })
    .catch((error) => {
      alert(error.message);
    });
});

signInForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const email = signInForm.querySelector('input[type="text"]').value;
  const password = signInForm.querySelector('input[type="password"]').value;

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      db.collection("users").doc(user.uid).get()
        .then((doc) => {
          if (doc.exists) {
            const username = doc.data().username;
            localStorage.setItem("username", username);
            window.location.href = "home.html"; 
          } else {
            alert("No se encontró información del usuario.");
          }
        })
        .catch((error) => {
          alert("Error al obtener datos: " + error.message);
        });
    })
    .catch((error) => {
      alert(error.message);
    });
});
