/* Redondeo — Matemáticas (motor manipulativo)
   Recta numérica: el número aparece como una bolita entre dos "redondos".
   El niño ve de qué lado del MEDIO cae y toca el más cercano; la bolita
   rueda hasta él. Hace concreto el "5 o más sube, 4 o menos baja". */
(function () {

  function jugar(u, nombre) {
    return function (host, ctrl) {
      let N; do { N = ctrl.azar(u * 2 + 1, u * 99); } while (N % u === 0);
      const lower = Math.floor(N / u) * u, upper = lower + u, mid = lower + u / 2;
      const correcta = (N % u) >= u / 2 ? upper : lower;
      const pos = ((N - lower) / u) * 100;
      ctrl.pregunta("🔵 ¿A qué <b>" + nombre + "</b> se acerca más <b>" + N + "</b>? Toca el número 👇");
      host.innerHTML =
        '<div class="recta">' +
          '<div class="recta-linea"></div>' +
          '<div class="recta-medio"><span>' + mid + "</span></div>" +
          '<div class="recta-bola" style="left:' + pos.toFixed(1) + '%">' + N + "</div>" +
          '<span class="recta-tope izq">' + lower + "</span>" +
          '<span class="recta-tope der">' + upper + "</span>" +
        "</div>" +
        '<div class="recta-targets">' +
          '<button class="recta-btn" data-v="' + lower + '">' + lower + "</button>" +
          '<button class="recta-btn" data-v="' + upper + '">' + upper + "</button>" +
        "</div>";
      const bola = host.querySelector(".recta-bola");
      let listo = false;
      host.querySelectorAll(".recta-btn").forEach((b) => {
        b.onclick = () => {
          if (listo) return;
          const v = parseInt(b.dataset.v, 10);
          if (v === correcta) {
            listo = true; bola.style.left = (v === lower ? 0 : 100) + "%";
            bola.classList.add("ok"); b.classList.add("ok"); ctrl.ganar();
          } else {
            b.classList.add("mal"); setTimeout(() => b.classList.remove("mal"), 450);
            ctrl.reintento("Fíjate de qué lado del <b>" + mid + "</b> está el <b>" + N + "</b> 👀");
          }
        };
      });
    };
  }

  window.Redondeo = Actividad("red", [
    { icono: "🔵", nombre: "A la decena", desc: "más cercana", ronda: jugar(10, "decena") },
    { icono: "🟢", nombre: "A la centena", desc: "más cercana", ronda: jugar(100, "centena") },
    { icono: "🟣", nombre: "A la unidad de mil", desc: "más cercana", ronda: jugar(1000, "unidad de mil") }
  ]);
})();
