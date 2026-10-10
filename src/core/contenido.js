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
          | ahorcado (Inglés) | lectura (comprensión lectora) | (motor mc:) mc
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
  /* Barajas: cada banco se reparte como un mazo barajado, así una pregunta no
     vuelve a salir hasta que hayan pasado todas las demás (antes se elegía al azar
     con repetición y la misma podía salir dos veces seguidas). */
  const MAZOS = new Map();          // arreglo del banco -> { cola, ultimo }
  function sacar(banco) {
    if (!banco || !banco.length) return undefined;
    let m = MAZOS.get(banco);
    if (!m) { m = { cola: [], ultimo: undefined }; MAZOS.set(banco, m); }
    if (!m.cola.length) {
      m.cola = Juego.mezclar(banco.slice());
      // que al rebarajar no repita justo la última que salió
      if (m.cola.length > 1 && m.cola[m.cola.length - 1] === m.ultimo) m.cola.unshift(m.cola.pop());
    }
    m.ultimo = m.cola.pop();
    return m.ultimo;
  }
  // Siguiente ítem del nivel (con fallback al nivel inferior), sin repetir.
  function itemDe(niveles, niv) { return sacar(nivelArr(niveles, niv)); }
  // Parte un párrafo en oraciones sin perder ni un carácter (para tocarlas o iluminarlas).
  function oraciones(p) {
    const out = [], re = /[.!?…]+["»”)]*\s+/g;
    let ini = 0, corte;
    p = String(p);
    while ((corte = re.exec(p))) { out.push(p.slice(ini, corte.index + corte[0].length)); ini = corte.index + corte[0].length; }
    if (ini < p.length) out.push(p.slice(ini));
    return out;
  }

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

  const VF_LADOS = new Map();       // banco de V/F -> { v:[verdaderas], f:[falsas] }

  /* Clasificar soltando cada ficha SOBRE la parte que corresponde de un dibujo SVG
     (grupos data-parte) o de un modelo 3D. { dibujo: { modelo?, svg } } y los id de
     las cestas deben ser los id de las partes. */
  function sobreDibujo(t, host, ctrl, cestas, items) {
    ctrl.pregunta(t.pregunta || "Arrastra cada ficha a su parte 👇");
    const meta = {}; cestas.forEach((c) => (meta[c.id] = c));
    host.innerHTML = '<div class="dib-zona"><div class="dib-dibujo"></div><div class="dib-lado"><div class="fila-fichas"></div><div class="dib-hechas"></div></div></div>';
    const marco = host.querySelector(".dib-dibujo"), fila = host.querySelector(".fila-fichas"), hechas = host.querySelector(".dib-hechas");
    let m = null, zonas;
    if (t.dibujo.modelo && window.Modelo3D && Modelo3D.disponible(t.dibujo.modelo)) {
      m = ctrl.memo.m3d;
      if (m) { marco.appendChild(m.el); m.limpiarEtiquetas(); m.apagar(); }
      else {
        m = ctrl.memo.m3d = Modelo3D.crear(marco, t.dibujo.modelo, { clase: "compacto", pista: "🔄 Gírala · suelta cada ficha en su parte" });
        ctrl.alTerminar(() => m.destruir());
      }
      m.alTocar = null;
      zonas = [m.el];
    } else {
      marco.innerHTML = '<div class="sen-mapa compacto">' + t.dibujo.svg + "</div>";
      zonas = Array.prototype.slice.call(marco.querySelectorAll("[data-parte]"));
      zonas.forEach((z) => z.classList.add("parte"));
    }
    function destello(id, tipo) {
      if (m) { m.resaltar(id, tipo); return; }
      zonas.forEach((z) => { if (z.getAttribute("data-parte") === id) { z.classList.add(tipo); setTimeout(() => z.classList.remove(tipo), 800); } });
    }
    let faltan = items.length;
    items.forEach((it) => {
      const chip = document.createElement("button");
      chip.className = "ficha-arr"; chip.textContent = it.txt;
      fila.appendChild(chip);
      Arrastrar.hacer(chip, zonas, (item, zona, ev) => {
        if (m) m.sobre(null);
        if (!zona) return;
        let id, cerca = [];
        if (m) { id = m.parteEn(ev.clientX, ev.clientY); cerca = m.partesCerca(ev.clientX, ev.clientY, 16); }
        else id = zona.getAttribute("data-parte");
        if (!id && !cerca.length) return;                     // cayó en el fondo: no cuenta
        if (id === it.cesta || cerca.indexOf(it.cesta) >= 0) {
          destello(it.cesta, "ok");
          item.remove();
          const d = document.createElement("div");
          d.className = "dib-hecha";
          d.innerHTML = (meta[it.cesta].emoji || "✅") + " <b>" + esc(meta[it.cesta].nombre) + ":</b> " + esc(it.txt);
          hechas.appendChild(d);
          faltan--;
          if (faltan === 0) ctrl.ganar(1500); else ctrl.retro("¡Bien! Faltan " + faltan + " 👇", "bien");
        } else {
          const tocada = id || cerca[0];
          destello(tocada, "mal");
          ctrl.reintento(meta[tocada] ? "Eso es <b>" + esc(meta[tocada].nombre) + "</b>. ¿Qué parte hace ese trabajo? 👀" : "Ahí no. ¿Qué parte hace ese trabajo? 👀");
        }
      }, { alMover: (ev) => { if (m) m.sobre(m.parteEn(ev.clientX, ev.clientY)); } });
    });
  }

  /* ---------------- Builders por tipo de juego ---------------- */
  const BUILDERS = {
    // Arrastrar cada ficha a su cesta. Salen MÁS fichas que cestas y repartidas al
    // azar (una cesta puede recibir dos o ninguna): así no se resuelve por descarte.
    // { cestas:[{id,nombre,emoji}], cestasPorNivel?, items:{id:[b,i,a]}, fichas?:[b,i,a] }
    clasificar: (t) => (host, ctrl) => {
      const niv = Juego.nivelIdx();
      const ids = t.cestasPorNivel ? Juego.porNivel(t.cestasPorNivel) : t.cestas.map((c) => c.id);
      const meta = {}; t.cestas.forEach((c) => (meta[c.id] = c));
      const cestas = ids.map((id) => meta[id]);
      const n = t.fichas ? Juego.porNivel(t.fichas) : Math.min(6, Math.max(4, ids.length + 1));
      const tope = Math.max(2, Math.ceil(n / ids.length) + 1);     // máximo de fichas por cesta
      const cuenta = {}, usados = {}, items = [];
      let intentos = 0;
      while (items.length < n && intentos++ < 80) {
        const id = ctrl.azarEl(ids);
        if ((cuenta[id] || 0) >= tope) continue;
        const txt = itemDe(t.items[id], niv);
        if (txt == null || usados[txt]) continue;
        usados[txt] = 1; cuenta[id] = (cuenta[id] || 0) + 1;
        items.push({ txt: txt, cesta: id });
      }
      // Con "dibujo", las cestas son las PARTES de un dibujo o modelo 3D: la ficha se
      // suelta sobre la raíz, la hoja, el corazón… (manipular > elegir).
      if (t.dibujo) { sobreDibujo(t, host, ctrl, cestas, items); return; }
      Arrastrar.clasificar(host, ctrl, { pregunta: t.pregunta, cestas: cestas, items: items });
    },
    // Unir parejas (izquierda↔derecha). Toma un SUBCONJUNTO al azar del banco del
    // nivel (por defecto 3/4/5 parejas por ronda; configurable con "porRonda").
    emparejar: (t) => (host, ctrl) => {
      const pool = nivelArr(t.pares, Juego.nivelIdx());
      const n = Math.min(Juego.porNivel(t.porRonda || [3, 4, 5]), pool.length);
      // Primero parejas con respuestas distintas a la derecha; si no alcanzan, se
      // completan con repetidas (el motor las acepta por texto).
      // Tampoco salen juntas dos parejas donde la respuesta de una es la palabra de la
      // otra ("poblamiento → asentamiento" con "asentamiento → poblado"): confundiría.
      const vistos = {}, pares = [], resto = [];
      const choca = (p) => pares.some((q) => norm(q.a) === norm(p.b) || norm(q.b) === norm(p.a));
      ctrl.mezclar(pool.slice()).forEach((p) => {
        if (pares.length < n && !vistos[p.b] && !choca(p)) { vistos[p.b] = 1; pares.push({ a: p.a, b: p.b }); }
        else resto.push({ a: p.a, b: p.b });
      });
      resto.forEach((p) => { if (pares.length < n && !choca(p)) pares.push(p); });
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
      // Orden del alfabeto español: sin fijarse en tildes, pero con la ñ DESPUÉS de la n
      // (con norm() la ñ se volvía n, y "piña" quedaba antes que "pino").
      const correcto = grupo.slice().sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
      Arrastrar.ordenar(host, ctrl, { pregunta: t.pregunta || "Toca las palabras en orden alfabético (A → Z) 👇", correcto: correcto });
    },
    // ¿Verdadero o falso?  (concepto)
    // Se sortea primero si toca una verdadera o una falsa (50/50) y luego la
    // afirmación: así "decir siempre Verdadero" no funciona aunque el banco tenga
    // más verdaderas que falsas.
    vf: (t) => (host, ctrl) => {
      const banco = nivelArr(t.preguntas, Juego.nivelIdx());
      let lados = VF_LADOS.get(banco);
      if (!lados) { lados = { v: banco.filter((x) => x.c === true), f: banco.filter((x) => x.c === false) }; VF_LADOS.set(banco, lados); }
      const quiere = Math.random() < 0.5 ? lados.v : lados.f;
      const q = sacar(quiere.length ? quiere : banco);
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
      host.innerHTML = '<div class="signo-frase"><span class="signo-abre"></span>' + esc(q.antes) + '<span class="signo-hueco">▢</span>' + esc(q.despues) + '</div><div class="ord-fuente"></div>';
      const cont = host.querySelector(".ord-fuente");
      // En español ? y ! van en pareja: al acertar el de cierre aparece también el de apertura.
      const pareja = { "?": "¿", "!": "¡" }[q.correcto];
      ctrl.mezclar(q.opciones.slice()).forEach((op) => {
        const b = document.createElement("button");
        b.className = "ord-chip"; b.textContent = op;
        b.onclick = () => {
          if (op === q.correcto) {
            const h = host.querySelector(".signo-hueco"); h.textContent = op; h.classList.add("signo-ok");
            if (pareja && q.antes.indexOf(pareja) < 0) {
              const a = host.querySelector(".signo-abre"); a.textContent = pareja; a.classList.add("signo-ok");
            }
            ctrl.ganar();
          } else ctrl.reintento(t.pista || "Ese no; fíjate en la entonación 👀");
        };
        cont.appendChild(b);
      });
    },
    // Cambia la palabra (diminutivo/aumentativo/género-número): elige la forma correcta.
    formas: (t) => (host, ctrl) => {
      const q = itemDe(t.items, Juego.nivelIdx());
      ctrl.pregunta((q.instr || "Cambia la palabra") + ": <b>" + esc(q.base) + "</b>");
      const ops = ctrl.mezclar(q.opciones.slice()).map((o) => ({ txt: o, ok: o === q.correcto }));
      pintarBotones(host, ops, (et) => { if (et.ok) ctrl.ganar(); else ctrl.reintento(t.pista || "Casi; fíjate en la terminación 👀"); });
    },
    // Escena: arrastrar fichas a sus zonas (sobre un SVG con posiciones, o en fila).
    // { escena?, slots:[{id,txt?,left?,top?}], fichas:[{id,txt?,ficha?}] }
    escena: (t) => (host, ctrl) => {
      ctrl.pregunta(t.pregunta || "Arrastra cada ficha a su lugar 👇");
      const slots = t.slots || [], fichas = t.fichas || [];
      const abs = slots.some((s) => s.left != null);
      // Con WebGL y "modelo": las casillas "?" flotan sobre una maqueta 3D animada y,
      // al acertar una, esa etapa se anima más fuerte (el material responde).
      const m3d = t.modelo && window.Modelo3D && Modelo3D.disponible(t.modelo);
      if (m3d) {
        host.innerHTML = '<div class="zona-arrastre con-modelo"></div><div class="fila-fichas"></div>';
        let m = ctrl.memo.m3d;
        const marco = host.querySelector(".con-modelo");
        if (m) { marco.appendChild(m.el); m.limpiarAnclados(); }
        else { m = ctrl.memo.m3d = Modelo3D.crear(marco, t.modelo, { pista: "" }); ctrl.alTerminar(() => m.destruir()); }
        const zonasM = slots.map((s) => {
          const d = document.createElement("div");
          d.className = "slot"; d.dataset.id = s.id; d.innerHTML = '<span class="slot-q">?</span>';
          return m.anclar(d, s.id);
        });
        let quedan = slots.length;
        ctrl.mezclar(fichas.slice()).forEach((fi) => {
          const chip = document.createElement("button");
          chip.className = "ficha-arr"; chip.textContent = fi.ficha || fi.txt; chip.dataset.id = fi.id;
          host.querySelector(".fila-fichas").appendChild(chip);
          Arrastrar.hacer(chip, zonasM, (item, zona) => {
            if (!zona || zona.dataset.lleno === "1") return;
            if (zona.dataset.id === item.dataset.id) {
              zona.dataset.lleno = "1"; zona.classList.add("ok"); zona.textContent = item.textContent;
              item.remove();
              m.activar(zona.dataset.id);
              quedan--; if (quedan === 0) ctrl.ganar(2400); else ctrl.retro("¡Bien! Faltan " + quedan + " 👇", "bien");
            } else { zona.classList.add("rojo"); setTimeout(() => zona.classList.remove("rojo"), 450); ctrl.reintento("Ahí no. Mira bien qué hace el agua en ese lugar 👀"); }
          });
        });
        return;
      }
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
      const parte = sacar(t.partes);
      // "¿Dónde ESTÁN las rodillas?" / "¿Dónde ESTÁ la raíz?" (el nombre trae su artículo).
      const plural = /^(los|las)\s/i.test(parte.nombre);
      ctrl.pregunta("¿Dónde " + (plural ? "están" : "está") + " <b>" + esc(parte.nombre) + "</b>? 👆");
      const nombreDe = (id) => { const p = t.partes.find((x) => x.id === id); return p ? p.nombre : ""; };
      // El error es información: se le dice QUÉ tocó, no solo que falló.
      const casi = (id) => {
        const n = nombreDe(id), art = (n.split(" ")[0] || "").toLowerCase();
        const dem = { el: "Ese es", la: "Esa es", los: "Esos son", las: "Esas son" }[art] || "Eso es";
        return dem + " <b>" + esc(n) + "</b>. Busca <b>" + esc(parte.nombre) + "</b> 👀";
      };

      // Con WebGL: el modelo 3D (se gira con el dedo y cada parte se ilumina).
      if (t.modelo && window.Modelo3D && Modelo3D.disponible(t.modelo)) {
        let m = ctrl.memo.m3d;
        if (m) { host.appendChild(m.el); m.limpiarEtiquetas(); m.apagar(); }      // el mismo modelo sirve para toda la ronda
        else { m = ctrl.memo.m3d = Modelo3D.crear(host, t.modelo); ctrl.alTerminar(() => m.destruir()); }
        m.alTocar = (id, cerca) => {
          // Vale si tocó la parte o quedó pegadito a ella (dedos pequeños, piezas finas).
          if (id === parte.id || (cerca || []).indexOf(parte.id) >= 0) {
            m.resaltar(parte.id, "ok", true); m.etiquetar(parte.id, parte.nombre, "ok"); ctrl.ganar(1700);
          } else if (id) { m.resaltar(id, "mal"); ctrl.reintento(casi(id)); }
        };
        return;
      }

      // Sin WebGL (o temas sin modelo): el dibujo SVG.
      host.innerHTML = '<div class="sen-mapa">' + t.svg + "</div>";
      host.querySelectorAll("[data-parte]").forEach((el) => {
        el.classList.add("parte");
        el.addEventListener("click", () => {
          const id = el.getAttribute("data-parte");
          if (id === parte.id) {
            host.querySelectorAll('[data-parte="' + parte.id + '"]').forEach((e) => e.classList.add("ok"));
            ctrl.ganar(1400);
          } else { el.classList.add("mal"); setTimeout(() => el.classList.remove("mal"), 700); ctrl.reintento(casi(id)); }
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
    // Términos de la suma/resta/multiplicación (Mate, paramétrico): genera la operación
    // según rangos por nivel y arrastra cada nombre a su número.
    // { suma:bool | op:"mult", rangos:[[b],[i],[a]], rangosB?:[[b],[i],[a]] (2.º factor), factores?:bool }
    terminos: (t) => (host, ctrl) => {
      const rg = Juego.porNivel(t.rangos || [[2, 20], [20, 200], [200, 2000]]);
      const op = t.op || (t.suma ? "suma" : "resta");
      const rb = op === "mult" ? Juego.porNivel(t.rangosB || [[2, 9], [2, 9], [11, 99]]) : rg;
      let a = ctrl.azar(rg[0], rg[1]), b = ctrl.azar(rb[0], rb[1]);
      if (op === "resta" && a < b) { const x = a; a = b; b = x; }
      const c = op === "suma" ? a + b : op === "mult" ? a * b : a - b;
      const signo = { suma: "+", resta: "−", mult: "×" }[op];
      const etiquetas = op === "suma" ? ["sumando", "sumando", "suma"]
        : op === "mult" ? (t.factores ? ["factor", "factor", "producto"] : ["multiplicando", "multiplicador", "producto"])
        : ["minuendo", "sustraendo", "diferencia"];
      const partes = [a, b, c].map((n, k) => ({ n: n, rol: etiquetas[k] }));
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
        ctrl.alSalir(() => { if (quitarTeclas) quitarTeclas(); });

        // Regalo inicial: unas letras ya puestas (más en básico, ninguna en avanzado).
        const nPistas = Juego.porNivel(t.pistas || [2, 1, 0]) || 0;
        const unicas = ctrl.mezclar(letras.filter(esLetra).filter((c, k, a) => a.indexOf(c) === k));
        unicas.slice(0, Math.min(nPistas, Math.max(0, unicas.length - 1))).forEach((L) => probar(L, true));
      };
    },
    // Comprensión lectora: se lee UN texto, que queda siempre a la vista, y se responden sus
    // preguntas una por una (una sesión = un texto). Tres clases de pregunta:
    //   { q, c, d:[…], pista? }  elegir la respuesta (pista = trozo del texto que la sostiene)
    //   { q, toca }              tocar en el texto la oración que lo dice (toca = trozo de esa oración)
    //   { q, ordena:[…] }        ordenar lo que pasó
    // Si el niño falla, el propio texto ayuda: se ilumina la oración de la pista.
    // { lecturas:[[{titulo, clase?, texto:[párrafos], preguntas:[…]}],[i],[a]] }
    lectura: (t) => (host, ctrl) => {
      const m = ctrl.memo;                       // se vacía al entrar al tema: siempre arranca un texto nuevo
      if (!m.pend || !m.pend.length) { m.lec = itemDe(t.lecturas, Juego.nivelIdx()); m.pend = m.lec.preguntas.slice(); m.n = 0; }
      const lec = m.lec, q = m.pend.shift();
      m.n++;
      // La caja se ensancha para que quepan el texto y la pregunta lado a lado.
      const caja = host.closest ? host.closest(".caja-juego") : null;
      // (y la mascota se achica: ver body.act-ancha en efectos.css)
      if (caja && !m.ancha) {
        m.ancha = true;
        caja.classList.add("caja-ancha"); document.body.classList.add("act-ancha");
        ctrl.alTerminar(() => { caja.classList.remove("caja-ancha"); document.body.classList.remove("act-ancha"); });
      }

      let k = 0;
      const cuerpo = [].concat(lec.texto).map((p) =>
        "<p>" + oraciones(p).map((o) => '<span class="lec-or" data-k="' + (k++) + '">' + esc(o) + "</span>").join("") + "</p>").join("");
      ctrl.pregunta("📖 Lee el texto y responde");
      host.innerHTML =
        '<div class="lec-zona">' +
          '<article class="lec-texto">' +
            (lec.clase ? '<span class="lec-clase">' + esc(lec.clase) + "</span>" : "") +
            '<h3 class="lec-titulo">' + esc(lec.titulo || "") + "</h3>" + cuerpo +
          "</article>" +
          '<div class="lec-lado">' +
            '<p class="lec-n">Pregunta ' + m.n + " de " + lec.preguntas.length + "</p>" +
            '<p class="lec-q">' + esc(q.q) + "</p>" +
            '<div class="lec-resp"></div>' +
          "</div>" +
        "</div>";
      const zona = host.querySelector(".lec-zona"), resp = host.querySelector(".lec-resp");
      const ors = Array.prototype.slice.call(host.querySelectorAll(".lec-or"));
      const dice = (el, trozo) => norm(el.textContent).indexOf(norm(trozo)) >= 0;
      // Ilumina en el texto la oración que contiene `trozo` y la trae a la vista.
      function marcar(trozo, clase) {
        if (!trozo) return;
        ors.forEach((el) => {
          if (!dice(el, trozo)) return;
          el.classList.add(clase);
          if (el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
        });
      }
      let listo = false;

      if (q.ordena) {
        Arrastrar.ordenar(resp, ctrl, { pregunta: "📖 Lee el texto y responde", correcto: q.ordena.slice() });
        return;
      }
      if (q.toca) {
        resp.innerHTML = '<p class="lec-ayuda">👆 Búscala en el texto y tócala</p>';
        zona.classList.add("tocando");
        ors.forEach((el) => {
          el.onclick = () => {
            if (listo) return;
            if (dice(el, q.toca)) { listo = true; zona.classList.remove("tocando"); el.classList.add("ok"); ctrl.ganar(1400); }
            else { el.classList.add("mal"); setTimeout(() => el.classList.remove("mal"), 500); ctrl.reintento("Esa oración no lo dice. Sigue buscando 👀"); }
          };
        });
        return;
      }
      ctrl.mezclar([q.c].concat(q.d)).forEach((o) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "lec-op"; b.textContent = o;
        b.onclick = () => {
          if (listo) return;
          if (o === q.c) {
            listo = true; b.classList.add("ok");
            ors.forEach((el) => el.classList.remove("pista"));
            marcar(q.pista, "ok");
            ctrl.ganar(1400);
          } else {
            b.classList.add("mal"); b.disabled = true;
            marcar(q.pista, "pista");
            ctrl.reintento(q.pista ? "Mira la parte del texto que se iluminó 👀" : "Vuelve a leer con calma 👀");
          }
        };
        resp.appendChild(b);
      });
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
      return [function () { const x = sacar(t.banco); return mcPregunta(t.nombre, x.p, x.c, x.d, x.pista); }];
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
