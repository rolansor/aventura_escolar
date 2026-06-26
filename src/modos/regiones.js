/* ============================================================
   REGIONES, RELIEVES Y TERRITORIO — Estudios Sociales (Quinto, Taller 1)
   Geografía manipulativa del Ecuador: regiones naturales, relieves
   y organización territorial (de lo más grande a lo más pequeño).
   Reutiliza los motores: Actividad + Arrastrar.clasificar / ordenar.
   Catálogo INLINE por 3 niveles (Juego.nivelIdx()).
   ============================================================ */
(function () {
  // ---- Tema 1: Regiones naturales del Ecuador ----
  // cestas (id → emoji/nombre)
  const CESTAS_REG = [
    { id: "costa", nombre: "Costa", emoji: "🏖️" },
    { id: "sierra", nombre: "Sierra", emoji: "⛰️" },
    { id: "amazonia", nombre: "Amazonía", emoji: "🌳" },
    { id: "insular", nombre: "Insular", emoji: "🐢" }
  ];
  // banco por nivel: para cada región, lista de ítems posibles. [básico, intermedio, avanzado]
  const BANCO_REG = [
    {
      // Básico: PROVINCIAS por región natural
      costa: ["Guayas", "Manabí", "Esmeraldas", "Los Ríos", "El Oro", "Santa Elena", "Santo Domingo de los Tsáchilas"],
      sierra: ["Pichincha", "Azuay", "Chimborazo", "Cotopaxi", "Tungurahua", "Imbabura", "Loja", "Cañar", "Bolívar", "Carchi"],
      amazonia: ["Napo", "Pastaza", "Morona Santiago", "Sucumbíos", "Orellana", "Zamora Chinchipe"],
      insular: ["Galápagos"]
    },
    {
      // Intermedio: ANIMALES típicos de cada región
      costa: ["la fragata", "la ballena jorobada", "el cangrejo rojo", "la garza blanca", "el mono aullador"],
      sierra: ["el cóndor", "el oso de anteojos", "la llama", "la vicuña", "el lobo de páramo", "el colibrí"],
      amazonia: ["el delfín rosado", "el jaguar", "la anaconda", "el tapir (danta)", "el guacamayo", "la boa"],
      insular: ["la iguana marina", "la tortuga gigante", "el piquero de patas azules", "el lobo marino", "el pingüino de Galápagos"]
    },
    {
      // Avanzado: PLATOS, CLIMA y PAISAJES de cada región
      costa: ["el encebollado", "clima cálido", "el ceviche", "las playas", "el bolón de verde"],
      sierra: ["el hornado", "clima frío", "los páramos", "los volcanes nevados", "la fanesca"],
      amazonia: ["el maito", "clima cálido y lluvioso", "la selva tropical", "los ríos caudalosos", "la chicha de yuca"],
      insular: ["especies únicas", "las islas volcánicas", "el clima seco", "playas con lobos marinos", "los bosques de manglar"]
    }
  ];

  // ---- Tema 2: Relieves del Ecuador ----
  const CESTAS_REL = [
    { id: "volcan", nombre: "Volcán", emoji: "🌋" },
    { id: "rio", nombre: "Río", emoji: "🌊" },
    { id: "cordillera", nombre: "Cordillera", emoji: "🏔️" },
    { id: "llanura", nombre: "Llanura", emoji: "🌾" }
  ];
  const BANCO_REL = {
    volcan: ["Chimborazo", "Cotopaxi", "Tungurahua", "Cayambe", "Pichincha", "Antisana", "Sangay", "El Reventador", "Cotacachi", "Imbabura", "El Altar", "Sumaco"],
    rio: ["Guayas", "Napo", "Esmeraldas", "Daule", "Pastaza", "Babahoyo", "Coca", "Aguarico", "Zamora", "Jubones", "Chone", "Santiago"],
    cordillera: ["Occidental", "Real (Oriental)", "de los Andes", "Subandina", "del Cóndor"],
    llanura: ["llanura costera", "llanura amazónica", "llanura del Guayas", "sabanas amazónicas"]
  };

  // ---- Tema 3: Organización territorial (de mayor a menor) ----
  const TERRITORIO = [
    ["País: Ecuador", "Provincia: Pichincha", "Cantón: Quito", "Parroquia: Cumbayá"],
    ["País: Ecuador", "Región: Sierra", "Provincia: Pichincha", "Cantón: Quito", "Parroquia: Cumbayá"],
    ["Continente: América", "País: Ecuador", "Región: Sierra", "Provincia: Pichincha", "Cantón: Quito", "Parroquia: Cumbayá"]
  ];

  // Toma UN ítem al azar por cada cesta indicada (de su banco del nivel)
  function unoPorCesta(banco, cestas, ctrl) {
    return cestas.map((c) => ({ txt: ctrl.azarEl(banco[c.id]), cesta: c.id }));
  }

  function rondaRegiones(host, ctrl) {
    const banco = Juego.porNivel(BANCO_REG);
    const items = unoPorCesta(banco, CESTAS_REG, ctrl);
    Arrastrar.clasificar(host, ctrl, {
      pregunta: "¿De qué región es cada uno? Arrástralo a su lugar 👇",
      cestas: CESTAS_REG,
      items: ctrl.mezclar(items)
    });
  }

  function rondaRelieves(host, ctrl) {
    // básico: 3 cestas (Volcán, Río, Cordillera); intermedio/avanzado: las 4
    const cestas = Juego.nivelIdx() === 0 ? CESTAS_REL.slice(0, 3) : CESTAS_REL;
    const items = unoPorCesta(BANCO_REL, cestas, ctrl);
    Arrastrar.clasificar(host, ctrl, {
      pregunta: "¿Qué tipo de relieve es cada uno? 👇",
      cestas: cestas,
      items: ctrl.mezclar(items)
    });
  }

  function rondaTerritorio(host, ctrl) {
    const correcto = Juego.porNivel(TERRITORIO);
    Arrastrar.ordenar(host, ctrl, {
      pregunta: "Ordena de lo MÁS GRANDE a lo más pequeño 👇",
      correcto: correcto.slice()
    });
  }

  window.Regiones = Actividad("regiones", [
    { icono: "🌎", nombre: "Regiones naturales", desc: "Costa, Sierra, Amazonía e Insular", total: 6,
      ronda: rondaRegiones },
    { icono: "⛰️", nombre: "Relieves del Ecuador", desc: "volcán, río, cordillera, llanura", total: 6,
      ronda: rondaRelieves },
    { icono: "🪆", nombre: "Organización territorial", desc: "de lo más grande a lo más pequeño", total: 6,
      ronda: rondaTerritorio }
  ]);
})();
