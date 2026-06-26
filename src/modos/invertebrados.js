/* ============================================================
   LOS INVERTEBRADOS — Ciencias Naturales (motor manipulativo: clasificar)
   Basado en el "Manual de exploración: el reino de los invertebrados".
   El niño arrastra cada animal a su grupo. Los temas van de 3 grupos
   (más fáciles) al reto de los 6 grupos.
   ============================================================ */
(function () {
  // Los 6 grandes grupos de invertebrados del manual.
  const CESTAS = {
    artropodos: { id: "artropodos", nombre: "Artrópodos", emoji: "🦗" },
    moluscos:   { id: "moluscos",   nombre: "Moluscos",   emoji: "🐌" },
    gusanos:    { id: "gusanos",    nombre: "Gusanos",    emoji: "🪱" },
    equino:     { id: "equino",     nombre: "Equinodermos", emoji: "⭐" },
    cnidarios:  { id: "cnidarios",  nombre: "Cnidarios",  emoji: "🪼" },
    poriferos:  { id: "poriferos",  nombre: "Poríferos",  emoji: "🧽" }
  };
  // Ejemplos claros de cada grupo (apropiados para ~9 años).
  const BANCO = {
    artropodos: ["la araña", "el escarabajo", "el cangrejo", "la mariposa", "la abeja", "el ciempiés", "la hormiga", "la langosta"],
    moluscos:   ["el caracol", "la babosa", "la almeja", "la ostra", "el mejillón", "el pulpo", "el calamar"],
    gusanos:    ["la lombriz de tierra", "la sanguijuela", "la planaria", "la tenia"],
    equino:     ["la estrella de mar", "el erizo de mar", "el pepino de mar"],
    cnidarios:  ["la medusa", "la anémona", "el coral", "la hidra"],
    poriferos:  ["la esponja de mar", "la esponja calcárea"]
  };

  // Cada tema es un subconjunto de grupos (los `ids` de las cestas).
  const TEMAS = [
    { icono: "🌱", nombre: "Tierra firme", desc: "artrópodos, moluscos, gusanos",
      pregunta: "Arrastra cada animal a su grupo 👇",
      ids: ["artropodos", "moluscos", "gusanos"] },
    { icono: "🌊", nombre: "Del mar", desc: "equinodermos, cnidarios, esponjas",
      pregunta: "Estos viven en el mar. ¡A su grupo! 👇",
      ids: ["equino", "cnidarios", "poriferos"] },
    { icono: "🔎", nombre: "Los 6 grupos", desc: "el reto completo",
      pregunta: "Clasifica cada uno en su grupo 👇",
      ids: ["artropodos", "moluscos", "gusanos", "equino", "cnidarios", "poriferos"] }
  ];

  const ronda = (t) => (host, ctrl) => {
    const cestas = t.ids.map((id) => CESTAS[id]);
    const items = t.ids.map((id) => ({ txt: ctrl.azarEl(BANCO[id]), cesta: id }));
    Arrastrar.clasificar(host, ctrl, { pregunta: t.pregunta, cestas: cestas, items: ctrl.mezclar(items) });
  };

  window.Invertebrados = Actividad("inv", TEMAS.map((t) =>
    ({ icono: t.icono, nombre: t.nombre, desc: t.desc, total: 6, ronda: ronda(t) })));
})();
