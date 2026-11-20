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
  Minimize2,
  X,
  Compass,
} from "lucide-react";

// Detailed Landmark definitions with rich metadata & deep routes
const LANDMARKS = [
  {
    id: "home",
    name: "My Home — Smart Villa",
    category: "Residence",
    rating: "Sweet Home",
    distance: "Center Point",
    status: "Safe · High-Speed Fiber",
    badgeColor: "#10b981",
    pinBg: "#ffffff",
    pinText: "#0f172a",
    icon: "🏠",
    position: [0, 4.2, 0],
    link: "/shops",
    desc: "Cozy neighborhood bungalow with terracotta roof, white picket perimeter wall, manicured lawn, and flower garden at the heart of the community.",
  },
  {
    id: "hospital",
    name: "Central Care Hospital & Emergency",
    category: "Healthcare",
    rating: "4.9 ★ (340)",
    distance: "120m away",
    status: "24/7 Trauma Care Active",
    badgeColor: "#ef4444",
    pinBg: "#eff6ff",
    pinText: "#1e3a8a",
    icon: "🏥",
    position: [-12.2, 4.8, 6.5],
    link: "/services?q=Healthcare",
    desc: "Two-story medical complex with emergency bay, red cross emblems, rooftop ventilation, specialist doctors, and dedicated ambulance fleet on standby.",
  },
  {
    id: "pharmacy",
    name: "LocalCare 24/7 Wellness Pharmacy",
    category: "Medicine",
    rating: "4.8 ★ (210)",
    distance: "180m away",
    status: "Open Now · Full Inventory",
    badgeColor: "#10b981",
    pinBg: "#ecfdf5",
    pinText: "#065f46",
    icon: "💊",
    position: [-12.2, 4.2, -6.5],
    link: "/products?q=Medicine",
    desc: "Full-line modern pharmacy with mint-green facade, rooftop 3D green cross, stocked shelves with prescription medicines, baby care, and diabetic supplies.",
  },
  {
    id: "auto-service",
    name: "Apex Auto & Motorcycle MegaCare",
    category: "Repair Services",
    rating: "4.9 ★ (420)",
    distance: "290m away",
    status: "3 Master Mechanics on Duty",
    badgeColor: "#f59e0b",
    pinBg: "#fffbeb",
    pinText: "#92400e",
    icon: "🔧",
    position: [0, 5.5, -13.6],
    link: "/services?q=Repair+Services",
    desc: "Spacious automotive care center with high red marquee banner, hydraulic car lift bay, motorcycle diagnostics station, oil drums, and tire balancing.",
  },
  {
    id: "grocery",
    name: "Green Valley Organic Market & Bazaar",
    category: "Grocery & Food",
    rating: "4.9 ★ (510)",
    distance: "150m away",
    status: "Farm-Fresh Stock Just In",
    badgeColor: "#16a34a",
    pinBg: "#f0fdf4",
    pinText: "#14532d",
    icon: "🥬",
    position: [12.6, 4.5, -6.0],
    link: "/products?q=Grocery",
    desc: "Vibrant neighborhood market with tiered striped canopies, wooden produce crates filled with fresh apples, oranges, bananas, and organic greens.",
  },
  {
    id: "repair-shop",
    name: "TechFix Electronics & Appliance Lab",
    category: "Repair Services",
    rating: "4.8 ★ (180)",
    distance: "190m away",
    status: "Same-Day Fix Active",
    badgeColor: "#8b5cf6",
    pinBg: "#f5f3ff",
    pinText: "#5b21b6",
    icon: "🛠️",
    position: [12.6, 4.0, -1.2],
    link: "/services?q=Repair",
    desc: "Quick diagnostics and repair for mobile screens, laptops, TV motherboards, refrigerator compressors, microwave ovens, and electrical home appliances.",
  },
  {
    id: "laundry",
    name: "SmartSparks Express Laundromat",
    category: "Laundry",
    rating: "4.7 ★ (135)",
    distance: "110m away",
    status: "Washers Spinning Now",
    badgeColor: "#0284c7",
    pinBg: "#f0f9ff",
    pinText: "#075985",
    icon: "🧺",
    position: [12.4, 3.8, 4.2],
    link: "/services?q=Laundry",
    desc: "Modern light-blue laundromat featuring glass storefront, stainless commercial washing machines, steam press, and adjacent street tea kiosk.",
  },
  {
    id: "restaurant",
    name: "The Terrace Cafe, Grill & Bistro",
    category: "Restaurant",
    rating: "5.0 ★ (680)",
    distance: "80m away",
    status: "Open · Chef's Special Available",
    badgeColor: "#ea580c",
    pinBg: "#fff7ed",
    pinText: "#9a3412",
    icon: "☕",
    position: [12.2, 4.2, 11.8],
    link: "/products?q=Food",
    desc: "Charming terracotta bistro with green-striped sunshade, outdoor dining patio with round tables, umbrellas, stone fountain, and seated guests dining.",
  },
];

// Continuous Looping Road Track (Superellipse cornering for smooth vehicle navigation)
function getRoadTrackPoint(progress) {
  const t = ((progress % 1) + 1) % 1;
  const angle = t * Math.PI * 2;
  const R = 8.6; // radius of wide looping boulevard around My Home block

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const px = THREE.MathUtils.clamp(Math.sign(cosA) * Math.min(R, Math.abs(cosA) * (R * 1.36)), -R, R);
  const pz = THREE.MathUtils.clamp(Math.sign(sinA) * Math.min(R, Math.abs(sinA) * (R * 1.36)), -R, R);

  // Tangent calculation for vehicle heading orientation
  const dt = 0.005;
  const nAngle = ((t + dt) % 1) * Math.PI * 2;
  const nCos = Math.cos(nAngle);
  const nSin = Math.sin(nAngle);
  const nx = THREE.MathUtils.clamp(Math.sign(nCos) * Math.min(R, Math.abs(nCos) * (R * 1.36)), -R, R);
  const nz = THREE.MathUtils.clamp(Math.sign(nSin) * Math.min(R, Math.abs(nSin) * (R * 1.36)), -R, R);

  const heading = Math.atan2(nx - px, nz - pz);
  return { x: px, z: pz, heading };
}

export default function Hero3DIsland() {
  const mountRef = useRef(null);
  const [activeLandmark, setActiveLandmark] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState("day"); // 'day' | 'sunset' | 'night'
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const lightsRef = useRef({});
  const animatedRefs = useRef({});

  // Initialize ultra-detailed expansive 3D scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 600;

    // 1. Three.js Scene with Studio Matte Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#F8F9FA");
    sceneRef.current = scene;

    // 2. Isometric High-Detail Perspective Camera
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.5, 200);
    camera.position.set(31, 24, 31);
    cameraRef.current = camera;

    // 3. WebGL Renderer with High-Fidelity Soft Shadows
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
      renderer.toneMappingExposure = 1.16;
      container.innerHTML = "";
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
      console.error("WebGL initialization failed:", e);
      return;
    }

    // 4. OrbitControls with smooth damping and pitch bounds
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.14; // never look below the ground base
    controls.minPolarAngle = Math.PI / 7;
    controls.minDistance = 12;
    controls.maxDistance = 55;
    controls.target.set(0, 1.6, 0);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.45;
    controlsRef.current = controls;

    controls.addEventListener("start", () => {
      setHasInteracted(true);
      setAutoRotate(false);
    });

    // 5. Lighting Setup (Soft Studio Warm Daylight)
    const ambientLight = new THREE.AmbientLight("#fff8ee", 1.35);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight("#fff3dd", 2.3);
    dirLight.position.set(26, 36, 22);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 95;
    dirLight.shadow.camera.left = -26;
    dirLight.shadow.camera.right = 26;
    dirLight.shadow.camera.top = 26;
    dirLight.shadow.camera.bottom = -26;
    dirLight.shadow.bias = -0.0003;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight("#bfdbfe", 0.85);
    fillLight.position.set(-24, 18, -24);
    scene.add(fillLight);

    const groundHemiLight = new THREE.HemisphereLight("#ffffff", "#c7dbb9", 0.65);
    scene.add(groundHemiLight);

    lightsRef.current = { ambientLight, dirLight, fillLight, groundHemiLight };

    // --- COLOR PALETTE & MATTE CLAY MATERIALS ---
    const mats = {
      // Ground Layers
      dirtCore: new THREE.MeshLambertMaterial({ color: "#543825" }),
      dirtMid: new THREE.MeshLambertMaterial({ color: "#9c6d48" }),
      dirtLip: new THREE.MeshLambertMaterial({ color: "#e8ded2" }),
      grassLawn: new THREE.MeshLambertMaterial({ color: "#cde3b5" }),
      grassDark: new THREE.MeshLambertMaterial({ color: "#9dbf7c" }),
      sidewalk: new THREE.MeshLambertMaterial({ color: "#f2ece1" }),
      curbStone: new THREE.MeshLambertMaterial({ color: "#d9d0c3" }),
      plazaPave: new THREE.MeshLambertMaterial({ color: "#e6decb" }),
      roadAsphalt: new THREE.MeshLambertMaterial({ color: "#28303d" }),
      roadDashes: new THREE.MeshLambertMaterial({ color: "#f8fafc" }),
      crosswalk: new THREE.MeshLambertMaterial({ color: "#ffffff" }),

      // My Home Villa
      villaWall: new THREE.MeshLambertMaterial({ color: "#fbf5eb" }),
      villaRoof: new THREE.MeshLambertMaterial({ color: "#c3532c" }),
      villaTrim: new THREE.MeshLambertMaterial({ color: "#ffffff" }),
      villaFence: new THREE.MeshLambertMaterial({ color: "#a87149" }),
      villaGlass: new THREE.MeshLambertMaterial({ color: "#93c5fd" }),
      villaChimney: new THREE.MeshLambertMaterial({ color: "#f1f5f9" }),

      // Central Hospital
      hospWhite: new THREE.MeshLambertMaterial({ color: "#f8fafc" }),
      hospBlue: new THREE.MeshLambertMaterial({ color: "#38bdf8" }),
      hospRed: new THREE.MeshLambertMaterial({ color: "#ef4444" }),
      hospDark: new THREE.MeshLambertMaterial({ color: "#334155" }),

      // Pharmacy
      pharmMint: new THREE.MeshLambertMaterial({ color: "#10b981" }),
      pharmLight: new THREE.MeshLambertMaterial({ color: "#ecfdf5" }),
      pharmGreen: new THREE.MeshLambertMaterial({ color: "#047857" }),

      // Auto & Bike Service
      autoGray: new THREE.MeshLambertMaterial({ color: "#94a3b8" }),
      autoDark: new THREE.MeshLambertMaterial({ color: "#475569" }),
      autoRed: new THREE.MeshLambertMaterial({ color: "#dc2626" }),
      autoYellow: new THREE.MeshLambertMaterial({ color: "#f59e0b" }),
      metalPlate: new THREE.MeshLambertMaterial({ color: "#64748b" }),

      // Market & Grocery
      awningRed: new THREE.MeshLambertMaterial({ color: "#e11d48" }),
      awningGreen: new THREE.MeshLambertMaterial({ color: "#16a34a" }),
      awningBlue: new THREE.MeshLambertMaterial({ color: "#2563eb" }),
      awningYellow: new THREE.MeshLambertMaterial({ color: "#facc15" }),
      crateWood: new THREE.MeshLambertMaterial({ color: "#b48356" }),
      fruitRed: new THREE.MeshLambertMaterial({ color: "#ef4444" }),
      fruitOrange: new THREE.MeshLambertMaterial({ color: "#f97316" }),
      fruitYellow: new THREE.MeshLambertMaterial({ color: "#eab308" }),
      fruitGreen: new THREE.MeshLambertMaterial({ color: "#22c55e" }),
      fruitPurple: new THREE.MeshLambertMaterial({ color: "#7c3aed" }),

      // Laundry & Restaurant
      laundryCyan: new THREE.MeshLambertMaterial({ color: "#0284c7" }),
      restTerracotta: new THREE.MeshLambertMaterial({ color: "#ea580c" }),
      restCream: new THREE.MeshLambertMaterial({ color: "#ffedd5" }),
      fountainWater: new THREE.MeshLambertMaterial({ color: "#0ea5e9" }),

      // Nature & Infrastructure
      poleWood: new THREE.MeshLambertMaterial({ color: "#6b4a31" }),
      wireMat: new THREE.LineBasicMaterial({ color: "#334155", linewidth: 1 }),
      treeTrunk: new THREE.MeshLambertMaterial({ color: "#543a25" }),
      leafLight: new THREE.MeshLambertMaterial({ color: "#4ade80" }),
      leafMid: new THREE.MeshLambertMaterial({ color: "#22c55e" }),
      leafDark: new THREE.MeshLambertMaterial({ color: "#15803d" }),
      lampMetal: new THREE.MeshLambertMaterial({ color: "#334155" }),
      lampGlow: new THREE.MeshBasicMaterial({ color: "#fef08a" }),

      // Vehicles
      carRed: new THREE.MeshLambertMaterial({ color: "#dc2626" }),
      carBlue: new THREE.MeshLambertMaterial({ color: "#2563eb" }),
      carYellow: new THREE.MeshLambertMaterial({ color: "#eab308" }),
      carWhite: new THREE.MeshLambertMaterial({ color: "#f8fafc" }),
      cngGreen: new THREE.MeshLambertMaterial({ color: "#16a34a" }),
      cngYellow: new THREE.MeshLambertMaterial({ color: "#facc15" }),
      wheelRubber: new THREE.MeshLambertMaterial({ color: "#1e293b" }),
      wheelHub: new THREE.MeshLambertMaterial({ color: "#cbd5e1" }),
      headlightGlow: new THREE.MeshBasicMaterial({ color: "#fef08a" }),
      taillightGlow: new THREE.MeshBasicMaterial({ color: "#ef4444" }),

      // Pedestrians
      skinTone: new THREE.MeshLambertMaterial({ color: "#fed7aa" }),
      skinToneAlt: new THREE.MeshLambertMaterial({ color: "#fbcfe8" }),
      clothesNavy: new THREE.MeshLambertMaterial({ color: "#1e3a8a" }),
      clothesDark: new THREE.MeshLambertMaterial({ color: "#1e293b" }),
      clothesRed: new THREE.MeshLambertMaterial({ color: "#e11d48" }),
      clothesGreen: new THREE.MeshLambertMaterial({ color: "#10b981" }),
      clothesBlue: new THREE.MeshLambertMaterial({ color: "#3b82f6" }),
      clothesYellow: new THREE.MeshLambertMaterial({ color: "#eab308" }),
      clothesWhite: new THREE.MeshLambertMaterial({ color: "#ffffff" }),
      hairDark: new THREE.MeshLambertMaterial({ color: "#0f172a" }),
      hairBrown: new THREE.MeshLambertMaterial({ color: "#451a03" }),
    };

    // Root Diorama Group
    const diorama = new THREE.Group();
    scene.add(diorama);

    // ========================================================
    // 1. EXPANSIVE 34x34 DIORAMA BASE WITH MULTI-TIER EARTHEN LAYERS
    // ========================================================
    const baseSize = 34.0;
    const baseH = 2.2;

    // Subterranean Earthen Core
    const earthCore = new THREE.Mesh(
      new THREE.BoxGeometry(baseSize, baseH, baseSize),
      mats.dirtCore
    );
    earthCore.position.y = -baseH / 2;
    earthCore.receiveShadow = true;
    diorama.add(earthCore);

    // Mid-tier Strata Layer
    const earthMid = new THREE.Mesh(
      new THREE.BoxGeometry(baseSize + 0.3, 0.4, baseSize + 0.3),
      mats.dirtMid
    );
    earthMid.position.y = -0.45;
    earthMid.receiveShadow = true;
    diorama.add(earthMid);

    // Beveled Top Clay/Stone Trim Lip
    const earthLip = new THREE.Mesh(
      new THREE.BoxGeometry(baseSize + 0.5, 0.28, baseSize + 0.5),
      mats.dirtLip
    );
    earthLip.position.y = -0.14;
    earthLip.receiveShadow = true;
    diorama.add(earthLip);

    // Top Emerald Grass Soil Plane
    const topGrass = new THREE.Mesh(
      new THREE.BoxGeometry(baseSize - 0.1, 0.22, baseSize - 0.1),
      mats.grassLawn
    );
    topGrass.position.y = 0.05;
    topGrass.receiveShadow = true;
    diorama.add(topGrass);

    // ========================================================
    // 2. EXPANDED TWO-LANE BOULEVARD (LOOPING ASPHALT HIGHWAY)
    // ========================================================
    const roadGroup = new THREE.Group();
    diorama.add(roadGroup);

    const roadW = 3.4; // wide 2-lane road
    const roadY = 0.16;
    const loopR = 8.6; // boulevard track radius

    // 4 Straight Highway Avenues
    const makeRoadSegment = (w, d, x, z) => {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), mats.roadAsphalt);
      seg.position.set(x, roadY, z);
      seg.receiveShadow = true;
      roadGroup.add(seg);
    };

    makeRoadSegment(20.6, roadW, 0, loopR); // South Avenue
    makeRoadSegment(20.6, roadW, 0, -loopR); // North Avenue
    makeRoadSegment(roadW, 20.6, -loopR, 0); // West Avenue
    makeRoadSegment(roadW, 20.6, loopR, 0); // East Avenue

    // 4 Corner Intersections
    const makeIntersection = (x, z) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(roadW, 0.04, roadW), mats.roadAsphalt);
      box.position.set(x, roadY, z);
      box.receiveShadow = true;
      roadGroup.add(box);
    };
    makeIntersection(-loopR, -loopR);
    makeIntersection(loopR, -loopR);
    makeIntersection(-loopR, loopR);
    makeIntersection(loopR, loopR);

    // Dashed White Lane Divider Lines
    const drawDashedLines = (x1, z1, x2, z2) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const dist = Math.hypot(dx, dz);
      const steps = Math.floor(dist / 1.4);
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const x = x1 + dx * frac;
        const z = z1 + dz * frac;
        const dash = new THREE.Mesh(
          new THREE.BoxGeometry(dx !== 0 ? 0.75 : 0.15, 0.05, dz !== 0 ? 0.75 : 0.15),
          mats.roadDashes
        );
        dash.position.set(x, roadY + 0.01, z);
        roadGroup.add(dash);
      }
    };

    drawDashedLines(-6.8, loopR, 6.8, loopR);
    drawDashedLines(-6.8, -loopR, 6.8, -loopR);
    drawDashedLines(-loopR, -6.8, -loopR, 6.8);
    drawDashedLines(loopR, -6.8, loopR, 6.8);

    // Pedestrian Zebra Crosswalks
    const makeCrosswalk = (cx, cz, isVertical = false) => {
      for (let offset = -1.3; offset <= 1.3; offset += 0.42) {
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(isVertical ? roadW - 0.4 : 0.24, 0.052, isVertical ? 0.24 : roadW - 0.4),
          mats.crosswalk
        );
        stripe.position.set(isVertical ? cx : cx + offset, roadY + 0.012, isVertical ? cz + offset : cz);
        roadGroup.add(stripe);
      }
    };
    makeCrosswalk(0, loopR, false);
    makeCrosswalk(-loopR, 0, true);
    makeCrosswalk(0, -loopR, false);
    makeCrosswalk(loopR, 0, true);

    // Sidewalk Pavements & Plazas
    const makePavedPlaza = (w, d, x, z) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), mats.sidewalk);
      p.position.set(x, 0.12, z);
      p.receiveShadow = true;
      diorama.add(p);
    };

    makePavedPlaza(12.6, 12.6, 0, 0); // Center Home Block
    makePavedPlaza(7.6, 13.0, -12.4, 6.0); // Hospital Plaza
    makePavedPlaza(7.6, 13.0, -12.4, -6.8); // Pharmacy Plaza
    makePavedPlaza(17.4, 7.6, 0, -13.6); // Auto Garage Workshop Plaza
    makePavedPlaza(7.6, 12.0, 12.6, -6.5); // Bazaar & Grocery Market Plaza
    makePavedPlaza(7.6, 14.0, 12.4, 6.5); // Restaurant & Laundry Plaza

    // ========================================================
    // 3. CENTERPIECE — "MY HOME" (BUNGALOW MATCHING REFERENCE IMAGE)
    // ========================================================
    const homeGroup = new THREE.Group();
    diorama.add(homeGroup);

    // Manicured Yard Lawn
    const homeLawn = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.15, 10.8), mats.grassDark);
    homeLawn.position.set(0, 0.13, 0);
    homeLawn.receiveShadow = true;
    homeGroup.add(homeLawn);

    // Flagstone Garden Pathway to Front Gate
    const walkStone = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 4.4), mats.plazaPave);
    walkStone.position.set(0, 0.14, 3.2);
    homeGroup.add(walkStone);

    // Cozy Beige House Body
    const houseBody = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.3, 4.6), mats.villaWall);
    houseBody.position.set(0, 1.3, -0.4);
    houseBody.castShadow = true;
    houseBody.receiveShadow = true;
    homeGroup.add(houseBody);

    // Warm Terracotta Hipped Pitched Roof
    const houseRoof = new THREE.Mesh(new THREE.ConeGeometry(4.4, 1.6, 4), mats.villaRoof);
    houseRoof.position.set(0, 3.25, -0.4);
    houseRoof.rotation.y = Math.PI / 4;
    houseRoof.scale.set(1.18, 0.85, 1.05);
    houseRoof.castShadow = true;
    homeGroup.add(houseRoof);

    // Chimney with terracotta cap
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.55), mats.villaChimney);
    chimney.position.set(1.4, 3.4, -0.8);
    const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.7), mats.villaRoof);
    chimneyCap.position.set(1.4, 4.05, -0.8);
    homeGroup.add(chimney, chimneyCap);

    // Front Porch Veranda with White Posts
    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 1.4), mats.villaRoof);
    porchRoof.position.set(0, 2.3, 2.2);
    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0), mats.villaTrim);
    post1.position.set(-1.0, 1.15, 2.7);
    const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0), mats.villaTrim);
    post2.position.set(1.0, 1.15, 2.7);
    homeGroup.add(porchRoof, post1, post2);

    // Front Wooden Door
    const frontDoor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.08), mats.villaFence);
    frontDoor.position.set(0, 0.95, 1.92);
    homeGroup.add(frontDoor);

    // Front Framed Windows
    const makeHomeWindow = (wx, wy, wz) => {
      const g = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.06), mats.villaTrim);
      const glass = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.08), mats.villaGlass);
      g.add(frame, glass);
      g.position.set(wx, wy, wz);
      return g;
    };
    homeGroup.add(makeHomeWindow(-1.8, 1.4, 1.92));
    homeGroup.add(makeHomeWindow(1.8, 1.4, 1.92));

    // Surrounding Boundary Fence (White Posts & Wooden Rails)
    const makeFenceRail = (w, d, x, z) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.65, d), mats.villaWall);
      rail.position.set(x, 0.48, z);
      rail.castShadow = true;
      homeGroup.add(rail);
    };
    makeFenceRail(10.8, 0.18, 0, -5.3); // back
    makeFenceRail(0.18, 10.8, -5.3, 0); // left
    makeFenceRail(0.18, 10.8, 5.3, 0); // right
    makeFenceRail(4.2, 0.18, -3.3, 5.3); // front left
    makeFenceRail(4.2, 0.18, 3.3, 5.3); // front right

    // Front Gate Entry Pillars & Mailbox
    const gateCol1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.0, 0.4), mats.villaTrim);
    gateCol1.position.set(-1.1, 0.65, 5.3);
    const gateCol2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.0, 0.4), mats.villaTrim);
    gateCol2.position.set(1.1, 0.65, 5.3);
    const mailbox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.25), mats.hospRed);
    mailbox.position.set(1.1, 1.25, 5.3);
    homeGroup.add(gateCol1, gateCol2, mailbox);

    // Garden Flower Shrubs in Yard
    const addShrub = (sx, sz, mat) => {
      const sh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45), mat);
      sh.position.set(sx, 0.4, sz);
      sh.castShadow = true;
      homeGroup.add(sh);
    };
    addShrub(-3.8, 3.6, mats.leafMid);
    addShrub(-3.8, 2.4, mats.leafLight);
    addShrub(3.8, 3.6, mats.leafLight);
    addShrub(3.8, 2.4, mats.leafMid);

    // ========================================================
    // 4. CENTRAL HOSPITAL (FRONT LEFT CLINIC + PARKED AMBULANCE)
    // ========================================================
    const hospGroup = new THREE.Group();
    hospGroup.position.set(-12.2, 0, 6.5);
    diorama.add(hospGroup);

    // Two-Story Medical Center Body
    const hospTower = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.8, 5.4), mats.hospWhite);
    hospTower.position.set(0, 2.0, 0);
    hospTower.castShadow = true;
    hospTower.receiveShadow = true;
    hospGroup.add(hospTower);

    // Sky-Blue Base Skirting & Roof Parapet
    const hospBase = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.5, 5.5), mats.hospBlue);
    hospBase.position.set(0, 0.35, 0);
    const hospRoof = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.35, 5.5), mats.hospBlue);
    hospRoof.position.set(0, 4.0, 0);
    hospGroup.add(hospBase, hospRoof);

    // 3D Red Cross Sign on front
    const makeRedCross = (x, y, z, rotY = 0) => {
      const g = new THREE.Group();
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.12), mats.hospRed);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.12), mats.hospRed);
      g.add(b1, b2);
      g.position.set(x, y, z);
      g.rotation.y = rotY;
      return g;
    };
    hospGroup.add(makeRedCross(2.76, 3.1, 0, Math.PI / 2));

    // Red & White Striped Entrance Canopy
    const hospCanopy = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 2.4), mats.awningRed);
    hospCanopy.position.set(3.4, 1.8, 0);
    hospCanopy.rotation.z = -0.22;
    const hospDoor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 1.4), mats.villaGlass);
    hospDoor.position.set(2.72, 0.85, 0);
    hospGroup.add(hospCanopy, hospDoor);

    // Rooftop AC / HVAC Utility Unit
    const hvac = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.4), mats.hospDark);
    hvac.position.set(-0.6, 4.35, 0);
    hospGroup.add(hvac);

    // Parked High-Detail Ambulance
    const ambGroup = new THREE.Group();
    ambGroup.position.set(-10.2, 0.16, 10.8);
    ambGroup.rotation.y = -Math.PI / 2;
    diorama.add(ambGroup);

    const ambBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 3.2), mats.hospWhite);
    ambBody.position.y = 0.8;
    ambBody.castShadow = true;
    const ambStripe = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.24, 3.24), mats.hospRed);
    ambStripe.position.y = 0.8;
    const ambGlass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.1), mats.villaGlass);
    ambGlass.position.set(0, 0.95, 1.56);
    ambGlass.rotation.x = -0.25;
    ambGroup.add(ambBody, ambStripe, ambGlass);

    // Dual-color Flashing Siren Bar
    const sirenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 0.28), mats.hospRed);
    sirenMesh.position.set(0, 1.45, 0.4);
    ambGroup.add(sirenMesh);

    // Dynamic Flashing Emergency Light
    const ambPointLight = new THREE.PointLight("#ef4444", 2.2, 8);
    ambPointLight.position.set(-10.2, 1.8, 10.8);
    scene.add(ambPointLight);
    animatedRefs.current.ambLight = ambPointLight;

    // Ambulance Wheels
    for (let ax of [-0.82, 0.82]) {
      for (let az of [-0.95, 0.95]) {
        const aw = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 16), mats.wheelRubber);
        aw.rotation.z = Math.PI / 2;
        aw.position.set(ax, 0.24, az);
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.15, 8), mats.wheelHub);
        rim.rotation.z = Math.PI / 2;
        rim.position.set(ax, 0.24, az);
        ambGroup.add(aw, rim);
      }
    }

    // Doctor / Nurse Character outside Hospital
    const doctorGroup = new THREE.Group();
    const docLegs = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.18), mats.clothesNavy);
    docLegs.position.y = 0.2;
    const docCoat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.48, 0.22), mats.clothesWhite);
    docCoat.position.y = 0.58;
    const docHead = new THREE.Mesh(new THREE.SphereGeometry(0.14), mats.skinTone);
    docHead.position.y = 0.92;
    doctorGroup.add(docLegs, docCoat, docHead);
    doctorGroup.position.set(-10.5, 0.14, 8.2);
    diorama.add(doctorGroup);

    // ========================================================
    // 5. MODERN 24/7 PHARMACY (MIDDLE LEFT)
    // ========================================================
    const pharmGroup = new THREE.Group();
    pharmGroup.position.set(-12.2, 0, -6.5);
    diorama.add(pharmGroup);

    // Pharmacy Building (Mint & Clean White)
    const pharmBody = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.2, 5.0), mats.pharmLight);
    pharmBody.position.set(0, 1.7, 0);
    pharmBody.castShadow = true;
    pharmGroup.add(pharmBody);

    // Mint Green Parapet & Sign Fascia
    const pharmFascia = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.5, 5.1), mats.pharmMint);
    pharmFascia.position.set(0, 3.4, 0);
    pharmGroup.add(pharmFascia);

    // 3D Green Cross Mounted on Roof & Facade
    const makeGreenCross = (x, y, z, rotY = 0) => {
      const g = new THREE.Group();
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.14), mats.pharmGreen);
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.14), mats.pharmGreen);
      g.add(p1, p2);
      g.position.set(x, y, z);
      g.rotation.y = rotY;
      return g;
    };
    pharmGroup.add(makeGreenCross(2.68, 2.6, 0, Math.PI / 2));
    pharmGroup.add(makeGreenCross(0, 4.2, 0, 0));

    // Transparent Glass Display with Medicine Boxes
    const pharmGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 3.6), mats.villaGlass);
    pharmGlass.position.set(2.64, 1.25, 0);
    pharmGroup.add(pharmGlass);

    // Shelves with colored medicine boxes
    for (let sy = 0.7; sy <= 2.0; sy += 0.4) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 3.2), mats.villaTrim);
      shelf.position.set(2.35, sy, 0);
      pharmGroup.add(shelf);
      for (let sz = -1.2; sz <= 1.2; sz += 0.55) {
        const medBox = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.18, 0.22),
          Math.random() > 0.5 ? mats.hospBlue : mats.hospRed
        );
        medBox.position.set(2.35, sy + 0.11, sz);
        pharmGroup.add(medBox);
      }
    }

    // ========================================================
    // 6. APEX AUTO & MOTORCYCLE SERVICE (BACK CORNER WORKSHOP)
    // ========================================================
    const autoGroup = new THREE.Group();
    autoGroup.position.set(0, 0, -13.6);
    diorama.add(autoGroup);

    // Main Workshop Garage Structure
    const autoBody = new THREE.Mesh(new THREE.BoxGeometry(12.4, 4.4, 5.6), mats.autoGray);
    autoBody.position.set(0, 2.3, 0);
    autoBody.castShadow = true;
    autoGroup.add(autoBody);

    // Dark Corrugated Roof
    const autoRoof = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.35, 6.0), mats.autoDark);
    autoRoof.position.set(0, 4.6, 0);
    autoGroup.add(autoRoof);

    // Red Marquee Sign: "Auto & Bike Service"
    const autoSign = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.85, 0.16), mats.autoRed);
    autoSign.position.set(0, 4.0, 2.85);
    autoGroup.add(autoSign);

    // 2 Open Service Bays
    const bay1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.0, 0.2), mats.autoDark);
    bay1.position.set(-3.2, 1.6, 2.8);
    const bay2 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.0, 0.2), mats.autoDark);
    bay2.position.set(3.2, 1.6, 2.8);
    autoGroup.add(bay1, bay2);

    // Bay 1: Hydraulic Car Lift raising vehicle
    const liftCol1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4), mats.metalPlate);
    liftCol1.position.set(-4.4, 1.25, 3.4);
    const liftCol2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4), mats.metalPlate);
    liftCol2.position.set(-2.0, 1.25, 3.4);
    const liftPlat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 3.0), mats.metalPlate);
    liftPlat.position.set(-3.2, 2.0, 3.4);
    const elevatedCar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 2.8), mats.carBlue);
    elevatedCar.position.set(-3.2, 2.5, 3.4);
    elevatedCar.castShadow = true;
    autoGroup.add(liftCol1, liftCol2, liftPlat, elevatedCar);

    // Bay 2: Motorcycle Tuning & Mechanic Workstation
    const bikeBench = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 1.6), mats.carRed);
    bikeBench.position.set(3.2, 0.6, 3.4);
    const bw1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1), mats.wheelRubber);
    bw1.rotation.z = Math.PI / 2;
    bw1.position.set(3.2, 0.24, 2.6);
    const bw2 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1), mats.wheelRubber);
    bw2.rotation.z = Math.PI / 2;
    bw2.position.set(3.2, 0.24, 4.2);
    autoGroup.add(bikeBench, bw1, bw2);

    // Master Mechanic Figure in Blue Overalls
    const mechTorso = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.2), mats.clothesNavy);
    mechTorso.position.set(2.2, 0.55, 3.4);
    const mechHead = new THREE.Mesh(new THREE.SphereGeometry(0.14), mats.skinTone);
    mechHead.position.set(2.2, 0.9, 3.4);
    autoGroup.add(mechTorso, mechHead);

    // Tire Stacks & Red Oil Barrels
    for (let ty = 0.25; ty <= 1.0; ty += 0.26) {
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.12, 8, 16), mats.wheelRubber);
      tire.rotation.x = Math.PI / 2;
      tire.position.set(5.0, ty, 3.6);
      autoGroup.add(tire);
    }
    const barrelRed = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.85, 16), mats.autoRed);
    barrelRed.position.set(0.6, 0.5, 3.4);
    const barrelYellow = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.85, 16), mats.autoYellow);
    barrelYellow.position.set(1.3, 0.5, 3.1);
    autoGroup.add(barrelRed, barrelYellow);

    // ========================================================
    // 7. BAZAAR & GROCERY SHOP (MIDDLE RIGHT PRODUCE MARKET)
    // ========================================================
    const bazaarGroup = new THREE.Group();
    bazaarGroup.position.set(12.6, 0, -6.5);
    diorama.add(bazaarGroup);

    // Market Pavilion Structure
    const marketBuilding = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.2, 7.2), mats.villaWall);
    marketBuilding.position.set(0, 1.7, 0);
    marketBuilding.castShadow = true;
    bazaarGroup.add(marketBuilding);

    // Striped Tiered Awnings (Green/White, Red/White, Blue/White)
    const makeAwning = (az, mat) => {
      const awn = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 2.2), mat);
      awn.position.set(-2.6, 2.4, az);
      awn.rotation.z = 0.26;
      bazaarGroup.add(awn);
    };
    makeAwning(-2.3, mats.awningGreen);
    makeAwning(0, mats.awningRed);
    makeAwning(2.3, mats.awningBlue);

    // Tiered Fruit & Vegetable Crates Outside
    const addFruitCrate = (cx, cz, fruitColor) => {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.28, 0.65), mats.crateWood);
      crate.position.set(cx, 0.42, cz);
      const fruits = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24), fruitColor);
      fruits.position.set(cx, 0.62, cz);
      bazaarGroup.add(crate, fruits);
    };
    addFruitCrate(-3.2, -2.6, mats.fruitOrange);
    addFruitCrate(-3.2, -1.7, mats.fruitRed);
    addFruitCrate(-3.2, -0.8, mats.fruitGreen);
    addFruitCrate(-3.2, 0.1, mats.fruitYellow);
    addFruitCrate(-3.2, 1.0, mats.fruitPurple);
    addFruitCrate(-3.2, 1.9, mats.fruitGreen);
    addFruitCrate(-3.2, 2.8, mats.fruitRed);

    // Shopper Figure Browsing Market
    const shopperGroup = new THREE.Group();
    const shopTorso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 0.2), mats.clothesYellow);
    shopTorso.position.y = 0.55;
    const shopHead = new THREE.Mesh(new THREE.SphereGeometry(0.14), mats.skinTone);
    shopHead.position.y = 0.9;
    shopperGroup.add(shopTorso, shopHead);
    shopperGroup.position.set(-4.0, 0.12, 0.2);
    bazaarGroup.add(shopperGroup);

    // ========================================================
    // 8. SMARTSPARKS LAUNDRY & CHAI STALL (FRONT RIGHT MIDDLE)
    // ========================================================
    const laundryGroup = new THREE.Group();
    laundryGroup.position.set(12.4, 0, 4.0);
    diorama.add(laundryGroup);

    // Modern Blue Laundromat
    const laundryBody = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.0, 3.8), mats.laundryCyan);
    laundryBody.position.set(0, 1.6, 0);
    laundryBody.castShadow = true;
    laundryGroup.add(laundryBody);

    // Front Glass Window with 3 Washing Machine Doors
    const laundryGlass = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 3.2), mats.villaGlass);
    laundryGlass.position.set(-2.26, 1.3, 0);
    laundryGroup.add(laundryGlass);

    for (let wz = -0.95; wz <= 0.95; wz += 0.95) {
      const washer = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 18), mats.metalPlate);
      washer.rotation.z = Math.PI / 2;
      washer.position.set(-2.28, 1.1, wz);
      laundryGroup.add(washer);
    }

    // Yellow Chai / Street Snack Kiosk
    const chaiKiosk = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.1, 2.0), mats.awningYellow);
    chaiKiosk.position.set(-0.6, 1.15, -2.8);
    chaiKiosk.castShadow = true;
    laundryGroup.add(chaiKiosk);

    // ========================================================
    // 9. THE TERRACE CAFE & RESTAURANT (FRONT RIGHT CORNER)
    // ========================================================
    const restGroup = new THREE.Group();
    restGroup.position.set(12.2, 0, 11.8);
    diorama.add(restGroup);

    // Terracotta Bistro Building
    const restBuilding = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.4, 4.6), mats.restTerracotta);
    restBuilding.position.set(0, 1.8, 0);
    restBuilding.castShadow = true;
    restGroup.add(restBuilding);

    // Green & White Striped Canopy
    const restCanopy = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 4.4), mats.awningGreen);
    restCanopy.position.set(-2.6, 2.4, 0);
    restCanopy.rotation.z = 0.24;
    restGroup.add(restCanopy);

    // Outdoor Dining Patio with 2 Tables, Umbrellas & Seated Customers
    const makeDinerTable = (tx, tz, umbrellaMat) => {
      const tableGroup = new THREE.Group();
      // Table
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.65), mats.villaFence);
      pole.position.set(tx, 0.42, tz);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 16), mats.villaTrim);
      top.position.set(tx, 0.75, tz);

      // Umbrella
      const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2), mats.villaTrim);
      uPole.position.set(tx, 1.2, tz);
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.6, 14), umbrellaMat);
      canopy.position.set(tx, 2.3, tz);

      // 2 Chairs
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.35), mats.villaFence);
      c1.position.set(tx - 0.6, 0.28, tz);
      const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.35), mats.villaFence);
      c2.position.set(tx + 0.6, 0.28, tz);

      // Seated Customer Figures
      const diner1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.2), mats.clothesRed);
      diner1.position.set(tx - 0.6, 0.55, tz);
      const dHead1 = new THREE.Mesh(new THREE.SphereGeometry(0.12), mats.skinTone);
      dHead1.position.set(tx - 0.6, 0.8, tz);

      const diner2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.2), mats.clothesGreen);
      diner2.position.set(tx + 0.6, 0.55, tz);
      const dHead2 = new THREE.Mesh(new THREE.SphereGeometry(0.12), mats.skinToneAlt);
      dHead2.position.set(tx + 0.6, 0.8, tz);

      tableGroup.add(pole, top, uPole, canopy, c1, c2, diner1, dHead1, diner2, dHead2);
      restGroup.add(tableGroup);
    };

    makeDinerTable(-3.6, -1.4, mats.awningGreen);
    makeDinerTable(-3.6, 1.4, mats.restTerracotta);

    // Stone Tiered Water Fountain
    const fountain = new THREE.Group();
    const fBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.35, 20), mats.plazaPave);
    fBase.position.y = 0.2;
    const fWater = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.36, 20), mats.fountainWater);
    fWater.position.y = 0.22;
    const fCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.8, 16), mats.villaTrim);
    fCenter.position.y = 0.6;
    fountain.add(fBase, fWater, fCenter);
    fountain.position.set(-1.4, 0.12, 3.2);
    restGroup.add(fountain);

    // ========================================================
    // 10. OVERHEAD UTILITY POLES & TELEPHONE WIRES (LIKE REFERENCE IMAGE!)
    // ========================================================
    const utilityGroup = new THREE.Group();
    diorama.add(utilityGroup);

    const polePositions = [
      [-10.8, -10.8],
      [10.8, -10.8],
      [10.8, 10.8],
      [-10.8, 10.8],
    ];

    const poleTops = [];

    polePositions.forEach(([px, pz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.4), mats.poleWood);
      pole.position.set(px, 2.2, pz);
      pole.castShadow = true;

      // Crossarm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), mats.poleWood);
      arm.position.set(px, 4.2, pz);
      utilityGroup.add(pole, arm);

      poleTops.push(new THREE.Vector3(px, 4.2, pz));
    });

    // Hanging Catenary Overhead Wires between utility poles
    for (let i = 0; i < poleTops.length; i++) {
      const p1 = poleTops[i];
      const p2 = poleTops[(i + 1) % poleTops.length];
      const mid = p1.clone().lerp(p2, 0.5);
      mid.y -= 0.35; // catenary sag

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const wireGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
      const wire = new THREE.Line(wireGeo, mats.wireMat);
      utilityGroup.add(wire);
    }

    // Modern Curved Streetlamps
    const makeStreetlamp = (lx, lz) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.8), mats.lampMetal);
      pole.position.set(lx, 1.9, lz);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.06), mats.lampMetal);
      arm.position.set(lx + 0.3, 3.75, lz);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16), mats.lampGlow);
      bulb.position.set(lx + 0.65, 3.65, lz);
      utilityGroup.add(pole, arm, bulb);
    };

    makeStreetlamp(-8.6, -8.6);
    makeStreetlamp(8.6, -8.6);
    makeStreetlamp(-8.6, 8.6);
    makeStreetlamp(8.6, 8.6);

    // ========================================================
    // 11. PUFFY STYLIZED CLAY TREES WITH WIND SWAY
    // ========================================================
    const natureGroup = new THREE.Group();
    diorama.add(natureGroup);

    const makePuffyClayTree = (tx, tz, scale = 1.0, leafMat = mats.leafMid) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14 * scale, 0.19 * scale, 1.4 * scale),
        mats.treeTrunk
      );
      trunk.position.y = 0.8 * scale;
      trunk.castShadow = true;

      // Multi-cluster puffy cloud foliage
      const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15 * scale), leafMat);
      f1.position.y = 1.7 * scale;
      f1.castShadow = true;
      const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9 * scale), mats.leafLight);
      f2.position.set(0.2 * scale, 2.4 * scale, 0);
      f2.castShadow = true;

      tree.add(trunk, f1, f2);
      tree.position.set(tx, 0.1, tz);
      natureGroup.add(tree);
      return tree;
    };

    const trees = [
      makePuffyClayTree(-15.0, 15.0, 1.35, mats.leafDark),
      makePuffyClayTree(-15.2, 0, 1.15, mats.leafMid),
      makePuffyClayTree(-15.0, -15.0, 1.4, mats.leafLight),
      makePuffyClayTree(15.0, -15.0, 1.35, mats.leafDark),
      makePuffyClayTree(15.2, 0, 1.25, mats.leafMid),
      makePuffyClayTree(15.0, 15.0, 1.4, mats.leafLight),
      makePuffyClayTree(-7.5, -15.2, 1.1, mats.leafDark),
      makePuffyClayTree(7.5, -15.2, 1.2, mats.leafMid),
      makePuffyClayTree(-15.2, -7.5, 1.15, mats.leafLight),
    ];
    animatedRefs.current.trees = trees;

    // ========================================================
    // 12. DYNAMIC TRAFFIC FLEET WITH ROLLING WHEELS (60 FPS CONTINUOUS)
    // ========================================================
    const vehicleGroup = new THREE.Group();
    diorama.add(vehicleGroup);

    // Car Factory: Sleek Clay Sedan
    const createSedan = (bodyMat) => {
      const car = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 2.6), bodyMat);
      body.position.y = 0.52;
      body.castShadow = true;

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.5, 1.5), mats.hospDark);
      cabin.position.set(0, 0.95, -0.15);

      const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 0.06), mats.villaGlass);
      windshield.position.set(0, 0.95, 0.62);
      windshield.rotation.x = -0.28;

      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.05), mats.headlightGlow);
      hl1.position.set(-0.46, 0.52, 1.31);
      const hl2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.05), mats.headlightGlow);
      hl2.position.set(0.46, 0.52, 1.31);

      const tl = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.05), mats.taillightGlow);
      tl.position.set(0, 0.52, -1.31);

      car.add(body, cabin, windshield, hl1, hl2, tl);

      const wheels = [];
      for (let wx of [-0.72, 0.72]) {
        for (let wz of [-0.75, 0.75]) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 16), mats.wheelRubber);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, 0.24, wz);
          const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.15, 8), mats.wheelHub);
          rim.rotation.z = Math.PI / 2;
          rim.position.set(wx, 0.24, wz);
          car.add(w, rim);
          wheels.push(w, rim);
        }
      }
      return { car, wheels };
    };

    // Auto-Rickshaw Factory: Authentic Bangladeshi CNG 3-Wheeler
    const createCNG = () => {
      const cng = new THREE.Group();
      const lower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 2.0), mats.cngGreen);
      lower.position.y = 0.42;
      lower.castShadow = true;

      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 1.3), mats.cngYellow);
      hood.position.set(0, 0.95, -0.25);

      const wind = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.45, 0.05), mats.hospDark);
      wind.position.set(0, 0.88, 0.65);
      wind.rotation.x = -0.32;
      cng.add(lower, hood, wind);

      const wheels = [];
      const fw = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 14), mats.wheelRubber);
      fw.rotation.z = Math.PI / 2;
      fw.position.set(0, 0.2, 0.8);
      const rw1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 14), mats.wheelRubber);
      rw1.rotation.z = Math.PI / 2;
      rw1.position.set(-0.62, 0.2, -0.6);
      const rw2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 14), mats.wheelRubber);
      rw2.rotation.z = Math.PI / 2;
      rw2.position.set(0.62, 0.2, -0.6);

      cng.add(fw, rw1, rw2);
      wheels.push(fw, rw1, rw2);
      return { car: cng, wheels };
    };

    // Delivery Motorbike Factory: Courier Rider with Helmet & Food Box
    const createDeliveryBike = (bikeMat) => {
      const bike = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 1.4), bikeMat);
      frame.position.y = 0.46;

      const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1), mats.wheelRubber);
      w1.rotation.z = Math.PI / 2;
      w1.position.set(0, 0.24, 0.6);
      const w2 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1), mats.wheelRubber);
      w2.rotation.z = Math.PI / 2;
      w2.position.set(0, 0.24, -0.6);

      const riderTorso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.48, 0.26), mats.clothesGreen);
      riderTorso.position.set(0, 0.86, 0);
      const riderHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.18), mats.hospRed);
      riderHelmet.position.set(0, 1.25, 0);

      // Courier delivery backpack box on rear rack
      const courierBag = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.38), mats.leafLight);
      courierBag.position.set(0, 0.9, -0.32);

      bike.add(frame, w1, w2, riderTorso, riderHelmet, courierBag);
      return { car: bike, wheels: [w1, w2] };
    };

    const redSedan = createSedan(mats.carRed);
    const blueSedan = createSedan(mats.carBlue);
    const yellowTaxi = createSedan(mats.carYellow);
    const cngVeh = createCNG();
    const deliveryBike1 = createDeliveryBike(mats.carRed);
    const deliveryBike2 = createDeliveryBike(mats.carBlue);

    const fleet = [
      { mesh: redSedan.car, wheels: redSedan.wheels, progress: 0.05, speed: 0.032 },
      { mesh: blueSedan.car, wheels: blueSedan.wheels, progress: 0.38, speed: 0.034 },
      { mesh: yellowTaxi.car, wheels: yellowTaxi.wheels, progress: 0.72, speed: 0.031 },
      { mesh: cngVeh.car, wheels: cngVeh.wheels, progress: 0.55, speed: 0.027 },
      { mesh: deliveryBike1.car, wheels: deliveryBike1.wheels, progress: 0.21, speed: 0.039 },
      { mesh: deliveryBike2.car, wheels: deliveryBike2.wheels, progress: 0.88, speed: 0.037 },
    ];

    fleet.forEach((v) => vehicleGroup.add(v.mesh));
    animatedRefs.current.fleet = fleet;

    // ========================================================
    // 13. ARTICULATED ANIMATED PEDESTRIANS WITH SCISSOR WALK GAIT
    // ========================================================
    const peopleGroup = new THREE.Group();
    diorama.add(peopleGroup);

    const makePedestrian = (shirtMat, pantsMat, pathX, pathZ, dirZ = 1, phase = 0) => {
      const person = new THREE.Group();

      // Articulated Legs
      const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.38), pantsMat);
      leg1.position.set(-0.08, 0.19, 0);
      const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.38), pantsMat);
      leg2.position.set(0.08, 0.19, 0);

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.2), shirtMat);
      torso.position.y = 0.52;
      torso.castShadow = true;

      // Articulated Arms
      const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.34), shirtMat);
      arm1.position.set(-0.19, 0.48, 0);
      const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.34), shirtMat);
      arm2.position.set(0.19, 0.48, 0);

      // Head & Hair
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.14), mats.skinTone);
      head.position.y = 0.82;
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.145), mats.hairDark);
      hair.position.set(0, 0.86, -0.02);

      person.add(leg1, leg2, torso, arm1, arm2, head, hair);
      person.position.set(pathX, 0.12, pathZ);
      peopleGroup.add(person);

      return { person, leg1, leg2, arm1, arm2, torso, baseX: pathX, baseZ: pathZ, dirZ, phase };
    };

    const walkers = [
      makePedestrian(mats.clothesBlue, mats.clothesDark, -3.8, 6.8, 1, 0),
      makePedestrian(mats.clothesRed, mats.clothesNavy, 3.8, 6.8, -1, 1.4),
      makePedestrian(mats.clothesGreen, mats.clothesDark, -10.5, 3.0, 1, 2.6),
      makePedestrian(mats.clothesYellow, mats.clothesNavy, -10.5, -3.0, -1, 0.9),
      makePedestrian(mats.clothesBlue, mats.clothesDark, 10.5, -3.0, 1, 3.2),
      makePedestrian(mats.clothesRed, mats.clothesNavy, 10.5, 3.0, -1, 1.8),
      makePedestrian(mats.clothesGreen, mats.clothesDark, 2.4, -10.5, 1, 0.6),
      makePedestrian(mats.clothesYellow, mats.clothesNavy, -2.4, -10.5, -1, 2.3),
    ];
    animatedRefs.current.walkers = walkers;

    // ========================================================
    // 14. FLOATING BOBBING PINS & BILLBOARDS MATCHING IMAGE
    // ========================================================
    const pinsGroup = new THREE.Group();
    diorama.add(pinsGroup);

    const pinObjects = [];

    LANDMARKS.forEach((lm) => {
      const pinObj = new THREE.Group();
      pinObj.position.set(lm.position[0], lm.position[1], lm.position[2]);

      // High-resolution canvas for crisp typography
      const canvas = document.createElement("canvas");
      canvas.width = 360;
      canvas.height = 96;
      const ctx = canvas.getContext("2d");

      // Draw rounded teardrop badge with border
      ctx.fillStyle = lm.pinBg;
      ctx.strokeStyle = lm.badgeColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(8, 8, 344, 80, 40);
      ctx.fill();
      ctx.stroke();

      // Text and Icon
      ctx.fillStyle = lm.pinText;
      ctx.font = "bold 28px Inter, system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${lm.icon} ${lm.name.slice(0, 16)}`, 180, 48);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;

      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(3.4, 0.9, 1);
      sprite.position.y = 0.7;
      pinObj.add(sprite);

      // Pin Needle
      const needle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.01, 0.65),
        new THREE.MeshBasicMaterial({ color: lm.badgeColor })
      );
      needle.position.y = 0.3;
      pinObj.add(needle);

      // Target Orb on the ground point
      const targetOrb = new THREE.Mesh(
        new THREE.SphereGeometry(0.12),
        new THREE.MeshBasicMaterial({ color: lm.badgeColor })
      );
      targetOrb.position.y = 0.06;
      pinObj.add(targetOrb);

      pinObj.userData = { landmark: lm, baseY: lm.position[1] };
      pinsGroup.add(pinObj);
      pinObjects.push(pinObj);
    });

    animatedRefs.current.pinObjects = pinObjects;

    // Raycaster for interactive pointer taps
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(pinsGroup.children, true);

      if (hits.length > 0) {
        let node = hits[0].object;
        while (node && !node.userData?.landmark && node.parent) {
          node = node.parent;
        }
        if (node?.userData?.landmark) {
          setActiveLandmark(node.userData.landmark);
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    // ========================================================
    // 15. CONTINUOUS 60 FPS ANIMATION LOOP
    // ========================================================
    let animId;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Controls update
      controls.update();

      // 1. Vehicles moving along boulevard with rotating wheels
      if (animatedRefs.current.fleet) {
        animatedRefs.current.fleet.forEach((v) => {
          v.progress = (v.progress + v.speed * delta) % 1;
          const { x, z, heading } = getRoadTrackPoint(v.progress);
          v.mesh.position.set(x, roadY, z);
          v.mesh.rotation.y = heading;

          // Rotate wheels
          if (v.wheels) {
            v.wheels.forEach((w) => {
              w.rotation.x += delta * 12;
            });
          }
        });
      }

      // 2. Floating Bobbing Pins
      if (animatedRefs.current.pinObjects) {
        animatedRefs.current.pinObjects.forEach((pin, i) => {
          const by = pin.userData.baseY;
          pin.position.y = by + Math.sin(time * 2.5 + i * 0.75) * 0.15;
        });
      }

      // 3. Ambulance Strobe Flashing
      if (animatedRefs.current.ambLight) {
        const isRed = Math.sin(time * 16) > 0;
        animatedRefs.current.ambLight.color.set(isRed ? "#ef4444" : "#3b82f6");
        animatedRefs.current.ambLight.intensity = isRed ? 2.8 : 1.0;
      }

      // 4. Articulated Walkers with Contralateral Arm & Leg Swings + Torso Bounce
      if (animatedRefs.current.walkers) {
        animatedRefs.current.walkers.forEach((w) => {
          const walkPhase = Math.sin(time * 7 + w.phase);
          // Scissor legs
          w.leg1.rotation.x = walkPhase * 0.55;
          w.leg2.rotation.x = -walkPhase * 0.55;
          // Contralateral arm swing (opposite to leg)
          w.arm1.rotation.x = -walkPhase * 0.5;
          w.arm2.rotation.x = walkPhase * 0.5;
          // Torso bounce
          w.torso.position.y = 0.52 + Math.abs(Math.sin(time * 7 + w.phase)) * 0.04;
          // Sidewalk movement
          w.person.position.z = w.baseZ + Math.sin(time * 0.7 + w.phase) * 0.8 * w.dirZ;
        });
      }

      // 5. Trees Wind Sway
      if (animatedRefs.current.trees) {
        animatedRefs.current.trees.forEach((tree, idx) => {
          tree.rotation.z = Math.sin(time * 1.5 + idx) * 0.02;
        });
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    // Window Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Time of Day Transitions (Daylight, Sunset, Night)
  useEffect(() => {
    const lights = lightsRef.current;
    const scene = sceneRef.current;
    if (!lights || !scene) return;

    if (timeOfDay === "day") {
      scene.background.set("#F8F9FA");
      lights.ambientLight?.color.set("#fff8ee");
      lights.ambientLight.intensity = 1.35;
      lights.dirLight?.color.set("#fff3dd");
      lights.dirLight.intensity = 2.3;
      lights.fillLight?.color.set("#bfdbfe");
      lights.fillLight.intensity = 0.85;
    } else if (timeOfDay === "sunset") {
      scene.background.set("#fef2f2");
      lights.ambientLight?.color.set("#fed7aa");
      lights.ambientLight.intensity = 1.5;
      lights.dirLight?.color.set("#ea580c");
      lights.dirLight.intensity = 2.8;
      lights.fillLight?.color.set("#c084fc");
      lights.fillLight.intensity = 1.1;
    } else if (timeOfDay === "night") {
      scene.background.set("#090d16");
      lights.ambientLight?.color.set("#1e1b4b");
      lights.ambientLight.intensity = 0.65;
      lights.dirLight?.color.set("#38bdf8");
      lights.dirLight.intensity = 0.95;
      lights.fillLight?.color.set("#6366f1");
      lights.fillLight.intensity = 0.55;
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
      cameraRef.current.position.set(31, 24, 31);
      controlsRef.current.target.set(0, 1.6, 0);
      controlsRef.current.update();
      setAutoRotate(true);
    }
  }, []);

  return (
    <div
      className={`relative select-none transition-all duration-300 ${isFullscreen
        ? "fixed inset-0 z-50 h-screen w-screen bg-[#F8F9FA] p-4 sm:p-6"
        : "mx-auto h-[540px] w-full max-w-[700px] sm:h-[600px] lg:h-[640px]"
        }`}
    >
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className={`h-full w-full overflow-hidden bg-[#F8F9FA] ring-1 ring-forest/10 cursor-grab active:cursor-grabbing transition-colors duration-500 shadow-2xl ${isFullscreen ? "rounded-[32px]" : "rounded-[36px]"
          }`}
      />

      {/* Top Left Status Pill */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-forest/10 bg-white/92 px-3.5 py-1.5 shadow-sm backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-extrabold text-forest tracking-tight">
          3D Neighborhood Diorama · Live
        </span>
      </div>

      {/* Top Right Controls (Day / Sunset / Night & Fullscreen) */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5">
        <div className="flex items-center gap-1 rounded-full border border-forest/10 bg-white/92 p-1 shadow-sm backdrop-blur-md">
          <button
            type="button"
            onClick={() => setTimeOfDay("day")}
            className={`grid h-7 w-7 place-items-center rounded-full transition ${timeOfDay === "day"
              ? "bg-amber-100 text-amber-900 shadow-xs font-bold"
              : "text-slate-500 hover:text-slate-800"
              }`}
            title="Sunny Daylight"
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
            title="Golden Sunset"
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

        {/* Fullscreen Expansion Button */}
        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          className="grid h-9 w-9 place-items-center rounded-full border border-forest/15 bg-white/92 text-forest shadow-sm backdrop-blur-md transition hover:bg-forest hover:text-white"
          title={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      {/* Bottom Control Dock */}
      <div className="absolute bottom-4 inset-x-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition shadow-sm backdrop-blur-md ${autoRotate
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
            className="inline-flex items-center gap-1 rounded-full border border-forest/15 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-forest shadow-sm backdrop-blur-md transition hover:bg-forest hover:text-white"
          >
            <Compass size={13} /> Reset View
          </button>
        </div>

        <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-forest/80 backdrop-blur-md shadow-xs hidden sm:inline-block">
          🔍 Scroll to Zoom · Drag to Rotate
        </span>
      </div>

      {/* Interactive Landmark Details Modal Card */}
      {activeLandmark && (
        <div className="absolute inset-x-4 bottom-14 z-20 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="rounded-[28px] border border-forest/20 bg-white/98 p-5 shadow-2xl backdrop-blur-xl ring-1 ring-black/5">
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
          <div className="animate-bounce rounded-full border border-forest/15 bg-white/92 px-4 py-2 text-xs font-semibold text-forest shadow-xl backdrop-blur-md">
            ✦ Drag to explore full neighborhood · Scroll to zoom
          </div>
        </div>
      )}
    </div>
  );
}
