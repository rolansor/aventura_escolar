/* ============================================================
   MENÚ — src/core/menu.js  (solo en index.html)
   Tres sub-pantallas que se alternan:
     1. pantalla-curso    grado (1.º…7.º de básica; los que no tienen
                          plan salen "en construcción") + trimestre.
     2. pantalla-menu     materias de ese grado y trimestre.
     3. pantalla-materia  actividades de la materia en ese trimestre.
   Qué materias/actividades tocan en cada trimestre lo decide el plan
   de data/curriculo.json (ver src/core/curriculo.js). Al elegir una
   actividad NAVEGA a su página (paginas/<modo>.html).
   ============================================================ */
const Menu = (function () {
  // modo -> página
  const PAGINA = {
    ortografia: "paginas/ortografia.html",
    copia:      "paginas/copia.html",
    clases:     "paginas/clases.html",
    familia:    "paginas/familia.html",
    sinonimos:  "paginas/sinonimos.html",
    formas:     "paginas/formas.html",
    silabas:    "paginas/silabas.html",
    ordena:     "paginas/ordena.html",
    sujeto:     "paginas/sujeto.html",
    signos:     "paginas/signos.html",
    alfabetico: "paginas/alfabetico.html",
    lectura:    "paginas/lectura.html",
    refranes:   "paginas/refranes.html",
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
    cuidafauna: "paginas/cuidafauna.html",
    cicloagua:  "paginas/cicloagua.html",
    materia:    "paginas/materia.html",
    ambiente:   "paginas/ambiente.html",
    ahorcado:   "paginas/ahorcado.html",
    mapas:      "paginas/mapas.html",
    cantones:   "paginas/cantones.html",
    quiz:       "paginas/quiz.html",
    donde:      "paginas/donde.html",
    epoca:      "paginas/epoca.html",
    regiones:   "paginas/regiones.html",
    vocabulario: "paginas/vocabulario.html",
    rectas:     "paginas/rectas.html",
    cuadrilateros: "paginas/cuadrilateros.html",
    propmult:   "paginas/propmult.html",
    incas:      "paginas/incas.html",
    riosygente: "paginas/riosygente.html",
    vidaplantas: "paginas/vidaplantas.html",
    editor:     "paginas/editor.html",
    contenido:  "paginas/contenido.html"
  };

  let gradoVisto = null;    // grado resaltado en pantalla-curso (puede estar en construcción)
  let gradoSel = null;      // curso en el que se está jugando: grado con plan + trimestre
  let triSel = null;
  let recienCargada = true; // ?materia= solo se atiende al cargar la página

  function init() {
    // El curso se recuerda en el perfil: se retoma si sigue siendo válido.
    const c = Juego.curso();
    const g = Curriculo.grado(c.grado);
    const valido = Curriculo.disponible(g) && !!Curriculo.trimestre(c.trimestre) &&
      Curriculo.materias(g.id, c.trimestre).length > 0;
    gradoSel = valido ? g.id : null;
    triSel = valido ? c.trimestre : null;
    gradoVisto = gradoSel || (Curriculo.porDefecto() || {}).id || null;
    pintarCurso();
    document.querySelectorAll(".curso-ayuda").forEach((b) => {
      b.onclick = () => Curriculo.abrirMapa(gradoVisto, irDesdeMapa);
    });
    // Si volvemos desde una actividad (?materia=lengua), abre ese submenú directamente.
    const mat = recienCargada ? new URLSearchParams(location.search).get("materia") : null;
    recienCargada = false;
    if (mat && valido) { pintarMenu(); if (!irAMateria(mat)) mostrar("pantalla-menu"); }
    else mostrar("pantalla-curso");
    // El botón "Volver" sube un nivel: actividades → materias → grado y trimestre.
    const bv = document.getElementById("btn-volver-global");
    if (bv) bv.onclick = function () {
      if (document.getElementById("pantalla-materia").classList.contains("activa")) mostrar("pantalla-menu");
      else { pintarCurso(); mostrar("pantalla-curso"); }
    };
  }

  /* ---------- 1. Grado y trimestre ---------- */
  function pintarCurso() {
    const cont = document.getElementById("curso-grados");
    if (!cont) return;
    cont.innerHTML = "";
    Curriculo.grados().forEach((g) => {
      const listo = Curriculo.disponible(g);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "curso-grado" + (listo ? "" : " en-obra") + (g.id === gradoVisto ? " activa" : "");
      b.title = g.nombre + (listo ? "" : " — en construcción");
      b.innerHTML =
        '<span class="curso-grado-num">' + g.numero + "</span>" +
        '<span class="curso-grado-txt">de básica</span>' +
        '<span class="curso-grado-tag">' + (listo ? "🎮" : "🚧") +
          ' <span class="curso-tag-txt">' + (listo ? "¡A jugar!" : "En construcción") + "</span></span>";
      b.onclick = () => {
        gradoVisto = g.id;
        pintarCurso();
        if (!listo) Juego.tip("🚧 " + g.nombre + " está en construcción. ¡Muy pronto!");
      };
      cont.appendChild(b);
    });
    pintarTrimestres();
  }

  function pintarTrimestres() {
    const cont = document.getElementById("curso-trimestres");
    const g = Curriculo.grado(gradoVisto);
    const listo = Curriculo.disponible(g);
    cont.innerHTML = "";
    document.getElementById("curso-paso-tri").classList.toggle("oculto", !listo);
    document.getElementById("curso-ayuda").classList.toggle("oculto", !listo);
    if (!listo) {
      const hay = Curriculo.porDefecto();
      const d = document.createElement("div");
      d.className = "curso-obra";
      d.innerHTML =
        '<span class="emoji-grande">🚧</span>' +
        '<span class="titulo-tarjeta">' + (g ? g.nombre : "Este grado") + " está en construcción</span>" +
        '<span class="desc-tarjeta">¡Muy pronto habrá aventuras aquí!' +
          (hay ? " Por ahora puedes jugar en <b>" + hay.nombre + "</b>." : "") + "</span>";
      cont.appendChild(d);
      return;
    }
    const c = Juego.curso();
    Curriculo.trimestres().forEach((t) => {
      const mats = Curriculo.materias(g.id, t.id);
      if (!mats.length) {   // trimestre todavía sin plan
        const v = crearTarjeta(t.icono, t.nombre, "🚧 En construcción",
          () => Juego.tip("🚧 El " + t.nombre.toLowerCase() + " está en construcción. ¡Muy pronto!"));
        v.classList.add("en-obra");
        cont.appendChild(v);
        return;
      }
      const nAct = mats.reduce((s, m) => s + m.actividades.length, 0);
      const b = crearTarjeta(t.icono, t.nombre,
        '<span class="curso-tri-iconos">' + mats.map((m) => m.icono).join(" ") + "</span>" +
        mats.length + (mats.length === 1 ? " materia" : " materias") + " · " + nAct + " actividades",
        () => entrar(g.id, t.id));
      // Marca dónde se quedó el niño la última vez.
      if (String(c.grado) === String(g.id) && String(c.trimestre) === String(t.id)) {
        b.classList.add("tarjeta-actual");
        b.insertAdjacentHTML("afterbegin", '<span class="curso-aqui">📌 Estabas aquí</span>');
      }
      cont.appendChild(b);
    });
  }

  function entrar(gradoId, triId) {
    gradoSel = gradoVisto = gradoId; triSel = triId;
    Juego.fijarCurso(gradoId, triId);
    pintarMenu();
    mostrar("pantalla-menu");
  }

  // Desde el mapa conceptual: tocar un trimestre entra a él; una actividad, la abre.
  function irDesdeMapa(triId, materiaId, modo) {
    const t = Curriculo.trimestre(triId);
    if (!t || !Curriculo.materias(gradoVisto, t.id).length) return;
    gradoSel = gradoVisto; triSel = t.id;
    Juego.fijarCurso(gradoSel, triSel);
    if (modo && PAGINA[modo]) { location.href = PAGINA[modo]; return; }
    pintarMenu();
    if (!materiaId || !irAMateria(materiaId)) mostrar("pantalla-menu");
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

  /* ---------- 2. Materias del trimestre ---------- */
  function pintarMenu() {
    const cont = document.getElementById("tarjetas-menu");
    if (!cont) return;
    const g = Curriculo.grado(gradoSel), t = Curriculo.trimestre(triSel);
    document.getElementById("menu-titulo").textContent = t.icono + " " + t.nombre;
    document.getElementById("menu-sub").textContent = g.nombre + " · Elige una materia";
    cont.innerHTML = "";
    Curriculo.materias(gradoSel, triSel).forEach((m) => {
      // La descripción cuenta lo que toca ESTE trimestre, no lo genérico de la materia.
      const nombres = m.actividades.slice(0, 3).map((a) => a.nombre).join(", ");
      cont.appendChild(crearTarjeta(m.icono, m.nombre, nombres + (m.actividades.length > 3 ? "…" : ""),
        () => irAMateria(m.id)));
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

  /* ---------- 3. Actividades de una materia ---------- */
  // Devuelve false si esa materia no toca en el trimestre elegido.
  function irAMateria(id) {
    const m = Curriculo.materias(gradoSel, triSel).find((x) => x.id === id);
    if (!m) return false;
    document.getElementById("materia-titulo").textContent = m.icono + " " + m.nombre;
    document.getElementById("materia-sub").textContent = Curriculo.trimestre(triSel).nombre + " · Elige una actividad";
    const cont = document.getElementById("materia-actividades");
    cont.innerHTML = "";
    m.actividades.forEach((a) => {
      cont.appendChild(crearTarjeta(a.icono, a.nombre, a.desc, () => {
        const p = PAGINA[a.modo];
        if (p) location.href = p;
      }));
    });
    mostrar("pantalla-materia");
    return true;
  }

  // Alterna entre las sub-pantallas del índice y el botón Volver.
  function mostrar(id) {
    document.querySelectorAll(".pantalla").forEach((p) => p.classList.remove("activa"));
    const el = document.getElementById(id);
    if (el) el.classList.add("activa");
    const volver = document.getElementById("btn-volver-global");
    if (volver) volver.classList.toggle("oculto", id === "pantalla-curso");
  }

  return { init };
})();
window.Menu = Menu;
