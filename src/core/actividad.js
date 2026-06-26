/* ============================================================
   MOTOR DE ACTIVIDADES MANIPULATIVAS — src/core/actividad.js
   Hermano de mc.js, pero para actividades donde el niño MANIPULA
   (arrastra, toca, construye) en vez de elegir una opción.
   Reutiliza la misma estructura de página por PREFIJO:
   <px>-selector, <px>-juego, <px>-progreso, <px>-pregunta,
   <px>-extra (el "escenario" donde se manipula) y <px>-retro.
   (Oculta <px>-opciones/<px>-tema/<px>-timer que usa el motor MC.)

   Uso:  window.MiModo = Actividad("px", [ { icono, nombre, desc,
            total?,            // rondas de este tema (por defecto opts.total || 8)
            ronda: (host, ctrl) => { ...arma la interacción... } }, ... ], opts?);

   En cada ronda, el tema rellena `host` con su escenario y, cuando el
   niño resuelve, llama una de:
     ctrl.ganar()      -> acierto + frase + avanza solo
     ctrl.fallar(msg)  -> error + revela y avanza (se acabó la ronda)
     ctrl.reintento(m) -> error + se queda (control del error: que vuelva a probar)
   Otros: ctrl.pregunta(html), ctrl.retro(txt,tipo), ctrl.jugador(),
          ctrl.azar/azarEl/mezclar (atajos de Juego).

   No usa temporizador: estas actividades son autocorrectivas y sin prisa
   (Montessori). El reloj queda para los repasos de opción múltiple (mc.js).
   ============================================================ */
window.Actividad = function (px, temas, opts) {
  opts = opts || {};
  const $ = (s) => document.getElementById(px + "-" + s);
  let actual = null, total = 8, i = 0, ac = 0, t = null, ganada = false, tInicio = 0;

  function init() { pintar(); }

  function pintar() {
    const c = $("selector"); if (!c) return; c.innerHTML = "";
    temas.forEach((tm) => {
      const b = document.createElement("button");
      b.className = "chip-categoria";
      b.innerHTML = tm.icono + " " + tm.nombre + (tm.desc ? "<small>" + tm.desc + "</small>" : "");
      b.onclick = () => empezar(tm);
      c.appendChild(b);
    });
  }

  function empezar(tm) {
    actual = tm; ac = 0; i = 0; tInicio = Date.now();
    total = tm.total || opts.total || 8;
    $("selector").classList.add("oculto");
    $("juego").classList.remove("oculto");
    if ($("opciones")) $("opciones").classList.add("oculto");
    if ($("tema")) $("tema").textContent = "";
    if ($("timer")) $("timer").classList.add("oculto");
    Juego.cronDetener();
    ronda();
  }

  function ronda() {
    ganada = false;
    $("progreso").style.width = (i / total * 100) + "%";
    const host = $("extra");
    host.innerHTML = ""; host.className = "mc-extra zona-activa";
    const r = $("retro"); r.textContent = ""; r.className = "retro";
    try { actual.ronda(host, ctrl); }
    catch (e) { /* si una ronda falla, no romper el juego: avanzar */ avanzar(300); }
  }

  const ctrl = {
    azar: Juego.azar, azarEl: Juego.azarEl, mezclar: Juego.mezclar,
    jugador: () => Juego.jugador(),
    pregunta(html) { $("pregunta").innerHTML = html; },
    retro(txt, tipo) { const r = $("retro"); r.innerHTML = txt; r.className = "retro" + (tipo ? " " + tipo : ""); },
    ganar(ms) {
      if (ganada) return; ganada = true; ac++;
      Juego.acierto();
      const r = $("retro"); r.innerHTML = Juego.frasePositiva(); r.className = "retro bien";
      avanzar(ms == null ? 1100 : ms);
    },
    fallar(msg, ms) {
      if (ganada) return; ganada = true;
      Juego.error();
      const r = $("retro"); r.innerHTML = msg || "¡Casi! Sigamos. 👇"; r.className = "retro mal";
      avanzar(ms == null ? 1800 : ms);
    },
    reintento(msg) {
      Juego.error();
      const r = $("retro"); r.innerHTML = msg || "Inténtalo otra vez 👇"; r.className = "retro mal";
    }
  };

  function avanzar(ms) {
    if (t) clearTimeout(t);
    t = setTimeout(() => { i++; if (i >= total) terminar(); else ronda(); }, ms);
  }

  function terminar() {
    Juego.cronDetener();
    Juego.registrarResultado(px, { aciertos: ac, total: total, ms: Date.now() - tInicio });
    $("progreso").style.width = "100%";
    $("extra").innerHTML = Juego.tablaMejoresHTML(px);
    $("pregunta").textContent = "¡Terminaste, " + Juego.jugador() + "! " + ac + " de " + total + " ⭐";
    const r = $("retro");
    r.textContent = ac === total ? "¡Perfecto! 🏆" : "¡Muy bien! Toca otra ronda para seguir.";
    r.className = "retro bien";
    if (ac >= total - 1) Juego.granPremio();
    t = setTimeout(volverSelector, 2600);
  }

  function volverSelector() {
    if (t) { clearTimeout(t); t = null; }
    Juego.cronDetener();
    $("juego").classList.add("oculto");
    $("selector").classList.remove("oculto");
    if ($("opciones")) $("opciones").classList.remove("oculto");
  }

  return { init, volverSelector };
};
