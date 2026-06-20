/* El ciclo del agua — Ciencias Naturales (motor MC) */
(function () {
  const azEl = (a) => Juego.azarEl(a);
  const T = [
    { icono: "💧", nombre: "Fases del ciclo", desc: "evaporación, lluvia…", banco: [
      { p: "☀️ Cuando el sol calienta el agua del mar y se vuelve vapor, es la:", c: "Evaporación", o: ["Evaporación", "Condensación", "Precipitación", "Infiltración"] },
      { p: "☁️ Cuando el vapor sube, se enfría y forma las nubes, es la:", c: "Condensación", o: ["Condensación", "Evaporación", "Precipitación", "Infiltración"] },
      { p: "🌧️ Cuando de las nubes cae lluvia, nieve o granizo, es la:", c: "Precipitación", o: ["Precipitación", "Evaporación", "Condensación", "Infiltración"] },
      { p: "🌱 El agua que se filtra en el suelo y forma aguas subterráneas, es la:", c: "Infiltración", o: ["Infiltración", "Evaporación", "Condensación", "Precipitación"] },
      { p: "¿Qué da la energía para que el agua se evapore?", c: "El sol", o: ["El sol", "La luna", "El viento", "Las nubes"] },
      { p: "☁️ Las nubes están formadas por:", c: "Gotitas de agua", o: ["Gotitas de agua", "Humo", "Algodón", "Polvo"] },
      { p: "El agua de la lluvia vuelve a los ríos y mares, y todo:", c: "Vuelve a empezar (es un ciclo)", o: ["Vuelve a empezar (es un ciclo)", "Se acaba", "Desaparece para siempre", "Se queda en el cielo"] }
    ]},
    { icono: "🧊", nombre: "Estados del agua", desc: "sólido, líquido, gas", banco: [
      { p: "🧊 ¿En qué estado está el agua cuando es hielo?", c: "Sólido", o: ["Sólido", "Líquido", "Gaseoso"] },
      { p: "🌊 ¿En qué estado está el agua del mar o de un vaso?", c: "Líquido", o: ["Líquido", "Sólido", "Gaseoso"] },
      { p: "💨 ¿En qué estado está el agua cuando es vapor?", c: "Gaseoso", o: ["Gaseoso", "Sólido", "Líquido"] },
      { p: "❄️ Cuando el agua se enfría mucho y se vuelve hielo, se llama:", c: "Solidificación", o: ["Solidificación", "Evaporación", "Condensación"] },
      { p: "🔥 Cuando el hielo se calienta y se vuelve agua, se llama:", c: "Fusión", o: ["Fusión", "Evaporación", "Condensación"] }
    ]}
  ];
  const gen = (t) => () => { const q = azEl(t.banco); return { tema: t.nombre, pregunta: q.p, opciones: q.o.slice(), correcta: q.c }; };
  const temas = T.map((t) => ({ icono: t.icono, nombre: t.nombre, desc: t.desc, gens: [gen(t)] }));
  temas.push({ icono: "🎲", nombre: "Mixto", desc: "todo el ciclo del agua",
    gens: [() => { const t = azEl(T); const q = azEl(t.banco); return { tema: t.nombre, pregunta: q.p, opciones: q.o.slice(), correcta: q.c }; }] });
  window.CicloAgua = MC("agua", temas);
})();
