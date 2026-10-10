/* ============================================================
   CURRÍCULO — src/core/curriculo.js  (global window.Curriculo)
   Solo en index.html. Lee DATOS.curriculo (data/curriculo.json):
   los GRADOS, los TRIMESTRES y el PLAN de cada grado (qué
   actividades de cada materia se estudian en cada trimestre).
   Un grado sin `plan` está "en construcción".
   Las actividades se definen una sola vez en DATOS.materias (el
   catálogo); el plan solo las reparte, así una misma actividad
   puede repetirse en varios trimestres.
   También pinta la "ayudita": el MAPA CONCEPTUAL
   grado → trimestres → materias → actividades (abrirMapa).
   ============================================================ */
const Curriculo = (function () {
  // Un color por materia (borde, fondo), en el orden del catálogo: la misma materia
  // se reconoce de un vistazo en los tres trimestres.
  const COLORES = [
    ["#f06292", "#ffe3ee"], ["#2e6cf6", "#e1ebff"], ["#f59e0b", "#fff0d6"],
    ["#25c281", "#dcf7e8"], ["#8a5cf6", "#ece4ff"], ["#06b6d4", "#d8f5f9"]
  ];
  const esc = (s) => Juego.esc(s);
  const igual = (a, b) => String(a) === String(b);

  function datos() { return DATOS.curriculo || {}; }
  function grados() { return datos().grados || []; }
  function trimestres() { return datos().trimestres || []; }
  function grado(id) { return grados().find((g) => igual(g.id, id)) || null; }
  function trimestre(id) { return trimestres().find((t) => igual(t.id, id)) || null; }
  function disponible(g) { return !!(g && g.plan); }
  function porDefecto() { return grados().find(disponible) || null; }

  // Materias de un grado en un trimestre: las del catálogo, cada una solo con las
  // actividades de su plan (en el orden del plan). Las que no tocan no salen.
  function materias(gradoId, triId) {
    const g = grado(gradoId);
    const plan = (g && g.plan && g.plan[String(triId)]) || {};
    return (DATOS.materias || []).map((m) => {
      const acts = (plan[m.id] || [])
        .map((modo) => (m.actividades || []).find((a) => a.modo === modo))
        .filter(Boolean);
      return Object.assign({}, m, { actividades: acts });
    }).filter((m) => m.actividades.length);
  }

  // En cuántos trimestres del grado aparece una actividad (para marcar las que se repiten).
  function veces(g, materiaId, modo) {
    return trimestres().filter((t) => (((g.plan || {})[String(t.id)] || {})[materiaId] || []).indexOf(modo) >= 0).length;
  }

  /* ---------- Mapa conceptual ----------
     Una columna por trimestre y una fila por materia (las filas quedan alineadas
     entre columnas: así se ve qué materia se repite y cuál no). Tocar una materia
     abre sus actividades en los tres trimestres a la vez; tocar un trimestre o una
     actividad lleva allá: alIr(trimestreId, materiaId?, modo?).                  */
  function abrirMapa(gradoId, alIr) {
    const g = grado(gradoId);
    if (!disponible(g) || document.getElementById("modal-mapa")) return;
    const tris = trimestres();
    const porTri = tris.map((t) => materias(g.id, t.id));
    const catalogo = DATOS.materias || [];
    const filas = catalogo.filter((m) => porTri.some((lista) => lista.some((x) => x.id === m.id)));

    let celdas = "";
    tris.forEach((t, i) => {
      const lista = porTri[i];
      const borde = (i === 0 ? " primera" : "") + (i === tris.length - 1 ? " ultima" : "");
      if (!lista.length) {   // trimestre todavía sin plan: una sola casilla "en construcción"
        celdas +=
          '<div class="cmapa-cabeza' + borde + '">' +
            '<div class="cmapa-tri en-obra"><span class="cmapa-tri-nom">' + t.icono + " " + esc(t.nombre) + "</span>" +
              "<small>🚧 En construcción</small></div>" +
            '<div class="cmapa-pie"></div>' +
          "</div>" +
          '<div class="cmapa-celda cmapa-obra final" style="grid-row:span ' + filas.length + '">' +
            '<div class="cmapa-nodo">🚧 ¡Muy pronto!</div></div>';
        return;
      }
      const nAct = lista.reduce((s, m) => s + m.actividades.length, 0);
      celdas +=
        '<div class="cmapa-cabeza' + borde + '">' +
          '<button type="button" class="cmapa-tri" data-tri="' + esc(t.id) + '" title="Entrar al ' + esc(t.nombre.toLowerCase()) + '">' +
            '<span class="cmapa-tri-nom">' + t.icono + " " + esc(t.nombre) + "</span>" +
            "<small>" + lista.length + (lista.length === 1 ? " materia" : " materias") + " · " + nAct + " actividades</small>" +
          "</button>" +
          '<div class="cmapa-pie"><span class="cmapa-enlace">se estudia</span></div>' +
        "</div>";
      filas.forEach((m, f) => {
        const color = COLORES[catalogo.indexOf(m) % COLORES.length];
        const estilo = ' style="--c:' + color[0] + ";--f:" + color[1] + '"';
        const final = f === filas.length - 1 ? " final" : "";
        const mia = lista.find((x) => x.id === m.id);
        if (!mia) {
          celdas +=
            '<div class="cmapa-celda cmapa-vacia' + final + '" data-m="' + esc(m.id) + '"' + estilo + ">" +
              '<div class="cmapa-nodo" title="No se estudia en este trimestre">' +
                "<span>" + m.icono + '</span><span class="cmapa-nom">' + esc(m.nombre) + '</span><span class="cmapa-n">💤</span>' +
              "</div></div>";
          return;
        }
        celdas +=
          '<div class="cmapa-celda' + final + '" data-m="' + esc(m.id) + '"' + estilo + ">" +
            '<button type="button" class="cmapa-nodo" aria-expanded="false">' +
              "<span>" + m.icono + '</span><span class="cmapa-nom">' + esc(m.nombre) + "</span>" +
              '<span class="cmapa-n">' + mia.actividades.length + "</span>" +
            "</button>" +
            '<div class="cmapa-acts">' +
              mia.actividades.map((a) => {
                const repite = veces(g, m.id, a.modo) > 1;
                return '<button type="button" class="cmapa-act" data-tri="' + esc(t.id) + '" data-modo="' + esc(a.modo) + '"' +
                  ' title="' + (repite ? "Se repite en otro trimestre" : "Solo en este trimestre") + '">' +
                  a.icono + " " + esc(a.nombre) + ' <span class="cmapa-marca">' + (repite ? "🔁" : "⭐") + "</span></button>";
              }).join("") +
            "</div>" +
          "</div>";
      });
    });

    const fondo = document.createElement("div");
    fondo.id = "modal-mapa"; fondo.className = "modal-fondo";
    fondo.innerHTML =
      '<div class="cmapa-caja" role="dialog" aria-modal="true" aria-label="Mapa de ' + esc(g.nombre) + '">' +
        '<button type="button" class="cmapa-cerrar" title="Cerrar">✖</button>' +
        '<h3 class="modal-titulo">🗺️ ¿Qué hay en cada trimestre?</h3>' +
        '<p class="cmapa-guia">👆 Toca una <b>materia</b> para ver sus actividades.' +
          ' <button type="button" class="cmapa-todo">👁️ Ver todo</button></p>' +
        '<div class="cmapa">' +
          '<div class="cmapa-raiz">🎒 ' + esc(g.nombre) + "</div>" +
          '<div class="cmapa-tronco"><span class="cmapa-enlace">se divide en</span></div>' +
          '<div class="cmapa-rejilla" style="grid-template-rows:repeat(' + (filas.length + 1) + ',auto)">' + celdas + "</div>" +
        "</div>" +
        '<p class="cmapa-leyenda"><span>🔁 se repite en otro trimestre</span><span>⭐ solo en ese trimestre</span>' +
          (hayVacias(porTri, filas) ?"<span>💤 no toca en ese trimestre</span>" : "") + "</p>" +
      "</div>";
    document.body.appendChild(fondo);

    const rejilla = fondo.querySelector(".cmapa-rejilla");
    const btnTodo = fondo.querySelector(".cmapa-todo");
    let todo = false;
    function celdasDe(id) { return Array.from(rejilla.querySelectorAll(".cmapa-celda")).filter((c) => c.getAttribute("data-m") === id); }
    function abrirFila(celda, si) {
      celda.classList.toggle("abierta", si);
      const nodo = celda.querySelector("button.cmapa-nodo");
      if (nodo) nodo.setAttribute("aria-expanded", si ? "true" : "false");
    }
    // Abre una materia en los tres trimestres a la vez (y cierra la que estuviera abierta).
    function alternar(id) {
      const yaAbierta = !todo && celdasDe(id).some((c) => c.classList.contains("abierta"));
      todo = false; btnTodo.textContent = "👁️ Ver todo";
      rejilla.querySelectorAll(".cmapa-celda").forEach((c) => abrirFila(c, !yaAbierta && c.getAttribute("data-m") === id));
      rejilla.classList.toggle("con-foco", !yaAbierta);
    }
    btnTodo.onclick = () => {
      todo = !todo;
      btnTodo.textContent = todo ? "🙈 Cerrar todo" : "👁️ Ver todo";
      rejilla.classList.remove("con-foco");
      rejilla.querySelectorAll(".cmapa-celda").forEach((c) => abrirFila(c, todo));
    };

    function cerrar() { document.removeEventListener("keydown", tecla); fondo.remove(); }
    function tecla(e) { if (e.key === "Escape") cerrar(); }
    document.addEventListener("keydown", tecla);
    fondo.querySelector(".cmapa-cerrar").onclick = cerrar;
    fondo.addEventListener("click", (e) => {
      if (e.target === fondo) { cerrar(); return; }
      const act = e.target.closest(".cmapa-act");
      if (act) {
        const celda = act.closest(".cmapa-celda");
        cerrar();
        if (alIr) alIr(act.getAttribute("data-tri"), celda.getAttribute("data-m"), act.getAttribute("data-modo"));
        return;
      }
      const tri = e.target.closest("button.cmapa-tri");
      if (tri) { cerrar(); if (alIr) alIr(tri.getAttribute("data-tri")); return; }
      const nodo = e.target.closest("button.cmapa-nodo");
      if (nodo) alternar(nodo.closest(".cmapa-celda").getAttribute("data-m"));
    });
  }

  // ¿Alguna materia falta en algún trimestre ya armado? (para mostrar o no su línea en la leyenda)
  function hayVacias(porTri, filas) {
    return porTri.some((lista) => lista.length && filas.some((m) => !lista.some((x) => x.id === m.id)));
  }

  return { grados, trimestres, grado, trimestre, disponible, porDefecto, materias, abrirMapa };
})();
window.Curriculo = Curriculo;
