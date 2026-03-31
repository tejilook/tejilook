/**
 * TEJILOOK ERP - VERSIÓN CORREGIDA (CONEXIÓN TOTAL)
 * Esta versión coincide exactamente con los nombres de tus botones en el HTML.
 */

const App = {
  user: JSON.parse(localStorage.getItem('tejilook_user')) || null,
  
  // MOTOR DE COMUNICACIÓN (Wrapper seguro)
  call: function(fn, ...args) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
    
    return new Promise((resolve) => {
      google.script.run
        .withSuccessHandler(res => {
          if (overlay) overlay.style.display = 'none';
          resolve(res);
        })
        .withFailureHandler(err => {
          if (overlay) overlay.style.display = 'none';
          alert("Error en el servidor: " + err.message);
        })[fn](...args);
    });
  }
};

// --- 1. ARRANQUE (Coincide con tu window.onload) ---
window.onload = () => {
  if (!App.user) {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('mainPage').style.display = 'none';
  } else {
    initApp();
  }
};

function initApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainPage').style.display = 'block';
  document.getElementById('userNameDisplay').innerText = App.user.nombre;
  
  // Aplicar seguridad de administrador/supervisor
  const esAdmin = App.user.rol === 'Superusuario' || App.user.rol === 'Administrador';
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = esAdmin ? 'block' : 'none');
  
  // Abrir sección inicial según el rol
  showSection(App.user.rol === 'Supervisor' ? 'calidad' : 'dashboard');
}

// --- 2. NAVEGACIÓN (Este es el nombre que usan tus botones del menú) ---
function showSection(sectionId) {
  // 1. Escondemos todas las secciones (usando el ID 'section-' que tienes en el HTML)
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
  
  // 2. Mostramos la sección elegida
  const target = document.getElementById('section-' + sectionId);
  if (target) {
    target.style.display = 'block';
  } else {
    console.error("No se encontró la sección: section-" + sectionId);
  }

  // 3. Cargamos los datos automáticamente para esa pestaña
  if (sectionId === 'dashboard') loadDashboard();
  if (sectionId === 'clientes') loadClientes();
  if (sectionId === 'trabajadores') loadTrabajadores();
  if (sectionId === 'modelos') loadModelos();
  if (sectionId === 'produccion') loadProduccion();
}

// --- 3. CARGA DE DATOS (Dashboard y Tablas) ---
async function loadDashboard() {
  // Llama a la cocina para traer los números
  const stats = await App.call('getDashboardStats', 'mes', 2026, 3);
  // Aquí puedes poner las funciones que dibujan tus gráficas
  console.log("Estadísticas cargadas:", stats);
}

async function loadClientes() {
  const lista = await App.call('getClientesActivos');
  const contenedor = document.getElementById('listaClientes'); // ID que usas en el HTML
  if (contenedor) {
    contenedor.innerHTML = lista.map(c => `
      <div class="card-item">
        <img src="${c.LogoCliente || ''}" width="40">
        <span>${c.Cliente}</span>
        <button onclick="editCliente('${c.ID_Cliente}')">Editar</button>
      </div>`).join('');
  }
}

// --- 4. LÓGICA DE PIEZAS (Tu regla de oro) ---
function updateProductionCalculo() {
  const cant = parseInt(document.getElementById('input-cantidad').value) || 0;
  // Regla: 1 suéter = 1 Frente + 1 Espalda + 2 Mangas
  document.getElementById('input-frentes').value = cant;
  document.getElementById('input-espaldas').value = cant;
  document.getElementById('input-mangas').value = cant * 2;
}

// --- 5. LOGIN Y LOGOUT (Los nombres que usa tu index.html) ---
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
