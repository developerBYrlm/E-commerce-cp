import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Compass,
  Heart,
  MapPin,
  MessageSquare,
  MoveUpRight,
  Package,
  Rotate3d,
  Sparkles,
  Star,
  Store,
  Users,
  WandSparkles,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import SearchBar from "../components/SearchBar";
import ShopCard from "../components/ShopCard";
import { CardSkeleton } from "../components/Loader";
import { useCollection } from "../hooks/useApi";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";
import { getImageUrl } from "../utils/imageUrl";
import Hero3DIsland from "../components/3d/Hero3DIsland";
import DiscountDealsShowcase from "../components/DiscountDealsShowcase";
import ServiceDealsShowcase from "../components/ServiceDealsShowcase";
import SpatialNeighborhoodRadar from "../components/3d/SpatialNeighborhoodRadar";
import Card3DTilt from "../components/3d/Card3DTilt";
import Background3DParticles from "../components/3d/Background3DParticles";

const CATEGORIES_DATA = [
  {
    id: "food-drink",
    icon: "🥐",
    title: "Food & drink",
    count: "Freshly made nearby",
    color: "from-amber-500/20 to-orange-500/10",
    glowColor: "border-amber-300 shadow-amber-500/10",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-200",
    keywords: [
      "Food", "Grocery", "Restaurant", "Cafe", "Super Shop", "Bakery",
      "Sweets", "Snacks", "Medicine", "Pharmacy", "Beverage", "Cooking",
      "Organic Food", "Catering", "Breakfast", "Fast Food",
      "Pizza", "Burger", "Shawarma", "Sharma", "Sandwich", "Pasta", "French Fries",
      "Fried Chicken", "Chicken Roll", "Biryani", "Kacchi Biryani", "Grill Chicken",
      "Kebab", "Cake", "Pastry", "Coffee", "Tea", "Juice", "Milkshake", "Cold Drinks"
    ],
    matcher: (item) => {
      const text = [
        item.name,
        item.description,
        item.category?.name,
        ...(item.keywords || []),
        ...(item.categories?.map((c) => c.name || c) || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchWords = [
        "food", "drink", "grocery", "restaurant", "cafe", "bakery", "sweet",
        "snack", "beverage", "super shop", "cooking", "catering", "burger",
        "pizza", "shawarma", "sharma", "sandwich", "pasta", "fries", "fried chicken",
        "roll", "biryani", "kacchi", "grill", "kebab", "tea", "coffee", "juice",
        "cake", "pastry", "donut", "misti", "shake", "fruit", "vegetable", "meat", "fish", "rice",
        "medicine", "pharmacy"
      ];
      return matchWords.some((w) => text.includes(w));
    },
  },
  {
    id: "health-beauty",
    icon: "🌿",
    title: "Health & beauty",
    count: "Care close to home",
    color: "from-emerald-500/20 to-lime-500/10",
    glowColor: "border-emerald-300 shadow-emerald-500/10",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200",
    keywords: [
      "Health & Beauty", "Medicine", "Pharmacy", "Healthcare", "Doctor Appointment",
      "First Aid", "Vitamins", "Supplements", "Pain Relief", "Gastric Medicine",
      "Cough Syrup", "Cold & Flu", "Antiseptic", "Oral Saline", "Diabetes Care",
      "Blood Pressure Monitor", "Thermometer", "Nebulizer", "Surgical Mask",
      "Medical Equipment", "Herbal Medicine", "Eye Drops", "Inhaler", "Baby Healthcare",
      "Home Nursing", "Physiotherapy", "Diagnostic Test", "Ambulance Service",
      "Beauty", "Cosmetics", "Beauty Salon", "Hair Cutting", "Spa", "Skincare",
      "Fitness", "Yoga", "Personal Care", "Dental", "Herbal", "Wellness"
    ],
    matcher: (item) => {
      const text = [
        item.name,
        item.description,
        item.category?.name,
        ...(item.keywords || []),
        ...(item.categories?.map((c) => c.name || c) || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchWords = [
        "health", "beauty", "cosmetic", "medicine", "pharmacy", "doctor",
        "clinic", "salon", "hair", "spa", "skincare", "fitness", "gym", "yoga",
        "wellness", "parlor", "massage", "dental", "care", "vitamin", "saline",
        "first aid", "supplement", "fever", "cough", "gastric", "relief", "antiseptic",
        "bandage", "mask", "inhaler", "nursing", "physio", "ambulance", "diagnostic"
      ];
      return matchWords.some((w) => text.includes(w));
    },
  },
  {
    id: "home-lifestyle",
    icon: "🧵",
    title: "Home & lifestyle",
    count: "Thoughtful local finds",
    color: "from-teal-500/20 to-emerald-500/10",
    glowColor: "border-teal-300 shadow-teal-500/10",
    badgeColor: "bg-teal-100 text-teal-900 border-teal-200",
    keywords: [
      "Furniture", "Home Decor", "Table", "Bed", "Chair", "Sofa",
      "Fashion", "Clothing", "Shoes", "Watch", "Accessories", "Dress",
      "Mens Dress", "Fabrics", "Wardrobe", "Home Appliances", "Bedding", "Interior"
    ],
    matcher: (item) => {
      const text = [
        item.name,
        item.description,
        item.category?.name,
        ...(item.keywords || []),
        ...(item.categories?.map((c) => c.name || c) || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchWords = [
        "furniture", "home decor", "table", "bed", "chair", "sofa", "fashion",
        "clothing", "cloth", "dress", "shirt", "pant", "shoe", "watch", "lifestyle",
        "wardrobe", "curtain", "appliance", "interior", "decor", "fabric"
      ];
      return matchWords.some((w) => text.includes(w));
    },
  },
  {
    id: "services",
    icon: "🔧",
    title: "Services",
    count: "A little help, nearby",
    color: "from-sky-500/20 to-blue-500/10",
    glowColor: "border-sky-300 shadow-sky-500/10",
    badgeColor: "bg-sky-100 text-sky-900 border-sky-200",
    keywords: [
      "Repair Services", "Electrician", "Plumbing", "AC Repair", "Refrigerator Repair",
      "Electronics Repair", "TV Repair", "Mobile Repair", "Phone Repair", "Computer Repair",
      "Laptop Repair", "Home Cleaning", "Car Repair", "Car Wash", "Auto Service",
      "Laundry", "Carpentry", "Maintenance", "Handyman", "Painter", "Freelance Services"
    ],
    matcher: (item) => {
      if (item.shopType === "service" || item.durationMinutes !== undefined || item.bookingCount !== undefined) {
        return true;
      }
      const text = [
        item.name,
        item.description,
        item.category?.name,
        ...(item.keywords || []),
        ...(item.categories?.map((c) => c.name || c) || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchWords = [
        "repair", "electric", "plumb", "ac", "refrigerator", "fridge", "tv",
        "mobile", "phone", "computer", "laptop", "cleaning", "wash", "car",
        "service", "laundry", "carpenter", "maintenance", "fix", "handyman", "technician"
      ];
      return matchWords.some((w) => text.includes(w));
    },
  },
  {
    id: "arts-gifts",
    icon: "🎨",
    title: "Arts & gifts",
    count: "Made around the corner",
    color: "from-purple-500/20 to-pink-500/10",
    glowColor: "border-purple-300 shadow-purple-500/10",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-200",
    keywords: [
      "Photography", "Graphic Design", "Handicrafts", "Handmade", "Pottery",
      "Painting", "Artwork", "Jewelry", "Flowers", "Gift Shop", "Stationery",
      "Books & Stationery", "Bookstore", "Library", "Book Shop", "Books", "Notebook",
      "Custom Crafts", "Tailoring", "Printing", "Decoration", "Art"
    ],
    matcher: (item) => {
      const text = [
        item.name,
        item.description,
        item.category?.name,
        ...(item.keywords || []),
        ...(item.categories?.map((c) => c.name || c) || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchWords = [
        "art", "gift", "photo", "craft", "handmade", "pottery", "paint",
        "jewel", "flower", "stationery", "design", "print", "tailor", "decor",
        "book", "library", "novel", "textbook", "notebook"
      ];
      return matchWords.some((w) => text.includes(w));
    },
  },
  {
    id: "pets-family",
    icon: "🐾",
    title: "Pets & family",
    count: "Good things for everyone",
    color: "from-rose-500/20 to-amber-500/10",
    glowColor: "border-rose-300 shadow-rose-500/10",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-200",
    keywords: [
      "Pet", "Cat", "Dog", "Bird", "Pigeon", "Parrot", "Cockatiel", "Lovebird", "Budgerigar", "Budgie",
      "Finch", "Canary", "Macaw", "Cockatoo", "Conure", "Dove", "Myna", "Quail", "Duck", "Chicken",
      "Bird Cage", "Bird Accessories", "Pet Care", "Pet Food", "Cat Food", "Dog Food", "Bird Food",
      "Pet Accessories", "Fish & Aquarium", "Veterinary", "Pet Grooming", "Pet Training", "Pet Sitting",
      "Education", "Tuition", "Coaching", "Toys", "Baby Care", "Kids & Family", "Books",
      "Library", "Bookstore", "Book Shop", "Books & Stationery", "Stationery", "Textbook",
      "Sports & Fitness", "Hotel Booking", "Resort Booking", "Travel Agency"
    ],
    matcher: (item) => {
      const text = [
        item.name,
        item.description,
        item.category?.name,
        ...(item.keywords || []),
        ...(item.categories?.map((c) => c.name || c) || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchWords = [
        "pet", "dog", "cat", "bird", "pigeon", "parrot", "cockatiel", "lovebird", "budgie", "budgerigar",
        "finch", "canary", "macaw", "cockatoo", "dove", "myna", "quail", "duck", "chicken",
        "fish", "aquarium", "vet", "grooming", "education", "tuition", "coach",
        "toy", "baby", "kid", "child", "family", "book", "library", "stationery", "sport", "fitness",
        "hotel", "resort", "travel"
      ];
      return matchWords.some((w) => text.includes(w));
    },
  },
];

function SectionHeading({ eyebrow, title, note, link, action = "Explore all" }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-6 rounded-full bg-lime" />
          <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-800">{eyebrow}</p>
        </div>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">{title}</h2>
        {note && <p className="mt-2 text-sm text-slate-500">{note}</p>}
      </div>
      {link && (
        <Link
          to={link}
          className="inline-flex items-center gap-2 text-sm font-bold text-forest transition hover:text-emerald-700"
        >
          {action}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const shopsQuery = useCollection("/shops", { limit: 4, popular: true });
  const productsQuery = useCollection("/products", { limit: 4, trending: true });
  const servicesQuery = useCollection("/services", { limit: 4, trending: true });
  const postsQuery = useCollection("/posts", { limit: 3 });
  const shops = shopsQuery.data?.items || [];

  // Dedicated catalog collections for the 6 Category Interactive 3D Drawer
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryFilterType, setCategoryFilterType] = useState("all"); // "all" | "shop" | "product" | "service"
  const [selectedKeywordFilter, setSelectedKeywordFilter] = useState(null);

  const catalogShopsQuery = useCollection("/shops", { limit: 50 });
  const catalogProductsQuery = useCollection("/products", { limit: 50 });
  const catalogServicesQuery = useCollection("/services", { limit: 50 });

  const allCatalogShops = catalogShopsQuery.data?.items || [];
  const allCatalogProducts = catalogProductsQuery.data?.items || [];
  const allCatalogServices = catalogServicesQuery.data?.items || [];

  const matchingShops = useMemo(() => {
    if (!activeCategory) return [];
    let list = allCatalogShops.filter((s) => activeCategory.matcher(s));
    if (selectedKeywordFilter) {
      const kw = selectedKeywordFilter.toLowerCase();
      list = list.filter((s) =>
        [s.name, s.description, s.category?.name, ...(s.keywords || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(kw)
      );
    }
    return list;
  }, [activeCategory, allCatalogShops, selectedKeywordFilter]);

  const matchingProducts = useMemo(() => {
    if (!activeCategory) return [];
    let list = allCatalogProducts.filter((p) => activeCategory.matcher(p));
    if (selectedKeywordFilter) {
      const kw = selectedKeywordFilter.toLowerCase();
      list = list.filter((p) =>
        [p.name, p.description, p.category?.name, ...(p.keywords || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(kw)
      );
    }
    return list;
  }, [activeCategory, allCatalogProducts, selectedKeywordFilter]);

  const matchingServices = useMemo(() => {
    if (!activeCategory) return [];
    let list = allCatalogServices.filter((s) => activeCategory.matcher(s));
    if (selectedKeywordFilter) {
      const kw = selectedKeywordFilter.toLowerCase();
      list = list.filter((s) =>
        [s.name, s.description, s.category?.name, ...(s.keywords || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(kw)
      );
    }
    return list;
  }, [activeCategory, allCatalogServices, selectedKeywordFilter]);

  const displayItems = useMemo(() => {
    if (!activeCategory) return [];
    const prods = matchingProducts.map((p) => ({ ...p, _kind: "product" }));
    const servs = matchingServices.map((s) => ({ ...s, _kind: "service" }));
    const shps = matchingShops.map((sh) => ({ ...sh, _kind: "shop" }));

    if (categoryFilterType === "product") return prods;
    if (categoryFilterType === "service") return servs;
    if (categoryFilterType === "shop") return shps;
    return [...prods, ...servs, ...shps];
  }, [activeCategory, categoryFilterType, matchingProducts, matchingServices, matchingShops]);

  function handleItemMessage(item) {
    const ownerId = item.owner?._id || item.owner || item.shop?.owner?._id || item.shop?.owner;
    if (!ownerId) {
      toast.error("Owner information unavailable");
      return;
    }
    if (!user) {
      toast("Please log in to message the shop owner", { icon: "🔒" });
      navigate(`/login?redirect=${encodeURIComponent(`/messages?with=${ownerId}`)}`);
      return;
    }
    if (String(user.id || user._id) === String(ownerId)) {
      toast.error("You own this listing");
      return;
    }
    if (user.role === "owner") {
      toast.error("Shop owners cannot message other shop owners");
      return;
    }
    navigate(`/messages?with=${ownerId}`);
  }

  return (
    <div className="relative overflow-hidden">
      {/* Ambient 3D Particle Cloud */}
      <Background3DParticles />

      {/* 3D HERO SECTION */}
      <section className="relative overflow-hidden pt-6 sm:pt-10">
        {/* Soft background glow orbs */}
        <div className="pointer-events-none absolute -right-28 -top-40 h-[540px] w-[540px] rounded-full bg-lime/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 lg:grid-cols-[1fr_1.05fr] lg:px-8 lg:pb-24">
          {/* Left Column: Headline, Search & Interactive Badges */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="z-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-forest shadow-sm backdrop-blur-md">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-lime text-forest">
                <Rotate3d size={13} className="animate-spin" style={{ animationDuration: "10s" }} />
              </span>
              <span>Interactive 3D Neighborhood Experience</span>
            </div>

            <h1 className="mt-6 max-w-xl text-[clamp(2.75rem,5.8vw,5.2rem)] font-black leading-[.98] tracking-[-.055em] text-forest">
              Find your kind of{" "}
              <span className="relative whitespace-nowrap">
                local.
                <span className="absolute -bottom-2 left-0 h-3 w-full -rotate-2 rounded-[50%] bg-lime/80" />
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
              Explore your community in physical 3D space: brilliant little shops, certified local makers, and friendly services right around you.
            </p>

            <div className="mt-8">
              <SearchBar large />
            </div>

            {/* Quick feature checklist */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <MapPin size={14} className="text-emerald-700" />
                3D Spatial Map
              </span>
              <span className="font-semibold text-slate-600">✦ 360° Product Viewer</span>
              <span className="font-semibold text-slate-600">✦ Verified Local Sellers</span>
            </div>

            {/* Neighbor avatar social proof */}
            <div className="mt-9 flex items-center gap-3">
              <div className="flex -space-x-2">
                {["A", "M", "S", "J"].map((letter, i) => (
                  <span
                    key={letter}
                    className={`grid h-9 w-9 place-items-center rounded-full border-2 border-cream text-xs font-bold ${["bg-lime text-forest", "bg-orange-200 text-orange-900", "bg-sky-200 text-sky-900", "bg-rose-200 text-rose-900"][i]
                      }`}
                  >
                    {letter}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                <strong className="text-forest">Your community</strong> is already here exploring
              </p>
            </div>
          </motion.div>

          {/* Right Column: Interactive 3D Neighborhood Island */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative z-10 mx-auto w-full max-w-[600px]"
          >
            <Hero3DIsland />
          </motion.div>
        </div>
      </section>

      {/* 3D CATEGORIES CAROUSEL WITH INTERACTIVE 3D DROPDOWN DRAWER */}
      <section className="relative z-10 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow="A good place to start"
            title="What's around you?"
            note="Click any category to reveal matching products, services, shops, and allocated keywords."
            link="/shops"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES_DATA.map((category) => {
              const isSelected = activeCategory?.id === category.id;
              return (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => {
                    if (isSelected) {
                      setActiveCategory(null);
                      setSelectedKeywordFilter(null);
                    } else {
                      setActiveCategory(category);
                      setSelectedKeywordFilter(null);
                      setCategoryFilterType("all");
                    }
                  }}
                  className="group block text-left w-full relative focus:outline-none"
                >
                  <Card3DTilt
                    maxTilt={16}
                    scale={isSelected ? 1.05 : 1.03}
                    className={`h-full rounded-3xl border transition-all duration-300 p-5 cursor-pointer relative ${isSelected
                      ? "border-forest bg-white shadow-xl ring-2 ring-forest/20"
                      : "border-slate-100 bg-cream/70 shadow-sm hover:border-lime hover:bg-white hover:shadow-lg"
                      }`}
                  >
                    <div className="flex flex-col items-start justify-between" style={{ transform: "translateZ(20px)" }}>
                      <div className="flex w-full items-center justify-between">
                        <div
                          className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${category.color} text-3xl shadow-sm transition-transform duration-300 group-hover:scale-110`}
                          style={{ transform: "translateZ(30px)" }}
                        >
                          {category.icon}
                        </div>
                        <span
                          className={`grid h-7 w-7 place-items-center rounded-full transition-all duration-300 ${isSelected
                            ? "bg-forest text-white rotate-180"
                            : "bg-slate-100 text-slate-500 group-hover:bg-lime group-hover:text-forest"
                            }`}
                        >
                          <ChevronDown size={15} />
                        </span>
                      </div>
                      <div className="mt-5" style={{ transform: "translateZ(15px)" }}>
                        <p className={`text-sm font-bold transition-colors ${isSelected ? "text-emerald-800" : "text-forest group-hover:text-emerald-800"}`}>
                          {category.title}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {category.count}
                        </p>
                      </div>
                    </div>
                  </Card3DTilt>
                  {/* Subtle 3D Pointer Arrow connecting active card to the drawer below */}
                  {isSelected && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                      <div className="h-0 w-0 border-x-8 border-x-transparent border-t-8 border-t-forest drop-shadow-sm" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 3D TRANSFORMATION DROPDOWN DRAWER */}
          < AnimatePresence mode="wait" >
            {activeCategory && (
              <motion.div
                key={activeCategory.id}
                initial={{ opacity: 0, y: -16, scale: 0.98, rotateX: -6 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, y: -12, scale: 0.98, rotateX: 6 }}
                transition={{ type: "spring", damping: 25, stiffness: 240, mass: 0.8 }}
                style={{ transformStyle: "preserve-3d", perspective: 1200 }}
                className="mt-7 overflow-hidden rounded-3xl border border-emerald-900/10 bg-gradient-to-b from-white via-[#fcfdfa] to-emerald-50/20 p-5 sm:p-7 shadow-2xl"
              >
                {/* Header Row */}
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${activeCategory.color} text-2xl shadow-sm`}>
                      {activeCategory.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold text-forest">{activeCategory.title}</h3>
                        <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-bold text-forest">
                          {displayItems.length} active listings
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{activeCategory.count}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                      to={`/shops?q=${encodeURIComponent(selectedKeywordFilter || activeCategory.title)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-forest/20 bg-cream/70 px-3 py-1.5 text-xs font-bold text-forest shadow-2xs transition hover:bg-forest hover:text-white"
                    >
                      Search in Directory <ArrowRight size={13} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory(null);
                        setSelectedKeywordFilter(null);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-forest"
                      title="Close drawer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Allocated Keywords Chips Bar */}
                <div className="mt-4 mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Predefined Keywords &amp; Tags for {activeCategory.title}:
                    </span>
                    {selectedKeywordFilter && (
                      <button
                        type="button"
                        onClick={() => setSelectedKeywordFilter(null)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                      >
                        <X size={12} /> Clear Filter
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {activeCategory.keywords.map((kw) => {
                      const isKwActive = selectedKeywordFilter?.toLowerCase() === kw.toLowerCase();
                      return (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => setSelectedKeywordFilter(isKwActive ? null : kw)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 ${isKwActive
                            ? "bg-forest text-white shadow-sm ring-2 ring-forest/30 scale-105"
                            : "border border-slate-200 bg-white/90 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-forest"
                            }`}
                        >
                          #{kw}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-Filter Tabs (All / Products / Services / Shops) */}
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4 overflow-x-auto">
                  {[
                    { id: "all", label: "All Items", count: matchingProducts.length + matchingServices.length + matchingShops.length },
                    { id: "product", label: "Products", count: matchingProducts.length },
                    { id: "service", label: "Services", count: matchingServices.length },
                    { id: "shop", label: "Shops", count: matchingShops.length },
                  ].map((tab) => {
                    const isTabActive = categoryFilterType === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCategoryFilterType(tab.id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${isTabActive
                          ? "bg-forest text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-forest"
                          }`}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] ${isTabActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                            }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Mini Cards Grid */}
                {displayItems.length === 0 ? (
                  <div className="my-4 rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream text-2xl">
                      {activeCategory.icon}
                    </div>
                    <p className="mt-3 text-sm font-bold text-forest">
                      No listings currently found in {activeCategory.title}
                      {selectedKeywordFilter ? ` matching "${selectedKeywordFilter}"` : " yet"}.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedKeywordFilter
                        ? "Try clearing the keyword filter or searching in the main directory."
                        : "New local makers and service providers are joining soon."}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {selectedKeywordFilter && (
                        <button
                          type="button"
                          onClick={() => setSelectedKeywordFilter(null)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-forest shadow-xs hover:bg-slate-50"
                        >
                          Clear keyword filter
                        </button>
                      )}
                      <Link
                        to={`/shops?q=${encodeURIComponent(activeCategory.title)}`}
                        className="rounded-full bg-forest px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-forest/90"
                      >
                        Search {activeCategory.title} in directory
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4">
                    {displayItems.map((item) => {
                      const isProduct = item._kind === "product";
                      const isService = item._kind === "service";
                      const isShop = item._kind === "shop";
                      const targetUrl = isProduct
                        ? `/products/${item._id}`
                        : isService
                          ? `/services/${item._id}`
                          : `/shops/${item._id}`;
                      const imageSrc = isShop
                        ? item.logo || item.coverImage
                        : item.images?.[0];

                      return (
                        <motion.div
                          key={`${item._kind}-${item._id}`}
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ y: -3, scale: 1.02 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => navigate(targetUrl)}
                          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-xs transition hover:border-emerald-500/40 hover:shadow-md cursor-pointer"
                        >
                          <div>
                            {/* Card Image Box */}
                            <div className="relative h-28 sm:h-32 w-full overflow-hidden rounded-xl bg-slate-100">
                              {imageSrc ? (
                                <img
                                  src={getImageUrl(imageSrc)}
                                  alt={item.name}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="grid h-full w-full place-items-center bg-lime/20 text-forest">
                                  {isShop ? <Store size={24} /> : isService ? <Wrench size={24} /> : <Package size={24} />}
                                </div>
                              )}
                              {/* Type Badge */}
                              <span
                                className={`absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[9px] font-bold text-white shadow-xs backdrop-blur-xs ${isProduct
                                  ? "bg-emerald-800/90"
                                  : isService
                                    ? "bg-sky-800/90"
                                    : "bg-amber-800/90"
                                  }`}
                              >
                                {isProduct ? "Product" : isService ? "Service" : "Shop"}
                              </span>
                            </div>

                            {/* Title & Info */}
                            <div className="mt-2.5">
                              <h4 className="text-xs font-bold text-forest line-clamp-1 group-hover:text-emerald-700">
                                {item.name}
                              </h4>
                              <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                                {isShop
                                  ? [item.subDistrict, item.district].filter(Boolean).join(", ") || "Local Store"
                                  : item.shop?.name || "Independent Seller"}
                              </p>
                            </div>
                          </div>

                          {/* Footer / Price */}
                          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                            {isShop ? (
                              <>
                                <span className="text-[10px] font-semibold text-emerald-800">
                                  ★ {item.rating ? item.rating.toFixed(1) : "5.0"}
                                </span>
                                <span className="flex items-center gap-0.5 text-[10px] font-bold text-forest group-hover:text-emerald-700">
                                  View <ArrowRight size={10} />
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-extrabold text-forest">
                                  {item.isNegotiable
                                    ? "Negotiable"
                                    : formatCurrency(item.discountPrice || item.price)}
                                </span>
                                <ArrowUpRight size={13} className="text-slate-400 group-hover:text-emerald-700" />
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section >

      {/* EXCLUSIVE NEIGHBORHOOD DISCOUNTS: PRODUCTS & SERVICES AD SHOWCASE */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8 space-y-14">
        {/* 1. PRODUCT DISCOUNT AD SHOWCASE */}
        <div>
          <SectionHeading
            eyebrow="Special Product Deals & Offers"
            title="Exclusive Local Product Discounts"
            note="Handpicked products on discount directly from neighborhood shop owners. Ads rotate automatically!"
            link="/products"
            action="View All Products"
          />
          <DiscountDealsShowcase />
        </div>

        {/* 2. SERVICE DISCOUNT AD SHOWCASE (RIGHT BELOW PRODUCT SHOWCASE) */}
        <div>
          <SectionHeading
            eyebrow="Special Service Deals & Offers"
            title="Exclusive Local Service Discounts"
            note="Verified service discounts and special promotional rates from skilled local providers. Ads rotate automatically!"
            link="/services"
            action="View All Services"
          />
          <ServiceDealsShowcase />
        </div>
      </section>

      {/* NEW: 3D SPATIAL NEIGHBORHOOD RADAR */}
      < section className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:py-16 lg:px-8" >
        <SpatialNeighborhoodRadar />
      </section >

      {/* NEIGHBORS' FAVORITES (SHOPS) */}
      < section className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8" >
        <SectionHeading
          eyebrow="Neighbors' favorites"
          title="Worth a little detour"
          note="Local places with a lot of heart."
          link="/shops"
        />
        {
          shopsQuery.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <CardSkeleton key={n} />
              ))}
            </div>
          ) : shops.length ? (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {shops.map((shop) => (
                <Card3DTilt key={shop._id} maxTilt={10} scale={1.02} className="rounded-3xl">
                  <ShopCard shop={shop} />
                </Card3DTilt>
              ))}
            </div>
          ) : (
            <Card3DTilt maxTilt={8} className="rounded-3xl">
              <div className="rounded-3xl border border-dashed border-forest/20 bg-white/70 p-10 text-center shadow-sm">
                <Store className="mx-auto text-emerald-700" size={32} />
                <p className="mt-3 font-bold text-forest">Your neighborhood is ready to meet you</p>
                <p className="mt-1 text-sm text-slate-500">Be the first local business to join LocalSphere.</p>
                <Link to="/register" className="btn mt-5 rounded-full border-0 bg-forest text-white">
                  Bring your business here
                </Link>
              </div>
            </Card3DTilt>
          )
        }
      </section >

      {/* MADE AROUND HERE (PRODUCTS) */}
      <section className="relative z-10 bg-[#e9f0e3] dark:bg-[#102018] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="Made around here" title="Good finds. Close by." link="/products" />
          {productsQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <CardSkeleton key={n} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(productsQuery.data?.items || []).map((item) => (
                <Link to={`/products/${item._id}`} key={item._id} className="block">
                  <Card3DTilt
                    maxTilt={14}
                    scale={1.03}
                    className="overflow-hidden rounded-3xl bg-white p-3 shadow-sm transition hover:shadow-lg"
                  >
                    {item.images?.[0] ? (
                      <img
                        src={getImageUrl(item.images[0])}
                        alt={item.name}
                        className="h-44 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="grid h-44 place-items-center rounded-2xl bg-gradient-to-br from-lime/40 to-emerald-100">
                        <Sparkles className="text-forest" />
                      </div>
                    )}
                    <div className="px-2 pb-2 pt-4">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate font-bold text-forest">{item.name}</p>
                        {item.soldCount > 0 && (
                          <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                            🔥 {item.soldCount} sold
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.shop?.ownerName || item.shop?.name || "Independent maker"}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {[item.shop?.category?.name, item.shop?.area, item.shop?.subDistrict, item.shop?.district]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-extrabold text-forest">
                          {item.isNegotiable ? "Negotiable" : formatCurrency(item.discountPrice || item.price)}
                        </span>
                        {user?.role !== "owner" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleItemMessage(item);
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-forest/15 bg-cream/70 px-2.5 py-1 text-[11px] font-semibold text-forest shadow-xs transition hover:bg-forest hover:text-white"
                          >
                            <MessageSquare size={12} /> Message
                          </button>
                        )}
                      </div>
                    </div>
                  </Card3DTilt>
                </Link>
              ))}
            </div>
          )}
          {!productsQuery.isLoading && !productsQuery.data?.items?.length && (
            <p className="rounded-2xl bg-white/60 p-8 text-center text-sm text-slate-500">
              New local finds are on their way.
            </p>
          )}
        </div>
      </section>

      {/* LOCAL EXPERTISE (SERVICES) */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8">
        <SectionHeading
          eyebrow="Local expertise"
          title="Services from your neighbors"
          note="Book trusted help and talent close to home."
          link="/services"
        />
        {
          servicesQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <CardSkeleton key={n} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(servicesQuery.data?.items || []).map((item) => (
                <Link to={`/services/${item._id}`} key={item._id} className="block">
                  <Card3DTilt
                    maxTilt={14}
                    scale={1.03}
                    className="overflow-hidden rounded-3xl bg-white p-3 shadow-sm transition hover:shadow-lg"
                  >
                    {item.images?.[0] ? (
                      <img
                        src={getImageUrl(item.images[0])}
                        alt={item.name}
                        className="h-40 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="grid h-40 place-items-center rounded-2xl bg-lime/30">
                        <Store className="text-forest" />
                      </div>
                    )}
                    <div className="px-2 pb-2 pt-4">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate font-bold text-forest">{item.name}</p>
                        {item.bookingCount > 0 && (
                          <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                            ⭐ {item.bookingCount} booked
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.shop?.name || "Local professional"}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {[item.shop?.category?.name, item.shop?.area, item.shop?.subDistrict, item.shop?.district]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-extrabold text-forest">
                          {item.isNegotiable ? "Negotiable" : formatCurrency(item.price)}
                        </span>
                        {user?.role !== "owner" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleItemMessage(item);
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-forest/15 bg-cream/70 px-2.5 py-1 text-[11px] font-semibold text-forest shadow-xs transition hover:bg-forest hover:text-white"
                          >
                            <MessageSquare size={12} /> Message
                          </button>
                        )}
                      </div>
                    </div>
                  </Card3DTilt>
                </Link>
              ))}
            </div>
          )
        }
        {
          !servicesQuery.isLoading && !servicesQuery.data?.items?.length && (
            <p className="rounded-2xl bg-cream p-8 text-center text-sm text-slate-500">
              Local services will appear here soon.
            </p>
          )
        }
      </section >

      {/* COMMUNITY FEED STORY */}
      < section className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:py-20 lg:px-8" >
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-800">
              The LocalSphere feeling
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">
              Small business.
              <br />
              Big neighborhood energy.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-slate-600">
              A haircut, a handmade gift, or a really good coffee. Find it nearby in 3D and let your next favorite know you found them here.
            </p>
            <Link
              to="/feed"
              className="btn mt-6 rounded-full border-0 bg-forest px-6 text-white shadow-lg transition hover:bg-forest/90"
            >
              See what's happening <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(postsQuery.data?.items || []).slice(0, 2).map((post) => (
              <Link key={post._id} to={`/feed/${post._id}`} className="block">
                <Card3DTilt maxTilt={10} className="overflow-hidden rounded-3xl bg-white shadow-sm">
                  {post.images?.[0] ? (
                    <img src={getImageUrl(post.images[0])} alt="" className="h-52 w-full object-cover" />
                  ) : (
                    <div className="grid h-52 place-items-center bg-lime/30">
                      <WandSparkles size={36} className="text-forest" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="line-clamp-2 text-sm font-semibold text-forest">{post.body}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500">
                      <Heart size={13} /> {post.likes?.length || 0} neighbors like this
                    </span>
                  </div>
                </Card3DTilt>
              </Link>
            ))}
            {!postsQuery.data?.items?.length && (
              <div className="col-span-2 rounded-3xl bg-white p-8 text-center shadow-sm">
                <Users className="mx-auto text-emerald-700" />
                <p className="mt-2 font-bold text-forest">A feed full of local stories</p>
                <p className="mt-1 text-sm text-slate-500">
                  Follow local shops to see what they are sharing.
                </p>
              </div>
            )}
          </div>
        </div>
      </section >

      {/* CTA BANNER */}
      < section className="relative z-10 px-5 pb-16 sm:pb-20" >
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 overflow-hidden rounded-[36px] bg-forest p-8 text-white shadow-2xl sm:p-12 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-lime/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime">
              <Sparkles size={12} />
              <span>Your neighborhood is waiting</span>
            </div>
            <h2 className="mt-3 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Make a little more room for local.
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Discover what's nearby in 3D, or put your own small business on the neighborhood map.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              to="/shops"
              className="btn rounded-full border-0 bg-lime px-6 text-forest shadow-lg transition hover:bg-lime/90"
            >
              Explore nearby <MoveUpRight size={16} />
            </Link>
            <Link
              to="/register?role=owner"
              className="btn rounded-full border border-white/20 bg-white/10 px-6 text-white backdrop-blur-md transition hover:bg-white/20"
            >
              I run a business <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section >
    </div >
  );
}
