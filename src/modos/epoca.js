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

  /* ---- Conceptos (afinados con el Taller EESS): ¿verdadero o falso? y definiciones ---- */
  const CONCEPTOS = [
    [
      { t: "Los primeros pobladores de América llegaron desde Asia.", c: true, exp: "Por el estrecho de Bering, según la teoría más aceptada." },
      { t: "Los primeros pobladores eran agricultores con tractores.", c: false, exp: "Eran cazadores y recolectores nómadas." },
      { t: "Valdivia hizo la primera cerámica del Ecuador.", c: true, exp: "" },
      { t: "El periodo Paleoindio es el más antiguo.", c: true, exp: "" }
    ],
    [
      { t: "La teoría de Bering dice que cruzaron por el estrecho de Bering.", c: true, exp: "Caminando desde Asia." },
      { t: "Paul Rivet propuso que llegaron en balsas desde la Polinesia.", c: true, exp: "Es la teoría oceánica o polinésica." },
      { t: "La teoría autóctona de Ameghino está aceptada hoy.", c: false, exp: "Fue descartada." },
      { t: "Los incas pertenecen al periodo de Integración.", c: true, exp: "" }
    ],
    [
      { t: "En la glaciación el mar bajó y se formó un puente de tierra (Beringia).", c: true, exp: "Por ahí pasaron desde Asia." },
      { t: "Las sociedades supracomunales formaron señoríos étnicos.", c: true, exp: "Con un jefe o cacique." },
      { t: "La cultura La Tolita es famosa por su 'sol de oro'.", c: true, exp: "Grandes orfebres." },
      { t: "El periodo Formativo es posterior al de Integración.", c: false, exp: "El Formativo es mucho más antiguo." }
    ]
  ];
  const DEFINICIONES = [
    [
      { q: "¿De dónde llegaron los primeros pobladores según la teoría de Bering?", c: "De Asia", d: ["De Europa", "De África"] },
      { q: "¿Cómo conseguían su comida los primeros pobladores?", c: "Cazando y recolectando", d: ["Sembrando trigo", "Comprando en el mercado"] },
      { q: "¿Qué cultura hizo la primera cerámica?", c: "Valdivia", d: ["Los incas", "La Tolita"] }
    ],
    [
      { q: "¿Quién propuso la teoría polinésica (balsas por el Pacífico)?", c: "Paul Rivet", d: ["Alex Hrdlička", "Florentino Ameghino"] },
      { q: "¿Por dónde cruzaron según la teoría de Bering?", c: "Por el estrecho de Bering", d: ["Por el río Amazonas", "Por el mar Caribe"] },
      { q: "¿Cuál es el periodo más antiguo de la época aborigen?", c: "Paleoindio", d: ["Integración", "Formativo"] }
    ],
    [
      { q: "¿Qué es Beringia?", c: "El puente de tierra entre Asia y América", d: ["Una ciudad inca", "Un volcán del Ecuador"] },
      { q: "¿Qué es un señorío étnico?", c: "Un grupo de pueblos con un jefe (cacique)", d: ["Una clase de cerámica", "Un tipo de cultivo"] },
      { q: "¿Qué gran invento marcó el periodo Formativo?", c: "La cerámica", d: ["La rueda", "La escritura"] }
    ]
  ];
  function itemDe(niveles, niv) {
    let arr = niveles[niv];
    for (let k = niv; k >= 0 && (!arr || !arr.length); k--) arr = niveles[k];
    return Juego.azarEl(arr);
  }
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

  window.Epoca = Actividad("epoca", [
    { icono: "🚶", nombre: "¿Cómo llegaron?", desc: "teorías del poblamiento", total: 5,
      ronda: rondaEmparejar(POBLAMIENTO, "Une cada teoría con su idea 👇") },
    { icono: "🕰️", nombre: "Línea de tiempo", desc: "ordena los periodos", total: 5,
      ronda: rondaOrdenar(PERIODOS, "Ordena del MÁS ANTIGUO al más reciente 👇") },
    { icono: "🌾", nombre: "Sociedades agrícolas", desc: "de la más simple a la compleja", total: 5,
      ronda: rondaOrdenar(SOCIEDADES, "Ordena de la sociedad más simple a la más compleja 👇") },
    { icono: "🏺", nombre: "Pueblos y culturas", desc: "cultura y su dato", total: 5,
      ronda: rondaEmparejar(CULTURAS, "Une cada pueblo o cultura con su dato 👇") },
    { icono: "🤔", nombre: "¿Verdadero o falso?", desc: "conceptos del taller", total: 6, ronda: rondaVF },
    { icono: "📖", nombre: "¿Qué es cada cosa?", desc: "elige la definición", total: 6, ronda: rondaDef }
  ]);
})();
