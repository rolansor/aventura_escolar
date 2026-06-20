/* El ciclo del agua — Ciencias Naturales (motor manipulativo)
   El niño ARRASTRA cada etapa a su lugar sobre el dibujo del ciclo, y
   empareja los estados del agua. Aprende ubicando objetos, no leyendo.
   Usa window.Arrastrar (eventos de puntero: sirve con mouse y con dedo). */
(function () {

  // Escena del ciclo (sol, mar, montaña, nube, lluvia, flechas de vapor)
  const ESCENA =
    '<svg viewBox="0 0 300 200" class="ciclo-svg" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="0" y="0" width="300" height="200" fill="#bfe6ff"/>' +
      '<circle cx="38" cy="34" r="20" fill="#ffd23f"/>' +
      '<path d="M0 150 Q60 120 120 150 T300 150 L300 200 L0 200 Z" fill="#7bbf5a"/>' +    // suelo
      '<rect x="0" y="150" width="120" height="50" fill="#3aa0e0"/>' +                     // mar
      '<path d="M0 150 q15 -8 30 0 t30 0 t30 0 t30 0" stroke="#fff" stroke-width="2" fill="none" opacity="0.7"/>' +
      '<g fill="#fff">' +                                                                  // nube
        '<ellipse cx="150" cy="48" rx="34" ry="20"/><ellipse cx="120" cy="56" rx="22" ry="16"/>' +
        '<ellipse cx="182" cy="56" rx="24" ry="16"/>' +
      "</g>" +
      '<g stroke="#2e6cf6" stroke-width="3" stroke-linecap="round">' +                     // lluvia
        '<line x1="200" y1="74" x2="194" y2="92"/><line x1="214" y1="74" x2="208" y2="92"/>' +
        '<line x1="228" y1="74" x2="222" y2="92"/>' +
      "</g>" +
      '<g stroke="#9fd0ef" stroke-width="3" stroke-linecap="round" opacity="0.9">' +        // vapor que sube
        '<path d="M40 140 q-6 -14 4 -26 q8 -10 0 -22" fill="none"/>' +
        '<path d="M64 140 q-6 -14 4 -26 q8 -10 0 -22" fill="none"/>' +
      "</g>" +
    "</svg>";

  const ETAPAS = [
    { id: "evaporacion", txt: "Evaporación", left: 9, top: 46 },
    { id: "condensacion", txt: "Condensación", left: 40, top: 8 },
    { id: "precipitacion", txt: "Precipitación", left: 66, top: 38 },
    { id: "infiltracion", txt: "Infiltración", left: 42, top: 74 }
  ];

  const ESTADOS_ESCENA = "";
  const ESTADOS = [
    { id: "solido", txt: "Sólido 🧊", ficha: "🧊 Hielo" },
    { id: "liquido", txt: "Líquido 💧", ficha: "💧 Agua" },
    { id: "gaseoso", txt: "Gaseoso 💨", ficha: "💨 Vapor" }
  ];

  /* Arma una ronda de "arrastrar fichas a sus zonas".
     slots: [{id, txt?, left?, top?}] -> con left/top van sobre la escena; si no, en fila.
     fichas: [{id, txt}] */
  function rondaArrastre(escena, slots, fichas, intro) {
    return function (host, ctrl) {
      ctrl.pregunta(intro);
      const abs = slots.some((s) => s.left != null);
      host.innerHTML =
        '<div class="zona-arrastre ' + (abs ? "con-escena" : "en-fila") + '">' +
          (escena ? '<div class="escena">' + escena + "</div>" : "") +
          '<div class="slots">' +
            slots.map((s) =>
              '<div class="slot" data-id="' + s.id + '"' +
              (abs ? ' style="left:' + s.left + "%;top:" + s.top + '%"' : "") +
              ">" + (s.txt ? '<span class="slot-etq">' + s.txt + "</span>" : '<span class="slot-q">?</span>') +
              "</div>").join("") +
          "</div>" +
        "</div>" +
        '<div class="fila-fichas"></div>';
      const elFichas = host.querySelector(".fila-fichas");
      const zonas = Array.prototype.slice.call(host.querySelectorAll(".slot"));
      let faltan = slots.length;

      ctrl.mezclar(fichas.slice()).forEach((f) => {
        const chip = document.createElement("button");
        chip.className = "ficha-arr"; chip.textContent = f.ficha || f.txt; chip.dataset.id = f.id;
        elFichas.appendChild(chip);
        Arrastrar.hacer(chip, zonas, (item, zona) => {
          if (!zona || zona.dataset.lleno === "1") return;            // soltó fuera: vuelve solo
          if (zona.dataset.id === item.dataset.id) {
            zona.dataset.lleno = "1"; zona.classList.add("ok");
            zona.innerHTML = ""; item.dataset.fijo = "1";
            item.classList.add("colocada"); zona.appendChild(item);
            faltan--;
            if (faltan === 0) ctrl.ganar(); else ctrl.retro("¡Bien! Faltan " + faltan + " 👇", "bien");
          } else {
            zona.classList.add("rojo"); setTimeout(() => zona.classList.remove("rojo"), 450);
            ctrl.reintento("Ahí no va. Prueba en otro lugar 👀");
          }
        });
      });
    };
  }

  window.CicloAgua = Actividad("agua", [
    { icono: "💧", nombre: "Arma el ciclo", desc: "arrastra cada etapa", total: 5,
      ronda: rondaArrastre(ESCENA, ETAPAS, ETAPAS, "💧 Arrastra cada etapa a su lugar en el dibujo 👇") },
    { icono: "🧊", nombre: "Estados del agua", desc: "sólido, líquido, gas", total: 6,
      ronda: rondaArrastre(ESTADOS_ESCENA, ESTADOS, ESTADOS, "🧊 Lleva cada agua a su estado 👇") }
  ]);
})();
