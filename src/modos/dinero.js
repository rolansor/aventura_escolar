/* Dinero (dólares): contar y dar cambio — Matemáticas (motor MC) */
(function () {
  const az = (a, b) => Juego.azar(a, b);
  const azEl = (a) => Juego.azarEl(a);
  const BILLETES = [100, 500, 1000, 2000];          // en centavos: $1, $5, $10, $20
  const MONEDAS = [1, 5, 10, 25, 50, 100];          // 1¢ … $1
  function fmt(c) { return "$" + (c / 100).toFixed(2); }
  function distintos(correcta, paso) {
    const ops = {}; ops[correcta] = 1; let tr = 0;
    while (Object.keys(ops).length < 4 && tr++ < 40) { const d = correcta + az(-4, 4) * paso; if (d > 0) ops[d] = 1; }
    while (Object.keys(ops).length < 4) { ops[correcta + (Object.keys(ops).length + 1) * paso] = 1; }
    return Object.keys(ops).map(Number);
  }

  function gContar() {
    const k = az(2, 4); const piezas = []; let total = 0;
    for (let i = 0; i < k; i++) { const v = az(0, 1) ? azEl(BILLETES) : azEl(MONEDAS); piezas.push(v); total += v; }
    const desc = piezas.map((v) => v >= 100 ? "💵 " + fmt(v) : "🪙 " + v + "¢").join(" &nbsp;+&nbsp; ");
    return { tema: "💵 Contar dinero", pregunta: "¿Cuánto dinero hay?<br><b>" + desc + "</b>",
      opciones: distintos(total, 25).map(fmt), correcta: fmt(total) };
  }
  function gCambio() {
    const precio = az(1, 18) * 100 + azEl([0, 25, 50, 75]);
    const pago = azEl(BILLETES.filter((b) => b > precio).concat([2000]));
    const cambio = pago - precio;
    return { tema: "🪙 Dar el cambio", pregunta: "Compras algo de <b>" + fmt(precio) + "</b> y pagas con <b>" + fmt(pago) + "</b>.<br>¿Cuánto te devuelven?",
      opciones: distintos(cambio, 25).map(fmt), correcta: fmt(cambio) };
  }
  window.Dinero = MC("din", [
    { icono: "💵", nombre: "Contar dinero", desc: "billetes y monedas", gens: [gContar] },
    { icono: "🪙", nombre: "Dar el cambio", desc: "cuánto te devuelven", gens: [gCambio] },
    { icono: "🎲", nombre: "Mixto", desc: "", gens: [gContar, gCambio] }
  ]);
})();
