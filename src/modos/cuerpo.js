/* El cuerpo humano — Ciencias Naturales (motor manipulativo: clasificar en cestas) */
(function () {
  const TEMAS = [
    { icono: "❤️", nombre: "¿Para qué sirve?", desc: "el trabajo de cada órgano",
      pregunta: "Arrastra cada trabajo a su órgano 👇",
      cestas: [{ id: "pulmones", nombre: "Pulmones", emoji: "🫁" }, { id: "corazon", nombre: "Corazón", emoji: "❤️" },
        { id: "estomago", nombre: "Estómago", emoji: "🍽️" }, { id: "cerebro", nombre: "Cerebro", emoji: "🧠" }],
      banco: {
        pulmones: ["Respira el aire", "Toma el oxígeno", "Bota el dióxido de carbono"],
        corazon: ["Bombea la sangre", "Late todo el día", "Manda sangre al cuerpo"],
        estomago: ["Digiere la comida", "Recibe lo que tragas", "Deshace los alimentos"],
        cerebro: ["Piensa y aprende", "Manda órdenes al cuerpo", "Controla los sentidos"]
      } },
    { icono: "✋", nombre: "Los 5 sentidos", desc: "¿con qué lo sientes?",
      pregunta: "Arrastra cada cosa al sentido con que se percibe 👇",
      cestas: [{ id: "vista", nombre: "Vista", emoji: "👁️" }, { id: "oido", nombre: "Oído", emoji: "👂" },
        { id: "olfato", nombre: "Olfato", emoji: "👃" }, { id: "gusto", nombre: "Gusto", emoji: "👅" },
        { id: "tacto", nombre: "Tacto", emoji: "🤚" }],
      banco: {
        vista: ["los colores", "la luz", "un dibujo"],
        oido: ["la música", "un ruido", "una voz"],
        olfato: ["el olor de una flor", "el perfume", "la comida rica"],
        gusto: ["lo dulce", "lo salado", "un jugo"],
        tacto: ["lo suave", "lo caliente", "lo áspero"]
      } }
  ];
  const ronda = (t) => (host, ctrl) => {
    const items = t.cestas.map((c) => ({ txt: ctrl.azarEl(t.banco[c.id]), cesta: c.id }));
    Arrastrar.clasificar(host, ctrl, { pregunta: t.pregunta, cestas: t.cestas, items: ctrl.mezclar(items) });
  };

  function itemDe(niveles, niv) {
    let arr = niveles[niv];
    for (let k = niv; k >= 0 && (!arr || !arr.length); k--) arr = niveles[k];
    return Juego.azarEl(arr);
  }

  /* ---- Conceptos (no solo clasificar): ¿verdadero o falso? y definiciones ---- */
  const CONCEPTOS = [
    [
      { t: "El corazón bombea la sangre.", c: true, exp: "Late todo el día." },
      { t: "Los pulmones sirven para respirar.", c: true, exp: "Toman el oxígeno del aire." },
      { t: "Tenemos 5 sentidos.", c: true, exp: "Vista, oído, olfato, gusto y tacto." },
      { t: "Vemos con los oídos.", c: false, exp: "Vemos con los ojos." }
    ],
    [
      { t: "El cerebro controla el cuerpo.", c: true, exp: "Piensa y manda órdenes." },
      { t: "El estómago digiere la comida.", c: true, exp: "Deshace los alimentos." },
      { t: "Los huesos forman el esqueleto.", c: true, exp: "" }
    ],
    [
      { t: "El corazón sirve para pensar.", c: false, exp: "Para eso está el cerebro." },
      { t: "El esqueleto sostiene y protege el cuerpo.", c: true, exp: "" },
      { t: "Los pulmones botan el dióxido de carbono.", c: true, exp: "" }
    ]
  ];
  const DEFINICIONES = [
    [
      { q: "¿Para qué sirven los pulmones?", c: "Para respirar", d: ["Para pensar", "Para caminar"] },
      { q: "¿Qué órgano bombea la sangre?", c: "El corazón", d: ["El estómago", "El cerebro"] },
      { q: "¿Cuántos sentidos tenemos?", c: "5", d: ["2", "10"] }
    ],
    [
      { q: "¿Con qué sentido oímos?", c: "El oído", d: ["La vista", "El gusto"] },
      { q: "¿Qué órgano controla todo el cuerpo?", c: "El cerebro", d: ["El corazón", "El estómago"] }
    ],
    [
      { q: "¿Con qué sentido sentimos la textura?", c: "El tacto", d: ["El olfato", "El oído"] }
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

  const temas = TEMAS.map((t) => ({ icono: t.icono, nombre: t.nombre, desc: t.desc, total: 6, ronda: ronda(t) }));
  temas.push({ icono: "🤔", nombre: "¿Verdadero o falso?", desc: "conceptos del cuerpo", total: 6, ronda: rondaVF });
  temas.push({ icono: "📖", nombre: "¿Qué es cada cosa?", desc: "elige la definición", total: 6, ronda: rondaDef });
  window.Cuerpo = Actividad("cue", temas);
})();
