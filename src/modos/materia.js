/* La materia — Ciencias Naturales (motor manipulativo: clasificar en cestas) */
(function () {
  const TEMAS = [
    { icono: "🧊", nombre: "Estados de la materia", desc: "sólido, líquido, gaseoso",
      pregunta: "Arrastra cada cosa a su estado 👇",
      cestas: [{ id: "solido", nombre: "Sólido", emoji: "🧊" }, { id: "liquido", nombre: "Líquido", emoji: "💧" },
        { id: "gaseoso", nombre: "Gaseoso", emoji: "💨" }],
      banco: {
        solido: ["una piedra", "el hielo", "una mesa", "una moneda", "un libro"],
        liquido: ["el agua", "la leche", "el jugo", "el aceite"],
        gaseoso: ["el aire", "el vapor", "el humo", "el viento"]
      } },
    { icono: "🪵", nombre: "¿De qué material?", desc: "madera, metal, vidrio, plástico",
      pregunta: "Arrastra cada objeto a su material 👇",
      cestas: [{ id: "madera", nombre: "Madera", emoji: "🪵" }, { id: "metal", nombre: "Metal", emoji: "🔩" },
        { id: "vidrio", nombre: "Vidrio", emoji: "🥃" }, { id: "plastico", nombre: "Plástico", emoji: "🧴" }],
      banco: {
        madera: ["una silla", "un lápiz", "una puerta"],
        metal: ["una cuchara", "una llave", "un clavo"],
        vidrio: ["un vaso", "una ventana", "un espejo"],
        plastico: ["un juguete", "una funda", "un balde"]
      } }
  ];
  const ronda = (t) => (host, ctrl) => {
    const items = t.cestas.map((c) => ({ txt: ctrl.azarEl(t.banco[c.id]), cesta: c.id }));
    Arrastrar.clasificar(host, ctrl, { pregunta: t.pregunta, cestas: t.cestas, items: ctrl.mezclar(items) });
  };
  window.Materia = Actividad("mat", TEMAS.map((t) =>
    ({ icono: t.icono, nombre: t.nombre, desc: t.desc, total: 6, ronda: ronda(t) })));
})();
