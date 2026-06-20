/* Comparar y ordenar números — Matemáticas (motor MC) */
(function () {
  const az = (a, b) => Juego.azar(a, b);
  const num = () => az(100, 99999);

  function gSigno() {
    const a = num();
    const b = az(0, 3) === 0 ? a : num();
    const c = a < b ? "&lt;" : a > b ? "&gt;" : "=";
    return { tema: "⚖️ Comparar", pregunta: a + " &nbsp;___&nbsp; " + b,
      opciones: ["&lt;", "&gt;", "="], correcta: c, pista: "El que tiene más cifras (o mayor primer dígito) es mayor." };
  }
  function cuatro() { const s = {}; const r = []; while (r.length < 4) { const n = num(); if (!s[n]) { s[n] = 1; r.push(n); } } return r; }
  function gMayor() { const ns = cuatro(); return { tema: "⚖️ El mayor", pregunta: "¿Cuál es el número MAYOR?", opciones: ns.map(String), correcta: String(Math.max.apply(null, ns)) }; }
  function gMenor() { const ns = cuatro(); return { tema: "⚖️ El menor", pregunta: "¿Cuál es el número MENOR?", opciones: ns.map(String), correcta: String(Math.min.apply(null, ns)) }; }
  function gOrden() {
    const s = {}; const ns = []; while (ns.length < 3) { const n = az(10, 999); if (!s[n]) { s[n] = 1; ns.push(n); } }
    const correcta = ns.slice().sort((x, y) => x - y).join(" &lt; ");
    const ops = {}; ops[correcta] = 1;
    let tr = 0; while (Object.keys(ops).length < 4 && tr++ < 20) { ops[Juego.mezclar(ns.slice()).join(" &lt; ")] = 1; }
    return { tema: "⚖️ Ordenar", pregunta: "¿Cuál está ordenado de MENOR a MAYOR?", opciones: Object.keys(ops), correcta: correcta };
  }

  window.Comparar = MC("cmp", [
    { icono: "⚖️", nombre: "Comparar (>, <, =)", desc: "qué signo va", gens: [gSigno] },
    { icono: "🔼", nombre: "Mayor y menor", desc: "elige el mayor o el menor", gens: [gMayor, gMenor] },
    { icono: "🔢", nombre: "Ordenar", desc: "de menor a mayor", gens: [gOrden] },
    { icono: "🎲", nombre: "Mixto", desc: "todo", gens: [gSigno, gMayor, gMenor, gOrden] }
  ]);
})();
