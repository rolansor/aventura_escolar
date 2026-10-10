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
          ctrl.azar/azarEl/mezclar (atajos de Juego),
          ctrl.alSalir(fn) -> registra una limpieza que se ejecuta al cambiar de
                              ronda o salir (quitar un listener de teclado…).
          ctrl.alTerminar(fn) -> limpieza al acabar/salir del TEMA (no entre rondas):
                              para lo que se reutiliza de ronda en ronda, como un
                              modelo 3D. Se guarda en ctrl.memo (se vacía por tema).

   MARCADOR: una ronda cuenta como acierto solo si salió A LA PRIMERA (sin ningún
   reintento). Si el niño se equivoca y luego acierta, igual gana su estrella, pero
   el marcador de "X de N" dice la verdad y deja algo que mejorar la próxima vez.

   No usa temporizador: estas actividades son autocorrectivas y sin prisa
   (Montessori). El reloj queda para los repasos de opción múltiple (mc.js).
   ============================================================ */
window.Actividad = function (px, temas, opts) {
  opts = opts || {};
  const $ = (s) => document.getElementById(px + "-" + s);
  let actual = null, total = 8, i = 0, ac = 0, t = null, tInicio = 0;
  let ganada = false, limpia = true;      // limpia = sin errores en la ronda en curso
  let limpiezas = [], limpiezasTema = [];

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
    Juego.pintarMejores(c, px); // 🏆 leaderboard de esta actividad bajo los temas
  }

  // limpiar() entre rondas; limpiar(true) al empezar, terminar o salir de un tema.
  function limpiar(todo) {
    limpiezas.splice(0).forEach((fn) => { try { fn(); } catch (e) {} });
    if (todo) {
      limpiezasTema.splice(0).forEach((fn) => { try { fn(); } catch (e) {} });
      ctrl.memo = {};
    }
  }

  function empezar(tm) {
    limpiar(true);
    actual = tm; ac = 0; i = 0; tInicio = Date.now();
    total = tm.total || opts.total || 8;
    $("selector").classList.add("oculto");
    const caja = $("juego");
    caja.classList.remove("oculto");
    caja.classList.add("modo-actividad");
    Juego.quitarBotonesFin($("retro"));
    if ($("opciones")) $("opciones").classList.add("oculto");
    if ($("tema")) $("tema").textContent = "";
    if ($("timer")) $("timer").classList.add("oculto");
    Juego.cronDetener();
    ronda();
  }

  function ronda() {
    ganada = false; limpia = true;
    limpiar();
    $("progreso").style.width = (i / total * 100) + "%";
    const host = $("extra");
    host.innerHTML = ""; host.className = "mc-extra zona-activa";
    const r = $("retro"); r.textContent = ""; r.className = "retro";
    try { actual.ronda(host, ctrl); }
    catch (e) {
      // Una ronda rota no debe trabar el juego, pero tampoco pasar en silencio.
      if (window.console) console.error("Falló una ronda de «" + px + "» (" + actual.nombre + "):", e);
      avanzar(300);
    }
  }

  const ctrl = {
    azar: Juego.azar, azarEl: Juego.azarEl, mezclar: Juego.mezclar,
    jugador: () => Juego.jugador(),
    pregunta(html) { $("pregunta").innerHTML = html; },
    retro(txt, tipo) { const r = $("retro"); r.innerHTML = txt; r.className = "retro" + (tipo ? " " + tipo : ""); },
    memo: {},
    alSalir(fn) { if (typeof fn === "function") limpiezas.push(fn); },
    alTerminar(fn) { if (typeof fn === "function") limpiezasTema.push(fn); },
    ganar(ms) {
      if (ganada) return; ganada = true;
      if (limpia) ac++;
      Juego.acierto();
      const r = $("retro"); r.innerHTML = Juego.frasePositiva(); r.className = "retro bien";
      avanzar(ms == null ? 1100 : ms);
    },
    fallar(msg, ms) {
      if (ganada) return; ganada = true; limpia = false;
      Juego.error();
      const r = $("retro"); r.innerHTML = msg || "¡Casi! Sigamos. 👇"; r.className = "retro mal";
      avanzar(ms == null ? 1800 : ms);
    },
    reintento(msg) {
      if (ganada) return;
      limpia = false;
      Juego.error();
      const r = $("retro"); r.innerHTML = msg || "Inténtalo otra vez 👇"; r.className = "retro mal";
    }
  };

  function avanzar(ms) {
    if (t) clearTimeout(t);
    t = setTimeout(() => { t = null; i++; if (i >= total) terminar(); else ronda(); }, ms);
  }

  function terminar() {
    limpiar(true);
    Juego.cronDetener();
    Juego.registrarResultado(px, { aciertos: ac, total: total, ms: Date.now() - tInicio });
    $("progreso").style.width = "100%";
    $("extra").innerHTML = Juego.tablaMejoresHTML(px);
    $("pregunta").textContent = "¡Terminaste, " + Juego.jugador() + "!";
    const r = $("retro");
    r.textContent = ac === total
      ? "¡Perfecto! " + total + " de " + total + " a la primera 🏆"
      : "Te salieron " + ac + " de " + total + " a la primera ⭐";
    r.className = "retro bien";
    if (ac >= total - 1) Juego.granPremio();
    // El resumen se queda hasta que el niño decida (antes se iba solo a los 2,6 s).
    Juego.botonesFin(r, () => empezar(actual), volverSelector);
  }

  function volverSelector() {
    if (t) { clearTimeout(t); t = null; }
    limpiar(true);
    Juego.cronDetener();
    Juego.quitarBotonesFin($("retro"));
    $("juego").classList.add("oculto");
    $("selector").classList.remove("oculto");
    if ($("opciones")) $("opciones").classList.remove("oculto");
    pintar();   // refresca el 🏆 con la ronda recién jugada
  }

  return { init, volverSelector };
};
