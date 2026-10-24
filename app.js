/* TCTD v4 · un solo archivo para que la subida a GitHub sea a prueba de errores.
   Secciones: 1) datos  2) api  3) interfaz. Para producción, separar cada sección en su fichero. */

/* ================= 1. DATOS (concesionarios, marcas, coberturas — ficticios) ================= */
/* DATOS DE DEMO. En producción esto viene del backend (GET /dealers, GET /brands). */
(function () {
  const T = (window.TCTD = window.TCTD || {});
  T.config = { responseTime: '24 horas', prefix: 'tctd_v4_' };
  T.brands = {
    camion: ['Scania', 'Volvo', 'Mercedes-Benz', 'MAN', 'DAF', 'Renault Trucks', 'Iveco'],
    remolque: ['Lecitrailer', 'Schmitz Cargobull', 'Krone', 'Kögel', 'Lamberet']
  };
  // zones = prefijos de código postal cubiertos. Todos ficticios.
  T.dealers = [
    { id: 'itt-valles', name: 'ITT Vallès · Ejemplo', brand: 'Scania', kind: 'camion', city: 'Vallès', zones: ['08'], lat: 41.54, lng: 2.21 },
    { id: 'volvo-bcn', name: 'Volvo Barcelona · Ejemplo', brand: 'Volvo', kind: 'camion', city: 'Barcelona', zones: ['08'], lat: 41.40, lng: 2.15 },
    { id: 'man-bcn', name: 'MAN Barcelona · Ejemplo', brand: 'MAN', kind: 'camion', city: 'Barcelona', zones: ['08'], lat: 41.44, lng: 2.19 },
    { id: 'scania-madrid', name: 'Scania Madrid · Ejemplo', brand: 'Scania', kind: 'camion', city: 'Madrid', zones: ['28'], lat: 40.44, lng: -3.69 },
    { id: 'mercedes-madrid', name: 'Mercedes-Benz Madrid · Ejemplo', brand: 'Mercedes-Benz', kind: 'camion', city: 'Madrid', zones: ['28'], lat: 40.39, lng: -3.68 },
    { id: 'remolques-valles', name: 'Lecitrailer Vallès · Ejemplo', brand: 'Lecitrailer', kind: 'remolque', city: 'Vallès', zones: ['08'], lat: 41.57, lng: 2.15 },
    { id: 'remolques-bcn', name: 'Schmitz Barcelona · Ejemplo', brand: 'Schmitz Cargobull', kind: 'remolque', city: 'Barcelona', zones: ['08'], lat: 41.48, lng: 2.08 },
    { id: 'remolques-madrid', name: 'Krone Madrid · Ejemplo', brand: 'Krone', kind: 'remolque', city: 'Madrid', zones: ['28'], lat: 40.47, lng: -3.74 }
  ];
})();

/* ================= 2. API (única capa de datos: hoy localStorage, mañana fetch) ================= */
/* CAPA DE DATOS. Hoy: localStorage + retardo simulado.
   Mañana: sustituir el cuerpo de cada función por fetch('/api/...') sin tocar app.js.
   Todas las funciones son async para que el cambio sea transparente. */
(function () {
  const T = window.TCTD, P = T.config.prefix;
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(P + k)) ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch { /* modo privado: ignorar */ } };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const blank = () => [{ name: '', price: '', warranty: '', delivery: '' }, { name: '', price: '', warranty: '', delivery: '' }];

  T.api = {
    /* Regla de asignación: marca + cobertura postal (+ suscripción activa, implícita en la demo).
       Nunca se reasigna a otra zona por cercanía. */
    async findDealers({ kind, brands, postal }) {
      return T.dealers.filter(d => d.kind === kind && brands.includes(d.brand) && d.zones.some(z => postal.startsWith(z)));
    },
    /* Marcas con cobertura en esa zona: sirve para sugerir alternativas si no hay match. */
    async brandsCovering(kind, postal) {
      return [...new Set(T.dealers.filter(d => d.kind === kind && d.zones.some(z => postal.startsWith(z))).map(d => d.brand))];
    },
    /* Un lead independiente por concesionario. Sin concesionarios = lista de espera. */
    async submitLead(p) {
      await wait(800);
      const ref = 'TCTD-' + Date.now().toString(36).toUpperCase();
      const base = { ref, createdAt: new Date().toISOString(), kind: p.kind, postal: p.postal, name: p.name, phone: p.phone, email: p.email, notes: p.notes, origin: p.origin };
      const leads = read('leads', []);
      if (p.dealers.length) p.dealers.forEach(d => leads.unshift({ ...base, id: ref + '-' + d.id, dealerId: d.id, brand: d.brand, status: 'nuevo' }));
      else leads.unshift({ ...base, id: ref + '-wait', dealerId: null, brand: p.brands.join(', '), status: 'espera' });
      write('leads', leads);
      return { ref, count: p.dealers.length };
    },
    async allLeads() { return read('leads', []); },
    async listLeads(dealerId) { return read('leads', []).filter(l => l.dealerId === dealerId); },
    async setStatus(id, status) { write('leads', read('leads', []).map(l => (l.id === id ? { ...l, status } : l))); },
    async seedDemo(dealerId) {
      const d = T.dealers.find(x => x.id === dealerId), now = Date.now();
      const rows = [['Ejemplo Martínez', '600000001', 'nuevo', 'Busco tractora para larga distancia'], ['Ejemplo López', '600000002', 'contactado', ''], ['Ejemplo Ruiz', '600000003', 'nuevo', '']];
      const leads = read('leads', []);
      rows.forEach((r, i) => leads.push({ id: 'DEMO-' + now + i, ref: 'DEMO', dealerId, brand: d.brand, kind: d.kind, postal: d.zones[0] + '100', name: r[0], phone: r[1], email: '', notes: r[3], status: r[2], origin: '', createdAt: new Date(now - i * 3600e3 * 5).toISOString() }));
      write('leads', leads);
    },
    clearAll() { try { Object.keys(localStorage).filter(k => k.startsWith(P) && k !== P + 'session').forEach(k => localStorage.removeItem(k)); } catch { /* */ } },
    /* Sesión de DEMO. PRODUCCIÓN: POST /auth/login con cookie httpOnly y roles en servidor;
       nunca validar credenciales en el cliente (aquí cualquiera puede leerlas en el código). */
    auth: {
      session: () => read('session', null),
      async login(user, pass) {
        await wait(500);
        if (user.trim().toLowerCase() === 'admin' && pass === 'admin') { const s = { user: 'Admin', role: 'admin' }; write('session', s); return s; }
        return null;
      },
      logout: () => write('session', null)
    },
    offers: { get: () => read('offers', blank()), set: v => write('offers', v) },
    /* Borrador del formulario (nunca incluye datos personales). */
    draft: { get: () => read('draft', {}), set: v => write('draft', v), clear: () => write('draft', {}) }
  };
})();

/* ================= 3. INTERFAZ (rutas, vistas y eventos) ================= */
/* TCTD · interfaz. Rutas por hash (#/contact) para que el botón "Atrás" del móvil funcione.
   Toda la lógica de datos vive en js/api.js. */
(function () {
  'use strict';
  const T = window.TCTD, A = T.api;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => Number(n).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const KIND = { camion: 'Camión', remolque: 'Semirremolque' };
  const main = $('#main');
  const ref = new URLSearchParams(location.search).get('ref') || '';
  const refDealer = T.dealers.find(d => d.id === ref);

  /* ---------- Estado del asistente de contacto ---------- */
  const fresh = () => ({ step: 1, kind: '', brands: [], postal: '', dealers: [], done: null });
  const w = Object.assign(fresh(), A.draft.get());
  if (refDealer && !w.kind) { w.kind = refDealer.kind; w.brands = [refDealer.brand]; }   // llegada por QR: saltamos el paso 1
  if (w.kind) w.step = 2;
  const go = h => { location.hash = '#/' + h; };

  /* ---------- Navegación ---------- */
  // Vista pública = cliente normal. Las rutas de ADMIN_NAV solo existen con sesión iniciada.
  const NAV = [['home', 'Inicio', 'Inicio'], ['contact', 'Pedir ofertas', 'Ofertas'], ['compare', 'Comparar ofertas', 'Comparar'], ['map', 'Mapa', 'Mapa']];
  const ADMIN_NAV = [['dealers', 'Concesionarios', 'Empresas'], ['account', 'Mi cuenta', 'Cuenta']];
  const GUARDED = ADMIN_NAV.map(x => x[0]);
  function renderNav(cur) {
    const s = A.auth.session(), items = s ? NAV.concat(ADMIN_NAV) : NAV;
    $('#nav').innerHTML = items.map(([k, l]) => `<a href="#/${k}" class="${k === cur ? 'on' : ''} ${k === 'contact' ? 'cta' : ''}">${l}</a>`).join('');
    $('#tabs').innerHTML = items.map(([k, , t]) => `<a href="#/${k}" class="${k === cur ? 'on' : ''}">${t}</a>`).join('');
    $('#auth').innerHTML = s ? `<a class="auth-btn ${cur === 'account' ? 'on' : ''}" href="#/account">👤 ${esc(s.user)}</a><button class="auth-out" id="logout">Salir</button>` : '<a class="auth-btn" href="#/login">Entrar</a>';
  }

  /* ---------- INICIO ---------- */
  const homeView = async () => `
    ${refDealer ? `<div class="banner">Has llegado desde <b>${esc(refDealer.name)}</b>. Pide tu oferta en 1 minuto.</div>` : ''}
    <section class="hero">
      <h1>Pide ofertas de camión o semirremolque a concesionarios de tu zona</h1>
      <p class="lead">Elige marca y código postal. Te llaman solo los concesionarios que trabajan tu marca en tu zona.</p>
      <div class="actions"><a class="btn primary" href="#/contact">Pedir ofertas gratis →</a><a class="btn ghost" href="#/compare">Ya tengo ofertas</a></div>
      <div class="trust"><span>✓ Gratis</span><span>✓ Sin compromiso</span><span>✓ Solo tu zona y tu marca</span></div>
    </section>
    <h2>Así de fácil</h2>
    <div class="steps3">
      <div class="card"><div class="num">1</div><b>Dinos qué buscas</b><p class="muted">Camión o semirremolque, marcas y código postal.</p></div>
      <div class="card"><div class="num">2</div><b>Te llaman</b><p class="muted">En ${T.config.responseTime} te contacta cada concesionario de tu zona.</p></div>
      <div class="card"><div class="num">3</div><b>Tú decides</b><p class="muted">Compara las ofertas aquí y elige la mejor.</p></div>
    </div>
    <div class="card" style="margin-top:14px"><h2>¿Eres concesionario?</h2><p class="muted">Recibe contactos de compradores de tu zona y tu marca. Suscripción mensual, sin comisión por venta.</p><a class="btn sm" href="#/login">Acceder al área profesional</a></div>`;

  /* ---------- PEDIR OFERTAS (asistente de 3 pasos) ---------- */
  const dealerCard = d => `<div class="dealer"><div><b>${esc(d.name)}</b><span class="sub">${esc(d.brand)} · ${esc(d.city)}</span></div><span class="pill">Suscrito</span></div>`;
  const bar = () => `<div class="progress">Paso ${w.step} de 3<div class="bar"><i style="width:${w.step * 33.4}%"></i></div></div>`;

  async function contactView() {
    if (w.done) return doneView();
    if (w.step === 1) return `${bar()}<h1 tabindex="-1">¿Qué quieres comprar?</h1>
      <div class="choices">${Object.entries(KIND).map(([k, l]) => `<button class="choice" data-kind="${k}"><span class="ico">${k === 'camion' ? '🚚' : '🚛'}</span><b>${l}</b></button>`).join('')}</div>`;
    if (w.step === 2) return `${bar()}<h1 tabindex="-1">¿Qué marcas y dónde estás?</h1>
      <p class="muted">Marca las que te interesan (puedes elegir varias).</p>
      <div class="chips">${T.brands[w.kind].map(b => `<button class="chip" data-brand="${esc(b)}" aria-pressed="${w.brands.includes(b)}">${esc(b)}</button>`).join('')}</div>
      <div class="field"><label for="postal">Tu código postal</label><input id="postal" class="postal" inputmode="numeric" autocomplete="postal-code" maxlength="5" placeholder="08130" value="${esc(w.postal)}"></div>
      <div id="match" aria-live="polite"></div>
      <div class="actions"><button class="btn ghost" id="back">← Atrás</button><button class="btn primary" id="next" disabled>Continuar →</button></div>`;
    const names = w.dealers.map(d => `<b>${esc(d.name)}</b>`).join(', ');
    return `${bar()}<h1 tabindex="-1">Último paso: ¿cómo te llamamos?</h1>
      <div class="banner">${w.dealers.length ? `Te contactará${w.dealers.length > 1 ? 'n' : ''}: ${names}` : `Te avisaremos cuando haya concesionario de ${esc(w.brands.join(', '))} en el ${esc(w.postal)}.`}</div>
      <div class="field"><label for="f-name">Nombre</label><input id="f-name" autocomplete="name" placeholder="Tu nombre"><p class="err" id="e-name"></p></div>
      <div class="field"><label for="f-phone">Teléfono móvil</label><input id="f-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="600 123 456"><p class="err" id="e-phone"></p></div>
      <div class="field"><label for="f-email">Email <span>(opcional)</span></label><input id="f-email" type="email" autocomplete="email" placeholder="nombre@empresa.es"><p class="err" id="e-email"></p></div>
      <div class="field"><label for="f-notes">¿Algo que debamos saber? <span>(opcional)</span></label><input id="f-notes" placeholder="Ej. tractora para larga distancia"></div>
      <label class="check"><input type="checkbox" id="f-consent"><span>Acepto que ${w.dealers.length ? 'los concesionarios indicados' : 'TCTD'} me contacten por teléfono o email sobre esta solicitud. Puedo retirar mi autorización cuando quiera. <span class="hint">Demo: tus datos no salen de este navegador. No uses datos reales.</span></span></label><p class="err" id="e-consent"></p>
      <div id="send-error"></div>
      <div class="actions"><button class="btn ghost" id="back">← Atrás</button><button class="btn primary" id="send">${w.dealers.length ? 'Enviar mi solicitud' : 'Avisadme'}</button></div>`;
  }

  let tok = 0;   // evita que una respuesta lenta pise a otra más reciente
  async function updateMatch() {
    const t = ++tok, box = $('#match'), next = $('#next');
    if (!box) return;
    A.draft.set({ kind: w.kind, brands: w.brands, postal: w.postal });
    if (!/^\d{5}$/.test(w.postal) || !w.brands.length) {
      w.dealers = []; next.disabled = true;
      box.innerHTML = `<p class="hint">${!w.brands.length ? 'Elige al menos una marca.' : 'Escribe los 5 números de tu código postal.'}</p>`; return;
    }
    const [d, cov] = await Promise.all([A.findDealers({ kind: w.kind, brands: w.brands, postal: w.postal }), A.brandsCovering(w.kind, w.postal)]);
    if (t !== tok) return;
    w.dealers = d; next.disabled = false;
    if (d.length) { next.textContent = 'Continuar →'; box.innerHTML = `<div class="alert ok"><b>✓ ${d.length} concesionario${d.length > 1 ? 's' : ''} de tu zona</b></div>${d.map(dealerCard).join('')}`; return; }
    const others = cov.filter(b => !w.brands.includes(b));
    next.textContent = 'Avisadme cuando haya →';
    box.innerHTML = `<div class="alert warn"><b>Aún no hay concesionario de esas marcas en tu zona.</b>${others.length ? `<p>En tu zona sí trabajan: ${others.map(b => `<button class="chip" data-add="${esc(b)}">+ ${esc(b)}</button>`).join(' ')}</p>` : ''}<p>O deja tus datos y te avisamos cuando haya uno.</p></div>`;
  }

  async function send() {
    const v = { name: $('#f-name').value.trim(), phone: $('#f-phone').value.replace(/[\s.\-]/g, '').replace(/^(\+34|0034)/, ''), email: $('#f-email').value.trim(), notes: $('#f-notes').value.trim() };
    const e = {};
    if (v.name.length < 2) e.name = 'Escribe tu nombre.';
    if (!/^[6-9]\d{8}$/.test(v.phone)) e.phone = 'Escribe un teléfono de 9 números, por ejemplo 600 123 456.';
    if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) e.email = 'Revisa el email.';
    if (!$('#f-consent').checked) e.consent = 'Necesitamos tu autorización para poder contactarte.';
    ['name', 'phone', 'email', 'consent'].forEach(k => { $('#e-' + k).textContent = e[k] || ''; const i = $('#f-' + k); if (i) i.setAttribute('aria-invalid', !!e[k]); });
    const first = Object.keys(e)[0];
    if (first) { $('#f-' + first).focus(); return; }
    const btn = $('#send'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Enviando…'; $('#send-error').innerHTML = '';
    try {
      const r = await A.submitLead({ ...v, kind: w.kind, brands: w.brands, postal: w.postal, dealers: w.dealers, origin: ref });
      w.done = { ...r, dealers: w.dealers }; A.draft.clear(); render();
    } catch {
      $('#send-error').innerHTML = '<div class="alert bad">No hemos podido enviar tu solicitud. Inténtalo de nuevo.</div>';
      btn.disabled = false; btn.textContent = 'Enviar mi solicitud';
    }
  }

  const doneView = () => {
    const n = w.done.count;
    return `<div class="card done"><div class="tick">✓</div><h1 tabindex="-1">${n ? '¡Solicitud enviada!' : '¡Te avisaremos!'}</h1><p class="muted">Referencia <b>${esc(w.done.ref)}</b></p>
      <ol class="next-list">${n ? `<li><b>${n} concesionario${n > 1 ? 's' : ''}</b> ${n > 1 ? 'han recibido' : 'ha recibido'} tu solicitud.</li><li>Te llamarán en <b>${T.config.responseTime}</b>.</li><li>Cuando tengas sus ofertas, <b>compáralas aquí</b>.</li>` : `<li>Guardamos tu solicitud.</li><li>Te llamaremos cuando haya un concesionario en tu zona.</li>`}</ol>
      <div class="actions" style="justify-content:center"><a class="btn primary" href="#/compare">Comparar ofertas</a><button class="btn" id="again">Nueva solicitud</button></div></div>`;
  };

  /* ---------- COMPARAR ---------- */
  const offers = A.offers.get();
  const FIELDS = [['name', 'Marca y modelo', 'text', 'Ej. Scania R 460'], ['price', 'Precio sin IVA (€)', 'number', '119000'], ['warranty', 'Garantía (meses)', 'number', '24'], ['delivery', 'Entrega (meses)', 'number', '4']];
  const compareView = async () => `<h1 tabindex="-1">Compara tus ofertas</h1><p class="lead">Escribe los datos de cada oferta. El resultado aparece solo.</p>
    <div class="offers">${offers.map((o, i) => `<div class="card"><h2>Oferta ${'AB'[i]}</h2>${FIELDS.map(([k, l, t, p]) => `<div class="field"><label>${l}</label><input data-offer="${i}" data-key="${k}" type="${t}" ${t === 'number' ? 'inputmode="decimal" min="0"' : ''} placeholder="${p}" value="${esc(o[k])}"></div>`).join('')}</div>`).join('')}</div>
    <div id="cmp"></div><div class="actions"><button class="btn ghost sm" id="clear-offers">Borrar datos</button></div>`;
  function cmpResult() {
    const [a, b] = offers;
    if (!(Number(a.price) > 0 && Number(b.price) > 0)) return '<p class="hint">Escribe el precio de las dos ofertas para ver la comparación.</p>';
    const rows = [['price', 'Precio sin IVA', -1, v => money(v)], ['warranty', 'Garantía', 1, v => v + ' meses'], ['delivery', 'Plazo de entrega', -1, v => v + ' meses']];
    const body = rows.map(([k, l, dir, f]) => {
      const x = a[k], y = b[k], win = x !== '' && y !== '' && Number(x) !== Number(y) ? ((Number(x) - Number(y)) * dir > 0 ? 0 : 1) : -1;
      const cell = (o, i) => `<td class="${win === i ? 'best' : ''}">${o[k] === '' ? '—' : f(o[k])}${win === i ? ' ✓' : ''}</td>`;
      return `<tr><th scope="row">${l}</th>${cell(a, 0)}${cell(b, 1)}</tr>`;
    }).join('');
    const diff = Math.abs(a.price - b.price);
    return `<div style="overflow-x:auto;margin-top:16px"><table><thead><tr><th></th><th>${esc(a.name || 'Oferta A')}</th><th>${esc(b.name || 'Oferta B')}</th></tr></thead><tbody>${body}</tbody></table></div>
      <div class="alert ok">${diff ? `La oferta ${Number(a.price) < Number(b.price) ? 'A' : 'B'} es <b>${money(diff)}</b> más barata.` : 'Ambas ofertas cuestan lo mismo.'} ✓ marca la mejor en cada fila.</div>
      <p class="hint">Antes de decidir, pregunta también por equipamiento, consumo, mantenimiento y condiciones de garantía.</p>`;
  }

  /* ---------- MAPA (Leaflet se carga solo al entrar aquí) ---------- */
  let mapObj = null, leafletP;
  const loadLeaflet = () => leafletP || (leafletP = new Promise((ok, ko) => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.append(l);
    const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload = ok; s.onerror = () => { leafletP = null; ko(); }; document.head.append(s);
  }));
  const mapView = async () => `<h1 tabindex="-1">Concesionarios</h1><p class="muted">Puntos de demostración (ficticios).</p>
    <div class="field"><label for="map-brand">Marca</label><select id="map-brand"><option value="">Todas</option>${[...new Set(T.dealers.map(d => d.brand))].map(b => `<option>${esc(b)}</option>`).join('')}</select></div>
    <div id="dealer-map"></div><div id="map-list"></div>`;
  async function mountMap() {
    const sel = $('#map-brand'); let layer = null;
    const draw = () => {
      const list = T.dealers.filter(d => !sel.value || d.brand === sel.value);
      $('#map-list').innerHTML = list.map(d => `<div class="dealer"><div><b>${esc(d.name)}</b><span class="sub">${KIND[d.kind]} · ${esc(d.brand)} · ${esc(d.city)}</span></div><button class="btn sm primary" data-pick="${d.id}">Pedir oferta</button></div>`).join('');
      if (mapObj && layer) { layer.clearLayers(); list.forEach(d => L.marker([d.lat, d.lng]).addTo(layer).bindPopup(`<b>${esc(d.name)}</b>`)); if (list.length) mapObj.fitBounds(L.latLngBounds(list.map(d => [d.lat, d.lng])).pad(.4), { maxZoom: 9 }); }
    };
    sel.onchange = draw; draw();
    try {
      await loadLeaflet(); if (!$('#dealer-map')) return;
      mapObj = L.map('dealer-map', { scrollWheelZoom: false }).setView([40.4, -3.7], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(mapObj);
      layer = L.layerGroup().addTo(mapObj); draw();
    } catch { const m = $('#dealer-map'); if (m) m.outerHTML = '<p class="hint">No se pudo cargar el mapa. Usa la lista.</p>'; }
  }

  /* ---------- CONCESIONARIOS (bandeja de leads + QR) ---------- */
  let cur = refDealer ? refDealer.id : T.dealers[0].id;
  const ST = { nuevo: 'Nuevo', contactado: 'Contactado', cerrado: 'Cerrado' };
  async function dealersView() {
    const leads = await A.listLeads(cur);
    const link = location.origin === 'null' || location.protocol === 'file:' ? location.href.split(/[?#]/)[0] + '?ref=' + cur + '#/contact' : location.origin + location.pathname + '?ref=' + cur + '#/contact';
    return `<h1 tabindex="-1">Área de concesionarios</h1>
      <p class="muted">Suscripción mensual (propuesta fundadores: 49 €/mes), sin comisión por venta. Vista de demostración.</p>
      <div class="field"><label for="dealer-sel">Concesionario</label><select id="dealer-sel">${T.dealers.map(d => `<option value="${d.id}" ${d.id === cur ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>
      <div class="stats"><div class="stat"><b>${leads.filter(l => l.status === 'nuevo').length}</b>Leads nuevos</div><div class="stat"><b>${leads.length}</b>Leads en total</div></div>
      <h2>Tus leads</h2>
      ${leads.length ? leads.map(l => `<div class="lead-card ${l.status}"><div class="row"><b>${esc(l.name)}</b><span class="pill ${l.status}">${ST[l.status] || l.status}</span></div>
        <p>${KIND[l.kind]} ${esc(l.brand)} · CP ${esc(l.postal)} · ${new Date(l.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</p>${l.notes ? `<p class="muted">“${esc(l.notes)}”</p>` : ''}
        <div class="btns"><a class="btn sm primary" href="tel:+34${esc(l.phone)}">📞 Llamar</a><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/34${esc(l.phone)}">WhatsApp</a>
        ${l.status === 'nuevo' ? `<button class="btn sm ghost" data-status="contactado" data-id="${esc(l.id)}">Marcar contactado</button>` : l.status === 'contactado' ? `<button class="btn sm ghost" data-status="cerrado" data-id="${esc(l.id)}">Marcar cerrado</button>` : ''}</div></div>`).join('')
        : '<div class="card"><p class="muted">Aún no tienes leads. Haz una solicitud de prueba o carga ejemplos.</p><button class="btn sm" id="seed">Cargar 3 leads de ejemplo</button></div>'}
      <div class="card"><h2>Tu código QR</h2><p class="muted">Ponlo en tu nave o en tus anuncios: el comprador entra con tu marca ya elegida.</p>
        <div class="qr"><img alt="QR del concesionario" width="170" height="170" src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}"></div>
        <p class="hint" style="overflow-wrap:anywhere">${esc(link)}</p><button class="btn sm" id="copy">Copiar enlace</button></div>
      <p><button class="btn sm ghost" id="wipe">Borrar datos de la demo</button></p>`;
  }

  /* ---------- LOGIN (opcional) y MI CUENTA ---------- */
  const loginView = async () => `<h1 tabindex="-1">Entrar</h1>
    <p class="muted">Opcional: solo para concesionarios y administración. Para pedir ofertas no necesitas cuenta.</p>
    <form id="login-form" class="card" novalidate>
      <div class="field"><label for="l-user">Usuario</label><input id="l-user" autocomplete="username" autocapitalize="none" required></div>
      <div class="field"><label for="l-pass">Contraseña</label><input id="l-pass" type="password" autocomplete="current-password" required></div>
      <p class="err" id="l-err" role="alert"></p>
      <div class="actions"><button class="btn primary" id="l-btn" type="submit">Entrar</button><a class="btn ghost" href="#/home">Volver</a></div>
    </form>`;
  const ST2 = { ...ST, espera: 'En espera' };
  async function accountView() {
    const s = A.auth.session(), leads = await A.allLeads(), n = st => leads.filter(l => l.status === st).length;
    const dn = id => (T.dealers.find(d => d.id === id) || {}).name || 'En espera de cobertura';
    return `<h1 tabindex="-1">Mi cuenta · ${esc(s.user)}</h1><p class="muted">Vista de administración (demo). Aquí ves todos los leads, de todos los concesionarios.</p>
      <div class="stats"><div class="stat"><b>${leads.length}</b>Leads totales</div><div class="stat"><b>${n('nuevo')}</b>Nuevos</div><div class="stat"><b>${n('contactado')}</b>Contactados</div><div class="stat"><b>${n('espera')}</b>Sin cobertura</div></div>
      <div class="actions" style="margin:0 0 18px"><a class="btn primary" href="#/dealers">Área de concesionarios</a><button class="btn" id="logout2">Cerrar sesión</button></div>
      <h2>Todos los leads</h2>
      ${leads.length ? `<div style="overflow-x:auto"><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Teléfono</th><th>Producto</th><th>Destino</th><th>Estado</th></tr></thead><tbody>${leads.map(l => `<tr><td>${new Date(l.createdAt).toLocaleDateString('es-ES')}</td><td>${esc(l.name)}</td><td><a href="tel:+34${esc(l.phone)}">${esc(l.phone)}</a></td><td>${KIND[l.kind]} ${esc(l.brand)}<br><span class="hint">CP ${esc(l.postal)}</span></td><td>${esc(dn(l.dealerId))}</td><td><span class="pill ${l.status}">${ST2[l.status] || l.status}</span></td></tr>`).join('')}</tbody></table></div>`
        : '<div class="card"><p class="muted">Aún no hay leads. Haz una solicitud de prueba como cliente (cierra sesión o abre otra pestaña) y aparecerá aquí.</p></div>'}
      <p style="margin-top:18px"><button class="btn sm ghost" id="wipe">Borrar datos de la demo</button></p>`;
  }

  /* ---------- Render y eventos ---------- */
  const views = { home: homeView, contact: contactView, compare: compareView, map: mapView, dealers: dealersView, login: loginView, account: accountView };
  let rt = 0;
  async function render() {
    const t = ++rt, hash = location.hash.replace(/^#\/?/, ''), name = views[hash] ? hash : 'home', logged = !!A.auth.session();
    if (GUARDED.includes(name) && !logged) return location.replace('#/login');   // áreas internas: requieren sesión
    if (name === 'login' && logged) return location.replace('#/account');
    if (mapObj) { mapObj.remove(); mapObj = null; }
    const html = await views[name](); if (t !== rt) return;
    main.innerHTML = html; renderNav(name); window.scrollTo(0, 0);
    const h = $('h1', main); if (h) h.focus({ preventScroll: true });
    if (name === 'contact' && !w.done && w.step === 2) updateMatch();
    if (name === 'compare') $('#cmp').innerHTML = cmpResult();
    if (name === 'map') mountMap();
  }
  window.addEventListener('hashchange', render);

  main.addEventListener('click', async ev => {
    const el = ev.target.closest('button'); if (!el) return;
    if (el.dataset.kind) { w.kind = el.dataset.kind; w.brands = []; w.step = 2; return render(); }
    if (el.dataset.brand) { const b = el.dataset.brand; w.brands = w.brands.includes(b) ? w.brands.filter(x => x !== b) : [...w.brands, b]; el.setAttribute('aria-pressed', w.brands.includes(b)); return updateMatch(); }
    if (el.dataset.add) { w.brands.push(el.dataset.add); return render(); }
    if (el.dataset.pick) { const d = T.dealers.find(x => x.id === el.dataset.pick); Object.assign(w, fresh(), { kind: d.kind, brands: [d.brand], step: 2 }); return go('contact'); }
    if (el.dataset.status) { await A.setStatus(el.dataset.id, el.dataset.status); return render(); }
    switch (el.id) {
      case 'next': w.step = 3; return render();
      case 'back': w.step = w.step === 3 ? 2 : 1; if (w.step === 1) { w.kind = ''; w.brands = []; } return render();
      case 'send': return send();
      case 'again': Object.assign(w, fresh()); return render();
      case 'seed': await A.seedDemo(cur); return render();
      case 'copy': { const u = $('.qr + .hint').textContent; try { await navigator.clipboard.writeText(u); el.textContent = '✓ Copiado'; } catch { prompt('Copia este enlace:', u); } return; }
      case 'clear-offers': offers.forEach(o => Object.keys(o).forEach(k => (o[k] = ''))); A.offers.set(offers); return render();
      case 'wipe': if (confirm('¿Borrar todos los datos de la demo en este navegador?')) { A.clearAll(); Object.assign(w, fresh()); offers.forEach(o => Object.keys(o).forEach(k => (o[k] = ''))); render(); } return;
    }
  });
  main.addEventListener('input', ev => {
    const el = ev.target;
    if (el.id === 'postal') { w.postal = el.value = el.value.replace(/\D/g, '').slice(0, 5); updateMatch(); }
    if (el.dataset.offer !== undefined) { offers[+el.dataset.offer][el.dataset.key] = el.value; A.offers.set(offers); $('#cmp').innerHTML = cmpResult(); }
  });
  main.addEventListener('submit', async ev => {
    if (ev.target.id !== 'login-form') return;
    ev.preventDefault();
    const b = $('#l-btn'), err = $('#l-err'); err.textContent = ''; b.disabled = true; b.innerHTML = '<span class="spin"></span> Entrando…';
    const s = await A.auth.login($('#l-user').value, $('#l-pass').value);
    if (s) return go('account');
    err.textContent = 'Usuario o contraseña incorrectos.'; b.disabled = false; b.textContent = 'Entrar'; $('#l-pass').value = ''; $('#l-pass').focus();
  });
  const logout = () => { A.auth.logout(); location.hash = '#/home'; render(); };   // vuelve a la vista de cliente
  $('#auth').addEventListener('click', ev => { if (ev.target.id === 'logout') logout(); });
  main.addEventListener('click', ev => { if (ev.target.id === 'logout2') logout(); });
  main.addEventListener('change', ev => { if (ev.target.id === 'dealer-sel') { cur = ev.target.value; render(); } });

  render();
})();

window.TCTD_READY = true;
