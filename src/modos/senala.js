/* "Señala la parte" — diagramas SVG interactivos (Ciencias Naturales)
   El niño toca la parte que se le pide sobre un dibujo. Mismo espíritu
   que el modo "¿Dónde está?" del mapa, pero con SVG dibujados aquí.
   Para añadir un diagrama: agrega un objeto a DIAGRAMAS con su svg
   (cada parte clicable lleva data-parte="id") y su lista de partes. */
const Senala = (function () {
  const $ = (s) => document.getElementById("sen-" + s);
  const TOTAL = 8;
  let dia = null, cola = [], i = 0, ac = 0, t = null, bloqueo = false;

  const SVG_PLANTA =
    '<svg viewBox="0 0 200 300" class="sen-svg" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="0" y="208" width="200" height="92" fill="#e7d3b3"/>' +
      '<line x1="0" y1="208" x2="200" y2="208" stroke="#c9a978" stroke-width="3"/>' +
      '<g data-parte="raiz">' +
        '<path d="M100 208 L100 252 M100 252 L80 286 M100 252 L120 286 M100 232 L72 264 M100 232 L128 264" stroke="#a9743b" stroke-width="6" fill="none" stroke-linecap="round"/>' +
      '</g>' +
      '<g data-parte="tallo"><rect x="94" y="95" width="12" height="115" rx="5" fill="#3fa34d"/></g>' +
      '<g data-parte="hoja">' +
        '<ellipse cx="66" cy="152" rx="27" ry="13" fill="#5cc26a" transform="rotate(-25 66 152)"/>' +
        '<ellipse cx="134" cy="134" rx="27" ry="13" fill="#5cc26a" transform="rotate(25 134 134)"/>' +
      '</g>' +
      '<g data-parte="flor">' +
        '<circle cx="100" cy="34" r="14" fill="#ff6b9d"/>' +
        '<circle cx="127" cy="52" r="14" fill="#ff6b9d"/>' +
        '<circle cx="117" cy="80" r="14" fill="#ff6b9d"/>' +
        '<circle cx="83" cy="80" r="14" fill="#ff6b9d"/>' +
        '<circle cx="73" cy="52" r="14" fill="#ff6b9d"/>' +
        '<circle cx="100" cy="57" r="15" fill="#ffd23f"/>' +
      '</g>' +
    '</svg>';

  const SVG_CUERPO =
    '<svg viewBox="0 0 160 320" class="sen-svg" xmlns="http://www.w3.org/2000/svg">' +
      '<g data-parte="pierna">' +
        '<path d="M71 172 L63 286" stroke="#f0c39b" stroke-width="18" stroke-linecap="round" fill="none"/>' +
        '<path d="M89 172 L97 286" stroke="#f0c39b" stroke-width="18" stroke-linecap="round" fill="none"/>' +
      '</g>' +
      '<g data-parte="pie">' +
        '<ellipse cx="57" cy="298" rx="16" ry="9" fill="#3a4266"/>' +
        '<ellipse cx="103" cy="298" rx="16" ry="9" fill="#3a4266"/>' +
      '</g>' +
      '<g data-parte="brazo">' +
        '<path d="M60 96 L32 166" stroke="#f0c39b" stroke-width="15" stroke-linecap="round" fill="none"/>' +
        '<path d="M100 96 L128 166" stroke="#f0c39b" stroke-width="15" stroke-linecap="round" fill="none"/>' +
      '</g>' +
      '<g data-parte="mano">' +
        '<circle cx="30" cy="173" r="11" fill="#f0c39b"/>' +
        '<circle cx="130" cy="173" r="11" fill="#f0c39b"/>' +
      '</g>' +
      '<g data-parte="tronco"><rect x="56" y="82" width="48" height="98" rx="16" fill="#4a90d9"/></g>' +
      '<g data-parte="cabeza"><circle cx="80" cy="44" r="28" fill="#f0c39b"/></g>' +
    '</svg>';

  const DIAGRAMAS = [
    { id: "planta", icono: "🌿", nombre: "La planta", desc: "raíz, tallo, hoja, flor", svg: SVG_PLANTA,
      partes: [
        { id: "raiz", nombre: "la raíz" }, { id: "tallo", nombre: "el tallo" },
        { id: "hoja", nombre: "las hojas" }, { id: "flor", nombre: "la flor" }
      ] },
    { id: "cuerpo", icono: "🧍", nombre: "El cuerpo", desc: "cabeza, brazos, piernas…", svg: SVG_CUERPO,
      partes: [
        { id: "cabeza", nombre: "la cabeza" }, { id: "tronco", nombre: "el tronco (pecho)" },
        { id: "brazo", nombre: "los brazos" }, { id: "mano", nombre: "las manos" },
        { id: "pierna", nombre: "las piernas" }, { id: "pie", nombre: "los pies" }
      ] }
  ];

  function init() { pintSelector(); }
  function pintSelector() {
    const c = $("selector"); if (!c) return; c.innerHTML = "";
    DIAGRAMAS.forEach((d) => {
      const b = document.createElement("button"); b.className = "chip-categoria";
      b.innerHTML = d.icono + " " + d.nombre + "<small>" + (d.desc || "") + "</small>";
      b.onclick = () => empezar(d); c.appendChild(b);
    });
  }
  function empezar(d) {
    dia = d; ac = 0; i = 0;
    let p = Juego.mezclar(d.partes.slice());
    while (p.length < TOTAL) p = p.concat(Juego.mezclar(d.partes.slice()));
    cola = p.slice(0, TOTAL);
    $("selector").classList.add("oculto"); $("juego").classList.remove("oculto");
    render(); mostrar();
  }
  function render() {
    const cont = $("mapa"); cont.innerHTML = dia.svg;
    cont.querySelectorAll("[data-parte]").forEach((el) => {
      el.classList.add("parte"); el.addEventListener("click", () => clic(el));
    });
  }
  function limpiar() { $("mapa").querySelectorAll(".parte").forEach((e) => e.classList.remove("ok", "mal")); }
  function mostrar() {
    bloqueo = false; limpiar();
    const parte = cola[i];
    $("progreso").style.width = (i / cola.length * 100) + "%";
    $("pregunta").innerHTML = "¿Dónde está <b>" + parte.nombre + "</b>? 👆";
    const r = $("retro"); r.textContent = ""; r.className = "retro"; timer();
  }
  function marcarOk(id) { $("mapa").querySelectorAll('[data-parte="' + id + '"]').forEach((e) => e.classList.add("ok")); }
  function clic(el) {
    if (bloqueo) return;
    const parte = cola[i], id = el.getAttribute("data-parte"), r = $("retro");
    if (id === parte.id) {
      bloqueo = true; Juego.cronDetener(); marcarOk(parte.id); ac++; Juego.acierto();
      r.textContent = Juego.frasePositiva(); r.className = "retro bien"; t = setTimeout(siguiente, 1000);
    } else {
      el.classList.add("mal"); Juego.error();
      r.textContent = "¡Casi! Esa es otra parte, inténtalo de nuevo 👇"; r.className = "retro mal";
      setTimeout(() => { if (!bloqueo) el.classList.remove("mal"); }, 700);
    }
  }
  function siguiente() { if (t) { clearTimeout(t); t = null; } i++; if (i >= cola.length) terminar(); else mostrar(); }
  function timer() {
    const c = Juego.config(), el = $("timer");
    if (c.timerOn) { el.classList.remove("oculto"); Juego.cronIniciar(c.timerSeg, "sen-timer", tiempoAgotado); }
    else { el.classList.add("oculto"); Juego.cronDetener(); }
  }
  function tiempoAgotado() {
    if (bloqueo) return; bloqueo = true; const parte = cola[i];
    marcarOk(parte.id); Juego.error();
    const r = $("retro"); r.innerHTML = "⏰ ¡Tiempo! Esta es <b>" + parte.nombre + "</b>."; r.className = "retro mal";
    t = setTimeout(siguiente, 1500);
  }
  function terminar() {
    Juego.cronDetener(); $("timer").classList.add("oculto"); $("progreso").style.width = "100%";
    $("pregunta").textContent = "¡Terminaste, " + Juego.jugador() + "! " + ac + " de " + cola.length + " ⭐";
    $("mapa").innerHTML = "";
    const r = $("retro"); r.textContent = ac === cola.length ? "¡Perfecto! 🏆" : "¡Muy bien! Toca otra ronda."; r.className = "retro bien";
    if (ac >= cola.length - 1) Juego.granPremio();
    t = setTimeout(volverSelector, 2400);
  }
  function volverSelector() {
    if (t) { clearTimeout(t); t = null; } Juego.cronDetener();
    $("juego").classList.add("oculto"); $("selector").classList.remove("oculto");
  }
  return { init, volverSelector };
})();
window.Senala = Senala;
