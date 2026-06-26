/* ============================================================
   SELECTOR DE PERFILES — src/core/perfiles.js  (global window.Perfiles)
   Solo en index.html. Muestra una tarjeta por niño guardado (cada
   uno con su nombre, género, nivel y progreso propios) + una tarjeta
   "➕ Nuevo perfil". Al elegir un perfil se entra al menú; un chip en
   la barra superior permite volver aquí para cambiar de perfil.
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
    let nivel = editar && NIVELES.some((n) => n.id === existente.nivel) ? existente.nivel : "basico";
    const act = (cond) => (cond ? " activa" : "");
    const fondo = document.createElement("div");
    fondo.id = "modal-perfil"; fondo.className = "modal-fondo";
    fondo.innerHTML =
      '<div class="modal-caja" role="dialog" aria-modal="true">' +
        '<div class="modal-emoji">' + (editar ? "✏️" : "🌟") + "</div>" +
        '<h3 class="modal-titulo">' + (editar ? "Editar perfil" : "Nuevo perfil") + "</h3>" +
        '<input type="text" id="perfil-nombre" class="modal-input" maxlength="16" placeholder="Tu nombre" autocomplete="off" value="' + (editar ? esc(existente.nombre) : "") + '" />' +
        '<p class="modal-texto">¿Niño o niña?</p>' +
        '<div class="perfil-opciones" id="perfil-genero">' +
          '<button type="button" class="perfil-op' + act(genero === "nina") + '" data-g="nina">👧 Niña</button>' +
          '<button type="button" class="perfil-op' + act(genero === "nino") + '" data-g="nino">👦 Niño</button>' +
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

    // Grupos de botones tipo "elige uno" (género y nivel)
    grupo("perfil-genero", "g", (v) => { genero = v; });
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
    function guardar() {
      const nombre = input.value.trim();
      if (!nombre) {
        error.textContent = "Escribe tu nombre 🙂";
        caja.classList.remove("temblar"); void caja.offsetWidth; caja.classList.add("temblar");
        input.focus(); return;
      }
      if (editar) {
        Juego.actualizarPerfil(existente.id, { nombre: nombre, genero: genero, nivel: nivel });
        cerrar();
        actualizarChip();
        pintarSelector();
      } else {
        const p = Juego.crearPerfil({ nombre: nombre, genero: genero, nivel: nivel });
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
