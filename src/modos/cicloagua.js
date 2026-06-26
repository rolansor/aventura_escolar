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

  /* ---- Conceptos (no solo arrastrar): ¿verdadero o falso? y definiciones ---- */
  function itemDe(niveles, niv) {
    let arr = niveles[niv];
    for (let k = niv; k >= 0 && (!arr || !arr.length); k--) arr = niveles[k];
    return Juego.azarEl(arr);
  }

  const CONCEPTOS = [
    [
      { t: "El sol calienta el agua y se evapora.", c: true, exp: "" },
      { t: "El agua puede ser sólida, líquida y gaseosa.", c: true, exp: "" },
      { t: "El hielo es agua en estado gaseoso.", c: false, exp: "El hielo es sólida." }
    ],
    [
      { t: "El vapor sube y forma las nubes.", c: true, exp: "" },
      { t: "El agua de los ríos llega al mar.", c: true, exp: "" },
      { t: "El ciclo del agua se detiene en invierno.", c: false, exp: "El ciclo nunca se detiene." }
    ],
    [
      { t: "Las nubes se forman por condensación.", c: true, exp: "" },
      { t: "La lluvia es precipitación.", c: true, exp: "" }
    ]
  ];
  const DEFINICIONES = [
    [
      { q: "¿Qué estado del agua es el hielo?", c: "Sólido", d: ["Líquido", "Gaseoso"] },
      { q: "¿Qué hace que el agua se evapore?", c: "El calor del sol", d: ["El frío de la noche", "El viento de la montaña"] }
    ],
    [
      { q: "¿Qué se forma cuando el vapor se enfría?", c: "Las nubes", d: ["El hielo", "Los ríos"] },
      { q: "¿Cómo se llama la lluvia o nieve que cae?", c: "Precipitación", d: ["Evaporación", "Condensación"] }
    ],
    [
      { q: "¿Qué es la evaporación?", c: "Cuando el agua se calienta y sube como vapor", d: ["Cuando el agua se congela", "Cuando llueve"] },
      { q: "¿Qué es la condensación?", c: "Cuando el vapor se enfría y forma nubes", d: ["Cuando el agua se calienta", "Cuando el agua se filtra en el suelo"] }
    ]
  ];

  const rondaVF = (host, ctrl) => {
    const q = itemDe(CONCEPTOS, Juego.nivelIdx());
    ctrl.pregunta("🤔 ¿Es verdad?<br><b>" + q.t + "</b>");
    host.innerHTML = '<div class="ord-fuente"></div>';
    const cont = host.querySelector(".ord-fuente");
    [["✅ Verdadero", true], ["❌ Falso", false]].forEach((par) => {
      const b = document.createElement("button");
      b.className = "ord-chip"; b.textContent = par[0];
      b.onclick = () => {
        if (par[1] === q.c) ctrl.ganar();
        else ctrl.fallar("Era <b>" + (q.c ? "Verdadero" : "Falso") + "</b>. " + (q.exp || ""));
      };
      cont.appendChild(b);
    });
  };
  const rondaDef = (host, ctrl) => {
    const q = itemDe(DEFINICIONES, Juego.nivelIdx());
    ctrl.pregunta("📖 " + q.q);
    host.innerHTML = '<div class="ord-fuente"></div>';
    const cont = host.querySelector(".ord-fuente");
    ctrl.mezclar([q.c].concat(q.d)).forEach((op) => {
      const b = document.createElement("button");
      b.className = "ord-chip"; b.textContent = op;
      b.onclick = () => { if (op === q.c) ctrl.ganar(); else ctrl.reintento("Casi… inténtalo otra vez 🤔"); };
      cont.appendChild(b);
    });
  };

  const temas = [
    { icono: "💧", nombre: "Arma el ciclo", desc: "arrastra cada etapa", total: 5,
      ronda: rondaArrastre(ESCENA, ETAPAS, ETAPAS, "💧 Arrastra cada etapa a su lugar en el dibujo 👇") },
    { icono: "🧊", nombre: "Estados del agua", desc: "sólido, líquido, gas", total: 6,
      ronda: rondaArrastre(ESTADOS_ESCENA, ESTADOS, ESTADOS, "🧊 Lleva cada agua a su estado 👇") }
  ];
  temas.push({ icono: "🤔", nombre: "¿Verdadero o falso?", desc: "conceptos del ciclo del agua", total: 6, ronda: rondaVF });
  temas.push({ icono: "📖", nombre: "¿Qué es cada cosa?", desc: "elige la definición", total: 6, ronda: rondaDef });
  window.CicloAgua = Actividad("agua", temas);
})();
