import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  CreditCard,
  Eye,
  Flag,
  Heart,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Printer,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Trash2,
  Truck,
  UploadCloud,
  Users,
  Wrench,
  X,
  Crown,
  Megaphone,
  Zap,
  Check,
  TrendingUp,
  Target,
  ShieldCheck,
  Play,
  Pause,
  Flame,
  Share2,
  Video,
  Film,
} from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../hooks/useApi";
import { Loader } from "../components/Loader";
import { VerifiedBadge, isVerified } from "../utils/verification";
import api from "../api/client";
import AdminManagement from "../components/AdminManagement";
import CategoryManagement from "../components/CategoryManagement";
import { formatCurrency } from "../utils/currency";
import { getImageUrl } from "../utils/imageUrl";
import { printOrderInvoice, printBookingVoucher } from "../utils/printDocument";
import LocationFields from "../components/LocationFields";
import MessagesPage from "./MessagesPage";
import { PRODUCT_KEYWORDS, SERVICE_KEYWORDS } from "../../../shared/catalogOptions.js";

async function uploadFileToBackend(file, folder = "owners") {
  if (!file) return null;
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post(`/uploads/image?folder=${folder}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.filename;
}

async function uploadFilesToBackend(files, folder = "owners") {
  if (!files || !files.length) return [];
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }
  const response = await api.post(`/uploads/images?folder=${folder}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.filenames || [];
}

export default function DashboardPage({ initialTab = "overview" }) {
  const { user, toggleWishlist, updateProfile, followShop, followService } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [tab, setTabState] = useState(urlTab || initialTab);

  const setTab = (newTab) => {
    setTabState(newTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newTab === "overview") next.delete("tab");
      else next.set("tab", newTab);
      return next;
    });
  };

  useEffect(() => {
    if (urlTab && urlTab !== tab) {
      setTabState(urlTab);
    }
  }, [urlTab]);

  const prevInitialTabRef = useRef(initialTab);
  useEffect(() => {
    if (prevInitialTabRef.current !== initialTab) {
      prevInitialTabRef.current = initialTab;
      if (!urlTab && initialTab !== tab) {
        setTabState(initialTab);
      }
    }
  }, [initialTab, urlTab, tab]);

  const [targetShopFilter, setTargetShopFilter] = useState("");
  const queryClient = useQueryClient();
  const customer = user?.role === "customer";
  const admin = user?.role === "admin";
  const shops = useCollection("/shops", { mine: true, limit: 50 });
  const products = useCollection("/products", { mine: true, limit: 100 });
  const services = useCollection("/services", { mine: true, limit: 100 });
  const orders = useCollection("/orders", { limit: 100 });
  const bookings = useCollection("/bookings", { limit: 100 });
  const stats = useCollection("/admin/stats");
  const inboxQuery = useCollection("/chat/inbox");

  const unreadMessagesCount = inboxQuery.data?.counts?.unread || 0;

  // Active subscription plan and Pro status
  const [currentPlanId, setCurrentPlanId] = useState(() => {
    return localStorage.getItem("ls_subscription_plan") || "starter";
  });
  const isProActive = Boolean(user?.role === "owner" && currentPlanId && currentPlanId !== "starter");

  // Real-time total followers count for owner
  const allShops = shops.data?.items || [];
  const allServices = services.data?.items || [];
  const totalFollowers = useMemo(() => {
    const shopFollowers = allShops.reduce((sum, s) => sum + (s.followers?.length || 0), 0);
    const serviceFollowers = allServices.reduce((sum, s) => sum + (s.followers?.length || 0), 0);
    return shopFollowers + serviceFollowers;
  }, [allShops, allServices]);

  // Live real-time socket listener for follower count updates
  useEffect(() => {
    if (!user || user.role !== "owner") return;
    const socket = io(import.meta.env.VITE_SOCKET_URL || undefined, { withCredentials: true });

    socket.on("shop:followerUpdate", (data) => {
      queryClient.invalidateQueries({ queryKey: ["/shops"] });
      if (data?.action === "follow") {
        toast.success("🎉 Someone just followed your shop!", { id: "live-follower-alert", duration: 3500 });
      }
    });

    socket.on("service:followerUpdate", (data) => {
      queryClient.invalidateQueries({ queryKey: ["/services"] });
      queryClient.invalidateQueries({ queryKey: ["/shops"] });
      if (data?.action === "follow") {
        toast.success("🎉 Someone just followed your service!", { id: "live-follower-alert", duration: 3500 });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, queryClient]);

  // Incomplete orders: all orders whose status is NOT "completed" and NOT "cancelled"
  const incompleteOrdersCount = useMemo(() => {
    return (orders.data?.items || []).filter((o) => {
      const s = String(o.status || "").toLowerCase();
      return s !== "completed" && s !== "cancelled";
    }).length;
  }, [orders.data?.items]);

  // Incomplete bookings: all bookings whose status is NOT "completed" and NOT "cancelled" and NOT "rejected"
  const incompleteBookingsCount = useMemo(() => {
    return (bookings.data?.items || []).filter((b) => {
      const s = String(b.status || "").toLowerCase();
      return s !== "completed" && s !== "cancelled" && s !== "rejected";
    }).length;
  }, [bookings.data?.items]);

  // Real-time product sales map (times sold & total units)
  const productSalesMap = useMemo(() => {
    const map = new Map();
    for (const order of orders.data?.items || []) {
      if (order.status === "cancelled") continue;
      for (const line of order.items || []) {
        const pid = String(line.product?._id || line.product || "");
        if (!pid) continue;
        const prev = map.get(pid) || { orderCount: 0, totalUnits: 0 };
        prev.orderCount += 1;
        prev.totalUnits += Number(line.quantity || 1);
        map.set(pid, prev);
      }
    }
    return map;
  }, [orders.data?.items]);

  // Real-time service bookings map (times booked & completed)
  const serviceBookingsMap = useMemo(() => {
    const map = new Map();
    for (const booking of bookings.data?.items || []) {
      if (booking.status === "cancelled" || booking.status === "rejected") continue;
      const sid = String(booking.service?._id || booking.service || "");
      if (!sid) continue;
      const prev = map.get(sid) || { bookingCount: 0, completedCount: 0 };
      prev.bookingCount += 1;
      if (booking.status === "completed" || booking.status === "delivered" || booking.status === "provided") {
        prev.completedCount += 1;
      }
      map.set(sid, prev);
    }
    return map;
  }, [bookings.data?.items]);

  async function updateActivity(path, item, status) {
    try {
      await api.patch(`${path}/${item._id}`, { status });
      await queryClient.invalidateQueries({ queryKey: [path] });
      toast.success(`Updated to ${status.replaceAll("_", " ")}`);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function refundOrder(item, reason) {
    try {
      const response = await api.post(`/orders/${item._id}/refund`, { reason });
      await queryClient.invalidateQueries({ queryKey: ["/orders"] });
      if (response.data.item?.refundStatus === "review") toast.error(response.data.message);
      else toast.success(response.data.message);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function reconcileRefund(item) {
    try {
      const response = await api.post(`/orders/${item._id}/refund/reconcile`);
      await queryClient.invalidateQueries({ queryKey: ["/orders"] });
      if (response.data.item?.refundStatus === "review") toast.error(response.data.message);
      else toast.success(response.data.message);
    } catch (error) {
      toast.error(error.message);
    }
  }

  const tabs = customer
    ? [
      ["overview", "Overview", Activity],
      ["inbox", "Inbox", Mail],
      ["profile", "Profile & settings", Settings2],
      ["following", "Following", Users],
      ["orders", "Orders", ShoppingBag],
      ["bookings", "Bookings", CalendarDays],
      ["reviews", "Reviews", Star],
      ["wishlist", "Wishlist", Heart],
      ["history", "Discovery history", MapPin],
    ]
    : admin
      ? [
        ["overview", "Overview", Activity],
        ["orders", "Orders", ShoppingBag],
        ["shops", "Shops", Store],
        ["users", "Users", Users],
        ["categories", "Categories", Settings2],
        ["reports", "Reports", Flag],
      ]
      : [
        ["overview", "Overview", Activity],
        ["inbox", "Inbox", Mail],
        ["shop", "My Shops", Store],
        ["products", "Products", Package],
        ["services", "Services", Wrench],
        ["orders", "Orders", ShoppingBag],
        ["bookings", "Bookings", CalendarDays],
        ["customers", "Customers", Users],
        ["reviews", "Reviews", Star],
        ["profile", "Profile & settings", Settings2],
        ["pro", "Pro Mode", Crown],
      ];

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center">
        <h1 className="text-3xl font-bold text-forest">Sign in to view your dashboard</h1>
        <Link to="/login" className="btn mt-5 rounded-full border-0 bg-forest text-white">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[240px_1fr] lg:px-8">
      <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime text-forest font-bold">
            {user.name?.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-forest">{user.name}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs capitalize text-slate-500">{user.role} account</p>
              {isProActive && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-1.5 py-0.2 text-[9px] font-black uppercase text-white shadow-xs">
                  <Crown size={9} /> PRO
                </span>
              )}
            </div>
          </div>
        </div>
        <nav className="mt-4 space-y-1">
          {tabs
            .filter(([id]) => id !== "pro")
            .map(([id, label, Icon]) => {
              let badge = null;
              if (id === "inbox" && unreadMessagesCount > 0) {
                badge = (
                  <span className="ml-auto flex items-center gap-1.5 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-extrabold text-white shadow-xs">
                      {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                    </span>
                  </span>
                );
              } else if (id === "orders" && incompleteOrdersCount > 0) {
                badge = (
                  <span className="ml-auto flex items-center gap-1.5 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-extrabold text-white shadow-xs">
                      {incompleteOrdersCount}
                    </span>
                  </span>
                );
              } else if (id === "bookings" && incompleteBookingsCount > 0) {
                badge = (
                  <span className="ml-auto flex items-center gap-1.5 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-extrabold text-white shadow-xs">
                      {incompleteBookingsCount}
                    </span>
                  </span>
                );
              }

              return (
                <button
                  key={id}
                  onClick={() => {
                    setTab(id);
                    setTargetShopFilter("");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${tab === id ? "bg-forest text-white" : "text-slate-500 hover:bg-cream hover:text-forest"
                    }`}
                >
                  <Icon size={17} className="shrink-0" />
                  <span className="truncate flex-1">{label}</span>
                  {badge}
                </button>
              );
            })}

          {user.role === "owner" && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setTab("pro");
                  setTargetShopFilter("");
                }}
                className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-[1.5px] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] animate-pro-glow ${tab === "pro"
                  ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-md shadow-emerald-500/25"
                  : ""
                  }`}
              >
                {/* Modern green gradient border */}
                <span
                  className={`absolute inset-0 rounded-2xl transition-opacity ${tab === "pro"
                      ? "bg-gradient-to-r from-forest via-emerald-600 to-teal-600 opacity-100"
                      : "bg-gradient-to-r from-emerald-500/50 via-teal-500/40 to-forest/50 opacity-80 group-hover:opacity-100"
                    }`}
                />

                {/* Inner button surface */}
                <div
                  className={`relative flex w-full items-center justify-between gap-2.5 rounded-[14px] px-3.5 py-2.5 font-bold transition-all ${tab === "pro"
                      ? "bg-gradient-to-r from-forest via-emerald-700 to-teal-800 text-white shadow-inner"
                      : "bg-white text-forest hover:bg-emerald-50/50 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800"
                    }`}
                >
                  {/* Subtle soft shimmer sweep */}
                  <span className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent -skew-x-12 animate-shimmer-sweep" />

                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-105 ${tab === "pro"
                          ? "bg-white/20 text-white shadow-xs"
                          : "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
                        }`}
                    >
                      <Crown size={16} />
                    </span>
                    <div className="text-left leading-tight truncate">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-black tracking-tight ${tab === "pro" ? "text-white" : "text-forest dark:text-white"
                            }`}
                        >
                          Pro Mode
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider ${tab === "pro"
                              ? "bg-white/20 text-white"
                              : "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300"
                            }`}
                        >
                          PRO ⚡
                        </span>
                      </div>
                      <p
                        className={`text-[10px] font-medium truncate ${tab === "pro" ? "text-emerald-100" : "text-slate-500 dark:text-slate-400"
                          }`}
                      >
                        Ads & Subscription
                      </p>
                    </div>
                  </div>

                  <Sparkles
                    size={14}
                    className={`shrink-0 transition-transform group-hover:rotate-12 ${tab === "pro" ? "text-emerald-200" : "text-emerald-500"
                      }`}
                  />
                </div>
              </button>
            </div>
          )}
        </nav>
      </aside>

      <section className="min-w-0">
        {tab !== "inbox" && (
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">
                {admin ? "Platform management" : customer ? "Your LocalSphere" : "Your businesses, nearby"}
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-forest flex items-center gap-2">
                <span>{tab === "overview" ? `Hello, ${user.name?.split(" ")[0]}` : tabs.find(([id]) => id === tab)?.[1]}</span>
                {tab === "overview" && isProActive && (
                  <VerifiedBadge size={24} title="Verified Pro Owner" />
                )}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {user.role === "owner" && (
                <div
                  className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white px-3.5 py-1.5 shadow-xs transition hover:border-emerald-300 dark:border-forest/30 dark:bg-slate-800"
                  title="Live auto-updated total followers count"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-lime/40 text-forest dark:bg-emerald-500/20 dark:text-emerald-300">
                    <Users size={13} />
                  </span>
                  <div className="flex items-baseline gap-1 text-xs">
                    <span className="text-sm font-extrabold tracking-tight text-forest dark:text-white">
                      {totalFollowers}
                    </span>
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Followers
                    </span>
                  </div>
                  <span className="relative flex h-2 w-2 ml-0.5" title="Live real-time synced">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                </div>
              )}
              {user.role === "owner" && tab !== "shop" && (
                <button onClick={() => setTab("shop")} className="btn rounded-full border-0 bg-forest text-white">
                  <Plus size={16} /> Add a new shop
                </button>
              )}
            </div>
          </div>
        )}

        {tab === "overview" && (
          <Overview
            user={user}
            stats={stats}
            shops={shops}
            products={products}
            services={services}
            orders={orders}
            bookings={bookings}
            incompleteOrdersCount={incompleteOrdersCount}
            incompleteBookingsCount={incompleteBookingsCount}
            setTab={setTab}
          />
        )}
        {tab === "shop" && (
          <ShopManagement
            shops={shops}
            products={products}
            services={services}
            productSalesMap={productSalesMap}
            serviceBookingsMap={serviceBookingsMap}
            onManageShop={(type, shopId) => {
              setTargetShopFilter(shopId);
              setTab(type === "service" ? "services" : "products");
            }}
            isProActive={isProActive}
          />
        )}
        {tab === "products" && (
          <ResourceManagement
            title="Products"
            icon={Package}
            items={products.data?.items}
            loading={products.isLoading}
            createPath="/products"
            shops={shops.data?.items || []}
            initialShopFilter={targetShopFilter}
            fields={["name", "price", "stock"]}
            salesMap={productSalesMap}
            isProActive={isProActive}
          />
        )}
        {tab === "services" && (
          <ResourceManagement
            title="Services"
            icon={Wrench}
            items={services.data?.items}
            loading={services.isLoading}
            createPath="/services"
            shops={shops.data?.items || []}
            initialShopFilter={targetShopFilter}
            fields={["name", "price"]}
            salesMap={serviceBookingsMap}
            isProActive={isProActive}
          />
        )}
        {tab === "orders" && (
          <DataList
            title="Recent orders"
            query={orders}
            type="orders"
            user={user}
            onUpdate={updateActivity}
            onRefund={refundOrder}
            onReconcileRefund={reconcileRefund}
          />
        )}
        {tab === "bookings" && (
          <DataList title="Service bookings" query={bookings} type="bookings" user={user} onUpdate={updateActivity} />
        )}
        {tab === "shops" && admin && <AdminManagement resource="shops" />}
        {tab === "users" && admin && <AdminManagement resource="users" />}
        {tab === "categories" && admin && <CategoryManagement />}
        {tab === "wishlist" && <WishlistPanel toggleWishlist={toggleWishlist} />}
        {tab === "following" && customer && (
          <FollowingPanel followShop={followShop} followService={followService} />
        )}
        {tab === "profile" && <ProfileSettings user={user} updateProfile={updateProfile} />}
        {tab === "pro" && (
          <ProModeSection
            user={user}
            shops={shops.data?.items || []}
            products={products.data?.items || []}
            services={services.data?.items || []}
            currentPlanId={currentPlanId}
            setCurrentPlanId={setCurrentPlanId}
          />
        )}
        {tab === "inbox" && <MessagesPage />}
        {tab === "customers" && user.role === "owner" && (
          <CustomersPanel ordersQuery={orders} bookingsQuery={bookings} setTab={setTab} />
        )}
        {tab === "reviews" && (customer || user.role === "owner") && <ReviewsPanel user={user} />}
        {tab === "history" && customer && <DiscoveryHistory />}
        {tab === "reports" && admin && <ReportManagement />}
      </section>
    </div>
  );
}

// ----------------- SLIDING IMAGE GALLERY -----------------

function ImageSlider({ images = [], alt = "", className = "h-48 w-full", interval = 2800 }) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const validImages = Array.isArray(images) ? images.filter(Boolean) : [];

  useEffect(() => {
    if (validImages.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % validImages.length);
    }, interval);
    return () => clearInterval(timer);
  }, [validImages.length, isHovered, interval]);

  if (!validImages.length) {
    return (
      <div className={`${className} bg-slate-100 flex flex-col items-center justify-center text-slate-400 rounded-2xl`}>
        <ImageIcon size={26} className="opacity-40" />
        <span className="text-[11px] mt-1">No image available</span>
      </div>
    );
  }

  const prev = (e) => {
    e?.stopPropagation();
    setIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const next = (e) => {
    e?.stopPropagation();
    setIndex((prev) => (prev + 1) % validImages.length);
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-slate-900 select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sliding Strip */}
      <div
        className="flex h-full w-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {validImages.map((img, i) => (
          <div key={i} className="h-full w-full shrink-0 relative bg-slate-950 flex items-center justify-center">
            <img
              src={getImageUrl(img)}
              alt={`${alt} ${i + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Slide Badge Counter (e.g. 📷 2/4) */}
      {validImages.length > 1 && (
        <span className="absolute top-2.5 right-2.5 z-10 rounded-full bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
          📷 {index + 1}/{validImages.length}
        </span>
      )}

      {/* Navigation Arrows */}
      {validImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-forest shadow-md backdrop-blur-xs transition opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110"
            title="Previous image"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-forest shadow-md backdrop-blur-xs transition opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110"
            title="Next image"
          >
            <ChevronRight size={16} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2.5 inset-x-0 z-10 flex justify-center gap-1.5">
            {validImages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all ${index === i ? "w-5 bg-white shadow-xs" : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                title={`Image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ----------------- 3D VISITING CARD MODAL -----------------

function ThreeDVisitingCardModal({ item, shop, isOpen, onClose, onEdit }) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const isProduct = item?.stock !== undefined || item?.condition !== undefined;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handleMouseMove = (e) => {
    const card = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - card.left;
    const y = e.clientY - card.top;
    const centerX = card.width / 2;
    const centerY = card.height / 2;
    const rotX = -((y - centerY) / centerY) * 12;
    const rotY = ((x - centerX) / centerX) * 12;
    setRotate({ x: rotX, y: rotY });
    setGlare({ x: (x / card.width) * 100, y: (y / card.height) * 100, opacity: 0.35 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  const shopName = item.shop?.name || shop?.name || "LocalSphere Partner Shop";
  const shopArea = [shop?.area || item.shop?.area, shop?.subDistrict || item.shop?.subDistrict, shop?.district || item.shop?.district].filter(Boolean).join(", ");
  const shopPhone = shop?.phone || item.shop?.phone;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full"
        style={{ perspective: "1500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar above card */}
        <div className="flex justify-between items-center mb-3 px-1">
          <div className="flex items-center text-lime">
            <Sparkles size={18} />
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition shadow-md"
          >
            <X size={14} /> Close
          </button>
        </div>

        {/* 3D Transform Visiting Card */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
            transition: "transform 0.12s ease-out",
            transformStyle: "preserve-3d",
          }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-cream/30 to-emerald-50/70 p-1 shadow-2xl border border-white/80 ring-1 ring-slate-900/10 cursor-grab active:cursor-grabbing"
        >
          {/* Holographic Sheen / Glare Layer */}
          <div
            className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 rounded-3xl"
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, ${glare.opacity}) 0%, transparent 60%)`,
            }}
          />

          {/* Visiting Card Inner Container */}
          <div className="relative rounded-[22px] bg-white/95 p-6 sm:p-7 backdrop-blur-lg flex flex-col justify-between space-y-6">
            {/* Top Bar: Card Brand / Seal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-700 to-forest text-white shadow-md">
                  {isProduct ? <ShoppingBag size={20} /> : <Wrench size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-base text-forest tracking-tight">
                      {shopName}
                    </p>
                    <BadgeCheck size={16} className="text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {isProduct ? "Official Product Catalog Card" : "Official Service Partner Card"}
                  </p>
                </div>
              </div>

              {/* Security Seal / Serial Tag */}
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 tracking-wider">
                  <Sparkles size={11} className="text-emerald-600" />
                  3D VERIFIED
                </span>
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                  #{item._id?.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Main Visiting Card Body */}
            <div className="grid gap-6 md:grid-cols-[280px_1fr] items-start">
              {/* Left Column: Image Slider */}
              <div className="space-y-2">
                <ImageSlider
                  images={item.images || []}
                  alt={item.name}
                  className="h-56 sm:h-64 w-full rounded-2xl shadow-sm"
                  interval={2500}
                />
                <p className="text-center text-[11px] text-slate-400 font-medium">
                  📷 {item.images?.length || 0} Photos · Auto-sliding
                </p>
              </div>

              {/* Right Column: Specifications & Info */}
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isProduct ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"
                      }`}>
                      {isProduct ? "🛍️ Product Listing" : "🛠️ Service Offering"}
                    </span>
                    {item.condition && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 capitalize">
                        Condition: {item.condition}
                      </span>
                    )}
                    {item.stock !== undefined && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${item.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        }`}>
                        {item.stock > 0 ? `In Stock: ${item.stock} units` : "Out of stock"}
                      </span>
                    )}
                    {isProduct && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        🔥 {item.soldCount ?? 0} sold
                      </span>
                    )}
                    {!isProduct && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        ⭐ {item.bookingCount ?? 0} booked
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-forest leading-snug">
                    {item.name}
                  </h3>
                </div>

                {/* Price Display */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-3xl font-black text-forest">
                    {item.isNegotiable && (!item.price || item.price === 0)
                      ? "Negotiable"
                      : formatCurrency(item.discountPrice || item.price)}
                  </span>
                  {item.isNegotiable && (
                    <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      🤝 Negotiable / আলোচনা সাপেক্ষ
                    </span>
                  )}
                  {item.discountPrice && !item.isNegotiable && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatCurrency(item.price)}
                    </span>
                  )}
                  {item.discountPrice && !item.isNegotiable && (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      SAVE {formatCurrency(item.price - item.discountPrice)}
                    </span>
                  )}
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-slate-600 leading-relaxed max-h-24 overflow-y-auto pr-1">
                    {item.description}
                  </p>
                )}

                {/* Keywords Chips */}
                {item.keywords?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-forest uppercase tracking-wider mb-1.5">
                      Keywords & Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.keywords.map((kw, i) => (
                        <span key={i} className="text-[11px] bg-lime/40 text-forest font-semibold px-2 py-0.5 rounded-md">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact & Location Footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin size={13} className="text-forest/60" />
                    {shopArea || "Local neighborhood"}
                  </span>
                  {shopPhone && (
                    <span className="font-semibold text-forest">
                      📞 {shopPhone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Metallic Visiting Card Footer Bar */}
            <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 -mx-6 -mb-6 p-4 rounded-b-[22px]">
              <div className="flex items-center gap-2">
                <CreditCard size={15} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500">
                  LocalSphere Smart Neighborhood Commerce
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(item);
                    }}
                    className="btn btn-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-forest font-semibold"
                  >
                    Edit Item
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="btn btn-xs rounded-xl border-0 bg-forest text-white hover:bg-forest/90 font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------- IMAGE PICKER COMPONENTS -----------------

function DeviceImagePicker({ label, currentImage, onFileSelect, onClear, required }) {
  const [internalPreview, setInternalPreview] = useState(null);

  const displaySrc = internalPreview || (currentImage ? getImageUrl(currentImage) : null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Image exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select a file under 10 MB.`);
        e.target.value = "";
        return;
      }
      const url = URL.createObjectURL(file);
      setInternalPreview(url);
      onFileSelect(file);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2.5 transition hover:border-slate-300">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-forest flex items-center gap-1.5 truncate">
          <Camera size={13} className="text-forest/70 shrink-0" />
          <span className="truncate">{label}</span>
          {required && <span className="text-red-500">*</span>}
        </span>
        {displaySrc && (
          <button
            type="button"
            onClick={() => {
              setInternalPreview(null);
              onClear?.();
            }}
            className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline shrink-0"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-cream/70 flex items-center justify-center">
          {displaySrc ? (
            <img src={displaySrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon size={22} className="text-slate-300" />
          )}
        </div>
        <div className="min-w-0 flex-1 w-full sm:w-auto">
          <label className="btn btn-sm w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
            <UploadCloud size={14} className="text-forest shrink-0" />
            <span className="truncate">Upload from device</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function DeviceMultiImagePicker({
  existingImages = [],
  selectedFiles = [],
  onFilesChange,
  onRemoveExisting,
  max = 5,
}) {
  const totalCount = existingImages.length + selectedFiles.length;

  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Validate size of each file
    const oversized = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(
        `Image(s) exceed 10 MB limit: ${oversized.map((f) => `${f.name} (${(f.size / (1024 * 1024)).toFixed(1)} MB)`).join(", ")}. Please choose images under 10 MB.`
      );
      e.target.value = "";
      return;
    }

    const availableSlots = max - totalCount;
    if (availableSlots <= 0) {
      toast.error(`Maximum ${max} images allowed`);
      return;
    }
    const toAdd = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      toast.error(`Only ${availableSlots} more image(s) could be added (max ${max})`);
    }
    const updated = [...selectedFiles, ...toAdd];
    onFilesChange(updated);
  };

  const handleRemoveNew = (index) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  return (
    <div className="form-control gap-2 sm:col-span-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-forest flex items-center gap-1.5">
          <Camera size={14} /> Upload images from your device (Max {max})
        </span>
        <span className="text-xs text-slate-500 font-medium">
          {totalCount} / {max} images
        </span>
      </div>

      <div className="flex flex-wrap gap-3 items-center mt-1">
        {existingImages.map((img, idx) => (
          <div key={`existing-${idx}`} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-cream">
            <img src={getImageUrl(img)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveExisting?.(idx)}
              className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-white shadow hover:bg-red-700 transition"
              title="Remove image"
            >
              <X size={12} />
            </button>
            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">Saved</span>
          </div>
        ))}

        {selectedFiles.map((file, idx) => {
          const preview = URL.createObjectURL(file);
          return (
            <div key={`new-${idx}`} className="group relative h-20 w-20 overflow-hidden rounded-xl border-2 border-emerald-500 bg-cream">
              <img src={preview} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveNew(idx)}
                className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-white shadow hover:bg-red-700 transition"
                title="Remove image"
              >
                <X size={12} />
              </button>
              <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] px-1 rounded">New</span>
            </div>
          );
        })}

        {totalCount < max && (
          <label className="h-20 w-20 shrink-0 border-2 border-dashed border-forest/30 hover:border-forest rounded-xl bg-cream/60 hover:bg-cream flex flex-col items-center justify-center gap-1 cursor-pointer transition">
            <UploadCloud size={20} className="text-forest/60" />
            <span className="text-[10px] font-semibold text-forest">Add Photo</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileAdd}
            />
          </label>
        )}
      </div>
    </div>
  );
}

// ----------------- SHOP MANAGEMENT & CREATION -----------------

function ShopManagement({ shops, products, services, productSalesMap, serviceBookingsMap, onManageShop, isProActive }) {
  const [filterType, setFilterType] = useState("all"); // "all", "product", "service"
  const [editingId, setEditingId] = useState("");
  const [viewingShopId, setViewingShopId] = useState("");
  const [selectedVisitingItem, setSelectedVisitingItem] = useState(null);
  const queryClient = useQueryClient();

  if (shops.isLoading) return <Loader />;

  const allShops = shops.data?.items || [];
  const productShops = allShops.filter((s) => s.shopType !== "service");
  const serviceShops = allShops.filter((s) => s.shopType === "service");

  const displayedShops =
    filterType === "product" ? productShops : filterType === "service" ? serviceShops : allShops;

  async function deleteShop(shop) {
    if (!window.confirm(`Delete shop "${shop.name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/shops/${shop._id}`);
      await queryClient.invalidateQueries({ queryKey: ["/shops"] });
      toast.success("Shop deleted successfully");
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`btn btn-sm rounded-full ${filterType === "all" ? "bg-forest text-white" : "bg-white text-forest border-slate-200"}`}
          >
            All Shops ({allShops.length})
          </button>
          <button
            onClick={() => setFilterType("product")}
            className={`btn btn-sm rounded-full ${filterType === "product" ? "bg-emerald-700 text-white" : "bg-white text-emerald-800 border-slate-200"}`}
          >
            <ShoppingBag size={14} /> Product Selling ({productShops.length})
          </button>
          <button
            onClick={() => setFilterType("service")}
            className={`btn btn-sm rounded-full ${filterType === "service" ? "bg-sky-700 text-white" : "bg-white text-sky-800 border-slate-200"}`}
          >
            <Wrench size={14} /> Service Providing ({serviceShops.length})
          </button>
        </div>
      </div>

      {/* Shop Cards Grid */}
      {displayedShops.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {displayedShops.map((shop) => {
            const isProductShop = shop.shopType !== "service";
            const shopProducts = (products?.data?.items || []).filter(
              (p) => String(p.shop?._id || p.shop) === String(shop._id)
            );
            const shopServices = (services?.data?.items || []).filter(
              (s) => String(s.shop?._id || s.shop) === String(shop._id)
            );
            const rawItems = isProductShop
              ? (shopProducts.length ? shopProducts : (shop.products || []))
              : (shopServices.length ? shopServices : (shop.services || []));
            const shopItems = rawItems.filter((i) => typeof i === "object" && i.name);
            const itemCount = shopItems.length || (isProductShop ? (shop.products?.length || 0) : (shop.services?.length || 0));
            const isExpanded = editingId === shop._id || viewingShopId === shop._id;

            return (
              <div
                key={shop._id}
                className={`overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md flex flex-col justify-between ${isExpanded ? "sm:col-span-2 ring-2 ring-forest/20 shadow-lg" : ""
                  }`}
              >
                <div>
                  {/* Shop Cover Banner - Clickable */}
                  <div
                    onClick={() => {
                      setEditingId("");
                      setViewingShopId(viewingShopId === shop._id ? "" : shop._id);
                    }}
                    className="relative h-36 overflow-hidden bg-gradient-to-r from-emerald-100 via-lime/30 to-emerald-200 cursor-pointer group/banner"
                    title="Click to view products/services in this shop"
                  >
                    {shop.coverImage && (
                      <img
                        src={getImageUrl(shop.coverImage)}
                        alt=""
                        className="h-full w-full object-cover group-hover/banner:scale-105 transition duration-500"
                      />
                    )}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur ${isProductShop ? "bg-emerald-700/90 text-white" : "bg-sky-700/90 text-white"
                          }`}
                      >
                        {isProductShop ? <ShoppingBag size={11} /> : <Wrench size={11} />}
                        {isProductShop ? "Product Selling Shop" : "Service Providing Shop"}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/90 text-forest text-[11px] font-bold px-2.5 py-1 shadow-xs backdrop-blur">
                        <Eye size={12} className="text-forest" />
                        Click to view
                      </span>
                    </div>

                    {/* Logo */}
                    <div className="absolute -bottom-3 right-4 h-14 w-14 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md flex items-center justify-center">
                      {shop.logo ? (
                        <img src={getImageUrl(shop.logo)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-bold text-forest text-lg">{shop.name?.slice(0, 1)}</span>
                      )}
                    </div>
                  </div>

                  {/* Shop Information - Clickable */}
                  <div
                    onClick={() => {
                      setEditingId("");
                      setViewingShopId(viewingShopId === shop._id ? "" : shop._id);
                    }}
                    className="p-5 pt-4 cursor-pointer group/info"
                    title="Click to view products/services in this shop"
                  >
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-lg text-forest truncate group-hover/info:text-emerald-700 transition">
                        {shop.name}
                      </h3>
                      {isProActive && <VerifiedBadge size={16} title="Verified Pro Shop" />}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {shop.description || "No shop description provided yet."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" />
                        {[shop.area, shop.subDistrict, shop.district].filter(Boolean).join(", ") || "Location not set"}
                      </span>
                      {shop.phone && <span>· 📞 {shop.phone}</span>}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-forest flex items-center gap-1 bg-lime/30 text-forest px-2.5 py-1 rounded-full">
                          📦 {itemCount} {isProductShop ? "Products Listed" : "Services Offered"}
                        </span>
                        <span className="font-bold text-sky-800 flex items-center gap-1 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">
                          <Users size={12} className="text-sky-700" /> {shop.followers?.length || 0} Followers
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Eye size={13} /> {viewingShopId === shop._id ? "Showing items ▲" : "View showcase ▼"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingId("");
                        setViewingShopId(viewingShopId === shop._id ? "" : shop._id);
                      }}
                      className={`btn btn-xs rounded-xl font-bold transition flex items-center gap-1.5 ${viewingShopId === shop._id
                        ? "bg-forest text-white"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                    >
                      <Eye size={13} />
                      {viewingShopId === shop._id ? "Close View" : `View ${isProductShop ? "Products" : "Services"} (${itemCount})`}
                    </button>
                    <button
                      onClick={() => {
                        setViewingShopId("");
                        setEditingId(editingId === shop._id ? "" : shop._id);
                      }}
                      className="btn btn-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                    >
                      {editingId === shop._id ? "Close Edit" : "Edit Details"}
                    </button>
                    <button
                      onClick={() => onManageShop?.(shop.shopType, shop._id)}
                      className="btn btn-xs rounded-xl border-0 bg-forest text-white hover:bg-forest/90"
                    >
                      Manage {isProductShop ? "Products" : "Services"} →
                    </button>
                  </div>
                  <button
                    onClick={() => deleteShop(shop)}
                    className="btn btn-xs btn-ghost text-red-600 hover:bg-red-50 rounded-xl"
                    title="Delete Shop"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Edit Form */}
                {editingId === shop._id && (
                  <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/50">
                    <ShopEditForm shop={shop} onDone={() => setEditingId("")} />
                  </div>
                )}

                {/* Showcase of Products / Services with Auto-sliding Images */}
                {viewingShopId === shop._id && (
                  <div className="p-5 sm:p-6 border-t border-slate-200 bg-slate-50/60 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-white shadow-xs">
                          {isProductShop ? <Package size={17} /> : <Wrench size={17} />}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-base text-forest flex items-center gap-2">
                            {isProductShop ? "Products in" : "Services in"} {shop.name}
                            <span className="text-xs bg-forest/10 text-forest px-2 py-0.5 rounded-full font-bold">
                              {shopItems.length} items
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500">
                            Click any item to view its 3D Visiting Card. Photos slide automatically!
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onManageShop?.(shop.shopType, shop._id)}
                          className="btn btn-xs rounded-xl border-0 bg-forest text-white hover:bg-forest/90"
                        >
                          Manage in {isProductShop ? "Products" : "Services"} Tab →
                        </button>
                        <button
                          onClick={() => setViewingShopId("")}
                          className="btn btn-xs btn-ghost text-slate-400 hover:text-slate-600 rounded-lg flex items-center gap-1"
                        >
                          <X size={14} /> Close
                        </button>
                      </div>
                    </div>

                    {shopItems.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {shopItems.map((item) => (
                          <div
                            key={item._id}
                            onClick={() => setSelectedVisitingItem({ item, shop })}
                            className="group cursor-pointer rounded-2xl bg-white p-3.5 shadow-sm border border-slate-200/90 hover:border-forest hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                            title="Click to view 3D Visiting Card"
                          >
                            <div>
                              {/* Auto-sliding Image Gallery */}
                              <ImageSlider
                                images={item.images || []}
                                alt={item.name}
                                className="h-44 w-full rounded-xl shadow-xs"
                                interval={2700}
                              />

                              <div className="mt-3">
                                <div className="flex items-start justify-between gap-1.5">
                                  <h5 className="font-bold text-sm text-forest group-hover:text-emerald-700 transition line-clamp-1 flex items-center gap-1">
                                    <span>{item.name}</span>
                                    {isProActive && (
                                      <VerifiedBadge size={14} title="Verified Pro Item" />
                                    )}
                                  </h5>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold shrink-0 capitalize">
                                    {isProductShop ? (item.condition || "new") : "Service"}
                                  </span>
                                </div>

                                <div className="mt-1 flex items-baseline gap-1.5">
                                  <span className="text-base font-extrabold text-forest">
                                    {formatCurrency(item.discountPrice || item.price)}
                                  </span>
                                  {item.discountPrice && (
                                    <span className="text-xs text-slate-400 line-through">
                                      {formatCurrency(item.price)}
                                    </span>
                                  )}
                                </div>

                                {item.description && (
                                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}

                                {item.keywords?.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {item.keywords.slice(0, 3).map((kw, i) => (
                                      <span key={i} className="text-[10px] bg-lime/40 text-forest font-medium px-1.5 py-0.5 rounded">
                                        #{kw}
                                      </span>
                                    ))}
                                    {item.keywords.length > 3 && (
                                      <span className="text-[10px] text-slate-400">+{item.keywords.length - 3}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 group-hover:underline">
                                <Sparkles size={13} className="text-emerald-600" />
                                3D Visiting Card
                              </span>
                              <div className="flex items-center gap-2">
                                {isProductShop ? (
                                  <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                    {(productSalesMap?.get(String(item._id))?.totalUnits ?? item.soldCount ?? 0)} sold
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                    {(serviceBookingsMap?.get(String(item._id))?.bookingCount ?? item.bookingCount ?? 0)} booked
                                  </span>
                                )}
                                <span className="text-[11px] font-medium text-slate-400">
                                  {isProductShop ? `${item.stock ?? 0} in stock` : "Available"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-slate-500">
                        <p className="text-sm font-medium">No {isProductShop ? "products" : "services"} listed in this shop yet.</p>
                        <button
                          onClick={() => onManageShop?.(shop.shopType, shop._id)}
                          className="btn btn-sm mt-3 rounded-xl border-0 bg-forest text-white"
                        >
                          Add First {isProductShop ? "Product" : "Service"} →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
          No shops found for this category. Create one below to start listing products or services!
        </div>
      )}

      {/* 3D Visiting Card Modal for Shop Items */}
      <ThreeDVisitingCardModal
        item={selectedVisitingItem?.item}
        shop={selectedVisitingItem?.shop}
        isOpen={!!selectedVisitingItem}
        onClose={() => setSelectedVisitingItem(null)}
        onEdit={(it) => {
          onManageShop?.(it.serviceArea || !it.condition ? "service" : "product", it.shop?._id || it.shop);
        }}
      />

      {/* Create New Shop Form */}
      <div className="mt-8">
        <ShopCreateForm onShopCreated={() => setFilterType("all")} />
      </div>
    </div>
  );
}

function ShopCreateForm({ onShopCreated }) {
  const categories = useCollection("/categories", { type: "shop", limit: 100 });
  const [shopType, setShopType] = useState("product");
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [location, setLocation] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const body = Object.fromEntries(formData.entries());
    body.shopType = shopType;
    body.categories = formData.getAll("categories");

    if (!body.categories.length) {
      toast.error("Please select at least one business category");
      return;
    }

    setIsSubmitting(true);
    try {
      if (logoFile) {
        body.logo = await uploadFileToBackend(logoFile, "owners");
      }
      if (coverFile) {
        body.coverImage = await uploadFileToBackend(coverFile, "owners");
      }

      await api.post("/shops", { ...body, ...location });
      form.reset();
      setLogoFile(null);
      setCoverFile(null);
      await queryClient.invalidateQueries({ queryKey: ["/shops"] });
      toast.success(shopType === "product" ? "Product Selling Shop created!" : "Service Providing Shop created!");
      onShopCreated?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-forest">Add a New Shop Profile</h2>
        <p className="text-xs text-slate-500">
          Select shop type, upload your shop photos from your device, and enter contact information.
        </p>
      </div>

      {/* Shop Type Selector */}
      <div className="mt-5">
        <label className="text-xs font-bold uppercase tracking-wider text-forest block mb-2">
          Shop Type / Business Model *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${shopType === "product" ? "border-forest bg-forest/5 shadow-sm" : "border-slate-200 hover:bg-slate-50"
              }`}
          >
            <input
              type="radio"
              name="shopType"
              value="product"
              checked={shopType === "product"}
              onChange={() => setShopType("product")}
              className="radio radio-success radio-sm"
            />
            <div>
              <p className="font-bold text-forest flex items-center gap-1.5">
                <ShoppingBag size={16} /> Product Selling Shop
              </p>
              <p className="text-xs text-slate-500">Sell groceries, electronics, fashion, food items, etc.</p>
            </div>
          </label>
          <label
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${shopType === "service" ? "border-forest bg-forest/5 shadow-sm" : "border-slate-200 hover:bg-slate-50"
              }`}
          >
            <input
              type="radio"
              name="shopType"
              value="service"
              checked={shopType === "service"}
              onChange={() => setShopType("service")}
              className="radio radio-success radio-sm"
            />
            <div>
              <p className="font-bold text-forest flex items-center gap-1.5">
                <Wrench size={16} /> Service Providing Shop
              </p>
              <p className="text-xs text-slate-500">Repairs, AC servicing, plumbing, salon, coaching, etc.</p>
            </div>
          </label>
        </div>
      </div>

      {/* Device Images */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 border-y border-slate-100 py-4">
        <DeviceImagePicker
          label="Shop Logo / Profile Picture"
          onFileSelect={setLogoFile}
          onClear={() => setLogoFile(null)}
        />
        <DeviceImagePicker
          label="Shop Cover Banner"
          onFileSelect={setCoverFile}
          onClear={() => setCoverFile(null)}
        />
      </div>

      {/* Details */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field name="name" label="Business / Shop Name" required />
        <Field name="phone" label="Primary Phone Number" required />
        <Field name="phoneSecondary" label="Secondary Phone (Optional)" />
        <Field name="email" label="Business Contact Email" type="email" />
        <label className="form-control gap-2 sm:col-span-2">
          <span className="text-xs font-semibold text-forest">Business Description</span>
          <textarea
            name="description"
            rows="2"
            className="textarea textarea-bordered rounded-xl bg-cream"
            placeholder="Tell your neighbors about your business..."
          />
        </label>
      </div>

      <div className="mt-5">
        <LocationFields value={location} onChange={setLocation} addressRequired />
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-xs font-semibold text-forest">Business Categories — Select at least one *</legend>
        {categories.isError ? (
          <p role="alert" className="text-xs text-red-700">{categories.error.message}</p>
        ) : (
          <div className="grid max-h-40 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
            {(categories.data?.items || []).map((cat) => (
              <label key={cat._id} className="flex items-center gap-2 text-xs">
                <input name="categories" value={cat._id} type="checkbox" className="checkbox checkbox-sm checkbox-success" />
                {cat.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <button disabled={isSubmitting || categories.isLoading} className="btn mt-6 rounded-xl border-0 bg-forest text-white">
        {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : <Plus size={16} />}
        Create {shopType === "product" ? "Product Shop" : "Service Shop"}
      </button>
    </form>
  );
}

function ShopEditForm({ shop, onDone }) {
  const queryClient = useQueryClient();
  const categories = useCollection("/categories", { type: "shop", limit: 100 });
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState({
    district: shop.district || "",
    subDistrict: shop.subDistrict || "",
    area: shop.area || "",
    address: shop.address?.street || "",
    extendedAddress: shop.extendedAddress || "",
  });
  const [selectedCategories, setSelectedCategories] = useState(
    (shop.categories || [shop.category].filter(Boolean)).map((item) => String(item._id || item))
  );

  async function save(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (!selectedCategories.length || selectedCategories.length > 10) {
      toast.error("Choose between 1 and 10 business categories");
      return;
    }

    setIsSubmitting(true);
    try {
      if (logoFile) {
        values.logo = await uploadFileToBackend(logoFile, "owners");
      }
      if (coverFile) {
        values.coverImage = await uploadFileToBackend(coverFile, "owners");
      }

      await api.patch(`/shops/${shop._id}`, { ...values, ...location, categories: selectedCategories });
      await queryClient.invalidateQueries({ queryKey: ["/shops"] });
      toast.success("Business profile updated");
      onDone();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 className="font-extrabold text-base text-forest flex items-center gap-2">
            <Settings2 size={17} className="text-forest/80" /> Edit Shop Profile: {shop.name}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Update shop photos, business contact, type, and location details.
          </p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="btn btn-xs btn-ghost text-slate-400 hover:text-slate-600 rounded-lg flex items-center gap-1"
        >
          <X size={14} /> Close
        </button>
      </div>

      {/* Device Photo Pickers */}
      <div className="grid gap-4 sm:grid-cols-2 bg-slate-50/60 p-3.5 sm:p-4 rounded-2xl border border-slate-100">
        <DeviceImagePicker
          label="Change Logo / Profile Picture"
          currentImage={shop.logo}
          onFileSelect={setLogoFile}
          onClear={() => setLogoFile(null)}
        />
        <DeviceImagePicker
          label="Change Cover Banner"
          currentImage={shop.coverImage}
          onFileSelect={setCoverFile}
          onClear={() => setCoverFile(null)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="name" label="Business name" defaultValue={shop.name} required />
        <Field name="phone" label="Primary phone" defaultValue={shop.phone} required />
        <Field name="phoneSecondary" label="Secondary phone" defaultValue={shop.phoneSecondary} />
        <Field name="email" label="Business email" type="email" defaultValue={shop.email} />
        <label className="form-control gap-2">
          <span className="text-xs font-semibold text-forest">Shop Type</span>
          <select name="shopType" defaultValue={shop.shopType || "product"} className="select select-bordered rounded-xl bg-cream">
            <option value="product">🛍️ Product Selling Shop</option>
            <option value="service">🛠️ Service Providing Shop</option>
          </select>
        </label>
        <label className="form-control gap-2 sm:col-span-2">
          <span className="text-xs font-semibold text-forest">Description</span>
          <textarea name="description" defaultValue={shop.description} rows="2" className="textarea textarea-bordered rounded-xl bg-cream" />
        </label>
      </div>

      <LocationFields value={location} onChange={setLocation} />

      <fieldset>
        <legend className="mb-2 text-xs font-semibold text-forest">Business categories</legend>
        {categories.isError ? (
          <p role="alert" className="text-xs text-red-700">{categories.error.message}</p>
        ) : (
          <div className="grid max-h-40 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
            {(categories.data?.items || []).map((category) => (
              <label key={category._id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category._id)}
                  onChange={(event) =>
                    setSelectedCategories((current) =>
                      event.target.checked ? [...current, category._id] : current.filter((id) => id !== category._id)
                    )
                  }
                  className="checkbox checkbox-sm checkbox-success"
                />
                {category.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex gap-2 pt-2">
        <button disabled={isSubmitting || categories.isLoading} className="btn btn-sm rounded-xl border-0 bg-forest text-white">
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" onClick={onDone} className="btn btn-sm btn-ghost rounded-xl">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ----------------- PRODUCTS & SERVICES MANAGEMENT -----------------

function ResourceManagement({ title, icon: Icon, items = [], loading, createPath, shops = [], initialShopFilter = "", fields, salesMap, isProActive }) {
  const isProduct = createPath === "/products";
  const keywords = useMemo(() => (isProduct ? PRODUCT_KEYWORDS : SERVICE_KEYWORDS).slice().sort((a, b) => a.localeCompare(b)), [isProduct]);
  const categories = useCollection("/categories", { type: isProduct ? "product" : "service", limit: 100 });
  const [editingId, setEditingId] = useState("");
  const [selectedVisitingItem, setSelectedVisitingItem] = useState(null);
  const [selectedShopFilter, setSelectedShopFilter] = useState(initialShopFilter);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState("");
  const queryClient = useQueryClient();

  // Filter shops to only show matching type
  const relevantShops = shops.filter((s) => (isProduct ? s.shopType !== "service" : s.shopType === "service"));

  if (loading) return <Loader />;

  const filteredItems = selectedShopFilter
    ? items.filter((i) => String(i.shop?._id || i.shop) === selectedShopFilter)
    : items;

  async function remove(item) {
    if (!window.confirm(`Delete ${item.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`${createPath}/${item._id}`);
      await queryClient.invalidateQueries({ queryKey: [createPath] });
      await queryClient.invalidateQueries({ queryKey: ["/shops"] });
      toast.success("Listing deleted");
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const body = Object.fromEntries(formData.entries());

    body.isNegotiable = isNegotiable;
    if (isNegotiable && (body.price === undefined || body.price === "" || isNaN(Number(body.price)))) {
      body.price = 0;
    }

    for (const field of ["price", "stock", "discount", "discountPrice"]) {
      if (body[field] !== undefined && body[field] !== "") body[field] = Number(body[field]);
      else delete body[field];
    }
    body.keywords = formData.getAll("keywords");

    if (body.keywords.length < 3 || body.keywords.length > 10) {
      toast.error("Please choose between 3 and 10 keywords");
      return;
    }

    if (isProduct && !selectedFiles.length) {
      toast.error("Please upload at least 1 image from your device for the product");
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedFilenames = await uploadFilesToBackend(selectedFiles, "owners");
      body.images = uploadedFilenames;

      await api.post(createPath, body);
      form.reset();
      setSelectedFiles([]);
      setIsNegotiable(false);
      await queryClient.invalidateQueries({ queryKey: [createPath] });
      await queryClient.invalidateQueries({ queryKey: ["/shops"] });
      toast.success(`${title} created successfully!`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Shop Filter Bar */}
      {relevantShops.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-forest uppercase tracking-wider">Filter by Shop:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedShopFilter("")}
                className={`btn btn-xs rounded-full ${!selectedShopFilter ? "bg-forest text-white" : "btn-ghost"}`}
              >
                All ({items.length})
              </button>
              {relevantShops.map((s) => (
                <button
                  key={s._id}
                  onClick={() => setSelectedShopFilter(s._id)}
                  className={`btn btn-xs rounded-full ${selectedShopFilter === s._id ? "bg-forest text-white" : "border-slate-200 bg-white"
                    }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-slate-400">{filteredItems.length} listed</span>
        </div>
      )}

      {/* Listing Cards */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const shopName = item.shop?.name || relevantShops.find((s) => s._id === (item.shop?._id || item.shop))?.name;
          const firstImage = item.images?.[0];

          return (
            <div
              key={item._id}
              className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 hover:border-forest/40 hover:shadow-md transition"
            >
              <div className="flex flex-wrap items-center gap-4">
                {/* Clickable Thumbnail */}
                <div
                  onClick={() =>
                    setSelectedVisitingItem({
                      item,
                      shop: relevantShops.find((s) => s._id === (item.shop?._id || item.shop)),
                    })
                  }
                  className="group/img relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream flex items-center justify-center border border-slate-100 cursor-pointer shadow-2xs hover:scale-105 transition"
                  title="Click to view 3D Visiting Card"
                >
                  {firstImage ? (
                    <img src={getImageUrl(firstImage)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime/50 text-forest">
                      <Icon size={17} />
                    </span>
                  )}
                  <span className="absolute inset-0 bg-forest/20 opacity-0 group-hover/img:opacity-100 transition grid place-items-center text-white">
                    <Sparkles size={16} />
                  </span>
                </div>

                {/* Clickable Details */}
                <div
                  onClick={() =>
                    setSelectedVisitingItem({
                      item,
                      shop: relevantShops.find((s) => s._id === (item.shop?._id || item.shop)),
                    })
                  }
                  className="min-w-0 flex-1 cursor-pointer group/title"
                  title="Click to view 3D Visiting Card"
                >
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-forest truncate group-hover/title:text-emerald-700 transition flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {isProActive && (
                        <VerifiedBadge size={15} title="Verified Pro Listing" />
                      )}
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded opacity-0 group-hover/title:opacity-100 transition">
                        📇 3D Card
                      </span>
                    </p>
                    {shopName && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium truncate">
                        🏬 {shopName}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-xs text-slate-500">
                      <strong className="text-forest">
                        {item.isNegotiable ? (
                          <span className="inline-flex items-center gap-1">
                            {item.price > 0 ? `${formatCurrency(item.price)} ` : ""}
                            <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                              Negotiable
                            </span>
                          </span>
                        ) : (
                          formatCurrency(item.price)
                        )}
                      </strong>{" "}
                      {item.stock !== undefined && `· ${item.stock} in stock`}
                      {item.images?.length > 1 && ` · 📷 ${item.images.length} photos`}
                    </p>
                    {isProduct ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
                        🔥 {(salesMap?.get(String(item._id))?.totalUnits ?? item.soldCount ?? 0)} sold
                        {salesMap?.get(String(item._id))?.orderCount > 1 ? ` (${salesMap.get(String(item._id)).orderCount} orders)` : ""}
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
                          ⭐ {(salesMap?.get(String(item._id))?.bookingCount ?? item.bookingCount ?? 0)} booked
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-900 border border-sky-200">
                          <Users size={11} className="text-sky-700" /> {item.followers?.length || 0} followers
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setSelectedVisitingItem({
                        item,
                        shop: relevantShops.find((s) => s._id === (item.shop?._id || item.shop)),
                      })
                    }
                    className="btn btn-sm rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1 shadow-2xs"
                    title="View 3D Visiting Card"
                  >
                    <CreditCard size={14} className="text-emerald-700" />
                    <span className="hidden sm:inline">3D Card</span>
                  </button>
                  <button
                    onClick={() => setEditingId(editingId === item._id ? "" : item._id)}
                    className="btn btn-sm rounded-xl"
                  >
                    {editingId === item._id ? "Close" : "Edit"}
                  </button>
                  <button onClick={() => remove(item)} className="btn btn-sm btn-ghost text-red-600 rounded-xl">
                    Delete
                  </button>
                </div>
              </div>

              {editingId === item._id && (
                <ListingEditForm
                  item={item}
                  isProduct={isProduct}
                  keywords={keywords}
                  categories={categories.data?.items || []}
                  onDone={() => setEditingId("")}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Listing Form */}
      <form onSubmit={handleCreate} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <h2 className="font-bold text-forest text-lg">Add New {isProduct ? "Product" : "Service"}</h2>
        <p className="text-xs text-slate-500 mt-1">
          Select the shop this {isProduct ? "product" : "service"} belongs to, upload up to 5 photos from your device, and fill in the details.
        </p>

        {relevantShops.length === 0 ? (
          <div className="mt-5 rounded-2xl bg-amber-50 p-5 text-amber-800 text-sm">
            <p className="font-bold">No {isProduct ? "Product Selling" : "Service Providing"} Shop Found!</p>
            <p className="text-xs mt-1">
              Please go to the <strong>"My Shops"</strong> tab and create a{" "}
              <strong>{isProduct ? "Product Selling Shop" : "Service Providing Shop"}</strong> first before adding items.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {/* Shop Selector */}
            <label className="form-control gap-2">
              <span className="text-xs font-semibold text-forest">Belongs to Shop *</span>
              <select name="shop" required className="select select-bordered rounded-xl bg-cream">
                <option value="">Choose a shop</option>
                {relevantShops.map((shop) => (
                  <option key={shop._id} value={shop._id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Category Selector */}
            <label className="form-control gap-2">
              <span className="text-xs font-semibold text-forest">Category *</span>
              <select name="category" required className="select select-bordered rounded-xl bg-cream">
                <option value="">Choose a category</option>
                {(categories.data?.items || []).map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <Field name="name" label="Name *" required />

            {/* Price Field with Negotiable Option */}
            <div className="form-control gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-forest">Price (BDT) *</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-700 select-none">
                  <input
                    type="checkbox"
                    name="isNegotiable"
                    checked={isNegotiable}
                    onChange={(e) => setIsNegotiable(e.target.checked)}
                    className="checkbox checkbox-xs checkbox-success rounded"
                  />
                  <span>Negotiable (আলোচনা সাপেক্ষ)</span>
                </label>
              </div>
              <div className="relative">
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="any"
                  required={!isNegotiable}
                  defaultValue={isNegotiable ? "0" : ""}
                  placeholder={isNegotiable ? "Starting price (optional, 0 if purely negotiable)" : "Enter price in BDT"}
                  className="input input-bordered w-full rounded-xl bg-cream"
                />
                {isNegotiable && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 pointer-events-none">
                    Negotiable
                  </span>
                )}
              </div>
            </div>

            {isProduct && (
              <>
                <Field name="stock" label="Stock quantity *" type="number" required />
                <label className="form-control gap-2">
                  <span className="text-xs font-semibold text-forest">Condition</span>
                  <select name="condition" className="select select-bordered rounded-xl bg-cream">
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </label>
                <Field name="discountPrice" label="Discount Price (Optional)" type="number" />
              </>
            )}

            {/* Device Multi-Image Picker (Max 5) */}
            <DeviceMultiImagePicker
              selectedFiles={selectedFiles}
              onFilesChange={setSelectedFiles}
              max={5}
            />

            <fieldset className="rounded-xl border border-slate-200 p-3 sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <legend className="px-1 text-xs font-semibold text-forest">Choose 3–10 predefined keywords *</legend>
                <input
                  type="text"
                  placeholder="Search keywords (e.g. Pizza, Burger, Sharma)..."
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  className="input input-xs input-bordered w-full sm:w-60 rounded-lg bg-cream/70 text-xs"
                />
              </div>
              <div className="grid max-h-44 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
                {keywords.map((keyword) => {
                  const isMatch = !keywordSearch || keyword.toLowerCase().includes(keywordSearch.toLowerCase());
                  return (
                    <label
                      key={keyword}
                      className={isMatch ? "flex items-center gap-2 text-xs select-none cursor-pointer hover:text-emerald-800" : "hidden"}
                    >
                      <input type="checkbox" name="keywords" value={keyword} className="checkbox checkbox-xs checkbox-success" />
                      <span>{keyword}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label className="form-control gap-2 sm:col-span-2">
              <span className="text-xs font-semibold text-forest">Description</span>
              <textarea name="description" rows="3" className="textarea textarea-bordered rounded-xl bg-cream" />
            </label>

            <button
              disabled={isSubmitting || !relevantShops.length || categories.isLoading}
              className="btn mt-3 rounded-xl border-0 bg-forest text-white sm:col-span-2"
            >
              {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : <Plus size={16} />}
              Add {title.slice(0, -1)}
            </button>
          </div>
        )}
      </form>

      {/* 3D Visiting Card Modal */}
      <ThreeDVisitingCardModal
        item={selectedVisitingItem?.item}
        shop={selectedVisitingItem?.shop}
        isOpen={!!selectedVisitingItem}
        onClose={() => setSelectedVisitingItem(null)}
        onEdit={(it) => {
          setEditingId(it._id);
        }}
      />
    </div>
  );
}

function ListingEditForm({ item, isProduct, keywords, categories, onDone }) {
  const queryClient = useQueryClient();
  const selectedCategory = String(item.category?._id || item.category || "");
  const [existingImages, setExistingImages] = useState(item.images || []);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editNegotiable, setEditNegotiable] = useState(Boolean(item.isNegotiable));
  const [editKeywordSearch, setEditKeywordSearch] = useState("");

  async function save(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    values.keywords = formData.getAll("keywords");
    if (values.keywords.length < 3 || values.keywords.length > 10) {
      toast.error("Choose between 3 and 10 keywords");
      return;
    }
    values.isNegotiable = editNegotiable;
    if (editNegotiable && (values.price === undefined || values.price === "" || isNaN(Number(values.price)))) {
      values.price = 0;
    }

    for (const field of ["price", "stock", "discount", "discountPrice"]) {
      if (values[field] !== undefined && values[field] !== "") values[field] = Number(values[field]);
      else delete values[field];
    }

    setIsSubmitting(true);
    try {
      let finalImages = [...existingImages];
      if (selectedFiles.length) {
        const uploadedNames = await uploadFilesToBackend(selectedFiles, "owners");
        finalImages = [...finalImages, ...uploadedNames];
      }

      if (isProduct && !finalImages.length) {
        toast.error("Products require at least 1 image");
        setIsSubmitting(false);
        return;
      }

      values.images = finalImages;

      await api.patch(`${isProduct ? "/products" : "/services"}/${item._id}`, values);
      await queryClient.invalidateQueries({ queryKey: [isProduct ? "/products" : "/services"] });
      toast.success("Listing updated successfully");
      onDone();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
      <Field name="name" label="Name" defaultValue={item.name} required />
      {/* Price Field with Negotiable Option */}
      <div className="form-control gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-forest">Price (BDT) *</span>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-700 select-none">
            <input
              type="checkbox"
              name="isNegotiable"
              checked={editNegotiable}
              onChange={(e) => setEditNegotiable(e.target.checked)}
              className="checkbox checkbox-xs checkbox-success rounded"
            />
            <span>Negotiable (আলোচনা সাপেক্ষ)</span>
          </label>
        </div>
        <div className="relative">
          <input
            name="price"
            type="number"
            min="0"
            step="any"
            required={!editNegotiable}
            defaultValue={item.price}
            placeholder={editNegotiable ? "Starting price (optional, 0 if purely negotiable)" : "Enter price in BDT"}
            className="input input-bordered w-full rounded-xl bg-cream"
          />
          {editNegotiable && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 pointer-events-none">
              Negotiable
            </span>
          )}
        </div>
      </div>
      {isProduct && (
        <>
          <Field name="stock" label="Stock quantity" type="number" defaultValue={item.stock} />
          <Field name="discountPrice" label="Discount price" type="number" defaultValue={item.discountPrice} />
          <label className="form-control gap-2">
            <span className="text-xs font-semibold text-forest">Condition</span>
            <select name="condition" defaultValue={item.condition} className="select select-bordered rounded-xl bg-cream">
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
            </select>
          </label>
        </>
      )}
      <label className="form-control gap-2">
        <span className="text-xs font-semibold text-forest">Category</span>
        <select name="category" required defaultValue={selectedCategory} className="select select-bordered rounded-xl bg-cream">
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {/* Device Multi-Image Picker (Max 5) */}
      <DeviceMultiImagePicker
        existingImages={existingImages}
        selectedFiles={selectedFiles}
        onFilesChange={setSelectedFiles}
        onRemoveExisting={(idx) => setExistingImages(existingImages.filter((_, i) => i !== idx))}
        max={5}
      />

      <fieldset className="rounded-xl border border-slate-200 p-3 sm:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <legend className="px-1 text-xs font-semibold text-forest">Select 3–10 predefined keywords</legend>
          <input
            type="text"
            placeholder="Search keywords (e.g. Pizza, Burger, Sharma)..."
            value={editKeywordSearch}
            onChange={(e) => setEditKeywordSearch(e.target.value)}
            className="input input-xs input-bordered w-full sm:w-60 rounded-lg bg-cream/70 text-xs"
          />
        </div>
        <div className="grid max-h-44 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
          {keywords.map((keyword) => {
            const isMatch = !editKeywordSearch || keyword.toLowerCase().includes(editKeywordSearch.toLowerCase());
            return (
              <label
                key={keyword}
                className={isMatch ? "flex items-center gap-2 text-xs select-none cursor-pointer hover:text-emerald-800" : "hidden"}
              >
                <input
                  type="checkbox"
                  name="keywords"
                  value={keyword}
                  defaultChecked={item.keywords?.includes(keyword)}
                  className="checkbox checkbox-xs checkbox-success"
                />
                <span>{keyword}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <label className="form-control gap-2 sm:col-span-2">
        <span className="text-xs font-semibold text-forest">Description</span>
        <textarea name="description" defaultValue={item.description} rows="3" className="textarea textarea-bordered rounded-xl bg-cream" />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={isSubmitting} className="btn rounded-xl border-0 bg-forest text-white">
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
        <button type="button" onClick={onDone} className="btn btn-ghost rounded-xl">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ name, label, type = "text", required = false, defaultValue }) {
  return (
    <label className="form-control gap-2">
      <span className="text-xs font-semibold text-forest">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        min={type === "number" ? "0" : undefined}
        className="input input-bordered rounded-xl bg-cream"
      />
    </label>
  );
}

// ----------------- OVERVIEW, PROFILE, WISHLIST, ETC. -----------------

function Overview({ user, stats, shops, products, services, orders, bookings, incompleteOrdersCount = 0, incompleteBookingsCount = 0, setTab }) {
  const owner = user.role === "owner";
  const customer = user.role === "customer";
  const allShops = shops.data?.items || [];
  const productShops = allShops.filter((s) => s.shopType !== "service");
  const serviceShops = allShops.filter((s) => s.shopType === "service");

  const cards =
    user.role === "admin"
      ? [
        ["Users", stats.data?.users ?? "—", Users],
        ["Shops", stats.data?.shops ?? "—", Store],
        ["Products", stats.data?.products ?? "—", Package],
      ]
      : customer
        ? [
          ["Your orders", orders.data?.items?.length ?? "—", ShoppingBag, "orders", incompleteOrdersCount],
          ["Bookings", bookings.data?.items?.length ?? "—", CalendarDays, "bookings", incompleteBookingsCount],
          ["Following", (user.following?.length || 0) + (user.followingServices?.length || 0), Users, "following"],
          ["Saved finds", user.wishlist?.length ?? 0, Heart, "wishlist"],
        ]
        : [
          ["Product Shops", productShops.length, Store, "shop"],
          ["Total Products", products.data?.items?.length ?? "—", Package, "products"],
          ["Orders", orders.data?.items?.length ?? "—", ShoppingBag, "orders", incompleteOrdersCount],
          ["Service Shops", serviceShops.length, Wrench, "shop"],
          ["Total Services", services.data?.items?.length ?? "—", Wrench, "services"],
          ["Bookings", bookings.data?.items?.length ?? "—", CalendarDays, "bookings", incompleteBookingsCount],
        ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, Icon, targetTab, pendingCount]) => (
          <div
            key={label}
            onClick={() => targetTab && setTab?.(targetTab)}
            className={`rounded-3xl bg-white p-5 shadow-sm transition hover:shadow-md ${targetTab ? "cursor-pointer hover:border-forest/20 border border-slate-50" : ""
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{label}</span>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime/50 text-forest">
                <Icon size={18} />
              </span>
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-2">
              <p className="text-3xl font-extrabold text-forest">{value}</p>
              {pendingCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 border border-rose-200">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">Live updated</p>
          </div>
        ))}
      </div>

      {owner && !allShops.length && (
        <div className="mt-6 rounded-3xl bg-forest p-7 text-white">
          <Store className="text-lime" />
          <h2 className="mt-3 text-xl font-bold">Make your businesses part of the neighborhood</h2>
          <p className="mt-2 max-w-xl text-sm text-white/65">
            Add product selling or service providing shops to LocalSphere. Upload photos directly from your device.
          </p>
          <button onClick={() => setTab("shop")} className="btn mt-5 rounded-full border-0 bg-lime text-forest font-bold">
            Create your first shop
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <QuickAction
          icon={CircleDollarSign}
          title={owner ? "Manage your shops" : "Discover somewhere new"}
          text={owner ? "View and create product and service shops." : "Explore independent businesses just around the corner."}
          href={owner ? "#" : "/shops"}
          onClick={owner ? () => setTab("shop") : undefined}
        />
        <QuickAction
          icon={CalendarDays}
          title={owner ? "Stay on top of bookings" : "See your upcoming plans"}
          text="Keep your orders and appointments organized."
          onClick={() => setTab(owner ? "bookings" : "orders")}
        />
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, text, href, onClick }) {
  const content = (
    <>
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-lime/50 text-forest">
        <Icon size={18} />
      </span>
      <span className="ml-4 flex-1">
        <strong className="block text-sm text-forest">{title}</strong>
        <span className="mt-1 block text-xs text-slate-500">{text}</span>
      </span>
      <ArrowUpRight size={17} className="text-slate-400" />
    </>
  );
  return href && href !== "#" ? (
    <Link to={href} className="flex items-center rounded-3xl bg-white p-5 shadow-sm">
      {content}
    </Link>
  ) : (
    <button onClick={onClick} className="flex items-center rounded-3xl bg-white p-5 text-left shadow-sm">
      {content}
    </button>
  );
}

function ReviewsPanel({ user }) {
  const isOwner = user?.role === "owner";
  const query = useCollection("/reviews", { mine: true });
  const [filterRating, setFilterRating] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (query.isLoading) return <Loader />;
  if (query.isError)
    return (
      <p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">
        {query.error.message}
      </p>
    );

  const allReviews = query.data?.items || [];
  const totalReviews = allReviews.length;

  const averageRating = totalReviews
    ? (allReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalReviews).toFixed(1)
    : "0.0";

  const productReviews = allReviews.filter((r) => r.product);
  const productAvgRating = productReviews.length
    ? (productReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / productReviews.length).toFixed(1)
    : "—";

  const serviceReviews = allReviews.filter((r) => r.service);
  const serviceAvgRating = serviceReviews.length
    ? (serviceReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / serviceReviews.length).toFixed(1)
    : "—";

  const fiveStarCount = allReviews.filter((r) => r.rating === 5).length;
  const fourStarCount = allReviews.filter((r) => r.rating === 4).length;
  const threeStarCount = allReviews.filter((r) => r.rating === 3).length;
  const twoOrLessCount = allReviews.filter((r) => r.rating <= 2).length;

  // Filter reviews
  const filteredReviews = allReviews.filter((review) => {
    if (filterType === "product" && !review.product) return false;
    if (filterType === "service" && !review.service) return false;

    if (filterRating !== "all") {
      const targetR = Number(filterRating);
      if (targetR === 2) {
        if (review.rating > 2) return false;
      } else if (review.rating !== targetR) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const authorName = (review.author?.name || "").toLowerCase();
      const text = (review.text || "").toLowerCase();
      const shopName = (review.shop?.name || "").toLowerCase();
      const productName = (review.product?.name || "").toLowerCase();
      const serviceName = (review.service?.name || "").toLowerCase();
      return (
        authorName.includes(q) ||
        text.includes(q) ||
        shopName.includes(q) ||
        productName.includes(q) ||
        serviceName.includes(q)
      );
    }
    return true;
  });

  return (
    <section className="space-y-6">
      {/* Top Banner & Review Metrics: Only Owner sees average rating boxes */}
      {isOwner ? (
        <div className="rounded-3xl bg-white p-6 shadow-xs border border-slate-100 flex flex-wrap items-center justify-between gap-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Star size={13} className="fill-amber-500 text-amber-500" />
              Shop Owner Ratings &amp; Feedback
            </span>
            <h2 className="text-2xl font-extrabold text-forest mt-1">Product &amp; Service Reviews</h2>
            <p className="text-xs text-slate-500 mt-1">
              Real-time ratings, reviews, and average satisfaction scores across all your products and services.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Overall Average Rating Pill */}
            <div className="rounded-2xl bg-amber-50 px-4 py-2.5 text-amber-900 border border-amber-200/80 flex items-center gap-3 shadow-2xs">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-white font-black text-lg shadow-xs">
                ★
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Overall Avg</span>
                <span className="text-lg font-extrabold text-forest">
                  {averageRating} <span className="text-xs font-medium text-slate-400">/ 5.0</span>
                </span>
              </div>
            </div>

            {/* Products Average Rating Pill */}
            <div className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-emerald-900 border border-emerald-200/80 flex items-center gap-3 shadow-2xs">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 text-white font-bold text-sm shadow-xs">
                🛍️
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Products Avg</span>
                <span className="text-lg font-extrabold text-forest">
                  {productAvgRating !== "—" ? `${productAvgRating} ★` : "—"}
                  <span className="text-[11px] font-normal text-slate-500 ml-1">({productReviews.length})</span>
                </span>
              </div>
            </div>

            {/* Services Average Rating Pill */}
            <div className="rounded-2xl bg-sky-50 px-4 py-2.5 text-sky-900 border border-sky-200/80 flex items-center gap-3 shadow-2xs">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-700 text-white font-bold text-sm shadow-xs">
                🔧
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-800 block">Services Avg</span>
                <span className="text-lg font-extrabold text-forest">
                  {serviceAvgRating !== "—" ? `${serviceAvgRating} ★` : "—"}
                  <span className="text-[11px] font-normal text-slate-500 ml-1">({serviceReviews.length})</span>
                </span>
              </div>
            </div>

            {/* Total Reviews Pill */}
            <div className="rounded-2xl bg-slate-50 px-4 py-2.5 text-slate-700 border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Feedback</span>
              <span className="text-lg font-extrabold text-forest">{totalReviews}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-6 shadow-xs border border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <Star size={13} className="fill-emerald-500 text-emerald-500" />
              My Feedback &amp; Ratings (আমার দেওয়া রিভিউ ও রেটিং)
            </span>
            <h2 className="text-2xl font-extrabold text-forest mt-1">My Submitted Reviews</h2>
            <p className="text-xs text-slate-500 mt-1">
              Browse and track all the feedback, comments, and ratings you have submitted for local shops, products, and services.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-emerald-900 border border-emerald-200/80 shadow-2xs flex items-center gap-3">
              <span className="text-lg">✍️</span>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Reviews Given</span>
                <span className="text-base font-extrabold text-forest">{totalReviews} Submitted</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-100 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews by customer name, shop, or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-forest focus:bg-white focus:outline-none"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`rounded-xl px-3 py-1.5 font-bold transition ${filterType === "all"
              ? "bg-forest text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            All Types ({totalReviews})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("product")}
            className={`rounded-xl px-3 py-1.5 font-bold transition flex items-center gap-1 ${filterType === "product"
              ? "bg-emerald-800 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            <span>🛍️ Products</span>
            <span className="opacity-80">({productReviews.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType("service")}
            className={`rounded-xl px-3 py-1.5 font-bold transition flex items-center gap-1 ${filterType === "service"
              ? "bg-sky-800 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            <span>🔧 Services</span>
            <span className="opacity-80">({serviceReviews.length})</span>
          </button>
        </div>

        {/* Rating Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs border-l border-slate-200 pl-2">
          <button
            type="button"
            onClick={() => setFilterRating("all")}
            className={`rounded-xl px-2.5 py-1.5 font-bold transition ${filterRating === "all"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            All Ratings
          </button>
          <button
            type="button"
            onClick={() => setFilterRating("5")}
            className={`rounded-xl px-2.5 py-1.5 font-bold transition flex items-center gap-1 ${filterRating === "5"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            <span>5 ★</span>
            <span className="opacity-80">({fiveStarCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterRating("4")}
            className={`rounded-xl px-2.5 py-1.5 font-bold transition flex items-center gap-1 ${filterRating === "4"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            <span>4 ★</span>
            <span className="opacity-80">({fourStarCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterRating("3")}
            className={`rounded-xl px-2.5 py-1.5 font-bold transition flex items-center gap-1 ${filterRating === "3"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            <span>3 ★</span>
            <span className="opacity-80">({threeStarCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterRating("2")}
            className={`rounded-xl px-2.5 py-1.5 font-bold transition flex items-center gap-1 ${filterRating === "2"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            <span>≤2 ★</span>
            <span className="opacity-80">({twoOrLessCount})</span>
          </button>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredReviews.map((review) => {
            const author = review.author || {};
            const authorName = author.name || "Customer";
            const authorInitial = authorName.slice(0, 1).toUpperCase();
            const avatarSrc = author.avatar ? getImageUrl(author.avatar, "customers") : null;

            return (
              <article
                key={review._id}
                className="rounded-3xl bg-white p-5 shadow-xs border border-slate-100 flex flex-col justify-between hover:shadow-md transition duration-200"
              >
                <div>
                  {/* Top Bar: Reviewer profile & Stars */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    {/* Reviewer Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={authorName}
                          className="h-11 w-11 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-forest text-sm font-extrabold text-white shadow-2xs shrink-0">
                          {authorInitial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="truncate font-bold text-slate-900 text-sm">{authorName}</h4>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 shrink-0">
                            Verified Customer
                          </span>
                        </div>
                        <time className="block text-[11px] text-slate-400 mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={
                              star <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-slate-100 text-slate-300"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-extrabold text-forest mt-0.5">
                        {review.rating}.0 / 5.0
                      </span>
                    </div>
                  </div>

                  {/* Item Reviewed Badge */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {review.product?.name && (
                      !isOwner ? (
                        <Link
                          to={`/products/${review.product._id || review.product}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200 shadow-2xs hover:bg-emerald-100 hover:border-emerald-400 hover:scale-[1.02] transition cursor-pointer group/item"
                          title={`Explore product: ${review.product.name}`}
                        >
                          <ShoppingBag size={12} className="shrink-0 text-emerald-700" />
                          <span className="group-hover/item:underline">Product: {review.product.name}</span>
                          <ArrowUpRight size={11} className="opacity-70 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-100">
                          <ShoppingBag size={12} className="shrink-0" />
                          <span>Product: {review.product.name}</span>
                        </span>
                      )
                    )}
                    {review.service?.name && (
                      !isOwner ? (
                        <Link
                          to={`/services/${review.service._id || review.service}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 border border-amber-200 shadow-2xs hover:bg-amber-100 hover:border-amber-400 hover:scale-[1.02] transition cursor-pointer group/item"
                          title={`Explore service: ${review.service.name}`}
                        >
                          <Wrench size={12} className="shrink-0 text-amber-700" />
                          <span className="group-hover/item:underline">Service: {review.service.name}</span>
                          <ArrowUpRight size={11} className="opacity-70 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 border border-amber-100">
                          <Wrench size={12} className="shrink-0" />
                          <span>Service: {review.service.name}</span>
                        </span>
                      )
                    )}
                    {review.shop?.name && (
                      !isOwner ? (
                        <Link
                          to={`/shops/${review.shop.slug || review.shop._id || review.shop}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-100 hover:border-slate-300 hover:scale-[1.02] transition cursor-pointer group/item"
                          title={`Explore shop: ${review.shop.name}`}
                        >
                          <Store size={12} className="shrink-0 text-slate-600" />
                          <span className="group-hover/item:underline">Shop: {review.shop.name}</span>
                          <ArrowUpRight size={11} className="opacity-70 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
                          <Store size={12} className="shrink-0" />
                          <span>Shop: {review.shop.name}</span>
                        </span>
                      )
                    )}
                  </div>

                  {/* Review Text / Feedback */}
                  <div className="mt-3 rounded-2xl bg-slate-50/80 p-3.5 text-xs text-slate-700 italic border border-slate-100/80 leading-relaxed">
                    "{review.text || "No written comment provided."}"
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-12 text-center shadow-xs border border-slate-100">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <Star size={28} className="fill-amber-400" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-forest">No reviews found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            {searchQuery || filterRating !== "all"
              ? "No reviews match your selected filter. Try changing your search or rating filter."
              : isOwner
                ? "Reviews submitted by customers will appear here once they review your shop, products, or services."
                : "You haven't submitted any reviews yet. Share your experience on shop, product, or service pages!"}
          </p>
        </div>
      )}
    </section>
  );
}

function CustomersPanel({ ordersQuery, bookingsQuery, setTab }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'product', 'service'

  if (ordersQuery?.isLoading || bookingsQuery?.isLoading) return <Loader />;
  if (ordersQuery?.isError)
    return (
      <p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">
        {ordersQuery.error.message}
      </p>
    );
  if (bookingsQuery?.isError)
    return (
      <p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">
        {bookingsQuery.error.message}
      </p>
    );

  // Strictly filter for completed/delivered status:
  // Customers appear ONLY when they have already received the product or service!
  const isDeliveredOrder = (o) => {
    const s = String(o?.status || "").toLowerCase();
    return s === "completed" || s === "delivered";
  };

  const isCompletedBooking = (b) => {
    const s = String(b?.status || "").toLowerCase();
    return s === "completed" || s === "delivered" || s === "provided";
  };

  const customerMap = new Map();

  // Process only delivered product orders
  for (const order of ordersQuery?.data?.items || []) {
    if (!isDeliveredOrder(order)) continue;
    const cust = order.customer;
    if (!cust?._id) continue;
    const cid = String(cust._id);
    if (!customerMap.has(cid)) {
      customerMap.set(cid, {
        customer: cust,
        totalSpent: 0,
        orders: [],
        bookings: [],
        deliveryAddresses: new Set(),
        shops: new Set(),
      });
    }
    const entry = customerMap.get(cid);
    const amount = Number(order.total || order.subtotal || 0) + Number(order.deliveryCharge || 0);
    entry.totalSpent += amount;
    entry.orders.push(order);
    if (order.shop?.name) entry.shops.add(order.shop.name);
    if (order.deliveryAddress) {
      const addrStr = [
        order.deliveryAddress.street,
        order.deliveryAddress.area,
        order.deliveryAddress.subDistrict,
        order.deliveryAddress.district,
        order.deliveryAddress.city,
      ]
        .filter(Boolean)
        .join(", ");
      if (addrStr) entry.deliveryAddresses.add(addrStr);
    }
  }

  // Process only completed service bookings
  for (const booking of bookingsQuery?.data?.items || []) {
    if (!isCompletedBooking(booking)) continue;
    const cust = booking.customer;
    if (!cust?._id) continue;
    const cid = String(cust._id);
    if (!customerMap.has(cid)) {
      customerMap.set(cid, {
        customer: cust,
        totalSpent: 0,
        orders: [],
        bookings: [],
        deliveryAddresses: new Set(),
        shops: new Set(),
      });
    }
    const entry = customerMap.get(cid);
    entry.totalSpent += Number(booking.price || 0);
    entry.bookings.push(booking);
    if (booking.shop?.name) entry.shops.add(booking.shop.name);
  }

  const allCustomerList = [...customerMap.values()];
  const totalRevenue = allCustomerList.reduce((acc, c) => acc + c.totalSpent, 0);
  const totalDeliveredOrders = allCustomerList.reduce((acc, c) => acc + c.orders.length, 0);
  const totalCompletedBookings = allCustomerList.reduce((acc, c) => acc + c.bookings.length, 0);

  // Filter customers by type & search
  const filteredCustomers = allCustomerList.filter(
    ({ customer, orders, bookings, deliveryAddresses, shops }) => {
      if (filterType === "product" && orders.length === 0) return false;
      if (filterType === "service" && bookings.length === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (customer.name || "").toLowerCase();
        const email = (customer.email || "").toLowerCase();
        const phone = (
          customer.phone ||
          orders.find((o) => o.deliveryAddress?.phone)?.deliveryAddress?.phone ||
          ""
        ).toLowerCase();
        const addrs = [...deliveryAddresses].join(" ").toLowerCase();
        const shopNames = [...shops].join(" ").toLowerCase();
        const orderItems = orders
          .flatMap((o) => o.items || [])
          .map((i) => i.name || "")
          .join(" ")
          .toLowerCase();
        const serviceNames = bookings
          .map((b) => b.service?.name || "")
          .join(" ")
          .toLowerCase();

        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          addrs.includes(q) ||
          shopNames.includes(q) ||
          orderItems.includes(q) ||
          serviceNames.includes(q)
        );
      }
      return true;
    }
  );

  return (
    <section className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white p-6 shadow-xs border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Delivered Orders & Completed Services
          </span>
          <h2 className="text-2xl font-extrabold text-forest mt-1">Shop Customers & Past Clients</h2>
          <p className="text-xs text-slate-500 mt-1">
            Customers who have received products or completed service appointments from your shops.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-emerald-900 border border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Total Customers</span>
            <span className="text-base font-extrabold">{allCustomerList.length}</span>
          </div>
          <div className="rounded-2xl bg-lime/20 px-4 py-2.5 text-forest border border-lime/40">
            <span className="text-[10px] uppercase font-bold text-forest/70 block">Completed Sales</span>
            <span className="text-base font-extrabold">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-2.5 text-slate-700 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Delivered · Completed</span>
            <span className="text-base font-extrabold">
              {totalDeliveredOrders} 🛍️ · {totalCompletedBookings} 🛠️
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      {allCustomerList.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-xs border border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone, address, product, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-forest focus:bg-white focus:outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`rounded-xl px-3 py-1.5 font-bold transition ${filterType === "all"
                ? "bg-forest text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              All ({allCustomerList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("product")}
              className={`rounded-xl px-3 py-1.5 font-bold transition flex items-center gap-1 ${filterType === "product"
                ? "bg-forest text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              <span>🛍️ Products</span>
              <span className="opacity-80">
                ({allCustomerList.filter((c) => c.orders.length > 0).length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("service")}
              className={`rounded-xl px-3 py-1.5 font-bold transition flex items-center gap-1 ${filterType === "service"
                ? "bg-forest text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              <span>🛠️ Services</span>
              <span className="opacity-80">
                ({allCustomerList.filter((c) => c.bookings.length > 0).length})
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Cards List */}
      {filteredCustomers.length ? (
        <div className="space-y-5">
          {filteredCustomers.map(({ customer, totalSpent, orders, bookings, deliveryAddresses }) => {
            const initials = (customer.name || "Customer")
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            const locationStr =
              [customer.address, customer.area, customer.subDistrict, customer.district]
                .filter(Boolean)
                .join(", ") ||
              [...deliveryAddresses][0] ||
              "Address not provided";
            const phoneStr =
              customer.phone || orders.find((o) => o.deliveryAddress?.phone)?.deliveryAddress?.phone;

            return (
              <article
                key={customer._id}
                className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition hover:shadow-md"
              >
                {/* Customer Top Bar */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-forest text-lg font-black text-white shadow-xs">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-forest">{customer.name}</h3>
                        <span className="rounded-full bg-emerald-100/80 px-2 py-0.5 text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          Verified Buyer
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        {phoneStr && (
                          <a
                            href={`tel:${phoneStr}`}
                            className="flex items-center gap-1 font-semibold text-slate-700 hover:text-emerald-700"
                          >
                            📞 {phoneStr}
                          </a>
                        )}
                        <a
                          href={`mailto:${customer.email}`}
                          className="flex items-center gap-1 hover:text-emerald-700"
                        >
                          ✉️ {customer.email}
                        </a>
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <MapPin size={12} /> {locationStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Total Metrics for this Customer */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Total Completed
                      </span>
                      <span className="text-lg font-extrabold text-forest">
                        {formatCurrency(totalSpent)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivered Products & Completed Services Breakdown */}
                <div className="mt-4 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Completed Deliveries & Services ({orders.length} Delivered Orders ·{" "}
                    {bookings.length} Services Provided)
                  </span>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Delivered Product Orders */}
                    {orders.map((order) => {
                      const orderTotal =
                        Number(order.total || order.subtotal || 0) +
                        (order.deliveryCharge ? Number(order.deliveryCharge) : 0);
                      const deliveredDate = order.updatedAt || order.createdAt;

                      return (
                        <div
                          key={order._id}
                          className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 text-xs space-y-2.5"
                        >
                          {/* Order Badge & Shop Name */}
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800 text-[11px]">
                              🛍️ Product Delivered
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => printOrderInvoice(order)}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-2xs hover:bg-forest hover:text-white transition"
                                title="Print invoice"
                              >
                                <Printer size={10} /> Print
                              </button>
                              <span className="font-bold text-slate-700 flex items-center gap-1">
                                <Store size={12} className="text-emerald-600" />
                                {order.shop?.name || "Shop"}
                              </span>
                            </div>
                          </div>

                          {/* Products List & Quantities */}
                          <div className="rounded-xl bg-white p-2.5 border border-slate-100 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              Products Taken:
                            </span>
                            {order.items?.map((line, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center font-medium text-slate-800"
                              >
                                <span className="font-semibold">
                                  {line.name}{" "}
                                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                                    × {line.quantity} pcs
                                  </span>
                                </span>
                                <span>{formatCurrency(line.unitPrice * line.quantity)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Order Total & Payment */}
                          <div className="border-t border-slate-200/60 pt-2 flex items-center justify-between text-slate-600 font-semibold">
                            <span>Total Paid:</span>
                            <span className="font-bold text-forest">{formatCurrency(orderTotal)}</span>
                          </div>

                          {/* Delivery Date & Location */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>
                              📅 Delivered:{" "}
                              {new Date(deliveredDate).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {order.deliveryAddress?.area && (
                              <span className="truncate max-w-[160px] text-slate-500 font-medium">
                                📍 {order.deliveryAddress.area},{" "}
                                {order.deliveryAddress.district || order.deliveryAddress.city}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Completed Service Bookings */}
                    {bookings.map((booking) => {
                      const completedDate = booking.scheduledAt || booking.updatedAt;

                      return (
                        <div
                          key={booking._id}
                          className="rounded-2xl border border-amber-100 bg-amber-50/20 p-4 text-xs space-y-2.5"
                        >
                          {/* Service Badge & Shop */}
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-0.5 font-bold text-amber-900 text-[11px]">
                              🛠️ Service Provided
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => printBookingVoucher(booking)}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-2xs hover:bg-forest hover:text-white transition"
                                title="Print voucher"
                              >
                                <Printer size={10} /> Print
                              </button>
                              <span className="font-bold text-slate-700 flex items-center gap-1">
                                <Store size={12} className="text-amber-600" />
                                {booking.shop?.name || "Shop"}
                              </span>
                            </div>
                          </div>

                          {/* Service Details */}
                          <div className="rounded-xl bg-white p-2.5 border border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              Service Taken:
                            </span>
                            <div className="font-bold text-forest text-sm flex items-center gap-1.5">
                              <Wrench size={13} className="text-amber-600" />
                              {booking.service?.name || "Service Appointment"}
                            </div>
                            <div className="flex justify-between items-center text-slate-600 pt-1">
                              <span>Service Fee:</span>
                              <span className="font-bold text-forest">{formatCurrency(booking.price)}</span>
                            </div>
                          </div>

                          {booking.notes && (
                            <p className="rounded-lg bg-white/90 p-2 text-[11px] text-slate-600 italic border border-amber-100">
                              "{booking.notes}"
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>
                              📅 Completed:{" "}
                              {new Date(completedDate).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="text-emerald-700 font-semibold">✓ Service Done</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-12 text-center shadow-xs border border-slate-100">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Users size={28} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-forest">
            {searchQuery ? "No matching customers found" : "No completed customers yet"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? "No customers match your search query. Try searching by another name or phone number."
              : "Customers will automatically appear here once you deliver their product orders or complete their service appointments (status: Completed)."}
          </p>
          {!searchQuery && (
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setTab("orders")}
                className="btn btn-sm rounded-xl border-0 bg-forest text-white hover:bg-forest/90"
              >
                View Pending Orders
              </button>
              <button
                type="button"
                onClick={() => setTab("bookings")}
                className="btn btn-sm rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                View Bookings
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}


function ReportManagement() {
  const query = useCollection("/reports", { limit: 200 });
  const queryClient = useQueryClient();
  async function update(report, status) {
    try {
      await api.patch(`/reports/${report._id}`, { status });
      await queryClient.invalidateQueries({ queryKey: ["/reports"] });
      toast.success(`Report ${status}`);
    } catch (error) {
      toast.error(error.message);
    }
  }
  if (query.isLoading) return <Loader />;
  if (query.isError)
    return <p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">{query.error.message}</p>;
  return (
    <section className="space-y-3">
      {query.data?.items?.length ? (
        query.data.items.map((report) => (
          <article key={report._id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-forest">
                  {report.target?.name || "Unavailable listing"} · {report.targetType}
                </p>
                <p className="mt-1 text-sm text-slate-600">{report.reason}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Reported by {report.reporter?.name || "Unknown"} · {report.status}
                </p>
              </div>
              {report.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => update(report, "reviewed")} className="btn btn-sm rounded-xl">
                    Mark reviewed
                  </button>
                  <button onClick={() => update(report, "dismissed")} className="btn btn-sm rounded-xl">
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">No reports have been submitted.</p>
      )}
    </section>
  );
}

function ProfileSettings({ user, updateProfile }) {
  const categories = useCollection("/categories", { type: "shop", limit: 100 });
  const [location, setLocation] = useState({
    district: user.district || "",
    subDistrict: user.subDistrict || "",
    area: user.area || "",
    address: user.address || "",
    extendedAddress: user.extendedAddress || "",
  });
  const [selectedCategories, setSelectedCategories] = useState((user.shopCategories || []).map(String));
  async function save(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (user.role === "owner" && (!selectedCategories.length || selectedCategories.length > 10)) {
      toast.error("Choose between 1 and 10 business categories");
      return;
    }
    try {
      await updateProfile({
        ...values,
        ...location,
        ...(user.role === "owner" ? { shopCategories: selectedCategories } : {}),
      });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.message);
    }
  }
  return (
    <div className="space-y-5">
      <form onSubmit={save} className="space-y-5 rounded-3xl bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            {user.role === "owner" ? "Shop Owner Account" : "Customer Account"}
          </p>
          <h2 className="mt-2 text-xl font-bold text-forest">Profile information</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="name" label="Name" defaultValue={user.name} required />
          <Field name="email" label="Email" type="email" defaultValue={user.email} required />
          <Field name="phone" label="Phone" defaultValue={user.phone} />
        </div>
        <LocationFields value={location} onChange={setLocation} addressRequired={user.role === "owner"} />
        {user.role === "owner" && (
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-forest">Business categories</legend>
            {categories.isError ? (
              <p role="alert" className="text-xs text-red-700">{categories.error.message}</p>
            ) : (
              <div className="grid max-h-40 grid-cols-2 gap-2 overflow-auto">
                {(categories.data?.items || []).map((category) => (
                  <label key={category._id} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category._id)}
                      onChange={(event) =>
                        setSelectedCategories((current) =>
                          event.target.checked
                            ? [...current, category._id]
                            : current.filter((id) => id !== category._id)
                        )
                      }
                      className="checkbox checkbox-sm checkbox-success"
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        )}
        <button className="btn rounded-xl border-0 bg-forest text-white">Save profile</button>
      </form>
      <PasswordSettings />
    </div>
  );
}

function PasswordSettings() {
  async function save(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      await api.patch("/users/me/password", values);
      form.reset();
      toast.success("Password updated");
    } catch (error) {
      toast.error(error.message);
    }
  }
  return (
    <form onSubmit={save} className="grid gap-3 rounded-3xl bg-white p-6 shadow-sm sm:grid-cols-2">
      <h2 className="font-bold text-forest sm:col-span-2">Change password</h2>
      <Field name="currentPassword" label="Current password" type="password" required />
      <Field name="newPassword" label="New password (at least 10 characters)" type="password" required />
      <button className="btn rounded-xl border-0 bg-forest text-white sm:col-span-2">Update password</button>
    </form>
  );
}

function DiscoveryHistory() {
  const query = useCollection("/users/history");
  if (query.isLoading) return <Loader />;
  if (query.isError)
    return <p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">{query.error.message}</p>;
  const viewed = query.data?.recentlyViewed || [];
  const searches = query.data?.searchHistory || [];
  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-forest">Recently viewed products</h2>
        {viewed.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {viewed.map((item) => (
              <Link key={item._id} to={`/products/${item._id}`} className="flex items-center gap-3 rounded-xl bg-cream p-3">
                {item.images?.[0] && (
                  <img src={getImageUrl(item.images[0])} alt="" className="h-14 w-14 rounded-lg object-cover" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-forest">{item.name}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {item.shop?.name || item.shop?.area || ""}
                  </span>
                </span>
                <span className="text-xs font-bold text-forest">
                  {formatCurrency(item.discountPrice || item.price)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Products you open will appear here.</p>
        )}
      </section>
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-forest">Recent searches</h2>
        {searches.length ? (
          <ul className="space-y-2">
            {searches.map((entry, index) => (
              <li key={`${entry.query}-${entry.searchedAt}-${index}`}>
                <Link
                  to={`/search?q=${encodeURIComponent(entry.query)}`}
                  className="flex justify-between rounded-xl bg-cream px-4 py-3 text-sm text-forest"
                >
                  <span>{entry.query}</span>
                  <time className="text-xs text-slate-400">{new Date(entry.searchedAt).toLocaleDateString()}</time>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Your recent searches will appear here.</p>
        )}
      </section>
    </div>
  );
}

function WishlistPanel({ toggleWishlist }) {
  const query = useCollection("/users/wishlist");
  const queryClient = useQueryClient();
  async function remove(productId) {
    try {
      await toggleWishlist(productId);
      await queryClient.invalidateQueries({ queryKey: ["/users/wishlist"] });
      toast.success("Removed from your wishlist");
    } catch (error) {
      toast.error(error.message);
    }
  }
  if (query.isLoading) return <Loader />;
  if (query.isError)
    return <p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">{query.error.message}</p>;
  const items = query.data?.items || [];
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="mb-5 font-bold text-forest">Saved products</h2>
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <article key={item._id} className="flex gap-4 rounded-2xl bg-cream p-4">
              {item.images?.[0] && (
                <img src={getImageUrl(item.images[0])} alt="" className="h-20 w-20 rounded-xl object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <Link to={`/products/${item._id}`} className="font-semibold text-forest">
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-slate-500">{formatCurrency(item.price)}</p>
                <button onClick={() => remove(item._id)} className="mt-2 text-xs font-semibold text-red-600">
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-cream p-8 text-center text-sm text-slate-500">
          Save products as you explore to keep them close.
          <Link to="/products" className="btn mt-4 block rounded-full border-0 bg-forest text-white">
            Browse products
          </Link>
        </div>
      )}
    </section>
  );
}

function FollowingPanel({ followShop, followService }) {
  const query = useCollection("/users/following");
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  async function handleUnfollowShop(shopId) {
    try {
      await followShop(shopId);
      await queryClient.invalidateQueries({ queryKey: ["/users/following"] });
      toast.success("Shop unfollowed");
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleUnfollowService(serviceId) {
    try {
      await followService(serviceId);
      await queryClient.invalidateQueries({ queryKey: ["/users/following"] });
      toast.success("Service unfollowed");
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (query.isLoading) return <Loader />;
  if (query.isError)
    return <p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">{query.error.message}</p>;

  const shops = query.data?.shops || [];
  const services = query.data?.services || [];
  const totalCount = query.data?.totalCount || (shops.length + services.length);

  const displayedShops = filter === "services" ? [] : shops;
  const displayedServices = filter === "shops" ? [] : services;
  const hasItems = displayedShops.length > 0 || displayedServices.length > 0;

  return (
    <section className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-white p-6 shadow-xs border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <Users size={14} className="text-emerald-600" />
            My Followed Businesses &amp; Services (আমার ফলো করা শপ ও সার্ভিস)
          </span>
          <h2 className="text-2xl font-extrabold text-forest mt-1">Following List</h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse and stay updated with your favorite neighborhood shops and trusted service providers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-emerald-900 border border-emerald-200/80 shadow-2xs flex items-center gap-2.5">
            <span className="text-lg">👥</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Following</span>
              <span className="text-base font-extrabold text-forest">{totalCount} {totalCount === 1 ? "Item" : "Items"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${filter === "all" ? "bg-forest text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
        >
          All ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("shops")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${filter === "shops" ? "bg-emerald-700 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
        >
          <Store size={13} /> Followed Shops ({shops.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("services")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${filter === "services" ? "bg-sky-700 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
        >
          <Wrench size={13} /> Followed Services ({services.length})
        </button>
      </div>

      {/* Grid of Followed Items */}
      {hasItems ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayedShops.map((shop) => (
            <article
              key={shop._id}
              className="rounded-3xl bg-white p-5 shadow-xs border border-slate-100 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 overflow-hidden flex items-center justify-center shrink-0">
                      {shop.logo ? (
                        <img src={getImageUrl(shop.logo)} alt={shop.name} className="h-full w-full object-cover" />
                      ) : (
                        <Store size={22} className="text-emerald-700" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-forest text-base truncate flex items-center gap-1.5">
                        {shop.name}
                        {shop.verified && <BadgeCheck size={14} className="text-emerald-600 shrink-0" />}
                      </h4>
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {[shop.area, shop.subDistrict, shop.district].filter(Boolean).join(", ") || "Local"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 shrink-0">
                    🏪 Shop
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-semibold text-forest">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    {Number(shop.rating || 0).toFixed(1)} ({shop.reviewCount || 0})
                  </span>
                  <span className="flex items-center gap-1 text-sky-800 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                    <Users size={11} className="text-sky-700" /> {shop.followers?.length || 0} followers
                  </span>
                </div>

                {shop.description && (
                  <p className="mt-2.5 text-xs text-slate-500 line-clamp-2">
                    {shop.description}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <Link
                  to={`/shops/${shop.slug || shop._id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                >
                  Explore Shop →
                </Link>
                <button
                  type="button"
                  onClick={() => handleUnfollowShop(shop._id)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition cursor-pointer"
                >
                  Unfollow
                </button>
              </div>
            </article>
          ))}

          {displayedServices.map((service) => (
            <article
              key={service._id}
              className="rounded-3xl bg-white p-5 shadow-xs border border-slate-100 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-2xl bg-sky-50 border border-sky-100 overflow-hidden flex items-center justify-center shrink-0">
                      {service.images?.[0] ? (
                        <img src={getImageUrl(service.images[0])} alt={service.name} className="h-full w-full object-cover" />
                      ) : (
                        <Wrench size={22} className="text-sky-700" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-forest text-base truncate">
                        {service.name}
                      </h4>
                      {service.shop?.name && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          By: {service.shop.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200 shrink-0">
                    🔧 Service
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                  <span className="font-bold text-forest">
                    {service.isNegotiable && (!service.price || service.price === 0)
                      ? "Negotiable"
                      : formatCurrency(service.price)}
                  </span>
                  <span className="flex items-center gap-1 text-sky-800 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                    <Users size={11} className="text-sky-700" /> {service.followers?.length || 0} followers
                  </span>
                </div>

                {service.description && (
                  <p className="mt-2.5 text-xs text-slate-500 line-clamp-2">
                    {service.description}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <Link
                  to={`/services/${service._id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline"
                >
                  Explore Service →
                </Link>
                <button
                  type="button"
                  onClick={() => handleUnfollowService(service._id)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition cursor-pointer"
                >
                  Unfollow
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-12 text-center shadow-xs border border-slate-100">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sky-50 text-sky-600">
            <Users size={28} className="text-sky-600" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-forest">No followed items found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            {filter !== "all"
              ? `You haven't followed any ${filter} yet.`
              : "You haven't followed any shops or services yet. Explore businesses in your neighborhood and follow them to see their latest updates!"}
          </p>
          <Link
            to="/shops"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-forest px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-forest/90 transition"
          >
            Explore Neighborhood Shops →
          </Link>
        </div>
      )}
    </section>
  );
}

function DataList({ title, query, type, user, onUpdate, onRefund, onReconcileRefund }) {
  const queryClient = useQueryClient();
  const [refundReasons, setRefundReasons] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [bookingPriceInput, setBookingPriceInput] = useState("");
  const [savingBookingPrice, setSavingBookingPrice] = useState(false);

  async function handleSaveBookingPrice(item) {
    const val = Number(bookingPriceInput);
    if (Number.isNaN(val) || val < 0) {
      toast.error("Please enter a valid non-negative amount");
      return;
    }
    setSavingBookingPrice(true);
    try {
      await api.patch(`/bookings/${item._id}`, { price: val });
      await queryClient.invalidateQueries({ queryKey: ["/bookings"] });
      toast.success(`Booking service fee updated to BDT ${val}`);
      setEditingBookingId(null);
      setBookingPriceInput("");
    } catch (err) {
      toast.error(err.message || "Failed to update booking fee");
    } finally {
      setSavingBookingPrice(false);
    }
  }

  if (query.isLoading) return <Loader />;
  const rawRows = query.data?.items || [];

  const sortedRows = useMemo(() => {
    if (type === "bookings") {
      const priority = { pending: 0, accepted: 1, completed: 2, cancelled: 3, rejected: 4 };
      return [...rawRows].sort((a, b) => {
        const pA = priority[a.status] ?? 99;
        const pB = priority[b.status] ?? 99;
        if (pA !== pB) return pA - pB;
        if (a.status === "pending") {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (a.status === "accepted") {
          return new Date(a.scheduledAt || 0) - new Date(b.scheduledAt || 0);
        }
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      });
    }
    if (type === "orders") {
      const orderPriority = { placed: 0, accepted: 1, preparing: 2, ready: 3, out_for_delivery: 4, completed: 5, cancelled: 6 };
      return [...rawRows].sort((a, b) => {
        const pA = orderPriority[a.status] ?? 99;
        const pB = orderPriority[b.status] ?? 99;
        if (pA !== pB) return pA - pB;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    }
    return rawRows;
  }, [rawRows, type]);

  const filterTabs = useMemo(() => {
    if (type === "bookings") {
      return [
        { id: "all", label: "All Bookings", count: sortedRows.length },
        { id: "pending", label: "Pending", count: sortedRows.filter((b) => b.status === "pending").length },
        { id: "accepted", label: "Accepted", count: sortedRows.filter((b) => b.status === "accepted").length },
        { id: "completed", label: "Completed", count: sortedRows.filter((b) => b.status === "completed").length },
        { id: "cancelled", label: "Cancelled / Rejected", count: sortedRows.filter((b) => ["cancelled", "rejected"].includes(b.status)).length },
      ];
    }
    if (type === "orders") {
      return [
        { id: "all", label: "All Orders", count: sortedRows.length },
        { id: "placed", label: "New (Placed)", count: sortedRows.filter((o) => o.status === "placed").length },
        { id: "active", label: "In Progress", count: sortedRows.filter((o) => ["accepted", "preparing", "ready", "out_for_delivery"].includes(o.status)).length },
        { id: "completed", label: "Completed", count: sortedRows.filter((o) => o.status === "completed").length },
        { id: "cancelled", label: "Cancelled", count: sortedRows.filter((o) => o.status === "cancelled").length },
      ];
    }
    return [];
  }, [sortedRows, type]);

  const rows = useMemo(() => {
    if (statusFilter === "all") return sortedRows;
    if (type === "bookings") {
      if (statusFilter === "cancelled") return sortedRows.filter((b) => ["cancelled", "rejected"].includes(b.status));
      return sortedRows.filter((b) => b.status === statusFilter);
    }
    if (type === "orders") {
      if (statusFilter === "active") return sortedRows.filter((o) => ["accepted", "preparing", "ready", "out_for_delivery"].includes(o.status));
      return sortedRows.filter((o) => o.status === statusFilter);
    }
    return sortedRows;
  }, [sortedRows, statusFilter, type]);

  const transitions = (item) => {
    if (type === "orders") {
      const next = {
        placed: ["accepted", "cancelled"],
        accepted: ["preparing", "cancelled"],
        preparing: ["ready", "cancelled"],
        ready:
          user.role === "owner" && item.fulfillment === "delivery"
            ? ["out_for_delivery", "completed", "cancelled"]
            : ["completed", "cancelled"],
        out_for_delivery: ["completed", "cancelled"],
      }[item.status] || [];
      return user.role === "customer"
        ? next.filter((status) => status === "cancelled" && ["placed", "accepted"].includes(item.status))
        : next;
    }
    if (type === "bookings") {
      if (user.role === "owner")
        return item.status === "pending" ? ["accepted", "rejected"] : item.status === "accepted" ? ["completed"] : [];
      if (user.role === "customer") return ["pending", "accepted"].includes(item.status) ? ["cancelled"] : [];
    }
    return [];
  };

  function handlePrint(item) {
    if (type === "orders") {
      printOrderInvoice(item);
    } else {
      printBookingVoucher(item);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-extrabold text-forest">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {type === "orders" ? "Manage and fulfill product orders from your customers" : "Manage appointments and service bookings"}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          {rows.length} {type === "orders" ? "Orders" : "Bookings"}
        </span>
      </div>

      {filterTabs.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${isActive
                  ? "bg-forest text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-forest"
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${isActive
                    ? "bg-white/20 text-white"
                    : (tab.id === "pending" || tab.id === "placed") && tab.count > 0
                      ? "bg-amber-100 text-amber-900 font-extrabold"
                      : "bg-white text-slate-600"
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {query.isError ? (
        <p className="text-sm text-red-600">{query.error.message}</p>
      ) : rows.length ? (
        <div className="space-y-4">
          {rows.map((item) => {
            const actions = transitions(item);
            const customerObj = item.customer;
            const customerInitials = (customerObj?.name || "Customer").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

            const isOrder = type === "orders";
            const deliveryFee = isOrder ? Number(item.deliveryCharge || (item.fulfillment === "delivery" ? 70 : 0)) : 0;
            const grandTotal = isOrder ? Number(item.total || (Number(item.subtotal || 0) + deliveryFee)) : Number(item.price || 0);

            const deliveryAddressStr = item.deliveryAddress
              ? [
                item.deliveryAddress.street,
                item.deliveryAddress.area,
                item.deliveryAddress.subDistrict,
                item.deliveryAddress.district || item.deliveryAddress.city,
              ].filter(Boolean).join(", ")
              : customerObj
                ? [customerObj.area, customerObj.subDistrict, customerObj.district].filter(Boolean).join(", ")
                : "Not provided";

            const deliveryContactPhone = item.deliveryAddress?.phone || customerObj?.phone;

            return (
              <div
                key={item._id}
                className={`rounded-2xl border bg-white p-5 shadow-2xs transition ${item.status === "pending" || item.status === "placed"
                  ? "border-amber-300 ring-1 ring-amber-400/20 bg-gradient-to-r from-amber-50/20 to-white"
                  : "border-slate-200/80 hover:border-forest/30"
                  }`}
              >
                {/* Header Row: ID, Shop, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      #{item._id?.slice(-6).toUpperCase()}
                    </span>
                    <span className="font-semibold text-forest text-sm">
                      {item.shop?.name || (isOrder ? "Product Shop" : "Service Shop")}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock size={12} />
                      {new Date(item.createdAt || item.scheduledAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold capitalize ${item.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                      item.status === "cancelled" || item.status === "rejected" ? "bg-red-100 text-red-800" :
                        item.status === "preparing" || item.status === "out_for_delivery" ? "bg-blue-100 text-blue-800" :
                          "bg-amber-100 text-amber-800"
                      }`}>
                      {item.status?.replaceAll("_", " ")}
                    </span>

                    {isOrder && (
                      <>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 capitalize">
                          {item.fulfillment === "delivery" ? "🚚 Delivery" : "🏪 Pickup"}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 uppercase">
                          {item.paymentMethod === "bkash" ? `bKash (${item.paymentStatus})` : "COD"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Middle Section: Customer Details & Items Details */}
                <div className="grid gap-4 py-4 md:grid-cols-2">
                  {/* Left Column: Customer Profile & Delivery Location */}
                  <div className="rounded-xl bg-slate-50/70 p-3.5 border border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Customer Details (কাস্টমার তথ্য)
                      </span>

                      {/* INBOX ICON BUTTON NEXT TO CUSTOMER */}
                      {customerObj?._id && (
                        <Link
                          to={`/messages?with=${customerObj._id}`}
                          title={`Chat with ${customerObj.name || "customer"} in Inbox`}
                          className="btn btn-xs rounded-xl border border-forest/30 bg-white text-forest hover:bg-forest hover:text-white flex items-center gap-1 shadow-2xs transition"
                        >
                          <Mail size={13} />
                          <span>Inbox</span>
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest text-sm font-bold text-white">
                        {customerInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-forest text-sm truncate">{customerObj?.name || "Customer"}</p>
                        <p className="text-xs text-slate-500 truncate">{customerObj?.email}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-200/50">
                      {deliveryContactPhone && (
                        <p className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Phone size={12} className="text-forest" />
                          <span>Contact: <strong>{deliveryContactPhone}</strong></span>
                        </p>
                      )}

                      <p className="flex items-start gap-1.5">
                        <MapPin size={12} className="text-forest mt-0.5 shrink-0" />
                        <span>
                          <strong className="text-slate-800">
                            {isOrder ? "Delivery Destination:" : "Customer Location:"}
                          </strong>{" "}
                          {deliveryAddressStr}
                        </span>
                      </p>

                      {isOrder && item.fulfillment === "delivery" && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="rounded bg-emerald-100/70 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            {item.deliveryZone === "inside_dhaka" ? "ঢাকা মেট্রো (Inside Dhaka · ৳70)" :
                              item.deliveryZone === "dhaka_suburbs" ? "ঢাকার কাছাকাছি (Suburbs · ৳100)" :
                                item.deliveryZone === "outside_dhaka" ? "ঢাকার বাইরে (Outside Dhaka · ৳150)" :
                                  "Delivery Zone"}
                          </span>
                        </div>
                      )}

                      {!isOrder && (
                        <p className="text-[11px] text-amber-700 italic pt-1">
                          ℹ️ No delivery charge for services · Communicate location & details directly via Inbox.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Ordered Items or Service Booked */}
                  <div className="rounded-xl bg-slate-50/70 p-3.5 border border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      {isOrder ? "Products Ordered (অর্ডারকৃত পণ্য)" : "Service Appointment (বুকিং সেবা)"}
                    </span>

                    {isOrder ? (
                      <div className="space-y-2">
                        {item.items?.map((line, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs font-medium text-forest">
                            <span className="truncate max-w-[200px]">
                              {line.name} <span className="text-slate-500">× {line.quantity}</span>
                            </span>
                            <span className="font-bold">{formatCurrency(line.unitPrice * line.quantity)}</span>
                          </div>
                        ))}

                        <div className="border-t border-slate-200/60 pt-2 space-y-1 text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(item.subtotal)}</span>
                          </div>
                          {item.fulfillment === "delivery" && (
                            <div className="flex justify-between text-slate-500">
                              <span>Delivery Fee</span>
                              <span className="text-emerald-700 font-semibold">+{formatCurrency(deliveryFee)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 font-extrabold text-forest text-sm border-t border-slate-200/50">
                            <span>Total Payable</span>
                            <span className="text-emerald-700">{formatCurrency(grandTotal)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2 text-sm font-bold text-forest">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span>{item.service?.name || "Service Appointment"}</span>
                            {item.service?.isNegotiable && (
                              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                                💬 Negotiable (দরকষাকষি)
                              </span>
                            )}
                          </div>
                          <span className="text-emerald-700 font-extrabold shrink-0 text-base">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                        {item.notes && (
                          <div className="rounded-lg bg-white p-2 text-xs text-slate-600 italic border border-slate-200/60">
                            <strong>Note:</strong> "{item.notes}"
                          </div>
                        )}
                        <p className="text-xs text-slate-500">
                          Appointment scheduled for {new Date(item.scheduledAt).toLocaleDateString()} at {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                        </p>

                        {/* Owner Negotiable / Agreed Fee Editor */}
                        {(user.role === "owner" || user.role === "admin") && ["pending", "accepted"].includes(item.status) && (
                          <div className="pt-2 border-t border-slate-200/60">
                            {editingBookingId === item._id ? (
                              <div className="rounded-xl bg-amber-50/90 p-3 border border-amber-200 space-y-2">
                                <label className="block text-[11px] font-bold text-amber-900">
                                  Set Agreed Service Fee (BDT / সার্ভিস ফি নির্ধারণ):
                                </label>
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">৳</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="10"
                                      value={bookingPriceInput}
                                      onChange={(e) => setBookingPriceInput(e.target.value)}
                                      placeholder="e.g. 500"
                                      className="input input-bordered input-xs w-full pl-6 bg-white font-bold text-forest"
                                      autoFocus
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    disabled={savingBookingPrice}
                                    onClick={() => handleSaveBookingPrice(item)}
                                    className="btn btn-xs rounded-lg border-0 bg-forest text-white hover:bg-forest/90 font-bold"
                                  >
                                    {savingBookingPrice ? "Saving..." : "Save (সেভ)"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBookingId(null);
                                      setBookingPriceInput("");
                                    }}
                                    className="btn btn-xs btn-ghost text-slate-500"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <p className="text-[10px] text-amber-800">
                                  💡 This agreed fee will appear on the printed summary &amp; official voucher.
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="text-[11px] text-slate-500">
                                  {item.service?.isNegotiable ? "Agreed amount for negotiable service:" : "Adjust service fee if needed:"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBookingId(item._id);
                                    setBookingPriceInput(String(item.price ?? 0));
                                  }}
                                  className="btn btn-xs rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold text-[11px] shadow-2xs"
                                >
                                  ✏️ {Number(item.price) > 0 ? "Edit Fee (ফি পরিবর্তন)" : "Set Agreed Fee (ফি নির্ধারণ)"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Bar: Action Buttons & Print */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="text-xs text-slate-500">
                    {isOrder ? (
                      <span>Payment: <strong className="capitalize">{item.paymentMethod}</strong> ({item.paymentStatus})</span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span>Service fee:</span>
                        <strong className="text-forest font-bold">{formatCurrency(item.price)}</strong>
                        {item.service?.isNegotiable && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            Negotiable
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrint(item)}
                      className="btn btn-xs rounded-full border border-slate-300 bg-white font-semibold text-forest shadow-2xs hover:bg-forest hover:text-white transition inline-flex items-center gap-1.5"
                      title={isOrder ? "Print official invoice & delivery slip" : "Print official service appointment voucher"}
                    >
                      <Printer size={12} />
                      <span>Print summary</span>
                    </button>

                    {isOrder &&
                      user.role === "admin" &&
                      item.paymentMethod === "bkash" &&
                      item.paymentStatus === "paid" &&
                      item.refundStatus === "none" && (
                        <div className="flex items-center gap-2">
                          <input
                            aria-label={`Refund reason for order ${item._id}`}
                            maxLength={255}
                            value={refundReasons[item._id] || ""}
                            onChange={(event) =>
                              setRefundReasons((current) => ({ ...current, [item._id]: event.target.value }))
                            }
                            placeholder="Refund reason"
                            className="input input-bordered input-xs w-36"
                          />
                          <button
                            disabled={!refundReasons[item._id]?.trim()}
                            onClick={() => onRefund(item, refundReasons[item._id])}
                            className="btn btn-xs rounded-full border-0 bg-red-700 text-white"
                          >
                            Full refund
                          </button>
                        </div>
                      )}

                    {isOrder &&
                      user.role === "admin" &&
                      ["processing", "review"].includes(item.refundStatus) && (
                        <button
                          onClick={() => onReconcileRefund(item)}
                          className="btn btn-xs rounded-full border-0 bg-amber-600 text-white"
                        >
                          Check refund
                        </button>
                      )}

                    {actions.map((status) => (
                      <button
                        key={status}
                        onClick={() => onUpdate(isOrder ? "/orders" : "/bookings", item, status)}
                        className="btn btn-xs rounded-full border-0 bg-forest text-white capitalize hover:bg-forest/90"
                      >
                        {status.replaceAll("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-cream/70 p-8 text-center text-sm text-slate-500">
          Nothing to show here yet. Explore LocalSphere to get started.
          {statusFilter !== "all" ? (
            <div>
              <p>No {statusFilter.replaceAll("_", " ")} {type === "orders" ? "orders" : "bookings"} found.</p>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="mt-2 text-xs font-bold text-forest underline hover:text-emerald-700"
              >
                View all {type === "orders" ? "orders" : "bookings"}
              </button>
            </div>
          ) : (
            "Nothing to show here yet. Explore LocalSphere to get started."
          )}
        </div>
      )}
    </div>
  );
}

// ----------------- PRO MODE SECTION (SUBSCRIPTIONS & RUN ADS) -----------------

function ProModeSection({ user, shops = [], products = [], services = [], currentPlanId = "starter", setCurrentPlanId }) {
  const [proTab, setProTab] = useState("subscription"); // 'subscription' | 'ads'
  const [billingCycle, setBillingCycle] = useState("monthly"); // 'monthly' | 'yearly'

  // Modal checkout state
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [mfsProvider, setMfsProvider] = useState("bkash"); // 'bkash' | 'nagad'
  const [mfsNumber, setMfsNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Ad wallet credits
  const [adCredits, setAdCredits] = useState(() => {
    return parseInt(localStorage.getItem("ls_ad_credits") || "750", 10);
  });
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(500);

  // Campaign creation state
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [campName, setCampName] = useState("");
  const [campTarget, setCampTarget] = useState("");
  const [campTargetArea, setCampTargetArea] = useState("সকল এলাকা");
  const [campPlacements, setCampPlacements] = useState(["3d_spotlight", "ads_clips"]);
  const [campRadius, setCampRadius] = useState("1 km");
  const [campBudget, setCampBudget] = useState(25);
  const [campDays, setCampDays] = useState(7);
  // Video upload states for Ads Clips (Max 40 MB)
  const [campVideoFile, setCampVideoFile] = useState(null);
  const [campVideoUrl, setCampVideoUrl] = useState("");
  const [campVideoSizeMB, setCampVideoSizeMB] = useState(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [campCaption, setCampCaption] = useState("");

  // Active campaigns list (No hardcoded demo campaigns, starts empty if none launched)
  const [campaigns, setCampaigns] = useState(() => {
    const saved = localStorage.getItem("ls_ad_campaigns");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Exclude old demo campaigns camp-101 and camp-102
        return parsed.filter((c) => c.id !== "camp-101" && c.id !== "camp-102");
      } catch (e) { }
    }
    return [];
  });

  // Save campaigns to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ls_ad_campaigns", JSON.stringify(campaigns));
    } catch (e) { }
  }, [campaigns]);

  // Sync state if campaigns update from views or clicks in other components
  useEffect(() => {
    const syncCampaigns = () => {
      try {
        const saved = localStorage.getItem("ls_ad_campaigns");
        if (saved) {
          const parsed = JSON.parse(saved);
          setCampaigns(parsed.filter((c) => c.id !== "camp-101" && c.id !== "camp-102"));
        }
      } catch (e) { }
    };
    window.addEventListener("storage", syncCampaigns);
    return () => window.removeEventListener("storage", syncCampaigns);
  }, []);

  // Subscription plans definitions
  const plans = [
    {
      id: "starter",
      name: "Starter",
      badge: "Free Tier",
      monthlyPrice: 0,
      yearlyPrice: 0,
      extraAdDays: 0,
      description: "সব শপ ও সেলারদের জন্য বেসিক ডিরেক্টরি লিস্টিং সুবিধা।",
      features: [
        "১টি সক্রিয় শপ লিস্টিং (1 Active Shop)",
        "১০টি প্রোডাক্ট ও সার্ভিস পর্যন্ত লিস্টিং",
        "লোকাল ৩ডি ম্যাপে স্ট্যান্ডার্ড পিন",
        "স্ট্যান্ডার্ড ৫% প্ল্যাটফর্ম ফি (প্রতি ১০০ টাকার অর্ডারে ৫ টাকা ফি)",
        "কমিউনিটি সাপোর্ট ও বেসিক ড্যাশবোর্ড",
      ],
      disabledFeatures: [
        "কোনো এক্সট্রা ফ্রি অ্যাড দিন নেই (০ দিন)",
        "৩ডি ডায়োরামা স্পটলাইট ও গ্লোয়িং পিন",
        "ব্লু ভেরিফাইড ব্যাজ (Blue Tick)",
        "সরাসরি হোয়াটসঅ্যাপ কাস্টমার চ্যাট",
        "এআই চ্যাটবট সুবিধা",
      ],
      btnText: "Current Plan / রানিং প্ল্যান",
    },
    {
      id: "growth",
      name: "Growth Pro",
      popular: true,
      badge: "MOST POPULAR ⭐",
      monthlyPrice: 499,
      yearlyPrice: 5600,
      extraAdDays: 7,
      description: "বেশি কাস্টমার, বেশি সেলস এবং ভেরিফাইড ট্রাস্টের জন্য সেরা প্যাকেজ।",
      features: [
        "৩টি সক্রিয় শপ ও আউটলেট লিস্টিং",
        "আনলিমিটেড প্রোডাক্ট ও সার্ভিস লিস্টিং",
        "💎 ওনারের সকল শপ ও প্রোডাক্টের নামের পাশে ব্লু ভেরিফাইড ব্যাজ",
        "🎁 প্রতিটি বিজ্ঞাপনে এক্সট্রা ৭ দিন ফ্রি অ্যাডস চলবে (৭ দিনে মোট ১৪ দিন!)",
        "🤖 এআই চ্যাটবট সুবিধা (স্মার্ট অটো-রিপ্লাই ও কাস্টমার অ্যাসিস্ট্যান্ট)",
        "📉 মাত্র ২.৫% প্ল্যাটফর্ম কমিশন (প্রতি ১০০ টাকার অর্ডারে মাত্র ২.৫ টাকা কমিশন)",
        "🌟 ৩ডি ডায়োরামা গ্লোয়িং স্পটলাইট পিন",
        "⚡ ওয়ান-ক্লিক সরাসরি হোয়াটসঅ্যাপ কাস্টমার চ্যাট",
        "📊 রিয়েল-টাইম ভিজিটর অ্যানালিটিক্স ও হিটম্যাপ",
        "🚀 ২৪/৭ প্রায়োরিটি কাস্টমার সাপোর্ট",
      ],
      disabledFeatures: [
        "লোকাল এরিয়ায় গ্যারান্টেড #১ টপ সার্চ র‍্যাংকিং",
      ],
      btnText: "Upgrade to Growth Pro",
    },
    {
      id: "elite",
      name: "Business Elite",
      badge: "VIP SCALE 👑",
      monthlyPrice: 849,
      yearlyPrice: 9500,
      extraAdDays: 21,
      description: "পুরো এলাকায় আপনার শপকে ব্র্যান্ড হিসেবে প্রতিষ্ঠিত করার ভিআইপি সল্যুশন।",
      features: [
        "আনলিমিটেড শপ ও মাল্টি-ব্রাঞ্চ আউটলেট",
        "আনলিমিটেড প্রোডাক্ট ও সার্ভিস লিস্টিং",
        "💎 ওনারের সকল শপ ও প্রোডাক্টের নামের পাশে ব্লু ভেরিফাইড ব্যাজ",
        "🎁 প্রতিটি বিজ্ঞাপনে এক্সট্রা ২১ দিন ফ্রি অ্যাডস চলবে (৭ দিনে মোট ২৮ দিন!)",
        "🤖 এআই চ্যাটবট সুবিধা (অ্যাডভান্সড স্মার্ট অটো-রেসপন্স)",
        "📉 মাত্র ১.৫% প্ল্যাটফর্ম কমিশন (প্রতি ১০০ টাকার অর্ডারে মাত্র ১.৫ টাকা কমিশন)",
        "👑 পুরো এলাকায় গ্যারান্টেড #১ টপ সার্চ র‍্যাংকিং",
        "🌟 ৩ডি ডায়োরামা গ্লোয়িং স্পটলাইট পিন",
        "⚡ ওয়ান-ক্লিক সরাসরি হোয়াটসঅ্যাপ কাস্টমার চ্যাট",
        "⚡ ইন্সট্যান্ট ব্যাংক ও বিকাশ পে-আউট সেটেলমেন্ট",
      ],
      disabledFeatures: [],
      btnText: "Upgrade to Business Elite",
    },
  ];

  const handleStartUpgrade = (plan) => {
    if (plan.id === currentPlanId) {
      toast("আপনি ইতিমধ্যে এই প্ল্যানে আছেন!");
      return;
    }
    setCheckoutPlan(plan);
    setMfsNumber("");
    setTrxId("");
  };

  const handleConfirmPayment = () => {
    if (!mfsNumber || mfsNumber.length < 11) {
      toast.error("অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন");
      return;
    }
    setIsPaying(true);
    setTimeout(async () => {
      setIsPaying(false);
      setCurrentPlanId(checkoutPlan.id);
      localStorage.setItem("ls_subscription_plan", checkoutPlan.id);
      if (user?._id) {
        localStorage.setItem("ls_verified_owner_" + user._id, "true");
      }

      // Update owner shops to verified in MongoDB
      if (shops && shops.length > 0) {
        for (const s of shops) {
          try {
            await api.put(`/shops/${s._id}`, { verified: true });
          } catch (e) { }
        }
      }

      toast.success(
        `🎉 অভিনন্দন! আপনার শপ সফলভাবে ${checkoutPlan.name} সাবস্ক্রিপশনে আপগ্রেড হয়েছে! সকল শপ ও প্রোডাক্টে ভেরিফাইড ব্যাজ চালু হয়েছে।`,
        { duration: 5000 }
      );
      setCheckoutPlan(null);
    }, 1200);
  };

  const handleCancelSubscription = async () => {
    setCurrentPlanId("starter");
    localStorage.setItem("ls_subscription_plan", "starter");
    if (user?._id) {
      localStorage.removeItem("ls_verified_owner_" + user._id);
    }
    if (shops && shops.length > 0) {
      for (const s of shops) {
        try {
          await api.put(`/shops/${s._id}`, { verified: false });
        } catch (e) { }
      }
    }
    toast.success("সাবস্ক্রিপশন ক্যানসেল করা হয়েছে। স্টার্টার প্ল্যানে ফিরে যাওয়া হয়েছে।");
  };

  const planExtraDays = currentPlanId === "elite" ? 21 : currentPlanId === "growth" ? 7 : 0;
  const totalCampaignDays = Number(campDays) + planExtraDays;

  // Toggle individual placement selection in multi-select mode
  const handleTogglePlacement = (id) => {
    setCampPlacements((prev) => {
      let next;
      if (prev.includes(id)) {
        if (prev.length === 1) {
          toast.error("বিজ্ঞাপনের জন্য অন্তত একটি স্থান সিলেক্ট থাকতে হবে!");
          return prev;
        }
        next = prev.filter((p) => p !== id);
      } else {
        next = [...prev, id];
      }

      // If ads_clips selection changed, automatically adjust budget according to discount rule:
      // Regular with ads_clips: 25, 50, 80
      // Discount without ads_clips: 25->20 (5 off), 50->40 (10 off), 80->65 (15 off)
      const hasClips = next.includes("ads_clips");
      if (!hasClips) {
        setCampBudget((curr) => (curr === 25 ? 20 : curr === 50 ? 40 : curr === 80 ? 65 : 20));
      } else {
        setCampBudget((curr) => (curr === 20 ? 25 : curr === 40 ? 50 : curr === 65 ? 80 : 25));
      }

      return next;
    });
  };

  // Video file upload handler for Ads Clips (Max 40 MB)
  const handleVideoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 40 * 1024 * 1024; // 40 MB limit
    if (file.size > maxBytes) {
      toast.error(
        `ভিডিও সাইজ সর্বোচ্চ ৪০ MB হতে পারে! (আপনার ফাইলটি ${(file.size / (1024 * 1024)).toFixed(1)} MB)`
      );
      return;
    }

    setCampVideoFile(file);
    setCampVideoSizeMB((file.size / (1024 * 1024)).toFixed(1));

    const formData = new FormData();
    formData.append("video", file);
    formData.append("folder", "owners");

    setIsUploadingVideo(true);
    const toastId = toast.loading(`ভিডিও আপলোড হচ্ছে... (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
    try {
      const res = await api.post("/uploads/video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = res.data?.url || (res.data?.filename ? `/uploads/owners/${res.data.filename}` : "");
      setCampVideoUrl(uploadedUrl);
      toast.success("ভিডিও সফলভাবে আপলোড হয়েছে!", { id: toastId });
    } catch (err) {
      // In case offline or sandbox preview fallback:
      const localUrl = URL.createObjectURL(file);
      setCampVideoUrl(localUrl);
      toast.success("ভিডিও প্রিভিউ লোড হয়েছে!", { id: toastId });
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleLaunchCampaign = (e) => {
    e.preventDefault();
    if (!campName.trim()) {
      toast.error("অনুগ্রহ করে একটি ক্যাম্পেইনের নাম দিন");
      return;
    }
    if (campPlacements.length === 0) {
      toast.error("বিজ্ঞাপন প্রদর্শনের জন্য অন্তত একটি স্থান সিলেক্ট করুন");
      return;
    }
    const targetTitle = campTarget || shops[0]?.name || products[0]?.name || "My Storefront";

    const placementLabels = campPlacements.map((p) => {
      if (p === "3d_spotlight") return "3D Spotlight";
      if (p === "search_top") return "Search Top";
      if (p === "feed_sponsored") return "Community Feed";
      if (p === "ads_clips") return "Ads Clips";
      return p;
    });

    const newCamp = {
      id: "camp-" + Date.now(),
      name: campName.trim(),
      targetTitle,
      targetId: shops[0]?._id || "shop-main",
      ownerId: user?._id || "owner",
      shopLogo: shops[0]?.logo || "",
      placements: campPlacements,
      placement: campPlacements[0],
      placementLabel: placementLabels.join(" + "),
      targetArea: campTargetArea || "সকল এলাকা",
      videoUrl: campVideoUrl || "",
      caption: campCaption.trim() || "",
      radius: campRadius,
      dailyBudget: Number(campBudget),
      paidDays: Number(campDays),
      bonusDays: planExtraDays,
      days: totalCampaignDays,
      status: "active",
      impressions: 0,
      clicks: 0,
      likes: 0,
      shares: 0,
      spent: 0,
      createdAt: "Just now",
    };

    setCampaigns((prev) => [newCamp, ...prev]);
    setShowCreateCampaign(false);
    setCampName("");
    setCampVideoFile(null);
    setCampVideoUrl("");
    setCampCaption("");
    toast.success(
      `🚀 অ্যাড ক্যাম্পেইন সফলভাবে চালু হয়েছে! মোট ${totalCampaignDays} দিন (${campDays} দিন + ${planExtraDays} দিন ফ্রি বোনাস) প্রদর্শিত হবে।`
    );
  };

  const handleToggleStatus = (id) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === "active" ? "paused" : "active" } : c
      )
    );
    toast.success("ক্যাম্পেইন স্ট্যাটাস আপডেট হয়েছে");
  };

  const handleDeleteCampaign = (id) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    toast.success("ক্যাম্পেইন ডিলিট করা হয়েছে");
  };

  const currentPlanObj = plans.find((p) => p.id === currentPlanId) || plans[0];

  return (
    <div className="space-y-8">
      {/* Top Banner with Glow and Sub-tab Switcher */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-forest to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <span className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
              <Sparkles size={14} className="text-amber-400" />
              <span>LocalSphere Pro Growth Suite</span>
              <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[9px] font-black text-slate-900">PRO ⚡</span>
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Pro Mode: Grow Your Local Business
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              সাবস্ক্রিপশন প্যাকেজ আপগ্রেড করুন এবং হাইপার-লোকাল অ্যাড ক্যাম্পেইন চালিয়ে হাজারো কাস্টমার আকর্ষণ করুন।
            </p>
          </div>

          {/* Sub-tab Pills Switcher */}
          <div className="flex shrink-0 items-center rounded-2xl bg-white/10 p-1.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setProTab("subscription")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all duration-200 ${proTab === "subscription"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30"
                  : "text-slate-300 hover:text-white"
                }`}
            >
              <Crown size={15} />
              <span>সাবস্ক্রিপশন (Subscription)</span>
            </button>
            <button
              type="button"
              onClick={() => setProTab("ads")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all duration-200 ${proTab === "ads"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30"
                  : "text-slate-300 hover:text-white"
                }`}
            >
              <Megaphone size={15} />
              <span>রান অ্যাডস (Run Ads)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== 1. SUBSCRIPTION SUB-TAB ===================== */}
      {proTab === "subscription" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Current Plan Summary Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 p-5 shadow-xs dark:border-amber-500/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/25">
                <Crown size={24} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-800 dark:text-white">
                    Current Active Plan: {currentPlanObj.name}
                  </h3>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                    ● Active Status
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentPlanId === "starter"
                    ? "আপনার শপ এখন ফ্রি স্টারটার প্ল্যানে আছে। বেশি অর্ডার ও ভেরিফাইড ট্রাস্টের জন্য প্রো প্ল্যানে আপগ্রেড করুন।"
                    : "আপনার শপে প্রো ভেরিফাইড ব্যাজ, প্রায়োরিটি ৩ডি পিন এবং রিডিউসড প্ল্যাটফর্ম কমিশন সক্রিয় রয়েছে।"}
                </p>
              </div>
            </div>

            {currentPlanId !== "starter" && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  Renews next month
                </span>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  className="btn btn-ghost btn-xs text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Cancel Plan
                </button>
              </div>
            )}
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">বিলিং সাইকেল সিলেক্ট করুন:</span>
            <div className="inline-flex items-center rounded-full bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition-all ${billingCycle === "monthly"
                    ? "bg-forest text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
              >
                মাসিক (Monthly)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold transition-all ${billingCycle === "yearly"
                    ? "bg-forest text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
              >
                <span>বাৎসরিক (Yearly)</span>
                <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-black text-slate-900">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* 3 Pricing Cards Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((p) => {
              const isCurrent = p.id === currentPlanId;
              const price = billingCycle === "monthly" ? p.monthlyPrice : p.yearlyPrice;
              const period = billingCycle === "monthly" ? "/month" : "/year";

              return (
                <div
                  key={p.id}
                  className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 ${p.popular
                      ? "border-2 border-amber-400 bg-white shadow-xl shadow-amber-500/10 dark:border-amber-400 dark:bg-slate-900"
                      : "border border-slate-200 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
                    } ${isCurrent ? "ring-2 ring-emerald-500" : ""}`}
                >
                  {/* Top Badge */}
                  {p.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md shadow-amber-500/25">
                      {p.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-black text-slate-900 dark:text-white">{p.name}</h4>
                      {isCurrent && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          Active Plan
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                      {p.description}
                    </p>

                    {/* Price display */}
                    <div className="my-5 flex items-baseline gap-1">
                      <span className="text-4xl font-black tracking-tight text-forest dark:text-white">
                        ৳{price.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{period}</span>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Features checklist */}
                    <div className="my-5 space-y-2.5">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                        ইনক্লুডেড সুবিধাসমূহ:
                      </p>
                      {p.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                          <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400">
                            <Check size={11} strokeWidth={3} />
                          </span>
                          <span>{feat}</span>
                        </div>
                      ))}
                      {p.disabledFeatures.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs font-medium text-slate-400 line-through opacity-60">
                          <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-400 dark:bg-slate-800">
                            <X size={10} />
                          </span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA button */}
                  <div className="mt-6">
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className="btn w-full rounded-2xl border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold"
                      >
                        ✓ রানিং প্ল্যান (Active)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartUpgrade(p)}
                        className={`group relative btn w-full overflow-hidden rounded-2xl border-0 font-black text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${p.popular
                            ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 shadow-amber-500/25"
                            : "bg-forest hover:bg-forest/90 shadow-forest/20"
                          }`}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <Zap size={16} />
                          <span>{p.btnText}</span>
                        </span>
                        {p.popular && (
                          <span className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-sweep" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Value comparison table */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              প্রো প্যাকেজ নিলে আপনার শপের কী কী লাভ হবে?
            </h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-cream/50 p-4 dark:bg-slate-800/60">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  <TrendingUp size={16} />
                </span>
                <h5 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">৪ গুণ বেশি কাস্টমার রিচ</h5>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  ৩ডি ডায়োরামা ম্যাপ ও লোকাল সার্চে সবার উপরে স্পটলাইট পাওয়ায় কাস্টমার অর্ডার বৃদ্ধি পায় দ্রুত।
                </p>
              </div>
              <div className="rounded-2xl bg-cream/50 p-4 dark:bg-slate-800/60">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck size={16} />
                </span>
                <h5 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">ব্লু ভেরিফাইড বিশ্বাসযোগ্যতা</h5>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  ভেরিফাইড ব্যাজ থাকার কারণে কাস্টমার নির্দ্বিধায় সরাসরি বিকাশ/ক্যাশে বড় অঙ্কের অর্ডার করে।
                </p>
              </div>
              <div className="rounded-2xl bg-cream/50 p-4 dark:bg-slate-800/60">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  <CircleDollarSign size={16} />
                </span>
                <h5 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">কমিশনে বড় সাশ্রয়</h5>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  স্ট্যান্ডার্ড ৫% কমিশনের জায়গায় মাত্র ২.৫% বা ১.৫% কমিশন, অর্থাৎ প্রতি মাসে হাজার টাকা সাশ্রয়।
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 2. RUN ADS SUB-TAB ===================== */}
      {proTab === "ads" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Quick Metrics Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Ad Reach</p>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Eye size={16} />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">14,290</p>
              <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <TrendingUp size={13} />
                <span>+24.8% this week</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Ad Clicks</p>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <ArrowUpRight size={16} />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">1,420</p>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Avg. CTR 9.9%</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Direct Inquiries</p>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  <MessageSquare size={16} />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">184</p>
              <p className="mt-1 text-xs font-semibold text-purple-600">12.9% Conversion</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ad Wallet Credits</p>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <CircleDollarSign size={16} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="text-2xl font-black text-slate-900 dark:text-white">৳{adCredits}</p>
                <button
                  type="button"
                  onClick={() => setRechargeModalOpen(true)}
                  className="rounded-full bg-forest px-2.5 py-1 text-[11px] font-bold text-white hover:bg-forest/90"
                >
                  + Recharge
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Available ad budget</p>
            </div>
          </div>

          {/* Action Header & Launch New Campaign button */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Active Ad Campaigns (সক্রিয় বিজ্ঞাপনসমূহ)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                আপনার শপ ও প্রোডাক্ট নির্দিষ্ট এরিয়ার কাস্টমারদের কাছে বিজ্ঞাপনের মাধ্যমে দ্রুত পৌঁছে দিন।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateCampaign(!showCreateCampaign)}
              className="btn rounded-full border-0 bg-forest text-white shadow-sm hover:bg-forest/90"
            >
              <Plus size={16} />
              <span>{showCreateCampaign ? "ক্যাম্পেইন ফর্ম বন্ধ করুন" : "নতুন বিজ্ঞাপন রান করুন (New Campaign)"}</span>
            </button>
          </div>

          {/* Create Campaign Drawer / Form */}
          {showCreateCampaign && (
            <form
              onSubmit={handleLaunchCampaign}
              className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/40 via-white to-white p-6 shadow-md dark:border-emerald-500/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-forest text-white">
                  <Megaphone size={16} />
                </span>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    নতুন হাইপার-লোকাল অ্যাড ক্যাম্পেইন কনফিগার করুন
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    টার্গেট এরিয়া ও প্লেসমেন্ট সিলেক্ট করে এখনই ক্যাম্পেইন লাইভ করুন।
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    বিজ্ঞাপনের নাম (Campaign Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    placeholder="e.g., Weekend 20% Discount Offer, Dhaka Special Sweet Rush"
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-forest focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    বিজ্ঞাপনের টার্গেট (Target Shop or Product) *
                  </label>
                  <select
                    value={campTarget}
                    onChange={(e) => setCampTarget(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-forest focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <optgroup label="Shops">
                      {shops.length > 0 ? (
                        shops.map((s) => (
                          <option key={s._id || s.id} value={s.name}>
                            Shop: {s.name}
                          </option>
                        ))
                      ) : (
                        <option value="Main Storefront">Main Storefront</option>
                      )}
                    </optgroup>
                    {products.length > 0 && (
                      <optgroup label="Products">
                        {products.slice(0, 10).map((p) => (
                          <option key={p._id || p.id} value={p.name}>
                            Product: {p.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {services.length > 0 && (
                      <optgroup label="Services">
                        {services.slice(0, 10).map((sv) => (
                          <option key={sv._id || sv.id} value={sv.name}>
                            Service: {sv.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {/* Placement Options Multi-Select Cards */}
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    বিজ্ঞাপন প্রদর্শনের স্থান (Ad Placements - একাধিক সিলেক্ট করতে পারবেন) *
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {campPlacements.length}টি স্থান সিলেক্টেড
                  </span>
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      id: "3d_spotlight",
                      title: "3D Diorama Spotlight",
                      desc: "৩ডি ম্যাপে আপনার দোকানটি জ্বলজ্বল করবে এবং গোল্ডেন লাইট শো করবে।",
                      badge: "High Visual Impact",
                      icon: Sparkles,
                      iconColor: "text-amber-500",
                    },
                    {
                      id: "search_top",
                      title: "Top of Search Results",
                      desc: "কাস্টমার ক্যাটাগরি বা কিওয়ার্ড লিখে সার্চ দিলে শুরুতে দেখাবে।",
                      badge: "Highest Intent",
                      icon: Search,
                      iconColor: "text-blue-500",
                    },
                    {
                      id: "feed_sponsored",
                      title: "Community Feed Sponsored",
                      desc: "কমিউনিটি সেকশনে কাস্টমারদের ফিডে স্পনসরড কার্ড আকারে পৌঁছাবে।",
                      badge: "High Engagement",
                      icon: Users,
                      iconColor: "text-emerald-500",
                    },
                    {
                      id: "ads_clips",
                      title: "Ads Clips (ক্লিপস)",
                      desc: "হোম পেজের ক্লিপস সেকশনে আপনার ভিডিও চলবে এবং সরাসরি লাইক, শেয়ার ও চ্যাট মেসেজ পাবে।",
                      badge: "Viral 9:16 Format 🔥",
                      icon: Video,
                      iconColor: "text-rose-500",
                    },
                  ].map((pl) => {
                    const isSelected = campPlacements.includes(pl.id);
                    const IconComponent = pl.icon;
                    return (
                      <div
                        key={pl.id}
                        onClick={() => handleTogglePlacement(pl.id)}
                        className={`cursor-pointer rounded-2xl border p-3.5 transition-all select-none ${isSelected
                            ? "border-forest bg-forest/5 ring-1.5 ring-forest dark:border-emerald-400 dark:bg-emerald-950/20"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <IconComponent size={14} className={pl.iconColor} />
                            <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {pl.title}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTogglePlacement(pl.id)}
                            className="checkbox checkbox-xs checkbox-success mt-0.5 rounded"
                          />
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {pl.desc}
                        </p>
                        <span className="mt-2.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {pl.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Video Upload Section for Ads Clips (Max 40 MB) */}
              {campPlacements.includes("ads_clips") && (
                <div className="mt-5 rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500 text-white">
                        <Video size={15} />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          অ্যাড ক্লিপস শর্ট ভিডিও আপলোড (সর্বোচ্চ ৪০ MB)
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          হোম পেজের ক্লিপস সেকশনে প্রদর্শনের জন্য ৯:১৬ ফরম্যাটের ভিডিও (MP4, WebM, MOV)
                        </p>
                      </div>
                    </div>
                    {campVideoSizeMB > 0 && (
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black text-rose-600 shadow-xs dark:bg-slate-800 dark:text-rose-400">
                        {campVideoSizeMB} MB
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {/* Upload or Preview Box */}
                    <div>
                      {campVideoUrl ? (
                        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black shadow-inner dark:border-slate-700">
                          <video
                            src={campVideoUrl}
                            controls
                            className="h-44 w-full rounded-xl object-contain bg-black"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCampVideoFile(null);
                              setCampVideoUrl("");
                              setCampVideoSizeMB(0);
                            }}
                            className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-rose-600 transition-colors"
                            title="Remove video"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-rose-300 bg-white/70 p-4 text-center transition-all hover:border-rose-400 hover:bg-white dark:border-rose-800 dark:bg-slate-800/60 dark:hover:bg-slate-800">
                          <UploadCloud size={28} className="text-rose-500 animate-bounce" />
                          <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                            ক্লিক করে ভিডিও ফাইল সিলেক্ট করুন
                          </span>
                          <span className="mt-1 text-[10px] text-slate-400">
                            MP4, WebM বা QuickTime MOV (সর্বোচ্চ ৪০ MB)
                          </span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                            onChange={handleVideoSelect}
                            disabled={isUploadingVideo}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Caption / Offer Text */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          ক্লিপস অফার বা ক্যাপশন (ঐচ্ছিক)
                        </label>
                        <textarea
                          rows={3}
                          value={campCaption}
                          onChange={(e) => setCampCaption(e.target.value)}
                          placeholder="যেমন: আজকের স্পেশাল অফারে যেকোনো কফির সাথে ক্রসাঁ মাত্র ৳১২০! হোম ডেলিভারি এভেইলেবল।"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:border-forest focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div className="rounded-xl bg-white/80 p-2.5 text-[11px] text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                        💡 <span className="font-semibold text-slate-700 dark:text-slate-200">টিপস:</span> কাস্টমাররা ভিডিও দেখে সরাসরি <Heart size={12} className="inline text-rose-500" /> লাইক ও শপে মেসেজ পাঠাতে পারবেন।
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Target Location / Area, Radius, Budget, and Duration */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Target Area / District */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    টার্গেট এলাকা / জেলা (Target Area)
                  </label>
                  <select
                    value={campTargetArea}
                    onChange={(e) => setCampTargetArea(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-forest focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="সকল এলাকা">🌐 সকল এলাকা (দেশব্যাপী)</option>
                    <option value="Dhaka">Dhaka (ঢাকা)</option>
                    <option value="Chattogram">Chattogram (চট্টগ্রাম)</option>
                    <option value="Sylhet">Sylhet (সিলেট)</option>
                    <option value="Rajshahi">Rajshahi (রাজশাহী)</option>
                    <option value="Khulna">Khulna (খুলনা)</option>
                    <option value="Barishal">Barishal (বরিশাল)</option>
                    <option value="Rangpur">Rangpur (রংপুর)</option>
                    <option value="Mymensingh">Mymensingh (ময়মনসিংহ)</option>
                    <option value="Gazipur">Gazipur (গাজীপুর)</option>
                    <option value="Narayanganj">Narayanganj (নারায়ণগঞ্জ)</option>
                    <option value="Cumilla">Cumilla (কুমিল্লা)</option>
                    <option value="Demra">Demra (ডেমরা)</option>
                    <option value="Dohar">Dohar (দোহার)</option>
                    <option value="Uttara">Uttara (উত্তরা)</option>
                  </select>
                </div>

                {/* 2. Target Radius */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    টার্গেট ব্যাসার্ধ (Target Radius)
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    {["1 km", "3 km", "5 km+"].map((rad) => (
                      <button
                        key={rad}
                        type="button"
                        onClick={() => setCampRadius(rad)}
                        className={`flex-1 rounded-2xl py-2 text-xs font-bold transition-all ${campRadius === rad
                            ? "bg-forest text-white shadow-xs"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                      >
                        {rad}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Daily Budget with Placement-based dynamic discount */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    দৈনিক বাজেট (Daily Budget ৳)
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    {(campPlacements.includes("ads_clips")
                      ? [
                          { value: 25, label: "৳২৫", discount: 0 },
                          { value: 50, label: "৳৫০", discount: 0 },
                          { value: 80, label: "৳৮০", discount: 0 },
                        ]
                      : [
                          { value: 20, label: "৳২০", discount: 5 },
                          { value: 40, label: "৳৪০", discount: 10 },
                          { value: 65, label: "৳৬৫", discount: 15 },
                        ]
                    ).map((tier) => (
                      <button
                        key={tier.value}
                        type="button"
                        onClick={() => setCampBudget(tier.value)}
                        className={`flex-1 rounded-2xl py-1.5 px-1 text-center transition-all ${campBudget === tier.value
                            ? "bg-forest text-white shadow-xs"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                      >
                        <span className="block text-xs font-black">{tier.label}</span>
                        {tier.discount > 0 && (
                          <span
                            className={`block text-[9px] font-bold ${campBudget === tier.value ? "text-emerald-200" : "text-emerald-600 dark:text-emerald-400"
                              }`}
                          >
                            -৳{tier.discount} ছাড়
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Duration */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">মেয়াদ (Duration)</label>
                  <select
                    value={campDays}
                    onChange={(e) => setCampDays(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold focus:border-forest focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value={3}>3 Days (৳{campBudget * 3}){planExtraDays > 0 ? ` + ${planExtraDays}d Pro Bonus = ${3 + planExtraDays} Days!` : ""}</option>
                    <option value={7}>7 Days (৳{campBudget * 7}){planExtraDays > 0 ? ` + ${planExtraDays}d Pro Bonus = ${7 + planExtraDays} Days!` : ""}</option>
                    <option value={14}>14 Days (৳{campBudget * 14}){planExtraDays > 0 ? ` + ${planExtraDays}d Pro Bonus = ${14 + planExtraDays} Days!` : ""}</option>
                    <option value={30}>30 Days (৳{campBudget * 30}){planExtraDays > 0 ? ` + ${planExtraDays}d Pro Bonus = ${30 + planExtraDays} Days!` : ""}</option>
                  </select>
                </div>
              </div>

              {/* Estimate preview & Submit button */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    <Target size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      আনুমানিক পৌঁছাবে: ~{(campBudget * totalCampaignDays * 12).toLocaleString()} -{" "}
                      {(campBudget * totalCampaignDays * 22).toLocaleString()} স্থানীয় কাস্টমারের কাছে
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      ক্যাম্পেইন চলবে: {campDays} দিন {planExtraDays > 0 ? `+ ${planExtraDays} দিন ফ্রি বোনাস = মোট ${totalCampaignDays} দিন!` : ""} (খরচ হবে মাত্র {campDays} দিনের বাজেট ৳{(campBudget * campDays).toLocaleString()})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateCampaign(false)}
                    className="btn btn-ghost btn-sm rounded-full"
                  >
                    বাতিল করুন
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm rounded-full border-0 bg-forest text-white hover:bg-forest/90"
                  >
                    <Zap size={14} />
                    <span>ক্যাম্পেইন শুরু করুন (Launch Ad)</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Campaigns Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr className="whitespace-nowrap">
                    <th className="px-4 py-3.5 whitespace-nowrap">Campaign Name & Target</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Placements</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Target Area & Radius</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Daily Budget</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Reach (Views) / Clicks (Messages)</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Likes / Shares</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {campaigns.length > 0 ? (
                    campaigns.map((camp) => (
                      <tr key={camp.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40 whitespace-nowrap">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-bold text-slate-900 dark:text-white">{camp.name}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">🎯 {camp.targetTitle}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            {(camp.placements || [camp.placement]).map((pId) => (
                              <span
                                key={pId}
                                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {pId === "3d_spotlight" && <Sparkles size={10} className="text-amber-500" />}
                                {pId === "search_top" && <Search size={10} className="text-blue-500" />}
                                {pId === "feed_sponsored" && <Users size={10} className="text-emerald-500" />}
                                {pId === "ads_clips" && <Video size={10} className="text-rose-500" />}
                                <span>
                                  {pId === "3d_spotlight"
                                    ? "3D Spotlight"
                                    : pId === "search_top"
                                      ? "Search Top"
                                      : pId === "feed_sponsored"
                                        ? "Feed"
                                        : pId === "ads_clips"
                                          ? "Ads Clips"
                                          : pId}
                                </span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-slate-700 dark:text-slate-200">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <span>{camp.targetArea || "সকল এলাকা"}</span>
                            <span className="text-slate-400 font-normal">({camp.radius || "1 km"})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 whitespace-nowrap text-xs">
                            <span className="font-extrabold text-forest dark:text-emerald-400">৳{camp.dailyBudget}/day</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              {camp.days} days{camp.bonusDays > 0 && <span className="ml-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.2 rounded dark:bg-emerald-950/60 dark:text-emerald-300">+{camp.bonusDays}d Free</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 whitespace-nowrap text-xs">
                            <span className="font-bold text-slate-800 dark:text-white">{(camp.impressions || 0).toLocaleString()} views</span>
                            <span className="text-slate-300">|</span>
                            <span className="font-bold text-emerald-600">{(camp.clicks || 0).toLocaleString()} clicks</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2 whitespace-nowrap text-xs">
                            <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400" title="Likes">
                              <Heart size={13} className="fill-rose-500 text-rose-500" />
                              {(camp.likes || 0).toLocaleString()}
                            </span>
                            <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400" title="Shares">
                              <Share2 size={13} />
                              {(camp.shares || 0).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {camp.status === "active" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              Running
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              Paused
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(camp.id)}
                              className="btn btn-ghost btn-xs rounded-lg"
                              title={camp.status === "active" ? "Pause campaign" : "Resume campaign"}
                            >
                              {camp.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCampaign(camp.id)}
                              className="btn btn-ghost btn-xs rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Delete campaign"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-sm text-slate-500">
                        এখনো কোনো ক্যাম্পেইন চালানো হয়নি। উপরের বাটন ক্লিক করে প্রথম বিজ্ঞাপন রান করুন!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CHECKOUT MODAL (BKASH / NAGAD) ===================== */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-fadeIn">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setCheckoutPlan(null)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/25">
                <Crown size={22} />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Upgrade to {checkoutPlan.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ইন্সট্যান্ট মোবাইল পেমেন্টের মাধ্যমে প্রো মেম্বারশিপ সক্রিয় করুন
                </p>
              </div>
            </div>

            {/* Price pill */}
            <div className="my-5 flex items-center justify-between rounded-2xl bg-cream/70 p-4 dark:bg-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">পরিশোধের পরিমাণ:</span>
              <span className="text-xl font-black text-forest dark:text-emerald-400">
                ৳{(billingCycle === "monthly" ? checkoutPlan.monthlyPrice : checkoutPlan.yearlyPrice).toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-500">
                  ({billingCycle === "monthly" ? "মাসিক" : "বাৎসরিক"})
                </span>
              </span>
            </div>

            {/* Payment method selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">পেমেন্ট মেথড বেছে নিন:</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMfsProvider("bkash")}
                  className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-xs font-extrabold transition-all ${mfsProvider === "bkash"
                      ? "border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400 shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                >
                  <span className="h-3 w-3 rounded-full bg-pink-600" />
                  <span>bKash (বিকাশ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMfsProvider("nagad")}
                  className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-xs font-extrabold transition-all ${mfsProvider === "nagad"
                      ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                >
                  <span className="h-3 w-3 rounded-full bg-orange-500" />
                  <span>Nagad (নগদ)</span>
                </button>
              </div>
            </div>

            {/* Mobile number input */}
            <div className="mt-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                আপনার {mfsProvider === "bkash" ? "বিকাশ" : "নগদ"} নম্বর *
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  maxLength={11}
                  value={mfsNumber}
                  onChange={(e) => setMfsNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="017XXXXXXXX"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold tracking-wider focus:border-forest focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setMfsNumber("01712345678")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-forest underline dark:text-emerald-400"
                >
                  Use Demo
                </button>
              </div>
            </div>

            {/* TrxID / Security note */}
            <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              🔒 সুরক্ষিত স্যান্ডবক্স পেমেন্ট গেটওয়ে। নম্বর দিয়ে নিচের বাটনে ক্লিক করলে স্বয়ংক্রিয়ভাবে প্রমোশন ভেরিফাই হয়ে প্রো মোড চালু হবে।
            </div>

            {/* Confirm upgrade button */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                className="btn btn-ghost flex-1 rounded-2xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isPaying}
                onClick={handleConfirmPayment}
                className={`btn flex-1 rounded-2xl border-0 font-bold text-white ${mfsProvider === "bkash"
                    ? "bg-pink-600 hover:bg-pink-700"
                    : "bg-orange-600 hover:bg-orange-700"
                  }`}
              >
                {isPaying ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <span>পেমেন্ট নিশ্চিত করুন (Pay Now)</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== AD CREDITS RECHARGE MODAL ===================== */}
      {rechargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-fadeIn">
            <button
              type="button"
              onClick={() => setRechargeModalOpen(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 text-white shadow-xs">
                <CircleDollarSign size={20} />
              </span>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">রিচার্জ অ্যাড ক্রেডিট</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">বিজ্ঞাপন বাজেট বাড়াতে ব্যালেন্স যোগ করুন</p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">অ্যামাউন্ট সিলেক্ট করুন:</label>
              <div className="grid grid-cols-3 gap-2">
                {[300, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmount(amt)}
                    className={`rounded-xl py-2 text-xs font-bold transition-all ${rechargeAmount === amt
                        ? "bg-forest text-white"
                        : "border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setRechargeModalOpen(false)}
                className="btn btn-ghost btn-sm flex-1 rounded-full"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdCredits((prev) => {
                    const next = prev + rechargeAmount;
                    localStorage.setItem("ls_ad_credits", String(next));
                    return next;
                  });
                  toast.success(`🎉 সফলভাবে ৳${rechargeAmount} অ্যাড ক্রেডিট যোগ হয়েছে!`);
                  setRechargeModalOpen(false);
                }}
                className="btn btn-sm flex-1 rounded-full border-0 bg-forest text-white hover:bg-forest/90"
              >
                রিচার্জ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
