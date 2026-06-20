/* ============================================================
   MODO SUMAS Y RESTAS — Matemáticas
   Operaciones de 3 a 10 cifras (mezcla de sumas y restas), nunca
   repetidas en la ronda. En las restas el minuendo es ≥ que el
   sustraendo. Si el niño se equivoca, se EXPLICA paso a paso cómo
   se suma "llevando" o se resta "prestando", columna por columna.
   ============================================================ */
const Aritmetica = (function () {
  let cola = [], indice = 0, aciertos = 0, actual = null, temporizador = null;
  const TOTAL = 10;
  const CIFRAS = [3, 4, 5, 6, 7, 8, 9, 10];
  const ORDEN = ["unidades", "decenas", "centenas", "unidades de mil", "decenas de mil",
    "centenas de mil", "unidades de millón", "decenas de millón", "centenas de millón", "unidades de mil millones"];
  const elSel = () => document.getElementById("arit-selector");
  const elJuego = () => document.getElementById("arit-juego");

  function numDe(n) { return Juego.azar(Math.pow(10, n - 1), Math.pow(10, n) - 1); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  function init() { pintarSelector(); }
  function pintarSelector() {
    const c = elSel(); if (!c) return;
    c.innerHTML = "";
    CIFRAS.forEach((n) => {
      const b = document.createElement("button");
      b.className = "chip-categoria";
      b.innerHTML = "➕➖ " + n + " cifras<small>sumas y restas al azar</small>";
      b.onclick = () => empezar(n);
      c.appendChild(b);
    });
  }

  function empezar(cifras) {
    aciertos = 0; indice = 0; cola = [];
    const firmas = {};
    for (let i = 0; i < TOTAL; i++) {
      let suma, a, b, firma, intentos = 0;
      do {
        suma = Juego.azar(0, 1) === 0;
        a = numDe(cifras); b = numDe(cifras);
        if (!suma && a < b) { const t = a; a = b; b = t; }
        firma = a + (suma ? "+" : "-") + b;
        intentos++;
      } while (firmas[firma] && intentos < 12);
      firmas[firma] = 1;
      cola.push({ a: a, b: b, suma: suma, r: suma ? a + b : a - b });
    }
    elSel().classList.add("oculto");
    elJuego().classList.remove("oculto");
    mostrar();
  }

  function mostrar() {
    actual = cola[indice];
    document.getElementById("arit-progreso").style.width = (indice / cola.length) * 100 + "%";
    document.getElementById("arit-pregunta").textContent =
      fmt(actual.a) + (actual.suma ? "  +  " : "  −  ") + fmt(actual.b) + "  =";
    const inp = document.getElementById("arit-input");
    inp.value = ""; inp.disabled = false;
    document.getElementById("arit-resp").classList.remove("oculto");
    document.getElementById("arit-explica").classList.add("oculto");
    document.getElementById("arit-siguiente").classList.add("oculto");
    const retro = document.getElementById("arit-retro");
    retro.textContent = ""; retro.className = "retro";
    inp.focus();
    arrancarTimer();
  }

  function comprobar() {
    if (!actual) return;
    const inp = document.getElementById("arit-input");
    if (inp.value.trim() === "") return;
    Juego.cronDetener(); inp.disabled = true;
    const retro = document.getElementById("arit-retro");
    if (parseInt(inp.value, 10) === actual.r) {
      aciertos++; retro.textContent = Juego.frasePositiva(); retro.className = "retro bien";
      Juego.acierto();
      temporizador = setTimeout(siguiente, 950);
    } else {
      retro.textContent = "¡Ups! Mira cómo se hace paso a paso 👇";
      retro.className = "retro mal";
      Juego.error();
      mostrarExplica();
    }
  }

  // Explicación columna por columna (llevando / prestando).
  function explicar(a, b, suma) {
    const da = String(a).split("").reverse().map(Number);
    const db = String(b).split("").reverse().map(Number);
    const n = Math.max(da.length, db.length);
    const pasos = [];
    let acarreo = 0;
    for (let i = 0; i < n; i++) {
      const x = da[i] || 0, y = db[i] || 0;
      const col = ORDEN[i] || ("posición " + (i + 1));
      if (suma) {
        const s = x + y + acarreo;
        const escribe = s % 10, llevo = Math.floor(s / 10);
        pasos.push("<b>" + col + "</b>: " + x + " + " + y +
          (acarreo ? " + " + acarreo + " (que llevabas)" : "") + " = " + s +
          " → escribes <b>" + escribe + "</b>" + (llevo ? " y llevas " + llevo : ""));
        acarreo = llevo;
      } else {
        const arriba = x - acarreo;
        let res, presta;
        if (arriba < y) {
          res = arriba + 10 - y; presta = 1;
          pasos.push("<b>" + col + "</b>: " + (acarreo ? x + " − " + acarreo + " = " + arriba + "; " : "") +
            "como " + arriba + " es menor que " + y + ", pides prestado → " + (arriba + 10) + " − " + y +
            " = <b>" + res + "</b>");
        } else {
          res = arriba - y; presta = 0;
          pasos.push("<b>" + col + "</b>: " + (acarreo ? x + " − " + acarreo + " = " + arriba + "; " : "") +
            arriba + " − " + y + " = <b>" + res + "</b>");
        }
        acarreo = presta;
      }
    }
    if (suma && acarreo) pasos.push("Al final te queda " + acarreo + " que llevabas: lo escribes a la izquierda.");
    return pasos;
  }

  function mostrarExplica() {
    const pasos = explicar(actual.a, actual.b, actual.suma);
    const box = document.getElementById("arit-explica");
    box.innerHTML =
      "<p class='explica-titulo'>Así se " + (actual.suma ? "suma <b>llevando</b>" : "resta <b>prestando</b>") +
      ", de derecha a izquierda:</p><ol>" +
      pasos.map((p) => "<li>" + p + "</li>").join("") +
      "</ol><p class='explica-res'>Resultado: <b>" + fmt(actual.r) + "</b></p>";
    box.classList.remove("oculto");
    document.getElementById("arit-resp").classList.add("oculto");
    document.getElementById("arit-siguiente").classList.remove("oculto");
    document.getElementById("arit-siguiente").focus();
  }

  function siguiente() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    indice++;
    if (indice >= cola.length) terminar(); else mostrar();
  }

  function arrancarTimer() {
    const c = Juego.config();
    const el = document.getElementById("arit-timer");
    if (c.timerOn) { el.classList.remove("oculto"); Juego.cronIniciar(c.timerSeg, "arit-timer", tiempoAgotado); }
    else { el.classList.add("oculto"); Juego.cronDetener(); }
  }
  function tiempoAgotado() {
    document.getElementById("arit-input").disabled = true;
    const retro = document.getElementById("arit-retro");
    retro.textContent = "⏰ ¡Se acabó el tiempo! Mira cómo se hace 👇";
    retro.className = "retro mal";
    Juego.error();
    mostrarExplica();
  }

  function terminar() {
    Juego.cronDetener();
    document.getElementById("arit-timer").classList.add("oculto");
    document.getElementById("arit-progreso").style.width = "100%";
    document.getElementById("arit-pregunta").textContent =
      "¡Terminaste, " + Juego.jugador() + "! " + aciertos + " de " + cola.length + " ⭐";
    document.getElementById("arit-resp").classList.add("oculto");
    document.getElementById("arit-explica").classList.add("oculto");
    document.getElementById("arit-siguiente").classList.add("oculto");
    const retro = document.getElementById("arit-retro");
    retro.textContent = aciertos === cola.length ? "¡Perfecto! 🏆" : "¡Muy bien! Toca otra ronda para seguir.";
    retro.className = "retro bien";
    if (aciertos >= cola.length - 1) Juego.granPremio();
    temporizador = setTimeout(volverSelector, 2600);
  }
  function volverSelector() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    Juego.cronDetener();
    document.getElementById("arit-resp").classList.remove("oculto");
    document.getElementById("arit-explica").classList.add("oculto");
    document.getElementById("arit-siguiente").classList.add("oculto");
    elJuego().classList.add("oculto");
    elSel().classList.remove("oculto");
  }

  return { init, comprobar, siguiente, volverSelector };
})();
window.Aritmetica = Aritmetica;
