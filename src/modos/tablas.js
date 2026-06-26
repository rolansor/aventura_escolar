/* ============================================================
   MODO TABLAS — Matemáticas
   Práctica de las tablas de multiplicar (del 2 al 12). Selector
   de tabla (o mixtas) -> ronda de 10; el niño escribe el resultado.
   ============================================================ */
const Tablas = (function () {
  let cola = [], indice = 0, aciertos = 0, actual = null, temporizador = null, tInicio = 0;
  const TOTAL = 10;
  const TABLAS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const elSel = () => document.getElementById("tablas-selector");
  const elJuego = () => document.getElementById("tablas-juego");

  // El nivel del perfil acota qué tablas se ofrecen (ver Juego.porNivel).
  function tablasNivel() { return Juego.porNivel([[2, 3, 4, 5], [2, 3, 4, 5, 6, 7, 8, 9], TABLAS.slice()]); }
  function init() { pintarSelector(); }

  function pintarSelector() {
    const c = elSel(); if (!c) return;
    c.innerHTML = "";
    tablasNivel().forEach((t) => {
      const b = document.createElement("button");
      b.className = "chip-categoria";
      b.innerHTML = "✖️ Tabla del " + t + "<small>del " + t + "×1 al " + t + "×12</small>";
      b.onclick = () => empezar(t);
      c.appendChild(b);
    });
    const m = document.createElement("button");
    m.className = "chip-categoria";
    m.innerHTML = "🎲 Mixtas<small>todas las tablas</small>";
    m.onclick = () => empezar("mix");
    c.appendChild(m);
  }

  function empezar(t) {
    aciertos = 0; indice = 0; cola = []; tInicio = Date.now();
    let previo = "";
    for (let i = 0; i < TOTAL; i++) {
      let a, b, firma, intentos = 0;
      do {
        a = (t === "mix") ? Juego.azarEl(tablasNivel()) : t;
        b = Juego.azar(1, 12);
        firma = a + "x" + b;
        intentos++;
      } while (firma === previo && intentos < 6);
      previo = firma;
      cola.push({ a: a, b: b, r: a * b });
    }
    elSel().classList.add("oculto");
    elJuego().classList.remove("oculto");
    mostrar();
  }

  function mostrar() {
    actual = cola[indice];
    document.getElementById("tablas-progreso").style.width = (indice / cola.length) * 100 + "%";
    document.getElementById("tablas-pregunta").textContent = actual.a + " × " + actual.b + " =";
    const inp = document.getElementById("tablas-input");
    inp.value = ""; inp.disabled = false; inp.focus();
    const retro = document.getElementById("tablas-retro");
    retro.textContent = ""; retro.className = "retro";
    arrancarTimer();
  }

  function comprobar() {
    if (!actual) return;
    const inp = document.getElementById("tablas-input");
    if (inp.value.trim() === "") return;
    Juego.cronDetener(); inp.disabled = true;
    const retro = document.getElementById("tablas-retro");
    if (parseInt(inp.value, 10) === actual.r) {
      aciertos++; retro.textContent = Juego.frasePositiva(); retro.className = "retro bien";
      Juego.acierto(); avanzar(900);
    } else {
      retro.textContent = "Casi… " + actual.a + " × " + actual.b + " = " + actual.r;
      retro.className = "retro mal"; Juego.error(); avanzar(1800);
    }
  }

  function arrancarTimer() {
    const c = Juego.config();
    const el = document.getElementById("tablas-timer");
    if (c.timerOn) { el.classList.remove("oculto"); Juego.cronIniciar(c.timerSeg, "tablas-timer", tiempoAgotado); }
    else { el.classList.add("oculto"); Juego.cronDetener(); }
  }
  function tiempoAgotado() {
    document.getElementById("tablas-input").disabled = true;
    const retro = document.getElementById("tablas-retro");
    retro.textContent = "⏰ ¡Se acabó el tiempo! Era: " + actual.r;
    retro.className = "retro mal"; Juego.error(); avanzar(1800);
  }
  function avanzar(ms) {
    temporizador = setTimeout(() => { indice++; if (indice >= cola.length) terminar(); else mostrar(); }, ms);
  }
  function terminar() {
    Juego.cronDetener();
    Juego.registrarResultado("tablas", { aciertos: aciertos, total: cola.length, ms: Date.now() - tInicio });
    document.getElementById("tablas-timer").classList.add("oculto");
    document.getElementById("tablas-progreso").style.width = "100%";
    document.getElementById("tablas-pregunta").innerHTML =
      "¡Terminaste, " + Juego.jugador() + "! " + aciertos + " de " + cola.length + " ⭐" + Juego.tablaMejoresHTML("tablas");
    const inp = document.getElementById("tablas-input"); inp.value = ""; inp.disabled = true;
    const retro = document.getElementById("tablas-retro");
    retro.textContent = aciertos === cola.length ? "¡Perfecto! 🏆" : "¡Muy bien! Toca otra ronda para seguir.";
    retro.className = "retro bien";
    if (aciertos >= cola.length - 1) Juego.granPremio();
    temporizador = setTimeout(volverSelector, 2400);
  }
  function volverSelector() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    Juego.cronDetener();
    elJuego().classList.add("oculto");
    elSel().classList.remove("oculto");
  }

  return { init, comprobar, volverSelector };
})();
window.Tablas = Tablas;
