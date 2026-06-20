/* Dinero (dólares) — Matemáticas (motor manipulativo)
   El niño ARMA un monto poniendo billetes/monedas en el mostrador.
   Manos primero: construye la cantidad con piezas concretas y el total
   se actualiza solo; se ilumina verde al acertar (control del error). */
(function () {
  const PIEZAS = [
    { v: 2000, et: "$20", tipo: "billete" }, { v: 1000, et: "$10", tipo: "billete" },
    { v: 500, et: "$5", tipo: "billete" }, { v: 100, et: "$1", tipo: "billete" },
    { v: 50, et: "50¢", tipo: "moneda" }, { v: 25, et: "25¢", tipo: "moneda" },
    { v: 10, et: "10¢", tipo: "moneda" }, { v: 5, et: "5¢", tipo: "moneda" },
    { v: 1, et: "1¢", tipo: "moneda" }
  ];
  const fmt = (c) => "$" + (c / 100).toFixed(2);
  const pieza = (v) => PIEZAS.find((p) => p.v === v);

  function jugar(metaFn) {
    return function (host, ctrl) {
      const m = metaFn(ctrl);
      const objetivo = m.objetivo;
      ctrl.pregunta(m.intro);
      const tray = [];
      host.innerHTML =
        '<div class="dinero-meta">🎯 Objetivo: <b>' + fmt(objetivo) + "</b></div>" +
        '<div class="bandeja"></div>' +
        '<div class="total-din">' + fmt(0) + "</div>" +
        '<div class="monedero"></div>';
      const elBandeja = host.querySelector(".bandeja");
      const elTotal = host.querySelector(".total-din");
      const elMon = host.querySelector(".monedero");

      PIEZAS.forEach((p) => {
        const b = document.createElement("button");
        b.className = "pieza " + p.tipo;
        b.innerHTML = (p.tipo === "billete" ? "💵 " : "🪙 ") + p.et;
        b.onclick = () => { tray.push(p.v); pinta(); };
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
            const p = pieza(v);
            const f = document.createElement("button");
            f.className = "ficha " + p.tipo;
            f.innerHTML = (p.tipo === "billete" ? "💵" : "🪙") + "<small>" + p.et + "</small>";
            f.title = "Tócalo para quitarlo";
            f.onclick = () => { tray.splice(idx, 1); pinta(); };
            elBandeja.appendChild(f);
          });
        }
        if (s === objetivo) {
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

  function metaPrecio(ctrl) {
    const obj = ctrl.azar(1, 15) * 100 + ctrl.azarEl([0, 25, 50, 75]);
    return { objetivo: obj, intro: "🏷️ Pon en el mostrador exactamente <b>" + fmt(obj) + "</b>" };
  }
  function metaCambio(ctrl) {
    const precio = ctrl.azar(1, 14) * 100 + ctrl.azarEl([0, 25, 50, 75]);
    const ops = [500, 1000, 2000].filter((b) => b > precio);
    const pago = ctrl.azarEl(ops.length ? ops : [2000]);
    return { objetivo: pago - precio,
      intro: "🔁 Cuesta <b>" + fmt(precio) + "</b> y pagas con <b>" + fmt(pago) + "</b>.<br>Arma el cambio que te deben." };
  }

  window.Dinero = Actividad("din", [
    { icono: "🏷️", nombre: "Arma el precio", desc: "pon el dinero justo", ronda: jugar(metaPrecio) },
    { icono: "🔁", nombre: "Da el cambio", desc: "arma lo que te deben", ronda: jugar(metaCambio) }
  ]);
})();
