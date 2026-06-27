/* ============================================================
   LUNA — mascota 3D (niña con tema lunar)
   - Vive en su propio canvas, encima de la interfaz.
   - Se puede ARRASTRAR a cualquier lugar (ratón o dedo).
   - Animaciones: flotar, parpadear, saltar de alegría,
     ponerse triste. Reacciona a aciertos y errores.
   - Si no hay WebGL, muestra un respaldo (emoji 🌙).
   Expone: Luna.init(), Luna.reaccion("feliz"|"triste"|"fiesta")
   ============================================================ */

const Luna = (function () {
  let renderer, scene, camera, reloj, grupo;
  let ojoIzq, ojoDer, brazoIzq, brazoDer, lunita;
  let estado = "idle", tReaccion = 0, proxGesto = 5;
  let ok3d = false;

  const cont = () => document.getElementById("luna");
  const canvas = () => document.getElementById("luna-canvas");

  function init() {
    restaurarPosicion();
    activarArrastre();
    saludar();
    try {
      iniciar3D();
    } catch (e) {
      respaldoEmoji();
    }
  }

  /* ---------------- Construcción 3D ---------------- */
  function iniciar3D() {
    if (!window.THREE) { respaldoEmoji(); return; }
    const c = canvas();
    const w = c.clientWidth || 150, h = c.clientHeight || 165;
    renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0); // fondo transparente
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    ok3d = true;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 50);
    camera.position.set(0, 0.4, 6);
    camera.lookAt(0, 0.2, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(2, 4, 5);
    scene.add(dir);
    const glow = new THREE.PointLight(0xfff3b0, 0.7, 20);
    glow.position.set(-2, 2, 3);
    scene.add(glow);

    construirLuna();
    reloj = new THREE.Clock();
    animar();
  }

  function construirLuna() {
    grupo = new THREE.Group();
    const esNina = (Juego.generoMascota ? Juego.generoMascota() : Juego.genero()) !== "nino";

    const piel = new THREE.MeshStandardMaterial({ color: 0xffd9b0, roughness: 0.7 });
    const pelo = new THREE.MeshStandardMaterial({ color: 0x3a2d5c, roughness: 0.6 });
    const vestido = new THREE.MeshStandardMaterial({ color: esNina ? 0x8a5cf6 : 0x2e6cf6, roughness: 0.5 });
    const pantalon = new THREE.MeshStandardMaterial({ color: 0x2a2540, roughness: 0.6 });
    const detalle = new THREE.MeshStandardMaterial({ color: 0xffc0e0, roughness: 0.5 });
    const oscuro = new THREE.MeshStandardMaterial({ color: 0x201a33 });
    const lunaMat = new THREE.MeshStandardMaterial({ color: 0xfff3b0, emissive: 0xffe066, emissiveIntensity: 0.9, roughness: 0.4 });

    if (esNina) {
      // Vestido (cono: ancho abajo, hombros arriba)
      const dress = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.9, 28), vestido);
      dress.position.y = -0.55;
      grupo.add(dress);
      for (let i = 0; i < 5; i++) {
        const est = new THREE.Mesh(new THREE.TetrahedronGeometry(0.1), lunaMat);
        const ang = (i / 5) * Math.PI - Math.PI / 2;
        est.position.set(Math.cos(ang) * 0.5, -0.7 + (i % 2) * 0.3, 0.62 + Math.sin(ang) * 0.1);
        grupo.add(est);
      }
    } else {
      // Niño: camiseta + pantalón con piernas
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 1.0, 20), vestido);
      torso.position.y = 0.0;
      grupo.add(torso);
      const piernaGeo = new THREE.CylinderGeometry(0.2, 0.18, 0.85, 14);
      const pIzq = new THREE.Mesh(piernaGeo, pantalon); pIzq.position.set(-0.25, -0.9, 0);
      const pDer = new THREE.Mesh(piernaGeo, pantalon); pDer.position.set(0.25, -0.9, 0);
      grupo.add(pIzq, pDer);
      // Estrellita en la camiseta
      const est = new THREE.Mesh(new THREE.TetrahedronGeometry(0.14), lunaMat);
      est.position.set(0, 0.05, 0.5);
      grupo.add(est);
    }

    // Cuello
    const cuello = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 12), piel);
    cuello.position.y = 0.45;
    grupo.add(cuello);

    // Cabeza
    const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.55, 28, 28), piel);
    cabeza.position.y = 1.0;
    grupo.add(cabeza);

    // Pelo: parte de atrás
    const peloAtras = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 24), pelo);
    peloAtras.position.set(0, 1.08, -0.08);
    if (!esNina) peloAtras.scale.set(1, 0.85, 0.9);
    grupo.add(peloAtras);
    // Flequillo
    const flequillo = new THREE.Mesh(new THREE.SphereGeometry(0.58, 24, 24), pelo);
    flequillo.position.set(0, 1.28, 0.05);
    flequillo.scale.set(1, 0.55, 1);
    grupo.add(flequillo);
    if (esNina) {
      // Mechones largos a los lados (solo la niña)
      const mechGeo = new THREE.CylinderGeometry(0.16, 0.12, 1.2, 12);
      const mechIzq = new THREE.Mesh(mechGeo, pelo); mechIzq.position.set(-0.5, 0.55, -0.05);
      const mechDer = new THREE.Mesh(mechGeo, pelo); mechDer.position.set(0.5, 0.55, -0.05);
      grupo.add(mechIzq, mechDer);
    }

    // Ojos
    const ojoGeo = new THREE.SphereGeometry(0.085, 16, 16);
    ojoIzq = new THREE.Mesh(ojoGeo, oscuro); ojoIzq.position.set(-0.2, 1.02, 0.49);
    ojoDer = new THREE.Mesh(ojoGeo, oscuro); ojoDer.position.set(0.2, 1.02, 0.49);
    grupo.add(ojoIzq, ojoDer);
    // Brillito en los ojos
    const briGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const briMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 });
    const bIzq = new THREE.Mesh(briGeo, briMat); bIzq.position.set(-0.17, 1.05, 0.56);
    const bDer = new THREE.Mesh(briGeo, briMat); bDer.position.set(0.23, 1.05, 0.56);
    grupo.add(bIzq, bDer);

    // Cachetes
    const cacheGeo = new THREE.SphereGeometry(0.1, 12, 12);
    const cIzq = new THREE.Mesh(cacheGeo, detalle); cIzq.position.set(-0.34, 0.86, 0.42); cIzq.scale.set(1, 0.7, 0.5);
    const cDer = new THREE.Mesh(cacheGeo, detalle); cDer.position.set(0.34, 0.86, 0.42); cDer.scale.set(1, 0.7, 0.5);
    grupo.add(cIzq, cDer);

    // Sonrisa (medio toro)
    const sonrisa = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.028, 8, 16, Math.PI), oscuro);
    sonrisa.position.set(0, 0.82, 0.48);
    sonrisa.rotation.z = Math.PI; // abre hacia arriba
    grupo.add(sonrisa);

    // Brazos
    const brazoGeo = new THREE.CylinderGeometry(0.11, 0.1, 0.9, 12);
    brazoIzq = new THREE.Mesh(brazoGeo, piel); brazoIzq.position.set(-0.7, -0.2, 0.1); brazoIzq.rotation.z = 0.5;
    brazoDer = new THREE.Mesh(brazoGeo, piel); brazoDer.position.set(0.7, -0.2, 0.1); brazoDer.rotation.z = -0.5;
    grupo.add(brazoIzq, brazoDer);

    // Diadema con luna (broche) — solo la niña
    if (esNina) {
      const broche = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 10, 20, Math.PI * 1.4), lunaMat);
      broche.position.set(-0.38, 1.42, 0.18);
      broche.rotation.set(0.3, 0, 0.6);
      grupo.add(broche);
    }

    // Lunita compañera que flota a su lado
    lunita = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.09, 12, 24, Math.PI * 1.35), lunaMat);
    lunita.position.set(1.3, 1.5, 0);
    grupo.add(lunita);

    grupo.position.y = -0.2;
    scene.add(grupo);
  }

  /* ---------------- Animación ---------------- */
  function animar() {
    requestAnimationFrame(animar);
    if (!ok3d) return;
    const dt = reloj.getDelta();
    const t = reloj.getElapsedTime();

    let baseY = -0.2 + Math.sin(t * 2) * 0.06;
    grupo.rotation.y = Math.sin(t * 0.9) * 0.18;
    grupo.rotation.z = 0;

    // Lunita orbitando
    if (lunita) {
      lunita.position.set(1.25 * Math.cos(t * 0.8), 1.4 + Math.sin(t * 1.6) * 0.15, 1.25 * Math.sin(t * 0.8) * 0.4);
      lunita.rotation.z += dt * 1.2;
    }

    if (tReaccion > 0) {
      tReaccion -= dt;
      const k = tReaccion;
      if (estado === "feliz" || estado === "fiesta") {
        baseY += Math.abs(Math.sin(k * 11)) * 0.6;
        grupo.rotation.y += (estado === "fiesta" ? Math.sin(k * 16) * 0.5 : Math.sin(k * 14) * 0.2);
        brazoIzq.rotation.z = 0.5 + Math.sin(k * 18) * 0.7 + 0.8;
        brazoDer.rotation.z = -0.5 - Math.sin(k * 18) * 0.7 - 0.8;
        const e = 1 + Math.abs(Math.sin(k * 11)) * 0.3;
        ojoIzq.scale.set(e, e, e); ojoDer.scale.set(e, e, e);
      } else if (estado === "triste") {
        baseY -= 0.18;
        grupo.rotation.z = Math.sin(k * 4) * 0.12;
        brazoIzq.rotation.z = 0.2; brazoDer.rotation.z = -0.2;
        ojoIzq.scale.set(1, 0.4, 1); ojoDer.scale.set(1, 0.4, 1);
      } else if (estado === "saludo" || estado === "tip") {
        // Saluda/da una idea: mueve un brazo y ladea la cabeza
        baseY += Math.abs(Math.sin(k * 7)) * 0.12;
        brazoDer.rotation.z = -0.5 - Math.abs(Math.sin(k * 15)) * 1.2;
        brazoIzq.rotation.z = 0.5;
        grupo.rotation.z = Math.sin(k * 6) * 0.07;
      } else if (estado === "pensar") {
        // Piensa: se inclina y mira hacia arriba
        grupo.rotation.z = 0.12;
        brazoDer.rotation.z = -1.3;
        ojoIzq.position.y = 1.06; ojoDer.position.y = 1.06;
      }
    } else {
      estado = "idle";
      brazoIzq.rotation.z = 0.5; brazoDer.rotation.z = -0.5;
      ojoIzq.position.y = 1.02; ojoDer.position.y = 1.02;
      const blink = Math.sin(t * 2.4) > 0.97 ? 0.15 : 1; // parpadeo
      ojoIzq.scale.set(1, blink, 1); ojoDer.scale.set(1, blink, 1);
      // Gesto espontáneo cada cierto rato (saluda o piensa solita)
      if (t > proxGesto) {
        proxGesto = t + 7 + Math.random() * 7;
        estado = Math.random() < 0.6 ? "saludo" : "pensar";
        tReaccion = 1.2;
      }
    }
    grupo.position.y = baseY;

    renderer.render(scene, camera);
  }

  function reaccion(tipo) {
    estado = tipo;
    tReaccion = tipo === "fiesta" ? 1.8 : 1.3;
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
    estado = "tip"; tReaccion = 1.4;
    if (!ok3d) animarRespaldo("feliz");
    mostrarGloboTexto("💡 " + texto, 5200);
  }
  /* Decir algo arbitrario en el globo (saludos, avisos). */
  function decir(texto, ms) {
    if (!texto) return;
    estado = "saludo"; tReaccion = 1.2;
    mostrarGloboTexto(texto, ms || 2600);
  }

  /* Actualiza el nombre del avatar y lo reconstruye (niña/niño) en vivo. */
  function aplicarConfig() {
    const tag = document.querySelector("#luna .luna-nombre");
    if (tag) tag.textContent = "🌙 " + Juego.avatarNombre() + " ✋";
    if (ok3d && scene && grupo) {
      scene.remove(grupo);
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

  /* ---------------- Arrastre ---------------- */
  function restaurarPosicion() {
    const el = cont();
    const guardada = Juego.cargar("luna_pos", null);
    if (guardada && typeof guardada.x === "number") {
      colocar(guardada.x, guardada.y);
    } else {
      // Cerca de los ejercicios: a la derecha, hacia el centro
      const x = Math.min(window.innerWidth - 180, window.innerWidth / 2 + 230);
      const y = Math.max(90, window.innerHeight / 2 - 140);
      colocar(x, y);
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
  }

  function activarArrastre() {
    const el = cont();
    let arrastrando = false, offX = 0, offY = 0, movido = false;

    el.addEventListener("pointerdown", (e) => {
      arrastrando = true; movido = false;
      const r = el.getBoundingClientRect();
      offX = e.clientX - r.left;
      offY = e.clientY - r.top;
      el.setPointerCapture(e.pointerId);
      el.classList.add("agarrando");
    });
    el.addEventListener("pointermove", (e) => {
      if (!arrastrando) return;
      movido = true;
      colocar(e.clientX - offX, e.clientY - offY);
    });
    const soltar = (e) => {
      if (!arrastrando) return;
      arrastrando = false;
      el.classList.remove("agarrando");
      const r = el.getBoundingClientRect();
      Juego.guardar("luna_pos", { x: r.left, y: r.top });
      if (!movido) reaccion("feliz"); // un toque = saludo
    };
    el.addEventListener("pointerup", soltar);
    el.addEventListener("pointercancel", soltar);
  }

  return { init, reaccion, aplicarConfig, tip, decir };
})();
window.Luna = Luna;
