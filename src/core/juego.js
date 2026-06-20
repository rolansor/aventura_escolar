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
  function jugador() { return cargar("jugador", (window.NINO || "Nelson")); }
  function avatarNombre() { return cargar("avatar", "Luna"); }
  function genero() { return cargar("genero", "nina"); }

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
  function sumarEstrellas(n) {
    estado.estrellas += n;
    estado.nivel = 1 + Math.floor(estado.estrellas / 15);
    guardar("estado", estado);
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
    guardar("estado", estado);
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
    guardar("estado", estado);
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
    const guardado = cargar("estado", null);
    if (guardado) Object.assign(estado, guardado);
    estado.racha = 0; // la racha no se conserva entre páginas
    refrescarMarcador();

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
    config, cronIniciar, cronDetener, jugador, avatarNombre, genero, aplicarIdentidad, tip
  };
})();
window.Juego = Juego;
