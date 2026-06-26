/* ============================================================
   SEPARA EN SÍLABAS — Lengua (motor manipulativo: ordenar)
   Aparecen las sílabas de una palabra DESORDENADAS y el niño las
   TOCA en orden para reconstruir la palabra. La división silábica
   está etiquetada A MANO en el catálogo (un silabeador automático en
   español es frágil con diptongos/hiatos). El catálogo escala con el
   nivel del perfil (Juego.nivelIdx()):
     · básico:     palabras de 2 sílabas
     · intermedio: palabras de 3 sílabas
     · avanzado:   palabras de 4+ sílabas
   ============================================================ */
(function () {
  // Bancos por nivel [básico, intermedio, avanzado]. Español del Ecuador, ~9 años.
  // Cada palabra es un arreglo con sus sílabas EN ORDEN, separadas a mano.
  const BANCO = [
    // básico — 2 sílabas
    [
      ["ga", "to"], ["ca", "sa"], ["lu", "na"], ["me", "sa"], ["so", "pa"],
      ["pa", "to"], ["ra", "na"], ["si", "lla"], ["fo", "ca"], ["o", "so"],
      ["pe", "rro"], ["ni", "ño"], ["ár", "bol"], ["li", "bro"], ["que", "so"],
      ["le", "che"], ["bo", "ca"], ["ma", "no"], ["de", "do"], ["sa", "po"]
    ],
    // intermedio — 3 sílabas
    [
      ["pe", "lo", "ta"], ["ca", "mi", "no"], ["ven", "ta", "na"], ["za", "pa", "to"],
      ["co", "li", "brí"], ["ca", "ba", "llo"], ["ca", "mi", "sa"], ["mon", "ta", "ña"],
      ["pe", "rri", "to"], ["bo", "te", "lla"],
      ["pá", "ja", "ro"], ["ca", "be", "za"], ["to", "ma", "te"], ["ba", "lle", "na"],
      ["co", "ne", "jo"], ["ga", "lli", "na"], ["pa", "ra", "guas"], ["ca", "ra", "col"],
      ["mo", "chi", "la"], ["es", "cue", "la"]
    ],
    // avanzado — 4+ sílabas
    [
      ["ma", "ri", "po", "sa"], ["bi", "ci", "cle", "ta"], ["com", "pu", "ta", "do", "ra"],
      ["re", "fri", "ge", "ra", "do", "ra"], ["he", "li", "cóp", "te", "ro"],
      ["e", "le", "fan", "te"], ["te", "le", "vi", "sor"], ["es", "cue", "li", "ta"],
      ["cho", "co", "la", "te"], ["a", "gua", "ca", "te"],
      ["man", "da", "ri", "na"], ["ma", "te", "má", "ti", "cas"], ["di", "no", "sau", "rio"],
      ["a", "ni", "ma", "les"], ["bi", "blio", "te", "ca"], ["ca", "len", "da", "rio"],
      ["es", "tu", "dian", "te"], ["su", "per", "mer", "ca", "do"],
      ["ve", "te", "ri", "na", "rio"], ["lo", "co", "mo", "to", "ra"]
    ]
  ];

  function ronda(host, ctrl) {
    const niv = Juego.nivelIdx();
    let banco = BANCO[niv];
    for (let k = niv; k >= 0 && (!banco || !banco.length); k--) banco = BANCO[k];
    const silabas = ctrl.azarEl(banco);
    const palabra = silabas.join("").toUpperCase();
    Arrastrar.ordenar(host, ctrl, {
      pregunta: "Forma la palabra: <b>" + palabra + "</b> — toca sus sílabas en orden 👇",
      correcto: silabas
    });
  }

  window.Silabas = Actividad("silaba", [
    { icono: "🧱", nombre: "Separa en sílabas", desc: "forma la palabra sílaba a sílaba", total: 8, ronda: ronda }
  ]);
})();
