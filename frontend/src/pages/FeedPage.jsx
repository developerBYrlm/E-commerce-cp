import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Store,
  ShoppingBag,
  Wrench,
  Phone,
  MessageSquare,
  BadgeCheck,
  Star,
  Heart,
  Bookmark,
  MessageCircle,
  Send,
  Sparkles,
  Search,
  Building2,
  SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useApi";
import api from "../api/client";
import { Loader } from "../components/Loader";
import { getImageUrl } from "../utils/imageUrl";
import { BANGLADESH_DISTRICTS } from "../../../shared/bangladeshAdministrativeData.js";

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries
  const shopsQuery = useCollection("/shops", { limit: 100 });
  const postsQuery = useCollection("/posts", { limit: 30 });

  // Community state
  const [activeTab, setActiveTab] = useState("directory"); // "directory" | "feed"
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || "Dhaka");
  const [shopTypeFilter, setShopTypeFilter] = useState("all"); // "all" | "product" | "service"
  const [searchQuery, setSearchQuery] = useState("");
  const [comments, setComments] = useState({});
  const [busy, setBusy] = useState("");

  // Sync initial district when user data loads
  useEffect(() => {
    if (user?.district && !selectedDistrict) {
      setSelectedDistrict(user.district);
    }
  }, [user?.district]);

  const allShops = shopsQuery.data?.items || [];

  // Calculate shops count per district for active indicators
  const districtCounts = useMemo(() => {
    const counts = {};
    for (const shop of allShops) {
      const d = shop.district || "Unassigned";
      counts[d] = (counts[d] || 0) + 1;
    }
    return counts;
  }, [allShops]);

  // Filter shops by district, type, and keyword search
  const filteredShops = useMemo(() => {
    return allShops.filter((shop) => {
      // District check
      if (selectedDistrict && selectedDistrict !== "all") {
        const d = String(shop.district || "").toLowerCase();
        if (d !== selectedDistrict.toLowerCase()) return false;
      }
      // Shop type check
      if (shopTypeFilter === "product" && shop.shopType === "service") return false;
      if (shopTypeFilter === "service" && shop.shopType !== "service") return false;

      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (shop.name || "").toLowerCase().includes(q);
        const descMatch = (shop.description || "").toLowerCase().includes(q);
        const areaMatch = (shop.area || "").toLowerCase().includes(q);
        const subDistrictMatch = (shop.subDistrict || "").toLowerCase().includes(q);
        const categoryMatch = (shop.category?.name || "").toLowerCase().includes(q);
        if (!nameMatch && !descMatch && !areaMatch && !subDistrictMatch && !categoryMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allShops, selectedDistrict, shopTypeFilter, searchQuery]);

  function handleMessageShop(shop) {
    const ownerId = shop.owner?._id || shop.owner;
    if (!ownerId) {
      toast.error("Shop owner information unavailable");
      return;
    }
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/messages?with=${ownerId}`)}`);
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

  async function interact(post, action) {
    if (!user) return toast.error("Sign in to join the conversation");
    setBusy(`${post._id}:${action}`);
    try {
      await api.put(`/posts/${post._id}/${action}`);
      await queryClient.invalidateQueries({ queryKey: ["/posts"] });
  } catch (requestError) {
    toast.error(requestError.message);
  } finally {
    setBusy("");
  }
}

async function comment(event, postId) {
  event.preventDefault();
  const text = comments[postId]?.trim();
  if (!text || !user) return toast.error("Sign in to leave a comment");
  try {
    await api.post(`/posts/${postId}/comments`, { text });
    setComments((current) => ({ ...current, [postId]: "" }));
    await queryClient.invalidateQueries({ queryKey: ["/posts"] });
    toast.success("Comment added");
} catch (requestError) {
  toast.error(requestError.message);
}
  }

      return (
      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14 lg:px-8">
        {/* Community Hero Header */}
        <div className="rounded-[32px] bg-gradient-to-br from-[#eaf0e4] via-[#f2f7ec] to-[#e4ede0] p-7 sm:p-10 shadow-sm border border-forest/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-700 text-white text-xs">
                  <Building2 size={13} />
                </span>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-800">
                  LocalSphere Neighborhood Community
                </p>
              </div>
              <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-forest">
                {selectedDistrict === "all" ? "All Neighborhood Businesses" : `${selectedDistrict} Local Community`}
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                {user ? `Welcome, ${user.name}! ` : ""}Explore registered product and service shops in your district with verified addresses, contact info, and business details.
              </p>
            </div>

            {/* District Selector Dropdown & Badge */}
            <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-bold text-forest/70 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={13} className="text-emerald-700" /> Choose District (জেলা):
              </span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="select select-bordered rounded-2xl bg-white border-forest/20 text-forest font-bold text-sm shadow-xs focus:border-forest w-full sm:w-56"
              >
                <option value="all">🌐 All Bangladesh Districts ({allShops.length} shops)</option>
                {BANGLADESH_DISTRICTS.map((district) => {
                  const count = districtCounts[district] || 0;
                  return (
                    <option key={district} value={district}>
                      {district} {count > 0 ? `(${count} shops)` : ""}
                    </option>
                  );
                })}
              </select>
              {user?.district && (
                <span className="text-[11px] text-slate-500">
                  Your profile district: <strong className="text-forest">{user.district}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Quick District Shortcuts (Districts with registered shops) */}
          <div className="mt-6 pt-5 border-t border-forest/10 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-forest">Popular Districts:</span>
            {Object.entries(districtCounts)
              .filter(([d, count]) => d !== "Unassigned" && count > 0)
              .map(([district, count]) => (
                <button
                  key={district}
                  onClick={() => setSelectedDistrict(district)}
                  className={`btn btn-xs rounded-full font-bold transition flex items-center gap-1 ${selectedDistrict.toLowerCase() === district.toLowerCase()
                      ? "bg-forest text-white shadow-xs"
                      : "bg-white text-forest border border-forest/15 hover:bg-forest/10"
                    }`}
                >
                  <MapPin size={11} className={selectedDistrict.toLowerCase() === district.toLowerCase() ? "text-lime" : "text-emerald-700"} />
                  {district} ({count})
                </button>
              ))}
            <button
              onClick={() => setSelectedDistrict("all")}
              className={`btn btn-xs rounded-full font-bold transition ${selectedDistrict === "all" ? "bg-forest text-white" : "bg-white text-slate-600 border border-slate-200"
                }`}
            >
              All Districts ({allShops.length})
            </button>
          </div>
        </div>

    {/* Main Navigation Tabs: District Shops Directory vs Community Stories */}
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-extrabold transition shadow-xs ${activeTab === "directory"
              ? "bg-forest text-white"
              : "bg-white text-slate-600 hover:bg-cream border border-slate-200"
            }`}
        >
          <Store size={16} />
          <span>District Shops Directory (দোকানের তালিকা)</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
            {filteredShops.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("feed")}
          className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-extrabold transition shadow-xs ${activeTab === "feed"
              ? "bg-forest text-white"
              : "bg-white text-slate-600 hover:bg-cream border border-slate-200"
            }`}
        >
          <MessageCircle size={16} />
          <span>Noticeboard & Stories (নোটিস ও পোস্ট)</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
            {postsQuery.data?.items?.length || 0}
          </span>
        </button>
      </div>

      {activeTab === "directory" && (
        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-forest">{filteredShops.length}</strong> shops in{" "}
          <span className="rounded bg-lime/40 px-2 py-0.5 font-bold text-forest">
            {selectedDistrict === "all" ? "Bangladesh" : selectedDistrict}
          </span>
        </div>
      )}
    </div>

    {/* TAB 1: DISTRICT SHOPS DIRECTORY (LIST FORMAT) */}
    {activeTab === "directory" && (
      <div className="mt-6 space-y-6">
        {/* Filter Bar: Shop Type & Search Input */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Shop Type Selector */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShopTypeFilter("all")}
              className={`btn btn-sm rounded-full ${shopTypeFilter === "all" ? "bg-forest text-white" : "border-slate-200 bg-white text-slate-600"
                }`}
            >
              All Shops ({filteredShops.length})
            </button>
            <button
              onClick={() => setShopTypeFilter("product")}
              className={`btn btn-sm rounded-full ${shopTypeFilter === "product"
                  ? "bg-emerald-700 text-white"
                  : "border-slate-200 bg-white text-emerald-800"
                }`}
            >
              <ShoppingBag size={14} /> Product Selling
            </button>
            <button
              onClick={() => setShopTypeFilter("service")}
              className={`btn btn-sm rounded-full ${shopTypeFilter === "service" ? "bg-sky-700 text-white" : "border-slate-200 bg-white text-sky-800"
                }`}
            >
              <Wrench size={14} /> Service Providing
            </button>
          </div>

          {/* Quick in-directory keyword search input */}
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by shop name or area…"
              className="input input-sm input-bordered w-full rounded-xl pl-9 bg-cream text-xs text-forest focus:outline-none"
            />
          </div>
        </div>

        {/* Shop List View (list moto) */}
        {shopsQuery.isLoading ? (
          <Loader label="Loading local shops directory…" />
        ) : filteredShops.length > 0 ? (
          <div className="space-y-4">
            {filteredShops.map((shop) => {
              const isProductShop = shop.shopType !== "service";
              const productCount = shop.products?.length || 0;
              const serviceCount = shop.services?.length || 0;
              const fullAddress = [
                shop.extendedAddress || shop.area,
                shop.subDistrict,
                shop.district,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <article
                  key={shop._id}
                  className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-emerald-700/30 transition-all flex flex-col md:flex-row gap-5 items-start"
                >
                  {/* Shop Thumbnail with Type Badge */}
                  <div className="relative h-28 w-full md:h-36 md:w-48 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 via-lime/20 to-emerald-200 border border-slate-100 flex items-center justify-center">
                    {shop.coverImage || shop.logo ? (
                      <img
                        src={getImageUrl(shop.coverImage || shop.logo)}
                        alt={shop.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Store size={36} className="text-forest/30" />
                    )}
                    <span
                      className={`absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold backdrop-blur shadow-xs ${isProductShop ? "bg-emerald-700/90 text-white" : "bg-sky-700/90 text-white"
                        }`}
                    >
                      {isProductShop ? <ShoppingBag size={10} /> : <Wrench size={10} />}
                      {isProductShop ? "Product Selling" : "Service Providing"}
                    </span>
                  </div>

                  {/* Shop Details */}
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/shops/${shop._id}`}
                          className="font-extrabold text-xl text-forest hover:text-emerald-700 transition flex items-center gap-1.5"
                        >
                          {shop.name}
                          {shop.verified && <BadgeCheck size={18} className="text-emerald-600 shrink-0" />}
                        </Link>
                        {shop.category?.name && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                            {shop.category.name}
                          </span>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-200">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>{Number(shop.rating || 0).toFixed(1)}</span>
                        <span className="text-[10px] text-amber-700">({shop.reviewCount || 0})</span>
                      </div>
                    </div>

                    {/* Short Detail / Description (short detail o thkbe sei shop related) */}
                    {shop.description ? (
                      <div className="rounded-xl bg-slate-50/80 p-3 text-xs sm:text-sm text-slate-700 leading-relaxed border border-slate-100">
                        <span className="font-bold text-forest mr-1">About this shop:</span>
                        "{shop.description}"
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No detailed description added by owner yet.</p>
                    )}

                    {/* Full Address Row (address dekhabe list moto) */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1.5 font-semibold text-forest">
                        <MapPin size={14} className="text-emerald-700 shrink-0" />
                        <span>{fullAddress || "Address provided upon contact"}</span>
                      </span>

                      {shop.phone && (
                        <a
                          href={`tel:${shop.phone}`}
                          className="flex items-center gap-1 font-semibold text-emerald-800 hover:underline bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                        >
                          <Phone size={12} className="text-emerald-700" />
                          {shop.phone}
                        </a>
                      )}

                      <span className="rounded bg-lime/40 px-2.5 py-0.5 text-[11px] font-bold text-forest">
                        {isProductShop
                          ? `📦 ${productCount} Products Listed`
                          : `🛠️ ${serviceCount} Services Offered`}
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex w-full md:w-auto md:flex-col gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <Link
                      to={`/shops/${shop._id}`}
                      className="btn btn-sm rounded-xl border-0 bg-forest text-white hover:bg-forest/90 flex-1 md:flex-none shadow-xs text-xs font-bold"
                    >
                      Explore Shop →
                    </Link>
                    {user?.role !== "owner" && (
                      <button
                        type="button"
                        onClick={() => handleMessageShop(shop)}
                        className="btn btn-sm rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs font-bold"
                      >
                        <MessageSquare size={13} /> Message
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-forest/20 bg-white p-12 text-center">
            <Store className="mx-auto text-emerald-700" size={36} />
            <h3 className="mt-4 font-extrabold text-forest text-xl">
              No shops registered in {selectedDistrict} yet
            </h3>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Be the pioneer business owner to join LocalSphere from {selectedDistrict}, or explore shops in another district!
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setSelectedDistrict("Dhaka")}
                className="btn btn-sm rounded-full border-0 bg-forest text-white"
              >
                View Dhaka Shops ({districtCounts["Dhaka"] || 0})
              </button>
              <button
                onClick={() => setSelectedDistrict("all")}
                className="btn btn-sm rounded-full border-slate-200 bg-white text-forest"
              >
                View All Districts ({allShops.length})
              </button>
              {user?.role === "owner" && (
                <Link to="/dashboard" className="btn btn-sm rounded-full bg-lime text-forest font-bold">
                  Add Shop in {selectedDistrict}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    )}

    {/* TAB 2: COMMUNITY NOTICEBOARD & STORIES */}
    {activeTab === "feed" && (
      <div className="mt-6 space-y-6">
        {postsQuery.isLoading ? (
          <Loader label="Finding the latest local stories…" />
        ) : postsQuery.isError ? (
          <div className="rounded-2xl bg-red-50 p-5 text-red-700">{postsQuery.error.message}</div>
        ) : postsQuery.data?.items?.length ? (
          <div className="space-y-5">
            {postsQuery.data.items.map((post) => (
              <article
                key={post._id}
                className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="flex items-center gap-3 p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime/60 font-bold text-forest overflow-hidden">
                    {post.shop?.logo ? (
                      <img src={getImageUrl(post.shop.logo)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      post.shop?.name?.slice(0, 1)
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/shops/${post.shop?.slug || post.shop?._id}`}
                      className="truncate font-bold text-forest hover:text-emerald-700 transition"
                    >
                      {post.shop?.name || "Local shop"}
                    </Link>
                    <p className="mt-0.5 text-xs capitalize text-slate-500">
                      {post.type} · {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-cream px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-forest">
                    {post.type}
                  </span>
                </div>

                {post.images?.[0] && (
                  <img src={getImageUrl(post.images[0])} alt="" className="max-h-[460px] w-full object-cover" />
                )}

                <div className="px-5 pb-5">
                  <p className="whitespace-pre-wrap leading-7 text-slate-700">{post.body}</p>
                  {post.product && (
                    <Link
                      to={`/products/${post.product}`}
                      className="mt-3 inline-block text-sm font-bold text-emerald-700"
                    >
                      See featured product →
                    </Link>
                  )}
                  <div className="mt-5 flex items-center gap-5 border-y border-slate-100 py-3 text-sm text-slate-500">
                    <button
                      disabled={busy === `${post._id}:like`}
                      onClick={() => interact(post, "like")}
                      className="flex items-center gap-2 hover:text-rose-600"
                    >
                      <Heart
                        size={17}
                        className={post.likes?.some((id) => String(id) === user?.id) ? "fill-rose-500 text-rose-500" : ""}
                      />
                      {post.likes?.length || 0}
                    </button>
                    <span className="flex items-center gap-2">
                      <MessageCircle size={17} />
                      {post.comments?.length || 0}
                    </span>
                    <button
                      onClick={() => interact(post, "save")}
                      className="ml-auto flex items-center gap-2 hover:text-forest"
                    >
                      <Bookmark size={16} />
                      Save
                    </button>
                  </div>

                  {post.comments?.slice(-2).map((comm) => (
                    <p key={comm._id} className="mt-3 text-sm text-slate-600">
                      <strong className="text-forest">{comm.author?.name || "Neighbor"} </strong>
                      {comm.text}
                    </p>
                  ))}

                  <form onSubmit={(event) => comment(event, post._id)} className="mt-4 flex gap-2">
                    <input
                      value={comments[post._id] || ""}
                      onChange={(event) =>
                        setComments((current) => ({ ...current, [post._id]: event.target.value }))
                      }
                      className="input input-sm min-w-0 flex-1 rounded-full border-slate-200 bg-cream"
                      placeholder={user ? "Add a kind comment…" : "Sign in to join in"}
                      maxLength={1000}
                    />
                    <button
                      className="btn btn-sm rounded-full border-0 bg-forest text-white"
                      aria-label="Send comment"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-forest/20 bg-white p-12 text-center">
            <Store className="mx-auto text-emerald-700" size={32} />
            <h3 className="mt-4 font-bold text-forest">A fresh feed starts here</h3>
            <p className="mt-2 text-sm text-slate-500">
              When local shops in {selectedDistrict} share news, offers, and new products, you'll find their stories here.
            </p>
            <button
              onClick={() => setActiveTab("directory")}
              className="btn mt-5 rounded-full border-0 bg-forest text-white"
            >
              Browse {selectedDistrict} Shops Directory
            </button>
          </div>
        )}
      </div>
    )}
  </div>
  );
}
