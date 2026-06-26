/* ============================================================
   CARGADOR DE DATOS — src/core/datos.js
   Carga los .json de data/ y rellena los MISMOS globales que la
   lógica ya usa (DATOS.*, NINO, ECUADOR_SVG, ECUADOR_CANTONES),
   para que los módulos funcionen sin cambios.

   Los datos canónicos están en data/*.json. Un paso de build
   (herramientas/build.py) genera data/*.js gemelos que rellenan
   window.__DATOS__; cada página los incluye con <script src="data/<n>.js">.
   Así NO se usa fetch: funciona igual servido y con doble clic (file://),
   sin carpeta dist aparte.
   ============================================================ */
window.DATOS = window.DATOS || {};
window.Datos = (function () {
  // nombre de dato -> dónde colocarlo (globales que la lógica ya espera)
  const DEST = {
    "ortografia":          (v) => (DATOS.ortografia = v),
    "secuencias":          (v) => (DATOS.secuencias = v),
    "parrafos":            (v) => (DATOS.parrafos = v),
    "generador-parrafos":  (v) => (DATOS.frasesGenerador = v),
    "materias":            (v) => (DATOS.materias = v),
    "nino":                (v) => (window.NINO = (v && v.nombre) || "Nelson"),
    "cantones":            (v) => (window.ECUADOR_CANTONES = v),
    "mapa-ec":             (v) => (window.ECUADOR_SVG = v),
    "mapas/provincias":    (v) => ((DATOS.mapas = DATOS.mapas || {}).provincias = v),
    "mapas/regiones":      (v) => ((DATOS.mapas = DATOS.mapas || {}).regiones = v),
    "mapas/detalle":       (v) => ((DATOS.mapas = DATOS.mapas || {}).detalle = v)
  };

  function aplicar(n, v) {
    if (DEST[n]) { DEST[n](v); return; }
    // Contenido de actividades: data/contenido/<modo>.json -> DATOS.contenido[<modo>]
    if (n.indexOf("contenido/") === 0) { (DATOS.contenido = DATOS.contenido || {})[n.slice(10)] = v; }
  }

  // Los datos ya están en window.__DATOS__ (los rellenan los <script src="data/<n>.js">
  // que cada página incluye). Funciona igual servido y con doble clic (file://).
  function uno(n) {
    return Promise.resolve().then(function () {
      const v = (window.__DATOS__ || {})[n];
      if (v === undefined && window.console) console.warn("Falta el dato '" + n + "'. ¿Ejecutaste herramientas/build.py?");
      aplicar(n, v);
    });
  }

  // cargar(["ortografia","materias"]) -> Promise (resuelve cuando todo está listo)
  function cargar(nombres) { return Promise.all((nombres || []).map(uno)); }

  return { cargar };
})();
