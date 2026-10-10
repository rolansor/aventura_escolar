/* Fracciones — Matemáticas (motor manipulativo)
   "Pinta la fracción": el niño TOCA las partes de una pizza o de una barra
   de chocolate hasta pintar las que pide la fracción. Lo abstracto (n/d) se
   construye con una acción concreta sobre partes iguales.

   Con WebGL la pizza y la barra son modelos 3D (src/efectos/modelos/fraccion.js):
   la porción pintada recibe salsa, queso y pepperoni y se levanta. Sin WebGL se
   usan los dibujos SVG de siempre. Junto al material va la fracción escrita en
   grande (símbolo), para unir lo que se toca con cómo se escribe.
   El nivel del perfil decide en cuántas partes se divide (ver PARTES). */
(function () {
  const PARTES = [[2, 4], [2, 8], [3, 12]];       // denominadores por nivel: básico, intermedio, avanzado

  /* ---------- Dibujos SVG de respaldo ---------- */
  function pizza(d) {
    const cx = 100, cy = 100, r = 82; let s = "";
    for (let i = 0; i < d; i++) {
      const a0 = (i * 360 / d - 90) * Math.PI / 180, a1 = ((i + 1) * 360 / d - 90) * Math.PI / 180;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const large = (360 / d > 180) ? 1 : 0;
      s += '<path class="porcion" data-i="' + i + '" d="M' + cx + " " + cy + " L" + x0.toFixed(1) + " " + y0.toFixed(1) +
        " A" + r + " " + r + " 0 " + large + " 1 " + x1.toFixed(1) + " " + y1.toFixed(1) + ' Z"/>';
    }
    return '<svg viewBox="0 0 200 200" class="frac-set"><circle cx="100" cy="100" r="92" fill="#d9a55c"/>' + s + "</svg>";
  }
  function barra(d) {
    const W = 280, H = 64, w = W / d; let s = "";
    for (let i = 0; i < d; i++) s += '<rect class="porcion" data-i="' + i + '" x="' + (i * w).toFixed(1) + '" y="0" width="' +
      w.toFixed(1) + '" height="' + H + '" rx="5"/>';
    return '<svg viewBox="0 0 ' + W + " " + H + '" class="frac-set frac-barra">' + s + "</svg>";
  }

  function jugar(forma) {
    const esPizza = forma === "pizza";
    return function (host, ctrl) {
      const r = Juego.porNivel(PARTES);
      const d = ctrl.azar(r[0], r[1]), n = ctrl.azar(1, d - 1);
      ctrl.pregunta((esPizza ? "🍕" : "🍫") + " Pinta <b>" + n + "/" + d + "</b> de la " + (esPizza ? "pizza" : "barra") + " (toca las partes) 👆");
      host.innerHTML =
        '<div class="frac-zona">' +
          '<div class="frac-simbolo" title="' + n + " de " + d + ' partes iguales"><b>' + n + "</b><i>" + d + "</i></div>" +
          '<div class="frac-mesa"></div>' +
        "</div>" +
        '<div class="frac-cuenta"></div>';
      const mesa = host.querySelector(".frac-mesa"), cuenta = host.querySelector(".frac-cuenta");
      const pintadas = {};
      let listo = false;
      const cuantas = () => Object.keys(pintadas).length;
      function revisar() {
        const c = cuantas();
        cuenta.innerHTML = "Pintadas: <b>" + c + "</b> de las " + d + " partes · necesitas <b>" + n + "</b>";
        if (c === n) { listo = true; ctrl.ganar(1500); }
        else if (c > n) ctrl.retro("Pintaste de más: toca una para despintarla 👆", "mal");
        else ctrl.retro("", "");
      }
      // Toca una parte: se pinta; si ya lo estaba, se despinta. Devuelve si quedó pintada.
      function alternar(i) {
        if (pintadas[i]) delete pintadas[i]; else pintadas[i] = 1;
        return !!pintadas[i];
      }

      if (window.Modelo3D && Modelo3D.disponible("fraccion")) {
        const clave = "frac_" + forma;
        let m = ctrl.memo[clave];
        if (m) { mesa.appendChild(m.el); m.apagar(); m.modelo.dividir(d); }
        else {
          m = ctrl.memo[clave] = Modelo3D.crear(mesa, "fraccion", { forma: forma, d: d, pista: "Toca las partes para pintarlas" });
          ctrl.alTerminar(() => m.destruir());
        }
        m.alTocar = (id, cerca) => {
          if (listo) return;
          const parte = id || (cerca || [])[0];
          if (!parte) return;
          const i = parseInt(parte.slice(1), 10);
          m.modelo.marcar(i, alternar(i));
          revisar();
        };
      } else {
        mesa.innerHTML = esPizza ? pizza(d) : barra(d);
        mesa.querySelectorAll(".porcion").forEach((p) => {
          p.addEventListener("click", () => {
            if (listo) return;
            p.classList.toggle("pintada", alternar(p.getAttribute("data-i")));
            revisar();
          });
        });
      }
      revisar();
    };
  }

  window.Fracciones = Actividad("frac", [
    { icono: "🍕", nombre: "Pinta la pizza", desc: "toca las porciones", ronda: jugar("pizza") },
    { icono: "🍫", nombre: "Pinta la barra", desc: "toca los pedazos", ronda: jugar("barra") }
  ]);
})();
