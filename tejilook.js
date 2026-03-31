/**
 * TEJILOOK ERP - SISTEMA INTEGRAL (VERSIÓN FINAL OPTIMIZADA)
 * Controla la interfaz, botones y comunicación con el servidor.
 */

// --- 1. CONFIGURACIÓN Y MOTOR DEL SISTEMA ---
const App = {
  user: JSON.parse(localStorage.getItem('tejilook_user')) || null,
  
  // El "Mesero" que conecta la pantalla con Google Sheets
  call: function(fn, ...args) {
    document.getElementById('loadingOverlay').style.display = 'flex';
    return new Promise((resolve) => {
      google.script.run
        .withSuccessHandler(res => {
          document.getElementById('loadingOverlay').style.display = 'none';
          resolve(res);
        })
        .withFailureHandler(err => {
          document.getElementById('loadingOverlay').style.display = 'none';
          alert("Error: " + err.message);
        })[fn](...args);
    });
  }
};

// --- 2. INICIO Y NAVEGACIÓN ---
window.onload = () => {
  if (!App.user) { document.getElementById('loginPage').style.display = 'block'; } 
  else { initApp(); }
};

function initApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainPage').style.display = 'block';
  document.getElementById('userNameDisplay').innerText = App.user.nombre;
  
  // Seguridad por Rol: El Supervisor va directo a Calidad
  if (App.user.rol === 'Supervisor') {
    navegar('calidad');
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  } else {
    navegar('dashboard');
  }
}

function navegar(seccion) {
  // 1. Cerramos todas las secciones
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
  // 2. Abrimos la elegida
  const target = document.getElementById('sec-' + seccion);
  if (target) target.style.display = 'block';
  
  // 3. Cargamos los datos según la sección
  if (seccion === 'clientes') cargarClientes();
  if (seccion === 'trabajadores') cargarTrabajadores();
  if (seccion === 'modelos') cargarModelos();
  if (seccion === 'produccion') cargarProduccion();
  if (seccion === 'calidad') cargarReposiciones();
  if (seccion === 'dashboard') cargarDashboard();
}

// --- 3. MÓDULO DE PRODUCCIÓN (Tu lógica de oro) ---
// Regla: 1 suéter = 4 piezas
function actualizarCalculoPiezas() {
  const cant = parseInt(document.getElementById('prod_cantidad').value) || 0;
  document.getElementById('prod_frentes').value = cant;
  document.getElementById('prod_espaldas').value = cant;
  document.getElementById('prod_mangas').value = cant * 2; // Siempre el doble de mangas
}

async function guardarProduccion() {
  const datos = {
    ID_Trabajador: document.getElementById('prod_trabajador').value,
    NombreTrabajador: document.getElementById('prod_trabajador').options[document.getElementById('prod_trabajador').selectedIndex].text,
    NoOrden: document.getElementById('prod_orden').value,
    Proceso: document.getElementById('prod_proceso').value,
    Tallas: [{
      Talla: document.getElementById('prod_talla').value,
      Frentes: document.getElementById('prod_frentes').value,
      Espaldas: document.getElementById('prod_espaldas').value,
      Mangas: document.getElementById('prod_mangas').value
    }]
  };
  
  const res = await App.call('registrarProduccion', datos);
  if (res.ok) {
    alert("¡Producción guardada!");
    navegar('produccion');
  }
}

// --- 4. MÓDULO DE CALIDAD (Reposiciones con fotos) ---
async function cargarReposiciones() {
  const lista = await App.call('getAllReposiciones');
  const tabla = document.getElementById('tablaReposiciones');
  tabla.innerHTML = lista.map(r => `
    <tr>
      <td>${r.Fecha}</td>
      <td>${r.NoOrden}</td>
      <td><strong>${r.Estatus}</strong></td>
      <td>
        <button onclick="verEvidencias('${r.ID_Reposicion}')">📷</button>
        <button onclick="avanzarEstatus('${r.ID_Reposicion}', '${r.Estatus}')">➡️</button>
      </td>
    </tr>
  `).join('');
}

// --- 5. UTILIDADES (Imágenes y Sesión) ---
async function subirFoto(input, folderId, fileName) {
  const base64 = await prepararImagen(input);
  return await App.call('uploadImage', base64, folderId, fileName);
}

async function prepararImagen(input) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 800 / img.width;
        canvas.width = 800;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  });
}

async function doLogin() {
  const creds = {
    usuario: document.getElementById('login_user').value,
    password: document.getElementById('login_pass').value
  };
  const res = await App.call('loginUsuario', creds);
  if (res.ok) {
    localStorage.setItem('tejilook_user', JSON.stringify(res.user));
    App.user = res.user;
    initApp();
  } else {
    alert(res.msg);
  }
}

function doLogout() {
  App.call('logCierreSesion');
  localStorage.removeItem('tejilook_user');
  location.reload();
}
