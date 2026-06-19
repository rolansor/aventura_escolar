/* ============================================================
   MODO MAPAS — Estudios Sociales
   Mapa interactivo del Ecuador (provincias) a partir de un SVG
   real (window.ECUADOR_SVG, definido en js/mapadata.js).
   Cada provincia se colorea por región y, al tocarla, muestra
   su región y su capital. Incluye la Región Insular (Galápagos).

   La geometría es INTERCAMBIABLE: este módulo solo necesita un
   SVG con un <path>/<polygon> por provincia que tenga, en algún
   atributo (id/name/data-name/class/<title>), el nombre o el
   código ISO de la provincia. La detección es tolerante.
   ============================================================ */

const Mapas = (function () {
  /* ---------- Regiones naturales del Ecuador ---------- */
  const REGIONES = {
    costa:   { nombre: "Costa",          emoji: "🌴", color: "#ffce54" },
    sierra:  { nombre: "Sierra",         emoji: "⛰️", color: "#a0d468" },
    oriente: { nombre: "Amazonía",       emoji: "🌳", color: "#37bc9b" },
    insular: { nombre: "Región Insular", emoji: "🐢", color: "#4fc1e9" }
  };

  /* ---------- Las 24 provincias (nombre, ISO, región, capital) ---------- */
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

  /* ---------- Índice de búsqueda tolerante ---------- */
  function norm(s) {
    // NFD separa los acentos; el filtro final deja solo a-z0-9, así que
    // tildes, ñ, espacios y guiones desaparecen ("Galápagos" -> "galapagos").
    return (s == null ? "" : String(s)).toLowerCase()
      .normalize("NFD")
      .replace(/[^a-z0-9]/g, "");
  }
  const indice = {};
  PROVINCIAS.forEach((p) => {
    indice[norm(p.n)] = p;
    indice[norm(p.iso)] = p;                 // "eca", "ecsd"…
    (p.alias || []).forEach((a) => (indice[norm(a)] = p));
  });

  let rendido = false;

  function init() {
    if (rendido) return;
    const cont = document.getElementById("mapa-svg-cont");
    if (!cont) return;

    const svgTxt = window.ECUADOR_SVG || "";
    if (!svgTxt || svgTxt.indexOf("PLACEHOLDER") !== -1) {
      mostrarFaltaMapa(cont);
      return;
    }
    // Quita el prólogo XML / DOCTYPE / BOM para que el parser HTML solo vea el <svg>.
    const limpio = svgTxt
      .replace(/^﻿/, "")
      .replace(/<\?xml[\s\S]*?\?>/i, "")
      .replace(/<!DOCTYPE[\s\S]*?>/i, "")
      .trim();
    cont.innerHTML = limpio;
    const svg = cont.querySelector("svg");
    if (!svg) { mostrarFaltaMapa(cont); return; }

    svg.classList.add("mapa-ec");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    if (!svg.getAttribute("preserveAspectRatio")) svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    let enganchadas = 0;
    svg.querySelectorAll("path, polygon").forEach((el) => {
      const prov = provinciaDe(el);
      if (!prov) return;
      enganchadas++;
      el.classList.add("prov");
      el.style.fill = REGIONES[prov.reg].color;
      el.style.cursor = "pointer";
      el.setAttribute("tabindex", "0");
      el.addEventListener("click", () => seleccionar(prov, el, svg));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); seleccionar(prov, el, svg); }
      });
    });

    pintarLeyenda();
    rendido = true;
    if (!enganchadas) {
      // El SVG cargó pero no reconocimos ninguna provincia: avisa sin romper.
      const info = document.getElementById("mapa-info");
      if (info) info.innerHTML =
        "El mapa cargó, pero no reconocí las provincias por sus nombres. " +
        "Avísame y ajusto la detección al formato de tu SVG. 🔧";
    }
  }

  function mostrar() { init(); }

  function provinciaDe(el) {
    const cands = [];
    const push = (v) => {
      if (!v) return;
      cands.push(v);
      String(v).split(/[\s,;_]+/).forEach((t) => cands.push(t));
    };
    [el, el.parentNode].forEach((n) => {
      if (!n || !n.getAttribute) return;
      ["id", "name", "data-name", "data-id", "title", "class", "inkscape:label"].forEach((a) => {
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

  function seleccionar(prov, el, svg) {
    svg.querySelectorAll(".prov.sel").forEach((x) => x.classList.remove("sel"));
    el.classList.add("sel");
    const r = REGIONES[prov.reg];
    const info = document.getElementById("mapa-info");
    if (info) {
      info.innerHTML =
        '<h3>' + escapar(prov.n) + "</h3>" +
        '<p class="mapa-region">' + r.emoji + " Región " + escapar(r.nombre) + "</p>" +
        '<p>⭐ Capital: <b>' + escapar(prov.cap) + "</b></p>";
    }
    if (window.Luna && Luna.reaccion) Luna.reaccion("feliz");
  }

  function pintarLeyenda() {
    const ley = document.getElementById("mapa-leyenda");
    if (!ley) return;
    ley.innerHTML = "";
    Object.keys(REGIONES).forEach((k) => {
      const r = REGIONES[k];
      const chip = document.createElement("span");
      chip.className = "mapa-chip";
      chip.innerHTML =
        '<span class="pin" style="background:' + r.color + '"></span>' +
        r.emoji + " " + escapar(r.nombre);
      ley.appendChild(chip);
    });
  }

  function mostrarFaltaMapa(cont) {
    cont.innerHTML =
      '<div class="mapa-falta">' +
      '<p style="font-size:2.6rem;margin:.2rem;">🗺️📥</p>' +
      "<p><b>Aún falta el mapa real del Ecuador.</b></p>" +
      "<p>Descarga el SVG de provincias (por ejemplo de simplemaps), guárdalo como " +
      "<code>ecuador.svg</code> en la carpeta del proyecto y avísame: lo integro y el mapa " +
      "quedará interactivo con regiones, provincias y capitales (incluida Galápagos).</p>" +
      "</div>";
    const ley = document.getElementById("mapa-leyenda");
    if (ley) ley.innerHTML = "";
    const info = document.getElementById("mapa-info");
    if (info) info.textContent = "Cuando esté el mapa, toca una provincia para conocerla. 👆";
  }

  function escapar(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  return { init, mostrar };
})();
window.Mapas = Mapas;
