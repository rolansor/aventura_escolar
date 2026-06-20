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

  return { hacer, clasificar };
})();
