/* ============================================================
   MODO MAPA POR CANTONES — Estudios Sociales (GeoJSON + 3D)
   Renderiza window.ECUADOR_CANTONES (GADM nivel 2).
   - Hover: resalta la provincia (sin tooltip).
   - Clic: abre el "foco" -> la provincia en 3D (three.js, rotable)
     al centro y, a la derecha, sus datos (nombre, bandera, capital
     y la lista de cantones).
   - Sin leyenda de regiones.
   ============================================================ */

const MapaCantones = (function () {
  const REGIONES = {
    costa:   { nombre: "Costa",          emoji: "🌴", color: "#ffce54" },
    sierra:  { nombre: "Sierra",         emoji: "⛰️", color: "#a0d468" },
    oriente: { nombre: "Amazonía",       emoji: "🌳", color: "#37bc9b" },
    insular: { nombre: "Región Insular", emoji: "🐢", color: "#4fc1e9" }
  };
  const DET = {
    "EC-A": ["1824", "azuayo/a", "Su capital, Cuenca, es Patrimonio Cultural de la Humanidad."],
    "EC-B": ["1884", "bolivarense", "Guaranda es famosa por su alegre Carnaval."],
    "EC-F": ["1880", "cañari", "En Cañar está Ingapirca, las ruinas incas más importantes del país."],
    "EC-C": ["1880", "carchense", "Limita con Colombia; en Tulcán hay un cementerio con arbustos tallados."],
    "EC-H": ["1824", "chimboracense", "Aquí está el Chimborazo, la montaña más alta del Ecuador."],
    "EC-X": ["1851", "cotopaxense", "El volcán Cotopaxi, de los más activos del mundo, lleva su nombre."],
    "EC-O": ["1884", "orense", "Es la 'capital bananera'; en Machala se hace la Feria Mundial del Banano."],
    "EC-E": ["1847", "esmeraldeño/a", "Tierra de playas, marimba y cultura afroecuatoriana."],
    "EC-W": ["1973", "galapagueño/a", "Sus tortugas gigantes inspiraron a Darwin; Patrimonio Natural de la Humanidad."],
    "EC-G": ["1824", "guayasense", "Guayaquil es el puerto principal y la ciudad más poblada del Ecuador."],
    "EC-I": ["1824", "imbabureño/a", "Llamada 'provincia de los lagos'; Otavalo tiene un famoso mercado."],
    "EC-L": ["1824", "lojano/a", "Loja es la 'capital musical del Ecuador'."],
    "EC-R": ["1860", "riosense", "Tierra agrícola de banano, arroz y cacao, junto a grandes ríos."],
    "EC-M": ["1824", "manabita", "Famosa por sus playas y su comida; el ceviche es típico."],
    "EC-S": ["1953", "morona-santiagués", "Provincia amazónica con selva, cascadas y cultura shuar."],
    "EC-N": ["1959", "napense", "En la Amazonía; el río Napo y la selva son su tesoro."],
    "EC-D": ["1998", "orellanense", "Una de las más jóvenes; puerta al Parque Nacional Yasuní."],
    "EC-Y": ["1959", "pastacense", "La provincia más extensa del Ecuador, llena de selva."],
    "EC-P": ["1824", "pichinchano/a", "Quito fue la primera ciudad Patrimonio Cultural de la Humanidad."],
    "EC-SE": ["2007", "santaelenense", "Provincia joven con playas como Salinas y Montañita."],
    "EC-SD": ["2007", "santodomingueño/a", "Hogar del pueblo Tsáchila."],
    "EC-U": ["1989", "sucumbieño/a", "Provincia amazónica del nororiente, de gran riqueza natural."],
    "EC-T": ["1860", "tungurahuense", "Ambato es la 'ciudad de las flores y las frutas'; cerca está Baños."],
    "EC-Z": ["1953", "zamorano/a", "Donde la Amazonía se une a la montaña; famosa por sus cascadas."]
  };

  const SVGNS = "http://www.w3.org/2000/svg";
  let rendido = false, svgEl = null, datos = null;

  /* ---------- Mapa 2D (selección) ---------- */
  function init() {
    if (rendido) return;
    const cont = document.getElementById("mapac-svg-cont");
    if (!cont) return;
    datos = window.ECUADOR_CANTONES;
    if (!datos || !datos.provincias) {
      cont.innerHTML = '<div class="mapa-falta"><p style="font-size:2.4rem">🗺️</p>' +
        "<p>Falta <code>data/cantones.json</code>.</p></div>";
      return;
    }
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "mapac");
    svg.setAttribute("viewBox", datos.viewBox.join(" "));
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    // En el 2D cada provincia es UNA sola forma (su contorno disuelto): sin cantones.
    datos.provincias.forEach((p) => {
      const path = document.createElementNS(SVGNS, "path");
      path.setAttribute("class", "prov");
      path.dataset.iso = p.iso;
      path.setAttribute("d", p.borde);
      path.setAttribute("fill", REGIONES[p.region].color);
      path.setAttribute("fill-rule", "evenodd");
      path.addEventListener("click", () => abrirFoco(p));
      svg.appendChild(path);
    });
    cont.innerHTML = "";
    cont.appendChild(svg);
    svgEl = svg;
    rendido = true;
  }

  function mostrar() { if (!rendido) init(); cerrarFoco(); }

  /* ---------- Foco: provincia en 3D + datos ---------- */
  function abrirFoco(p) {
    const foco = document.getElementById("mapac-foco");
    const wrap = document.getElementById("mapac-zona");
    const datosEl = document.getElementById("mapac-datos");
    if (!foco || !datosEl) return;
    const r = REGIONES[p.region];
    const det = DET[p.iso] || ["", "", ""];
    const lista = p.cantones.map((c) => c.nombre).sort().join(" · ");
    datosEl.innerHTML =
      '<div class="mapa-det-cab" style="border-color:' + r.color + '">' +
        "<h3>" + esc(p.nombre) + "</h3>" +
        '<button class="mapa-cerrar" id="mapac-cerrar" title="Volver al mapa">✖</button></div>' +
      '<img class="foco-bandera" src="recursos/banderas/' + p.iso + '.svg" alt="" ' +
        "onerror=\"this.style.display='none'\">" +
      "<p>" + r.emoji + " <b>Región:</b> " + esc(r.nombre) + "</p>" +
      "<p>⭐ <b>Capital:</b> " + esc(p.capital) + "</p>" +
      (det[0] ? "<p>📅 <b>Provincialización:</b> " + esc(det[0]) + "</p>" : "") +
      (det[1] ? "<p>🙋 <b>Gentilicio:</b> " + esc(det[1]) + "</p>" : "") +
      "<h4>🏘️ Cantones (" + p.nCantones + ")</h4>" +
      '<p class="mapa-cantones">' + esc(lista) + "</p>";
    document.getElementById("mapac-cerrar").onclick = cerrarFoco;

    if (wrap) wrap.classList.add("oculto");
    foco.classList.remove("oculto");
    construirProvincia3D(p, r.color);
  }

  function cerrarFoco() {
    const foco = document.getElementById("mapac-foco");
    const wrap = document.getElementById("mapac-zona");
    if (foco) foco.classList.add("oculto");
    if (wrap) wrap.classList.remove("oculto");
    ocultarCantonLabel();
    stop3D();
  }
  function enFoco() {
    const foco = document.getElementById("mapac-foco");
    return !!(foco && !foco.classList.contains("oculto"));
  }

  /* ---------- Parseo del contorno (d "Mx yLx y...Z" * n) ---------- */
  function parseRings(d) {
    const rings = [];
    d.split("Z").forEach((seg) => {
      const nums = seg.replace("M", "").split(/[ L]+/).map(Number).filter((n) => !isNaN(n));
      const pts = [];
      for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
      if (pts.length >= 3) rings.push(pts);
    });
    return rings;
  }
  function bboxRings(rings) {
    let mnx = 1e18, mny = 1e18, mxx = -1e18, mxy = -1e18;
    rings.forEach((r) => r.forEach((q) => {
      mnx = Math.min(mnx, q[0]); mny = Math.min(mny, q[1]);
      mxx = Math.max(mxx, q[0]); mxy = Math.max(mxy, q[1]);
    }));
    return [mnx, mny, mxx, mxy];
  }

  /* ---------- 3D con three.js ---------- */
  let R3 = { renderer: null, scene: null, camera: null, mesh: null, raf: null, dragging: false, hovering: false, lx: 0, ly: 0, meshes: [], ray: null, m2: null };

  function construirProvincia3D(p, color) {
    const canvas = document.getElementById("mapac-canvas");
    if (!canvas) return;
    if (!window.THREE) { fallback2D(p, color); return; }
    if (!R3.renderer) init3D(canvas);
    resize3D();
    if (R3.mesh) { R3.scene.remove(R3.mesh); disposeObj(R3.mesh); R3.mesh = null; }

    // Encuadre común (centro/escala de la provincia) para que los cantones encajen.
    const [mnx, mny, mxx, mxy] = bboxRings(parseRings(p.borde));
    const cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2;
    const s = 3 / Math.max(mxx - mnx, mxy - mny, 1);
    const DEP = 0.5, TOP = DEP / 2;

    const grupo = new THREE.Group();
    const cap = new THREE.MeshLambertMaterial({ color: color, side: THREE.DoubleSide });
    const wall = new THREE.MeshLambertMaterial({ color: oscurecer(color, 0.72), side: THREE.DoubleSide });
    const lineMat = new THREE.LineBasicMaterial({ color: 0x2b2b2b });
    R3.meshes = [];

    // Cada CANTÓN es su propio bloque extruido (con su nombre) + su borde arriba.
    p.cantones.forEach((c) => {
      const rings = parseRings(c.d);
      if (!rings.length) return;
      const shapes = rings.map((r) => {
        const sh = new THREE.Shape();
        r.forEach((q, i) => {
          const X = (q[0] - cx) * s, Y = -(q[1] - cy) * s;   // y arriba en three.js
          if (i) sh.lineTo(X, Y); else sh.moveTo(X, Y);
        });
        return sh;
      });
      const geo = new THREE.ExtrudeGeometry(shapes, { depth: DEP, bevelEnabled: false });
      geo.translate(0, 0, -TOP);                 // centrar el grosor en z=0
      const mesh = new THREE.Mesh(geo, [cap, wall]);
      mesh.userData.nombre = c.nombre;
      grupo.add(mesh);
      R3.meshes.push(mesh);
      rings.forEach((r) => {
        const pts = r.map((q) => new THREE.Vector3((q[0] - cx) * s, -(q[1] - cy) * s, TOP + 0.003));
        grupo.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
      });
    });

    grupo.rotation.x = -0.55;
    R3.mesh = grupo;
    R3.scene.add(grupo);
    if (!R3.raf) animate3D();
  }
  function disposeObj(o) { o.traverse(function (c) { if (c.geometry) c.geometry.dispose(); }); }

  function init3D(canvas) {
    R3.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    R3.renderer.setPixelRatio(window.devicePixelRatio || 1);
    R3.scene = new THREE.Scene();
    R3.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    R3.camera.position.set(0, 0, 6.2);
    R3.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const d1 = new THREE.DirectionalLight(0xffffff, 0.6); d1.position.set(3, 5, 6); R3.scene.add(d1);
    const d2 = new THREE.DirectionalLight(0xffffff, 0.25); d2.position.set(-4, -2, 3); R3.scene.add(d2);
    canvas.addEventListener("pointerdown", (e) => {
      R3.dragging = true; R3.lx = e.clientX; R3.ly = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
    });
    R3.ray = new THREE.Raycaster();
    R3.m2 = new THREE.Vector2();
    canvas.addEventListener("pointermove", (e) => {
      if (R3.dragging) {
        if (R3.mesh) {
          R3.mesh.rotation.y += (e.clientX - R3.lx) * 0.01;
          R3.mesh.rotation.x += (e.clientY - R3.ly) * 0.01;
        }
        R3.lx = e.clientX; R3.ly = e.clientY;
        ocultarCantonLabel();
        return;
      }
      // Hover sin arrastrar: detecta el cantón bajo el cursor y muestra su nombre.
      const rect = canvas.getBoundingClientRect();
      R3.m2.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      R3.m2.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      R3.ray.setFromCamera(R3.m2, R3.camera);
      const hits = R3.meshes.length ? R3.ray.intersectObjects(R3.meshes, false) : [];
      if (hits.length) mostrarCantonLabel(hits[0].object.userData.nombre, e);
      else ocultarCantonLabel();
    });
    canvas.addEventListener("pointerenter", () => { R3.hovering = true; });
    canvas.addEventListener("pointerup", () => { R3.dragging = false; });
    canvas.addEventListener("pointerleave", () => { R3.dragging = false; R3.hovering = false; ocultarCantonLabel(); });
  }
  function animate3D() {
    R3.raf = requestAnimationFrame(animate3D);
    if (R3.mesh && !R3.dragging && !R3.hovering) R3.mesh.rotation.y += 0.004;   // autogiro (pausa al señalar)
    if (R3.renderer) R3.renderer.render(R3.scene, R3.camera);
  }
  function stop3D() { if (R3.raf) { cancelAnimationFrame(R3.raf); R3.raf = null; } }
  function resize3D() {
    const c = document.getElementById("mapac-canvas");
    const box = c.parentNode.getBoundingClientRect();
    const w = Math.max(220, box.width), h = Math.max(220, box.height);
    R3.renderer.setSize(w, h, false);
    R3.camera.aspect = w / h; R3.camera.updateProjectionMatrix();
  }
  function oscurecer(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
    return (r << 16) | (g << 8) | b;
  }

  function mostrarCantonLabel(nombre, e) {
    const lab = document.getElementById("mapac-canton-label");
    if (!lab || !nombre) { ocultarCantonLabel(); return; }
    lab.textContent = nombre;
    lab.classList.remove("oculto");
    const box = document.querySelector("#mapac-foco .foco-3d");
    if (box) {
      const rect = box.getBoundingClientRect();
      let x = e.clientX - rect.left + 12, y = e.clientY - rect.top + 12;
      x = Math.min(x, rect.width - lab.offsetWidth - 6);
      y = Math.min(y, rect.height - lab.offsetHeight - 6);
      lab.style.left = Math.max(4, x) + "px";
      lab.style.top = Math.max(4, y) + "px";
    }
  }
  function ocultarCantonLabel() {
    const lab = document.getElementById("mapac-canton-label");
    if (lab) lab.classList.add("oculto");
  }

  // Sin three.js: muestra la provincia como SVG plano (degradación elegante).
  function fallback2D(p, color) {
    const cont = document.querySelector("#mapac-foco .foco-3d");
    if (!cont) return;
    const rings = parseRings(p.borde);
    const [mnx, mny, mxx, mxy] = bboxRings(rings);
    const pad = Math.max(mxx - mnx, mxy - mny) * 0.06;
    let s = '<svg class="foco-svg" viewBox="' + (mnx - pad) + " " + (mny - pad) + " " +
      (mxx - mnx + pad * 2) + " " + (mxy - mny + pad * 2) + '" preserveAspectRatio="xMidYMid meet">';
    p.cantones.forEach((c) => {
      s += '<path d="' + c.d + '" fill="' + color + '" stroke="#fff" stroke-width="0.4" fill-rule="evenodd"/>';
    });
    s += '<path d="' + p.borde + '" fill="none" stroke="#2b2b2b" stroke-width="1.2"/></svg>';
    cont.innerHTML = s;
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  return { init, mostrar, enFoco, cerrarFoco };
})();
window.MapaCantones = MapaCantones;
