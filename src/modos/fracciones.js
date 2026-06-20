/* Fracciones básicas con dibujo — Matemáticas (motor MC) */
(function () {
  const az = (a, b) => Juego.azar(a, b);
  function barra(n, d) {
    const W = 260, H = 46, w = W / d; let cells = "";
    for (let i = 0; i < d; i++) cells += '<rect x="' + (i * w) + '" y="0" width="' + w + '" height="' + H +
      '" fill="' + (i < n ? "#37bc9b" : "#eef3ff") + '" stroke="#3a4266" stroke-width="1.5"/>';
    return '<svg class="frac-svg" viewBox="0 0 ' + W + ' ' + H + '">' + cells + "</svg>";
  }
  function gQue() {
    const d = az(2, 8), n = az(1, d - 1); const c = n + "/" + d;
    const ops = {}; ops[c] = 1;
    while (Object.keys(ops).length < 4) { const dd = az(2, 8), nn = az(1, dd - 1); ops[nn + "/" + dd] = 1; }
    return { tema: "🍕 ¿Qué fracción?", html: barra(n, d), pregunta: "¿Qué fracción está coloreada?",
      opciones: Object.keys(ops), correcta: c, pista: "Arriba: partes pintadas. Abajo: partes en total." };
  }
  window.Fracciones = MC("frac", [{ icono: "🍕", nombre: "Leer fracciones", desc: "mira el dibujo", gens: [gQue] }]);
})();
