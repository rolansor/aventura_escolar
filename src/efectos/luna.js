/* ============================================================
   LUNA — la mascota 3D (por defecto se llama "Perchita")
   - Vive en su propio canvas, encima de la interfaz.
   - Se puede ARRASTRAR a cualquier lugar (ratón o dedo). Por defecto
     se queda abajo a la derecha, donde no tapa el ejercicio.
   - Está viva: respira, parpadea, SIGUE CON LA MIRADA el cursor o el
     dedo, saluda sola de vez en cuando, salta de alegría (aplastándose
     y estirándose), se pone triste y piensa.
   - Niña o niño según el perfil (generoMascota).
   - Si no hay WebGL, muestra un respaldo (emoji).
   Expone: Luna.init(), Luna.reaccion("feliz"|"triste"|"fiesta"),
           Luna.tip(texto), Luna.decir(texto), Luna.aplicarConfig()
   ============================================================ */

const Luna = (function () {
  let renderer, scene, camera, reloj, grupo;
  let P = null;                       // piezas animables del personaje
  let estado = "idle", tReaccion = 0, durReaccion = 1, proxGesto = 6, proxParpadeo = 2.5, tParpadeo = -1;
  let ok3d = false;
  const mirada = { x: 0, y: 0, tx: 0, ty: 0, ultima: -10 };   // hacia dónde mira (−1..1)

  const cont = () => document.getElementById("luna");
  const canvas = () => document.getElementById("luna-canvas");

  function init() {
    const tag = document.querySelector("#luna .luna-nombre");
    if (tag) tag.textContent = "🌙 " + Juego.avatarNombre() + " ✋";
    restaurarPosicion();
    activarArrastre();
    // Si cambia el tamaño de la ventana (o gira la tablet), que no quede fuera de la pantalla.
    window.addEventListener("resize", () => { const r = cont().getBoundingClientRect(); colocar(r.left, r.top); });
    // Sigue con la mirada el cursor o el dedo.
    window.addEventListener("pointermove", (e) => {
      const r = cont().getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * 0.35);
      const d = Math.max(140, Math.hypot(dx, dy));
      mirada.tx = Math.max(-1, Math.min(1, dx / d * 1.25));
      mirada.ty = Math.max(-1, Math.min(1, dy / d * 1.25));
      mirada.ultima = reloj ? reloj.getElapsedTime() : 0;
    }, { passive: true });
    saludar();
    try {
      iniciar3D();
    } catch (e) {
      respaldoEmoji();
    }
  }

  /* ---------------- Construcción 3D ---------------- */
  const col = (hex) => new THREE.Color(hex).convertSRGBToLinear();
  const mat = (hex, o) => { const p = { color: col(hex), roughness: 0.6, metalness: 0 }; if (o) for (const k in o) p[k] = o[k]; return new THREE.MeshStandardMaterial(p); };
  const torno = (perfil, n) => new THREE.LatheGeometry(perfil.map((q) => new THREE.Vector2(q[0], q[1])), n || 28);
  function malla(geo, material, x, y, z, padre) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x || 0, y || 0, z || 0);
    (padre || grupo).add(m);
    return m;
  }

  function iniciar3D() {
    if (!window.THREE) { respaldoEmoji(); return; }
    const c = canvas();
    const w = c.clientWidth || 150, h = c.clientHeight || 165;
    renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); // fondo transparente
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    ok3d = true;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 50);
    camera.position.set(0, 0.25, 7.6);
    camera.lookAt(0, 0.2, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9a8e8, 1.0));
    const dir = new THREE.DirectionalLight(0xfff2de, 1.05);
    dir.position.set(2.5, 4, 5);
    scene.add(dir);
    const contra = new THREE.DirectionalLight(0xbcd0ff, 0.4);
    contra.position.set(-3, 2, -3);
    scene.add(contra);

    construirLuna();
    reloj = new THREE.Clock();
    animar();
  }

  function construirLuna() {
    grupo = new THREE.Group();
    const esNina = (Juego.generoMascota ? Juego.generoMascota() : Juego.genero()) !== "nino";

    const M = {
      piel: mat("#ffd3a8", { roughness: 0.75 }),
      pelo: mat("#3d2c66", { roughness: 0.55 }),
      ropa: mat(esNina ? "#8a5cf6" : "#2e6cf6", { roughness: 0.55 }),
      ropa2: mat(esNina ? "#6f44dc" : "#27407a", { roughness: 0.6 }),
      blanco: mat("#ffffff", { roughness: 0.5 }),
      oscuro: mat("#241a3a", { roughness: 0.4 }),
      rosa: mat("#ff9eb8", { roughness: 0.8 }),
      boca: mat("#b5333e", { roughness: 0.5 }),
      zapato: mat("#ffc934", { roughness: 0.5 }),
      luna: mat("#fff3b0", { emissive: col("#ffd84d"), emissiveIntensity: 0.55, roughness: 0.4 })
    };
    P = { esNina: esNina };

    /* --- cuerpo --- */
    const cuerpo = new THREE.Group();
    grupo.add(cuerpo);
    P.cuerpo = cuerpo;
    if (esNina) {
      // vestido acampanado
      malla(torno([[0, 0.44], [0.19, 0.44], [0.27, 0.32], [0.3, 0.08], [0.43, -0.36], [0.63, -0.84], [0.67, -0.96], [0.6, -1.02], [0, -1.02]]), M.ropa, 0, 0, 0, cuerpo);
      malla(new THREE.TorusGeometry(0.64, 0.05, 10, 32), M.luna, 0, -0.95, 0, cuerpo).rotation.x = Math.PI / 2;      // ruedo dorado
      malla(new THREE.TorusGeometry(0.2, 0.055, 10, 24), M.blanco, 0, 0.42, 0, cuerpo).rotation.x = Math.PI / 2;     // cuello
      for (let i = 0; i < 3; i++) {                                                                                   // estrellitas del vestido
        const e = malla(new THREE.OctahedronGeometry(0.07), M.luna, [-0.2, 0.16, -0.02][i], [-0.45, -0.62, -0.18][i], [0.43, 0.5, 0.36][i], cuerpo);
        e.rotation.set(0.4, i, 0.3);
      }
    } else {
      // camiseta + pantalón corto
      malla(torno([[0, 0.44], [0.2, 0.44], [0.32, 0.3], [0.38, -0.05], [0.37, -0.4], [0, -0.4]]), M.ropa, 0, 0, 0, cuerpo);
      malla(torno([[0, -0.36], [0.385, -0.36], [0.41, -0.74], [0.36, -0.78], [0, -0.78]]), M.ropa2, 0, 0, 0, cuerpo);
      malla(new THREE.TorusGeometry(0.2, 0.05, 10, 24), M.blanco, 0, 0.42, 0, cuerpo).rotation.x = Math.PI / 2;
      const e = malla(new THREE.OctahedronGeometry(0.11), M.luna, 0, 0.02, 0.37, cuerpo);                               // estrella de la camiseta
      e.rotation.set(0.5, 0.6, 0.2);
    }
    // piernas y zapatos
    const yPierna = esNina ? -1.12 : -0.98, altoPierna = esNina ? 0.26 : 0.46;
    [-0.2, 0.2].forEach((x) => {
      malla(new THREE.CylinderGeometry(0.1, 0.09, altoPierna, 14), M.piel, x, yPierna, 0, cuerpo);
      const z = malla(new THREE.SphereGeometry(0.15, 16, 12), M.zapato, x, yPierna - altoPierna / 2 - 0.05, 0.06, cuerpo);
      z.scale.set(1, 0.7, 1.35);
    });

    /* --- brazos (giran desde el hombro) --- */
    function brazo(lado) {
      const hombro = new THREE.Group();
      hombro.position.set(lado * (esNina ? 0.27 : 0.33), 0.27, 0);
      malla(new THREE.SphereGeometry(0.13, 14, 10), M.ropa, 0, 0, 0, hombro);                 // manguita
      malla(new THREE.CylinderGeometry(0.085, 0.075, 0.5, 12), M.piel, 0, -0.29, 0, hombro);
      malla(new THREE.SphereGeometry(0.105, 14, 10), M.piel, 0, -0.58, 0, hombro);            // mano
      cuerpo.add(hombro);
      return hombro;
    }
    P.brazoIzq = brazo(-1);          // a NUESTRA izquierda
    P.brazoDer = brazo(1);

    /* --- cabeza (gira desde el cuello) --- */
    const cabeza = new THREE.Group();
    cabeza.position.set(0, 0.46, 0);
    grupo.add(cabeza);
    P.cabeza = cabeza;
    malla(new THREE.CylinderGeometry(0.13, 0.15, 0.16, 12), M.piel, 0, 0.02, 0, cabeza);       // cuello
    const cara = malla(new THREE.SphereGeometry(0.62, 32, 24), M.piel, 0, 0.6, 0, cabeza);
    cara.scale.set(1, 0.94, 0.94);
    [-1, 1].forEach((s) => { malla(new THREE.SphereGeometry(0.1, 12, 10), M.piel, s * 0.6, 0.55, 0, cabeza).scale.set(0.6, 1, 0.8); });   // orejas

    // pelo
    const nuca = malla(new THREE.SphereGeometry(0.66, 28, 20), M.pelo, 0, 0.66, -0.09, cabeza);
    if (esNina) {
      nuca.scale.set(1.03, 1.0, 0.98);
      const fleco = malla(new THREE.SphereGeometry(0.6, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), M.pelo, 0, 0.72, 0.1, cabeza);
      fleco.scale.set(1.04, 0.86, 0.98); fleco.rotation.x = 0.42;
      P.coletas = [];
      [-1, 1].forEach((s) => {                                                                   // dos coletas con su moñito
        const co = new THREE.Group();
        co.position.set(s * 0.6, 0.86, -0.08);
        malla(new THREE.SphereGeometry(0.27, 18, 14), M.pelo, s * 0.18, -0.12, 0, co).scale.set(0.9, 1.25, 0.9);
        malla(new THREE.TorusGeometry(0.1, 0.045, 8, 16), M.luna, s * 0.05, 0.05, 0, co).rotation.set(0, 0, s * 0.9);
        cabeza.add(co);
        P.coletas.push({ g: co, lado: s });
      });
    } else {
      nuca.scale.set(1.0, 0.9, 0.96); nuca.position.y = 0.7;
      const fleco = malla(new THREE.SphereGeometry(0.6, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.36), M.pelo, 0, 0.74, 0.08, cabeza);
      fleco.scale.set(1.03, 0.8, 0.98); fleco.rotation.x = 0.3;
      const mechon = malla(new THREE.ConeGeometry(0.16, 0.34, 10), M.pelo, 0.12, 1.3, 0.18, cabeza);
      mechon.rotation.set(0.5, 0, -0.5);
    }

    // ojos: blanco, pupila y brillo (la pupila se mueve con la mirada; el párpado es la escala)
    P.ojos = [];
    [-1, 1].forEach((s) => {
      const ojo = new THREE.Group();
      ojo.position.set(s * 0.22, 0.6, 0.5);
      malla(new THREE.SphereGeometry(0.135, 18, 14), M.blanco, 0, 0, 0, ojo).scale.set(1, 1.12, 0.55);
      const pupila = new THREE.Group();
      malla(new THREE.SphereGeometry(0.082, 16, 12), M.oscuro, 0, 0, 0.055, pupila).scale.set(1, 1.1, 0.6);
      malla(new THREE.SphereGeometry(0.03, 8, 8), M.blanco, 0.03, 0.035, 0.1, pupila);
      ojo.add(pupila);
      cabeza.add(ojo);
      P.ojos.push({ g: ojo, pupila: pupila });
    });
    // cachetes
    [-1, 1].forEach((s) => { malla(new THREE.SphereGeometry(0.1, 12, 10), M.rosa, s * 0.37, 0.42, 0.44, cabeza).scale.set(1, 0.65, 0.4); });
    // boca: una sonrisa (medio aro) que puede abrirse o darse la vuelta
    const boca = new THREE.Group();
    boca.position.set(0, 0.38, 0.55);
    const arco = malla(new THREE.TorusGeometry(0.12, 0.03, 8, 18, Math.PI), M.oscuro, 0, 0, 0, boca);
    arco.rotation.z = Math.PI;                           // abre hacia arriba = sonrisa
    const abierta = malla(new THREE.SphereGeometry(0.1, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.boca, 0, 0.005, -0.02, boca);
    abierta.scale.set(1.1, 1, 0.45); abierta.visible = false;
    cabeza.add(boca);
    P.boca = boca; P.arco = arco; P.abierta = abierta;

    if (esNina) {
      // broche de luna en el pelo
      const broche = malla(new THREE.TorusGeometry(0.12, 0.045, 10, 20, Math.PI * 1.4), M.luna, -0.3, 1.1, 0.42, cabeza);
      broche.rotation.set(0.2, 0, 0.7);
    }

    // Lunita compañera que flota a su lado
    P.lunita = malla(new THREE.TorusGeometry(0.19, 0.09, 12, 24, Math.PI * 1.35), M.luna, 1.2, 1.5, 0);

    grupo.position.y = -0.1;
    grupo.scale.setScalar(0.98);
    scene.add(grupo);
  }

  function desecharGrupo() {
    if (!grupo) return;
    scene.remove(grupo);
    grupo.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    grupo = null; P = null;
  }

  /* ---------------- Animación ---------------- */
  function animar() {
    requestAnimationFrame(animar);
    if (!ok3d || !P) return;
    const dt = Math.min(0.05, reloj.getDelta());
    const t = reloj.getElapsedTime();

    // --- valores de reposo ---
    let y = -0.1 + Math.sin(t * 2) * 0.035;
    let giro = Math.sin(t * 0.8) * 0.08, ladeo = 0;
    let sy = 1 + Math.sin(t * 2) * 0.012, sx = 1;              // respira
    let brazoI = 0.32 + Math.sin(t * 2) * 0.03, brazoD = -0.32 - Math.sin(t * 2) * 0.03;   // rotación Z de cada hombro
    let brazoIx = 0, brazoDx = 0;
    let cabezaX = 0, cabezaZ = Math.sin(t * 0.9) * 0.03;
    let parpado = 1, sonrisa = 1, bocaAbierta = false, miraArriba = 0;

    // mirada: vuelve al frente si hace rato que no se mueve el puntero
    if (t - mirada.ultima > 3.5) { mirada.tx = 0; mirada.ty = 0; }
    mirada.x += (mirada.tx - mirada.x) * Math.min(1, dt * 6);
    mirada.y += (mirada.ty - mirada.y) * Math.min(1, dt * 6);

    // parpadeo
    if (t > proxParpadeo) { tParpadeo = t; proxParpadeo = t + 2.2 + Math.random() * 3.5; }
    if (tParpadeo >= 0) {
      const e = (t - tParpadeo) / 0.16;
      if (e >= 1) tParpadeo = -1; else parpado = Math.abs(1 - 2 * e) * 0.9 + 0.1;
    }

    // --- reacciones ---
    if (tReaccion > 0) {
      tReaccion -= dt;
      const k = Math.max(0, tReaccion), prog = 1 - k / durReaccion;        // prog: 0 → 1
      const suave = Math.sin(Math.min(1, prog * 4) * Math.PI / 2) * Math.min(1, k * 5);   // entra y sale sin golpe
      if (estado === "feliz" || estado === "fiesta") {
        const salto = Math.abs(Math.sin(prog * Math.PI * (estado === "fiesta" ? 4 : 3)));
        y += salto * 0.42 * suave;
        // se estira al subir y se aplasta al caer
        const est = (salto - 0.35) * 0.16 * suave;
        sy = 1 + est; sx = 1 - est * 0.6;
        if (estado === "fiesta") giro = prog * Math.PI * 2;                      // una vuelta completa
        else giro += Math.sin(prog * 14) * 0.18 * suave;
        const agita = Math.sin(prog * 26) * 0.35;
        brazoI = 0.32 + (2.25 + agita) * suave; brazoD = -0.32 - (2.25 - agita) * suave;
        bocaAbierta = suave > 0.4; parpado = Math.min(parpado, 1 - 0.45 * suave);  // ojitos contentos
        cabezaX = -0.12 * suave;
      } else if (estado === "triste") {
        y -= 0.07 * suave;
        cabezaX = 0.3 * suave; cabezaZ = Math.sin(prog * 9) * 0.07 * suave;
        brazoI = 0.32 - 0.2 * suave; brazoD = -0.32 + 0.2 * suave;
        sonrisa = 1 - 2 * suave;                                                   // la sonrisa se da la vuelta
        parpado = Math.min(parpado, 1 - 0.4 * suave);
        sy = 1 - 0.04 * suave;
      } else if (estado === "saludo" || estado === "tip") {
        y += Math.abs(Math.sin(prog * 9)) * 0.06 * suave;
        brazoD = -0.32 - (2.3 + Math.sin(prog * 22) * 0.38) * suave;               // saluda con la mano
        ladeo = 0.07 * suave; cabezaZ = -0.12 * suave;
        bocaAbierta = estado === "tip" && suave > 0.5;
      } else if (estado === "pensar") {
        cabezaZ = 0.16 * suave; cabezaX = -0.1 * suave; miraArriba = suave;
        brazoI = 0.32 + 1.5 * suave; brazoIx = -1.1 * suave;                        // mano hacia la barbilla
      }
    } else {
      estado = "idle";
      // Gesto espontáneo cada cierto rato (saluda o piensa solita)
      if (t > proxGesto) {
        proxGesto = t + 8 + Math.random() * 8;
        estado = Math.random() < 0.6 ? "saludo" : "pensar";
        tReaccion = durReaccion = 1.5;
      }
    }

    // --- aplicar ---
    grupo.position.y = y;
    grupo.rotation.y = giro + mirada.x * 0.16;
    grupo.rotation.z = ladeo;
    grupo.scale.set(0.98 * sx, 0.98 * sy, 0.98 * sx);
    P.brazoIzq.rotation.set(brazoIx, 0, -brazoI);        // a nuestra izquierda: Z negativa abre hacia fuera
    P.brazoDer.rotation.set(brazoDx, 0, -brazoD);
    P.cabeza.rotation.set(cabezaX + mirada.y * 0.22, mirada.x * 0.42, cabezaZ);
    P.ojos.forEach((o) => {
      o.g.scale.y = parpado;
      o.pupila.position.set(mirada.x * 0.035, -mirada.y * 0.03 + miraArriba * 0.04, 0);
    });
    // sonrisa > 0: arco hacia arriba; < 0: se da la vuelta (carita triste)
    P.arco.rotation.z = sonrisa < 0 ? 0 : Math.PI;
    P.arco.scale.y = Math.max(0.3, Math.abs(sonrisa));
    P.arco.position.y = sonrisa < 0 ? -0.09 : 0;
    P.arco.visible = !bocaAbierta; P.abierta.visible = bocaAbierta;
    if (P.coletas) P.coletas.forEach((c) => { c.g.rotation.z = Math.sin(t * 2.2 + c.lado) * 0.06 + (y + 0.1) * -0.5 * c.lado; });
    // Lunita orbitando
    P.lunita.position.set(1.28 * Math.cos(t * 0.8), 1.45 + Math.sin(t * 1.6) * 0.14, 0.5 * Math.sin(t * 0.8));
    P.lunita.rotation.z += dt * 1.2;

    renderer.render(scene, camera);
  }

  function reaccion(tipo) {
    estado = tipo;
    tReaccion = durReaccion = tipo === "fiesta" ? 2.0 : 1.3;
    mostrarGlobo(tipo);
    if (!ok3d) animarRespaldo(tipo);
  }

  /* ---------------- Globo de diálogo ---------------- */
  let globoTimer = null;
  // ¿Hay un niño/perfil creado? Si no, la mascota saluda en genérico (sin nombre).
  function hayPerfil() {
    try { return !!(window.Juego && Juego.perfilActivo && Juego.perfilActivo()); }
    catch (e) { return false; }
  }
  function saludar() {
    const av = Juego.avatarNombre();
    const txt = hayPerfil()
      ? "¡Hola, " + Juego.jugador() + "! Soy " + av + " 🌙"
      : "¡Hola! Soy " + av + " 🌙";
    estado = "saludo"; tReaccion = durReaccion = 1.6;
    mostrarGloboTexto(txt, 2600);
  }
  function mostrarGlobo(tipo) {
    // Solo usamos el nombre si hay un perfil creado; si no, frase sin nombre.
    const n = hayPerfil() ? Juego.jugador() : null;
    const feliz = [
      n ? "¡Muy bien, " + n + "! 😄" : "¡Muy bien! 😄", "¡Genial! 🌟", "¡Sigue así! 💜", "¡Correcto! ✨", "¡Eres increíble! 🤩",
      n ? "¡Qué crack, " + n + "! 💪" : "¡Qué crack! 💪", "¡Brillante! 💡", "¡Lo clavaste! 🎯", "¡Súper! 🚀", "¡Bien pensado! 🧠",
      "¡Esa es! 👏", "¡Vas volando! 🪁"
    ];
    const triste = [
      "¡Casi! 🙂", n ? "¡Tú puedes, " + n + "! 💪" : "¡Tú puedes! 💪", "¡Otra vez! 🌙", "¡No te rindas! 💜",
      "¡Casi casi! Respira y prueba 🌈", n ? "¡Tranqui, " + n + ", inténtalo de nuevo! 🤗" : "¡Tranqui, inténtalo de nuevo! 🤗",
      "¡Equivocarse también enseña! 🌱", "¡Estás cerquita! 🔎"
    ];
    const fiesta = ["¡Lo lograste! 🏆", n ? "¡Campeón, " + n + "! 🥇" : "¡Campeón! 🥇", "¡Increíble ronda! 🎉", "¡Eres una estrella! 🌟"];
    let txt;
    if (tipo === "triste") txt = triste[Math.floor(Math.random() * triste.length)];
    else if (tipo === "fiesta") txt = fiesta[Math.floor(Math.random() * fiesta.length)];
    else txt = feliz[Math.floor(Math.random() * feliz.length)];
    mostrarGloboTexto(txt, 1900);
  }

  /* Pista/tip: la mascota la "sugiere" en su globo (no sobre el ejercicio). */
  function tip(texto) {
    if (!texto) return;
    estado = "tip"; tReaccion = durReaccion = 1.5;
    if (!ok3d) animarRespaldo("feliz");
    mostrarGloboTexto("💡 " + texto, 5200);
  }
  /* Decir algo arbitrario en el globo (saludos, avisos). */
  function decir(texto, ms) {
    if (!texto) return;
    estado = "saludo"; tReaccion = durReaccion = 1.4;
    mostrarGloboTexto(texto, ms || 2600);
  }

  /* Actualiza el nombre del avatar y lo reconstruye (niña/niño) en vivo. */
  function aplicarConfig() {
    const tag = document.querySelector("#luna .luna-nombre");
    if (tag) tag.textContent = "🌙 " + Juego.avatarNombre() + " ✋";
    if (ok3d && scene) {
      desecharGrupo();
      construirLuna();
    }
    saludar();
  }
  function mostrarGloboTexto(txt, ms) {
    const g = document.getElementById("luna-globo");
    if (!g) return;
    g.textContent = txt;
    g.classList.add("ver");
    if (globoTimer) clearTimeout(globoTimer);
    globoTimer = setTimeout(() => g.classList.remove("ver"), ms);
  }

  /* ---------------- Respaldo sin WebGL ---------------- */
  // Carita de la mascota según su sexo (no el del participante).
  function caraMascota() { return (Juego.generoMascota ? Juego.generoMascota() : Juego.genero()) === "nino" ? "👦" : "👧"; }
  function respaldoEmoji() {
    ok3d = false;
    const c = canvas();
    if (c) c.style.display = "none";
    let em = document.getElementById("luna-emoji");
    if (!em) {
      em = document.createElement("div");
      em.id = "luna-emoji";
      em.textContent = "🌙" + caraMascota();
      cont().insertBefore(em, document.querySelector(".luna-nombre"));
    }
  }
  function animarRespaldo(tipo) {
    const em = document.getElementById("luna-emoji");
    if (!em) return;
    const cara = caraMascota();
    em.textContent = tipo === "triste" ? "🌧️" + cara : (tipo === "fiesta" ? "🥳🌙" : "✨" + cara);
    setTimeout(() => (em.textContent = "🌙" + cara), 1600);
  }

  /* ---------------- Posición y arrastre ---------------- */
  function restaurarPosicion() {
    const guardada = Juego.cargar("luna_pos2", null);     // "luna_pos" era la clave vieja (guardaba hasta los toques)
    if (guardada && typeof guardada.x === "number") {
      colocar(guardada.x, guardada.y);
    } else {
      // Por defecto, en la esquina de abajo a la derecha: acompaña sin tapar el
      // ejercicio (antes caía encima de la tercera columna del menú y, en celular,
      // encima del propio ejercicio). El niño puede arrastrarla a donde quiera.
      colocar(window.innerWidth, window.innerHeight);
    }
  }

  function colocar(x, y) {
    const el = cont();
    const maxX = window.innerWidth - el.offsetWidth - 4;
    const maxY = window.innerHeight - el.offsetHeight - 4;
    el.style.left = Math.max(4, Math.min(x, maxX)) + "px";
    el.style.top = Math.max(4, Math.min(y, maxY)) + "px";
    el.style.right = "auto";
    el.style.bottom = "auto";
    // El globo se abre hacia el lado donde hay sitio (no se sale de la pantalla).
    const r = el.getBoundingClientRect();
    el.classList.toggle("lado-der", r.left + r.width / 2 > window.innerWidth / 2);
    el.classList.toggle("lado-izq", r.left + r.width / 2 <= window.innerWidth / 2);
    el.classList.toggle("arriba", r.top < 90);
  }

  function activarArrastre() {
    const el = cont();
    let arrastrando = false, offX = 0, offY = 0, movido = false, x0 = 0, y0 = 0;

    el.addEventListener("pointerdown", (e) => {
      arrastrando = true; movido = false;
      const r = el.getBoundingClientRect();
      offX = e.clientX - r.left;
      offY = e.clientY - r.top;
      x0 = e.clientX; y0 = e.clientY;
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      el.classList.add("agarrando");
    });
    el.addEventListener("pointermove", (e) => {
      if (!arrastrando) return;
      if (!movido && Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) < 6) return;   // un toque no es un arrastre
      movido = true;
      colocar(e.clientX - offX, e.clientY - offY);
    });
    const soltar = () => {
      if (!arrastrando) return;
      arrastrando = false;
      el.classList.remove("agarrando");
      if (movido) { const r = el.getBoundingClientRect(); Juego.guardar("luna_pos2", { x: r.left, y: r.top }); }
      else reaccion("feliz"); // un toque = saludo
    };
    el.addEventListener("pointerup", soltar);
    el.addEventListener("pointercancel", soltar);
  }

  return { init, reaccion, aplicarConfig, tip, decir };
})();
window.Luna = Luna;
