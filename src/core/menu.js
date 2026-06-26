/* ============================================================
   MENÚ DE MATERIAS — src/core/menu.js  (solo en index.html)
   Pinta las materias desde DATOS.materias y, al elegir una
   actividad, NAVEGA a su página (paginas/<modo>.html).
   El índice tiene dos sub-pantallas: el menú y el submenú de
   materia (se alternan); las actividades son enlaces a otras
   páginas.
   ============================================================ */
const Menu = (function () {
  // modo -> página
  const PAGINA = {
    ortografia: "paginas/ortografia.html",
    copia:      "paginas/copia.html",
    secuencias: "paginas/secuencias.html",
    tablas:     "paginas/tablas.html",
    aritmetica: "paginas/aritmetica.html",
    terminos:   "paginas/terminos.html",
    problemas:  "paginas/problemas.html",
    valor:      "paginas/valorposicional.html",
    multiplicacion: "paginas/multiplicacion.html",
    division:   "paginas/division.html",
    comparar:   "paginas/comparar.html",
    redondeo:   "paginas/redondeo.html",
    numeros:    "paginas/numeros.html",
    dinero:     "paginas/dinero.html",
    medidas:    "paginas/medidas.html",
    hora:       "paginas/hora.html",
    fracciones: "paginas/fracciones.html",
    senala:     "paginas/senala.html",
    plantas:    "paginas/plantas.html",
    cuerpo:     "paginas/cuerpo.html",
    animales:   "paginas/animales.html",
    invertebrados: "paginas/invertebrados.html",
    cicloagua:  "paginas/cicloagua.html",
    materia:    "paginas/materia.html",
    ambiente:   "paginas/ambiente.html",
    mapas:      "paginas/mapas.html",
    cantones:   "paginas/cantones.html",
    quiz:       "paginas/quiz.html",
    donde:      "paginas/donde.html",
    editor:     "paginas/editor.html",
    contenido:  "paginas/contenido.html"
  };

  function init() {
    pintarMenu();
    // Si volvemos desde una actividad (?materia=lengua), abre ese submenú directamente.
    const mat = new URLSearchParams(location.search).get("materia");
    if (mat && (DATOS.materias || []).some(function (m) { return m.id === mat; })) irAMateria(mat);
    else mostrar("pantalla-menu");
    // El botón "Volver" del menú regresa del submenú de materia al menú.
    const bv = document.getElementById("btn-volver-global");
    if (bv) bv.onclick = function () { mostrar("pantalla-menu"); };
  }

  function crearTarjeta(icono, titulo, desc, onClick) {
    const b = document.createElement("button");
    b.className = "tarjeta";
    b.innerHTML =
      '<span class="emoji-grande">' + icono + "</span>" +
      '<span class="titulo-tarjeta">' + titulo + "</span>" +
      '<span class="desc-tarjeta">' + desc + "</span>";
    b.onclick = onClick;
    return b;
  }

  function pintarMenu() {
    const cont = document.getElementById("tarjetas-menu");
    if (!cont) return;
    cont.innerHTML = "";
    (DATOS.materias || []).forEach((m) => {
      cont.appendChild(crearTarjeta(m.icono, m.nombre, m.desc, () => irAMateria(m.id)));
    });
    cont.appendChild(crearTarjeta("⚙️", "Ajustes", "Temporizador y progreso",
      () => pedirClave(PAGINA.editor)));
    cont.appendChild(crearTarjeta("📚", "Banco de contenido", "Palabras, secuencias y párrafos",
      () => pedirClave(PAGINA.contenido)));
  }

  // Modal de clave ANTES de abrir el editor (no se puede saltar abriendo la página
  // directamente: editor.html sin la clave válida rebota al menú).
  const CLAVE = "24861793";
  function pedirClave(destino) {
    destino = destino || PAGINA.editor;
    if (document.getElementById("modal-clave")) return;
    const fondo = document.createElement("div");
    fondo.id = "modal-clave"; fondo.className = "modal-fondo";
    fondo.innerHTML =
      '<div class="modal-caja" role="dialog" aria-modal="true">' +
        '<div class="modal-emoji">🔒</div>' +
        '<h3 class="modal-titulo">Zona de adultos</h3>' +
        '<p class="modal-texto">Escribe la clave para entrar a la <b>zona de adultos</b>.</p>' +
        '<input type="password" inputmode="numeric" id="modal-input" class="modal-input" autocomplete="off" placeholder="Clave" />' +
        '<p class="modal-error" id="modal-error"></p>' +
        '<div class="modal-botones">' +
          '<button class="boton-secundario" id="modal-cancelar">Cancelar</button>' +
          '<button class="boton-grande" id="modal-ok">Entrar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(fondo);
    const input = document.getElementById("modal-input");
    const error = document.getElementById("modal-error");
    const caja = fondo.querySelector(".modal-caja");
    setTimeout(() => input.focus(), 40);

    function cerrar() { fondo.remove(); }
    function intentar() {
      if (input.value.trim() === CLAVE) {
        try { sessionStorage.setItem("ads_editor_ok", "1"); } catch (e) {}
        location.href = destino;
      } else {
        error.textContent = "Clave incorrecta 🙈";
        caja.classList.remove("temblar"); void caja.offsetWidth; caja.classList.add("temblar");
        input.value = ""; input.focus();
      }
    }
    document.getElementById("modal-ok").onclick = intentar;
    document.getElementById("modal-cancelar").onclick = cerrar;
    fondo.addEventListener("click", (e) => { if (e.target === fondo) cerrar(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") intentar();
      else if (e.key === "Escape") cerrar();
    });
  }

  function irAMateria(id) {
    const m = (DATOS.materias || []).find((x) => x.id === id);
    if (!m) return;
    document.getElementById("materia-titulo").textContent = m.icono + " " + m.nombre;
    const cont = document.getElementById("materia-actividades");
    const sub = document.getElementById("materia-sub");
    cont.innerHTML = "";
    if (!m.actividades || !m.actividades.length) {
      sub.textContent = m.proximamente || "¡Muy pronto habrá actividades aquí!";
    } else {
      sub.textContent = "Elige una actividad";
      m.actividades.forEach((a) => {
        cont.appendChild(crearTarjeta(a.icono, a.nombre, a.desc, () => {
          const p = PAGINA[a.modo];
          if (p) location.href = p;
        }));
      });
    }
    mostrar("pantalla-materia");
  }

  // Alterna entre las dos sub-pantallas del índice y el botón Volver.
  function mostrar(id) {
    document.querySelectorAll(".pantalla").forEach((p) => p.classList.remove("activa"));
    const el = document.getElementById(id);
    if (el) el.classList.add("activa");
    const volver = document.getElementById("btn-volver-global");
    if (volver) volver.classList.toggle("oculto", id === "pantalla-menu");
  }

  return { init };
})();
window.Menu = Menu;
