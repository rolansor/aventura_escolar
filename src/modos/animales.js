/* Los animales — Ciencias Naturales (motor manipulativo: clasificar en cestas) */
(function () {
  const TEMAS = [
    { icono: "🍽️", nombre: "¿Qué comen?", desc: "herbívoro, carnívoro, omnívoro",
      pregunta: "Arrastra cada animal según lo que come 👇",
      cestas: [{ id: "herb", nombre: "Herbívoro", emoji: "🌿" }, { id: "carn", nombre: "Carnívoro", emoji: "🍖" },
        { id: "omni", nombre: "Omnívoro", emoji: "🍽️" }],
      banco: {
        herb: ["la vaca", "el conejo", "el caballo", "la oveja", "la llama"],
        carn: ["el león", "el tiburón", "el águila", "el lobo"],
        omni: ["el oso", "el cerdo", "la gallina", "el ser humano"]
      } },
    { icono: "🥚", nombre: "¿Cómo nacen?", desc: "de huevo o del vientre",
      pregunta: "Arrastra cada animal según cómo nace 👇",
      cestas: [{ id: "ovip", nombre: "Ovíparo (de huevo)", emoji: "🥚" }, { id: "vivi", nombre: "Vivíparo", emoji: "🤱" }],
      banco: {
        ovip: ["la gallina", "el pez", "la tortuga", "la rana", "el ave"],
        vivi: ["el perro", "el gato", "la vaca", "la ballena", "el ser humano"]
      } }
  ];
  const ronda = (t) => (host, ctrl) => {
    const items = t.cestas.map((c) => ({ txt: ctrl.azarEl(t.banco[c.id]), cesta: c.id }));
    Arrastrar.clasificar(host, ctrl, { pregunta: t.pregunta, cestas: t.cestas, items: ctrl.mezclar(items) });
  };
  window.Animales = Actividad("ani", TEMAS.map((t) =>
    ({ icono: t.icono, nombre: t.nombre, desc: t.desc, total: 6, ronda: ronda(t) })));
})();
