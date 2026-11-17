import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Link } from "react-router-dom";
import {
  Rotate3d,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
} from "lucide-react";
import { formatCurrency } from "../../utils/currency";

const DEMO_PRODUCTS = [
  {
    id: "mug",
    name: "Hand-thrown Clay Tumbler",
    category: "Home & Lifestyle",
    maker: "Pottery & Clay Co.",
    rating: 4.9,
    price: 650,
    discountPrice: 550,
    desc: "Locally sourced red clay, fired twice with a matte raw stone finish. Heat-retaining and dishwasher safe.",
    colors: [
      { name: "Terracotta", hex: "#c2410c", threeColor: 0xc2410c },
      { name: "Forest Glaze", hex: "#166534", threeColor: 0x166534 },
      { name: "Natural Sand", hex: "#d6d3d1", threeColor: 0xd6d3d1 },
    ],
    features: ["Handcrafted in Dhaka", "Food-safe Non-toxic Glaze", "350ml capacity"],
  },
  {
    id: "speaker",
    name: "Aura Sound Wooden Pod",
    category: "Electronics",
    maker: "Nordic Sound Studio",
    rating: 5.0,
    price: 3400,
    discountPrice: 2950,
    desc: "Sustainably harvested teak wood acoustic chamber with rich bass resonance and 18-hour battery.",
    colors: [
      { name: "Teak Brown", hex: "#854d0e", threeColor: 0x854d0e },
      { name: "Midnight Ash", hex: "#1f2937", threeColor: 0x1f2937 },
      { name: "Local Lime", hex: "#d2f36b", threeColor: 0x84cc16 },
    ],
    features: ["Bluetooth 5.3", "True Teak Housing", "USB-C Fast Charge"],
  },
  {
    id: "lamp",
    name: "Lumina Studio Angle Lamp",
    category: "Home Decor",
    maker: "Urban Arc Designs",
    rating: 4.8,
    price: 2100,
    discountPrice: 1850,
    desc: "Solid brass joints with matte powder-coated steel shade. Casts a warm 2700K reading glow.",
    colors: [
      { name: "Sage Mist", hex: "#3f6212", threeColor: 0x3f6212 },
      { name: "Matte Black", hex: "#111827", threeColor: 0x111827 },
      { name: "Cream White", hex: "#fef3c7", threeColor: 0xfef3c7 },
    ],
    features: ["Dimmable Touch Sensor", "Solid Oak Base", "Anti-glare Lens"],
  },
];

export default function Product3DPedestal() {
  const mountRef = useRef(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const product = DEMO_PRODUCTS[selectedProductIndex];
  const activeColor = product.colors[selectedColorIndex];

  const sceneRef = useRef(null);
  const currentMeshRef = useRef(null);
  const currentColorHexRef = useRef(activeColor.threeColor);

  useEffect(() => {
    currentColorHexRef.current = activeColor.threeColor;
    if (currentMeshRef.current && currentMeshRef.current.userData.updateColor) {
      currentMeshRef.current.userData.updateColor(activeColor.threeColor);
    }
  }, [activeColor]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.8, 5.0);
    camera.lookAt(0, 0.2, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    mainLight.position.set(4, 6, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0xd2f36b, 1.4);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Stage / Pedestal Group
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // Cylinder Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(2.0, 2.2, 0.45, 36);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a2f,
      roughness: 0.3,
      metalness: 0.4,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.8;
    pedestal.receiveShadow = true;
    stageGroup.add(pedestal);

    // Glowing Neon Ring on Pedestal rim
    const ringGeo = new THREE.TorusGeometry(2.02, 0.03, 16, 40);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd2f36b });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.58;
    stageGroup.add(ringMesh);

    // Shadow catcher / floor grid
    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.03;
    floor.receiveShadow = true;
    scene.add(floor);

    // Product Group (Rotating)
    const productRoot = new THREE.Group();
    productRoot.position.y = 0.05;
    scene.add(productRoot);

    // Function to build 3D mesh depending on chosen product
    const buildProductModel = (type, colorHex) => {
      // Clear previous
      while (productRoot.children.length > 0) {
        productRoot.remove(productRoot.children[0]);
      }

      const pGroup = new THREE.Group();

      if (type === "mug") {
        // Ceramic Mug
        const mugMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.35,
          metalness: 0.1,
        });

        // Body
        const mugGeo = new THREE.CylinderGeometry(0.7, 0.6, 1.4, 28);
        const mugMesh = new THREE.Mesh(mugGeo, mugMat);
        mugMesh.castShadow = true;
        pGroup.add(mugMesh);

        // Inner rim hollow
        const rimGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.08, 28);
        const innerMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.5 });
        const rim = new THREE.Mesh(rimGeo, innerMat);
        rim.position.y = 0.71;
        pGroup.add(rim);

        // Handle
        const handleGeo = new THREE.TorusGeometry(0.42, 0.1, 16, 24, Math.PI);
        const handle = new THREE.Mesh(handleGeo, mugMat);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0.72, 0, 0);
        handle.castShadow = true;
        pGroup.add(handle);

        pGroup.userData.updateColor = (hex) => {
          mugMat.color.setHex(hex);
        };
      } else if (type === "speaker") {
        // Acoustic Wooden Speaker Pod
        const woodMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.6,
          metalness: 0.05,
        });
        const metalRingMat = new THREE.MeshStandardMaterial({
          color: 0xd2f36b,
          roughness: 0.2,
          metalness: 0.9,
        });

        // Main pod
        const podGeo = new THREE.CylinderGeometry(0.75, 0.75, 1.3, 32);
        const pod = new THREE.Mesh(podGeo, woodMat);
        pod.castShadow = true;
        pGroup.add(pod);

        // Speaker mesh grille
        const grilleGeo = new THREE.CylinderGeometry(0.76, 0.76, 0.8, 32, 1, true);
        const grilleMat = new THREE.MeshStandardMaterial({
          color: 0x18181b,
          wireframe: true,
          wireframeLinewidth: 2,
        });
        const grille = new THREE.Mesh(grilleGeo, grilleMat);
        pGroup.add(grille);

        // Top accent ring
        const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.04, 16, 32), metalRingMat);
        topRing.rotation.x = Math.PI / 2;
        topRing.position.y = 0.65;
        pGroup.add(topRing);

        pGroup.userData.updateColor = (hex) => {
          woodMat.color.setHex(hex);
        };
      } else if (type === "lamp") {
        // Desk Angle Lamp
        const shadeMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.3,
          metalness: 0.2,
        });
        const brassMat = new THREE.MeshStandardMaterial({
          color: 0xeab308,
          roughness: 0.25,
          metalness: 0.85,
        });

        // Base
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.12, 24), shadeMat);
        base.position.y = -0.5;
        base.castShadow = true;
        pGroup.add(base);

        // Stem 1
        const stem1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8), brassMat);
        stem1.position.set(-0.25, 0.0, 0);
        stem1.rotation.z = -0.3;
        stem1.castShadow = true;
        pGroup.add(stem1);

        // Stem 2
        const stem2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), brassMat);
        stem2.position.set(0.1, 0.7, 0);
        stem2.rotation.z = 0.55;
        stem2.castShadow = true;
        pGroup.add(stem2);

        // Shade cone
        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.6, 20), shadeMat);
        shade.position.set(0.45, 0.95, 0);
        shade.rotation.z = -1.2;
        shade.castShadow = true;
        pGroup.add(shade);

        // Actual bulb glow
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
        bulb.position.set(0.45, 0.95, 0);
        pGroup.add(bulb);

        pGroup.userData.updateColor = (hex) => {
          shadeMat.color.setHex(hex);
        };
      }

      productRoot.add(pGroup);
      currentMeshRef.current = pGroup;
    };

    buildProductModel(product.id, activeColor.threeColor);

    // Interactive Drag to Rotate
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotY = 0;
    let rotX = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - prevX;
        const deltaY = e.clientY - prevY;
        rotY += deltaX * 0.012;
        rotX += deltaY * 0.008;
        rotX = Math.max(-0.4, Math.min(0.4, rotX));
        prevX = e.clientX;
        prevY = e.clientY;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    // Touch support for mobile
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - prevX;
        const deltaY = e.touches[0].clientY - prevY;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          rotY += deltaX * 0.012;
          rotX += deltaY * 0.006;
          rotX = Math.max(-0.4, Math.min(0.4, rotX));
        }
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (!isDragging) {
        rotY += 0.008;
      }

      productRoot.rotation.y += (rotY - productRoot.rotation.y) * 0.1;
      productRoot.rotation.x += (rotX - productRoot.rotation.x) * 0.1;
      // Gentle floating levitation
      productRoot.position.y = 0.05 + Math.sin(elapsed * 2) * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
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
      scene.clear();
    };
  }, [selectedProductIndex]);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-forest/15 bg-white shadow-xl sm:rounded-[36px]">
      <div className="grid items-center gap-6 p-4 sm:gap-8 sm:p-6 lg:grid-cols-12 lg:p-10">
        {/* 3D Holo-Pedestal Interactive Canvas (7 cols on desktop) */}
        <div className="relative mx-auto flex w-full max-w-[500px] flex-col items-center justify-center lg:col-span-7">
          <div
            ref={mountRef}
            className="relative aspect-square w-full cursor-grab overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-950/5 via-cream/80 to-emerald-950/10 active:cursor-grabbing"
            style={{ touchAction: "pan-y" }}
          />

          {/* 3D Interaction Badge */}
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-forest/10 bg-white/90 px-3 py-1 text-xs font-bold text-forest shadow-sm backdrop-blur-md">
            <Rotate3d size={14} className="text-emerald-600" />
            <span>360° Real-time 3D View</span>
          </div>

          {/* Product Selector Carousel Pills */}
          <div className="mt-4 flex w-full justify-center gap-2">
            {DEMO_PRODUCTS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedProductIndex(idx);
                  setSelectedColorIndex(0);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition sm:px-4 ${
                  selectedProductIndex === idx
                    ? "bg-forest text-lime shadow-md"
                    : "border border-forest/15 bg-white text-slate-600 hover:bg-cream"
                }`}
              >
                {item.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Product Details & Customization (5 cols on desktop) */}
        <div className="flex flex-col lg:col-span-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <Sparkles size={14} />
            <span>Handmade in your area</span>
          </div>

          <h3 className="mt-2 text-2xl font-black text-forest sm:text-3xl">
            {product.name}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span>By <strong className="text-forest">{product.maker}</strong></span>
            <span>·</span>
            <span className="font-bold text-amber-500">★ {product.rating}</span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {product.desc}
          </p>

          {/* Real-time Color Finishes */}
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select 3D Finish: <span className="text-forest">{activeColor.name}</span>
            </p>
            <div className="mt-2.5 flex items-center gap-2.5">
              {product.colors.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColorIndex(i)}
                  className={`grid h-8 w-8 place-items-center rounded-full border-2 transition ${
                    selectedColorIndex === i
                      ? "scale-110 border-forest shadow-md"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {selectedColorIndex === i && (
                    <Check size={14} className={i === 2 ? "text-forest" : "text-white"} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Specs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {product.features.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 rounded-full border border-forest/10 bg-cream px-2.5 py-1 text-[11px] font-semibold text-forest"
              >
                <ShieldCheck size={12} className="text-emerald-700" />
                {f}
              </span>
            ))}
          </div>

          {/* Price & Action */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <div>
              <p className="text-xs text-slate-500">Neighborhood Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-forest sm:text-3xl">
                  {formatCurrency(product.discountPrice)}
                </span>
                {product.price > product.discountPrice && (
                  <span className="text-xs text-slate-400 line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-bold text-white shadow-lg shadow-forest/20 transition hover:bg-forest/90"
            >
              <ShoppingBag size={16} className="text-lime" />
              <span>Shop All</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
