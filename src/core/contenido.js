/* ============================================================
   RUNNER GENÉRICO DE CONTENIDO — src/core/contenido.js  (global: Contenido)
   Lee el contenido de una actividad desde DATOS.contenido[<modo>] (un JSON por
   actividad en data/contenido/<modo>.json) y arma las rondas según el "tipo"
   de cada tema. Centraliza TODA la lógica que antes estaba duplicada en cada
   src/modos/*.js. Soporta los motores "actividad" (manipulativo) y "mc" (quiz).

   Esquema (ver docs/ESQUEMA_CONTENIDO.md):
     { modo, materia, px, titulo, icono, motor: "actividad"|"mc", temas: [ … ] }
   Cada tema: { tipo, icono, nombre, desc, total?, …contenido por nivel [b,i,a]… }
   Tipos: clasificar | emparejar | ordenar | silabas | alfabetico | vf | definir
          | sujeto | signos | formas | (motor mc:) lectura | mc
   ============================================================ */
window.Contenido = (function () {
  function esc(s) { const d = document.createElement("div"); d.textContent = String(s == null ? "" : s); return d.innerHTML; }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  // Devuelve el arreglo del nivel actual; si está vacío, baja al inferior.
  function nivelArr(niveles, niv) {
    let arr = niveles[niv];
    for (let k = niv; k >= 0 && (!arr || !arr.length); k--) arr = niveles[k];
    return arr || [];
  }
  // Un ítem al azar del nivel (con fallback).
  function itemDe(niveles, niv) { return Juego.azarEl(nivelArr(niveles, niv)); }

  // Pinta botones tipo ".ord-chip" dentro de un contenedor ".ord-fuente" en host.
  function pintarBotones(host, etiquetas, alElegir) {
    host.innerHTML = '<div class="ord-fuente"></div>';
    const cont = host.querySelector(".ord-fuente");
    etiquetas.forEach((et) => {
      const b = document.createElement("button");
      b.className = "ord-chip";
      b.innerHTML = et.html != null ? et.html : esc(et.txt);
      b.onclick = () => alElegir(et, b);
      cont.appendChild(b);
    });
    return cont;
  }

  /* ---------------- Builders por tipo de juego ---------------- */
  const BUILDERS = {
    // Arrastrar cada ficha a su cesta.
    clasificar: (t) => (host, ctrl) => {
      const niv = Juego.nivelIdx();
      const ids = t.cestasPorNivel ? Juego.porNivel(t.cestasPorNivel) : t.cestas.map((c) => c.id);
      const meta = {}; t.cestas.forEach((c) => (meta[c.id] = c));
      const cestas = ids.map((id) => meta[id]);
      const items = ids.map((id) => ({ txt: itemDe(t.items[id], niv), cesta: id }));
      Arrastrar.clasificar(host, ctrl, { pregunta: t.pregunta, cestas: cestas, items: ctrl.mezclar(items) });
    },
    // Unir parejas (izquierda↔derecha).
    emparejar: (t) => (host, ctrl) => {
      const pares = Juego.porNivel(t.pares).map((p) => ({ a: p.a, b: p.b }));
      Arrastrar.emparejar(host, ctrl, { pregunta: t.pregunta || "Une cada pareja 👇", pares: pares });
    },
    // Ordenar una secuencia (tócalas en orden).
    ordenar: (t) => (host, ctrl) => {
      const correcto = itemDe(t.secuencias, Juego.nivelIdx());
      Arrastrar.ordenar(host, ctrl, { pregunta: t.pregunta || "Tócalas en orden 👇", correcto: correcto.slice() });
    },
    // Formar una palabra ordenando sus sílabas.
    silabas: (t) => (host, ctrl) => {
      const sil = itemDe(t.items, Juego.nivelIdx());
      Arrastrar.ordenar(host, ctrl, {
        pregunta: "Forma la palabra: <b>" + esc(sil.join("").toUpperCase()) + "</b> — toca sus sílabas en orden 👇",
        correcto: sil.slice()
      });
    },
    // Ordenar alfabéticamente (orden calculado en runtime, tolerante a tildes).
    alfabetico: (t) => (host, ctrl) => {
      const grupo = itemDe(t.grupos, Juego.nivelIdx());
      const correcto = grupo.slice().sort((a, b) => norm(a).localeCompare(norm(b)));
      Arrastrar.ordenar(host, ctrl, { pregunta: t.pregunta || "Toca las palabras en orden alfabético (A → Z) 👇", correcto: correcto });
    },
    // ¿Verdadero o falso?  (concepto)
    vf: (t) => (host, ctrl) => {
      const q = itemDe(t.preguntas, Juego.nivelIdx());
      ctrl.pregunta("🤔 ¿Es verdad?<br><b>" + esc(q.t) + "</b>");
      pintarBotones(host, [{ txt: "✅ Verdadero", v: true }, { txt: "❌ Falso", v: false }], (et) => {
        if (et.v === q.c) ctrl.ganar();
        else ctrl.fallar("Era <b>" + (q.c ? "Verdadero" : "Falso") + "</b>. " + (q.exp || ""));
      });
    },
    // ¿Qué es cada cosa?  (definición con opciones)
    definir: (t) => (host, ctrl) => {
      const q = itemDe(t.preguntas, Juego.nivelIdx());
      ctrl.pregunta("📖 " + esc(q.q));
      const ops = ctrl.mezclar([q.c].concat(q.d)).map((o) => ({ txt: o, ok: o === q.c }));
      pintarBotones(host, ops, (et) => { if (et.ok) ctrl.ganar(); else ctrl.reintento("Casi… inténtalo otra vez 🤔"); });
    },
    // Sujeto y predicado: tocar la palabra donde empieza el predicado.
    sujeto: (t) => (host, ctrl) => {
      const q = itemDe(t.items, Juego.nivelIdx());
      ctrl.pregunta(t.pregunta || "Toca la palabra donde empieza el PREDICADO (lo que hace el sujeto) 👇");
      const ops = q.palabras.map((w, k) => ({ txt: w, k: k }));
      const cont = pintarBotones(host, ops, (et) => {
        if (et.k === q.corte) {
          Array.prototype.forEach.call(cont.children, (b, k) => b.classList.add(k < q.corte ? "puesto" : "ok"));
          ctrl.ganar();
        } else ctrl.reintento("Ahí no; el predicado es lo que HACE el sujeto 👀");
      });
    },
    // Pon el signo: tocar el signo correcto para el hueco ▢.
    signos: (t) => (host, ctrl) => {
      const q = itemDe(t.items, Juego.nivelIdx());
      ctrl.pregunta(t.pregunta || "¿Qué signo va en el ▢? Tócalo 👇");
      host.innerHTML = '<div class="signo-frase">' + esc(q.antes) + '<span class="signo-hueco">▢</span>' + esc(q.despues) + '</div><div class="ord-fuente"></div>';
      const cont = host.querySelector(".ord-fuente");
      ctrl.mezclar(q.opciones.slice()).forEach((op) => {
        const b = document.createElement("button");
        b.className = "ord-chip"; b.textContent = op;
        b.onclick = () => {
          if (op === q.correcto) {
            const h = host.querySelector(".signo-hueco"); h.textContent = op; h.classList.add("signo-ok");
            ctrl.ganar();
          } else ctrl.reintento("Ese no; fíjate en la entonación 👀");
        };
        cont.appendChild(b);
      });
    },
    // Cambia la palabra (diminutivo/aumentativo/género-número): elige la forma correcta.
    formas: (t) => (host, ctrl) => {
      const q = itemDe(t.items, Juego.nivelIdx());
      ctrl.pregunta((q.instr || "Cambia la palabra") + ": <b>" + esc(q.base) + "</b>");
      const ops = ctrl.mezclar(q.opciones.slice()).map((o) => ({ txt: o, ok: o === q.correcto }));
      pintarBotones(host, ops, (et) => { if (et.ok) ctrl.ganar(); else ctrl.reintento("Casi; fíjate en la terminación 👀"); });
    }
  };

  /* ---------------- Generadores para el motor MC ---------------- */
  function mcPregunta(tema, p, c, d, pista) {
    const q = { tema: tema, pregunta: p, correcta: c, opciones: Juego.mezclar([c].concat(d)) };
    if (pista) q.pista = pista;
    return q;
  }
  function gensDe(t) {
    if (t.tipo === "mc") {
      return [function () { const x = Juego.azarEl(t.banco); return mcPregunta(t.nombre, x.p, x.c, x.d, x.pista); }];
    }
    if (t.tipo === "lectura") {
      return [function () {
        const lect = itemDe(t.lecturas, Juego.nivelIdx());
        const pr = Juego.azarEl(lect.preguntas);
        return { tema: t.nombre || "Lee con atención", html: '<div class="lectura-texto">' + esc(lect.texto) + "</div>",
                 pregunta: pr.q, opciones: pr.opciones, correcta: pr.correcta };
      }];
    }
    return [];
  }

  /* ---------------- Montaje ---------------- */
  function montar(modo) {
    const C = (DATOS.contenido || {})[modo];
    if (!C) { if (window.console) console.error("Falta data/contenido/" + modo + ".json (¿build.py?)"); return { init: function () {} }; }
    const px = C.px || modo;
    if (C.motor === "mc") {
      const temas = C.temas.map((t) => ({ icono: t.icono, nombre: t.nombre, desc: t.desc, gens: gensDe(t) }));
      return MC(px, temas);
    }
    const temas = C.temas.map((t) => ({
      icono: t.icono, nombre: t.nombre, desc: t.desc, total: t.total || 6, ronda: BUILDERS[t.tipo](t)
    }));
    return Actividad(px, temas);
  }

  return { montar };
})();
