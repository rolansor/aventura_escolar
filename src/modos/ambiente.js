/* Ecosistemas y ambiente — Ciencias Naturales (motor manipulativo: clasificar en cestas) */
(function () {
  const TEMAS = [
    { icono: "♻️", nombre: "¿En qué contenedor?", desc: "separa la basura",
      pregunta: "Arrastra cada cosa a su contenedor de reciclaje 👇",
      cestas: [{ id: "papel", nombre: "Papel", emoji: "📄" }, { id: "plastico", nombre: "Plástico", emoji: "🧴" },
        { id: "organico", nombre: "Orgánico", emoji: "🍎" }, { id: "vidrio", nombre: "Vidrio", emoji: "🍶" }],
      banco: {
        papel: ["un periódico", "una caja de cartón", "un cuaderno viejo"],
        plastico: ["una botella de agua", "una funda", "un envase de yogur"],
        organico: ["una cáscara de plátano", "restos de comida", "una hoja seca"],
        vidrio: ["un frasco", "una botella de vidrio", "un vaso roto"]
      } },
    { icono: "💚", nombre: "Cuida / Daña el planeta", desc: "lo bueno y lo malo",
      pregunta: "Arrastra cada acción a su grupo 👇",
      cestas: [{ id: "cuida", nombre: "Cuida 💚", emoji: "🌳" }, { id: "dana", nombre: "Daña 💔", emoji: "🏭" }],
      banco: {
        cuida: ["sembrar árboles", "reciclar", "cerrar el grifo", "apagar la luz", "ir en bici"],
        dana: ["botar basura al río", "talar bosques", "desperdiciar agua", "contaminar el aire"]
      } }
  ];
  const ronda = (t) => (host, ctrl) => {
    const items = t.cestas.map((c) => ({ txt: ctrl.azarEl(t.banco[c.id]), cesta: c.id }));
    Arrastrar.clasificar(host, ctrl, { pregunta: t.pregunta, cestas: t.cestas, items: ctrl.mezclar(items) });
  };
  window.Ambiente = Actividad("amb", TEMAS.map((t) =>
    ({ icono: t.icono, nombre: t.nombre, desc: t.desc, total: 6, ronda: ronda(t) })));
})();
