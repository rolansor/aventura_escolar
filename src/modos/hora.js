/* La hora: leer el reloj — Matemáticas (motor MC) */
(function () {
  const az = (a, b) => Juego.azar(a, b);
  function pt(ang, len) { const a = (ang - 90) * Math.PI / 180; return [(60 + len * Math.cos(a)).toFixed(1), (60 + len * Math.sin(a)).toFixed(1)]; }
  function reloj(h, m) {
    const mA = m * 6, hA = (h % 12) * 30 + m * 0.5;
    let ticks = "";
    for (let i = 0; i < 12; i++) { const a = pt(i * 30, 50), b = pt(i * 30, 44); ticks += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="#3a4266" stroke-width="2"/>'; }
    const mh = pt(mA, 42), hh = pt(hA, 30);
    return '<svg class="reloj-svg" viewBox="0 0 120 120">' +
      '<circle cx="60" cy="60" r="56" fill="#fff" stroke="#3a4266" stroke-width="3"/>' + ticks +
      '<line x1="60" y1="60" x2="' + hh[0] + '" y2="' + hh[1] + '" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/>' +
      '<line x1="60" y1="60" x2="' + mh[0] + '" y2="' + mh[1] + '" stroke="#2e6cf6" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="60" cy="60" r="3.5" fill="#2b2b2b"/></svg>';
  }
  function fhora(h, m) { return h + ":" + String(m).padStart(2, "0"); }
  function gen() {
    const h = az(1, 12), m = Juego.azarEl([0, 15, 30, 45]);
    const c = fhora(h, m); const ops = {}; ops[c] = 1;
    while (Object.keys(ops).length < 4) { ops[fhora(az(1, 12), Juego.azarEl([0, 15, 30, 45]))] = 1; }
    return { tema: "🕐 La hora", html: reloj(h, m), pregunta: "¿Qué hora marca el reloj?",
      opciones: Object.keys(ops), correcta: c };
  }
  window.Hora = MC("hora", [{ icono: "🕐", nombre: "Leer la hora", desc: "en punto y cuartos", gens: [gen] }]);
})();
