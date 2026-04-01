/**
 * TEJILOOK ERP - CONEXIÓN POR IDs (RECONEXIÓN TOTAL)
 */

const App = {
  user: JSON.parse(localStorage.getItem('tejilook_user')) || null,
  
  call: function(fn, ...args) {
    const loader = document.getElementById('loginOverlay'); // ID 0 de tu lista
    if (loader) loader.style.display = 'flex';
    return new Promise((resolve) => {
      google.script.run
        .withSuccessHandler(res => {
          if (loader) loader.style.display = 'none';
          resolve(res);
        })
        .withFailureHandler(err => {
          if (loader) loader.style.display = 'none';
          alert("Error: " + err.message);
        })[fn](...args);
    });
  }
};

// --- 1. FUNCIONES QUE TUS BOTONES PIDEN (Basado en F12) ---

function toggleMenu() {
  const sidebar = document.getElementById('sidebar'); // ID 9 de tu lista
  if (sidebar) sidebar.classList.toggle('active');
}

function toggleDark() {
  document.body.classList.toggle('dark-mode');
}

// Para que funcione tu menú de navegación
function navigate(seccion) {
  const main = document.getElementById('main'); // ID 18 de tu lista
  if (!main) return;

  // Limpiar el contenido actual del main para poner la tabla
  main.innerHTML = `<div style="padding:20px;">⌛ Cargando ${seccion}...</div>`;
  
  ejecutarCarga(seccion, main);
}

// --- 2. CARGADORES DE DATOS ---

async function ejecutarCarga(id, contenedor) {
  // Mapeo de qué función llamar según el botón
  const funciones = {
    'clientes': 'getClientes',
    'maquilas': 'getMaquilas',
    'trabajadores': 'getTrabajadores',
    'modelos': 'getModelos',
    'entradas': 'getEntradas',
    'produccion': 'getProduccion',
    'salidas': 'getSalidas',
    'bitacora': 'getBitacora'
  };

  if (funciones[id]) {
    const datos = await App.call(funciones[id]);
    dibujarTabla(contenedor, id.toUpperCase(), datos);
  } else {
    contenedor.innerHTML = `<h3>Sección: ${id}</h3><p>Contenido en desarrollo...</p>`;
  }
}

function dibujarTabla(contenedor, titulo, datos) {
  if (!datos || datos.length === 0) {
    contenedor.innerHTML = `<h3>${titulo}</h3><p>No hay datos registrados.</p>`;
    return;
  }

  const columnas = Object.keys(datos[0]);
  let html = `<div style="padding:15px;"><h3>${titulo}</h3>`;
  html += `<table border="1" style="width:100%; border-collapse:collapse; background:white; color:black;">
    <thead style="background:#eee;"><tr>${columnas.map(c => `<th>${c}</th>`).join('')}</tr></thead>
    <tbody>`;
  
  html += datos.map(f => `<tr>${columnas.map(c => `<td>${f[c] || ''}</td>`).join('')}</tr>`).join('');
  html += `</tbody></table></div>`;
  
  contenedor.innerHTML = html;
}

// --- 3. MENÚ DE ALTAS (MODALES) ---

// Esta función es para que tus botones de "Alta" abran las ventanas
function abrirModal(idModal) {
  const modal = document.getElementById(idModal);
  if (modal) {
    modal.style.display = 'flex';
  } else {
    alert("No se encontró el modal: " + idModal);
  }
}

// --- 4. ARRANQUE ---
window.onload = () => {
  if (App.user) {
    const login = document.getElementById('loginOverlay');
    if (login) login.style.display = 'none';
    const mainPage = document.getElementById('main');
    if (mainPage) mainPage.style.display = 'block';
    navigate('dashboard');
  }
};
