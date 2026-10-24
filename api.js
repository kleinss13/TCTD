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
