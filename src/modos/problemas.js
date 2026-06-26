/* ============================================================
   PROBLEMAS (resolución paso a paso) — Matemáticas (manipulativo guiado)
   Tema del temario de Quinto ("análisis y resolución de problemas, 4 pasos").
   El niño: 1) elige la OPERACIÓN correcta (tocando), 2) hace el CÁLCULO y
   escribe la respuesta. Contexto del Ecuador (mercado, feria, USD…).
   ============================================================ */
(function () {
  const PROBLEMAS = [
    { t: "En el mercado, Nelson compró 3 fundas con 12 mandarinas cada una. ¿Cuántas mandarinas tiene en total?", op: "×", a: 3, b: 12, u: "mandarinas" },
    { t: "Una caja trae 24 colas y se reparten en partes iguales entre 6 amigos. ¿Cuántas le tocan a cada uno?", op: "÷", a: 24, b: 6, u: "colas" },
    { t: "Sofía tenía $45 y gastó $18 en el mercado. ¿Cuánto dinero le quedó?", op: "−", a: 45, b: 18, u: "dólares" },
    { t: "En el bus subieron 28 personas y luego 15 más. ¿Cuántas personas hay ahora?", op: "+", a: 28, b: 15, u: "personas" },
    { t: "Un agricultor de Tungurahua cosechó 8 sacos con 25 kg de papas cada uno. ¿Cuántos kilos cosechó?", op: "×", a: 8, b: 25, u: "kilos" },
    { t: "Hay 56 panes para repartir en 7 canastas iguales. ¿Cuántos panes van en cada canasta?", op: "÷", a: 56, b: 7, u: "panes" },
    { t: "Una escuela tiene 134 niñas y 128 niños. ¿Cuántos estudiantes hay en total?", op: "+", a: 134, b: 128, u: "estudiantes" },
    { t: "En la feria de Otavalo había 90 ponchos y se vendieron 37. ¿Cuántos quedaron?", op: "−", a: 90, b: 37, u: "ponchos" },
    { t: "Cada cuy cuesta $6 y doña Rosa vendió 9 cuyes. ¿Cuánto dinero recibió?", op: "×", a: 6, b: 9, u: "dólares" },
    { t: "72 plátanos se acomodan en racimos de 8. ¿Cuántos racimos se arman?", op: "÷", a: 72, b: 8, u: "racimos" },
    { t: "Un tren recorrió 245 km por la mañana y 130 km por la tarde. ¿Cuántos km recorrió en el día?", op: "+", a: 245, b: 130, u: "km" },
    { t: "Andrés tenía 100 láminas y pegó 64 en su álbum. ¿Cuántas láminas le faltan por pegar?", op: "−", a: 100, b: 64, u: "láminas" }
  ];
  const OPS = ["+", "−", "×", "÷"];
  function calcular(p) {
    return p.op === "+" ? p.a + p.b : p.op === "−" ? p.a - p.b : p.op === "×" ? p.a * p.b : p.a / p.b;
  }
  function deck(ops) { return PROBLEMAS.filter((p) => ops.indexOf(p.op) >= 0); }

  // Cada tema baraja su propio mazo y va sacando problemas sin repetir.
  const ronda = (ops) => {
    let cola = [];
    return (host, ctrl) => {
      if (!cola.length) cola = ctrl.mezclar(deck(ops).slice());
      const p = cola.pop();
      const r = calcular(p);

      ctrl.pregunta("🧮 Resuelve paso a paso");
      host.innerHTML =
        '<div class="prob-enun">' + p.t + "</div>" +
        '<p class="prob-paso">1) ¿Qué operación usas?</p>' +
        '<div class="prob-ops">' + OPS.map((s) => '<button class="prob-op" data-op="' + s + '">' + s + "</button>").join("") + "</div>" +
        '<div class="prob-calc oculto">' +
          '<p class="prob-paso">2) Haz el cálculo y escribe la respuesta</p>' +
          '<div class="prob-cuenta"></div>' +
          '<div class="prob-resp"><input class="prob-input" inputmode="numeric" autocomplete="off" />' +
          '<button class="prob-ok">Comprobar</button></div>' +
        "</div>";

      const botones = Array.prototype.slice.call(host.querySelectorAll(".prob-op"));
      botones.forEach((btn) => {
        btn.onclick = () => {
          if (btn.dataset.op === p.op) {
            botones.forEach((b) => { b.disabled = true; });
            btn.classList.add("ok");
            host.querySelector(".prob-cuenta").textContent = p.a + " " + p.op + " " + p.b + " =";
            host.querySelector(".prob-calc").classList.remove("oculto");
            const inp = host.querySelector(".prob-input");
            inp.focus();
            ctrl.retro("¡Bien! Ahora calcula 👇", "bien");
          } else {
            btn.classList.add("rojo"); setTimeout(() => btn.classList.remove("rojo"), 450);
            ctrl.reintento("Piensa: ¿sumar, restar, multiplicar o dividir? 🤔");
          }
        };
      });

      let intentos = 0;
      function comprobar() {
        const inp = host.querySelector(".prob-input");
        const v = inp.value.trim();
        if (v === "") return;
        if (parseInt(v, 10) === r) {
          inp.disabled = true;
          ctrl.retro("✅ Respuesta: " + r + " " + p.u, "bien");
          ctrl.ganar(1500);
        } else {
          intentos++;
          if (intentos >= 2) {
            inp.value = r; inp.disabled = true;
            ctrl.fallar("La respuesta era " + r + " " + p.u + " (" + p.a + " " + p.op + " " + p.b + ").", 2400);
          } else {
            ctrl.reintento("Casi… revisa tu cálculo 👀");
          }
        }
      }
      host.querySelector(".prob-ok").onclick = comprobar;
      host.querySelector(".prob-input").addEventListener("keydown", (e) => { if (e.key === "Enter") comprobar(); });
    };
  };

  window.Problemas = Actividad("prob", [
    { icono: "➕➖", nombre: "Sumar y restar", desc: "problemas de + y −", total: 6, ronda: ronda(["+", "−"]) },
    { icono: "✖️➗", nombre: "Multiplicar y dividir", desc: "problemas de × y ÷", total: 6, ronda: ronda(["×", "÷"]) }
  ]);
})();
