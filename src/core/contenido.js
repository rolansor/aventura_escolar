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
          | sujeto | signos | formas | escena | senala | problema | terminos
          | ahorcado (Inglés) | (motor mc:) lectura | mc
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

  /* Voz en inglés (Web Speech API, sin librerías). Si el navegador no tiene voz,
     simplemente no suena: la actividad sigue funcionando igual. */
  let vozEn = null;
  function buscarVozEn() {
    if (vozEn || !window.speechSynthesis || !window.speechSynthesis.getVoices) return vozEn;
    const vs = window.speechSynthesis.getVoices() || [];
    vozEn = vs.find((v) => /^en(-|_)/i.test(v.lang)) || vs.find((v) => /english|ingl/i.test(v.name)) || null;
    return vozEn;
  }
  function hablarEn(texto) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance || !texto) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(texto).toLowerCase());
      u.lang = "en-US"; u.rate = 0.8; u.pitch = 1;
      const v = buscarVozEn(); if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    } catch (e) { /* sin voz, sin drama */ }
  }
  // Las voces pueden cargar tarde (addEventListener para no pisar a copia.js).
  if (window.speechSynthesis && window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener("voiceschanged", function () { vozEn = null; buscarVozEn(); });
  }

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
    // Unir parejas (izquierda↔derecha). Toma un SUBCONJUNTO al azar del banco del
    // nivel (por defecto 3/4/5 parejas por ronda; configurable con "porRonda").
    emparejar: (t) => (host, ctrl) => {
      const pool = Juego.porNivel(t.pares) || [];
      const n = Math.min(Juego.porNivel(t.porRonda || [3, 4, 5]), pool.length);
      const pares = ctrl.mezclar(pool.slice()).slice(0, n).map((p) => ({ a: p.a, b: p.b }));
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
    },
    // Escena: arrastrar fichas a sus zonas (sobre un SVG con posiciones, o en fila).
    // { escena?, slots:[{id,txt?,left?,top?}], fichas:[{id,txt?,ficha?}] }
    escena: (t) => (host, ctrl) => {
      ctrl.pregunta(t.pregunta || "Arrastra cada ficha a su lugar 👇");
      const slots = t.slots || [], fichas = t.fichas || [];
      const abs = slots.some((s) => s.left != null);
      host.innerHTML =
        '<div class="zona-arrastre ' + (abs ? "con-escena" : "en-fila") + '">' +
          (t.escena ? '<div class="escena">' + t.escena + "</div>" : "") +
          '<div class="slots">' +
            slots.map((s) => '<div class="slot" data-id="' + s.id + '"' + (abs ? ' style="left:' + s.left + "%;top:" + s.top + '%"' : "") + ">" +
              (s.txt ? '<span class="slot-etq">' + esc(s.txt) + "</span>" : '<span class="slot-q">?</span>') + "</div>").join("") +
          "</div>" +
        "</div>" +
        '<div class="fila-fichas"></div>';
      const elFichas = host.querySelector(".fila-fichas");
      const zonas = Array.prototype.slice.call(host.querySelectorAll(".slot"));
      let faltan = slots.length;
      ctrl.mezclar(fichas.slice()).forEach((f) => {
        const chip = document.createElement("button");
        chip.className = "ficha-arr"; chip.textContent = f.ficha || f.txt; chip.dataset.id = f.id;
        elFichas.appendChild(chip);
        Arrastrar.hacer(chip, zonas, (item, zona) => {
          if (!zona || zona.dataset.lleno === "1") return;
          if (zona.dataset.id === item.dataset.id) {
            zona.dataset.lleno = "1"; zona.classList.add("ok"); zona.innerHTML = "";
            item.dataset.fijo = "1"; item.classList.add("colocada"); zona.appendChild(item);
            faltan--; if (faltan === 0) ctrl.ganar(); else ctrl.retro("¡Bien! Faltan " + faltan + " 👇", "bien");
          } else { zona.classList.add("rojo"); setTimeout(() => zona.classList.remove("rojo"), 450); ctrl.reintento("Ahí no va. Prueba en otro lugar 👀"); }
        });
      });
    },
    // Señala la parte: toca la región correcta sobre un SVG. { svg, partes:[{id,nombre}] }
    senala: (t) => (host, ctrl) => {
      const parte = ctrl.azarEl(t.partes);
      ctrl.pregunta("¿Dónde está <b>" + esc(parte.nombre) + "</b>? 👆");
      host.innerHTML = t.svg;
      host.querySelectorAll("[data-parte]").forEach((el) => {
        el.classList.add("parte");
        el.addEventListener("click", () => {
          if (el.getAttribute("data-parte") === parte.id) {
            host.querySelectorAll('[data-parte="' + parte.id + '"]').forEach((e) => e.classList.add("ok"));
            ctrl.ganar();
          } else { el.classList.add("mal"); setTimeout(() => el.classList.remove("mal"), 700); ctrl.reintento("¡Casi! Esa es otra parte, inténtalo 👇"); }
        });
      });
    },
    // Problema verbal (Mate): elige la operación y escribe la respuesta. Lee el banco
    // del archivo (C.banco) filtrado por las operaciones del tema (t.ops). { ops:[…] }
    problema: (t, C) => {
      const OPS = ["+", "−", "×", "÷"];
      const calc = (p) => p.op === "+" ? p.a + p.b : p.op === "−" ? p.a - p.b : p.op === "×" ? p.a * p.b : p.a / p.b;
      const deck = ((C && C.banco) || []).filter((p) => !t.ops || t.ops.indexOf(p.op) >= 0);
      let cola = [];
      return (host, ctrl) => {
        if (!cola.length) cola = ctrl.mezclar(deck.slice());
        const p = cola.pop(); const r = calc(p);
        ctrl.pregunta("🧮 Resuelve paso a paso");
        host.innerHTML =
          '<div class="prob-enun">' + esc(p.t) + "</div>" +
          '<p class="prob-paso">1) ¿Qué operación usas?</p>' +
          '<div class="prob-ops">' + OPS.map((s) => '<button class="prob-op" data-op="' + s + '">' + s + "</button>").join("") + "</div>" +
          '<div class="prob-calc oculto"><p class="prob-paso">2) Haz el cálculo y escribe la respuesta</p>' +
          '<div class="prob-cuenta"></div><div class="prob-resp"><input class="prob-input" inputmode="numeric" autocomplete="off" />' +
          '<button class="prob-ok">Comprobar</button></div></div>';
        const botones = Array.prototype.slice.call(host.querySelectorAll(".prob-op"));
        botones.forEach((btn) => {
          btn.onclick = () => {
            if (btn.dataset.op === p.op) {
              botones.forEach((b) => { b.disabled = true; });
              btn.classList.add("ok");
              host.querySelector(".prob-cuenta").textContent = p.a + " " + p.op + " " + p.b + " =";
              host.querySelector(".prob-calc").classList.remove("oculto");
              host.querySelector(".prob-input").focus();
              ctrl.retro("¡Bien! Ahora calcula 👇", "bien");
            } else { btn.classList.add("rojo"); setTimeout(() => btn.classList.remove("rojo"), 450); ctrl.reintento("Piensa: ¿sumar, restar, multiplicar o dividir? 🤔"); }
          };
        });
        let intentos = 0;
        function comprobar() {
          const inp = host.querySelector(".prob-input"); const v = inp.value.trim();
          if (v === "") return;
          if (parseInt(v, 10) === r) { inp.disabled = true; ctrl.retro("✅ Respuesta: " + r + " " + esc(p.u), "bien"); ctrl.ganar(1500); }
          else { intentos++; if (intentos >= 2) { inp.value = r; inp.disabled = true; ctrl.fallar("La respuesta era " + r + " " + esc(p.u) + " (" + p.a + " " + p.op + " " + p.b + ").", 2400); } else ctrl.reintento("Casi… revisa tu cálculo 👀"); }
        }
        host.querySelector(".prob-ok").onclick = comprobar;
        host.querySelector(".prob-input").addEventListener("keydown", (e) => { if (e.key === "Enter") comprobar(); });
      };
    },
    // Términos de la suma/resta (Mate, paramétrico): genera a±b según rangos por nivel
    // y arrastra cada nombre a su número. { suma:bool, rangos:[[b],[i],[a]] }
    terminos: (t) => (host, ctrl) => {
      const rg = Juego.porNivel(t.rangos || [[2, 20], [20, 200], [200, 2000]]);
      const suma = !!t.suma;
      let a = ctrl.azar(rg[0], rg[1]), b = ctrl.azar(rg[0], rg[1]);
      if (!suma && a < b) { const x = a; a = b; b = x; }
      const c = suma ? a + b : a - b, signo = suma ? "+" : "−";
      const partes = suma ? [{ n: a, rol: "sumando" }, { n: b, rol: "sumando" }, { n: c, rol: "suma" }]
                          : [{ n: a, rol: "minuendo" }, { n: b, rol: "sustraendo" }, { n: c, rol: "diferencia" }];
      const etiquetas = suma ? ["sumando", "sumando", "suma"] : ["minuendo", "sustraendo", "diferencia"];
      const numHTML = (p) => '<div class="term-num" data-rol="' + p.rol + '"><b>' + p.n + '</b><span class="term-slot"></span></div>';
      ctrl.pregunta("Arrastra cada nombre a su número 👇");
      host.innerHTML = '<div class="term-op">' + numHTML(partes[0]) + '<span class="term-sig">' + signo + "</span>" +
        numHTML(partes[1]) + '<span class="term-sig">=</span>' + numHTML(partes[2]) + "</div>" +
        '<div class="fila-fichas term-fichas"></div>';
      const fila = host.querySelector(".term-fichas");
      const zonas = Array.prototype.slice.call(host.querySelectorAll(".term-num"));
      let faltan = zonas.length;
      ctrl.mezclar(etiquetas.slice()).forEach((rol) => {
        const chip = document.createElement("button");
        chip.className = "ficha-arr"; chip.textContent = rol; chip.dataset.rol = rol; fila.appendChild(chip);
        Arrastrar.hacer(chip, zonas, (item, zona) => {
          if (!zona) return;
          if (zona.dataset.lleno !== "1" && zona.dataset.rol === item.dataset.rol) {
            item.dataset.fijo = "1"; item.classList.add("colocada"); zona.dataset.lleno = "1";
            zona.querySelector(".term-slot").appendChild(item);
            zona.classList.add("ok"); setTimeout(() => zona.classList.remove("ok"), 600);
            faltan--; if (faltan === 0) ctrl.ganar(); else ctrl.retro("¡Bien! Faltan " + faltan + " 👇", "bien");
          } else { zona.classList.add("rojo"); setTimeout(() => zona.classList.remove("rojo"), 450); ctrl.reintento("Ese nombre no va ahí 👀"); }
        });
      });
    },
    // Ahorcado (Inglés): adivina la palabra tocando letras (o con el teclado real).
    // La pista es el dibujo/emoji + la traducción; al terminar, la voz la pronuncia.
    // { palabras:[[{en,es,emoji}],[i],[a]], vidas?, pistas?:[b,i,a], mostrarEs?:[b,i,a] }
    ahorcado: (t) => {
      const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      const esLetra = (c) => c >= "A" && c <= "Z";
      // Horca fija + 6 partes del monigote (una por cada fallo).
      const DIBUJO =
        '<svg class="ahor-dibujo" viewBox="0 0 150 170" aria-hidden="true">' +
          '<line class="ahor-horca" x1="12" y1="160" x2="112" y2="160"/>' +
          '<line class="ahor-horca" x1="34" y1="160" x2="34" y2="14"/>' +
          '<line class="ahor-horca" x1="34" y1="14" x2="100" y2="14"/>' +
          '<line class="ahor-horca" x1="100" y1="14" x2="100" y2="32"/>' +
          '<g class="ahor-parte"><circle cx="100" cy="46" r="14"/>' +
            '<circle class="ahor-ojo" cx="95" cy="43" r="1.9"/><circle class="ahor-ojo" cx="105" cy="43" r="1.9"/>' +
            '<path class="ahor-cara" d="M94 51 q6 5 12 0"/></g>' +
          '<line class="ahor-parte" x1="100" y1="60" x2="100" y2="104"/>' +
          '<line class="ahor-parte" x1="100" y1="72" x2="80" y2="92"/>' +
          '<line class="ahor-parte" x1="100" y1="72" x2="120" y2="92"/>' +
          '<line class="ahor-parte" x1="100" y1="104" x2="82" y2="132"/>' +
          '<line class="ahor-parte" x1="100" y1="104" x2="118" y2="132"/>' +
        '</svg>';
      let cola = [], colaNiv = -1, quitarTeclas = null;
      return (host, ctrl) => {
        if (quitarTeclas) quitarTeclas();          // por si quedó viva la ronda anterior
        const niv = Juego.nivelIdx();
        // Cola barajada del nivel: no repite palabra hasta agotarlas todas.
        if (colaNiv !== niv || !cola.length) { cola = ctrl.mezclar(nivelArr(t.palabras, niv).slice()); colaNiv = niv; }
        const p = cola.pop() || { en: "APPLE", es: "manzana", emoji: "🍎" };
        const palabra = String(p.en).toUpperCase(), letras = palabra.split("");
        const vidas = t.vidas || 6, verEs = Juego.porNivel(t.mostrarEs || [true, true, false]);
        let fallos = 0, faltan = letras.filter(esLetra).length, fin = false;

        ctrl.pregunta("🔤 ¿Cómo se escribe en inglés? Toca las letras 👇");
        host.innerHTML =
          '<div class="ahor-zona">' + DIBUJO +
            '<div class="ahor-info">' +
              '<div class="ahor-emoji">' + esc(p.emoji || "🍎") + "</div>" +
              '<div class="ahor-es">' + (verEs ? esc(p.es) : "¿…?") + "</div>" +
              '<div class="ahor-vidas"></div>' +
              '<button class="ahor-audio oculto" type="button" title="Escuchar en inglés">🔊 Escuchar</button>' +
            "</div>" +
          "</div>" +
          '<div class="ahor-palabra"></div>' +
          '<div class="ahor-teclado"></div>';

        const elPal = host.querySelector(".ahor-palabra");
        const celdas = letras.map((c) => {
          const s = document.createElement("span");
          s.className = esLetra(c) ? "ahor-letra" : "ahor-letra ahor-hueco";
          s.textContent = esLetra(c) ? "" : (c === " " ? "" : c);
          elPal.appendChild(s); return s;
        });
        const elVidas = host.querySelector(".ahor-vidas");
        const partes = host.querySelectorAll(".ahor-parte");
        const audio = host.querySelector(".ahor-audio");
        audio.onclick = () => hablarEn(palabra);
        function pintarVidas() {
          let s = ""; for (let k = 0; k < vidas; k++) s += k < vidas - fallos ? "❤️" : "🤍";
          elVidas.textContent = s;
        }
        pintarVidas();

        const teclas = {};
        const elTec = host.querySelector(".ahor-teclado");
        ABC.forEach((L) => {
          const b = document.createElement("button");
          b.className = "ahor-tecla"; b.type = "button"; b.textContent = L;
          b.onclick = () => probar(L);
          teclas[L] = b; elTec.appendChild(b);
        });

        function cerrar() {
          fin = true;
          if (quitarTeclas) quitarTeclas();
          ABC.forEach((L) => { teclas[L].disabled = true; });
          audio.classList.remove("oculto");
        }
        function probar(L, gratis) {
          if (fin) return;
          const b = teclas[L]; if (!b || b.disabled) return;
          b.disabled = true;
          const pos = []; letras.forEach((c, k) => { if (c === L) pos.push(k); });
          if (pos.length) {
            b.classList.add(gratis ? "pista" : "ok");
            pos.forEach((k) => { celdas[k].textContent = L; celdas[k].classList.add("puesta"); });
            faltan -= pos.length;
            if (faltan <= 0) {
              cerrar(); hablarEn(palabra);
              ctrl.ganar(2300);
              ctrl.retro("🎉 <b>" + esc(palabra) + "</b> = " + esc(p.es) + " — escúchala 🔊", "bien");
            } else if (!gratis) {
              ctrl.retro("¡Sí! Hay " + pos.length + " «" + L + "» 🎉", "bien");
            }
          } else {
            b.classList.add("mal");
            fallos++; pintarVidas();
            if (partes[fallos - 1]) partes[fallos - 1].classList.add("on");
            if (fallos >= vidas) {
              letras.forEach((c, k) => { if (esLetra(c) && !celdas[k].textContent) { celdas[k].textContent = c; celdas[k].classList.add("revelada"); } });
              cerrar(); hablarEn(palabra);
              ctrl.fallar("Era <b>" + esc(palabra) + "</b> = " + esc(p.es) + " 👀", 3000);
            } else {
              ctrl.reintento("La «" + L + "» no está. Te quedan " + (vidas - fallos) + " ❤️");
            }
          }
        }

        // También se puede jugar con el teclado real de la compu.
        const caja = host.closest ? host.closest(".caja-juego") : null;
        function alTeclear(e) {
          if (e.ctrlKey || e.altKey || e.metaKey) return;
          if (caja && caja.classList.contains("oculto")) return;   // se salió al selector
          const L = String(e.key || "").toUpperCase();
          if (L.length === 1 && esLetra(L)) { e.preventDefault(); probar(L); }
        }
        document.addEventListener("keydown", alTeclear);
        quitarTeclas = function () { document.removeEventListener("keydown", alTeclear); quitarTeclas = null; };

        // Regalo inicial: unas letras ya puestas (más en básico, ninguna en avanzado).
        const nPistas = Juego.porNivel(t.pistas || [2, 1, 0]) || 0;
        const unicas = ctrl.mezclar(letras.filter(esLetra).filter((c, k, a) => a.indexOf(c) === k));
        unicas.slice(0, Math.min(nPistas, Math.max(0, unicas.length - 1))).forEach((L) => probar(L, true));
      };
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
      icono: t.icono, nombre: t.nombre, desc: t.desc, total: t.total || 6, ronda: BUILDERS[t.tipo](t, C)
    }));
    return Actividad(px, temas);
  }

  return { montar };
})();
