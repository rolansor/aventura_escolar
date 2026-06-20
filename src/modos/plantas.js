/* Las plantas — Ciencias Naturales (motor manipulativo: clasificar en cestas) */
(function () {
  const TEMAS = [
    { icono: "🌿", nombre: "Partes y su trabajo", desc: "¿qué hace cada parte?",
      pregunta: "Arrastra cada trabajo a la parte que lo hace 👇",
      cestas: [{ id: "raiz", nombre: "Raíz", emoji: "🌱" }, { id: "tallo", nombre: "Tallo", emoji: "🌿" },
        { id: "hoja", nombre: "Hoja", emoji: "🍃" }, { id: "flor", nombre: "Flor", emoji: "🌸" }],
      banco: {
        raiz: ["Sostiene la planta", "Chupa el agua del suelo", "Toma los nutrientes"],
        tallo: ["Lleva el agua hacia arriba", "Sostiene hojas y flores", "Es el tronco de la planta"],
        hoja: ["Hace la fotosíntesis", "Respira y da oxígeno", "Atrapa la luz del sol"],
        flor: ["De ella nace el fruto", "Tiene pétalos de colores", "Atrae a las abejas"]
      } },
    { icono: "🎁", nombre: "Necesita / Nos da", desc: "para vivir y lo que regala",
      pregunta: "Arrastra cada cosa a su grupo 👇",
      cestas: [{ id: "nec", nombre: "Necesita", emoji: "🙏" }, { id: "da", nombre: "Nos da", emoji: "🎁" }],
      banco: {
        nec: ["agua", "luz del sol", "aire", "tierra"],
        da: ["oxígeno", "frutos", "sombra", "flores"]
      } }
  ];
  const ronda = (t) => (host, ctrl) => {
    const items = t.cestas.map((c) => ({ txt: ctrl.azarEl(t.banco[c.id]), cesta: c.id }));
    Arrastrar.clasificar(host, ctrl, { pregunta: t.pregunta, cestas: t.cestas, items: ctrl.mezclar(items) });
  };
  window.Plantas = Actividad("pla", TEMAS.map((t) =>
    ({ icono: t.icono, nombre: t.nombre, desc: t.desc, total: 6, ronda: ronda(t) })));
})();
