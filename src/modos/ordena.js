/* ============================================================
   ORDENA LA ORACIÓN — Lengua (motor manipulativo: ordenar)
   Las palabras aparecen desordenadas y el niño las TOCA en el
   orden correcto para armar una oración con sentido. El banco de
   oraciones escala con el nivel del perfil (Juego.nivelIdx()):
     · básico:     3–4 palabras
     · intermedio: 5–6 palabras
     · avanzado:   7–8 palabras con conector
   Contexto del Ecuador, vocabulario para ~9 años. El punto final
   va pegado a la última palabra (una sola ficha por palabra).
   ============================================================ */
(function () {
  // Oraciones por nivel [básico, intermedio, avanzado]. Cada una con sentido y mayúscula inicial.
  const ORACIONES = [
    [
      "El gato bebe leche.",
      "Nelson juega fútbol.",
      "La flor es bonita.",
      "Mi mamá cocina arroz.",
      "El perro corre rápido.",
      "Hoy llueve mucho.",
      "La luna brilla."
    ],
    [
      "El colibrí vuela sobre las flores.",
      "Nelson lee un libro en la escuela.",
      "La montaña tiene mucha nieve.",
      "Mi abuela vende frutas en el mercado.",
      "Los niños cantan en el patio.",
      "El río baja desde la sierra.",
      "La maestra explica una lección nueva."
    ],
    [
      "Después de la lluvia salió un gran arcoíris.",
      "El cóndor de los Andes vuela muy alto en el cielo.",
      "Nelson y su hermana caminan juntos hacia la escuela.",
      "En el mercado de Otavalo venden hermosos tejidos de colores.",
      "Las ballenas llegan a la costa cuando termina el invierno.",
      "El volcán Cotopaxi se ve enorme desde la ciudad de Quito."
    ]
  ];

  function ronda(host, ctrl) {
    let niv = Juego.nivelIdx();
    let banco = ORACIONES[niv];
    for (let k = niv; k >= 0 && (!banco || !banco.length); k--) banco = ORACIONES[k];
    const oracion = ctrl.azarEl(banco);
    Arrastrar.ordenar(host, ctrl, {
      pregunta: "Toca las palabras en orden para armar la oración 👇",
      correcto: oracion.split(" ")
    });
  }

  window.Ordena = Actividad("ordena", [
    { icono: "🧩", nombre: "Ordena la oración", desc: "Arma la frase con sentido", total: 8, ronda: ronda }
  ]);
})();
