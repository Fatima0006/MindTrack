const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3001; 

app.use(cors());
app.use(express.json());

app.get("/api/sessions", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const response = await fetch("https://secure-api-ihgz.onrender.com/sessions", {
      headers: { "Authorization": token }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener sesiones" });
  }
});

app.use(express.static(path.join(__dirname, "../frontend")));


app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});




app.listen(PORT, () => console.log(`Servidor backend funcionando 🚀 Puerto: ${PORT}`));
