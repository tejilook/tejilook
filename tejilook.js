/**
 * TEJILOOK ERP - CONEXIÓN TOTAL
 * Este código está sincronizado con los nombres de tu index.html.
 */

// --- 1. CONFIGURACIÓN DEL SISTEMA ---
const App = {
  user: JSON.parse(localStorage.getItem('tejilook_user')) || null,
  
  // El "Mesero" que va a la cocina (Router.gs)
  call: function(fn, ...args) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex'; // Muestra el cargando
    
    return new Promise((resolve) => {
      google.script.run
        .withSuccessHandler(res => {
          if (overlay) overlay.style.display = 'none';
          resolve(res);
        })
        .withFailureHandler(err => {
          if (overlay) overlay.style.display = 'none';
          alert("Error: " + err.message);
        })[fn](...args);
    });
  }
};

// --- 2. ARRANQUE (Al abrir la página) ---
window.onload = () => {
  const loginPage = document.getElementById('loginPage');
  const mainPage = document.getElementById('mainPage');

  if (!App.user) {
    if (loginPage) loginPage.style.display = 'flex';
    if (mainPage) mainPage.style.display = 'none';
  } else {
    initApp();
  }
};

function initApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainPage').style.display = 'block';
  document.getElementById('userNameDisplay').innerText = App.user.nombre;
  
  // Ocultar botones de administrador si es Supervisor
  const esAdmin = App.user.rol === 'Superusuario' || App.user.rol === 'Administrador';
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = esAdmin ? 'block' : 'none');
  
  // Abrir la sección inicial
  showSection(App.user.rol === 'Supervisor' ? 'calidad' : 'dashboard');
}

// --- 3. NAVEGACIÓN (La función que llaman tus botones del menú) ---
function showSection(sectionId) {
  // 1. Escondemos todas las secciones (ID: section-nombre)
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
  
  // 2. Mostramos la elegida
  const target = document.getElementById('section-' + sectionId);
  if (target) {
    target.style.display = 'block';
  }

  // 3. Cargamos los datos automáticamente para esa pestaña
  if (sectionId === 'dashboard') loadDashboard();
  if (sectionId === 'clientes') loadModulo('CLIENTES', 'listaClientes', ['Cliente', 'LogoCliente']);
  if (sectionId === 'trabajadores') loadModulo('TRABAJADORES', 'listaTrabajadores', ['NombreTrabajador', 'Puesto']);
  if (sectionId === 'modelos') loadModulo('MODELOS', 'tablaModelos', ['NoOrden', 'Modelo', 'NombreCliente']);
}

// --- 4. GENERADOR UNIVERSAL (Carga cualquier tabla automáticamente) ---
async function loadModulo(tabla, contenedorId, columnas) {
  const lista = await App.call('get' + tabla.charAt(0) + tabla.slice(1).toLowerCase());
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  // Dibuja la tabla con los datos de tu Excel
  let html = `<table class="table"><thead><tr>${columnas.map(c => `<th>${c}</th>`).join('')}<th>Acción</th></tr></thead><tbody>`;
  html += lista.map(item => `
    <tr>
      ${columnas.map(c => `<td>${item[c] || ''}</td>`).join('')}
      <td><button class="btn-edit" onclick="alert('Próximamente: Editar ${tabla}')">📝</button></td>
    </tr>`).join('');
  html += `</tbody></table>`;
  contenedor.innerHTML = html;
}

// --- 5. LÓGICA DE PRODUCCIÓN (Tu regla de oro) ---
function updateProductionCalculo() {
  const cantInput = document.getElementById('input-cantidad'); // ID de tu HTML
  if (!cantInput) return;
  
  const cant = parseInt(cantInput.value) || 0;
  // Regla: 1 suéter = 1 Frente + 1 Espalda + 2 Mangas
  document.getElementById('input-frentes').value = cant;
  document.getElementById('input-espaldas').value = cant;
  document.getElementById('input-mangas').value = cant * 2;
}

// --- 6. LOGIN Y SALIDA ---
async function doLogin() {
  const u = document.getElementById('login_user').value;
  const p = document.getElementById('login_pass').value;
  
  const res = await App.call('loginUsuario', { usuario: u, password: p });
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
