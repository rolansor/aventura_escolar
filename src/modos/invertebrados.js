/* ============================================================
   LOS INVERTEBRADOS — Ciencias Naturales (Quinto, Unidad 1)
   Basado en el "Manual de exploración: el reino de los invertebrados".
   Mezcla CLASIFICAR (los 6 grupos y sus SUBCLASIFICACIONES: artrópodos,
   moluscos, gusanos…; con/sin patas; respiración; hábitat; reproducción)
   con preguntas de CONCEPTO (¿verdadero o falso?). Motor manipulativo;
   catálogo INLINE por 3 niveles (Juego.nivelIdx()).
   ============================================================ */
(function () {
  // Nombre + emoji de cada "cesta" que usan los temas de clasificar.
  const G = {
    artropodos: { nombre: "Artrópodos", emoji: "🦗" },
    moluscos:   { nombre: "Moluscos",   emoji: "🐌" },
    gusanos:    { nombre: "Gusanos",    emoji: "🪱" },
    equino:     { nombre: "Equinodermos", emoji: "⭐" },
    cnidarios:  { nombre: "Cnidarios",  emoji: "🪼" },
    poriferos:  { nombre: "Poríferos",  emoji: "🧽" },
    insecto:    { nombre: "Insecto (6 patas)", emoji: "🐜" },
    aracnido:   { nombre: "Arácnido (8 patas)", emoji: "🕷️" },
    crustaceo:  { nombre: "Crustáceo (caparazón)", emoji: "🦀" },
    miriapodo:  { nombre: "Miriápodo (muchas patas)", emoji: "🐛" },
    gasteropodo:{ nombre: "Gasterópodo (concha en espiral)", emoji: "🐌" },
    bivalvo:    { nombre: "Bivalvo (dos valvas)", emoji: "🦪" },
    cefalopodo: { nombre: "Cefalópodo (tentáculos)", emoji: "🐙" },
    anelido:    { nombre: "Anélido (con anillos)", emoji: "🪱" },
    platelminto:{ nombre: "Platelminto (plano)", emoji: "🎗️" },
    nematodo:   { nombre: "Nemátodo (redondo)", emoji: "〰️" },
    conpatas:   { nombre: "Con patas", emoji: "🦵" },
    sinpatas:   { nombre: "Sin patas", emoji: "🚫" },
    traqueas:   { nombre: "Tráqueas", emoji: "🌬️" },
    branquias:  { nombre: "Branquias", emoji: "🌊" },
    cutanea:    { nombre: "Por la piel", emoji: "🫧" },
    poros:      { nombre: "Por poros", emoji: "🧽" },
    mar:        { nombre: "Mar", emoji: "🌊" },
    dulce:      { nombre: "Agua dulce", emoji: "💧" },
    tierra:     { nombre: "Tierra húmeda", emoji: "🌱" },
    sexual:     { nombre: "Sexual", emoji: "🐣" },
    asexual:    { nombre: "Asexual (gemación)", emoji: "🌱" }
  };

  // banco[id] = [básico, intermedio, avanzado]. Se toma 1 animal por cesta y ronda.
  const TEMAS = [
    {
      icono: "🔎", nombre: "Los grupos de invertebrados", desc: "clasifícalos",
      pregunta: "Arrastra cada animal a su grupo 👇",
      cestasNivel: [["artropodos", "moluscos", "gusanos"],
                    ["artropodos", "moluscos", "gusanos", "equino", "cnidarios"],
                    ["artropodos", "moluscos", "gusanos", "equino", "cnidarios", "poriferos"]],
      banco: {
        artropodos: [["la araña", "la mariposa", "la hormiga"], ["el escarabajo", "la abeja", "el cangrejo"], ["el ciempiés", "el escorpión", "la langosta"]],
        moluscos: [["el caracol", "la babosa"], ["la almeja", "el mejillón"], ["el pulpo", "el calamar"]],
        gusanos: [["la lombriz de tierra"], ["la sanguijuela"], ["la planaria", "la tenia"]],
        equino: [["la estrella de mar"], ["el erizo de mar"], ["el pepino de mar"]],
        cnidarios: [["la medusa"], ["la anémona"], ["el coral", "la hidra"]],
        poriferos: [["la esponja de mar"], ["la esponja"], ["la esponja calcárea"]]
      }
    },
    {
      icono: "🦗", nombre: "Tipos de artrópodos", desc: "patas, antenas, caparazón",
      pregunta: "¿Qué tipo de artrópodo es? Fíjate en las patas 👇",
      cestasNivel: [["insecto", "aracnido"], ["insecto", "aracnido", "crustaceo"], ["insecto", "aracnido", "crustaceo", "miriapodo"]],
      banco: {
        insecto: [["la mariposa", "la hormiga", "la abeja"], ["el escarabajo", "el saltamontes", "la mosca"], ["la libélula", "la mariquita", "la avispa"]],
        aracnido: [["la araña", "el escorpión"], ["el alacrán", "la garrapata"], ["el ácaro", "la tarántula"]],
        crustaceo: [["el cangrejo", "el camarón"], ["la langosta", "la cochinilla"], ["el langostino", "la gamba"]],
        miriapodo: [["el ciempiés"], ["el milpiés"], ["el ciempiés", "el milpiés"]]
      }
    },
    {
      icono: "🐌", nombre: "Tipos de moluscos", desc: "gasterópodo, bivalvo, cefalópodo",
      pregunta: "¿Qué tipo de molusco es? 👇",
      cestasNivel: [["gasteropodo", "bivalvo"], ["gasteropodo", "bivalvo", "cefalopodo"], ["gasteropodo", "bivalvo", "cefalopodo"]],
      banco: {
        gasteropodo: [["el caracol", "la babosa"], ["el caracol de jardín"], ["el caracol de mar", "la liebre de mar"]],
        bivalvo: [["la almeja", "la ostra"], ["el mejillón"], ["la concha", "la vieira"]],
        cefalopodo: [["el pulpo"], ["el calamar"], ["la sepia", "el nautilo"]]
      }
    },
    {
      icono: "🪱", nombre: "Tipos de gusanos", desc: "anélido, plano o redondo",
      pregunta: "¿Qué tipo de gusano es por su forma? 👇",
      cestasNivel: [["anelido", "platelminto"], ["anelido", "platelminto", "nematodo"], ["anelido", "platelminto", "nematodo"]],
      banco: {
        anelido: [["la lombriz de tierra"], ["la sanguijuela"], ["el gusano de tubo"]],
        platelminto: [["la planaria"], ["la tenia"], ["la duela"]],
        nematodo: [["la lombriz intestinal"], ["el nemátodo"], ["el oxiuro"]]
      }
    },
    {
      icono: "🦵", nombre: "¿Con patas o sin patas?", desc: "artrópodos vs. los demás",
      pregunta: "¿Tiene patas articuladas o no? 👇",
      cestasNivel: [["conpatas", "sinpatas"], ["conpatas", "sinpatas"], ["conpatas", "sinpatas"]],
      banco: {
        conpatas: [["la araña", "el cangrejo", "la mariposa"], ["el ciempiés", "la abeja", "el escarabajo"], ["la langosta", "el escorpión", "el camarón"]],
        sinpatas: [["el caracol", "la lombriz", "el pulpo"], ["la medusa", "la esponja", "la almeja"], ["la estrella de mar", "el coral", "la babosa"]]
      }
    },
    {
      icono: "💨", nombre: "¿Cómo respiran?", desc: "tráqueas, branquias, piel…",
      pregunta: "¿Con qué respira cada invertebrado? 👇",
      cestasNivel: [["traqueas", "branquias"], ["traqueas", "branquias", "cutanea"], ["traqueas", "branquias", "cutanea", "poros"]],
      banco: {
        traqueas: [["la hormiga", "la mariposa"], ["el escarabajo", "el saltamontes"], ["la araña", "la abeja"]],
        branquias: [["el cangrejo", "el camarón"], ["el pulpo", "la almeja"], ["la langosta", "el caracol de mar"]],
        cutanea: [[], ["la lombriz", "la planaria"], ["la medusa", "la estrella de mar", "la anémona"]],
        poros: [[], [], ["la esponja de mar", "la esponja calcárea"]]
      }
    },
    {
      icono: "🌍", nombre: "¿Dónde viven?", desc: "mar, agua dulce o tierra",
      pregunta: "¿En qué hábitat vive cada uno? 👇",
      cestasNivel: [["mar", "tierra"], ["mar", "tierra", "dulce"], ["mar", "tierra", "dulce"]],
      banco: {
        mar: [["el pulpo", "la medusa", "la estrella de mar"], ["el coral", "la esponja", "el cangrejo"], ["el erizo de mar", "el calamar", "la anémona"]],
        tierra: [["la lombriz de tierra", "el caracol", "la araña"], ["la hormiga", "el ciempiés", "la babosa"], ["el escarabajo", "el escorpión", "el milpiés"]],
        dulce: [[], ["la sanguijuela"], ["el caracol de río", "la planaria de agua dulce"]]
      }
    },
    {
      icono: "🔁", nombre: "¿Cómo se reproducen?", desc: "sexual o asexual",
      pregunta: "¿Cómo se reproduce cada invertebrado? 👇",
      cestasNivel: [["sexual", "asexual"], ["sexual", "asexual"], ["sexual", "asexual"]],
      banco: {
        asexual: [["la hidra", "la esponja"], ["el coral", "la anémona"], ["la planaria", "el pólipo"]],
        sexual: [["la mariposa", "la abeja"], ["el caracol", "la araña", "el cangrejo"], ["la lombriz", "el escarabajo", "el pulpo"]]
      }
    }
  ];

  // ---- Conceptos: ¿verdadero o falso? (mezcla preguntas, no solo clasificar) ----
  // [básico, intermedio, avanzado]; cada uno {t: afirmación, c: ¿es verdad?, exp: porqué}.
  const CONCEPTOS = [
    [
      { t: "Los invertebrados NO tienen huesos.", c: true, exp: "No tienen columna ni esqueleto interno." },
      { t: "Las arañas son insectos.", c: false, exp: "Son arácnidos: tienen 8 patas." },
      { t: "Los insectos tienen 6 patas.", c: true, exp: "Y el cuerpo en 3 partes." },
      { t: "El caracol tiene concha.", c: true, exp: "Es un molusco gasterópodo." },
      { t: "Todos los invertebrados viven en el mar.", c: false, exp: "También hay en tierra y agua dulce." }
    ],
    [
      { t: "Los artrópodos tienen un exoesqueleto (armadura).", c: true, exp: "Una coraza dura por fuera." },
      { t: "Los gusanos respiran por la piel.", c: true, exp: "Por eso su piel debe estar húmeda." },
      { t: "El pulpo es un molusco.", c: true, exp: "Es un cefalópodo, con tentáculos." },
      { t: "Las esponjas pueden caminar y nadar.", c: false, exp: "Viven pegadas a las rocas." },
      { t: "Los crustáceos casi siempre viven en el agua.", c: true, exp: "Como el cangrejo y el camarón." }
    ],
    [
      { t: "La estrella de mar puede regenerar un brazo.", c: true, exp: "Tiene el poder de la regeneración." },
      { t: "Los moluscos tienen huesos por dentro.", c: false, exp: "Su cuerpo es blando; algunos tienen concha." },
      { t: "Muchos gusanos son hermafroditas.", c: true, exp: "Tienen órganos de papá y mamá a la vez." },
      { t: "Los corales se reproducen por gemación.", c: true, exp: "Un brote crece y se desprende." },
      { t: "Las medusas son cnidarios con tentáculos.", c: true, exp: "Atrapan presas con células urticantes." }
    ]
  ];

  // ---- Definiciones: ¿qué es cada cosa? (concepto + opciones) ----
  const DEFINICIONES = [
    [
      { q: "¿Qué es un animal INVERTEBRADO?", c: "Un animal sin huesos ni columna", d: ["Un animal con muchos huesos", "Un tipo de planta"] },
      { q: "Un animal OVÍPARO nace…", c: "de un huevo", d: ["del vientre de su mamá", "de una semilla"] },
      { q: "¿Qué es un MOLUSCO?", c: "Un animal de cuerpo blando", d: ["Un animal con plumas", "Un pez con escamas"] }
    ],
    [
      { q: "¿Qué es el EXOESQUELETO?", c: "Una armadura dura por fuera", d: ["Un hueso por dentro", "Una pluma"] },
      { q: "¿Qué son los ARTRÓPODOS?", c: "Invertebrados con patas articuladas", d: ["Animales con plumas", "Peces sin escamas"] },
      { q: "¿Por dónde respiran los gusanos?", c: "Por la piel", d: ["Por pulmones", "Por branquias"] },
      { q: "¿Qué es un CEFALÓPODO?", c: "Un molusco con tentáculos (pulpo)", d: ["Un insecto con alas", "Un gusano plano"] }
    ],
    [
      { q: "¿Qué es la reproducción ASEXUAL por gemación?", c: "Un brote crece y se separa", d: ["Unir un macho y una hembra", "Poner muchos huevos"] },
      { q: "¿Qué son los GASTERÓPODOS?", c: "Moluscos con concha en espiral", d: ["Moluscos con dos valvas", "Moluscos con tentáculos"] },
      { q: "Que un gusano sea HERMAFRODITA significa que…", c: "tiene órganos de papá y mamá", d: ["vive en el mar", "tiene muchas patas"] },
      { q: "¿Qué grupo tiene forma de estrella (simetría radial)?", c: "Los equinodermos", d: ["Los insectos", "Los gusanos"] }
    ]
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
  // Ronda de concepto: una afirmación y dos botones (Verdadero / Falso).
  const rondaVF = (host, ctrl) => {
    const niv = Juego.nivelIdx();
    const q = itemDe(CONCEPTOS, niv);
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
  // Ronda de definición: una pregunta de concepto y varias opciones.
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
  temas.push({ icono: "🤔", nombre: "¿Verdadero o falso?", desc: "conceptos del manual", total: 6, ronda: rondaVF });
  temas.push({ icono: "📖", nombre: "¿Qué es cada cosa?", desc: "elige la definición", total: 6, ronda: rondaDef });
  window.Invertebrados = Actividad("inv", temas);
})();
