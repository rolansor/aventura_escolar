/* La materia — Ciencias Naturales (motor manipulativo: clasificar en cestas) */
(function () {
  const TEMAS = [
    { icono: "🧊", nombre: "Estados de la materia", desc: "sólido, líquido, gaseoso",
      pregunta: "Arrastra cada cosa a su estado 👇",
      cestas: [{ id: "solido", nombre: "Sólido", emoji: "🧊" }, { id: "liquido", nombre: "Líquido", emoji: "💧" },
        { id: "gaseoso", nombre: "Gaseoso", emoji: "💨" }],
      banco: {
        solido: ["una piedra", "el hielo", "una mesa", "una moneda", "un libro"],
        liquido: ["el agua", "la leche", "el jugo", "el aceite"],
        gaseoso: ["el aire", "el vapor", "el humo", "el viento"]
      } },
    { icono: "🪵", nombre: "¿De qué material?", desc: "madera, metal, vidrio, plástico",
      pregunta: "Arrastra cada objeto a su material 👇",
      cestas: [{ id: "madera", nombre: "Madera", emoji: "🪵" }, { id: "metal", nombre: "Metal", emoji: "🔩" },
        { id: "vidrio", nombre: "Vidrio", emoji: "🥃" }, { id: "plastico", nombre: "Plástico", emoji: "🧴" }],
      banco: {
        madera: ["una silla", "un lápiz", "una puerta"],
        metal: ["una cuchara", "una llave", "un clavo"],
        vidrio: ["un vaso", "una ventana", "un espejo"],
        plastico: ["un juguete", "una funda", "un balde"]
      } }
  ];
  const ronda = (t) => (host, ctrl) => {
    const items = t.cestas.map((c) => ({ txt: ctrl.azarEl(t.banco[c.id]), cesta: c.id }));
    Arrastrar.clasificar(host, ctrl, { pregunta: t.pregunta, cestas: t.cestas, items: ctrl.mezclar(items) });
  };

  /* ---- Conceptos (no solo clasificar): ¿verdadero o falso? y definiciones ---- */
  function itemDe(niveles, niv) {
    let arr = niveles[niv];
    for (let k = niv; k >= 0 && (!arr || !arr.length); k--) arr = niveles[k];
    return Juego.azarEl(arr);
  }
  const CONCEPTOS = [
    [
      { t: "El hielo es agua sólida.", c: true, exp: "" },
      { t: "El aire es un gas.", c: true, exp: "" },
      { t: "El agua es líquida.", c: true, exp: "" },
      { t: "El plástico es un metal.", c: false, exp: "" }
    ],
    [
      { t: "Los sólidos tienen forma fija.", c: true, exp: "" },
      { t: "Los líquidos toman la forma del recipiente.", c: true, exp: "" },
      { t: "El vapor es un sólido.", c: false, exp: "El vapor es un gas." }
    ],
    [
      { t: "Si calientas el hielo se derrite.", c: true, exp: "Se vuelve líquido." }
    ]
  ];
  const DEFINICIONES = [
    [
      { q: "¿Qué estado tiene forma fija?", c: "Sólido", d: ["Líquido", "Gaseoso"] },
      { q: "¿De qué material es una ventana?", c: "Vidrio", d: ["Madera", "Plástico"] },
      { q: "¿En qué estado está el agua de un río?", c: "Líquido", d: ["Sólido", "Gaseoso"] }
    ],
    [
      { q: "¿Cómo se llama el agua en forma de gas?", c: "Vapor", d: ["Hielo", "Lluvia"] },
      { q: "¿Qué estado se dispersa por todos lados?", c: "Gaseoso", d: ["Sólido", "Líquido"] }
    ],
    [
      { q: "¿Qué le pasa al hielo si lo calientas?", c: "Se derrite (se vuelve líquido)", d: ["Se vuelve piedra", "Se vuelve gas frío"] }
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
  temas.push({ icono: "🤔", nombre: "¿Verdadero o falso?", desc: "conceptos de la materia", total: 6, ronda: rondaVF });
  temas.push({ icono: "📖", nombre: "¿Qué es cada cosa?", desc: "elige la definición", total: 6, ronda: rondaDef });
  window.Materia = Actividad("mat", temas);
})();
