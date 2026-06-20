/* ============================================================
   MOTOR DE OPCIÓN MÚLTIPLE — src/core/mc.js
   Fábrica reutilizable para actividades de quiz: selector de temas
   -> ronda de 10 preguntas de opción múltiple. Cada página usa ids
   con un PREFIJO: <px>-selector, <px>-juego, <px>-progreso,
   <px>-timer, <px>-tema, <px>-extra (dibujos), <px>-pregunta,
   <px>-opciones, <px>-retro.

   Uso:  window.MiModo = MC("px", [ {icono,nombre,desc,gens:[fn,...]}, ... ]);
   Cada fn devuelve: { tema, pregunta, opciones, correcta, html?, pista? }
   ============================================================ */
window.MC = function (px, temas) {
  let cola = [], i = 0, ac = 0, t = null;
  const TOTAL = 10;
  const $ = (s) => document.getElementById(px + "-" + s);
  const elSel = () => $("selector"), elJuego = () => $("juego");

  function init() { pintar(); }
  function pintar() {
    const c = elSel(); if (!c) return;
    c.innerHTML = "";
    temas.forEach((tm) => {
      const b = document.createElement("button");
      b.className = "chip-categoria";
      b.innerHTML = tm.icono + " " + tm.nombre + (tm.desc ? "<small>" + tm.desc + "</small>" : "");
      b.onclick = () => empezar(tm);
      c.appendChild(b);
    });
  }
  function empezar(tm) {
    ac = 0; i = 0; cola = [];
    let prev = "";
    for (let k = 0; k < TOTAL; k++) {
      let q, f, tr = 0;
      do { q = tm.gens[Math.floor(Math.random() * tm.gens.length)](); f = (q.pregunta || "") + "|" + q.correcta; tr++; }
      while (f === prev && tr < 8);
      prev = f; cola.push(q);
    }
    elSel().classList.add("oculto");
    elJuego().classList.remove("oculto");
    mostrar();
  }
  function mostrar() {
    const q = cola[i];
    $("progreso").style.width = (i / cola.length * 100) + "%";
    if ($("tema")) $("tema").textContent = "";        // el tip ya no va como banner sobre el ejercicio
    if ($("extra")) $("extra").innerHTML = q.html || "";
    $("pregunta").innerHTML = q.pregunta || "";
    if ($("pista")) $("pista").textContent = "";
    Juego.tip(q.pista || q.tema);                     // ...lo sugiere la mascota en su globo
    const op = $("opciones"); op.innerHTML = "";
    Juego.mezclar((q.opciones || []).slice()).forEach((o) => crearOp(o, String(o) === String(q.correcta)));
    const r = $("retro"); r.textContent = ""; r.className = "retro";
    timer(q);
  }
  function crearOp(texto, ok) {
    const b = document.createElement("button");
    b.className = "opcion";
    b.innerHTML = texto;
    if (ok) b.dataset.ok = "1";
    b.onclick = () => responder(b, ok);
    $("opciones").appendChild(b);
  }
  function planoTexto(s) { const d = document.createElement("div"); d.innerHTML = String(s); return d.textContent; }
  function marcarCorrecta() { $("opciones").querySelectorAll('.opcion[data-ok="1"]').forEach((x) => x.classList.add("correcta")); }
  function bloquear() { $("opciones").querySelectorAll(".opcion").forEach((x) => (x.onclick = null)); }

  function responder(boton, ok) {
    Juego.cronDetener(); bloquear();
    const q = cola[i]; const r = $("retro");
    if (ok) { boton.classList.add("correcta"); ac++; r.textContent = Juego.frasePositiva(); r.className = "retro bien"; Juego.acierto(); avanzar(950); }
    else {
      boton.classList.add("incorrecta");
      r.textContent = "Casi… la respuesta es: " + planoTexto(q.correcta);
      r.className = "retro mal"; Juego.error(); marcarCorrecta(); avanzar(1900);
    }
  }
  function timer(q) {
    const c = Juego.config(); const el = $("timer"); if (!el) return;
    if (c.timerOn) { el.classList.remove("oculto"); Juego.cronIniciar(c.timerSeg, px + "-timer", () => tAgotado(q)); }
    else { el.classList.add("oculto"); Juego.cronDetener(); }
  }
  function tAgotado(q) {
    bloquear();
    const r = $("retro"); r.textContent = "⏰ ¡Se acabó el tiempo! Era: " + planoTexto(q.correcta); r.className = "retro mal";
    marcarCorrecta(); Juego.error(); avanzar(1900);
  }
  function avanzar(ms) { t = setTimeout(() => { i++; if (i >= cola.length) terminar(); else mostrar(); }, ms); }
  function terminar() {
    Juego.cronDetener(); if ($("timer")) $("timer").classList.add("oculto");
    $("progreso").style.width = "100%";
    if ($("tema")) $("tema").textContent = "";
    if ($("extra")) $("extra").innerHTML = "";
    $("pregunta").textContent = "¡Terminaste, " + Juego.jugador() + "! " + ac + " de " + cola.length + " ⭐";
    if ($("pista")) $("pista").textContent = "";
    $("opciones").innerHTML = "";
    const r = $("retro"); r.textContent = ac === cola.length ? "¡Perfecto! 🏆" : "¡Muy bien! Toca otra ronda para seguir."; r.className = "retro bien";
    if (ac >= cola.length - 1) Juego.granPremio();
    t = setTimeout(volverSelector, 2600);
  }
  function volverSelector() {
    if (t) { clearTimeout(t); t = null; }
    Juego.cronDetener();
    elJuego().classList.add("oculto");
    elSel().classList.remove("oculto");
  }
  return { init, volverSelector };
};
