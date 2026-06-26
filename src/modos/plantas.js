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

  function itemDe(niveles, niv) {
    let arr = niveles[niv];
    for (let k = niv; k >= 0 && (!arr || !arr.length); k--) arr = niveles[k];
    return Juego.azarEl(arr);
  }

  /* ---- Conceptos (no solo clasificar): ¿verdadero o falso? y definiciones ---- */
  const CONCEPTOS = [
    [
      { t: "La raíz chupa agua del suelo.", c: true, exp: "Y también toma los nutrientes." },
      { t: "Las hojas atrapan la luz.", c: true, exp: "Por eso son verdes." },
      { t: "El tallo sostiene la planta.", c: true, exp: "Y lleva el agua hacia arriba." },
      { t: "Las plantas comen carne.", c: false, exp: "Fabrican su propio alimento." }
    ],
    [
      { t: "Las flores pueden convertirse en frutos.", c: true, exp: "De la flor nace el fruto." },
      { t: "Las plantas no necesitan agua.", c: false, exp: "Necesitan agua para vivir." },
      { t: "La raíz crece hacia abajo, en la tierra.", c: true, exp: "" }
    ],
    [
      { t: "Las plantas fabrican su alimento con la luz del sol.", c: true, exp: "Se llama fotosíntesis." },
      { t: "Las plantas botan oxígeno.", c: true, exp: "Limpian el aire que respiramos." },
      { t: "La fotosíntesis ocurre en las hojas.", c: true, exp: "" }
    ]
  ];
  const DEFINICIONES = [
    [
      { q: "¿Qué hace la raíz?", c: "Chupa agua y nutrientes del suelo", d: ["Atrapa la luz del sol", "Da las flores"] },
      { q: "¿Qué parte atrapa la luz del sol?", c: "La hoja", d: ["La raíz", "El fruto"] },
      { q: "¿Qué necesita una planta para vivir?", c: "Agua, luz, aire y tierra", d: ["Solo carne", "Solo piedras"] }
    ],
    [
      { q: "¿Qué gas dan las plantas al aire?", c: "Oxígeno", d: ["Humo", "Polvo"] },
      { q: "¿De qué parte nace el fruto?", c: "De la flor", d: ["De la raíz", "del tallo"] }
    ],
    [
      { q: "¿Qué es la fotosíntesis?", c: "Cuando la planta fabrica su alimento con la luz", d: ["Cuando la planta duerme", "Cuando bota las hojas"] }
    ]
  ];
  const rondaVF = (host, ctrl) => {
    const q = itemDe(CONCEPTOS, Juego.nivelIdx());
    ctrl.pregunta("🤔 ¿Es verdad?<br><b>" + q.t + "</b>");
    host.innerHTML = '<div class="ord-fuente"></div>';
    const cont = host.querySelector(".ord-fuente");
    [["✅ Verdadero", true], ["❌ Falso", false]].forEach((par) => {
      const b = document.createElement("button");
      b.className = "ord-chip"; b.textContent = par[0];
      b.onclick = () => {
        if (par[1] === q.c) ctrl.ganar();
        else ctrl.fallar("Era <b>" + (q.c ? "Verdadero" : "Falso") + "</b>. " + (q.exp || ""));
      };
      cont.appendChild(b);
    });
  };
  const rondaDef = (host, ctrl) => {
    const q = itemDe(DEFINICIONES, Juego.nivelIdx());
    ctrl.pregunta("📖 " + q.q);
    host.innerHTML = '<div class="ord-fuente"></div>';
    const cont = host.querySelector(".ord-fuente");
    ctrl.mezclar([q.c].concat(q.d)).forEach((op) => {
      const b = document.createElement("button");
      b.className = "ord-chip"; b.textContent = op;
      b.onclick = () => { if (op === q.c) ctrl.ganar(); else ctrl.reintento("Casi… inténtalo otra vez 🤔"); };
      cont.appendChild(b);
    });
  };

  const temas = TEMAS.map((t) => ({ icono: t.icono, nombre: t.nombre, desc: t.desc, total: 6, ronda: ronda(t) }));
  temas.push({ icono: "🤔", nombre: "¿Verdadero o falso?", desc: "conceptos de las plantas", total: 6, ronda: rondaVF });
  temas.push({ icono: "📖", nombre: "¿Qué es cada cosa?", desc: "elige la definición", total: 6, ronda: rondaDef });
  window.Plantas = Actividad("pla", temas);
})();
