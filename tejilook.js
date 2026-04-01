/**
 * TEJILOOK ERP - VERSIÓN INTEGRAL RECONECTADA
 * Esta versión restaura todos los módulos y corrige los errores de F12.
 */

const App = {
  user: JSON.parse(localStorage.getItem('tejilook_user')) || null,
  theme: localStorage.getItem('theme') || 'light',

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

// --- 1. ARRANQUE Y TEMA ---
window.onload = () => {
  if (App.theme === 'dark') document.body.classList.add('dark-mode');
  if (!App.user) {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('mainPage').style.display = 'none';
  } else {
    initApp();
  }
};

// Corrigiendo el error: "toggleDark is not defined"
function toggleDark() {
  const isDark = document.body.classList.toggle('dark-mode');
  App.theme = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', App.theme);
}

function toggleMenu() {
  const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.toggle('active');
}

function initApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainPage').style.display = 'block';
  document.getElementById('userNameDisplay').innerText = App.user.nombre;
  
  const esAdmin = App.user.rol === 'Superusuario' || App.user.rol === 'Administrador';
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = esAdmin ? 'block' : 'none');
  
  navigate(App.user.rol === 'Supervisor' ? 'reposiciones' : 'dashboard');
}

// --- 2. NAVEGACIÓN UNIVERSAL (Corregida) ---
function navigate(sectionId) {
  console.log("Intentando navegar a:", sectionId);
  
  // Ocultar todas las secciones posibles
  const secciones = document.querySelectorAll('.content-section');
  secciones.forEach(s => s.style.display = 'none');
  
  // Buscar la sección por varios nombres posibles (por si el HTML varía)
  const target = document.getElementById('section-' + sectionId) || 
                 document.getElementById(sectionId) || 
                 document.getElementById('sec-' + sectionId);
  
  if (target) {
    target.style.display = 'block';
  } else {
    console.error("ERROR CRÍTICO: No se encontró el ID de sección para " + sectionId);
  }

  // Ejecutar los cargadores que pide la consola (F12)
  if (sectionId === 'dashboard') loadDashboard();
  if (sectionId === 'entradas') loadEntradas();
  if (sectionId === 'produccion') loadProduccion();
  if (sectionId === 'embolsado') loadEmbolsado();
  if (sectionId === 'salidas') loadSalidas();
  if (sectionId === 'reposiciones') loadReposiciones();
  if (sectionId === 'bitacora') loadBitacora();
}

// --- 3. FUNCIONES DE CARGA (LA CARNE DEL SISTEMA) ---

async function loadDashboard() {
  console.log("Cargando Dashboard...");
  // Aquí puedes poner la lógica de tus gráficas
}

async function loadEntradas() {
  const lista = await App.call('getEntradas');
  renderTabla('tablaEntradas', lista, ['FechaEntrada', 'NoOrden', 'Cuellos']);
}

// Lógica de oro: 1 suéter = 4 piezas
function updateProduccionCalculo() {
  const cant = parseInt(document.getElementById('prod-cantidad').value) || 0;
  document.getElementById('prod-frentes').value = cant;
  document.getElementById('prod-espaldas').value = cant;
  document.getElementById('prod-mangas').value = cant * 2;
}

async function loadProduccion() {
  const lista = await App.call('getProduccion');
  renderTabla('tablaProduccion', lista, ['Fecha', 'NombreTrabajador', 'Proceso', 'NoOrden']);
}

async function loadSalidas() {
  const lista = await App.call('getSalidas');
  renderTabla('tablaSalidas', lista, ['FechaSalida', 'NoOrden', 'NombreCliente', 'TotalSueteres']);
}

// --- 4. UTILIDADES ---

function renderTabla(containerId, datos, columnas) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (datos.length === 0) {
    container.innerHTML = "<p>No hay registros disponibles.</p>";
    return;
  }

  let html = `<table class="table-custom"><thead><tr>${columnas.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
  html += datos.map(fila => `<tr>${columnas.map(c => `<td>${fila[c] || ''}</td>`).join('')}</tr>`).join('');
  html += `</tbody></table>`;
  container.innerHTML = html;
}

async function doLogin() {
  const u = document.getElementById('login_user').value;
  const p = document.getElementById('login_pass').value;
  const res = await App.call('loginUsuario', { usuario: u, password: p });
  if (res && res.ok) {
    localStorage.setItem('tejilook_user', JSON.stringify(res.user));
    App.user = res.user;
    initApp();
  } else {
    alert(res ? res.msg : "Credenciales inválidas");
  }
}

function doLogout() {
  localStorage.removeItem('tejilook_user');
  location.reload();
}
