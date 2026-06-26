/* ============================================================
   CUIDA LA FAUNA — Ciencias Naturales (Quinto, Taller 1: Animales)
   Amenazas, protección y huella ecológica. Destrezas CN.3.1.4 y
   CS.3.3.18. Motor manipulativo (arrastrar). Dos temas:
     1) "Animales en peligro": emparejar animal amenazado ↔ región.
     2) "¿Ayuda o daña?": clasificar acciones en Ayuda 🌱 / Daña 🚫.
   Catálogo INLINE por 3 niveles (Juego.nivelIdx()): suben las
   parejas y aparecen ejemplos menos obvios en los niveles altos.
   ============================================================ */
(function () {

  // -- Tema 1: animal amenazado del Ecuador ↔ su región (parejas).
  // Por nivel sube el número de parejas y entran animales menos obvios.
  const PARES_NIVEL = [
    // básico (3): los más claros
    [
      { a: "cóndor andino 🦅", b: "Sierra" },
      { a: "tortuga gigante 🐢", b: "Galápagos" },
      { a: "jaguar 🐆", b: "Amazonía" }
    ],
    // intermedio (4)
    [
      { a: "cóndor andino 🦅", b: "Sierra" },
      { a: "oso de anteojos 🐻", b: "Sierra" },
      { a: "tapir (danta) 🐗", b: "Amazonía" },
      { a: "iguana marina 🦎", b: "Galápagos" }
    ],
    // avanzado (5)
    [
      { a: "oso de anteojos 🐻", b: "Sierra" },
      { a: "mono araña 🐒", b: "Amazonía" },
      { a: "tiburón martillo 🦈", b: "Galápagos" },
      { a: "fragata 🐦", b: "Costa" },
      { a: "manatí 🦭", b: "Amazonía" }
    ]
  ];

  function rondaPeligro(host, ctrl) {
    const pares = Juego.porNivel(PARES_NIVEL);
    Arrastrar.emparejar(host, ctrl, {
      pregunta: "Une cada animal amenazado con su región 👇",
      pares: pares
    });
  }

  // -- Tema 2: acciones que AYUDAN o DAÑAN a los animales (huella ecológica).
  // Listas por nivel: en los niveles altos hay más opciones y menos obvias.
  const AYUDA_NIVEL = [
    ["sembrar árboles", "reciclar la basura", "cuidar los ríos"],
    ["ahorrar agua", "apagar la luz", "no botar plástico", "sembrar árboles"],
    ["usar la bicicleta", "reciclar la basura", "ahorrar agua", "cuidar los ríos", "apagar la luz"]
  ];
  const DANA_NIVEL = [
    ["botar basura al río", "cazar animales", "talar el bosque"],
    ["desperdiciar el agua", "dejar la llave abierta", "cazar animales", "botar basura al río"],
    ["quemar basura", "talar el bosque", "dejar la llave abierta", "desperdiciar el agua", "botar basura al río"]
  ];

  function rondaHuella(host, ctrl) {
    const niv = Juego.nivelIdx();
    const cestas = [
      { id: "ayuda", nombre: "Ayuda", emoji: "🌱" },
      { id: "dana",  nombre: "Daña",  emoji: "🚫" }
    ];
    const items = [
      { txt: Juego.azarEl(AYUDA_NIVEL[niv]), cesta: "ayuda" },
      { txt: Juego.azarEl(DANA_NIVEL[niv]),  cesta: "dana" }
    ];
    Arrastrar.clasificar(host, ctrl, {
      pregunta: "¿Esta acción AYUDA o DAÑA a los animales? 👇",
      cestas: cestas,
      items: ctrl.mezclar(items)
    });
  }

  window.CuidaFauna = Actividad("fauna", [
    { icono: "🐾", nombre: "Animales en peligro", desc: "únelos con su región",
      total: 6, ronda: rondaPeligro },
    { icono: "♻️", nombre: "¿Ayuda o daña?", desc: "cuida la naturaleza",
      total: 8, ronda: rondaHuella }
  ]);
})();
