/* Fracciones — Matemáticas (motor manipulativo)
   "Pinta la fracción": el niño TOCA las partes de una pizza o una barra
   hasta pintar las que pide la fracción. Lo abstracto (n/d) se construye
   con una acción concreta sobre partes iguales. */
(function () {

  function pizza(d) {
    const cx = 100, cy = 100, r = 82; let s = "";
    for (let i = 0; i < d; i++) {
      const a0 = (i * 360 / d - 90) * Math.PI / 180, a1 = ((i + 1) * 360 / d - 90) * Math.PI / 180;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const large = (360 / d > 180) ? 1 : 0;
      s += '<path class="porcion" d="M' + cx + " " + cy + " L" + x0.toFixed(1) + " " + y0.toFixed(1) +
        " A" + r + " " + r + " 0 " + large + " 1 " + x1.toFixed(1) + " " + y1.toFixed(1) + ' Z"/>';
    }
    return '<svg viewBox="0 0 200 200" class="frac-set">' + s + "</svg>";
  }
  function barra(d) {
    const W = 280, H = 64, w = W / d; let s = "";
    for (let i = 0; i < d; i++) s += '<rect class="porcion" x="' + (i * w).toFixed(1) + '" y="0" width="' +
      w.toFixed(1) + '" height="' + H + '"/>';
    return '<svg viewBox="0 0 ' + W + " " + H + '" class="frac-set frac-barra">' + s + "</svg>";
  }

  function jugar(forma) {
    return function (host, ctrl) {
      const d = ctrl.azar(2, 8), n = ctrl.azar(1, d - 1);
      ctrl.pregunta("🍕 Pinta <b>" + n + "/" + d + "</b> de la figura (toca las partes) 👆");
      host.innerHTML = '<div class="frac-zona">' + (forma === "pizza" ? pizza(d) : barra(d)) + "</div>" +
        '<div class="frac-cuenta">0 / ' + n + " pintadas</div>";
      const cuenta = host.querySelector(".frac-cuenta");
      let listo = false;
      const pintadas = () => host.querySelectorAll(".porcion.pintada").length;
      host.querySelectorAll(".porcion").forEach((p) => {
        p.addEventListener("click", () => {
          if (listo) return;
          p.classList.toggle("pintada");
          const c = pintadas();
          cuenta.textContent = c + " / " + n + " pintadas";
          if (c === n) { listo = true; ctrl.ganar(); }
          else if (c > n) ctrl.retro("Pintaste de más, quita una 👆", "mal");
        });
      });
    };
  }

  window.Fracciones = Actividad("frac", [
    { icono: "🍕", nombre: "Pinta la pizza", desc: "toca las porciones", ronda: jugar("pizza") },
    { icono: "🍫", nombre: "Pinta la barra", desc: "toca los pedazos", ronda: jugar("barra") }
  ]);
})();
