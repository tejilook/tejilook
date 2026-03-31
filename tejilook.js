/**
 * TEJILOOK ERP - VERSIÓN INTEGRAL REESTRUCTURADA
 * Conserva el 100% de las funciones originales pero con motor optimizado.
 */

const App = {
  user: JSON.parse(localStorage.getItem('tejilook_user')) || null,
  
  // EL MOTOR: Conecta la pantalla con el servidor (Router.gs)
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

// --- 1. INICIO Y NAVEGACIÓN ---
window.onload = () => { if (!App.user) { showLogin(); } else { initApp(); } };

function initApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainPage').style.display = 'block';
  document.getElementById('userNameDisplay').innerText = App.user.nombre;
  
  const esAdmin = App.user.rol === 'Superusuario' || App.user.rol === 'Administrador';
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = esAdmin ? 'block' : 'none');
  
  // Si es Supervisor, va directo a Calidad, si no, al Dashboard
  navegar(App.user.rol === 'Supervisor' ? 'calidad' : 'dashboard');
}

function navegar(seccion) {
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
  const target = document.getElementById('sec-' + seccion);
  if (target) target.style.display = 'block';

  // CARGADORES AUTOMÁTICOS (Aquí están todos tus módulos)
  if (seccion === 'dashboard') cargarDashboard();
  if (seccion === 'clientes') cargarGenerico('CLIENTES', 'listaClientes', renderFilaCliente);
  if (seccion === 'maquilas') cargarGenerico('MAQUILAS', 'listaMaquilas', renderFilaMaquila);
  if (seccion === 'trabajadores') cargarGenerico('TRABAJADORES', 'listaTrabajadores', renderFilaTrabajador);
  if (seccion === 'modelos') cargarModelos();
  if (seccion === 'entradas') cargarEntradas();
  if (seccion === 'produccion') cargarProduccion();
  if (seccion === 'embolsado') cargarEmbolsado();
  if (seccion === 'salidas') cargarSalidas();
  if (seccion === 'calidad') cargarReposiciones();
  if (seccion === 'bitacora') cargarBitacora();
}

// --- 2. MÓDULOS DE "CATÁLOGOS" (Clientes, Maquilas, Trabajadores) ---
async function cargarGenerico(tabla, contenedorId, funcRender) {
  const lista = await App.call('get' + tabla.charAt(0) + tabla.slice(1).toLowerCase());
  const html = lista.map(item => funcRender(item)).join('');
  document.getElementById(contenedorId).innerHTML = html || '<p>No hay registros.</p>';
}

const renderFilaCliente = (c) => `
  <div class="item-card">
    <img src="${c.LogoCliente || ''}" class="img-mini">
    <span>${c.Cliente}</span>
    <button onclick="abrirEditarCliente('${c.ID_Cliente}')">Editar</button>
  </div>`;

// --- 3. MÓDULO DE MODELOS (Con lógica de tallas dinámicas) ---
async function cargarModelos() {
  const lista = await App.call('getAllModelos');
  const tabla = document.getElementById('tablaModelos');
  tabla.innerHTML = lista.map(m => `
    <tr>
      <td>${m.NoOrden}</td>
      <td>${m.Modelo}</td>
      <td>${m.NombreCliente}</td>
      <td><button onclick="verExpediente('${m.NoOrden}')">Ver Detalle</button></td>
    </tr>`).join('');
}

// --- 4. MÓDULO DE PRODUCCIÓN (Regla 1 suéter = 4 piezas) ---
function calcularPiezasProduccion() {
  const cant = parseInt(document.getElementById('prod_cant').value) || 0;
  // 1 suéter = 1 Frente + 1 Espalda + 2 Mangas
  document.getElementById('prod_frentes').value = cant;
  document.getElementById('prod_espaldas').value = cant;
  document.getElementById('prod_mangas').value = cant * 2;
}

async function guardarProduccion() {
  const datos = {
    ID_Trabajador: document.getElementById('prod_trab').value,
    NoOrden: document.getElementById('prod_orden').value,
    Proceso: document.getElementById('prod_proc').value,
    Tallas: [{
      Talla: document.getElementById('prod_talla').value,
      Frentes: document.getElementById('prod_frentes').value,
      Espaldas: document.getElementById('prod_espaldas').value,
      Mangas: document.getElementById('prod_mangas').value
    }]
  };
  const res = await App.call('registrarProduccion', datos);
  if (res.ok) { alert("¡Guardado!"); navegar('produccion'); }
}

// --- 5. MÓDULO DE SALIDAS (Bultos y Totales) ---
function agregarFilaBulto() {
  const tabla = document.getElementById('tablaBultos').getElementsByTagName('tbody')[0];
  const fila = tabla.insertRow();
  fila.innerHTML = `
    <td><input type="text" class="b_talla"></td>
    <td><input type="number" class="b_cant" onchange="recalcularTotalSalida()"></td>
    <td><input type="number" class="b_pz" onchange="recalcularTotalSalida()"></td>
    <td><span class="b_subtotal">0</span></td>`;
}

function recalcularTotalSalida() {
  let total = 0;
  document.querySelectorAll('#tablaBultos tbody tr').forEach(tr => {
    const cant = parseInt(tr.querySelector('.b_cant').value) || 0;
    const pz = parseInt(tr.querySelector('.b_pz').value) || 0;
    const sub = cant * pz;
    tr.querySelector('.b_subtotal').innerText = sub;
    total += sub;
  });
  document.getElementById('totalSalida').innerText = total;
}

// --- 6. GESTIÓN DE IMÁGENES Y FOTOS ---
async function procesarFoto(input, prefijo, idRef) {
  const base64 = await comprimirImagen(input);
  const nombre = prefijo + "_" + idRef;
  // El servidor decidirá en qué carpeta guardarla según el prefijo
  return await App.call('uploadImage', base64, "AUTO", nombre);
}

function comprimirImagen(input) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 1000; // Calidad profesional pero ligera
        let w = img.width, h = img.height;
        if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
        else if (h > MAX) { w *= MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  });
}

// --- 7. SESIÓN Y LOGIN ---
async function doLogin() {
  const creds = { usuario: document.getElementById('l_user').value, password: document.getElementById('l_pass').value };
  const res = await App.call('loginUsuario', creds);
  if (res.ok) {
    localStorage.setItem('tejilook_user', JSON.stringify(res.user));
    App.user = res.user;
    initApp();
  } else { alert(res.msg); }
}

function doLogout() {
  App.call('logCierreSesion');
  localStorage.removeItem('tejilook_user');
  location.reload();
}
