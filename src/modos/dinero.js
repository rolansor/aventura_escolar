/* Dinero (dólares) — Matemáticas (motor manipulativo)
   El niño ARMA un monto poniendo billetes y monedas en el mostrador.
   Manos primero: construye la cantidad con piezas concretas y el total
   se actualiza solo; se ilumina verde al acertar (control del error).

   Las piezas están DIBUJADAS (CSS, ver .usd-* en ejercicios.css) como el
   dinero que se usa en el Ecuador: billetes de $5, $10 y $20, la moneda
   dorada de $1 y las monedas de 50, 25, 10, 5 y 1 centavo, cada una con
   su tamaño y su color de verdad (la de 10¢ es la más pequeña).
   El nivel del perfil decide los montos (ver MONTOS). */
(function () {
  const PIEZAS = [
    { v: 2000, et: "$20", tipo: "billete" }, { v: 1000, et: "$10", tipo: "billete" }, { v: 500, et: "$5", tipo: "billete" },
    { v: 100, et: "$1", tipo: "moneda", metal: "oro", d: 40 },
    { v: 50, et: "50¢", tipo: "moneda", metal: "plata", d: 46 }, { v: 25, et: "25¢", tipo: "moneda", metal: "plata", d: 38 },
    { v: 10, et: "10¢", tipo: "moneda", metal: "plata", d: 29 }, { v: 5, et: "5¢", tipo: "moneda", metal: "plata", d: 33 },
    { v: 1, et: "1¢", tipo: "moneda", metal: "cobre", d: 31 }
  ];
  const fmt = (c) => "$" + (c / 100).toFixed(2);
  const pieza = (v) => PIEZAS.find((p) => p.v === v);
  // El dibujo de una pieza (billete o moneda).
  function dibujo(p) {
    if (p.tipo === "billete") {
      return '<span class="usd-billete usd-b' + (p.v / 100) + '"><i>' + (p.v / 100) + "</i><b>$" + (p.v / 100) + "</b><i>" + (p.v / 100) + "</i></span>";
    }
    return '<span class="usd-moneda usd-' + p.metal + '" style="--d:' + p.d + 'px"><b>' + p.et + "</b></span>";
  }
  // Montos por nivel: [dólares mín, dólares máx, centavos posibles]
  const MONTOS = [
    [1, 9, [0, 50]],
    [1, 15, [0, 25, 50, 75]],
    [3, 38, [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]]
  ];

  function jugar(metaFn) {
    return function (host, ctrl) {
      const m = metaFn(ctrl);
      const objetivo = m.objetivo;
      ctrl.pregunta(m.intro);
      const tray = [];
      host.innerHTML =
        '<div class="bandeja"></div>' +
        '<div class="total-din">' + fmt(0) + "</div>" +
        '<div class="monedero"></div>';
      const elBandeja = host.querySelector(".bandeja");
      const elTotal = host.querySelector(".total-din");
      const elMon = host.querySelector(".monedero");
      let listo = false;

      PIEZAS.forEach((p) => {
        const b = document.createElement("button");
        b.className = "pieza";
        b.type = "button";
        b.title = "Poner " + p.et;
        b.innerHTML = dibujo(p);
        b.onclick = () => { if (listo) return; tray.push(p.v); pinta(); };
        elMon.appendChild(b);
      });

      function suma() { return tray.reduce((a, b) => a + b, 0); }
      function pinta() {
        const s = suma();
        elTotal.textContent = fmt(s);
        elTotal.className = "total-din" + (s === objetivo ? " ok" : s > objetivo ? " pasa" : "");
        elBandeja.innerHTML = "";
        if (!tray.length) {
          elBandeja.innerHTML = '<span class="bandeja-vacia">Toca el dinero para ponerlo aquí 👇</span>';
        } else {
          tray.forEach((v, idx) => {
            const f = document.createElement("button");
            f.className = "ficha";
            f.type = "button";
            f.innerHTML = dibujo(pieza(v));
            f.title = "Tócalo para quitarlo";
            f.onclick = () => { if (listo) return; tray.splice(idx, 1); pinta(); };
            elBandeja.appendChild(f);
          });
        }
        if (s === objetivo) {
          listo = true;
          elMon.querySelectorAll(".pieza").forEach((x) => (x.disabled = true));
          ctrl.ganar();
        } else if (s > objetivo) {
          ctrl.retro("Te pasaste por " + fmt(s - objetivo) + ". Quita algo tocándolo 👆", "mal");
        } else {
          ctrl.retro("Te faltan " + fmt(objetivo - s) + " 💪", "");
        }
      }
      pinta();
    };
  }

  function monto(ctrl) {
    const r = Juego.porNivel(MONTOS);
    return ctrl.azar(r[0], r[1]) * 100 + ctrl.azarEl(r[2]);
  }
  function metaPrecio(ctrl) {
    const obj = monto(ctrl);
    return { objetivo: obj, intro: "🏷️ Pon en el mostrador exactamente <b>" + fmt(obj) + "</b>" };
  }
  function metaCambio(ctrl) {
    let precio = monto(ctrl);
    const ops = [500, 1000, 2000, 5000].filter((b) => b > precio);
    const pago = ops.length ? ops[0] : 5000;          // se paga con el billete justo por encima del precio
    if (precio >= pago) precio = pago - 125;
    return { objetivo: pago - precio,
      intro: "🔁 Cuesta <b>" + fmt(precio) + "</b> y pagas con <b>" + fmt(pago) + "</b>. Arma el cambio" };
  }

  window.Dinero = Actividad("din", [
    { icono: "🏷️", nombre: "Arma el precio", desc: "pon el dinero justo", ronda: jugar(metaPrecio) },
    { icono: "🔁", nombre: "Da el cambio", desc: "arma lo que te deben", ronda: jugar(metaCambio) }
  ]);
})();
