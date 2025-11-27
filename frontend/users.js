import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAcz4kzlZtHr1BTbygWAx2vS0OHnwumG5I",
  authDomain: "desmovil-70636.firebaseapp.com",
  projectId: "desmovil-70636",
  storageBucket: "desmovil-70636.firebasestorage.app",
  messagingSenderId: "871424086259",
  appId: "1:871424086259:web:a44577df397610e0326786",
  measurementId: "G-09DXH6Z0CP"
};

console.log("Inicializando Firebase desde users.js...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API_BASE = "https://secure-api-ihgz.onrender.com";
const table = document.getElementById("usersTableBody");

console.log("API_BASE:", API_BASE);
console.log("Tabla detectada:", table);

onAuthStateChanged(auth, async (user) => {
  console.log("onAuthStateChanged ejecutado. Usuario:", user);

  if (!user) {
    console.warn("No hay usuario autenticado. Redirigiendo a login.");
    return window.location.href = "index.html";
  }

  console.log("Obteniendo token...");
  const token = await user.getIdToken();
  console.log("Token obtenido:", token.substring(0, 20) + "...");

  try {
    console.log("Consultando /profile/me ...");
    const resProfile = await fetch(`${API_BASE}/profile/me`, {
      headers: { "Authorization": "Bearer " + token }
    });

    console.log(" Respuesta /profile/me:", resProfile.status);

    if (!resProfile.ok) {
      console.error("Error en /profile/me");
      throw new Error("Error al obtener perfil");
    }

    const profile = await resProfile.json();
    console.log(" Perfil recibido:", profile);

    if (profile.role !== "admin") {
      console.warn("Usuario NO es admin:", profile.role);
      alert("Solo administradores pueden ver esta sección.");
      return window.location.href = "admin-dashboard.html";
    }

    console.log("✔ Usuario es admin. Cargando usuarios...");
    loadUsers(token);

  } catch (err) {
    console.error("Error validando sesión:", err);
    alert("No se pudo validar sesión.");
    window.location.href = "index.html";
  }
});

async function loadUsers(token) {
  console.log("Cargando lista de usuarios desde:", `${API_BASE}/admin/users`);

  table.innerHTML = "<tr><td colspan='4'>Cargando...</td></tr>";

  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { "Authorization": "Bearer " + token }
    });

    console.log(" Respuesta /admin/users:", res.status);

    if (!res.ok) {
      console.error(" Error en /admin/users");
      throw new Error("Error al cargar usuarios");
    }

    const users = await res.json();
    console.log("Usuarios recibidos:", users);

    table.innerHTML = "";

    if (users.length === 0) {
      console.warn("⚠ No hay usuarios retornados por API");
      table.innerHTML = "<tr><td colspan='4'>Sin usuarios registrados</td></tr>";
      return;
    }

    users.forEach(u => {
      console.log("Usuario tabla:", u);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.display_name || "(Sin nombre)"}</td>
        <td>${u.email}</td>
        <td>
          <select data-uid="${u.uid}" class="role-select">
            <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
            <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
          </select>
        </td>
        <td>
          <button class="edit-btn" data-uid="${u.uid}">Editar</button>
          <button class="delete-btn" data-uid="${u.uid}">Eliminar</button>
        </td>
      `;
      table.appendChild(tr);
    });

    console.log("📎 Eventos de botones agregados.");
    attachEvents(token);

  } catch (err) {
    console.error("Excepción al cargar usuarios:", err);
    table.innerHTML = "<tr><td colspan='4'>Error cargando usuarios</td></tr>";
  }
}

function attachEvents(token) {
  console.log("Configurando eventos en select, edit y delete...");

  document.querySelectorAll(".role-select").forEach(sel => {
    sel.addEventListener("change", async e => {
      const uid = e.target.dataset.uid;
      const role = e.target.value;
      console.log(`Cambiando rol de ${uid} a ${role}`);

      await fetch(`${API_BASE}/admin/users/${uid}`, {
        method: "PATCH",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role })
      });

      alert("Rol actualizado");
    });
  });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const uid = btn.dataset.uid;
      const name = prompt("Nuevo nombre:");
      console.log(`Editando nombre de ${uid} a "${name}"`);
      if (!name) return;

      await fetch(`${API_BASE}/admin/users/${uid}`, {
        method: "PATCH",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ display_name: name })
      });

      loadUsers(token);
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const uid = btn.dataset.uid;
      console.log(`Eliminando usuario: ${uid}`);

      if (!confirm("¿Eliminar usuario?")) return;

      await fetch(`${API_BASE}/admin/users/${uid}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
      });

      loadUsers(token);
    });
  });
}

console.log("users.js completamente cargado.");
