/* ============================================================
   MODO QUIZ DEL ECUADOR — Estudios Sociales
   Preguntas de opción múltiple sobre provincias, capitales,
   regiones, gentilicios, cantones y banderas. Lee los datos de
   DATOS.mapas (provincias/regiones/detalle) y ECUADOR_CANTONES.
   Misma mecánica que Ortografía: selector de temas -> ronda de 10.
   ============================================================ */
const Quiz = (function () {
  let cola = [], indice = 0, aciertos = 0, temporizador = null, tInicio = 0, ultimoTema = "mixto";
  const TOTAL_RONDA = 10;
  const PX = "quiz";               // clave del leaderboard
  // Opciones por pregunta según el nivel del perfil: 3 en básico, 4 en los demás.
  const nDist = () => Juego.porNivel([2, 3, 3]);

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

  let cantPorIso = {}, nCantPorIso = {}, vecesCanton = {};
  function indexarCantones() {
    cantPorIso = {}; nCantPorIso = {}; vecesCanton = {};
    const d = window.ECUADOR_CANTONES;
    if (!d || !d.provincias) return;
    d.provincias.forEach((p) => {
      cantPorIso[p.iso] = (p.cantones || []).map((c) => c.nombre);
      nCantPorIso[p.iso] = p.nCantones || (p.cantones || []).length;
      cantPorIso[p.iso].forEach((n) => { vecesCanton[n] = (vecesCanton[n] || 0) + 1; });
    });
  }
  // Hay nombres de cantón que existen en dos provincias (Bolívar, Olmedo): no sirven
  // para preguntar "¿de qué provincia es?" porque habría dos respuestas buenas.
  const cantonUnico = (n) => vecesCanton[n] === 1;
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
      p.cap, otros(provs().map((x) => x.cap), p.cap, nDist()),
      { pista: "Piensa en la ciudad principal de " + p.n + "." });
  }
  function gProvDeCapital() {
    const p = azarEl(provs());
    return pregunta("🏛️ Capitales", p.cap + " es la capital de…",
      p.n, otros(provs().map((x) => x.n), p.n, nDist()));
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
      correcta, otros(fuera.map((x) => x.n), correcta, nDist()));
  }
  function gGentilicio() {
    const lista = provs().filter((p) => gent(p.iso));
    const p = azarEl(lista);
    const g = gent(p.iso);
    return pregunta("🙋 Gentilicios", "¿Cómo se llama a quien nace en " + p.n + "?",
      g, otros(lista.map((x) => gent(x.iso)), g, nDist()),
      { pista: "Gentilicio de " + p.n + "." });
  }
  function gCantonDe() {
    const conC = provs().filter((x) => cantonesDe(x.iso).length);
    const p = azarEl(conC);
    const propios = cantonesDe(p.iso);
    const c = azarEl(propios);
    const ajenos = [];
    // Los distractores no pueden llamarse igual que un cantón de esta provincia.
    provs().forEach((x) => { if (x.iso !== p.iso) cantonesDe(x.iso).forEach((n) => { if (propios.indexOf(n) < 0) ajenos.push(n); }); });
    return pregunta("🏘️ Cantones", "¿Cuál de estos es un cantón de " + p.n + "?",
      c, otros(ajenos, c, nDist()));
  }
  function gProvDeCanton() {
    const conC = provs().filter((x) => cantonesDe(x.iso).length);
    const p = azarEl(conC);
    const unicos = cantonesDe(p.iso).filter(cantonUnico);
    const c = azarEl(unicos.length ? unicos : cantonesDe(p.iso));
    return pregunta("🏘️ Cantones", "¿A qué provincia pertenece el cantón " + c + "?",
      p.n, otros(provs().map((x) => x.n), p.n, nDist()));
  }
  function gCuantosCantones() {
    const conC = provs().filter((x) => nCant(x.iso) > 0);
    const p = azarEl(conC);
    const n = nCant(p.iso);
    const set = {}; set[n] = 1;
    const ops = [n];
    let intentos = 0;
    while (ops.length < nDist() + 1 && intentos++ < 40) {
      const d = n + Juego.azar(-5, 5);
      if (d > 0 && !set[d]) { set[d] = 1; ops.push(d); }
    }
    return pregunta("🏘️ Cantones", "¿Cuántos cantones tiene " + p.n + "?",
      String(n), ops.slice(1).map(String));
  }
  function gBandera() {
    const p = azarEl(provs());
    return pregunta("🚩 Banderas", "¿De qué provincia es esta bandera?",
      p.n, otros(provs().map((x) => x.n), p.n, nDist()),
      { imagen: "recursos/banderas/" + p.iso + ".svg" });
  }

  /* ---------- Bancos de texto (JSON externo) ---------- */
  // Los bancos "aborigen" y "territorio" viven en data/contenido/quiz.json.
  // Se leen en tiempo de ejecución (no al cargar el IIFE).
  function bancoQuiz(k) {
    return (window.DATOS && DATOS.contenido && DATOS.contenido.quiz && DATOS.contenido.quiz.bancos && DATOS.contenido.quiz.bancos[k]) || [];
  }

  /* ---------- Época Aborigen (Taller 1) ---------- */
  const mazos = {};
  function siguiente(k) {            // reparte el banco sin repetir hasta agotarlo
    if (!mazos[k] || !mazos[k].length) mazos[k] = mezclar(bancoQuiz(k));
    return mazos[k].pop();
  }
  function gAborigen() {
    const x = siguiente("aborigen");
    return pregunta("🏺 Época Aborigen", x.p, x.c, mezclar(x.d).slice(0, nDist()), x.pista ? { pista: x.pista } : null);
  }

  /* ---------- Territorio y relieves ---------- */
  function gTerritorio() {
    const x = siguiente("territorio");
    return pregunta("🧭 Territorio y relieves", x.p, x.c, mezclar(x.d).slice(0, nDist()), x.pista ? { pista: x.pista } : null);
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
    Juego.pintarMejores(cont, PX); // 🏆 mejores de esta actividad
  }

  function empezar(catId) {
    const gens = GEN[catId] || GEN.mixto;
    ultimoTema = catId;
    aciertos = 0; indice = 0; cola = []; tInicio = Date.now();
    Juego.quitarBotonesFin(document.getElementById("quiz-retro"));
    // Ninguna pregunta se repite dentro de la ronda.
    const vistas = {};
    for (let i = 0; i < TOTAL_RONDA; i++) {
      let q, firma, intentos = 0;
      do { q = azarEl(gens)(); firma = q.pregunta + "|" + q.correcta; intentos++; }
      while (vistas[firma] && intentos < 14);
      vistas[firma] = 1;
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
    document.getElementById("quiz-tema").textContent = "";
    document.getElementById("quiz-pista").textContent = "";
    Juego.tip(q.pista || q.tema);
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
    if (c.timerOn) { el.classList.remove("oculto"); Juego.cronIniciar(Juego.tiempo(1), "quiz-timer", tiempoAgotado); }
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
    Juego.registrarResultado(PX, { aciertos: aciertos, total: cola.length, ms: Date.now() - tInicio });
    document.getElementById("quiz-opciones").innerHTML = Juego.tablaMejoresHTML(PX);
    const retro = document.getElementById("quiz-retro");
    retro.textContent = aciertos === cola.length ? "¡Perfecto! 🏆" : "¡Muy bien! ¿Otra ronda para mejorar?";
    retro.className = "retro bien";
    if (aciertos >= cola.length - 1) Juego.granPremio();
    Juego.botonesFin(retro, () => empezar(ultimoTema), volverSelector);
  }

  function volverSelector() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    Juego.cronDetener();
    Juego.quitarBotonesFin(document.getElementById("quiz-retro"));
    pintarSelector();   // refresca el 🏆
    elJuego().classList.add("oculto");
    elSelector().classList.remove("oculto");
  }

  return { init, volverSelector, pintarSelector };
})();
window.Quiz = Quiz;
