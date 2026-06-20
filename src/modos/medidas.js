/* Medidas: ¿qué unidad? y conversiones — Matemáticas (motor MC) */
(function () {
  const az = (a, b) => Juego.azar(a, b);
  const azEl = (a) => Juego.azarEl(a);
  const COSAS = [
    ["la leche de un cartón", "litros"], ["tu peso", "kilos"],
    ["la distancia entre dos ciudades", "kilómetros"], ["el largo de tu cuaderno", "centímetros"],
    ["el agua de una piscina", "litros"], ["una bolsa de arroz", "kilos"],
    ["la altura de una puerta", "metros"], ["un vaso de jugo", "mililitros"],
    ["el largo de una cancha", "metros"], ["una manzana", "gramos"]
  ];
  const UNIDADES = ["litros", "kilos", "kilómetros", "centímetros", "metros", "mililitros", "gramos"];

  function gUnidad() {
    const par = azEl(COSAS);
    const ops = {}; ops[par[1]] = 1;
    while (Object.keys(ops).length < 4) ops[azEl(UNIDADES)] = 1;
    return { tema: "📏 ¿Qué unidad?", pregunta: "¿En qué se mide <b>" + par[0] + "</b>?",
      opciones: Object.keys(ops), correcta: par[1] };
  }
  function gConv() {
    const tipos = [["metros", "centímetros", 100], ["kilómetros", "metros", 1000],
      ["kilos", "gramos", 1000], ["litros", "mililitros", 1000]];
    const t = azEl(tipos); const n = az(1, 9); const c = n * t[2];
    const ops = {}; ops[c] = 1;
    let tr = 0; while (Object.keys(ops).length < 4 && tr++ < 30) { const d = c + az(1, 3) * t[2] * (az(0, 1) ? 1 : -1); if (d > 0) ops[d] = 1; }
    while (Object.keys(ops).length < 4) ops[c + Object.keys(ops).length * t[2]] = 1;
    return { tema: "📐 Conversiones", pregunta: "¿Cuántos <b>" + t[1] + "</b> hay en <b>" + n + " " + t[0] + "</b>?",
      opciones: Object.keys(ops).map(String), correcta: String(c), pista: "1 " + t[0].slice(0, -1) + " = " + t[2] + " " + t[1] + "." };
  }
  window.Medidas = MC("med", [
    { icono: "📏", nombre: "¿Qué unidad?", desc: "metros, litros, kilos…", gens: [gUnidad] },
    { icono: "📐", nombre: "Conversiones", desc: "m↔cm, km↔m, kg↔g, L↔ml", gens: [gConv] },
    { icono: "🎲", nombre: "Mixto", desc: "", gens: [gUnidad, gConv] }
  ]);
})();
