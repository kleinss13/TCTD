# TCTD · Demo v4 — Pide ofertas a concesionarios de tu zona

Prototipo estático (HTML + CSS + JS, sin build). Publicar en GitHub Pages: sube **los 3 archivos** (`index.html`, `styles.css`, `app.js`) a la raíz del repo → Settings → Pages → rama `main` `/(root)`.

## Estructura
- `index.html` · esqueleto
- `styles.css` · tema claro azul marino + gris, mobile-first
- `app.js` · tres secciones: 1) datos ficticios, 2) **api** (única capa de datos; para producción cambiar cada función por `fetch('/api/...')`), 3) interfaz y rutas (`#/contact`, `#/compare`, `#/map`, `#/dealers`, `#/account`)

Si la página se queda en "Cargando…", falta algún archivo en la raíz del repo o el navegador tiene la versión anterior en caché (Ctrl+F5).

## Login opcional
Botón **Entrar** en la cabecera: usuario `admin`, contraseña `admin`. Sin sesión, la app es la de un cliente normal (sin Concesionarios ni Mi cuenta). Con sesión aparecen *Concesionarios* y *Mi cuenta* (todos los leads). Es solo demo: las credenciales viven en el código; en producción, login en servidor (`api.auth.login`).

## Prueba rápida
1. *Pedir ofertas* → Camión → Scania → CP `08130` → aparece ITT Vallès → nombre, móvil `600123456`, autorización → Enviar.
2. *Concesionarios* → elige ITT Vallès → ves el lead con Llamar / WhatsApp / Marcar contactado.
3. CP `46001` + Scania → sin cobertura: sugiere marcas de la zona o lista de espera.
4. Abre `index.html?ref=volvo-bcn` (simula el QR): entra con Volvo ya elegido.

## Reglas de negocio (sin cambios)
Asignación por marca + cobertura postal + suscripción activa, nunca por cercanía. Un lead independiente por concesionario, con consentimiento explícito. Sin comisión por venta.

## Limitaciones
Sin envío real, cuentas, pagos ni base de datos. Datos solo en el navegador del usuario. Mapa y QR requieren Internet. Cobertura de ejemplo: CP 08 y 28.
