import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Sun,
  Moon,
  Sunset,
  RotateCw,
  Eye,
  Store,
  Compass,
  ArrowRight,
  Maximize2,
  Navigation,
  CheckCircle2,
} from "lucide-react";

// Shop landmarks on the 3D Island
const LANDMARKS = [
  {
    id: "bakery",
    name: "Golden Crust Bakery",
    category: "Food & Drink",
    rating: "4.9",
    reviews: 128,
    distance: "300m away",
    status: "Fresh bread out now",
    position: { x: -2.0, y: 1.4, z: 1.2 },
    color: "#f59e0b",
    link: "/shops?q=Bakery",
    desc: "Sourdough, croissants, and single-origin coffee made fresh every morning.",
  },
  {
    id: "botanics",
    name: "Greenery & Bloom",
    category: "Health & Beauty",
    rating: "4.8",
    reviews: 94,
    distance: "550m away",
    status: "Organic care",
    position: { x: 1.8, y: 1.4, z: -1.0 },
    color: "#10b981",
    link: "/shops?q=Beauty",
    desc: "Handcrafted herbal soaps, natural oils, and rare house plants.",
  },
  {
    id: "atelier",
    name: "Urban Craft Studio",
    category: "Arts & Gifts",
    rating: "5.0",
    reviews: 76,
    distance: "800m away",
    status: "Custom gifts",
    position: { x: 1.6, y: 1.4, z: 1.6 },
    color: "#8b5cf6",
    link: "/shops?q=Arts",
    desc: "Ceramics, bespoke leather items, and pottery classes for neighbors.",
  },
  {
    id: "beacon",
    name: "LocalSphere Hub",
    category: "Community Center",
    rating: "5.0",
    reviews: 310,
    distance: "Central Square",
    status: "Express delivery hub",
    position: { x: -0.4, y: 2.6, z: -1.8 },
    color: "#d2f36b",
    link: "/shops",
    desc: "Neighborhood order pickup, drop-off, and local artisan showcase.",
  },
];

export default function Hero3DIsland() {
  const mountRef = useRef(null);
  const [activePin, setActivePin] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState("day"); // 'day' | 'sunset' | 'night'
  const [autoRotate, setAutoRotate] = useState(true);
  const [interactionHint, setInteractionHint] = useState(true);
  const [touchInteractive, setTouchInteractive] = useState(true);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef({});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Renderer setup
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (e) {
      console.warn("WebGL initialization failed:", e);
      return;
    }

    const width = container.clientWidth || 550;
    const height = container.clientHeight || 550;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(11, 8.5, 12);
    camera.lookAt(0, 0.4, 0);
    cameraRef.current = camera;

    // Lighting Groups
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    sunLight.position.set(8, 14, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 30;
    sunLight.shadow.camera.left = -6;
    sunLight.shadow.camera.right = 6;
    sunLight.shadow.camera.top = 6;
    sunLight.shadow.camera.bottom = -6;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xdff4ec, 0x3d4b3c, 1.2);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const warmFill = new THREE.PointLight(0xffeedd, 0.8, 15);
    warmFill.position.set(-6, 4, -4);
    scene.add(warmFill);

    // Night / Sunset accents
    const neonGreen = new THREE.PointLight(0xd2f36b, 0, 10);
    neonGreen.position.set(-0.4, 2.5, -1.8);
    scene.add(neonGreen);

    const bakeryGlow = new THREE.PointLight(0xffaa44, 0.8, 6);
    bakeryGlow.position.set(-2, 1.3, 1.2);
    scene.add(bakeryGlow);

    // Island Root Group
    const islandGroup = new THREE.Group();
    scene.add(islandGroup);

    // Materials
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x3f8a5e,
      roughness: 0.65,
      metalness: 0.05,
    });
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0x47554b,
      roughness: 0.9,
      metalness: 0.1,
    });
    const subGrassMat = new THREE.MeshStandardMaterial({
      color: 0x86efac,
      roughness: 0.5,
    });
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0xd8e3d6,
      roughness: 0.85,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.7,
    });
    const roofRed = new THREE.MeshStandardMaterial({
      color: 0xd9534f,
      roughness: 0.5,
    });
    const roofBlue = new THREE.MeshStandardMaterial({
      color: 0x244d3d,
      roughness: 0.4,
    });
    const limeAccent = new THREE.MeshStandardMaterial({
      color: 0xd2f36b,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x88cc22,
      emissiveIntensity: 0.3,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xddf4ff,
      roughness: 0.1,
      transmission: 0.85,
      thickness: 0.5,
      transparent: true,
      opacity: 0.85,
    });

    // 1. Base Island Terrain (Layered Floating Steppes)
    const islandTopGeo = new THREE.CylinderGeometry(5.2, 5.0, 0.6, 28);
    const islandTop = new THREE.Mesh(islandTopGeo, grassMat);
    islandTop.position.y = 0;
    islandTop.receiveShadow = true;
    islandGroup.add(islandTop);

    // Sub-plateau
    const subTerrGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.3, 20);
    const subTerr = new THREE.Mesh(subTerrGeo, subGrassMat);
    subTerr.position.set(-0.2, 0.4, -0.4);
    subTerr.receiveShadow = true;
    islandGroup.add(subTerr);

    // Rocky underbelly (faceted inverted cone)
    const cliffGeo = new THREE.CylinderGeometry(5.0, 0.8, 2.8, 14, 2);
    // Displace vertices slightly for rocky stylized feel
    const posAttr = cliffGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      if (y < 0) {
        posAttr.setX(i, posAttr.getX(i) + (Math.random() - 0.5) * 0.3);
        posAttr.setZ(i, posAttr.getZ(i) + (Math.random() - 0.5) * 0.3);
      }
    }
    cliffGeo.computeVertexNormals();
    const cliff = new THREE.Mesh(cliffGeo, cliffMat);
    cliff.position.y = -1.6;
    cliff.receiveShadow = true;
    islandGroup.add(cliff);

    // Decorative water pool / pond
    const pondGeo = new THREE.CircleGeometry(1.2, 20);
    const pondMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.8,
    });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(-1.8, 0.32, -1.8);
    islandGroup.add(pond);

    // Cobblestone Pathways (Torus/Curves)
    const pathGeo = new THREE.RingGeometry(2.4, 3.2, 28, 1, 0, Math.PI * 1.6);
    const path = new THREE.Mesh(pathGeo, roadMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.31, 0);
    path.receiveShadow = true;
    islandGroup.add(path);

    // 2. BUILDINGS
    // --- Shop 1: Bakery (Left Front)
    const bakeryGroup = new THREE.Group();
    bakeryGroup.position.set(-2.0, 0.3, 1.2);

    const bBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.3), new THREE.MeshStandardMaterial({ color: 0xfdfbf7 }));
    bBase.position.y = 0.55;
    bBase.castShadow = true;
    bBase.receiveShadow = true;
    bakeryGroup.add(bBase);

    // Awning striped
    const awningGeo = new THREE.BoxGeometry(1.45, 0.12, 0.55);
    const awning = new THREE.Mesh(awningGeo, new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 }));
    awning.position.set(0, 0.85, 0.8);
    awning.rotation.x = 0.25;
    bakeryGroup.add(awning);

    // Roof
    const bRoofGeo = new THREE.ConeGeometry(1.2, 0.7, 4);
    const bRoof = new THREE.Mesh(bRoofGeo, roofRed);
    bRoof.position.y = 1.45;
    bRoof.rotation.y = Math.PI / 4;
    bRoof.castShadow = true;
    bakeryGroup.add(bRoof);

    // Glowing window
    const bWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.45), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
    bWindow.position.set(0, 0.5, 0.66);
    bakeryGroup.add(bWindow);

    islandGroup.add(bakeryGroup);

    // --- Shop 2: Botanics / Modern Boutique (Right Back)
    const botanicsGroup = new THREE.Group();
    botanicsGroup.position.set(1.8, 0.3, -1.0);

    const botBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.3, 1.4), new THREE.MeshStandardMaterial({ color: 0x244d3d, roughness: 0.3 }));
    botBase.position.y = 0.65;
    botBase.castShadow = true;
    botBase.receiveShadow = true;
    botanicsGroup.add(botBase);

    // Greenhouse Glass Skylight
    const glassDome = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.4, 8), glassMat);
    glassDome.position.y = 1.45;
    botanicsGroup.add(glassDome);

    // Large glass display
    const botDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), glassMat);
    botDisplay.position.set(0, 0.6, 0.71);
    botanicsGroup.add(botDisplay);

    islandGroup.add(botanicsGroup);

    // --- Shop 3: Artisan Studio (Right Front)
    const studioGroup = new THREE.Group();
    studioGroup.position.set(1.6, 0.3, 1.6);

    const studBase = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 1.2), new THREE.MeshStandardMaterial({ color: 0xf1f5f9 }));
    studBase.position.y = 0.5;
    studBase.castShadow = true;
    studioGroup.add(studBase);

    const studRoof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 1.3), roofBlue);
    studRoof.position.y = 1.05;
    studioGroup.add(studRoof);

    // Ceramic vase prop outside
    const vaseGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.28, 8);
    const vase = new THREE.Mesh(vaseGeo, new THREE.MeshStandardMaterial({ color: 0xec4899 }));
    vase.position.set(-0.55, 0.14, 0.8);
    studioGroup.add(vase);

    islandGroup.add(studioGroup);

    // --- Landmark: Central Clocktower / Beacon (Center Back)
    const towerGroup = new THREE.Group();
    towerGroup.position.set(-0.4, 0.55, -1.8);

    const towerGeo = new THREE.CylinderGeometry(0.45, 0.65, 2.8, 6);
    const tower = new THREE.Mesh(towerGeo, new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }));
    tower.position.y = 1.4;
    tower.castShadow = true;
    towerGroup.add(tower);

    // Spire
    const spireGeo = new THREE.ConeGeometry(0.48, 1.0, 6);
    const spire = new THREE.Mesh(spireGeo, limeAccent);
    spire.position.y = 3.3;
    spire.castShadow = true;
    towerGroup.add(spire);

    // Rotating Holographic Ring atop Beacon
    const ringGeo = new THREE.TorusGeometry(0.65, 0.05, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd2f36b, wireframe: true });
    const holoRing = new THREE.Mesh(ringGeo, ringMat);
    holoRing.position.y = 3.9;
    holoRing.rotation.x = Math.PI / 3;
    towerGroup.add(holoRing);

    islandGroup.add(towerGroup);

    // 3. NATURE & TREES
    const treeGeoCone = new THREE.ConeGeometry(0.5, 1.1, 6);
    const treeTrunkGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.4, 5);
    const treeMat1 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 });
    const treeMat2 = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.5 });
    const treeMat3 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

    const treePositions = [
      [-3.4, 0.3, 0.2, treeMat1],
      [-2.8, 0.3, -0.9, treeMat2],
      [-1.2, 0.3, 2.8, treeMat3],
      [0.2, 0.3, 3.2, treeMat1],
      [3.0, 0.3, 0.4, treeMat2],
      [2.6, 0.3, -2.4, treeMat1],
      [0.6, 0.3, -3.2, treeMat3],
      [-3.0, 0.3, 2.0, treeMat2],
    ];

    treePositions.forEach(([x, y, z, mat]) => {
      const tg = new THREE.Group();
      tg.position.set(x, y, z);
      const trunk = new THREE.Mesh(treeTrunkGeo, woodMat);
      trunk.position.y = 0.2;
      trunk.castShadow = true;
      tg.add(trunk);
      const foliage = new THREE.Mesh(treeGeoCone, mat);
      foliage.position.y = 0.85;
      foliage.castShadow = true;
      tg.add(foliage);
      islandGroup.add(tg);
    });

    // 4. ANIMATED ASSETS
    // --- A. Delivery Scooter cruising the path
    const scooterGroup = new THREE.Group();
    const scooterBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.6), limeAccent);
    scooterBody.position.y = 0.2;
    scooterBody.castShadow = true;
    scooterGroup.add(scooterBody);

    const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 8);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
    const fWheel = new THREE.Mesh(wheelGeo, wheelMat);
    fWheel.rotation.z = Math.PI / 2;
    fWheel.position.set(0, 0.1, 0.25);
    scooterGroup.add(fWheel);

    const rWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rWheel.rotation.z = Math.PI / 2;
    rWheel.position.set(0, 0.1, -0.25);
    scooterGroup.add(rWheel);

    // Parcel box on back
    const parcelGeo = new THREE.BoxGeometry(0.22, 0.2, 0.22);
    const parcel = new THREE.Mesh(parcelGeo, new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    parcel.position.set(0, 0.4, -0.2);
    scooterGroup.add(parcel);

    islandGroup.add(scooterGroup);

    // --- B. Floating Delivery Drone with swinging package
    const droneGroup = new THREE.Group();
    droneGroup.position.set(1.5, 4.2, 0);

    const droneBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 6), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    droneGroup.add(droneBody);

    // Propellers
    const propGeo = new THREE.BoxGeometry(0.5, 0.02, 0.06);
    const propMat = new THREE.MeshBasicMaterial({ color: 0xd2f36b });
    const prop1 = new THREE.Mesh(propGeo, propMat);
    prop1.position.set(0.35, 0.1, 0.35);
    droneGroup.add(prop1);
    const prop2 = new THREE.Mesh(propGeo, propMat);
    prop2.position.set(-0.35, 0.1, -0.35);
    droneGroup.add(prop2);
    const prop3 = new THREE.Mesh(propGeo, propMat);
    prop3.position.set(0.35, 0.1, -0.35);
    droneGroup.add(prop3);
    const prop4 = new THREE.Mesh(propGeo, propMat);
    prop4.position.set(-0.35, 0.1, 0.35);
    droneGroup.add(prop4);

    // Hanging package
    const droneBox = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
    droneBox.position.set(0, -0.45, 0);
    droneGroup.add(droneBox);

    islandGroup.add(droneGroup);

    // --- C. Floating Interactive 3D Landmark Pins
    const pinMeshes = [];
    LANDMARKS.forEach((lm) => {
      const pinAnchor = new THREE.Group();
      pinAnchor.position.set(lm.position.x, lm.position.y + 0.3, lm.position.z);
      pinAnchor.userData = { id: lm.id, landmark: lm };

      // Pin head
      const sphereGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: lm.color,
        emissive: lm.color,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      });
      const pinSphere = new THREE.Mesh(sphereGeo, sphereMat);
      pinSphere.position.y = 0.5;
      pinAnchor.add(pinSphere);

      // Pin needle
      const coneGeo = new THREE.ConeGeometry(0.14, 0.45, 8);
      coneGeo.rotateX(Math.PI);
      const pinCone = new THREE.Mesh(coneGeo, sphereMat);
      pinCone.position.y = 0.22;
      pinAnchor.add(pinCone);

      // Pulse ring on ground
      const pulseGeo = new THREE.RingGeometry(0.25, 0.38, 16);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: lm.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      pulse.rotation.x = -Math.PI / 2;
      pulse.position.y = 0.05;
      pinAnchor.add(pulse);

      islandGroup.add(pinAnchor);
      pinMeshes.push({ group: pinAnchor, pulse, sphere: pinSphere, lm });
    });

    // 5. Fireflies / Night Particles
    const fireflyCount = 35;
    const ffGeo = new THREE.BufferGeometry();
    const ffPos = new Float32Array(fireflyCount * 3);
    for (let i = 0; i < fireflyCount; i++) {
      ffPos[i * 3] = (Math.random() - 0.5) * 8;
      ffPos[i * 3 + 1] = Math.random() * 3 + 0.5;
      ffPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    ffGeo.setAttribute("position", new THREE.BufferAttribute(ffPos, 3));
    const ffMat = new THREE.PointsMaterial({
      color: 0xd2f36b,
      size: 0.25,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const fireflies = new THREE.Points(ffGeo, ffMat);
    scene.add(fireflies);

    // RAYCASTING FOR INTERACTION
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const checkIntersection = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const interactables = pinMeshes.map((p) => p.sphere);
      const intersects = raycaster.intersectObjects(interactables, true);

      if (intersects.length > 0) {
        const hit = pinMeshes.find((p) => p.sphere === intersects[0].object);
        if (hit) {
          return hit.lm;
        }
      }
      return null;
    };

    // INTERACTION / DRAG CONTROLS
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };
    let targetRotationY = 0;
    let targetRotationX = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      setInteractionHint(false);
    };

    const onPointerMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        targetRotationY += deltaX * 0.008;
        targetRotationX += deltaY * 0.005;
        // Limit X pitch so island doesn't flip
        targetRotationX = Math.max(-0.4, Math.min(0.5, targetRotationX));

        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerUp = (e) => {
      if (isDragging) {
        isDragging = false;
        // Check if it was a quick tap/click on a pin
        const clickedLandmark = checkIntersection(e.clientX, e.clientY);
        if (clickedLandmark) {
          setActivePin(clickedLandmark);
        }
      }
    };

    // Touch events for mobile responsiveness
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setInteractionHint(false);
      }
    };

    const onTouchMove = (e) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;

        // If user is clearly dragging horizontally, absorb and rotate island
        if (Math.abs(deltaX) > Math.abs(deltaY) || Math.abs(deltaX) > 10) {
          targetRotationY += deltaX * 0.009;
          targetRotationX += deltaY * 0.004;
          targetRotationX = Math.max(-0.4, Math.min(0.5, targetRotationX));
        }

        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchEnd = (e) => {
      if (isDragging) {
        isDragging = false;
        if (e.changedTouches.length === 1) {
          const clickedLandmark = checkIntersection(
            e.changedTouches[0].clientX,
            e.changedTouches[0].clientY
          );
          if (clickedLandmark) {
            setActivePin(clickedLandmark);
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    // Store references for external control (buttons)
    controlsRef.current = {
      resetCamera: () => {
        targetRotationY = 0;
        targetRotationX = 0;
        islandGroup.rotation.y = 0;
        islandGroup.rotation.x = 0;
        setActivePin(null);
      },
      focusPin: (lm) => {
        setActivePin(lm);
        // compute angle to face camera
        const angle = -Math.atan2(lm.position.x, lm.position.z) + Math.PI / 4;
        targetRotationY = angle;
      },
    };

    // ANIMATION LOOP
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth rotation damping
      if (!isDragging && autoRotate) {
        targetRotationY += 0.0035;
      }
      islandGroup.rotation.y += (targetRotationY - islandGroup.rotation.y) * 0.08;
      islandGroup.rotation.x += (targetRotationX - islandGroup.rotation.x) * 0.08;

      // Gentle floating levitation of island
      islandGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.15;

      // Rotate beacon holographic ring
      holoRing.rotation.z = elapsedTime * 1.5;

      // Animated Scooter driving on circle
      const scooterAngle = elapsedTime * 0.75;
      const scooterRadius = 2.8;
      scooterGroup.position.x = Math.sin(scooterAngle) * scooterRadius;
      scooterGroup.position.z = Math.cos(scooterAngle) * scooterRadius;
      scooterGroup.rotation.y = scooterAngle + Math.PI / 2;

      // Animated Drone hovering & propellers
      droneGroup.position.y = 4.2 + Math.sin(elapsedTime * 2.5) * 0.25;
      droneGroup.rotation.y = elapsedTime * 0.5;
      prop1.rotation.y += 0.6;
      prop2.rotation.y += 0.6;
      prop3.rotation.y += 0.6;
      prop4.rotation.y += 0.6;

      // Pulse and bounce pins
      pinMeshes.forEach((item, idx) => {
        const offset = idx * 1.5;
        item.sphere.position.y = 0.5 + Math.sin(elapsedTime * 3 + offset) * 0.08;
        const pulseScale = 1 + Math.sin(elapsedTime * 2 + offset) * 0.3;
        item.pulse.scale.set(pulseScale, pulseScale, 1);
        item.pulse.material.opacity = Math.max(0.1, 1 - (pulseScale - 1) * 2.5);
      });

      // Fireflies floating
      const positions = fireflies.geometry.attributes.position.array;
      for (let i = 0; i < fireflyCount; i++) {
        positions[i * 3 + 1] += Math.sin(elapsedTime * 2 + i) * 0.004;
      }
      fireflies.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          // Zoom out slightly on mobile screens for better framing
          if (newWidth < 480) {
            camera.fov = 48;
          } else if (newWidth < 768) {
            camera.fov = 44;
          } else {
            camera.fov = 40;
          }
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      if (dom && container.contains(dom)) {
        container.removeChild(dom);
      }
      renderer.dispose();
      // Dispose materials & geometries
      scene.clear();
    };
  }, [autoRotate]);

  // Lighting Mode effect
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const dirLight = scene.children.find((c) => c.isDirectionalLight);
    const hemi = scene.children.find((c) => c.isHemisphereLight);
    const warmFill = scene.children.find(
      (c) => c.isPointLight && c.position.x === -6
    );
    const neon = scene.children.find(
      (c) => c.isPointLight && c.position.x === -0.4
    );

    if (timeOfDay === "day") {
      if (dirLight) {
        dirLight.color.setHex(0xfffaed);
        dirLight.intensity = 2.4;
      }
      if (hemi) hemi.intensity = 1.2;
      if (warmFill) warmFill.intensity = 0.8;
      if (neon) neon.intensity = 0;
    } else if (timeOfDay === "sunset") {
      if (dirLight) {
        dirLight.color.setHex(0xfb923c);
        dirLight.intensity = 2.8;
      }
      if (hemi) hemi.intensity = 0.9;
      if (warmFill) warmFill.intensity = 1.4;
      if (neon) neon.intensity = 0.5;
    } else if (timeOfDay === "night") {
      if (dirLight) {
        dirLight.color.setHex(0x38bdf8);
        dirLight.intensity = 0.6;
      }
      if (hemi) hemi.intensity = 0.35;
      if (warmFill) warmFill.intensity = 0.3;
      if (neon) neon.intensity = 3.0; // bright neon spire
    }
  }, [timeOfDay]);

  return (
    <div className="relative mx-auto w-full max-w-[620px] select-none">
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        className="relative aspect-[1/1] w-full cursor-grab overflow-hidden rounded-[36px] bg-gradient-to-b from-emerald-900/10 via-cream to-emerald-950/15 shadow-2xl transition active:cursor-grabbing sm:aspect-[1.04]"
        style={{
          boxShadow:
            "0 25px 60px -15px rgba(36, 77, 61, 0.25), inset 0 1px 2px rgba(255,255,255,0.8)",
          touchAction: "pan-y", // Ensures vertical scroll passes through while allowing horizontal drag
        }}
      />

      {/* Floating 3D HUD Badge: Live Interactive Indicator */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-forest/15 bg-white/90 px-3 py-1.5 text-xs font-bold text-forest shadow-lg backdrop-blur-md">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
        </span>
        <span className="hidden sm:inline">Interactive 3D Sphere</span>
        <span className="sm:hidden">3D World</span>
      </div>

      {/* Lighting / Environment controls */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-forest/10 bg-white/90 p-1 shadow-md backdrop-blur-md">
        <button
          type="button"
          onClick={() => setTimeOfDay("day")}
          title="Morning / Day"
          className={`grid h-7 w-7 place-items-center rounded-full transition ${
            timeOfDay === "day"
              ? "bg-amber-100 text-amber-700 shadow-sm"
              : "text-slate-500 hover:text-forest"
          }`}
        >
          <Sun size={14} />
        </button>
        <button
          type="button"
          onClick={() => setTimeOfDay("sunset")}
          title="Golden Hour Sunset"
          className={`grid h-7 w-7 place-items-center rounded-full transition ${
            timeOfDay === "sunset"
              ? "bg-orange-100 text-orange-700 shadow-sm"
              : "text-slate-500 hover:text-forest"
          }`}
        >
          <Sunset size={14} />
        </button>
        <button
          type="button"
          onClick={() => setTimeOfDay("night")}
          title="Night Neon"
          className={`grid h-7 w-7 place-items-center rounded-full transition ${
            timeOfDay === "night"
              ? "bg-slate-900 text-lime shadow-sm"
              : "text-slate-500 hover:text-forest"
          }`}
        >
          <Moon size={14} />
        </button>
      </div>

      {/* Bottom Floating Interactive Toolbar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-md transition ${
              autoRotate
                ? "border-emerald-600 bg-forest text-lime"
                : "border-forest/15 bg-white/90 text-slate-700 hover:bg-white"
            }`}
          >
            <RotateCw size={12} className={autoRotate ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Auto-Spin</span>
          </button>

          <button
            type="button"
            onClick={() => controlsRef.current?.resetCamera?.()}
            className="flex items-center gap-1 rounded-full border border-forest/15 bg-white/90 px-3 py-1.5 text-xs font-semibold text-forest shadow-md backdrop-blur-md transition hover:bg-white"
            title="Reset Camera"
          >
            <Compass size={12} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Quick Landmark Focus Chips */}
        <div className="hidden gap-1.5 sm:flex">
          {LANDMARKS.slice(0, 3).map((lm) => (
            <button
              key={lm.id}
              type="button"
              onClick={() => controlsRef.current?.focusPin?.(lm)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md transition ${
                activePin?.id === lm.id
                  ? "border-emerald-700 bg-forest text-lime"
                  : "border-white/40 bg-white/80 text-forest hover:bg-white"
              }`}
            >
              {lm.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Active 3D Pin Popup Modal Card */}
      {activePin && (
        <div className="absolute inset-x-4 bottom-16 z-20 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="rounded-2xl border border-forest/20 bg-white/95 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: activePin.color }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    {activePin.category}
                  </span>
                  <span className="rounded-full bg-lime/60 px-2 py-0.5 text-[10px] font-extrabold text-forest">
                    ★ {activePin.rating}
                  </span>
                </div>
                <h3 className="mt-1 text-base font-extrabold text-forest sm:text-lg">
                  {activePin.name}
                </h3>
                <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                  {activePin.desc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePin(null)}
                className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                <Navigation size={12} className="text-emerald-600" />
                {activePin.distance} · {activePin.status}
              </span>
              <Link
                to={activePin.link}
                className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-1.5 text-xs font-bold text-white shadow transition hover:bg-forest/90"
              >
                Explore Shop <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Drag Hint Overlay (disappears after first interaction) */}
      {interactionHint && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <div className="animate-pulse rounded-full border border-forest/10 bg-white/80 px-4 py-2 text-xs font-semibold text-forest shadow-md backdrop-blur-md">
            ✦ Drag to rotate 3D neighborhood · Tap pins to explore
          </div>
        </div>
      )}
    </div>
  );
}
