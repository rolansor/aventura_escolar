/* El cuerpo humano: órganos, sistemas y sentidos — Ciencias Naturales (motor MC) */
(function () {
  const azEl = (a) => Juego.azarEl(a);
  const T = [
    { icono: "🫀", nombre: "Órganos y sistemas", desc: "corazón, pulmones…", banco: [
      { p: "🫀 ¿Qué órgano bombea la sangre por todo el cuerpo?", c: "El corazón", o: ["El corazón", "El estómago", "Los pulmones", "El hígado"] },
      { p: "🫁 ¿Con qué órganos entra el aire cuando respiramos?", c: "Los pulmones", o: ["Los pulmones", "El corazón", "Los riñones", "El cerebro"] },
      { p: "🧠 ¿Qué órgano nos permite pensar y controla el cuerpo?", c: "El cerebro", o: ["El cerebro", "El corazón", "El estómago", "La piel"] },
      { p: "¿En qué órgano se digieren los alimentos con jugos gástricos?", c: "El estómago", o: ["El estómago", "Los pulmones", "El corazón", "El cerebro"] },
      { p: "¿Qué sistema lleva la sangre por todo el cuerpo?", c: "El sistema circulatorio", o: ["El sistema circulatorio", "El sistema digestivo", "El sistema respiratorio", "El sistema óseo"] },
      { p: "¿Qué sistema se encarga de respirar?", c: "El sistema respiratorio", o: ["El sistema respiratorio", "El sistema circulatorio", "El sistema digestivo", "El sistema nervioso"] },
      { p: "¿Qué sistema digiere los alimentos que comemos?", c: "El sistema digestivo", o: ["El sistema digestivo", "El sistema respiratorio", "El sistema circulatorio", "El sistema óseo"] },
      { p: "🦴 ¿Qué da soporte al cuerpo y protege los órganos?", c: "Los huesos (esqueleto)", o: ["Los huesos (esqueleto)", "La sangre", "El aire", "La piel"] },
      { p: "💪 ¿Qué nos permite movernos al estirarse y encogerse?", c: "Los músculos", o: ["Los músculos", "Los pulmones", "El cabello", "Las uñas"] },
      { p: "El órgano más grande del cuerpo, que nos cubre y protege, es:", c: "La piel", o: ["La piel", "El corazón", "El hígado", "El cerebro"] },
      { p: "🩸 ¿Qué líquido rojo transporta el oxígeno por el cuerpo?", c: "La sangre", o: ["La sangre", "El agua", "La saliva", "El sudor"] }
    ]},
    { icono: "👀", nombre: "Los sentidos", desc: "ver, oír, oler…", banco: [
      { p: "👀 ¿Con qué órgano vemos?", c: "Los ojos", o: ["Los ojos", "Los oídos", "La nariz", "La lengua"] },
      { p: "👂 ¿Con qué órgano oímos los sonidos?", c: "Los oídos", o: ["Los oídos", "Los ojos", "La lengua", "La piel"] },
      { p: "👃 ¿Con qué órgano olemos?", c: "La nariz", o: ["La nariz", "Los ojos", "Los oídos", "La piel"] },
      { p: "👅 ¿Con qué parte saboreamos la comida?", c: "La lengua", o: ["La lengua", "La nariz", "Los dientes", "Los ojos"] },
      { p: "✋ El sentido del tacto está sobre todo en:", c: "La piel", o: ["La piel", "Los ojos", "La lengua", "Los oídos"] },
      { p: "¿Cuántos sentidos tenemos?", c: "5", o: ["5", "3", "4", "7"] },
      { p: "Ver, oír, oler, saborear y tocar son los cinco:", c: "Sentidos", o: ["Sentidos", "Órganos", "Sistemas", "Músculos"] }
    ]}
  ];
  const gen = (t) => () => { const q = azEl(t.banco); return { tema: t.nombre, pregunta: q.p, opciones: q.o.slice(), correcta: q.c }; };
  const temas = T.map((t) => ({ icono: t.icono, nombre: t.nombre, desc: t.desc, gens: [gen(t)] }));
  temas.push({ icono: "🎲", nombre: "Mixto", desc: "todo sobre el cuerpo",
    gens: [() => { const t = azEl(T); const q = azEl(t.banco); return { tema: t.nombre, pregunta: q.p, opciones: q.o.slice(), correcta: q.c }; }] });
  window.Cuerpo = MC("cue", temas);
})();
