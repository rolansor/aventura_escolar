/* ============================================================
   APP — Núcleo del juego
   Helpers compartidos (Juego.*), navegación entre pantallas,
   puntaje, sonido y confeti. Arranca todos los módulos.
   ============================================================ */

const Juego = (function () {
  let sonidoActivo = true;
  let audioCtx = null;

  const estado = {
    estrellas: 0,
    racha: 0,
    nivel: 1
  };

  /* ---------- Persistencia (localStorage) ---------- */
  function guardar(clave, valor) {
    try { localStorage.setItem("ads_" + clave, JSON.stringify(valor)); } catch (e) {}
  }
  function cargar(clave, porDefecto) {
    try {
      const v = localStorage.getItem("ads_" + clave);
      return v ? JSON.parse(v) : porDefecto;
    } catch (e) { return porDefecto; }
  }

  /* ---------- Utilidades ---------- */
  function azar(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function azarEl(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function mezclar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  /* Datos personalizables del jugador y el avatar */
  function jugador() { return cargar("jugador", (typeof NINO !== "undefined" ? NINO : "Nelson")); }
  function avatarNombre() { return cargar("avatar", "Luna"); }
  function genero() { return cargar("genero", "nina"); } // "nina" | "nino"

  function frasePositiva() {
    const n = jugador();
    const arr = [
      "¡Muy bien, " + n + "! 🎉", "¡Correcto! 👏", "¡Excelente, " + n + "! 🌟",
      "¡Lo lograste! 🚀", "¡Genial! 😄", "¡Perfecto! ✨", "¡Eres un crack, " + n + "! 💪",
      "¡Así se hace! 🏅", "¡Súper, " + n + "! 🤩"
    ];
    return arr[azar(0, arr.length - 1)];
  }

  /* Construye una secuencia a partir de una configuración del editor. */
  function construirSecuencia(cfg) {
    const t = [];
    let v = cfg.inicio;
    const n = cfg.largo || 6;
    if (cfg.operacion === "fibonacci") {
      let a = cfg.inicio, b = cfg.inicio + Math.max(1, cfg.paso);
      t.push(a, b);
      while (t.length < n) { const c = a + b; t.push(c); a = b; b = c; }
      return t;
    }
    if (cfg.operacion === "cuadrados") {
      for (let i = 0; i < n; i++) t.push(Math.pow(cfg.inicio + i, 2));
      return t;
    }
    for (let i = 0; i < n; i++) {
      t.push(v);
      if (cfg.operacion === "suma") v += cfg.paso;
      else if (cfg.operacion === "resta") v -= cfg.paso;
      else if (cfg.operacion === "multiplicacion") v *= cfg.paso;
      else if (cfg.operacion === "division") v = Math.round((v / cfg.paso) * 100) / 100;
    }
    return t;
  }

  /* ---------- Sonido (WebAudio, sin archivos) ---------- */
  function tono(freq, dur, tipo) {
    if (!sonidoActivo) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gan = audioCtx.createGain();
      osc.type = tipo || "sine";
      osc.frequency.value = freq;
      gan.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gan.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gan); gan.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }
  function sonidoAcierto() { tono(660, 0.12); setTimeout(() => tono(880, 0.18), 110); }
  function sonidoError() { tono(200, 0.25, "sawtooth"); }
  function sonidoFiesta() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tono(f, 0.18), i * 110));
  }

  /* ---------- Puntaje ---------- */
  function refrescarMarcador() {
    document.getElementById("puntaje-estrellas").textContent = estado.estrellas;
    document.getElementById("puntaje-racha").textContent = estado.racha;
    document.getElementById("puntaje-nivel").textContent = estado.nivel;
  }
  function sumarEstrellas(n) {
    estado.estrellas += n;
    estado.nivel = 1 + Math.floor(estado.estrellas / 15);
    guardar("estado", estado);
    refrescarMarcador();
  }
  function acierto() {
    estado.racha++;
    sumarEstrellas(1 + (estado.racha >= 3 ? 1 : 0)); // bonus por racha
    sonidoAcierto();
    if (window.ESCENA && ESCENA.mascotaFeliz) ESCENA.mascotaFeliz();
    reaccionMascota("feliz");
  }
  function error() {
    estado.racha = 0;
    guardar("estado", estado);
    refrescarMarcador();
    sonidoError();
    if (window.ESCENA && ESCENA.mascotaTriste) ESCENA.mascotaTriste();
    reaccionMascota("triste");
  }
  function granPremio() {
    sonidoFiesta();
    if (window.ESCENA) {
      ESCENA.celebrar();
      if (ESCENA.mascotaFeliz) ESCENA.mascotaFeliz();
    }
    reaccionMascota("fiesta");
    confetiHTML();
  }

  /* ---------- Mascota (Luna) ---------- */
  function reaccionMascota(tipo) {
    if (window.Luna && Luna.reaccion) Luna.reaccion(tipo);
  }

  /* ---------- Reiniciar progreso ---------- */
  function reiniciarProgreso() {
    if (!window.confirm("¿Seguro que quieres reiniciar a CERO las estrellas, la racha y el nivel de Nelson?")) return;
    estado.estrellas = 0;
    estado.racha = 0;
    estado.nivel = 1;
    guardar("estado", estado);
    refrescarMarcador();
    reaccionMascota("feliz");
  }

  /* ---------- Confeti HTML (complementa el 3D) ---------- */
  function confetiHTML() {
    const cont = document.getElementById("celebracion");
    const colores = ["#ffc934", "#25c281", "#8a5cf6", "#ef5ba1", "#2e6cf6"];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement("div");
      c.className = "confeti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colores[azar(0, colores.length - 1)];
      c.style.animationDuration = 1.5 + Math.random() * 1.5 + "s";
      c.style.transform = `rotate(${azar(0, 360)}deg)`;
      cont.appendChild(c);
      setTimeout(() => c.remove(), 3200);
    }
  }

  /* ---------- Configuración (temporizador, etc.) ---------- */
  function config() {
    const c = cargar("config", {});
    return {
      timerOn: c.timerOn !== undefined ? c.timerOn : true,   // Ortografía y Secuencias
      timerSeg: c.timerSeg || 30,
      copiaOn: c.copiaOn !== undefined ? c.copiaOn : true,    // Copia y Dictado
      copiaSeg: (c.copiaMin || 5) * 60
    };
  }

  /* ---------- Cronómetro visible (uno a la vez) ---------- */
  let cronId = null;
  function cronDetener() { if (cronId) { clearInterval(cronId); cronId = null; } }
  function cronIniciar(segundos, elId, onFin) {
    cronDetener();
    let restante = segundos;
    const el = document.getElementById(elId);
    pintar();
    cronId = setInterval(() => {
      restante--;
      pintar();
      if (restante <= 0) { cronDetener(); if (onFin) onFin(); }
    }, 1000);
    function pintar() {
      if (!el) return;
      const m = Math.floor(restante / 60), s = restante % 60;
      el.textContent = "⏱️ " + (m > 0 ? m + ":" + String(s).padStart(2, "0") : restante + "s");
      el.classList.toggle("urgente", restante <= 5);
    }
  }

  /* ---------- Navegación entre pantallas ---------- */
  function mostrarPantalla(id) {
    document.querySelectorAll(".pantalla").forEach((p) => p.classList.remove("activa"));
    document.getElementById(id).classList.add("activa");
    // El botón "Volver" se oculta solo en el menú principal
    const volver = document.getElementById("btn-volver-global");
    if (volver) volver.classList.toggle("oculto", id === "pantalla-menu");
  }

  function enJuego(id) {
    const caja = document.getElementById(id);
    return caja && !caja.classList.contains("oculto");
  }

  const PANTALLAS_MODO = {
    "pantalla-ortografia": true, "pantalla-secuencias": true, "pantalla-copia": true,
    "pantalla-mapas": true
  };

  function volverAtras() {
    const activa = document.querySelector(".pantalla.activa");
    if (!activa || activa.id === "pantalla-menu") return;
    // Si hay un ejercicio abierto, vuelve a la lista de categorías de ese modo
    if (activa.id === "pantalla-ortografia" && enJuego("ortografia-juego")) { Ortografia.volverSelector(); return; }
    if (activa.id === "pantalla-secuencias" && enJuego("secuencias-juego")) { Secuencias.volverSelector(); return; }
    if (activa.id === "pantalla-copia" && enJuego("copia-juego")) { Copia.volverSelector(); return; }
    // Desde una actividad (ya en su selector) vuelve al submenú de su materia
    if (PANTALLAS_MODO[activa.id] && materiaActual) { irAMateria(materiaActual); return; }
    // Editor o submenú de materia: vuelve al menú principal
    mostrarPantalla("pantalla-menu");
  }

  /* ---------- Menú de materias y submenús ---------- */
  let materiaActual = null;

  function crearTarjeta(icono, titulo, desc, onClick) {
    const b = document.createElement("button");
    b.className = "tarjeta";
    b.innerHTML =
      '<span class="emoji-grande">' + icono + "</span>" +
      '<span class="titulo-tarjeta">' + titulo + "</span>" +
      '<span class="desc-tarjeta">' + desc + "</span>";
    b.onclick = onClick;
    return b;
  }

  function pintarMenu() {
    const cont = document.getElementById("tarjetas-menu");
    cont.innerHTML = "";
    DATOS.materias.forEach((m) => {
      cont.appendChild(crearTarjeta(m.icono, m.nombre, m.desc, () => irAMateria(m.id)));
    });
    // Zona de adultos (pide clave dentro de irAModo)
    cont.appendChild(crearTarjeta("⚙️", "Crear y Configurar", "Para mamá, papá o profe", () => irAModo("editor")));
  }

  function irAMateria(id) {
    const m = DATOS.materias.find((x) => x.id === id);
    if (!m) return;
    materiaActual = id;
    document.getElementById("materia-titulo").textContent = m.icono + " " + m.nombre;
    const cont = document.getElementById("materia-actividades");
    const sub = document.getElementById("materia-sub");
    cont.innerHTML = "";
    if (!m.actividades.length) {
      sub.textContent = m.proximamente || "¡Muy pronto habrá actividades aquí!";
    } else {
      sub.textContent = "Elige una actividad";
      m.actividades.forEach((a) => {
        cont.appendChild(crearTarjeta(a.icono, a.nombre, a.desc, () => irAModo(a.modo)));
      });
    }
    mostrarPantalla("pantalla-materia");
  }

  const CLAVE_EDITOR = "24861793";
  let editorDesbloqueado = false;

  function irAModo(modo) {
    const mapa = {
      ortografia: "pantalla-ortografia",
      secuencias: "pantalla-secuencias",
      copia: "pantalla-copia",
      mapas: "pantalla-mapas",
      editor: "pantalla-editor"
    };
    // "Crear y Configurar" pide clave (zona de adultos)
    if (modo === "editor" && !editorDesbloqueado) {
      const intento = window.prompt("🔒 Esta sección es para adultos.\nEscribe la clave para entrar:");
      if (intento === null) return;            // canceló
      if (intento.trim() !== CLAVE_EDITOR) {
        window.alert("Clave incorrecta. 🙈");
        return;
      }
      editorDesbloqueado = true;               // recordar durante la sesión
    }
    // Recuerda a qué materia pertenece esta actividad (para el botón Volver)
    const mat = DATOS.materias.find((x) => x.actividades.some((a) => a.modo === modo));
    if (mat) materiaActual = mat.id;
    // Asegura mostrar el selector y no un juego a medias
    if (modo === "ortografia") Ortografia.volverSelector();
    if (modo === "secuencias") Secuencias.volverSelector();
    if (modo === "copia") Copia.volverSelector();
    if (modo === "mapas" && window.Mapas) Mapas.mostrar();
    mostrarPantalla(mapa[modo]);
  }

  /* ---------- Arranque ---------- */
  function iniciar() {
    const guardado = cargar("estado", null);
    if (guardado) Object.assign(estado, guardado);
    estado.racha = 0; // la racha no se conserva entre sesiones
    refrescarMarcador();

    if (window.ESCENA) ESCENA.iniciar();
    if (window.Luna) Luna.init();
    aplicarIdentidad();

    // Menú principal de materias (tarjetas dinámicas)
    pintarMenu();
    document.getElementById("btn-inicio").onclick = () => mostrarPantalla("pantalla-menu");
    document.getElementById("btn-sonido").onclick = function () {
      sonidoActivo = !sonidoActivo;
      this.textContent = sonidoActivo ? "🔊" : "🔇";
      if (sonidoActivo) tono(700, 0.1);
    };

    // Botón "Volver" global (en la barra de arriba)
    document.getElementById("btn-volver-global").onclick = volverAtras;

    // Reiniciar progreso (zona de adultos)
    document.getElementById("btn-reset-stats").onclick = reiniciarProgreso;

    // Botones de cada módulo
    document.getElementById("sec-enviar").onclick = () => Secuencias.comprobar();
    document.getElementById("sec-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") Secuencias.comprobar();
    });
    document.getElementById("sec-pista-btn").onclick = () => Secuencias.verPista();
    document.getElementById("copia-comprobar").onclick = () => Copia.comprobar();

    // Iniciar módulos
    Ortografia.init();
    Secuencias.init();
    Copia.init();
    Editor.init();
    if (window.Mapas) Mapas.init();
  }

  function aplicarIdentidad() {
    const n = jugador();
    const t = document.getElementById("titulo-juego");
    const s = document.getElementById("subtitulo");
    if (t) t.textContent = "La Aventura de " + n;
    if (s) s.textContent = "¡Hola, " + n + "! Elige una materia para empezar 🇪🇨";
    document.title = "La Aventura de " + n + " 🚀";
    if (window.Luna && Luna.aplicarConfig) Luna.aplicarConfig();
  }

  return {
    iniciar, guardar, cargar, azar, azarEl, mezclar, frasePositiva, construirSecuencia,
    acierto, error, granPremio, sumarEstrellas,
    config, cronIniciar, cronDetener, jugador, avatarNombre, genero, aplicarIdentidad
  };
})();

window.addEventListener("DOMContentLoaded", Juego.iniciar);
