/* Medidas — Matemáticas (motor manipulativo)
   "¿Qué unidad?" arrastrando el objeto a su medida, y "Ordena medidas"
   de menor a mayor (tocando dos tarjetas para intercambiarlas).
   Usa window.Arrastrar (eventos de puntero: mouse + dedo). */
(function () {
  const COSAS = [
    { emoji: "🥛", nombre: "la leche de un cartón", unidad: "litros" },
    { emoji: "⚖️", nombre: "tu peso", unidad: "kilos" },
    { emoji: "🛣️", nombre: "la distancia entre dos ciudades", unidad: "kilómetros" },
    { emoji: "📓", nombre: "el largo de tu cuaderno", unidad: "centímetros" },
    { emoji: "🏊", nombre: "el agua de una piscina", unidad: "litros" },
    { emoji: "🍚", nombre: "una bolsa de arroz", unidad: "kilos" },
    { emoji: "🚪", nombre: "la altura de una puerta", unidad: "metros" },
    { emoji: "🧃", nombre: "un vaso de jugo", unidad: "mililitros" },
    { emoji: "⚽", nombre: "el largo de una cancha", unidad: "metros" },
    { emoji: "🍎", nombre: "una manzana", unidad: "gramos" }
  ];
  const UNIDADES = ["litros", "kilos", "kilómetros", "centímetros", "metros", "mililitros", "gramos"];
  const ICONO = { litros: "🥤", kilos: "⚖️", kilómetros: "🛣️", centímetros: "📏", metros: "📐", mililitros: "🧪", gramos: "🪶" };

  /* ---------- ¿Qué unidad? — arrastra el objeto a su medida ---------- */
  function rondaUnidad(host, ctrl) {
    const cosa = ctrl.azarEl(COSAS);
    const otras = ctrl.mezclar(UNIDADES.filter((u) => u !== cosa.unidad)).slice(0, 3);
    const units = ctrl.mezclar(otras.concat([cosa.unidad]));
    ctrl.pregunta("¿En qué se mide <b>" + cosa.nombre + "</b>? Arrastra " + cosa.emoji + " a su medida 👇");
    host.innerHTML =
      '<div class="cubos">' + units.map((u) =>
        '<div class="cubo" data-u="' + u + '"><span class="cubo-ic">' + ICONO[u] + "</span><small>" + u + "</small></div>").join("") + "</div>" +
      '<div class="fila-fichas"><button class="ficha-arr objeto-arr" data-u="' + cosa.unidad + '">' + cosa.emoji + " " + cosa.nombre + "</button></div>";
    const zonas = Array.prototype.slice.call(host.querySelectorAll(".cubo"));
    const chip = host.querySelector(".objeto-arr");
    let listo = false;
    Arrastrar.hacer(chip, zonas, (item, zona) => {
      if (listo || !zona) return;
      if (zona.dataset.u === item.dataset.u) {
        listo = true; zona.classList.add("ok"); item.dataset.fijo = "1";
        item.classList.add("colocada"); zona.appendChild(item); ctrl.ganar();
      } else {
        zona.classList.add("rojo"); setTimeout(() => zona.classList.remove("rojo"), 450);
        ctrl.reintento("Esa no es la medida 👀");
      }
    });
  }

  /* ---------- Ordena medidas de menor a mayor (toca dos para cambiarlas) ---------- */
  const DIMS = [
    { nombre: "longitud", items: [{ txt: "50 cm", val: 50 }, { txt: "80 cm", val: 80 }, { txt: "1 m", val: 100 },
      { txt: "150 cm", val: 150 }, { txt: "2 m", val: 200 }, { txt: "3 m", val: 300 }] },
    { nombre: "capacidad", items: [{ txt: "250 ml", val: 250 }, { txt: "500 ml", val: 500 }, { txt: "1 L", val: 1000 },
      { txt: "1500 ml", val: 1500 }, { txt: "2 L", val: 2000 }] },
    { nombre: "masa", items: [{ txt: "100 g", val: 100 }, { txt: "250 g", val: 250 }, { txt: "500 g", val: 500 },
      { txt: "1 kg", val: 1000 }, { txt: "2 kg", val: 2000 }] }
  ];
  function rondaOrdena(host, ctrl) {
    const dim = ctrl.azarEl(DIMS);
    let cs = ctrl.mezclar(dim.items.slice()).slice(0, 3);
    while (cs[0].val < cs[1].val && cs[1].val < cs[2].val) cs = ctrl.mezclar(cs);
    ctrl.pregunta("Ordena de <b>MENOR a MAYOR</b> (" + dim.nombre + "). Toca dos tarjetas ↔️");
    host.innerHTML = '<div class="fila-orden"></div><div class="orden-guia">⬅️ menos &nbsp;·&nbsp; más ➡️</div>';
    const fila = host.querySelector(".fila-orden");
    let sel = -1, listo = false;
    const ordenado = () => cs[0].val < cs[1].val && cs[1].val < cs[2].val;
    function pinta() {
      fila.innerHTML = "";
      cs.forEach((c, idx) => {
        const b = document.createElement("button");
        b.className = "carta-num" + (idx === sel ? " elegida" : "") + (listo ? " ok" : "");
        b.textContent = c.txt;
        b.onclick = () => {
          if (listo) return;
          if (sel === -1) { sel = idx; pinta(); }
          else if (sel === idx) { sel = -1; pinta(); }
          else {
            const t = cs[sel]; cs[sel] = cs[idx]; cs[idx] = t; sel = -1;
            if (ordenado()) { listo = true; pinta(); ctrl.ganar(); }
            else { pinta(); ctrl.retro("Sigue acomodando ↔️", ""); }
          }
        };
        fila.appendChild(b);
      });
    }
    pinta();
  }

  window.Medidas = Actividad("med", [
    { icono: "📏", nombre: "¿Qué unidad?", desc: "arrastra a su medida", ronda: rondaUnidad },
    { icono: "🔢", nombre: "Ordena medidas", desc: "de menor a mayor", ronda: rondaOrdena }
  ]);
})();
