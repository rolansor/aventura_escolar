/* La materia: estados y cambios — Ciencias Naturales (motor MC) */
(function () {
  const azEl = (a) => Juego.azarEl(a);
  const T = [
    { icono: "🧊", nombre: "Estados de la materia", desc: "sólido, líquido, gas", banco: [
      { p: "🪨 El hielo, la madera y una piedra están en estado:", c: "Sólido", o: ["Sólido", "Líquido", "Gaseoso"] },
      { p: "🥤 El agua, la leche y el jugo están en estado:", c: "Líquido", o: ["Líquido", "Sólido", "Gaseoso"] },
      { p: "💨 El aire y el vapor están en estado:", c: "Gaseoso", o: ["Gaseoso", "Sólido", "Líquido"] },
      { p: "¿Qué estado tiene forma y tamaño fijos?", c: "Sólido", o: ["Sólido", "Líquido", "Gaseoso"] },
      { p: "¿Qué estado no tiene forma fija y toma la del recipiente?", c: "Líquido", o: ["Líquido", "Sólido", "Gaseoso"] },
      { p: "¿Qué estado ocupa todo el espacio que puede, como el aire de un globo?", c: "Gaseoso", o: ["Gaseoso", "Sólido", "Líquido"] },
      { p: "Los tres estados de la materia son:", c: "Sólido, líquido y gaseoso", o: ["Sólido, líquido y gaseoso", "Frío, tibio y caliente", "Grande, mediano y pequeño", "Duro, blando y mojado"] }
    ]},
    { icono: "🔄", nombre: "Cambios de estado", desc: "fusión, evaporación…", banco: [
      { p: "🔥 Cuando el hielo se derrite y se vuelve agua, es la:", c: "Fusión", o: ["Fusión", "Evaporación", "Condensación", "Solidificación"] },
      { p: "♨️ Cuando el agua hierve y se vuelve vapor, es la:", c: "Evaporación", o: ["Evaporación", "Fusión", "Condensación", "Solidificación"] },
      { p: "☁️ Cuando el vapor se enfría y vuelve a ser agua, es la:", c: "Condensación", o: ["Condensación", "Evaporación", "Fusión", "Solidificación"] },
      { p: "❄️ Cuando el agua se congela y se vuelve hielo, es la:", c: "Solidificación", o: ["Solidificación", "Fusión", "Evaporación", "Condensación"] },
      { p: "¿Qué provoca casi siempre que la materia cambie de estado?", c: "El calor o el frío", o: ["El calor o el frío", "El color", "El olor", "El tamaño"] }
    ]}
  ];
  const gen = (t) => () => { const q = azEl(t.banco); return { tema: t.nombre, pregunta: q.p, opciones: q.o.slice(), correcta: q.c }; };
  const temas = T.map((t) => ({ icono: t.icono, nombre: t.nombre, desc: t.desc, gens: [gen(t)] }));
  temas.push({ icono: "🎲", nombre: "Mixto", desc: "toda la materia",
    gens: [() => { const t = azEl(T); const q = azEl(t.banco); return { tema: t.nombre, pregunta: q.p, opciones: q.o.slice(), correcta: q.c }; }] });
  window.Materia = MC("mat", temas);
})();
