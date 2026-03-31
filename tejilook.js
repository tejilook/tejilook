/**
 * TEJILOOK ERP - VERSIÓN INTEGRAL RECONECTADA
 * Esta versión soluciona los errores de "toggleMenu" y "navigate".
 */

const App = {
  user: JSON.parse(localStorage.getItem('tejilook_user')) || null,
  theme: localStorage.getItem('theme') || 'light',

  // MOTOR SEGURO: Llama a la cocina sin trabarse
  call: function(fn, ...args) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
    
    return new Promise((resolve) => {
      if (typeof google === 'undefined' || !google.script) {
        if (overlay) overlay.style.display = 'none';
        alert("Error: No se pudo conectar con Google Script.");
        return;
      }
      
      google.script.run
        .withSuccessHandler(res => {
          if (overlay) overlay.style.display = 'none';
          resolve(res);
        })
        .withFailureHandler(err => {
          if (overlay) overlay.style.display = 'none';
          console.error("Error en servidor:", err);
          alert("Error de red: " + err.message);
        })[fn](...args);
    });
  }
};

// --- 1. ARRANQUE (Al abrir la página) ---
window.onload = () => {
  // Aplicar tema oscuro si estaba guardado
  if (App.theme === 'dark') document.body.classList.add('dark-mode');

  if (!App.user) {
    showElement('loginPage', true);
    showElement('mainPage', false);
  } else {
    initApp();
  }
};

function initApp() {
  showElement('loginPage', false);
  showElement('mainPage', true);
  
  const nameDisplay = document.getElementById('userNameDisplay');
  if (nameDisplay) nameDisplay.innerText = App.user.nombre;
  
  // Seguridad de Admin/Supervisor
  const esAdmin = App.user.rol === 'Superusuario' || App.user.rol === 'Administrador';
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = esAdmin ? 'block' : 'none');
  
  // Si tu HTML usa "navigate", usamos navigate. Si usa "showSection", la creamos abajo.
  navigate(App.user.rol === 'Supervisor' ? 'calidad' : 'dashboard');
}

// --- 2. FUNCIONES DE NAVEGACIÓN (LOS CABLES QUE FALTABAN) ---

// Solución al error: "toggleMenu is not defined"
function toggleMenu() {
  const sidebar = document.getElementById('sidebar'); // Asegúrate que tu sidebar tenga este ID
  if (sidebar) {
    sidebar.classList.toggle('active');
  } else {
    // Si no tienes ID 'sidebar', tal vez usas una clase. Intentamos una genérica:
    const menu = document.querySelector('.sidebar') || document.querySelector('.menu-container');
    if (menu) menu.classList.toggle('active');
  }
}

// Solución al error: "navigate is not defined"
function navigate(sectionId) {
  console.log("Navegando a:", sectionId);
  
  // 1. Ocultar todas las secciones
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
  
  // 2. Mostrar la elegida (buscando por ID 'section-NOMBRE' o 'NOMBRE')
  const target = document.getElementById('section-' + sectionId) || document.getElementById(sectionId);
  if (target) {
    target.style.display = 'block';
  } else {
    console.warn("No se encontró la sección: " + sectionId);
  }

  // 3. Cargar datos específicos
  if (sectionId === 'dashboard') loadDashboard();
  if (sectionId === 'clientes') loadTable('CLIENTES', 'listaClientes');
}

// Para compatibilidad si algún botón usa "showSection"
function showSection(id) { navigate(id); }

// --- 3. UTILIDADES ---
function showElement(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? (id === 'loginPage' ? 'flex' : 'block') : 'none';
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  App.theme = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', App.theme);
}

// --- 4. SESIÓN ---
async function doLogin() {
  const u = document.getElementById('login_user').value;
  const p = document.getElementById('login_pass').value;
  
  const res = await App.call('loginUsuario', { usuario: u, password: p });
  if (res && res.ok) {
    localStorage.setItem('tejilook_user', JSON.stringify(res.user));
    App.user = res.user;
    initApp();
  } else {
    alert(res ? res.msg : "Credenciales incorrectas");
  }
}

function doLogout() {
  localStorage.removeItem('tejilook_user');
  location.reload();
}

// Función básica para cargar tablas (se puede ampliar)
async function loadTable(tabla, contenedorId) {
  const lista = await App.call('get' + tabla.charAt(0) + tabla.slice(1).toLowerCase());
  const contenedor = document.getElementById(contenedorId);
  if (contenedor) {
    contenedor.innerHTML = "Cargando " + lista.length + " registros...";
    // Aquí pondremos el dibujo de la tabla después
  }
}
