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
    valor:      "paginas/valorposicional.html",
    mapas:      "paginas/mapas.html",
    cantones:   "paginas/cantones.html",
    quiz:       "paginas/quiz.html",
    donde:      "paginas/donde.html",
    editor:     "paginas/editor.html"
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
    cont.appendChild(crearTarjeta("⚙️", "Crear y Configurar", "Para mamá, papá o profe",
      () => { location.href = PAGINA.editor; }));
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
