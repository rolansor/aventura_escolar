/* ============================================================
   MODO ORTOGRAFÍA — generador de ejercicios aleatorios
   A partir de los bancos de palabras (data/ortografia.json + las que
   añade el adulto en el Banco de contenido) crea ejercicios de tipo
   "elige_letra", "elige_palabra" o "clasificar".

   REGLA DE ORO DEL GENERADOR: nunca proponer como "mal escrita" una
   palabra que también existe (casa/caza, vaca/baca, hola/ola, pollo/poyo…).
   Si la variante es una palabra real, ese hueco no se usa (ver HOMOFONAS).
   Por lo mismo, cada hueco solo ofrece las letras que de verdad se
   confunden ahí: "ta▢a" ofrece S y Z (no C, que sonaría K).
   ============================================================ */

const Ortografia = (function () {
  let categoriaActual = null;
  let cola = [];
  let indice = 0;
  let aciertos = 0;
  let temporizador = null;
  let tInicio = 0;
  const TOTAL_RONDA = 10;
  const PX = "orto";               // clave del leaderboard

  const elSelector = () => document.getElementById("ortografia-selector");
  const elJuego = () => document.getElementById("ortografia-juego");

  /* ---------- Utilidades ---------- */
  const VOCAL_TILDE = { "á":"a","é":"e","í":"i","ó":"o","ú":"u","Á":"A","É":"E","Í":"I","Ó":"O","Ú":"U" };
  function quitarTildes(s) { return s.replace(/[áéíóúÁÉÍÓÚ]/g, (c) => VOCAL_TILDE[c] || c); }
  function capitalizar(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  const ES_EI = (c) => c === "e" || c === "i" || c === "é" || c === "í";
  // Pone `letra` con la misma caja (mayúscula/minúscula) que `modelo`.
  function conCaja(letra, modelo) { return modelo === modelo.toUpperCase() && modelo !== modelo.toLowerCase() ? letra.toUpperCase() : letra; }

  /* Palabras que EXISTEN con la otra grafía. Si la versión "mal escrita" de una
     palabra cae aquí (o es otra palabra del mismo banco), el ejercicio sería
     injusto: las dos opciones estarían bien. */
  const HOMOFONAS = new Set((
    // b / v
    "vaca baca bota vota botar votar hierba hierva tubo tuvo bello vello sabia savia basto vasto cabo cavo grabar gravar " +
    "rebelar revelar bienes vienes barón varón bacilo vacilo baya vaya bobina bovina acerbo acervo nobel novel combino convino " +
    "beta veta bate vate balido valido cabe cave " +
    // c / s / z
    "casa caza cien sien cima sima masa maza pozo poso rosa roza taza tasa voz vos zumo sumo abrazo abraso abrazar abrasar " +
    "cocer coser ciervo siervo vez ves has haz cegar segar cerrar serrar " +
    "ciento siento cocido cosido losa loza risa riza seta zeta casar cazar asar azar encima enzima pase pace sueco zueco " +
    "corso corzo ceso seso cebo sebo ceda seda cede sede cenado senado cesión sesión bazar basar braza brasa concejo consejo " +
    "peces peses reciente resiente cauce cause lazo laso zaga saga " +
    // g / j
    "gira jira ingerir injerir vegete vejete " +
    // h
    "hola ola hora ora hasta asta hecho echo honda onda hojear ojear habría abría huso uso herrar errar hay ay as " +
    "hatajo atajo hizo izo ha a he e hala ala haya aya hato ato haremos aremos hice ice horca orca hierro yerro " +
    "deshecho desecho rehusar reusar hinca inca hablando ablando hoya olla azahar " +
    // ll / y
    "pollo poyo rayo rallo maya malla arroyo arrollo halla valla cayó calló cayo callo huya hulla raya ralla rayar rallar " +
    "pulla puya cayado callado"
  ).split(" "));

  // Palabras añadidas por el adulto en el Banco de contenido
  function extras(cat) { return Juego.cargar("orto_pal_" + cat.id, []); }

  // Quita las palabras que el adulto ocultó. Si las ocultara TODAS, devuelve la
  // lista original para no dejar la categoría sin palabras.
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
    if (!cont) return;              // el Banco de contenido carga este módulo sin la pantalla de juego
    cont.innerHTML = "";
    DATOS.ortografia.forEach((cat) => {
      const b = document.createElement("button");
      b.className = "chip-categoria";
      b.innerHTML = `${cat.icono} ${cat.nombre}<small>${poolDe(cat)}+ ejercicios al azar</small>`;
      b.onclick = () => empezar(cat);
      cont.appendChild(b);
    });
    Juego.pintarMejores(cont, PX); // 🏆 mejores de esta actividad
  }

  /* ---------- Huecos posibles de una palabra ----------
     Devuelve [{ i, letras, mostrarMal }]: en la posición `i` se confunden las
     `letras` (la primera NO es necesariamente la correcta). `mostrarMal` indica si
     tiene sentido enseñar la palabra mal escrita ("jente") o solo el hueco. */
  function huecos(cat, palabra) {
    const p = palabra.toLowerCase(), res = [];
    for (let i = 0; i < p.length; i++) {
      const ch = p[i], sig = p[i + 1] || "", ant = p[i - 1] || "";
      if (cat.id === "b_v") {
        if (ch === "b" || ch === "v") res.push({ i: i, letras: ["b", "v"], mostrarMal: true });
      } else if (cat.id === "c_s_z") {
        // Ante E/I se confunden C, S y Z (cielo/sielo/zielo). En el resto solo S y Z:
        // una C ahí sonaría K (casa) y no es una duda real.
        if (ch === "c" && ES_EI(sig)) res.push({ i: i, letras: ["c", "s", "z"], mostrarMal: true });
        else if (ch === "s" || ch === "z") res.push({ i: i, letras: ES_EI(sig) ? ["c", "s", "z"] : ["s", "z"], mostrarMal: true });
      } else if (cat.id === "g_j") {
        // G y J solo suenan igual ante E/I (gente/jente). "ja, jo, ju" se practican
        // con el hueco, pero sin enseñar la palabra mal escrita.
        if (ch === "g" && ES_EI(sig)) res.push({ i: i, letras: ["g", "j"], mostrarMal: true });
        else if (ch === "j") res.push({ i: i, letras: ["g", "j"], mostrarMal: ES_EI(sig) });
      } else if (cat.id === "m_p_b") {
        if (ch === "m" && (sig === "p" || sig === "b")) res.push({ i: i, letras: ["m", "n"], mostrarMal: true });
      } else if (cat.id === "h_muda") {
        if (ch === "h" && ant !== "c") res.push({ i: i, letras: ["h"], mostrarMal: true });   // la H de "ch" sí suena
      }
    }
    return res;
  }
  function esReal(variante, banco) {
    const v = variante.toLowerCase();
    return HOMOFONAS.has(v) || (banco || []).some((w) => w.toLowerCase() === v);
  }
  // ¿Sirve esta palabra para la categoría? La usa el Banco de contenido para avisar
  // al adulto ANTES de guardar una palabra que nunca podría salir.
  function sirve(cat, palabra, grupo) {
    const p = String(palabra || "").trim();
    if (!p) return { ok: false, error: "Escribe una palabra." };
    if (/\s/.test(p) && cat.estrategia !== "mayus") return { ok: false, error: "Escribe una sola palabra." };
    if (cat.estrategia === "letra") {
      if (!huecos(cat, p).length) return { ok: false, error: "«" + p + "» no tiene ninguna letra de esta categoría (" + cat.nombre + ")." };
      if (!formasDeLetra(cat, p, [p]).length) return { ok: false, error: "«" + p + "» se confunde con otra palabra que también existe; no sirve para este ejercicio." };
    } else if (cat.estrategia === "hache") {
      if (!huecos(cat, p).length) return { ok: false, error: "«" + p + "» no tiene H muda." };
      if (!formasDeLetra(cat, p, [p]).length) return { ok: false, error: "Sin la H, «" + p + "» es otra palabra que existe; no sirve para este ejercicio." };
    } else if (cat.estrategia === "lly") {
      if (!varianteLLY(p)) return { ok: false, error: "«" + p + "» no tiene LL ni Y con sonido de consonante." };
      if (esReal(varianteLLY(p), [])) return { ok: false, error: "«" + varianteLLY(p) + "» también existe; no sirve para este ejercicio." };
    } else if (cat.estrategia === "tilde") {
      if (quitarTildes(p) === p) return { ok: false, error: "«" + p + "» no lleva tilde." };
    } else if (cat.estrategia === "mayus") {
      if (grupo === "propios" && p === p.toLowerCase()) return { ok: false, error: "Un nombre propio se escribe con mayúscula inicial." };
      if (grupo === "comunes" && p !== p.toLowerCase()) return { ok: false, error: "Las palabras comunes van en minúscula." };
    }
    return { ok: true };
  }

  /* ---------- Generadores por estrategia ---------- */
  function generar(cat) {
    // Pares creados por el adulto (correcta/incorrecta): aparecen ~40%
    const pares = Juego.cargar("orto_pares_" + cat.id, []);
    if (pares.length && cat.estrategia !== "clasificar" && Math.random() < 0.4) {
      return ejDePar(cat, pares[Math.floor(Math.random() * pares.length)]);
    }
    if (cat.estrategia === "clasificar") return genClasificar(cat);
    if (cat.estrategia === "tilde") return genTilde(cat);
    if (cat.estrategia === "mayus") return genMayus(cat);
    if (cat.estrategia === "lly") return genLLY(cat);
    return genLetra(cat); // b_v, c_s_z, g_j, m_p_b y h_muda
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

  /* Todas las formas JUSTAS de preguntar una palabra de letra/hache:
     [{ tipo:"letra", i, opciones } | { tipo:"palabra", mal }]. */
  function formasDeLetra(cat, palabra, banco) {
    const formas = [];
    huecos(cat, palabra).forEach((h) => {
      const real = palabra[h.i];
      if (cat.estrategia === "hache") {
        const sinH = palabra.slice(0, h.i) + palabra.slice(h.i + 1);
        if (esReal(sinH, banco)) return;                       // hola/ola: las dos existen
        formas.push({ tipo: "letra", i: h.i, opciones: ["h", "—"], pista: "La H no suena, pero aquí sí va." });
        formas.push({ tipo: "palabra", mal: sinH });
        return;
      }
      const otras = h.letras.filter((l) => l !== real.toLowerCase());
      const variantes = otras.map((l) => palabra.slice(0, h.i) + conCaja(l, real) + palabra.slice(h.i + 1));
      const injustas = variantes.filter((v) => esReal(v, banco));
      if (!injustas.length) formas.push({ tipo: "letra", i: h.i, opciones: h.letras });   // el hueco solo vale si NINGUNA otra letra forma palabra
      if (h.mostrarMal) variantes.forEach((v) => { if (injustas.indexOf(v) < 0) formas.push({ tipo: "palabra", mal: v }); });
    });
    return formas;
  }

  function genLetra(cat) {
    const banco = masPalabras(cat);
    // Sin recursión: si una palabra no sirve (la añadió el adulto sin la letra, o
    // solo tiene formas injustas) se prueba otra; al final se cae al banco del juego.
    for (let intento = 0; intento < 60; intento++) {
      const palabra = Juego.azarEl(intento < 45 ? banco : cat.palabras);
      const formas = formasDeLetra(cat, palabra, banco);
      if (!formas.length) continue;
      const f = Juego.azarEl(formas);
      if (f.tipo === "letra") {
        return {
          tipo: "elige_letra", palabra: palabra.slice(0, f.i) + "_" + palabra.slice(f.i + 1),
          correcta: cat.estrategia === "hache" ? "h" : palabra[f.i].toLowerCase(),
          opciones: f.opciones, palabraCompleta: palabra, pista: f.pista || cat.pistaGen
        };
      }
      return { tipo: "elige_palabra", correcta: palabra, opciones: [palabra, f.mal], pista: cat.pistaGen };
    }
    // Último recurso (no debería ocurrir con el banco del juego).
    const w = cat.palabras[0];
    return { tipo: "elige_palabra", correcta: w, opciones: [w, w + w.slice(-1)], pista: cat.pistaGen };
  }

  // Cambia la primera LL por Y, o la primera Y consonante (ante vocal) por LL.
  function varianteLLY(palabra) {
    if (/ll/i.test(palabra)) return palabra.replace(/ll/i, (m) => (m[0] === "L" ? "Y" : "y"));
    const m = /y(?=[aeiouáéíóú])/i.exec(palabra);
    if (!m) return null;                                        // "rey": la Y suena vocal
    return palabra.slice(0, m.index) + (m[0] === "Y" ? "Ll" : "ll") + palabra.slice(m.index + 1);
  }
  function genLLY(cat) {
    const banco = masPalabras(cat);
    for (let intento = 0; intento < 60; intento++) {
      const palabra = Juego.azarEl(intento < 45 ? banco : cat.palabras);
      const mal = varianteLLY(palabra);
      if (!mal || esReal(mal, banco)) continue;                 // pollo/poyo: las dos existen
      return { tipo: "elige_palabra", correcta: palabra, opciones: [palabra, mal], pista: cat.pistaGen };
    }
    return { tipo: "elige_palabra", correcta: "lluvia", opciones: ["lluvia", "yuvia"], pista: cat.pistaGen };
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
      const banco = quitarOcultas("orto_ocultas_" + cat.id, cat.conTilde.concat(Juego.cargar("orto_pal_tildes", [])));
      for (let intento = 0; intento < 40; intento++) {
        const palabra = Juego.azarEl(intento < 30 ? banco : cat.conTilde);
        const mal = quitarTildes(palabra);
        if (mal !== palabra) return { tipo: "elige_palabra", correcta: palabra, opciones: [palabra, mal], pista: cat.pistaGen };
      }
    }
    const par = Juego.azarEl(cat.pares);
    return { tipo: "elige_palabra", correcta: par.bien, opciones: [par.bien, par.mal], pista: par.pista };
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
    tInicio = Date.now();
    // Ningún ejercicio se repite dentro de la ronda (mientras el banco alcance).
    const vistos = {};
    for (let i = 0; i < TOTAL_RONDA; i++) {
      let ej, firma, intentos = 0;
      do {
        ej = generar(cat);
        firma = (ej.palabraCompleta || ej.correcta || "") + "|" + (ej.palabra || "");
        intentos++;
      } while (vistos[firma] && intentos < 12);
      vistos[firma] = 1;
      cola.push(ej);
    }
    Juego.quitarBotonesFin(document.getElementById("orto-retro"));
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
    if (ej.pista && indice > 0) Juego.tip(ej.pista);          // en la primera ya se dijo la regla
    const opciones = document.getElementById("orto-opciones");
    opciones.innerHTML = "";

    if (ej.tipo === "elige_letra") {
      document.getElementById("orto-pregunta").textContent = ej.palabra.replace("_", "▢");
      ej.opciones.forEach((op) => crearOpcion(op, op === ej.correcta, ej));
    } else if (ej.tipo === "clasificar") {
      document.getElementById("orto-pregunta").textContent = ej.palabra;
      ej.opciones.forEach((op) => crearOpcion(op, op === ej.correcta, ej));   // las etiquetas siempre en el mismo orden
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
      Juego.cronIniciar(Juego.tiempo(1), "orto-timer", tiempoAgotado);
    } else {
      el.classList.add("oculto");
      Juego.cronDetener();
    }
  }

  function marcarCorrecta() {
    document.querySelectorAll("#orto-opciones .opcion").forEach((x) => { if (x.dataset.ok === "1") x.classList.add("correcta"); });
  }

  function tiempoAgotado() {
    const ej = cola[indice];
    document.querySelectorAll("#orto-opciones .opcion").forEach((x) => (x.onclick = null));
    const retro = document.getElementById("orto-retro");
    retro.textContent = "⏰ ¡Se acabó el tiempo! Era: " + (ej.palabraCompleta || ej.correcta);
    retro.className = "retro mal";
    marcarCorrecta();
    Juego.error();
    avanzar(1900);
  }

  function crearOpcion(texto, esCorrecta, ej) {
    const b = document.createElement("button");
    b.className = "opcion";
    b.textContent = texto;
    if (esCorrecta) b.dataset.ok = "1";
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
      // Al completar la letra, se muestra la palabra entera: se ve "encajar".
      if (ej.tipo === "elige_letra") document.getElementById("orto-pregunta").textContent = ej.palabraCompleta;
      retro.textContent = Juego.frasePositiva();
      retro.className = "retro bien";
      Juego.acierto();
      avanzar(1000);
    } else {
      boton.classList.add("incorrecta");
      retro.textContent = "Casi… lo correcto es: " + (ej.palabraCompleta || ej.correcta);
      retro.className = "retro mal";
      Juego.error();
      marcarCorrecta();
      avanzar(1900);
    }
  }

  function avanzar(ms) {
    temporizador = setTimeout(() => {
      temporizador = null;
      indice++;
      if (indice >= cola.length) terminar();
      else mostrar();
    }, ms);
  }

  function terminar() {
    Juego.cronDetener();
    Juego.registrarResultado(PX, { aciertos: aciertos, total: cola.length, ms: Date.now() - tInicio });
    document.getElementById("orto-timer").classList.add("oculto");
    document.getElementById("orto-progreso").style.width = "100%";
    document.getElementById("orto-pregunta").textContent = `¡Terminaste, ${Juego.jugador()}! ${aciertos} de ${cola.length} ⭐`;
    document.getElementById("orto-pista").textContent = "";
    document.getElementById("orto-opciones").innerHTML = Juego.tablaMejoresHTML(PX);
    const retro = document.getElementById("orto-retro");
    retro.textContent = aciertos === cola.length ? "¡Perfecto! 🏆" : "¡Muy bien! ¿Otra ronda para mejorar?";
    retro.className = "retro bien";
    if (aciertos >= cola.length - 1) Juego.granPremio();
    Juego.botonesFin(retro, () => empezar(categoriaActual), volverSelector);
  }

  function volverSelector() {
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    Juego.cronDetener();
    Juego.quitarBotonesFin(document.getElementById("orto-retro"));
    elJuego().classList.add("oculto");
    elSelector().classList.remove("oculto");
    pintarSelector();   // refresca el 🏆
  }

  return { init, volverSelector, pintarSelector, sirve };
})();
window.Ortografia = Ortografia;
