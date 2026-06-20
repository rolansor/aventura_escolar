/* Redondeo a la decena/centena/unidad de mil — Matemáticas (motor MC) */
(function () {
  const az = (a, b) => Juego.azar(a, b);
  function redon(n, u) { return Math.round(n / u) * u; }
  function gen(u, nombre) {
    return function () {
      const n = az(u * 2 + 1, u * 99);
      const c = redon(n, u);
      const ops = {}; ops[c] = 1;
      let tr = 0;
      while (Object.keys(ops).length < 4 && tr++ < 30) { const d = c + az(1, 5) * u * (az(0, 1) ? 1 : -1); if (d >= 0) ops[d] = 1; }
      while (Object.keys(ops).length < 4) { ops[c + Object.keys(ops).length * u] = 1; }
      return { tema: "🔵 Redondeo", pregunta: "Redondea <b>" + n + "</b> a la <b>" + nombre + "</b> más cercana:",
        opciones: Object.keys(ops).map(String), correcta: String(c), pista: "Mira el dígito siguiente: 5 o más sube, 4 o menos baja." };
    };
  }
  window.Redondeo = MC("red", [
    { icono: "🔵", nombre: "A la decena", desc: "más cercana", gens: [gen(10, "decena")] },
    { icono: "🟢", nombre: "A la centena", desc: "más cercana", gens: [gen(100, "centena")] },
    { icono: "🟣", nombre: "A la unidad de mil", desc: "más cercana", gens: [gen(1000, "unidad de mil")] },
    { icono: "🎲", nombre: "Mixto", desc: "decena, centena, mil", gens: [gen(10, "decena"), gen(100, "centena"), gen(1000, "unidad de mil")] }
  ]);
})();
