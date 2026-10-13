/* Geometría — Matemáticas, segundo trimestre (motor manipulativo)
   Dos actividades comparten este archivo (cada página arranca la suya):
     Rectas (px "rec"): gira la recta · el plano del barrio · ponles nombre ·
                        abre el ángulo · ¿agudo, recto u obtuso? · mide con el graduador
     Cuadri (px "cua"): familias de cuadriláteros · ¿cómo se llama? · cada figura con
                        su pista · camina el contorno (perímetro) · problemas de perímetro
   Todo se dibuja en SVG y se manipula con eventos de puntero (mouse + dedo):
   la recta y el lado del ángulo se GIRAN, el graduador se ARRASTRA hasta la
   punta del ángulo, las figuras se sueltan en su familia y el perímetro se
   "camina" tocando cada lado. Dificultad por Juego.nivelIdx().              */
(function () {
  const RAD = Math.PI / 180;
  const esc = (s) => Juego.esc(s);
  const f1 = (n) => (Math.round(n * 10) / 10);

  /* ---------- Ayudantes ---------- */
  // Punto del puntero en coordenadas del viewBox del SVG.
  function punto(svg, e) {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const m = svg.getScreenCTM();
    return m ? p.matrixTransform(m.inverse()) : p;
  }
  // Arrastre genérico de una pieza del SVG: alMover(punto, puntoInicial), alSoltar(punto).
  function arrastre(el, svg, alMover, alSoltar) {
    el.style.touchAction = "none";
    el.addEventListener("pointerdown", function (e) {
      if (el.dataset.fijo === "1") return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      el.classList.add("agarrando");
      const ini = punto(svg, e);
      function mover(ev) { alMover(punto(svg, ev), ini); }
      function soltar(ev) {
        el.removeEventListener("pointermove", mover);
        el.removeEventListener("pointerup", soltar);
        el.removeEventListener("pointercancel", soltar);
        el.classList.remove("agarrando");
        try { el.releasePointerCapture(e.pointerId); } catch (_) {}
        if (alSoltar) alSoltar(punto(svg, ev));
      }
      el.addEventListener("pointermove", mover);
      el.addEventListener("pointerup", soltar);
      el.addEventListener("pointercancel", soltar);
    });
  }
  // Reparte una lista como mazo barajado (no repite hasta agotarla). Vive en ctrl.memo (por tema).
  function turno(ctrl, clave, lista) {
    let c = ctrl.memo[clave];
    if (!c || !c.length) c = ctrl.memo[clave] = ctrl.mezclar(lista.slice());
    return c.pop();
  }
  // Punto a distancia r de (x, y) en la dirección `ang` (grados, antihorario; la y del SVG baja).
  function hacia(x, y, ang, r) { return [x + r * Math.cos(ang * RAD), y - r * Math.sin(ang * RAD)]; }
  function botonListo(host, alComprobar) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "boton-grande geo-listo"; b.textContent = "✅ ¡Listo!";
    b.onclick = alComprobar;
    host.appendChild(b);
    return b;
  }
  // Botones tipo ficha (.ord-chip) para elegir un número.
  function fichasNumero(cont, valores, alElegir) {
    cont.innerHTML = "";
    valores.forEach((v) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "ord-chip"; b.textContent = v.txt;
      b.onclick = () => alElegir(v, b);
      cont.appendChild(b);
    });
  }

  /* ============================================================
     RECTAS
     ============================================================ */
  const DIRECCIONES = [[0, 90], [0, 90, 30, 60, 120, 150], [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165]];
  const PIDE = {
    paralela: "<b>paralela</b> a la azul: que nunca se choquen, como los rieles del tren 🛤️",
    perpendicular: "<b>secante perpendicular</b>: que se crucen formando una esquina recta ➕",
    oblicua: "<b>secante oblicua</b>: que se crucen inclinadas, sin esquina recta ✖️"
  };
  // Diferencia entre dos direcciones: 0° = paralelas … 90° = perpendiculares.
  function abertura(a, b) { let d = Math.abs(a - b) % 180; if (d > 90) d = 180 - d; return Math.round(d); }
  function tipoDe(d) { return d === 0 ? "paralela" : d === 90 ? "perpendicular" : "oblicua"; }
  // Cruce de dos rectas dadas por punto y dirección (null si son paralelas).
  function cruce(p1, a1, p2, a2) {
    const d1 = [Math.cos(a1 * RAD), -Math.sin(a1 * RAD)], d2 = [Math.cos(a2 * RAD), -Math.sin(a2 * RAD)];
    const den = d1[0] * d2[1] - d1[1] * d2[0];
    if (Math.abs(den) < 1e-6) return null;
    const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / den;
    return [p1[0] + t * d1[0], p1[1] + t * d1[1]];
  }

  // 1. Gira la recta roja hasta que sea paralela / perpendicular / oblicua a la azul.
  function rectaGirar(host, ctrl) {
    const meta = turno(ctrl, "metas", ["paralela", "perpendicular", "oblicua"]);
    const a1 = ctrl.azarEl(Juego.porNivel(DIRECCIONES));
    const C = [170, 120], n = [Math.sin(a1 * RAD), Math.cos(a1 * RAD)];
    const P1 = [C[0] - n[0] * 40, C[1] - n[1] * 40];      // por aquí pasa la azul
    const P2 = [C[0] + n[0] * 40, C[1] + n[1] * 40];      // eje de la roja
    let a2 = meta === "paralela" ? a1 + 45 : meta === "perpendicular" ? a1 + 30 : a1;   // arranca "mal" a propósito
    let listo = false;

    ctrl.pregunta("Gira la recta roja para que sea " + PIDE[meta]);
    const e1 = hacia(P1[0], P1[1], a1, 400), e2 = hacia(P1[0], P1[1], a1 + 180, 400);
    host.innerHTML =
      '<svg class="geo-svg" viewBox="0 0 340 240">' +
        '<line class="geo-recta fija" x1="' + f1(e1[0]) + '" y1="' + f1(e1[1]) + '" x2="' + f1(e2[0]) + '" y2="' + f1(e2[1]) + '"/>' +
        '<g class="geo-marcas"></g>' +
        '<line class="geo-recta movil"/>' +
        '<circle class="geo-eje" cx="' + f1(P2[0]) + '" cy="' + f1(P2[1]) + '" r="5"/>' +
        '<circle class="geo-perilla" r="13"/>' +
      "</svg>" +
      '<p class="geo-ayuda">Arrastra la bolita roja para girar la recta 🤏</p>';
    const svg = host.querySelector("svg"), movil = svg.querySelector(".movil");
    const perilla = svg.querySelector(".geo-perilla"), marcas = svg.querySelector(".geo-marcas");

    function pintar() {
      const a = hacia(P2[0], P2[1], a2, 400), b = hacia(P2[0], P2[1], a2 + 180, 400), k = hacia(P2[0], P2[1], a2, 70);
      movil.setAttribute("x1", f1(a[0])); movil.setAttribute("y1", f1(a[1]));
      movil.setAttribute("x2", f1(b[0])); movil.setAttribute("y2", f1(b[1]));
      perilla.setAttribute("cx", f1(k[0])); perilla.setAttribute("cy", f1(k[1]));
    }
    pintar();
    arrastre(perilla, svg, (p) => {
      if (listo) return;
      marcas.innerHTML = "";
      let ang = Math.atan2(-(p.y - P2[1]), p.x - P2[0]) / RAD;
      a2 = Math.round(ang / 15) * 15;                    // de 15° en 15°: las tres clases quedan nítidas
      pintar();
    });

    // El material "responde": esquina recta, rayitas de paralelas o punto de cruce.
    function marcar(tipo, clase) {
      const X = cruce(P1, a1, P2, a2);
      if (tipo === "paralela") {
        marcas.innerHTML = [[P1, a1], [P2, a2]].map((r) => {
          const m = hacia(r[0][0], r[0][1], r[1], -55);
          return [-4, 4].map((o) => {
            const q = hacia(m[0], m[1], r[1], o), s1 = hacia(q[0], q[1], r[1] + 60, 9), s2 = hacia(q[0], q[1], r[1] + 60, -9);
            return '<line class="geo-marca ' + clase + '" x1="' + f1(s1[0]) + '" y1="' + f1(s1[1]) + '" x2="' + f1(s2[0]) + '" y2="' + f1(s2[1]) + '"/>';
          }).join("");
        }).join("");
      } else if (X && tipo === "perpendicular") {
        const u = hacia(X[0], X[1], a1, 14), w = hacia(X[0], X[1], a2, 14), z = hacia(u[0], u[1], a2, 14);
        marcas.innerHTML = '<path class="geo-marca ' + clase + '" d="M' + f1(u[0]) + " " + f1(u[1]) + " L" + f1(z[0]) + " " + f1(z[1]) + " L" + f1(w[0]) + " " + f1(w[1]) + '"/>';
      } else if (X) {
        marcas.innerHTML = '<circle class="geo-cruce ' + clase + '" cx="' + f1(X[0]) + '" cy="' + f1(X[1]) + '" r="7"/>';
      }
    }
    botonListo(host, () => {
      if (listo) return;
      const d = abertura(a1, a2), hay = tipoDe(d);
      if (hay === meta) { listo = true; perilla.dataset.fijo = "1"; marcar(hay, "ok"); svg.classList.add("geo-ok"); ctrl.ganar(1500); return; }
      marcar(hay, "mal");
      ctrl.reintento(
        hay === "paralela" ? "Así nunca se cruzan: esas son <b>paralelas</b>. Gírala hasta que se choquen 👀"
        : hay === "perpendicular" ? "Esa esquina es recta: son <b>perpendiculares</b>. " + (meta === "paralela" ? "Las paralelas nunca se tocan 👀" : "Inclínala un poco 👀")
        : meta === "paralela" ? "Si las alargas, se chocan 💥. Las paralelas van siempre a la misma distancia."
        : "Se cruzan, pero inclinadas: todavía no es una esquina recta, como la de tu cuaderno 📓");
    });
  }

  // 2. El plano del barrio: toca la calle paralela / perpendicular / oblicua a la calle roja.
  function rectaBarrio(host, ctrl) {
    const niv = Juego.nivelIdx();
    const meta = turno(ctrl, "metas", ["paralela", "perpendicular", "oblicua"]);
    const a = ctrl.azarEl(DIRECCIONES[niv]);
    const C = [170, 120], d = [Math.cos(a * RAD), -Math.sin(a * RAD)], n = [Math.sin(a * RAD), Math.cos(a * RAD)];
    const inclina = (niv === 2 ? ctrl.azarEl([30, 60]) : 45) * ctrl.azarEl([1, -1]);
    const calles = ctrl.mezclar([
      { tipo: "paralela", p: [C[0] + n[0] * 50, C[1] + n[1] * 50], ang: a },
      { tipo: "perpendicular", p: [C[0] - d[0] * 75, C[1] - d[1] * 75], ang: a + 90 },
      { tipo: "oblicua", p: [C[0] + d[0] * 70, C[1] + d[1] * 70], ang: a + inclina }
    ]);
    const roja = { p: [C[0] - n[0] * 35, C[1] - n[1] * 35], ang: a };
    const NOMBRE = { paralela: "paralela", perpendicular: "secante perpendicular", oblicua: "secante oblicua" };
    const PISTA = { paralela: "nunca la cruza", perpendicular: "la cruza haciendo esquina recta", oblicua: "la cruza inclinada" };
    ctrl.pregunta("🏘️ Toca la calle <b>" + NOMBRE[meta] + "</b> a la calle roja" + (niv === 0 ? " (" + PISTA[meta] + ")" : ""));

    function calleSVG(c, clase, i) {
      const e1 = hacia(c.p[0], c.p[1], c.ang, 420), e2 = hacia(c.p[0], c.p[1], c.ang + 180, 420);
      const xy = 'x1="' + f1(e1[0]) + '" y1="' + f1(e1[1]) + '" x2="' + f1(e2[0]) + '" y2="' + f1(e2[1]) + '"';
      return '<g class="geo-calle ' + clase + '"' + (i == null ? "" : ' data-i="' + i + '"') + ">" +
        '<line class="borde" ' + xy + '/><line class="asfalto" ' + xy + '/><line class="raya" ' + xy + "/></g>";
    }
    host.innerHTML = '<svg class="geo-svg geo-barrio" viewBox="0 0 340 240"><rect class="geo-pasto" width="340" height="240"/>' +
      calles.map((c, i) => calleSVG(c, "opcion", i)).join("") + calleSVG(roja, "roja") + "</svg>";
    let listo = false;
    host.querySelectorAll(".geo-calle.opcion").forEach((g) => {
      g.addEventListener("click", () => {
        if (listo) return;
        const c = calles[+g.getAttribute("data-i")];
        if (c.tipo === meta) { listo = true; g.classList.add("ok"); ctrl.ganar(); }
        else {
          g.classList.add("mal"); setTimeout(() => g.classList.remove("mal"), 600);
          ctrl.reintento("Esa es <b>" + NOMBRE[c.tipo] + "</b>: " + PISTA[c.tipo] + " 👀");
        }
      });
    });
  }

  // 3. Ponles nombre: tres pares de rectas (A, B, C) y una ficha con el nombre de cada uno;
  //    después se toca el par que forma un ángulo de 90° (así lo pregunta el colegio).
  const NOMBRE_PAR = { paralela: "paralelas", perpendicular: "perpendiculares", oblicua: "oblicuas" };
  const DICE_PAR = {
    paralela: "Las <b>paralelas</b> nunca se cruzan: van siempre a la misma distancia",
    perpendicular: "Las <b>perpendiculares</b> se cruzan formando una esquina recta",
    oblicua: "Las <b>oblicuas</b> se cruzan inclinadas, sin esquina recta"
  };
  // Dibujo de un par: dirección `a` de la primera recta y abertura `d` con la segunda (0 = paralelas).
  function parSVG(a, d, conMarca) {
    const C = [55, 55];
    const recta = (p, ang) => {
      const e1 = hacia(p[0], p[1], ang, 80), e2 = hacia(p[0], p[1], ang + 180, 80);
      return '<line class="geo-recta fija" x1="' + f1(e1[0]) + '" y1="' + f1(e1[1]) + '" x2="' + f1(e2[0]) + '" y2="' + f1(e2[1]) + '"/>';
    };
    let s = '<svg class="geo-par-svg" viewBox="0 0 110 110"><g class="geo-marcas"></g>';
    if (d === 0) s += recta(hacia(C[0], C[1], a + 90, 16), a) + recta(hacia(C[0], C[1], a + 90, -16), a);
    else s += recta(C, a) + recta(C, a + d);
    return s + (conMarca && d === 90 ? esquina(C, a) : "") + "</svg>";
  }
  // La marca de la esquina recta (un cuadradito en el cruce).
  function esquina(C, a) {
    const u = hacia(C[0], C[1], a, 11), w = hacia(C[0], C[1], a + 90, 11), z = hacia(u[0], u[1], a + 90, 11);
    return '<path class="geo-marca ok" d="M' + f1(u[0]) + " " + f1(u[1]) + " L" + f1(z[0]) + " " + f1(z[1]) + " L" + f1(w[0]) + " " + f1(w[1]) + '"/>';
  }
  function rectaNombrar(host, ctrl) {
    const niv = Juego.nivelIdx();
    // En básico salen como en el cuaderno (derechitas y con la marca de la esquina recta).
    const base = () => (niv === 0 ? 0 : ctrl.azarEl(DIRECCIONES[niv]));
    const pares = ctrl.mezclar([
      { tipo: "paralela", a: base(), d: 0 },
      { tipo: "perpendicular", a: base(), d: 90 },
      { tipo: "oblicua", a: niv === 0 ? ctrl.azarEl([35, 55]) : base(), d: ctrl.azarEl(niv === 0 ? [70, 110] : [45, 60, 120, 135]) }
    ]);
    ctrl.pregunta("🏷️ ¿Cómo son estas rectas? Lleva cada nombre a su dibujo 👇");
    host.innerHTML = '<div class="geo-pares">' + pares.map((p, k) =>
      '<div class="geo-par" data-k="' + k + '"><span class="geo-letra">' + "ABC"[k] + "</span>" + parSVG(p.a, p.d, niv === 0) +
      '<div class="geo-par-nombre"></div></div>').join("") + '</div><div class="fila-fichas"></div>';
    const cartas = Array.prototype.slice.call(host.querySelectorAll(".geo-par")), fila = host.querySelector(".fila-fichas");
    let faltan = pares.length, listo = false;

    // Segundo paso: ¿cuál forma un ángulo de 90°?
    function preguntar90() {
      ctrl.pregunta("👆 Ahora toca el dibujo donde las rectas forman un ángulo de <b>90°</b>");
      ctrl.retro("¡Bien! Una pregunta más 👇", "bien");
      cartas.forEach((c) => {
        c.classList.add("tocable");
        c.onclick = () => {
          if (listo) return;
          const p = pares[+c.dataset.k];
          if (p.tipo === "perpendicular") {
            listo = true; c.classList.add("ok");
            c.querySelector(".geo-marcas").innerHTML = esquina([55, 55], p.a);
            ctrl.ganar(1500);
          } else {
            c.classList.add("rojo"); setTimeout(() => c.classList.remove("rojo"), 450);
            ctrl.reintento("Ahí no hay esquina recta. Un ángulo de 90° es como la esquina de tu cuaderno 📓");
          }
        };
      });
    }
    ctrl.mezclar(pares.slice()).forEach((p) => {
      const chip = document.createElement("button");
      chip.type = "button"; chip.className = "ficha-arr"; chip.textContent = NOMBRE_PAR[p.tipo];
      fila.appendChild(chip);
      Arrastrar.hacer(chip, cartas, (item, zona) => {
        if (!zona || zona.dataset.lleno === "1") return;
        if (pares[+zona.dataset.k].tipo === p.tipo) {
          zona.dataset.lleno = "1"; zona.classList.add("puesto");
          item.dataset.fijo = "1"; item.classList.add("colocada");
          zona.querySelector(".geo-par-nombre").appendChild(item);
          faltan--;
          if (faltan === 0) preguntar90(); else ctrl.retro("¡Bien! Faltan " + faltan + " 👇", "bien");
        } else {
          zona.classList.add("rojo"); setTimeout(() => zona.classList.remove("rojo"), 450);
          ctrl.reintento(DICE_PAR[p.tipo] + ". Mira bien ese dibujo 👀");
        }
      });
    });
  }

  /* ============================================================
     ÁNGULOS
     ============================================================ */
  // Graduador centrado en (0,0): semicírculo hacia arriba con rayas cada 5° y números cada 10°.
  // `segunda` añade la escala interior (la que empieza en 0 por la izquierda).
  function graduador(R, numeros, segunda) {
    let s = '<path class="grad-cuerpo" d="M' + (-R - 8) + " 0 A" + (R + 8) + " " + (R + 8) + " 0 0 1 " + (R + 8) + " 0 L" + (R + 8) + " 12 L" + (-R - 8) + ' 12 Z"/>';
    for (let g = 0; g <= 180; g += 5) {
      const largo = g % 10 === 0 ? 10 : 5, c = Math.cos(g * RAD), sn = Math.sin(g * RAD);
      s += '<line class="grad-raya" x1="' + f1(R * c) + '" y1="' + f1(-R * sn) + '" x2="' + f1((R - largo) * c) + '" y2="' + f1(-(R - largo) * sn) + '"/>';
      if (g % 10 === 0 && (numeros === "todos" || g % 90 === 0)) {
        s += '<text class="grad-num" x="' + f1((R - 19) * c) + '" y="' + f1(-(R - 19) * sn + 3) + '">' + g + "</text>";
        if (segunda) s += '<text class="grad-num grad-num2" x="' + f1((R - 35) * c) + '" y="' + f1(-(R - 35) * sn + 3) + '">' + (180 - g) + "</text>";
      }
    }
    return s + '<line class="grad-base" x1="' + (-R) + '" y1="0" x2="' + R + '" y2="0"/><circle class="grad-centro" cx="0" cy="0" r="4"/>';
  }
  const CLASE_ANG = (g) => (g <= 0 ? "nulo" : g < 90 ? "agudo" : g === 90 ? "recto" : g < 180 ? "obtuso" : "llano");
  const DICE_ANG = {
    agudo: "<b>agudo</b>: más cerrado que una esquina recta",
    recto: "<b>recto</b>: como la esquina de tu cuaderno",
    obtuso: "<b>obtuso</b>: más abierto que una esquina recta"
  };

  // 4. Abre el ángulo: gira el lado rojo hasta formar el ángulo pedido (por su clase o por sus grados).
  //    En básico se alternan las dos consignas: la clase (sin graduador) y los grados, de 10 en 10.
  function anguloAbrir(host, ctrl) {
    const niv = Juego.nivelIdx();
    const V = [170, 205];
    const pide = niv === 0 ? turno(ctrl, "clases", ["agudo", "recto", "obtuso", 40, 60, 120, 150])
      : niv === 1 ? 10 * ctrl.azar(2, 17) : 5 * ctrl.azar(3, 34);
    const meta = typeof pide === "number" ? { grados: pide } : { clase: pide };
    const conGrad = !meta.clase;                 // los grados se trazan con el graduador a la vista
    const paso = niv === 2 ? 1 : niv === 1 ? 5 : 10;
    let ang = meta.clase ? (meta.clase === "agudo" ? 130 : 35) : (meta.grados > 90 ? 35 : 145);   // arranca lejos de la meta
    let listo = false;

    ctrl.pregunta(meta.clase ? "📐 Abre un ángulo " + DICE_ANG[meta.clase] : "📐 Traza un ángulo de <b>" + meta.grados + "°</b>");
    host.innerHTML =
      '<svg class="geo-svg' + (conGrad ? " geo-grande" : "") + '" viewBox="0 0 340 230">' +
        (conGrad ? '<g class="grad fijo" transform="translate(' + V[0] + " " + V[1] + ')">' + graduador(118, niv === 2 ? "pocos" : "todos") + "</g>" : "") +
        '<path class="geo-arco"/>' +
        '<line class="geo-lado" x1="' + V[0] + '" y1="' + V[1] + '" x2="330" y2="' + V[1] + '"/>' +
        '<line class="geo-lado movil"/>' +
        '<circle class="geo-eje" cx="' + V[0] + '" cy="' + V[1] + '" r="5"/>' +
        '<circle class="geo-perilla" r="13"/>' +
        '<text class="geo-grados"></text>' +
      "</svg>" +
      '<p class="geo-ayuda">Arrastra la bolita roja para abrir o cerrar el ángulo 🤏</p>';
    const svg = host.querySelector("svg"), lado = svg.querySelector(".geo-lado.movil");
    const perilla = svg.querySelector(".geo-perilla"), arco = svg.querySelector(".geo-arco"), rotulo = svg.querySelector(".geo-grados");

    function pintar() {
      const fin = hacia(V[0], V[1], ang, 155), k = hacia(V[0], V[1], ang, 140), a0 = hacia(V[0], V[1], 0, 34), a1 = hacia(V[0], V[1], ang, 34);
      lado.setAttribute("x1", V[0]); lado.setAttribute("y1", V[1]); lado.setAttribute("x2", f1(fin[0])); lado.setAttribute("y2", f1(fin[1]));
      perilla.setAttribute("cx", f1(k[0])); perilla.setAttribute("cy", f1(k[1]));
      arco.setAttribute("d", "M" + V[0] + " " + V[1] + " L" + f1(a0[0]) + " " + f1(a0[1]) + " A34 34 0 0 0 " + f1(a1[0]) + " " + f1(a1[1]) + " Z");
    }
    pintar();
    arrastre(perilla, svg, (p) => {
      if (listo) return;
      rotulo.textContent = "";
      let g = Math.atan2(-(p.y - V[1]), p.x - V[0]) / RAD;
      if (g < -90) g = 180; else if (g < 0) g = 0;      // el lado no baja de la base
      ang = Math.max(0, Math.min(180, Math.round(g / paso) * paso));
      pintar();
    });
    botonListo(host, () => {
      if (listo) return;
      const clase = CLASE_ANG(ang);
      const bien = meta.clase ? clase === meta.clase : Math.abs(ang - meta.grados) <= (niv === 2 ? 2 : 0);
      const dentro = hacia(V[0], V[1], ang / 2, 62);     // la medida se escribe dentro del ángulo
      rotulo.setAttribute("x", f1(dentro[0])); rotulo.setAttribute("y", f1(dentro[1] + 5));
      rotulo.textContent = ang + "°";
      if (bien) {
        listo = true; perilla.dataset.fijo = "1"; svg.classList.add("geo-ok"); ctrl.ganar(1700);
        // Trazado por grados: se dice también de qué clase salió (120° → obtuso).
        if (!meta.clase && DICE_ANG[clase]) ctrl.retro("✅ " + ang + "°: es un ángulo <b>" + clase + "</b>", "bien");
        return;
      }
      if (meta.clase) {
        ctrl.reintento("Tu ángulo mide " + ang + "°" + (DICE_ANG[clase] ? ": es " + DICE_ANG[clase].split(":")[0] : "") +
          ". Necesitas uno " + DICE_ANG[meta.clase] + " 👀");
      } else {
        ctrl.reintento("Ese mide " + ang + "°. " + (ang < meta.grados ? "Ábrelo un poco más" : "Ciérralo un poco") + " hasta " + meta.grados + "° 👀");
      }
    });
  }

  // 5. ¿Agudo, recto u obtuso?: cada ángulo, con su medida, a su clase (se compara con 90°).
  const GRUPOS_ANG = [
    { id: "agudo", nombre: "Agudo", pista: "menos de 90°", emoji: "📐" },
    { id: "recto", nombre: "Recto", pista: "90° justos", emoji: "📓" },
    { id: "obtuso", nombre: "Obtuso", pista: "más de 90°", emoji: "🪭" }
  ];
  const MEDIDAS_ANG = [
    { agudo: [20, 35, 45, 60, 75], obtuso: [100, 120, 125, 135, 150, 160] },
    { agudo: [15, 25, 40, 55, 65, 80, 85], obtuso: [95, 105, 110, 130, 145, 165, 170] },
    { agudo: [1, 12, 38, 59, 72, 88, 89], obtuso: [91, 92, 99, 118, 143, 167, 179] }
  ];
  // Dibujito de un ángulo de `g` grados, girado `giro`.
  function anguloSVG(g, giro) {
    const V = giro ? [36, 30] : [36, 44], L = giro ? 24 : 27;
    const p1 = hacia(V[0], V[1], giro, L), p2 = hacia(V[0], V[1], giro + g, L);
    const a1 = hacia(V[0], V[1], giro, 9), a2 = hacia(V[0], V[1], giro + g, 9);
    return '<svg class="geo-ang" viewBox="0 0 72 56">' +
      '<path class="geo-arco" d="M' + V[0] + " " + V[1] + " L" + f1(a1[0]) + " " + f1(a1[1]) + " A9 9 0 0 0 " + f1(a2[0]) + " " + f1(a2[1]) + ' Z"/>' +
      '<line class="geo-lado" x1="' + V[0] + '" y1="' + V[1] + '" x2="' + f1(p1[0]) + '" y2="' + f1(p1[1]) + '"/>' +
      '<line class="geo-lado" x1="' + V[0] + '" y1="' + V[1] + '" x2="' + f1(p2[0]) + '" y2="' + f1(p2[1]) + '"/></svg>';
  }
  function anguloClasificar(host, ctrl) {
    const niv = Juego.nivelIdx(), med = MEDIDAS_ANG[niv];
    const cuantas = [4, 5, 6][niv];
    // Uno de cada clase (el recto, una sola vez) y el resto al azar entre agudos y obtusos.
    const valores = [turno(ctrl, "agudos", med.agudo), 90, turno(ctrl, "obtusos", med.obtuso)];
    while (valores.length < cuantas) {
      const v = Math.random() < 0.5 ? turno(ctrl, "agudos", med.agudo) : turno(ctrl, "obtusos", med.obtuso);
      if (valores.indexOf(v) < 0) valores.push(v);
    }
    ctrl.pregunta("🗂️ ¿Agudo, recto u obtuso? Lleva cada ángulo a su grupo 👇");
    host.innerHTML =
      '<div class="cestas">' + GRUPOS_ANG.map((c) =>
        '<div class="cesta geo-cesta" data-id="' + c.id + '"><span class="cesta-ic">' + c.emoji + "</span>" +
        '<span class="cesta-nom"><b>' + c.nombre + "</b><small>" + c.pista + '</small></span><div class="cesta-caidas"></div></div>').join("") + "</div>" +
      '<div class="fila-fichas"></div>';
    const fila = host.querySelector(".fila-fichas");
    const zonas = Array.prototype.slice.call(host.querySelectorAll(".cesta"));
    let faltan = valores.length;
    ctrl.mezclar(valores).forEach((v) => {
      const chip = document.createElement("button");
      chip.type = "button"; chip.className = "ficha-arr ficha-fig ficha-ang"; chip.dataset.cesta = CLASE_ANG(v);
      // En avanzado solo va el número: se decide comparándolo con 90°.
      chip.innerHTML = (niv === 2 ? "" : anguloSVG(v, niv === 0 ? 0 : 15 * ctrl.azar(0, 23))) + "<b>" + v + "°</b>";
      fila.appendChild(chip);
      Arrastrar.hacer(chip, zonas, (item, zona) => {
        if (!zona) return;
        if (zona.dataset.id === item.dataset.cesta) {
          item.dataset.fijo = "1"; item.classList.add("colocada");
          zona.querySelector(".cesta-caidas").appendChild(item);
          zona.classList.add("ok"); setTimeout(() => zona.classList.remove("ok"), 600);
          faltan--;
          if (faltan === 0) ctrl.ganar(); else ctrl.retro("¡Bien! Faltan " + faltan + " 👇", "bien");
        } else {
          zona.classList.add("rojo"); setTimeout(() => zona.classList.remove("rojo"), 450);
          ctrl.reintento("Compara con 90°: ¿" + v + "° es menos, igual o más? 👀");
        }
      });
    });
  }

  // 6. Mide con el graduador: arrástralo hasta la punta del ángulo, lee cuánto mide y di de qué clase es.
  function anguloMedir(host, ctrl) {
    const niv = Juego.nivelIdx();
    const valor = niv === 0 ? 10 * ctrl.azar(2, 16) : 5 * ctrl.azar(4, 34);
    const espejo = niv === 2 && Math.random() < 0.5;          // el ángulo se abre desde la izquierda
    const V = espejo ? [195, 182] : [125, 182];
    const base = hacia(V[0], V[1], espejo ? 180 : 0, 140), fin = hacia(V[0], V[1], espejo ? 180 - valor : valor, 140);
    const a0 = hacia(V[0], V[1], espejo ? 180 : 0, 26), a1 = hacia(V[0], V[1], espejo ? 180 - valor : valor, 26);
    let pos = espejo ? [135, 120] : [185, 120], puesto = false;

    ctrl.pregunta("🧭 ¿Cuánto mide este ángulo? Usa el graduador (transportador)");
    host.innerHTML =
      '<svg class="geo-svg geo-grande" viewBox="0 0 320 200">' +
        '<path class="geo-arco" d="M' + V[0] + " " + V[1] + " L" + f1(a0[0]) + " " + f1(a0[1]) + " A26 26 0 0 " + (espejo ? 1 : 0) + " " + f1(a1[0]) + " " + f1(a1[1]) + ' Z"/>' +
        '<line class="geo-lado" x1="' + V[0] + '" y1="' + V[1] + '" x2="' + f1(base[0]) + '" y2="' + f1(base[1]) + '"/>' +
        '<line class="geo-lado" x1="' + V[0] + '" y1="' + V[1] + '" x2="' + f1(fin[0]) + '" y2="' + f1(fin[1]) + '"/>' +
        '<circle class="geo-eje" cx="' + V[0] + '" cy="' + V[1] + '" r="5"/>' +
        '<g class="grad movil">' + graduador(108, "todos", niv === 2) + "</g>" +
      "</svg>" +
      '<p class="geo-ayuda">Arrastra el graduador: su centro ⊙ va justo en la punta del ángulo 🤏</p>' +
      '<div class="ord-fuente geo-opciones"></div>';
    const svg = host.querySelector("svg"), grad = svg.querySelector(".grad"), ayuda = host.querySelector(".geo-ayuda");
    const ops = host.querySelector(".geo-opciones");
    const colocar = () => grad.setAttribute("transform", "translate(" + f1(pos[0]) + " " + f1(pos[1]) + ")");
    colocar();
    let origen = pos;
    arrastre(grad, svg, (p, ini) => {
      if (puesto) return;
      pos = [origen[0] + p.x - ini.x, origen[1] + p.y - ini.y];
      colocar();
    }, () => {
      if (puesto) return;
      origen = pos;
      if (Math.hypot(pos[0] - V[0], pos[1] - V[1]) > 20) { ctrl.retro("Casi: el centro ⊙ del graduador va en la punta del ángulo 👀", ""); return; }
      // Encaja: el material confirma que está bien puesto y aparecen las medidas.
      puesto = true; pos = V.slice(); colocar(); grad.dataset.fijo = "1"; grad.classList.add("puesto");
      ayuda.textContent = "¡Encajó! Mira por qué número pasa el otro lado del ángulo 👇";
      ctrl.retro("", "");
      const cand = [180 - valor, valor + 10, valor - 10, valor + 20, valor - 20].filter((v, i, arr) => v >= 5 && v <= 175 && v !== valor && arr.indexOf(v) === i);
      const lista = ctrl.mezclar([valor].concat(ctrl.mezclar(cand).slice(0, 3)));
      fichasNumero(ops, lista.map((v) => ({ txt: v + "°", v: v })), (et, b) => {
        if (et.v === valor) {
          // Como en la prueba: primero la medida y después el tipo de ángulo.
          svg.classList.add("geo-ok");
          ayuda.innerHTML = "Mide <b>" + valor + "°</b>. ¿Qué tipo de ángulo es? 👇";
          ctrl.retro("¡Bien medido! Falta una cosa 👇", "bien");
          fichasNumero(ops, ["agudo", "recto", "obtuso"].map((c) => ({ txt: c, v: c })), (cl, bc) => {
            if (cl.v === CLASE_ANG(valor)) { bc.classList.add("ok"); ctrl.ganar(1400); }
            else {
              bc.classList.add("rojo"); setTimeout(() => bc.classList.remove("rojo"), 450);
              ctrl.reintento("Compara con 90°: ¿" + valor + "° es menos, igual o más? 👀");
            }
          });
        } else {
          b.classList.add("rojo"); setTimeout(() => b.classList.remove("rojo"), 450);
          ctrl.reintento(et.v === 180 - valor ? "Ojo con la escala: empieza a contar desde el 0 que está sobre el lado del ángulo 👀"
            : "Fíjate bien por qué rayita pasa el lado 👀");
        }
      });
    });
  }

  /* ============================================================
     CUADRILÁTEROS
     ============================================================ */
  // Figuras como puntos en una caja de 100 × 70. f = familia (par, tra, zoi).
  const FIGURAS = [
    { n: "cuadrado", f: "par", p: [[22, 7], [78, 7], [78, 63], [22, 63]] },
    { n: "rectángulo", f: "par", p: [[8, 14], [92, 14], [92, 56], [8, 56]] },
    { n: "rectángulo", f: "par", p: [[30, 4], [70, 4], [70, 66], [30, 66]] },
    { n: "rombo", f: "par", p: [[50, 3], [84, 35], [50, 67], [16, 35]] },
    { n: "romboide", f: "par", p: [[28, 12], [94, 12], [72, 58], [6, 58]] },
    { n: "romboide", f: "par", p: [[6, 12], [72, 12], [94, 58], [28, 58]] },
    { n: "trapecio", f: "tra", p: [[30, 12], [70, 12], [92, 58], [8, 58]] },
    { n: "trapecio", f: "tra", p: [[12, 12], [60, 12], [92, 58], [12, 58]] },
    { n: "trapecio", f: "tra", p: [[40, 12], [66, 12], [94, 58], [6, 58]] },
    { n: "trapecio", f: "tra", p: [[8, 12], [92, 12], [70, 58], [30, 58]] },
    { n: "trapezoide", f: "zoi", p: [[50, 4], [80, 26], [50, 66], [20, 26]] },
    { n: "trapezoide", f: "zoi", p: [[12, 14], [58, 6], [90, 40], [36, 64]] },
    { n: "trapezoide", f: "zoi", p: [[16, 30], [52, 4], [92, 22], [60, 66]] }
  ];
  const FAMILIAS = {
    par: { nombre: "Paralelogramos", pista: "2 pares de lados paralelos", emoji: "🟦" },
    tra: { nombre: "Trapecios", pista: "solo 1 par de lados paralelos", emoji: "🔶" },
    zoi: { nombre: "Trapezoides", pista: "ningún lado paralelo", emoji: "🪁" }
  };
  // Con las palabras del colegio ("ángulos rectos", "lados opuestos").
  const RASGO = {
    "cuadrado": "4 lados iguales y 4 ángulos rectos",
    "rectángulo": "lados opuestos iguales y 4 ángulos rectos",
    "rombo": "4 lados iguales; sus ángulos no son rectos",
    "romboide": "lados opuestos iguales; sus ángulos no son rectos",
    "trapecio": "un solo par de lados paralelos",
    "trapezoide": "ningún par de lados paralelos"
  };
  // Figuras que también cumplen la característica de otra (un cuadrado tiene los lados
  // opuestos iguales y 4 ángulos rectos): no se ponen juntas cuando se pregunta por la pista.
  const TAMBIEN = { "rectángulo": "cuadrado", "romboide": "rombo" };
  const COLORES = ["#ffd166", "#8ecae6", "#b9e769", "#f7a1c4", "#c3aed6", "#ffb38a"];
  // Miniatura SVG de una figura, girada `giro` grados y con el viewBox ajustado a lo que ocupa.
  function figSVG(fig, giro, color) {
    const c = Math.cos(giro * RAD), s = Math.sin(giro * RAD);
    const pts = fig.p.map((q) => { const x = q[0] - 50, y = q[1] - 35; return [x * c - y * s, x * s + y * c]; });
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    const x0 = Math.min.apply(null, xs), y0 = Math.min.apply(null, ys);
    const w = Math.max.apply(null, xs) - x0, h = Math.max.apply(null, ys) - y0;
    return '<svg class="geo-fig" viewBox="' + [f1(x0 - 5), f1(y0 - 5), f1(w + 10), f1(h + 10)].join(" ") + '">' +
      '<polygon points="' + pts.map((q) => f1(q[0]) + "," + f1(q[1])).join(" ") + '" style="fill:' + color + '"/></svg>';
  }
  const giroAzar = (ctrl) => Juego.porNivel([0, ctrl.azarEl([0, 0, 90, 180]), 15 * ctrl.azar(0, 11)]);

  // 7. Familias de cuadriláteros: arrastra cada figura a su familia.
  function cuadFamilias(host, ctrl) {
    const niv = Juego.nivelIdx();
    const ids = niv === 0 ? ["par", "tra"] : ["par", "tra", "zoi"];
    const cuantas = [4, 5, 6][niv];
    const mazo = ctrl.mezclar(FIGURAS.filter((f) => ids.indexOf(f.f) >= 0));
    // Al menos una de cada familia y el resto al azar (una familia puede recibir varias).
    const elegidas = ids.map((id) => mazo.find((f) => f.f === id));
    mazo.forEach((f) => { if (elegidas.length < cuantas && elegidas.indexOf(f) < 0) elegidas.push(f); });
    ctrl.pregunta("🔷 Arrastra cada cuadrilátero a su familia 👇");
    host.innerHTML =
      '<div class="cestas">' + ids.map((id) =>
        '<div class="cesta geo-cesta" data-id="' + id + '"><span class="cesta-ic">' + FAMILIAS[id].emoji + "</span>" +
        '<span class="cesta-nom"><b>' + FAMILIAS[id].nombre + "</b><small>" + FAMILIAS[id].pista + '</small></span><div class="cesta-caidas"></div></div>').join("") + "</div>" +
      '<div class="fila-fichas"></div>';
    const fila = host.querySelector(".fila-fichas");
    const zonas = Array.prototype.slice.call(host.querySelectorAll(".cesta"));
    let faltan = elegidas.length;
    ctrl.mezclar(elegidas).forEach((fig, k) => {
      const chip = document.createElement("button");
      chip.type = "button"; chip.className = "ficha-arr ficha-fig"; chip.dataset.cesta = fig.f;
      chip.innerHTML = figSVG(fig, giroAzar(ctrl), COLORES[k % COLORES.length]);
      fila.appendChild(chip);
      Arrastrar.hacer(chip, zonas, (item, zona) => {
        if (!zona) return;
        if (zona.dataset.id === item.dataset.cesta) {
          item.dataset.fijo = "1"; item.classList.add("colocada");
          zona.querySelector(".cesta-caidas").appendChild(item);
          zona.classList.add("ok"); setTimeout(() => zona.classList.remove("ok"), 600);
          faltan--;
          if (faltan === 0) ctrl.ganar(); else ctrl.retro("¡Bien! Faltan " + faltan + " 👇", "bien");
        } else {
          zona.classList.add("rojo"); setTimeout(() => zona.classList.remove("rojo"), 450);
          ctrl.reintento("Ahí no: ese es un <b>" + fig.n + "</b> (" + RASGO[fig.n] + ") 👀");
        }
      });
    });
  }

  // 8. ¿Cómo se llama?: toca la figura que se pide, por su nombre o por su característica.
  function cuadNombres(host, ctrl) {
    const niv = Juego.nivelIdx();
    const meta = turno(ctrl, "nombres", Object.keys(RASGO));
    const porPista = turno(ctrl, "consignas", [false, true]);     // se alternan las dos consignas
    const otras = ctrl.mezclar(Object.keys(RASGO).filter((n) => n !== meta && !(porPista && n === TAMBIEN[meta])));
    const nombres = [meta].concat(otras.slice(0, niv === 0 ? 2 : 3));
    const figs = ctrl.mezclar(nombres.map((n) => ctrl.azarEl(FIGURAS.filter((f) => f.n === n))));
    ctrl.pregunta(porPista ? "👆 Toca el cuadrilátero que tiene <b>" + RASGO[meta] + "</b>"
      : "👆 Toca el <b>" + meta + "</b>" + (niv === 0 ? " (" + RASGO[meta] + ")" : ""));
    host.innerHTML = '<div class="geo-galeria"></div>';
    const gal = host.querySelector(".geo-galeria");
    let listo = false;
    figs.forEach((fig, k) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "geo-carta";
      b.innerHTML = figSVG(fig, giroAzar(ctrl), COLORES[(k + 2) % COLORES.length]);
      b.onclick = () => {
        if (listo) return;
        if (fig.n === meta) {
          listo = true; b.classList.add("ok"); ctrl.ganar(porPista ? 1500 : undefined);
          if (porPista) ctrl.retro("✅ Es el <b>" + meta + "</b>", "bien");
        } else {
          b.classList.add("rojo"); setTimeout(() => b.classList.remove("rojo"), 450);
          ctrl.reintento("Ese es un <b>" + fig.n + "</b>: " + RASGO[fig.n] + " 👀");
        }
      };
      gal.appendChild(b);
    });
  }

  // 9. Cada figura con su pista: se lleva cada característica hasta su cuadrilátero.
  function cuadPistas(host, ctrl) {
    const niv = Juego.nivelIdx();
    // En básico, las cuatro del cuestionario del colegio; después entran el romboide y el trapezoide.
    const nombres = niv === 0 ? ["cuadrado", "rectángulo", "rombo", "trapecio"] : ctrl.mezclar(Object.keys(RASGO)).slice(0, 4);
    const figs = ctrl.mezclar(nombres.map((n) => ctrl.azarEl(FIGURAS.filter((f) => f.n === n))));
    ctrl.pregunta("🧩 Lleva cada característica hasta su cuadrilátero 👇");
    host.innerHTML = '<div class="geo-pares">' + figs.map((fig, k) =>
      '<div class="geo-par geo-par-fig" data-k="' + k + '">' + figSVG(fig, giroAzar(ctrl), COLORES[(k + 1) % COLORES.length]) +
      '<span class="geo-par-tit">' + (niv === 0 ? fig.n : "") + '</span><div class="geo-par-nombre"></div></div>').join("") +
      '</div><div class="fila-fichas geo-pistas"></div>';
    const cartas = Array.prototype.slice.call(host.querySelectorAll(".geo-par")), fila = host.querySelector(".fila-fichas");
    let faltan = figs.length;
    ctrl.mezclar(figs.slice()).forEach((fig) => {
      const chip = document.createElement("button");
      chip.type = "button"; chip.className = "ficha-arr"; chip.textContent = RASGO[fig.n];
      fila.appendChild(chip);
      Arrastrar.hacer(chip, cartas, (item, zona) => {
        if (!zona || zona.dataset.lleno === "1") return;
        const esa = figs[+zona.dataset.k];
        if (esa.n === fig.n) {
          zona.dataset.lleno = "1"; zona.classList.add("puesto");
          zona.querySelector(".geo-par-tit").textContent = fig.n;      // ya puesta, la figura dice su nombre
          item.dataset.fijo = "1"; item.classList.add("colocada");
          zona.querySelector(".geo-par-nombre").appendChild(item);
          faltan--;
          if (faltan === 0) ctrl.ganar(1500); else ctrl.retro("¡Bien! Faltan " + faltan + " 👇", "bien");
        } else {
          zona.classList.add("rojo"); setTimeout(() => zona.classList.remove("rojo"), 450);
          // El cuadrado también tiene los lados opuestos iguales (y el rombo): se explica por qué no va ahí.
          ctrl.reintento(TAMBIEN[fig.n] === esa.n
            ? "Esa figura tiene algo más: sus <b>4 lados</b> son iguales. Busca la que solo tiene iguales los lados de enfrente 👀"
            : "Esa pista no es de esa figura. Mira sus lados y sus ángulos 👀");
        }
      });
    });
  }

  /* ---------- Perímetro ---------- */
  // Figura grande con la medida de cada lado (arriba, derecha, abajo, izquierda).
  const DIBUJO = {
    cuadrado: [[95, 28], [205, 28], [205, 138], [95, 138]],
    rectangulo: [[55, 36], [245, 36], [245, 136], [55, 136]],
    rombo: [[150, 14], [232, 84], [150, 154], [68, 84]],
    romboide: [[95, 36], [262, 36], [205, 136], [38, 136]],
    trapecio: [[108, 36], [192, 36], [252, 136], [48, 136]],
    trapecioR: [[62, 36], [168, 36], [250, 136], [62, 136]],
    trapezoide: [[72, 44], [188, 24], [254, 118], [42, 146]]
  };
  // Medidas coherentes con cada figura (no están a escala, pero respetan lados iguales).
  function medidas(tipo, ctrl, min, max) {
    const r = () => ctrl.azar(min, max);
    let a = r(), b = r();
    while (b === a) b = r();
    if (tipo === "cuadrado" || tipo === "rombo") return [a, a, a, a];
    if (tipo === "rectangulo" || tipo === "romboide") return [Math.max(a, b), Math.min(a, b), Math.max(a, b), Math.min(a, b)];
    if (tipo === "trapecio") { const l = r(); return [Math.min(a, b), l, Math.max(a, b) + ctrl.azar(1, 3), l]; }
    if (tipo === "trapecioR") { const h = r(); return [Math.min(a, b), h + ctrl.azar(1, 3), Math.max(a, b) + ctrl.azar(1, 3), h]; }
    return [a, b, a + ctrl.azar(1, 4), b + ctrl.azar(1, 4)];
  }
  // SVG de la figura con sus rótulos; cada lado es un grupo tocable (data-i).
  function figuraMedida(tipo, rotulos, tocable) {
    const p = DIBUJO[tipo], cx = (p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4, cy = (p[0][1] + p[1][1] + p[2][1] + p[3][1]) / 4;
    let s = '<svg class="geo-svg geo-peri" viewBox="0 0 300 172"><polygon class="geo-relleno" points="' + p.map((q) => q.join(",")).join(" ") + '"/>';
    for (let i = 0; i < 4; i++) {
      const a = p[i], b = p[(i + 1) % 4], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      let nx = mx - cx, ny = my - cy; const largo = Math.hypot(nx, ny) || 1; nx /= largo; ny /= largo;
      const xy = 'x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"';
      s += '<g class="geo-borde' + (tocable ? " tocable" : "") + '" data-i="' + i + '"><line class="toque" ' + xy + '/><line class="trazo" ' + xy + "/>" +
        '<text class="geo-rotulo" x="' + f1(mx + nx * 27) + '" y="' + f1(my + ny * 16 + 5) + '">' + esc(rotulos[i]) + "</text></g>";
    }
    return s + "</svg>";
  }
  const TIPOS_PERI = [["cuadrado", "rectangulo", "trapezoide"], ["cuadrado", "rectangulo", "rombo", "romboide", "trapecio", "trapecioR", "trapezoide"],
    ["rectangulo", "romboide", "trapecio", "trapecioR", "trapezoide"]];
  // Los ejercicios del cuestionario del colegio: en cada sesión sale UNO, en una ronda al
  // azar, y de sesión en sesión se van turnando (el mazo es del módulo, no del tema).
  const COLE_PERI = [
    { tipo: "cuadrado", lados: [8, 8, 8, 8] },
    { tipo: "rectangulo", lados: [12, 7, 12, 7] },
    { tipo: "trapezoide", lados: [8, 7, 9, 6] }
  ];
  const mazosCole = {};
  function delCole(ctrl, clave, lista) {
    const m = ctrl.memo;
    m.ronda = (m.ronda || 0) + 1;
    if (m.cuando == null) m.cuando = ctrl.azar(1, 4);
    if (m.ronda !== m.cuando) return null;
    if (!mazosCole[clave] || !mazosCole[clave].length) mazosCole[clave] = ctrl.mezclar(lista.slice());
    return mazosCole[clave].pop();
  }
  // El atajo de las figuras de lados iguales: 4 × lado, o 2 × (largo + ancho).
  function atajo(tipo, lados, total, u) {
    if (tipo === "cuadrado" || tipo === "rombo") return "⚡ Atajo: 4 × " + lados[0] + " = " + total + " " + u;
    if (tipo === "rectangulo" || tipo === "romboide") return "⚡ Atajo: 2 × (" + lados[0] + " + " + lados[1] + ") = " + total + " " + u;
    return "";
  }

  // 10. Camina el contorno: toca cada lado para ir sumándolo y halla el perímetro.
  function perimetro(host, ctrl) {
    const niv = Juego.nivelIdx();
    const cole = delCole(ctrl, "peri", COLE_PERI);
    const tipo = cole ? cole.tipo : turno(ctrl, "tipos", TIPOS_PERI[niv]);
    const u = niv === 2 && !cole ? "m" : "cm";
    const lados = cole ? cole.lados : medidas(tipo, ctrl, [2, 4, 12][niv], [9, 20, 45][niv]);
    const total = lados.reduce((s, v) => s + v, 0);
    ctrl.pregunta("🚶 Camina todo el contorno: toca cada lado para sumarlo y halla el <b>perímetro</b>");
    host.innerHTML = figuraMedida(tipo, lados.map((v) => v + " " + u), true) +
      '<div class="geo-suma">P = <span class="geo-sumandos">…</span><small class="geo-atajo"></small></div><div class="ord-fuente geo-opciones"></div>';
    const sumandos = host.querySelector(".geo-sumandos"), ops = host.querySelector(".geo-opciones");
    // Al acertar, el material muestra el atajo (si la figura lo tiene).
    const verAtajo = () => { host.querySelector(".geo-atajo").textContent = atajo(tipo, lados, total, u); };
    const pausa = atajo(tipo, lados, total, u) ? 2400 : 1400;
    const contados = [];
    host.querySelectorAll(".geo-borde").forEach((g) => {
      g.addEventListener("click", () => {
        const i = +g.getAttribute("data-i");
        if (contados.indexOf(i) >= 0) { ctrl.retro("Ese lado ya lo contaste 😉", ""); return; }
        contados.push(i); g.classList.add("contado");
        sumandos.textContent = contados.map((k) => lados[k]).join(" + ");
        if (contados.length < 4) {
          const faltan = 4 - contados.length;
          ctrl.retro((faltan === 1 ? "Falta 1 lado" : "Faltan " + faltan + " lados") + " 👣", "");
          return;
        }
        ctrl.retro("¡Diste la vuelta completa! Ahora suma 👇", "bien");
        if (niv === 2) { pedirNumero(ops, ctrl, total, u, "P = " + lados.join(" + ") + " = " + total + " " + u, verAtajo, pausa); return; }
        const cand = [total - lados[contados[3]], total + 10, total - 10, total + 2, total - 2, total + lados[0]]
          .filter((v, k, arr) => v > 0 && v !== total && arr.indexOf(v) === k);
        const lista = ctrl.mezclar([total].concat(ctrl.mezclar(cand).slice(0, 3)));
        fichasNumero(ops, lista.map((v) => ({ txt: v + " " + u, v: v })), (et, b) => {
          if (et.v === total) { b.classList.add("ok"); sumandos.textContent += " = " + total + " " + u; verAtajo(); ctrl.ganar(pausa); }
          else { b.classList.add("rojo"); setTimeout(() => b.classList.remove("rojo"), 450); ctrl.reintento("Suma otra vez con calma, lado por lado 👀"); }
        });
      });
    });
  }

  // Casilla para escribir un número (dos intentos; al segundo fallo se muestra cómo se hace).
  function pedirNumero(cont, ctrl, correcto, unidad, explicacion, alAcertar, pausa) {
    cont.innerHTML = '<div class="prob-resp"><input class="prob-input" type="number" inputmode="numeric" placeholder="¿?" /> <span class="geo-unidad">' +
      esc(unidad) + '</span> <button type="button" class="prob-ok">Comprobar</button></div>';
    const inp = cont.querySelector(".prob-input");
    let intentos = 0;
    function comprobar() {
      const v = inp.value.trim();
      if (v === "" || inp.disabled) return;
      if (parseInt(v, 10) === correcto) { inp.disabled = true; if (alAcertar) alAcertar(); ctrl.ganar(pausa || 1400); return; }
      intentos++;
      if (intentos >= 2) { inp.value = correcto; inp.disabled = true; ctrl.fallar("Era " + correcto + " " + esc(unidad) + ": " + explicacion, 3200); }
      else ctrl.reintento("Casi… revisa tu cuenta 👀");
    }
    cont.querySelector(".prob-ok").onclick = comprobar;
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") comprobar(); });
    inp.focus();
  }

  // 11. Problemas de perímetro (con su dibujo): cercar, hallar el lado que falta, costo, vueltas.
  const LUGARES = [
    { que: "el huerto de cacao", de: "del huerto de cacao", quien: "Don Luis" },
    { que: "el corral de los cuyes", de: "del corral de los cuyes", quien: "Doña Rosa" },
    { que: "la cancha de ecuavóley", de: "de la cancha de ecuavóley", quien: "El profe" },
    { que: "el jardín de la escuela", de: "del jardín de la escuela", quien: "La maestra" },
    { que: "el terreno de la finca", de: "del terreno de la finca", quien: "Mi abuelito" },
    { que: "el parque del barrio", de: "del parque del barrio", quien: "El municipio" }
  ];
  function perimProblema(host, ctrl) {
    const niv = Juego.nivelIdx();
    // Una vez por sesión sale el problema del cuestionario del colegio (el terreno de 18 m × 11 m).
    const cole = delCole(ctrl, "prob", [{ a: 18, b: 11 }]);
    const clase = cole ? "cercar" : turno(ctrl, "clases", [["cercar", "cercarCuadrado"], ["cercar", "ladoCuadrado", "ladoFalta"], ["ladoFalta", "costo", "vueltas"]][niv]);
    const L = ctrl.azarEl(LUGARES);
    const cerca = ctrl.azarEl(["cerca", "malla", "alambre"]);
    const a = cole ? cole.a : ctrl.azar([6, 8, 15][niv], [12, 25, 60][niv]);
    const b = cole ? cole.b : ctrl.azar([2, 4, 8][niv], a - 1);
    let tipo = "rectangulo", rot, texto, r, exp, u = "m", ops = null;
    const P = 2 * a + 2 * b;
    if (clase === "cercarCuadrado") {
      tipo = "cuadrado"; rot = [a + " m", a + " m", a + " m", a + " m"]; r = 4 * a;
      texto = L.quien + " va a cercar " + L.que + ", que es cuadrado. ¿Cuántos metros de " + cerca + " necesita?";
      exp = "4 × " + a + " = " + r + " m";
      ops = { bien: "4 × " + a, mal: [a + " × " + a, a + " + " + a] };
    } else if (clase === "ladoCuadrado") {
      tipo = "cuadrado"; rot = ["?", "?", "?", "?"]; r = a;
      texto = "El perímetro de este cuadrado es " + (4 * a) + " m. ¿Cuánto mide cada lado?";
      exp = (4 * a) + " ÷ 4 = " + a + " m";
    } else if (clase === "ladoFalta") {
      rot = [a + " m", "?", a + " m", "?"]; r = b;
      texto = "El perímetro " + L.de + " es " + P + " m y el largo mide " + a + " m. ¿Cuánto mide el ancho?";
      exp = P + " − " + a + " − " + a + " = " + (2 * b) + ", y " + (2 * b) + " ÷ 2 = " + b + " m";
    } else if (clase === "costo") {
      const precio = ctrl.azar(2, 6);
      rot = [a + " m", b + " m", a + " m", b + " m"]; r = P * precio; u = "dólares";
      texto = L.quien + " va a cercar " + L.que + ". Cada metro de " + cerca + " cuesta $" + precio + ". ¿Cuánto paga en total?";
      exp = "el perímetro es " + P + " m y " + P + " × " + precio + " = " + r + " dólares";
    } else if (clase === "vueltas") {
      const v = ctrl.azar(2, 4);
      rot = [a + " m", b + " m", a + " m", b + " m"]; r = P * v;
      texto = "María camina " + v + " vueltas completas por el borde " + L.de + ". ¿Cuántos metros camina?";
      exp = "una vuelta es " + P + " m y " + P + " × " + v + " = " + r + " m";
    } else {
      rot = [a + " m", b + " m", a + " m", b + " m"]; r = P;
      texto = cole
        ? "Un terreno rectangular mide " + a + " m de largo y " + b + " m de ancho. Se quiere colocar una malla alrededor de todo el terreno. ¿Cuántos metros de malla se necesitan?"
        : L.quien + " va a cercar " + L.que + ". ¿Cuántos metros de " + cerca + " necesita?";
      exp = "2 × (" + a + " + " + b + ") = " + r + " m";
      // En básico el perímetro se escribe como suma de los cuatro lados; después, con el atajo.
      ops = { bien: niv === 0 ? a + " + " + b + " + " + a + " + " + b : "2 × (" + a + " + " + b + ")", mal: [a + " × " + b, a + " + " + b] };
    }
    ctrl.pregunta("🧮 Resuelve con el perímetro");
    host.innerHTML = '<div class="prob-enun geo-enun">' + esc(texto) + "</div>" + figuraMedida(tipo, rot, false) + '<div class="geo-opciones"></div>';
    const zona = host.querySelector(".geo-opciones");
    if (!ops) { pedirNumero(zona, ctrl, r, u, exp); return; }
    // Como en el cuaderno (datos → operación → respuesta): primero se elige la operación.
    // Las otras dos son los errores de siempre: el área y sumar solo dos lados.
    zona.innerHTML = '<p class="prob-paso">1) ¿Qué operación sirve?</p><div class="ord-fuente"></div>';
    fichasNumero(zona.querySelector(".ord-fuente"), ctrl.mezclar([ops.bien].concat(ops.mal)).map((o) => ({ txt: o, v: o })), (et, bt) => {
      if (et.v !== ops.bien) {
        bt.classList.add("rojo"); setTimeout(() => bt.classList.remove("rojo"), 450);
        ctrl.reintento(et.v.indexOf("×") > 0 ? "Esa cuenta mide lo de adentro. Aquí se rodea el borde: suma todos los lados 👀"
          : "Así solo recorres dos lados. Hay que dar la vuelta completa 👀");
        return;
      }
      ctrl.retro("¡Esa es! Ahora calcula 👇", "bien");
      zona.innerHTML = '<p class="prob-paso">2) ' + esc(ops.bien) + ' =</p><div class="geo-resp"></div>';
      pedirNumero(zona.querySelector(".geo-resp"), ctrl, r, u, exp);
    });
  }

  window.Rectas = Actividad("rec", [
    { icono: "📏", nombre: "Gira la recta", desc: "paralelas, perpendiculares y oblicuas", total: 6, ronda: rectaGirar },
    { icono: "🏘️", nombre: "El plano del barrio", desc: "reconoce las rectas", total: 6, ronda: rectaBarrio },
    { icono: "🏷️", nombre: "Ponles nombre", desc: "¿paralelas, perpendiculares u oblicuas?", total: 5, ronda: rectaNombrar },
    { icono: "📐", nombre: "Abre el ángulo", desc: "agudo, recto y obtuso", total: 6, ronda: anguloAbrir },
    { icono: "🗂️", nombre: "¿Agudo, recto u obtuso?", desc: "clasifica por la medida", total: 5, ronda: anguloClasificar },
    { icono: "🧭", nombre: "Mide con el graduador", desc: "¿cuántos grados y de qué tipo?", total: 6, ronda: anguloMedir }
  ]);
  window.Cuadri = Actividad("cua", [
    { icono: "🔷", nombre: "Familias", desc: "paralelogramos, trapecios y trapezoides", total: 5, ronda: cuadFamilias },
    { icono: "👆", nombre: "¿Cómo se llama?", desc: "cuadrado, rombo, trapecio…", total: 6, ronda: cuadNombres },
    { icono: "🧩", nombre: "Cada figura con su pista", desc: "lados iguales, ángulos rectos…", total: 5, ronda: cuadPistas },
    { icono: "🚶", nombre: "Camina el contorno", desc: "perímetro: suma los lados", total: 6, ronda: perimetro },
    { icono: "🧮", nombre: "Problemas de perímetro", desc: "cercas, lados y vueltas", total: 5, ronda: perimProblema }
  ]);
})();
