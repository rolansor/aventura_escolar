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
      ["chico", "pequeño"], ["alegre", "contento"]
    ],
    [ // intermedio
      ["valiente", "audaz"], ["comenzar", "empezar"], ["mojado", "húmedo"],
      ["tonto", "bobo"], ["listo", "inteligente"], ["enojado", "molesto"],
      ["bello", "precioso"], ["fuerte", "robusto"]
    ],
    [ // avanzado
      ["diminuto", "pequeño"], ["hermoso", "precioso"], ["oculto", "escondido"],
      ["asustado", "atemorizado"], ["antiguo", "viejo"], ["sabio", "inteligente"],
      ["veloz", "ligero"], ["tranquilo", "sereno"]
    ]
  ];

  const ANTONIMOS = [
    [ // básico
      ["grande", "pequeño"], ["alto", "bajo"], ["día", "noche"],
      ["frío", "calor"], ["feliz", "triste"], ["bueno", "malo"],
      ["blanco", "negro"], ["nuevo", "viejo"]
    ],
    [ // intermedio
      ["subir", "bajar"], ["abrir", "cerrar"], ["limpio", "sucio"],
      ["lleno", "vacío"], ["dentro", "fuera"], ["entrar", "salir"],
      ["mucho", "poco"], ["arriba", "abajo"]
    ],
    [ // avanzado
      ["valiente", "cobarde"], ["generoso", "tacaño"], ["claro", "oscuro"],
      ["áspero", "suave"], ["antiguo", "moderno"], ["alegre", "afligido"],
      ["fácil", "difícil"], ["amplio", "estrecho"]
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
