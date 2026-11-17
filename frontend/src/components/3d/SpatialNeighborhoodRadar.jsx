import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  MapPin,
  Store,
  Navigation,
  ArrowRight,
  Filter,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const DEMO_SPOTS = [
  {
    id: "spot-1",
    name: "Artisan Sourdough & Patisserie",
    category: "Food & Drink",
    icon: "🥐",
    x: 28,
    y: 35,
    distance: "320m",
    rating: "4.9",
    tag: "Open Now",
    color: "#f59e0b",
    desc: "Warm loaves, baguettes, and organic pastries baked hourly.",
  },
  {
    id: "spot-2",
    name: "Green Flora Botanical Bar",
    category: "Health & Beauty",
    icon: "🌿",
    x: 68,
    y: 25,
    distance: "480m",
    rating: "4.8",
    tag: "Trending",
    color: "#10b981",
    desc: "Ethical skincare, cold-pressed oils, and indoor plants.",
  },
  {
    id: "spot-3",
    name: "Master Cobbler & Leatherworks",
    category: "Services",
    icon: "🔧",
    x: 75,
    y: 65,
    distance: "820m",
    rating: "5.0",
    tag: "Expert Hand",
    color: "#0284c7",
    desc: "Bespoke leather restoration, bag repair, and custom straps.",
  },
  {
    id: "spot-4",
    name: "The Corner Craft Guild",
    category: "Arts & Gifts",
    icon: "🎨",
    x: 32,
    y: 72,
    distance: "650m",
    rating: "4.9",
    tag: "Community",
    color: "#8b5cf6",
    desc: "Handmade ceramic mugs, woven tapestries, and neighbor art.",
  },
  {
    id: "spot-5",
    name: "Paws & Whiskers Wellness",
    category: "Pets & Family",
    icon: "🐾",
    x: 52,
    y: 84,
    distance: "1.1km",
    rating: "4.7",
    tag: "Loved by Pets",
    color: "#ec4899",
    desc: "Natural pet treats, gentle grooming, and organic accessories.",
  },
];

const CATEGORIES = ["All", "Food & Drink", "Health & Beauty", "Services", "Arts & Gifts", "Pets & Family"];

export default function SpatialNeighborhoodRadar() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedSpot, setSelectedSpot] = useState(DEMO_SPOTS[0]);
  const [radarPitch, setRadarPitch] = useState(48); // 3D isometric pitch angle in degrees

  const filteredSpots =
    activeCategory === "All"
      ? DEMO_SPOTS
      : DEMO_SPOTS.filter((s) => s.category === activeCategory);

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-forest/15 bg-gradient-to-b from-[#19362b] to-[#0f221b] p-5 text-white shadow-2xl sm:rounded-[36px] sm:p-10">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-lime/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3.5 py-1.5 text-xs font-bold text-lime backdrop-blur-md">
            <Compass size={14} className="animate-spin text-lime" style={{ animationDuration: "12s" }} />
            <span>3D Neighborhood Radar</span>
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-4xl">
            Explore your perimeter in 3D.
          </h2>
          <p className="mt-2 text-xs text-emerald-100/70 sm:text-sm">
            Real local spots mapped in real-time space right around you.
          </p>
        </div>

        {/* 3D Isometric View Angle Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-emerald-200/60">3D Pitch:</span>
          <button
            type="button"
            onClick={() => setRadarPitch(radarPitch === 52 ? 0 : 52)}
            className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
          >
            <Layers size={13} className="text-lime" />
            <span>{radarPitch === 0 ? "Switch to 3D" : "Switch to 2D Plan"}</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="relative z-10 mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              activeCategory === cat
                ? "bg-lime text-forest shadow-md"
                : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3D Spatial Grid & Detail Drawer */}
      <div className="relative z-10 mt-8 grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* 3D Interactive Spatial Radar Canvas (7 cols) */}
        <div className="relative mx-auto aspect-square w-full max-w-[500px] overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-4 shadow-inner lg:col-span-7">
          {/* 3D Perspective Wrapper */}
          <div
            className="relative h-full w-full transition-transform duration-700 ease-out"
            style={{
              transform: `perspective(900px) rotateX(${radarPitch}deg) rotateZ(-12deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Concentric radar range rings */}
            <div className="absolute inset-[15%] rounded-full border border-dashed border-emerald-500/30 animate-pulse" />
            <div className="absolute inset-[30%] rounded-full border border-emerald-500/20" />
            <div className="absolute inset-[45%] rounded-full border border-emerald-500/25" />

            {/* Crosshair coordinate axes */}
            <div className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-emerald-500/20" />
            <div className="absolute left-0 top-1/2 h-[1px] w-full -translate-y-1/2 bg-emerald-500/20" />

            {/* Radar Sweeping Beam */}
            <div
              className="pointer-events-none absolute inset-0 origin-center animate-spin rounded-full"
              style={{
                animationDuration: "8s",
                background:
                  "conic-gradient(from 0deg, transparent 0deg, rgba(210, 243, 107, 0.25) 45deg, transparent 55deg)",
              }}
            />

            {/* Center: "You Are Here" Marker */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ transform: "translateZ(30px)" }}
            >
              <div className="relative flex h-8 w-8 items-center justify-center">
                <div className="absolute h-8 w-8 animate-ping rounded-full bg-lime/40" />
                <div className="relative grid h-6 w-6 place-items-center rounded-full bg-lime text-[11px] font-black text-forest shadow-lg">
                  📍
                </div>
              </div>
            </div>

            {/* Placed Interactive 3D Nodes */}
            {filteredSpots.map((spot) => {
              const isSelected = selectedSpot?.id === spot.id;
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => setSelectedSpot(spot)}
                  className="group absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    transform: `translateZ(${isSelected ? 50 : 25}px) scale(${
                      isSelected ? 1.2 : 1
                    })`,
                  }}
                  title={spot.name}
                >
                  <div className="relative flex flex-col items-center">
                    {/* Pulsing ring under spot */}
                    <div
                      className={`h-10 w-10 rounded-full border transition duration-300 ${
                        isSelected
                          ? "scale-125 border-lime bg-lime/30"
                          : "border-white/40 bg-white/10 group-hover:scale-110"
                      }`}
                    />

                    {/* Spot 3D Icon Pin */}
                    <div
                      className="absolute top-1 grid h-8 w-8 place-items-center rounded-full shadow-xl transition"
                      style={{
                        backgroundColor: spot.color,
                        boxShadow: `0 8px 20px ${spot.color}55`,
                      }}
                    >
                      <span className="text-sm">{spot.icon}</span>
                    </div>

                    {/* Distance tooltip */}
                    <span
                      className={`mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-extrabold backdrop-blur-md transition ${
                        isSelected
                          ? "bg-lime text-forest shadow-md"
                          : "bg-black/70 text-white/90 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {spot.distance}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive touch badge */}
          <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] font-semibold text-emerald-200/60">
            ✦ Radar radius: 2.0 km · Tap nodes to focus
          </div>
        </div>

        {/* Selected Shop Preview Panel (5 cols) */}
        <div className="flex flex-col rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl lg:col-span-5 sm:p-8">
          {selectedSpot ? (
            <>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-lime/20 px-3 py-1 text-xs font-bold text-lime">
                  {selectedSpot.tag}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  ★ {selectedSpot.rating}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl text-2xl shadow-lg"
                  style={{ backgroundColor: `${selectedSpot.color}33` }}
                >
                  {selectedSpot.icon}
                </span>
                <div>
                  <h3 className="text-xl font-black text-white sm:text-2xl">
                    {selectedSpot.name}
                  </h3>
                  <p className="text-xs text-emerald-200/80">
                    {selectedSpot.category} · {selectedSpot.distance}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-emerald-100/80">
                {selectedSpot.desc}
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-emerald-200">
                  <Navigation size={12} className="text-lime" />
                  Direct navigation ready
                </span>
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-emerald-200">
                  <CheckCircle2 size={12} className="text-lime" />
                  Verified local business
                </span>
              </div>

              <div className="mt-8 flex items-center gap-3 pt-4">
                <Link
                  to={`/shops?q=${encodeURIComponent(selectedSpot.name)}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-lime py-3 text-sm font-extrabold text-forest shadow-lg shadow-lime/20 transition hover:bg-lime/90"
                >
                  <span>Visit Shop</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/shops"
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  All Shops
                </Link>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-emerald-200/60">
              <Compass className="mx-auto text-lime" size={32} />
              <p className="mt-2 text-sm font-bold text-white">Select a landmark</p>
              <p className="text-xs">Tap any marker on the 3D radar grid to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
