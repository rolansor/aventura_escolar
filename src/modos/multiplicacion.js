/* Multiplicación (hasta 3 cifras en el multiplicador) con explicación — Matemáticas */
const Multiplicacion = (function () {
  let cola = [], i = 0, ac = 0, act = null, t = null, re = false, tInicio = 0, ultimo = null;
  const TOTAL = 10;
  const $ = (id) => document.getElementById(id);
  const elSel = () => $("mul-selector"), elJuego = () => $("mul-juego");
  const NIV = [{ ca: 2, cb: 1, n: "2 cifras × 1" }, { ca: 3, cb: 1, n: "3 cifras × 1" },
    { ca: 2, cb: 2, n: "2 cifras × 2" }, { ca: 3, cb: 2, n: "3 cifras × 2" },
    { ca: 3, cb: 3, n: "3 cifras × 3" }, { ca: 4, cb: 3, n: "4 cifras × 3" }];
  const numDe = (c) => Juego.azar(Math.pow(10, c - 1), Math.pow(10, c) - 1);

  // Todos los niveles llegan a 2 y 3 cifras en el multiplicador (lo pide el segundo
  // trimestre de Quinto); el nivel del perfil solo quita lo más fácil o añade lo más largo.
  function nivNivel() { return Juego.porNivel([NIV.slice(0, 5), NIV.slice(0, 5), NIV.slice(1)]); }
  function init() { pint(); }
  function pint() {
    const c = elSel(); if (!c) return; c.innerHTML = "";
    nivNivel().forEach((nv) => { const b = document.createElement("button"); b.className = "chip-categoria";
      b.innerHTML = "✖️ " + nv.n + "<small>multiplicar</small>"; b.onclick = () => empezar(nv); c.appendChild(b); });
    Juego.pintarMejores(c, "mul"); // 🏆 mejores de esta actividad
  }
  function empezar(nv) {
    ultimo = nv; Juego.quitarBotonesFin($("mul-retro"));
    ac = 0; i = 0; cola = []; tInicio = Date.now(); const f = {};
    for (let k = 0; k < TOTAL; k++) { let a, b, fi, tr = 0; do { a = numDe(nv.ca); b = numDe(nv.cb); fi = a + "x" + b; tr++; } while (f[fi] && tr < 12); f[fi] = 1; cola.push({ a: a, b: b, r: a * b }); }
    elSel().classList.add("oculto"); elJuego().classList.remove("oculto"); mostrar();
  }
  function mostrar() {
    act = cola[i]; re = false;
    $("mul-progreso").style.width = (i / cola.length * 100) + "%";
    $("mul-pregunta").textContent = act.a + " × " + act.b + " =";
    const inp = $("mul-input"); inp.value = ""; inp.disabled = false;
    $("mul-resp").classList.remove("oculto");
    ["mul-explica", "mul-reintentar", "mul-siguiente"].forEach((id) => $(id).classList.add("oculto"));
    const r = $("mul-retro"); r.textContent = ""; r.className = "retro"; inp.focus(); timer();
  }
  function comprobar() {
    if (!act) return; const inp = $("mul-input"); if (inp.value.trim() === "") return;
    Juego.cronDetener(); inp.disabled = true; const r = $("mul-retro");
    if (parseInt(inp.value, 10) === act.r) { r.textContent = Juego.frasePositiva(); r.className = "retro bien"; if (!re) { ac++; Juego.acierto(); } t = setTimeout(siguiente, 1050); }
    else { r.textContent = "¡Ups! Mira cómo se hace 👇"; r.className = "retro mal"; if (!re) Juego.error(); fallo(); }
  }
  function explicar(a, b) {
    const db = String(b).split("").reverse().map(Number); const pasos = []; const sumandos = [];
    for (let k = 0; k < db.length; k++) { if (db[k] === 0) continue; const val = db[k] * Math.pow(10, k); const parte = a * val; pasos.push(a + " × " + val + " = " + parte); sumandos.push(parte); }
    if (sumandos.length > 1) pasos.push("Sumas: " + sumandos.join(" + ") + " = " + act.r);
    return pasos;
  }
  function fallo() {
    $("mul-explica").innerHTML = "<p class='explica-titulo'>Descompón y suma:</p><ol>" +
      explicar(act.a, act.b).map((p) => "<li>" + p + "</li>").join("") +
      "</ol><p class='explica-res'>" + act.a + " × " + act.b + " = <b>" + act.r + "</b></p>";
    $("mul-explica").classList.remove("oculto"); $("mul-resp").classList.add("oculto");
    $("mul-reintentar").classList.remove("oculto"); $("mul-siguiente").classList.remove("oculto");
  }
  function reintentar() {
    re = true; const inp = $("mul-input"); inp.value = ""; inp.disabled = false;
    $("mul-resp").classList.remove("oculto");
    ["mul-explica", "mul-reintentar", "mul-siguiente"].forEach((id) => $(id).classList.add("oculto"));
    const r = $("mul-retro"); r.textContent = "¡Inténtalo de nuevo!"; r.className = "retro"; inp.focus(); timer();
  }
  function siguiente() { if (t) { clearTimeout(t); t = null; } i++; if (i >= cola.length) terminar(); else mostrar(); }
  function timer() { const c = Juego.config(); const el = $("mul-timer"); if (c.timerOn) { el.classList.remove("oculto"); Juego.cronIniciar(Juego.tiempo(String(act.a).length + String(act.b).length - 1), "mul-timer", tag); } else { el.classList.add("oculto"); Juego.cronDetener(); } }
  function tag() { $("mul-input").disabled = true; const r = $("mul-retro"); r.textContent = "⏰ ¡Tiempo! Mira cómo se hace 👇"; r.className = "retro mal"; if (!re) Juego.error(); fallo(); }
  function terminar() {
    Juego.cronDetener(); $("mul-timer").classList.add("oculto"); $("mul-progreso").style.width = "100%";
    Juego.registrarResultado("mul", { aciertos: ac, total: cola.length, ms: Date.now() - tInicio });
    $("mul-pregunta").innerHTML = "¡Terminaste, " + Juego.jugador() + "! " + ac + " de " + cola.length + " ⭐" + Juego.tablaMejoresHTML("mul");
    ["mul-resp", "mul-explica", "mul-reintentar", "mul-siguiente"].forEach((id) => $(id).classList.add("oculto"));
    const r = $("mul-retro"); r.textContent = ac === cola.length ? "¡Perfecto! 🏆" : "¡Muy bien! ¿Otra ronda para mejorar?"; r.className = "retro bien";
    if (ac >= cola.length - 1) Juego.granPremio();
    Juego.botonesFin(r, () => empezar(ultimo), volverSelector);
  }
  function volverSelector() {
    if (t) { clearTimeout(t); t = null; } Juego.cronDetener();
    Juego.quitarBotonesFin($("mul-retro")); pint();   // refresca el 🏆
    ["mul-explica", "mul-reintentar", "mul-siguiente"].forEach((id) => $(id).classList.add("oculto"));
    $("mul-resp").classList.remove("oculto"); elJuego().classList.add("oculto"); elSel().classList.remove("oculto");
  }
  return { init, comprobar, reintentar, siguiente, volverSelector };
})();
window.Multiplicacion = Multiplicacion;
