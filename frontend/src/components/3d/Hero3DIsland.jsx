import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Link } from "react-router-dom";
import {
  Sun,
  Moon,
  Sunset,
  RotateCw,
  Navigation,
  ArrowRight,
  Maximize2,
  X,
} from "lucide-react";

// Landmarks and Shops on the Diorama
const LANDMARKS = [
  {
    id: "home",
    name: "My Home",
    category: "Residence",
    rating: "Sweet Home",
    distance: "Your Location",
    status: "Safe & Cozy",
    badgeColor: "#475569",
    pinBg: "#ffffff",
    pinText: "#0f172a",
    icon: "🏠",
    position: [0, 2.2, 0],
    link: "/shops",
    desc: "Your neighborhood sweet home. Everything you need is right around the corner.",
  },
  {
    id: "hospital",
    name: "Central Neighborhood Hospital",
    category: "Healthcare",
    rating: "4.9 ★",
    distance: "120m away",
    status: "24/7 Emergency & ICU",
    badgeColor: "#ef4444",
    pinBg: "#fee2e2",
    pinText: "#991b1b",
    icon: "🏥",
    position: [-8.2, 3.2, 5.5],
    link: "/services?q=Healthcare",
    desc: "Modern healthcare with 24/7 emergency response, ambulance dispatch, and expert doctors.",
  },
  {
    id: "pharmacy",
    name: "LocalCare Pharmacy",
    category: "Medicine",
    rating: "4.8 ★",
    distance: "250m away",
    status: "Open · Stocked",
    badgeColor: "#10b981",
    pinBg: "#d1fae5",
    pinText: "#065f46",
    icon: "💊",
    position: [-8.4, 3.0, -4.5],
    link: "/products?q=Medicine",
    desc: "All prescription & OTC medicines, first aid supplies, insulin care, and surgical essentials.",
  },
  {
    id: "auto-service",
    name: "QuickFix Auto & Bike Service",
    category: "Repair Services",
    rating: "4.9 ★",
    distance: "350m away",
    status: "Mechanic on duty",
    badgeColor: "#f59e0b",
    pinBg: "#fef3c7",
    pinText: "#92400e",
    icon: "🔧",
    position: [-0.5, 4.2, -8.8],
    link: "/services?q=Repair+Services",
    desc: "Complete automobile & motorcycle repair, car wash, engine tuning, tyre change, and oil service.",
  },
  {
    id: "grocery",
    name: "Green Valley Grocery & Bazaar",
    category: "Grocery & Food",
    rating: "4.9 ★",
    distance: "180m away",
    status: "Farm fresh arrivals",
    badgeColor: "#16a34a",
    pinBg: "#dcfce7",
    pinText: "#14532d",
    icon: "🥬",
    position: [8.5, 3.2, -4.8],
    link: "/products?q=Grocery",
    desc: "Fresh organic vegetables, fruits, dairy, spices, and neighborhood daily market essentials.",
  },
  {
    id: "repair-shop",
    name: "All-In-One Gadget & Appliance Repair",
    category: "Repair Services",
    rating: "4.8 ★",
    distance: "210m away",
    status: "Express repair",
    badgeColor: "#8b5cf6",
    pinBg: "#f3e8ff",
    pinText: "#581c87",
    icon: "🛠️",
    position: [8.6, 3.1, -1.5],
    link: "/services?q=Repair",
    desc: "Mobile, TV, laptop, AC, microwave, fridge, and home electrical repair specialists.",
  },
  {
    id: "laundry",
    name: "FreshSparks Cleaners & Laundry",
    category: "Laundry",
    rating: "4.7 ★",
    distance: "140m away",
    status: "Fast turnaround",
    badgeColor: "#0284c7",
    pinBg: "#e0f2fe",
    pinText: "#0369a1",
    icon: "🧺",
    position: [8.2, 2.7, 3.2],
    link: "/services?q=Laundry",
    desc: "Automated wash, steam pressing, dry cleaning, and convenient home pickup & delivery.",
  },
  {
    id: "restaurant",
    name: "The Flavor Table Cafe & Grill",
    category: "Restaurant",
    rating: "5.0 ★",
    distance: "90m away",
    status: "Chef serving now",
    badgeColor: "#ea580c",
    pinBg: "#ffedd5",
    pinText: "#9a3412",
    icon: "☕",
    position: [7.8, 3.2, 7.8],
    link: "/products?q=Food",
    desc: "Outdoor garden dining, artisanal coffee, wood-fired pizza, burgers, and sizzling grills.",
  },
];

// Road loop track parameterization around My Home
function getRoadPoint(t) {
  // Loop perimeter = 4 straight sides of length 10.6, plus 4 corner arcs
  // Straight segments at x/z = ±5.3
  const R = 5.3;

  // Normalize t to [0, 1]
  let progress = ((t % 1) + 1) % 1;
  const angle = progress * Math.PI * 2;

  // Squircle / rounded rectangle approximation for super smooth continuous loop
  // Using superellipse or piecewise
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  // Sign and powers
  const px = Math.sign(cosA) * Math.min(R, Math.abs(cosA) * (R * 1.35));
  const pz = Math.sign(sinA) * Math.min(R, Math.abs(sinA) * (R * 1.35));

  // Clamp to square radius with rounded corners
  const clampedX = THREE.MathUtils.clamp(px, -R, R);
  const clampedZ = THREE.MathUtils.clamp(pz, -R, R);

  // Tangent by small delta
  const dt = 0.005;
  const nextAngle = ((progress + dt) % 1) * Math.PI * 2;
  const nCos = Math.cos(nextAngle);
  const nSin = Math.sin(nextAngle);
  const nx = THREE.MathUtils.clamp(Math.sign(nCos) * Math.min(R, Math.abs(nCos) * (R * 1.35)), -R, R);
  const nz = THREE.MathUtils.clamp(Math.sign(nSin) * Math.min(R, Math.abs(nSin) * (R * 1.35)), -R, R);

  const tx = nx - clampedX;
  const tz = nz - clampedZ;
  const heading = Math.atan2(tx, tz);

  return { x: clampedX, z: clampedZ, heading };
}

export default function Hero3DIsland() {
  const mountRef = useRef(null);
  const [activeLandmark, setActiveLandmark] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState("day"); // 'day' | 'sunset' | 'night'
  const [autoRotate, setAutoRotate] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const lightsRef = useRef({});
  const animatedObjectsRef = useRef({});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 520;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#F8F9FA");
    sceneRef.current = scene;

    // 2. Camera setup (Warm isometric perspective)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.5, 120);
    camera.position.set(22, 18, 22);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.innerHTML = "";
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
      console.error("WebGL initialization error:", e);
      return;
    }

    // 4. OrbitControls with smooth damping and base limits
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.15; // never go below ground base
    controls.minPolarAngle = Math.PI / 6; // don't flip directly overhead
    controls.minDistance = 12;
    controls.maxDistance = 34;
    controls.target.set(0, 1.2, 0);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.6;
    controlsRef.current = controls;

    controls.addEventListener("start", () => {
      setHasInteracted(true);
      setAutoRotate(false);
    });

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight("#fdf6ec", 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight("#fff4db", 2.2);
    dirLight.position.set(16, 24, 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -16;
    dirLight.shadow.camera.right = 16;
    dirLight.shadow.camera.top = 16;
    dirLight.shadow.camera.bottom = -16;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight("#bfdbfe", 0.8);
    fillLight.position.set(-15, 12, -15);
    scene.add(fillLight);

    const groundHemiLight = new THREE.HemisphereLight("#ffffff", "#d5dfc9", 0.6);
    scene.add(groundHemiLight);

    lightsRef.current = { ambientLight, dirLight, fillLight, groundHemiLight };

    // --- MATERIALS PALETTE (Stylized Clay-Render Matte) ---
    const mats = {
      grass: new THREE.MeshLambertMaterial({ color: "#d9e8ca" }),
      grassDark: new THREE.MeshLambertMaterial({ color: "#b9d4a1" }),
      dirtBase: new THREE.MeshLambertMaterial({ color: "#78533b" }),
      dirtTop: new THREE.MeshLambertMaterial({ color: "#ebdccb" }),
      sidewalk: new THREE.MeshLambertMaterial({ color: "#f1e7d8" }),
      curb: new THREE.MeshLambertMaterial({ color: "#d4c8b7" }),
      road: new THREE.MeshLambertMaterial({ color: "#334155" }),
      roadDash: new THREE.MeshLambertMaterial({ color: "#f8fafc" }),
      crosswalk: new THREE.MeshLambertMaterial({ color: "#ffffff" }),

      // Buildings
      beigeWall: new THREE.MeshLambertMaterial({ color: "#fdf8ee" }),
      warmWall: new THREE.MeshLambertMaterial({ color: "#fce9d3" }),
      terracottaRoof: new THREE.MeshLambertMaterial({ color: "#cf5e38" }),
      roofShingles: new THREE.MeshLambertMaterial({ color: "#ba4f2c" }),
      woodTrim: new THREE.MeshLambertMaterial({ color: "#8a5836" }),
      whiteTrim: new THREE.MeshLambertMaterial({ color: "#ffffff" }),
      glassWindow: new THREE.MeshLambertMaterial({ color: "#7dd3fc" }),
      darkGlass: new THREE.MeshLambertMaterial({ color: "#1e293b" }),

      // Hospital
      hospitalWhite: new THREE.MeshLambertMaterial({ color: "#ffffff" }),
      hospitalBlue: new THREE.MeshLambertMaterial({ color: "#38bdf8" }),
      redCross: new THREE.MeshLambertMaterial({ color: "#ef4444" }),

      // Pharmacy
      pharmacyMint: new THREE.MeshLambertMaterial({ color: "#10b981" }),
      pharmacyWhite: new THREE.MeshLambertMaterial({ color: "#f0fdf4" }),
      greenCross: new THREE.MeshLambertMaterial({ color: "#059669" }),

      // Auto & Bike Service
      garageGray: new THREE.MeshLambertMaterial({ color: "#cbd5e1" }),
      garageDark: new THREE.MeshLambertMaterial({ color: "#475569" }),
      garageRed: new THREE.MeshLambertMaterial({ color: "#dc2626" }),
      garageBlue: new THREE.MeshLambertMaterial({ color: "#2563eb" }),
      garageYellow: new THREE.MeshLambertMaterial({ color: "#f59e0b" }),
      metalPlate: new THREE.MeshLambertMaterial({ color: "#94a3b8" }),

      // Grocery & Bazaar
      awningRed: new THREE.MeshLambertMaterial({ color: "#e11d48" }),
      awningGreen: new THREE.MeshLambertMaterial({ color: "#16a34a" }),
      awningBlue: new THREE.MeshLambertMaterial({ color: "#2563eb" }),
      awningYellow: new THREE.MeshLambertMaterial({ color: "#facc15" }),
      woodCrate: new THREE.MeshLambertMaterial({ color: "#c29363" }),
      fruitOrange: new THREE.MeshLambertMaterial({ color: "#f97316" }),
      fruitRed: new THREE.MeshLambertMaterial({ color: "#ef4444" }),
      fruitGreen: new THREE.MeshLambertMaterial({ color: "#22c55e" }),
      fruitYellow: new THREE.MeshLambertMaterial({ color: "#eab308" }),

      // Laundry
      laundryBlue: new THREE.MeshLambertMaterial({ color: "#0284c7" }),
      laundrySoft: new THREE.MeshLambertMaterial({ color: "#e0f2fe" }),

      // Restaurant
      restaurantOrange: new THREE.MeshLambertMaterial({ color: "#ea580c" }),
      restaurantCream: new THREE.MeshLambertMaterial({ color: "#ffedd5" }),

      // Foliage & Trees
      treeTrunk: new THREE.MeshLambertMaterial({ color: "#6b4a2f" }),
      leavesLight: new THREE.MeshLambertMaterial({ color: "#4ade80" }),
      leavesMid: new THREE.MeshLambertMaterial({ color: "#22c55e" }),
      leavesDark: new THREE.MeshLambertMaterial({ color: "#15803d" }),
      flowerRed: new THREE.MeshLambertMaterial({ color: "#f43f5e" }),
      flowerYellow: new THREE.MeshLambertMaterial({ color: "#facc15" }),

      // Vehicles
      carBlue: new THREE.MeshLambertMaterial({ color: "#2563eb" }),
      carRed: new THREE.MeshLambertMaterial({ color: "#dc2626" }),
      carYellow: new THREE.MeshLambertMaterial({ color: "#eab308" }),
      carWhite: new THREE.MeshLambertMaterial({ color: "#ffffff" }),
      cngGreen: new THREE.MeshLambertMaterial({ color: "#15803d" }),
      cngYellow: new THREE.MeshLambertMaterial({ color: "#facc15" }),
      wheelRubber: new THREE.MeshLambertMaterial({ color: "#1e293b" }),
      wheelHub: new THREE.MeshLambertMaterial({ color: "#e2e8f0" }),
      headlight: new THREE.MeshBasicMaterial({ color: "#fef08a" }),
      taillight: new THREE.MeshBasicMaterial({ color: "#ef4444" }),
      sirenRed: new THREE.MeshBasicMaterial({ color: "#ff0000" }),
      sirenBlue: new THREE.MeshBasicMaterial({ color: "#0066ff" }),

      // Pedestrians
      skin: new THREE.MeshLambertMaterial({ color: "#fed7aa" }),
      shirt1: new THREE.MeshLambertMaterial({ color: "#3b82f6" }),
      shirt2: new THREE.MeshLambertMaterial({ color: "#ec4899" }),
      shirt3: new THREE.MeshLambertMaterial({ color: "#10b981" }),
      shirt4: new THREE.MeshLambertMaterial({ color: "#eab308" }),
      pants: new THREE.MeshLambertMaterial({ color: "#1e293b" }),
    };

    // Main Diorama Root Group
    const dioramaGroup = new THREE.Group();
    scene.add(dioramaGroup);

    // ========================================================
    // 1. DIORAMA BASE PLATFORM (LAYERED ROUNDED CAKE)
    // ========================================================
    const baseW = 23;
    const baseD = 23;
    const baseH = 1.6;

    // Soil / Wood Base Block
    const baseGeo = new THREE.BoxGeometry(baseW, baseH, baseD);
    const baseMesh = new THREE.Mesh(baseGeo, mats.dirtBase);
    baseMesh.position.y = -baseH / 2;
    baseMesh.receiveShadow = true;
    dioramaGroup.add(baseMesh);

    // Wooden Trim Layer
    const trimGeo = new THREE.BoxGeometry(baseW + 0.3, 0.25, baseD + 0.3);
    const trimMesh = new THREE.Mesh(trimGeo, mats.dirtTop);
    trimMesh.position.y = -0.15;
    trimMesh.receiveShadow = true;
    dioramaGroup.add(trimMesh);

    // Green Grass Top Ground
    const grassGeo = new THREE.BoxGeometry(baseW - 0.1, 0.2, baseD - 0.1);
    const grassMesh = new THREE.Mesh(grassGeo, mats.grass);
    grassMesh.position.y = 0.05;
    grassMesh.receiveShadow = true;
    dioramaGroup.add(grassMesh);

    // ========================================================
    // 2. ROAD NETWORK (LOOPING ASPHALT WITH DASHES)
    // ========================================================
    const roadGroup = new THREE.Group();
    dioramaGroup.add(roadGroup);

    const roadW = 2.4;
    const roadY = 0.16;

    // 4 straight road segments
    const makeRoadSeg = (w, d, x, z) => {
      const g = new THREE.BoxGeometry(w, 0.04, d);
      const m = new THREE.Mesh(g, mats.road);
      m.position.set(x, roadY, z);
      m.receiveShadow = true;
      roadGroup.add(m);
    };

    // South Road (Front)
    makeRoadSeg(13.2, roadW, 0, 5.3);
    // North Road (Back)
    makeRoadSeg(13.2, roadW, 0, -5.3);
    // West Road (Left)
    makeRoadSeg(roadW, 13.2, -5.3, 0);
    // East Road (Right)
    makeRoadSeg(roadW, 13.2, 5.3, 0);

    // 4 Corner Road intersections
    const makeCorner = (x, z) => {
      const g = new THREE.BoxGeometry(roadW, 0.04, roadW);
      const m = new THREE.Mesh(g, mats.road);
      m.position.set(x, roadY, z);
      m.receiveShadow = true;
      roadGroup.add(m);
    };
    makeCorner(-5.3, -5.3);
    makeCorner(5.3, -5.3);
    makeCorner(-5.3, 5.3);
    makeCorner(5.3, 5.3);

    // Dashed White Center Line along the road loop
    const dashLength = 0.6;
    const dashGap = 0.7;
    const dashW = 0.12;

    const addDashes = (startX, startZ, endX, endZ) => {
      const dx = endX - startX;
      const dz = endZ - startZ;
      const dist = Math.hypot(dx, dz);
      const steps = Math.floor(dist / (dashLength + dashGap));
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const x = startX + dx * frac;
        const z = startZ + dz * frac;
        const dash = new THREE.Mesh(
          new THREE.BoxGeometry(dx !== 0 ? dashLength : dashW, 0.05, dz !== 0 ? dashLength : dashW),
          mats.roadDash
        );
        dash.position.set(x, roadY + 0.01, z);
        roadGroup.add(dash);
      }
    };

    addDashes(-4.2, 5.3, 4.2, 5.3);
    addDashes(-4.2, -5.3, 4.2, -5.3);
    addDashes(-5.3, -4.2, -5.3, 4.2);
    addDashes(5.3, -4.2, 5.3, 4.2);

    // Crosswalk zebra stripes in front of My Home and Hospital
    const makeCrosswalk = (cx, cz, isVertical = false) => {
      for (let i = -1.0; i <= 1.0; i += 0.35) {
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(isVertical ? roadW - 0.4 : 0.2, 0.05, isVertical ? 0.2 : roadW - 0.4),
          mats.crosswalk
        );
        stripe.position.set(isVertical ? cx : cx + i, roadY + 0.012, isVertical ? cz + i : cz);
        roadGroup.add(stripe);
      }
    };
    makeCrosswalk(0, 5.3, false);
    makeCrosswalk(-5.3, 0, true);

    // Sidewalk Pavements
    const makeSidewalk = (w, d, x, z) => {
      const g = new THREE.BoxGeometry(w, 0.12, d);
      const m = new THREE.Mesh(g, mats.sidewalk);
      m.position.set(x, 0.12, z);
      m.receiveShadow = true;
      dioramaGroup.add(m);
    };

    // Central lot sidewalk surrounding My Home
    makeSidewalk(7.8, 7.8, 0, 0);

    // Perimeter sidewalks under buildings
    makeSidewalk(5.5, 9.5, -8.5, 4.5); // Hospital block
    makeSidewalk(5.5, 9.5, -8.5, -4.5); // Pharmacy block
    makeSidewalk(12.5, 5.5, 0, -8.5); // Auto service block
    makeSidewalk(5.5, 8.5, 8.5, -4.5); // Grocery block
    makeSidewalk(5.5, 8.5, 8.5, 4.5); // Restaurant & Laundry block

    // ========================================================
    // 3. CENTERPIECE — "MY HOME" RESIDENCE
    // ========================================================
    const homeGroup = new THREE.Group();
    homeGroup.position.set(0, 0, 0);
    dioramaGroup.add(homeGroup);

    // Lawn Yard
    const homeLawn = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.14, 6.6), mats.grassDark);
    homeLawn.position.set(0, 0.13, 0);
    homeLawn.receiveShadow = true;
    homeGroup.add(homeLawn);

    // Stone Pathway to front gate
    const path = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 2.8), mats.sidewalk);
    path.position.set(0, 0.14, 2.0);
    homeGroup.add(path);

    // Boundary White Fence / Low Wall
    const makeWallSeg = (w, d, x, z) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, d), mats.whiteTrim);
      wall.position.set(x, 0.44, z);
      wall.castShadow = true;
      homeGroup.add(wall);
    };
    makeWallSeg(6.6, 0.18, 0, -3.2); // back
    makeWallSeg(0.18, 6.6, -3.2, 0); // left
    makeWallSeg(0.18, 6.6, 3.2, 0); // right
    makeWallSeg(2.5, 0.18, -2.0, 3.2); // front left
    makeWallSeg(2.5, 0.18, 2.0, 3.2); // front right

    // Little front gate posts
    const postGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
    const post1 = new THREE.Mesh(postGeo, mats.woodTrim);
    post1.position.set(-0.7, 0.54, 3.2);
    const post2 = new THREE.Mesh(postGeo, mats.woodTrim);
    post2.position.set(0.7, 0.54, 3.2);
    homeGroup.add(post1, post2);

    // Mailbox
    const mailboxPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7), mats.woodTrim);
    mailboxPost.position.set(1.0, 0.5, 3.0);
    const mailboxBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.4), mats.awningRed);
    mailboxBox.position.set(1.0, 0.85, 3.0);
    homeGroup.add(mailboxPost, mailboxBox);

    // Main House Building Body
    const houseBody = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.2, 3.4), mats.beigeWall);
    houseBody.position.set(0, 1.25, -0.4);
    houseBody.castShadow = true;
    houseBody.receiveShadow = true;
    homeGroup.add(houseBody);

    // Pitched Terracotta Roof
    const roofPitchedGeo = new THREE.ConeGeometry(3.4, 1.6, 4);
    const roofMesh = new THREE.Mesh(roofPitchedGeo, mats.terracottaRoof);
    roofMesh.position.set(0, 2.9, -0.4);
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.scale.set(1.2, 1, 1.05);
    roofMesh.castShadow = true;
    homeGroup.add(roofMesh);

    // Chimney
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 0.45), mats.roofShingles);
    chimney.position.set(1.1, 3.0, -0.8);
    chimney.castShadow = true;
    homeGroup.add(chimney);

    // Windows & Door
    const makeWindow = (w, h, x, y, z, rotY = 0) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), mats.glassWindow);
      win.position.set(x, y, z);
      win.rotation.y = rotY;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.05), mats.whiteTrim);
      frame.position.set(x, y, z - 0.01);
      frame.rotation.y = rotY;
      homeGroup.add(win, frame);
    };

    // Front Windows & Door
    makeWindow(0.7, 0.7, -1.1, 1.35, 1.35);
    makeWindow(0.7, 0.7, 1.1, 1.35, 1.35);

    // Front Door with porch overhang
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.3, 0.06), mats.woodTrim);
    door.position.set(0, 0.85, 1.33);
    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.6), mats.terracottaRoof);
    porchRoof.position.set(0, 1.6, 1.6);
    homeGroup.add(door, porchRoof);

    // Small trees in My Home yard
    const addMiniTree = (x, z, scale = 1) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.7 * scale), mats.treeTrunk);
      trunk.position.set(x, 0.45 * scale, z);
      trunk.castShadow = true;

      const folGeo = new THREE.DodecahedronGeometry(0.55 * scale);
      const fol = new THREE.Mesh(folGeo, mats.leavesMid);
      fol.position.set(x, (0.8 + 0.3) * scale, z);
      fol.castShadow = true;
      homeGroup.add(trunk, fol);
    };

    addMiniTree(-2.2, 1.8, 1.1);
    addMiniTree(2.2, -1.8, 0.9);
    addMiniTree(-2.2, -1.8, 1.0);

    // ========================================================
    // 4. HOSPITAL (LEFT FRONT) + AMBULANCE
    // ========================================================
    const hospGroup = new THREE.Group();
    hospGroup.position.set(-8.5, 0, 5.0);
    dioramaGroup.add(hospGroup);

    // Main 2-story clinic building
    const hospBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 4.4), mats.hospitalWhite);
    hospBody.position.set(0, 1.7, 0);
    hospBody.castShadow = true;
    hospBody.receiveShadow = true;
    hospGroup.add(hospBody);

    // Blue accent stripe
    const hospStripe = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.35, 4.5), mats.hospitalBlue);
    hospStripe.position.set(0, 2.3, 0);
    hospGroup.add(hospStripe);

    // Entrance Awning (Red & White striped)
    const hospAwning = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.9), mats.awningRed);
    hospAwning.position.set(2.2, 1.4, 0);
    hospAwning.rotation.z = -0.15;
    hospGroup.add(hospAwning);

    // 3D Red Cross on Hospital facade
    const makeRedCross = (x, y, z, rotY = 0, scale = 0.5) => {
      const g = new THREE.Group();
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 0.25 * scale, 0.08), mats.redCross);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.25 * scale, 0.8 * scale, 0.08), mats.redCross);
      g.add(b1, b2);
      g.position.set(x, y, z);
      g.rotation.y = rotY;
      return g;
    };
    hospGroup.add(makeRedCross(2.15, 2.7, 0, Math.PI / 2, 0.8));
    hospGroup.add(makeRedCross(0, 2.8, 2.25, 0, 0.7));

    // Hospital Windows
    for (let wy = 1.0; wy <= 2.6; wy += 1.4) {
      for (let wz = -1.2; wz <= 1.2; wz += 1.2) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.6), mats.glassWindow);
        win.position.set(2.13, wy, wz);
        hospGroup.add(win);
      }
    }

    // Parked Ambulance in front of Hospital
    const ambGroup = new THREE.Group();
    ambGroup.position.set(-6.8, 0.16, 7.8);
    ambGroup.rotation.y = -Math.PI / 2;
    dioramaGroup.add(ambGroup);

    // Ambulance Van Body
    const ambBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 2.4), mats.hospitalWhite);
    ambBody.position.y = 0.65;
    ambBody.castShadow = true;
    ambGroup.add(ambBody);

    // Red Cross and side stripe on ambulance
    const ambStripe = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.15, 2.44), mats.redCross);
    ambStripe.position.y = 0.65;
    ambGroup.add(ambStripe);

    // Ambulance Windshield
    const ambWind = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 0.1), mats.darkGlass);
    ambWind.position.set(0, 0.75, 1.15);
    ambWind.rotation.x = -0.2;
    ambGroup.add(ambWind);

    // Emergency Siren lights on roof
    const sirenR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12), mats.sirenRed);
    sirenR.position.set(-0.25, 1.2, 0.2);
    const sirenB = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12), mats.sirenBlue);
    sirenB.position.set(0.25, 1.2, 0.2);
    ambGroup.add(sirenR, sirenB);

    // Flashing emergency light in scene
    const ambSirenLight = new THREE.PointLight("#ef4444", 1.5, 6);
    ambSirenLight.position.set(-6.8, 1.4, 7.8);
    scene.add(ambSirenLight);
    animatedObjectsRef.current.ambSirenLight = ambSirenLight;

    // Ambulance Wheels
    const makeAmbWheel = (x, z) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 12), mats.wheelRubber);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.22, z);
      ambGroup.add(w);
    };
    makeAmbWheel(-0.72, 0.7);
    makeAmbWheel(0.72, 0.7);
    makeAmbWheel(-0.72, -0.7);
    makeAmbWheel(0.72, -0.7);

    // ========================================================
    // 5. PHARMACY (LEFT MIDDLE)
    // ========================================================
    const pharmGroup = new THREE.Group();
    pharmGroup.position.set(-8.5, 0, -4.5);
    dioramaGroup.add(pharmGroup);

    // Pharmacy Body
    const pharmBody = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.6, 3.8), mats.pharmacyWhite);
    pharmBody.position.set(0, 1.4, 0);
    pharmBody.castShadow = true;
    pharmBody.receiveShadow = true;
    pharmGroup.add(pharmBody);

    // Mint Green Top Border & Roof
    const pharmRoof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.35, 4.0), mats.pharmacyMint);
    pharmRoof.position.set(0, 2.75, 0);
    pharmGroup.add(pharmRoof);

    // Green Cross Sign on Roof
    const pharmCross = new THREE.Group();
    const pc1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.1), mats.greenCross);
    const pc2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.1), mats.greenCross);
    pharmCross.add(pc1, pc2);
    pharmCross.position.set(2.05, 2.0, 0);
    pharmCross.rotation.y = Math.PI / 2;
    pharmGroup.add(pharmCross);

    // Large storefront glass display with green frame
    const pharmWindow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 2.4), mats.glassWindow);
    pharmWindow.position.set(2.04, 1.1, 0);
    const pharmAwning = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 2.6), mats.pharmacyMint);
    pharmAwning.position.set(2.35, 1.9, 0);
    pharmAwning.rotation.z = -0.2;
    pharmGroup.add(pharmWindow, pharmAwning);

    // ========================================================
    // 6. AUTO & BIKE SERVICE GARAGE (BACK CENTER)
    // ========================================================
    const autoGroup = new THREE.Group();
    autoGroup.position.set(-0.5, 0, -8.8);
    dioramaGroup.add(autoGroup);

    // Main 2-Bay Garage Building
    const autoBody = new THREE.Mesh(new THREE.BoxGeometry(8.2, 3.8, 4.4), mats.garageGray);
    autoBody.position.set(0, 2.0, 0);
    autoBody.castShadow = true;
    autoBody.receiveShadow = true;
    autoGroup.add(autoBody);

    // Corrugated dark roof
    const autoRoof = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.3, 4.7), mats.garageDark);
    autoRoof.position.set(0, 3.95, 0);
    autoGroup.add(autoRoof);

    // Red Front Sign: "Auto & Bike Service"
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.65, 0.12), mats.garageRed);
    signBoard.position.set(0, 3.4, 2.25);
    autoGroup.add(signBoard);

    // Blue Side Sign: "Car & Bike Service"
    const sideSign = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 3.2), mats.garageBlue);
    sideSign.position.set(-4.15, 3.3, 0);
    autoGroup.add(sideSign);

    // 2 Open Garage Bays (indented dark bays)
    for (let bx of [-1.8, 1.8]) {
      const bay = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 0.2), mats.darkGlass);
      bay.position.set(bx, 1.4, 2.2);
      autoGroup.add(bay);
    }

    // Car on Hydraulic Lift in Bay 1
    const liftPillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5), mats.metalPlate);
    liftPillar1.position.set(-2.6, 0.85, 2.6);
    const liftPillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5), mats.metalPlate);
    liftPillar2.position.set(-1.0, 0.85, 2.6);
    const liftPlatform = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 2.4), mats.metalPlate);
    liftPlatform.position.set(-1.8, 1.5, 2.6);
    autoGroup.add(liftPillar1, liftPillar2, liftPlatform);

    // Miniature car elevated on lift
    const liftCar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.6, 2.1), mats.carRed);
    liftCar.position.set(-1.8, 1.85, 2.6);
    liftCar.castShadow = true;
    autoGroup.add(liftCar);

    // Motorbike in Bay 2
    const bikeBody = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 1.2), mats.garageBlue);
    bikeBody.position.set(1.8, 0.5, 2.6);
    const bikeWheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08), mats.wheelRubber);
    bikeWheel1.rotation.z = Math.PI / 2;
    bikeWheel1.position.set(1.8, 0.2, 2.1);
    const bikeWheel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08), mats.wheelRubber);
    bikeWheel2.rotation.z = Math.PI / 2;
    bikeWheel2.position.set(1.8, 0.2, 3.1);
    autoGroup.add(bikeBody, bikeWheel1, bikeWheel2);

    // Red Oil Drums outside garage
    const drum1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.7, 12), mats.garageRed);
    drum1.position.set(3.4, 0.45, 2.7);
    const drum2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.7, 12), mats.garageRed);
    drum2.position.set(3.7, 0.45, 2.3);
    autoGroup.add(drum1, drum2);

    // ========================================================
    // 7. SHOPPING / BAZAAR & GROCERY STALLS (RIGHT MIDDLE)
    // ========================================================
    const bazaarGroup = new THREE.Group();
    bazaarGroup.position.set(8.5, 0, -4.5);
    dioramaGroup.add(bazaarGroup);

    // Main Market Shop Wall
    const bazaarBuilding = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.6, 5.4), mats.warmWall);
    bazaarBuilding.position.set(0, 1.4, 0);
    bazaarBuilding.castShadow = true;
    bazaarGroup.add(bazaarBuilding);

    // Colorful Striped Market Awnings
    const awning1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 2.4), mats.awningGreen);
    awning1.position.set(-1.9, 1.9, -1.3);
    awning1.rotation.z = 0.2;
    const awning2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 2.4), mats.awningRed);
    awning2.position.set(-1.9, 1.9, 1.3);
    awning2.rotation.z = 0.2;
    bazaarGroup.add(awning1, awning2);

    // Fruit and Vegetable display stalls with wooden crates
    const addProduceCrate = (x, z, fruitColor, y = 0.35) => {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.5), mats.woodCrate);
      crate.position.set(x, y, z);
      const produce = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), fruitColor);
      produce.position.set(x, y + 0.16, z);
      bazaarGroup.add(crate, produce);
    };

    addProduceCrate(-2.2, -2.0, mats.fruitOrange);
    addProduceCrate(-2.2, -1.3, mats.fruitRed);
    addProduceCrate(-2.2, -0.6, mats.fruitGreen);
    addProduceCrate(-2.2, 0.3, mats.fruitYellow);
    addProduceCrate(-2.2, 1.0, mats.fruitRed);
    addProduceCrate(-2.2, 1.8, mats.fruitGreen);

    // ========================================================
    // 8. LAUNDRY & LOCAL STALL (RIGHT FRONT MIDDLE)
    // ========================================================
    const laundryGroup = new THREE.Group();
    laundryGroup.position.set(8.2, 0, 2.8);
    dioramaGroup.add(laundryGroup);

    // Laundry Shop
    const laundryBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 2.8), mats.laundryBlue);
    laundryBody.position.set(0, 1.3, 0);
    laundryBody.castShadow = true;
    laundryGroup.add(laundryBody);

    // Signboard "Laundry"
    const lSign = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 2.0), mats.laundrySoft);
    lSign.position.set(-1.62, 2.1, 0);
    laundryGroup.add(lSign);

    // Visible Front-loading washing machine door
    const washerGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16), mats.glassWindow);
    washerGlass.rotation.z = Math.PI / 2;
    washerGlass.position.set(-1.62, 0.8, -0.4);
    laundryGroup.add(washerGlass);

    // Small Yellow Street Stall next to laundry
    const stall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.4), mats.awningYellow);
    stall.position.set(-0.3, 0.9, -1.8);
    stall.castShadow = true;
    laundryGroup.add(stall);

    // ========================================================
    // 9. RESTAURANT & OUTDOOR PATIO (RIGHT FRONT CORNER)
    // ========================================================
    const restGroup = new THREE.Group();
    restGroup.position.set(7.8, 0, 7.8);
    dioramaGroup.add(restGroup);

    // Restaurant Building
    const restBody = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.6, 3.6), mats.restaurantOrange);
    restBody.position.set(0, 1.4, 0);
    restBody.castShadow = true;
    restGroup.add(restBody);

    // Green/White striped awning
    const restAwning = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 3.4), mats.awningGreen);
    restAwning.position.set(-2.0, 1.8, 0);
    restAwning.rotation.z = 0.22;
    restGroup.add(restAwning);

    // Outdoor dining patio with striped umbrellas & cafe tables
    const makePatioTable = (tx, tz, umbrellaColor) => {
      // Table
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55), mats.woodTrim);
      leg.position.set(tx, 0.35, tz);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 16), mats.whiteTrim);
      top.position.set(tx, 0.64, tz);

      // Umbrella
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8), mats.whiteTrim);
      pole.position.set(tx, 1.0, tz);
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.45, 12), umbrellaColor);
      canopy.position.set(tx, 1.85, tz);

      restGroup.add(leg, top, pole, canopy);
    };

    makePatioTable(-2.4, 1.4, mats.leavesMid);
    makePatioTable(-2.4, -1.2, mats.restaurantOrange);

    // ========================================================
    // 10. NEIGHBORHOOD FOLIAGE & UTILITY POLES
    // ========================================================
    const treesGroup = new THREE.Group();
    dioramaGroup.add(treesGroup);

    const makeStreetTree = (x, z, scale = 1, mat = mats.leavesMid) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.1 * scale), mats.treeTrunk);
      trunk.position.y = 0.65 * scale;
      trunk.castShadow = true;

      // Layered rounded foliage
      const fol1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85 * scale), mat);
      fol1.position.y = 1.35 * scale;
      fol1.castShadow = true;

      const fol2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65 * scale), mats.leavesLight);
      fol2.position.y = 1.85 * scale;
      fol2.castShadow = true;

      tree.add(trunk, fol1, fol2);
      tree.position.set(x, 0.1, z);
      treesGroup.add(tree);
      return tree;
    };

    // Trees planted at corners and sidewalks
    const treeList = [
      makeStreetTree(-9.5, 9.5, 1.2, mats.leavesDark),
      makeStreetTree(-9.8, 1.8, 1.0, mats.leavesMid),
      makeStreetTree(-9.6, -8.8, 1.2, mats.leavesLight),
      makeStreetTree(9.5, -9.5, 1.3, mats.leavesDark),
      makeStreetTree(9.6, 9.8, 1.1, mats.leavesMid),
      makeStreetTree(-4.2, -9.8, 1.1, mats.leavesLight),
      makeStreetTree(4.2, -9.8, 1.0, mats.leavesDark),
      makeStreetTree(-9.8, -1.0, 0.9, mats.leavesMid),
    ];
    animatedObjectsRef.current.treeList = treeList;

    // Utility Poles with overhead power lines
    const poleMat = new THREE.MeshLambertMaterial({ color: "#523b28" });
    const makePole = (x, z) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.2), poleMat);
      pole.position.set(x, 2.1, z);
      pole.castShadow = true;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), poleMat);
      arm.position.set(x, 3.9, z);
      dioramaGroup.add(pole, arm);
    };
    makePole(-6.8, -6.8);
    makePole(-6.8, 6.8);
    makePole(6.8, -6.8);
    makePole(6.8, 6.8);

    // ========================================================
    // 11. DYNAMIC ANIMATED VEHICLES (60FPS LOOP)
    // ========================================================
    const vehiclesGroup = new THREE.Group();
    dioramaGroup.add(vehiclesGroup);

    // Vehicle 1: Blue Compact Car
    const createCar = (bodyMat) => {
      const car = new THREE.Group();
      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 2.2), bodyMat);
      body.position.y = 0.45;
      body.castShadow = true;
      // Cabin
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.45, 1.2), mats.whiteTrim);
      cabin.position.set(0, 0.85, -0.1);
      // Windshield
      const wind = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.35, 0.05), mats.darkGlass);
      wind.position.set(0, 0.85, 0.52);
      // Headlights & Taillights
      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.05), mats.headlight);
      hl1.position.set(-0.4, 0.45, 1.11);
      const hl2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.05), mats.headlight);
      hl2.position.set(0.4, 0.45, 1.11);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.05), mats.taillight);
      tl.position.set(0, 0.45, -1.11);
      car.add(body, cabin, wind, hl1, hl2, tl);

      // Wheels
      for (let wx of [-0.62, 0.62]) {
        for (let wz of [-0.6, 0.6]) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12), mats.wheelRubber);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, 0.2, wz);
          car.add(w);
        }
      }
      return car;
    };

    // Vehicle 2: Bangladeshi Green/Yellow CNG Auto-Rickshaw (3-Wheeler)
    const createCNG = () => {
      const cng = new THREE.Group();
      // Lower body
      const lower = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.45, 1.7), mats.cngGreen);
      lower.position.y = 0.35;
      lower.castShadow = true;
      // Yellow top hood
      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.55, 1.1), mats.cngYellow);
      hood.position.set(0, 0.8, -0.2);
      // Front slanted windshield
      const wind = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.4, 0.05), mats.darkGlass);
      wind.position.set(0, 0.75, 0.55);
      wind.rotation.x = -0.3;
      cng.add(lower, hood, wind);

      // 3 wheels (1 front, 2 back)
      const fw = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), mats.wheelRubber);
      fw.rotation.z = Math.PI / 2;
      fw.position.set(0, 0.18, 0.65);
      const bw1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), mats.wheelRubber);
      bw1.rotation.z = Math.PI / 2;
      bw1.position.set(-0.54, 0.18, -0.5);
      const bw2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), mats.wheelRubber);
      bw2.rotation.z = Math.PI / 2;
      bw2.position.set(0.54, 0.18, -0.5);
      cng.add(fw, bw1, bw2);
      return cng;
    };

    // Vehicle 3: Delivery Motorbike with rider
    const createMotorbike = (bikeColor) => {
      const bike = new THREE.Group();
      // Body frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 1.2), bikeColor);
      frame.position.y = 0.4;
      // Handlebar
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.05, 0.05), mats.metalPlate);
      handle.position.set(0, 0.7, 0.4);
      // Wheels
      const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08), mats.wheelRubber);
      w1.rotation.z = Math.PI / 2;
      w1.position.set(0, 0.2, 0.5);
      const w2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08), mats.wheelRubber);
      w2.rotation.z = Math.PI / 2;
      w2.position.set(0, 0.2, -0.5);

      // Rider figure
      const riderBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 0.25), mats.shirt3);
      riderBody.position.set(0, 0.75, 0);
      const riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.16), mats.sirenRed); // red helmet
      riderHead.position.set(0, 1.1, 0);
      // Delivery backpack on back
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.3), mats.leavesLight);
      bag.position.set(0, 0.78, -0.22);

      bike.add(frame, handle, w1, w2, riderBody, riderHead, bag);
      return bike;
    };

    // Instantiate Traffic fleet along the loop
    const trafficFleet = [
      { mesh: createCar(mats.carBlue), progress: 0.05, speed: 0.038 },
      { mesh: createCar(mats.carRed), progress: 0.38, speed: 0.040 },
      { mesh: createCNG(), progress: 0.62, speed: 0.032 },
      { mesh: createCar(mats.carYellow), progress: 0.78, speed: 0.036 },
      { mesh: createMotorbike(mats.carRed), progress: 0.22, speed: 0.046 },
      { mesh: createMotorbike(mats.carBlue), progress: 0.90, speed: 0.044 },
    ];

    trafficFleet.forEach((v) => {
      vehiclesGroup.add(v.mesh);
    });
    animatedObjectsRef.current.trafficFleet = trafficFleet;

    // ========================================================
    // 12. ANIMATED SIDEWALK PEDESTRIANS
    // ========================================================
    const pedGroup = new THREE.Group();
    dioramaGroup.add(pedGroup);

    const makePedestrian = (shirtMat, pathX, pathZ, dirZ = 1) => {
      const ped = new THREE.Group();
      // Legs
      const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.32), mats.pants);
      leg1.position.set(-0.07, 0.16, 0);
      const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.32), mats.pants);
      leg2.position.set(0.07, 0.16, 0);

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.35, 0.18), shirtMat);
      torso.position.y = 0.45;
      torso.castShadow = true;

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12), mats.skin);
      head.position.y = 0.72;

      ped.add(leg1, leg2, torso, head);
      ped.position.set(pathX, 0.12, pathZ);
      pedGroup.add(ped);

      return { ped, leg1, leg2, baseX: pathX, baseZ: pathZ, dirZ, phase: Math.random() * Math.PI };
    };

    const pedestrians = [
      makePedestrian(mats.shirt1, -2.6, 3.8, 1),
      makePedestrian(mats.shirt2, 2.6, 3.8, -1),
      makePedestrian(mats.shirt3, -6.8, 2.0, 1),
      makePedestrian(mats.shirt4, -6.8, -2.5, -1),
      makePedestrian(mats.shirt1, 6.8, -2.0, 1),
      makePedestrian(mats.shirt2, 6.8, 2.5, -1),
      makePedestrian(mats.shirt4, 1.2, -6.8, 1),
    ];
    animatedObjectsRef.current.pedestrians = pedestrians;

    // ========================================================
    // 13. FLOATING BOBBING PINS / LABELS
    // ========================================================
    const pinsGroup = new THREE.Group();
    dioramaGroup.add(pinsGroup);

    // Create Pin Badge Mesh for each Landmark
    const pinMeshes = [];

    LANDMARKS.forEach((lm) => {
      const pinObj = new THREE.Group();
      pinObj.position.set(lm.position[0], lm.position[1], lm.position[2]);

      // Create procedural canvas texture for pin label
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 72;
      const ctx = canvas.getContext("2d");

      // Draw rounded pill background
      ctx.fillStyle = lm.pinBg;
      ctx.strokeStyle = lm.badgeColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(4, 4, 248, 64, 32);
      ctx.fill();
      ctx.stroke();

      // Draw text and icon
      ctx.fillStyle = lm.pinText;
      ctx.font = "bold 24px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${lm.icon} ${lm.name.slice(0, 14)}`, 128, 36);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;

      // 3D Billboard Sprite
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(2.4, 0.68, 1);
      sprite.position.y = 0.5;
      pinObj.add(sprite);

      // Pin stem pointing down to building
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.01, 0.5),
        new THREE.MeshBasicMaterial({ color: lm.badgeColor })
      );
      stem.position.y = 0.2;
      pinObj.add(stem);

      // Pointer sphere at bottom tip
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.08),
        new THREE.MeshBasicMaterial({ color: lm.badgeColor })
      );
      tip.position.y = 0.02;
      pinObj.add(tip);

      pinObj.userData = { landmark: lm, baseY: lm.position[1] };
      pinsGroup.add(pinObj);
      pinMeshes.push(pinObj);
    });

    animatedObjectsRef.current.pinMeshes = pinMeshes;

    // Raycasting for interactive click on pins / buildings
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(pinsGroup.children, true);

      if (intersects.length > 0) {
        let curr = intersects[0].object;
        while (curr && !curr.userData?.landmark && curr.parent) {
          curr = curr.parent;
        }
        if (curr?.userData?.landmark) {
          setActiveLandmark(curr.userData.landmark);
        }
      }
    };

    renderer.domElement.addEventListener("click", handleClick);

    // ========================================================
    // 14. ANIMATION LOOP (60FPS CONTINUOUS SMOOTH CYCLE)
    // ========================================================
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Controls update
      controls.update();

      // 1. Update Traffic Movement along the loop
      if (animatedObjectsRef.current.trafficFleet) {
        animatedObjectsRef.current.trafficFleet.forEach((v) => {
          v.progress = (v.progress + v.speed * delta) % 1;
          const { x, z, heading } = getRoadPoint(v.progress);
          v.mesh.position.set(x, roadY, z);
          v.mesh.rotation.y = heading;
        });
      }

      // 2. Bobbing Floating Pins (Offset Sine Waves)
      if (animatedObjectsRef.current.pinMeshes) {
        animatedObjectsRef.current.pinMeshes.forEach((pin, idx) => {
          const baseY = pin.userData.baseY;
          pin.position.y = baseY + Math.sin(time * 2.4 + idx * 0.8) * 0.12;
        });
      }

      // 3. Ambulance Emergency Flashing Siren Light
      if (animatedObjectsRef.current.ambSirenLight) {
        const sirenState = Math.sin(time * 12) > 0;
        animatedObjectsRef.current.ambSirenLight.color.set(sirenState ? "#ef4444" : "#3b82f6");
        animatedObjectsRef.current.ambSirenLight.intensity = sirenState ? 2.5 : 0.8;
      }

      // 4. Pedestrian Walking Animation
      if (animatedObjectsRef.current.pedestrians) {
        animatedObjectsRef.current.pedestrians.forEach((p) => {
          const walkCycle = Math.sin(time * 6 + p.phase);
          p.leg1.rotation.x = walkCycle * 0.45;
          p.leg2.rotation.x = -walkCycle * 0.45;
          // small subtle pacing along sidewalk
          p.ped.position.z = p.baseZ + Math.sin(time * 0.8 + p.phase) * 0.5 * p.dirZ;
        });
      }

      // 5. Trees Wind Sway
      if (animatedObjectsRef.current.treeList) {
        animatedObjectsRef.current.treeList.forEach((t, i) => {
          t.rotation.z = Math.sin(time * 1.8 + i) * 0.025;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", handleClick);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Update Time of Day Lighting
  useEffect(() => {
    const lights = lightsRef.current;
    const scene = sceneRef.current;
    if (!lights || !scene) return;

    if (timeOfDay === "day") {
      scene.background.set("#F8F9FA");
      lights.ambientLight?.color.set("#fdf6ec");
      lights.ambientLight.intensity = 1.2;
      lights.dirLight?.color.set("#fff4db");
      lights.dirLight.intensity = 2.2;
      lights.fillLight?.color.set("#bfdbfe");
      lights.fillLight.intensity = 0.8;
    } else if (timeOfDay === "sunset") {
      scene.background.set("#fef2f2");
      lights.ambientLight?.color.set("#fed7aa");
      lights.ambientLight.intensity = 1.4;
      lights.dirLight?.color.set("#f97316");
      lights.dirLight.intensity = 2.6;
      lights.fillLight?.color.set("#c084fc");
      lights.fillLight.intensity = 1.0;
    } else if (timeOfDay === "night") {
      scene.background.set("#0f172a");
      lights.ambientLight?.color.set("#1e1b4b");
      lights.ambientLight.intensity = 0.7;
      lights.dirLight?.color.set("#38bdf8");
      lights.dirLight.intensity = 1.0;
      lights.fillLight?.color.set("#6366f1");
      lights.fillLight.intensity = 0.6;
    }
  }, [timeOfDay]);

  // Update Auto-rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Reset Camera View
  const handleResetCamera = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(22, 18, 22);
      controlsRef.current.target.set(0, 1.2, 0);
      controlsRef.current.update();
      setAutoRotate(true);
    }
  }, []);

  return (
    <div className="relative mx-auto h-[480px] w-full max-w-[620px] select-none sm:h-[530px]">
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        className="h-full w-full overflow-hidden rounded-[36px] bg-[#F8F9FA] shadow-2xl ring-1 ring-forest/10 cursor-grab active:cursor-grabbing transition-colors duration-500"
      />

      {/* Top Left Badge */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-forest/10 bg-white/90 px-3.5 py-1.5 shadow-sm backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-bold text-forest">3D Interactive Neighborhood</span>
      </div>

      {/* Top Right Controls (Lighting Presets: Day, Sunset, Night) */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full border border-forest/10 bg-white/90 p-1 shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={() => setTimeOfDay("day")}
          className={`grid h-7 w-7 place-items-center rounded-full transition ${timeOfDay === "day"
            ? "bg-amber-100 text-amber-900 shadow-xs font-bold"
            : "text-slate-500 hover:text-slate-800"
            }`}
          title="Bright Daylight"
        >
          <Sun size={14} />
        </button>
        <button
          type="button"
          onClick={() => setTimeOfDay("sunset")}
          className={`grid h-7 w-7 place-items-center rounded-full transition ${timeOfDay === "sunset"
            ? "bg-orange-100 text-orange-900 shadow-xs font-bold"
            : "text-slate-500 hover:text-slate-800"
            }`}
          title="Golden Hour Sunset"
        >
          <Sunset size={14} />
        </button>
        <button
          type="button"
          onClick={() => setTimeOfDay("night")}
          className={`grid h-7 w-7 place-items-center rounded-full transition ${timeOfDay === "night"
            ? "bg-indigo-900 text-indigo-100 shadow-xs font-bold"
            : "text-slate-500 hover:text-slate-800"
            }`}
          title="Cozy Night"
        >
          <Moon size={14} />
        </button>
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-4 inset-x-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition shadow-sm backdrop-blur-md ${autoRotate
              ? "bg-forest text-lime shadow-forest/20"
              : "border border-forest/15 bg-white/90 text-forest hover:bg-forest hover:text-white"
              }`}
          >
            <RotateCw size={12} className={autoRotate ? "animate-spin" : ""} />
            {autoRotate ? "Auto-Spin ON" : "Auto-Spin"}
          </button>
          <button
            type="button"
            onClick={handleResetCamera}
            className="inline-flex items-center gap-1 rounded-full border border-forest/15 bg-white/90 px-3 py-1.5 text-xs font-semibold text-forest shadow-sm backdrop-blur-md transition hover:bg-forest hover:text-white"
          >
            <Maximize2 size={12} /> Reset View
          </button>
        </div>

        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-forest/70 backdrop-blur-md shadow-xs hidden sm:inline-block">
          🔍 Scroll to Zoom · Drag to Rotate
        </span>
      </div>

      {/* Interactive Landmark Popup Modal */}
      {activeLandmark && (
        <div className="absolute inset-x-4 bottom-14 z-20 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="rounded-3xl border border-forest/20 bg-white/98 p-5 shadow-2xl backdrop-blur-xl ring-1 ring-black/5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: activeLandmark.badgeColor }}
                  >
                    {activeLandmark.icon} {activeLandmark.category}
                  </span>
                  <span className="rounded-full bg-lime/60 px-2 py-0.5 text-[10px] font-extrabold text-forest">
                    {activeLandmark.rating}
                  </span>
                </div>
                <h3 className="mt-1.5 text-base font-extrabold text-forest sm:text-lg">
                  {activeLandmark.name}
                </h3>
                <p className="mt-1 text-xs text-slate-600 sm:text-sm leading-relaxed">
                  {activeLandmark.desc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveLandmark(null)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                <Navigation size={13} className="text-emerald-600" />
                {activeLandmark.distance} · {activeLandmark.status}
              </span>
              <Link
                to={activeLandmark.link}
                className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-1.5 text-xs font-bold text-lime shadow-md transition hover:bg-forest/90 hover:scale-105"
              >
                Explore {activeLandmark.category} <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Initial Interaction Guidance Hint */}
      {!hasInteracted && !activeLandmark && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <div className="animate-bounce rounded-full border border-forest/15 bg-white/90 px-4 py-2 text-xs font-semibold text-forest shadow-lg backdrop-blur-md">
            ✦ Drag to rotate 3D neighborhood · Tap badges to explore
          </div>
        </div>
      )}
    </div>
  );
}
