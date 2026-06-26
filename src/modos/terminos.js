/* ============================================================
   TÉRMINOS DE LA ADICIÓN Y LA SUSTRACCIÓN — Matemáticas (manipulativo)
   El niño ARRASTRA cada nombre (sumando, suma, minuendo, sustraendo,
   diferencia) sobre el número que le corresponde en la operación.
   Tema del temario de Quinto. Dificultad por nivel (tamaño de los números).
   ============================================================ */
(function () {
  // Genera la operación y arma el arrastre de etiquetas sobre cada número.
  const ronda = (suma) => (host, ctrl) => {
    const rg = Juego.porNivel([[2, 20], [20, 200], [200, 2000]]);
    let a = ctrl.azar(rg[0], rg[1]);
    let b = ctrl.azar(rg[0], rg[1]);
    if (!suma && a < b) { const t = a; a = b; b = t; }   // en la resta, minuendo ≥ sustraendo
    const c = suma ? a + b : a - b;
    const signo = suma ? "+" : "−";
    const partes = suma
      ? [{ n: a, rol: "sumando" }, { n: b, rol: "sumando" }, { n: c, rol: "suma" }]
      : [{ n: a, rol: "minuendo" }, { n: b, rol: "sustraendo" }, { n: c, rol: "diferencia" }];
    const etiquetas = suma ? ["sumando", "sumando", "suma"] : ["minuendo", "sustraendo", "diferencia"];

    ctrl.pregunta("Arrastra cada nombre a su número 👇");
    host.innerHTML =
      '<div class="term-op">' +
        numHTML(partes[0]) + '<span class="term-sig">' + signo + "</span>" +
        numHTML(partes[1]) + '<span class="term-sig">=</span>' +
        numHTML(partes[2]) +
      "</div>" +
      '<div class="fila-fichas term-fichas"></div>';

    const fila = host.querySelector(".term-fichas");
    const zonas = Array.prototype.slice.call(host.querySelectorAll(".term-num"));
    let faltan = zonas.length;

    ctrl.mezclar(etiquetas.slice()).forEach((rol) => {
      const chip = document.createElement("button");
      chip.className = "ficha-arr"; chip.textContent = rol; chip.dataset.rol = rol;
      fila.appendChild(chip);
      Arrastrar.hacer(chip, zonas, (item, zona) => {
        if (!zona) return;
        if (zona.dataset.lleno !== "1" && zona.dataset.rol === item.dataset.rol) {
          item.dataset.fijo = "1"; item.classList.add("colocada");
          zona.dataset.lleno = "1";
          zona.querySelector(".term-slot").appendChild(item);
          zona.classList.add("ok"); setTimeout(() => zona.classList.remove("ok"), 600);
          faltan--;
          if (faltan === 0) ctrl.ganar(); else ctrl.retro("¡Bien! Faltan " + faltan + " 👇", "bien");
        } else {
          zona.classList.add("rojo"); setTimeout(() => zona.classList.remove("rojo"), 450);
          ctrl.reintento("Ese nombre no va ahí 👀");
        }
      });
    });
  };

  function numHTML(p) {
    return '<div class="term-num" data-rol="' + p.rol + '"><b>' + p.n + "</b><span class=\"term-slot\"></span></div>";
  }

  window.Terminos = Actividad("term", [
    { icono: "➕", nombre: "Suma", desc: "sumando + sumando = suma", total: 6, ronda: ronda(true) },
    { icono: "➖", nombre: "Resta", desc: "minuendo − sustraendo = diferencia", total: 6, ronda: ronda(false) }
  ]);
})();
