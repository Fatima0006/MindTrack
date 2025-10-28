import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import { readFileSync } from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const serviceAccount = JSON.parse(
  readFileSync("./firebase-key.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://TU_PROYECTO.firebaseio.com"
});

const db = admin.firestore();

app.post("/register", async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;
    await db.collection("usuarios").add({
      nombre,
      correo,
      password,
      fechaRegistro: new Date()
    });
    res.json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { correo, password } = req.body;
    const snapshot = await db.collection("usuarios")
      .where("correo", "==", correo)
      .where("password", "==", password)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    res.json({ message: "Login exitoso" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("✅ Servidor backend corriendo en http://localhost:3000"));
