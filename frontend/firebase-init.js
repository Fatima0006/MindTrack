export let auth = null;
export let db = null;

export async function initFirebase(firebaseConfig) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  db = firebase.firestore ? firebase.firestore() : null;
  auth = firebase.auth();

  window.auth = auth;
  window.db = db;

  return { auth, db };
}
