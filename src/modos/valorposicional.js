/* Valor posicional — Matemáticas (motor manipulativo)
   El niño trabaja con BLOQUES BASE 10 de verdad (modelo 3D "bloques"):
     🧱 Arma el número   — pone y quita cubitos, barras, placas y cubos hasta
                           formar el número pedido; al juntar 10 de una clase
                           se CANJEAN solas por 1 de la siguiente.
     👀 Lee los bloques  — mira las piezas y marca cada cifra con su rueda.
     🔢 ¿Qué dígito? / 💰 ¿Cuánto vale? — repaso rápido con la tabla de colores.
   Manos primero, símbolo después: la cifra sale de contar piezas.
   El nivel del perfil decide el tamaño de los números (ver columnas()).
   Sin WebGL, los bloques se dibujan en 2D con CSS (misma actividad). */
(function () {
  const az = (a, b) => Juego.azar(a, b);
  const NOMBRE = { u: "unidades", d: "decenas", c: "centenas", um: "unidades de mil" };
  const UNA = { u: "unidad", d: "decena", c: "centena", um: "unidad de mil" };
  const PIEZA = { u: "cubito", d: "barra", c: "placa", um: "cubo grande" };
  const CORTO = { u: "U", d: "D", c: "C", um: "UM" };
  const VALOR = { u: 1, d: 10, c: 100, um: 1000 };
  const CLASE = { u: "col-u", d: "col-d", c: "col-c", um: "col-m" };
  const SIGUE = { u: "d", d: "c", c: "um" };
  const TOPE = { u: 9, d: 9, c: 9, um: 5 };
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  // Columnas con las que se trabaja según el nivel del perfil.
  function columnas() { return Juego.porNivel([["c", "d", "u"], ["c", "d", "u"], ["um", "c", "d", "u"]]); }
  // Un número al azar para esas columnas (la primera cifra nunca es 0).
  function numero(cols) {
    const facil = Juego.nivelIdx() === 0;
    const cta = { um: 0, c: 0, d: 0, u: 0 };
    cols.forEach((k, i) => {
      const max = k === "um" ? TOPE.um : (facil && i === 0 ? 4 : 9);
      cta[k] = i === 0 ? az(1, max) : az(0, facil ? 6 : 9);
    });
    return cta;
  }
  const total = (cta) => cta.um * 1000 + cta.c * 100 + cta.d * 10 + cta.u;

  /* ---------- La mesa de bloques: modelo 3D o, sin WebGL, bloques 2D ---------- */
  function mesa(host, ctrl, cols) {
    const clave = "mesa_" + cols.join("");
    host.innerHTML = '<div class="vp-mesa"></div>';
    const marco = host.querySelector(".vp-mesa");
    if (window.Modelo3D && Modelo3D.disponible("bloques")) {
      let m = ctrl.memo[clave];
      if (m) { marco.appendChild(m.el); m.limpiarAnclados(); m.modelo.poner({}); }
      else { m = ctrl.memo[clave] = Modelo3D.crear(marco, "bloques", { columnas: cols, pista: "", reservaAbajo: 0.3 }); ctrl.alTerminar(() => m.destruir()); }
      return {
        poner: (cta) => m.modelo.poner(cta),
        // el control cuelga del borde de abajo, alineado con su columna (no tapa los bloques)
        control: (k, el) => { el.classList.add("vp-colgado"); m.anclar(el, k, { abajo: true }); }
      };
    }
    // Respaldo 2D: mismas piezas, dibujadas con CSS.
    marco.innerHTML = '<div class="blq2d">' + cols.map((k) =>
      '<div class="blq2d-col"><div class="blq2d-piezas ' + CLASE[k] + '" data-k="' + k + '"></div><div class="blq2d-ctl" data-k="' + k + '"></div></div>').join("") + "</div>";
    return {
      poner: (cta) => {
        cols.forEach((k) => {
          const caja = marco.querySelector('.blq2d-piezas[data-k="' + k + '"]');
          let h = "";
          for (let i = 0; i < (cta[k] || 0); i++) h += '<span class="blq2d-p blq2d-' + k + '"></span>';
          caja.innerHTML = h;
        });
      },
      control: (k, el) => marco.querySelector('.blq2d-ctl[data-k="' + k + '"]').appendChild(el)
    };
  }

  // Tabla de valor posicional (columnas con etiqueta y dígito coloreado).
  const POS = ["unidades", "decenas", "centenas", "unidades de mil", "decenas de mil", "centenas de mil"];
  const ABREV = ["U", "D", "C", "UM", "DM", "CM"];
  const COL = ["col-u", "col-d", "col-c", "col-m", "col-dm", "col-cm"];
  function tabla(num, hl) {
    const s = String(num), N = s.length;
    let cab = "", fil = "";
    for (let i = 0; i < N; i++) {
      const pos = N - 1 - i, cls = COL[pos] || "col-u";
      const sel = (hl != null && pos === hl) ? " vp-hl" : "";
      cab += '<div class="vp-cab ' + cls + '">' + (ABREV[pos] || "") + "</div>";
      fil += '<div class="vp-cel ' + cls + sel + '">' + s[i] + "</div>";
    }
    return '<div class="vp-tabla" style="grid-template-columns:repeat(' + N + ',1fr)">' + cab + fil + "</div>";
  }

  /* ---------- 🧱 Arma el número ---------- */
  function rondaArma(host, ctrl) {
    const cols = columnas(), meta = numero(cols), N = total(meta);
    ctrl.pregunta("🧱 Arma el número <b>" + fmt(N) + "</b> con los bloques");
    const ms = mesa(host, ctrl, cols);
    const cta = { um: 0, c: 0, d: 0, u: 0 };
    const marcas = {};
    let listo = false;
    cols.forEach((k) => {
      const el = document.createElement("div");
      el.className = "vp-ctl " + CLASE[k];
      el.innerHTML = '<b class="vp-ctl-n">0</b><small>' + CORTO[k] + "</small><div class='vp-ctl-bot'>" +
        '<button type="button" class="vp-menos" title="Quitar 1 ' + PIEZA[k] + '">−</button>' +
        '<button type="button" class="vp-mas" title="Poner 1 ' + PIEZA[k] + '">+</button></div>';
      el.querySelector(".vp-mas").onclick = () => cambiar(k, 1);
      el.querySelector(".vp-menos").onclick = () => cambiar(k, -1);
      marcas[k] = el.querySelector(".vp-ctl-n");
      ms.control(k, el);
    });
    function cambiar(k, delta) {
      if (listo) return;
      const n = cta[k] + delta;
      if (n < 0) return;
      let aviso = null;
      if (n > TOPE[k] || (n === 10)) {
        // Diez de una clase se canjean por una de la siguiente (10 unidades = 1 decena…).
        const s = SIGUE[k];
        if (n === 10 && s && cols.indexOf(s) >= 0 && cta[s] < TOPE[s]) {
          cta[k] = 0; cta[s]++;
          aviso = "🔄 ¡Canje! 10 " + NOMBRE[k] + " = 1 " + UNA[s];
        } else { ctrl.retro("Ya no caben más " + NOMBRE[k] + " 👀", ""); return; }
      } else cta[k] = n;
      pintar(aviso);
    }
    function pintar(aviso) {
      ms.poner(cta);
      cols.forEach((k) => { marcas[k].textContent = cta[k]; });
      const t = total(cta);
      if (t === N) { listo = true; host.querySelectorAll(".vp-ctl button").forEach((b) => (b.disabled = true)); ctrl.ganar(1800); }
      else if (aviso) ctrl.retro(aviso, "bien");
      else if (t > N) ctrl.retro("Te pasaste: llevas <b>" + fmt(t) + "</b>. Quita piezas con −", "mal");
      else ctrl.retro(t ? "Llevas <b>" + fmt(t) + "</b>. Sigue poniendo piezas 💪" : "Toca + para poner piezas 👆", "");
    }
    pintar();
  }

  /* ---------- 👀 Lee los bloques ---------- */
  function rondaLee(host, ctrl) {
    const cols = columnas(), cta = numero(cols), N = total(cta);
    ctrl.pregunta("👀 ¿Qué número forman? Marca cada cifra");
    const ms = mesa(host, ctrl, cols);
    ms.poner(cta);
    const elige = { um: 0, c: 0, d: 0, u: 0 }, ruedas = {};
    let listo = false;
    cols.forEach((k) => {
      const el = document.createElement("div");
      el.className = "vp-ctl vp-rueda " + CLASE[k];
      el.innerHTML = '<button type="button" class="vp-sube" title="Subir">▲</button><b class="vp-ctl-n">0</b>' +
        '<button type="button" class="vp-baja" title="Bajar">▼</button><small>' + CORTO[k] + "</small>";
      const girar = (d) => { if (listo) return; elige[k] = (elige[k] + d + 10) % 10; el.querySelector(".vp-ctl-n").textContent = elige[k]; el.classList.remove("mal"); };
      el.querySelector(".vp-sube").onclick = () => girar(1);
      el.querySelector(".vp-baja").onclick = () => girar(-1);
      ruedas[k] = el;
      ms.control(k, el);
    });
    const pie = document.createElement("div");
    pie.className = "vp-pie";
    pie.innerHTML = '<button type="button" class="boton-grande vp-comprobar">✅ Comprobar</button>';
    host.appendChild(pie);
    pie.querySelector(".vp-comprobar").onclick = () => {
      if (listo) return;
      const malas = cols.filter((k) => elige[k] !== cta[k]);
      if (!malas.length) {
        listo = true; pie.querySelector(".vp-comprobar").disabled = true;
        ctrl.retro("Es el <b>" + fmt(N) + "</b>", "bien"); ctrl.ganar(1700);
      } else {
        malas.forEach((k) => ruedas[k].classList.add("mal"));
        ctrl.reintento("Cuenta otra vez las <b>" + NOMBRE[malas[0]] + "</b> 👀");
      }
    };
  }

  /* ---------- Repaso con la tabla: ¿qué dígito? / ¿cuánto vale? ---------- */
  const digitoEn = (num, p) => Math.floor(num / Math.pow(10, p)) % 10;
  const numDeCifras = (n) => az(Math.pow(10, n - 1), Math.pow(10, n) - 1);
  const cifrasNivel = () => Juego.porNivel([3, 4, az(5, 6)]);
  function opciones(correcta, pool) {
    const set = {}; set[correcta] = 1; const dist = [];
    Juego.mezclar(pool.slice()).forEach((x) => { x = String(x); if (!set[x]) { set[x] = 1; dist.push(x); } });
    while (dist.length < 3) { const r = String(az(0, 9)); if (!set[r]) { set[r] = 1; dist.push(r); } }
    return Juego.mezclar([String(correcta)].concat(dist.slice(0, 3)));
  }
  function botones(host, ctrl, html, ops, correcta, ayuda) {
    host.innerHTML = html + '<div class="ord-fuente"></div>';
    const cont = host.querySelector(".ord-fuente");
    let listo = false;
    ops.forEach((o) => {
      const b = document.createElement("button");
      b.className = "ord-chip vp-op"; b.textContent = fmt(o);
      b.onclick = () => {
        if (listo) return;
        if (String(o) === String(correcta)) { listo = true; b.classList.add("ok"); ctrl.ganar(); }
        else { b.classList.add("rojo"); b.disabled = true; ctrl.reintento(ayuda); }
      };
      cont.appendChild(b);
    });
  }
  function rondaDigito(host, ctrl) {
    const cifras = cifrasNivel(), num = numDeCifras(cifras), p = az(0, cifras - 1), d = digitoEn(num, p);
    const otras = []; for (let i = 0; i < cifras; i++) if (i !== p) otras.push(digitoEn(num, i));
    ctrl.pregunta("🔢 En <b>" + fmt(num) + "</b>, ¿qué dígito está en las <b>" + POS[p] + "</b>?");
    botones(host, ctrl, tabla(num, null), opciones(d, otras), d, "Busca la columna <b>" + ABREV[p] + "</b> en la tabla 👀");
  }
  function rondaValor(host, ctrl) {
    const cifras = cifrasNivel(), num = numDeCifras(cifras);
    let p = az(0, cifras - 1), d = digitoEn(num, p);
    if (d === 0) { p = cifras - 1; d = digitoEn(num, p); }
    const valor = d * Math.pow(10, p);
    const pool = [d, Math.pow(10, p), d * Math.pow(10, Math.max(0, p - 1)), d * Math.pow(10, p + 1)];
    ctrl.pregunta("💰 ¿Cuánto vale el <b>" + d + "</b> resaltado?");
    botones(host, ctrl, tabla(num, p), opciones(valor, pool), valor, "Está en las <b>" + POS[p] + "</b>: ¿cuánto vale ahí? 👀");
  }

  window.ValorPosicional = Actividad("vp", [
    { icono: "🧱", nombre: "Arma el número", desc: "con bloques base 10", total: 6, ronda: rondaArma },
    { icono: "👀", nombre: "Lee los bloques", desc: "¿qué número forman?", total: 6, ronda: rondaLee },
    { icono: "🔢", nombre: "¿Qué dígito?", desc: "busca la posición", total: 8, ronda: rondaDigito },
    { icono: "💰", nombre: "¿Cuánto vale?", desc: "el valor de cada cifra", total: 8, ronda: rondaValor }
  ]);
})();
