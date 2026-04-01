/**
 * TEJILOOK ERP - SISTEMA RECONECTADO
 */

const App = {
  user: JSON.parse(localStorage.getItem('tejilook_user')) || null,
  
  call: function(fn, ...args) {
    const loader = document.getElementById('loadingOverlay');
    if (loader) loader.style.display = 'flex';
    
    return new Promise((resolve) => {
      google.script.run
        .withSuccessHandler(res => {
          if (loader) loader.style.display = 'none';
          resolve(res);
        })
        .withFailureHandler(err => {
          if (loader) loader.style.display = 'none';
          alert("Error en " + fn + ": " + err.message);
        })[fn](...args);
    });
  }
};

// --- 1. NAVEGACIÓN ---
function navigate(sectionId) {
  console.log("Navegando a:", sectionId);
  
  // Ocultar todas las secciones. Probamos con varios IDs comunes.
  document.querySelectorAll('.content-section, [id^="section-"], [id^="sec-"]').forEach(s => {
    s.style.display = 'none';
  });
  
  // Intentamos encontrar tu sección por su ID
  const target = document.getElementById(sectionId) || 
                 document.getElementById('section-' + sectionId) || 
                 document.getElementById('sec-' + sectionId);
  
  if (target) {
    target.style.display = 'block';
  } else {
    console.error("ERROR: No encontré la sección: " + sectionId);
  }

  // Ejecutar cargadores según lo que pide el menú
  if (sectionId === 'dashboard') loadDashboard();
  if (sectionId === 'entradas') loadEntradas();
  if (sectionId === 'produccion') loadProduccion();
  if (sectionId === 'embolsado') loadEmbolsado();
  if (sectionId === 'salidas') loadSalidas();
  if (sectionId === 'reposiciones') loadReposiciones();
  if (sectionId === 'bitacora') loadBitacora();
}

// --- 2. CARGADORES (Las piezas que faltaban) ---

function loadDashboard() { console.log("Dashboard listo"); }

async function loadEntradas() {
  const datos = await App.call('getEntradas');
  console.log("Entradas cargadas:", datos.length);
}

async function loadProduccion() {
  const datos = await App.call('getProduccion');
  console.log("Producción cargada:", datos.length);
}

async function loadEmbolsado() {
  const datos = await App.call('getEmbolsado');
  console.log("Embolsado cargado:", datos.length);
}

async function loadSalidas() {
  const datos = await App.call('getSalidas');
  console.log("Salidas cargadas:", datos.length);
}

async function loadReposiciones() {
  const datos = await App.call('getReposiciones');
  console.log("Reposiciones cargadas:", datos.length);
}

async function loadBitacora() {
  const datos = await App.call('getBitacora');
  console.log("Bitácora cargada:", datos.length);
}

// --- 3. FUNCIONES DE APOYO ---

function toggleDark() {
  document.body.classList.toggle('dark-mode');
}

function toggleMenu() {
  const sidebar = document.querySelector('.sidebar') || document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('active');
}

window.onload = () => {
  if (App.user) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'block';
    navigate('dashboard');
  }
};
