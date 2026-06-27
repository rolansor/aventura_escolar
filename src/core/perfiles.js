/* ============================================================
   SELECTOR DE PERFILES — src/core/perfiles.js  (global window.Perfiles)
   Solo en index.html. Muestra una tarjeta por niño guardado (cada uno
   con su nombre, sexo, mascota, nivel y progreso propios) + una tarjeta
   "➕ Nuevo perfil". El formulario distingue el SEXO DEL PARTICIPANTE
   (emoji 👧/👦 de su tarjeta) del SEXO DE LA MASCOTA (figura de Perchita),
   y valida los nombres (solo letras, sin groserías — ver validarNombre).
   Al elegir un perfil se entra al menú; un chip en la barra superior
   permite volver aquí para cambiar de perfil.
   La identidad y el nivel se guardan en el PERFIL (ver src/core/juego.js).
   ============================================================ */
const Perfiles = (function () {
  const GENEROS = { nina: "👧", nino: "👦" };
  const NIVELES = [
    { id: "basico",     etiqueta: "🟢 Básico" },
    { id: "intermedio", etiqueta: "🟡 Intermedio" },
    { id: "avanzado",   etiqueta: "🔴 Avanzado" }
  ];
  function emojiGenero(g) { return GENEROS[g] || GENEROS.nina; }
  function etiquetaNivel(id) { const n = NIVELES.find((x) => x.id === id); return n ? n.etiqueta : NIVELES[0].etiqueta; }
  function esc(s) { const d = document.createElement("div"); d.textContent = String(s == null ? "" : s); return d.innerHTML; }

  /* ---------- Validador de nombres (niño y mascota) ----------
     Solo letras (con tildes/ñ) y espacios; bloquea números, símbolos, emojis y
     palabras soeces. Lo usan MUCHOS niños, así que el filtro es deliberadamente
     estricto: revisa por palabra exacta y, "pegado" (sin espacios y con leet
     0/1/3/4/5/7/@/$ deshecho), por subcadena de las groserías más fuertes.
     Es heurístico: prioriza atajar troleos, aun a costa de algún falso positivo. */
  // Soeces revisadas como PALABRA exacta (incluye cortas/ambiguas que como subcadena darían falsos positivos).
  const SOECES_PALABRA = new Set([
    "puta","puto","putas","putos","puta madre","zorra","zorras","perra","perras","cabron","cabrona","cabrones",
    "pendejo","pendeja","pendejos","idiota","imbecil","estupido","estupida","tarado","tarada","menso","mensa",
    "mierda","mrd","caca","culo","culos","cula","ano","anos","teta","tetas","pene","penes","pito","pitos","verga",
    "vergas","pija","pijas","polla","pollas","concha","conchas","chucha","chuchas","coño","cono","pinga","poronga",
    "sexo","sexi","sexy","gay","marica","maricas","maricon","maricones","joto","puñeta","puneta","cojones","huevon",
    "huevona","huevones","guevon","pelotudo","pelotuda","boludo","boluda","forro","trolo","chingar","chingada",
    "verguero","conchudo","conchuda","malparido","malparida","gonorrea","perro","perros","baboso","babosa","tonto","tonta"
  ]);
  // Soeces revisadas también por SUBCADENA en la versión pegada (solo inequívocas/largas, raras dentro de un nombre real).
  const SOECES_FUERTE = [
    "hijueputa","hijodeputa","hijaputa","hijueperra","conchatumadre","conchadetumadre","chuchatumadre","chuchamadre",
    "malparido","maricon","gonorrea","reconchatu","mecago","metelo","verguero","culiao","culiado","culeado","culero",
    "pendejo","cabron","mierda","carajo","chucha","verga","pinga","follar","folla","coger","chingar","masturba","pornografia","porno"
  ];
  function normaNombre(s) { return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function deshacerLeet(s) { return s.replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t").replace(/@/g, "a").replace(/\$/g, "s"); }
  function tieneSoez(valor) {
    const base = deshacerLeet(normaNombre(valor));
    const tokens = base.split(/\s+/).filter(Boolean);
    const colapsa = (x) => x.replace(/(.)\1+/g, "$1"); // "puuuta" -> "puta"
    for (const t of tokens) { if (SOECES_PALABRA.has(t) || SOECES_PALABRA.has(colapsa(t))) return true; }
    const pegado = base.replace(/[^a-z]/g, "");
    const pegadoCol = colapsa(pegado);
    for (const mala of SOECES_FUERTE) { if (pegado.includes(mala) || pegadoCol.includes(mala)) return true; }
    return false;
  }
  // Devuelve { ok, valor } o { ok:false, error }. `cosa` personaliza el mensaje.
  function validarNombre(raw, cosa) {
    const quien = cosa || "nombre";
    const v = String(raw == null ? "" : raw).trim().replace(/\s+/g, " ");
    if (v.length < 2) return { ok: false, error: "Escribe un " + quien + " (mínimo 2 letras) 🙂" };
    if (v.length > 16) return { ok: false, error: "Ese " + quien + " es muy largo (máx. 16) ✂️" };
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/.test(v)) return { ok: false, error: "Usa solo letras, sin números ni símbolos ✍️" };
    if (tieneSoez(v)) return { ok: false, error: "Ese " + quien + " no se permite 🙈 Pon uno de verdad." };
    return { ok: true, valor: v };
  }

  /* ---------- Chip de perfil en la barra ---------- */
  function init() {
    const chip = document.getElementById("btn-perfil");
    if (chip) chip.onclick = abrir;
    actualizarChip();
  }
  function actualizarChip() {
    const chip = document.getElementById("btn-perfil");
    if (!chip) return;
    const p = Juego.perfilActivo();
    if (p) { chip.innerHTML = emojiGenero(p.genero) + " " + esc(p.nombre); chip.classList.remove("oculto"); }
    else chip.classList.add("oculto");
  }

  /* ---------- Mostrar la pantalla del selector ---------- */
  function abrir() {
    pintarSelector();
    document.querySelectorAll(".pantalla").forEach((p) => p.classList.remove("activa"));
    const el = document.getElementById("pantalla-perfiles");
    if (el) el.classList.add("activa");
    const volver = document.getElementById("btn-volver-global");
    if (volver) volver.classList.add("oculto");
  }

  function entrar(id) {
    Juego.seleccionarPerfil(id);
    actualizarChip();
    if (window.Menu) Menu.init();
  }

  function pintarSelector() {
    const cont = document.getElementById("perfiles-lista");
    if (!cont) return;
    cont.innerHTML = "";
    Juego.perfiles().forEach((p) => {
      const b = document.createElement("button");
      b.className = "tarjeta tarjeta-perfil";
      b.innerHTML =
        '<span class="perfil-editar" title="Editar perfil">✏️</span>' +
        '<span class="perfil-borrar" title="Borrar perfil">🗑️</span>' +
        '<span class="emoji-grande">' + emojiGenero(p.genero) + "</span>" +
        '<span class="titulo-tarjeta">' + esc(p.nombre) + "</span>" +
        '<span class="desc-tarjeta">' + etiquetaNivel(p.nivel) + "</span>";
      b.onclick = () => entrar(p.id);
      b.querySelector(".perfil-editar").onclick = (e) => { e.stopPropagation(); abrirForm(p); };
      b.querySelector(".perfil-borrar").onclick = (e) => { e.stopPropagation(); borrar(p); };
      cont.appendChild(b);
    });
    const nuevo = document.createElement("button");
    nuevo.className = "tarjeta tarjeta-nuevo-perfil";
    nuevo.innerHTML =
      '<span class="emoji-grande">➕</span>' +
      '<span class="titulo-tarjeta">Nuevo perfil</span>' +
      '<span class="desc-tarjeta">Crea tu aventura</span>';
    nuevo.onclick = abrirForm;
    cont.appendChild(nuevo);
  }

  function borrar(p) {
    if (!window.confirm("¿Borrar el perfil de " + p.nombre + "? Se pierde su progreso.")) return;
    Juego.borrarPerfil(p.id);
    actualizarChip();
    pintarSelector();
  }

  /* ---------- Modal "Nuevo perfil" / "Editar perfil" ----------
     Si recibe un perfil existente, edita (precarga datos y guarda con
     actualizarPerfil); si no, crea uno nuevo. */
  function abrirForm(existente) {
    if (document.getElementById("modal-perfil")) return;
    const editar = !!(existente && existente.id);
    let genero = editar ? (existente.genero === "nino" ? "nino" : "nina") : "nina";
    let generoMascota = editar ? ((existente.generoMascota || existente.genero) === "nino" ? "nino" : "nina") : "nina";
    let nivel = editar && NIVELES.some((n) => n.id === existente.nivel) ? existente.nivel : "basico";
    const act = (cond) => (cond ? " activa" : "");
    const fondo = document.createElement("div");
    fondo.id = "modal-perfil"; fondo.className = "modal-fondo";
    fondo.innerHTML =
      '<div class="modal-caja" role="dialog" aria-modal="true">' +
        '<div class="modal-emoji">' + (editar ? "✏️" : "🌟") + "</div>" +
        '<h3 class="modal-titulo">' + (editar ? "Editar perfil" : "Nuevo perfil") + "</h3>" +
        '<p class="modal-texto">¿Cómo te llamas?</p>' +
        '<input type="text" id="perfil-nombre" class="modal-input" maxlength="16" placeholder="Tu nombre" autocomplete="off" value="' + (editar ? esc(existente.nombre) : "") + '" />' +
        '<p class="modal-texto">¿Eres niña o niño?</p>' +
        '<div class="perfil-opciones" id="perfil-genero">' +
          '<button type="button" class="perfil-op' + act(genero === "nina") + '" data-g="nina">👧 Niña</button>' +
          '<button type="button" class="perfil-op' + act(genero === "nino") + '" data-g="nino">👦 Niño</button>' +
        '</div>' +
        '<p class="modal-texto">¿Cómo se llama tu mascota? 🐾</p>' +
        '<input type="text" id="perfil-mascota" class="modal-input" maxlength="16" placeholder="Perchita" autocomplete="off" value="' + esc(editar ? (existente.avatar || "Perchita") : "Perchita") + '" />' +
        '<p class="modal-texto">¿Tu mascota es niña o niño? 🐾</p>' +
        '<div class="perfil-opciones" id="perfil-genero-mascota">' +
          '<button type="button" class="perfil-op' + act(generoMascota === "nina") + '" data-gm="nina">👧 Niña</button>' +
          '<button type="button" class="perfil-op' + act(generoMascota === "nino") + '" data-gm="nino">👦 Niño</button>' +
        '</div>' +
        '<p class="modal-texto">Nivel de dificultad</p>' +
        '<div class="perfil-opciones" id="perfil-nivel">' +
          '<button type="button" class="perfil-op' + act(nivel === "basico") + '" data-n="basico">🟢 Básico</button>' +
          '<button type="button" class="perfil-op' + act(nivel === "intermedio") + '" data-n="intermedio">🟡 Intermedio</button>' +
          '<button type="button" class="perfil-op' + act(nivel === "avanzado") + '" data-n="avanzado">🔴 Avanzado</button>' +
        '</div>' +
        '<p class="modal-error" id="perfil-error"></p>' +
        '<div class="modal-botones">' +
          '<button class="boton-secundario" id="perfil-cancelar">Cancelar</button>' +
          '<button class="boton-grande" id="perfil-crear">' + (editar ? "Guardar" : "¡Crear!") + "</button>" +
        '</div>' +
      '</div>';
    document.body.appendChild(fondo);

    const input = document.getElementById("perfil-nombre");
    const error = document.getElementById("perfil-error");
    const caja = fondo.querySelector(".modal-caja");
    setTimeout(() => { input.focus(); input.select(); }, 40);

    // Grupos de botones tipo "elige uno" (sexo del niño, sexo de la mascota y nivel)
    grupo("perfil-genero", "g", (v) => { genero = v; });
    grupo("perfil-genero-mascota", "gm", (v) => { generoMascota = v; });
    grupo("perfil-nivel", "n", (v) => { nivel = v; });
    function grupo(id, attr, set) {
      const cont = document.getElementById(id);
      cont.querySelectorAll(".perfil-op").forEach((b) => {
        b.onclick = () => {
          cont.querySelectorAll(".perfil-op").forEach((x) => x.classList.remove("activa"));
          b.classList.add("activa");
          set(b.getAttribute("data-" + attr));
        };
      });
    }

    function cerrar() { fondo.remove(); }
    function mostrarError(msg, foco) {
      error.textContent = msg;
      caja.classList.remove("temblar"); void caja.offsetWidth; caja.classList.add("temblar");
      if (foco) foco.focus();
    }
    function guardar() {
      const vN = validarNombre(input.value, "nombre");
      if (!vN.ok) { mostrarError(vN.error, input); return; }
      const inMasc = document.getElementById("perfil-mascota");
      let nombreMascota = "Perchita";
      if (inMasc.value.trim()) {
        const vM = validarNombre(inMasc.value, "nombre de mascota");
        if (!vM.ok) { mostrarError(vM.error, inMasc); return; }
        nombreMascota = vM.valor;
      }
      const datos = { nombre: vN.valor, genero: genero, avatar: nombreMascota, generoMascota: generoMascota, nivel: nivel };
      if (editar) {
        Juego.actualizarPerfil(existente.id, datos);
        cerrar();
        actualizarChip();
        pintarSelector();
      } else {
        const p = Juego.crearPerfil(datos);
        cerrar();
        entrar(p.id);
      }
    }
    document.getElementById("perfil-crear").onclick = guardar;
    document.getElementById("perfil-cancelar").onclick = cerrar;
    fondo.addEventListener("click", (e) => { if (e.target === fondo) cerrar(); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") guardar(); else if (e.key === "Escape") cerrar(); });
  }

  return { init, abrir, actualizarChip };
})();
window.Perfiles = Perfiles;
