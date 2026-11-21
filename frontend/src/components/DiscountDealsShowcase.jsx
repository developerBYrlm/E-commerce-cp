import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Zap,
  BadgeCheck,
  MapPin,
  Store,
  ShoppingBag,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Shuffle,
  Tag,
  Truck,
  Eye,
  MessageSquare,
  Clock,
  TrendingDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCollection } from "../hooks/useApi";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../utils/currency";
import { getImageUrl } from "../utils/imageUrl";
import Card3DTilt from "./3d/Card3DTilt";
import { VerifiedBadge, isVerified } from "../utils/verification";

/**
 * Helper to pick a completely random deal that is neither the current one
 * nor the one playing in the other window.
 */
function pickRandomDealIndex(total, current, avoid) {
  if (total <= 1) return 0;
  const candidates = [];
  for (let i = 0; i < total; i++) {
    if (i === current) continue;
    if (total > 2 && i === avoid) continue;
    candidates.push(i);
  }
  if (candidates.length === 0) {
    return (current + 1) % total;
  }
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

/**
 * Individual Product Ad Window
 */
function ProductAdWindowFrame({
  windowId,
  windowTitle,
  windowBadgeColor,
  deals,
  otherWindowIndex,
  onIndexChange,
  defaultIndex = 0,
  autoRotateInterval = 6000,
}) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();

  const totalDeals = deals.length;
  const [currentIndex, setCurrentIndex] = useState(defaultIndex % (totalDeals || 1));
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(1);

  // Notify parent of index change to avoid collision
  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(currentIndex);
    }
  }, [currentIndex, onIndexChange]);

  // Keep index within bounds
  useEffect(() => {
    if (totalDeals > 0 && currentIndex >= totalDeals) {
      setCurrentIndex(0);
    }
  }, [totalDeals, currentIndex]);

  // Reset image when deal changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [currentIndex]);

  // Random auto-rotation timer (pure random, no serial order)
  useEffect(() => {
    if (totalDeals <= 1 || isPaused) {
      setProgress(0);
      return;
    }

    const stepMs = 50;
    const increment = (stepMs / autoRotateInterval) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setDirection(1);
          setCurrentIndex((old) => pickRandomDealIndex(totalDeals, old, otherWindowIndex));
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [totalDeals, isPaused, currentIndex, otherWindowIndex, autoRotateInterval]);

  const handleNext = () => {
    if (totalDeals <= 1) return;
    setDirection(1);
    setProgress(0);
    setCurrentIndex((old) => pickRandomDealIndex(totalDeals, old, otherWindowIndex));
  };

  const handlePrev = () => {
    if (totalDeals <= 1) return;
    setDirection(-1);
    setProgress(0);
    setCurrentIndex((old) => pickRandomDealIndex(totalDeals, old, otherWindowIndex));
  };

  const handleShuffle = () => {
    if (totalDeals <= 1) return;
    setDirection(1);
    setProgress(0);
    setCurrentIndex((old) => pickRandomDealIndex(totalDeals, old, otherWindowIndex));
  };

  const handleAddToCart = (deal) => {
    if (!deal) return;
    addItem({
      ...deal,
      price: deal.originalPrice,
      discountPrice: deal.dealPrice,
    });
    toast.success(`🎉 "${deal.name}" added to cart with ${deal.percentOff}% discount!`);
  };

  if (totalDeals === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-forest/15 bg-white/60 p-8 text-center dark:border-white/10 dark:bg-slate-900/60">
        <Store className="h-10 w-10 text-forest/40 dark:text-white/40" />
        <p className="mt-3 text-sm font-semibold text-forest dark:text-white">
          No discount deals available in this slot
        </p>
      </div>
    );
  }

  const currentDeal = deals[currentIndex] || deals[0];
  const shop = currentDeal?.shop || {};
  const owner = currentDeal?.owner || shop.owner || {};
  const images = currentDeal?.images || [];
  const activeImage = images[selectedImageIndex] || images[0];

  return (
    <div
      className="group/window relative flex flex-col justify-between overflow-hidden rounded-3xl border border-emerald-900/15 bg-gradient-to-br from-white via-cream/30 to-emerald-50/20 p-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/10 dark:border-white/10 dark:from-slate-900 dark:via-slate-900/95 dark:to-emerald-950/20 sm:p-5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-lime/15 blur-2xl dark:bg-emerald-500/10" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-emerald-500/10 blur-2xl dark:bg-lime/10" />

      {/* Top Header */}
      <div className="relative z-10 mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-forest/10 pb-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          {/* Live Badge */}
          <span className="relative flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-black tracking-wide text-forest dark:bg-emerald-950 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            <span>LIVE AD #{windowId}</span>
          </span>

          {/* Slot Title */}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${windowBadgeColor || "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
              }`}
          >
            {windowTitle}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {/* Pause / Play */}
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className="flex h-7 items-center gap-1 rounded-full border border-forest/15 bg-white/80 px-2 text-[11px] font-medium text-forest transition hover:bg-forest hover:text-white dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-600"
            title={isPaused ? "Resume rotation" : "Pause rotation to inspect"}
          >
            {isPaused ? <Play className="h-2.5 w-2.5 fill-current" /> : <Pause className="h-2.5 w-2.5 fill-current" />}
            <span className="hidden sm:inline text-[10px]">{isPaused ? "Play" : "Pause"}</span>
          </button>

          {/* Random Ad Button */}
          {totalDeals > 1 && (
            <button
              type="button"
              onClick={handleShuffle}
              className="flex h-7 items-center gap-1 rounded-full border border-forest/15 bg-white/80 px-2 text-[11px] font-medium text-forest transition hover:bg-forest hover:text-white dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-600"
              title="Pick a random discount ad"
            >
              <Shuffle className="h-3 w-3" />
              <span className="hidden sm:inline text-[10px]">Random</span>
            </button>
          )}

          {/* Prev / Next */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-forest/15 bg-white/80 text-forest transition hover:bg-forest hover:text-white dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-600"
              aria-label="Previous ad"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-forest/15 bg-white/80 text-forest transition hover:bg-forest hover:text-white dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-600"
              aria-label="Next ad"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Countdown Progress Bar */}
      <div className="relative z-10 -mt-1 mb-4 h-1 w-full overflow-hidden rounded-full bg-forest/10 dark:bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-lime via-emerald-400 to-teal-400 transition-all duration-75"
          style={{ width: `${isPaused ? 0 : progress}%` }}
        />
      </div>

      {/* Main Dynamic Ad Content (With AnimatePresence) */}
      <div className="relative z-10 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentDeal?._id || currentIndex}
            initial={{ opacity: 0, x: direction * 25, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -direction * 25, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-4"
          >
            {/* Top Half: 3D Tilt Image Stage & Floating Badges */}
            <Card3DTilt
              maxTilt={10}
              scale={1.01}
              className="group/img relative overflow-hidden rounded-2xl border border-forest/10 bg-slate-950 shadow-md dark:border-white/15"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900 sm:aspect-[16/9]">
                {activeImage ? (
                  <img
                    src={getImageUrl(activeImage)}
                    alt={currentDeal.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover/img:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-emerald-950/20 text-emerald-400">
                    <ShoppingBag className="h-16 w-16 opacity-40" />
                  </div>
                )}

                {/* Dark gradient overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* Floating Discount Percentage Badge */}
                <div className="absolute left-2.5 top-2.5 z-20 flex flex-col gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 px-2.5 py-1 text-[11px] font-black tracking-wider text-white shadow-md">
                    <TrendingDown className="h-3.5 w-3.5 stroke-[3]" />
                    {currentDeal.percentOff}% OFF
                  </span>
                  <span className="inline-flex items-center rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold text-lime backdrop-blur-md">
                    SAVE {formatCurrency(currentDeal.saveAmount)}
                  </span>
                </div>

                {/* Floating Stock or Condition Tag */}
                <div className="absolute right-2.5 top-2.5 z-20 flex flex-col items-end gap-1">
                  {currentDeal.stock > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      {currentDeal.stock <= 3 ? `Only ${currentDeal.stock} left!` : "In Stock"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-600/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                      Limited Offer
                    </span>
                  )}
                  {currentDeal.condition && (
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white backdrop-blur-md">
                      {currentDeal.condition}
                    </span>
                  )}
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between text-[11px] text-white/90">
                  <span className="flex items-center gap-1 font-medium drop-shadow-md">
                    <Sparkles className="h-3 w-3 text-lime" />
                    Verified Local Seller
                  </span>
                  {currentDeal.deliveryAvailable && (
                    <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] backdrop-blur-md">
                      <Truck className="h-3 w-3" /> Delivery
                    </span>
                  )}
                </div>
              </div>

              {/* Multi-image thumbnail strip */}
              {images.length > 1 && (
                <div className="flex gap-1.5 bg-slate-950/90 p-2 backdrop-blur-md">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(idx);
                      }}
                      className={`relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg border transition-all ${selectedImageIndex === idx
                        ? "border-lime scale-105 shadow-sm shadow-lime/40"
                        : "border-white/10 opacity-70 hover:opacity-100"
                        }`}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`thumb-${idx}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card3DTilt>

            {/* Bottom Half: Shop Info, Title, Price, & Actions */}
            <div className="flex flex-col space-y-3">
              {/* Shop Owner Profile Header */}
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-forest/10 bg-white/80 p-2.5 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-slate-800/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-xl border border-forest/15 bg-cream/70 dark:border-white/10 dark:bg-slate-700">
                    {shop.logo ? (
                      <img
                        src={getImageUrl(shop.logo)}
                        alt={shop.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-forest text-lime font-bold text-xs">
                        {shop.name ? shop.name.slice(0, 1).toUpperCase() : <Store className="h-4 w-4" />}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <Link
                        to={shop.slug ? `/shops/${shop.slug}` : `/shops/${shop._id}`}
                        className="truncate text-xs font-bold text-forest transition hover:text-emerald-600 dark:text-emerald-300"
                      >
                        {shop.name || "Local Shop Partner"}
                      </Link>
                      {isVerified(shop) && (
                        <VerifiedBadge size={14} title="Verified Shop" />
                      )}
                    </div>
                    {(shop.area || shop.district) && (
                      <p className="flex items-center gap-0.5 truncate text-[10px] text-charcoal/70 dark:text-slate-400">
                        <MapPin className="h-2.5 w-2.5 text-rose-500" />
                        {[shop.area, shop.district].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  to={shop.slug ? `/shops/${shop.slug}` : `/shops/${shop._id}`}
                  className="flex items-center gap-1 rounded-full border border-forest/15 bg-cream/60 px-2.5 py-1 text-[11px] font-semibold text-forest transition hover:bg-forest hover:text-white dark:border-white/10 dark:bg-slate-700 dark:text-emerald-300 dark:hover:bg-emerald-600"
                >
                  <span>Shop</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Product Title and Category */}
              <div>
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-lime/30 px-2 py-0.5 text-[10px] font-bold text-forest dark:bg-lime/20 dark:text-lime">
                    <Tag className="h-2.5 w-2.5" />
                    {currentDeal.category?.name || "Local Product"}
                  </span>
                  {currentDeal.keywords?.slice(0, 2).map((kw, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-forest/5 px-1.5 py-0.5 text-[10px] font-medium text-forest/70 dark:bg-white/10 dark:text-slate-300"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>

                <Link to={`/products/${currentDeal._id}`} className="group/title block">
                  <h4 className="truncate text-lg font-black text-forest transition group-hover/title:text-emerald-600 dark:text-white dark:group-hover/title:text-lime sm:text-xl flex items-center gap-1.5">
                    <span>{currentDeal.name}</span>
                    {isVerified(shop) && (
                      <VerifiedBadge size={16} title="Verified Owner Product" />
                    )}
                  </h4>
                </Link>
                {currentDeal.description ? (
                  <p className="mt-1 line-clamp-1 text-xs text-charcoal/70 dark:text-slate-300">
                    {currentDeal.description}
                  </p>
                ) : (
                  <p className="mt-1 text-xs italic text-charcoal/50 dark:text-slate-400">
                    Exclusive verified discount deal offered directly by the owner.
                  </p>
                )}
              </div>

              {/* Price Highlight Card */}
              <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-lime/15 to-transparent p-2.5 dark:border-emerald-500/30 dark:from-emerald-950/40">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xl font-black text-forest dark:text-lime sm:text-2xl">
                    {formatCurrency(currentDeal.dealPrice)}
                  </span>
                  <span className="text-xs font-bold text-charcoal/50 line-through dark:text-slate-500">
                    {formatCurrency(currentDeal.originalPrice)}
                  </span>
                  <span className="rounded-full bg-rose-500 px-2 py-0.2 text-[10px] font-black text-white">
                    {currentDeal.percentOff}% OFF
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  <Zap className="h-3 w-3 fill-current text-amber-500" />
                  <span>Save {formatCurrency(currentDeal.saveAmount)} with this deal!</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleAddToCart(currentDeal)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest px-3 py-2.5 text-xs font-bold text-lime shadow-md shadow-forest/20 transition-all hover:bg-forest/90 active:scale-95 dark:bg-lime dark:text-forest dark:hover:bg-lime/90"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Claim & Add to Cart</span>
                </button>

                <Link
                  to={`/products/${currentDeal._id}`}
                  className="flex items-center justify-center gap-1 rounded-xl border border-forest/20 bg-white/90 px-3 py-2.5 text-xs font-bold text-forest transition hover:bg-forest hover:text-white dark:border-white/15 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-600"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Details</span>
                </Link>

                {shop.owner && (!user || user.role === "customer") && (
                  <button
                    type="button"
                    onClick={() => {
                      const ownerId = owner._id || shop.owner;
                      if (!user) {
                        toast("Please log in to message the shop owner", { icon: "🔒" });
                        navigate(`/login?redirect=${encodeURIComponent(`/messages?with=${ownerId}`)}`);
                        return;
                      }
                      navigate(`/messages?with=${ownerId}`);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-forest/20 bg-white/90 text-forest transition hover:bg-forest hover:text-white dark:border-white/15 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-600"
                    title="Message shop owner"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function DiscountDealsShowcase({ initialProducts }) {
  const productsQuery = useCollection(initialProducts ? null : "/products", { limit: 50 });
  const rawProducts = initialProducts || productsQuery.data?.items || [];

  // Filter products with active owner discount
  const discountDeals = useMemo(() => {
    return rawProducts
      .filter((p) => {
        if (!p || p.status === "archived") return false;
        const hasDiscountPrice =
          p.discountPrice !== undefined &&
          p.discountPrice !== null &&
          p.discountPrice > 0 &&
          p.discountPrice < p.price;
        const hasDiscountPercent = p.discount !== undefined && p.discount > 0;
        return hasDiscountPrice || hasDiscountPercent;
      })
      .map((p) => {
        const originalPrice = p.price;
        let dealPrice = originalPrice;
        let saveAmount = 0;
        let percentOff = 0;

        if (p.discountPrice && p.discountPrice < p.price) {
          dealPrice = p.discountPrice;
          saveAmount = originalPrice - dealPrice;
          percentOff = Math.round((saveAmount / originalPrice) * 100);
        } else if (p.discount && p.discount > 0) {
          percentOff = p.discount;
          saveAmount = Math.round((originalPrice * percentOff) / 100);
          dealPrice = originalPrice - saveAmount;
        }

        return {
          ...p,
          originalPrice,
          dealPrice,
          saveAmount,
          percentOff,
        };
      });
  }, [rawProducts]);

  const [window1ActiveIndex, setWindow1ActiveIndex] = useState(0);
  const [window2ActiveIndex, setWindow2ActiveIndex] = useState(1);

  if (productsQuery.isLoading && !initialProducts) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-white/70 p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
        <div className="flex animate-pulse flex-col items-center justify-center space-y-4 py-16">
          <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <p className="text-sm font-medium text-forest dark:text-emerald-400">
            Finding owner product discount ads...
          </p>
        </div>
      </div>
    );
  }

  if (discountDeals.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-dashed border-emerald-900/20 bg-white/70 p-10 text-center shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-forest dark:bg-emerald-950 dark:text-emerald-400">
          <Tag className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-lg font-bold text-forest dark:text-white">
          No active product discount deals at this moment
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-charcoal/70 dark:text-slate-300">
          Shop owners regularly post flash discounts here. Check back soon or browse all local catalog products!
        </p>
      </div>
    );
  }

  const dealsPool = discountDeals;
  const initialIndexWindow1 = 0;
  const initialIndexWindow2 = dealsPool.length > 1 ? 1 : 0;

  return (
    <div className="space-y-3">
      {/* Sub-header info bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-semibold text-charcoal/70 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Dual Split Live Ads: 2 active owner promotions running side-by-side</span>
        </div>
        <span className="text-[11px] text-charcoal/50 dark:text-slate-400">
          Total {dealsPool.length} Active Product Deals • Rotating randomly
        </span>
      </div>

      {/* DUAL SPLIT PRODUCT AD WINDOWS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Window 1 */}
        <ProductAdWindowFrame
          windowId={1}
          windowTitle="🔥 MEGA DISCOUNT DEALS"
          windowBadgeColor="bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300"
          deals={dealsPool}
          otherWindowIndex={window2ActiveIndex}
          onIndexChange={setWindow1ActiveIndex}
          defaultIndex={initialIndexWindow1}
          autoRotateInterval={6000} // 6 seconds
        />

        {/* Window 2 */}
        <ProductAdWindowFrame
          windowId={2}
          windowTitle="✨ TRENDING LOCAL OFFERS"
          windowBadgeColor="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
          deals={dealsPool}
          otherWindowIndex={window1ActiveIndex}
          onIndexChange={setWindow2ActiveIndex}
          defaultIndex={initialIndexWindow2}
          autoRotateInterval={7500} // 7.5 seconds
        />
      </div>
    </div>
  );
}
