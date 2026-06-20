/* ============================================================
   EDITOR (para adultos)
   - Crear/guardar secuencias personalizadas.
   - Crear, generar o pegar párrafos para copia/dictado.
   Todo se guarda en localStorage del navegador.
   ============================================================ */

const Editor = (function () {
  function init() {
    // --- Secuencias ---
    document.getElementById("ed-sec-previsualizar").onclick = previsualizarSec;
    document.getElementById("ed-sec-guardar").onclick = guardarSec;
    ["ed-sec-inicio", "ed-sec-operacion", "ed-sec-paso", "ed-sec-largo"].forEach((id) =>
      document.getElementById(id).addEventListener("input", previsualizarSec)
    );
    previsualizarSec();
    listarSecuencias();

    // --- Jugador y avatar ---
    cargarIdentidad();
    document.getElementById("cfg-identidad-guardar").onclick = guardarIdentidad;

    // --- Temporizador ---
    cargarConfigTimer();
    document.getElementById("cfg-timer-guardar").onclick = guardarConfigTimer;

    // --- Palabras de ortografía (editor universal) ---
    poblarCategoriasOrto();
    document.getElementById("ed-orto-cat").onchange = configurarOrto;
    document.getElementById("ed-orto-grupo").onchange = renderBancoOrto;
    document.getElementById("ed-orto-add-palabra").onclick = agregarPalabraOrto;
    document.getElementById("ed-orto-palabra").addEventListener("keydown", (e) => {
      if (e.key === "Enter") agregarPalabraOrto();
    });
    document.getElementById("ed-orto-guardar").onclick = guardarOrtoPar;
    configurarOrto();

    // --- Párrafos ---
    document.getElementById("ed-par-generar").onclick = generarParrafo;
    document.getElementById("ed-par-generar-mal").onclick = generarErroresParrafo;
    document.getElementById("ed-par-guardar").onclick = guardarParrafo;
    listarParrafos();
  }

  function generarErroresParrafo() {
    const texto = document.getElementById("ed-par-texto").value.trim();
    if (!texto) { alert("Primero escribe el texto correcto arriba."); return; }
    if (window.Copia && Copia.generarErrores) {
      document.getElementById("ed-par-mal").value = Copia.generarErrores(texto).texto;
    } else {
      alert("Escribe tú la versión con errores 🙂");
    }
  }

  /* ---------- Jugador y avatar ---------- */
  function cargarIdentidad() {
    document.getElementById("cfg-jugador").value = Juego.cargar("jugador", "Nelson");
    document.getElementById("cfg-avatar").value = Juego.cargar("avatar", "Luna");
    document.getElementById("cfg-genero").value = Juego.cargar("genero", "nina");
  }
  function guardarIdentidad() {
    const j = document.getElementById("cfg-jugador").value.trim() || "Nelson";
    const a = document.getElementById("cfg-avatar").value.trim() || "Luna";
    const g = document.getElementById("cfg-genero").value;
    Juego.guardar("jugador", j);
    Juego.guardar("avatar", a);
    Juego.guardar("genero", g);
    Juego.aplicarIdentidad();           // actualiza título, saludos y reconstruye el avatar
    alert("¡Listo! Jugador: " + j + " · Avatar: " + a);
  }

  /* ---------- Temporizador ---------- */
  function cargarConfigTimer() {
    const c = Juego.cargar("config", {});
    document.getElementById("cfg-timer-on").checked = c.timerOn !== undefined ? c.timerOn : true;
    document.getElementById("cfg-timer-seg").value = c.timerSeg || 30;
    document.getElementById("cfg-copia-on").checked = c.copiaOn !== undefined ? c.copiaOn : true;
    document.getElementById("cfg-copia-min").value = c.copiaMin || 5;
  }
  function guardarConfigTimer() {
    Juego.guardar("config", {
      timerOn: document.getElementById("cfg-timer-on").checked,
      timerSeg: Math.max(5, Math.min(180, Number(document.getElementById("cfg-timer-seg").value) || 30)),
      copiaOn: document.getElementById("cfg-copia-on").checked,
      copiaMin: Math.max(1, Math.min(30, Number(document.getElementById("cfg-copia-min").value) || 5))
    });
    alert("¡Temporizador guardado! ⏱️");
  }

  /* ---------- Editor universal de palabras de ortografía ----------
     Permite, en CUALQUIER categoría: agregar palabras propias, ocultar
     o mostrar las del juego, borrar las propias y (donde aplica) definir
     pares ✅/❌. Las claves de localStorage coinciden con las que lee el
     generador en ortografia.js. */
  function poblarCategoriasOrto() {
    const sel = document.getElementById("ed-orto-cat");
    sel.innerHTML = "";
    DATOS.ortografia.forEach((c) => {
      const o = document.createElement("option");
      o.value = c.id;
      o.textContent = `${c.icono} ${c.nombre}`;
      sel.appendChild(o);
    });
  }

  function catOrtoActual() {
    return DATOS.ortografia.find((c) => c.id === document.getElementById("ed-orto-cat").value);
  }
  // "Grupo" solo aplica a clasificar (clases) y mayúsculas (propios/comunes)
  function grupoOrtoActual(cat) {
    if (cat.estrategia === "clasificar" || cat.estrategia === "mayus")
      return document.getElementById("ed-orto-grupo").value;
    return null;
  }
  // Clave donde se guardan las palabras PROPIAS (las mismas que lee el generador)
  function claveBancoCustom(cat, grupo) {
    if (cat.estrategia === "clasificar") return "orto_clas_" + cat.id + "_" + grupo;
    if (cat.estrategia === "tilde") return "orto_pal_tildes";
    if (cat.estrategia === "mayus") return grupo === "propios" ? "orto_prop_mayusculas" : "orto_com_mayusculas";
    return "orto_pal_" + cat.id; // letra / hache / lly
  }
  // Clave de palabras OCULTAS (debe coincidir con quitarOcultas de ortografia.js)
  function claveOcultasOrto(cat, grupo) {
    if (cat.estrategia === "mayus") return "orto_ocultas_" + cat.id + "_" + grupo;
    if (cat.estrategia === "clasificar") return "orto_ocultas_" + cat.id + "_" + grupo;
    return "orto_ocultas_" + cat.id; // letra / hache / lly / tilde
  }
  // Palabras "de fábrica" (las definidas en datos.js) del grupo actual
  function bancoDefaultOrto(cat, grupo) {
    if (cat.estrategia === "clasificar") return cat.banco[grupo] || [];
    if (cat.estrategia === "tilde") return cat.conTilde || [];
    if (cat.estrategia === "mayus") return grupo === "propios" ? cat.propios : cat.comunes;
    return cat.palabras || []; // letra / hache / lly
  }

  // Al cambiar de categoría: configura el selector de grupo, los pares y las listas
  function configurarOrto() {
    const cat = catOrtoActual();
    const grupoLbl = document.getElementById("ed-orto-grupo-lbl");
    const grupoSel = document.getElementById("ed-orto-grupo");
    const paresZona = document.getElementById("ed-orto-pares-zona");

    if (cat.estrategia === "clasificar") {
      grupoSel.innerHTML = "";
      cat.clases.forEach((c) => {
        const o = document.createElement("option");
        o.value = c; o.textContent = c;
        grupoSel.appendChild(o);
      });
      grupoLbl.classList.remove("oculto");
    } else if (cat.estrategia === "mayus") {
      grupoSel.innerHTML =
        '<option value="propios">Nombres propios (mayúscula)</option>' +
        '<option value="comunes">Cosas comunes (minúscula)</option>';
      grupoLbl.classList.remove("oculto");
    } else {
      grupoLbl.classList.add("oculto");
    }

    // Los pares ✅/❌ no tienen sentido al CLASIFICAR (aguda/diptongo…)
    paresZona.classList.toggle("oculto", cat.estrategia === "clasificar");

    document.getElementById("ed-orto-ayuda").textContent = "💡 " + cat.regla;
    renderBancoOrto();
    listarOrtoPares();
  }

  function agregarPalabraOrto() {
    const cat = catOrtoActual();
    const grupo = grupoOrtoActual(cat);
    const inp = document.getElementById("ed-orto-palabra");
    const palabra = inp.value.trim();
    if (!palabra) { alert("Escribe una palabra para agregar."); return; }
    const claveC = claveBancoCustom(cat, grupo);
    const customs = Juego.cargar(claveC, []);
    const defaults = bancoDefaultOrto(cat, grupo);
    if (customs.includes(palabra) || defaults.includes(palabra)) {
      alert("Esa palabra ya está en esta categoría.");
      return;
    }
    customs.push(palabra);
    Juego.guardar(claveC, customs);
    inp.value = "";
    inp.focus();
    renderBancoOrto();
    refrescarSelectorOrto();
    Juego.acierto();
  }

  function toggleOcultaOrto(claveO, palabra) {
    const lista = Juego.cargar(claveO, []);
    const i = lista.indexOf(palabra);
    if (i >= 0) lista.splice(i, 1); else lista.push(palabra);
    Juego.guardar(claveO, lista);
    renderBancoOrto();
    refrescarSelectorOrto();
  }

  function borrarPalabraOrto(claveC, claveO, palabra) {
    Juego.guardar(claveC, Juego.cargar(claveC, []).filter((w) => w !== palabra));
    Juego.guardar(claveO, Juego.cargar(claveO, []).filter((w) => w !== palabra));
    renderBancoOrto();
    refrescarSelectorOrto();
  }

  function filaPalabraOrto(palabra, propia, oculta, claveC, claveO) {
    const div = document.createElement("div");
    div.className = "item-guardado";
    const estilo = oculta ? ' style="text-decoration:line-through;opacity:.55;"' : "";
    const etiqueta = propia ? ' <small style="color:#25c281;">✏️ tuya</small>' : "";
    div.innerHTML = `<span class="nombre"${estilo}>${escapar(palabra)}</span>${etiqueta}`;

    const acciones = document.createElement("div");
    acciones.style.display = "flex";
    acciones.style.gap = "6px";

    const bOcultar = document.createElement("button");
    bOcultar.className = "borrar";
    bOcultar.style.background = oculta ? "#25c281" : "#9aa6c4";
    bOcultar.textContent = oculta ? "↩️" : "🚫";
    bOcultar.title = oculta ? "Mostrar de nuevo en el juego" : "Ocultar del juego";
    bOcultar.onclick = () => toggleOcultaOrto(claveO, palabra);
    acciones.appendChild(bOcultar);

    if (propia) {
      const bBorrar = document.createElement("button");
      bBorrar.className = "borrar";
      bBorrar.textContent = "🗑️";
      bBorrar.title = "Borrar esta palabra tuya";
      bBorrar.onclick = () => borrarPalabraOrto(claveC, claveO, palabra);
      acciones.appendChild(bBorrar);
    }
    div.appendChild(acciones);
    return div;
  }

  function renderBancoOrto() {
    const cat = catOrtoActual();
    const grupo = grupoOrtoActual(cat);
    const cont = document.getElementById("ed-orto-banco");
    const claveC = claveBancoCustom(cat, grupo);
    const claveO = claveOcultasOrto(cat, grupo);
    const customs = Juego.cargar(claveC, []);
    const ocultas = new Set(Juego.cargar(claveO, []));
    const defaults = bancoDefaultOrto(cat, grupo);

    cont.innerHTML = "";
    const info = document.createElement("small");
    info.style.color = "#3a4266";
    info.textContent = `Tienes ${customs.length} palabra(s) tuya(s) y ${defaults.length} del juego` +
      (ocultas.size ? ` (${ocultas.size} ocultas)` : "") + ".";
    cont.appendChild(info);

    customs.forEach((w) => cont.appendChild(filaPalabraOrto(w, true, ocultas.has(w), claveC, claveO)));
    defaults.forEach((w) => cont.appendChild(filaPalabraOrto(w, false, ocultas.has(w), claveC, claveO)));
  }

  function refrescarSelectorOrto() {
    if (window.Ortografia && Ortografia.pintarSelector) Ortografia.pintarSelector();
  }

  function guardarOrtoPar() {
    const id = document.getElementById("ed-orto-cat").value;
    const bien = document.getElementById("ed-orto-bien").value.trim();
    const mal = document.getElementById("ed-orto-mal").value.trim();
    if (!bien || !mal) { alert("Escribe las dos versiones: ✅ correcta y ❌ incorrecta."); return; }
    if (bien === mal) { alert("La correcta y la incorrecta no pueden ser iguales."); return; }
    const key = "orto_pares_" + id;
    const lista = Juego.cargar(key, []);
    if (lista.some((p) => p.bien === bien && p.mal === mal)) { alert("Ese par ya está agregado."); return; }
    lista.push({ bien: bien, mal: mal });
    Juego.guardar(key, lista);
    document.getElementById("ed-orto-bien").value = "";
    document.getElementById("ed-orto-mal").value = "";
    listarOrtoPares();
    if (window.Ortografia && Ortografia.pintarSelector) Ortografia.pintarSelector();
    Juego.acierto();
  }

  function listarOrtoPares() {
    const id = document.getElementById("ed-orto-cat").value;
    const key = "orto_pares_" + id;
    const cont = document.getElementById("ed-orto-lista");
    const lista = Juego.cargar(key, []);
    cont.innerHTML = lista.length ? "" : "<small>Aún no agregas pares a esta regla.</small>";
    lista.forEach((p, i) => {
      const div = document.createElement("div");
      div.className = "item-guardado";
      div.innerHTML = `<span class="nombre">✅ ${escapar(p.bien)} &nbsp;&nbsp; <small style="color:#ef5350;">❌ ${escapar(p.mal)}</small></span>`;
      const btn = document.createElement("button");
      btn.className = "borrar";
      btn.textContent = "🗑️";
      btn.onclick = () => {
        const l = Juego.cargar(key, []);
        l.splice(i, 1);
        Juego.guardar(key, l);
        listarOrtoPares();
        if (window.Ortografia && Ortografia.pintarSelector) Ortografia.pintarSelector();
      };
      div.appendChild(btn);
      cont.appendChild(div);
    });
  }

  function leerConfigSec() {
    return {
      inicio: Number(document.getElementById("ed-sec-inicio").value) || 0,
      operacion: document.getElementById("ed-sec-operacion").value,
      paso: Number(document.getElementById("ed-sec-paso").value) || 1,
      largo: Math.min(12, Math.max(4, Number(document.getElementById("ed-sec-largo").value) || 6))
    };
  }

  function previsualizarSec() {
    const cfg = leerConfigSec();
    const terminos = Juego.construirSecuencia(cfg);
    document.getElementById("ed-sec-previa").textContent = terminos.join("  ,  ") + "  …";
  }

  function guardarSec() {
    const nombre = document.getElementById("ed-sec-nombre").value.trim();
    if (!nombre) { alert("Ponle un nombre a la secuencia 🙂"); return; }
    const cfg = leerConfigSec();
    const lista = Juego.cargar("secuencias_propias", []);
    lista.push({ id: "s" + Date.now(), nombre, config: cfg });
    Juego.guardar("secuencias_propias", lista);
    document.getElementById("ed-sec-nombre").value = "";
    listarSecuencias();
    if (window.Secuencias) Secuencias.pintarSelector();
    Juego.acierto();
  }

  function listarSecuencias() {
    const cont = document.getElementById("ed-sec-lista");
    const lista = Juego.cargar("secuencias_propias", []);
    cont.innerHTML = lista.length ? "" : "<small>Aún no hay secuencias guardadas.</small>";
    lista.forEach((s) => {
      const ej = Juego.construirSecuencia(s.config).slice(0, 5).join(", ");
      const div = document.createElement("div");
      div.className = "item-guardado";
      div.innerHTML = `<div><span class="nombre">${escapar(s.nombre)}</span>
        <div class="desc">${ej} …</div></div>`;
      const btn = document.createElement("button");
      btn.className = "borrar";
      btn.textContent = "🗑️";
      btn.onclick = () => {
        Juego.guardar("secuencias_propias", lista.filter((x) => x.id !== s.id));
        listarSecuencias();
        if (window.Secuencias) Secuencias.pintarSelector();
      };
      div.appendChild(btn);
      cont.appendChild(div);
    });
  }

  /* ---------- Párrafos ---------- */
  function generarParrafo() {
    const g = DATOS.frasesGenerador;
    let texto = "";
    const nFrases = 3;
    for (let i = 0; i < nFrases; i++) {
      const s = elegir(g.sujetos), v = elegir(g.verbos), l = elegir(g.lugares), f = elegir(g.finales);
      texto += `${s} ${v} ${l} ${f} `;
    }
    document.getElementById("ed-par-texto").value = texto.trim();
    if (!document.getElementById("ed-par-nombre").value.trim()) {
      document.getElementById("ed-par-nombre").value = "Párrafo generado";
    }
  }

  function guardarParrafo() {
    const nombre = document.getElementById("ed-par-nombre").value.trim();
    const texto = document.getElementById("ed-par-texto").value.trim();
    const textoMal = document.getElementById("ed-par-mal").value.trim();
    if (!nombre || !texto) { alert("Escribe un nombre y un texto 🙂"); return; }
    const lista = Juego.cargar("parrafos_propios", []);
    const item = { id: "p" + Date.now(), nombre, texto, propio: true };
    if (textoMal) item.textoMal = textoMal;     // versión con errores definida por el adulto
    lista.push(item);
    Juego.guardar("parrafos_propios", lista);
    document.getElementById("ed-par-nombre").value = "";
    document.getElementById("ed-par-texto").value = "";
    document.getElementById("ed-par-mal").value = "";
    listarParrafos();
    if (window.Copia) Copia.pintarSelector();
    Juego.acierto();
  }

  function listarParrafos() {
    const cont = document.getElementById("ed-par-lista");
    const lista = Juego.cargar("parrafos_propios", []);
    cont.innerHTML = lista.length ? "" : "<small>Aún no hay párrafos guardados.</small>";
    lista.forEach((p) => {
      const div = document.createElement("div");
      div.className = "item-guardado";
      const etiqueta = p.textoMal ? ' <small style="color:#25c281;">✏️ con errores propios</small>' : "";
      div.innerHTML = `<div><span class="nombre">${escapar(p.nombre)}</span>${etiqueta}
        <div class="desc">${escapar(p.texto.slice(0, 60))}…</div></div>`;
      const btn = document.createElement("button");
      btn.className = "borrar";
      btn.textContent = "🗑️";
      btn.onclick = () => {
        Juego.guardar("parrafos_propios", lista.filter((x) => x.id !== p.id));
        listarParrafos();
        if (window.Copia) Copia.pintarSelector();
      };
      div.appendChild(btn);
      cont.appendChild(div);
    });
  }

  function elegir(arr) { return arr[Juego.azar(0, arr.length - 1)]; }
  function escapar(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  return { init };
})();
