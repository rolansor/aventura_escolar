/* ============================================================
   MODO VALOR POSICIONAL — Matemáticas
   Unidades, decenas, centenas… Preguntas de opción múltiple:
   qué dígito ocupa una posición, cuánto vale un dígito, y componer
   un número a partir de sus órdenes. Selector por dificultad.
   ============================================================ */
const ValorPosicional = (function () {
  let cola = [], indice = 0, aciertos = 0, actual = null, temporizador = null;
  const TOTAL = 10;
  const POS = ["unidades", "decenas", "centenas", "unidades de mil", "decenas de mil", "centenas de mil"];
  const elSel = () => document.getElementById("vp-selector");
  const elJuego = () => document.getElementById("vp-juego");

  const azar = (a, b) => Juego.azar(a, b);
  const mezclar = (a) => Juego.mezclar(a.slice());
  const digitoEn = (num, p) => Math.floor(num / Math.pow(10, p)) % 10;
  function numDeCifras(n) { return azar(Math.pow(10, n - 1), Math.pow(10, n) - 1); }

  // 4 opciones (correcta + 3 distintas del pool), barajadas
  function opciones(correcta, pool) {
    const set = {}; set[correcta] = 1;
    const dist = [];
    mezclar(pool).forEach((x) => { x = String(x); if (!set[x]) { set[x] = 1; dist.push(x); } });
    while (dist.length < 3) { const r = String(azar(0, 9)); if (!set[r]) { set[r] = 1; dist.push(r); } }
    return mezclar([String(correcta)].concat(dist.slice(0, 3)));
  }

  function gDigito(cifras) {
    const num = numDeCifras(cifras);
    const p = azar(0, cifras - 1);
    const d = digitoEn(num, p);
    const otras = []; for (let i = 0; i < cifras; i++) if (i !== p) otras.push(digitoEn(num, i));
    return { tema: "🔢 Posición", pregunta: "En " + num + ", ¿qué dígito está en las " + POS[p] + "?",
      correcta: String(d), opciones: opciones(d, otras) };
  }
  function gValor(cifras) {
    const num = numDeCifras(cifras);
    let p = azar(0, cifras - 1);
    let d = digitoEn(num, p);
    if (d === 0) { p = cifras - 1; d = digitoEn(num, p); } // evitar "vale 0"
    const valor = d * Math.pow(10, p);
    const pool = [d, Math.pow(10, p), d * Math.pow(10, Math.max(0, p - 1)), d * Math.pow(10, p + 1)];
    return { tema: "💰 Valor del dígito", pregunta: "En " + num + ", ¿cuánto vale el dígito de las " + POS[p] + " (el " + d + ")?",
      correcta: String(valor), opciones: opciones(valor, pool) };
  }
  function gCompone(cifras) {
    const dig = [];
    for (let i = cifras - 1; i >= 0; i--) dig.push(i === cifras - 1 ? azar(1, 9) : azar(0, 9)); // de mayor a menor orden
    let num = 0; for (let i = 0; i < cifras; i++) num = num * 10 + dig[i];
    const partes = [];
    for (let i = 0; i < cifras; i++) partes.push(dig[i] + " " + POS[cifras - 1 - i]);
    const pool = [num + 1, num - 1, num + 10, num - 10, num + 100].filter((x) => x > 0);
    return { tema: "🧱 Componer", pregunta: "¿Qué número tiene " + partes.join(", ") + "?",
      correcta: String(num), opciones: opciones(num, pool) };
  }

  const GEN = [gDigito, gValor, gCompone];
  const NIVELES = [
    { id: 3, icono: "🔢", nombre: "Hasta centenas", desc: "números de 3 cifras" },
    { id: 4, icono: "🔢", nombre: "Hasta miles", desc: "números de 4 cifras" },
    { id: 5, icono: "🔢", nombre: "Hasta decenas de mil", desc: "números de 5 cifras" },
    { id: 0, icono: "🎲", nombre: "Mixto", desc: "de 3 a 6 cifras" }
  ];

  function init() { pintarSelector(); }
  function pintarSelector() {
    const c = elSel(); if (!c) return;
    c.innerHTML = "";
    NIVELES.forEach((n) => {
      const b = document.createElement("button");
      b.className = "chip-categoria";
      b.innerHTML = n.icono + " " + n.nombre + "<small>" + n.desc + "</small>";
      b.onclick = () => empezar(n.id);
      c.appendChild(b);
    });
  }

  function empezar(nivel) {
    aciertos = 0; indice = 0; cola = [];
    for (let i = 0; i < TOTAL; i++) {
      const cifras = nivel === 0 ? azar(3, 6) : nivel;
      cola.push(azarEl(GEN)(cifras));
    }
    elSel().classList.add("oculto");
    elJuego().classList.remove("oculto");
    mostrar();
  }
  function azarEl(a) { return a[Math.floor(Math.random() * a.length)]; }

  function mostrar() {
    actual = cola[indice];
    document.getElementById("vp-progreso").style.width = (indice / cola.length) * 100 + "%";
    document.getElementById("vp-tema").textContent = "💡 " + actual.tema;
    document.getElementById("vp-pregunta").textContent = actual.pregunta;
    const retro = document.getElementById("vp-retro"); retro.textContent = ""; retro.className = "retro";
    const op = document.getElementById("vp-opciones"); op.innerHTML = "";
    actual.opciones.forEach((o) => crearOpcion(o, o === actual.correcta));
    arrancarTimer();
  }
  function crearOpcion(texto, esCorrecta) {
    const b = document.createElement("button");
    b.className = "opcion"; b.textContent = texto;
    b.onclick = () => responder(b, esCorrecta);
    document.getElementById("vp-opciones").appendChild(b);
  }
  function responder(boton, esCorrecta) {
    Juego.cronDetener();
    document.querySelectorAll("#vp-opciones .opcion").forEach((x) => (x.onclick = null));
    const retro = document.getElementById("vp-retro");
    if (esCorrecta) {
      boton.classList.add("correcta"); aciertos++;
      retro.textContent = Juego.frasePositiva(); retro.className = "retro bien";
      Juego.acierto(); avanzar(900);
    } else {
      boton.classList.add("incorrecta");
      retro.textContent = "Casi… la respuesta es: " + actual.correcta;
      retro.className = "retro mal"; Juego.error();
      document.querySelectorAll("#vp-opciones .opcion").forEach((x) => { if (x.textContent === actual.correcta) x.classList.add("correcta"); });
      avanzar(1900);
    }
  }
  function arrancarTimer() {
    const c = Juego.config();
    const el = document.getElementById("vp-timer");
    if (c.timerOn) { el.classList.remove("oculto"); Juego.cronIniciar(c.timerSeg, "vp-timer", tiempoAgotado); }
    else { el.classList.add("oculto"); Juego.cronDetener(); }
  }
  function tiempoAgotado() {
    document.querySelectorAll("#vp-opciones .opcion").forEach((x) => (x.onclick = null));
    const retro = document.getElementById("vp-retro");
    retro.textContent = "⏰ ¡Se acabó el tiempo! Era: " + actual.correcta; retro.className = "retro mal";
    document.querySelectorAll("#vp-opciones .opcion").forEach((x) => { if (x.textContent === actual.correcta) x.classList.add("correcta"); });
    Juego.error(); avanzar(1900);
  }
  function avanzar(ms) {
    temporizador = setTimeout(() => { indice++; if (indice >= cola.length) terminar(); else mostrar(); }, ms);
  }
  function terminar() {
    Juego.cronDetener();
    document.getElementById("vp-timer").classList.add("oculto");
    document.getElementById("vp-progreso").style.width = "100%";
    document.getElementById("vp-tema").textContent = "";
    document.getElementById("vp-pregunta").textContent =
      "¡Terminaste, " + Juego.jugador() + "! " + aciertos + " de " + cola.length + " ⭐";
    document.getElementById("vp-opciones").innerHTML = "";
    const retro = document.getElementById("vp-retro");
    retro.textContent = aciertos === cola.length ? "¡Perfecto! 🏆" : "¡Muy bien! Toca otra ronda para seguir.";
    retro.className = "retro bien";
    if (aciertos >= cola.length - 1) Juego.granPremio();
    temporizador = setTimeout(volverSelector, 2600);
  }
  function volverSelector() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    Juego.cronDetener();
    elJuego().classList.add("oculto");
    elSel().classList.remove("oculto");
  }

  return { init, volverSelector };
})();
window.ValorPosicional = ValorPosicional;
