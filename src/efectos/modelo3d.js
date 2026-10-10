/* ============================================================
   MODELO 3D — src/efectos/modelo3d.js  (global: window.Modelo3D)
   "Escenario" three.js reutilizable para las ACTIVIDADES: muestra un
   modelo 3D dentro de la caja de juego para que el niño lo gire, lo
   toque y le suelte fichas encima. Es el material concreto en pantalla
   (la planta, la flor, el ciclo del agua, los bloques base 10…).

   Los modelos se construyen POR CÓDIGO (sin archivos .glb/.obj): así
   funciona igual con doble clic (file://) y sin internet. Cada modelo
   vive en src/efectos/modelos/<nombre>.js y se registra con:

     Modelo3D.registrar("planta", function (api, opts) {
       const g = new THREE.Group();
       ...                                  // api.tubo / api.lamina / api.torno / api.mat
       api.parte(raices, "raiz");           // marca qué objeto es cada PARTE tocable
       return { objeto: g, animar: (t, dt) => {...}, limites: { yaw: [-0.9, 0.9] } };
     });

   Uso desde una actividad:
     if (Modelo3D.disponible("planta")) {
       const m = Modelo3D.crear(host, "planta");
       m.alTocar = (id) => { ... m.resaltar(id, "ok"); m.etiquetar(id, "la raíz"); };
       ctrl.alTerminar(() => m.destruir());
     }
   Si no hay WebGL, disponible() devuelve false y la actividad usa su dibujo SVG.

   Lo que da el escenario: luces suaves, sombra, cámara que encuadra sola,
   giro con el dedo (con límites), balanceo en reposo, detección de la parte
   tocada (raycasting), resaltado (hover / acierto / error), etiquetas que
   siguen a cada parte y limpieza completa al salir.
   ============================================================ */
window.Modelo3D = (function () {
  const MODELOS = {};
  let soporte = null;
  let activos = 0;

  function hayWebGL() {
    if (soporte !== null) return soporte;
    try {
      const c = document.createElement("canvas");
      soporte = !!(window.THREE && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { soporte = false; }
    return soporte;
  }
  function registrar(nombre, fn) { MODELOS[nombre] = fn; }
  function disponible(nombre) { return !!MODELOS[nombre] && hayWebGL(); }

  /* ---------------- Ayudantes de geometría y material ---------------- */
  // Los colores se escriben como en CSS (sRGB) y se convierten a lineal: con la
  // salida sRGB del renderizador, la luz se mezcla bien y los tonos no se lavan.
  function color(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
  function mat(hex, o) {
    const p = { color: color(hex), roughness: 0.62, metalness: 0 };
    if (o) for (const k in o) p[k] = o[k];
    return new THREE.MeshStandardMaterial(p);
  }

  // Tubo que se afina (tallos, raíces, filamentos): pasa por `puntos` [[x,y,z],…]
  // con radio r0 al inicio y r1 al final.
  function tubo(puntos, r0, r1, radial, tramos) {
    const curva = new THREE.CatmullRomCurve3(puntos.map((p) => new THREE.Vector3(p[0], p[1], p[2] || 0)));
    tramos = tramos || Math.max(10, puntos.length * 7);
    radial = radial || 8;
    const fr = curva.computeFrenetFrames(tramos, false);
    const pos = [], nor = [], idx = [];
    const P = new THREE.Vector3(), N = new THREE.Vector3();
    for (let j = 0; j <= tramos; j++) {
      const u = j / tramos;
      curva.getPointAt(u, P);
      const r = r0 + (r1 - r0) * u;
      for (let i = 0; i <= radial; i++) {
        const v = (i / radial) * Math.PI * 2;
        const sn = Math.sin(v), cs = -Math.cos(v);
        N.set(cs * fr.normals[j].x + sn * fr.binormals[j].x,
              cs * fr.normals[j].y + sn * fr.binormals[j].y,
              cs * fr.normals[j].z + sn * fr.binormals[j].z).normalize();
        pos.push(P.x + r * N.x, P.y + r * N.y, P.z + r * N.z);
        nor.push(N.x, N.y, N.z);
      }
    }
    for (let j = 1; j <= tramos; j++) for (let i = 1; i <= radial; i++) {
      const a = (radial + 1) * (j - 1) + (i - 1), b = (radial + 1) * j + (i - 1);
      const c = (radial + 1) * j + i, d = (radial + 1) * (j - 1) + i;
      idx.push(a, b, d, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setIndex(idx);
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    return g;
  }

  /* Lámina curva (hoja, pétalo, sépalo). Nace en el origen y crece hacia +Y;
     se arquea hacia +Z y sus bordes se levantan como una cuchara.
       largo, ancho      tamaño
       perfil(u)         ancho relativo 0..1 a lo largo (u = 0 base … 1 punta)
       arco              cuánto se dobla en total, en radianes (0 = recta)
       copa              cuánto se levantan los bordes (0 = plana)
       onda              rizo del borde (0 = liso)
       c0, c1            color en la base y en la punta (degradado por vértice)  */
  const PERFILES = {
    hoja:   (u) => Math.pow(Math.sin(Math.PI * Math.pow(u, 0.72)), 0.9),
    // base angosta que se ensancha y termina en una punta REDONDA (media elipse)
    petalo: (u) => (u < 0.6 ? 0.22 + 0.78 * Math.pow(Math.sin((Math.PI / 2) * (u / 0.6)), 0.85)
                            : Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.6) / 0.4, 2)))),
    sepalo: (u) => Math.pow(1 - u, 0.75) * Math.min(1, u * 5 + 0.35),
    lanza:  (u) => Math.sin(Math.PI * Math.pow(u, 0.5)) * (1 - 0.35 * u)
  };
  function lamina(o) {
    const L = o.largo || 1, W = o.ancho || 0.5, nu = o.nu || 16, nv = o.nv || 8;
    const perfil = typeof o.perfil === "function" ? o.perfil : (PERFILES[o.perfil] || PERFILES.hoja);
    const arco = o.arco || 0, copa = o.copa || 0, onda = o.onda || 0;
    const c0 = o.c0 ? color(o.c0) : null, c1 = o.c1 ? color(o.c1) : c0;
    const pos = [], col = [], idx = [], uv = [];
    for (let i = 0; i <= nu; i++) {
      const u = i / nu, ang = arco * u;
      // eje de la lámina: un arco de circunferencia de longitud L
      const ey = Math.abs(arco) > 1e-4 ? L * Math.sin(ang) / arco : L * u;
      const ez = Math.abs(arco) > 1e-4 ? L * (1 - Math.cos(ang)) / arco : 0;
      const w = 0.5 * W * Math.max(0, perfil(u));
      for (let j = 0; j <= nv; j++) {
        const v = (j / nv) * 2 - 1;
        const sube = copa * w * v * v + onda * w * Math.sin(u * 9 + v * 2.5) * Math.abs(v);
        // la "normal" del eje es (0, -sin, cos): hacia ahí se levantan los bordes
        pos.push(w * v, ey - sube * Math.sin(ang), ez + sube * Math.cos(ang));
        uv.push(j / nv, u);
        if (c0) {
          const k = Math.pow(u, o.cexp || 1);
          col.push(c0.r + (c1.r - c0.r) * k, c0.g + (c1.g - c0.g) * k, c0.b + (c1.b - c0.b) * k);
        }
      }
    }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j, b = a + nv + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const g = new THREE.BufferGeometry();
    g.setIndex(idx);
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    if (c0) g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }
  // Puntos del eje de una lámina (para ponerle un nervio central con tubo()).
  function ejeLamina(o, n, alto) {
    const L = o.largo || 1, arco = o.arco || 0, pts = [];
    n = n || 8; alto = alto || 0.01;
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * 0.94, ang = arco * u;
      const ey = Math.abs(arco) > 1e-4 ? L * Math.sin(ang) / arco : L * u;
      const ez = Math.abs(arco) > 1e-4 ? L * (1 - Math.cos(ang)) / arco : 0;
      pos3(pts, 0, ey + alto * Math.sin(ang) * -1, ez + alto * Math.cos(ang));
    }
    return pts;
  }
  function pos3(arr, x, y, z) { arr.push([x, y, z]); }

  // Sólido de revolución a partir de un perfil [[radio, y], …] (macetas, ovarios, gotas).
  function torno(perfil, tramos) {
    return new THREE.LatheGeometry(perfil.map((p) => new THREE.Vector2(p[0], p[1])), tramos || 24);
  }

  /* ---------------- El escenario ---------------- */
  function crear(host, nombre, opts) {
    opts = opts || {};
    if (!disponible(nombre)) return null;

    const el = document.createElement("div");
    el.className = "m3d" + (opts.clase ? " " + opts.clase : "");
    const canvas = document.createElement("canvas");
    const capa = document.createElement("div"); capa.className = "m3d-capa";
    const pista = document.createElement("div"); pista.className = "m3d-pista";
    pista.textContent = opts.pista == null ? "🔄 Arrastra para girar" : opts.pista;
    el.appendChild(canvas); el.appendChild(capa); el.appendChild(pista);
    host.appendChild(el);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb0d8, 0.95));
    const sol = new THREE.DirectionalLight(0xfff1dc, 1.25);
    scene.add(sol);
    const relleno = new THREE.DirectionalLight(0xbfd4ff, 0.45);
    scene.add(relleno);

    const inclina = new THREE.Group();     // sube/baja la vista (pitch)
    const pivote = new THREE.Group();      // gira (yaw)
    scene.add(inclina); inclina.add(pivote);

    /* --- construir el modelo --- */
    const partes = {};                     // id -> { raices:[Object3D], mats:[Material], centro:Vector3 }
    const api = {
      THREE: THREE, color: color, mat: mat, tubo: tubo, lamina: lamina, ejeLamina: ejeLamina, torno: torno,
      // Marca `obj` (y todo lo que cuelga de él) como la parte tocable `id`.
      parte: function (obj, id) {
        const p = partes[id] || (partes[id] = { raices: [], mats: [], clones: new Map() });
        p.raices.push(obj);
        obj.userData.parte = id;
        obj.userData.escala0 = obj.scale.clone();
        obj.traverse(function (o) {
          o.userData.parte = id;
          if (!o.isMesh) return;
          // cada parte tiene SUS materiales (para iluminarla sin afectar a las demás)
          let m = p.clones.get(o.material);
          if (!m) { m = o.material.clone(); p.clones.set(o.material, m); p.mats.push(m); }
          o.material = m;
        });
        return obj;
      },
      // Quita una parte (para modelos que se rehacen, como la pizza al cambiar de partes).
      quitarParte: function (id) {
        const p = partes[id]; if (!p) return;
        p.mats.forEach(function (m) { m.dispose(); });
        delete partes[id]; delete efectos[id];
        if (sobre === id) sobre = null;
      }
    };
    const efectos = {};                    // id -> { tipo:"ok"|"mal", t0, fijo }
    let sobre = null;                      // parte bajo el cursor
    const modelo = MODELOS[nombre](api, opts) || {};
    const objeto = modelo.objeto || new THREE.Group();
    pivote.add(objeto);
    /* --- encuadre: la cámara se coloca sola para que el modelo quepa entero --- */
    const caja = new THREE.Box3().setFromObject(objeto);
    const centro = caja.getCenter(new THREE.Vector3());
    const tam = caja.getSize(new THREE.Vector3());
    const radio = 0.5 * Math.sqrt(tam.x * tam.x + tam.y * tam.y + tam.z * tam.z);
    const medioAlto = tam.y / 2, medioAncho = 0.5 * Math.sqrt(tam.x * tam.x + tam.z * tam.z);
    objeto.position.sub(centro);           // el modelo queda centrado en el origen (gira sobre su centro)
    const sueloY = (modelo.suelo != null ? modelo.suelo : caja.min.y) - centro.y;

    // Sombra de contacto: una mancha suave pintada en el "piso" (sin mapas de sombra,
    // que cuestan mucho en una tablet sencilla y aquí no aportan).
    if (modelo.sombra !== false) {
      const lienzo = document.createElement("canvas"); lienzo.width = lienzo.height = 128;
      const cx = lienzo.getContext("2d");
      const gr = cx.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, "rgba(40,50,90,0.34)"); gr.addColorStop(0.6, "rgba(40,50,90,0.14)"); gr.addColorStop(1, "rgba(40,50,90,0)");
      cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
      const rs = (modelo.sombra && modelo.sombra.radio) || Math.max(tam.x, tam.z) * 0.62;
      const mancha = new THREE.Mesh(new THREE.PlaneGeometry(rs * 2, rs * 2),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(lienzo), transparent: true, depthWrite: false }));
      mancha.rotation.x = -Math.PI / 2;
      mancha.position.y = sueloY - 0.01;
      mancha.userData.fantasma = true;       // no cuenta al tocar
      mancha.renderOrder = -1;
      inclina.add(mancha);
    }
    sol.position.set(radio * 1.2, radio * 2.6, radio * 2.0);
    relleno.position.set(-radio * 2, radio * 0.8, -radio * 1.5);
    if (modelo.forma) el.classList.add(modelo.forma);     // "vertical" | "ancha": proporción del escenario

    const lim = modelo.limites || {};
    const limYaw = lim.yaw || [-Infinity, Infinity];
    const limPitch = lim.pitch || [-0.15, 0.75];
    const vista = modelo.vista || {};
    let yaw = vista.yaw || 0, pitch = vista.pitch != null ? vista.pitch : 0.22;
    const vaiven = modelo.vaiven != null ? modelo.vaiven : 0.1;     // balanceo en reposo (rad)
    let quieto = 1;                         // 1 = en reposo (se balancea), 0 = el niño lo está girando

    // Las 8 esquinas de la caja del modelo (en sus propias coordenadas).
    const esquinas = [];
    for (let i = 0; i < 8; i++) {
      esquinas.push(new THREE.Vector3(i & 1 ? caja.max.x : caja.min.x, i & 2 ? caja.max.y : caja.min.y, i & 4 ? caja.max.z : caja.min.z));
    }
    // Giros que hay que comprobar: los extremos permitidos o, si gira libre, toda la vuelta.
    const girosPrueba = [];
    if (isFinite(limYaw[0]) && isFinite(limYaw[1])) girosPrueba.push(limYaw[0], yaw, limYaw[1]);
    else for (let k = 0; k < 8; k++) girosPrueba.push((k / 8) * Math.PI * 2);
    const Pq = new THREE.Vector3();

    /* La cámara se acerca todo lo posible sin que el modelo se salga: se proyectan
       las esquinas de su caja en cada giro permitido y se ajusta la distancia (y la
       altura de la mirada) hasta que el conjunto llena el escenario con un margen. */
    function encuadrar() {
      const w = Math.max(40, el.clientWidth), h = Math.max(40, el.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const fv = (camera.fov * Math.PI) / 180;
      const fh = 2 * Math.atan(Math.tan(fv / 2) * camera.aspect);
      const mg = modelo.margen || 1.1;
      // `reservaAbajo` (0..0,5): franja inferior del escenario que se deja libre para
      // controles (los botones de cada columna de bloques); el modelo se encuadra arriba.
      const reserva = Math.max(0, Math.min(0.5, opts.reservaAbajo || modelo.reservaAbajo || 0));
      let dist = Math.max(medioAlto * mg / Math.tan(fv / 2), medioAncho * mg / Math.tan(fh / 2)) + medioAncho;
      let miraY = 0;
      inclina.rotation.x = pitch;
      for (let paso = 0; paso < 4; paso++) {
        camera.position.set(0, miraY, dist);
        camera.near = Math.max(0.05, dist - radio * 3); camera.far = dist + radio * 4;
        camera.lookAt(0, miraY, 0);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld(true);
        let ex = 0, y0 = Infinity, y1 = -Infinity;
        girosPrueba.forEach(function (gy) {
          pivote.rotation.y = gy;
          scene.updateMatrixWorld(true);
          esquinas.forEach(function (e) {
            Pq.copy(e); objeto.localToWorld(Pq); Pq.project(camera);
            ex = Math.max(ex, Math.abs(Pq.x)); y0 = Math.min(y0, Pq.y); y1 = Math.max(y1, Pq.y);
          });
        });
        miraY += ((y0 + y1) / 2 - reserva) * Math.tan(fv / 2) * dist;        // centra en la zona libre
        dist *= Math.max(ex, ((y1 - y0) / 2) / (1 - reserva)) * mg;            // llena el escenario
      }
      camera.position.set(0, miraY, dist);
      camera.near = Math.max(0.05, dist - radio * 3); camera.far = dist + radio * 4;
      camera.lookAt(0, miraY, 0);
      camera.updateProjectionMatrix();
      pivote.rotation.y = yaw;
    }
    encuadrar();
    let observador = null;
    if (window.ResizeObserver) { observador = new ResizeObserver(encuadrar); observador.observe(el); }
    else window.addEventListener("resize", encuadrar);

    /* --- resaltados y efectos por parte --- */
    const NEGRO = new THREE.Color(0, 0, 0), tmpC = new THREE.Color();
    const C_HOVER = color("#5a4a12"), C_OK = color("#1fbf75"), C_MAL = color("#ef4444");
    function pintarParte(id, t) {
      const p = partes[id]; if (!p) return;
      const ef = efectos[id];
      let k = 0, c = NEGRO, escala = 1;
      if (ef) {
        const dt = t - ef.t0;
        if (ef.tipo === "ok") {
          c = C_OK; k = 0.55 + 0.25 * Math.sin(dt * 7);
          escala = 1 + 0.16 * Math.exp(-dt * 3.2) * Math.abs(Math.sin(dt * 9));
          if (ef.fijo !== true && dt > 2.2) delete efectos[id];
        } else {
          c = C_MAL; k = Math.max(0, 0.8 - dt * 1.4);
          escala = 1 + Math.sin(dt * 46) * 0.045 * Math.max(0, 1 - dt * 1.8);     // "tiembla" encogiéndose
          if (dt > 0.6) delete efectos[id];
        }
      } else if (sobre === id) { c = C_HOVER; k = 1; }
      tmpC.copy(c).multiplyScalar(k);
      p.mats.forEach(function (m) { if (m.emissive) m.emissive.copy(tmpC); });
      // Solo se toca la ESCALA de la raíz de cada parte: los modelos pueden animar
      // libremente su rotación y posición (pero no la escala de esas raíces).
      p.raices.forEach(function (o) {
        const e0 = o.userData.escala0;
        o.scale.set(e0.x * escala, e0.y * escala, e0.z * escala);
      });
    }

    /* --- etiquetas y elementos anclados a un punto del modelo --- */
    const anclados = [];                   // { el, id, fila }
    const V = new THREE.Vector3();
    function puntoDe(id) {                 // punto (en coordenadas del modelo) donde va la etiqueta de `id`
      if (modelo.anclas && modelo.anclas[id]) return modelo.anclas[id];
      const p = partes[id];
      if (!p) return null;
      if (!p.centro) {
        const b = new THREE.Box3();
        p.raices.forEach(function (o) { b.expandByObject(o); });
        p.centro = objeto.worldToLocal(b.getCenter(new THREE.Vector3()));
      }
      return p.centro;
    }
    // anclar(el, id): el elemento sigue al punto `id` del modelo.
    // anclar(el, id, { abajo: true }): solo lo sigue en horizontal; queda pegado al
    // borde inferior del escenario (para controles que no deben tapar el modelo).
    function anclar(elDom, id, opc) {
      elDom.style.position = "absolute";
      if (elDom.parentNode !== capa) capa.appendChild(elDom);
      const o = typeof opc === "number" ? { fila: opc } : (opc || {});
      anclados.push({ el: elDom, id: id, fila: o.fila || 0, abajo: !!o.abajo });
      return elDom;
    }
    function etiquetar(id, texto, clase) {
      const d = document.createElement("div");
      d.className = "m3d-etq" + (clase ? " " + clase : "");
      d.textContent = texto;
      const fila = anclados.filter(function (a) { return a.id === id && a.el.classList.contains("m3d-etq"); }).length;
      return anclar(d, id, fila);
    }
    function limpiarEtiquetas() {
      for (let i = anclados.length - 1; i >= 0; i--) {
        if (anclados[i].el.classList.contains("m3d-etq")) { anclados[i].el.remove(); anclados.splice(i, 1); }
      }
    }
    function limpiarAnclados() { anclados.splice(0).forEach(function (a) { a.el.remove(); }); }
    function colocarAnclados() {
      const w = el.clientWidth, h = el.clientHeight;
      anclados.forEach(function (a) {
        const p = puntoDe(a.id); if (!p) return;
        V.copy(p); objeto.localToWorld(V); V.project(camera);
        const x = (V.x * 0.5 + 0.5) * w, y = (-V.y * 0.5 + 0.5) * h + a.fila * 28;
        const mx = a.el.offsetWidth / 2 + 3, my = a.el.offsetHeight / 2 + 3;     // que no se salga del escenario
        a.el.style.left = Math.max(mx, Math.min(w - mx, x)) + "px";
        a.el.style.top = (a.abajo ? h - my - 2 : Math.max(my, Math.min(h - my, y))) + "px";
      });
    }

    /* --- detección de la parte bajo un punto de la pantalla --- */
    const rayo = new THREE.Raycaster(), m2 = new THREE.Vector2();
    function parteEn(cx, cy) {
      const r = canvas.getBoundingClientRect();
      if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return null;
      m2.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      rayo.setFromCamera(m2, camera);
      const hits = rayo.intersectObject(objeto, true);
      // Decide lo PRIMERO que se ve bajo el dedo: si es la tierra (no es parte), no
      // se "atraviesa" para acertar algo que está detrás.
      for (let i = 0; i < hits.length; i++) {
        const o = hits[i].object;
        if (!o.visible || o.userData.fantasma) continue;
        return o.userData.parte || null;
      }
      return null;
    }

    // Partes que quedan a `radio` píxeles del punto (para perdonar dedos imprecisos
    // sobre piezas finas como un estambre o el tallo).
    function partesCerca(cx, cy, radio) {
      const vistas = {}, res = [];
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2, r = k % 2 ? radio : radio * 0.55;
        const id = parteEn(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        if (id && !vistas[id]) { vistas[id] = 1; res.push(id); }
      }
      return res;
    }

    /* --- interacción: girar arrastrando, tocar una parte --- */
    const inst = {
      el: el, modelo: modelo, partes: Object.keys(partes), alTocar: null, girable: modelo.girable !== false,
      parteEn: parteEn, partesCerca: partesCerca, anclar: anclar, etiquetar: etiquetar, limpiarEtiquetas: limpiarEtiquetas,
      limpiarAnclados: limpiarAnclados,
      sobre: function (id) { sobre = id || null; },
      resaltar: function (id, tipo, fijo) { if (partes[id]) efectos[id] = { tipo: tipo === "mal" ? "mal" : "ok", t0: reloj.getElapsedTime(), fijo: !!fijo }; },
      apagar: function (id) { if (id) delete efectos[id]; else Object.keys(efectos).forEach(function (k) { delete efectos[k]; }); },
      activar: function (id, valor) { if (modelo.activar) modelo.activar(id, valor); },
      destruir: destruir
    };
    let abajo = null;                      // { x, y, movido }
    canvas.addEventListener("pointerdown", function (e) {
      abajo = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, movido: false };
      quieto = 0;                           // al tocar, el modelo deja de mecerse: no se "escapa" del dedo
      try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
    });
    canvas.addEventListener("pointermove", function (e) {
      if (abajo) {
        if (!abajo.movido && Math.abs(e.clientX - abajo.x) + Math.abs(e.clientY - abajo.y) > 7) abajo.movido = true;
        if (abajo.movido && inst.girable) {
          yaw = Math.max(limYaw[0], Math.min(limYaw[1], yaw + (e.clientX - abajo.lx) * 0.011));
          pitch = Math.max(limPitch[0], Math.min(limPitch[1], pitch + (e.clientY - abajo.ly) * 0.007));
          quieto = 0; pista.classList.add("oculta");
          el.classList.add("girando");
        }
        abajo.lx = e.clientX; abajo.ly = e.clientY;
        return;
      }
      if (e.pointerType === "mouse") {
        sobre = parteEn(e.clientX, e.clientY);
        el.classList.toggle("sobre-parte", !!sobre);
        if (sobre) quieto = Math.min(quieto, 0.25);        // con el cursor encima casi no se mueve
      }
    });
    function soltar(e) {
      if (!abajo) return;
      const fueToque = !abajo.movido;
      abajo = null; el.classList.remove("girando");
      // alTocar(parte exacta bajo el dedo | null, [partes cercanas])
      if (fueToque && e.type === "pointerup" && inst.alTocar) {
        inst.alTocar(parteEn(e.clientX, e.clientY), partesCerca(e.clientX, e.clientY, e.pointerType === "mouse" ? 9 : 18));
      }
    }
    canvas.addEventListener("pointerup", soltar);
    canvas.addEventListener("pointercancel", soltar);
    canvas.addEventListener("pointerleave", function () { if (!abajo) { sobre = null; el.classList.remove("sobre-parte"); } });

    /* --- bucle de dibujo --- */
    const reloj = new THREE.Clock();
    let raf = 0, vivo = true, huerfano = 0;
    activos++;
    if (window.ESCENA && ESCENA.ahorro) ESCENA.ahorro(true);   // el fondo baja el ritmo mientras hay un modelo
    function cuadro() {
      if (!vivo) return;
      raf = requestAnimationFrame(cuadro);
      const dt = Math.min(0.05, reloj.getDelta()), t = reloj.getElapsedTime();
      if (!el.isConnected) { huerfano += dt; if (huerfano > 2) destruir(); return; }   // lo quitaron de la página
      huerfano = 0;
      if (!abajo) quieto = Math.min(1, quieto + dt * 0.22);
      pivote.rotation.y = yaw + Math.sin(t * 0.55) * vaiven * quieto;
      inclina.rotation.x = pitch;
      if (modelo.animar) modelo.animar(t, dt);
      for (const id in partes) pintarParte(id, t);
      renderer.render(scene, camera);
      if (anclados.length) colocarAnclados();
    }
    cuadro();
    Modelo3D._ultimo = inst;               // para pruebas y depuración

    function destruir() {
      if (!vivo) return;
      vivo = false;
      cancelAnimationFrame(raf);
      if (observador) observador.disconnect(); else window.removeEventListener("resize", encuadrar);
      scene.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); });
      });
      Object.keys(partes).forEach(function (id) { partes[id].mats.forEach(function (m) { m.dispose(); }); });
      if (modelo.destruir) modelo.destruir();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch (e) {}
      el.remove();
      activos = Math.max(0, activos - 1);
      if (!activos && window.ESCENA && ESCENA.ahorro) ESCENA.ahorro(false);
    }

    return inst;
  }

  return { registrar: registrar, disponible: disponible, crear: crear, hayWebGL: hayWebGL,
           util: { color: color, mat: mat, tubo: tubo, lamina: lamina, ejeLamina: ejeLamina, torno: torno } };
})();
