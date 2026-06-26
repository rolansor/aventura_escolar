/* ============================================================
   ARRASTRAR — src/core/arrastrar.js  (global: window.Arrastrar)
   Ayudante para "arrastrar y soltar" con eventos de PUNTERO, así
   funciona igual con mouse y con el dedo (tablet). Sin librerías.

   Arrastrar.hacer(item, zonas, alSoltar)
     - item: elemento que se arrastra.
     - zonas: arreglo de elementos "destino" (drop). Mientras se arrastra,
       la zona bajo el dedo recibe la clase .zona-hover.
     - alSoltar(item, zona): se llama al soltar; `zona` es el destino
       (o null si se soltó fuera). El item vuelve a su sitio salvo que
       quien escucha decida moverlo.
   ============================================================ */
window.Arrastrar = (function () {

  function hacer(item, zonas, alSoltar) {
    zonas = zonas || [];
    item.style.touchAction = "none";       // evita el scroll del navegador al arrastrar
    item.classList.add("arrastrable");

    item.addEventListener("pointerdown", function (e) {
      if (item.dataset.fijo === "1") return;   // ya colocado: no se mueve más
      e.preventDefault();
      const r = item.getBoundingClientRect();
      const dx = e.clientX - r.left, dy = e.clientY - r.top;
      const prev = { pos: item.style.position, left: item.style.left, top: item.style.top,
                     z: item.style.zIndex, w: item.style.width, h: item.style.height };
      try { item.setPointerCapture(e.pointerId); } catch (_) {}
      item.classList.add("arrastrando");
      item.style.position = "fixed";
      item.style.width = r.width + "px";
      item.style.height = r.height + "px";
      item.style.left = r.left + "px";
      item.style.top = r.top + "px";
      item.style.zIndex = "9999";

      function zonaBajo(ev) {
        const vis = item.style.visibility;
        item.style.visibility = "hidden";
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        item.style.visibility = vis;
        for (const z of zonas) { if (z === el || z.contains(el)) return z; }
        return null;
      }
      function mover(ev) {
        item.style.left = (ev.clientX - dx) + "px";
        item.style.top = (ev.clientY - dy) + "px";
        const z = zonaBajo(ev);
        zonas.forEach((q) => q.classList.toggle("zona-hover", q === z));
      }
      function soltar(ev) {
        item.removeEventListener("pointermove", mover);
        item.removeEventListener("pointerup", soltar);
        item.removeEventListener("pointercancel", soltar);
        try { item.releasePointerCapture(e.pointerId); } catch (_) {}
        item.classList.remove("arrastrando");
        zonas.forEach((q) => q.classList.remove("zona-hover"));
        const z = zonaBajo(ev);
        // devolver el item a su estilo original (quien escucha decide si lo recoloca)
        item.style.position = prev.pos; item.style.left = prev.left; item.style.top = prev.top;
        item.style.zIndex = prev.z; item.style.width = prev.w; item.style.height = prev.h;
        if (alSoltar) alSoltar(item, z);
      }
      item.addEventListener("pointermove", mover);
      item.addEventListener("pointerup", soltar);
      item.addEventListener("pointercancel", soltar);
    });
  }

  // Actividad "clasifica en cestas": arrastra cada ficha a su grupo correcto.
  // opts = { pregunta, cestas:[{id,nombre,emoji?}], items:[{txt,cesta}] }
  // Pensada para usarse dentro de una ronda() del motor Actividad (ctrl).
  function clasificar(host, ctrl, opts) {
    ctrl.pregunta(opts.pregunta || "Arrastra cada uno a su grupo 👇");
    host.innerHTML =
      '<div class="cestas">' + opts.cestas.map((c) =>
        '<div class="cesta" data-id="' + c.id + '"><span class="cesta-ic">' + (c.emoji || "📦") + "</span>" +
        '<span class="cesta-nom">' + c.nombre + '</span><div class="cesta-caidas"></div></div>').join("") + "</div>" +
      '<div class="fila-fichas"></div>';
    const fila = host.querySelector(".fila-fichas");
    const zonas = Array.prototype.slice.call(host.querySelectorAll(".cesta"));
    let faltan = opts.items.length;
    opts.items.forEach((it) => {
      const chip = document.createElement("button");
      chip.className = "ficha-arr"; chip.textContent = it.txt; chip.dataset.cesta = it.cesta;
      fila.appendChild(chip);
      hacer(chip, zonas, (item, zona) => {
        if (!zona) return;
        if (zona.dataset.id === item.dataset.cesta) {
          item.dataset.fijo = "1"; item.classList.add("colocada");
          zona.querySelector(".cesta-caidas").appendChild(item);
          zona.classList.add("ok"); setTimeout(() => zona.classList.remove("ok"), 600);
          faltan--;
          if (faltan === 0) ctrl.ganar(); else ctrl.retro("¡Bien! Faltan " + faltan + " 👇", "bien");
        } else {
          zona.classList.add("rojo"); setTimeout(() => zona.classList.remove("rojo"), 450);
          ctrl.reintento("Ahí no va, prueba en otra 👀");
        }
      });
    });
  }

  // Actividad "une las parejas": dos columnas, se toca una de la izquierda
  // y luego su pareja de la derecha. opts = { pregunta, pares:[{a,b}] }
  // Pensada para una ronda() del motor Actividad (ctrl). Toque (no arrastre),
  // así es fácil con el dedo.
  function emparejar(host, ctrl, opts) {
    ctrl.pregunta(opts.pregunta || "Une cada pareja 👇");
    const pares = opts.pares || [];
    const izq = ctrl.mezclar(pares.map((p, i) => ({ t: p.a, k: i })));
    const der = ctrl.mezclar(pares.map((p, i) => ({ t: p.b, k: i })));
    host.innerHTML = '<div class="emp-cols"><div class="emp-col emp-izq"></div><div class="emp-col emp-der"></div></div>';
    const colI = host.querySelector(".emp-izq"), colD = host.querySelector(".emp-der");
    let sel = null, faltan = pares.length;
    function limpiarSel() { if (sel) { sel.classList.remove("sel"); sel = null; } }
    function botones(col, lista, lado) {
      lista.forEach((o) => {
        const b = document.createElement("button");
        b.className = "emp-item"; b.textContent = o.t; b.dataset.k = o.k; b.dataset.lado = lado;
        b.onclick = () => elegir(b);
        col.appendChild(b);
      });
    }
    function elegir(b) {
      if (b.disabled) return;
      if (b.dataset.lado === "izq") { limpiarSel(); sel = b; b.classList.add("sel"); return; }
      if (!sel) { ctrl.reintento("Primero toca una palabra de la izquierda 👈"); return; }
      if (b.dataset.k === sel.dataset.k) {
        b.classList.add("ok"); sel.classList.add("ok"); b.disabled = true; sel.disabled = true;
        limpiarSel(); faltan--;
        if (faltan === 0) ctrl.ganar(); else ctrl.retro("¡Bien! Faltan " + faltan + " 👇", "bien");
      } else {
        b.classList.add("rojo"); setTimeout(() => b.classList.remove("rojo"), 420);
        limpiarSel(); ctrl.reintento("Esas no son pareja, prueba otra 👀");
      }
    }
    botones(colI, izq, "izq"); botones(colD, der, "der");
  }

  // Actividad "ponlas en orden": fichas desordenadas que se tocan en el orden
  // correcto (armar la oración / orden alfabético / sílabas). opts =
  // { pregunta, correcto:[..en orden..] }. Pensada para una ronda() de Actividad.
  function ordenar(host, ctrl, opts) {
    ctrl.pregunta(opts.pregunta || "Tócalas en el orden correcto 👇");
    const correcto = opts.correcto || [];
    const fuenteArr = ctrl.mezclar(correcto.map((t, i) => ({ t: t, i: i })));
    host.innerHTML = '<div class="ord-destino" id="ord-dest"></div><div class="ord-fuente" id="ord-fuente"></div>';
    const dest = host.querySelector(".ord-destino"), fuente = host.querySelector(".ord-fuente");
    let puestos = [];
    function pintarFuente() {
      fuente.innerHTML = "";
      fuenteArr.forEach((o) => {
        if (puestos.includes(o)) return;
        const b = document.createElement("button");
        b.className = "ord-chip"; b.textContent = o.t; b.onclick = () => poner(o);
        fuente.appendChild(b);
      });
    }
    function pintarDest() {
      dest.innerHTML = "";
      puestos.forEach((o) => {
        const b = document.createElement("button");
        b.className = "ord-chip puesto"; b.textContent = o.t; b.onclick = () => quitar(o);
        dest.appendChild(b);
      });
    }
    function poner(o) { puestos.push(o); pintarDest(); pintarFuente(); if (puestos.length === correcto.length) revisar(); }
    function quitar(o) { puestos = puestos.filter((x) => x !== o); pintarDest(); pintarFuente(); }
    function revisar() {
      const bien = puestos.every((o, idx) => o.i === idx);
      if (bien) { dest.querySelectorAll(".ord-chip").forEach((c) => c.classList.add("ok")); ctrl.ganar(); }
      else { dest.querySelectorAll(".ord-chip").forEach((c) => c.classList.add("rojo")); ctrl.reintento("Ese orden aún no; quita alguna y prueba 👀"); }
    }
    pintarFuente();
  }

  return { hacer, clasificar, emparejar, ordenar };
})();
