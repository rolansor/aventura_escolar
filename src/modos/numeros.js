/* Números — Matemáticas (motor manipulativo)
   Par/impar emparejando fichas (¿sobra una?), anterior/siguiente sobre
   una tira numérica, y números romanos uniendo parejas. */
(function () {
  function aRomano(n) {
    const m = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
      [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let r = ""; m.forEach((p) => { while (n >= p[0]) { r += p[1]; n -= p[0]; } }); return r;
  }

  /* ---------- Par o impar: empareja las fichas ---------- */
  function rondaParImpar(host, ctrl) {
    const N = ctrl.azar(4, 21), par = N % 2 === 0;
    ctrl.pregunta("¿El <b>" + N + "</b> es par o impar? Mira si <b>sobra</b> una ficha 👀");
    let dots = "";
    for (let i = 0; i < N; i++) dots += '<span class="ficha-pt' + (!par && i === N - 1 ? " sobra" : "") + '"></span>';
    host.innerHTML = '<div class="puntos-par">' + dots + "</div>" +
      '<div class="fila-cartas">' +
        '<button class="carta-num" data-v="Par">Par 👫</button>' +
        '<button class="carta-num" data-v="Impar">Impar 🙋</button>' +
      "</div>";
    let listo = false;
    host.querySelectorAll(".carta-num").forEach((b) => {
      b.onclick = () => {
        if (listo) return;
        if ((b.dataset.v === "Par") === par) { listo = true; b.classList.add("crece", "ok"); ctrl.ganar(); }
        else { b.classList.add("tiembla"); setTimeout(() => b.classList.remove("tiembla"), 450);
          ctrl.reintento(par ? "No sobra ninguna → es <b>par</b> 👀" : "Sobra una ficha → es <b>impar</b> 👀"); }
      };
    });
  }

  /* ---------- Anterior / siguiente: la tira numérica ---------- */
  function rondaVecino(siguiente) {
    return function (host, ctrl) {
      const N = ctrl.azar(102, 9997);
      const cells = [N - 2, N - 1, N, N + 1, N + 2];
      ctrl.pregunta("Toca el número <b>" + (siguiente ? "SIGUIENTE ➡️" : "ANTERIOR ⬅️") + "</b> a <b>" + N + "</b>");
      host.innerHTML = '<div class="tira-num">' + cells.map((c) =>
        '<button class="celda-num' + (c === N ? " centro" : "") + '" data-v="' + c + '">' + c + "</button>").join("") + "</div>";
      const correcta = siguiente ? N + 1 : N - 1;
      let listo = false;
      host.querySelectorAll(".celda-num").forEach((b) => {
        if (parseInt(b.dataset.v, 10) === N) return;     // la del centro es la referencia
        b.onclick = () => {
          if (listo) return;
          if (parseInt(b.dataset.v, 10) === correcta) { listo = true; b.classList.add("ok", "crece"); ctrl.ganar(); }
          else { b.classList.add("tiembla"); setTimeout(() => b.classList.remove("tiembla"), 450);
            ctrl.reintento("Ese no. El " + (siguiente ? "siguiente está a la derecha ➡️" : "anterior está a la izquierda ⬅️")); }
        };
      });
    };
  }

  /* ---------- Romanos: une cada número con su romano ---------- */
  function rondaRomano(host, ctrl) {
    const nums = [];
    while (nums.length < 3) { const n = ctrl.azar(1, 39); if (nums.indexOf(n) < 0) nums.push(n); }
    ctrl.pregunta("🏛️ Une cada número con su <b>romano</b>. Toca uno y luego su pareja 👆");
    const izq = ctrl.mezclar(nums.slice()), der = ctrl.mezclar(nums.slice());
    host.innerHTML = '<div class="match-cols">' +
      '<div class="match-col">' + izq.map((n) => '<button class="match-chip" data-n="' + n + '">' + n + "</button>").join("") + "</div>" +
      '<div class="match-col">' + der.map((n) => '<button class="match-chip" data-n="' + n + '">' + aRomano(n) + "</button>").join("") + "</div>" +
      "</div>";
    let sel = null, hechas = 0;
    host.querySelectorAll(".match-chip").forEach((ch) => {
      ch.onclick = () => {
        if (ch.classList.contains("hecha")) return;
        if (!sel) { sel = ch; ch.classList.add("sel"); return; }
        if (sel === ch) { sel = null; ch.classList.remove("sel"); return; }
        if (sel.parentNode === ch.parentNode) { sel.classList.remove("sel"); sel = ch; ch.classList.add("sel"); return; }
        if (sel.dataset.n === ch.dataset.n) {
          sel.classList.add("hecha"); ch.classList.add("hecha"); sel.classList.remove("sel"); sel = null; hechas++;
          if (hechas === 3) ctrl.ganar(); else ctrl.retro("¡Bien! Faltan " + (3 - hechas) + " 👇", "bien");
        } else {
          const a = sel, b = ch; a.classList.add("mal"); b.classList.add("mal");
          setTimeout(() => { a.classList.remove("mal", "sel"); b.classList.remove("mal"); }, 500);
          sel = null; ctrl.reintento("Esa pareja no es 👀");
        }
      };
    });
  }

  window.Numeros = Actividad("num", [
    { icono: "🟰", nombre: "Par o impar", desc: "empareja las fichas", ronda: rondaParImpar },
    { icono: "⬅️", nombre: "Anterior", desc: "en la tira numérica", ronda: rondaVecino(false) },
    { icono: "➡️", nombre: "Siguiente", desc: "en la tira numérica", ronda: rondaVecino(true) },
    { icono: "🏛️", nombre: "Números romanos", desc: "une las parejas", ronda: rondaRomano }
  ]);
})();
