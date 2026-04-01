/**
 * TEJILOOK ERP - VERSIÓN CONSTRUCTORA
 * Si no encuentra la sección en el HTML, la crea automáticamente.
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
          console.error("Error en cocina:", err);
          resolve(null);
        })[fn](...args);
    });
  }
};

// --- 1. NAVEGACIÓN INTELIGENTE ---
function navigate(sectionId) {
  console.log("=== Abriendo sección: " + sectionId + " ===");
  
  const mainContainer = document.getElementById('main'); // ID 18 de tu lista
  if (!mainContainer) return alert("No se encontró el contenedor principal 'main'");

  // 1. Ocultar todo lo que esté dentro de main
  Array.from(mainContainer.children).forEach(child => child.style.display = 'none');

  // 2. ¿Existe la sección? Si no, la creamos
  let target = document.getElementById('sec-' + sectionId);
  if (!target) {
    console.log("🛠️ Creando mesa para: " + sectionId);
    target = document.createElement('div');
    target.id = 'sec-' + sectionId;
    target.className = 'content-section';
    mainContainer.appendChild(target);
  }
  
  target.style.display = 'block';
  
  // Actualizar el título de la página (ID 14 de tu lista)
  const title = document.getElementById('pageTitle');
  if (title) title.innerText = sectionId.toUpperCase();

  // 3. Mandar llamar a los datos
  ejecutarCargador(sectionId, target);
}

// --- 2. CARGADORES DE DATOS (ACTUALIZADO CON TODOS LOS MÓDULOS) ---
async function ejecutarCargador(id, contenedor) {
  // Limpiar mensaje anterior
  contenedor.innerHTML = `<p style="padding:20px;">⌛ Cargando información de ${id}...</p>`;

  if (id === 'dashboard') {
    contenedor.innerHTML = "<h3>Panel de Control</h3><p>Resumen general de la fábrica.</p>";
  }
  
  if (id === 'entradas' || id === 'ver-entradas') {
    const datos = await App.call('getEntradas');
    dibujarTabla(contenedor, "ENTRADAS DE MATERIAL", datos, ['FechaEntrada', 'NoOrden', 'Cuellos', 'Hilo']);
  }

  if (id === 'produccion' || id === 'ver-produccion') {
    const datos = await App.call('getProduccion');
    dibujarTabla(contenedor, "HISTORIAL DE PRODUCCIÓN", datos, ['Fecha', 'NombreTrabajador', 'Proceso', 'NoOrden']);
  }
  
  if (id === 'embolsado') {
    const datos = await App.call('getEmbolsado');
    dibujarTabla(contenedor, "PRODUCTO EMBOLSADO", datos, ['Fecha', 'NoOrden', 'Total']);
  }

  if (id === 'salidas' || id === 'ver-salidas') {
    const datos = await App.call('getSalidas');
    dibujarTabla(contenedor, "NOTAS DE SALIDA", datos, ['FechaSalida', 'NoOrden', 'NombreCliente', 'TotalSueteres']);
  }

  if (id === 'reposiciones') {
    const datos = await App.call('getReposiciones');
    dibujarTabla(contenedor, "CALIDAD Y REPOSICIONES", datos, ['Fecha', 'NoOrden', 'Estatus', 'Tipo']);
  }

  if (id === 'usuarios') {
    const datos = await App.call('getUsuarios');
    dibujarTabla(contenedor, "USUARIOS DEL SISTEMA", datos, ['Nombre', 'Usuario', 'Rol', 'Activo']);
  }
  
  if (id === 'bitacora') {
    const datos = await App.call('getBitacora');
    dibujarTabla(contenedor, "BITÁCORA DE MOVIMIENTOS", datos, ['Fecha', 'Usuario', 'Accion', 'Detalle']);
  }
}

// --- 3. DIBUJAR TABLAS PROFESIONALES ---
function dibujarTabla(contenedor, titulo, datos, columnas) {
  if (!datos || datos.length === 0) {
    contenedor.innerHTML = `<h4>${titulo}</h4><p>No hay datos en el Excel.</p>`;
    return;
  }

  let html = `<h4>${titulo} (${datos.length} registros)</h4>`;
  html += `<table style="width:100%; border-collapse: collapse; margin-top:10px;">
    <thead style="background:#444; color:white;"><tr>${columnas.map(c => `<th style="padding:10px; border:1px solid #ddd;">${c}</th>`).join('')}</tr></thead>
    <tbody>`;
  
  html += datos.map(fila => `
    <tr>${columnas.map(c => `<td style="padding:8px; border:1px solid #ddd;">${fila[c] || ''}</td>`).join('')}</tr>
  `).join('');
  
  html += `</tbody></table>`;
  contenedor.innerHTML = html;
}

// --- 4. FUNCIONES DE INTERFAZ ---

function toggleDark() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function toggleMenu() {
  const sidebar = document.getElementById('sidebar'); // ID 9 de tu lista
  if (sidebar) sidebar.classList.toggle('active');
}

window.onload = () => {
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
  
  if (App.user) {
    const main = document.getElementById('mainPage') || document.getElementById('main');
    if (main) main.style.display = 'block';
    navigate('dashboard');
  }
};
