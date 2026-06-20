/* Par/impar, anterior/siguiente y números romanos — Matemáticas (motor MC) */
(function () {
  const az = (a, b) => Juego.azar(a, b);
  function gParImpar() {
    const n = az(2, 9999);
    return { tema: "🟰 Par o impar", pregunta: "¿El número <b>" + n + "</b> es par o impar?",
      opciones: ["Par", "Impar"], correcta: n % 2 === 0 ? "Par" : "Impar", pista: "Si el último dígito es 0,2,4,6,8 es par." };
  }
  function gSiguiente() {
    const n = az(100, 9998);
    return { tema: "➡️ Siguiente", pregunta: "¿Cuál es el número SIGUIENTE a <b>" + n + "</b>?",
      opciones: [n + 1, n - 1, n + 2, n + 10].map(String), correcta: String(n + 1) };
  }
  function gAnterior() {
    const n = az(101, 9999);
    return { tema: "⬅️ Anterior", pregunta: "¿Cuál es el número ANTERIOR a <b>" + n + "</b>?",
      opciones: [n - 1, n + 1, n - 2, n - 10].map(String), correcta: String(n - 1) };
  }
  function aRomano(n) {
    const m = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
      [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let r = ""; m.forEach((p) => { while (n >= p[0]) { r += p[1]; n -= p[0]; } }); return r;
  }
  function gRomano() {
    const n = az(1, 100); const c = aRomano(n);
    const ops = {}; ops[c] = 1;
    let tr = 0;
    while (Object.keys(ops).length < 4 && tr++ < 30) { const d = Math.max(1, Math.min(120, n + az(-12, 12))); ops[aRomano(d)] = 1; }
    while (Object.keys(ops).length < 4) { ops[aRomano(az(1, 130))] = 1; }
    return { tema: "🏛️ Números romanos", pregunta: "¿Cómo se escribe <b>" + n + "</b> en números romanos?",
      opciones: Object.keys(ops), correcta: c };
  }
  window.Numeros = MC("num", [
    { icono: "🟰", nombre: "Par o impar", desc: "", gens: [gParImpar] },
    { icono: "↔️", nombre: "Anterior y siguiente", desc: "", gens: [gAnterior, gSiguiente] },
    { icono: "🏛️", nombre: "Números romanos", desc: "del 1 al 100", gens: [gRomano] },
    { icono: "🎲", nombre: "Mixto", desc: "", gens: [gParImpar, gAnterior, gSiguiente, gRomano] }
  ]);
})();
