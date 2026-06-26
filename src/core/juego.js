/* ============================================================
   NÚCLEO — src/core/juego.js  (global: window.Juego)
   API compartida por todas las páginas/módulos: persistencia,
   utilidades, puntaje, sonido, temporizador, identidad/mascota.
   La NAVEGACIÓN ahora es multipágina (ver src/core/menu.js y la
   barra superior); aquí solo está `iniciarBase()` que arranca lo
   común de cada página.
   ============================================================ */
const Juego = (function () {
  let sonidoActivo = true;
  let audioCtx = null;
  const estado = { estrellas: 0, racha: 0, nivel: 1 };

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
  /* ---------- Perfiles (cada niño tiene el suyo) ----------
     Un perfil = { id, nombre, avatar, genero, nivel }. La lista vive en
     "perfiles" y el activo en "perfil_activo". La identidad y el nivel de
     dificultad se leen SIEMPRE del perfil activo (con fallback a las claves
     viejas/NINO para no romper el doble-clic en páginas sueltas).            */
  const NIVELES = ["basico", "intermedio", "avanzado"];
  function perfiles() { return cargar("perfiles", []); }
  function perfilActivoId() { return cargar("perfil_activo", null); }
  function perfilActivo() {
    const id = perfilActivoId();
    return perfiles().find((p) => p.id === id) || null;
  }
  function crearPerfil(datos) {
    datos = datos || {};
    const lista = perfiles();
    const p = {
      id: "p" + Date.now() + "_" + Math.floor(Math.random() * 1e6),
      nombre: (datos.nombre || "").trim() || (window.NINO || "Nelson"),
      avatar: (datos.avatar || "").trim() || "Luna",
      genero: datos.genero === "nino" ? "nino" : "nina",
      nivel: NIVELES.indexOf(datos.nivel) >= 0 ? datos.nivel : "basico"
    };
    lista.push(p);
    guardar("perfiles", lista);
    return p;
  }
  function actualizarPerfil(id, campos) {
    const lista = perfiles();
    const p = lista.find((x) => x.id === id);
    if (!p) return null;
    Object.assign(p, campos);
    guardar("perfiles", lista);
    if (id === perfilActivoId()) aplicarIdentidad();
    return p;
  }
  function borrarPerfil(id) {
    guardar("perfiles", perfiles().filter((p) => p.id !== id));
    guardar("estado__" + id, null);
    if (perfilActivoId() === id) guardar("perfil_activo", null);
  }
  function seleccionarPerfil(id) {
    guardar("perfil_activo", id);
    cargarEstadoPerfil();
    aplicarIdentidad();
  }

  /* ---------- Identidad (derivada del perfil activo) ---------- */
  function jugador() { const p = perfilActivo(); return (p && p.nombre) || cargar("jugador", (window.NINO || "Nelson")); }
  function avatarNombre() { const p = perfilActivo(); return (p && p.avatar) || cargar("avatar", "Luna"); }
  function genero() { const p = perfilActivo(); return (p && p.genero) || cargar("genero", "nina"); }

  /* ---------- Nivel de dificultad (propiedad del perfil) ---------- */
  function nivel() { const p = perfilActivo(); return (p && p.nivel) || "basico"; }
  function nivelIdx() { const i = NIVELES.indexOf(nivel()); return i < 0 ? 0 : i; }
  // Devuelve el valor de `tres` que corresponde al nivel actual (basico/intermedio/avanzado).
  function porNivel(tres) { return tres[nivelIdx()]; }

  /* ---------- Leaderboard (por juego y por perfil) ----------
     Cada juego registra sus rondas en "lb_<juego>__<perfilId>". Se guardan
     las 5 mejores ordenadas por aciertos (desc) y, a igualdad, por tiempo (asc).
     `juego` es el prefijo/identificador del modo (p.ej. "arit", "tablas").     */
  function escHTML(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function claveLb(juego) { return "lb_" + juego + "__" + (perfilActivoId() || "default"); }
  function registrarResultado(juego, datos) {
    if (!juego) return [];
    datos = datos || {};
    const reg = { aciertos: datos.aciertos || 0, total: datos.total || 0, ms: datos.ms || 0, fecha: Date.now() };
    const lista = cargar(claveLb(juego), []);
    lista.push(reg);
    lista.sort((a, b) => (b.aciertos - a.aciertos) || (a.ms - b.ms));
    const top = lista.slice(0, 5);
    guardar(claveLb(juego), top);
    return top;
  }
  function mejores(juego, n) { return cargar(claveLb(juego), []).slice(0, n || 5); }
  function fmtTiempo(ms) {
    const s = Math.max(0, Math.round((ms || 0) / 1000));
    const m = Math.floor(s / 60);
    return m > 0 ? m + ":" + String(s % 60).padStart(2, "0") : s + "s";
  }
  // Devuelve el HTML de la tabla "🏆 Mejores" del juego (o "" si aún no hay rondas).
  function tablaMejoresHTML(juego, n) {
    const lista = mejores(juego, n || 3);
    if (!lista.length) return "";
    const filas = lista.map((r, i) => {
      const pos = ["🥇", "🥈", "🥉"][i] || (i + 1) + ".";
      return '<li><span class="lb-pos">' + pos + "</span>" +
        '<span class="lb-ac">' + r.aciertos + "/" + r.total + " ⭐</span>" +
        '<span class="lb-t">⏱️ ' + fmtTiempo(r.ms) + "</span></li>";
    }).join("");
    return '<div class="leaderboard"><h3>🏆 Mejores de ' + escHTML(jugador()) + "</h3>" +
      '<ol class="lb-lista">' + filas + "</ol></div>";
  }

  function frasePositiva() {
    const n = jugador();
    const arr = [
      "¡Muy bien, " + n + "! 🎉", "¡Correcto! 👏", "¡Excelente, " + n + "! 🌟",
      "¡Lo lograste! 🚀", "¡Genial! 😄", "¡Perfecto! ✨", "¡Eres un crack, " + n + "! 💪",
      "¡Así se hace! 🏅", "¡Súper, " + n + "! 🤩"
    ];
    return arr[azar(0, arr.length - 1)];
  }

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

  /* ---------- Sonido (WebAudio) ---------- */
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
  function sonidoFiesta() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tono(f, 0.18), i * 110)); }

  /* ---------- Puntaje ---------- */
  function refrescarMarcador() {
    const e = document.getElementById("puntaje-estrellas");
    const r = document.getElementById("puntaje-racha");
    const n = document.getElementById("puntaje-nivel");
    if (e) e.textContent = estado.estrellas;
    if (r) r.textContent = estado.racha;
    if (n) n.textContent = estado.nivel;
  }
  function claveEstado() { return "estado__" + (perfilActivoId() || "default"); }
  function cargarEstadoPerfil() {
    const g = cargar(claveEstado(), null);
    estado.estrellas = (g && g.estrellas) || 0;
    estado.racha = 0; // la racha no se conserva entre páginas/perfiles
    estado.nivel = (g && g.nivel) || 1;
    refrescarMarcador();
  }
  function sumarEstrellas(n) {
    estado.estrellas += n;
    estado.nivel = 1 + Math.floor(estado.estrellas / 15);
    guardar(claveEstado(), estado);
    refrescarMarcador();
  }
  function acierto() {
    estado.racha++;
    sumarEstrellas(1 + (estado.racha >= 3 ? 1 : 0));
    sonidoAcierto();
    if (window.ESCENA && ESCENA.mascotaFeliz) ESCENA.mascotaFeliz();
    reaccionMascota("feliz");
  }
  function error() {
    estado.racha = 0;
    guardar(claveEstado(), estado);
    refrescarMarcador();
    sonidoError();
    if (window.ESCENA && ESCENA.mascotaTriste) ESCENA.mascotaTriste();
    reaccionMascota("triste");
  }
  function granPremio() {
    sonidoFiesta();
    if (window.ESCENA) { ESCENA.celebrar(); if (ESCENA.mascotaFeliz) ESCENA.mascotaFeliz(); }
    reaccionMascota("fiesta");
    confetiHTML();
  }
  function reaccionMascota(tipo) { if (window.Luna && Luna.reaccion) Luna.reaccion(tipo); }
  // La pista/tip la "sugiere" la mascota en su globo (no como banner sobre el ejercicio).
  function tip(texto) { if (window.Luna && Luna.tip) Luna.tip(texto); }

  function reiniciarProgreso() {
    if (!window.confirm("¿Seguro que quieres reiniciar a CERO las estrellas, la racha y el nivel de " + jugador() + "?")) return;
    estado.estrellas = 0; estado.racha = 0; estado.nivel = 1;
    guardar(claveEstado(), estado);
    refrescarMarcador();
    reaccionMascota("feliz");
  }

  function confetiHTML() {
    const cont = document.getElementById("celebracion");
    if (!cont) return;
    const colores = ["#ffc934", "#25c281", "#8a5cf6", "#ef5ba1", "#2e6cf6"];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement("div");
      c.className = "confeti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colores[azar(0, colores.length - 1)];
      c.style.animationDuration = 1.5 + Math.random() * 1.5 + "s";
      c.style.transform = "rotate(" + azar(0, 360) + "deg)";
      cont.appendChild(c);
      setTimeout(() => c.remove(), 3200);
    }
  }

  /* ---------- Configuración (temporizador) ---------- */
  function config() {
    const c = cargar("config", {});
    return {
      timerOn: c.timerOn !== undefined ? c.timerOn : true,
      timerSeg: c.timerSeg || 30,
      copiaOn: c.copiaOn !== undefined ? c.copiaOn : true,
      copiaSeg: (c.copiaMin || 5) * 60
    };
  }

  /* ---------- Cronómetro visible ---------- */
  let cronId = null;
  function cronDetener() { if (cronId) { clearInterval(cronId); cronId = null; } }
  function cronIniciar(segundos, elId, onFin) {
    cronDetener();
    let restante = segundos;
    const el = document.getElementById(elId);
    pintar();
    cronId = setInterval(() => {
      restante--; pintar();
      if (restante <= 0) { cronDetener(); if (onFin) onFin(); }
    }, 1000);
    function pintar() {
      if (!el) return;
      const m = Math.floor(restante / 60), s = restante % 60;
      el.textContent = "⏱️ " + (m > 0 ? m + ":" + String(s).padStart(2, "0") : restante + "s");
      el.classList.toggle("urgente", restante <= 5);
    }
  }

  /* ---------- Identidad / mascota ---------- */
  function aplicarIdentidad() {
    const n = jugador();
    const t = document.getElementById("titulo-juego");
    const s = document.getElementById("subtitulo");
    if (t) t.textContent = "La Aventura de " + n;
    if (s) s.textContent = "¡Hola, " + n + "! Elige una materia para empezar 🇪🇨";
    document.title = "La Aventura de " + n + " 🚀";
    if (window.Luna && Luna.aplicarConfig) Luna.aplicarConfig();
  }

  /* ---------- Arranque común de cada página ---------- */
  function iniciarBase() {
    cargarEstadoPerfil();

    if (window.ESCENA) ESCENA.iniciar();
    if (window.Luna) Luna.init();
    aplicarIdentidad();

    const inicio = window.RUTA_INICIO || "index.html";
    const bi = document.getElementById("btn-inicio");
    if (bi) bi.onclick = () => { location.href = inicio; };

    const bv = document.getElementById("btn-volver-global");
    if (bv) {
      if (window.ES_MENU) bv.classList.add("oculto");
      else {
        bv.classList.remove("oculto");
        bv.onclick = () => {
          if (typeof window.MODO_VOLVER === "function") window.MODO_VOLVER();
          else location.href = inicio;
        };
      }
    }

    const bs = document.getElementById("btn-sonido");
    if (bs) bs.onclick = function () {
      sonidoActivo = !sonidoActivo;
      this.textContent = sonidoActivo ? "🔊" : "🔇";
      if (sonidoActivo) tono(700, 0.1);
    };

    const br = document.getElementById("btn-reset-stats");
    if (br) br.onclick = reiniciarProgreso;
  }

  return {
    iniciarBase, guardar, cargar, azar, azarEl, mezclar, frasePositiva, construirSecuencia,
    acierto, error, granPremio, sumarEstrellas, reiniciarProgreso,
    config, cronIniciar, cronDetener, jugador, avatarNombre, genero, aplicarIdentidad, tip,
    perfiles, perfilActivo, perfilActivoId, crearPerfil, seleccionarPerfil, actualizarPerfil, borrarPerfil,
    nivel, nivelIdx, porNivel,
    registrarResultado, mejores, fmtTiempo, tablaMejoresHTML
  };
})();
window.Juego = Juego;
