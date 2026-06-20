/* ============================================================
   MODO SECUENCIAS
   Genera patrones (suma, resta, multiplicación, cuadrados,
   fibonacci, mezcla) y oculta un término para adivinar.
   También usa secuencias creadas por el adulto (localStorage).
   ============================================================ */

const Secuencias = (function () {
  let tipoActual = null;
  let aciertos = 0;
  let ronda = 0;
  let actual = null; // { terminos:[], faltaIndice, respuesta, regla, pista }
  let temporizador = null;
  const TOTAL_RONDA = 6;

  const elSelector = () => document.getElementById("secuencias-selector");
  const elJuego = () => document.getElementById("secuencias-juego");

  function init() {
    pintarSelector();
  }

  function pintarSelector() {
    const cont = elSelector();
    cont.innerHTML = "";
    DATOS.secuencias.forEach((s) => {
      const b = document.createElement("button");
      b.className = "chip-categoria";
      b.innerHTML = `${s.icono} ${s.nombre}`;
      b.onclick = () => empezar(s.id);
      cont.appendChild(b);
    });
    // Secuencias creadas por el adulto
    const propias = Juego.cargar("secuencias_propias", []);
    propias.forEach((p) => {
      const b = document.createElement("button");
      b.className = "chip-categoria";
      b.innerHTML = `⭐ ${p.nombre}<small>creada por ti</small>`;
      b.onclick = () => empezarPropia(p);
      cont.appendChild(b);
    });
  }

  function empezar(tipo) {
    tipoActual = { clase: "auto", tipo };
    aciertos = 0;
    ronda = 0;
    elSelector().classList.add("oculto");
    elJuego().classList.remove("oculto");
    const info = DATOS.secuencias.find((s) => s.id === tipo);
    document.getElementById("sec-regla").textContent = "💡 " + info.regla;
    siguiente();
  }

  function empezarPropia(p) {
    tipoActual = { clase: "propia", datos: p };
    aciertos = 0;
    ronda = 0;
    elSelector().classList.add("oculto");
    elJuego().classList.remove("oculto");
    document.getElementById("sec-regla").textContent = "💡 Secuencia creada por ti: " + p.nombre;
    siguiente();
  }

  /* ---------- Generadores de patrones ---------- */
  function generarAuto(tipo) {
    const nivel = Math.min(1 + Math.floor(ronda / 2), 4);
    let terminos = [], regla = "", pista = "";

    if (tipo === "suma") {
      const inicio = Juego.azar(1, 9), paso = Juego.azar(2, 4 + nivel);
      for (let i = 0; i < 6; i++) terminos.push(inicio + paso * i);
      regla = `Suma ${paso} cada vez`;
      pista = `Mira la diferencia entre dos números seguidos: siempre es ${paso}.`;
    } else if (tipo === "resta") {
      const paso = Juego.azar(2, 4 + nivel), inicio = paso * 6 + Juego.azar(5, 15);
      for (let i = 0; i < 6; i++) terminos.push(inicio - paso * i);
      regla = `Resta ${paso} cada vez`;
      pista = `Cada número baja de ${paso} en ${paso}.`;
    } else if (tipo === "multiplicacion") {
      const factor = Juego.azar(2, 2 + nivel), inicio = Juego.azar(1, 3);
      for (let i = 0; i < 5; i++) terminos.push(inicio * Math.pow(factor, i));
      regla = `Multiplica por ${factor}`;
      pista = `Cada número es el anterior multiplicado por ${factor}.`;
    } else if (tipo === "cuadrados") {
      const inicio = Juego.azar(1, 3);
      for (let i = 0; i < 6; i++) terminos.push(Math.pow(inicio + i, 2));
      regla = "Cuadrados (n × n)";
      pista = "1×1=1, 2×2=4, 3×3=9… ¿ves el patrón?";
    } else if (tipo === "fibonacci") {
      let a = Juego.azar(1, 3), b = Juego.azar(2, 4);
      terminos = [a, b];
      for (let i = 0; i < 5; i++) { const c = a + b; terminos.push(c); a = b; b = c; }
      regla = "Cada número es la suma de los dos anteriores";
      pista = "Suma los dos números de atrás para hallar el siguiente.";
    } else if (tipo === "tabla") {
      const tabla = Juego.azar(2, 9 + nivel);
      for (let i = 1; i <= 7; i++) terminos.push(tabla * i);
      regla = `Tabla del ${tabla}`;
      pista = `Ve sumando ${tabla} cada vez (es la tabla del ${tabla}).`;
    } else if (tipo === "dobles") {
      let v = Juego.azar(1, 5);
      for (let i = 0; i < 6; i++) { terminos.push(v); v = v * 2; }
      regla = "Cada número es el doble del anterior";
      pista = "Multiplica por 2 cada vez: 3, 6, 12, 24…";
    } else if (tipo === "alternada") {
      const sube = Juego.azar(2, 5), baja = Juego.azar(1, 3);
      let v = Juego.azar(3, 8);
      terminos.push(v);
      for (let i = 0; i < 5; i++) { v += i % 2 === 0 ? sube : -baja; terminos.push(v); }
      regla = `Sube ${sube}, baja ${baja}, sube ${sube}…`;
      pista = `Primero suma ${sube}, luego resta ${baja}, y así se repite.`;
    }
    return armar(terminos, regla, pista);
  }

  function generarDesdeConfig(cfg) {
    // cfg = { inicio, operacion, paso, largo }
    const terminos = Juego.construirSecuencia(cfg);
    return armar(terminos, "Secuencia personalizada", "Observa cómo cambian los números.");
  }

  function armar(terminos, regla, pista) {
    // Oculta un término (preferimos uno del medio o el último)
    let idx = Math.random() < 0.5 ? terminos.length - 1 : Juego.azar(2, terminos.length - 1);
    return { terminos, faltaIndice: idx, respuesta: terminos[idx], regla, pista };
  }

  function siguiente() {
    if (tipoActual.clase === "auto") {
      actual = generarAuto(tipoActual.tipo);
    } else {
      actual = generarDesdeConfig(tipoActual.datos.config);
    }
    pintar();
  }

  function pintar() {
    document.getElementById("sec-progreso").style.width = (ronda / TOTAL_RONDA) * 100 + "%";
    document.getElementById("sec-retro").textContent = "";
    document.getElementById("sec-retro").className = "retro";
    document.getElementById("sec-pista").textContent = "";
    const input = document.getElementById("sec-input");
    input.value = "";
    input.disabled = false;
    document.getElementById("sec-enviar").disabled = false;

    const txt = actual.terminos
      .map((n, i) => (i === actual.faltaIndice ? "▢" : n))
      .join("  ,  ");
    document.getElementById("sec-pregunta").textContent = txt;
    input.focus();
    arrancarTimer();
  }

  function arrancarTimer() {
    const c = Juego.config();
    const el = document.getElementById("sec-timer");
    if (c.timerOn) {
      el.classList.remove("oculto");
      Juego.cronIniciar(c.timerSeg, "sec-timer", tiempoAgotado);
    } else {
      el.classList.add("oculto");
      Juego.cronDetener();
    }
  }

  function tiempoAgotado() {
    const input = document.getElementById("sec-input");
    input.disabled = true;
    document.getElementById("sec-enviar").disabled = true;
    const retro = document.getElementById("sec-retro");
    retro.textContent = `⏰ ¡Se acabó el tiempo! Era ${actual.respuesta}. Regla: ${actual.regla}.`;
    retro.className = "retro mal";
    Juego.error();
    ronda++;
    temporizador = setTimeout(() => {
      if (ronda >= TOTAL_RONDA) terminar();
      else siguiente();
    }, 2200);
  }

  function comprobar() {
    const input = document.getElementById("sec-input");
    if (input.value.trim() === "") return;
    Juego.cronDetener();
    const valor = Number(input.value);
    const retro = document.getElementById("sec-retro");
    input.disabled = true;
    document.getElementById("sec-enviar").disabled = true;

    if (valor === actual.respuesta) {
      aciertos++;
      retro.textContent = Juego.frasePositiva() + " (" + actual.respuesta + ")";
      retro.className = "retro bien";
      Juego.acierto();
    } else {
      retro.textContent = `Era ${actual.respuesta}. Regla: ${actual.regla}.`;
      retro.className = "retro mal";
      Juego.error();
    }
    ronda++;
    temporizador = setTimeout(() => {
      if (ronda >= TOTAL_RONDA) terminar();
      else siguiente();
    }, valor === actual.respuesta ? 1200 : 2200);
  }

  function verPista() {
    document.getElementById("sec-pista").textContent = "💡 " + actual.pista;
  }

  function terminar() {
    Juego.cronDetener();
    document.getElementById("sec-timer").classList.add("oculto");
    document.getElementById("sec-progreso").style.width = "100%";
    document.getElementById("sec-pregunta").textContent = `¡Listo, ${Juego.jugador()}! ${aciertos} de ${TOTAL_RONDA} ⭐`;
    const retro = document.getElementById("sec-retro");
    retro.textContent = aciertos >= TOTAL_RONDA - 1 ? "¡Eres un genio de los números! 🏆" : "¡Buen trabajo! Sigue así.";
    retro.className = "retro bien";
    if (aciertos >= TOTAL_RONDA - 1) Juego.granPremio();
    temporizador = setTimeout(volverSelector, 2600);
  }

  function volverSelector() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    Juego.cronDetener();
    elJuego().classList.add("oculto");
    elSelector().classList.remove("oculto");
    pintarSelector(); // por si se crearon nuevas secuencias
  }

  return { init, comprobar, verPista, volverSelector, pintarSelector };
})();
