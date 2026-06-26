/* ============================================================
   LOS ANIMALES — Ciencias Naturales (Quinto, Unidad 1: Animales)
   Motor manipulativo (clasificar en cestas). Cubre el Taller 1:
   vertebrado/invertebrado, grupos de vertebrados, alimentación,
   reproducción (cómo nacen) y respiración.
   Catálogo INLINE por 3 niveles (Juego.nivelIdx()): suben las cestas
   y los ejemplos menos obvios en los niveles altos.
   ============================================================ */
(function () {
  // Nombre + emoji de cada "cesta" (grupo) que usan los temas.
  const G = {
    vert:   { nombre: "Vertebrado",   emoji: "🦴" },
    invert: { nombre: "Invertebrado", emoji: "🐛" },
    mamif:  { nombre: "Mamífero",     emoji: "🐘" },
    ave:    { nombre: "Ave",          emoji: "🦅" },
    pez:    { nombre: "Pez",          emoji: "🐟" },
    reptil: { nombre: "Reptil",       emoji: "🦎" },
    anfibio:{ nombre: "Anfibio",      emoji: "🐸" },
    herb:   { nombre: "Herbívoro",    emoji: "🌿" },
    carn:   { nombre: "Carnívoro",    emoji: "🍖" },
    omni:   { nombre: "Omnívoro",     emoji: "🍽️" },
    ovip:   { nombre: "Ovíparo (de huevo)", emoji: "🥚" },
    vivi:   { nombre: "Vivíparo",     emoji: "🤱" },
    ovovivi:{ nombre: "Ovovivíparo",  emoji: "🐍" },
    pulm:   { nombre: "Pulmones",     emoji: "🫁" },
    branq:  { nombre: "Branquias",    emoji: "🌊" },
    piel:   { nombre: "Piel",         emoji: "🐸" },
    traq:   { nombre: "Tráqueas",     emoji: "🐜" }
  };

  // Cada tema: cestasNivel = qué grupos aparecen por nivel; banco = por grupo,
  // listas [básico, intermedio, avanzado]. Se toma 1 animal por grupo y ronda.
  const TEMAS = [
    {
      icono: "🦴", nombre: "¿Vertebrado o invertebrado?", desc: "¿tiene huesos?",
      pregunta: "¿Tiene huesos (esqueleto) o no? Arrástralo a su grupo 👇",
      cestasNivel: [["vert", "invert"], ["vert", "invert"], ["vert", "invert"]],
      banco: {
        vert: [["el perro", "el gato", "el pez", "la rana", "el ave"],
               ["el caballo", "la tortuga", "la serpiente", "el águila", "la trucha"],
               ["la ballena", "el tiburón", "el murciélago", "el delfín", "la salamandra"]],
        invert: [["la araña", "el caracol", "la lombriz", "la mariposa", "la hormiga"],
                 ["la abeja", "el escarabajo", "el cangrejo", "el ciempiés", "la babosa"],
                 ["el pulpo", "la medusa", "la estrella de mar", "el calamar", "la esponja"]]
      }
    },
    {
      icono: "🐾", nombre: "Grupos de vertebrados", desc: "mamífero, ave, pez…",
      pregunta: "¿A qué grupo de vertebrados pertenece? 👇",
      cestasNivel: [["mamif", "ave", "pez"], ["mamif", "ave", "pez", "reptil"], ["mamif", "ave", "pez", "reptil", "anfibio"]],
      banco: {
        mamif: [["el perro", "la vaca", "el gato"], ["el caballo", "la llama", "el oso"], ["la ballena", "el delfín", "el murciélago"]],
        ave: [["la gallina", "el pato", "el loro"], ["el cóndor", "el colibrí", "la garza"], ["el pingüino", "el búho", "la fragata"]],
        pez: [["el pez", "la trucha", "el atún"], ["el tiburón", "la tilapia", "el pez payaso"], ["la anguila", "el bagre", "el dorado"]],
        reptil: [["la tortuga", "la lagartija"], ["la serpiente", "la iguana"], ["el cocodrilo", "el camaleón"]],
        anfibio: [["la rana", "el sapo"], ["la salamandra", "el tritón"], ["la rana marsupial", "la cecilia"]]
      }
    },
    {
      icono: "🍽️", nombre: "¿Qué comen?", desc: "herbívoro, carnívoro, omnívoro",
      pregunta: "Arrastra cada animal según lo que come 👇",
      cestasNivel: [["herb", "carn"], ["herb", "carn", "omni"], ["herb", "carn", "omni"]],
      banco: {
        herb: [["la vaca", "el conejo", "el caballo"], ["la oveja", "la llama", "la jirafa"], ["el venado", "la iguana", "el manatí"]],
        carn: [["el león", "el tiburón", "el lobo"], ["el águila", "el puma", "el cocodrilo"], ["la araña", "el búho", "la mantis"]],
        omni: [["el oso", "el cerdo"], ["la gallina", "el ser humano"], ["el mono", "el zorro", "la rata"]]
      }
    },
    {
      icono: "🥚", nombre: "¿Cómo nacen?", desc: "de huevo o del vientre",
      pregunta: "Arrastra cada animal según cómo nace 👇",
      cestasNivel: [["ovip", "vivi"], ["ovip", "vivi"], ["ovip", "vivi", "ovovivi"]],
      banco: {
        ovip: [["la gallina", "la rana", "la tortuga"], ["el pez", "el ave", "la serpiente"], ["el cocodrilo", "la mariposa", "el avestruz"]],
        vivi: [["el perro", "el gato", "la vaca"], ["la ballena", "el caballo", "la llama"], ["el delfín", "el murciélago", "el ser humano"]],
        ovovivi: [[], [], ["el tiburón", "la víbora", "el caballito de mar"]]
      }
    },
    {
      icono: "💨", nombre: "¿Cómo respira?", desc: "pulmones, branquias, piel…",
      pregunta: "¿Con qué respira cada animal? 👇",
      cestasNivel: [["pulm", "branq"], ["pulm", "branq", "piel"], ["pulm", "branq", "piel", "traq"]],
      banco: {
        pulm: [["el perro", "el gato", "el ave"], ["la ballena", "el caballo", "la tortuga"], ["el delfín", "la serpiente", "el murciélago"]],
        branq: [["el pez", "el tiburón"], ["la trucha", "el atún"], ["el renacuajo", "el cangrejo", "el pulpo"]],
        piel: [[], ["la rana", "la lombriz"], ["el sapo", "la salamandra"]],
        traq: [[], [], ["la hormiga", "la mariposa", "el escarabajo", "la araña"]]
      }
    }
  ];

  function itemDe(niveles, niv) {
    let arr = niveles[niv];
    for (let k = niv; k >= 0 && (!arr || !arr.length); k--) arr = niveles[k];
    return Juego.azarEl(arr);
  }
  const ronda = (t) => (host, ctrl) => {
    const niv = Juego.nivelIdx();
    const ids = Juego.porNivel(t.cestasNivel);
    const cestas = ids.map((id) => ({ id: id, nombre: G[id].nombre, emoji: G[id].emoji }));
    const items = ids.map((id) => ({ txt: itemDe(t.banco[id], niv), cesta: id }));
    Arrastrar.clasificar(host, ctrl, { pregunta: t.pregunta, cestas: cestas, items: ctrl.mezclar(items) });
  };

  /* ---- Conceptos (no solo clasificar): ¿verdadero o falso? y definiciones ---- */
  const CONCEPTOS = [
    [
      { t: "Los ovíparos nacen de huevos.", c: true, exp: "Como la gallina o la rana." },
      { t: "Los vivíparos nacen de huevos.", c: false, exp: "Nacen del vientre de su mamá." },
      { t: "Las aves tienen plumas.", c: true, exp: "" },
      { t: "El perro es un ave.", c: false, exp: "Es un mamífero." }
    ],
    [
      { t: "Las ballenas son peces.", c: false, exp: "Son mamíferos: respiran aire." },
      { t: "Los peces respiran por branquias.", c: true, exp: "" },
      { t: "Los herbívoros comen carne.", c: false, exp: "Comen plantas." },
      { t: "Los mamíferos dan leche a sus crías.", c: true, exp: "" },
      { t: "Los reptiles tienen escamas.", c: true, exp: "" }
    ],
    [
      { t: "El murciélago es un ave.", c: false, exp: "Es un mamífero que vuela." },
      { t: "Los anfibios viven en el agua y en la tierra.", c: true, exp: "Como la rana." },
      { t: "Los vertebrados tienen huesos y columna.", c: true, exp: "" },
      { t: "El tiburón es un mamífero.", c: false, exp: "Es un pez." },
      { t: "Los omnívoros comen plantas y animales.", c: true, exp: "" }
    ]
  ];
  const DEFINICIONES = [
    [
      { q: "¿Qué es un animal VIVÍPARO?", c: "Nace del vientre de su mamá", d: ["Nace de un huevo", "Nace de una semilla"] },
      { q: "¿Qué es un animal OVÍPARO?", c: "Nace de un huevo", d: ["Nace del vientre", "Vive en el mar"] },
      { q: "¿Qué come un HERBÍVORO?", c: "Plantas", d: ["Carne", "Piedras"] }
    ],
    [
      { q: "¿Qué come un CARNÍVORO?", c: "Otros animales", d: ["Solo plantas", "Solo frutas"] },
      { q: "¿Qué come un OMNÍVORO?", c: "Plantas y animales", d: ["Solo pasto", "Solo carne"] },
      { q: "¿Con qué respiran los peces?", c: "Con branquias", d: ["Con pulmones", "Con la piel"] },
      { q: "¿Qué tienen las aves en el cuerpo?", c: "Plumas", d: ["Escamas", "Pelo"] }
    ],
    [
      { q: "¿Qué es un VERTEBRADO?", c: "Un animal con huesos y columna", d: ["Un animal sin huesos", "Un insecto"] },
      { q: "¿Qué grupo da leche a sus crías?", c: "Los mamíferos", d: ["Las aves", "Los peces"] },
      { q: "¿Qué tienen los reptiles en la piel?", c: "Escamas", d: ["Plumas", "Pelo suave"] }
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
  temas.push({ icono: "🤔", nombre: "¿Verdadero o falso?", desc: "conceptos de los animales", total: 6, ronda: rondaVF });
  temas.push({ icono: "📖", nombre: "¿Qué es cada cosa?", desc: "elige la definición", total: 6, ronda: rondaDef });
  window.Animales = Actividad("ani", temas);
})();
