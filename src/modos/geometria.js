/* Geometría — Matemáticas, segundo trimestre (motor manipulativo)
   Dos actividades comparten este archivo (cada página arranca la suya):
     Rectas (px "rec"): gira la recta · el plano del barrio · abre el ángulo ·
                        mide con el graduador
     Cuadri (px "cua"): familias de cuadriláteros · ¿cómo se llama? ·
                        camina el contorno (perímetro) · problemas de perímetro
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

  // 3. Abre el ángulo: gira el lado rojo hasta formar el ángulo pedido (por su clase o por sus grados).
  function anguloAbrir(host, ctrl) {
    const niv = Juego.nivelIdx();
    const V = [170, 205];
    const meta = niv === 0 ? { clase: turno(ctrl, "clases", ["agudo", "recto", "obtuso"]) }
      : { grados: niv === 1 ? 10 * ctrl.azar(2, 17) : 5 * ctrl.azar(3, 34) };
    const paso = niv === 2 ? 1 : 5;
    let ang = meta.clase ? (meta.clase === "agudo" ? 130 : 35) : (meta.grados > 90 ? 35 : 145);   // arranca lejos de la meta
    let listo = false;

    ctrl.pregunta(meta.clase ? "📐 Abre un ángulo " + DICE_ANG[meta.clase] : "📐 Traza un ángulo de <b>" + meta.grados + "°</b>");
    host.innerHTML =
      '<svg class="geo-svg' + (niv > 0 ? " geo-grande" : "") + '" viewBox="0 0 340 230">' +
        (niv > 0 ? '<g class="grad fijo" transform="translate(' + V[0] + " " + V[1] + ')">' + graduador(118, niv === 1 ? "todos" : "pocos") + "</g>" : "") +
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
      if (bien) { listo = true; perilla.dataset.fijo = "1"; svg.classList.add("geo-ok"); ctrl.ganar(1500); return; }
      if (meta.clase) {
        ctrl.reintento("Tu ángulo mide " + ang + "°" + (DICE_ANG[clase] ? ": es " + DICE_ANG[clase].split(":")[0] : "") +
          ". Necesitas uno " + DICE_ANG[meta.clase] + " 👀");
      } else {
        ctrl.reintento("Ese mide " + ang + "°. " + (ang < meta.grados ? "Ábrelo un poco más" : "Ciérralo un poco") + " hasta " + meta.grados + "° 👀");
      }
    });
  }

  // 4. Mide con el graduador: arrástralo hasta la punta del ángulo y lee cuánto mide.
  function anguloMedir(host, ctrl) {
    const niv = Juego.nivelIdx();
    const valor = niv === 0 ? 10 * ctrl.azar(2, 16) : 5 * ctrl.azar(4, 34);
    const espejo = niv === 2 && Math.random() < 0.5;          // el ángulo se abre desde la izquierda
    const V = espejo ? [195, 182] : [125, 182];
    const base = hacia(V[0], V[1], espejo ? 180 : 0, 140), fin = hacia(V[0], V[1], espejo ? 180 - valor : valor, 140);
    const a0 = hacia(V[0], V[1], espejo ? 180 : 0, 26), a1 = hacia(V[0], V[1], espejo ? 180 - valor : valor, 26);
    let pos = espejo ? [135, 120] : [185, 120], puesto = false;

    ctrl.pregunta("🧭 ¿Cuánto mide este ángulo? Usa el graduador");
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
        if (et.v === valor) { b.classList.add("ok"); svg.classList.add("geo-ok"); ctrl.ganar(1400); }
        else {
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
  const RASGO = {
    "cuadrado": "4 lados iguales y 4 esquinas rectas",
    "rectángulo": "lados iguales de dos en dos y 4 esquinas rectas",
    "rombo": "4 lados iguales, sin esquinas rectas",
    "romboide": "lados iguales de dos en dos, sin esquinas rectas",
    "trapecio": "solo un par de lados paralelos",
    "trapezoide": "ningún lado paralelo"
  };
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

  // 5. Familias de cuadriláteros: arrastra cada figura a su familia.
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

  // 6. ¿Cómo se llama?: toca la figura que se pide.
  function cuadNombres(host, ctrl) {
    const niv = Juego.nivelIdx();
    const nombres = ctrl.mezclar(Object.keys(RASGO)).slice(0, niv === 0 ? 3 : 4);
    const meta = turno(ctrl, "nombres", Object.keys(RASGO));
    if (nombres.indexOf(meta) < 0) nombres[0] = meta;
    const figs = ctrl.mezclar(nombres.map((n) => ctrl.azarEl(FIGURAS.filter((f) => f.n === n))));
    ctrl.pregunta("👆 Toca el <b>" + meta + "</b>" + (niv === 0 ? " (" + RASGO[meta] + ")" : ""));
    host.innerHTML = '<div class="geo-galeria"></div>';
    const gal = host.querySelector(".geo-galeria");
    let listo = false;
    figs.forEach((fig, k) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "geo-carta";
      b.innerHTML = figSVG(fig, giroAzar(ctrl), COLORES[(k + 2) % COLORES.length]);
      b.onclick = () => {
        if (listo) return;
        if (fig.n === meta) { listo = true; b.classList.add("ok"); ctrl.ganar(); }
        else {
          b.classList.add("rojo"); setTimeout(() => b.classList.remove("rojo"), 450);
          ctrl.reintento("Ese es un <b>" + fig.n + "</b>: " + RASGO[fig.n] + " 👀");
        }
      };
      gal.appendChild(b);
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
  const TIPOS_PERI = [["cuadrado", "rectangulo"], ["cuadrado", "rectangulo", "rombo", "romboide", "trapecio", "trapecioR"],
    ["rectangulo", "romboide", "trapecio", "trapecioR", "trapezoide"]];

  // 7. Camina el contorno: toca cada lado para ir sumándolo y halla el perímetro.
  function perimetro(host, ctrl) {
    const niv = Juego.nivelIdx();
    const tipo = turno(ctrl, "tipos", TIPOS_PERI[niv]);
    const u = niv === 2 ? "m" : "cm";
    const lados = medidas(tipo, ctrl, [2, 4, 12][niv], [9, 20, 45][niv]);
    const total = lados.reduce((s, v) => s + v, 0);
    ctrl.pregunta("🚶 Camina todo el contorno: toca cada lado para sumarlo y halla el <b>perímetro</b>");
    host.innerHTML = figuraMedida(tipo, lados.map((v) => v + " " + u), true) +
      '<div class="geo-suma">P = <span class="geo-sumandos">…</span></div><div class="ord-fuente geo-opciones"></div>';
    const sumandos = host.querySelector(".geo-sumandos"), ops = host.querySelector(".geo-opciones");
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
        if (niv === 2) { pedirNumero(ops, ctrl, total, u, "P = " + lados.join(" + ") + " = " + total + " " + u); return; }
        const cand = [total - lados[contados[3]], total + 10, total - 10, total + 2, total - 2, total + lados[0]]
          .filter((v, k, arr) => v > 0 && v !== total && arr.indexOf(v) === k);
        const lista = ctrl.mezclar([total].concat(ctrl.mezclar(cand).slice(0, 3)));
        fichasNumero(ops, lista.map((v) => ({ txt: v + " " + u, v: v })), (et, b) => {
          if (et.v === total) { b.classList.add("ok"); sumandos.textContent += " = " + total + " " + u; ctrl.ganar(1400); }
          else { b.classList.add("rojo"); setTimeout(() => b.classList.remove("rojo"), 450); ctrl.reintento("Suma otra vez con calma, lado por lado 👀"); }
        });
      });
    });
  }

  // Casilla para escribir un número (dos intentos; al segundo fallo se muestra cómo se hace).
  function pedirNumero(cont, ctrl, correcto, unidad, explicacion) {
    cont.innerHTML = '<div class="prob-resp"><input class="prob-input" type="number" inputmode="numeric" placeholder="¿?" /> <span class="geo-unidad">' +
      esc(unidad) + '</span> <button type="button" class="prob-ok">Comprobar</button></div>';
    const inp = cont.querySelector(".prob-input");
    let intentos = 0;
    function comprobar() {
      const v = inp.value.trim();
      if (v === "" || inp.disabled) return;
      if (parseInt(v, 10) === correcto) { inp.disabled = true; ctrl.ganar(1400); return; }
      intentos++;
      if (intentos >= 2) { inp.value = correcto; inp.disabled = true; ctrl.fallar("Era " + correcto + " " + esc(unidad) + ": " + explicacion, 3200); }
      else ctrl.reintento("Casi… revisa tu cuenta 👀");
    }
    cont.querySelector(".prob-ok").onclick = comprobar;
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") comprobar(); });
    inp.focus();
  }

  // 8. Problemas de perímetro (con su dibujo): cercar, hallar el lado que falta, costo, vueltas.
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
    const clase = turno(ctrl, "clases", [["cercar", "cercarCuadrado"], ["cercar", "ladoCuadrado", "ladoFalta"], ["ladoFalta", "costo", "vueltas"]][niv]);
    const L = ctrl.azarEl(LUGARES);
    const a = ctrl.azar([6, 8, 15][niv], [12, 25, 60][niv]);
    const b = ctrl.azar([2, 4, 8][niv], a - 1);
    let tipo = "rectangulo", rot, texto, r, exp, u = "m";
    const P = 2 * a + 2 * b;
    if (clase === "cercarCuadrado") {
      tipo = "cuadrado"; rot = [a + " m", a + " m", a + " m", a + " m"]; r = 4 * a;
      texto = L.quien + " va a cercar " + L.que + ", que es cuadrado. ¿Cuántos metros de cerca necesita?";
      exp = a + " + " + a + " + " + a + " + " + a + " = " + r + " m";
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
      texto = L.quien + " va a cercar " + L.que + ". Cada metro de cerca cuesta $" + precio + ". ¿Cuánto paga en total?";
      exp = "el perímetro es " + P + " m y " + P + " × " + precio + " = " + r + " dólares";
    } else if (clase === "vueltas") {
      const v = ctrl.azar(2, 4);
      rot = [a + " m", b + " m", a + " m", b + " m"]; r = P * v;
      texto = "María camina " + v + " vueltas completas por el borde " + L.de + ". ¿Cuántos metros camina?";
      exp = "una vuelta es " + P + " m y " + P + " × " + v + " = " + r + " m";
    } else {
      rot = [a + " m", b + " m", a + " m", b + " m"]; r = P;
      texto = L.quien + " va a cercar " + L.que + ". ¿Cuántos metros de cerca necesita?";
      exp = a + " + " + b + " + " + a + " + " + b + " = " + r + " m";
    }
    ctrl.pregunta("🧮 Resuelve con el perímetro");
    host.innerHTML = '<div class="prob-enun geo-enun">' + esc(texto) + "</div>" + figuraMedida(tipo, rot, false) + '<div class="geo-opciones"></div>';
    pedirNumero(host.querySelector(".geo-opciones"), ctrl, r, u, exp);
  }

  window.Rectas = Actividad("rec", [
    { icono: "📏", nombre: "Gira la recta", desc: "paralelas, perpendiculares y oblicuas", total: 6, ronda: rectaGirar },
    { icono: "🏘️", nombre: "El plano del barrio", desc: "reconoce las rectas", total: 6, ronda: rectaBarrio },
    { icono: "📐", nombre: "Abre el ángulo", desc: "agudo, recto y obtuso", total: 6, ronda: anguloAbrir },
    { icono: "🧭", nombre: "Mide con el graduador", desc: "¿cuántos grados?", total: 6, ronda: anguloMedir }
  ]);
  window.Cuadri = Actividad("cua", [
    { icono: "🔷", nombre: "Familias", desc: "paralelogramos, trapecios y trapezoides", total: 5, ronda: cuadFamilias },
    { icono: "👆", nombre: "¿Cómo se llama?", desc: "cuadrado, rombo, trapecio…", total: 6, ronda: cuadNombres },
    { icono: "🚶", nombre: "Camina el contorno", desc: "perímetro: suma los lados", total: 6, ronda: perimetro },
    { icono: "🧮", nombre: "Problemas de perímetro", desc: "cercas, lados y vueltas", total: 5, ronda: perimProblema }
  ]);
})();
