/* ============================================================
   ESCENA 3D con three.js
   Fondo animado: cielo, estrellas/burbujas flotantes y un
   "planeta" que gira. Incluye un efecto de celebración 3D.
   Expone: ESCENA.iniciar(), ESCENA.celebrar()
   ============================================================ */

const ESCENA = (function () {
  let renderer, scene, camera, reloj;
  let grupoBurbujas, planeta, anillo;
  let particulasFiesta = null;
  let tiempoFiesta = 0;
  let mascota = null, ojoIzq, ojoDer, brazoIzq, brazoDer;
  let estadoMascota = "idle", tiempoReaccion = 0;

  function iniciar() {
    const canvas = document.getElementById("lienzo3d");
    if (!window.THREE) {
      // Si no cargó three.js (sin internet), ponemos un fondo bonito de respaldo.
      document.body.style.background =
        "linear-gradient(160deg, #2e6cf6 0%, #8a5cf6 60%, #ef5ba1 100%)";
      return;
    }

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x2e6cf6, 0.02);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 18);

    // Luces
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const luz = new THREE.DirectionalLight(0xffffff, 0.9);
    luz.position.set(5, 8, 10);
    scene.add(luz);

    // Fondo en degradado mediante un gran domo de color
    const cieloGeo = new THREE.SphereGeometry(90, 32, 32);
    const cieloMat = new THREE.MeshBasicMaterial({ color: 0x1b3a8a, side: THREE.BackSide });
    scene.add(new THREE.Mesh(cieloGeo, cieloMat));

    // Planeta que gira (decorativo)
    planeta = new THREE.Mesh(
      new THREE.IcosahedronGeometry(4, 1),
      new THREE.MeshStandardMaterial({ color: 0x25c281, flatShading: true, roughness: 0.6 })
    );
    planeta.position.set(-9, -6, -6);
    scene.add(planeta);

    anillo = new THREE.Mesh(
      new THREE.TorusGeometry(6, 0.35, 12, 60),
      new THREE.MeshStandardMaterial({ color: 0xffc934, roughness: 0.4 })
    );
    anillo.position.copy(planeta.position);
    anillo.rotation.x = Math.PI / 2.4;
    scene.add(anillo);

    // Burbujas/estrellas flotantes
    grupoBurbujas = new THREE.Group();
    const colores = [0xffffff, 0xffc934, 0x8a5cf6, 0x7ef0bb, 0xef5ba1];
    for (let i = 0; i < 90; i++) {
      const geo = new THREE.SphereGeometry(0.18 + Math.random() * 0.35, 8, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: colores[i % colores.length],
        emissive: colores[i % colores.length],
        emissiveIntensity: 0.3
      });
      const b = new THREE.Mesh(geo, mat);
      b.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30 - 5
      );
      b.userData.vel = 0.4 + Math.random() * 0.8;
      b.userData.giro = (Math.random() - 0.5) * 0.5;
      grupoBurbujas.add(b);
    }
    scene.add(grupoBurbujas);

    // La mascota ahora es "Luna" (módulo aparte, arrastrable). No creamos la del fondo.
    // crearMascota();

    reloj = new THREE.Clock();
    window.addEventListener("resize", redimensionar);
    animar();
  }

  /* ---------- Mascota: el robot amigo de Nelson ---------- */
  function crearMascota() {
    mascota = new THREE.Group();

    // Colores cálidos para que CONTRASTE con el fondo azul
    const cuerpoMat = new THREE.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.4, metalness: 0.2 });
    const claroMat = new THREE.MeshStandardMaterial({ color: 0xffc934, roughness: 0.4 });

    // Cuerpo (esfera alargada; CapsuleGeometry no existe en r128)
    const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 24), cuerpoMat);
    cuerpo.scale.set(1, 1.3, 1);
    mascota.add(cuerpo);

    // Cabeza
    const cabeza = new THREE.Mesh(new THREE.SphereGeometry(1.05, 24, 24), cuerpoMat);
    cabeza.position.y = 2.2;
    mascota.add(cabeza);

    // Visera / cara
    const cara = new THREE.Mesh(new THREE.SphereGeometry(0.78, 24, 24), new THREE.MeshStandardMaterial({ color: 0x0c1633 }));
    cara.position.set(0, 2.2, 0.55);
    cara.scale.set(1, 0.8, 0.6);
    mascota.add(cara);

    // Ojos
    const ojoGeo = new THREE.SphereGeometry(0.17, 16, 16);
    const ojoMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7ef0bb, emissiveIntensity: 0.8 });
    ojoIzq = new THREE.Mesh(ojoGeo, ojoMat); ojoIzq.position.set(-0.28, 2.28, 1.0);
    ojoDer = new THREE.Mesh(ojoGeo, ojoMat); ojoDer.position.set(0.28, 2.28, 1.0);
    mascota.add(ojoIzq, ojoDer);

    // Antena
    const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), claroMat);
    antena.position.set(0, 3.5, 0);
    mascota.add(antena);
    const bolita = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffc934, emissive: 0xffc934, emissiveIntensity: 0.6 }));
    bolita.position.set(0, 3.95, 0);
    mascota.add(bolita);

    // Brazos (cilindros, compatibles con r128)
    const brazoGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 10);
    brazoIzq = new THREE.Mesh(brazoGeo, claroMat); brazoIzq.position.set(-1.3, 0.4, 0);
    brazoDer = new THREE.Mesh(brazoGeo, claroMat); brazoDer.position.set(1.3, 0.4, 0);
    mascota.add(brazoIzq, brazoDer);

    mascota.scale.set(1.05, 1.05, 1.05);
    mascota.position.set(6, -2.4, 9);
    // Luz propia para que resalte sobre el fondo
    const foco = new THREE.PointLight(0xffffff, 0.8, 40);
    foco.position.set(6, 2, 14);
    scene.add(foco);
    scene.add(mascota);
  }

  function mascotaFeliz() { estadoMascota = "feliz"; tiempoReaccion = 1.4; }
  function mascotaTriste() { estadoMascota = "triste"; tiempoReaccion = 1.2; }

  function redimensionar() {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animar() {
    requestAnimationFrame(animar);
    if (!renderer) return;
    const dt = reloj.getDelta();
    const t = reloj.getElapsedTime();

    planeta.rotation.y += dt * 0.3;
    planeta.rotation.x += dt * 0.1;
    anillo.rotation.z += dt * 0.4;

    grupoBurbujas.children.forEach((b) => {
      b.position.y += b.userData.vel * dt;
      b.rotation.y += b.userData.giro * dt;
      if (b.position.y > 22) b.position.y = -22; // reaparece abajo
    });
    grupoBurbujas.rotation.y = Math.sin(t * 0.05) * 0.2;

    camera.position.x = Math.sin(t * 0.1) * 1.5;
    camera.lookAt(0, 0, 0);

    actualizarMascota(dt, t);
    actualizarFiesta(dt);
    renderer.render(scene, camera);
  }

  function actualizarMascota(dt, t) {
    if (!mascota) return;
    // Flotación tranquila
    let baseY = -2.4 + Math.sin(t * 2) * 0.18;
    mascota.rotation.y = Math.sin(t * 0.8) * 0.25;

    if (tiempoReaccion > 0) {
      tiempoReaccion -= dt;
      const k = tiempoReaccion;
      if (estadoMascota === "feliz") {
        // Salta y agita los brazos
        baseY += Math.abs(Math.sin(k * 12)) * 1.1;
        mascota.rotation.y += Math.sin(k * 18) * 0.15;
        brazoIzq.rotation.z = Math.sin(k * 20) * 0.9 + 0.6;
        brazoDer.rotation.z = -Math.sin(k * 20) * 0.9 - 0.6;
        const e = 1 + Math.abs(Math.sin(k * 12)) * 0.4;
        ojoIzq.scale.set(e, e, e); ojoDer.scale.set(e, e, e);
      } else if (estadoMascota === "triste") {
        // Se encoge y baja la mirada
        baseY -= 0.3;
        mascota.rotation.z = Math.sin(k * 4) * 0.12;
        brazoIzq.rotation.z = -0.4; brazoDer.rotation.z = 0.4;
        ojoIzq.scale.set(1, 0.4, 1); ojoDer.scale.set(1, 0.4, 1);
      }
    } else {
      // Reposo
      estadoMascota = "idle";
      mascota.rotation.z = 0;
      brazoIzq.rotation.z = 0.2; brazoDer.rotation.z = -0.2;
      // Parpadeo ocasional
      const blink = Math.sin(t * 2.3) > 0.98 ? 0.2 : 1;
      ojoIzq.scale.set(1, blink, 1); ojoDer.scale.set(1, blink, 1);
    }
    mascota.position.y = baseY;
  }

  /* --------- Celebración 3D: explosión de partículas --------- */
  function celebrar() {
    if (!renderer) return;
    if (particulasFiesta) scene.remove(particulasFiesta);

    const cantidad = 220;
    const geo = new THREE.BufferGeometry();
    const posiciones = new Float32Array(cantidad * 3);
    const velocidades = [];
    const coloresArr = new Float32Array(cantidad * 3);
    const paleta = [
      [1, 0.79, 0.2], [0.49, 0.94, 0.73], [0.54, 0.36, 0.96],
      [0.94, 0.36, 0.63], [0.18, 0.42, 0.96]
    ];

    for (let i = 0; i < cantidad; i++) {
      posiciones[i * 3] = 0;
      posiciones[i * 3 + 1] = 2;
      posiciones[i * 3 + 2] = 6;
      velocidades.push(new THREE.Vector3(
        (Math.random() - 0.5) * 18,
        Math.random() * 14 + 4,
        (Math.random() - 0.5) * 10
      ));
      const c = paleta[i % paleta.length];
      coloresArr[i * 3] = c[0];
      coloresArr[i * 3 + 1] = c[1];
      coloresArr[i * 3 + 2] = c[2];
    }
    geo.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(coloresArr, 3));
    const mat = new THREE.PointsMaterial({ size: 0.5, vertexColors: true });
    particulasFiesta = new THREE.Points(geo, mat);
    particulasFiesta.userData.velocidades = velocidades;
    scene.add(particulasFiesta);
    tiempoFiesta = 2.2;
  }

  function actualizarFiesta(dt) {
    if (!particulasFiesta || tiempoFiesta <= 0) return;
    tiempoFiesta -= dt;
    const pos = particulasFiesta.geometry.attributes.position.array;
    const vel = particulasFiesta.userData.velocidades;
    for (let i = 0; i < vel.length; i++) {
      vel[i].y -= 18 * dt; // gravedad
      pos[i * 3] += vel[i].x * dt;
      pos[i * 3 + 1] += vel[i].y * dt;
      pos[i * 3 + 2] += vel[i].z * dt;
    }
    particulasFiesta.geometry.attributes.position.needsUpdate = true;
    particulasFiesta.material.opacity = Math.max(0, tiempoFiesta / 2.2);
    particulasFiesta.material.transparent = true;
    if (tiempoFiesta <= 0) {
      scene.remove(particulasFiesta);
      particulasFiesta = null;
    }
  }

  return { iniciar, celebrar, mascotaFeliz, mascotaTriste };
})();
window.ESCENA = ESCENA;
