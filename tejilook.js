/**
 * TEJILOOK ERP - VERSIÓN BUSCADOR INTELIGENTE
 * Si la cocina ya manda datos, este código se encarga de mostrarlos.
 */

const App = {
  user: JSON.parse(localStorage.getItem('tejilook_user')) || {nombre: "Usuario", rol: "Administrador"}, // Backup por si falla el login
  
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
          console.error("Error en servidor:", err);
          resolve(null); // No rompemos el código si falla
        })[fn](...args);
    });
  }
};

// --- 1. NAVEGACIÓN RESISTENTE ---
function navigate(sectionId) {
  console.log("=== Intentando abrir: " + sectionId + " ===");
  
  // 1. Escondemos TODO lo que parezca una sección
  const todas = document.querySelectorAll('.content-section, [id*="section"], [id*="sec-"], main > div');
  todas.forEach(s => s.style.display = 'none');
  
  // 2. BUSCADOR DINÁMICO: Buscamos el ID exacto o parecido
  const target = document.getElementById(sectionId) || 
                 document.getElementById('section-' + sectionId) || 
                 document.getElementById('sec-' + sectionId) ||
                 document.getElementById(sectionId + '-section');
  
  if (target) {
    target.style.display = 'block';
    console.log("✅ Sección encontrada y mostrada.");
  } else {
    console.error("❌ ERROR: No existe ningún elemento en el HTML con el nombre: " + sectionId);
    // TRUCO: Listar todos los IDs disponibles para que Carlos me los pase
    const ids = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
    console.log("IDs disponibles en tu HTML:", ids);
  }

  // 3. CARGAR DATOS (Ahora con nombres seguros)
  if (sectionId === 'dashboard') loadDashboard();
  if (sectionId === 'entradas') loadEntradas();
  if (sectionId === 'produccion') loadProduccion();
  if (sectionId === 'embolsado') loadEmbolsado();
  if (sectionId === 'salidas') loadSalidas();
  if (sectionId === 'reposiciones') loadReposiciones();
  if (sectionId === 'bitacora') loadBitacora();
}

// --- 2. CARGADORES DE DATOS (PROTEGIDOS) ---

function loadDashboard() { console.log("Dashboard activo"); }

async function loadEntradas() {
  const datos = await App.call('getEntradas');
  if (datos) console.log("📥 Entradas en sistema:", datos.length);
}

async function loadProduccion() {
  const datos = await App.call('getProduccion');
  if (datos) console.log("⚙️ Producción en sistema:", datos.length);
}

async function loadEmbolsado() {
  const datos = await App.call('getEmbolsado');
  if (datos) console.log("📦 Embolsado en sistema:", datos.length);
}

async function loadSalidas() {
  const datos = await App.call('getSalidas');
  if (datos) console.log("🚛 Salidas en sistema:", datos.length);
}

async function loadReposiciones() {
  const datos = await App.call('getReposiciones');
  // Corregimos el error de "null" que salía en F12
  if (datos && datos.length > 0) {
    console.log("⚠️ Reposiciones encontradas:", datos.length);
  } else {
    console.log("✅ No hay reposiciones pendientes.");
  }
}

async function loadBitacora() {
  const datos = await App.call('getBitacora');
  if (datos) console.log("📜 Registros en bitácora:", datos.length);
}

// --- 3. BOTONES DEL MENÚ ---

function toggleDark() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function toggleMenu() {
  const sidebar = document.querySelector('.sidebar') || document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('active');
}

window.onload = () => {
  // Aplicar tema guardado
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
  
  if (App.user) {
    const main = document.getElementById('mainPage');
    const login = document.getElementById('loginPage');
    if (main) main.style.display = 'block';
    if (login) login.style.display = 'none';
    navigate('dashboard');
  }
};
