/* ============================================================
   ORDEN ALFABÉTICO — Lengua (motor manipulativo: ordenar)
   El niño TOCA las palabras en orden alfabético (A → Z), como
   cuando se busca en el diccionario. El catálogo escala con el
   nivel del perfil (Juego.nivelIdx()):
     · básico:     grupos de 3 palabras, distinta 1ª letra
     · intermedio: grupos de 4 palabras, algunas comparten 1ª letra
     · avanzado:   grupos de 5 palabras, comparten 1ª y 2ª letra
   La comparación ignora tildes y mayúsculas (orden de diccionario).
   ============================================================ */
(function () {
  // Quita tildes y pasa a minúsculas para comparar como el diccionario.
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // Bancos de GRUPOS por nivel [básico, intermedio, avanzado].
  // Español del Ecuador, vocabulario para ~9 años.
  const GRUPOS_NIVEL = [
    // básico: 3 palabras, distinta primera letra
    [
      ["perro", "gato", "ave"],
      ["sol", "luna", "estrella"],
      ["banana", "manzana", "pera"],
      ["río", "lago", "mar"],
      ["niño", "abuela", "tío"],
      ["pan", "queso", "arroz"],
      ["zapato", "camisa", "gorra"],
      ["Quito", "Cuenca", "Manta"],
      ["mango", "uva", "limón"],
      ["tigre", "oso", "foca"],
      ["mesa", "silla", "cama"],
      ["nube", "lluvia", "viento"],
      ["rojo", "azul", "verde"],
      ["lunes", "martes", "jueves"],
      ["dedo", "mano", "pie"],
      ["leche", "café", "agua"]
    ],
    // intermedio: 4 palabras, algunas comparten la primera letra
    [
      ["casa", "carro", "cama", "ave"],
      ["mar", "mesa", "mono", "luna"],
      ["pato", "pera", "perro", "ave"],
      ["sol", "selva", "sapo", "luna"],
      ["lápiz", "luna", "libro", "ave"],
      ["banana", "barco", "bota", "uva"],
      ["tigre", "tortuga", "tren", "ave"],
      ["río", "rosa", "rana", "ola"],
      ["pera", "piña", "pan", "uva"],
      ["gato", "gallo", "ganso", "oso"],
      ["mesa", "mono", "mango", "ave"],
      ["sol", "silla", "selva", "uno"],
      ["casa", "cielo", "campo", "uva"],
      ["tren", "tigre", "torre", "ave"],
      ["rosa", "ratón", "risa", "ola"],
      ["bota", "bote", "barco", "ave"]
    ],
    // avanzado: 5 palabras, varias comparten 1ª y 2ª letra
    [
      ["pato", "pala", "palo", "pan", "perro"],
      ["mango", "manzana", "mar", "martes", "mesa"],
      ["casa", "carro", "cama", "campo", "cielo"],
      ["sala", "salto", "sapo", "selva", "sol"],
      ["barco", "barro", "balsa", "banco", "bota"],
      ["cara", "carta", "carne", "casa", "ceja"],
      ["lana", "lápiz", "largo", "leche", "luna"],
      ["rama", "rana", "ratón", "remo", "río"],
      ["pino", "pila", "pico", "pita", "piña"],
      ["mesa", "menta", "metro", "medio", "melón"],
      ["cara", "cama", "cabo", "caña", "casa"],
      ["lobo", "loma", "lona", "loro", "lodo"],
      ["tela", "tema", "teja", "tecla", "tenis"],
      ["sopa", "soga", "sola", "solo", "sonido"],
      ["pato", "pala", "palo", "pavo", "paso"],
      ["rana", "rama", "rato", "raya", "raro"]
    ]
  ];

  function ronda(host, ctrl) {
    const niv = Juego.nivelIdx();
    const grupo = ctrl.azarEl(GRUPOS_NIVEL[niv]);
    const correcto = grupo.slice().sort((a, b) => norm(a).localeCompare(norm(b)));
    Arrastrar.ordenar(host, ctrl, {
      pregunta: "Toca las palabras en orden alfabético (A → Z) 👇",
      correcto: correcto
    });
  }

  window.Alfabetico = Actividad("alfab", [
    { icono: "🔤", nombre: "Orden alfabético", desc: "Ordena de la A a la Z", total: 8, ronda: ronda }
  ]);
})();
