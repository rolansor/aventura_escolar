/* ============================================================
   MODO CORREGIR / DICTADO  — src/modos/copia.js  (global: Copia)
   Dos sub-modos, mucho más manipulativos que "copiar igual":
   - "corregir": el texto aparece CON ERRORES. El niño TOCA la palabra
     que cree mal y se abre un mini-modal con opciones de corrección.
     La dificultad la da el perfil (Juego.nivelIdx()):
       · básico:     los errores vienen marcados y las opciones son obvias.
       · intermedio: errores marcados, opciones más parecidas (difíciles).
       · avanzado:   NADA marcado; el niño BUSCA los errores tocando
                     cualquier palabra y al final pulsa Comprobar.
     Comprobar resalta en verde lo correcto y en rojo lo que falta.
   - "dictado": la voz del navegador (Web Speech API, sin librerías) lee
     el texto y el niño lo escribe; Comprobar compara palabra por palabra.
   El leaderboard ("copia") se mide por palabras correctas / total y tiempo.
   ============================================================ */
const Copia = (function () {
  let parrafoActual = null;
  let modo = "corregir";          // sub-modo por defecto
  let tInicio = 0;

  // Estado del sub-modo "corregir"
  let correcto = [];              // palabras del texto BIEN escrito
  let mostrado = [];              // lo que se muestra (con errores)
  let elegido = [];              // lo que el niño ha dejado en cada palabra
  let errIdx = new Set();        // índices con error inyectado
  let resuelto = false;          // ya se comprobó esta ronda

  const $ = (id) => document.getElementById(id);
  const elSelector = () => $("copia-selector");
  const elJuego = () => $("copia-juego");

  function init() {
    pintarSelector();
    // Interruptor de sub-modo
    document.querySelectorAll(".opcion-modo").forEach((b) => {
      b.onclick = () => {
        document.querySelectorAll(".opcion-modo").forEach((x) => x.classList.remove("activa"));
        b.classList.add("activa");
        modo = b.dataset.cmodo;
        if (parrafoActual) render();
      };
    });
    $("copia-comprobar").onclick = comprobarCorregir;
    $("copia-dictado-comprobar").onclick = comprobarDictado;
    $("copia-escuchar").onclick = () => hablar(parrafoActual ? parrafoActual.texto : "", 0.9);
    $("copia-escuchar-lento").onclick = () => hablar(parrafoActual ? parrafoActual.texto : "", 0.55);
  }

  function pintarSelector() {
    const cont = elSelector();
    cont.innerHTML = "";
    const todos = DATOS.parrafos.concat(Juego.cargar("parrafos_propios", []));
    todos.forEach((p) => {
      const b = document.createElement("button");
      b.className = "chip-categoria";
      const etiqueta = p.propio ? "creado por ti" : (p.nivel || "práctica");
      b.innerHTML = `📜 ${escapar(p.nombre)}<small>${etiqueta}</small>`;
      b.onclick = () => empezar(p);
      cont.appendChild(b);
    });
    Juego.pintarMejores(cont, "copia"); // 🏆 mejores de esta actividad
  }

  function empezar(p) {
    parrafoActual = p;
    elSelector().classList.add("oculto");
    elJuego().classList.remove("oculto");
    render();
  }

  /* ---------- Render según sub-modo ---------- */
  function render() {
    tInicio = Date.now();
    resuelto = false;
    $("copia-resultado").innerHTML = "";
    detenerVoz();
    const enCorregir = modo === "corregir";
    $("copia-corregir").classList.toggle("oculto", !enCorregir);
    $("copia-dictado").classList.toggle("oculto", enCorregir);
    if (enCorregir) prepararCorregir();
    else prepararDictado();
  }

  /* ==================== SUB-MODO CORREGIR ==================== */
  function prepararCorregir() {
    correcto = parrafoActual.texto.trim().split(/\s+/);
    // Errores: definidos por el adulto (textoMal) o generados al vuelo.
    if (parrafoActual.textoMal && parrafoActual.textoMal.trim()) {
      mostrado = parrafoActual.textoMal.trim().split(/\s+/);
      errIdx = new Set(diferencias(parrafoActual.texto, parrafoActual.textoMal));
    } else {
      const r = generarErrores(parrafoActual.texto);
      mostrado = r.texto.split(/\s+/);
      errIdx = new Set(r.indices);
    }
    // Asegurar misma longitud (por si textoMal trae más/menos palabras)
    if (mostrado.length !== correcto.length) {
      const m = correcto.slice();
      errIdx.forEach((i) => { if (mostrado[i] != null) m[i] = mostrado[i]; });
      mostrado = m;
    }
    elegido = mostrado.slice();

    const niv = Juego.nivelIdx();
    const regla = $("copia-regla");
    if (niv >= 2) {
      regla.textContent = "🕵️ Busca las palabras mal escritas (no están marcadas), tócalas para corregirlas y pulsa ✅ Comprobar.";
    } else {
      regla.textContent = `🔍 Las palabras en rojo están mal. Tócalas y elige cómo se escriben bien. (${errIdx.size} por corregir)`;
    }
    pintarParrafoCorregir();
  }

  function pintarParrafoCorregir() {
    const cont = $("copia-parrafo");
    cont.innerHTML = "";
    const niv = Juego.nivelIdx();
    correcto.forEach((w, i) => {
      const esErr = errIdx.has(i);
      const span = document.createElement("span");
      span.className = "palabra";
      span.textContent = elegido[i];
      // En básico/intermedio se marcan los errores; en avanzado no.
      if (niv < 2 && esErr) span.classList.add("err-mark");
      // Clicable: avanzado = todas; básico/intermedio = solo las marcadas
      const clicable = niv >= 2 || esErr;
      if (clicable) {
        span.classList.add("clicable");
        span.onclick = () => abrirModalPalabra(i, span);
      }
      cont.appendChild(span);
      cont.appendChild(document.createTextNode(" "));
    });
  }

  /* Opciones del mini-modal para la palabra i (la correcta + distractores). */
  function opcionesPara(i) {
    const correcta = correcto[i];
    const set = new Set([correcta]);
    // La versión mostrada (si difiere) es un distractor plausible.
    if (mostrado[i] && mostrado[i] !== correcta) set.add(mostrado[i]);
    const objetivo = Juego.nivelIdx() >= 1 ? 4 : 3; // intermedio/avanzado: más opciones
    let intentos = 0;
    while (set.size < objetivo && intentos < 30) {
      const d = transformar(correcta);
      if (d && d !== correcta) set.add(d);
      intentos++;
    }
    // Si faltan (palabra sin "trucos"), añade un distractor obvio (letra doble).
    if (set.size < 3) { const d = dobleLetra(correcta); if (d !== correcta) set.add(d); }
    return Juego.mezclar(Array.from(set));
  }

  function abrirModalPalabra(i, spanEl) {
    cerrarModalPalabra();
    const fondo = document.createElement("div");
    fondo.id = "corr-modal";
    fondo.className = "corr-modal-fondo";
    const caja = document.createElement("div");
    caja.className = "corr-modal";
    caja.innerHTML = '<p class="corr-titulo">¿Cómo se escribe bien?</p>';
    const ops = document.createElement("div");
    ops.className = "corr-ops";
    opcionesPara(i).forEach((op) => {
      const b = document.createElement("button");
      b.className = "corr-op";
      b.textContent = op;
      b.onclick = () => elegirPalabra(i, op, spanEl);
      ops.appendChild(b);
    });
    caja.appendChild(ops);
    fondo.appendChild(caja);
    document.body.appendChild(fondo);
    fondo.addEventListener("click", (e) => { if (e.target === fondo) cerrarModalPalabra(); });
    document.addEventListener("keydown", escModal);
  }
  function escModal(e) { if (e.key === "Escape") cerrarModalPalabra(); }
  function cerrarModalPalabra() {
    const m = $("corr-modal");
    if (m) m.remove();
    document.removeEventListener("keydown", escModal);
  }

  function elegirPalabra(i, op, spanEl) {
    elegido[i] = op;
    cerrarModalPalabra();
    spanEl.textContent = op;
    const niv = Juego.nivelIdx();
    if (niv >= 2) {
      // Avanzado: sin pistas hasta Comprobar; solo marca "tocada".
      spanEl.className = "palabra clicable tocada";
      return;
    }
    // Básico/intermedio: control del error inmediato.
    if (op === correcto[i]) {
      spanEl.className = "palabra ok";
      spanEl.onclick = null;
      if (todosErroresResueltos()) setTimeout(comprobarCorregir, 500);
    } else {
      spanEl.className = "palabra err-mark mal clicable"; // sigue clicable: que reintente
    }
  }

  function todosErroresResueltos() {
    for (const i of errIdx) if (elegido[i] !== correcto[i]) return false;
    return true;
  }

  function comprobarCorregir() {
    if (resuelto) return;
    resuelto = true;
    cerrarModalPalabra();
    const cont = $("copia-parrafo");
    cont.innerHTML = "";
    let ac = 0;
    correcto.forEach((w, i) => {
      const bien = elegido[i] === correcto[i];
      if (bien) ac++;
      const span = document.createElement("span");
      span.className = "palabra " + (bien ? "ok" : "mal");
      span.textContent = elegido[i];
      if (!bien) span.title = "Se escribe: " + w;
      cont.appendChild(span);
      cont.appendChild(document.createTextNode(" "));
    });
    mostrarResultado(ac, correcto.length, "corregiste");
  }

  /* ==================== SUB-MODO DICTADO ==================== */
  function prepararDictado() {
    $("copia-dictado-input").value = "";
    const regla = $("copia-regla");
    if (!window.speechSynthesis) {
      // Sin voz: degradar mostrando el texto para leerlo.
      regla.innerHTML = "🔇 Tu navegador no tiene voz. Lee este texto y escríbelo:<br><b>" +
        escapar(parrafoActual.texto) + "</b>";
      $("copia-escuchar").classList.add("oculto");
      $("copia-escuchar-lento").classList.add("oculto");
    } else {
      regla.textContent = "🎧 Pulsa 🔊 Escuchar, oye con atención y escribe el texto. Puedes repetir las veces que quieras.";
      $("copia-escuchar").classList.remove("oculto");
      $("copia-escuchar-lento").classList.remove("oculto");
      // Lee una vez al entrar (gesto del usuario: venía de un clic en el chip/toggle).
      setTimeout(() => hablar(parrafoActual.texto, 0.9), 350);
    }
    $("copia-dictado-input").focus();
  }

  function comprobarDictado() {
    if (resuelto) return;
    resuelto = true;
    detenerVoz();
    const escrito = $("copia-dictado-input").value;
    const pal1 = correctoDictado();
    const pal2 = escrito.trim().split(/\s+/).filter(Boolean);
    let ac = 0, html = "";
    const maxLen = Math.max(pal1.length, pal2.length);
    for (let i = 0; i < maxLen; i++) {
      const esperada = pal1[i] || "";
      const recibida = pal2[i] || "";
      if (recibida === esperada && esperada !== "") {
        ac++;
        html += `<span class="palabra ok">${escapar(recibida)}</span> `;
      } else {
        html += `<span class="palabra mal" title="Debía ser: ${escapar(esperada)}">${escapar(recibida || "▢")}</span> `;
      }
    }
    $("copia-resultado").insertAdjacentHTML("afterbegin", "<div class='texto-corregir'>" + html + "</div>");
    mostrarResultado(ac, pal1.length, "escribiste");
  }
  function correctoDictado() { return parrafoActual.texto.trim().split(/\s+/); }

  /* ---------- Resultado + leaderboard (común a los dos sub-modos) ---------- */
  function mostrarResultado(ac, total, verbo) {
    const pct = total ? Math.round((ac / total) * 100) : 0;
    Juego.registrarResultado("copia", { aciertos: ac, total: total, ms: Date.now() - tInicio });
    let msg = `<p><b>${Juego.jugador()}, ${verbo} bien ${ac} de ${total} palabras (${pct}%).</b> `;
    msg += pct === 100 ? "¡Sin un solo error! 🏆</p>" : "Las palabras en rojo aún tienen alguna diferencia (letras, tildes o mayúsculas).</p>";
    $("copia-resultado").insertAdjacentHTML("beforeend", msg + Juego.tablaMejoresHTML("copia"));
    if (pct === 100) { Juego.granPremio(); Juego.sumarEstrellas(3); }
    else if (pct >= 80) Juego.acierto();
    else Juego.error();
  }

  /* ---------- Voz (Web Speech API, sin librerías) ---------- */
  let vozCache = null;
  function vozEs() {
    if (vozCache) return vozCache;
    const vs = (window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
    vozCache = vs.find((v) => /^es(-|_)/i.test(v.lang)) ||
      vs.find((v) => /spanish|espa/i.test(v.name)) || null;
    return vozCache;
  }
  function hablar(texto, rate) {
    if (!window.speechSynthesis || !texto) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-ES";
    u.rate = rate || 0.9;
    u.pitch = 1;
    const v = vozEs();
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }
  function detenerVoz() { if (window.speechSynthesis) window.speechSynthesis.cancel(); }
  // Las voces pueden cargar tarde: refrescamos la caché cuando estén listas.
  if (window.speechSynthesis && "onvoiceschanged" in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => { vozCache = null; vozEs(); };
  }

  /* ---------- Generador de errores ortográficos (reutilizado por contenido.js) ---------- */
  const MAP_TILDE = { "á":"a","é":"e","í":"i","ó":"o","ú":"u","Á":"A","É":"E","Í":"I","Ó":"O","Ú":"U" };

  function transformar(palabra) {
    const trucos = [];
    if (/[áéíóúÁÉÍÓÚ]/.test(palabra)) {
      trucos.push(() => palabra.replace(/[áéíóúÁÉÍÓÚ]/, (c) => MAP_TILDE[c]));
    }
    if (/[bv]/i.test(palabra)) {
      trucos.push(() => palabra.replace(/[bv]/i, (c) =>
        c === "b" ? "v" : c === "B" ? "V" : c === "v" ? "b" : "B"));
    }
    if (/h/i.test(palabra)) {
      trucos.push(() => palabra.replace(/h/i, ""));
    }
    if (/z/i.test(palabra)) {
      trucos.push(() => palabra.replace(/z/i, (c) => (c === "Z" ? "S" : "s")));
    }
    if (/c[ei]/i.test(palabra)) {
      trucos.push(() => palabra.replace(/c([ei])/i, (m, v) => "s" + v));
    }
    if (/ll/i.test(palabra)) {
      trucos.push(() => palabra.replace(/ll/i, "y"));
    }
    if (!trucos.length) return null;
    const nuevo = trucos[Math.floor(Math.random() * trucos.length)]();
    return nuevo !== palabra ? nuevo : null;
  }

  // Distractor "obvio" para nivel básico: duplica una letra de la palabra.
  function dobleLetra(palabra) {
    const m = palabra.match(/[a-záéíóúñ]/i);
    if (!m) return palabra + palabra.slice(-1);
    const idx = palabra.indexOf(m[0]);
    return palabra.slice(0, idx + 1) + m[0] + palabra.slice(idx + 1);
  }

  function diferencias(correctoTxt, malo) {
    const a = correctoTxt.trim().split(/\s+/);
    const b = malo.trim().split(/\s+/);
    const idx = [];
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) if ((a[i] || "") !== (b[i] || "")) idx.push(i);
    return idx;
  }

  function generarErrores(texto) {
    const palabras = texto.split(/\s+/);
    const indices = [];
    const salida = palabras.slice();
    palabras.forEach((w, i) => {
      if (Math.random() < 0.4) {
        const t = transformar(w);
        if (t) { salida[i] = t; indices.push(i); }
      }
    });
    let intentos = 0;
    while (indices.length < 3 && intentos < 60) {
      const i = Math.floor(Math.random() * palabras.length);
      if (!indices.includes(i)) {
        const t = transformar(palabras[i]);
        if (t) { salida[i] = t; indices.push(i); }
      }
      intentos++;
    }
    return { texto: salida.join(" "), indices };
  }

  function escapar(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function volverSelector() {
    detenerVoz();
    cerrarModalPalabra();
    elJuego().classList.add("oculto");
    elSelector().classList.remove("oculto");
    pintarSelector();
  }

  return { init, comprobar: comprobarCorregir, volverSelector, pintarSelector, generarErrores };
})();
window.Copia = Copia;
