import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
export const auth = getAuth(app);
window.auth = auth; 

let currentUserRole = "user";


export async function initDashboard() {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      console.warn("No hay usuario autenticado — redirigiendo a login...");
      window.location.href = "index.html";
      return;
    }

    try {
      const token = await getIdToken();
      const resp = await fetch("https://secure-api-ihgz.onrender.com/profile/me", {
        headers: { Authorization: "Bearer " + token }
      });
      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      const profile = await resp.json();
      currentUserRole = profile.role || "user";

      document.getElementById("user-display").textContent = profile.display_name || profile.email;
      document.getElementById("user-display-inner").textContent = profile.display_name || profile.email;

      if (currentUserRole === "admin") {
        const title = document.getElementById("activity-title");
        if (title) title.style.display = "none";

        const actContainer = document.getElementById("activity-charts");
        if (actContainer) actContainer.style.display = "none";
      }

    } catch (err) {
      console.error("Error obteniendo perfil:", err);
      currentUserRole = "user";
    }

    const sessions = await loadSessions();

    if (currentUserRole !== "admin" && sessions.length === 0) {
    const container = document.getElementById("sessionsContainer");
    container.innerHTML = `
        <div class="no-sessions-message">
            <h3>¡Aún no has realizado ninguna sesión!</h3>
            <p>Para empezar, abre la aplicación móvil y realiza tu primera sesión de MindTrack.</p>
        </div>
    `;
} else {
    
    renderSessions(sessions);

    if (currentUserRole !== "admin") {
        renderLast3ActivityCharts(sessions);
    }
}
  });
}

async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay usuario autenticado");
  return await user.getIdToken(false);
}

async function loadSessions() {
  try {
    const token = await getIdToken();
    const url = currentUserRole === "admin"
      ? "https://secure-api-ihgz.onrender.com/admin/sessions"
      : "https://secure-api-ihgz.onrender.com/sessions";

    const resp = await fetch(url, { headers: { Authorization: "Bearer " + token } });
    if (!resp.ok) throw new Error(`Error ${resp.status}`);
    const sessions = await resp.json();
    return sessions;
  } catch (err) {
    console.error("[ERROR] loadSessions", err);
    document.getElementById("sessionsContainer").innerHTML =
      `<p style="color:#555">No se pudieron cargar las sesiones: ${err.message}</p>`;
    return [];
  }
}

async function renderLast3ActivityCharts(sessions) {
  const container = document.getElementById("activity-charts");
  if (!container) return;

  container.innerHTML = "";

  const last3 = sessions
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
    .slice(0, 3);

  for (const s of last3) {
    const div = document.createElement("div");
    div.className = "activity-card";

    div.innerHTML = `
      <h4>Sesión: ${s.child_code}</h4>
      <p>${new Date(s.started_at).toLocaleString()}</p>
      <div id="act-${s.id}"></div>
    `;

    container.appendChild(div);

    await loadSessionCharts(s.id, document.getElementById(`act-${s.id}`));
  }
}

function renderSessions(sessions) {
  const container = document.getElementById("sessionsContainer");
  container.innerHTML = "";

  sessions.forEach((s) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>Sesión: ${s.child_code}</h3>
      <p>Inicio: ${new Date(s.started_at).toLocaleString()}</p>
      <button onclick="viewSummary('${s.id}', this)">Ver Resumen</button>
      ${currentUserRole === "admin" ? `<button onclick="deleteSession('${s.id}', this)">Eliminar</button>` : ""}
      <div class="activity-charts" id="charts-${s.id}" style="display:none;"></div>
    `;
    container.appendChild(card);
  });
}

window.viewSummary = async function(sessionId, btn) {
  const div = document.getElementById(`charts-${sessionId}`);
  if (!div) return;

  const isVisible = div.style.display === "block";
  div.style.display = isVisible ? "none" : "block";
  btn.textContent = isVisible ? "Ver Resumen" : "Ocultar Resumen";

  if (!isVisible) {
    div.innerHTML = "";
    await loadSessionCharts(sessionId, div);
  } else {
    div.innerHTML = "";
  }
};

async function loadSessionCharts(sessionId, container) {
  try {
    const token = await getIdToken();
    const baseUrl = currentUserRole === "admin"
      ? `https://secure-api-ihgz.onrender.com/admin/sessions/${sessionId}`
      : `https://secure-api-ihgz.onrender.com/sessions/${sessionId}`;

    const [summaryResp, seriesResp] = await Promise.all([
      fetch(`${baseUrl}/summary`, { headers: { Authorization: "Bearer " + token } }),
      fetch(`${baseUrl}/heart-series`, { headers: { Authorization: "Bearer " + token } })
    ]);

    const summary = summaryResp.ok ? await summaryResp.json() : {};
    let series = seriesResp.ok ? await seriesResp.json() : [];

    if (summary.min_ms !== undefined) {
      const canvas = document.createElement("canvas");
      container.appendChild(canvas);
      new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
          labels: ["Mínimo", "Promedio", "Máximo"],
          datasets: [{
            label: "Latencia (ms)",
            data: [summary.min_ms, summary.avg_ms, summary.max_ms],
            backgroundColor: ["#e18125","#24345c","#f1c40f"]
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }

    if (summary.min_bpm !== undefined && series.length) {
      const canvas = document.createElement("canvas");
      container.appendChild(canvas);
      new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
          labels: series.map(s => new Date(s.tsDevice).toLocaleTimeString()),
          datasets: [{
            label: "BPM vs Tiempo",
            data: series.map(s => s.bpm),
            borderColor: "#e18125",
            backgroundColor: "rgba(225,129,37,0.2)",
            tension: 0.3,
            fill: true
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    }
  } catch (err) {
    console.error("Error loadSessionCharts:", err);
    const p = document.createElement("p");
    p.textContent = "Error al cargar datos de la sesión.";
    container.appendChild(p);
  }
}

window.deleteSession = async function(sessionId, btn) {
  const modal = document.getElementById('deleteSessionModal');
  const confirmBtn = document.getElementById('confirmDeleteSession');
  const cancelBtn = document.getElementById('cancelDeleteSession');

  modal.style.display = 'flex';

  cancelBtn.onclick = () => { modal.style.display = 'none'; };
  confirmBtn.onclick = async () => {
    try {
      const token = await getIdToken();
      const resp = await fetch(`https://secure-api-ihgz.onrender.com/admin/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
      });
      if (!resp.ok) throw new Error(`Error ${resp.status}`);

      const card = btn.closest(".card");
      if (card) card.remove();

      modal.style.display = 'none';
    } catch (err) {
      console.error("Error al eliminar sesión:", err);
      alert("No se pudo eliminar la sesión. Revisa la consola.");
      modal.style.display = 'none';
    }
showSuccessDeleteModal("La sesión se eliminó correctamente.");
    
  };
};


function showSuccessDeleteModal(message = "La sesión se eliminó correctamente.") {
    const modal = document.getElementById('successDeleteModal');
    modal.querySelector('p').textContent = message;
    modal.style.display = 'flex';

    document.getElementById('acceptSuccessDelete').onclick = () => {
        modal.style.display = 'none';
    };
    
}