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
