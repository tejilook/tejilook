/**
 * TEJILOOK ERP - VERSIÓN DE RESCATE PROFESIONAL
 * Incluye Modo Oscuro, Login Seguro y Navegación Corregida.
 */

// --- 1. CONFIGURACIÓN Y TEMA (MODO OSCURO) ---
const App = {
  user: JSON.parse(localStorage.getItem('tejilook_user')) || null,
  theme: localStorage.getItem('theme') || 'light',

  // Esta función es la que hace que el botón de Modo Oscuro funcione
  initTheme: function() {
    if (this.theme === 'dark') {
      document.body.classList.add('dark-mode');
    }
  },

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
          console.error("Error en " + fn, err);
          alert("Error: " + err.message);
        })[fn](...args);
    });
  }
};

// --- 2. CARGA INICIAL ---
window.onload = () => {
  App.initTheme(); // Primero activamos el tema (oscuro/claro)
  
  const loginPage = document.getElementById('loginPage');
  const mainPage = document.getElementById('mainPage');

  if (!App.user) {
    if (loginPage) loginPage.style.display = 'flex';
    if (mainPage) mainPage.style.display = 'none';
  } else {
    initApp();
  }
};

// Esta función es la que llaman tus botones del menú: onclick="toggleTheme()"
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  App.theme = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', App.theme);
}

function initApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainPage').style.display = 'block';
  document.getElementById('userNameDisplay').innerText = App.user.nombre;
  
  const esAdmin = App.user.rol === 'Superusuario' || App.user.rol === 'Administrador';
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = esAdmin ? 'block' : 'none');
  
  // Abrimos la primera sección
  showSection(App.user.rol === 'Supervisor' ? 'calidad' : 'dashboard');
}

// --- 3. NAVEGACIÓN (CONECTADO A TU HTML) ---
function showSection(sectionId) {
  console.log("Cambiando a sección:", sectionId);
  
  // Ocultar todas las secciones
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
  
  // Mostrar la sección correcta (usando el prefijo section- que tiene tu HTML)
  const target = document.getElementById('section-' + sectionId);
  if (target) {
    target.style.display = 'block';
  }

  // Ejecutar el cargador de datos correspondiente
  if (sectionId === 'dashboard') loadDashboard();
  if (sectionId === 'clientes') loadTable('CLIENTES', 'listaClientes');
  if (sectionId === 'produccion') loadProduccion();
}

// --- 4. CARGADORES DE DATOS ---
async function loadTable(tabla, contenedorId) {
  const lista = await App.call('get' + tabla.charAt(0) + tabla.slice(1).toLowerCase());
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  contenedor.innerHTML = `<table class="table">
    <thead><tr><th>Nombre</th><th>Estado</th></tr></thead>
    <tbody>${lista.map(item => `<tr><td>${item.Cliente || item.NombreTrabajador || ''}</td><td>Activo</td></tr>`).join('')}</tbody>
  </table>`;
}

// --- 5. LOGIN Y LOGOUT ---
async function doLogin() {
  const u = document.getElementById('login_user').value;
  const p = document.getElementById('login_pass').value;
  
  const res = await App.call('loginUsuario', { usuario: u, password: p });
  if (res && res.ok) {
    localStorage.setItem('tejilook_user', JSON.stringify(res.user));
    App.user = res.user;
    initApp();
  } else {
    alert(res ? res.msg : "Error de conexión");
  }
}

function doLogout() {
  localStorage.removeItem('tejilook_user');
  location.reload();
}
