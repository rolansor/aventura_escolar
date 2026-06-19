/* ============================================================
   MODO COPIA / DICTADO  (dos sub-modos)
   - "copiar"   : copia el texto igualito.
   - "corregir" : el texto aparece CON ERRORES y hay que
                  escribirlo bien (corrigiendo tildes, b/v, h…).
   ============================================================ */

const Copia = (function () {
  let parrafoActual = null;
  let modo = "corregir";          // sub-modo por defecto
  let textoConErrores = "";       // versión mostrada en modo corregir
  let indicesMal = [];            // posiciones de palabras con error
  let pistasVisibles = true;      // mostrar los errores marcados arriba

  const elSelector = () => document.getElementById("copia-selector");
  const elJuego = () => document.getElementById("copia-juego");

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
    document.getElementById("copia-pista").onclick = togglePistas;
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
  }

  function empezar(p) {
    parrafoActual = p;
    elSelector().classList.add("oculto");
    elJuego().classList.remove("oculto");
    render();
  }

  function render() {
    document.getElementById("copia-input").value = "";
    document.getElementById("copia-resultado").innerHTML = "";
    const regla = document.getElementById("copia-regla");
    const pistaBtn = document.getElementById("copia-pista");
    const modelo = document.getElementById("copia-modelo");

    if (modo === "corregir") {
      if (parrafoActual.textoMal && parrafoActual.textoMal.trim()) {
        // Versión con errores definida por el adulto
        textoConErrores = parrafoActual.textoMal.trim();
        indicesMal = diferencias(parrafoActual.texto, textoConErrores);
      } else {
        const r = generarErrores(parrafoActual.texto);
        textoConErrores = r.texto;
        indicesMal = r.indices;
      }
      modelo.classList.add("con-errores");
      regla.textContent = `🔍 Este texto tiene ${indicesMal.length} error(es), marcados en rojo arriba. ¡Escríbelo bien! Cuida tildes, mayúsculas, b/v, h, ll/y…`;
      pistaBtn.classList.remove("oculto");
      pistaBtn.textContent = pistasVisibles ? "🙈 Ocultar errores" : "💡 Señalar errores";
    } else {
      modelo.classList.remove("con-errores");
      regla.textContent = "📝 Lee el texto de arriba y cópialo igualito: con tildes, mayúsculas y signos.";
      pistaBtn.classList.add("oculto");
    }
    pintarModelo();
    document.getElementById("copia-input").focus();
    arrancarTimer();
  }

  function arrancarTimer() {
    const c = Juego.config();
    const el = document.getElementById("copia-timer");
    if (c.copiaOn) {
      el.classList.remove("oculto");
      Juego.cronIniciar(c.copiaSeg, "copia-timer", tiempoAgotado);
    } else {
      el.classList.add("oculto");
      Juego.cronDetener();
    }
  }

  function tiempoAgotado() {
    comprobar();
    const res = document.getElementById("copia-resultado");
    res.innerHTML = "<p class='retro mal'>⏰ ¡Se acabó el tiempo! Así quedó tu texto:</p>" + res.innerHTML;
  }

  /* Dibuja el texto de arriba; en modo corregir resalta los errores. */
  function pintarModelo() {
    const modelo = document.getElementById("copia-modelo");
    if (modo === "corregir") {
      if (pistasVisibles) {
        const palabras = textoConErrores.split(/\s+/);
        modelo.innerHTML = palabras
          .map((w, i) => (indicesMal.includes(i) ? `<span class="err-mark">${escapar(w)}</span>` : escapar(w)))
          .join(" ");
      } else {
        modelo.textContent = textoConErrores;
      }
    } else {
      modelo.textContent = parrafoActual.texto;
    }
  }

  function togglePistas() {
    pistasVisibles = !pistasVisibles;
    document.getElementById("copia-pista").textContent =
      pistasVisibles ? "🙈 Ocultar errores" : "💡 Señalar errores";
    pintarModelo();
  }

  /* ---------- Generador de errores ortográficos ---------- */
  const MAP_TILDE = { "á":"a","é":"e","í":"i","ó":"o","ú":"u","Á":"A","É":"E","Í":"I","Ó":"O","Ú":"U" };

  function transformar(palabra) {
    const trucos = [];
    // 1) quitar una tilde
    if (/[áéíóúÁÉÍÓÚ]/.test(palabra)) {
      trucos.push(() => palabra.replace(/[áéíóúÁÉÍÓÚ]/, (c) => MAP_TILDE[c]));
    }
    // 2) cambiar b<->v
    if (/[bv]/i.test(palabra)) {
      trucos.push(() => palabra.replace(/[bv]/i, (c) =>
        c === "b" ? "v" : c === "B" ? "V" : c === "v" ? "b" : "B"));
    }
    // 3) quitar una h
    if (/h/i.test(palabra)) {
      trucos.push(() => palabra.replace(/h/i, ""));
    }
    // 4) z -> s
    if (/z/i.test(palabra)) {
      trucos.push(() => palabra.replace(/z/i, (c) => (c === "Z" ? "S" : "s")));
    }
    // 5) c (suave) -> s
    if (/c[ei]/i.test(palabra)) {
      trucos.push(() => palabra.replace(/c([ei])/i, (m, v) => "s" + v));
    }
    // 6) ll -> y
    if (/ll/i.test(palabra)) {
      trucos.push(() => palabra.replace(/ll/i, "y"));
    }
    if (!trucos.length) return null;
    const nuevo = trucos[Math.floor(Math.random() * trucos.length)]();
    return nuevo !== palabra ? nuevo : null;
  }

  /* Compara dos textos palabra por palabra y devuelve los índices distintos. */
  function diferencias(correcto, malo) {
    const a = correcto.trim().split(/\s+/);
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
    // Primera pasada: error con cierta probabilidad
    palabras.forEach((w, i) => {
      if (Math.random() < 0.4) {
        const t = transformar(w);
        if (t) { salida[i] = t; indices.push(i); }
      }
    });
    // Garantizar un mínimo de 3 errores
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

  /* ---------- Comprobar (siempre contra el texto CORRECTO) ---------- */
  function comprobar() {
    Juego.cronDetener();
    document.getElementById("copia-timer").classList.add("oculto");
    const escrito = document.getElementById("copia-input").value;
    const modelo = parrafoActual.texto;
    const pal1 = modelo.trim().split(/\s+/);
    const pal2 = escrito.trim().split(/\s+/);

    let correctas = 0, html = "";
    const maxLen = Math.max(pal1.length, pal2.length);
    for (let i = 0; i < maxLen; i++) {
      const esperada = pal1[i] || "";
      const recibida = pal2[i] || "";
      if (recibida === esperada && esperada !== "") {
        correctas++;
        html += `<span class="ok">${escapar(recibida)}</span> `;
      } else {
        const muestra = recibida || "▢";
        html += `<span class="err" title="Debía ser: ${escapar(esperada)}">${escapar(muestra)}</span> `;
      }
    }

    const total = pal1.length;
    const porcentaje = Math.round((correctas / total) * 100);
    const accion = modo === "corregir" ? "corregiste" : "copiaste";
    let mensaje = `<p><b>${Juego.jugador()}, ${accion} bien ${correctas} de ${total} palabras (${porcentaje}%).</b> `;
    mensaje += porcentaje === 100
      ? "¡Sin un solo error! 🏆</p>"
      : "Las palabras en rojo todavía tienen alguna diferencia (revisa letras, tildes y mayúsculas).</p>";

    document.getElementById("copia-resultado").innerHTML = mensaje + "<p>" + html + "</p>";

    if (porcentaje === 100) { Juego.granPremio(); Juego.sumarEstrellas(3); }
    else if (porcentaje >= 80) Juego.acierto();
    else Juego.error();
  }

  function escapar(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function volverSelector() {
    Juego.cronDetener();
    const t = document.getElementById("copia-timer");
    if (t) t.classList.add("oculto");
    elJuego().classList.add("oculto");
    elSelector().classList.remove("oculto");
    pintarSelector();
  }

  return { init, comprobar, volverSelector, pintarSelector, generarErrores };
})();
window.Copia = Copia;
