/* ============================================================
   REFRANES Y ADIVINANZAS — Lengua (motor manipulativo: emparejar)
   El niño UNE PAREJAS tocando una de la izquierda y su pareja de la
   derecha (Arrastrar.emparejar). Dos temas:
     · Refranes:    comienzo ↔ final del refrán.
     · Adivinanzas: texto de la adivinanza ↔ su respuesta.
   El banco escala con el nivel del perfil (Juego.nivelIdx()):
     · básico:     refranes/adivinanzas más cortos y fáciles  (3 parejas)
     · intermedio: más largos o menos obvios                  (4 parejas)
     · avanzado:   los más largos / menos evidentes            (5 parejas)
   Textos CORTOS, español del Ecuador, ~9 años.
   ============================================================ */
(function () {
  // Bancos por nivel [básico, intermedio, avanzado].
  const REFRANES = [
    [ // básico
      { a: "Al que madruga…", b: "…Dios le ayuda" },
      { a: "Más vale tarde…", b: "…que nunca" },
      { a: "El que ríe último…", b: "…ríe mejor" },
      { a: "Más vale pájaro en mano…", b: "…que cien volando" },
      { a: "Ojos que no ven…", b: "…corazón que no siente" }
    ],
    [ // intermedio
      { a: "No por mucho madrugar…", b: "…amanece más temprano" },
      { a: "A caballo regalado…", b: "…no se le mira el diente" },
      { a: "Camarón que se duerme…", b: "…se lo lleva la corriente" },
      { a: "En casa de herrero…", b: "…cuchillo de palo" },
      { a: "Más sabe el diablo por viejo…", b: "…que por diablo" }
    ],
    [ // avanzado
      { a: "No dejes para mañana…", b: "…lo que puedas hacer hoy" },
      { a: "El que mucho abarca…", b: "…poco aprieta" },
      { a: "Cría fama…", b: "…y échate a dormir" },
      { a: "Perro que ladra…", b: "…no muerde" },
      { a: "Dime con quién andas…", b: "…y te diré quién eres" }
    ]
  ];

  const ADIVINANZAS = [
    [ // básico
      { a: "Oro parece, plata no es…", b: "el plátano" },
      { a: "Blanca por dentro, verde por fuera…", b: "la pera" },
      { a: "Te la digo y no me entiendes…", b: "la tela" },
      { a: "Redondo, redondo, sin tapa ni fondo…", b: "el anillo" },
      { a: "Vuela sin alas, silba sin boca…", b: "el viento" }
    ],
    [ // intermedio
      { a: "Agua pasa por mi casa, cate de mi corazón…", b: "el aguacate" },
      { a: "Lana sube, lana baja…", b: "la navaja" },
      { a: "Tengo agujas y no sé coser…", b: "el reloj" },
      { a: "Llena de letras, no es cuaderno; tiene lomo y no es animal…", b: "el libro" },
      { a: "Sube llena, baja vacía; si no se apura, la sopa se enfría…", b: "la cuchara" }
    ],
    [ // avanzado
      { a: "Blanco fue mi nacimiento, verde mi vivir; me pusieron amarillo y empecé a morir…", b: "el limón" },
      { a: "En el campo me crié atada con verdes lazos; quien llora por mí me está partiendo en pedazos…", b: "la cebolla" },
      { a: "Soy el rey de la selva, fuerte y con melena…", b: "el león" },
      { a: "Una señora muy aseñorada, con muchos remiendos y ninguna puntada…", b: "la gallina" },
      { a: "Verde fue mi nacimiento, colorada mi niñez; ahora que ya estoy madura, negra me he de volver…", b: "la mora" }
    ]
  ];

  // Devuelve N parejas del banco del nivel actual (mezcladas).
  function tomar(banco) {
    const niv = Juego.nivelIdx();
    const n = Juego.porNivel([3, 4, 5]);
    const arr = banco[niv] || banco[0];
    return Juego.mezclar(arr.slice()).slice(0, n);
  }

  function rondaRefranes(host, ctrl) {
    Arrastrar.emparejar(host, ctrl, {
      pregunta: "Une el comienzo del refrán con su final 👇",
      pares: tomar(REFRANES)
    });
  }

  function rondaAdivinanzas(host, ctrl) {
    Arrastrar.emparejar(host, ctrl, {
      pregunta: "Une cada adivinanza con su respuesta 👇",
      pares: tomar(ADIVINANZAS)
    });
  }

  window.Refranes = Actividad("refran", [
    { icono: "📜", nombre: "Refranes", desc: "une el refrán con su final", total: 6, ronda: rondaRefranes },
    { icono: "🧩", nombre: "Adivinanzas", desc: "¿qué será, qué será?", total: 6, ronda: rondaAdivinanzas }
  ]);
})();
