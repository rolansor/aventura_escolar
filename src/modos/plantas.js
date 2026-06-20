/* Plantas: partes, función y fotosíntesis — Ciencias Naturales (motor MC) */
(function () {
  const azEl = (a) => Juego.azarEl(a);
  const T = [
    { icono: "🌿", nombre: "Partes de la planta", desc: "raíz, tallo, hoja, flor…", banco: [
      { p: "🌱 ¿Qué parte absorbe el agua y los nutrientes del suelo?", c: "La raíz", o: ["La raíz", "El tallo", "La hoja", "La flor"] },
      { p: "¿Qué parte sostiene la planta y lleva el agua hacia las hojas?", c: "El tallo", o: ["El tallo", "La raíz", "La flor", "El fruto"] },
      { p: "🍃 ¿En qué parte se fabrica el alimento (fotosíntesis)?", c: "Las hojas", o: ["Las hojas", "La raíz", "El fruto", "La semilla"] },
      { p: "🌸 ¿Qué parte sirve para la reproducción y tiene colores y aroma?", c: "La flor", o: ["La flor", "El tallo", "La raíz", "La hoja"] },
      { p: "🍎 ¿Qué parte protege a las semillas y muchas veces comemos?", c: "El fruto", o: ["El fruto", "La hoja", "La raíz", "El tallo"] },
      { p: "🌰 ¿De qué parte nace una nueva planta?", c: "La semilla", o: ["La semilla", "La flor", "La hoja", "El tallo"] },
      { p: "🐝 Las abejas visitan esta parte para llevar el polen:", c: "La flor", o: ["La flor", "La raíz", "El tallo", "El fruto"] },
      { p: "¿Qué parte sujeta la planta a la tierra?", c: "La raíz", o: ["La raíz", "La hoja", "La flor", "El fruto"] }
    ]},
    { icono: "☀️", nombre: "Fotosíntesis y aire", desc: "oxígeno, CO₂, luz", banco: [
      { p: "💨 ¿Qué gas liberan las plantas y nosotros respiramos?", c: "Oxígeno", o: ["Oxígeno", "Dióxido de carbono", "Nitrógeno", "Humo"] },
      { p: "En la fotosíntesis, ¿qué gas del aire toman las plantas?", c: "Dióxido de carbono", o: ["Dióxido de carbono", "Oxígeno", "Vapor", "Helio"] },
      { p: "¿Qué necesitan las plantas para fabricar su alimento?", c: "Luz del sol, agua y aire", o: ["Luz del sol, agua y aire", "Solo tierra", "Solo agua", "Pilas"] },
      { p: "¿Cómo se llama el proceso con el que las plantas hacen su alimento?", c: "Fotosíntesis", o: ["Fotosíntesis", "Digestión", "Respiración", "Evaporación"] },
      { p: "🟢 ¿Qué da el color verde a las hojas y atrapa la luz?", c: "La clorofila", o: ["La clorofila", "El agua", "El polen", "La savia"] },
      { p: "Las plantas fabrican su propio alimento; por eso se llaman:", c: "Productores", o: ["Productores", "Consumidores", "Descomponedores", "Carnívoros"] },
      { p: "Durante el día, las plantas limpian el aire porque producen:", c: "Oxígeno", o: ["Oxígeno", "Basura", "Polvo", "Humo"] }
    ]}
  ];
  const gen = (t) => () => { const q = azEl(t.banco); return { tema: t.nombre, pregunta: q.p, opciones: q.o.slice(), correcta: q.c }; };
  const temas = T.map((t) => ({ icono: t.icono, nombre: t.nombre, desc: t.desc, gens: [gen(t)] }));
  temas.push({ icono: "🎲", nombre: "Mixto", desc: "todo sobre plantas",
    gens: [() => { const t = azEl(T); const q = azEl(t.banco); return { tema: t.nombre, pregunta: q.p, opciones: q.o.slice(), correcta: q.c }; }] });
  window.Plantas = MC("pla", temas);
})();
