/* Ecosistemas del Ecuador y cuidado del ambiente — Ciencias Naturales (motor MC) */
(function () {
  const azEl = (a) => Juego.azarEl(a);
  const T = [
    { icono: "🏔️", nombre: "Regiones del Ecuador", desc: "Costa, Sierra, Amazonía…", banco: [
      { p: "🏖️ La región con playas y mar caliente es la:", c: "Costa", o: ["Costa", "Sierra", "Amazonía", "Galápagos"] },
      { p: "🏔️ La región de los Andes, con volcanes y páramos, es la:", c: "Sierra", o: ["Sierra", "Costa", "Amazonía", "Galápagos"] },
      { p: "🌳 La región de selva y mucha lluvia es la:", c: "Amazonía", o: ["Amazonía", "Costa", "Sierra", "Galápagos"] },
      { p: "🐢 Las tortugas gigantes y la fauna única viven en:", c: "Galápagos", o: ["Galápagos", "Costa", "Sierra", "Amazonía"] },
      { p: "🦅 El cóndor, ave enorme de los Andes, vive en la:", c: "Sierra", o: ["Sierra", "Costa", "Amazonía", "Galápagos"] },
      { p: "El Ecuador tiene 4 regiones naturales. ¿Cuál NO es una de ellas?", c: "El desierto", o: ["El desierto", "Costa", "Sierra", "Amazonía"] },
      { p: "🐒 Los monos, guacamayos y muchos ríos están sobre todo en la:", c: "Amazonía", o: ["Amazonía", "Sierra", "Galápagos", "Costa"] }
    ]},
    { icono: "♻️", nombre: "Cuidar el planeta", desc: "reciclar, ahorrar…", banco: [
      { p: "♻️ Las 3R para cuidar el ambiente son:", c: "Reducir, reutilizar y reciclar", o: ["Reducir, reutilizar y reciclar", "Correr, reír y rebotar", "Romper, raspar y rayar", "Regar, recoger y respirar"] },
      { p: "💡 Apagar las luces que no usamos ayuda a ahorrar:", c: "Energía", o: ["Energía", "Agua", "Comida", "Tiempo"] },
      { p: "🚰 Cerrar bien el grifo al lavarte los dientes ayuda a cuidar el:", c: "Agua", o: ["Agua", "Aire", "Fuego", "Suelo"] },
      { p: "🗑️ Botar la basura en su lugar evita la:", c: "Contaminación", o: ["Contaminación", "Diversión", "Alimentación", "Respiración"] },
      { p: "🌳 Los árboles y las plantas nos dan sombra y, sobre todo:", c: "Oxígeno", o: ["Oxígeno", "Basura", "Ruido", "Humo"] },
      { p: "Usar una botella otra vez en vez de botarla es un ejemplo de:", c: "Reutilizar", o: ["Reutilizar", "Contaminar", "Desperdiciar", "Quemar"] },
      { p: "Sembrar árboles para recuperar un bosque se llama:", c: "Reforestar", o: ["Reforestar", "Talar", "Quemar", "Contaminar"] }
    ]}
  ];
  const gen = (t) => () => { const q = azEl(t.banco); return { tema: t.nombre, pregunta: q.p, opciones: q.o.slice(), correcta: q.c }; };
  const temas = T.map((t) => ({ icono: t.icono, nombre: t.nombre, desc: t.desc, gens: [gen(t)] }));
  temas.push({ icono: "🎲", nombre: "Mixto", desc: "ambiente y Ecuador",
    gens: [() => { const t = azEl(T); const q = azEl(t.banco); return { tema: t.nombre, pregunta: q.p, opciones: q.o.slice(), correcta: q.c }; }] });
  window.Ambiente = MC("amb", temas);
})();
