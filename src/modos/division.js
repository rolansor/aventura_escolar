/* División (con/sin residuo) con explicación — Matemáticas */
const Division = (function () {
  let cola = [], i = 0, ac = 0, act = null, t = null, re = false;
  const TOTAL = 10;
  const $ = (id) => document.getElementById(id);
  const elSel = () => $("div-selector"), elJuego = () => $("div-juego");
  const NIV = [{ e: true, n: "Exactas", d: "sin residuo" }, { e: false, n: "Con residuo", d: "queda algo" }, { e: null, n: "Mixto", d: "" }];

  function gen(exact) {
    const b = Juego.azar(2, 9);
    const c = Juego.azar(11, 99);
    let r = exact === true ? 0 : exact === false ? Juego.azar(1, b - 1) : (Juego.azar(0, 1) ? 0 : Juego.azar(1, b - 1));
    return { a: b * c + r, b: b, c: c, res: r };
  }
  function init() { pint(); }
  function pint() {
    const cc = elSel(); if (!cc) return; cc.innerHTML = "";
    NIV.forEach((nv) => { const btn = document.createElement("button"); btn.className = "chip-categoria";
      btn.innerHTML = "➗ " + nv.n + "<small>" + (nv.d || "dividir") + "</small>"; btn.onclick = () => empezar(nv.e); cc.appendChild(btn); });
  }
  function empezar(exact) {
    ac = 0; i = 0; cola = []; const f = {};
    for (let k = 0; k < TOTAL; k++) { let q, fi, tr = 0; do { q = gen(exact); fi = q.a + "/" + q.b; tr++; } while (f[fi] && tr < 12); f[fi] = 1; cola.push(q); }
    elSel().classList.add("oculto"); elJuego().classList.remove("oculto"); mostrar();
  }
  function mostrar() {
    act = cola[i]; re = false;
    $("div-progreso").style.width = (i / cola.length * 100) + "%";
    $("div-pregunta").textContent = act.a + " ÷ " + act.b + " =";
    $("div-coc").value = ""; $("div-res").value = ""; $("div-coc").disabled = false; $("div-res").disabled = false;
    $("div-resp").classList.remove("oculto");
    ["div-explica", "div-reintentar", "div-siguiente"].forEach((id) => $(id).classList.add("oculto"));
    const r = $("div-retro"); r.textContent = ""; r.className = "retro"; $("div-coc").focus(); timer();
  }
  function comprobar() {
    if (!act) return; const c = $("div-coc").value.trim(), rr = $("div-res").value.trim();
    if (c === "" || rr === "") return;
    Juego.cronDetener(); $("div-coc").disabled = true; $("div-res").disabled = true;
    const ok = parseInt(c, 10) === act.c && parseInt(rr, 10) === act.res; const r = $("div-retro");
    if (ok) { r.textContent = Juego.frasePositiva(); r.className = "retro bien"; if (!re) { ac++; Juego.acierto(); } t = setTimeout(siguiente, 1050); }
    else { r.textContent = "¡Ups! Mira cómo se hace 👇"; r.className = "retro mal"; if (!re) Juego.error(); fallo(); }
  }
  function fallo() {
    $("div-explica").innerHTML = "<p class='explica-titulo'>Divide así:</p><ol>" +
      "<li>¿Cuántas veces cabe " + act.b + " en " + act.a + "? → <b>" + act.c + "</b> veces (" + act.c + " × " + act.b + " = " + (act.c * act.b) + ")</li>" +
      "<li>Lo que sobra: " + act.a + " − " + (act.c * act.b) + " = <b>" + act.res + "</b> (residuo)</li></ol>" +
      "<p class='explica-res'>" + act.a + " ÷ " + act.b + " = <b>" + act.c + "</b>, residuo <b>" + act.res + "</b></p>";
    $("div-explica").classList.remove("oculto"); $("div-resp").classList.add("oculto");
    $("div-reintentar").classList.remove("oculto"); $("div-siguiente").classList.remove("oculto");
  }
  function reintentar() {
    re = true; $("div-coc").value = ""; $("div-res").value = ""; $("div-coc").disabled = false; $("div-res").disabled = false;
    $("div-resp").classList.remove("oculto");
    ["div-explica", "div-reintentar", "div-siguiente"].forEach((id) => $(id).classList.add("oculto"));
    const r = $("div-retro"); r.textContent = "¡Inténtalo de nuevo!"; r.className = "retro"; $("div-coc").focus(); timer();
  }
  function siguiente() { if (t) { clearTimeout(t); t = null; } i++; if (i >= cola.length) terminar(); else mostrar(); }
  function timer() { const c = Juego.config(); const el = $("div-timer"); if (c.timerOn) { el.classList.remove("oculto"); Juego.cronIniciar(c.timerSeg, "div-timer", tag); } else { el.classList.add("oculto"); Juego.cronDetener(); } }
  function tag() { $("div-coc").disabled = true; $("div-res").disabled = true; const r = $("div-retro"); r.textContent = "⏰ ¡Tiempo! Mira cómo se hace 👇"; r.className = "retro mal"; if (!re) Juego.error(); fallo(); }
  function terminar() {
    Juego.cronDetener(); $("div-timer").classList.add("oculto"); $("div-progreso").style.width = "100%";
    $("div-pregunta").textContent = "¡Terminaste, " + Juego.jugador() + "! " + ac + " de " + cola.length + " ⭐";
    ["div-resp", "div-explica", "div-reintentar", "div-siguiente"].forEach((id) => $(id).classList.add("oculto"));
    const r = $("div-retro"); r.textContent = ac === cola.length ? "¡Perfecto! 🏆" : "¡Muy bien! Toca otra ronda para seguir."; r.className = "retro bien";
    if (ac >= cola.length - 1) Juego.granPremio(); t = setTimeout(volverSelector, 2500);
  }
  function volverSelector() {
    if (t) { clearTimeout(t); t = null; } Juego.cronDetener();
    ["div-explica", "div-reintentar", "div-siguiente"].forEach((id) => $(id).classList.add("oculto"));
    $("div-resp").classList.remove("oculto"); elJuego().classList.add("oculto"); elSel().classList.remove("oculto");
  }
  return { init, comprobar, reintentar, siguiente, volverSelector };
})();
window.Division = Division;
