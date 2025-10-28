const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName
    });
    res.status(201).json({ message: 'Usuario creado', uid: userRecord.uid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend funcionando 🚀 en http://localhost:${PORT}`);
});
