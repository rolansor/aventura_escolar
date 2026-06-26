/* ============================================================
   MODO SUMAS Y RESTAS — Matemáticas (en cuadrícula vertical)
   Operaciones de 3 a 10 cifras, nunca repetidas en la ronda, en
   columna (un dígito por casilla). El niño escribe el resultado
   casilla por casilla. Si falla: se muestra la SOLUCIÓN GRÁFICA
   (la operación con el resultado abajo) + la explicación paso a
   paso (llevando/prestando), y puede "Volver a intentar".
   ============================================================ */
const Aritmetica = (function () {
  let cola = [], indice = 0, aciertos = 0, actual = null, temporizador = null, reintento = false, tInicio = 0;
  const TOTAL = 10;
  const CIFRAS = [3, 4, 5, 6, 7, 8, 9, 10];
  const ORDEN = ["unidades", "decenas", "centenas", "unidades de mil", "decenas de mil",
    "centenas de mil", "unidades de millón", "decenas de millón", "centenas de millón", "unidades de mil millones"];
  const COLOR = ["col-u", "col-d", "col-c", "col-m", "col-dm", "col-cm"];
  const elSel = () => document.getElementById("arit-selector");
  const elJuego = () => document.getElementById("arit-juego");
  const $ = (id) => document.getElementById(id);

  function numDe(n) { return Juego.azar(Math.pow(10, n - 1), Math.pow(10, n) - 1); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function colorCol(pos) { return COLOR[pos] || "col-u"; }

  // El nivel del perfil acota cuántas cifras se ofrecen (ver Juego.porNivel).
  function cifrasNivel() { return Juego.porNivel([[2, 3], [3, 4, 5, 6], [6, 7, 8, 9, 10]]); }
  function init() { pintarSelector(); }
  function pintarSelector() {
    const c = elSel(); if (!c) return;
    c.innerHTML = "";
    cifrasNivel().forEach((n) => {
      const b = document.createElement("button");
      b.className = "chip-categoria";
      b.innerHTML = "➕➖ " + n + " cifras<small>sumas y restas al azar</small>";
      b.onclick = () => empezar(n);
      c.appendChild(b);
    });
  }

  function empezar(cifras) {
    aciertos = 0; indice = 0; cola = []; tInicio = Date.now();
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
    reintento = false;
    $("arit-progreso").style.width = (indice / cola.length) * 100 + "%";
    construirGrid(false);
    $("arit-explica").classList.add("oculto");
    $("arit-solucion").classList.add("oculto");
    $("arit-reintentar").classList.add("oculto");
    $("arit-siguiente").classList.add("oculto");
    $("arit-enviar").classList.remove("oculto");
    const retro = $("arit-retro"); retro.textContent = ""; retro.className = "retro";
    arrancarTimer();
  }

  // Construye la cuadrícula. Si solucion=true, es de solo lectura con el
  // resultado ya escrito abajo (solución gráfica).
  function construirGrid(solucion) {
    const A = String(actual.a), B = String(actual.b), R = String(actual.r);
    const N = Math.max(A.length, B.length, R.length);
    const da = A.padStart(N, " "), db = B.padStart(N, " "), dr = R.padStart(N, " ");
    let h = '<div class="op-grid" style="grid-template-columns:auto repeat(' + N + ',1fr)">';
    if (!solucion) {
      h += '<div class="op-sign"></div>';
      for (let i = 0; i < N; i++) h += '<input class="op-llevada" maxlength="1" inputmode="numeric" aria-label="llevada">';
    }
    h += '<div class="op-sign"></div>';
    for (let i = 0; i < N; i++) h += '<div class="op-num ' + colorCol(N - 1 - i) + '">' + (da[i] === " " ? "" : da[i]) + "</div>";
    h += '<div class="op-sign">' + (actual.suma ? "+" : "−") + "</div>";
    for (let i = 0; i < N; i++) h += '<div class="op-num ' + colorCol(N - 1 - i) + '">' + (db[i] === " " ? "" : db[i]) + "</div>";
    h += '<div class="op-linea"></div>';
    h += '<div class="op-sign"></div>';
    if (solucion) {
      for (let i = 0; i < N; i++) h += '<div class="op-num op-sol ' + colorCol(N - 1 - i) + '">' + (dr[i] === " " ? "" : dr[i]) + "</div>";
    } else {
      for (let i = 0; i < N; i++) h += '<input class="op-resp ' + colorCol(N - 1 - i) + '" maxlength="1" inputmode="numeric">';
    }
    h += "</div>";

    if (solucion) { $("arit-solucion").innerHTML = h; return; }

    const cont = $("arit-grid");
    cont.innerHTML = h;
    const resp = Array.prototype.slice.call(cont.querySelectorAll(".op-resp"));
    resp.forEach((inp, idx) => {
      inp.addEventListener("input", function () {
        inp.value = inp.value.replace(/[^0-9]/g, "").slice(0, 1);
        if (inp.value && idx > 0) resp[idx - 1].focus();
      });
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") comprobar();
        else if (e.key === "Backspace" && !inp.value && idx < resp.length - 1) resp[idx + 1].focus();
      });
    });
    if (resp.length) resp[resp.length - 1].focus();
  }

  function comprobar() {
    if (!actual) return;
    const resp = Array.prototype.slice.call(document.querySelectorAll("#arit-grid .op-resp"));
    if (!resp.some((i) => i.value !== "")) return;
    Juego.cronDetener();
    const R = String(actual.r);
    const off = resp.length - R.length;
    let todo = true;
    resp.forEach((inp, i) => {
      inp.disabled = true;
      const exp = i < off ? "" : R[i - off];
      const val = inp.value;
      const bien = exp === "" ? (val === "" || val === "0") : val === exp;
      inp.classList.add(bien ? "ok" : "mal");
      if (!bien) todo = false;
    });
    const retro = $("arit-retro");
    if (todo) {
      retro.textContent = Juego.frasePositiva(); retro.className = "retro bien";
      if (!reintento) { aciertos++; Juego.acierto(); }
      temporizador = setTimeout(siguiente, 1100);
    } else {
      retro.textContent = "¡Ups! Mira la solución y vuelve a intentar 👇";
      retro.className = "retro mal";
      if (!reintento) Juego.error();
      mostrarFallo();
    }
  }

  function explicar(a, b, suma) {
    const da = String(a).split("").reverse().map(Number);
    const db = String(b).split("").reverse().map(Number);
    const n = Math.max(da.length, db.length);
    const pasos = []; let acarreo = 0;
    for (let i = 0; i < n; i++) {
      const x = da[i] || 0, y = db[i] || 0;
      const col = ORDEN[i] || ("posición " + (i + 1));
      if (suma) {
        const s = x + y + acarreo;
        pasos.push("<b>" + col + "</b>: " + x + " + " + y + (acarreo ? " + " + acarreo + " (que llevabas)" : "") +
          " = " + s + " → escribes <b>" + (s % 10) + "</b>" + (s >= 10 ? " y llevas " + Math.floor(s / 10) : ""));
        acarreo = Math.floor(s / 10);
      } else {
        const arriba = x - acarreo; let res, presta;
        if (arriba < y) { res = arriba + 10 - y; presta = 1;
          pasos.push("<b>" + col + "</b>: " + (acarreo ? x + " − " + acarreo + " = " + arriba + "; " : "") +
            "como " + arriba + " es menor que " + y + ", pides prestado → " + (arriba + 10) + " − " + y + " = <b>" + res + "</b>");
        } else { res = arriba - y; presta = 0;
          pasos.push("<b>" + col + "</b>: " + (acarreo ? x + " − " + acarreo + " = " + arriba + "; " : "") +
            arriba + " − " + y + " = <b>" + res + "</b>");
        }
        acarreo = presta;
      }
    }
    if (suma && acarreo) pasos.push("Al final llevabas " + acarreo + ": lo escribes a la izquierda.");
    return pasos;
  }

  function mostrarFallo() {
    construirGrid(true);                 // solución gráfica (resultado abajo)
    $("arit-solucion").classList.remove("oculto");
    const pasos = explicar(actual.a, actual.b, actual.suma);
    $("arit-explica").innerHTML =
      "<p class='explica-titulo'>Así se " + (actual.suma ? "suma <b>llevando</b>" : "resta <b>prestando</b>") +
      ", de derecha a izquierda:</p><ol>" + pasos.map((p) => "<li>" + p + "</li>").join("") + "</ol>";
    $("arit-explica").classList.remove("oculto");
    $("arit-enviar").classList.add("oculto");
    $("arit-reintentar").classList.remove("oculto");
    $("arit-siguiente").classList.remove("oculto");
  }

  function reintentar() {
    reintento = true;
    Juego.cronDetener();
    construirGrid(false);
    $("arit-explica").classList.add("oculto");
    $("arit-solucion").classList.add("oculto");
    $("arit-reintentar").classList.add("oculto");
    $("arit-siguiente").classList.add("oculto");
    $("arit-enviar").classList.remove("oculto");
    const retro = $("arit-retro"); retro.textContent = "¡Inténtalo de nuevo!"; retro.className = "retro";
    arrancarTimer();
  }

  function siguiente() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    indice++;
    if (indice >= cola.length) terminar(); else mostrar();
  }

  function arrancarTimer() {
    const c = Juego.config(); const el = $("arit-timer");
    if (c.timerOn) { el.classList.remove("oculto"); Juego.cronIniciar(c.timerSeg, "arit-timer", tiempoAgotado); }
    else { el.classList.add("oculto"); Juego.cronDetener(); }
  }
  function tiempoAgotado() {
    document.querySelectorAll("#arit-grid .op-resp").forEach((i) => (i.disabled = true));
    const retro = $("arit-retro");
    retro.textContent = "⏰ ¡Se acabó el tiempo! Mira la solución 👇";
    retro.className = "retro mal";
    if (!reintento) Juego.error();
    mostrarFallo();
  }

  function terminar() {
    Juego.cronDetener();
    Juego.registrarResultado("arit", { aciertos: aciertos, total: cola.length, ms: Date.now() - tInicio });
    $("arit-timer").classList.add("oculto");
    $("arit-progreso").style.width = "100%";
    $("arit-grid").innerHTML = '<h2 class="pregunta">¡Terminaste, ' + Juego.jugador() + "! " + aciertos + " de " + cola.length + " ⭐</h2>" + Juego.tablaMejoresHTML("arit");
    $("arit-explica").classList.add("oculto");
    $("arit-solucion").classList.add("oculto");
    $("arit-reintentar").classList.add("oculto");
    $("arit-siguiente").classList.add("oculto");
    $("arit-enviar").classList.add("oculto");
    const retro = $("arit-retro");
    retro.textContent = aciertos === cola.length ? "¡Perfecto! 🏆" : "¡Muy bien! Toca otra ronda para seguir.";
    retro.className = "retro bien";
    if (aciertos >= cola.length - 1) Juego.granPremio();
    temporizador = setTimeout(volverSelector, 2600);
  }
  function volverSelector() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    Juego.cronDetener();
    ["arit-explica", "arit-solucion", "arit-reintentar", "arit-siguiente"].forEach((id) => $(id).classList.add("oculto"));
    $("arit-enviar").classList.remove("oculto");
    elJuego().classList.add("oculto");
    elSel().classList.remove("oculto");
  }

  return { init, comprobar, reintentar, siguiente, volverSelector };
})();
window.Aritmetica = Aritmetica;
