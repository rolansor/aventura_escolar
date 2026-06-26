/* ============================================================
   CAMBIA LA PALABRA — Lengua (motor manipulativo: toque)
   Se muestra una palabra base y una consigna; el niño TOCA la
   forma correcta entre opciones (chips). El control del error lo
   lleva el material: si acierta el chip se ilumina verde.
   Tres temas, cada uno con banco por nivel (Juego.nivelIdx()):
     · Diminutivos 🐭   · Aumentativos 🐘   · Género y número 👫
   Palabras más difíciles en los niveles altos. Español del Ecuador.
   ============================================================ */
(function () {
  // Cada ítem: { base, instr, correcto, opciones:[...] }.
  // Las opciones incluyen SIEMPRE la correcta + distractores plausibles
  // (otras formas mal hechas, p. ej. "perrón"/"perros" cuando se pide diminutivo).
  const BANCOS = {
    diminutivos: [
      // básico
      [
        { base: "perro",  instr: "Ponla en diminutivo", correcto: "perrito",  opciones: ["perrito", "perrón", "perros"] },
        { base: "casa",   instr: "Ponla en diminutivo", correcto: "casita",   opciones: ["casita", "casona", "casas"] },
        { base: "gato",   instr: "Ponla en diminutivo", correcto: "gatito",   opciones: ["gatito", "gatazo", "gatos"] },
        { base: "flor",   instr: "Ponla en diminutivo", correcto: "florcita", opciones: ["florcita", "florota", "flores"] },
        { base: "pato",   instr: "Ponla en diminutivo", correcto: "patito",   opciones: ["patito", "patón", "patos"] },
        { base: "mesa",   instr: "Ponla en diminutivo", correcto: "mesita",   opciones: ["mesita", "mesona", "mesas"] }
      ],
      // intermedio
      [
        { base: "árbol",  instr: "Ponla en diminutivo", correcto: "arbolito", opciones: ["arbolito", "arbolote", "árboles"] },
        { base: "pez",    instr: "Ponla en diminutivo", correcto: "pececito", opciones: ["pececito", "pezote", "peces"] },
        { base: "ratón",  instr: "Ponla en diminutivo", correcto: "ratoncito", opciones: ["ratoncito", "ratonazo", "ratones"] },
        { base: "pan",    instr: "Ponla en diminutivo", correcto: "panecito", opciones: ["panecito", "panzote", "panes"] },
        { base: "sol",    instr: "Ponla en diminutivo", correcto: "solcito",  opciones: ["solcito", "solazo", "soles"] },
        { base: "zapato", instr: "Ponla en diminutivo", correcto: "zapatito", opciones: ["zapatito", "zapatón", "zapatos"] }
      ],
      // avanzado
      [
        { base: "camión", instr: "Ponla en diminutivo", correcto: "camioncito", opciones: ["camioncito", "camionzote", "camiones"] },
        { base: "café",   instr: "Ponla en diminutivo", correcto: "cafecito",   opciones: ["cafecito", "cafetón", "cafés"] },
        { base: "nube",   instr: "Ponla en diminutivo", correcto: "nubecita",   opciones: ["nubecita", "nubarrón", "nubes"] },
        { base: "puente", instr: "Ponla en diminutivo", correcto: "puentecito", opciones: ["puentecito", "puentón", "puentes"] },
        { base: "mano",   instr: "Ponla en diminutivo", correcto: "manita",     opciones: ["manita", "manaza", "manos"] },
        { base: "lápiz",  instr: "Ponla en diminutivo", correcto: "lapicito",   opciones: ["lapicito", "lapizote", "lápices"] }
      ]
    ],
    aumentativos: [
      // básico
      [
        { base: "perro",  instr: "Ponla en aumentativo", correcto: "perrazo", opciones: ["perrazo", "perrito", "perros"] },
        { base: "casa",   instr: "Ponla en aumentativo", correcto: "casona",  opciones: ["casona", "casita", "casas"] },
        { base: "gato",   instr: "Ponla en aumentativo", correcto: "gatazo",  opciones: ["gatazo", "gatito", "gatos"] },
        { base: "libro",  instr: "Ponla en aumentativo", correcto: "librote", opciones: ["librote", "librito", "libros"] },
        { base: "mano",   instr: "Ponla en aumentativo", correcto: "manaza",  opciones: ["manaza", "manita", "manos"] },
        { base: "silla",  instr: "Ponla en aumentativo", correcto: "sillón",  opciones: ["sillón", "sillita", "sillas"] }
      ],
      // intermedio
      [
        { base: "carro",  instr: "Ponla en aumentativo", correcto: "carrazo", opciones: ["carrazo", "carrito", "carros"] },
        { base: "golpe",  instr: "Ponla en aumentativo", correcto: "golpazo", opciones: ["golpazo", "golpecito", "golpes"] },
        { base: "hombre", instr: "Ponla en aumentativo", correcto: "hombrón", opciones: ["hombrón", "hombrecito", "hombres"] },
        { base: "ojo",    instr: "Ponla en aumentativo", correcto: "ojazo",   opciones: ["ojazo", "ojito", "ojos"] },
        { base: "nariz",  instr: "Ponla en aumentativo", correcto: "narizota", opciones: ["narizota", "naricita", "narices"] },
        { base: "perro",  instr: "Ponla en aumentativo", correcto: "perrote", opciones: ["perrote", "perrito", "perros"] }
      ],
      // avanzado
      [
        { base: "nube",   instr: "Ponla en aumentativo", correcto: "nubarrón", opciones: ["nubarrón", "nubecita", "nubes"] },
        { base: "cuchara", instr: "Ponla en aumentativo", correcto: "cucharón", opciones: ["cucharón", "cucharita", "cucharas"] },
        { base: "cabeza", instr: "Ponla en aumentativo", correcto: "cabezota", opciones: ["cabezota", "cabecita", "cabezas"] },
        { base: "puerta", instr: "Ponla en aumentativo", correcto: "portón",   opciones: ["portón", "puertita", "puertas"] },
        { base: "muñeco", instr: "Ponla en aumentativo", correcto: "muñecote", opciones: ["muñecote", "muñequito", "muñecos"] },
        { base: "rico",   instr: "Ponla en aumentativo", correcto: "ricachón", opciones: ["ricachón", "riquito", "ricos"] }
      ]
    ],
    genero_numero: [
      // básico
      [
        { base: "niño",  instr: "Cámbiala a femenino", correcto: "niña",   opciones: ["niña", "niñe", "niños"] },
        { base: "gato",  instr: "Ponla en plural",     correcto: "gatos",  opciones: ["gatos", "gata", "gatito"] },
        { base: "perra", instr: "Cámbiala a masculino", correcto: "perro", opciones: ["perro", "perras", "perrito"] },
        { base: "flor",  instr: "Ponla en plural",     correcto: "flores", opciones: ["flores", "flora", "florcita"] },
        { base: "el",    instr: "Cámbialo a femenino", correcto: "la",     opciones: ["la", "lo", "los"] },
        { base: "amigo", instr: "Cámbiala a femenino", correcto: "amiga",  opciones: ["amiga", "amigos", "amiguito"] }
      ],
      // intermedio
      [
        { base: "profesor", instr: "Cámbiala a femenino", correcto: "profesora", opciones: ["profesora", "profesores", "profesorita"] },
        { base: "lápiz",    instr: "Ponla en plural",     correcto: "lápices",   opciones: ["lápices", "lápizes", "lapicito"] },
        { base: "león",     instr: "Cámbiala a femenino", correcto: "leona",     opciones: ["leona", "leones", "leoncito"] },
        { base: "pez",      instr: "Ponla en plural",     correcto: "peces",     opciones: ["peces", "pezes", "pececito"] },
        { base: "una",      instr: "Cámbialo a masculino", correcto: "un",       opciones: ["un", "uno", "unas"] },
        { base: "rey",      instr: "Cámbiala a femenino", correcto: "reina",     opciones: ["reina", "reyes", "reyna"] }
      ],
      // avanzado
      [
        { base: "actor",     instr: "Cámbiala a femenino", correcto: "actriz",     opciones: ["actriz", "actora", "actores"] },
        { base: "ciudad",    instr: "Ponla en plural",     correcto: "ciudades",   opciones: ["ciudades", "ciudads", "ciudadcita"] },
        { base: "caballo",   instr: "Cámbiala a femenino", correcto: "yegua",      opciones: ["yegua", "caballa", "caballos"] },
        { base: "lunes",     instr: "Ponla en plural",     correcto: "lunes",      opciones: ["lunes", "luneses", "lunás"] },
        { base: "emperador", instr: "Cámbiala a femenino", correcto: "emperatriz", opciones: ["emperatriz", "emperadora", "emperadores"] },
        { base: "jabalí",    instr: "Ponla en plural",     correcto: "jabalíes",   opciones: ["jabalíes", "jabalís", "jabalices"] }
      ]
    ]
  };

  function itemDe(clave) {
    const pool = BANCOS[clave];
    let niv = Juego.nivelIdx();
    let arr = pool[niv];
    for (let k = niv; k >= 0 && (!arr || !arr.length); k--) arr = pool[k];
    return Juego.azarEl(arr);
  }

  function rondaDe(clave) {
    return function (host, ctrl) {
      const it = itemDe(clave);
      ctrl.pregunta(it.instr + ': <b>' + it.base + '</b>');
      const opciones = ctrl.mezclar(it.opciones.slice());
      opciones.forEach((op) => {
        const b = document.createElement("button");
        b.className = "ord-chip";
        b.textContent = op;
        b.onclick = () => {
          if (op === it.correcto) {
            b.classList.add("ok");
            ctrl.ganar();
          } else {
            ctrl.reintento("Casi; fíjate en la terminación 👀");
          }
        };
        host.appendChild(b);
      });
    };
  }

  window.Formas = Actividad("forma", [
    { icono: "🐭", nombre: "Diminutivos",       desc: "perro → perrito",        ronda: rondaDe("diminutivos") },
    { icono: "🐘", nombre: "Aumentativos",      desc: "perro → perrazo",        ronda: rondaDe("aumentativos") },
    { icono: "👫", nombre: "Género y número",   desc: "niño → niña, gato → gatos", ronda: rondaDe("genero_numero") }
  ]);
})();
