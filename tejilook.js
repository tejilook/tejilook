/**
 * TEJILOOK ERP - MOTOR INTEGRAL DE PRUEBA
 * Este código contiene la lógica para TODOS los módulos usando un sistema de "Plantillas".
 */

const App = {
  user: JSON.parse(localStorage.getItem('tejilook_user')) || null,
  
  // EL MOTOR: Llama a la cocina (Router.gs) y muestra el cargando
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

// --- 1. ARRANQUE DEL SISTEMA ---
window.onload = () => {
  if (!App.user) { 
    document.getElementById('loginPage').style.display = 'block'; 
  } else { 
    initApp(); 
  }
};

function initApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('mainPage').style.display = 'block';
  document.getElementById('userNameDisplay').innerText = App.user.nombre;
  
  // Esconder botones de admin si es Supervisor
  const esAdmin = App.user.rol === 'Superusuario' || App.user.rol === 'Administrador';
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = esAdmin ? 'block' : 'none');
  
  navegar(App.user.rol === 'Supervisor' ? 'calidad' : 'dashboard');
}

// --- 2. NAVEGADOR UNIVERSAL (Aquí se cargan todos tus módulos) ---
function navegar(seccion) {
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
  const target = document.getElementById('sec-' + seccion);
  if (target) target.style.display = 'block';

  // El sistema decide qué cargar basándose en la sección
  const modulos = {
    'clientes': () => cargarModulo('CLIENTES', 'listaClientes', ['Cliente', 'Activo']),
    'maquilas': () => cargarModulo('MAQUILAS', 'listaMaquilas', ['Maquila', 'Destino']),
    'trabajadores': () => cargarModulo('TRABAJADORES', 'listaTrabajadores', ['NombreTrabajador', 'Puesto']),
    'modelos': () => cargarModulo('MODELOS', 'tablaModelos', ['NoOrden', 'Modelo', 'NombreCliente']),
    'produccion': cargarProduccion,
    'calidad': cargarReposiciones,
    'dashboard': cargarDashboard
  };

  if (modulos[seccion]) modulos[seccion]();
}

// --- 3. GENERADOR DE TABLAS (La razón por la que el código es corto) ---
async function cargarModulo(tabla, contenedorId, columnas) {
  const lista = await App.call('get' + tabla.charAt(0) + tabla.slice(1).toLowerCase());
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  // Crea la tabla automáticamente sin repetir código 18 veces
  let html = `<table class="table"><thead><tr>${columnas.map(c => `<th>${c}</th>`).join('')}<th>Acciones</th></tr></thead><tbody>`;
  html += lista.map(item => `
    <tr>
      ${columnas.map(c => `<td>${item[c] || ''}</td>`).join('')}
      <td><button onclick="editarRegistro('${tabla}', '${item[Object.keys(item)[0]]}')">📝</button></td>
    </tr>`).join('');
  html += `</tbody></table>`;
  contenedor.innerHTML = html;
}

// --- 4. LÓGICA DE PRODUCCIÓN (Regla de Oro: 1 suéter = 4 piezas) ---
function calcularPiezas() {
  const cant = parseInt(document.getElementById('prod_cantidad').value) || 0;
  // 1 suéter = 1 Frente + 1 Espalda + 2 Mangas
  document.getElementById('prod_frentes').value = cant;
  document.getElementById('prod_espaldas').value = cant;
  document.getElementById('prod_mangas').value = cant * 2;
}

// --- 5. COMPRESIÓN DE IMÁGENES (Para no llenar tu Drive) ---
async function subirImagen(input, prefijo) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const MAX = 800; // Tamaño ligero
      let w = img.width, h = img.height;
      if (w > MAX) { h *= MAX / w; w = MAX; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      await App.call('uploadImage', base64, "AUTO", prefijo + "_" + Date.now());
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

// --- 6. LOGIN Y SESIÓN ---
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
