/* Comparar y ordenar — Matemáticas (motor manipulativo)
   Balanza que se inclina hacia el número mayor, cartas que crecen al
   elegirlas y ordenar tocando dos cartas para intercambiarlas.
   La idea abstracta (>, <, =) nace de una acción concreta: pesar. */
(function () {
  const az = (a, b) => Juego.azar(a, b);
  // El nivel del perfil acota la magnitud de los números a comparar/ordenar.
  function rng() { return Juego.porNivel([[2, 50], [10, 999], [1000, 999999]]); }
  function nums(cant, min, max) {
    const s = {}, r = [];
    while (r.length < cant) { const n = az(min, max); if (!s[n]) { s[n] = 1; r.push(n); } }
    return r;
  }

  /* ---------- Balanza: toca el plato más pesado ---------- */
  function rondaBalanza(host, ctrl) {
    const g = rng(); let a = az(g[0], g[1]), b = az(g[0], g[1]);
    if (Math.random() < 0.18) b = a;           // a veces son iguales
    ctrl.pregunta("⚖️ Toca el plato que pesa más (el número <b>mayor</b>)");
    host.innerHTML =
      '<div class="balanza">' +
        '<div class="bal-viga">' +
          '<div class="bal-cuerda izq"></div><div class="bal-cuerda der"></div>' +
          '<button class="bal-plato" data-lado="izq"><span class="bal-num">' + a + "</span></button>" +
          '<span class="bal-signo"></span>' +
          '<button class="bal-plato" data-lado="der"><span class="bal-num">' + b + "</span></button>" +
        "</div>" +
        '<div class="bal-poste"></div><div class="bal-base"></div>' +
      "</div>" +
      '<button class="bal-ig">⚖️ Pesan igual</button>';
    const viga = host.querySelector(".bal-viga");
    const signo = host.querySelector(".bal-signo");
    const correcto = a === b ? "ig" : (a > b ? "izq" : "der");
    let listo = false;
    function resolver() {
      listo = true;
      viga.classList.add(a > b ? "baja-izq" : a < b ? "baja-der" : "nivel");
      signo.textContent = a > b ? ">" : a < b ? "<" : "=";
      ctrl.ganar();
    }
    function fallo(el) {
      el.classList.add("tiembla"); setTimeout(() => el.classList.remove("tiembla"), 450);
      ctrl.reintento("Mira bien los números 👀");
    }
    host.querySelectorAll(".bal-plato").forEach((p) => {
      p.onclick = () => { if (listo) return; (p.dataset.lado === correcto) ? resolver() : fallo(p); };
    });
    host.querySelector(".bal-ig").onclick = function () {
      if (listo) return; (correcto === "ig") ? resolver() : fallo(this);
    };
  }

  /* ---------- Elegir mayor / menor: la carta crece ---------- */
  function rondaElegir(buscarMayor) {
    return function (host, ctrl) {
      const g = rng(); const ns = nums(4, g[0], g[1]);
      const meta = buscarMayor ? Math.max.apply(null, ns) : Math.min.apply(null, ns);
      ctrl.pregunta("Toca el número <b>" + (buscarMayor ? "MAYOR ⬆️" : "MENOR ⬇️") + "</b>");
      host.innerHTML = '<div class="fila-cartas"></div>';
      const fila = host.querySelector(".fila-cartas");
      let listo = false;
      ns.forEach((n) => {
        const c = document.createElement("button");
        c.className = "carta-num"; c.textContent = n;
        c.onclick = () => {
          if (listo) return;
          if (n === meta) {
            listo = true; c.classList.add("crece", "ok");
            fila.querySelectorAll(".carta-num").forEach((x) => { if (x !== c) x.classList.add("apaga"); });
            ctrl.ganar();
          } else {
            c.classList.add("tiembla"); setTimeout(() => c.classList.remove("tiembla"), 450);
            ctrl.reintento("Ese no es. Busca el " + (buscarMayor ? "mayor" : "menor") + " 👀");
          }
        };
        fila.appendChild(c);
      });
    };
  }

  /* ---------- Ordenar: toca dos cartas para intercambiarlas ---------- */
  function rondaOrden(host, ctrl) {
    const g = rng(); let ns = nums(3, g[0], g[1]);
    while (ns[0] < ns[1] && ns[1] < ns[2]) ns = Juego.mezclar(ns);   // que NO empiece ordenado
    ctrl.pregunta("Ordena de <b>MENOR a MAYOR</b>. Toca dos cartas para cambiarlas ↔️");
    host.innerHTML = '<div class="fila-orden"></div><div class="orden-guia">⬅️ menor &nbsp;·&nbsp; mayor ➡️</div>';
    const fila = host.querySelector(".fila-orden");
    let sel = -1, listo = false;
    function ordenado() { return ns[0] < ns[1] && ns[1] < ns[2]; }
    function pinta() {
      fila.innerHTML = "";
      ns.forEach((n, idx) => {
        const c = document.createElement("button");
        c.className = "carta-num" + (idx === sel ? " elegida" : "") + (listo ? " ok" : "");
        c.textContent = n;
        c.onclick = () => {
          if (listo) return;
          if (sel === -1) { sel = idx; pinta(); }
          else if (sel === idx) { sel = -1; pinta(); }
          else {
            const tmp = ns[sel]; ns[sel] = ns[idx]; ns[idx] = tmp; sel = -1;
            if (ordenado()) { listo = true; pinta(); ctrl.ganar(); }
            else { pinta(); ctrl.retro("Sigue acomodando ↔️", ""); }
          }
        };
        fila.appendChild(c);
      });
    }
    pinta();
  }

  window.Comparar = Actividad("cmp", [
    { icono: "⚖️", nombre: "La balanza", desc: "¿cuál pesa más?", ronda: rondaBalanza },
    { icono: "⬆️", nombre: "El mayor", desc: "toca el más grande", ronda: rondaElegir(true) },
    { icono: "⬇️", nombre: "El menor", desc: "toca el más pequeño", ronda: rondaElegir(false) },
    { icono: "🔢", nombre: "Ordenar", desc: "de menor a mayor", ronda: rondaOrden }
  ]);
})();
