# TCTD · Tu camión, tu dinero, tu decisión

Aplicación web estática (HTML + CSS + JS, sin build) que conecta a transportistas con concesionarios de camión y semirremolque por **marca + cobertura postal**. Versión de demostración: todo se guarda en el navegador.

## Publicar en GitHub Pages
1. Sube **los 3 archivos** (`index.html`, `styles.css`, `app.js`) a la raíz del repositorio. Sin carpetas: así la subida desde la web de GitHub no falla. `.nojekyll` es opcional.
2. Settings → Pages → Branch `main` → `/(root)`.
3. Si ves "Cargando…", recarga con Ctrl+F5.

## Estructura
- `index.html` · esqueleto
- `styles.css` · tema azul marino, gris, negro y blanco con detalle ámbar; mobile-first
- `app.js` · tres secciones marcadas: 1) datos ficticios, 2) **api** (única capa de datos; para producción, sustituir cada función por `fetch('/api/...')`), 3) interfaz y rutas

## Cómo probar
1. **Comprador**: Inicio → Camión → Scania → CP `08130` → nombre, móvil `611222333`, consentimiento → Enviar.
2. **Concesionario**: *Concesionarios* → "Entrar como concesionario demo" (`concesionario` / `demo`). Verás el lead recién creado, métricas, gráfico, suscripción y QR.
3. **Administración**: `admin` / `admin`; selector para ver todos o cada concesionario.
4. **Sin cobertura**: CP `46001` + Scania → sugiere marcas de la zona o lista de espera.
5. **QR**: `index.html?ref=volvo-bcn` entra con Volvo ya elegido.

## Reglas de negocio
Asignación por marca + cobertura postal + suscripción activa, nunca por cercanía. Un lead independiente por concesionario, con consentimiento explícito. Sin comisión por venta. Se evitan duplicados (mismo teléfono y concesionario en 24 h).

## Antes de producción
Credenciales y datos viven en el cliente: hay que añadir login en servidor, base de datos, envío real de avisos (email/WhatsApp) y política de privacidad (RGPD).
