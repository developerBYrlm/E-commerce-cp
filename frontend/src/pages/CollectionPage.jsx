import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, MapPin, MessageSquare, Search, SlidersHorizontal, Sparkles, Star, Shuffle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useApi";
import ShopCard from "../components/ShopCard";
import MapView from "../components/MapView";
import SearchBar from "../components/SearchBar";
import { CardSkeleton } from "../components/Loader";
import ProductImageSlider from "../components/ProductImageSlider";
import { formatCurrency } from "../utils/currency";
import { getImageUrl } from "../utils/imageUrl";
import { calculateLocationScore, sortItemsByProximity } from "../utils/proximity";
import { VerifiedBadge, isVerified } from "../utils/verification";

const config = {
  shops: { path: "/shops", title: "Meet your local favorites", desc: "Independent shops with big neighborhood energy.", empty: "No shops found yet. Try another search or check back soon." },
  products: { path: "/products", title: "Made, found, and loved nearby", desc: "Discover the good things local makers and shops have on their shelves.", empty: "No products to show just yet." },
  services: { path: "/services", title: "A helping hand, just around the corner", desc: "Find trusted local experts and book a time that works.", empty: "No services to show just yet." },
};

export default function CollectionPage({ kind }) {
  const [params, setParams] = useSearchParams();
  const [showMap, setShowMap] = useState(false);
  const [shuffleTick, setShuffleTick] = useState(0);
  const { user } = useAuth();
  const current = config[kind] || config.shops;
  const q = params.get("q") || "";
  const query = useCollection(current.path, { q: q || undefined, shop: params.get("shop") || undefined, limit: 24 });
  const rawItems = query.data?.items || [];

  // When logged in: sort by user location proximity (nearest home location first, then others)
  // Without login: continuously shuffle/randomize on every page load or refresh
  const displayItems = useMemo(() => {
    if (!rawItems.length) return [];
    return sortItemsByProximity(rawItems, user);
  }, [rawItems, user, shuffleTick]);

  const setSearch = (value) => setParams(value ? { q: value } : {});

  const handleShuffle = () => {
    setShuffleTick((t) => t + 1);
  };

  return <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14 lg:px-8">
    <div className="rounded-[30px] bg-[#eaf0e4] dark:bg-[#12231b] px-6 py-10 sm:px-10 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-700">Out there, nearby</p><h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-forest sm:text-5xl">{current.title}</h1><p className="mt-3 text-slate-600">{current.desc}</p>
      <div className="mt-7 max-w-2xl">
        <SearchBar
          large
          initialQuery={q}
          onSearch={(val) => setSearch(val)}
          placeholder="Search shops, services, products…"
          currentKind={kind}
        />
      </div>
    </div>
    <div className="mb-7 mt-9 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="font-bold text-forest">
          {query.isLoading ? "Finding the good stuff…" : `${query.data?.pagination?.total || displayItems.length} nearby ${kind}`}
        </p>
        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
          {user?.area || user?.subDistrict ? (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <MapPin size={11} className="text-emerald-700" /> Prioritizing {user.area ? `${user.area}, ` : ""}{user.subDistrict || user.district}
            </span>
          ) : (
            <span>Showing what's available on LocalSphere {!user && "(Randomized discovery)"}</span>
          )}
        </p>
      </div>
      <div className="flex gap-2">
        {!user && (
          <button
            type="button"
            onClick={handleShuffle}
            title="Randomize / Shuffle cards"
            className="btn btn-sm rounded-full border-slate-200 bg-white text-forest shadow-xs hover:bg-forest hover:text-white transition"
          >
            <Shuffle size={14} /> Refresh
          </button>
        )}
        <button onClick={() => setShowMap(!showMap)} className={`btn btn-sm rounded-full ${showMap ? "bg-forest text-white" : "border-slate-200 bg-white text-forest"}`}><MapPin size={15} /> {showMap ? "Hide map" : "Map view"}</button>
        <button className="btn btn-sm rounded-full border-slate-200 bg-white text-forest"><SlidersHorizontal size={15} /> Filters</button>
      </div>
    </div>
    {showMap && <div className="mb-7"><MapView items={displayItems} /></div>}
    {query.isError ? (
      <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">{query.error.message}</div>
    ) : query.isLoading ? (
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <CardSkeleton key={n} />
        ))}
      </div>
    ) : displayItems.length ? (
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {displayItems.map((item) => {
          const isNearby = Boolean(user && calculateLocationScore(item, user) >= 500);
          return kind === "shops" ? (
            <ShopCard key={item._id} shop={item} isNearby={isNearby} />
          ) : (
            <ItemCard key={item._id} item={item} kind={kind} isNearby={isNearby} />
          );
        })}
      </div>
    ) : (
      <div className="rounded-3xl border border-dashed border-forest/20 bg-white p-12 text-center">
        <Sparkles className="mx-auto text-emerald-700" />
        <h2 className="mt-4 font-bold text-forest">The neighborhood's still growing</h2>
        <p className="mt-2 text-sm text-slate-500">{current.empty}</p>
        <Link to="/register" className="btn mt-5 rounded-full border-0 bg-forest text-white">
          Help it grow
        </Link>
      </div>
    )}
  </div>;
}

function ItemCard({ item, kind, isNearby = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const route = kind === "products" ? "products" : "services";

  function handleMessageClick(e) {
    e.preventDefault();
    e.stopPropagation();
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
    <Link
      to={`/${route}/${item._id}`}
      className="group overflow-hidden rounded-[24px] border border-forest/5 bg-white shadow-[0_8px_30px_rgba(22,42,32,.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(22,42,32,.12)]"
    >
      <ProductImageSlider
        images={item.images}
        alt={item.name}
        className="h-52 w-full"
        rounded="rounded-none"
        imageClassName="object-cover transition duration-500 group-hover:scale-105"
        fallbackIcon={Sparkles}
      />
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-emerald-700 flex items-center gap-1.5">
            <span className="truncate">{item.shop?.name || (kind === "products" ? "Local shop" : "Local expert")}</span>
            {isVerified(item.shop) && <VerifiedBadge size={13} title="Verified Shop" />}
          </p>
          <div className="flex items-center gap-2">
            {isNearby && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                📍 In your area
              </span>
            )}
            {kind === "products" && item.soldCount > 0 && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                🔥 {item.soldCount} sold
              </span>
            )}
            {kind === "services" && item.bookingCount > 0 && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                ⭐ {item.bookingCount} booked
              </span>
            )}
            <span className="flex items-center gap-1 text-xs font-semibold text-forest">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              {Number(item.rating || 0).toFixed(1)}
            </span>
          </div>
        </div>

        <h2 className="mt-2 truncate text-lg font-bold text-forest flex items-center gap-1.5">
          <span className="truncate">{item.name}</span>
          {isVerified(item) && <VerifiedBadge size={16} title="Verified Listing" />}
        </h2>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">{item.description}</p>

        <div className="mt-4 flex items-baseline">
          <span className="text-lg font-extrabold text-forest">
            {item.isNegotiable ? (
              <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-700">
                Negotiable
                <span className="text-xs font-semibold text-emerald-600/80">(আলোচনা সাপেক্ষ)</span>
              </span>
            ) : (
              <>
                {formatCurrency(item.price)}
                {kind === "services" && <small className="ml-1 text-xs font-normal text-slate-500">/ session</small>}
              </>
            )}
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
          {user?.role !== "owner" && (
            <button
              type="button"
              onClick={handleMessageClick}
              className="inline-flex items-center gap-1 rounded-full border border-forest/15 bg-cream/70 px-3 py-1 text-xs font-semibold text-forest shadow-sm transition hover:bg-forest hover:text-white"
            >
              <MessageSquare size={13} />
              Message
            </button>
          )}
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            Explore <ArrowUpRight size={15} />
          </span>
        </div>
      </div>
    </Link >
  );
}
