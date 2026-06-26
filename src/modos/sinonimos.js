/* ============================================================
   SINÓNIMOS Y ANTÓNIMOS — Lengua (motor manipulativo: emparejar)
   El niño TOCA una palabra de la izquierda y luego su pareja de la
   derecha. Al unir todas las parejas se gana la ronda.
   El catálogo escala con el nivel del perfil (Juego.nivelIdx()):
     · básico:     3 parejas
     · intermedio: 4 parejas
     · avanzado:   5 parejas
   En los niveles altos se mezclan también las parejas de niveles
   inferiores, para que repase lo ya aprendido.
   Español del Ecuador, ~9 años.
   ============================================================ */
(function () {
  // Bancos por nivel [básico, intermedio, avanzado].
  const SINONIMOS = [
    [ // básico
      ["contento", "feliz"], ["bonito", "lindo"], ["grande", "enorme"],
      ["rápido", "veloz"], ["casa", "hogar"], ["lindo", "hermoso"],
      ["chico", "pequeño"], ["alegre", "contento"],
      ["feo", "horrible"], ["flaco", "delgado"], ["gordo", "grueso"],
      ["niño", "chiquillo"], ["sucio", "cochino"], ["raro", "extraño"],
      ["viejo", "anciano"], ["gritar", "chillar"]
    ],
    [ // intermedio
      ["valiente", "audaz"], ["comenzar", "empezar"], ["mojado", "húmedo"],
      ["tonto", "bobo"], ["listo", "inteligente"], ["enojado", "molesto"],
      ["bello", "precioso"], ["fuerte", "robusto"],
      ["asustado", "temeroso"], ["cansado", "agotado"], ["bravo", "furioso"],
      ["caminar", "andar"], ["famoso", "conocido"], ["barato", "económico"],
      ["delicioso", "sabroso"], ["amplio", "espacioso"]
    ],
    [ // avanzado
      ["diminuto", "pequeño"], ["hermoso", "precioso"], ["oculto", "escondido"],
      ["asustado", "atemorizado"], ["antiguo", "viejo"], ["sabio", "inteligente"],
      ["veloz", "ligero"], ["tranquilo", "sereno"],
      ["valiente", "intrépido"], ["generoso", "desprendido"], ["afortunado", "dichoso"],
      ["enorme", "colosal"], ["extraño", "insólito"], ["honesto", "sincero"],
      ["abundante", "copioso"], ["risueño", "sonriente"]
    ]
  ];

  const ANTONIMOS = [
    [ // básico
      ["grande", "pequeño"], ["alto", "bajo"], ["día", "noche"],
      ["frío", "calor"], ["feliz", "triste"], ["bueno", "malo"],
      ["blanco", "negro"], ["nuevo", "viejo"],
      ["gordo", "flaco"], ["rápido", "lento"], ["caliente", "frío"],
      ["dulce", "amargo"], ["fuerte", "débil"], ["duro", "blando"],
      ["claro", "oscuro"], ["seco", "mojado"]
    ],
    [ // intermedio
      ["subir", "bajar"], ["abrir", "cerrar"], ["limpio", "sucio"],
      ["lleno", "vacío"], ["dentro", "fuera"], ["entrar", "salir"],
      ["mucho", "poco"], ["arriba", "abajo"],
      ["cerca", "lejos"], ["ganar", "perder"], ["empezar", "terminar"],
      ["dar", "quitar"], ["juntar", "separar"], ["recordar", "olvidar"],
      ["encender", "apagar"], ["temprano", "tarde"]
    ],
    [ // avanzado
      ["valiente", "cobarde"], ["generoso", "tacaño"], ["claro", "oscuro"],
      ["áspero", "suave"], ["antiguo", "moderno"], ["alegre", "afligido"],
      ["fácil", "difícil"], ["amplio", "estrecho"],
      ["humilde", "orgulloso"], ["verdad", "mentira"], ["aceptar", "rechazar"],
      ["ordenado", "desordenado"], ["culpable", "inocente"], ["permitir", "prohibir"],
      ["aparecer", "desaparecer"], ["aumentar", "disminuir"]
    ]
  ];

  // Devuelve el banco acumulado hasta el nivel actual (incluye inferiores).
  function bancoHasta(bancos, niv) {
    let acc = [];
    for (let k = 0; k <= niv; k++) acc = acc.concat(bancos[k]);
    return acc;
  }

  function hacerRonda(bancos) {
    return function (host, ctrl) {
      const niv = Juego.nivelIdx();
      const cuantas = Juego.porNivel([3, 4, 5]);
      const banco = bancoHasta(bancos, niv);
      const elegidos = ctrl.mezclar(banco.slice()).slice(0, cuantas);
      const pares = elegidos.map((p) => ({ a: p[0], b: p[1] }));
      Arrastrar.emparejar(host, ctrl, {
        pregunta: "Toca una palabra de la izquierda y luego su pareja 👇",
        pares: pares
      });
    };
  }

  window.Sinonimos = Actividad("sino", [
    { icono: "🟰", nombre: "Sinónimos", desc: "palabras que significan lo mismo", total: 8, ronda: hacerRonda(SINONIMOS) },
    { icono: "↔️", nombre: "Antónimos", desc: "palabras opuestas", total: 8, ronda: hacerRonda(ANTONIMOS) }
  ]);
})();
