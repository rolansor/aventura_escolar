/* ============================================================
   MODO MAPAS — Estudios Sociales
   Mapa interactivo del Ecuador (provincias) a partir de un SVG
   real (window.ECUADOR_SVG, cargado de data/mapa-ec.json).

   Interacción:
   - HOVER sobre una provincia -> tooltip + panel inferior con
     nombre, región y capital.
   - DOBLE CLIC -> hace zoom (anima el viewBox) a esa provincia y
     abre a un lado un panel de detalle con un SLIDER de información
     estructurada IGUAL para todas (identidad, cantones, dato).

   La geometría es INTERCAMBIABLE: este módulo no tiene coordenadas;
   identifica cada provincia por su nombre/código ISO en el SVG.
   ============================================================ */

const Mapas = (function () {
  /* ---------- Regiones naturales ---------- */
  const REGIONES = {
    costa:   { nombre: "Costa",          emoji: "🌴", color: "#ffce54" },
    sierra:  { nombre: "Sierra",         emoji: "⛰️", color: "#a0d468" },
    oriente: { nombre: "Amazonía",       emoji: "🌳", color: "#37bc9b" },
    insular: { nombre: "Región Insular", emoji: "🐢", color: "#4fc1e9" }
  };

  /* ---------- Las 24 provincias ---------- */
  const PROVINCIAS = [
    { n: "Azuay",                          iso: "EC-A",  reg: "sierra",  cap: "Cuenca" },
    { n: "Bolívar",                        iso: "EC-B",  reg: "sierra",  cap: "Guaranda" },
    { n: "Cañar",                          iso: "EC-F",  reg: "sierra",  cap: "Azogues" },
    { n: "Carchi",                         iso: "EC-C",  reg: "sierra",  cap: "Tulcán" },
    { n: "Chimborazo",                     iso: "EC-H",  reg: "sierra",  cap: "Riobamba" },
    { n: "Cotopaxi",                       iso: "EC-X",  reg: "sierra",  cap: "Latacunga" },
    { n: "El Oro",                         iso: "EC-O",  reg: "costa",   cap: "Machala" },
    { n: "Esmeraldas",                     iso: "EC-E",  reg: "costa",   cap: "Esmeraldas" },
    { n: "Galápagos",                      iso: "EC-W",  reg: "insular", cap: "Puerto Baquerizo Moreno", alias: ["galapagos"] },
    { n: "Guayas",                         iso: "EC-G",  reg: "costa",   cap: "Guayaquil" },
    { n: "Imbabura",                       iso: "EC-I",  reg: "sierra",  cap: "Ibarra" },
    { n: "Loja",                           iso: "EC-L",  reg: "sierra",  cap: "Loja" },
    { n: "Los Ríos",                       iso: "EC-R",  reg: "costa",   cap: "Babahoyo", alias: ["losrios"] },
    { n: "Manabí",                         iso: "EC-M",  reg: "costa",   cap: "Portoviejo" },
    { n: "Morona Santiago",                iso: "EC-S",  reg: "oriente", cap: "Macas", alias: ["moronasantiago"] },
    { n: "Napo",                           iso: "EC-N",  reg: "oriente", cap: "Tena" },
    { n: "Orellana",                       iso: "EC-D",  reg: "oriente", cap: "Puerto Francisco de Orellana" },
    { n: "Pastaza",                        iso: "EC-Y",  reg: "oriente", cap: "Puyo" },
    { n: "Pichincha",                      iso: "EC-P",  reg: "sierra",  cap: "Quito" },
    { n: "Santa Elena",                    iso: "EC-SE", reg: "costa",   cap: "Santa Elena", alias: ["santaelena"] },
    { n: "Santo Domingo de los Tsáchilas", iso: "EC-SD", reg: "costa",   cap: "Santo Domingo", alias: ["santodomingo", "santodomingodelostsachilas", "santodomingodelostsachila"] },
    { n: "Sucumbíos",                      iso: "EC-U",  reg: "oriente", cap: "Nueva Loja", alias: ["sucumbios"] },
    { n: "Tungurahua",                     iso: "EC-T",  reg: "sierra",  cap: "Ambato" },
    { n: "Zamora Chinchipe",               iso: "EC-Z",  reg: "oriente", cap: "Zamora", alias: ["zamorachinchipe"] }
  ];

  /* ---------- Detalle estructurado por provincia (clave = ISO) ----------
     MISMOS campos para todas: provincialización (año), nº de cantones,
     gentilicio y un dato curioso. Revisar/ampliar libremente. */
  const DET = {
    "EC-A":  { provincializacion: "1824", cantones: 15, gentilicio: "azuayo/a",          dato: "Su capital, Cuenca, es Patrimonio Cultural de la Humanidad por su hermoso centro histórico." },
    "EC-B":  { provincializacion: "1884", cantones: 7,  gentilicio: "bolivarense",       dato: "Guaranda es famosa por su Carnaval, uno de los más alegres del Ecuador." },
    "EC-F":  { provincializacion: "1880", cantones: 7,  gentilicio: "cañari",            dato: "En Cañar está Ingapirca, las ruinas incas más importantes del Ecuador." },
    "EC-C":  { provincializacion: "1880", cantones: 6,  gentilicio: "carchense",         dato: "Limita con Colombia; en Tulcán hay un cementerio con figuras talladas en arbustos." },
    "EC-H":  { provincializacion: "1824", cantones: 10, gentilicio: "chimboracense",     dato: "Aquí está el Chimborazo, la montaña más alta del Ecuador y el punto más cercano al Sol." },
    "EC-X":  { provincializacion: "1851", cantones: 7,  gentilicio: "cotopaxense",       dato: "El volcán Cotopaxi, uno de los más altos y activos del mundo, lleva su nombre." },
    "EC-O":  { provincializacion: "1884", cantones: 14, gentilicio: "orense",            dato: "Es la 'capital bananera'; en Machala se celebra la Feria Mundial del Banano." },
    "EC-E":  { provincializacion: "1847", cantones: 7,  gentilicio: "esmeraldeño/a",     dato: "Tierra de playas, marimba y cultura afroecuatoriana." },
    "EC-W":  { provincializacion: "1973", cantones: 3,  gentilicio: "galapagueño/a",     dato: "Sus tortugas gigantes e iguanas inspiraron a Charles Darwin; es Patrimonio Natural de la Humanidad." },
    "EC-G":  { provincializacion: "1824", cantones: 25, gentilicio: "guayasense",        dato: "Guayaquil es el puerto principal y la ciudad más poblada del Ecuador." },
    "EC-I":  { provincializacion: "1824", cantones: 6,  gentilicio: "imbabureño/a",      dato: "Llamada 'provincia de los lagos'; Otavalo tiene un famoso mercado indígena." },
    "EC-L":  { provincializacion: "1824", cantones: 16, gentilicio: "lojano/a",          dato: "Loja es conocida como la 'capital musical del Ecuador'." },
    "EC-R":  { provincializacion: "1860", cantones: 13, gentilicio: "riosense",          dato: "Tierra agrícola de banano, arroz y cacao, junto a grandes ríos." },
    "EC-M":  { provincializacion: "1824", cantones: 22, gentilicio: "manabita",          dato: "Famosa por sus playas y su comida; el ceviche y el encebollado son típicos." },
    "EC-S":  { provincializacion: "1953", cantones: 12, gentilicio: "morona-santiagués", dato: "Provincia amazónica con selva, cascadas y cultura shuar." },
    "EC-N":  { provincializacion: "1959", cantones: 5,  gentilicio: "napense",           dato: "En la Amazonía; el río Napo y la biodiversidad de la selva son su tesoro." },
    "EC-D":  { provincializacion: "1998", cantones: 4,  gentilicio: "orellanense",       dato: "Una de las provincias más jóvenes; es la puerta al Parque Nacional Yasuní." },
    "EC-Y":  { provincializacion: "1959", cantones: 4,  gentilicio: "pastacense",        dato: "La provincia más extensa del Ecuador, llena de selva amazónica." },
    "EC-P":  { provincializacion: "1824", cantones: 8,  gentilicio: "pichinchano/a",     dato: "Su capital, Quito, fue la primera ciudad declarada Patrimonio Cultural de la Humanidad." },
    "EC-SE": { provincializacion: "2007", cantones: 3,  gentilicio: "santaelenense",     dato: "Provincia joven con playas turísticas como Salinas y Montañita." },
    "EC-SD": { provincializacion: "2007", cantones: 2,  gentilicio: "santodomingueño/a", dato: "Hogar del pueblo Tsáchila, conocido por su cultura y tradición." },
    "EC-U":  { provincializacion: "1989", cantones: 7,  gentilicio: "sucumbieño/a",      dato: "Provincia amazónica del nororiente, con gran riqueza natural y petrolera." },
    "EC-T":  { provincializacion: "1860", cantones: 9,  gentilicio: "tungurahuense",     dato: "Ambato es la 'ciudad de las flores y las frutas'; cerca está Baños y su volcán." },
    "EC-Z":  { provincializacion: "1953", cantones: 9,  gentilicio: "zamorano/a",        dato: "Donde la Amazonía se une a la montaña; famosa por sus cascadas y orquídeas." }
  };

  /* ---------- Índice de búsqueda tolerante ---------- */
  function norm(s) {
    return (s == null ? "" : String(s)).toLowerCase()
      .normalize("NFD")
      .replace(/[^a-z0-9]/g, "");
  }
  const indice = {};
  PROVINCIAS.forEach((p) => {
    indice[norm(p.n)] = p;
    indice[norm(p.iso)] = p;
    (p.alias || []).forEach((a) => (indice[norm(a)] = p));
  });

  /* ---------- Estado del módulo ---------- */
  let rendido = false;
  let svgEl = null;
  // El SVG ya viene RECORTADO y con Galápagos junto al continente
  // (horneado en ecuador_recortado.svg). vbFull se lee de su viewBox.
  let vbFull = [0, 0, 1000, 398];   // viewBox completo (del SVG recortado)
  let vbActual = [0, 0, 1000, 398]; // viewBox mostrado ahora
  let animId = null;
  let provActiva = null;
  let slides = [];
  let slideIdx = 0;
  let elemReg = {};                 // provincias agrupadas por región (para resaltar)

  /* ---------- Arranque ---------- */
  function init() {
    if (rendido) return;
    const cont = document.getElementById("mapa-svg-cont");
    if (!cont) return;

    const svgTxt = window.ECUADOR_SVG || "";
    if (!svgTxt || svgTxt.indexOf("PLACEHOLDER") !== -1) { mostrarFaltaMapa(cont); return; }

    const limpio = svgTxt
      .replace(/^﻿/, "")
      .replace(/<\?xml[\s\S]*?\?>/i, "")
      .replace(/<!DOCTYPE[\s\S]*?>/i, "")
      .trim();
    cont.innerHTML = limpio;
    svgEl = cont.querySelector("svg");
    if (!svgEl) { mostrarFaltaMapa(cont); return; }

    svgEl.classList.add("mapa-ec");
    svgEl.removeAttribute("width");
    svgEl.removeAttribute("height");
    if (!svgEl.getAttribute("preserveAspectRatio")) svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");

    // viewBox completo (el parser HTML corrige "viewbox" -> "viewBox")
    const bv = svgEl.viewBox && svgEl.viewBox.baseVal;
    if (bv && bv.width) vbFull = [bv.x, bv.y, bv.width, bv.height];
    else vbFull = (svgEl.getAttribute("viewBox") || "0 0 1000 398").split(/[\s,]+/).map(Number);
    vbActual = vbFull.slice();
    svgEl.setAttribute("viewBox", vbFull.join(" "));

    let enganchadas = 0;
    svgEl.querySelectorAll("path, polygon").forEach((el) => {
      const prov = provinciaDe(el);
      if (!prov) return;
      enganchadas++;
      el.classList.add("prov");
      (elemReg[prov.reg] = elemReg[prov.reg] || []).push(el);
      el.style.fill = REGIONES[prov.reg].color;
      el.style.cursor = "pointer";
      el.setAttribute("tabindex", "0");
      el.addEventListener("mouseenter", (e) => hoverEntra(prov, el, e));
      el.addEventListener("mousemove", tipMover);
      el.addEventListener("mouseleave", () => hoverSale(el));
      el.addEventListener("click", () => clicSimple(prov, el));
      el.addEventListener("dblclick", () => clicDoble(prov, el));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); zoomA(prov, el); }
      });
    });

    pintarLeyenda();
    rendido = true;
    if (!enganchadas && window.console) console.warn("Mapa: no se reconocieron provincias en el SVG.");
  }

  function mostrar() {
    if (!rendido) init();
    resetZoom(); // al reentrar, mapa completo
  }

  /* ---------- Identificación de provincia ---------- */
  function provinciaDe(el) {
    const cands = [];
    const push = (v) => {
      if (!v) return;
      cands.push(v);
      String(v).split(/[\s,;_]+/).forEach((t) => cands.push(t));
    };
    [el, el.parentNode].forEach((n) => {
      if (!n || !n.getAttribute) return;
      ["id", "name", "data-name", "data-id", "title", "class"].forEach((a) => {
        try { push(n.getAttribute(a)); } catch (e) {}
      });
      const t = n.querySelector && n.querySelector("title");
      if (t) push(t.textContent);
    });
    for (let i = 0; i < cands.length; i++) {
      const p = indice[norm(cands[i])];
      if (p) return p;
    }
    return null;
  }

  /* ---------- Hover: tooltip + panel inferior ---------- */
  function hoverEntra(prov, el, e) {
    el.classList.add("hover");
    const r = REGIONES[prov.reg];
    const tip = document.getElementById("mapa-tooltip");
    if (tip) {
      tip.innerHTML =
        '<img class="tt-bandera" src="recursos/banderas/' + prov.iso + '.svg" alt="" ' +
          "onerror=\"this.style.display='none'\">" +
        '<div class="tt-nombre">' + escapar(prov.n) + "</div>" +
        '<div class="tt-linea">' + r.emoji + " Región " + escapar(r.nombre) + "</div>" +
        '<div class="tt-linea">⭐ Capital: <b>' + escapar(prov.cap) + "</b></div>";
      tip.classList.remove("oculto");
      tipMover(e);
    }
  }
  function hoverSale(el) {
    el.classList.remove("hover");
    const tip = document.getElementById("mapa-tooltip");
    if (tip) tip.classList.add("oculto");
  }
  function tipMover(e) {
    const tip = document.getElementById("mapa-tooltip");
    if (!tip || tip.classList.contains("oculto")) return;
    const ancho = tip.offsetWidth || 160, alto = tip.offsetHeight || 60;
    let x = e.clientX + 16, y = e.clientY + 16;
    if (x + ancho > window.innerWidth - 8) x = e.clientX - ancho - 16;
    if (y + alto > window.innerHeight - 8) y = e.clientY - alto - 16;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }

  function marcarSel(el) {
    if (!svgEl) return;
    svgEl.querySelectorAll(".prov.sel").forEach((x) => x.classList.remove("sel"));
    el.classList.add("sel");
  }

  // Diferencia clic simple (pop 3D) de doble clic (zoom) con un retardo.
  let clickTimer = null;
  function clicSimple(prov, el) {
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
    clickTimer = setTimeout(function () { clickTimer = null; popProvincia(el); }, 230);
  }
  function clicDoble(prov, el) {
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
    const sel = window.getSelection && window.getSelection();
    if (sel && sel.removeAllRanges) sel.removeAllRanges();   // que el doble clic no seleccione texto
    zoomA(prov, el);
  }
  // "Salto" 3D: la provincia crece + sombra y sale del plano.
  function popProvincia(el) {
    if (!svgEl) return;
    quitarPop();
    el.parentNode.appendChild(el);     // al frente para que la sombra no la tapen las vecinas
    el.classList.add("pop");
  }
  function quitarPop() {
    if (svgEl) svgEl.querySelectorAll(".prov.pop").forEach((x) => x.classList.remove("pop"));
  }

  /* ---------- Doble clic: zoom + panel de detalle ---------- */
  function zoomA(prov, el) {
    provActiva = prov;
    quitarPop();
    marcarSel(el);
    const tip = document.getElementById("mapa-tooltip");
    if (tip) tip.classList.add("oculto");

    let destino;
    try { destino = encuadre(el); } catch (e) { destino = vbFull.slice(); }
    tween(vbActual.slice(), destino, 600);

    construirSlides(prov);
    slideIdx = 0;
    renderDetalle();
    document.getElementById("mapa-zona").classList.add("zoom");
    document.getElementById("mapa-detalle").classList.remove("oculto");
  }

  function encuadre(el) {
    const g = el.getBBox(); // Galápagos ya viene movida en el SVG, así que basta getBBox
    const b = { x: g.x, y: g.y, w: g.width, h: g.height };
    const pad = Math.max(b.w, b.h) * 0.18 + 4;
    let x = b.x - pad, y = b.y - pad, w = b.w + pad * 2, h = b.h + pad * 2;
    const R = vbFull[2] / vbFull[3]; // proporción del viewBox completo
    if (w / h < R) { const nw = h * R; x -= (nw - w) / 2; w = nw; }
    else { const nh = w / R; y -= (nh - h) / 2; h = nh; }
    return [x, y, w, h];
  }

  function resetZoom() {
    const det = document.getElementById("mapa-detalle");
    if (det) det.classList.add("oculto");
    const zona = document.getElementById("mapa-zona");
    if (zona) zona.classList.remove("zoom");
    if (svgEl) {
      svgEl.querySelectorAll(".prov.sel").forEach((x) => x.classList.remove("sel"));
      quitarPop();
      tween(vbActual.slice(), vbFull.slice(), 500);
    }
  }

  /* ---------- Tween del viewBox (rAF) ---------- */
  function tween(desde, hasta, dur) {
    if (animId) cancelAnimationFrame(animId);
    const t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    function paso(ahora) {
      const t = (window.performance && performance.now) ? ahora : Date.now();
      let p = Math.min(1, (t - t0) / dur);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOut
      vbActual = desde.map((v, i) => v + (hasta[i] - v) * e);
      svgEl.setAttribute("viewBox", vbActual.join(" "));
      if (p < 1) animId = requestAnimationFrame(paso);
      else { vbActual = hasta.slice(); animId = null; }
    }
    animId = requestAnimationFrame(paso);
  }

  /* ---------- Panel de detalle con slider ---------- */
  function construirSlides(prov) {
    const d = DET[prov.iso] || {};
    const r = REGIONES[prov.reg];
    slides = [
      {
        t: "🪪 Identidad",
        html:
          "<p>📍 <b>Provincia:</b> " + escapar(prov.n) + "</p>" +
          "<p>⭐ <b>Capital:</b> " + escapar(prov.cap) + "</p>" +
          "<p>" + r.emoji + " <b>Región:</b> " + escapar(r.nombre) + "</p>" +
          (d.provincializacion ? "<p>📅 <b>Provincialización:</b> " + escapar(d.provincializacion) + "</p>" : "") +
          (d.gentilicio ? "<p>🙋 <b>Gentilicio:</b> " + escapar(d.gentilicio) + "</p>" : "")
      },
      {
        t: "🏘️ Cantones",
        html: (d.cantones != null)
          ? "<p class='mapa-num'>" + d.cantones + "</p><p>cantones</p>"
          : "<p>Información próximamente.</p>"
      },
      {
        t: "💡 ¿Sabías que…?",
        html: "<p>" + escapar(d.dato || "Pronto más datos de esta provincia.") + "</p>"
      }
    ];
  }

  function renderDetalle() {
    const cont = document.getElementById("mapa-detalle");
    if (!cont || !provActiva) return;
    const r = REGIONES[provActiva.reg];
    const s = slides[slideIdx];
    const dots = slides.map(function (_, k) {
      return '<span class="dot' + (k === slideIdx ? " on" : "") + '"></span>';
    }).join("");

    cont.innerHTML =
      '<div class="mapa-det-cab" style="border-color:' + r.color + '">' +
        "<h3>" + escapar(provActiva.n) + "</h3>" +
        '<button class="mapa-cerrar" id="mapa-cerrar" title="Ver mapa completo">✖</button>' +
      "</div>" +
      '<div class="mapa-slide">' +
        "<h4>" + s.t + "</h4>" + s.html +
      "</div>" +
      '<div class="mapa-slider-nav">' +
        '<button class="mapa-nav-btn" id="mapa-prev" title="Anterior">◀</button>' +
        '<span class="mapa-dots">' + dots + "</span>" +
        '<button class="mapa-nav-btn" id="mapa-next" title="Siguiente">▶</button>' +
      "</div>";

    document.getElementById("mapa-cerrar").onclick = resetZoom;
    document.getElementById("mapa-prev").onclick = function () {
      slideIdx = (slideIdx - 1 + slides.length) % slides.length; renderDetalle();
    };
    document.getElementById("mapa-next").onclick = function () {
      slideIdx = (slideIdx + 1) % slides.length; renderDetalle();
    };
  }

  /* ---------- Leyenda y mensajes ---------- */
  function pintarLeyenda() {
    const ley = document.getElementById("mapa-leyenda");
    if (!ley) return;
    ley.innerHTML = "";
    Object.keys(REGIONES).forEach((k) => {
      const r = REGIONES[k];
      const chip = document.createElement("span");
      chip.className = "mapa-chip";
      chip.innerHTML = '<span class="pin" style="background:' + r.color + '"></span>' + r.emoji + " " + escapar(r.nombre);
      chip.onmouseenter = () => resaltarRegion(k);
      chip.onmouseleave = quitarResalteRegion;
      ley.appendChild(chip);
    });
  }

  // Hover sobre un chip de la leyenda: resalta esa región y atenúa las demás.
  function resaltarRegion(reg) {
    if (!svgEl) return;
    svgEl.querySelectorAll(".prov").forEach((el) => el.classList.add("atenuada"));
    (elemReg[reg] || []).forEach((el) => {
      el.classList.remove("atenuada");
      el.classList.add("region-on");
    });
  }
  function quitarResalteRegion() {
    if (!svgEl) return;
    svgEl.querySelectorAll(".prov").forEach((el) => el.classList.remove("atenuada", "region-on"));
  }

  function mostrarFaltaMapa(cont) {
    cont.innerHTML =
      '<div class="mapa-falta">' +
      '<p style="font-size:2.6rem;margin:.2rem;">🗺️📥</p>' +
      "<p><b>Aún falta el mapa real del Ecuador.</b></p>" +
      "<p>Descarga el SVG de provincias, guárdalo como <code>ecuador.svg</code> en la carpeta del " +
      "proyecto y avísame: lo integro y el mapa quedará interactivo.</p>" +
      "</div>";
    const ley = document.getElementById("mapa-leyenda");
    if (ley) ley.innerHTML = "";
  }

  function escapar(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  return { init, mostrar };
})();
window.Mapas = Mapas;
