/* Ecosistemas y ambiente — Ciencias Naturales (motor manipulativo: clasificar en cestas) */
(function () {
  const TEMAS = [
    { icono: "♻️", nombre: "¿En qué contenedor?", desc: "separa la basura",
      pregunta: "Arrastra cada cosa a su contenedor de reciclaje 👇",
      cestas: [{ id: "papel", nombre: "Papel", emoji: "📄" }, { id: "plastico", nombre: "Plástico", emoji: "🧴" },
        { id: "organico", nombre: "Orgánico", emoji: "🍎" }, { id: "vidrio", nombre: "Vidrio", emoji: "🍶" }],
      banco: {
        papel: ["un periódico", "una caja de cartón", "un cuaderno viejo"],
        plastico: ["una botella de agua", "una funda", "un envase de yogur"],
        organico: ["una cáscara de plátano", "restos de comida", "una hoja seca"],
        vidrio: ["un frasco", "una botella de vidrio", "un vaso roto"]
      } },
    { icono: "💚", nombre: "Cuida / Daña el planeta", desc: "lo bueno y lo malo",
      pregunta: "Arrastra cada acción a su grupo 👇",
      cestas: [{ id: "cuida", nombre: "Cuida 💚", emoji: "🌳" }, { id: "dana", nombre: "Daña 💔", emoji: "🏭" }],
      banco: {
        cuida: ["sembrar árboles", "reciclar", "cerrar el grifo", "apagar la luz", "ir en bici"],
        dana: ["botar basura al río", "talar bosques", "desperdiciar agua", "contaminar el aire"]
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
      { t: "Reciclar cuida el planeta.", c: true, exp: "" },
      { t: "Sembrar árboles ayuda al ambiente.", c: true, exp: "" },
      { t: "Ahorrar agua cuida el planeta.", c: true, exp: "" },
      { t: "Talar todos los bosques es bueno.", c: false, exp: "" }
    ],
    [
      { t: "Botar basura al río daña a los animales.", c: true, exp: "" },
      { t: "La cáscara de fruta es basura orgánica.", c: true, exp: "" },
      { t: "Las botellas de plástico van al tacho de papel.", c: false, exp: "Van al tacho de plástico." }
    ],
    [
      { t: "La cáscara de fruta es basura orgánica.", c: true, exp: "" }
    ]
  ];
  const DEFINICIONES = [
    [
      { q: "¿Qué es reciclar?", c: "Volver a usar la basura para algo nuevo", d: ["Botar toda la basura junta", "Quemar la basura"] },
      { q: "¿Dónde va una botella de plástico?", c: "Al contenedor de plástico", d: ["Al contenedor de papel", "Al contenedor orgánico"] },
      { q: "¿Qué acción cuida el planeta?", c: "Sembrar árboles", d: ["Talar bosques", "Botar basura al río"] }
    ],
    [
      { q: "¿Dónde va la cáscara de plátano?", c: "Al contenedor orgánico", d: ["Al contenedor de vidrio", "Al contenedor de plástico"] },
      { q: "¿Qué pasa si botamos basura en la naturaleza?", c: "Daña a los animales y plantas", d: ["Ayuda a los animales", "No pasa nada"] }
    ],
    [
      { q: "¿Qué es un ecosistema?", c: "Un lugar con seres vivos y su entorno", d: ["Una ciudad sin animales", "Una fábrica de carros"] }
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
  temas.push({ icono: "🤔", nombre: "¿Verdadero o falso?", desc: "conceptos del ambiente", total: 6, ronda: rondaVF });
  temas.push({ icono: "📖", nombre: "¿Qué es cada cosa?", desc: "elige la definición", total: 6, ronda: rondaDef });
  window.Ambiente = Actividad("amb", temas);
})();
