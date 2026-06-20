/* Animales: clasificación y alimentación — Ciencias Naturales (motor MC) */
(function () {
  const azEl = (a) => Juego.azarEl(a);
  const T = [
    { icono: "🐾", nombre: "Grupos de animales", desc: "mamíferos, aves…", banco: [
      { p: "Los animales que tienen huesos y columna vertebral son:", c: "Vertebrados", o: ["Vertebrados", "Invertebrados"] },
      { p: "🐛 El gusano y la mariposa no tienen huesos; son:", c: "Invertebrados", o: ["Invertebrados", "Vertebrados"] },
      { p: "🐕 Los animales con pelo que dan leche a sus crías son:", c: "Mamíferos", o: ["Mamíferos", "Aves", "Reptiles", "Peces"] },
      { p: "🦜 Los animales con plumas que ponen huevos son:", c: "Aves", o: ["Aves", "Mamíferos", "Reptiles", "Anfibios"] },
      { p: "🦎 La serpiente y el lagarto, con escamas, son:", c: "Reptiles", o: ["Reptiles", "Anfibios", "Mamíferos", "Peces"] },
      { p: "🐟 Los animales que viven en el agua y respiran por branquias son:", c: "Peces", o: ["Peces", "Aves", "Mamíferos", "Reptiles"] },
      { p: "🐸 La rana, que vive en el agua y en la tierra, es un:", c: "Anfibio", o: ["Anfibio", "Reptil", "Pez", "Ave"] },
      { p: "¿Cómo nace la mayoría de los mamíferos?", c: "De la barriga de su mamá", o: ["De la barriga de su mamá", "De huevos", "De semillas", "De capullos"] },
      { p: "¿Cómo nacen las aves y los reptiles?", c: "De huevos", o: ["De huevos", "De la barriga de su mamá", "De semillas", "Del agua"] },
      { p: "🐝 La abeja, la hormiga y la mosca son insectos, un tipo de:", c: "Invertebrados", o: ["Invertebrados", "Vertebrados"] }
    ]},
    { icono: "🍖", nombre: "¿Qué comen?", desc: "herbívoro, carnívoro…", banco: [
      { p: "🌿 El animal que solo come plantas es:", c: "Herbívoro", o: ["Herbívoro", "Carnívoro", "Omnívoro"] },
      { p: "🍖 El animal que come carne de otros animales es:", c: "Carnívoro", o: ["Carnívoro", "Herbívoro", "Omnívoro"] },
      { p: "🍽️ El que come plantas y también carne es:", c: "Omnívoro", o: ["Omnívoro", "Herbívoro", "Carnívoro"] },
      { p: "🐄 La vaca, que come pasto, es:", c: "Herbívoro", o: ["Herbívoro", "Carnívoro", "Omnívoro"] },
      { p: "🦁 El león, que caza otros animales, es:", c: "Carnívoro", o: ["Carnívoro", "Herbívoro", "Omnívoro"] },
      { p: "🐻 El oso, que come frutas y peces, es:", c: "Omnívoro", o: ["Omnívoro", "Herbívoro", "Carnívoro"] },
      { p: "🐇 El conejo, que come zanahorias y hierba, es:", c: "Herbívoro", o: ["Herbívoro", "Carnívoro", "Omnívoro"] },
      { p: "Las plantas son productores; los animales que las comen son:", c: "Consumidores", o: ["Consumidores", "Productores", "Descomponedores"] }
    ]}
  ];
  const gen = (t) => () => { const q = azEl(t.banco); return { tema: t.nombre, pregunta: q.p, opciones: q.o.slice(), correcta: q.c }; };
  const temas = T.map((t) => ({ icono: t.icono, nombre: t.nombre, desc: t.desc, gens: [gen(t)] }));
  temas.push({ icono: "🎲", nombre: "Mixto", desc: "todo sobre animales",
    gens: [() => { const t = azEl(T); const q = azEl(t.banco); return { tema: t.nombre, pregunta: q.p, opciones: q.o.slice(), correcta: q.c }; }] });
  window.Animales = MC("ani", temas);
})();
