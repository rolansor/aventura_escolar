/* ============================================================
   MODO QUIZ DEL ECUADOR — Estudios Sociales
   Preguntas de opción múltiple sobre provincias, capitales,
   regiones, gentilicios, cantones y banderas. Lee los datos de
   DATOS.mapas (provincias/regiones/detalle) y ECUADOR_CANTONES.
   Misma mecánica que Ortografía: selector de temas -> ronda de 10.
   ============================================================ */
const Quiz = (function () {
  let cola = [], indice = 0, aciertos = 0, temporizador = null;
  const TOTAL_RONDA = 10;

  const elSelector = () => document.getElementById("quiz-selector");
  const elJuego = () => document.getElementById("quiz-juego");

  const azarEl = (a) => Juego.azarEl(a);
  const mezclar = (a) => Juego.mezclar(a.slice());

  /* ---------- Acceso a datos ---------- */
  const provs = () => (DATOS.mapas && DATOS.mapas.provincias) || [];
  const regiones = () => (DATOS.mapas && DATOS.mapas.regiones) || {};
  const regNombre = (k) => (regiones()[k] || {}).nombre || k;
  const detalle = (iso) => (DATOS.mapas && DATOS.mapas.detalle && DATOS.mapas.detalle[iso]) || {};
  const gent = (iso) => detalle(iso).gentilicio;

  let cantPorIso = {}, nCantPorIso = {};
  function indexarCantones() {
    cantPorIso = {}; nCantPorIso = {};
    const d = window.ECUADOR_CANTONES;
    if (!d || !d.provincias) return;
    d.provincias.forEach((p) => {
      cantPorIso[p.iso] = (p.cantones || []).map((c) => c.nombre);
      nCantPorIso[p.iso] = p.nCantones || (p.cantones || []).length;
    });
  }
  const cantonesDe = (iso) => cantPorIso[iso] || [];
  const nCant = (iso) => nCantPorIso[iso] || 0;

  // n distintos del pool, excluyendo 'excl'
  function otros(pool, excl, n) {
    const u = [];
    const vistos = {};
    pool.forEach((x) => { if (x != null && x !== excl && !vistos[x]) { vistos[x] = 1; u.push(x); } });
    return mezclar(u).slice(0, n);
  }
  function pregunta(tema, texto, correcta, distractores, extra) {
    const q = { tema: tema, pregunta: texto, correcta: correcta,
      opciones: mezclar([correcta].concat(distractores)) };
    if (extra) for (const k in extra) q[k] = extra[k];
    return q;
  }

  /* ---------- Generadores de preguntas ---------- */
  function gCapitalDe() {
    const p = azarEl(provs());
    return pregunta("🏛️ Capitales", "¿Cuál es la capital de " + p.n + "?",
      p.cap, otros(provs().map((x) => x.cap), p.cap, 3),
      { pista: "Piensa en la ciudad principal de " + p.n + "." });
  }
  function gProvDeCapital() {
    const p = azarEl(provs());
    return pregunta("🏛️ Capitales", p.cap + " es la capital de…",
      p.n, otros(provs().map((x) => x.n), p.n, 3));
  }
  function gRegionDe() {
    const p = azarEl(provs());
    const todas = Object.keys(regiones()).map((k) => regiones()[k].nombre);
    const rn = regNombre(p.reg);
    return pregunta("🗺️ Regiones", "¿En qué región natural está " + p.n + "?",
      rn, otros(todas, rn, 3));
  }
  function gProvDeRegion() {
    const keys = Object.keys(regiones());
    const k = azarEl(keys);
    const dentro = provs().filter((p) => p.reg === k);
    const fuera = provs().filter((p) => p.reg !== k);
    const correcta = azarEl(dentro).n;
    return pregunta("🗺️ Regiones", "¿Cuál de estas provincias es de la región " + regNombre(k) + "?",
      correcta, otros(fuera.map((x) => x.n), correcta, 3));
  }
  function gGentilicio() {
    const lista = provs().filter((p) => gent(p.iso));
    const p = azarEl(lista);
    const g = gent(p.iso);
    return pregunta("🙋 Gentilicios", "¿Cómo se llama a quien nace en " + p.n + "?",
      g, otros(lista.map((x) => gent(x.iso)), g, 3),
      { pista: "Gentilicio de " + p.n + "." });
  }
  function gCantonDe() {
    const conC = provs().filter((x) => cantonesDe(x.iso).length);
    const p = azarEl(conC);
    const c = azarEl(cantonesDe(p.iso));
    const ajenos = [];
    provs().forEach((x) => { if (x.iso !== p.iso) ajenos.push.apply(ajenos, cantonesDe(x.iso)); });
    return pregunta("🏘️ Cantones", "¿Cuál de estos es un cantón de " + p.n + "?",
      c, otros(ajenos, c, 3));
  }
  function gProvDeCanton() {
    const conC = provs().filter((x) => cantonesDe(x.iso).length);
    const p = azarEl(conC);
    const c = azarEl(cantonesDe(p.iso));
    return pregunta("🏘️ Cantones", "¿A qué provincia pertenece el cantón " + c + "?",
      p.n, otros(provs().map((x) => x.n), p.n, 3));
  }
  function gCuantosCantones() {
    const conC = provs().filter((x) => nCant(x.iso) > 0);
    const p = azarEl(conC);
    const n = nCant(p.iso);
    const set = {}; set[n] = 1;
    const ops = [n];
    let intentos = 0;
    while (ops.length < 4 && intentos++ < 40) {
      const d = n + Juego.azar(-5, 5);
      if (d > 0 && !set[d]) { set[d] = 1; ops.push(d); }
    }
    return pregunta("🏘️ Cantones", "¿Cuántos cantones tiene " + p.n + "?",
      String(n), ops.slice(1).map(String));
  }
  function gBandera() {
    const p = azarEl(provs());
    return pregunta("🚩 Banderas", "¿De qué provincia es esta bandera?",
      p.n, otros(provs().map((x) => x.n), p.n, 3),
      { imagen: "recursos/banderas/" + p.iso + ".svg" });
  }

  /* ---------- Época Aborigen (Taller 1) ---------- */
  // Bancos fijos: cada pregunta tiene su correcta y sus distractores a mano.
  const ABORIGEN = [
    { p: "¿Por dónde llegaron los primeros pobladores según la teoría de Bering?",
      c: "Por el estrecho de Bering", d: ["Por el río Amazonas", "En avión", "Por el mar Caribe"],
      pista: "Un paso de tierra entre Asia y América." },
    { p: "¿Quién propuso que llegaron desde la Polinesia en balsas?",
      c: "Paul Rivet", d: ["Cristóbal Colón", "Charles Darwin", "Simón Bolívar"] },
    { p: "Los primeros pobladores del Ecuador eran…",
      c: "cazadores y recolectores", d: ["agricultores con tractores", "comerciantes", "marineros"] },
    { p: "¿En qué periodo se hizo la PRIMERA cerámica?",
      c: "Formativo", d: ["Paleoindio", "Integración", "Colonial"] },
    { p: "¿Cuál es el periodo más ANTIGUO de la época aborigen?",
      c: "Paleoindio", d: ["Formativo", "Integración", "Desarrollo Regional"] },
    { p: "Las confederaciones y señoríos pertenecen al periodo…",
      c: "Integración", d: ["Paleoindio", "Formativo", "Colonial"] },
    { p: "¿Qué cultura hizo la primera cerámica del Ecuador?",
      c: "Valdivia", d: ["La Tolita", "Cañari", "Las Vegas"], pista: "Sus figuras femeninas son famosas." },
    { p: "Los 'Amantes de Sumpa' pertenecen a la cultura…",
      c: "Las Vegas", d: ["Valdivia", "La Tolita", "Inca"] },
    { p: "El famoso 'sol de oro' es de la cultura…",
      c: "La Tolita", d: ["Valdivia", "Las Vegas", "Cañari"] },
    { p: "Los Cañari vivieron en la…",
      c: "Sierra sur", d: ["Costa norte", "Amazonía", "Región Insular"] },
    { p: "¿Cómo conseguían su comida los primeros pobladores?",
      c: "Cazando y recolectando frutos", d: ["Comprando en el mercado", "Pescando con barcos", "Sembrando trigo"],
      pista: "Aún no sembraban ni criaban animales." },
    { p: "¿Qué gran invento marcó el periodo Formativo?",
      c: "La cerámica", d: ["La rueda", "La escritura", "El dinero"] }
  ];
  function gAborigen() {
    const x = azarEl(ABORIGEN);
    return pregunta("🏺 Época Aborigen", x.p, x.c, x.d, x.pista ? { pista: x.pista } : null);
  }

  /* ---------- Territorio y relieves ---------- */
  const TERRITORIO = [
    { p: "¿Qué es más grande, una provincia o un cantón?",
      c: "La provincia", d: ["El cantón", "Son iguales", "La parroquia"] },
    { p: "¿Cómo se llama la división territorial más pequeña?",
      c: "La parroquia", d: ["El cantón", "La provincia", "La región"] },
    { p: "¿En cuántas provincias se divide el Ecuador?",
      c: "24", d: ["20", "22", "30"] },
    { p: "¿Cuál es el volcán más ALTO del Ecuador?",
      c: "Chimborazo", d: ["Cotopaxi", "Tungurahua", "Cayambe"], pista: "Su cumbre es el punto más alejado del centro de la Tierra." },
    { p: "¿En qué región está Galápagos?",
      c: "Región Insular", d: ["Costa", "Sierra", "Amazonía"] },
    { p: "El río Napo está en la región…",
      c: "Amazonía", d: ["Costa", "Sierra", "Región Insular"] },
    { p: "Las cuatro regiones naturales son Costa, Sierra, Amazonía e…",
      c: "Insular", d: ["Antártica", "Pacífica", "Central"] },
    { p: "¿En qué cordillera está el Ecuador?",
      c: "Los Andes", d: ["Los Alpes", "Los Pirineos", "El Himalaya"] },
    { p: "¿Cómo se llama la división que agrupa varias parroquias?",
      c: "El cantón", d: ["La provincia", "La región", "La nación"] },
    { p: "¿Cuántas regiones naturales tiene el Ecuador?",
      c: "4", d: ["2", "3", "5"] },
    { p: "El callejón interandino, con muchos volcanes, está en la región…",
      c: "Sierra", d: ["Costa", "Amazonía", "Región Insular"] }
  ];
  function gTerritorio() {
    const x = azarEl(TERRITORIO);
    return pregunta("🧭 Territorio y relieves", x.p, x.c, x.d, x.pista ? { pista: x.pista } : null);
  }

  const GEN = {
    capitales: [gCapitalDe, gProvDeCapital],
    regiones: [gRegionDe, gProvDeRegion],
    gentilicios: [gGentilicio],
    cantones: [gCantonDe, gProvDeCanton, gCuantosCantones],
    banderas: [gBandera],
    aborigen: [gAborigen],
    territorio: [gTerritorio]
  };
  GEN.mixto = [].concat(GEN.capitales, GEN.regiones, GEN.gentilicios, GEN.cantones, GEN.banderas, GEN.aborigen, GEN.territorio);

  const TEMAS = [
    { id: "capitales", icono: "🏛️", nombre: "Capitales" },
    { id: "regiones", icono: "🗺️", nombre: "Regiones" },
    { id: "gentilicios", icono: "🙋", nombre: "Gentilicios" },
    { id: "cantones", icono: "🏘️", nombre: "Cantones" },
    { id: "banderas", icono: "🚩", nombre: "Banderas" },
    { id: "aborigen", icono: "🏺", nombre: "Época Aborigen" },
    { id: "territorio", icono: "🧭", nombre: "Territorio y relieves" },
    { id: "mixto", icono: "🎲", nombre: "Mixto (todo)" }
  ];

  /* ---------- Flujo ---------- */
  function init() { indexarCantones(); pintarSelector(); }

  function pintarSelector() {
    const cont = elSelector();
    if (!cont) return;
    cont.innerHTML = "";
    TEMAS.forEach((t) => {
      const b = document.createElement("button");
      b.className = "chip-categoria";
      b.innerHTML = t.icono + " " + t.nombre + "<small>preguntas al azar</small>";
      b.onclick = () => empezar(t.id);
      cont.appendChild(b);
    });
  }

  function empezar(catId) {
    const gens = GEN[catId] || GEN.mixto;
    aciertos = 0; indice = 0; cola = [];
    let previo = "";
    for (let i = 0; i < TOTAL_RONDA; i++) {
      let q, firma, intentos = 0;
      do { q = azarEl(gens)(); firma = q.pregunta + "|" + q.correcta; intentos++; }
      while (firma === previo && intentos < 8);
      previo = firma;
      cola.push(q);
    }
    elSelector().classList.add("oculto");
    elJuego().classList.remove("oculto");
    mostrar();
  }

  function mostrar() {
    const q = cola[indice];
    document.getElementById("quiz-progreso").style.width = (indice / cola.length) * 100 + "%";
    document.getElementById("quiz-retro").textContent = "";
    document.getElementById("quiz-retro").className = "retro";
    document.getElementById("quiz-tema").textContent = "💡 " + q.tema;
    document.getElementById("quiz-pista").textContent = q.pista || "";
    const img = document.getElementById("quiz-imagen");
    img.innerHTML = q.imagen
      ? '<img class="quiz-bandera" src="' + q.imagen + '" alt="" onerror="this.style.display=\'none\'">'
      : "";
    document.getElementById("quiz-pregunta").textContent = q.pregunta;
    const opciones = document.getElementById("quiz-opciones");
    opciones.innerHTML = "";
    q.opciones.forEach((op) => crearOpcion(op, op === q.correcta, q));
    arrancarTimer();
  }

  function crearOpcion(texto, esCorrecta, q) {
    const b = document.createElement("button");
    b.className = "opcion";
    b.textContent = texto;
    b.onclick = () => responder(b, esCorrecta, q);
    document.getElementById("quiz-opciones").appendChild(b);
  }

  function responder(boton, esCorrecta, q) {
    Juego.cronDetener();
    document.querySelectorAll("#quiz-opciones .opcion").forEach((x) => (x.onclick = null));
    const retro = document.getElementById("quiz-retro");
    if (esCorrecta) {
      boton.classList.add("correcta");
      aciertos++;
      retro.textContent = Juego.frasePositiva();
      retro.className = "retro bien";
      Juego.acierto();
      avanzar(1000);
    } else {
      boton.classList.add("incorrecta");
      retro.textContent = "Casi… la respuesta es: " + q.correcta;
      retro.className = "retro mal";
      Juego.error();
      document.querySelectorAll("#quiz-opciones .opcion").forEach((x) => {
        if (x.textContent === q.correcta) x.classList.add("correcta");
      });
      avanzar(2000);
    }
  }

  function arrancarTimer() {
    const c = Juego.config();
    const el = document.getElementById("quiz-timer");
    if (c.timerOn) { el.classList.remove("oculto"); Juego.cronIniciar(c.timerSeg, "quiz-timer", tiempoAgotado); }
    else { el.classList.add("oculto"); Juego.cronDetener(); }
  }
  function tiempoAgotado() {
    const q = cola[indice];
    document.querySelectorAll("#quiz-opciones .opcion").forEach((x) => (x.onclick = null));
    const retro = document.getElementById("quiz-retro");
    retro.textContent = "⏰ ¡Se acabó el tiempo! Era: " + q.correcta;
    retro.className = "retro mal";
    document.querySelectorAll("#quiz-opciones .opcion").forEach((x) => {
      if (x.textContent === q.correcta) x.classList.add("correcta");
    });
    Juego.error();
    avanzar(2000);
  }

  function avanzar(ms) {
    temporizador = setTimeout(() => {
      indice++;
      if (indice >= cola.length) terminar();
      else mostrar();
    }, ms);
  }

  function terminar() {
    Juego.cronDetener();
    document.getElementById("quiz-timer").classList.add("oculto");
    document.getElementById("quiz-progreso").style.width = "100%";
    document.getElementById("quiz-imagen").innerHTML = "";
    document.getElementById("quiz-tema").textContent = "";
    document.getElementById("quiz-pregunta").textContent =
      "¡Terminaste, " + Juego.jugador() + "! " + aciertos + " de " + cola.length + " ⭐";
    document.getElementById("quiz-pista").textContent = "";
    document.getElementById("quiz-opciones").innerHTML = "";
    const retro = document.getElementById("quiz-retro");
    retro.textContent = aciertos === cola.length ? "¡Perfecto! 🏆" : "¡Muy bien! Toca otra ronda para seguir.";
    retro.className = "retro bien";
    if (aciertos >= cola.length - 1) Juego.granPremio();
    temporizador = setTimeout(volverSelector, 2600);
  }

  function volverSelector() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    Juego.cronDetener();
    elJuego().classList.add("oculto");
    elSelector().classList.remove("oculto");
  }

  return { init, volverSelector, pintarSelector };
})();
window.Quiz = Quiz;
