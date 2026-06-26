/* ============================================================
   COMPRENSIÓN LECTORA — Lengua (motor de opción múltiple: MC)
   Banco de LECTURAS por nivel (Juego.nivelIdx() -> 0/1/2). Cada
   pregunta de la ronda es autocontenida: trae su propio texto en
   `html` (área <px>-extra) + una pregunta de opción múltiple.
     · básico:     textos de 1 frase, preguntas LITERALES.
     · intermedio: 2 frases, literales + detalle.
     · avanzado:   2–3 frases, alguna pregunta de INFERENCIA.
   Contexto del Ecuador (regiones, fauna, mercados…), ~9 años.
   ============================================================ */
(function () {
  // LECTURAS[nivel] = [ { texto, preguntas:[{ q, opciones:[...], correcta }] }, ... ]
  const LECTURAS = [
    // ---------- BÁSICO: 1 frase, preguntas literales ----------
    [
      {
        texto: "El cóndor vive en los Andes y es el ave más grande del Ecuador.",
        preguntas: [
          { q: "¿Dónde vive el cóndor?", opciones: ["En los Andes", "En el mar", "En la ciudad"], correcta: "En los Andes" },
          { q: "¿Qué es el cóndor?", opciones: ["El ave más grande del Ecuador", "Un pez", "Una flor"], correcta: "El ave más grande del Ecuador" }
        ]
      },
      {
        texto: "En el mercado de Otavalo se venden ponchos de colores y frutas frescas.",
        preguntas: [
          { q: "¿Qué se vende en el mercado de Otavalo?", opciones: ["Ponchos y frutas", "Carros", "Computadoras"], correcta: "Ponchos y frutas" },
          { q: "¿Cómo son los ponchos?", opciones: ["De colores", "Rotos", "Invisibles"], correcta: "De colores" }
        ]
      },
      {
        texto: "El colibrí es un ave muy pequeña que toma el néctar de las flores.",
        preguntas: [
          { q: "¿Qué toma el colibrí?", opciones: ["El néctar de las flores", "Agua del río", "Leche"], correcta: "El néctar de las flores" },
          { q: "¿Cómo es el colibrí?", opciones: ["Muy pequeño", "Muy grande", "Muy gordo"], correcta: "Muy pequeño" }
        ]
      },
      {
        texto: "En las islas Galápagos viven tortugas gigantes muy antiguas.",
        preguntas: [
          { q: "¿Qué animales viven en Galápagos?", opciones: ["Tortugas gigantes", "Elefantes", "Camellos"], correcta: "Tortugas gigantes" },
          { q: "¿Cómo son esas tortugas?", opciones: ["Gigantes y antiguas", "Pequeñas y nuevas", "Rápidas y azules"], correcta: "Gigantes y antiguas" }
        ]
      },
      {
        texto: "El río Napo está en la Amazonía y por él navegan canoas.",
        preguntas: [
          { q: "¿Dónde está el río Napo?", opciones: ["En la Amazonía", "En la Sierra", "En Galápagos"], correcta: "En la Amazonía" },
          { q: "¿Qué navega por el río Napo?", opciones: ["Canoas", "Aviones", "Trenes"], correcta: "Canoas" }
        ]
      }
    ],

    // ---------- INTERMEDIO: 2 frases, literal + detalle ----------
    [
      {
        texto: "Nelson fue al mercado con su mamá a comprar frutas. Compraron guineos, naranjas y una piña grande.",
        preguntas: [
          { q: "¿Con quién fue Nelson al mercado?", opciones: ["Con su mamá", "Con su maestra", "Solo"], correcta: "Con su mamá" },
          { q: "¿Qué fruta grande compraron?", opciones: ["Una piña", "Una sandía", "Un melón"], correcta: "Una piña" }
        ]
      },
      {
        texto: "La ballena jorobada llega cada año a las costas de Manabí. Allí los turistas la observan desde los botes.",
        preguntas: [
          { q: "¿A dónde llega la ballena jorobada?", opciones: ["A las costas de Manabí", "A la Sierra", "A la Amazonía"], correcta: "A las costas de Manabí" },
          { q: "¿Desde dónde la observan los turistas?", opciones: ["Desde los botes", "Desde un avión", "Desde la playa"], correcta: "Desde los botes" }
        ]
      },
      {
        texto: "El volcán Cotopaxi es uno de los más altos del mundo. Su cima está siempre cubierta de nieve.",
        preguntas: [
          { q: "¿Cómo es el volcán Cotopaxi?", opciones: ["Uno de los más altos del mundo", "Muy pequeño", "Un río"], correcta: "Uno de los más altos del mundo" },
          { q: "¿Qué cubre su cima?", opciones: ["Nieve", "Arena", "Flores"], correcta: "Nieve" }
        ]
      },
      {
        texto: "En la Sierra se cultiva mucha papa de distintos colores. Con ella se prepara el rico locro.",
        preguntas: [
          { q: "¿Qué se cultiva mucho en la Sierra?", opciones: ["Papa", "Banano", "Cacao"], correcta: "Papa" },
          { q: "¿Qué plato se prepara con la papa?", opciones: ["El locro", "El ceviche", "El bolón"], correcta: "El locro" }
        ]
      },
      {
        texto: "El oso de anteojos vive en los bosques de la Sierra. Es el único oso que habita en el Ecuador.",
        preguntas: [
          { q: "¿Dónde vive el oso de anteojos?", opciones: ["En los bosques de la Sierra", "En el mar", "En el desierto"], correcta: "En los bosques de la Sierra" },
          { q: "¿Qué tiene de especial este oso?", opciones: ["Es el único oso del Ecuador", "Es de color azul", "Vive en la ciudad"], correcta: "Es el único oso del Ecuador" }
        ]
      }
    ],

    // ---------- AVANZADO: 2–3 frases, alguna de INFERENCIA ----------
    [
      {
        texto: "María guardó su paraguas en la mochila antes de salir de casa. El cielo de Quito estaba lleno de nubes oscuras.",
        preguntas: [
          { q: "¿Por qué María llevó el paraguas?", opciones: ["Porque parece que va a llover", "Porque hace mucho sol", "Porque es un juguete"], correcta: "Porque parece que va a llover" },
          { q: "¿Cómo estaba el cielo de Quito?", opciones: ["Lleno de nubes oscuras", "Despejado y azul", "Con estrellas"], correcta: "Lleno de nubes oscuras" }
        ]
      },
      {
        texto: "El cacao del Ecuador es famoso en el mundo entero. Con él se fabrica un chocolate muy fino que se exporta a muchos países.",
        preguntas: [
          { q: "¿Cuál es la idea principal del texto?", opciones: ["El cacao ecuatoriano es famoso y de buena calidad", "El chocolate es barato", "El cacao se da en la nieve"], correcta: "El cacao ecuatoriano es famoso y de buena calidad" },
          { q: "¿Qué se fabrica con el cacao?", opciones: ["Chocolate fino", "Pan", "Queso"], correcta: "Chocolate fino" }
        ]
      },
      {
        texto: "Nelson estudió toda la semana para la prueba de Matemáticas. Cuando vio su nota, saltó de alegría y abrazó a su mamá.",
        preguntas: [
          { q: "¿Qué nota crees que sacó Nelson?", opciones: ["Una nota muy buena", "Una nota muy mala", "No presentó la prueba"], correcta: "Una nota muy buena" },
          { q: "¿Qué hizo Nelson cuando vio su nota?", opciones: ["Saltó de alegría y abrazó a su mamá", "Se puso a llorar", "Se fue a dormir"], correcta: "Saltó de alegría y abrazó a su mamá" }
        ]
      },
      {
        texto: "Las iguanas marinas de Galápagos pasan el día sobre las rocas calientes. Cuando el sol calienta su cuerpo, se lanzan al mar a buscar algas.",
        preguntas: [
          { q: "¿Por qué se calientan al sol antes de nadar?", opciones: ["Para tener energía en el agua fría", "Porque les gusta dormir", "Para volar mejor"], correcta: "Para tener energía en el agua fría" },
          { q: "¿Qué buscan las iguanas en el mar?", opciones: ["Algas", "Frutas", "Insectos"], correcta: "Algas" }
        ]
      },
      {
        texto: "En la fiesta del pueblo todos los vecinos llevaron comida para compartir. Al final, nadie se quedó con hambre y todos se fueron contentos.",
        preguntas: [
          { q: "¿Qué nos enseña esta historia?", opciones: ["Compartir hace bien a todos", "Hay que comer solo", "La comida es mala"], correcta: "Compartir hace bien a todos" },
          { q: "¿Cómo terminó la fiesta?", opciones: ["Todos se fueron contentos", "Todos discutieron", "Se acabó muy temprano"], correcta: "Todos se fueron contentos" }
        ]
      }
    ]
  ];

  function gen() {
    const niv = Juego.nivelIdx();
    const banco = LECTURAS[niv] || LECTURAS[0];
    const lec = Juego.azarEl(banco);
    const pr = Juego.azarEl(lec.preguntas);
    return {
      tema: "Lee con atención",
      html: '<div class="lectura-texto">' + lec.texto + '</div>',
      pregunta: pr.q,
      opciones: pr.opciones,
      correcta: pr.correcta
    };
  }

  window.Lectura = MC("lectura", [
    { icono: "📖", nombre: "Comprensión lectora", desc: "Lee y responde", gens: [gen] }
  ]);
})();
