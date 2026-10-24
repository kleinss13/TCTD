/* TCTD · 1/3 DATOS DE DEMO (ficticios).
   PRODUCCIÓN: esto viene del backend (GET /brands, GET /dealers). */
(function () {
  const T = (window.TCTD = window.TCTD || {});
  T.config = { responseTime: '24 horas', prefix: 'tctd_v5_', price: '49 €/mes' };
  T.brands = {
    camion: ['Scania', 'Volvo', 'Mercedes-Benz', 'MAN', 'DAF', 'Renault Trucks', 'Iveco'],
    remolque: ['Lecitrailer', 'Schmitz Cargobull', 'Krone', 'Kögel', 'Lamberet']
  };
  /* zones = prefijos de código postal con cobertura contratada. */
  T.dealers = [
    { id: 'itt-valles', name: 'ITT Vallès (ejemplo)', brand: 'Scania', kind: 'camion', city: 'Vallès', zones: ['08'], lat: 41.54, lng: 2.21 },
    { id: 'volvo-bcn', name: 'Volvo Barcelona (ejemplo)', brand: 'Volvo', kind: 'camion', city: 'Barcelona', zones: ['08'], lat: 41.40, lng: 2.15 },
    { id: 'man-bcn', name: 'MAN Barcelona (ejemplo)', brand: 'MAN', kind: 'camion', city: 'Barcelona', zones: ['08'], lat: 41.44, lng: 2.19 },
    { id: 'scania-madrid', name: 'Scania Madrid (ejemplo)', brand: 'Scania', kind: 'camion', city: 'Madrid', zones: ['28'], lat: 40.44, lng: -3.69 },
    { id: 'mercedes-madrid', name: 'Mercedes-Benz Madrid (ejemplo)', brand: 'Mercedes-Benz', kind: 'camion', city: 'Madrid', zones: ['28'], lat: 40.39, lng: -3.68 },
    { id: 'remolques-valles', name: 'Lecitrailer Vallès (ejemplo)', brand: 'Lecitrailer', kind: 'remolque', city: 'Vallès', zones: ['08'], lat: 41.57, lng: 2.15 },
    { id: 'remolques-bcn', name: 'Schmitz Barcelona (ejemplo)', brand: 'Schmitz Cargobull', kind: 'remolque', city: 'Barcelona', zones: ['08'], lat: 41.48, lng: 2.08 },
    { id: 'remolques-madrid', name: 'Krone Madrid (ejemplo)', brand: 'Krone', kind: 'remolque', city: 'Madrid', zones: ['28'], lat: 40.47, lng: -3.74 }
  ];
  /* SOLO DEMO. PRODUCCIÓN: nunca validar credenciales en el cliente (POST /auth/login). */
  T.users = [
    { user: 'concesionario', pass: 'demo', role: 'dealer', dealerId: 'itt-valles', label: 'ITT Vallès' },
    { user: 'admin', pass: 'admin', role: 'admin', label: 'Administración' }
  ];
})();
/* TCTD · 2/3 API: ÚNICA capa de datos. Hoy localStorage + retardo simulado.
   PRODUCCIÓN: sustituir el cuerpo de cada función por fetch('/api/...'). app.js no cambia. */
(function () {
  const T = window.TCTD, P = T.config.prefix;
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(P + k)) ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch { /* modo privado */ } };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const blank = () => [{ name: '', price: '', warranty: '', delivery: '' }, { name: '', price: '', warranty: '', delivery: '' }];
  const DAY = 864e5;

  T.api = {
    /* Asignación: marca + cobertura postal (+ suscripción activa, implícita en la demo). Nunca por cercanía. */
    async findDealers({ kind, brands, postal }) {
      return T.dealers.filter(d => d.kind === kind && brands.includes(d.brand) && d.zones.some(z => postal.startsWith(z)));
    },
    async brandsCovering(kind, postal) {
      return [...new Set(T.dealers.filter(d => d.kind === kind && d.zones.some(z => postal.startsWith(z))).map(d => d.brand))];
    },
    /* Un lead independiente por concesionario. Sin concesionarios = lista de espera. Evita duplicados en 24 h. */
    async submitLead(p) {
      await wait(900);
      const ref = 'TCTD-' + Date.now().toString(36).toUpperCase();
      const base = { ref, createdAt: new Date().toISOString(), kind: p.kind, postal: p.postal, name: p.name, phone: p.phone, email: p.email, notes: p.notes, urgency: p.urgency, origin: p.origin };
      const leads = read('leads', []);
      if (p.dealers.length) {
        p.dealers.forEach(d => {
          const dup = leads.some(l => l.dealerId === d.id && l.phone === p.phone && Date.now() - new Date(l.createdAt) < DAY);
          if (!dup) leads.unshift({ ...base, id: ref + '-' + d.id, dealerId: d.id, brand: d.brand, status: 'nuevo' });
        });
      } else leads.unshift({ ...base, id: ref + '-wait', dealerId: null, brand: p.brands.join(', '), status: 'espera' });
      write('leads', leads);
      return { ref, count: p.dealers.length };
    },
    async listLeads(dealerId) { const l = read('leads', []); return dealerId === 'all' ? l : l.filter(x => x.dealerId === dealerId); },
    async setStatus(id, status) { write('leads', read('leads', []).map(l => (l.id === id ? { ...l, status } : l))); },
    /* Leads de ejemplo para que el panel nunca se vea vacío en la demo (marcados demo:true). */
    async seedDemo(dealerId) {
      if (read('seeded_' + dealerId, false)) return;
      const d = T.dealers.find(x => x.id === dealerId), now = Date.now();
      const names = ['Antonio R.', 'Josep M.', 'Carlos G.', 'Miguel Á.', 'Pau S.', 'Rafael L.', 'Jordi P.', 'Manuel T.', 'Sergio V.', 'David C.', 'Ramón F.', 'Iván B.'];
      const urg = ['ya', '1-3', 'mirando', '1-3', 'ya', 'mirando'];
      const sts = ['nuevo', 'nuevo', 'nuevo', 'contactado', 'contactado', 'cerrado', 'contactado', 'cerrado', 'contactado', 'cerrado', 'contactado', 'cerrado'];
      const ago = [2, 5, 20, 30, 50, 70, 96, 120, 150, 190, 230, 290];   // horas
      const leads = read('leads', []);
      names.forEach((n, i) => leads.push({
        id: 'DEMO-' + dealerId + i, ref: 'DEMO', demo: true, dealerId, brand: d.brand, kind: d.kind, postal: d.zones[0] + (100 + i * 7),
        name: n, phone: '6000000' + String(10 + i), email: '', notes: i % 3 === 0 ? 'Busco una unidad de larga distancia' : '',
        urgency: urg[i % 6], status: sts[i], origin: '', createdAt: new Date(now - ago[i] * 36e5).toISOString()
      }));
      write('leads', leads); write('seeded_' + dealerId, true);
    },
    clearAll() { try { Object.keys(localStorage).filter(k => k.startsWith(P) && k !== P + 'session').forEach(k => localStorage.removeItem(k)); } catch { /* */ } },
    auth: {
      session: () => read('session', null),
      async login(user, pass) {
        await wait(500);
        const u = T.users.find(x => x.user === user.trim().toLowerCase() && x.pass === pass);
        if (!u) return null;
        const s = { user: u.label, role: u.role, dealerId: u.dealerId || null }; write('session', s); return s;
      },
      logout: () => write('session', null)
    },
    offers: { get: () => read('offers', blank()), set: v => write('offers', v) },
    draft: { get: () => read('draft', {}), set: v => write('draft', v), clear: () => write('draft', {}) }   // nunca guarda datos personales
  };
})();
/* TCTD · 3/3 INTERFAZ. Rutas por hash (#/contact) para que "Atrás" funcione en el móvil.
   Toda la lógica de datos vive en api.js. */
(function () {
  'use strict';
  const T = window.TCTD, A = T.api;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => Number(n).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const KIND = { camion: 'Camión', remolque: 'Semirremolque' };
  const URG = { ya: 'Compra ya', '1-3': 'En 1-3 meses', mirando: 'Está mirando' };
  const ST = { nuevo: 'Nuevo', contactado: 'Contactado', cerrado: 'Cerrado', espera: 'En espera' };
  const ICON = {
    camion: '<svg viewBox="0 0 64 40" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h30v22H4zM34 14h12l8 8v8H34z"/><circle cx="16" cy="32" r="4" fill="#fff"/><circle cx="44" cy="32" r="4" fill="#fff"/></svg>',
    remolque: '<svg viewBox="0 0 64 40" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h58v22H3z"/><path d="M8 28v4M56 28v4"/><circle cx="46" cy="32" r="4" fill="#fff"/><circle cx="34" cy="32" r="4" fill="#fff"/><path d="M3 28h8"/></svg>'
  };
  const main = $('#main'), ref = new URLSearchParams(location.search).get('ref') || '';
  const refDealer = T.dealers.find(d => d.id === ref);
  const go = h => { location.hash = '#/' + h; };
  const ago = iso => { const h = (Date.now() - new Date(iso)) / 36e5; return h < 1 ? 'hace minutos' : h < 24 ? `hace ${Math.floor(h)} h` : `hace ${Math.floor(h / 24)} d`; };
  const page = (inner, cls = '') => `<div class="wrap page ${cls}">${inner}</div>`;

  /* ---------- Estado del asistente ---------- */
  const fresh = () => ({ step: 1, kind: '', brands: [], postal: '', urgency: '', dealers: [], done: null });
  const w = Object.assign(fresh(), A.draft.get(), { step: 1, done: null, dealers: [] });
  if (refDealer && !w.kind) { w.kind = refDealer.kind; w.brands = [refDealer.brand]; }   // llegada por QR
  if (ref && !location.hash) location.hash = '#/contact';

  /* ---------- Navegación ---------- */
  const NAV = [['home', 'Inicio'], ['compare', 'Comparar ofertas'], ['map', 'Mapa'], ['contact', 'Pedir ofertas']];
  const TABS = [['home', 'Inicio'], ['contact', 'Ofertas'], ['compare', 'Comparar'], ['map', 'Mapa']];
  function renderNav(cur) {
    const s = A.auth.session(), extra = s ? [['panel', 'Mi panel']] : [];
    $('#nav').innerHTML = NAV.map(([k, l]) => `<a href="#/${k}" class="${k === cur ? 'on' : ''} ${k === 'contact' ? 'cta' : ''}">${l}</a>`).join('');
    $('#tabs').innerHTML = TABS.concat(extra.length ? [['panel', 'Panel']] : []).map(([k, l]) => `<a href="#/${k}" class="${k === cur ? 'on' : ''}">${l}</a>`).join('');
    $('#auth').innerHTML = s ? `<a class="auth-btn ${cur === 'panel' ? 'on' : ''}" href="#/panel">${esc(s.user)}</a><button class="auth-out" id="logout">Salir</button>` : '<a class="auth-btn" href="#/login">Concesionarios</a>';
  }

  /* ---------- INICIO ---------- */
  const homeView = async () => `
    <section class="hero"><div class="wrap hero-in">
      <div>
        <h1>Pide ofertas de camión o semirremolque a concesionarios de tu zona</h1>
        <p class="lead">Dinos qué marca buscas y tu código postal. Solo te llamarán los concesionarios oficiales que trabajan tu marca donde tú estás.</p>
        <div class="trust"><span>Gratis</span><span>Sin compromiso</span><span>Tus datos, solo con tu permiso</span></div>
      </div>
      <div class="start"><h2>¿Qué quieres comprar?</h2><p class="muted" style="margin:0">Elige una opción y te lo preparamos en 1 minuto.</p>
        <div class="kinds">${Object.entries(KIND).map(([k, l]) => `<button class="kind" data-start="${k}">${ICON[k]}<b>${l}</b></button>`).join('')}</div>
        <a class="hint" href="#/compare">¿Ya tienes ofertas? Compáralas aquí</a></div>
    </div></section>
    <div class="wrap page" style="padding-top:34px">
      <h2>Así de fácil</h2>
      <div class="steps3">
        <div class="card step"><span class="num">1</span><div><h3>Dinos qué buscas</h3><p>Tipo de vehículo, marcas y código postal.</p></div></div>
        <div class="card step"><span class="num">2</span><div><h3>Te llaman</h3><p>En ${T.config.responseTime} te contacta cada concesionario de tu zona.</p></div></div>
        <div class="card step"><span class="num">3</span><div><h3>Tú decides</h3><p>Compara las ofertas con calma y elige la mejor.</p></div></div>
      </div>
      <div class="band section"><div><h2>¿Eres concesionario?</h2><p>Recibe compradores de tu marca y tu zona. Suscripción mensual desde ${T.config.price}, sin comisión por venta.</p></div><a class="btn amber" href="#/login">Acceder al panel</a></div>
    </div>`;

  /* ---------- PEDIR OFERTAS (2 pasos) ---------- */
  const bar = () => `<div class="progress">Paso ${w.step} de 2 · ${w.step === 1 ? 'Qué buscas' : 'Tus datos'}<div class="bar"><i style="width:${w.step * 50}%"></i></div></div>`;
  const dealerCard = d => `<div class="dealer"><div><b>${esc(d.name)}</b><span class="sub">${esc(d.brand)} · ${esc(d.city)}</span></div><span class="pill">Concesionario activo</span></div>`;

  async function contactView() {
    if (w.done) return page(doneView(), 'narrow');
    if (w.step === 1) return page(`${bar()}<h1 tabindex="-1">¿Qué quieres comprar?</h1>
      <div class="kinds">${Object.entries(KIND).map(([k, l]) => `<button class="kind" data-kind="${k}" aria-pressed="${w.kind === k}">${ICON[k]}<b>${l}</b></button>`).join('')}</div>
      ${w.kind ? `<span class="label">¿Qué marcas te interesan? <span class="hint">(puedes elegir varias)</span></span>
      <div class="chips">${T.brands[w.kind].map(b => `<button class="chip" data-brand="${esc(b)}" aria-pressed="${w.brands.includes(b)}">${esc(b)}</button>`).join('')}</div>
      <div class="field" style="margin-top:20px"><label for="postal">Tu código postal</label><input id="postal" class="postal" inputmode="numeric" autocomplete="postal-code" maxlength="5" placeholder="08130" value="${esc(w.postal)}"></div>
      <div id="match" aria-live="polite"></div>
      <div class="actions"><button class="btn primary" id="next" disabled>Continuar</button></div>` : '<p class="muted">Toca una opción para empezar.</p>'}`, 'narrow');
    const names = w.dealers.map(d => `<b>${esc(d.name)}</b>`).join(', ');
    return page(`${bar()}<h1 tabindex="-1">Último paso: ¿cómo te llamamos?</h1>
      <div class="alert info">${w.dealers.length ? `Recibirán tu solicitud: ${names}.` : `Te avisaremos cuando haya concesionario de ${esc(w.brands.join(', '))} en el ${esc(w.postal)}.`}</div>
      <div class="field"><label for="f-name">Nombre</label><input id="f-name" autocomplete="name" placeholder="Tu nombre"><p class="err" id="e-name"></p></div>
      <div class="field"><label for="f-phone">Teléfono móvil</label><input id="f-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="600 123 456"><p class="err" id="e-phone"></p></div>
      <span class="label" style="margin-top:6px">¿Cuándo piensas comprar? <span class="hint">(opcional)</span></span>
      <div class="chips">${Object.entries(URG).map(([k, l]) => `<button class="chip" data-urg="${k}" aria-pressed="${w.urgency === k}">${l}</button>`).join('')}</div>
      <div class="field" style="margin-top:18px"><label for="f-email">Email <span>(opcional)</span></label><input id="f-email" type="email" autocomplete="email" placeholder="nombre@empresa.es"><p class="err" id="e-email"></p></div>
      <div class="field"><label for="f-notes">¿Algo que debamos saber? <span>(opcional)</span></label><input id="f-notes" placeholder="Ej. tractora para larga distancia"></div>
      <div class="hp" aria-hidden="true"><label>Web<input id="f-web" tabindex="-1" autocomplete="off"></label></div>
      <label class="check"><input type="checkbox" id="f-consent"><span>Acepto que ${w.dealers.length ? 'los concesionarios indicados' : 'TCTD'} me contacten por teléfono o email sobre esta solicitud. Puedo retirar mi autorización cuando quiera.</span></label><p class="err" id="e-consent"></p>
      <p class="hint">Versión de demostración: tus datos no salen de este navegador. No introduzcas datos reales.</p>
      <div id="send-error"></div>
      <div class="actions"><button class="btn ghost" id="back">Atrás</button><button class="btn primary" id="send">${w.dealers.length ? 'Enviar mi solicitud' : 'Avisadme'}</button></div>`, 'narrow');
  }

  let tok = 0;   // evita que una respuesta lenta pise a otra más reciente
  async function updateMatch() {
    const t = ++tok, box = $('#match'), next = $('#next');
    if (!box) return;
    A.draft.set({ kind: w.kind, brands: w.brands, postal: w.postal });
    if (!/^\d{5}$/.test(w.postal) || !w.brands.length) {
      w.dealers = []; next.disabled = true; next.textContent = 'Continuar';
      box.innerHTML = `<p class="hint">${!w.brands.length ? 'Elige al menos una marca.' : 'Escribe los 5 números de tu código postal.'}</p>`; return;
    }
    const [d, cov] = await Promise.all([A.findDealers({ kind: w.kind, brands: w.brands, postal: w.postal }), A.brandsCovering(w.kind, w.postal)]);
    if (t !== tok) return;
    w.dealers = d; next.disabled = false;
    if (d.length) { next.textContent = 'Continuar'; box.innerHTML = `<div class="alert ok"><b>✓ ${d.length} concesionario${d.length > 1 ? 's' : ''} en tu zona</b></div>${d.map(dealerCard).join('')}`; return; }
    const others = cov.filter(b => !w.brands.includes(b));
    next.textContent = 'Avisadme cuando haya';
    box.innerHTML = `<div class="alert warn"><b>Todavía no hay concesionario de esas marcas en tu zona.</b>${others.length ? `<p>En tu zona sí trabajan: ${others.map(b => `<button class="chip" data-add="${esc(b)}">+ ${esc(b)}</button>`).join(' ')}</p>` : ''}<p>También puedes dejar tus datos y te avisamos cuando haya uno.</p></div>`;
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
      if ($('#f-web').value) { w.done = { ref: 'TCTD-OK', count: w.dealers.length }; return render(); }   // antispam: trampa para bots
      const r = await A.submitLead({ ...v, kind: w.kind, brands: w.brands, postal: w.postal, dealers: w.dealers, urgency: w.urgency, origin: ref });
      w.done = r; A.draft.clear(); render();
    } catch {
      $('#send-error').innerHTML = '<div class="alert bad">No hemos podido enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.</div>';
      btn.disabled = false; btn.textContent = 'Enviar mi solicitud';
    }
  }

  const doneView = () => {
    const n = w.done.count;
    return `<div class="card done"><div class="tick">✓</div><h1 tabindex="-1">${n ? '¡Solicitud enviada!' : '¡Anotado, te avisaremos!'}</h1><p class="muted">Tu referencia es <b>${esc(w.done.ref)}</b></p>
      <ol class="next-list">${n ? `<li><b>${n} concesionario${n > 1 ? 's' : ''}</b> ${n > 1 ? 'han recibido' : 'ha recibido'} tu solicitud.</li><li>Te llamarán en <b>${T.config.responseTime}</b>.</li><li>Cuando tengas sus ofertas, <b>compáralas aquí</b>.</li>` : '<li>Hemos guardado tu solicitud.</li><li>Te contactaremos en cuanto haya un concesionario en tu zona.</li>'}</ol>
      <div class="actions" style="justify-content:center"><a class="btn primary" href="#/compare">Comparar ofertas</a><button class="btn" id="again">Nueva solicitud</button></div></div>`;
  };

  /* ---------- COMPARAR ---------- */
  const offers = A.offers.get();
  const FIELDS = [['name', 'Marca y modelo', 'text', 'Ej. Scania R 460'], ['price', 'Precio sin IVA (€)', 'number', '119000'], ['warranty', 'Garantía (meses)', 'number', '24'], ['delivery', 'Plazo de entrega (meses)', 'number', '4']];
  const compareView = async () => page(`<h1 tabindex="-1">Compara tus ofertas</h1><p class="lead">Escribe los datos de cada oferta. El resultado aparece solo.</p>
    <div class="offers">${offers.map((o, i) => `<div class="card"><h2>Oferta ${'AB'[i]}</h2>${FIELDS.map(([k, l, t, p]) => `<div class="field"><label for="o${i}${k}">${l}</label><input id="o${i}${k}" data-offer="${i}" data-key="${k}" type="${t}" ${t === 'number' ? 'inputmode="decimal" min="0"' : ''} placeholder="${p}" value="${esc(o[k])}"></div>`).join('')}</div>`).join('')}</div>
    <div id="cmp"></div><div class="actions"><button class="btn ghost sm" id="clear-offers">Borrar datos</button></div>`);
  function cmpResult() {
    const [a, b] = offers;
    if (!(Number(a.price) > 0 && Number(b.price) > 0)) return '<p class="hint" style="margin-top:16px">Escribe el precio de las dos ofertas para ver la comparación.</p>';
    const rows = [['price', 'Precio sin IVA', -1, v => money(v)], ['warranty', 'Garantía', 1, v => v + ' meses'], ['delivery', 'Plazo de entrega', -1, v => v + ' meses']], wins = [0, 0];
    const body = rows.map(([k, l, dir, f]) => {
      const x = a[k], y = b[k], win = x !== '' && y !== '' && Number(x) !== Number(y) ? ((Number(x) - Number(y)) * dir > 0 ? 1 : 0) : -1;   // índice de la ganadora
      if (win > -1) wins[win]++;
      const cell = (o, i) => `<td class="${win === i ? 'best' : ''}">${o[k] === '' ? '—' : f(o[k])}${win === i ? ' ✓' : ''}</td>`;
      return `<tr><th scope="row">${l}</th>${cell(a, 0)}${cell(b, 1)}</tr>`;
    }).join('');
    const diff = Math.abs(a.price - b.price), cheap = Number(a.price) < Number(b.price) ? 'A' : 'B', best = wins[0] === wins[1] ? '' : wins[0] > wins[1] ? 'A' : 'B';
    return `<div class="scroll" style="margin-top:18px"><table><thead><tr><th></th><th>${esc(a.name || 'Oferta A')}</th><th>${esc(b.name || 'Oferta B')}</th></tr></thead><tbody>${body}</tbody></table></div>
      <div class="alert ok">${diff ? `La oferta ${cheap} es <b>${money(diff)}</b> más barata.` : 'Ambas ofertas cuestan lo mismo.'}${best ? ` La oferta <b>${best}</b> gana en más apartados.` : ''}</div>
      <p class="hint">✓ marca la mejor en cada fila. Antes de decidir, pregunta también por equipamiento, consumo, mantenimiento y condiciones de garantía.</p>`;
  }

  /* ---------- MAPA (Leaflet se carga solo al entrar aquí) ---------- */
  let mapObj = null, leafletP;
  const loadLeaflet = () => leafletP || (leafletP = new Promise((ok, ko) => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.append(l);
    const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload = ok; s.onerror = () => { leafletP = null; ko(); }; document.head.append(s);
  }));
  const mapView = async () => page(`<h1 tabindex="-1">Concesionarios</h1><p class="muted">Puntos de demostración (ficticios).</p>
    <div class="field"><label for="map-brand">Marca</label><select id="map-brand"><option value="">Todas</option>${[...new Set(T.dealers.map(d => d.brand))].map(b => `<option>${esc(b)}</option>`).join('')}</select></div>
    <div id="dealer-map"></div><div id="map-list"></div>`);
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
    } catch { const m = $('#dealer-map'); if (m) m.outerHTML = '<p class="hint">No se pudo cargar el mapa. Usa la lista de abajo.</p>'; }
  }

  /* ---------- LOGIN ---------- */
  const loginView = async () => page(`<h1 tabindex="-1">Acceso para concesionarios</h1>
    <p class="muted">Consulta los contactos que te han llegado y tus datos. Para pedir ofertas no necesitas cuenta.</p>
    <form id="login-form" class="card" novalidate>
      <div class="field"><label for="l-user">Usuario</label><input id="l-user" autocomplete="username" autocapitalize="none" required></div>
      <div class="field"><label for="l-pass">Contraseña</label><input id="l-pass" type="password" autocomplete="current-password" required></div>
      <p class="err" id="l-err" role="alert"></p>
      <div class="actions" style="margin-top:6px"><button class="btn primary" id="l-btn" type="submit">Entrar</button><a class="btn ghost" href="#/home">Volver</a></div>
    </form>
    <div class="alert info"><b>Acceso de demostración</b><p>Usuario <b>concesionario</b> · contraseña <b>demo</b> (panel de ITT Vallès). Administración: <b>admin</b> / <b>admin</b>.</p><div class="btns"><button class="btn sm" id="demo-login">Entrar como concesionario demo</button></div></div>`, 'narrow');

  /* ---------- PANEL DEL CONCESIONARIO ---------- */
  let cur = null, flt = 'todos';
  async function panelView() {
    const s = A.auth.session();
    const cur0 = s.role === 'dealer' ? s.dealerId : (cur || 'all');
    if (s.role === 'dealer') await A.seedDemo(s.dealerId);
    const all = await A.listLeads(cur0), dealer = T.dealers.find(d => d.id === cur0);
    const n = st => all.filter(l => l.status === st).length;
    const att = all.length ? Math.round(((n('contactado') + n('cerrado')) / all.length) * 100) : 0;
    const week = all.filter(l => Date.now() - new Date(l.createdAt) < 7 * 864e5).length;
    const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (13 - i)); return d; });
    const counts = days.map(d => all.filter(l => { const x = new Date(l.createdAt); return x >= d && x < new Date(+d + 864e5); }).length), mx = Math.max(1, ...counts);
    const list = all.filter(l => flt === 'todos' || l.status === flt);
    const link = location.protocol === 'file:' ? location.href.split(/[?#]/)[0] + '?ref=' + cur0 : location.origin + location.pathname + '?ref=' + cur0;
    const dn = id => (T.dealers.find(d => d.id === id) || {}).name || 'En espera de cobertura';
    const fb = (k, l) => `<button class="chip" data-flt="${k}" aria-pressed="${flt === k}">${l}${k === 'todos' ? ` (${all.length})` : ` (${n(k)})`}</button>`;
    return page(`<div class="panel-head"><div><h1 tabindex="-1">${s.role === 'admin' ? 'Panel de administración' : 'Tu panel'}</h1><p class="muted" style="margin:0">${dealer ? esc(dealer.name) : 'Todos los concesionarios'}</p></div>
      ${s.role === 'admin' ? `<div class="field" style="margin:0;flex:1 1 260px"><label for="dealer-sel">Ver</label><select id="dealer-sel"><option value="all">Todos los concesionarios</option>${T.dealers.map(d => `<option value="${d.id}" ${d.id === cur0 ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>` : ''}</div>
      <div class="stats"><div class="stat hot"><b>${n('nuevo')}</b><span>Por atender</span></div><div class="stat"><b>${all.length}</b><span>Contactos totales</span></div><div class="stat"><b>${week}</b><span>Últimos 7 días</span></div><div class="stat"><b>${att}%</b><span>Atendidos</span></div></div>
      <div class="cols"><div class="card"><h2>Contactos recibidos (14 días)</h2>${all.length ? `<div class="chart" role="img" aria-label="Contactos por día">${counts.map((c, i) => `<i class="${c ? '' : 'z'}" style="height:${c ? Math.max(8, c / mx * 100) : 3}%" title="${days[i].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}: ${c}"></i>`).join('')}</div><div class="chart-x"><span>${days[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span><span>Hoy</span></div>` : '<p class="muted">Aún no hay datos.</p>'}</div>
      ${dealer ? `<div class="card"><h2>Tu suscripción</h2><dl class="kv"><dt>Estado</dt><dd><span class="pill">Activa</span></dd><dt>Plan</dt><dd>Fundadores · ${T.config.price}</dd><dt>Marca</dt><dd>${esc(dealer.brand)}</dd><dt>Zona</dt><dd>CP ${dealer.zones.map(z => esc(z) + 'xxx').join(', ')}</dd><dt>Comisión</dt><dd>Ninguna</dd></dl></div>` : `<div class="card"><h2>Resumen</h2><dl class="kv"><dt>Concesionarios</dt><dd>${T.dealers.length}</dd><dt>En espera</dt><dd>${n('espera')}</dd></dl></div>`}</div>
      <h2 style="margin-top:22px">Tus contactos</h2>
      <div class="tabsbar" style="margin-top:0">${fb('todos', 'Todos')}${fb('nuevo', 'Nuevos')}${fb('contactado', 'Contactados')}${fb('cerrado', 'Cerrados')}</div>
      <div class="leads">${list.length ? list.map(l => `<article class="lead-card ${l.status}"><div class="row"><b>${esc(l.name)}</b><span class="pill ${l.status}">${ST[l.status] || l.status}</span></div>
        <p>${KIND[l.kind]} ${esc(l.brand)} · CP ${esc(l.postal)}</p><p class="hint">${ago(l.createdAt)}${s.role === 'admin' ? ' · ' + esc(dn(l.dealerId)) : ''}${l.demo ? ' · ejemplo' : ''}</p>
        <p>${l.urgency ? `<span class="tag ${l.urgency === 'ya' ? 'hotl' : ''}">${URG[l.urgency]}</span>` : ''}</p>${l.notes ? `<p class="muted">“${esc(l.notes)}”</p>` : ''}
        <div class="btns"><a class="btn sm primary" href="tel:+34${esc(l.phone)}">Llamar</a><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/34${esc(l.phone)}">WhatsApp</a>
        ${l.status === 'nuevo' ? `<button class="btn sm ghost" data-status="contactado" data-id="${esc(l.id)}">Marcar contactado</button>` : l.status === 'contactado' ? `<button class="btn sm ghost" data-status="cerrado" data-id="${esc(l.id)}">Marcar cerrado</button>` : ''}</div></article>`).join('')
        : '<div class="card"><p class="muted" style="margin:0">No hay contactos en esta lista. Cuando un comprador te elija, aparecerá aquí.</p></div>'}</div>
      ${dealer ? `<div class="card" style="margin-top:18px"><h2>Tu código QR</h2><p class="muted">Ponlo en tu nave o en tus anuncios: el comprador entra con tu marca ya elegida.</p>
        <div class="qr"><img alt="Código QR de ${esc(dealer.name)}" width="150" height="150" src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}"><div><p class="hint" id="qr-link" style="overflow-wrap:anywhere;max-width:340px">${esc(link)}</p><button class="btn sm" id="copy">Copiar enlace</button></div></div></div>` : ''}
      <p style="margin-top:18px"><button class="btn sm ghost" id="wipe">Borrar datos de la demo</button></p>`);
  }

  /* ---------- Render y eventos ---------- */
  const views = { home: homeView, contact: contactView, compare: compareView, map: mapView, login: loginView, panel: panelView };
  let rt = 0;
  async function render() {
    const t = ++rt, hash = location.hash.replace(/^#\/?/, '').split('?')[0], name = views[hash] ? hash : 'home', logged = !!A.auth.session();
    if (name === 'panel' && !logged) return location.replace('#/login');
    if (name === 'login' && logged) return location.replace('#/panel');
    if (mapObj) { mapObj.remove(); mapObj = null; }
    const html = await views[name](); if (t !== rt) return;
    main.innerHTML = html; renderNav(name); window.scrollTo(0, 0);
    const h = $('h1', main); if (h) h.focus({ preventScroll: true });
    if (name === 'contact' && !w.done && w.step === 1 && w.kind) updateMatch();
    if (name === 'compare') $('#cmp').innerHTML = cmpResult();
    if (name === 'map') mountMap();
  }
  window.addEventListener('hashchange', render);

  main.addEventListener('click', async ev => {
    const el = ev.target.closest('button'); if (!el) return;
    const d = el.dataset;
    if (d.start) { Object.assign(w, fresh(), { kind: d.start }); A.draft.set({ kind: w.kind }); return go('contact'); }
    if (d.kind) { if (w.kind !== d.kind) { w.kind = d.kind; w.brands = []; } return render(); }
    if (d.brand) { w.brands = w.brands.includes(d.brand) ? w.brands.filter(x => x !== d.brand) : [...w.brands, d.brand]; el.setAttribute('aria-pressed', w.brands.includes(d.brand)); return updateMatch(); }
    if (d.add) { w.brands.push(d.add); return render(); }
    if (d.urg) { w.urgency = w.urgency === d.urg ? '' : d.urg; main.querySelectorAll('[data-urg]').forEach(b => b.setAttribute('aria-pressed', b.dataset.urg === w.urgency)); return; }
    if (d.pick) { const x = T.dealers.find(y => y.id === d.pick); Object.assign(w, fresh(), { kind: x.kind, brands: [x.brand] }); return go('contact'); }
    if (d.flt) { flt = d.flt; return render(); }
    if (d.status) { await A.setStatus(d.id, d.status); return render(); }
    switch (el.id) {
      case 'next': w.step = 2; return render();
      case 'back': w.step = 1; return render();
      case 'send': return send();
      case 'again': Object.assign(w, fresh()); return render();
      case 'demo-login': { el.disabled = true; await A.auth.login('concesionario', 'demo'); return go('panel'); }
      case 'copy': { const u = $('#qr-link').textContent; try { await navigator.clipboard.writeText(u); el.textContent = '✓ Copiado'; } catch { prompt('Copia este enlace:', u); } return; }
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
    if (s) return go('panel');
    err.textContent = 'Usuario o contraseña incorrectos.'; b.disabled = false; b.textContent = 'Entrar'; $('#l-pass').value = ''; $('#l-pass').focus();
  });
  main.addEventListener('change', ev => { if (ev.target.id === 'dealer-sel') { cur = ev.target.value; render(); } });
  $('#auth').addEventListener('click', ev => { if (ev.target.id === 'logout') { A.auth.logout(); cur = null; location.hash = '#/home'; render(); } });

  render();
  window.TCTD_READY = true;
})();
