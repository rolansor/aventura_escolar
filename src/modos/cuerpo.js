/* El cuerpo humano — Ciencias Naturales (motor manipulativo: clasificar en cestas) */
(function () {
  const TEMAS = [
    { icono: "❤️", nombre: "¿Para qué sirve?", desc: "el trabajo de cada órgano",
      pregunta: "Arrastra cada trabajo a su órgano 👇",
      cestas: [{ id: "pulmones", nombre: "Pulmones", emoji: "🫁" }, { id: "corazon", nombre: "Corazón", emoji: "❤️" },
        { id: "estomago", nombre: "Estómago", emoji: "🍽️" }, { id: "cerebro", nombre: "Cerebro", emoji: "🧠" }],
      banco: {
        pulmones: ["Respira el aire", "Toma el oxígeno", "Bota el dióxido de carbono"],
        corazon: ["Bombea la sangre", "Late todo el día", "Manda sangre al cuerpo"],
        estomago: ["Digiere la comida", "Recibe lo que tragas", "Deshace los alimentos"],
        cerebro: ["Piensa y aprende", "Manda órdenes al cuerpo", "Controla los sentidos"]
      } },
    { icono: "✋", nombre: "Los 5 sentidos", desc: "¿con qué lo sientes?",
      pregunta: "Arrastra cada cosa al sentido con que se percibe 👇",
      cestas: [{ id: "vista", nombre: "Vista", emoji: "👁️" }, { id: "oido", nombre: "Oído", emoji: "👂" },
        { id: "olfato", nombre: "Olfato", emoji: "👃" }, { id: "gusto", nombre: "Gusto", emoji: "👅" },
        { id: "tacto", nombre: "Tacto", emoji: "🤚" }],
      banco: {
        vista: ["los colores", "la luz", "un dibujo"],
        oido: ["la música", "un ruido", "una voz"],
        olfato: ["el olor de una flor", "el perfume", "la comida rica"],
        gusto: ["lo dulce", "lo salado", "un jugo"],
        tacto: ["lo suave", "lo caliente", "lo áspero"]
      } }
  ];
  const ronda = (t) => (host, ctrl) => {
    const items = t.cestas.map((c) => ({ txt: ctrl.azarEl(t.banco[c.id]), cesta: c.id }));
    Arrastrar.clasificar(host, ctrl, { pregunta: t.pregunta, cestas: t.cestas, items: ctrl.mezclar(items) });
  };
  window.Cuerpo = Actividad("cue", TEMAS.map((t) =>
    ({ icono: t.icono, nombre: t.nombre, desc: t.desc, total: 6, ronda: ronda(t) })));
})();
