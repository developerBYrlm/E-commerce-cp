import { ArrowUpRight, MapPin, Star, BadgeCheck, ShoppingBag, Wrench, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getImageUrl } from "../utils/imageUrl";
import { useAuth } from "../contexts/AuthContext";

export default function ShopCard({ shop, isNearby = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isProduct = shop.shopType !== "service";

  function handleMessageClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const ownerId = shop.owner?._id || shop.owner;
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
      toast.error("You own this shop");
      return;
    }
    if (user.role === "owner") {
      toast.error("Shop owners cannot message other shop owners");
      return;
    }
    navigate(`/messages?with=${ownerId}`);
  }

  return <Link to={`/shops/${shop.slug || shop._id}`} className="group overflow-hidden rounded-[24px] border border-forest/5 bg-white shadow-[0_8px_30px_rgba(22,42,32,.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(22,42,32,.12)]">
    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-lime/50 to-emerald-100">
      {shop.coverImage && <img src={getImageUrl(shop.coverImage)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
      <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-forest backdrop-blur">{shop.category?.name || "Local favorite"}</span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur ${isProduct ? "bg-emerald-600/90 text-white" : "bg-sky-600/90 text-white"}`}>
          {isProduct ? <ShoppingBag size={11} /> : <Wrench size={11} />}
          {isProduct ? "Products" : "Services"}
        </span>
        {isNearby && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur">
            📍 In your area
          </span>
        )}
      </div>
      <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-2xl bg-white text-forest shadow-md overflow-hidden">{shop.logo ? <img src={getImageUrl(shop.logo)} alt="" className="h-full w-full object-cover" /> : <span className="font-bold">{shop.name?.slice(0, 1)}</span>}</span>
    </div>
    <div className="p-4 sm:p-5">
      <div className="flex items-center gap-1.5"><h3 className="truncate font-bold text-forest">{shop.name}</h3>{shop.verified && <BadgeCheck size={16} className="shrink-0 text-emerald-600" />}</div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={13} />{[shop.address?.city, shop.address?.region].filter(Boolean).join(", ") || "Around your neighborhood"}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 pt-3.5 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 font-semibold text-forest"><Star size={14} className="fill-amber-400 text-amber-400" />{Number(shop.rating || 0).toFixed(1)} <span className="font-normal text-slate-400">({shop.reviewCount || 0})</span></span>
          {shop.followers?.length > 0 && (
            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded-full border border-sky-100">
              👥 {shop.followers.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          {(!user || user.role === "customer") && (
            <button
              type="button"
              onClick={handleMessageClick}
              className="inline-flex items-center gap-1 rounded-full border border-forest/15 bg-cream/70 px-2.5 py-1 text-xs font-semibold text-forest shadow-sm transition hover:bg-forest hover:text-white"
            >
              <MessageSquare size={12} />
              Message
            </button>
          )}
          <span className="flex items-center gap-0.5 font-semibold text-emerald-700 text-xs sm:text-sm">Explore <ArrowUpRight size={14} /></span>
        </div>
      </div>
    </div>
  </Link>;
}
