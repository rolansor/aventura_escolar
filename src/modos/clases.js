/* ============================================================
   CLASES DE PALABRAS — Lengua (motor manipulativo: clasificar)
   El niño arrastra cada palabra a su grupo gramatical. El catálogo
   escala con el nivel del perfil (Juego.nivelIdx()):
     · básico:     sustantivo, adjetivo, verbo            (3 grupos)
     · intermedio: + artículo                              (4 grupos)
     · avanzado:   + pronombre, adverbio                   (6 grupos)
   y además usa palabras más difíciles en los niveles altos.
   ============================================================ */
(function () {
  const GRUPOS = {
    articulo:   { nombre: "Artículo",   emoji: "🔖" },
    sustantivo: { nombre: "Sustantivo", emoji: "🧍" },
    adjetivo:   { nombre: "Adjetivo",   emoji: "🎨" },
    verbo:      { nombre: "Verbo",      emoji: "🏃" },
    pronombre:  { nombre: "Pronombre",  emoji: "👉" },
    adverbio:   { nombre: "Adverbio",   emoji: "⏱️" }
  };

  // Bancos por nivel [básico, intermedio, avanzado]. Español del Ecuador, ~9 años.
  const POOL = {
    sustantivo: [
      ["perro", "casa", "mesa", "Nelson", "escuela", "pelota", "mamá", "río"],
      ["maestra", "cuaderno", "montaña", "Quito", "guitarra", "mercado", "colibrí"],
      ["libertad", "amistad", "Ecuador", "alegría", "esperanza", "naturaleza"]
    ],
    adjetivo: [
      ["grande", "rojo", "feliz", "alto", "bonito", "frío"],
      ["valiente", "amarillo", "curioso", "enorme", "tranquilo", "rápido"],
      ["transparente", "silencioso", "gigantesco", "brillante", "amable"]
    ],
    verbo: [
      ["correr", "saltar", "comer", "jugar", "dormir", "cantar"],
      ["escribir", "aprender", "cocinar", "nadar", "escuchar", "pintar"],
      ["construir", "imaginar", "resolver", "investigar", "agradecer"]
    ],
    articulo: [
      [],
      ["el", "la", "los", "las", "un", "una"],
      ["el", "la", "los", "las", "un", "una", "unos", "unas"]
    ],
    pronombre: [
      [], [],
      ["yo", "tú", "él", "ella", "nosotros", "ellos", "ustedes"]
    ],
    adverbio: [
      [], [],
      ["ahora", "aquí", "siempre", "rápido", "ayer", "muy", "nunca", "despacio"]
    ]
  };

  const GRUPOS_NIVEL = [
    ["sustantivo", "adjetivo", "verbo"],
    ["articulo", "sustantivo", "adjetivo", "verbo"],
    ["articulo", "sustantivo", "adjetivo", "verbo", "pronombre", "adverbio"]
  ];

  function palabraDe(id, niv) {
    const pool = POOL[id];
    let arr = pool[niv];
    for (let k = niv; k >= 0 && (!arr || !arr.length); k--) arr = pool[k];
    return Juego.azarEl(arr);
  }

  function ronda(host, ctrl) {
    const niv = Juego.nivelIdx();
    const ids = GRUPOS_NIVEL[niv];
    const cestas = ids.map((id) => ({ id: id, nombre: GRUPOS[id].nombre, emoji: GRUPOS[id].emoji }));
    const items = ids.map((id) => ({ txt: palabraDe(id, niv), cesta: id }));
    Arrastrar.clasificar(host, ctrl, {
      pregunta: "¿Qué clase de palabra es cada una? Arrástrala a su grupo 👇",
      cestas: cestas, items: ctrl.mezclar(items)
    });
  }

  window.Clases = Actividad("clases", [
    { icono: "🔤", nombre: "Clasifica las palabras", desc: "sustantivo, adjetivo, verbo…", total: 8, ronda: ronda }
  ]);
})();
