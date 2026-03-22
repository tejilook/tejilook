let currentView='', currentUser=null;
let _clientes=[], _modelos=[], _maquilas=[], _trabajadores=[]; let isDark = localStorage.getItem('dark')==='1'; if(isDark) document.documentElement.setAttribute('data-theme','dark'); function navigate(view, param){ currentView=view; try{ window.location.hash=view; }catch(e){} document.querySelectorAll('.nav-item,.nav-sub-item').forEach(el=>el.classList.remove('active')); 

const titles={ dashboard:'Dashboard', clientes:'Clientes', maquilas:'Maquilas', trabajadores:'Trabajadores', modelos:'Modelos / Órdenes', entradas:'Entradas', produccion:'Producción Trabajadores', embolsado:'Embolsado', salidas:'Salida a Maquila', buscar:'Buscar por NoOrden', 'ver-entradas':'Ver Entradas', 'ver-produccion':'Ver Producción', 'ver-salidas':'Ver Salidas', usuarios:'Usuarios', bitacora:'Bitácora', configuracion:'Configuración', reposiciones:'Reposiciones' }; document.getElementById('pageTitle').textContent = titles[view]||view; document.getElementById('main').innerHTML='<div class="loading"><div class="spinner"></div> Cargando...</div>'; const fns={ dashboard:renderDashboard, clientes:renderClientes, maquilas:renderMaquilas, trabajadores:renderTrabajadores, modelos:renderModelos, entradas:renderEntradas, produccion:renderProduccion, embolsado:renderEmbolsado, salidas:renderSalidas, buscar:()=>renderBuscar(param), 'ver-entradas':renderVerEntradas, 'ver-produccion':renderVerProduccion, 'ver-salidas':renderVerSalidas, usuarios:renderUsuarios, bitacora:renderBitacora, configuracion:renderConfiguracion, reposiciones:renderReposiciones }; if(fns[view]) fns[view](); else document.getElementById('main').innerHTML='<div class="empty-state"><i class="fas fa-tools"></i><p>Vista en construcción</p></div>'; if(window.innerWidth<768){
  document.getElementById('sidebar').classList.remove('open');
  var ov=document.getElementById('sidebarOverlay');
  if(ov) ov.classList.remove('open');
} } function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
  var ov = document.getElementById('sidebarOverlay');
  if(ov) ov.classList.toggle('open');
} function toggleMenu(el){ el.classList.toggle('open'); const sub=el.nextElementSibling; if(sub&&sub.classList.contains('nav-submenu')) sub.classList.toggle('open'); } function toggleDark(){ isDark=!isDark; localStorage.setItem('dark',isDark?'1':'0'); document.documentElement.setAttribute('data-theme',isDark?'dark':''); document.getElementById('darkIcon').className=isDark?'fas fa-sun':'fas fa-moon'; } function openModal(id){ document.getElementById(id).classList.add('open'); } function closeModal(id){ document.getElementById(id).classList.remove('open'); } document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{ if(e.target===o) o.classList.remove('open'); })); function toast(msg,type='success'){ const icons={success:'fas fa-check-circle',danger:'fas fa-exclamation-circle',warning:'fas fa-triangle-exclamation'}; const t=document.createElement('div'); t.className=`toast ${type}`; t.innerHTML=`<i class="${icons[type]||icons.success}"></i> ${msg}`; document.getElementById('toast-container').appendChild(t); setTimeout(()=>t.remove(),3800); } function fmt(date){ if(!date) return '—'; const d=new Date(date); if(isNaN(d)) return date; return d.toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'}); } function badge(text){ const map={ 'SI':'<span class="badge badge-success">Activo</span>', 'NO':'<span class="badge badge-danger">Inactivo</span>', 'Superusuario':'<span class="badge badge-danger">Superusuario</span>', 'Administrador':'<span class="badge badge-info">Admin</span>', 'Supervisor':'<span class="badge badge-warning">Supervisor</span>', }; return map[text]||`<span class="badge badge-gray">${text||'—'}</span>`; } function call(fn,...args){ return new Promise((res,rej)=>{ let r=google.script.run.withSuccessHandler(res).withFailureHandler(rej); r[fn](...args); }); } function fileToBase64(file){
  return new Promise(function(res, rej){
    var MAX_W = 800;
    var QUALITY = 0.70;
    var reader = new FileReader();
    reader.onerror = rej;
    reader.onload = function(e){
      var img = new Image();
      img.onerror = rej;
      img.onload = function(){
        // Si ya es pequeña no reescalar
        var w = img.width, h = img.height;
        if(w > MAX_W){
          h = Math.round(h * MAX_W / w);
          w = MAX_W;
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        var compressed = canvas.toDataURL('image/jpeg', QUALITY);
        var originalKB  = Math.round(file.size/1024);
        var compressedKB = Math.round(compressed.length * 0.75 / 1024);
        console.log('Imagen: '+originalKB+'KB → '+compressedKB+'KB ('+w+'x'+h+'px)');
        res(compressed);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
} function renderDashboard(){
  var ahora = new Date();
  var anioActual = ahora.getFullYear();

  // Inicializar filtros
  if(!window._dashAnio) window._dashAnio = anioActual;
  if(window._dashMes === undefined) window._dashMes = ahora.getMonth(); // mes actual por defecto

  // Generar años desde 2024 hasta año actual + 1
  var anioOpts = '';
  for(var y = 2024; y <= anioActual + 1; y++){
    anioOpts += '<option value="'+y+'"'+(y===window._dashAnio?' selected':'')+'>'+y+'</option>';
  }

  // Meses
  var meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var mesOpts = '<option value=""'+(window._dashMes===''?' selected':'')+'>Todo el año</option>';
  meses.forEach(function(m,i){
    mesOpts += '<option value="'+i+'"'+(window._dashMes===i?' selected':'')+'>'+m+'</option>';
  });

  document.getElementById('main').innerHTML =
    '<div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">'      +'<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'        +'<select class="form-control form-select" id="dashAnioSel" style="width:90px;padding:6px 10px;font-size:13px" onchange="dashFiltroChange()">'          +anioOpts        +'</select>'        +'<select class="form-control form-select" id="dashMesSel" style="width:140px;padding:6px 10px;font-size:13px" onchange="dashFiltroChange()">'          +mesOpts        +'</select>'      +'</div>'    +'</div>'    +'<div id="dashContent" style="padding:0 24px 32px">'      +'<div class="loading"><div class="spinner"></div> Cargando estadísticas...</div>'    +'</div>';

  dashCargar();
}

function dashFiltroChange(){
  var sel = document.getElementById('dashAnioSel');
  var mes = document.getElementById('dashMesSel');
  if(sel) window._dashAnio = parseInt(sel.value);
  if(mes) window._dashMes = mes.value === '' ? '' : parseInt(mes.value);
  dashCargar();
}

function dashSetPeriodo(p){
  // kept for compatibility
  window._dashPeriodo = p;
  renderDashboard();
}

function dashCargar(){
  var anio = window._dashAnio || new Date().getFullYear();
  var mes  = (window._dashMes !== undefined && window._dashMes !== '') ? window._dashMes : '';
  var meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  // Label para mostrar en gráficas
  window._dashPeriodoLabel = mes !== '' ? meses[mes]+' '+anio : 'Año '+anio;

  call('getDashboardStats', null, anio, mes).then(function(d){
    if(!d){
      document.getElementById('dashContent').innerHTML='<div class="empty-state"><i class="fas fa-chart-pie"></i><p>Sin datos</p></div>';
      return;
    }
    dashRender(d);
  }).catch(function(e){
    document.getElementById('dashContent').innerHTML='<div style="color:var(--danger);padding:20px">Error: '+e.message+'</div>';
  });
}

function dashRender(d){
  var p   = d.porTrabajador || [];
  var pm  = d.porMaquila    || [];
  var pa  = d.porProceso    || {};
  var periodoLabel = window._dashPeriodoLabel || '';
  var procKeys = Object.keys(pa);

  var totalSueteresSalidas = pm.reduce(function(s,m){ return s+(m.sueteres||0); },0);
  var topGeneral = p.length ? p[0] : null;

  var topPorArea = {};
  p.forEach(function(t){
    Object.keys(t.porProceso).forEach(function(proc){
      var v = t.porProceso[proc];
      if(!topPorArea[proc] || v > topPorArea[proc].piezas)
        topPorArea[proc] = { nombre: t.nombre, piezas: v };
    });
  });
  var topMaq = pm.length ? pm[0] : null;

  // ── KPIs ──────────────────────────────────────────────────────────
  var kpiHtml =
    '<div class="dash-kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px">'
    +dashKpi('fas fa-shirt','Suéteres procesados '+periodoLabel, totalSueteresSalidas, 'var(--primary)', 'Total enviados a maquila')
    +dashKpi('fas fa-trophy','Top trabajador', topGeneral ? topGeneral.nombre : '—', 'var(--warning)', topGeneral ? topGeneral.piezas+' piezas' : '')
    +Object.keys(topPorArea).map(function(proc){
      var t = topPorArea[proc];
      return dashKpi('fas fa-star','Top '+proc, t.nombre, 'var(--success)', t.piezas+' piezas');
    }).join('')
    +dashKpi('fas fa-truck-fast','Top maquila', topMaq ? topMaq.nombre : '—', 'var(--info)', topMaq ? topMaq.sueteres+' suéteres' : '')
    +'</div>';

  // ── Fila 1: Piezas trabajadores + Salidas maquila + Reposiciones ──
  var fila1 =
    '<div class="dash-fila1" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">'
      +'<div class="card" style="padding:20px">'
        +'<div style="font-weight:700;font-size:15px;margin-bottom:4px">Piezas por Trabajador</div>'
        +'<div style="font-size:12px;color:var(--text-muted);margin-bottom:16px">'+periodoLabel+' — F+E+M por persona</div>'
        +'<div id="chartTrabajadores"></div>'
      +'</div>'
      +'<div class="card" style="padding:20px">'
        +'<div style="font-weight:700;font-size:15px;margin-bottom:4px">Salidas por Maquila</div>'
        +'<div style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Suéteres enviados '+periodoLabel+'</div>'
        +'<div id="chartMaquilas"><div class="loading"><div class="spinner"></div></div></div>'
      +'</div>'
      +'<div class="card" style="padding:20px">'
        +'<div style="font-weight:700;font-size:15px;margin-bottom:4px">Reposiciones</div>'
        +'<div style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Faltantes vs Defectos '+periodoLabel+'</div>'
        +'<div id="dashReposChart"><div class="loading"><div class="spinner"></div></div></div>'
      +'</div>'
    +'</div>';

  // ── Fila 2: Maquina defectos + Tejedor faltantes + Tejedor defectos ──
  var fila2 =
    '<div class="dash-fila2" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">'
      +'<div class="card" style="padding:20px">'
        +'<div style="font-weight:700;font-size:15px;margin-bottom:4px">Máquina con más defectos</div>'
        +'<div style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Solo defectos '+periodoLabel+'</div>'
        +'<div id="dashMaqDefChart"><div class="loading"><div class="spinner"></div></div></div>'
      +'</div>'
      +'<div class="card" style="padding:20px">'
        +'<div style="font-weight:700;font-size:15px;margin-bottom:4px">Tejedor con más faltantes</div>'
        +'<div style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Solo faltantes '+periodoLabel+'</div>'
        +'<div id="dashTejFaltChart"><div class="loading"><div class="spinner"></div></div></div>'
      +'</div>'
      +'<div class="card" style="padding:20px">'
        +'<div style="font-weight:700;font-size:15px;margin-bottom:4px">Tejedor con más defectos</div>'
        +'<div style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Solo defectos '+periodoLabel+'</div>'
        +'<div id="dashTejDefChart"><div class="loading"><div class="spinner"></div></div></div>'
      +'</div>'
    +'</div>';

  // ── Fila 3: Comparativa full width ────────────────────────────────
  var fila3 =
    '<div class="card" style="padding:20px;margin-bottom:16px">'
      +'<div style="font-weight:700;font-size:15px;margin-bottom:4px">Comparativa por Proceso</div>'
      +'<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Piezas por trabajador — '+periodoLabel+'</div>'
      +'<div class="dash-comparativa" style="overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;padding-bottom:6px">'
        +'<table class="table" style="font-size:12px;min-width:500px">'
          +'<thead style="position:sticky;top:0;z-index:3"><tr>'
            +'<th style="position:sticky;left:0;background:var(--surface2);z-index:4">Trabajador</th>'
            +procKeys.map(function(pr){ return '<th style="text-align:center">'+pr+'</th>'; }).join('')
            +'<th style="text-align:right;white-space:nowrap">Total</th>'
          +'</tr></thead><tbody>'
          +p.map(function(t){
            return '<tr>'
              +'<td style="position:sticky;left:0;background:var(--surface);z-index:1"><strong>'+t.nombre+'</strong></td>'
              +procKeys.map(function(proc){
                var v = t.porProceso[proc]||0;
                return '<td style="text-align:center">'+(v?'<span class="badge badge-info">'+v+'</span>':'<span style="color:var(--text-light)">—</span>')+'</td>';
              }).join('')
              +'<td style="text-align:right"><strong style="color:var(--primary)">'+t.piezas+'</strong></td>'
            +'</tr>';
          }).join('')
          +'</tbody></table>'
      +'</div>'
    +'</div>';

  document.getElementById('dashContent').innerHTML = kpiHtml + fila1 + fila2 + fila3;

  var colors = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

  // Barras trabajadores
  var maxT = p.length ? p[0].piezas : 1;
  document.getElementById('chartTrabajadores').innerHTML = p.slice(0,8).map(function(t,i){
    var pct = maxT ? Math.round(t.piezas/maxT*100) : 0;
    var col = colors[i%colors.length];
    return '<div style="margin-bottom:10px">'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:3px;gap:8px">'
        +'<span style="font-size:12px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">'+t.nombre+'</span>'
        +'<span style="font-size:12px;font-weight:700;color:'+col+';flex-shrink:0">'+t.piezas+' pz</span>'
      +'</div>'
      +'<div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">'
        +'<div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:4px;transition:width .5s"></div>'
      +'</div>'
    +'</div>';
  }).join('') || '<div class="empty-state"><i class="fas fa-inbox"></i><p>Sin datos</p></div>';

  dashCargarMaquilas(pm);
  dashCargarReposiciones(null);
  // Cargar reposiciones una sola vez para los 3 cards siguientes
  call('getReposiciones').then(function(repos){
    window._dashReposCache = (repos||[]).map(function(r){
      // Normalizar fecha — puede venir como timestamp, string, o Date serializado
      var raw = r.fecha;
      if(raw && typeof raw === 'number'){
        // Timestamp de Sheets (milisegundos desde epoch)
        var d = new Date(raw);
        r.fecha = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      }
      return r;
    });
    dashCargarMaqDefectos();
    dashCargarTejFaltantes();
    dashCargarTejDefectos();
  }).catch(function(){
    dashCargarMaqDefectos();
    dashCargarTejFaltantes();
    dashCargarTejDefectos();
  });
}

function dashKpi(icon, label, value, color, sub){
  var valStr = String(value);
  // Shrink font for long values (names etc)
  var valSize = valStr.length > 14 ? '13px' : valStr.length > 8 ? '16px' : '20px';
  return '<div class="card" style="padding:14px;display:flex;gap:12px;align-items:center;min-width:0">'
    +'<div style="width:40px;height:40px;border-radius:10px;background:'+color+'22;display:flex;align-items:center;justify-content:center;flex-shrink:0">'
      +'<i class="'+icon+'" style="color:'+color+';font-size:17px"></i>'
    +'</div>'
    +'<div style="min-width:0;flex:1;overflow:hidden">'
      +'<div style="font-size:'+valSize+';font-weight:700;font-family:\'Space Grotesk\',sans-serif;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+valStr+'</div>'
      +'<div style="font-size:11px;color:var(--text-muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+label+'</div>'
      +(sub?'<div style="font-size:11px;color:'+color+';margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+sub+'</div>':'')
    +'</div>'
  +'</div>';
}


function dashDrawDonut(canvasId, labels, values, colors){
  var canvas = document.getElementById(canvasId);
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var total = values.reduce(function(s,v){ return s+v; }, 0);
  if(!total){ ctx.clearRect(0,0,canvas.width,canvas.height); return; }

  var cx = canvas.width/2, cy = 100, r = 80, ri = 52;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  var start = -Math.PI/2;
  values.forEach(function(v, i){
    var slice = (v/total)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx, cy, r, start, start+slice);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    start += slice;
  });

  // Hueco central
  ctx.beginPath();
  ctx.arc(cx, cy, ri, 0, Math.PI*2);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#fff';
  ctx.fill();

  // Texto central
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#111';
  ctx.font = 'bold 20px Space Grotesk, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy);
  ctx.font = '11px DM Sans, sans-serif';
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#666';
  ctx.fillText('total pzas', cx, cy+18);

  // Leyenda
  var ly = 210;
  labels.forEach(function(lbl, i){
    var x = (i%2===0) ? 10 : cx+10;
    var y = ly + Math.floor(i/2)*22;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(x, y, 10, 10);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#111';
    ctx.font = '11px DM Sans, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(lbl+' ('+values[i]+')', x+14, y);
  });
}
function renderEmbLineas(){ var html=''; _embLineas.forEach(function(l,i){ var tot=(l.bolsas||0)*(l.pzBolsa||0); html+='<div style="display:grid;grid-template-columns:120px 130px 130px 110px 36px;gap:8px;align-items:end;padding:10px 0;border-bottom:1px solid var(--border)">'; html+='<div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Talla</div><input class="form-control" style="padding:6px 10px" value="'+l.talla+'" placeholder="CH / M / G" onchange="_embLineas['+i+'].talla=this.value"></div>'; html+='<div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Cant. bolsas</div><input class="form-control" type="number" min="1" style="padding:6px 10px" value="'+l.bolsas+'" onchange="_embLineas['+i+'].bolsas=+this.value;renderEmbLineas()"></div>'; html+='<div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Pzas por bolsa</div><input class="form-control" type="number" min="1" style="padding:6px 10px" value="'+l.pzBolsa+'" onchange="_embLineas['+i+'].pzBolsa=+this.value;renderEmbLineas()"></div>'; html+='<div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Total suéteres</div><div style="background:var(--surface-2);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:6px 10px;font-weight:700;color:var(--primary);font-size:15px;text-align:center">'+tot+'</div></div>'; html+='<div style="padding-bottom:2px"><button class="btn btn-ghost btn-sm btn-icon" onclick="_embLineas.splice('+i+',1);renderEmbLineas()"><i class="fas fa-times"></i></button></div>'; html+='</div>'; }); document.getElementById('embLineasBody').innerHTML=html; calcEmbTotal(); }

function guardarEmbolsado(){ var noOrden=document.getElementById('embOrden').value; var editId=document.getElementById('embEditId').value; if(!noOrden){toast('Selecciona un NoOrden','danger');return;} var lineas=_embLineas.filter(function(l){return l.talla&&l.bolsas>0&&l.pzBolsa>0;}); if(!lineas.length){toast('Agrega al menos una línea con talla y cantidades','danger');return;} var tallasMap={}; lineas.forEach(function(l){if(!tallasMap[l.talla])tallasMap[l.talla]={talla:l.talla,grupos:[]};tallasMap[l.talla].grupos.push({cantidadBolsas:l.bolsas,pzPorBolsa:l.pzBolsa});}); var tallas=Object.values(tallasMap); var data={id:editId,fecha:document.getElementById('embFecha').value,noOrden:noOrden,observaciones:document.getElementById('embObs').value,tallas:tallas}; var fn=editId?'editarEmbolsado':'registrarEmbolsado'; call(fn,data).then(function(){closeModal('modalEmbolsado');toast(editId?'Embolsado actualizado':'Embolsado registrado ✓');renderEmbolsado();;cancelarEditEmb();setTimeout(function(){cargarTablaEmbolsado();},800);}).catch(function(e){toast(e.message,'danger');}); }

function cancelarEditEmb(){ document.getElementById('embEditId').value=''; document.getElementById('embFormTitle').textContent='Nuevo Registro'; document.getElementById('btnCancelEmb').style.display='none'; document.getElementById('embOrden').value=''; document.getElementById('embObs').value=''; document.getElementById('embDisponible').style.display='none'; _embLineas=[{talla:'',bolsas:1,pzBolsa:50}]; renderEmbLineas(); }

function cargarTablaEmbolsado(){ var el=document.getElementById('tablaEmbolsado'); if(!el)return; el.innerHTML='<div class="loading"><div class="spinner"></div></div>'; call('getEmbolsadoAll').then(function(data){ if(!data.length){el.innerHTML='<div class="empty-state"><i class="fas fa-box-open"></i><p>Sin registros</p></div>';return;} _embData=data; renderTablaEmbolsadoFiltrada(); }).catch(function(e){el.innerHTML='<span style="color:var(--danger)">'+e.message+'</span>';}); }

var _embData=[];
function filtrarTablaEmbolsado(){ renderTablaEmbolsadoFiltrada(); }
function renderTablaEmbolsadoFiltrada(){ var el=document.getElementById('tablaEmbolsado'); if(!el)return; var q=(document.getElementById('embFiltroOrden')||{}).value||''; var data=q?_embData.filter(function(r){return String(r.noOrden).toLowerCase().includes(q.toLowerCase());}):_embData; if(!data.length){el.innerHTML='<div class="empty-state"><i class="fas fa-box-open"></i><p>Sin registros</p></div>';return;} var rows=''; data.forEach(function(r){ rows+='<tr>'+'<td>'+fmt(r.fecha)+'</td>'+'<td><strong>'+r.noOrden+'</strong></td>'+'<td style="white-space:nowrap">'+'<button class="btn btn-ghost btn-sm btn-icon" title="Ver detalle" onclick="verDetalleEmb(this)" data-norden="'+r.noOrden+'" data-id="'+r.id+'"><i class="fas fa-eye"></i></button> '+'<button class="btn btn-success btn-sm btn-icon" title="Imprimir reporte consolidado" onclick="imprimirReporteEmb(\''+r.noOrden+'\')"><i class="fas fa-print"></i></button> '+'<button class="btn btn-danger btn-sm btn-icon" title="Eliminar" onclick="eliminarEmb(this)" data-id="'+r.id+'"><i class="fas fa-trash"></i></button>'+'</td></tr>'; }); el.innerHTML='<div style="display:flex;gap:8px;margin-bottom:12px"><div class="search-bar" style="width:220px"><i class="fas fa-search"></i><input type="text" id="embFiltroOrden" placeholder="Filtrar por NoOrden..." oninput="filtrarTablaEmbolsado()" value="'+(((document.getElementById('embFiltroOrden')||{}).value)||'')+'"></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>NoOrden</th><th>Acc.</th></tr></thead><tbody>'+rows+'</tbody></table></div>'; }

function verDetalleEmb(btn){
  var noOrden=btn.dataset.norden;
  var regId=btn.dataset.id;
  call('getResumenEmbolsado',noOrden).then(function(r){
    if(!r.ok){toast(r.msg,'danger');return;}
    var m=r.modelo;
    var regTarget=null;
    r.registros.forEach(function(reg){if(reg.id===regId)regTarget=reg;});
    if(!regTarget){toast('Registro no encontrado','danger');return;}
    var html='<div style="font-size:13px">';
    html+='<div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--border)">';
    if(m.foto) html+='<img src="'+m.foto+'" style="width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid var(--border)">';
    html+='<div><div style="font-weight:700;font-size:15px">'+noOrden+' — '+m.modelo+'</div>';
    html+='<div style="color:var(--text-muted);font-size:12px">'+fmt(regTarget.fecha||'')+'</div></div>';
    html+='</div>';
    html+='<table style="width:100%;border-collapse:collapse">';
    html+='<thead><tr style="background:var(--surface-2)">';
    html+='<th style="padding:8px 12px;text-align:left;font-size:12px;color:var(--text-muted)">Talla</th>';
    html+='<th style="padding:8px 12px;text-align:center;font-size:12px;color:var(--text-muted)">Distribución</th>';
    html+='<th style="padding:8px 12px;text-align:center;font-size:12px;color:var(--text-muted)">Total suéteres</th>';
    html+='</tr></thead><tbody>';
    var tot=0;
    regTarget.tallas.forEach(function(t){
      html+='<tr style="border-bottom:1px solid var(--border)">';
      html+='<td style="padding:8px 12px;font-weight:600">'+t.talla+'</td>';
      html+='<td style="padding:8px 12px;text-align:center;font-size:12px;color:var(--text-muted)">'+t.grupos.map(function(g){return g.cantidadBolsas+' bolsa(s) × '+g.pzPorBolsa+' pzas';}).join('<br>')+'</td>';
      html+='<td style="padding:8px 12px;text-align:center;font-weight:700;color:var(--primary);font-size:15px">'+t.totalTalla+'</td>';
      html+='</tr>';
      tot+=t.totalTalla;
    });
    html+='<tr style="background:var(--surface-2)">';
    html+='<td colspan="2" style="padding:10px 12px;text-align:right;font-weight:700">Total general</td>';
    html+='<td style="padding:10px 12px;text-align:center;font-weight:700;color:var(--primary);font-size:16px">'+tot+' suét.</td>';
    html+='</tr>';
    html+='</tbody></table></div>';
    // Usar modal genérico o crear uno temporal
    var existing=document.getElementById('embDetalleModal');
    if(!existing){
      var overlay=document.createElement('div');
      overlay.id='embDetalleModal';
      overlay.className='modal-overlay';
      overlay.style.zIndex='9999';
      overlay.innerHTML='<div class="modal" style="max-width:520px;width:92%">'
        +'<div class="modal-header"><div class="modal-title">Detalle de Registro</div>'
        +'<button class="btn btn-ghost btn-sm btn-icon" onclick="document.getElementById(\'embDetalleModal\').classList.remove(\'open\')"><i class="fas fa-times"></i></button>'
        +'</div>'
        +'<div class="modal-body" id="embDetalleBody" style="padding:16px;max-height:70vh;overflow-y:auto"></div>'
        +'</div>';
      overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.classList.remove('open');});
      document.body.appendChild(overlay);
    }
    document.getElementById('embDetalleBody').innerHTML=html;
    document.getElementById('embDetalleModal').classList.add('open');
  }).catch(function(e){toast(e.message,'danger');});
}

function imprimirReporteEmb(noOrden){
  call('getResumenEmbolsado',noOrden).then(function(r){
    if(!r.ok){toast(r.msg,'danger');return;}
    var m=r.modelo;
    var hoy=new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'});
    var tallasMap={};
    r.registros.forEach(function(reg){
      reg.tallas.forEach(function(t){
        if(!tallasMap[t.talla])tallasMap[t.talla]={talla:t.talla,bolsasTot:0,grupos:[],total:0};
        t.grupos.forEach(function(g){
          tallasMap[t.talla].bolsasTot+=g.cantidadBolsas;
          tallasMap[t.talla].grupos.push(g.cantidadBolsas+' x '+g.pzPorBolsa);
          tallasMap[t.talla].total+=g.cantidadBolsas*g.pzPorBolsa;
        });
      });
    });
    var tallas=Object.values(tallasMap);
    var grandTotal=tallas.reduce(function(s,t){return s+t.total;},0);
    var tallaRows='';
    tallas.forEach(function(t){
      tallaRows+='<tr>'
        +'<td style="padding:7px 10px;font-weight:700;border:1px solid #000">'+t.talla+'</td>'
        +'<td style="padding:7px 10px;text-align:center;border:1px solid #000">'+t.bolsasTot+'</td>'
        +'<td style="padding:7px 10px;text-align:center;font-size:11px;border:1px solid #000">'+t.grupos.join(', ')+'</td>'
        +'<td style="padding:7px 10px;text-align:center;font-weight:700;font-size:15px;border:1px solid #000">'+t.total+'</td>'
        +'</tr>';
    });
    var fotoHtml=m.foto
      ? '<img src="'+m.foto+'" style="width:144px;height:144px;object-fit:cover;border-radius:4px;border:1px solid #000">'
      : '<div style="width:144px;height:144px;border:1px solid #000;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#555;text-align:center">Sin foto</div>';
    var cfg=window._sysConfig||{};
    var sistNombre=cfg.sistNombre||'TejiLook';
    var sistSub=cfg.sistSub||'Sistema de Control';
    var logoHtml=cfg.sistLogoUrl
      ? '<img src="'+cfg.sistLogoUrl+'" style="width:48px;height:48px;object-fit:contain">'
      : '<div style="width:48px;height:48px;background:#000;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:900">T</div>';
    var css='*{margin:0;padding:0;box-sizing:border-box}'
      +'body{font-family:Arial,sans-serif;font-size:13px;color:#000;background:#fff;padding:24px;max-width:780px;margin:0 auto}'
      +'@media print{button{display:none!important}@page{margin:12mm}}'
      +'.top-bar{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:3px solid #000;margin-bottom:18px}'
      +'.brand{display:flex;align-items:center;gap:10px}'
      +'.brand-name{font-size:20px;font-weight:900;color:#000;letter-spacing:-0.5px;line-height:1}'
      +'.brand-sub{font-size:10px;color:#333;letter-spacing:1px;text-transform:uppercase;margin-top:2px}'
      +'.doc-title{text-align:right;font-size:12px;color:#333}'
      +'.doc-title strong{display:block;font-size:15px;color:#000;font-weight:900}'
      +'.header{display:flex;gap:16px;align-items:flex-start;margin-bottom:16px;padding:12px;border:1px solid #000}'
      +'.info table{border-collapse:collapse;width:100%}'
      +'.info td{padding:3px 6px;vertical-align:top;font-size:12px}'
      +'.info td:first-child{font-weight:700;width:100px;white-space:nowrap}'
      +'.st{font-size:11px;font-weight:700;color:#000;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.8px;border-bottom:2px solid #000;padding-bottom:4px}'
      +'.dt{width:100%;border-collapse:collapse}'
      +'.dt thead tr{background:#000;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
      +'.dt th{padding:8px 10px;font-size:12px;text-align:center;border:1px solid #000}'
      +'.dt th:first-child{text-align:left}'
      +'.tr-tot td{border-top:2px solid #000;font-weight:700;padding:8px 10px}'
      +'.footer{margin-top:16px;font-size:10px;color:#555;text-align:right;border-top:1px solid #000;padding-top:6px}'
      +'.btn-print{background:#000;color:#fff;border:none;padding:10px 36px;border-radius:4px;font-size:14px;cursor:pointer;font-weight:700;display:block;margin:20px auto 0}';
    var body=''
      +'<div class="top-bar">'
        +'<div class="brand">'+logoHtml
          +'<div><div class="brand-name">'+sistNombre+'</div>'
          +'<div class="brand-sub">'+sistSub+'</div></div>'
        +'</div>'
        +'<div class="doc-title"><span>Reporte de Embolsado</span><strong>No. Orden: '+noOrden+'</strong></div>'
      +'</div>'
      +'<div class="header">'
        +fotoHtml
        +'<div class="info"><table>'
          +'<tr><td>Modelo:</td><td><strong>'+(m.modelo||'—')+'</strong></td></tr>'
          +'<tr><td>Cliente:</td><td>'+(m.nombreCliente||'—')+'</td></tr>'
          +'<tr><td>Maquila:</td><td>'+(m.nombreMaquila||'—')+'</td></tr>'
          +'<tr><td>F. Entrega:</td><td>'+(m.fechaEntrega?fmt(m.fechaEntrega):'—')+'</td></tr>'
          +'<tr><td>F. Impresión:</td><td>'+hoy+'</td></tr>'
        +'</table></div>'
      +'</div>'
      +'<div class="st">Detalle Consolidado de Embolsado</div>'
      +'<table class="dt"><thead><tr>'
        +'<th style="text-align:left">Talla</th>'
        +'<th>Total Bolsas</th>'
        +'<th>Distribución</th>'
        +'<th>Total Suéteres</th>'
      +'</tr></thead><tbody>'+tallaRows
      +'<tr class="tr-tot">'
        +'<td colspan="3" style="text-align:right;border:1px solid #000">TOTAL GENERAL</td>'
        +'<td style="text-align:center;font-size:16px;border:1px solid #000">'+grandTotal+' suét.</td>'
      +'</tr></tbody></table>'
      +'<div class="footer">'+sistNombre+' — '+sistSub+' — Generado el '+hoy+'</div>'
      +'<button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>';
    var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Embolsado '+noOrden+'</title><style>'+css+'</style></head><body>'+body+'</body></html>';
    var win=window.open('','_blank','width=860,height=720');
    win.document.write(html);
    win.document.close();
  }).catch(function(e){toast('Error: '+e.message,'danger');});
}


function eliminarEmb(btn){ var id=btn.dataset.id; if(!window.confirm('Eliminar este registro de embolsado?'))return; call('eliminarEmbolsado',id).then(function(){toast('Eliminado','danger');cargarTablaEmbolsado();}).catch(function(e){toast(e.message,'danger');}); }

// ─── SALIDAS ──────────────────────────────────────────────────────────────────
var _salidaLineas = [];   // [{talla, bultos, pzBolsa, cuello}]
var _salidaModeloCache = {};

var _salidaLineas = [];
var _salidaCuellos = [];
var _salidaModeloCache = {};

var _salidaLineas = [];   // [{talla, bultos, pzBolsa}]
var _salidaCuellos = [];  // [{talla, cantidad}]
var _salidaModeloCache = {};



function cargarTablaTrabajadores(){ cargarTablaTrabs(); }

function renderClientes(){
document.getElementById('main').innerHTML=`
<div class="page-header"><div><h1>Clientes</h1><p>El logo se sube a Drive automáticamente</p></div></div>
<div class="dual-grid">
<div class="card">
<div class="card-header"><div class="card-title" id="formClienteTitle">Nuevo Cliente</div></div>
<input type="hidden" id="clienteId">
<input type="hidden" id="clienteLogoUrl">
<div class="form-group">
<label class="form-label">Nombre del Cliente *</label>
<input class="form-control" id="clienteNombre" placeholder="Ej: Liverpool">
</div>
<div class="form-group">
<label class="form-label">Logo del Cliente</label>
<div class="img-upload-area" id="logoArea" onclick="document.getElementById('logoFile').click()">
<input type="file" id="logoFile" accept="image/*" style="display:none" onchange="previewImg(this,'logoPreview','logoArea')">
<i class="fas fa-cloud-upload-alt" style="font-size:28px;color:var(--text-light)"></i>
<p style="font-size:13px;color:var(--text-muted);margin-top:8px">Clic para subir imagen</p>
<p style="font-size:11px;color:var(--text-light)">Se guardará en Drive → Clientes_Images</p>
<img id="logoPreview" style="display:none;width:80px;height:80px;object-fit:cover;border-radius:8px;margin-top:8px">
</div>
</div>
<div class="form-group"><label class="form-label">Estado</label>
<select class="form-control form-select" id="clienteActivo"><option value="SI">Activo</option><option value="NO">Inactivo</option></select>
</div>
<div style="display:flex;gap:8px">
<button class="btn btn-primary" onclick="guardarCliente()"><i class="fas fa-save"></i> Guardar</button>
<button class="btn btn-ghost" onclick="limpiarFormCliente()"><i class="fas fa-times"></i></button>
</div>
</div>
<div class="card">
<div class="card-header">
<div class="card-title">Clientes Registrados</div>
<div class="search-bar" style="width:200px"><i class="fas fa-search"></i>
<input type="text" placeholder="Buscar..." id="buscarCliente" oninput="filtrarClientes()">
</div>
</div>
<div id="tablaClientes"><div class="loading"><div class="spinner"></div></div></div>
</div>
</div>`;
cargarTablaClientes();
}


function cargarTablaClientes(){ call('getClientes').then(function(d){ _clientes=d||[]; renderTablaClientes(_clientes); }).catch(function(e){ var el=document.getElementById('tablaClientes'); if(el) el.innerHTML='<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error: '+e.message+'</p></div>'; }); }

function cargarTablaMaquilas(){ call('getMaquilas').then(data=>{ if(!data.length){document.getElementById('tablaMaquilas').innerHTML='<div class="empty-state"><i class="fas fa-industry"></i><p>Sin maquilas</p></div>';return;} document.getElementById('tablaMaquilas').innerHTML=`<div class="table-wrap"><table class="table"><thead><tr><th>Nombre</th><th>Destino</th><th>Estado</th><th>Acc.</th></tr></thead><tbody>${data.map(m=>`<tr><td><strong>${m.maquila}</strong></td><td>${m.destino||'—'}</td><td>${badge(m.activo)}</td><td><button class="btn btn-ghost btn-sm btn-icon" onclick='editarMaquilaForm(${JSON.stringify(m).replace(/'/g,"\\'")})'><i class="fas fa-pencil"></i></button><button class="btn btn-danger btn-sm btn-icon" onclick="if(confirm('¿Desactivar?'))call('desactivarMaquila','${m.id}').then(()=>{toast('Desactivado','warning');cargarTablaMaquilas()})"><i class="fas fa-ban"></i></button><button class="btn btn-danger btn-sm btn-icon" title="Eliminar fila" onclick="if(confirm('¿ELIMINAR permanentemente?'))call('eliminarMaquila','${m.id}').then(()=>{toast('Eliminado','danger');cargarTablaMaquilas()})"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div>`; }); }

function cargarTablaTrabs(){ call('getTrabajadores').then(data=>{ if(!data.length){document.getElementById('tablaTrabs').innerHTML='<div class="empty-state"><i class="fas fa-users"></i><p>Sin trabajadores</p></div>';return;} document.getElementById('tablaTrabs').innerHTML=`<div class="table-wrap"><table class="table"><thead><tr><th>Foto</th><th>Nombre</th><th>Puesto</th><th>Estado</th><th>Acc.</th></tr></thead><tbody>${data.map(t=>`<tr><td>${t.foto?`<img src="${t.foto}" style="width:36px;height:36px;border-radius:50%;object-fit:cover">`:'<div style="width:36px;height:36px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">${t.nombre.charAt(0).toUpperCase()}</div>'}</td><td><strong>${t.nombre}</strong></td><td>${t.puesto||'—'}</td><td>${badge(t.activo)}</td><td><button class="btn btn-ghost btn-sm btn-icon" onclick='editarTrabForm(${JSON.stringify(t).replace(/'/g,"\\'")})'><i class="fas fa-pencil"></i></button><button class="btn btn-danger btn-sm btn-icon" onclick="if(confirm('¿Desactivar?'))call('desactivarTrabajador','${t.id}').then(()=>{toast('Desactivado','warning');cargarTablaTrabs()})"><i class="fas fa-ban"></i></button><button class="btn btn-danger btn-sm btn-icon" title="Eliminar fila" onclick="if(confirm('¿ELIMINAR permanentemente?'))call('eliminarTrabajador','${t.id}').then(()=>{toast('Eliminado','danger');cargarTablaTrabs()})"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div>`; }); }

function cargarTablaModelos(){ call('getModelos').then(function(d){ _modelos=d||[]; renderTablaModelos(_modelos); }).catch(function(e){ var el=document.getElementById('tablaModelos'); if(el) el.innerHTML='<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error: '+e.message+'</p></div>'; }); }

function filtrarClientes(){ const q=document.getElementById('buscarCliente').value.toLowerCase(); renderTablaClientes(_clientes.filter(c=>c.cliente.toLowerCase().includes(q))); }

function filtrarModelos(){ const q=document.getElementById('buscarModelo').value.toLowerCase(); renderTablaModelos(_modelos.filter(m=>m.noOrden.toString().toLowerCase().includes(q)||m.modelo.toLowerCase().includes(q)||m.nombreCliente.toLowerCase().includes(q))); }


function addEntradaTalla(){ _entradaTallas.push({talla:'',frentes:0,espaldas:0,mangas:0}); renderEntradaTallasBody(); }

function addModeloTalla(){ _modeloTallas.push({talla:'',cantidad:0}); renderModeloTallasBody(); }

function addProdTalla(){ _prodTallas.push({talla:'',frentes:0,espaldas:0,mangas:0}); renderProdTallasBody(); }

function cargarTallasEntrada(){
const no=document.getElementById('entNoOrden').value.trim();
if(!no){toast('Ingresa un NoOrden','danger');return;}
const info=document.getElementById('entModeloInfo');
info.innerHTML='<i class="fas fa-spinner fa-spin"></i> Buscando...';
call('getModeloByNoOrden',no).then(m=>{
if(!m){info.innerHTML='<span style="color:var(--danger)">NoOrden no encontrado</span>';return;}
info.innerHTML=`<i class="fas fa-check-circle"></i> <strong>${m.modelo}</strong> | Cliente: ${m.nombreCliente}`;
_entradaTallas=m.tallas.map(t=>({talla:t.talla,frentes:0,espaldas:0,mangas:0}));
renderEntradaTallasBody();
}).catch(()=>info.innerHTML='<span style="color:var(--danger)">Error al buscar</span>');
}

function editarClienteForm(c){ document.getElementById('clienteId').value=c.id; document.getElementById('clienteNombre').value=c.cliente; document.getElementById('clienteLogoUrl').value=c.logo||''; document.getElementById('clienteActivo').value=c.activo; if(c.logo){const img=document.getElementById('logoPreview');img.src=c.logo;img.style.display='block';} document.getElementById('formClienteTitle').textContent='Editar Cliente'; window.scrollTo(0,0); 
  var t=document.getElementById('modalClienteTitle');if(t)t.textContent='Editar Cliente';
  openModal('modalCliente');
}

function editarMaquilaForm(m){ document.getElementById('maqId').value=m.id; document.getElementById('maqNombre').value=m.maquila; document.getElementById('maqDestino').value=m.destino||''; document.getElementById('maqActivo').value=m.activo; document.getElementById('formMaqTitle').textContent='Editar Maquila'; window.scrollTo(0,0); 
  var t=document.getElementById('modalMaquilaTitle');if(t)t.textContent='Editar Maquila';
  openModal('modalMaquila');
}

function editarModeloForm(idx){
const m=_modelos[idx];
if(!m) return;
document.getElementById('modId').value=m.id;
document.getElementById('modNoOrden').value=m.noOrden;
document.getElementById('modNombre').value=m.modelo;
document.getElementById('modFecha').value=m.fechaEntrega||'';
document.getElementById('modFotoUrl').value=m.foto||'';
document.getElementById('modCliente').value=m.idCliente||'';
document.getElementById('modMaquila').value=m.idMaquila||'';
if(m.foto){const p=document.getElementById('modFotoPreview');if(p){p.src=m.foto;p.style.display='block';}}
call('getModeloTallas',m.id).then(tallas=>{
_modeloTallas=tallas.map(t=>({talla:t.talla,cantidad:t.cantidadSueter}));
renderModeloTallasBody();
});
document.getElementById('formModTitle').textContent='Editar Modelo';
window.scrollTo(0,0);

  _poblarSelectsModelo();
  openModal('modalModelo');
}

function editarTrabForm(t){ document.getElementById('trabId').value=t.id; document.getElementById('trabNombre').value=t.nombre; document.getElementById('trabPuesto').value=t.puesto||'Revisión'; document.getElementById('trabFotoUrl').value=t.foto||''; document.getElementById('trabActivo').value=t.activo; if(t.foto){const img=document.getElementById('trabFotoPreview');img.src=t.foto;img.style.display='block';} document.getElementById('formTrabTitle').textContent='Editar Trabajador'; window.scrollTo(0,0); }
let _modeloTallas=[{talla:'',cantidad:0}];

async function guardarCliente(){
const id=document.getElementById('clienteId').value;
const nombre=document.getElementById('clienteNombre').value.trim();
if(!nombre){toast('El nombre es requerido','danger');return;}
const fileInput=document.getElementById('logoFile');
let logoBase64='';
if(fileInput.files[0]){
logoBase64=await fileToBase64(fileInput.files[0]);

}
const data={id, cliente:nombre, logoBase64, logoUrl:document.getElementById('clienteLogoUrl').value, activo:document.getElementById('clienteActivo').value};
const fn=id?'editarCliente':'crearCliente';
const btn=document.querySelector('[onclick="guardarCliente()"]');
btn.innerHTML='<div class="spinner" style="width:16px;height:16px;border-width:2px"></div> Guardando...';
btn.disabled=true;
call(fn,data).then(()=>{
closeModal('modalCliente');toast(id?'Cliente actualizado':'Cliente creado ✓');
limpiarFormCliente(); cargarTablaClientes();
}).catch(e=>toast('Error: '+e.message,'danger'))
.finally(()=>{btn.innerHTML='<i class="fas fa-save"></i> Guardar';btn.disabled=false;});

  var t=document.getElementById('modalTrabTitle');if(t)t.textContent='Editar Trabajador';
  openModal('modalTrabajador');
}

function guardarEntrada(){
const noOrden=document.getElementById('entNoOrden').value.trim();
if(!noOrden){toast('NoOrden requerido','danger');return;}
const sel=document.getElementById('entTrab');
const tallas=_entradaTallas.filter(t=>t.talla&&(t.frentes>0||t.espaldas>0||t.mangas>0));
if(!tallas.length){toast('Ingresa al menos una talla con piezas','danger');return;}
const infoEl=document.getElementById('entModeloInfo');
call('registrarEntrada',{fecha:document.getElementById('entFecha').value,idTrabajador:sel.value,nombreTrabajador:sel.value?sel.options[sel.selectedIndex].dataset.nombre:'',noOrden,tallas}).then(()=>{
closeModal('modalEntrada');toast('Entrada registrada ✓');cargarTablasEntrada();;
_entradaTallas=[{talla:'',frentes:0,espaldas:0,mangas:0}];
renderEntradaTallasBody();
document.getElementById('resNoOrden').value=noOrden;
verResumenEntrada();
}).catch(e=>toast(e.message,'danger'));
}

function guardarMaquila(){ const id=document.getElementById('maqId').value; const nombre=document.getElementById('maqNombre').value.trim(); if(!nombre){toast('Nombre requerido','danger');return;} const data={id,maquila:nombre,destino:document.getElementById('maqDestino').value,activo:document.getElementById('maqActivo').value}; call(id?'editarMaquila':'crearMaquila',data).then(()=>{closeModal('modalMaquila');toast('Maquila guardada ✓');limpiarMaquila();cargarTablaMaquilas();}).catch(e=>toast(e.message,'danger')); }

async function guardarModelo(){
const id=document.getElementById('modId').value;
const noOrden=document.getElementById('modNoOrden').value.trim();
const nombre=document.getElementById('modNombre').value.trim();
const selCli=document.getElementById('modCliente');
if(!noOrden){toast('NoOrden requerido','danger');return;}
if(!nombre){toast('Nombre del modelo requerido','danger');return;}
if(!selCli.value){toast('Selecciona un cliente','danger');return;}
const tallas=_modeloTallas.filter(t=>t.talla&&t.cantidad>0);
if(!tallas.length){toast('Agrega al menos una talla','danger');return;}
const selMaq=document.getElementById('modMaquila');
const modFotoFile=document.getElementById('modFotoFile');
let modFotoBase64='';
if(modFotoFile.files[0]) modFotoBase64=await fileToBase64(modFotoFile.files[0]);
const data={id,noOrden,modelo:nombre,fechaEntrega:document.getElementById('modFecha').value,idCliente:selCli.value,nombreCliente:selCli.options[selCli.selectedIndex].dataset.nombre,idMaquila:selMaq.value,nombreMaquila:selMaq.value?selMaq.options[selMaq.selectedIndex].dataset.nombre:'',activo:'SI',tallas,fotoBase64:modFotoBase64,fotoUrl:document.getElementById('modFotoUrl').value};
call(id?'editarModelo':'crearModelo',data).then(()=>{closeModal('modalModelo');toast('Modelo guardado ✓');cargarTablaModelos();;limpiarModelo();cargarTablaModelos();}).catch(e=>toast(e.message,'danger'));
}

function guardarProduccion(){
const sel=document.getElementById('prodTrab');
const noOrden=document.getElementById('prodNoOrden').value.trim();
if(!sel.value){toast('Selecciona un trabajador','danger');return;}
if(!noOrden){toast('NoOrden requerido','danger');return;}
const tallas=_prodTallas.filter(t=>t.talla&&(t.frentes>0||t.espaldas>0||t.mangas>0));
if(!tallas.length){toast('Ingresa al menos una talla con piezas','danger');return;}
const data={fecha:document.getElementById('prodFecha').value,idTrabajador:sel.value,nombreTrabajador:sel.options[sel.selectedIndex].dataset.nombre,noOrden,proceso:document.getElementById('prodProceso').value,observaciones:document.getElementById('prodObs').value,tallas};
call('registrarProduccion',data).then(r=>{
if(!r.ok){
toast(r.errores.join(' | '),'danger');
return;
}
closeModal('modalProduccion');toast('Producción registrada ✓');cargarTablaProd();;
_prodTallas=[{talla:'',frentes:0,espaldas:0,mangas:0}];
renderProdTallasBody();
document.getElementById('prodObs').value='';
cargarTablaProd();
}).catch(e=>toast(e.message,'danger'));
}

function limpiarFormCliente(){
document.getElementById('clienteId').value='';
document.getElementById('clienteLogoUrl').value='';
document.getElementById('clienteNombre').value='';
document.getElementById('clienteActivo').value='SI';
document.getElementById('logoPreview').style.display='none';
document.getElementById('logoFile').value='';
document.getElementById('formClienteTitle').textContent='Nuevo Cliente';
}
_clientes=[];

function limpiarMaquila(){ ['maqId','maqNombre','maqDestino'].forEach(i=>document.getElementById(i).value=''); document.getElementById('maqActivo').value='SI'; document.getElementById('formMaqTitle').textContent='Nueva Maquila'; }

function limpiarModelo(){
  ['modId','modNoOrden','modNombre','modFecha','modFotoUrl'].forEach(function(i){
    var el=document.getElementById(i); if(el) el.value='';
  });
  var cSel=document.getElementById('modCliente'); if(cSel) cSel.value='';
  var mSel=document.getElementById('modMaquila'); if(mSel) mSel.value='';
  var ff=document.getElementById('modFotoFile'); if(ff) ff.value='';
  var fp=document.getElementById('modFotoPreview'); if(fp) fp.style.display='none';
  var fa=document.getElementById('modFotoArea');
  if(fa){ fa.querySelector('i') && (fa.querySelector('i').style.display='');
           fa.querySelector('p') && (fa.querySelector('p').style.display=''); }
  _modeloTallas=[{talla:'CH',cantidad:0},{talla:'M',cantidad:0},{talla:'G',cantidad:0}];
  renderModeloTallasBody();
  // Título — usar el del modal (formModTitle ya no existe)
  var t=document.getElementById('modalModeloTitle'); if(t) t.textContent='Nuevo Modelo';
}

_modelos=[];

function limpiarTrab(){ ['trabId','trabNombre','trabFotoUrl'].forEach(i=>document.getElementById(i).value=''); document.getElementById('trabActivo').value='SI'; document.getElementById('trabFotoPreview').style.display='none'; document.getElementById('trabFotoFile').value=''; document.getElementById('formTrabTitle').textContent='Nuevo Trabajador'; }

function previewImg(input, previewId, areaId){
const file=input.files[0];
if(!file) return;
const reader=new FileReader();
reader.onload=e=>{
const img=document.getElementById(previewId);
img.src=e.target.result; img.style.display='block';
};
reader.readAsDataURL(file);
}
async function guardarCliente(){
const id=document.getElementById('clienteId').value;
const nombre=document.getElementById('clienteNombre').value.trim();
if(!nombre){toast('El nombre es requerido','danger');return;}
const fileInput=document.getElementById('logoFile');
let logoBase64='';
if(fileInput.files[0]){
logoBase64=await fileToBase64(fileInput.files[0]);

}
const data={id, cliente:nombre, logoBase64, logoUrl:document.getElementById('clienteLogoUrl').value, activo:document.getElementById('clienteActivo').value};
const fn=id?'editarCliente':'crearCliente';
const btn=document.querySelector('[onclick="guardarCliente()"]');
btn.innerHTML='<div class="spinner" style="width:16px;height:16px;border-width:2px"></div> Guardando...';
btn.disabled=true;
call(fn,data).then(()=>{
closeModal('modalCliente');toast(id?'Cliente actualizado':'Cliente creado ✓');
limpiarFormCliente(); cargarTablaClientes();
}).catch(e=>toast('Error: '+e.message,'danger'))
.finally(()=>{btn.innerHTML='<i class="fas fa-save"></i> Guardar';btn.disabled=false;});
}

function verResumenEntrada(){
const no=document.getElementById('resNoOrden').value.trim();
if(!no){toast('Ingresa un NoOrden','danger');return;}
document.getElementById('resumenEntradas').innerHTML='<div class="loading"><div class="spinner"></div></div>';
call('getResumenEntradas',no).then(r=>{
if(!r.ok){document.getElementById('resumenEntradas').innerHTML=`<div class="empty-state"><i class="fas fa-search"></i><p>${r.msg}</p></div>`;return;}
document.getElementById('resumenEntradas').innerHTML=`
<div style="margin-bottom:12px">
<strong style="font-size:15px">${r.modelo.noOrden}</strong> — ${r.modelo.modelo} | ${r.modelo.nombreCliente}
<span style="color:var(--text-muted);font-size:13px;margin-left:8px">Entrega: ${fmt(r.modelo.fechaEntrega)}</span>
</div>
${r.resumen.map(t=>`
<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:10px">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
<strong style="font-size:15px;font-family:'Space Grotesk',sans-serif">Talla ${t.talla}</strong>
<span class="badge ${t.faltaFrente===0&&t.faltaEspalda===0&&t.faltaManga===0?'badge-success':'badge-warning'}">${t.faltaFrente===0&&t.faltaEspalda===0&&t.faltaManga===0?'✓ Completa':'Pendiente'}</span>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:12px">
${['Frentes','Espaldas','Mangas'].map((tipo,idx)=>{
const esp=[t.esperadoFrente,t.esperadoEspalda,t.esperadoManga][idx];
const ent=[t.entradaFrente,t.entradaEspalda,t.entradaManga][idx];
const falt=[t.faltaFrente,t.faltaEspalda,t.faltaManga][idx];
const pct=esp>0?Math.min(100,Math.round(ent/esp*100)):0;
const cls=pct>=100?'progress-ok':pct>=50?'progress-warn':'progress-danger';
return `<div>
<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--text-muted)">${tipo}</span><span>${ent}/${esp}</span></div>
<div class="progress"><div class="progress-bar ${cls}" style="width:${pct}%"></div></div>
${falt>0?`<div style="color:var(--danger);margin-top:3px">Faltan ${falt}</div>`:'<div style="color:var(--success);margin-top:3px">Completo ✓</div>'}
</div>`;
}).join('')}
</div>
</div>`).join('')}
<div style="margin-top:16px">
<div class="card-title" style="margin-bottom:10px">Historial de Entradas</div>
${r.registros.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Trabajador</th><th>Tallas registradas</th></tr></thead><tbody>
${r.registros.map(reg=>`<tr><td>${fmt(reg.fecha)}</td><td>${reg.nombreTrabajador||'—'}</td><td>${reg.tallas.map(t=>`<span class="badge badge-gray" style="margin:2px">${t.talla}: F${t.frentes} E${t.espaldas} M${t.mangas}</span>`).join('')}</td></tr>`).join('')}
</tbody></table></div>`:'<p style="color:var(--text-muted);font-size:13px">Sin registros previos</p>'}
</div>`;
}).catch(e=>document.getElementById('resumenEntradas').innerHTML=`<div style="color:var(--danger)">${e.message}</div>`);
}
let _prodTallas=[];

function renderTablaClientes(data){
if(!data.length){document.getElementById('tablaClientes').innerHTML='<div class="empty-state"><i class="fas fa-building"></i><p>Sin clientes</p></div>';return;}
document.getElementById('tablaClientes').innerHTML=`<div class="table-wrap"><table class="table">
<thead><tr><th>Logo</th><th>Nombre</th><th>Estado</th><th>Acc.</th></tr></thead><tbody>
${data.map(c=>`<tr>
<td>${c.logo?'<img src="'+c.logo+'" style="height:36px;border-radius:6px;object-fit:contain">':'<i class="fas fa-building" style="color:var(--text-light)"></i>'}</td>
<td><strong>${c.cliente}</strong></td><td>${badge(c.activo)}</td>
<td>
<button class="btn btn-ghost btn-sm btn-icon" onclick='editarClienteForm(${JSON.stringify(c).replace(/'/g,"\\'")})'><i class="fas fa-pencil"></i></button>
<button class="btn btn-danger btn-sm btn-icon" title="Desactivar" onclick="if(confirm('¿Desactivar?'))call('desactivarCliente','${c.id}').then(()=>{toast('Desactivado','warning');cargarTablaClientes()})"><i class="fas fa-ban"></i></button>
<button class="btn btn-danger btn-sm btn-icon" title="Eliminar permanentemente" onclick="if(confirm('¿ELIMINAR permanentemente? Esta acción no se puede deshacer.'))call('eliminarCliente','${c.id}').then(()=>{toast('Eliminado','danger');cargarTablaClientes()})"><i class="fas fa-trash"></i></button>
</td></tr>`).join('')}
</tbody></table></div>`;
}

function renderMaquilas(){
document.getElementById('main').innerHTML=`
<div class="page-header"><div><h1>Maquilas</h1></div></div>
<div class="dual-grid">
<div class="card">
<div class="card-header"><div class="card-title" id="formMaqTitle">Nueva Maquila</div></div>
<input type="hidden" id="maqId">
<div class="form-group"><label class="form-label">Nombre *</label><input class="form-control" id="maqNombre" placeholder="Ej: Maquila López"></div>
<div class="form-group"><label class="form-label">Destino / Dirección</label><input class="form-control" id="maqDestino" placeholder="Dirección completa"></div>
<div class="form-group"><label class="form-label">Estado</label><select class="form-control form-select" id="maqActivo"><option value="SI">Activa</option><option value="NO">Inactiva</option></select></div>
<div style="display:flex;gap:8px">
<button class="btn btn-primary" onclick="guardarMaquila()"><i class="fas fa-save"></i> Guardar</button>
<button class="btn btn-ghost" onclick="limpiarMaquila()"><i class="fas fa-times"></i></button>
</div>
</div>
<div class="card">
<div class="card-header"><div class="card-title">Maquilas Registradas</div></div>
<div id="tablaMaquilas"><div class="loading"><div class="spinner"></div></div></div>
</div>
</div>`;
cargarTablaMaquilas();
}

function renderTrabajadores(){
const puestos=['Revisión','Hilvanado','Plancha Banco','Plancha Rodillo','Corte','Recepción','Embolsado','Remalle'];
document.getElementById('main').innerHTML=`
<div class="page-header"><div><h1>Trabajadores</h1><p>La foto se guarda en Drive automáticamente</p></div></div>
<div class="dual-grid">
<div class="card">
<div class="card-header"><div class="card-title" id="formTrabTitle">Nuevo Trabajador</div></div>
<input type="hidden" id="trabId">
<input type="hidden" id="trabFotoUrl">
<div class="form-group"><label class="form-label">Nombre Completo *</label><input class="form-control" id="trabNombre" placeholder="Nombre completo"></div>
<div class="form-group"><label class="form-label">Puesto / Área</label>
<select class="form-control form-select" id="trabPuesto">
${puestos.map(p=>`<option>${p}</option>`).join('')}
</select>
</div>
<div class="form-group">
<label class="form-label">Foto del Trabajador (opcional)</label>
<div class="img-upload-area" onclick="document.getElementById('trabFotoFile').click()">
<input type="file" id="trabFotoFile" accept="image/*" style="display:none" onchange="previewImg(this,'trabFotoPreview','trabFotoArea')">
<i class="fas fa-camera" style="font-size:24px;color:var(--text-light)"></i>
<p style="font-size:13px;color:var(--text-muted);margin-top:6px">Clic para subir foto</p>
<img id="trabFotoPreview" style="display:none;width:64px;height:64px;object-fit:cover;border-radius:50%;margin-top:8px">
</div>
</div>
<div class="form-group"><label class="form-label">Estado</label><select class="form-control form-select" id="trabActivo"><option value="SI">Activo</option><option value="NO">Inactivo</option></select></div>
<div style="display:flex;gap:8px">
<button class="btn btn-primary" onclick="guardarTrabajador()"><i class="fas fa-save"></i> Guardar</button>
<button class="btn btn-ghost" onclick="limpiarTrab()"><i class="fas fa-times"></i></button>
</div>
</div>
<div class="card">
<div class="card-header"><div class="card-title">Trabajadores</div></div>
<div id="tablaTrabs"><div class="loading"><div class="spinner"></div></div></div>
</div>
</div>`;
cargarTablaTrabs();
}
async function guardarTrabajador(){
const id=document.getElementById('trabId').value;
const nombre=document.getElementById('trabNombre').value.trim();
if(!nombre){toast('Nombre requerido','danger');return;}
const fileInput=document.getElementById('trabFotoFile');
let fotoBase64='';
if(fileInput.files[0]) fotoBase64=await fileToBase64(fileInput.files[0]);
const data={id,nombre,puesto:document.getElementById('trabPuesto').value,fotoBase64,fotoUrl:document.getElementById('trabFotoUrl').value,activo:document.getElementById('trabActivo').value};
const btn=document.querySelector('[onclick="guardarTrabajador()"]');
btn.innerHTML='<div class="spinner" style="width:16px;height:16px;border-width:2px"></div>';btn.disabled=true;
call(id?'editarTrabajador':'crearTrabajador',data).then(()=>{closeModal('modalTrabajador');toast('Trabajador guardado ✓');limpiarTrab();cargarTablaTrabs();}).catch(e=>toast(e.message,'danger')).finally(()=>{btn.innerHTML='<i class="fas fa-save"></i> Guardar';btn.disabled=false;});
}

function renderModelos(){
  document.getElementById('main').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  Promise.all([call('getClientesActivos'),call('getMaquilasActivas')]).then(function(res){
    window._modClientes = res[0]||[];
    window._modMaquilas = res[1]||[];
    _poblarSelectsModelo();
    document.getElementById('main').innerHTML =
      '<div class="page-header">'
        +'<div></div>'
        +'<button class="btn btn-primary" onclick="abrirNuevoModelo()"><i class="fas fa-plus"></i> Nuevo Modelo</button>'
      +'</div>'
      +'<div class="card">'
        +'<div class="card-header"><div class="card-title">Modelos Registrados</div>'
          +'<div class="search-bar" style="width:200px"><i class="fas fa-search"></i>'
            +'<input type="text" placeholder="Buscar..." id="buscarModelo" oninput="filtrarModelos()">'
          +'</div>'
        +'</div>'
        +'<div id="tablaModelos"><div class="loading"><div class="spinner"></div></div></div>'
      +'</div>';
    cargarTablaModelos();
  });
}

function _poblarSelectsModelo(){
  var cSel = document.getElementById('modCliente');
  var mSel = document.getElementById('modMaquila');
  if(cSel) cSel.innerHTML = '<option value="">— Seleccionar —</option>'
    +(window._modClientes||[]).map(function(c){
      return '<option value="'+c.id+'" data-nombre="'+c.cliente+'">'+c.cliente+'</option>';
    }).join('');
  if(mSel) mSel.innerHTML = '<option value="">— Sin maquila —</option>'
    +(window._modMaquilas||[]).map(function(m){
      return '<option value="'+m.id+'" data-nombre="'+m.maquila+'">'+m.maquila+'</option>';
    }).join('');
}

function abrirNuevoModelo(){
  // Si no hay datos de clientes cargados, cargarlos primero
  if(!window._modClientes || !window._modClientes.length){
    Promise.all([call('getClientesActivos'),call('getMaquilasActivas')]).then(function(res){
      window._modClientes = res[0]||[];
      window._modMaquilas = res[1]||[];
      _poblarSelectsModelo();
      _abrirModalModelo();
    });
  } else {
    _poblarSelectsModelo();
    _abrirModalModelo();
  }
}

function _abrirModalModelo(){
  limpiarModelo();
  var t = document.getElementById('modalModeloTitle');
  if(t) t.textContent = 'Nuevo Modelo';
  _modeloTallas = [{talla:'CH',cantidad:0},{talla:'M',cantidad:0},{talla:'G',cantidad:0}];
  renderModeloTallasBody();
  openModal('modalModelo');
}

function calcModeloTotal(){
  var total = (_modeloTallas||[]).reduce(function(s,t){ return s+(+t.cantidad||0); },0);
  var el = document.getElementById('modeloTotalSuet');
  if(el) el.textContent = total;
}

function addSalidaTalla(){ _salidaDet.push({talla:'',bultos:0,cabo:0}); renderSalidaDet(); }

function calcSalidaTotal(){ document.getElementById('salidaTotal').textContent=_salidaDet.reduce((s,d)=>s+(d.bultos*50)+(+d.cabo||0),0); renderSalidaDet(); }

function renderSalidaDet(){
document.getElementById('salidaDetBody').innerHTML=_salidaDet.map((d,i)=>`
<tr>
<td><input class="tinput" style="width:55px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${d.talla}" onchange="_salidaDet[${i}].talla=this.value"></td>
<td><input class="tinput" type="number" min="0" style="width:70px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${d.bultos}" onchange="_salidaDet[${i}].bultos=+this.value;calcSalidaTotal()"></td>
<td><input class="tinput" type="number" min="0" style="width:70px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${d.cabo}" onchange="_salidaDet[${i}].cabo=+this.value;calcSalidaTotal()"></td>
<td style="font-weight:600;color:var(--primary)">${(d.bultos*50)+(+d.cabo||0)}</td>
<td><button class="btn btn-ghost btn-sm btn-icon" onclick="_salidaDet.splice(${i},1);renderSalidaDet()"><i class="fas fa-times"></i></button></td>
</tr>`).join('');
calcSalidaTotal();
}

function renderModeloTallasBody(){
document.getElementById('modeloTallasBody').innerHTML=_modeloTallas.map((t,i)=>`
<tr>
<td><input class="tinput" style="width:55px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${t.talla}" onchange="_modeloTallas[${i}].talla=this.value"></td>
<td><input class="tinput" type="number" style="width:80px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${t.cantidad}" min="0" onchange="_modeloTallas[${i}].cantidad=+this.value;calcModeloTotal();renderModeloTallasBody()"></td>
<td style="color:var(--text-muted);font-size:12px">${t.cantidad} / ${t.cantidad} / ${t.cantidad*2}</td>
<td><button class="btn btn-ghost btn-sm btn-icon" onclick="_modeloTallas.splice(${i},1);renderModeloTallasBody()"><i class="fas fa-times"></i></button></td>
</tr>`).join('');
calcModeloTotal();
}

function renderTablaModelos(data){
  var el = document.getElementById('tablaModelos');
  if(!el) return;
  if(!data || !data.length){
    el.innerHTML='<div class="empty-state"><i class="fas fa-tshirt"></i><p>Sin modelos</p></div>';
    return;
  }
  var rows = data.map(function(m, i){
    var foto = m.foto
      ? '<img src="'+m.foto+'" style="width:44px;height:44px;object-fit:cover;border-radius:8px" onerror="this.style.display=\'none\'">'
      : '<i class="fas fa-tshirt" style="color:var(--text-light);font-size:20px"></i>';
    var mData = encodeURIComponent(JSON.stringify(m));
    return '<tr>'
      +'<td>'+foto+'</td>'
      +'<td><strong>'+m.noOrden+'</strong></td>'
      +'<td>'+m.modelo+'</td>'
      +'<td>'+(m.nombreCliente||'—')+'</td>'
      +'<td>'+(m.nombreMaquila||'—')+'</td>'
      +'<td>'+fmt(m.fechaEntrega)+'</td>'
      +'<td>'+badge(m.activo)+'</td>'
      +'<td>'
        +'<button class="btn btn-ghost btn-sm btn-icon" title="Editar" onclick="editarModeloForm('+i+')"><i class="fas fa-pencil"></i></button>'
        +'<button class="btn btn-info btn-sm btn-icon" title="Expediente" onclick="abrirExpediente(\''+m.noOrden+'\')"><i class="fas fa-folder-open"></i></button>'
        +'<button class="btn btn-danger btn-sm btn-icon" title="Desactivar" onclick="if(confirm(\'¿Desactivar?\'))call(\'desactivarModelo\',\''+m.id+'\').then(function(){toast(\'Desactivado\',\'warning\');cargarTablaModelos()})"><i class="fas fa-ban"></i></button>'
        +'<button class="btn btn-danger btn-sm btn-icon" title="Eliminar" onclick="if(confirm(\'¿ELIMINAR permanentemente?\'))call(\'eliminarModelo\',\''+m.id+'\').then(function(){toast(\'Eliminado\',\'danger\');cargarTablaModelos()})"><i class="fas fa-trash"></i></button>'
      +'</td>'
    +'</tr>';
  }).join('');
  el.innerHTML =
    '<div class="table-wrap"><table class="table">'
    +'<thead><tr><th>Foto</th><th>NoOrden</th><th>Modelo</th><th>Cliente</th><th>Maquila</th><th>F.Entrega</th><th>Estado</th><th>Acc.</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div>';
}

let _entradaTallas=[];

function renderEntradas(){
  document.getElementById('main').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  call('getTrabajadoresActivos').then(function(trabajadores){
    // Populate modal select
    var tSel=document.getElementById('entTrab');
    if(tSel){ tSel.innerHTML='<option value="">— Seleccionar —</option>'+trabajadores.map(function(t){return '<option value="'+t.id+'" data-nombre="'+t.nombre+'">'+t.nombre+'</option>';}).join(''); }
    var fi=document.getElementById('entFecha'); if(fi) fi.value=new Date().toISOString().slice(0,10);
    document.getElementById('main').innerHTML =
      '<div class="page-header"><div></div>'
        +'<button class="btn btn-primary" onclick="var fi=document.getElementById(\'entFecha\');if(fi)fi.value=new Date().toISOString().slice(0,10);_entradaTallas=[];addEntradaTalla();openModal(\'modalEntrada\')"><i class="fas fa-plus"></i> Nueva Entrada</button>'
      +'</div>'
      +'<div class="card" style="margin-bottom:16px">'
        +'<div class="card-header"><div class="card-title">Resumen por NoOrden</div></div>'
        +'<div style="display:flex;gap:8px;margin-bottom:16px">'
          +'<input class="form-control" id="resNoOrden" placeholder="Ingresa un NoOrden" style="max-width:200px">'
          +'<button class="btn btn-primary" onclick="verResumenEntrada()"><i class="fas fa-chart-bar"></i> Ver</button>'
        +'</div>'
        +'<div id="resumenEntradas"><div class="empty-state"><i class="fas fa-inbox"></i><p>Ingresa un NoOrden para ver el resumen</p></div></div>'
      +'</div>'
      +'<div class="card">'
        +'<div class="card-header"><div class="card-title">Entradas del día</div>'
          +'<button class="btn btn-ghost btn-sm" onclick="cargarTablasEntrada()"><i class="fas fa-refresh"></i></button>'
        +'</div>'
        +'<div id="tablaEntradaHoy"><div class="loading"><div class="spinner"></div></div></div>'
      +'</div>';
    cargarTablasEntrada();
  });
}

function renderEntradaTallasBody(){
document.getElementById('entTallasBody').innerHTML=_entradaTallas.map((t,i)=>`
<tr>
<td><input class="tinput" style="width:55px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${t.talla}" onchange="_entradaTallas[${i}].talla=this.value"></td>
<td><input class="tinput" type="number" min="0" style="width:65px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${t.frentes}" onchange="_entradaTallas[${i}].frentes=+this.value"></td>
<td><input class="tinput" type="number" min="0" style="width:65px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${t.espaldas}" onchange="_entradaTallas[${i}].espaldas=+this.value"></td>
<td><input class="tinput" type="number" min="0" style="width:65px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${t.mangas}" onchange="_entradaTallas[${i}].mangas=+this.value"></td>
<td><button class="btn btn-ghost btn-sm btn-icon" onclick="_entradaTallas.splice(${i},1);renderEntradaTallasBody()"><i class="fas fa-times"></i></button></td>
</tr>`).join('');
}

function renderProduccion(){
  document.getElementById('main').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  call('getTrabajadoresActivos').then(function(trabajadores){
    // Populate modal select
    var tSel=document.getElementById('prodTrab');
    if(tSel){ tSel.innerHTML='<option value="">— Seleccionar —</option>'+trabajadores.map(function(t){return '<option value="'+t.id+'" data-nombre="'+t.nombre+'">'+t.nombre+' ('+t.puesto+')</option>';}).join(''); }
    var pf=document.getElementById('prodFecha'); if(pf) pf.value=new Date().toISOString().slice(0,10);
    document.getElementById('main').innerHTML =
      '<div class="page-header"><div></div>'
        +'<button class="btn btn-primary" onclick="var pf=document.getElementById(\'prodFecha\');if(pf)pf.value=new Date().toISOString().slice(0,10);_prodTallas=[{talla:\'\',frentes:0,espaldas:0,mangas:0}];renderProdTallasBody();openModal(\'modalProduccion\')"><i class="fas fa-plus"></i> Nuevo Registro</button>'
      +'</div>'
      +'<div class="card">'
        +'<div class="card-header"><div class="card-title">Producción del Día</div>'
          +'<button class="btn btn-ghost btn-sm" onclick="cargarTablaProd()"><i class="fas fa-refresh"></i></button>'
        +'</div>'
        +'<div id="tablaProd"><div class="loading"><div class="spinner"></div></div></div>'
      +'</div>';
    cargarTablaProd();
  });
}

function cargarTablaProd(){
  call('getProduccionHoy').then(function(data){
    var el = document.getElementById('tablaProd');
    if(!el) return;
    if(!data || !data.length){
      el.innerHTML='<div class="empty-state"><i class="fas fa-person-digging"></i><p>Sin registros hoy</p></div>';
      return;
    }
    var rows = data.map(function(r){
      var tallas = (r.tallas||[]).map(function(t){
        return '<span class="badge badge-gray" style="margin:2px">'+t.talla+': F'+t.frentes+' E'+t.espaldas+' M'+t.mangas+'</span>';
      }).join('');
      return '<tr>'
        +'<td><strong>'+r.nombreTrabajador+'</strong></td>'
        +'<td>'+r.noOrden+'</td>'
        +'<td><span class="badge badge-info">'+r.proceso+'</span></td>'
        +'<td>'+tallas+'</td>'
        +'<td style="font-size:12px;color:var(--text-muted);max-width:150px">'+(r.observaciones||'—')+'</td>'
        +'</tr>';
    }).join('');
    el.innerHTML='<div class="table-wrap"><table class="table">'
      +'<thead><tr><th>Trabajador</th><th>Orden</th><th>Proceso</th><th>Tallas</th><th>Obs.</th></tr></thead>'
      +'<tbody>'+rows+'</tbody></table></div>';
  }).catch(function(e){
    var el = document.getElementById('tablaProd');
    if(el) el.innerHTML='<div style="color:var(--danger);padding:16px">Error: '+e.message+'</div>';
  });
}

function renderProdTallasBody(){
document.getElementById('prodTallasBody').innerHTML=_prodTallas.map((t,i)=>`
<tr>
<td><input class="tinput" style="width:55px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${t.talla}" onchange="_prodTallas[${i}].talla=this.value"></td>
<td><input class="tinput" type="number" min="0" style="width:65px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${t.frentes}" onchange="_prodTallas[${i}].frentes=+this.value"></td>
<td><input class="tinput" type="number" min="0" style="width:65px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${t.espaldas}" onchange="_prodTallas[${i}].espaldas=+this.value"></td>
<td><input class="tinput" type="number" min="0" style="width:65px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${t.mangas}" onchange="_prodTallas[${i}].mangas=+this.value"></td>
<td><button class="btn btn-ghost btn-sm btn-icon" onclick="_prodTallas.splice(${i},1);renderProdTallasBody()"><i class="fas fa-times"></i></button></td>
</tr>`).join('');
}

function renderEmbolsado(){
  document.getElementById('main').innerHTML =
    '<div class="page-header"><div></div>'
      +'<button class="btn btn-primary" onclick="var ef=document.getElementById(\'embFecha\');if(ef)ef.value=new Date().toISOString().slice(0,10);_embTallas=[{talla:\'\',cantidad:0}];renderEmbTallas();openModal(\'modalEmbolsado\')"><i class="fas fa-plus"></i> Registrar Embolsado</button>'
    +'</div>'
    +'<div class="card">'
      +'<div class="card-header"><div class="card-title">Embolsados recientes</div>'
        +'<button class="btn btn-ghost btn-sm" onclick="renderEmbolsado()"><i class="fas fa-refresh"></i></button>'
      +'</div>'
      +'<div id="tablaEmbolsados"><div class="loading"><div class="spinner"></div></div></div>'
    +'</div>';
  call('getEmbolsados').then(function(data){
    var el=document.getElementById('tablaEmbolsados');
    if(!el) return;
    if(!data||!data.length){ el.innerHTML='<div class="empty-state"><i class="fas fa-box-open"></i><p>Sin registros</p></div>'; return; }
    el.innerHTML='<div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Orden</th><th>Tallas</th><th>Total</th></tr></thead><tbody>'
      +data.slice(0,20).map(function(e){
        return '<tr><td>'+fmt(e.fecha)+'</td><td><strong>'+e.noOrden+'</strong></td>'
          +'<td>'+(e.tallas||[]).map(function(t){return '<span class="badge badge-gray" style="margin:1px">'+t.talla+': '+t.totalTalla+'</span>';}).join('')+'</td>'
          +'<td>'+(e.tallas||[]).reduce(function(s,t){return s+(+t.totalTalla||0);},0)+'</td></tr>';
      }).join('')
      +'</tbody></table></div>';
  }).catch(function(){ document.getElementById('tablaEmbolsados').innerHTML='<div class="empty-state"><i class="fas fa-inbox"></i><p>Sin registros</p></div>'; });
}

function renderEmbTallas(){
document.getElementById('embTallasBody').innerHTML=_embTallas.map((t,i)=>`
<tr>
<td><input class="tinput" style="width:70px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${t.talla}" onchange="_embTallas[${i}].talla=this.value"></td>
<td><input class="tinput" type="number" min="0" style="width:90px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" value="${t.cantidad}" onchange="_embTallas[${i}].cantidad=+this.value;document.getElementById('embTotal').textContent=_embTallas.reduce((s,x)=>s+(+x.cantidad||0),0)"></td>
<td><button class="btn btn-ghost btn-sm btn-icon" onclick="_embTallas.splice(${i},1);renderEmbTallas()"><i class="fas fa-times"></i></button></td>
</tr>`).join('');
document.getElementById('embTotal').textContent=_embTallas.reduce((s,t)=>s+(+t.cantidad||0),0);
}

function renderSalidas(){
  document.getElementById('main').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  call('getMaquilasActivas').then(function(maquilas){
    var mSel=document.getElementById('salMaquila');
    if(mSel){ mSel.innerHTML='<option value="">— Seleccionar —</option>'+maquilas.map(function(m){return '<option value="'+m.id+'" data-nombre="'+m.maquila+'" data-destino="'+(m.destino||'')+'">'+m.maquila+'</option>';}).join(''); }
    var sf=document.getElementById('salFecha'); if(sf) sf.value=new Date().toISOString().slice(0,10);
    document.getElementById('main').innerHTML =
      '<div class="page-header"><div></div>'
        +'<button class="btn btn-primary" onclick="_abrirModalSalida()"><i class="fas fa-plus"></i> Nueva Salida</button>'
      +'</div>'
      +'<div class="card">'
        +'<div class="card-header"><div class="card-title">Salidas Registradas</div></div>'
        +'<div id="tablaSalidasList"><div class="loading"><div class="spinner"></div></div></div>'
      +'</div>';
    call('getSalidas').then(function(data){
      renderVerSalidasInline(data||[]);
    });
  });
}

function _abrirModalSalida(){
  var sf=document.getElementById('salFecha'); if(sf) sf.value=new Date().toISOString().slice(0,10);
  _salidaLineas=[]; _salidaCuellos=[];
  addSalidaLinea(); addSalidaLinea(); addSalidaLinea();
  addSalidaCuello();
  openModal('modalSalida');
}

function renderVerSalidasInline(data){
  var el=document.getElementById('tablaSalidasList');
  if(!el) return;
  if(!data.length){ el.innerHTML='<div class="empty-state"><i class="fas fa-truck-fast"></i><p>Sin salidas registradas</p></div>'; return; }
  el.innerHTML='<div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Orden</th><th>Modelo</th><th>Maquila</th><th>Suéteres</th><th>Acc.</th></tr></thead><tbody>'
    +data.map(function(s){
      return '<tr><td>'+fmt(s.fechaSalida||s.fecha)+'</td><td><strong>'+(s.noOrden||'—')+'</strong></td>'
        +'<td>'+(s.nombreModelo||'—')+'</td><td>'+(s.nombreMaquila||'—')+'</td>'
        +'<td><strong>'+(s.totalSueteres||0)+'</strong></td>'
        +'<td><button class="btn btn-danger btn-sm btn-icon" title="Eliminar" onclick="if(confirm(\'¿Eliminar esta salida?\'))call(\'eliminarSalida\',(s||{}).id).then(function(){toast(\'Eliminada\',\'warning\');renderSalidas();})"><i class="fas fa-trash"></i></button></td>'
      +'</tr>';
    }).join('')
    +'</tbody></table></div>';
}

function autoSalidaInfo(){
  var no = document.getElementById('salNoOrden').value.trim();
  var infoEl = document.getElementById('salInfo');
  var modEl  = document.getElementById('salModelo');
  var cliEl  = document.getElementById('salCliente');
  var maqEl  = document.getElementById('salMaquila');
  var cadEl  = document.getElementById('salCad');

  if(!no){
    if(modEl) modEl.value='';
    if(cliEl) cliEl.value='';
    if(infoEl) infoEl.innerHTML='';
    return;
  }

  // Use cache
  if(_salidaModeloCache[no]){
    _applyModeloData(_salidaModeloCache[no], maqEl, modEl, cliEl, cadEl, infoEl);
    return;
  }

  if(infoEl) infoEl.innerHTML='<i class="fas fa-spinner fa-spin"></i>';
  call('getModeloByNoOrden', no).then(function(m){
    if(m){
      _salidaModeloCache[no] = m;
      _applyModeloData(m, maqEl, modEl, cliEl, cadEl, infoEl);
    } else {
      if(modEl) modEl.value='';
      if(cliEl) cliEl.value='';
      if(infoEl) infoEl.innerHTML='<span style="color:var(--danger)"><i class="fas fa-times-circle"></i> No encontrado</span>';
    }
  }).catch(function(){
    if(infoEl) infoEl.innerHTML='<span style="color:var(--danger)">Error</span>';
  });
}

function _applyModeloData(m, maqEl, modEl, cliEl, cadEl, infoEl){
  if(modEl) modEl.value = m.modelo || '';
  if(cliEl) cliEl.value = m.nombreCliente || '';
  // Fecha de entrega — siempre sobreescribir si el modelo tiene una
  if(cadEl && m.fechaEntrega) cadEl.value = m.fechaEntrega;
  // Autoselect maquila
  if(maqEl && m.idMaquila){
    for(var i=0; i<maqEl.options.length; i++){
      if(maqEl.options[i].value === m.idMaquila){ maqEl.selectedIndex=i; break; }
    }
  }
  if(infoEl) infoEl.innerHTML='<span style="color:var(--success)"><i class="fas fa-check-circle"></i> '+m.modelo+'</span>';
  // Auto-fill tallas
  _poblarLineasDesdeTallas(m);
}

function _poblarLineasDesdeTallas(m){
  if(!m || !m.tallas || !m.tallas.length) return;
  _salidaLineas = [];
  _salidaCuellos = [];
  m.tallas.forEach(function(t){
    var tot = t.cantidadSueter || 0;
    var fullBags = Math.floor(tot / 50);
    var remainder = tot % 50;
    if(fullBags > 0)  _salidaLineas.push({talla: t.talla, bultos: fullBags, pzBolsa: 50});
    // Remainder row always (empty if exact multiple)
    _salidaLineas.push({talla: t.talla, bultos: remainder > 0 ? 1 : 0, pzBolsa: remainder > 0 ? remainder : 0});
    // Cuello row per talla
    _salidaCuellos.push({talla: t.talla, cantidad: 0});
  });
  renderSalidaLineas();
  renderSalidaCuellos();
}

// ── BOLSAS ──
function addSalidaLinea(){
  _salidaLineas.push({talla:'', bultos:0, pzBolsa:50});
  renderSalidaLineas();
}

function renderSalidaLineas(){
  var inp = 'border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)';
  var html = _salidaLineas.map(function(d,i){
    var tot = (d.bultos||0)*(d.pzBolsa||0);
    return '<tr>'
      +'<td><input class="tinput" style="width:60px;'+inp+'" value="'+d.talla+'" onchange="_salidaLineas['+i+'].talla=this.value"></td>'
      +'<td><input class="tinput" type="number" min="0" style="width:70px;'+inp+'" value="'+d.bultos+'" onchange="_salidaLineas['+i+'].bultos=+this.value;renderSalidaLineas()"></td>'
      +'<td><input class="tinput" type="number" min="0" style="width:80px;'+inp+'" value="'+d.pzBolsa+'" onchange="_salidaLineas['+i+'].pzBolsa=+this.value;renderSalidaLineas()"></td>'
      +'<td style="font-weight:700;color:var(--primary);font-size:15px">'+tot+'</td>'
      +'<td><button class="btn btn-ghost btn-sm btn-icon" onclick="_salidaLineas.splice('+i+',1);renderSalidaLineas()"><i class="fas fa-times"></i></button></td>'
      +'</tr>';
  }).join('');
  var tbody = document.getElementById('salidaLineasBody');
  if(tbody) tbody.innerHTML = html;
  var tot = _salidaLineas.reduce(function(s,d){return s+(d.bultos||0)*(d.pzBolsa||0);},0);
  var totEl = document.getElementById('salidaTotal');
  if(totEl) totEl.textContent = tot;
}

// ── CUELLOS ──
function addSalidaCuello(){
  _salidaCuellos.push({talla:'', cantidad:0});
  renderSalidaCuellos();
}

function renderSalidaCuellos(){
  var inp = 'border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)';
  var html = _salidaCuellos.map(function(d,i){
    return '<tr>'
      +'<td><input class="tinput" style="width:80px;'+inp+'" value="'+d.talla+'" onchange="_salidaCuellos['+i+'].talla=this.value"></td>'
      +'<td><input class="tinput" type="number" min="0" style="width:120px;'+inp+'" value="'+d.cantidad+'" onchange="_salidaCuellos['+i+'].cantidad=+this.value"></td>'
      +'<td><button class="btn btn-ghost btn-sm btn-icon" onclick="_salidaCuellos.splice('+i+',1);renderSalidaCuellos()"><i class="fas fa-times"></i></button></td>'
      +'</tr>';
  }).join('');
  var tbody = document.getElementById('salidaCuellosBody');
  if(tbody) tbody.innerHTML = html;
}

// ── GUARDAR ──
function guardarSalida(){
  var selMaq = document.getElementById('salMaquila');
  var noOrden = document.getElementById('salNoOrden').value.trim();
  if(!selMaq.value){toast('Selecciona maquila','danger');return;}
  if(!noOrden){toast('Ingresa un NoOrden','danger');return;}
  var lineas = _salidaLineas.filter(function(d){return d.talla&&d.bultos>0&&d.pzBolsa>0;});
  if(!lineas.length){toast('Agrega al menos una línea de bolsas','danger');return;}
  var data = {
    fecha:         document.getElementById('salFecha').value,
    idMaquila:     selMaq.value,
    nombreMaquila: selMaq.options[selMaq.selectedIndex].dataset.nombre,
    destino:       selMaq.options[selMaq.selectedIndex].dataset.destino||'',
    noOrden:       noOrden,
    nombreModelo:  document.getElementById('salModelo').value,
    nombreCliente: document.getElementById('salCliente').value,
    caducidad:     document.getElementById('salCad').value,
    tapaCostura:   document.getElementById('salTapa').value,
    hilo:          document.getElementById('salHilo').value,
    muestra:       document.getElementById('salMuestra').value,
    moldes:        document.getElementById('salMoldes').value,
    detalle:       lineas,                          // [{talla,bultos,pzBolsa}]
    cuellos:       _salidaCuellos.filter(function(c){return c.talla&&c.cantidad>0;})
  };
  var btn = document.querySelector('[onclick="guardarSalida()"]');
  if(btn){btn.disabled=true;btn.innerHTML='<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block"></div> Guardando...';}
  call('registrarSalida',data).then(function(){
    closeModal('modalSalida');toast('Salida registrada ✓');renderSalidas();;
    navigate('ver-salidas');
  }).catch(function(e){
    toast(e.message,'danger');
    if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-truck-fast"></i> Registrar Salida';}
  });
}


function renderBuscar(noOrdenInicial){ document.getElementById('main').innerHTML=` <div class=\"page-header\"><div><h1>Buscar por NoOrden</h1><p>Expediente completo: modelo, entradas, producci\u00f3n, embolsado, salidas</p></div></div> <div class=\"card\" style=\"max-width:500px;margin-bottom:20px\"> <div style=\"display:flex;gap:10px\"> <input class=\"form-control\" id=\"buscarNoOrden\" placeholder=\"Ingresa el NoOrden...\" value=\"${noOrdenInicial||''}\"> <button class=\"btn btn-primary\" onclick=\"ejecutarBusqueda()\"><i class=\"fas fa-search\"></i> Buscar</button> </div> </div> <div id=\"resultadoBusqueda\"></div>`; if(noOrdenInicial) ejecutarBusqueda(); } function ejecutarBusqueda(){
  var no = (document.getElementById('buscarNoOrden')||{value:''}).value.trim();
  if(!no){ toast('Ingresa un NoOrden','danger'); return; }
  var el = document.getElementById('resultadoBusqueda');
  el.innerHTML = '<div class="loading"><div class="spinner"></div> Buscando...</div>';
  call('buscarNoOrden', no)
    .then(function(r){
      if(!r){
        el.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle" style="color:var(--warning)"></i><p>El servidor no respondió.<br><button class="btn btn-primary btn-sm" onclick="ejecutarBusqueda()" style="margin-top:8px">Reintentar</button></p></div>';
        return;
      }
      if(!r.ok){
        el.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>'+(r.msg||'No se encontró el NoOrden')+'</p></div>';
        return;
      }
      renderExpediente(r, 'resultadoBusqueda');
    })
    .catch(function(err){
      el.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle" style="color:var(--danger)"></i><p>'+(err&&err.message?err.message:'Error de conexión')+'<br><button class="btn btn-primary btn-sm" onclick="ejecutarBusqueda()" style="margin-top:8px">Reintentar</button></p></div>';
    });
}
 function abrirExpediente(noOrden){ document.getElementById('expTitle').textContent='Expediente NoOrden: '+noOrden; document.getElementById('expContent').innerHTML='<div class=\"loading\"><div class=\"spinner\"></div></div>'; openModal('modalExpediente'); call('buscarNoOrden',noOrden).then(r=>{ if(!r.ok){document.getElementById('expContent').innerHTML='<p style=\"color:var(--danger)\">'+r.msg+'</p>';return;} renderExpediente(r,'expContent'); }).catch(e=>{ document.getElementById('expContent').innerHTML='<p style=\"color:var(--danger)\">Error: '+(e.message||e)+'</p>'; }); } function renderExpediente(r, containerId){ const m=r.modelo; const totalEnt=r.entradas&&r.entradas.resumen?r.entradas.resumen.reduce((s,t)=>s+t.entradaFrente,0):0; const totalEmb=(r.embolsado&&Array.isArray(r.embolsado))?r.embolsado.reduce((s,e)=>s+(+e.cantidad||0),0):0; const totalProd=r.produccion?r.produccion.length:0; const totalSalidas=r.salidas?r.salidas.length:0; document.getElementById(containerId).innerHTML=` <div class=\"card\" style=\"margin-bottom:16px\"> <div style=\"display:flex;gap:16px;align-items:flex-start\"> ${m.foto?'<img src=\"'+m.foto+'\" style=\"width:88px;height:88px;object-fit:cover;border-radius:10px;flex-shrink:0;border:2px solid var(--border)\" onerror=\"this.style.display=\\\'none\\\'\">':''} <div style=\"display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;flex:1\"> <div><div class=\"form-label\">NoOrden</div><strong style=\"font-size:18px;font-family:'Space Grotesk',sans-serif;color:var(--primary)\">${m.noOrden}</strong></div> <div><div class=\"form-label\">Modelo</div><strong>${m.modelo}</strong></div> <div><div class=\"form-label\">Cliente</div>${m.nombreCliente}</div> <div><div class=\"form-label\">Maquila</div>${m.nombreMaquila||'\u2014'}</div> <div><div class=\"form-label\">F.Entrega</div>${fmt(m.fechaEntrega)}</div> </div> </div> <div style=\"display:flex;flex-wrap:wrap;gap:8px;margin-top:16px\"> ${m.tallas?m.tallas.map(t=>`<div class=\"talla-chip\"><div class=\"tc-talla\">${t.talla}</div><div class=\"tc-sub\">${t.cantidadSueter} su\u00e9ter</div><div class=\"tc-sub\" style=\"color:var(--text-light)\">F${t.frentes} E${t.espaldas} M${t.mangas}</div></div>`).join(''):''} </div> </div> <div style=\"display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:16px\"> <div class=\"stat-card\" style=\"--stat-color:var(--info);padding:14px\"><div class=\"stat-icon\" style=\"width:36px;height:36px;font-size:15px\"><i class=\"fas fa-truck-ramp-box\"></i></div><div><div class=\"stat-value\" style=\"font-size:20px\">${totalEnt}</div><div class=\"stat-label\">Piezas Entrada</div></div></div> <div class=\"stat-card\" style=\"--stat-color:var(--success);padding:14px\"><div class=\"stat-icon\" style=\"width:36px;height:36px;font-size:15px\"><i class=\"fas fa-person-digging\"></i></div><div><div class=\"stat-value\" style=\"font-size:20px\">${totalProd}</div><div class=\"stat-label\">Reg. Producci\u00f3n</div></div></div> <div class=\"stat-card\" style=\"--stat-color:var(--warning);padding:14px\"><div class=\"stat-icon\" style=\"width:36px;height:36px;font-size:15px\"><i class=\"fas fa-box-open\"></i></div><div><div class=\"stat-value\" style=\"font-size:20px\">${totalEmb}</div><div class=\"stat-label\">Embolsados</div></div></div> <div class=\"stat-card\" style=\"--stat-color:var(--primary);padding:14px\"><div class=\"stat-icon\" style=\"width:36px;height:36px;font-size:15px\"><i class=\"fas fa-truck-fast\"></i></div><div><div class=\"stat-value\" style=\"font-size:20px\">${totalSalidas}</div><div class=\"stat-label\">Salidas</div></div></div> </div> ${r.entradas&&r.entradas.resumen&&r.entradas.resumen.length?` <div class=\"exp-section\"> <div class=\"exp-section-title\"><i class=\"fas fa-truck-ramp-box\"></i> Entradas por Talla</div> ${r.entradas.resumen.map(t=>{ const pctF=t.esperadoFrente>0?Math.min(100,Math.round(t.entradaFrente/t.esperadoFrente*100)):0; return `<div style=\"background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px\"> <div style=\"display:flex;justify-content:space-between;margin-bottom:8px\"><strong>Talla ${t.talla}</strong><span class=\"${t.faltaFrente===0?'badge badge-success':'badge badge-warning'}\">${t.faltaFrente===0?'Completa':'Pendiente'}</span></div> <div style=\"display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:12px\"> <div>Frentes: ${t.entradaFrente}/${t.esperadoFrente}<div class=\"progress\"><div class=\"progress-bar ${pctF>=100?'progress-ok':'progress-warn'}\" style=\"width:${pctF}%\"></div></div></div> <div>Espaldas: ${t.entradaEspalda}/${t.esperadoEspalda}</div> <div>Mangas: ${t.entradaManga}/${t.esperadoManga}</div> </div></div>`; }).join('')} </div>`:''  } ${r.produccion&&r.produccion.length?` <div class=\"exp-section\"> <div class=\"exp-section-title\"><i class=\"fas fa-person-digging\"></i> Producci\u00f3n Registrada</div> <div class=\"table-wrap\"><table class=\"table\" style=\"font-size:12px\"><thead><tr><th>Fecha</th><th>Trabajador</th><th>Proceso</th><th>Tallas</th><th>Obs.</th></tr></thead><tbody> ${r.produccion.map(p=>`<tr><td>${fmt(p.fecha)}</td><td>${p.trabajador}</td><td><span class=\"badge badge-info\">${p.proceso}</span></td><td>${(p.tallas||[]).map(t=>`<span class=\"badge badge-gray\" style=\"margin:1px\">${t.talla}:F${t.frentes}E${t.espaldas}M${t.mangas}</span>`).join('')}</td><td style=\"color:var(--text-muted)\">${p.observaciones||'\u2014'}</td></tr>`).join('')} </tbody></table></div> </div>`:''} ${r.embolsado&&r.embolsado.length?` <div class=\"exp-section\"> <div class=\"exp-section-title\"><i class=\"fas fa-box-open\"></i> Embolsado</div> <div style=\"display:flex;flex-wrap:wrap;gap:8px\">${r.embolsado.map(e=>`<span class=\"badge badge-warning\" style=\"font-size:13px;padding:6px 12px\">${e.talla}: ${e.cantidad}</span>`).join('')}</div> </div>`:''} ${r.salidas&&r.salidas.length?` <div class=\"exp-section\"> <div class=\"exp-section-title\"><i class=\"fas fa-truck-fast\"></i> Salidas a Maquila</div> <div class=\"table-wrap\"><table class=\"table\" style=\"font-size:12px\"><thead><tr><th>Fecha</th><th>Maquila</th><th>Tallas enviadas</th><th>Formato</th></tr></thead><tbody> ${r.salidas.map(s=>`<tr><td>${fmt(s.fecha)}</td><td>${s.nombreMaquila}</td><td>${s.detalle?s.detalle.map(d=>`<span class=\"badge badge-gray\" style=\"margin:1px\">${d.talla}:${d.total}</span>`).join(''):'\u2014'}</td><td><button class=\"btn btn-primary btn-sm\" onclick=\"verFormato('${s.id}')\"><i class=\"fas fa-print\"></i></button></td></tr>`).join('')} </tbody></table></div> </div>`:''}`; } 
// ══════════════════════════════════════════════════════════════
// MÓDULO REPOSICIONES
// ══════════════════════════════════════════════════════════════

var _reposAll = [];

function renderReposiciones(){
  document.getElementById('main').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  call('getReposiciones').then(function(data){
    _reposAll = data || [];
    document.getElementById('main').innerHTML =
      '<div class="page-header">'
        +'<div><h1>Reposiciones</h1><p>Faltantes y defectos de producción</p></div>'
        +'<button class="btn btn-primary" onclick="_repoShowForm()"><i class="fas fa-plus"></i> Nueva Reposición</button>'
      +'</div>'
      +'<div id="repoFormWrap" style="display:none"></div>'
      +'<div class="card" style="margin-top:16px">'
        +'<div class="toolbar" style="gap:8px;flex-wrap:wrap">'
          +'<div class="search-bar" style="flex:1;min-width:180px;max-width:300px">'
            +'<i class="fas fa-search"></i>'
            +'<input id="repoBuscar" placeholder="Buscar orden, tejedor..." oninput="_repoFiltrar()" type="text">'
          +'</div>'
          +'<select class="form-control form-select" id="repoFiltTipo" style="width:150px" onchange="_repoFiltrar()">'
            +'<option value="">Todos los tipos</option>'
            +'<option value="Faltante">Faltantes</option>'
            +'<option value="Defecto">Defectos</option>'
          +'</select>'
          +'<select class="form-control form-select" id="repoFiltEst" style="width:160px" onchange="_repoFiltrar()">'
            +'<option value="">Todos los estatus</option>'
            +'<option value="Se pidió">Se pidió</option>'
            +'<option value="En proceso">En proceso</option>'
            +'<option value="Entregada">Entregada</option>'
          +'</select>'
        +'</div>'
        +'<div id="repoTabla"></div>'
      +'</div>';
    _repoFiltrar();
  });
}

function _repoFiltrar(){
  var q   = (document.getElementById('repoBuscar')   || {value:''}).value.toLowerCase();
  var tipo = (document.getElementById('repoFiltTipo') || {value:''}).value;
  var est  = (document.getElementById('repoFiltEst')  || {value:''}).value;
  var data = _reposAll.filter(function(r){
    var match = true;
    if(q)    match = match && (r.noOrden.toLowerCase().includes(q) || r.tejedor.toLowerCase().includes(q) || r.nombreModelo.toLowerCase().includes(q));
    if(tipo) match = match && r.tipo === tipo;
    if(est)  match = match && r.estatus === est;
    return match;
  });
  _repoRenderTabla(data);
}

var _ESTATUS_BADGE = {
  'Se pidió':  '<span class="badge" style="background:#fef3c7;color:#92400e">🔔 Se pidió</span>',
  'En proceso':'<span class="badge" style="background:#e0f2fe;color:#0369a1">⚙️ En proceso</span>',
  'Entregada': '<span class="badge" style="background:#d1fae5;color:#065f46">✅ Entregada</span>'
};
var _TIPO_BADGE = {
  'Faltante': '<span class="badge badge-warning">Faltante</span>',
  'Defecto':  '<span class="badge badge-danger">Defecto</span>'
};
var _PRENDA_BADGE = {
  'Frentes':  '<span class="badge badge-info">F</span>',
  'Espaldas': '<span class="badge" style="background:#ede9fe;color:#5b21b6">E</span>',
  'Mangas':   '<span class="badge" style="background:#fce7f3;color:#9d174d">M</span>'
};

function _repoRenderTabla(data){
  var el = document.getElementById('repoTabla');
  if(!el) return;
  if(!data.length){
    el.innerHTML='<div class="empty-state"><i class="fas fa-rotate-left"></i><p>Sin reposiciones</p></div>';
    return;
  }
  var rows = data.map(function(r){
    var nextEst = r.estatus==='Se pidió' ? 'En proceso' : r.estatus==='En proceso' ? 'Entregada' : null;
    var btnAvanzar = nextEst
      ? '<button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="_repoAvanzar(\''+r.id+'\',\''+nextEst+'\')">'
          +'<i class="fas fa-arrow-right"></i> '+nextEst
        +'</button>'
      : '';
    return '<tr>'
      +'<td>'+fmt(r.fecha)+'</td>'
      +'<td><strong>'+r.noOrden+'</strong>'+(r.nombreModelo?'<br><span style="font-size:11px;color:var(--text-muted)">'+r.nombreModelo+'</span>':'')+'</td>'
      +'<td>'+r.tejedor+(r.maquina?'<br><span style="font-size:11px;color:var(--text-muted)">Máq: '+r.maquina+'</span>':'')+'</td>'
      +'<td>'+r.talla+' '+(_PRENDA_BADGE[r.prenda]||r.prenda)+'</td>'
      +'<td style="text-align:center"><strong>'+r.cantidad+'</strong></td>'
      +'<td>'+(_TIPO_BADGE[r.tipo]||r.tipo)+'</td>'
      +'<td>'+(r.observacion||'—')+'</td>'
      +'<td>'+(_ESTATUS_BADGE[r.estatus]||r.estatus)+'</td>'
      +'<td style="white-space:nowrap">'
        +btnAvanzar+' '
        +'<button class="btn btn-danger btn-sm btn-icon" title="Eliminar" onclick="_repoEliminar(\''+r.id+'\')"><i class="fas fa-trash"></i></button>'
      +'</td>'
    +'</tr>';
  }).join('');
  el.innerHTML =
    '<div class="table-wrap"><table class="table" style="font-size:13px">'
    +'<thead><tr>'
      +'<th>Fecha</th><th>Orden / Modelo</th><th>Tejedor / Máq.</th>'
      +'<th>Talla / Prenda</th><th style="text-align:center">Cant.</th>'
      +'<th>Tipo</th><th>Observación</th><th>Estatus</th><th>Acc.</th>'
    +'</tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'</table></div>';
}

function _repoAvanzar(id, nuevoEst){
  call('cambiarEstatusReposicion', id, nuevoEst).then(function(){
    toast('Estatus actualizado a: '+nuevoEst);
    renderReposiciones();
  }).catch(function(){ toast('Error al cambiar estatus','danger'); });
}

function _repoEliminar(id){
  if(!confirm('¿Eliminar esta reposición?')) return;
  call('eliminarReposicion', id).then(function(){
    toast('Reposición eliminada','warning');
    renderReposiciones();
  });
}

function _repoShowForm(){
  var wrap = document.getElementById('repoFormWrap');
  if(!wrap) return;
  wrap.style.display = 'block';
  window._repoPrendas = [{talla:'',prenda:'Frentes',cantidad:1,tipo:'Faltante',reviso:''}];
  wrap.innerHTML =
    '<div class="card" style="margin-bottom:16px;border:2px solid var(--primary-light)">'
      +'<div class="card-header"><div class="card-title">Nueva Reposici\u00f3n</div>'
        +'<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'repoFormWrap\').style.display=\'none\'"><i class="fas fa-times"></i></button>'
      +'</div>'
      +'<div class="form-grid">'
        +'<div class="form-group"><label class="form-label">Fecha *</label>'
          +'<input class="form-control" id="repFecha" type="date" value="'+new Date().toISOString().slice(0,10)+'"></div>'
        +'<div class="form-group"><label class="form-label">No. Orden *</label>'
          +'<input class="form-control" id="repOrden" placeholder="Ej: 2529" oninput="_repoAutoModelo(this.value)"></div>'
        +'<div class="form-group"><label class="form-label">Modelo</label>'
          +'<input class="form-control" id="repModelo" placeholder="Se llena autom\u00e1tico..."></div>'
        +'<div class="form-group"><label class="form-label">Tejedor</label>'
          +'<input class="form-control" id="repTejedor" placeholder="Nombre del tejedor"></div>'
        +'<div class="form-group"><label class="form-label">M\u00e1quina</label>'
          +'<input class="form-control" id="repMaquina" placeholder="No. de m\u00e1quina"></div>'
      +'</div>'
      +'<div style="margin-top:4px">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
          +'<div style="font-weight:600;font-size:13px;color:var(--primary)">Prendas a reponer</div>'
          +'<button class="btn btn-ghost btn-sm" onclick="_repoAddPrenda()"><i class="fas fa-plus"></i> Agregar</button>'
        +'</div>'
        +'<div style="overflow-x:auto">'
          +'<table class="tallas-table" style="width:100%">'
            +'<thead><tr>'
              +'<th style="width:80px">Talla</th>'
              +'<th style="width:110px">Prenda</th>'
              +'<th style="width:80px">Cantidad</th>'
              +'<th style="width:110px">Tipo</th>'
              +'<th>Revis\u00f3</th>'
              +'<th style="width:36px"></th>'
            +'</tr></thead>'
            +'<tbody id="repPrendasBody"></tbody>'
          +'</table>'
        +'</div>'
      +'</div>'
      +'<div class="form-group" style="margin-top:14px"><label class="form-label">Observaci\u00f3n general</label>'
        +'<textarea class="form-control" id="repObs" rows="2" placeholder="Detalles adicionales..."></textarea></div>'
      +'<div style="display:flex;gap:8px;margin-top:8px">'
        +'<button class="btn btn-primary" onclick="_repoGuardar()"><i class="fas fa-save"></i> Guardar Reposici\u00f3n</button>'
        +'<button class="btn btn-ghost" onclick="document.getElementById(\'repoFormWrap\').style.display=\'none\'">Cancelar</button>'
      +'</div>'
    +'</div>';
  _repoRenderPrendas();
}

function _repoAutoModelo(noOrden){
  if(!noOrden) return;
  var fuentes = window._modelosCache || window._modelos || [];
  var found = fuentes.filter(function(m){ return String(m.noOrden)===String(noOrden); });
  if(found.length){
    var el = document.getElementById('repModelo');
    if(el) el.value = found[0].modelo || found[0].nombreModelo || '';
    return;
  }
  call('getModelos').then(function(mods){
    window._modelosCache = mods;
    var m = (mods||[]).filter(function(mo){ return String(mo.noOrden)===String(noOrden); });
    var el = document.getElementById('repModelo');
    if(el && m.length) el.value = m[0].modelo || '';
  }).catch(function(){});
}

function _repoRenderPrendas(){
  var body = document.getElementById('repPrendasBody');
  if(!body) return;
  var prendas = window._repoPrendas || [];
  body.innerHTML = prendas.map(function(p,i){
    var disBtn = prendas.length <= 1 ? ' disabled' : '';
    return '<tr>'
      +'<td><input class="tinput" style="width:72px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" '
        +'value="'+p.talla+'" placeholder="CH,M,G..." onchange="window._repoPrendas['+i+'].talla=this.value"></td>'
      +'<td><select class="tinput" style="width:105px;border:1.5px solid var(--border);border-radius:6px;padding:5px 6px;background:var(--surface);color:var(--text)" '
        +'onchange="window._repoPrendas['+i+'].prenda=this.value">'
        +'<option value="Frentes"'+(p.prenda==='Frentes'?' selected':'')+'>Frentes</option>'
        +'<option value="Espaldas"'+(p.prenda==='Espaldas'?' selected':'')+'>Espaldas</option>'
        +'<option value="Mangas"'+(p.prenda==='Mangas'?' selected':'')+'>Mangas</option>'
      +'</select></td>'
      +'<td><input class="tinput" type="number" min="1" style="width:72px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" '
        +'value="'+p.cantidad+'" onchange="window._repoPrendas['+i+'].cantidad=+this.value||1"></td>'
      +'<td><select class="tinput" style="width:105px;border:1.5px solid var(--border);border-radius:6px;padding:5px 6px;background:var(--surface);color:var(--text)" '
        +'onchange="window._repoPrendas['+i+'].tipo=this.value">'
        +'<option value="Faltante"'+(p.tipo==='Faltante'?' selected':'')+'>Faltante</option>'
        +'<option value="Defecto"'+(p.tipo==='Defecto'?' selected':'')+'>Defecto</option>'
      +'</select></td>'
      +'<td><input class="tinput" style="width:100%;min-width:80px;border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;background:var(--surface);color:var(--text)" '
        +'value="'+p.reviso+'" placeholder="Qui\u00e9n revis\u00f3" onchange="window._repoPrendas['+i+'].reviso=this.value"></td>'
      +'<td><button class="btn btn-ghost btn-sm btn-icon" onclick="window._repoPrendas.splice('+i+',1);_repoRenderPrendas()" '
        +'style="color:var(--danger)"'+disBtn+' title="Quitar">'
        +'<i class="fas fa-times"></i></button></td>'
    +'</tr>';
  }).join('');
}

function _repoAddPrenda(){
  var lst = window._repoPrendas || [];
  var prev = lst.length ? lst[lst.length-1] : {};
  window._repoPrendas.push({
    talla:    prev.talla  || '',
    prenda:   prev.prenda || 'Frentes',
    cantidad: 1,
    tipo:     prev.tipo   || 'Faltante',
    reviso:   prev.reviso || ''
  });
  _repoRenderPrendas();
}

function _repoGuardar(){
  var orden = (document.getElementById('repOrden')||{value:''}).value.trim();
  if(!orden){ toast('El No. Orden es requerido','danger'); return; }
  var prendas = window._repoPrendas || [];
  if(!prendas.length){ toast('Agrega al menos una prenda','danger'); return; }
  var base = {
    fecha:        (document.getElementById('repFecha')   ||{value:''}).value,
    noOrden:      orden,
    nombreModelo: (document.getElementById('repModelo')  ||{value:''}).value,
    tejedor:      (document.getElementById('repTejedor') ||{value:''}).value,
    maquina:      (document.getElementById('repMaquina') ||{value:''}).value,
    observacion:  (document.getElementById('repObs')     ||{value:''}).value
  };
  var promises = prendas.map(function(p){
    return call('registrarReposicion', Object.assign({}, base, {
      talla:    p.talla,
      prenda:   p.prenda,
      cantidad: p.cantidad || 1,
      tipo:     p.tipo,
      reviso:   p.reviso
    }));
  });
  Promise.all(promises).then(function(){
    var n = prendas.length;
    toast('Reposici\u00f3n guardada \u2705 (' + n + ' ' + (n===1?'prenda':'prendas') + ')');
    document.getElementById('repoFormWrap').style.display = 'none';
    renderReposiciones();
  }).catch(function(e){ toast('Error: '+e.message,'danger'); });
}


function dashCargarMaquilas(pm){
  var el = document.getElementById('chartMaquilas');
  if(!el) return;
  if(!pm || !pm.length){
    el.innerHTML='<div style="color:var(--text-muted);padding:16px;font-size:13px">Sin datos de salidas</div>';
    return;
  }
  var colors = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
  var maxV = pm[0].sueteres || 1;
  var totalSu = pm.reduce(function(s,m){ return s+m.sueteres; },0);
  el.innerHTML =
    pm.slice(0,6).map(function(m,i){
      var pct = Math.round(m.sueteres/maxV*100);
      var col = colors[i % colors.length];
      return '<div style="margin-bottom:16px">'
        +'<div style="display:flex;justify-content:space-between;margin-bottom:4px">'
          +'<span style="font-size:13px;font-weight:600">'+m.nombre+'</span>'
          +'<span style="font-size:13px;font-weight:700;color:'+col+'">'+m.sueteres+' su ('+m.salidas+' sal.)</span>'
        +'</div>'
        +'<div style="height:12px;background:var(--border);border-radius:6px;overflow:hidden">'
          +'<div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:6px;transition:width .5s"></div>'
        +'</div>'
      +'</div>';
    }).join('')
    +'<div style="border-top:1px solid var(--border);padding-top:12px;margin-top:4px">'
      +'<div style="display:flex;justify-content:space-between">'
        +'<span style="font-size:12px;font-weight:600;color:var(--text-muted)">TOTAL</span>'
        +'<span style="font-size:13px;font-weight:700;color:var(--primary)">'+totalSu+' suéteres</span>'
      +'</div>'
    +'</div>';
}



function _repoFiltrarPeriodo(data){
  var anio = parseInt(window._dashAnio || new Date().getFullYear());
  var mes  = (window._dashMes !== undefined && window._dashMes !== '') ? parseInt(window._dashMes) : '';
  return (data||[]).filter(function(r){
    var raw = r.fecha;
    if(!raw) return false;
    var f;
    if(typeof raw === 'number') {
      f = new Date(raw);
    } else {
      var str = String(raw).trim().replace(' ','T');
      if(str.indexOf('T') === -1) str += 'T00:00:00';
      f = new Date(str);
    }
    if(isNaN(f.getTime())) return false;
    if(mes !== '') return f.getFullYear()===anio && f.getMonth()===mes;
    return f.getFullYear()===anio;
  });
}

function _dashBarras(elId, por, color, sufijo){
  var el = document.getElementById(elId);
  if(!el) return;
  var lista = Object.keys(por).map(function(k){
    return {nombre:k, total:por[k]};
  }).sort(function(a,b){ return b.total-a.total; }).slice(0,6);
  if(!lista.length){
    el.innerHTML='<div style="color:var(--text-muted);padding:12px;font-size:13px;text-align:center">Sin registros en este período</div>';
    return;
  }
  var maxV = lista[0].total || 1;
  el.innerHTML = lista.map(function(item){
    var pct = Math.round(item.total/maxV*100);
    return '<div style="margin-bottom:14px">'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:4px">'
        +'<span style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;margin-right:8px">'+item.nombre+'</span>'
        +'<span style="font-size:13px;font-weight:700;color:'+color+';flex-shrink:0">'+item.total+' '+sufijo+'</span>'
      +'</div>'
      +'<div style="height:12px;background:var(--border);border-radius:6px;overflow:hidden">'
        +'<div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:6px;transition:width .5s"></div>'
      +'</div>'
    +'</div>';
  }).join('');
}

function _procesarReposicionesParaDash(data, tipoFiltro, campoAgrupar, elId, color, sufijo){
  var el = document.getElementById(elId);
  if(!el) return;
  var fil = _repoFiltrarPeriodo(data).filter(function(r){
    return String(r.tipo||'').toLowerCase().indexOf(tipoFiltro) !== -1;
  });
  var por = {};
  fil.forEach(function(r){
    var key = (r[campoAgrupar]||'').trim() || 'Sin '+campoAgrupar;
    if(campoAgrupar==='maquina') key = key ? 'Máq. '+key : 'Sin máquina';
    por[key] = (por[key]||0) + (Number(r.cantidad)||1);
  });
  _dashBarras(elId, por, color, sufijo);
}

function dashCargarTejFaltantes(){
  var el = document.getElementById('dashTejFaltChart');
  if(!el) return;
  call('getReposiciones').then(function(data){
    _procesarReposicionesParaDash(data||[], 'faltante', 'tejedor', 'dashTejFaltChart', '#f59e0b', 'falt.');
  }).catch(function(err){
    var el = document.getElementById('dashTejFaltChart');
    if(el) el.innerHTML='<div style="color:var(--text-muted);padding:12px;font-size:12px">'+((err&&err.message)||'Error')+'</div>';
  });
}

function dashCargarTejDefectos(){
  var el = document.getElementById('dashTejDefChart');
  if(!el) return;
  call('getReposiciones').then(function(data){
    _procesarReposicionesParaDash(data||[], 'defecto', 'tejedor', 'dashTejDefChart', '#ef4444', 'def.');
  }).catch(function(err){
    var el = document.getElementById('dashTejDefChart');
    if(el) el.innerHTML='<div style="color:var(--text-muted);padding:12px;font-size:12px">'+((err&&err.message)||'Error')+'</div>';
  });
}

function dashCargarMaqDefectos(){
  var el = document.getElementById('dashMaqDefChart');
  if(!el) return;
  call('getReposiciones').then(function(data){
    _procesarReposicionesParaDash(data||[], 'defecto', 'maquina', 'dashMaqDefChart', '#ef4444', 'def.');
  }).catch(function(err){
    var el = document.getElementById('dashMaqDefChart');
    if(el) el.innerHTML='<div style="color:var(--text-muted);padding:12px;font-size:12px">'+((err&&err.message)||'Error')+'</div>';
  });
}


function dashCargarReposiciones(periodo){
  var anio = window._dashAnio || new Date().getFullYear();
  var mes  = (window._dashMes !== undefined && window._dashMes !== '') ? window._dashMes : '';
  call('getReposicionesStats', null, anio, mes).then(function(stats){
    var el = document.getElementById('dashReposChart');
    if(!el) return;
    var tf = stats.totalFaltantes || 0;
    var td = stats.totalDefectos  || 0;
    var maxV = Math.max(tf, td, 1);
    var pf = Math.round(tf/maxV*100);
    var pd = Math.round(td/maxV*100);
    var est = stats.porEstatus || {};
    el.innerHTML =
      '<div style="margin-bottom:16px">'
        +'<div style="display:flex;justify-content:space-between;margin-bottom:4px">'
          +'<span style="font-size:13px;font-weight:600">⚠️ Faltantes</span>'
          +'<span style="font-size:13px;font-weight:700;color:var(--warning)">'+tf+' pzs ('+stats.countFaltantes+' reg.)</span>'
        +'</div>'
        +'<div style="height:12px;background:var(--border);border-radius:6px;overflow:hidden">'
          +'<div style="height:100%;width:'+pf+'%;background:var(--warning);border-radius:6px;transition:width .5s"></div>'
        +'</div>'
      +'</div>'
      +'<div style="margin-bottom:20px">'
        +'<div style="display:flex;justify-content:space-between;margin-bottom:4px">'
          +'<span style="font-size:13px;font-weight:600">❌ Defectos</span>'
          +'<span style="font-size:13px;font-weight:700;color:var(--danger)">'+td+' pzs ('+stats.countDefectos+' reg.)</span>'
        +'</div>'
        +'<div style="height:12px;background:var(--border);border-radius:6px;overflow:hidden">'
          +'<div style="height:100%;width:'+pd+'%;background:var(--danger);border-radius:6px;transition:width .5s"></div>'
        +'</div>'
      +'</div>'
      +'<div style="border-top:1px solid var(--border);padding-top:12px">'
        +'<div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px">ESTATUS</div>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
          +'<div style="flex:1;text-align:center;background:var(--surface2);border-radius:8px;padding:8px">'
            +'<div style="font-size:18px;font-weight:700;color:#92400e">'+(est['Se pidió']||0)+'</div>'
            +'<div style="font-size:11px;color:var(--text-muted)">Se pidió</div>'
          +'</div>'
          +'<div style="flex:1;text-align:center;background:var(--surface2);border-radius:8px;padding:8px">'
            +'<div style="font-size:18px;font-weight:700;color:#0369a1">'+(est['En proceso']||0)+'</div>'
            +'<div style="font-size:11px;color:var(--text-muted)">En proceso</div>'
          +'</div>'
          +'<div style="flex:1;text-align:center;background:var(--surface2);border-radius:8px;padding:8px">'
            +'<div style="font-size:18px;font-weight:700;color:#065f46">'+(est['Entregada']||0)+'</div>'
            +'<div style="font-size:11px;color:var(--text-muted)">Entregadas</div>'
          +'</div>'
        +'</div>'
      +'</div>';
  }).catch(function(){
    var el = document.getElementById('dashReposChart');
    if(el) el.innerHTML='<div style="color:var(--text-muted);padding:16px;font-size:13px">Sin datos de reposiciones</div>';
  });
}

function renderVerEntradas(){
  document.getElementById('main').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  // Cargar modelos para lookup de nombre
  Promise.all([call('getEntradas'), call('getModelos')]).then(function(res){
    var data = res[0]; var modelos = res[1];
    window._modelosCache = modelos || [];
    // Enriquecer entradas con nombreModelo desde modelos si está vacío
    data = (data||[]).map(function(e){
      if(!e.nombreModelo){
        var m = (modelos||[]).filter(function(mo){ return String(mo.noOrden)===String(e.noOrden); });
        if(m.length) e.nombreModelo = m[0].modelo;
      }
      return e;
    });
    document.getElementById('main').innerHTML =
      '<div class="page-header"><div><h1>Ver Entradas</h1></div><button class="btn btn-primary" onclick="navigate(\'entradas\')"><i class="fas fa-plus"></i> Nueva Entrada</button></div>'
      +'<div class="card">'
        +'<div class="toolbar"><div class="search-bar" style="flex:1;max-width:300px"><i class="fas fa-search"></i><input id="buscarEntrada" placeholder="Buscar NoOrden, modelo, trabajador..." oninput="filtrarEntradas()" type="text"></div></div>'
        +'<div id="tablaEntradas"></div>'
      +'</div>';
    window._entradasAll = data;
    filtrarEntradas();
  });
  // dummy to keep old pattern
  var _x = function(data){ document.getElementById('main').innerHTML=` <div class=\"page-header\"><div><h1>Ver Entradas</h1></div><button class=\"btn btn-primary\" onclick=\"navigate('entradas')\"><i class=\"fas fa-plus\"></i> Nueva Entrada</button></div> <div class=\"card\"> <div class=\"toolbar\"> <div class=\"search-bar\" style=\"flex:1;max-width:300px\"><i class=\"fas fa-search\"></i><input id=\"buscarEntrada\" placeholder=\"Buscar NoOrden, trabajador...\" oninput=\"filtrarEntradas()\" type=\"text\"></div> </div> <div id=\"tablaEntradas\"></div> </div>`; }; // end dummy
} function filtrarEntradas(){ const q=(document.getElementById('buscarEntrada').value||'').toLowerCase(); renderTablaEntradas(window._entradasAll.filter(e=>e.noOrden.toString().toLowerCase().includes(q)||e.nombreTrabajador.toLowerCase().includes(q))); } function renderTablaEntradas(data){
  if(!data.length){ document.getElementById('tablaEntradas').innerHTML='<div class="empty-state"><i class="fas fa-inbox"></i><p>Sin entradas</p></div>'; return; }
  // Agrupar por noOrden para mostrar modelo (lookup en _entradasAll o en modelos cargados)
  var rows = data.map(function(e){
    var modelo = e.nombreModelo || '';
    // Si el modelo está vacío, intentar obtenerlo del cache de modelos
    if(!modelo && window._modelosCache){
      var found = window._modelosCache.filter(function(m){ return String(m.noOrden)===String(e.noOrden); });
      if(found.length) modelo = found[0].modelo;
    }
    return '<tr>'
      +'<td>'+fmt(e.fecha)+'</td>'
      +'<td><strong>'+e.noOrden+'</strong></td>'
      +'<td>'+(modelo||'<span style="color:var(--text-light)">\u2014</span>')+'</td>'
      +'<td>'+(e.nombreTrabajador||'\u2014')+'</td>'
      +'<td><button class="btn btn-info btn-sm" onclick="navigate(\'entradas\');setTimeout(function(){ document.getElementById(\'resNoOrden\').value=\''+e.noOrden+'\';verResumenEntrada(); },500)"><i class="fas fa-chart-bar"></i> Ver resumen</button></td>'
    +'</tr>';
  }).join('');
  document.getElementById('tablaEntradas').innerHTML =
    '<div class="table-wrap"><table class="table">'
    +'<thead><tr><th>Fecha</th><th>NoOrden</th><th>Modelo</th><th>Trabajador</th><th>Acc.</th></tr></thead>'
    +'<tbody>'+rows+'</tbody></table></div>';
} function renderVerProduccion(){
  document.getElementById('main').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  call('getTrabajadoresActivos').then(function(trabajadores){
    var optsTrab = '<option value="">Todos los trabajadores</option>'
      + trabajadores.map(function(t){ return '<option value="'+t.id+'">'+t.nombre+'</option>'; }).join('');
    var optsProc = '<option value="">Todos los procesos</option>'
      + ['Revisi\u00f3n','Hilvanado','Plancha Banco','Plancha Rodillo','Corte','Embolsado']
        .map(function(p){ return '<option value="'+p+'">'+p+'</option>'; }).join('');
    document.getElementById('main').innerHTML =
      '<div class="page-header"><div><h1>Ver Producci\u00f3n</h1></div></div>'
      +'<div class="card" style="margin-bottom:16px">'
        +'<div class="toolbar" style="flex-wrap:wrap;gap:8px">'
          +'<select class="form-control form-select" id="filtProdTrab" style="width:200px">'+optsTrab+'</select>'
          +'<select class="form-control form-select" id="filtProdProc" style="width:180px">'+optsProc+'</select>'
          +'<input class="form-control" id="filtProdFI" type="date" style="width:155px">'
          +'<input class="form-control" id="filtProdFF" type="date" style="width:155px">'
          +'<button class="btn btn-primary" onclick="buscarProduccion()"><i class="fas fa-search"></i> Buscar</button>'
        +'</div>'
      +'</div>'
      +'<div class="card"><div id="tablaProdVer"><div class="empty-state"><i class="fas fa-search"></i><p>Aplica filtros para ver resultados</p></div></div></div>';
  });
} function buscarProduccion(){
  document.getElementById('tablaProdVer').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  var idTrab = document.getElementById('filtProdTrab').value;
  var proc   = (document.getElementById('filtProdProc')||{}).value || '';
  var fi     = document.getElementById('filtProdFI').value;
  var ff     = document.getElementById('filtProdFF').value;
  call('getProduccionFiltro', idTrab, fi, ff).then(function(data){
    // Filtrar por proceso en cliente si se seleccionó uno
    if(proc) data = data.filter(function(r){ return r.proceso === proc; });
    if(!data || !data.length){
      document.getElementById('tablaProdVer').innerHTML='<div class="empty-state"><i class="fas fa-inbox"></i><p>Sin resultados</p></div>';
      return;
    }
    var rows = data.map(function(r){
      var tallas = (r.tallas||[]).map(function(t){
        return '<span class="badge badge-gray" style="margin:1px">'+t.talla+':F'+t.frentes+' E'+t.espaldas+' M'+t.mangas+'</span>';
      }).join('');
      return '<tr>'
        +'<td>'+fmt(r.fecha)+'</td>'
        +'<td>'+r.nombreTrabajador+'</td>'
        +'<td><strong>'+r.noOrden+'</strong></td>'
        +'<td><span class="badge badge-info">'+r.proceso+'</span></td>'
        +'<td>'+tallas+'</td>'
        +'<td style="font-size:12px;color:var(--text-muted)">'+(r.observaciones||'\u2014')+'</td>'
      +'</tr>';
    }).join('');
    document.getElementById('tablaProdVer').innerHTML =
      '<div class="table-wrap"><table class="table">'
      +'<thead><tr><th>Fecha</th><th>Trabajador</th><th>Orden</th><th>Proceso</th><th>Tallas</th><th>Obs.</th></tr></thead>'
      +'<tbody>'+rows+'</tbody></table></div>';
  });
}

function renderVerSalidas(){
  document.getElementById('main').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  call('getSalidas').then(function(data){
    data = data || [];
    var rows = !data.length
      ? '<div class="empty-state"><i class="fas fa-truck-fast"></i><p>Sin salidas registradas</p></div>'
      : '<div class="table-wrap"><table class="table"><thead><tr>'
          +'<th>Fecha</th><th>NoOrden</th><th>Modelo</th><th>Cliente</th><th>Maquila</th>'
          +'<th>Total Pz</th><th>Muestra</th><th>Moldes</th><th>Acc.</th>'
        +'</tr></thead><tbody>'
        + data.map(function(s){
            return '<tr>'
              +'<td>'+fmt(s.fecha)+'</td>'
              +'<td><strong>'+s.noOrden+'</strong></td>'
              +'<td>'+s.nombreModelo+'</td>'
              +'<td>'+s.nombreCliente+'</td>'
              +'<td>'+s.nombreMaquila+'</td>'
              +'<td style="font-weight:700;color:var(--primary)">'+(s.totalSueteres||0)+'</td>'
              +'<td>'+badge(s.muestra)+'</td>'
              +'<td>'+badge(s.moldes)+'</td>'
              +'<td style="white-space:nowrap">'
                +'<button class="btn btn-info btn-sm btn-icon" onclick="verDetalleSalida(\''+s.id+'\',\''+s.noOrden+'\')" title="Ver detalle"><i class="fas fa-eye"></i></button> '
                +'<button class="btn btn-danger btn-sm btn-icon" onclick="eliminarSalida(\''+s.id+'\',this)" title="Eliminar"><i class="fas fa-trash"></i></button>'
              +'</td>'
            +'</tr>';
          }).join('')
        +'</tbody></table></div>';
    document.getElementById('main').innerHTML =
      '<div class="page-header"><div><h1>Ver Salidas</h1></div>'
        +'<button class="btn btn-primary" onclick="navigate(\'salidas\')"><i class="fas fa-plus"></i> Nueva Salida</button>'
      +'</div>'
      +'<div class="card">'+rows+'</div>';
  });
}

function verDetalleSalida(id, noOrden){
  call('getFormatoSalida', id).then(function(f){
    if(!f){toast('No se encontró el registro','danger');return;}
    var s = f.salida;
    var lineas = f.detalle || [];
    var total = lineas.reduce(function(acc,l){return acc+(Number(l.total)||0);},0);

    var detalleRows = lineas.map(function(l){
      return '<tr>'
        +'<td style="padding:7px 12px;font-weight:600">'+l.talla+'</td>'
        +'<td style="padding:7px 12px;text-align:center">'+l.bultos+'</td>'
        +'<td style="padding:7px 12px;text-align:center">'+l.pzBolsa+'</td>'
        +'<td style="padding:7px 12px;text-align:center">'+(l.cuello||'—')+'</td>'
        +'<td style="padding:7px 12px;text-align:center;font-weight:700;color:var(--primary)">'+l.total+'</td>'
        +'</tr>';
    }).join('');

    var html =
      '<div style="font-size:13px">'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border)">'
        +'<div><span style="color:var(--text-muted)">Fecha:</span> <strong>'+fmt(s.fecha)+'</strong></div>'
        +'<div><span style="color:var(--text-muted)">No. Orden:</span> <strong style="color:var(--primary)">'+s.noOrden+'</strong></div>'
        +'<div><span style="color:var(--text-muted)">Modelo:</span> '+s.modelo+'</div>'
        +'<div><span style="color:var(--text-muted)">Cliente:</span> '+s.cliente+'</div>'
        +'<div><span style="color:var(--text-muted)">Maquila:</span> '+s.maquila+'</div>'
        +'<div><span style="color:var(--text-muted)">F. Entrega:</span> '+fmt(s.caducidad)+'</div>'
      +'</div>'
      +'<table style="width:100%;border-collapse:collapse;margin-bottom:14px">'
        +'<thead><tr style="background:var(--surface-2)">'
          +'<th style="padding:8px 12px;text-align:left">Talla</th>'
          +'<th style="padding:8px 12px;text-align:center">Bultos</th>'
          +'<th style="padding:8px 12px;text-align:center">Pz/Bulto</th>'
          +'<th style="padding:8px 12px;text-align:center">Cuellos</th>'
          +'<th style="padding:8px 12px;text-align:center">Total Pz</th>'
        +'</tr></thead>'
        +'<tbody>'+detalleRows+'</tbody>'
        +'<tfoot><tr style="border-top:2px solid var(--border)">'
          +'<td colspan="4" style="padding:10px 12px;text-align:right;font-weight:700">TOTAL</td>'
          +'<td style="padding:10px 12px;text-align:center;font-weight:700;color:var(--primary);font-size:16px">'+total+'</td>'
        +'</tr></tfoot>'
      +'</table>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;font-size:12px;padding:12px;background:var(--surface-2);border-radius:8px">'
        +'<div><span style="color:var(--text-muted)">Tapa Costura:</span> '+(s.tapaCostura||0)+' m</div>'
        +'<div><span style="color:var(--text-muted)">Hilo:</span> '+(s.hilo||0)+' kg</div>'
        +'<div><span style="color:var(--text-muted)">Muestra:</span> '+(s.muestra||'NO')+'</div>'
        +'<div><span style="color:var(--text-muted)">Moldes:</span> '+(s.moldes||'NO')+'</div>'
      +'</div>'
      +'</div>';

    // Create or reuse modal
    var modal = document.getElementById('salidaDetalleModal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'salidaDetalleModal';
      modal.className = 'modal-overlay';
      modal.style.zIndex = '9999';
      modal.innerHTML =
        '<div class="modal" style="max-width:560px;width:92%">'
          +'<div class="modal-header">'
            +'<div class="modal-title">Detalle de Salida — '+noOrden+'</div>'
            +'<button class="btn btn-ghost btn-sm btn-icon" onclick="document.getElementById(\'salidaDetalleModal\').classList.remove(\'open\')"><i class="fas fa-times"></i></button>'
          +'</div>'
          +'<div class="modal-body" id="salidaDetalleBody" style="padding:16px;max-height:75vh;overflow-y:auto"></div>'
        +'</div>';
      modal.addEventListener('click', function(e){ if(e.target===modal) modal.classList.remove('open'); });
      document.body.appendChild(modal);
    }
    document.getElementById('salidaDetalleBody').innerHTML = html;
    document.getElementById('salidaDetalleModal').classList.add('open');
  }).catch(function(e){ toast('Error: '+e.message,'danger'); });
}

function eliminarSalida(id, btn){
  if(!confirm('¿Eliminar esta salida? Esta acción no se puede deshacer.')) return;
  if(btn){ btn.disabled=true; btn.innerHTML='<div class="spinner" style="width:12px;height:12px;border-width:2px"></div>'; }
  call('eliminarSalida', id).then(function(){
    toast('Salida eliminada','warning');
    renderVerSalidas();
  }).catch(function(e){
    toast(e.message,'danger');
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-trash"></i>'; }
  });
}

 function verFormato(idSalida){
  document.getElementById('formatoContent').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  openModal('modalFormato');
  call('getFormatoSalida', idSalida).then(function(f){
    if(!f){document.getElementById('formatoContent').innerHTML='<p style="color:red">Error al cargar el formato.</p>';return;}

    var salida  = f.salida;
    var lineas  = f.detalle || [];   // [{talla, bultos, pzBolsa, total, cuello}]

    // Pad hasta 10 columnas para que la tabla siempre tenga espacio
    var cols = lineas.slice();
    while(cols.length < 10) cols.push({talla:'',bultos:'',pzBolsa:'',total:'',cuello:''});

    var totalPz = lineas.reduce(function(s,l){return s+(Number(l.total)||0);},0);

    var cfg     = window._sysConfig || {};
    var logoHtml = cfg.sistLogoUrl
      ? '<img src="'+cfg.sistLogoUrl+'" style="height:54px;object-fit:contain">'
      : '<div style="font-family:Arial,sans-serif;font-size:26px;font-weight:900;line-height:1">TEJI<span style="font-weight:400">-LOOK</span></div>';

    var B  = 'border:1.5px solid #000;';
    var BG = 'border:1.5px solid #000;background:#e5e7eb;print-color-adjust:exact;-webkit-print-color-adjust:exact;';
    var cellBase   = B+'padding:6px 4px;text-align:center;font-size:11px;';
    var cellLabel  = BG+'padding:6px 8px;font-weight:700;font-size:11px;white-space:nowrap;min-width:90px;';
    var cellHeader = BG+'padding:6px 4px;text-align:center;font-weight:700;font-size:11px;min-width:44px;';

    function v(val){ return (val!==''&&val!==undefined&&val!==null)?val:''; }

    document.getElementById('formatoContent').innerHTML =
      '<div id="printArea" style="font-family:Arial,sans-serif;background:#fff;color:#000;padding:20px;max-width:900px;margin:0 auto">'

        // ── ENCABEZADO ──
        +'<div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:3px solid #000;padding-bottom:10px;margin-bottom:14px">'
          +'<div>'+logoHtml+'</div>'
          +'<div style="text-align:right">'
            +'<div style="font-size:20px;font-weight:900;text-transform:uppercase;line-height:1.2">CONTROL SALIDAS<br>ÁREA DE TEJIDO</div>'
          +'</div>'
        +'</div>'

        // ── META ──
        +'<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px">'
          +'<tr>'
            +'<td style="padding:3px 0;width:50%"><strong>FECHA:</strong>&nbsp;'+fmt(salida.fecha)+'</td>'
            +'<td style="padding:3px 0"><strong>CLIENTE:</strong>&nbsp;'+v(salida.cliente)+'</td>'
          +'</tr>'
          +'<tr>'
            +'<td style="padding:3px 0"><strong>MODELO:</strong>&nbsp;'+v(salida.modelo)+'</td>'
            +'<td style="padding:3px 0"><strong>MAQUILA:</strong>&nbsp;'+v(salida.maquila)+'</td>'
          +'</tr>'
          +'<tr>'
            +'<td style="padding:3px 0"><strong>NO. ORDEN:</strong>&nbsp;<span style="font-weight:700;color:#1e40af">'+v(salida.noOrden)+'</span></td>'
            +'<td style="padding:3px 0"><strong>FECHA DE ENTREGA:</strong>&nbsp;'+fmt(salida.caducidad)+'</td>'
          +'</tr>'
          +'<tr>'
            +'<td colspan="2" style="padding:4px 0"><strong>TOTAL DE PZ:</strong>&nbsp;<span style="font-weight:700;font-size:15px">'+totalPz+'</span></td>'
          +'</tr>'
        +'</table>'

        // ── TABLA BULTOS ──
        +'<table style="width:100%;border-collapse:collapse;margin-bottom:10px">'
          +'<thead><tr>'
            +'<th style="'+cellLabel+'">TALLA</th>'
            +cols.map(function(c){return '<th style="'+cellHeader+'">'+v(c.talla)+'</th>';}).join('')
          +'</tr></thead>'
          +'<tbody>'
            +'<tr><td style="'+cellLabel+'">BULTOS</td>'
              +cols.map(function(c){return '<td style="'+cellBase+'">'+v(c.bultos)+'</td>';}).join('')+'</tr>'
            +'<tr><td style="'+cellLabel+'">PZ POR<br>BULTO</td>'
              +cols.map(function(c){return '<td style="'+cellBase+'">'+v(c.pzBolsa)+'</td>';}).join('')+'</tr>'
            +'<tr><td style="'+cellLabel+'">TOTAL<br>DE PZ</td>'
              +cols.map(function(c){return '<td style="'+cellBase+';font-weight:700">'+v(c.total)+'</td>';}).join('')+'</tr>'
          +'</tbody>'
        +'</table>'

        // ── TABLA CANTIDAD DE PIEZAS ──
        +'<table style="width:100%;border-collapse:collapse;margin-bottom:10px">'
          +'<thead>'
            +'<tr><th colspan="'+(cols.length+1)+'" style="'+BG+'padding:8px;text-align:center;font-size:13px;letter-spacing:1px">CANTIDAD DE PIEZAS</th></tr>'
            +'<tr><th style="'+cellLabel+'"></th>'
              +cols.map(function(c){return '<th style="'+cellHeader+'">'+v(c.talla)+'</th>';}).join('')
            +'</tr>'
          +'</thead>'
          +'<tbody>'
            +'<tr><td style="'+cellLabel+'">FRENTES</td>'
              +cols.map(function(c){return '<td style="'+cellBase+'">'+v(c.total)+'</td>';}).join('')+'</tr>'
            +'<tr><td style="'+cellLabel+'">ESPALDAS</td>'
              +cols.map(function(c){return '<td style="'+cellBase+'">'+v(c.total)+'</td>';}).join('')+'</tr>'
            +'<tr><td style="'+cellLabel+'">MANGAS</td>'
              +cols.map(function(c){
                var m = (c.total!==''&&c.total!==undefined&&Number(c.total)>0) ? Number(c.total)*2 : '';
                return '<td style="'+cellBase+'">'+m+'</td>';
              }).join('')+'</tr>'
            // CUELLOS — solo primer aparición de cada talla tiene valor
            +'<tr><td style="'+cellLabel+'">CUELLOS</td>'
              +cols.map(function(c){return '<td style="'+cellBase+'">'+v(c.cuello)+'</td>';}).join('')+'</tr>'
            // Filas de valor único
            +'<tr><td style="'+cellLabel+'">TAPA COSTURA (M)</td>'
              +'<td colspan="'+cols.length+'" style="'+B+'padding:6px 10px;font-weight:700">'+(salida.tapaCostura||0)+'</td></tr>'
            +'<tr><td style="'+cellLabel+'">MUESTRA</td>'
              +'<td colspan="'+cols.length+'" style="'+B+'padding:6px 10px;font-weight:700">'+(salida.muestra==='SI'?'SI':'NO')+'</td></tr>'
            +'<tr><td style="'+cellLabel+'">MOLDES</td>'
              +'<td colspan="'+cols.length+'" style="'+B+'padding:6px 10px;font-weight:700">'+(salida.moldes==='SI'?'SI':'NO')+'</td></tr>'
            +'<tr><td style="'+cellLabel+'">HILO (KG.)</td>'
              +'<td colspan="'+cols.length+'" style="'+B+'padding:6px 10px;font-weight:700">'+(salida.hilo||0)+'</td></tr>'
          +'</tbody>'
        +'</table>'

        // ── FIRMAS ──
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:36px">'
          +'<div style="text-align:center"><div style="border-top:1.5px solid #000;padding-top:6px;font-size:13px;font-weight:700">ENTREGA:</div></div>'
          +'<div style="text-align:center"><div style="border-top:1.5px solid #000;padding-top:6px;font-size:13px;font-weight:700">RECIBE:</div></div>'
        +'</div>'
      +'</div>';
  });
}

function printFormato(){
  var content = document.getElementById('printArea');
  if(!content){toast('No hay formato para imprimir','danger');return;}
  var w = window.open('','','width=1000,height=800');
  var html = '<!DOCTYPE html><html><head><title>Control Salidas - Tejilook</title>'
    +'<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:12px;background:#fff;color:#000}'
    +'table{border-collapse:collapse}td,th{border:1.5px solid #000}'
    +'@media print{body{padding:4px}@page{margin:6mm;size:landscape}}</style>'
    +'</head><body>'+content.innerHTML+'</body></html>';
  w.document.write(html);
  w.document.close();
  setTimeout(function(){w.print();},700);
}


function renderUsuarios(){
  if(currentUser && currentUser.rol !== 'Superusuario'){
    document.getElementById('main').innerHTML='<div class="empty-state"><i class="fas fa-lock"></i><p>Acceso solo para Superusuario</p></div>';
    return;
  }
  document.getElementById('main').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  call('getUsuarios').then(function(data){
    data = data || [];
    var tblHtml = !data.length
      ? '<div class="empty-state"><i class="fas fa-users"></i><p>Sin usuarios</p></div>'
      : '<div class="table-wrap"><table class="table"><thead><tr>'
          +'<th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acc.</th>'
        +'</tr></thead><tbody>'
        + data.map(function(u){
            var uid = u.id;
            return '<tr>'
              +'<td><strong>'+u.nombre+'</strong></td>'
              +'<td style="font-family:monospace;font-size:13px">'+u.usuario+'</td>'
              +'<td>'+badge(u.rol)+'</td>'
              +'<td>'+badge(u.activo)+'</td>'
              +'<td style="white-space:nowrap">'
                +'<button class="btn btn-warning btn-sm btn-icon" title="Desactivar" '
                  +'onclick="call(\'desactivarUsuario\',\''+uid+'\').then(function(){toast(\'Desactivado\',\'warning\');renderUsuarios();})"><i class="fas fa-ban"></i></button> '
                +'<button class="btn btn-danger btn-sm btn-icon" title="Eliminar" '
                  +'onclick="if(confirm(\'\u00bfEliminar permanentemente?\'))call(\'eliminarUsuario\',\''+uid+'\').then(function(){toast(\'Eliminado\',\'danger\');renderUsuarios();})"><i class="fas fa-trash"></i></button>'
              +'</td>'
            +'</tr>';
          }).join('')
        +'</tbody></table></div>';
    document.getElementById('main').innerHTML =
      '<div class="page-header"><div><h1>Usuarios del Sistema</h1></div></div>'
      +'<div class="dual-grid">'
        +'<div class="card">'
          +'<div class="card-title" style="margin-bottom:16px">Nuevo Usuario</div>'
          +'<div class="form-group"><label class="form-label">Nombre completo</label>'
            +'<input class="form-control" id="usrNombre" placeholder="Ej: Ana Lopez"></div>'
          +'<div class="form-group"><label class="form-label">Usuario *</label>'
            +'<input class="form-control" id="usrUsuario" placeholder="Ej: ana.lopez" autocomplete="off"></div>'
          +'<div class="form-group"><label class="form-label">Contrasena *</label>'
            +'<input class="form-control" id="usrPassword" type="password" placeholder="Minimo 4 caracteres" autocomplete="new-password"></div>'
          +'<div class="form-group"><label class="form-label">Rol</label>'
            +'<select class="form-control form-select" id="usrRol">'
              +'<option value="Administrador">Administrador</option>'
              +'<option value="Superusuario">Superusuario</option>'
            +'</select></div>'
          +'<button class="btn btn-primary" style="width:100%" onclick="guardarUsuario()">'
            +'<i class="fas fa-save"></i> Crear Usuario</button>'
        +'</div>'
        +'<div class="card">'
          +'<div class="card-title" style="margin-bottom:16px">Usuarios Registrados</div>'
          + tblHtml
        +'</div>'
      +'</div>';
  }).catch(function(err){ toast(err.message,'danger'); });
}

function guardarUsuario(){
  var nombre   = document.getElementById('usrNombre').value.trim();
  var usuario  = document.getElementById('usrUsuario').value.trim();
  var password = document.getElementById('usrPassword').value.trim();
  var rol      = document.getElementById('usrRol').value;
  if(!usuario){ toast('El usuario es requerido','danger'); return; }
  if(!password||password.length<4){ toast('La contrasena debe tener al menos 4 caracteres','danger'); return; }
  call('crearUsuario',{nombre:nombre||usuario,usuario:usuario,password:password,rol:rol})
    .then(function(r){
      if(!r||!r.ok){ toast((r&&r.msg)||'Error al crear usuario','danger'); return; }
      toast('Usuario creado ✓');
      ['usrNombre','usrUsuario','usrPassword'].forEach(function(id){ document.getElementById(id).value=''; });
      renderUsuarios();
    }).catch(function(err){ toast(err.message,'danger'); });
}

function renderBitacora(){
  if(currentUser && currentUser.rol !== 'Superusuario'){
    document.getElementById('main').innerHTML='<div class="empty-state"><i class="fas fa-lock"></i><p>Acceso solo para Superusuario</p></div>';
    return;
  }
  document.getElementById('main').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  call('getBitacora').then(function(data){
    data = data || [];
    document.getElementById('main').innerHTML =
      '<div class="page-header"><div><h1>Bitácora del Sistema</h1>'
        +'<p>Registro automático de todas las acciones</p></div></div>'
      +'<div class="card">'
      +(!data.length
        ? '<div class="empty-state"><i class="fas fa-scroll"></i><p>Sin registros</p></div>'
        : '<div class="table-wrap"><table class="table"><thead><tr>'
            +'<th>Fecha</th><th>Usuario</th><th>Acción</th><th>Tabla</th><th>Detalle</th>'
          +'</tr></thead><tbody>'
          +data.map(function(r){
              return '<tr>'
                +'<td style="white-space:nowrap;font-size:12px">'+fmt(r.fecha)+'</td>'
                +'<td style="font-size:13px">'+(r.usuario||'\u2014')+'</td>'
                +'<td>'+badge(r.accion)+'</td>'
                +'<td><span class="badge badge-gray">'+(r.tabla||'\u2014')+'</span></td>'
                +'<td style="font-size:12px;color:var(--text-muted)">'+(r.detalle||'\u2014')+'</td>'
              +'</tr>';
            }).join('')
          +'</tbody></table></div>'
      )
      +'</div>';
  }).catch(function(err){
    document.getElementById('main').innerHTML =
      '<div class="empty-state"><i class="fas fa-circle-exclamation"></i><p>Error: '+err.message+'</p></div>';
  });
}

function renderConfiguracion(){
  document.getElementById('main').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  call('getConfig').then(function(cfg){
    document.getElementById('main').innerHTML=
      '<div class="page-header"><div><h1>Configuración del Sistema</h1><p>Logo, nombre y subtítulo que aparecen en el sidebar y reportes</p></div></div>'
     +'<div class="card" style="max-width:560px">'
       +'<div class="card-header"><div class="card-title">Identidad Visual</div></div>'
       // Logo actual
       +'<div class="form-group">'
         +'<label class="form-label">Logo del Sistema</label>'
         +'<div style="display:flex;gap:16px;align-items:center;margin-bottom:8px">'
           +'<div id="cfgLogoPreviewWrap" style="width:64px;height:64px;border-radius:12px;overflow:hidden;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;background:var(--primary);color:#fff;font-size:22px;font-weight:700;font-family:Space Grotesk,sans-serif;flex-shrink:0">'
             +(cfg.sistLogoUrl
               ? '<img id="cfgLogoImg" src="'+cfg.sistLogoUrl+'" style="width:100%;height:100%;object-fit:cover">'
               : '<span id="cfgLogoIcon">'+cfg.sistLogoIcon+'</span>')
           +'</div>'
           +'<div style="flex:1">'
             +'<div class="img-upload-area" style="padding:10px;cursor:pointer" onclick="document.getElementById(\'cfgLogoFile\').click()">'
               +'<input type="file" id="cfgLogoFile" accept="image/*" style="display:none" onchange="previewCfgLogo(this)">'
               +'<i class="fas fa-cloud-upload-alt" style="color:var(--text-muted)"></i>'
               +'<span style="font-size:12px;color:var(--text-muted);margin-left:6px">Subir imagen (PNG, JPG)</span>'
             +'</div>'
             +'<div style="font-size:11px;color:var(--text-light);margin-top:4px">Se guardará en Drive. Se usará en sidebar y reportes.</div>'
           +'</div>'
         +'</div>'
       +'</div>'
       // Nombre
       +'<div class="form-group">'
         +'<label class="form-label">Nombre del Sistema</label>'
         +'<input class="form-control" id="cfgNombre" value="'+cfg.sistNombre+'" placeholder="Ej: Tejilook">'
       +'</div>'
       // Subtítulo
       +'<div class="form-group">'
         +'<label class="form-label">Subtítulo</label>'
         +'<input class="form-control" id="cfgSub" value="'+cfg.sistSub+'" placeholder="Ej: Control de Producción">'
       +'</div>'
       // Preview sidebar
       +'<div style="background:var(--primary);border-radius:10px;padding:16px;display:flex;align-items:center;gap:12px;margin-bottom:16px">'
         +'<div id="cfgPreviewIcon" style="width:40px;height:40px;background:var(--accent);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;font-family:Space Grotesk,sans-serif;overflow:hidden;flex-shrink:0">'
           +(cfg.sistLogoUrl ? '<img src="'+cfg.sistLogoUrl+'" style="width:100%;height:100%;object-fit:cover">' : cfg.sistLogoIcon)
         +'</div>'
         +'<div>'
           +'<div id="cfgPreviewName" style="color:#fff;font-weight:700;font-family:Space Grotesk,sans-serif;font-size:14px">'+cfg.sistNombre+'</div>'
           +'<div id="cfgPreviewSub" style="color:rgba(255,255,255,.6);font-size:11px;letter-spacing:.5px;text-transform:uppercase">'+cfg.sistSub+'</div>'
         +'</div>'
       +'</div>'
       +'<div style="font-size:11px;color:var(--text-muted);margin-bottom:12px"><i class="fas fa-info-circle"></i> Vista previa del sidebar</div>'
       +'<div style="display:flex;gap:8px">'
         +'<button class="btn btn-primary" onclick="guardarConfig()"><i class="fas fa-save"></i> Guardar</button>'
         +'<button class="btn btn-ghost" onclick="renderConfiguracion()"><i class="fas fa-rotate-right"></i> Cancelar</button>'
       +'</div>'
     +'</div>';
    // Live preview on typing
    document.getElementById('cfgNombre').addEventListener('input',function(){document.getElementById('cfgPreviewName').textContent=this.value;});
    document.getElementById('cfgSub').addEventListener('input',function(){document.getElementById('cfgPreviewSub').textContent=this.value;});
  }).catch(function(e){ document.getElementById('main').innerHTML='<div style="color:var(--danger)">Error: '+e.message+'</div>'; });
}

function previewCfgLogo(input){
  var file=input.files[0]; if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    var wrap=document.getElementById('cfgLogoPreviewWrap');
    var icon=document.getElementById('cfgPreviewIcon');
    wrap.innerHTML='<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:cover">';
    if(icon) icon.innerHTML='<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:cover">';
  };
  reader.readAsDataURL(file);
}

function guardarConfig(){
  var nombre=document.getElementById('cfgNombre').value.trim();
  var sub=document.getElementById('cfgSub').value.trim();
  if(!nombre){toast('El nombre no puede estar vacío','danger');return;}
  var btn=document.querySelector('[onclick="guardarConfig()"]');
  btn.innerHTML='<div class="spinner" style="width:14px;height:14px;border-width:2px"></div> Guardando...';
  btn.disabled=true;
  var fileInput=document.getElementById('cfgLogoFile');
  var saveData=function(logoUrl){
    var data={sistNombre:nombre,sistSub:sub};
    if(logoUrl) data.sistLogoUrl=logoUrl;
    call('saveConfig',data).then(function(){
      toast('Configuración guardada ✓');
      // Actualizar sidebar en vivo
      var brandName=document.querySelector('.brand-text .name');
      var brandSub=document.querySelector('.brand-text .sub');
      var brandIcon=document.querySelector('.brand-icon');
      if(brandName) brandName.textContent=nombre;
      if(brandSub)  brandSub.textContent=sub;
      if(logoUrl&&brandIcon){
        brandIcon.innerHTML='<img src="'+logoUrl+'" style="width:100%;height:100%;object-fit:cover;border-radius:8px">';
      }
      btn.innerHTML='<i class="fas fa-save"></i> Guardar';
      btn.disabled=false;
    }).catch(function(e){toast(e.message,'danger');btn.innerHTML='<i class="fas fa-save"></i> Guardar';btn.disabled=false;});
  };
  if(fileInput.files[0]){
    fileToBase64(fileInput.files[0]).then(function(b64){
      call('subirLogoSistema',b64).then(function(r){
        if(!r.ok){toast('Error subiendo logo: '+r.msg,'danger');}
        saveData(r.ok?r.url:'');
      }).catch(function(e){toast(e.message,'danger');btn.innerHTML='<i class="fas fa-save"></i> Guardar';btn.disabled=false;});
    });
  } else {
    saveData('');
  }
}


function cargarStatsPeriodo(periodo){
  var el=document.getElementById('ds-stats');
  if(!el)return;
  el.innerHTML='<div class="loading"><div class="spinner"></div></div>';
  call('getStatsPeriodo',periodo).then(function(data){
    if(!data){el.innerHTML='<p style="color:var(--text-muted);text-align:center;padding:20px">Sin datos</p>';return;}
    el.innerHTML='<div class="table-wrap"><table class="table"><thead><tr><th>Métrica</th><th>Valor</th></tr></thead><tbody>'+
      Object.entries(data).map(function(e){return '<tr><td>'+e[0]+'</td><td><strong>'+e[1]+'</strong></td></tr>';}).join('')+
      '</tbody></table></div>';
  }).catch(function(){el.innerHTML='<p style="color:var(--text-muted);text-align:center;padding:20px">No disponible</p>';});
}

function iniciarSesion(){
  var usuario  = (document.getElementById('loginUsuario').value || '').trim();
  var password = (document.getElementById('loginPassword').value || '').trim();
  var errBox   = document.getElementById('loginError');
  var btn      = document.getElementById('loginBtn');
  var loading  = document.getElementById('loginLoading');

  errBox.style.display = 'none';
  if(!usuario || !password){
    errBox.innerHTML = 'Ingresa tu usuario y contraseña.';
    errBox.style.display = 'block';
    return;
  }

  btn.style.display     = 'none';
  loading.style.display = 'flex';

  call('loginUsuario', usuario, password).then(function(res){
    loading.style.display = 'none';
    if(!res || !res.ok){
      errBox.innerHTML = res && res.msg ? res.msg : 'Credenciales incorrectas.';
      errBox.style.display = 'block';
      btn.style.display    = 'flex';
      // Limpiar solo el campo de contraseña
      document.getElementById('loginPassword').value = '';
      document.getElementById('loginPassword').focus();
      return;
    }
    document.getElementById('loginOverlay').style.display = 'none';
    _cargarSistema(res);
  }).catch(function(err){
    loading.style.display = 'none';
    errBox.innerHTML = 'Error de conexión: ' + (err.message || err);
    errBox.style.display = 'block';
    btn.style.display    = 'flex';
  });
}


function _cargarSistema(user){
  currentUser = user;
  document.getElementById('userName').textContent  = user.nombre;
  document.getElementById('userRole').textContent   = user.rol;
  document.getElementById('userAvatar').textContent = user.nombre.charAt(0).toUpperCase();
  var isSu = user.rol === 'Superusuario';
  var isSupervisor = user.rol === 'Supervisor';
  document.querySelectorAll('.nav-sistema').forEach(function(el){
    el.style.display = isSu ? '' : 'none';
  });
  // Supervisor: solo ve sección Calidad, el resto oculto
  if(isSupervisor){
    document.querySelectorAll('.nav-section').forEach(function(s){
      if(!s.classList.contains('nav-calidad')) s.style.display='none';
    });
    setTimeout(function(){ navigate('reposiciones'); }, 100);
  }
  call('getConfig').then(function(cfg){
    window._sysConfig = cfg;
    var bn = document.querySelector('.brand-text .name');
    var bs = document.querySelector('.brand-text .sub');
    var bi = document.querySelector('.brand-icon');
    if(bn && cfg.sistNombre) bn.textContent = cfg.sistNombre;
    if(bs && cfg.sistSub)    bs.textContent = cfg.sistSub;
    if(bi && cfg.sistLogoUrl){
      bi.style.background = 'transparent';
      bi.innerHTML = '<img src="'+cfg.sistLogoUrl+'" style="width:100%;height:100%;object-fit:contain">';
    }
    // Actualizar login overlay branding con config real
    var ln = document.getElementById('loginName');
    var ls = document.getElementById('loginSub');
    if(ln && cfg.sistNombre) ln.textContent = cfg.sistNombre;
    if(ls && cfg.sistSub)    ls.textContent = cfg.sistSub;
  }).catch(function(){});
  var initView = window.location.hash ? window.location.hash.replace('#','') : 'dashboard';
  navigate(initView || 'dashboard');
}

window.addEventListener('DOMContentLoaded',function(){
  if(isDark) document.getElementById('darkIcon').className='fas fa-sun';
  // Check session storage for logged-in user
  var stored = null;
  try { stored = JSON.parse(localStorage.getItem('tejilook_user')); } catch(e){}
  if(stored && stored.id){
    _initApp(stored);
  } else {
    _showLogin();
  }
});

function _showLogin(){
  document.getElementById('sidebar').style.display='none';
  document.getElementById('topbar').style.display='none';
  document.getElementById('main').style.cssText='margin:0;padding:0;min-height:100vh';
  document.getElementById('main').innerHTML=`
    <style>
    .login-wrap{
      min-height:100vh;
      background:linear-gradient(135deg,#c026d3 0%,#7c3aed 40%,#ec4899 100%);
      display:flex;align-items:center;justify-content:center;
      font-family:'DM Sans',sans-serif;
      padding:16px;
      box-sizing:border-box;
    }
    /* Card contenedor: imagen + formulario lado a lado en pantallas grandes */
    .login-card{
      position:relative;
      width:100%;
      max-width:780px;
      border-radius:24px;
      overflow:hidden;
      box-shadow:0 40px 100px rgba(0,0,0,0.5);
      display:flex;
      min-height:420px;
    }
    /* Imagen: ocupa lado derecho en desktop, queda de fondo en móvil */
    .login-img{
      position:absolute;
      inset:0;
      width:100%;
      height:100%;
      object-fit:cover;
      object-position:center top;
    }
    /* Panel del formulario */
    .login-panel{
      position:relative;
      z-index:2;
      width:280px;
      min-width:260px;
      flex-shrink:0;
      background:rgba(22,14,36,0.78);
      backdrop-filter:blur(24px);
      -webkit-backdrop-filter:blur(24px);
      border-right:1px solid rgba(255,255,255,0.08);
      padding:36px 28px;
      box-sizing:border-box;
    }
    /* En móvil: el panel ocupa todo el ancho, la imagen queda atrás con overlay */
    @media(max-width:560px){
      .login-card{ min-height:100svh; border-radius:0; max-width:100%; }
      .login-panel{
        width:100%;
        background:rgba(22,14,36,0.85);
        border-right:none;
        padding:40px 24px;
        display:flex;
        flex-direction:column;
        justify-content:center;
      }
      .login-wrap{ padding:0; }
    }
    /* Tablet intermedio */
    @media(min-width:561px) and (max-width:700px){
      .login-card{ max-width:420px; }
      .login-panel{ width:100%; border-right:none; background:rgba(22,14,36,0.82); }
    }
    .login-input{
      width:100%;background:transparent;border:none;
      border-bottom:1.5px solid rgba(255,255,255,0.2);
      padding:6px 4px 6px 22px;
      color:#fff;font-size:14px;font-family:'DM Sans',sans-serif;
      outline:none;transition:border-color .2s;caret-color:#a78bfa;
      box-sizing:border-box;
    }
    .login-input:focus{ border-bottom-color:rgba(167,139,250,0.9); }
    .login-btn{
      width:100%;
      background:linear-gradient(135deg,#1d4ed8,#3b82f6);
      border:none;border-radius:50px;
      color:#fff;font-family:'Space Grotesk',sans-serif;
      font-size:14px;font-weight:700;
      padding:13px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      transition:all .2s;
      box-shadow:0 6px 20px rgba(37,99,235,0.4);
      letter-spacing:0.3px;
      box-sizing:border-box;
    }
    .login-btn:active{ transform:scale(.98); }
    </style>
    <div class="login-wrap">
      <div class="login-card">
        <!-- Imagen fondo/lado -->
        <img class="login-img"
          src='https://drive.google.com/thumbnail?id=1qMi20i3-avWmKa0IgV4ufu4hNdYfmYDx&sz=w1200'>

        <!-- Panel formulario -->
        <div class="login-panel">
          <!-- Logo + nombre -->
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
            <div id="loginLogoBox" style="
              width:36px;height:36px;flex-shrink:0;
              background:linear-gradient(135deg,#7c3aed,#ec4899);
              border-radius:9px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="white" opacity="0.95"/>
                <rect x="11" y="2"  width="2" height="7" rx="1" fill="white" opacity="0.8"/>
                <rect x="11" y="15" width="2" height="7" rx="1" fill="white" opacity="0.8"/>
                <rect x="2"  y="11" width="7" height="2" rx="1" fill="white" opacity="0.8"/>
                <rect x="15" y="11" width="7" height="2" rx="1" fill="white" opacity="0.8"/>
              </svg>
            </div>
            <div id="loginSisNombre" style="
              font-family:'Space Grotesk',sans-serif;
              font-weight:700;font-size:20px;
              color:#fff;letter-spacing:-0.3px;">TejiLook</div>
          </div>

          <!-- Usuario -->
          <div style="margin-bottom:18px">
            <div style="font-size:10px;color:rgba(255,255,255,0.45);font-weight:700;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:8px">Usuario</div>
            <div style="position:relative;display:flex;align-items:center">
              <i class="fas fa-user" style="position:absolute;left:0;color:rgba(255,255,255,0.3);font-size:12px;pointer-events:none"></i>
              <input id="loginUser" class="login-input" autocomplete="username"
                onkeydown="if(event.key==='Enter')document.getElementById('loginPass').focus()">
            </div>
          </div>

          <!-- Contraseña -->
          <div style="margin-bottom:26px">
            <div style="font-size:10px;color:rgba(255,255,255,0.45);font-weight:700;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:8px">Contraseña</div>
            <div style="position:relative;display:flex;align-items:center">
              <i class="fas fa-lock" style="position:absolute;left:0;color:rgba(255,255,255,0.3);font-size:12px;pointer-events:none"></i>
              <input id="loginPass" type="password" class="login-input" autocomplete="current-password"
                style="padding-right:28px"
                onkeydown="if(event.key==='Enter')doLogin()">
              <button onclick="toggleLoginPass()" style="position:absolute;right:0;background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);font-size:13px;padding:4px;line-height:1">
                <i class="fas fa-eye" id="togglePassIcon"></i>
              </button>
            </div>
          </div>

          <!-- Error -->
          <div id="loginError" style="display:none;background:rgba(239,68,68,0.16);border:1px solid rgba(239,68,68,0.35);color:#fca5a5;padding:8px 12px;border-radius:9px;font-size:12px;margin-bottom:14px"></div>

          <!-- Botón -->
          <button onclick="doLogin()" id="loginBtn" class="login-btn">
            Iniciar Sesi\u00f3n
          </button>
        </div>
      </div>
    </div>`;
  call('getConfig').then(function(cfg){
    if(!cfg) return;
    var nom = document.getElementById('loginSisNombre');
    var box = document.getElementById('loginLogoBox');
    if(nom && cfg.sistNombre) nom.textContent = cfg.sistNombre;
    if(box && cfg.sistLogoUrl){
      box.style.background='transparent';
      box.innerHTML='<img src="'+cfg.sistLogoUrl+'" style="width:100%;height:100%;object-fit:contain;border-radius:6px">';
    }
  }).catch(function(){});
  setTimeout(function(){ var u=document.getElementById('loginUser'); if(u) u.focus(); },100);
}

function toggleLoginPass(){
  var inp  = document.getElementById('loginPass');
  var icon = document.getElementById('togglePassIcon');
  if(!inp) return;
  if(inp.type==='password'){ inp.type='text'; icon.className='fas fa-eye-slash'; }
  else { inp.type='password'; icon.className='fas fa-eye'; }
}

function doLogin(){
  var usuario  = (document.getElementById('loginUser').value  || '').trim();
  var password = (document.getElementById('loginPass').value  || '').trim();
  var errEl    = document.getElementById('loginError');
  var btn      = document.getElementById('loginBtn');
  if(!usuario || !password){
    errEl.textContent='Ingresa usuario y contraseña.';
    errEl.style.display='block'; return;
  }
  errEl.style.display='none';
  btn.disabled=true;
  btn.innerHTML='<div class="spinner" style="width:16px;height:16px;border-width:2px;border-top-color:#fff"></div> Verificando...';
  call('loginUsuario',{usuario:usuario,password:password}).then(function(r){
    if(!r || !r.ok){
      errEl.textContent = r ? r.msg : 'Error de conexión.';
      errEl.style.display='block';
      btn.disabled=false;
      btn.innerHTML='<i class="fas fa-arrow-right-to-bracket"></i> Iniciar Sesión';
      return;
    }
    try { localStorage.setItem('tejilook_user', JSON.stringify(r)); } catch(e){}
    _initApp(r);
  }).catch(function(e){
    errEl.textContent='Error: '+e.message;
    errEl.style.display='block';
    btn.disabled=false;
    btn.innerHTML='<i class="fas fa-arrow-right-to-bracket"></i> Iniciar Sesión';
  });
}

function doLogout(){
  try { localStorage.removeItem('tejilook_user'); } catch(e){}
  currentUser = null;
  _showLogin();
}

function _initApp(user){
  currentUser = user;
  document.getElementById('sidebar').style.display='';
  document.getElementById('topbar').style.display='';
  document.getElementById('main').style.cssText='';
  document.getElementById('userName').textContent  = user.nombre;
  document.getElementById('userRole').textContent   = user.rol;
  document.getElementById('userAvatar').textContent = user.nombre.charAt(0).toUpperCase();
  var isSu = user.rol === 'Superusuario';
  document.querySelectorAll('.nav-sistema').forEach(function(el){ el.style.display = isSu ? '' : 'none'; });
  call('getConfig').then(function(cfg){
    window._sysConfig=cfg;
    var bn=document.querySelector('.brand-text .name');
    var bs=document.querySelector('.brand-text .sub');
    var bi=document.querySelector('.brand-icon');
    if(bn&&cfg.sistNombre) bn.textContent=cfg.sistNombre;
    if(bs&&cfg.sistSub)    bs.textContent=cfg.sistSub;
    if(bi&&cfg.sistLogoUrl){ bi.style.background='transparent'; bi.innerHTML='<img src="'+cfg.sistLogoUrl+'" style="width:100%;height:100%;object-fit:contain">'; }
  }).catch(function(){});
  var initView=window.location.hash?window.location.hash.replace('#',''):'dashboard';
  navigate(initView||'dashboard');
};

function verFormato(idSalida){
  document.getElementById('formatoContent').innerHTML='<div class="loading"><div class="spinner"></div></div>';
  openModal('modalFormato');
  call('getFormatoSalida', idSalida).then(function(f){
    if(!f){document.getElementById('formatoContent').innerHTML='<p style="color:red">Error al cargar el formato.</p>';return;}
    var salida = f.salida;
    var lineas = f.detalle || [];   // [{talla, bultos, pzBolsa, cuello, total}]
    var totalPz = lineas.reduce(function(s,l){return s+(l.total||0);},0);

    // Build column list — one column per line (exactly like the PDF)
    var cols = lineas.slice();
    while(cols.length < 10) cols.push({talla:'',bultos:'',pzBolsa:'',cuello:'',total:''});

    var cfg = window._sysConfig || {};
    var logoHtml = cfg.sistLogoUrl
      ? '<img src="'+cfg.sistLogoUrl+'" style="height:54px;object-fit:contain">'
      : '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:26px;font-weight:900;line-height:1"><span style="font-weight:900">TEJI</span><span style="font-weight:400">-LOOK</span></div>';

    var cell = 'border:1.5px solid #000;padding:6px 4px;text-align:center;';
    var cellL = 'border:1.5px solid #000;padding:6px 8px;font-weight:700;background:#e5e7eb;white-space:nowrap;';
    var hdrCell = 'border:1.5px solid #000;padding:6px 4px;background:#e5e7eb;text-align:center;font-weight:700;min-width:44px;';

    document.getElementById('formatoContent').innerHTML =
      '<div id="printArea" style="font-family:\'DM Sans\',Arial,sans-serif;background:#fff;color:#000;padding:20px;max-width:860px;margin:0 auto">'

        // ── HEADER ──
        +'<div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:3px solid #000;padding-bottom:12px;margin-bottom:14px">'
          +'<div>'+logoHtml+'</div>'
          +'<div style="text-align:right;font-family:\'Space Grotesk\',sans-serif">'
            +'<div style="font-size:20px;font-weight:900;text-transform:uppercase;line-height:1.2">CONTROL SALIDAS<br>ÁREA DE TEJIDO</div>'
          +'</div>'
        +'</div>'

        // ── META 2 COLUMNAS ──
        +'<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px">'
          +'<tr>'
            +'<td style="padding:3px 0;width:50%"><strong>FECHA:</strong> <span style="border-bottom:1.5px solid #000;padding-bottom:1px;margin-left:4px">'+fmt(salida.fecha)+'</span></td>'
            +'<td style="padding:3px 0"><strong>CLIENTE:</strong> <span style="border-bottom:1.5px solid #000;padding-bottom:1px;margin-left:4px">'+salida.cliente+'</span></td>'
          +'</tr>'
          +'<tr>'
            +'<td style="padding:3px 0"><strong>MODELO:</strong> <span style="border-bottom:1.5px solid #000;padding-bottom:1px;margin-left:4px">'+salida.modelo+'</span></td>'
            +'<td style="padding:3px 0"><strong>MAQUILA:</strong> <span style="border-bottom:1.5px solid #000;padding-bottom:1px;margin-left:4px">'+salida.maquila+'</span></td>'
          +'</tr>'
          +'<tr>'
            +'<td style="padding:3px 0"><strong>NO. ORDEN:</strong> <span style="border-bottom:2px solid #1e40af;padding-bottom:1px;margin-left:4px;font-weight:700;color:#1e40af">'+salida.noOrden+'</span></td>'
            +'<td style="padding:3px 0"><strong>CANCELACIÓN:</strong> <span style="border-bottom:1.5px solid #000;padding-bottom:1px;margin-left:4px">'+(fmt(salida.caducidad)||'—')+'</span></td>'
          +'</tr>'
          +'<tr>'
            +'<td colspan="2" style="padding:3px 0"><strong>TOTAL DE PZ:</strong> <span style="border-bottom:1.5px solid #000;padding-bottom:1px;margin-left:4px;font-weight:700;font-size:15px">'+totalPz+'</span></td>'
          +'</tr>'
        +'</table>'

        // ── TABLA BULTOS ──
        +'<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:10px">'
          +'<thead><tr>'
            +'<th style="'+cellL+'min-width:90px;font-size:11px">TALLA</th>'
            +cols.map(function(c){return '<th style="'+hdrCell+'">'+c.talla+'</th>';}).join('')
          +'</tr></thead>'
          +'<tbody>'
            +'<tr><td style="'+cellL+'">BULTOS</td>'+cols.map(function(c){return '<td style="'+cell+'">'+(c.bultos!==''&&c.bultos!==undefined?c.bultos:'')+'</td>';}).join('')+'</tr>'
            +'<tr><td style="'+cellL+'">PZ POR<br>BULTO</td>'+cols.map(function(c){return '<td style="'+cell+'">'+(c.pzBolsa!==''&&c.pzBolsa!==undefined?c.pzBolsa:'')+'</td>';}).join('')+'</tr>'
            +'<tr><td style="'+cellL+'">TOTAL<br>DE PZ</td>'+cols.map(function(c){return '<td style="'+cell+';font-weight:700">'+(c.total!==''&&c.total!==undefined?c.total:'')+'</td>';}).join('')+'</tr>'
          +'</tbody>'
        +'</table>'

        // ── TABLA PIEZAS ──
        +'<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:10px">'
          +'<thead>'
            +'<tr><th colspan="'+(cols.length+1)+'" style="border:1.5px solid #000;padding:7px;background:#e5e7eb;text-align:center;font-size:13px;letter-spacing:1px">CANTIDAD DE PIEZAS</th></tr>'
            +'<tr><th style="'+hdrCell+'min-width:90px"></th>'+cols.map(function(c){return '<th style="'+hdrCell+'">'+c.talla+'</th>';}).join('')+'</tr>'
          +'</thead>'
          +'<tbody>'
            // FRENTES = total de esa columna
            +'<tr><td style="'+cellL+'">FRENTES</td>'+cols.map(function(c){return '<td style="'+cell+'">'+(c.total!==''&&c.total!==undefined?c.total:'')+'</td>';}).join('')+'</tr>'
            +'<tr><td style="'+cellL+'">ESPALDAS</td>'+cols.map(function(c){return '<td style="'+cell+'">'+(c.total!==''&&c.total!==undefined?c.total:'')+'</td>';}).join('')+'</tr>'
            // MANGAS = total × 2
            +'<tr><td style="'+cellL+'">MANGAS</td>'+cols.map(function(c){return '<td style="'+cell+'">'+(c.total!==''&&c.total!==undefined&&c.total!==0?c.total*2:'')+'</td>';}).join('')+'</tr>'
            // CUELLOS por columna (de cada línea)
            +'<tr><td style="'+cellL+'">CUELLOS</td>'+cols.map(function(c){return '<td style="'+cell+'">'+(c.cuello||'')+'</td>';}).join('')+'</tr>'
            // Rows de valor único
            +'<tr><td style="'+cellL+'">CINTA (MTS.)</td><td colspan="'+cols.length+'" style="border:1.5px solid #000;padding:6px 10px;font-weight:700">'+( salida.cinta||salida.tapaCostura||0)+'</td></tr>'
            +'<tr><td style="'+cellL+'">MUESTRA</td><td colspan="'+cols.length+'" style="border:1.5px solid #000;padding:6px 10px;font-weight:700">'+(salida.muestra==='SI'?'SI':'NO')+'</td></tr>'
            +'<tr><td style="'+cellL+'">MOLDES</td><td colspan="'+cols.length+'" style="border:1.5px solid #000;padding:6px 10px;font-weight:700">'+(salida.moldes==='SI'?'SI':'NO')+'</td></tr>'
            +'<tr><td style="'+cellL+'">HILO (KG.)</td><td colspan="'+cols.length+'" style="border:1.5px solid #000;padding:6px 10px;font-weight:700">'+(salida.hilo||0)+'</td></tr>'
          +'</tbody>'
        +'</table>'

        // ── FIRMAS ──
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:32px">'
          +'<div style="text-align:center"><div style="border-top:1.5px solid #000;padding-top:6px;font-size:13px;font-weight:600">ENTREGA:</div></div>'
          +'<div style="text-align:center"><div style="border-top:1.5px solid #000;padding-top:6px;font-size:13px;font-weight:600">RECIBE:</div></div>'
        +'</div>'
      +'</div>';
  });
}

function printFormato(){
  var content = document.getElementById('printArea');
  if(!content){toast('No hay formato para imprimir','danger');return;}
  var w = window.open('','','width=940,height=800');
  var html = '<!DOCTYPE html><html><head><title>Control Salidas - Tejilook</title>'
    +'<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:15px;background:#fff;color:#000}'
    +'@media print{body{padding:5px}@page{margin:8mm;size:landscape}}</style>'
    +'</head><body>'+content.innerHTML+'</body></html>';
  w.document.write(html);
  w.document.close();
  setTimeout(function(){w.print();},600);
}
