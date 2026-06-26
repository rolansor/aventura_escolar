/* ============================================================
   FAMILIAS DE PALABRAS — Lengua (motor manipulativo: clasificar)
   El niño arrastra cada palabra derivada a su FAMILIA (raíz). Cada
   cesta es una familia; cada item es una palabra de esa raíz. El
   catálogo escala con el nivel del perfil (Juego.nivelIdx()):
     · básico:     3 familias fáciles  (pan, flor, mar)
     · intermedio: 4 familias          (+ palabras más largas)
     · avanzado:   5 familias          (derivadas menos obvias)
   ============================================================ */
(function () {
  // Cada familia: raíz (id), nombre con mayúscula, emoji y derivadas.
  // Bancos por nivel [básico, intermedio, avanzado]. Español del Ecuador, ~9 años.
  const FAMILIAS = [
    // ----- básico (idx 0): 3 familias fáciles -----
    [
      { id: "pan",  nombre: "Pan",  emoji: "🍞", derivadas: ["pan", "panadero", "panadería"] },
      { id: "flor", nombre: "Flor", emoji: "🌸", derivadas: ["flor", "florero", "florista"] },
      { id: "mar",  nombre: "Mar",  emoji: "🌊", derivadas: ["mar", "marino", "marinero"] }
    ],
    // ----- intermedio (idx 1): 4 familias -----
    [
      { id: "libro",  nombre: "Libro",  emoji: "📚", derivadas: ["libro", "librería", "librero"] },
      { id: "sol",    nombre: "Sol",    emoji: "☀️", derivadas: ["sol", "solar", "soleado"] },
      { id: "leche",  nombre: "Leche",  emoji: "🥛", derivadas: ["leche", "lechero", "lechería"] },
      { id: "zapato", nombre: "Zapato", emoji: "👟", derivadas: ["zapato", "zapatero", "zapatería"] }
    ],
    // ----- avanzado (idx 2): 5 familias con derivadas menos obvias -----
    [
      { id: "tierra",  nombre: "Tierra",  emoji: "🌎", derivadas: ["tierra", "terrestre", "enterrar", "terreno"] },
      { id: "agua",    nombre: "Agua",    emoji: "💧", derivadas: ["agua", "acuático", "aguacero", "aguar"] },
      { id: "arbol",   nombre: "Árbol",   emoji: "🌳", derivadas: ["árbol", "arboleda", "arbolito"] },
      { id: "deporte", nombre: "Deporte", emoji: "⚽", derivadas: ["deporte", "deportista", "deportivo"] },
      { id: "mano",    nombre: "Mano",    emoji: "✋", derivadas: ["mano", "manualidad", "manija", "manazas"] }
    ]
  ];

  function ronda(host, ctrl) {
    const niv = Juego.nivelIdx();
    const fams = FAMILIAS[niv] || FAMILIAS[0];
    const cestas = fams.map((f) => ({ id: f.id, nombre: f.nombre, emoji: f.emoji }));
    const items = fams.map((f) => ({ txt: ctrl.azarEl(f.derivadas), cesta: f.id }));
    Arrastrar.clasificar(host, ctrl, {
      pregunta: "¿De qué familia es cada palabra? Arrástrala a su raíz 👇",
      cestas: cestas, items: ctrl.mezclar(items)
    });
  }

  window.Familia = Actividad("fam", [
    { icono: "🌳", nombre: "Familias de palabras", desc: "Palabras de una misma raíz", total: 8, ronda: ronda }
  ]);
})();
