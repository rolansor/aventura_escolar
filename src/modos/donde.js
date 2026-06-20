/* ============================================================
   MODO ¿DÓNDE ESTÁ? — Estudios Sociales
   Quiz sobre el mapa SVG: "Toca la provincia de X". El usuario
   hace clic en el mapa; acierta o falla (se resalta la correcta).
   Reutiliza ECUADOR_SVG y DATOS.mapas.provincias.
   ============================================================ */
const Donde = (function () {
  let svgEl = null, rendido = false, bloqueado = false, temporizador = null;
  let cola = [], indice = 0, aciertos = 0, objetivo = null;
  const provPorEl = [];
  const TOTAL = 10;

  function norm(s) {
    return (s == null ? "" : String(s)).toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
  }
  const provs = () => (DATOS.mapas && DATOS.mapas.provincias) || [];

  let idx = {};
  function construirIndice() {
    idx = {};
    provs().forEach((p) => {
      idx[norm(p.iso)] = p;
      idx[norm(p.n)] = p;
      (p.alias || []).forEach((a) => (idx[norm(a)] = p));
    });
  }
  function provinciaDe(el) {
    const cands = [];
    [el, el.parentNode].forEach((n) => {
      if (!n || !n.getAttribute) return;
      ["id", "name", "data-name", "class"].forEach((a) => {
        const v = n.getAttribute(a);
        if (v) { cands.push(v); String(v).split(/[\s,;_]+/).forEach((t) => cands.push(t)); }
      });
    });
    for (let i = 0; i < cands.length; i++) { const p = idx[norm(cands[i])]; if (p) return p; }
    return null;
  }

  function init() {
    const cont = document.getElementById("donde-svg-cont");
    if (!cont) return;
    const svgTxt = window.ECUADOR_SVG || "";
    if (!svgTxt) { cont.innerHTML = '<div class="mapa-falta"><p>Falta el mapa.</p></div>'; return; }
    construirIndice();
    const limpio = svgTxt.replace(/^﻿/, "").replace(/<\?xml[\s\S]*?\?>/i, "").replace(/<!DOCTYPE[\s\S]*?>/i, "").trim();
    cont.innerHTML = limpio;
    svgEl = cont.querySelector("svg");
    if (!svgEl) return;
    svgEl.classList.add("mapa-ec", "donde-mapa");
    svgEl.removeAttribute("width");
    svgEl.removeAttribute("height");
    if (!svgEl.getAttribute("preserveAspectRatio")) svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svgEl.querySelectorAll("path, polygon").forEach((el) => {
      const p = provinciaDe(el);
      if (!p) return;
      el.classList.add("prov");
      provPorEl.push([el, p]);
      el.addEventListener("click", () => responder(p, el));
    });
    rendido = true;
    empezar();
  }
  function mostrar() { if (!rendido) init(); else empezar(); }

  function empezar() {
    aciertos = 0; indice = 0; bloqueado = false;
    cola = Juego.mezclar(provs().slice()).slice(0, TOTAL);
    const otra = document.getElementById("donde-otra");
    if (otra) otra.classList.add("oculto");
    preguntar();
  }
  function preguntar() {
    objetivo = cola[indice];
    bloqueado = false;
    document.getElementById("donde-progreso").style.width = (indice / cola.length) * 100 + "%";
    document.getElementById("donde-pregunta").textContent = "📍 Toca: " + objetivo.n;
    const retro = document.getElementById("donde-retro");
    retro.textContent = ""; retro.className = "retro";
    limpiarMarcas();
  }
  function limpiarMarcas() {
    if (svgEl) svgEl.querySelectorAll(".prov").forEach((el) => el.classList.remove("ok", "mal", "obj"));
  }

  function responder(p, el) {
    if (bloqueado || !objetivo) return;
    bloqueado = true;
    const retro = document.getElementById("donde-retro");
    let espera;
    if (p.iso === objetivo.iso) {
      el.classList.add("ok");
      aciertos++;
      retro.textContent = Juego.frasePositiva();
      retro.className = "retro bien";
      Juego.acierto();
      espera = 900;
    } else {
      el.classList.add("mal");
      provPorEl.forEach(function (par) { if (par[1].iso === objetivo.iso) par[0].classList.add("obj"); });
      retro.textContent = "Esa es " + p.n + ". " + objetivo.n + " está en verde.";
      retro.className = "retro mal";
      Juego.error();
      espera = 2100;
    }
    temporizador = setTimeout(function () {
      indice++;
      if (indice >= cola.length) terminar(); else preguntar();
    }, espera);
  }

  function terminar() {
    document.getElementById("donde-progreso").style.width = "100%";
    limpiarMarcas();
    document.getElementById("donde-pregunta").textContent =
      "¡Terminaste, " + Juego.jugador() + "! " + aciertos + " de " + cola.length + " ⭐";
    const retro = document.getElementById("donde-retro");
    retro.textContent = aciertos === cola.length ? "¡Perfecto! 🏆" : "¡Muy bien! Toca «Otra ronda» para seguir.";
    retro.className = "retro bien";
    if (aciertos >= cola.length - 1) Juego.granPremio();
    const otra = document.getElementById("donde-otra");
    if (otra) otra.classList.remove("oculto");
  }
  function otraRonda() { empezar(); }

  return { init, mostrar, otraRonda };
})();
window.Donde = Donde;
