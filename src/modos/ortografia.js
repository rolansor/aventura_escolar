/* ============================================================
   MODO ORTOGRAFÍA — generador de ejercicios aleatorios
   A partir de los bancos de palabras crea, al azar, ejercicios
   de tipo "elige_letra" o "elige_palabra". Cada categoría tiene
   muchísimas combinaciones (más de 100).
   ============================================================ */

const Ortografia = (function () {
  let categoriaActual = null;
  let cola = [];
  let indice = 0;
  let aciertos = 0;
  let temporizador = null;
  const TOTAL_RONDA = 10;

  const elSelector = () => document.getElementById("ortografia-selector");
  const elJuego = () => document.getElementById("ortografia-juego");

  /* ---------- Utilidades ---------- */
  const VOCAL_TILDE = { "á":"a","é":"e","í":"i","ó":"o","ú":"u","Á":"A","É":"E","Í":"I","Ó":"O","Ú":"U" };
  function quitarTildes(s) { return s.replace(/[áéíóúÁÉÍÓÚ]/g, (c) => VOCAL_TILDE[c] || c); }
  function capitalizar(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // Palabras añadidas por el adulto en el editor
  function extras(cat) { return Juego.cargar("orto_pal_" + cat.id, []); }

  // Quita las palabras que el adulto ocultó (en el editor). Si las ocultara
  // TODAS, devuelve la lista original para no dejar la categoría sin palabras.
  function quitarOcultas(clave, lista) {
    const ocultas = Juego.cargar(clave, []);
    if (!ocultas.length) return lista;
    const set = new Set(ocultas);
    const filtrada = lista.filter((w) => !set.has(w));
    return filtrada.length ? filtrada : lista;
  }

  function masPalabras(cat) {
    return quitarOcultas("orto_ocultas_" + cat.id, cat.palabras.concat(extras(cat)));
  }

  function poolDe(cat) {
    const pares = Juego.cargar("orto_pares_" + cat.id, []).length;
    if (cat.estrategia === "tilde")
      return cat.conTilde.length + cat.pares.length + Juego.cargar("orto_pal_tildes", []).length + pares;
    if (cat.estrategia === "mayus")
      return cat.propios.length + cat.comunes.length +
        Juego.cargar("orto_prop_mayusculas", []).length + Juego.cargar("orto_com_mayusculas", []).length + pares;
    if (cat.estrategia === "clasificar")
      return Object.values(cat.banco).reduce((n, arr) => n + arr.length, 0);
    const ex = extras(cat).length;
    if (cat.estrategia === "lly") return cat.palabras.length + ex + pares;
    return (cat.palabras.length + ex) * 2 + pares; // letra y hache: dos formas por palabra
  }

  function init() { pintarSelector(); }

  function pintarSelector() {
    const cont = elSelector();
    cont.innerHTML = "";
    DATOS.ortografia.forEach((cat) => {
      const b = document.createElement("button");
      b.className = "chip-categoria";
      b.innerHTML = `${cat.icono} ${cat.nombre}<small>${poolDe(cat)}+ ejercicios al azar</small>`;
      b.onclick = () => empezar(cat);
      cont.appendChild(b);
    });
  }

  /* ---------- Encontrar dónde poner el hueco ---------- */
  function candidatos(cat, palabra) {
    const idxs = [];
    const p = palabra.toLowerCase();
    for (let i = 0; i < p.length; i++) {
      const ch = p[i], sig = p[i + 1] || "";
      if (cat.id === "b_v") { if (ch === "b" || ch === "v") idxs.push(i); }
      else if (cat.id === "c_s_z") { if ((ch === "c" && sig !== "h") || ch === "s" || ch === "z") idxs.push(i); }
      else if (cat.id === "g_j") { if (ch === "j" || (ch === "g" && (sig === "e" || sig === "i"))) idxs.push(i); }
      else if (cat.id === "m_p_b") { if (ch === "m" && (sig === "p" || sig === "b")) idxs.push(i); }
      else if (cat.id === "h_muda") { if (ch === "h") idxs.push(i); }
    }
    return idxs;
  }

  function letraIncorrecta(cat, letra) {
    if (cat.id === "b_v") return letra === "b" ? "v" : "b";
    if (cat.id === "g_j") return letra === "g" ? "j" : "g";
    if (cat.id === "m_p_b") return "n";
    if (cat.id === "c_s_z") {
      const otras = ["c", "s", "z"].filter((x) => x !== letra);
      return otras[Math.floor(Math.random() * otras.length)];
    }
    return letra;
  }

  /* ---------- Generadores por estrategia ---------- */
  function generar(cat) {
    // Pares creados por el adulto (correcta/incorrecta): aparecen ~40%
    const pares = Juego.cargar("orto_pares_" + cat.id, []);
    if (pares.length && Math.random() < 0.4) {
      return ejDePar(cat, pares[Math.floor(Math.random() * pares.length)]);
    }
    if (cat.estrategia === "clasificar") return genClasificar(cat);
    if (cat.estrategia === "tilde") return genTilde(cat);
    if (cat.estrategia === "mayus") return genMayus(cat);
    if (cat.estrategia === "lly") return genLLY(cat);
    if (cat.estrategia === "hache") return genHache(cat);
    return genLetra(cat); // b_v, c_s_z, g_j, m_p_b
  }

  // Convierte un par {bien, mal} en ejercicio. Si difieren en UNA sola
  // letra (misma longitud), a veces lo presenta como "completar la letra".
  function ejDePar(cat, p) {
    if (p.bien.length === p.mal.length) {
      const diffs = [];
      for (let i = 0; i < p.bien.length; i++) if (p.bien[i] !== p.mal[i]) diffs.push(i);
      if (diffs.length === 1 && Math.random() < 0.5) {
        const i = diffs[0];
        const conHueco = p.bien.slice(0, i) + "_" + p.bien.slice(i + 1);
        return {
          tipo: "elige_letra", palabra: conHueco, correcta: p.bien[i],
          opciones: Juego.mezclar([p.bien[i], p.mal[i]]), palabraCompleta: p.bien, pista: cat.pistaGen
        };
      }
    }
    return { tipo: "elige_palabra", correcta: p.bien, opciones: [p.bien, p.mal], pista: cat.pistaGen };
  }

  function genLetra(cat) {
    const palabra = Juego.azarEl(masPalabras(cat));
    const idxs = candidatos(cat, palabra);
    if (!idxs.length) return genLetra(cat); // por si acaso, otra palabra
    const idx = idxs[Math.floor(Math.random() * idxs.length)];
    const letra = palabra[idx];

    if (Math.random() < 0.55) {
      // elige_letra: hueco en la palabra
      const conHueco = palabra.slice(0, idx) + "_" + palabra.slice(idx + 1);
      return {
        tipo: "elige_letra", palabra: conHueco, correcta: letra,
        opciones: cat.opciones, palabraCompleta: palabra, pista: cat.pistaGen
      };
    } else {
      // elige_palabra: una bien y una mal
      const mal = palabra.slice(0, idx) + letraIncorrecta(cat, letra) + palabra.slice(idx + 1);
      return { tipo: "elige_palabra", correcta: palabra, opciones: [palabra, mal], pista: cat.pistaGen };
    }
  }

  function genHache(cat) {
    const palabra = Juego.azarEl(masPalabras(cat));
    const idxs = candidatos(cat, palabra);
    const idx = idxs[Math.floor(Math.random() * idxs.length)];
    if (Math.random() < 0.5) {
      const conHueco = palabra.slice(0, idx) + "_" + palabra.slice(idx + 1);
      return {
        tipo: "elige_letra", palabra: conHueco, correcta: "h",
        opciones: ["h", "—"], palabraCompleta: palabra, pista: "La H no suena, pero aquí sí va."
      };
    } else {
      const mal = palabra.slice(0, idx) + palabra.slice(idx + 1); // sin la H
      return { tipo: "elige_palabra", correcta: palabra, opciones: [palabra, mal], pista: cat.pistaGen };
    }
  }

  function genLLY(cat) {
    const palabra = Juego.azarEl(masPalabras(cat));
    let mal;
    if (palabra.includes("ll")) mal = palabra.replace("ll", "y");
    else if (palabra.includes("y")) mal = palabra.replace("y", "ll");
    else return genLLY(cat);
    return { tipo: "elige_palabra", correcta: palabra, opciones: [palabra, mal], pista: cat.pistaGen };
  }

  // Clasificar: muestra una palabra y se elige a qué grupo pertenece
  // (aguda/llana/esdrújula… o diptongo/triptongo/hiato).
  function genClasificar(cat) {
    const clase = Juego.azarEl(cat.clases);
    let banco = cat.banco[clase].concat(Juego.cargar("orto_clas_" + cat.id + "_" + clase, []));
    banco = quitarOcultas("orto_ocultas_" + cat.id + "_" + clase, banco);
    return {
      tipo: "clasificar",
      palabra: Juego.azarEl(banco),
      correcta: clase,
      opciones: cat.clases,
      pista: cat.pistaGen
    };
  }

  function genTilde(cat) {
    if (Math.random() < 0.65) {
      const palabra = Juego.azarEl(quitarOcultas("orto_ocultas_" + cat.id, cat.conTilde.concat(Juego.cargar("orto_pal_tildes", []))));
      const mal = quitarTildes(palabra);
      if (mal === palabra) return genTilde(cat);
      return { tipo: "elige_palabra", correcta: palabra, opciones: [palabra, mal], pista: cat.pistaGen };
    } else {
      const par = Juego.azarEl(cat.pares);
      return { tipo: "elige_palabra", correcta: par.bien, opciones: [par.bien, par.mal], pista: par.pista };
    }
  }

  function genMayus(cat) {
    if (Math.random() < 0.5) {
      const w = Juego.azarEl(quitarOcultas("orto_ocultas_" + cat.id + "_propios", cat.propios.concat(Juego.cargar("orto_prop_mayusculas", []))));
      return { tipo: "elige_palabra", correcta: w, opciones: [w, w.toLowerCase()],
        pista: "Es un nombre propio: va con mayúscula." };
    } else {
      const w = Juego.azarEl(quitarOcultas("orto_ocultas_" + cat.id + "_comunes", cat.comunes.concat(Juego.cargar("orto_com_mayusculas", []))));
      return { tipo: "elige_palabra", correcta: w, opciones: [w, capitalizar(w)],
        pista: "Es una cosa común: va con minúscula." };
    }
  }

  /* ---------- Flujo del juego ---------- */
  function empezar(cat) {
    categoriaActual = cat;
    aciertos = 0;
    indice = 0;
    cola = [];
    let previo = "";
    for (let i = 0; i < TOTAL_RONDA; i++) {
      let ej, firma, intentos = 0;
      do {
        ej = generar(cat);
        firma = (ej.correcta || ej.palabraCompleta || "") + "|" + (ej.palabra || "");
        intentos++;
      } while (firma === previo && intentos < 6);
      previo = firma;
      cola.push(ej);
    }
    elSelector().classList.add("oculto");
    elJuego().classList.remove("oculto");
    document.getElementById("orto-regla").textContent = "";   // la regla la sugiere la mascota
    Juego.tip(cat.regla);
    mostrar();
  }

  function mostrar() {
    const ej = cola[indice];
    document.getElementById("orto-progreso").style.width = (indice / cola.length) * 100 + "%";
    document.getElementById("orto-retro").textContent = "";
    document.getElementById("orto-retro").className = "retro";
    document.getElementById("orto-pista").textContent = "";
    if (ej.pista) Juego.tip(ej.pista);
    const opciones = document.getElementById("orto-opciones");
    opciones.innerHTML = "";

    if (ej.tipo === "elige_letra") {
      document.getElementById("orto-pregunta").textContent = ej.palabra.replace("_", "▢");
      ej.opciones.forEach((op) => crearOpcion(op, op === ej.correcta, ej));
    } else if (ej.tipo === "clasificar") {
      document.getElementById("orto-pregunta").textContent = ej.palabra;
      Juego.mezclar(ej.opciones.slice()).forEach((op) => crearOpcion(op, op === ej.correcta, ej));
    } else {
      document.getElementById("orto-pregunta").textContent = "¿Cuál está bien escrita?";
      Juego.mezclar(ej.opciones.slice()).forEach((op) => crearOpcion(op, op === ej.correcta, ej));
    }
    arrancarTimer();
  }

  function arrancarTimer() {
    const c = Juego.config();
    const el = document.getElementById("orto-timer");
    if (c.timerOn) {
      el.classList.remove("oculto");
      Juego.cronIniciar(c.timerSeg, "orto-timer", tiempoAgotado);
    } else {
      el.classList.add("oculto");
      Juego.cronDetener();
    }
  }

  function tiempoAgotado() {
    const ej = cola[indice];
    document.querySelectorAll("#orto-opciones .opcion").forEach((x) => (x.onclick = null));
    const retro = document.getElementById("orto-retro");
    retro.textContent = "⏰ ¡Se acabó el tiempo! Era: " + (ej.palabraCompleta || ej.correcta);
    retro.className = "retro mal";
    document.querySelectorAll("#orto-opciones .opcion").forEach((x) => {
      if (x.textContent === ej.correcta) x.classList.add("correcta");
    });
    Juego.error();
    avanzar(1900);
  }

  function crearOpcion(texto, esCorrecta, ej) {
    const b = document.createElement("button");
    b.className = "opcion";
    b.textContent = texto;
    b.onclick = () => responder(b, esCorrecta, ej);
    document.getElementById("orto-opciones").appendChild(b);
  }

  function responder(boton, esCorrecta, ej) {
    Juego.cronDetener();
    document.querySelectorAll("#orto-opciones .opcion").forEach((x) => (x.onclick = null));
    const retro = document.getElementById("orto-retro");

    if (esCorrecta) {
      boton.classList.add("correcta");
      aciertos++;
      retro.textContent = Juego.frasePositiva();
      retro.className = "retro bien";
      Juego.acierto();
      avanzar(1000);
    } else {
      boton.classList.add("incorrecta");
      const bien = ej.palabraCompleta
        ? ej.palabraCompleta
        : ej.correcta;
      retro.textContent = "Casi… lo correcto es: " + bien;
      retro.className = "retro mal";
      Juego.error();
      document.querySelectorAll("#orto-opciones .opcion").forEach((x) => {
        if (x.textContent === ej.correcta) x.classList.add("correcta");
      });
      avanzar(1900);
    }
  }

  function avanzar(ms) {
    temporizador = setTimeout(() => {
      indice++;
      if (indice >= cola.length) terminar();
      else mostrar();
    }, ms);
  }

  function terminar() {
    Juego.cronDetener();
    document.getElementById("orto-timer").classList.add("oculto");
    document.getElementById("orto-progreso").style.width = "100%";
    document.getElementById("orto-pregunta").textContent = `¡Terminaste, ${Juego.jugador()}! ${aciertos} de ${cola.length} ⭐`;
    document.getElementById("orto-pista").textContent = "";
    document.getElementById("orto-opciones").innerHTML = "";
    const retro = document.getElementById("orto-retro");
    retro.textContent = aciertos === cola.length ? "¡Perfecto! 🏆" : "¡Muy bien! Toca otra ronda para seguir.";
    retro.className = "retro bien";
    if (aciertos >= cola.length - 1) Juego.granPremio();
    temporizador = setTimeout(volverSelector, 2600);
  }

  function volverSelector() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    Juego.cronDetener();
    elJuego().classList.add("oculto");
    elSelector().classList.remove("oculto");
  }

  return { init, volverSelector, pintarSelector };
})();
window.Ortografia = Ortografia;
