/* ============================================================
   SUJETO Y PREDICADO — Lengua (motor manipulativo: tocar)
   Se muestra una oración como fichas de palabras. El niño TOCA la
   palabra donde EMPIEZA el predicado (lo que hace o pasa el sujeto).
   El catálogo escala con el nivel del perfil (Juego.nivelIdx()):
     · básico:     sujeto de 1–2 palabras
     · intermedio: sujeto de 2–3 palabras
     · avanzado:   sujetos más largos
   Cada oración: { palabras:[...], corte }  donde
     palabras[0..corte-1] = SUJETO   y   palabras[corte..] = PREDICADO.
   La primera palabra (índice 0) nunca es el corte.
   ============================================================ */
(function () {
  // Bancos por nivel [básico, intermedio, avanzado]. Español del Ecuador, ~9 años.
  const ORACIONES = [
    // básico — sujeto de 1–2 palabras
    [
      { palabras: ["El", "gato", "duerme"], corte: 2 },
      { palabras: ["Nelson", "juega", "fútbol"], corte: 1 },
      { palabras: ["La", "niña", "canta"], corte: 2 },
      { palabras: ["Mi", "mamá", "cocina"], corte: 2 },
      { palabras: ["El", "perro", "ladra"], corte: 2 },
      { palabras: ["Andrea", "corre", "rápido"], corte: 1 },
      { palabras: ["El", "bebé", "llora"], corte: 2 },
      { palabras: ["Sofía", "pinta", "un", "dibujo"], corte: 1 },
      { palabras: ["Mi", "papá", "trabaja"], corte: 2 },
      { palabras: ["Los", "pájaros", "vuelan"], corte: 2 },
      { palabras: ["La", "profesora", "explica"], corte: 2 },
      { palabras: ["Pedro", "salta", "la", "cuerda"], corte: 1 },
      { palabras: ["El", "sol", "brilla"], corte: 2 },
      { palabras: ["María", "lee", "un", "cuento"], corte: 1 }
    ],
    // intermedio — sujeto de 2–3 palabras
    [
      { palabras: ["Mi", "perro", "corre", "en", "el", "parque"], corte: 2 },
      { palabras: ["La", "maestra", "escribe", "en", "la", "pizarra"], corte: 2 },
      { palabras: ["Los", "niños", "juegan", "en", "el", "recreo"], corte: 2 },
      { palabras: ["El", "vendedor", "ofrece", "frutas", "frescas"], corte: 2 },
      { palabras: ["Mi", "abuela", "prepara", "un", "rico", "locro"], corte: 2 },
      { palabras: ["La", "lluvia", "moja", "las", "calles"], corte: 2 },
      { palabras: ["El", "niño", "dibuja", "una", "casa"], corte: 2 },
      { palabras: ["Mi", "tía", "vende", "comida", "típica"], corte: 2 },
      { palabras: ["Las", "gallinas", "comen", "maíz"], corte: 2 },
      { palabras: ["El", "carpintero", "arregla", "la", "silla"], corte: 2 },
      { palabras: ["Los", "turistas", "visitan", "las", "islas"], corte: 2 },
      { palabras: ["La", "señora", "barre", "el", "patio"], corte: 2 },
      { palabras: ["Mi", "primo", "anda", "en", "bicicleta"], corte: 2 },
      { palabras: ["El", "pescador", "lanza", "su", "red"], corte: 2 }
    ],
    // avanzado — sujetos más largos
    [
      { palabras: ["El", "pequeño", "colibrí", "vuela", "sobre", "las", "flores"], corte: 3 },
      { palabras: ["Los", "niños", "del", "Ecuador", "cantan", "el", "himno"], corte: 4 },
      { palabras: ["La", "maestra", "de", "ciencias", "explica", "la", "lección"], corte: 4 },
      { palabras: ["El", "viejo", "tren", "andino", "sube", "la", "montaña"], corte: 4 },
      { palabras: ["Las", "olas", "del", "mar", "golpean", "la", "playa"], corte: 4 },
      { palabras: ["Mi", "hermano", "mayor", "estudia", "en", "la", "universidad"], corte: 3 },
      { palabras: ["El", "gran", "volcán", "Cotopaxi", "asusta", "a", "todos"], corte: 4 },
      { palabras: ["Los", "estudiantes", "de", "quinto", "ganaron", "el", "concurso"], corte: 4 },
      { palabras: ["Mi", "abuelo", "del", "campo", "cultiva", "papas"], corte: 4 },
      { palabras: ["La", "linda", "playa", "de", "Salinas", "recibe", "turistas"], corte: 5 },
      { palabras: ["El", "río", "Guayas", "cruza", "la", "ciudad"], corte: 3 },
      { palabras: ["Las", "altas", "montañas", "andinas", "tocan", "el", "cielo"], corte: 4 },
      { palabras: ["El", "famoso", "trenecito", "del", "Chimborazo", "lleva", "visitantes"], corte: 5 },
      { palabras: ["Mi", "querida", "maestra", "premió", "a", "los", "mejores"], corte: 3 }
    ]
  ];

  function ronda(host, ctrl) {
    const niv = Juego.nivelIdx();
    const banco = ORACIONES[niv] || ORACIONES[0];
    const o = ctrl.azarEl(banco);
    const corte = o.corte;

    ctrl.pregunta("Toca la palabra donde empieza el PREDICADO (lo que hace o pasa) 👇");

    const fila = document.createElement("div");
    fila.style.display = "flex";
    fila.style.flexWrap = "wrap";
    fila.style.justifyContent = "center";
    fila.style.gap = "10px";
    host.appendChild(fila);

    const chips = o.palabras.map((pal, k) => {
      const b = document.createElement("button");
      b.className = "ord-chip";
      b.textContent = pal;
      b.onclick = () => {
        if (k === corte) {
          for (let j = 0; j < o.palabras.length; j++) {
            chips[j].classList.add(j < corte ? "puesto" : "ok");
            chips[j].onclick = null;
          }
          ctrl.ganar();
        } else {
          ctrl.reintento("Ahí no; el predicado es lo que HACE el sujeto 👀");
        }
      };
      fila.appendChild(b);
      return b;
    });
  }

  window.Sujeto = Actividad("sujeto", [
    { icono: "✂️", nombre: "Sujeto y predicado", desc: "¿dónde empieza el predicado?", total: 8, ronda: ronda }
  ]);
})();
