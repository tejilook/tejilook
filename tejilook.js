/**
 * TEJILOOK ERP - VERSIÓN CATÁLOGOS Y ALTAS
 */

const App = {
  user: JSON.parse(localStorage.getItem('tejilook_user')) || {nombre: "Carlos", rol: "Administrador"},
  
  call: function(fn, ...args) {
    const loader = document.getElementById('loginLoading') || document.getElementById('loadingOverlay');
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
          resolve([]);
        })[fn](...args);
    });
  }
};

// --- 1. NAVEGACIÓN ---
function navigate(sectionId) {
  const mainContainer = document.getElementById('main');
  if (!mainContainer) return;

  Array.from(mainContainer.children).forEach(child => child.style.display = 'none');

  let target = document.getElementById('sec-' + sectionId);
  if (!target) {
    target = document.createElement('div');
    target.id = 'sec-' + sectionId;
    target.className = 'content-section';
    mainContainer.appendChild(target);
  }
  
  target.style.display = 'block';
  ejecutarCargador(sectionId, target);
}

// --- 2. CARGADORES (Clientes, Maquilas, Trabajadores, Modelos) ---
async function ejecutarCargador(id, contenedor) {
  contenedor.innerHTML = `<p style="padding:20px;">⌛ Cargando ${id}...</p>`;

  // MAPEO DE CATÁLOGOS
  const catalogos = {
    'clientes': { fn: 'getClientes', tit: 'CATÁLOGO DE CLIENTES', col: ['Cliente', 'Activo'], modal: 'modalCliente' },
    'maquilas': { fn: 'getMaquilas', tit: 'LISTA DE MAQUILAS', col: ['Maquila', 'Destino', 'Activo'], modal: 'modalMaquila' },
    'trabajadores': { fn: 'getTrabajadores', tit: 'NUESTRO PERSONAL', col: ['NombreTrabajador', 'Puesto', 'Activo'], modal: 'modalTrabajador' },
    'modelos': { fn: 'getModelos', tit: 'CATÁLOGO DE MODELOS', col: ['NoOrden', 'Modelo', 'NombreCliente'], modal: 'modalModelo' },
    'usuarios': { fn: 'getUsuarios', tit: 'USUARIOS DEL SISTEMA', col: ['Nombre', 'Usuario', 'Rol'], modal: 'modalUsuario' }
  };

  if (catalogos[id]) {
    const c = catalogos[id];
    const datos = await App.call(c.fn);
    dibujarTablaCatalogo(contenedor, c.tit, datos, c.col, c.modal);
  } else {
    // Otros módulos (Producción, Entradas, etc.)
    if (id === 'dashboard') contenedor.innerHTML = "<h3>Panel de Control</h3>";
    if (id === 'entradas') {
      const datos = await App.call('getEntradas');
      dibujarTablaSimple(contenedor, "ENTRADAS", datos, ['FechaEntrada', 'NoOrden', 'Cuellos']);
    }
    if (id === 'produccion') {
      const datos = await App.call('getProduccion');
      dibujarTablaSimple(contenedor, "PRODUCCIÓN", datos, ['Fecha', 'NombreTrabajador', 'Proceso', 'NoOrden']);
    }
  }
}

// --- 3. DIBUJAR TABLAS CON BOTÓN DE ALTA ---
function dibujarTablaCatalogo(contenedor, titulo, datos, columnas, modalId) {
  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px;">
      <h3 style="margin:0;">${titulo}</h3>
      <button onclick="abrirAlta('${modalId}')" style="background:#28a745; color:white; padding:10px; border:none; border-radius:5px; cursor:pointer;">
        + Agregar Nuevo
      </button>
    </div>`;
  
  html += `<table style="width:100%; border-collapse: collapse;">
    <thead style="background:#f4f4f4;"><tr>${columnas.map(c => `<th style="padding:10px; border-bottom:2px solid #ddd;">${c}</th>`).join('')}<th>Acción</th></tr></thead>
    <tbody>`;
  
  html += datos.map(fila => `
    <tr>${columnas.map(c => `<td style="padding:10px; border-bottom:1px solid #ddd;">${fila[c] || ''}</td>`).join('')}
    <td style="padding:10px; border-bottom:1px solid #ddd;"><button onclick="alert('Editar próximamente')">📝</button></td></tr>
  `).join('');
  
  html += `</tbody></table>`;
  contenedor.innerHTML = html;
}

function dibujarTablaSimple(contenedor, titulo, datos, columnas) {
  let html = `<h3>${titulo}</h3><table style="width:100%; border-collapse:collapse;">
    <thead><tr>${columnas.map(c => `<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${datos.map(f => `<tr>${columnas.map(c => `<td>${f[c] || ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  contenedor.innerHTML = html;
}

// --- 4. FUNCIONES PARA MODALES (ALTAS) ---

function abrirAlta(modalId) {
  console.log("Intentando abrir modal:", modalId);
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex'; // Tus modales usan flex o block
  } else {
    alert("No se encontró el formulario para esta alta: " + modalId);
  }
}

// Función para cerrar modales (asumiendo que tus modales tienen una X o fondo para cerrar)
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'none';
}

function toggleDark() { document.body.classList.toggle('dark-mode'); }
