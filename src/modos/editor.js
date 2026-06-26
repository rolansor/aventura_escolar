/* ============================================================
   AJUSTES (para adultos) — src/modos/editor.js
   Ajustes GENERALES del juego: temporizador y reinicio de progreso.
   - La identidad (nombre/avatar/género) y el nivel viven en cada PERFIL
     (ver src/core/perfiles.js y src/core/juego.js).
   - El CONTENIDO (palabras, secuencias, párrafos) vive en el Banco de
     contenido (ver src/modos/banco.js).
   El botón de reinicio de progreso (#btn-reset-stats) lo cablea Juego.iniciarBase().
   ============================================================ */

const Editor = (function () {
  function init() {
    cargarConfigTimer();
    document.getElementById("cfg-timer-guardar").onclick = guardarConfigTimer;
  }

  /* ---------- Temporizador ---------- */
  function cargarConfigTimer() {
    const c = Juego.cargar("config", {});
    document.getElementById("cfg-timer-on").checked = c.timerOn !== undefined ? c.timerOn : true;
    document.getElementById("cfg-timer-seg").value = c.timerSeg || 30;
    document.getElementById("cfg-copia-on").checked = c.copiaOn !== undefined ? c.copiaOn : true;
    document.getElementById("cfg-copia-min").value = c.copiaMin || 5;
  }
  function guardarConfigTimer() {
    Juego.guardar("config", {
      timerOn: document.getElementById("cfg-timer-on").checked,
      timerSeg: Math.max(5, Math.min(180, Number(document.getElementById("cfg-timer-seg").value) || 30)),
      copiaOn: document.getElementById("cfg-copia-on").checked,
      copiaMin: Math.max(1, Math.min(30, Number(document.getElementById("cfg-copia-min").value) || 5))
    });
    alert("¡Temporizador guardado! ⏱️");
  }

  return { init };
})();
