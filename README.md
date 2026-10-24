# TCTD · Demo v3 — Captación de leads por zona

**Tu camión, tu dinero, tu decisión.** Prototipo estático navegable, con diseño corporativo azul marino y gris. No hay backend ni envíos reales.

## Publicación en GitHub Pages

1. Crea un repositorio público nuevo en GitHub.
2. Descomprime el ZIP y sube **los archivos interiores** (`index.html`, `styles.css`, `app.js`, `README.md`, `.gitignore`) a la raíz del repositorio. No subas el ZIP sin extraer.
3. Ve a **Settings → Pages → Build and deployment**.
4. Selecciona **Deploy from a branch**, rama **main**, carpeta **/(root)** y guarda.
5. Abre la URL de GitHub Pages que aparezca en la configuración.

También puedes abrir `index.html` directamente para una vista local. El mapa y el QR necesitan Internet.

## Recorrido de prueba recomendado

1. En **Mi camión**, completa el cuestionario orientativo.
2. En **Contactar**, elige **Camión**, código postal **08130**, marca **Scania** y pulsa **Ver concesionarios asignados**. Aparece **ITT Vallès · Ejemplo**. También puedes elegir Volvo y MAN para comprobar múltiples destinatarios.
3. Introduce datos **ficticios** y marca la casilla de consentimiento. Pulsa **Simular envío de leads**. Se guarda solo un registro anónimo de la simulación en `localStorage`.
4. Cambia a **Semirremolque**, CP **08130** y selecciona **Lecitrailer** o **Schmitz Cargobull**.
5. En **Mapa**, explora las ubicaciones ficticias. En **Comparar**, introduce manualmente dos ofertas para comparar sus datos.
6. En **Concesionarios**, visualiza el panel de prueba y el QR con referencia `itt-valles`.

## Lógica de negocio acordada

- El transportista accede gratis, incluso desde un QR único de un concesionario.
- Selecciona tipo de producto, marcas y código postal.
- El sistema consulta **marca + cobertura territorial + suscripción activa** para determinar el concesionario que debe recibir cada lead. **No** basta con elegir el más cercano.
- Se solicita consentimiento explícito antes de transmitir datos a las empresas seleccionadas.
- En producción, TCTD enviará un lead independiente a cada concesionario asignado. La negociación, presupuestos y venta son responsabilidad del concesionario.
- El comprador podrá cargar por su cuenta las ofertas recibidas en un espacio privado para compararlas. Los concesionarios no verán las ofertas rivales.
- Concesionarios de camiones y empresas de semirremolques tendrán suscripción mensual, sin coste por lead ni comisión por venta.

## Limitaciones importantes

- **No hay envío de leads, emails, WhatsApp ni solicitudes reales.** Todo el proceso de envío es una simulación local.
- **Los concesionarios, nombres, coberturas y ubicaciones del mapa son ejemplos ficticios**, incluidos los nombres comerciales utilizados como ilustración. No representan relaciones ni suscripciones reales.
- Las coberturas de ejemplo se limitan a prefijos postales **08** y **28**; para producción habrá que configurar territorios reales y resolver conflictos entre concesionarios.
- No hay cuentas, autenticación, base de datos, pagos ni gestión de suscripciones activa.
- Los PDF se pueden seleccionar en el comparador, pero **no se leen ni se procesan**. La comparación de la demo es manual.
- No introduzcas datos personales reales: el prototipo es público y no cuenta con las garantías de una aplicación de producción.
- El mapa utiliza Leaflet/OpenStreetMap y el QR usa un servicio externo; ambos requieren Internet.

## Próxima fase para un producto real

Frontend web + backend seguro, base de datos de marcas/concesionarios/códigos postales, control de suscripciones, autenticación, envío de leads con registro y deduplicación, consentimiento GDPR verificable, paneles privados, carga segura y extracción de PDFs, pagos y pruebas automatizadas.
