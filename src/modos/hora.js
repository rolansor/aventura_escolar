/* La hora — Matemáticas (motor manipulativo)
   Reloj con manecillas que el niño ARRASTRA para poner la hora pedida.
   La manecilla corta (hora) y la larga (minutos) giran y se ajustan a
   las marcas; cuando ambas coinciden con la hora pedida, ¡listo!
   Usa eventos de puntero (mouse + dedo). */
(function () {
  const C = 100;

  function relojSVG() {
    let nums = "", tics = "";
    for (let n = 1; n <= 12; n++) {
      const a = n * 30 * Math.PI / 180;
      const x = C + 72 * Math.sin(a), y = C - 72 * Math.cos(a);
      nums += '<text x="' + x.toFixed(1) + '" y="' + (y + 7).toFixed(1) + '" class="reloj-num">' + n + "</text>";
    }
    for (let n = 0; n < 60; n++) {
      const a = n * 6 * Math.PI / 180, esHora = n % 5 === 0;
      const r1 = esHora ? 83 : 88, r2 = 92;
      tics += '<line x1="' + (C + r1 * Math.sin(a)).toFixed(1) + '" y1="' + (C - r1 * Math.cos(a)).toFixed(1) +
        '" x2="' + (C + r2 * Math.sin(a)).toFixed(1) + '" y2="' + (C - r2 * Math.cos(a)).toFixed(1) +
        '" stroke="' + (esHora ? "#2e6cf6" : "#cdd6ea") + '" stroke-width="' + (esHora ? 3 : 1.5) + '"/>';
    }
    return '<svg viewBox="0 0 200 200" class="reloj-set">' +
      '<circle cx="100" cy="100" r="97" fill="#fff" stroke="#2e6cf6" stroke-width="4"/>' +
      tics + nums +
      '<g class="mano mano-h" data-mano="h" transform="rotate(0 100 100)">' +
        '<line x1="100" y1="100" x2="100" y2="60" stroke="#1d2440" stroke-width="9" stroke-linecap="round"/>' +
        '<circle cx="100" cy="58" r="12" class="mano-knob" fill="#1d2440"/></g>' +
      '<g class="mano mano-m" data-mano="m" transform="rotate(0 100 100)">' +
        '<line x1="100" y1="100" x2="100" y2="36" stroke="#2e6cf6" stroke-width="6" stroke-linecap="round"/>' +
        '<circle cx="100" cy="34" r="12" class="mano-knob" fill="#2e6cf6"/></g>' +
      '<circle cx="100" cy="100" r="6" fill="#1d2440"/>' +
      "</svg>";
  }

  function enPalabras(h, m) {
    if (m === 0) return "las " + h + " en punto";
    if (m === 15) return "las " + h + " y cuarto";
    if (m === 30) return "las " + h + " y media";
    if (m === 45) return "las " + ((h % 12) + 1) + " menos cuarto";
    return "las " + h + " y " + m;
  }

  function jugar(minutos) {
    return function (host, ctrl) {
      const h = ctrl.azar(1, 12), m = ctrl.azarEl(minutos);
      ctrl.pregunta("🕐 Pon el reloj en <b>" + h + ":" + (m < 10 ? "0" + m : m) + "</b> — " + enPalabras(h, m));
      host.innerHTML = '<div class="reloj-zona">' + relojSVG() + "</div>" +
        '<p class="reloj-ayuda">Arrastra la aguja <b>corta</b> (la hora) y la <b>larga</b> (los minutos) 🤏</p>';
      const svg = host.querySelector(".reloj-set");
      const manoH = svg.querySelector(".mano-h"), manoM = svg.querySelector(".mano-m");
      let angH = 0, angM = 0, listo = false;

      function aplica() {
        manoH.setAttribute("transform", "rotate(" + angH + " 100 100)");
        manoM.setAttribute("transform", "rotate(" + angM + " 100 100)");
      }
      function revisa() {
        const okH = ((angH / 30) % 12) === (h % 12);
        const okM = angM === m * 6;
        if (okH && okM && !listo) { listo = true; svg.classList.add("reloj-ok"); ctrl.ganar(); }
      }
      function arrastrar(mano, esHora) {
        mano.addEventListener("pointerdown", function (e) {
          if (listo) return; e.preventDefault();
          const rect = svg.getBoundingClientRect();
          const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
          try { mano.setPointerCapture(e.pointerId); } catch (_) {}
          mano.classList.add("agarrando");
          function mover(ev) {
            let ang = Math.atan2(ev.clientX - cx, -(ev.clientY - cy)) * 180 / Math.PI;
            if (ang < 0) ang += 360;
            ang = Math.round(ang / 30) * 30; if (ang >= 360) ang -= 360;
            if (esHora) angH = ang; else angM = ang;
            aplica();
          }
          function soltar() {
            mano.removeEventListener("pointermove", mover);
            mano.removeEventListener("pointerup", soltar);
            mano.removeEventListener("pointercancel", soltar);
            mano.classList.remove("agarrando");
            try { mano.releasePointerCapture(e.pointerId); } catch (_) {}
            revisa();
          }
          mano.addEventListener("pointermove", mover);
          mano.addEventListener("pointerup", soltar);
          mano.addEventListener("pointercancel", soltar);
        });
      }
      arrastrar(manoH, true); arrastrar(manoM, false);
    };
  }

  window.Hora = Actividad("hora", [
    { icono: "🕐", nombre: "En punto y media", desc: "horas y medias", ronda: jugar([0, 30]) },
    { icono: "🕓", nombre: "Los cuartos", desc: "y cuarto, menos cuarto", ronda: jugar([0, 15, 30, 45]) }
  ]);
})();
