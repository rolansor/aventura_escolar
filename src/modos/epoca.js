/* ============================================================
   ÉPOCA ABORIGEN — Estudios Sociales (Quinto, Unidad 1)
   Historia manipulativa: poblamiento de América y sus teorías,
   periodización, sociedades agrícolas y pueblos/culturas.
   Reutiliza los motores: Actividad + Arrastrar.emparejar / ordenar.
   Catálogo INLINE por 3 niveles (Juego.nivelIdx()).
   Basado en el Taller 1 y en "Talento en Sociales 5" / Ayala Mora 5.
   ============================================================ */
(function () {
  // ---- Tema 1: ¿Cómo llegaron? Teorías del poblamiento de América ----
  // [básico, intermedio, avanzado]
  const POBLAMIENTO = [
    [
      { a: "Teoría de Bering", b: "Vinieron de Asia caminando" },
      { a: "Teoría Polinésica", b: "Llegaron en balsas por el mar" },
      { a: "Primeros pobladores", b: "Cazadores y recolectores" },
      { a: "Estrecho de Bering", b: "El mar bajó y se formó un puente" }
    ],
    [
      { a: "Teoría de Bering", b: "Desde Asia por el estrecho de hielo" },
      { a: "Teoría Polinésica", b: "Desde la Polinesia en balsas" },
      { a: "Teoría Australiana", b: "Desde Australia por la Antártida" },
      { a: "Teoría Autóctona", b: "Nació en América (ya descartada)" }
    ],
    [
      { a: "Teoría de Bering", b: "Alex Hrdlička" },
      { a: "Teoría Polinésica", b: "Paul Rivet" },
      { a: "Teoría Australiana", b: "Méndez Correa" },
      { a: "Teoría Autóctona", b: "Florentino Ameghino" }
    ]
  ];

  // ---- Tema 2: Línea de tiempo de la Época Aborigen (orden cronológico) ----
  const PERIODOS = [
    ["Paleoindio: cazadores y recolectores", "Formativo: primera cerámica (Valdivia)", "Integración: confederaciones y señoríos"],
    ["Paleoindio: grandes cazadores", "Formativo: agricultura y cerámica", "Desarrollo Regional: orfebrería y comercio", "Integración: grandes confederaciones"],
    ["Paleoindio: grandes cazadores", "Formativo: agricultura y cerámica", "Desarrollo Regional: orfebrería y comercio", "Integración: grandes confederaciones"]
  ];

  // ---- Tema 3: Sociedades agrícolas (de la más simple a la más compleja) ----
  const SOCIEDADES = [
    ["Incipientes: primeras aldeas agrícolas", "Superiores: terrazas y canales de riego", "Supracomunales: señoríos étnicos"],
    ["Incipientes: primeras aldeas agrícolas", "Superiores: terrazas y canales de riego", "Supracomunales: señoríos y comercio"],
    ["Incipientes: primeras aldeas agrícolas", "Superiores: terrazas y canales de riego", "Supracomunales: señoríos y comercio"]
  ];

  // ---- Tema 4: Pueblos y culturas del Ecuador ↔ su dato ----
  const CULTURAS = [
    [
      { a: "Valdivia", b: "Primera cerámica" },
      { a: "Las Vegas", b: "Los Amantes de Sumpa" },
      { a: "La Tolita", b: "Sol de oro" },
      { a: "Cañari", b: "Sierra sur" }
    ],
    [
      { a: "Valdivia", b: "Venus de Valdivia" },
      { a: "Las Vegas", b: "Los Amantes de Sumpa" },
      { a: "La Tolita", b: "Sol de oro" },
      { a: "Chorrera", b: "Botellas-silbato" },
      { a: "Cañari", b: "Ingapirca, en la Sierra sur" }
    ],
    [
      { a: "Valdivia", b: "Venus de Valdivia" },
      { a: "Machalilla", b: "Botellas con asa de estribo" },
      { a: "Chorrera", b: "Botellas-silbato" },
      { a: "La Tolita", b: "Trabajó el oro y el platino" },
      { a: "Jama-Coaque", b: "Figuras de cerámica muy adornadas" },
      { a: "Bahía", b: "El gigante de Bahía" },
      { a: "Manteño-Huancavilca", b: "Comercio en balsas" },
      { a: "Quitu-Cara", b: "Sierra de Quito" },
      { a: "Puruhá", b: "Sierra central (Chimborazo)" }
    ]
  ];

  function rondaEmparejar(bank, pregunta) {
    return function (host, ctrl) {
      const pares = Juego.porNivel(bank);
      Arrastrar.emparejar(host, ctrl, { pregunta: pregunta, pares: pares.map((p) => ({ a: p.a, b: p.b })) });
    };
  }
  function rondaOrdenar(secs, pregunta) {
    return function (host, ctrl) {
      const correcto = Juego.porNivel(secs);
      Arrastrar.ordenar(host, ctrl, { pregunta: pregunta, correcto: correcto.slice() });
    };
  }

  window.Epoca = Actividad("epoca", [
    { icono: "🚶", nombre: "¿Cómo llegaron?", desc: "teorías del poblamiento", total: 5,
      ronda: rondaEmparejar(POBLAMIENTO, "Une cada teoría con su idea 👇") },
    { icono: "🕰️", nombre: "Línea de tiempo", desc: "ordena los periodos", total: 5,
      ronda: rondaOrdenar(PERIODOS, "Ordena del MÁS ANTIGUO al más reciente 👇") },
    { icono: "🌾", nombre: "Sociedades agrícolas", desc: "de la más simple a la compleja", total: 5,
      ronda: rondaOrdenar(SOCIEDADES, "Ordena de la sociedad más simple a la más compleja 👇") },
    { icono: "🏺", nombre: "Pueblos y culturas", desc: "cultura y su dato", total: 5,
      ronda: rondaEmparejar(CULTURAS, "Une cada pueblo o cultura con su dato 👇") }
  ]);
})();
