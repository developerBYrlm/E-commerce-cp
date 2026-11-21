import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Store,
  Flame,
  Eye,
  Video,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../utils/imageUrl";
import { VerifiedBadge } from "../utils/verification";

export default function AdsClipsShowcase() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load only real active campaign clips from localStorage (NO demo/fake clips)
  const [clips, setClips] = useState(() => {
    try {
      const saved = localStorage.getItem("ls_ad_campaigns");
      if (saved) {
        const campaigns = JSON.parse(saved);
        // User's current location district/area for targeted ads
        const userArea = (user?.address?.district || user?.address?.area || user?.district || "").toLowerCase().trim();

        // Only include active campaigns that have a real videoUrl uploaded and are NOT demo campaigns
        return campaigns
          .filter((c) => {
            if (c.status !== "active" || c.id === "camp-101" || c.id === "camp-102") return false;
            if (!c.videoUrl || typeof c.videoUrl !== "string" || c.videoUrl.trim().length === 0) return false;

            // Target area matching: if camp specifies an area other than "সকল এলাকা", show to users matching that area
            if (c.targetArea && c.targetArea !== "সকল এলাকা" && userArea) {
              const campArea = c.targetArea.toLowerCase().trim();
              if (!campArea.includes(userArea) && !userArea.includes(campArea)) {
                return false;
              }
            }
            return true;
          })
          .map((c, idx) => ({
            id: c.id || `camp-clip-${idx}`,
            shopName: c.targetTitle || "Local Business",
            shopId: c.targetId || "shop-custom",
            ownerId: c.ownerId || user?._id || "owner-demo",
            shopLogo: c.shopLogo || "",
            verified: true,
            title: c.name || "Special Neighborhood Offer",
            caption: c.caption || "",
            productName: c.targetTitle || "Featured Item",
            productLink: "/shops",
            videoUrl: c.videoUrl,
            poster: c.poster || "",
            likes: Number(c.likes || 0),
            shares: Number(c.shares || 0),
            views: Number(c.impressions || 0),
            targetArea: c.targetArea || "সকল এলাকা",
            status: "active",
          }));
      }
    } catch (e) {}
    return [];
  });

  // Track viewed clip IDs in current session to increment real views once per session per clip
  const viewedClipsRef = useRef(new Set());

  // Register real ad view whenever the video is rendered/played on user screen
  const registerAdView = (clipId) => {
    if (!clipId || viewedClipsRef.current.has(clipId)) return;
    viewedClipsRef.current.add(clipId);

    // Update view count in local state
    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId ? { ...c, views: (c.views || 0) + 1 } : c
      )
    );

    // Update impressions in localStorage ls_ad_campaigns
    try {
      const saved = localStorage.getItem("ls_ad_campaigns");
      if (saved) {
        const campaigns = JSON.parse(saved);
        const updated = campaigns.map((camp) => {
          if (camp.id === clipId) {
            return {
              ...camp,
              impressions: (camp.impressions || 0) + 1,
            };
          }
          return camp;
        });
        localStorage.setItem("ls_ad_campaigns", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      console.error("View count increment error:", err);
    }
  };

  // Track liked status per clip in localStorage
  const [likedMap, setLikedMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ls_clips_liked_map") || "{}");
    } catch (e) {
      return {};
    }
  });

  // Sound muted state (default true for web autoplay compliance)
  const [isMuted, setIsMuted] = useState(true);

  // Full-screen Shorts/Clips Modal state
  const [activeModalClipIndex, setActiveModalClipIndex] = useState(null);

  // Handle Like Button click
  const handleToggleLike = (e, clipId) => {
    e.stopPropagation();
    const isCurrentlyLiked = Boolean(likedMap[clipId]);
    const updatedMap = { ...likedMap, [clipId]: !isCurrentlyLiked };
    setLikedMap(updatedMap);
    try {
      localStorage.setItem("ls_clips_liked_map", JSON.stringify(updatedMap));
    } catch (err) {}

    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId
          ? { ...c, likes: isCurrentlyLiked ? Math.max(0, c.likes - 1) : c.likes + 1 }
          : c
      )
    );

    // Sync likes to campaign in localStorage if it exists
    try {
      const saved = localStorage.getItem("ls_ad_campaigns");
      if (saved) {
        const camps = JSON.parse(saved);
        const updatedCamps = camps.map((camp) => {
          if (camp.id === clipId) {
            return {
              ...camp,
              likes: isCurrentlyLiked ? Math.max(0, (camp.likes || 0) - 1) : (camp.likes || 0) + 1,
            };
          }
          return camp;
        });
        localStorage.setItem("ls_ad_campaigns", JSON.stringify(updatedCamps));
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {}

    if (!isCurrentlyLiked) {
      toast.success("❤️ অ্যাড ক্লিপসটিতে লাইক দেওয়া হয়েছে!", { id: "clip-like" });
    }
  };

  // Handle Share Button click (copies link without incrementing numeric counter)
  const handleShare = (e, clip) => {
    e.stopPropagation();
    const shareUrl = window.location.origin + `?clip=${clip.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("🔗 অ্যাড ক্লিপস লিঙ্ক কপি করা হয়েছে!", { id: "clip-share" });
    } else {
      toast.success("🔗 ক্লিপস লিঙ্ক কপি করা হয়েছে!", { id: "clip-share" });
    }
  };

  // Handle Direct Message to Owner (Counts as 1 Click for this ad)
  const handleDirectMessage = (e, clip) => {
    e.stopPropagation();

    // Increment click count for this ad campaign
    try {
      const saved = localStorage.getItem("ls_ad_campaigns");
      if (saved) {
        const campaigns = JSON.parse(saved);
        const updatedCamps = campaigns.map((camp) => {
          if (camp.id === clip.id) {
            return {
              ...camp,
              clicks: (camp.clicks || 0) + 1,
            };
          }
          return camp;
        });
        localStorage.setItem("ls_ad_campaigns", JSON.stringify(updatedCamps));
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      console.error("Click count increment error:", err);
    }

    if (!user) {
      toast.error("শপ ওনারকে মেসেজ পাঠাতে দয়া করে সাইন-ইন করুন");
      navigate("/login");
      return;
    }
    navigate(`/messages?with=${clip.ownerId || "owner"}`);
    toast.success(`💬 ${clip.shopName}-এর সাথে চ্যাট শুরু হচ্ছে...`);
  };

  const activeClip = activeModalClipIndex !== null ? clips[activeModalClipIndex] : null;

  // Whenever modal opens, register view
  useEffect(() => {
    if (activeClip) {
      registerAdView(activeClip.id);
    }
  }, [activeClip]);

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-5 py-6 sm:py-8 lg:px-8">
      {/* Section Header (Clips Style) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 text-white shadow-md shadow-pink-500/25">
            <Flame size={20} className="animate-pulse" />
            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-forest dark:text-white sm:text-2xl">
                ক্লিপস অ্যাডস
              </h2>
              <span className="rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                CLIPS 🔥
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              আপনার আশেপাশের ভেরিফাইড দোকান ও প্রোডাক্টের শর্ট ভিডিও বিজ্ঞাপন ও স্পেশাল অফার
            </p>
          </div>
        </div>

        {clips.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              title={isMuted ? "সাউন্ড অন করুন" : "সাউন্ড মিউট করুন"}
            >
              {isMuted ? <VolumeX size={14} className="text-rose-500" /> : <Volume2 size={14} className="text-emerald-500" />}
              <span>{isMuted ? "সাউন্ড অফ" : "সাউন্ড অন"}</span>
            </button>
          </div>
        )}
      </div>

      {/* When there are active uploaded clips */}
      {clips.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-4 sm:gap-5">
          {clips.map((clip, index) => {
            const isLiked = Boolean(likedMap[clip.id]);

            return (
              <div
                key={clip.id}
                onClick={() => setActiveModalClipIndex(index)}
                className="group relative flex aspect-[9/16] cursor-pointer flex-col justify-between overflow-hidden rounded-3xl bg-slate-900 p-3 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/25 sm:p-4"
              >
                {/* HTML5 Autoplay Looping Video with View Tracking */}
                <video
                  src={clip.videoUrl}
                  poster={clip.poster}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  onPlay={() => registerAdView(clip.id)}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Gradient overlays */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/60" />

                {/* Top Header Row on Card */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 backdrop-blur-md">
                    <Sparkles size={11} className="text-amber-400" />
                    <span>Sponsored</span>
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-0.5 text-[10px] font-bold text-white/95 backdrop-blur-md border border-white/10">
                    <Eye size={11} className="text-emerald-400" />
                    <span>{(clip.views || 0).toLocaleString()}</span>
                  </span>
                </div>

                {/* Center Play Indicator on Hover */}
                <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white/30 text-white backdrop-blur-md transition-transform group-hover:scale-110">
                    <Play size={22} className="ml-1 fill-white" />
                  </span>
                </div>

                {/* Bottom Info & Action Buttons */}
                <div className="relative z-10 flex items-end justify-between gap-2 pt-8">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/60 bg-white/20 text-xs font-bold text-white backdrop-blur-xs overflow-hidden">
                        {clip.shopLogo ? (
                          <img src={getImageUrl(clip.shopLogo)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span>{clip.shopName.slice(0, 1)}</span>
                        )}
                      </span>
                      <p className="truncate text-xs font-black text-white flex items-center gap-1 drop-shadow-sm">
                        <span className="truncate">{clip.shopName}</span>
                        {clip.verified && (
                          <VerifiedBadge size={14} title="Verified Seller" />
                        )}
                      </p>
                    </div>

                    <h3 className="mt-1.5 line-clamp-2 text-xs font-extrabold leading-snug text-white/95 drop-shadow-sm group-hover:text-amber-300 transition-colors">
                      {clip.title}
                    </h3>
                  </div>

                  {/* Vertical Clips Action Column */}
                  <div className="flex flex-col items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleLike(e, clip.id)}
                      className="group/btn flex flex-col items-center transition-transform active:scale-125"
                      title={isLiked ? "Unlike" : "Like"}
                    >
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-full backdrop-blur-md transition-all ${
                          isLiked
                            ? "bg-rose-600 text-white shadow-md shadow-rose-600/50"
                            : "bg-black/50 text-white hover:bg-black/70"
                        }`}
                      >
                        <Heart size={16} className={isLiked ? "fill-white" : ""} />
                      </span>
                      <span className="mt-0.5 text-[10px] font-black text-white drop-shadow-md">
                        {clip.likes >= 1000 ? `${(clip.likes / 1000).toFixed(1)}k` : clip.likes}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDirectMessage(e, clip)}
                      className="group/btn flex flex-col items-center transition-transform active:scale-110"
                      title="শপ ওনারকে ডিরেক্ট মেসেজ দিন"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-emerald-600 hover:text-white transition-colors">
                        <MessageCircle size={15} />
                      </span>
                      <span className="mt-0.5 text-[9px] font-bold text-white drop-shadow-md">চ্যাট</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleShare(e, clip)}
                      className="group/btn flex flex-col items-center transition-transform active:scale-110"
                      title="অ্যাড ক্লিপস শেয়ার করুন (লিঙ্ক কপি)"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-white hover:text-slate-900 transition-colors">
                        <Share2 size={15} />
                      </span>
                      <span className="mt-0.5 text-[9px] font-bold text-white drop-shadow-md">
                        শেয়ার
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Blank Placeholder Frames (Exactly as requested by user) */
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-4 sm:gap-5">
          {[1, 2, 3, 4].map((slotIdx) => (
            <div
              key={slotIdx}
              className="group relative flex aspect-[9/16] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200/90 bg-white/70 p-4 text-center shadow-xs transition-all hover:border-emerald-400 hover:bg-white dark:border-slate-700/80 dark:bg-slate-800/40"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:bg-slate-700/60 dark:text-slate-500">
                <Video size={22} />
              </div>
              <h4 className="mt-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                Ads Clip Slot #{slotIdx}
              </h4>
              <p className="mt-1 text-[11px] text-slate-400">
                খালি স্লট (ভিডিও আপলোড হলে এখানে দেখাবে)
              </p>
              {user?.role === "owner" && (
                <Link
                  to="/dashboard?tab=pro&proTab=ads"
                  className="mt-3 inline-flex items-center gap-1 rounded-full bg-forest/10 px-3 py-1 text-[10px] font-bold text-forest transition hover:bg-forest hover:text-white dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <Plus size={11} />
                  <span>অ্যাড রান করুন</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===================== FULL SCREEN CLIPS MODAL ===================== */}
      {activeClip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 backdrop-blur-md sm:p-4 animate-fadeIn"
          onClick={() => setActiveModalClipIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveModalClipIndex(null)}
            className="absolute right-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-rose-600"
            title="Close viewer"
          >
            <X size={20} />
          </button>

          {/* Previous Clip Button */}
          {activeModalClipIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveModalClipIndex((prev) => Math.max(0, prev - 1));
              }}
              className="absolute left-2 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-md transition hover:bg-white/20 sm:left-6"
              title="পূর্ববর্তী ক্লিপ (Previous clip)"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Next Clip Button */}
          {activeModalClipIndex < clips.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveModalClipIndex((prev) => Math.min(clips.length - 1, prev + 1));
              }}
              className="absolute right-2 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-md transition hover:bg-white/20 sm:right-6"
              title="পরবর্তী ক্লিপ (Next clip)"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* 9:16 Vertical Modal Card */}
          <div
            className="relative flex aspect-[9/16] h-[90vh] max-h-[820px] w-auto max-w-full flex-col justify-between overflow-hidden rounded-3xl bg-black shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={activeClip.videoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onPlay={() => registerAdView(activeClip.id)}
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/70" />

            {/* High-Contrast Top Bar inside Modal with Prominent Back Button */}
            <div className="relative z-30 flex items-center justify-between border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md shadow-md">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => setActiveModalClipIndex(null)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white shadow-xs backdrop-blur-md transition-all hover:bg-white/35 active:scale-95"
                title="ফিরে যান (Back)"
              >
                <ArrowLeft size={16} />
                <span>ব্যাক</span>
              </button>

              {/* Center Title Badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500/80 via-pink-500/80 to-amber-500/80 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-xs backdrop-blur-md border border-white/20">
                <Sparkles size={12} className="text-amber-200" />
                <span>Ads Clips</span>
              </span>

              {/* Right Controls: Sound Toggle + Close Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white/35"
                  title={isMuted ? "সাউন্ড অন করুন" : "সাউন্ড মিউট করুন"}
                >
                  {isMuted ? <VolumeX size={15} className="text-rose-400" /> : <Volume2 size={15} className="text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalClipIndex(null)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-rose-600 hover:text-white"
                  title="বন্ধ করুন (Close)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Bottom Info & Action Controls */}
            <div className="relative z-10 flex items-end justify-between p-5 pb-6">
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white font-bold overflow-hidden border border-white/60">
                    {activeClip.shopLogo ? (
                      <img src={getImageUrl(activeClip.shopLogo)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span>{activeClip.shopName.slice(0, 1)}</span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-sm font-black text-white truncate">
                      <span>{activeClip.shopName}</span>
                      {activeClip.verified && <VerifiedBadge size={16} title="Verified Seller" />}
                    </p>
                    <span className="text-[10px] text-emerald-300 font-bold">● Active Local Seller</span>
                  </div>
                </div>

                <p className="mt-2 text-sm font-extrabold text-white leading-snug">
                  {activeClip.title}
                </p>
                {activeClip.caption && (
                  <p className="mt-1 line-clamp-2 text-xs text-white/80">
                    {activeClip.caption}
                  </p>
                )}

                {/* Direct Shop Link Button */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDirectMessage(e, activeClip)}
                    className="btn btn-sm rounded-full border-0 bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 shadow-md transition-all active:scale-95"
                  >
                    <MessageCircle size={14} />
                    <span>ম্যাসেজ পাঠান</span>
                  </button>
                  <Link
                    to="/shops"
                    onClick={() => setActiveModalClipIndex(null)}
                    className="btn btn-sm rounded-full border border-white/20 bg-white/10 px-3.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all active:scale-95"
                  >
                    <Store size={14} />
                    <span>শপ দেখুন</span>
                  </Link>
                </div>
              </div>

              {/* Vertical Actions inside Modal */}
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => handleToggleLike(e, activeClip.id)}
                  className="flex flex-col items-center transition-transform active:scale-125"
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full backdrop-blur-md transition-all ${
                      likedMap[activeClip.id]
                        ? "bg-rose-600 text-white shadow-lg shadow-rose-600/50"
                        : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                  >
                    <Heart size={20} className={likedMap[activeClip.id] ? "fill-white" : ""} />
                  </span>
                  <span className="mt-1 text-xs font-black text-white drop-shadow">
                    {activeClip.likes >= 1000 ? `${(activeClip.likes / 1000).toFixed(1)}k` : activeClip.likes}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleShare(e, activeClip)}
                  className="flex flex-col items-center group transition-transform active:scale-110"
                  title="অ্যাড লিঙ্ক কপি করুন"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-white hover:text-slate-900 transition-colors">
                    <Share2 size={18} />
                  </span>
                  <span className="mt-1 text-xs font-bold text-white drop-shadow">
                    শেয়ার
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
