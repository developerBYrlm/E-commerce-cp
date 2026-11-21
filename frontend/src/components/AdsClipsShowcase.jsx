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
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Store,
  Flame,
  Eye,
  Video,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/client";
import { getImageUrl } from "../utils/imageUrl";
import { VerifiedBadge } from "../utils/verification";

export default function AdsClipsShowcase() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load only real active campaign clips from localStorage (NO demo/fake clips)
  // Active clips fetched from backend server API (aggregating all active campaigns from all owners)
  const [clips, setClips] = useState([]);

  // Fetch active campaigns from backend API so all users & browsers (logged in or guests) see live ad clips
  useEffect(() => {
    let isMounted = true;
    async function fetchCampaigns() {
      try {
        const res = await api.get("/campaigns");
        const serverCampaigns = res.data?.campaigns || [];
        if (serverCampaigns.length > 0 && isMounted) {
          const userArea = (user?.address?.district || user?.address?.area || user?.district || "").toLowerCase().trim();
          const mapped = serverCampaigns
            .filter((c) => {
              if (c.status !== "active") return false;
              if (!c.videoUrl || typeof c.videoUrl !== "string" || c.videoUrl.trim().length === 0) return false;
              if (c.targetArea && c.targetArea !== "সকল এলাকা" && userArea) {
                const campArea = c.targetArea.toLowerCase().trim();
                if (!campArea.includes(userArea) && !userArea.includes(campArea)) return false;
              }
              return true;
            })
            .map((c, idx) => ({
              id: c.id || c._id || `camp-clip-${idx}`,
              shopName: c.shopName || "RUPAYAN",
              shopId: c.shop?._id || c.shop || "shop-main",
              ownerId: c.owner?._id || c.owner || "owner-demo",
              shopLogo: c.shopLogo || "",
              verified: c.verified !== false,
              title: c.title || c.name || "Special Neighborhood Offer",
              caption: c.caption || "",
              productName: c.target || "Featured Item",
              productLink: "/shops",
              videoUrl: c.videoUrl,
              poster: c.poster || "",
              likes: Number(c.likes || 0),
              shares: Number(c.shares || 0),
              views: Number(c.impressions || 0),
              targetArea: c.targetArea || "সকল এলাকা",
              status: "active",
            }));
          if (mapped.length > 0) {
            setClips(mapped);
          }
        }
      } catch (err) {
        console.warn("Failed to load server campaigns, using fallback:", err);
      }
    }
    fetchCampaigns();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Sound muted state (default true for web autoplay compliance)
  const [isMuted, setIsMuted] = useState(true);

  // Track liked status per clip in localStorage
  const [likedMap, setLikedMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ls_clips_liked_map") || "{}");
    } catch (e) {
      return {};
    }
  });

  // Full-screen Shorts/Clips Modal state
  const [activeModalClipIndex, setActiveModalClipIndex] = useState(null);

  // Navigate to Next Clip (Facebook Reels style scroll down)
  const handleNextClip = () => {
    if (activeModalClipIndex !== null && activeModalClipIndex < clips.length - 1) {
      handleOpenClip(activeModalClipIndex + 1);
    }
  };

  // Navigate to Previous Clip (Facebook Reels style scroll up)
  const handlePrevClip = () => {
    if (activeModalClipIndex !== null && activeModalClipIndex > 0) {
      handleOpenClip(activeModalClipIndex - 1);
    }
  };

  // Wheel and keyboard arrow navigation for Facebook Reels style one-after-another scrolling
  useEffect(() => {
    if (activeModalClipIndex === null) return;

    let wheelDebounce = false;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        handleNextClip();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        handlePrevClip();
      } else if (e.key === "Escape") {
        setActiveModalClipIndex(null);
      }
    };

    const handleWheel = (e) => {
      if (wheelDebounce) return;
      if (e.deltaY > 30) {
        wheelDebounce = true;
        handleNextClip();
        setTimeout(() => { wheelDebounce = false; }, 400);
      } else if (e.deltaY < -30) {
        wheelDebounce = true;
        handlePrevClip();
        setTimeout(() => { wheelDebounce = false; }, 400);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [activeModalClipIndex, clips.length]);

  // Open modal and increment real view count on click (whenever video is opened on user screen)
  const handleOpenClip = (index) => {
    setActiveModalClipIndex(index);
    const clip = clips[index];
    if (!clip) return;

    // Increment view count in local state
    setClips((prev) =>
      prev.map((c) =>
        c.id === clip.id ? { ...c, views: (c.views || 0) + 1 } : c
      )
    );

    // Call backend API to record view count persistently on server
    if (clip.id) {
      api.patch(`/campaigns/${clip.id}/interaction`, { action: "view" }).catch(() => {});
    }
  };

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

    // Call backend API to record like/unlike persistently on server
    api.patch(`/campaigns/${clipId}/interaction`, { action: isCurrentlyLiked ? "unlike" : "like" }).catch(() => {});

    if (!isCurrentlyLiked) {
      toast.success("❤️ অ্যাড ক্লিপসটিতে লাইক দেওয়া হয়েছে!", { id: "clip-like" });
    }
  };

  // Handle Share Button click (copies link without incrementing numeric counter)
  const handleShare = (e, clip) => {
    e.stopPropagation();
    const shareUrl = window.location.origin + `?clip=${clip.id}`;

    // Call backend API to record share interaction persistently on server
    if (clip.id) {
      api.patch(`/campaigns/${clip.id}/interaction`, { action: "share" }).catch(() => {});
    }

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

    // Increment click count for this ad campaign on server
    if (clip.id) {
      api.patch(`/campaigns/${clip.id}/interaction`, { action: "click" }).catch(() => {});
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
            <h2 className="text-xl font-black tracking-tight text-forest dark:text-white sm:text-2xl">
              Clips Ads
            </h2>
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
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX size={14} className="text-rose-500" /> : <Volume2 size={14} className="text-emerald-500" />}
              <span>{isMuted ? "Sound Off" : "Sound On"}</span>
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
                onClick={() => handleOpenClip(index)}
                className="group relative flex aspect-[9/16] cursor-pointer flex-col justify-between overflow-hidden rounded-3xl bg-slate-900 p-3 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/25 sm:p-4"
              >
                {/* HTML5 Autoplay Looping Video Preview (Does NOT increment view count on refresh) */}
                <video
                  src={clip.videoUrl}
                  poster={clip.poster}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
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
                      title="Chat with shop owner"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-emerald-600 hover:text-white transition-colors">
                        <MessageCircle size={15} />
                      </span>
                      <span className="mt-0.5 text-[9px] font-bold text-white drop-shadow-md">Chat</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleShare(e, clip)}
                      className="group/btn flex flex-col items-center transition-transform active:scale-110"
                      title="Share clip link"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-white hover:text-slate-900 transition-colors">
                        <Share2 size={15} />
                      </span>
                      <span className="mt-0.5 text-[9px] font-bold text-white drop-shadow-md">
                        Share
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Blank Placeholder Frames */
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-5 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveModalClipIndex(null)}
        >
          {/* Floating Facebook Reels / TikTok style Vertical Reel-switch buttons */}
          <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3 select-none">
            {activeModalClipIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevClip();
                }}
                className="grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all hover:bg-emerald-600 hover:scale-110 active:scale-95"
                title="Previous Reel (Scroll Up)"
              >
                <ChevronUp size={22} />
              </button>
            )}

            {activeModalClipIndex < clips.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextClip();
                }}
                className="grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all hover:bg-emerald-600 hover:scale-110 active:scale-95"
                title="Next Reel (Scroll Down)"
              >
                <ChevronDown size={22} />
              </button>
            )}
          </div>

          {/* Previous Clip Button (Desktop Horizontal Left) */}
          {activeModalClipIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenClip(Math.max(0, activeModalClipIndex - 1));
              }}
              className="absolute left-2 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95 sm:left-6 hidden md:grid"
              title="Previous clip"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Next Clip Button (Desktop Horizontal Right) */}
          {activeModalClipIndex < clips.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenClip(Math.min(clips.length - 1, activeModalClipIndex + 1));
              }}
              className="absolute right-16 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95 sm:right-20 hidden md:grid"
              title="Next clip"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Vertical Modal Card - Fitted to Screen without Clipping */}
          <div
            className="relative flex h-[86vh] max-h-[760px] w-full max-w-[430px] flex-col justify-between overflow-hidden rounded-3xl bg-slate-950 shadow-2xl border border-white/15 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Blurred Video Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
              <video
                src={activeClip.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover blur-2xl opacity-40 scale-125"
              />
              <div className="absolute inset-0 bg-black/60" />
            </div>

            {/* Video Container - Fitted with object-contain so NO part of the video is cropped */}
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <video
                src={activeClip.videoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="h-full w-full object-contain"
              />
            </div>

            {/* Modern High-Contrast Top Bar inside Modal */}
            <div className="relative z-30 flex shrink-0 items-center justify-between border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md shadow-md">
              {/* Back Button (English) */}
              <button
                type="button"
                onClick={() => setActiveModalClipIndex(null)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs backdrop-blur-md transition hover:bg-white/30 active:scale-95"
                title="Back"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              {/* Center Title Badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-xs backdrop-blur-md border border-white/15">
                <Sparkles size={12} className="text-amber-400" />
                <span>Ads Clips</span>
              </span>

              {/* Right Controls: Sound Toggle + Close Button (English) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/30 active:scale-95"
                  title={isMuted ? "Unmute Sound" : "Mute Sound"}
                >
                  {isMuted ? <VolumeX size={15} className="text-rose-400" /> : <Volume2 size={15} className="text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalClipIndex(null)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-rose-600 hover:text-white active:scale-95"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Bottom Info & Action Controls */}
            <div className="relative z-30 flex items-end justify-between p-5 pb-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
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

                {/* Direct Shop Link Button (English) */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDirectMessage(e, activeClip)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500 active:scale-95"
                  >
                    <MessageCircle size={14} />
                    <span>Send Message</span>
                  </button>
                  <Link
                    to="/shops"
                    onClick={() => setActiveModalClipIndex(null)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
                  >
                    <Store size={14} />
                    <span>View Shop</span>
                  </Link>
                </div>
              </div>

              {/* Vertical Actions inside Modal (English) */}
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => handleToggleLike(e, activeClip.id)}
                  className="flex flex-col items-center transition-transform active:scale-125"
                  title={likedMap[activeClip.id] ? "Unlike" : "Like"}
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
                  onClick={(e) => handleDirectMessage(e, activeClip)}
                  className="flex flex-col items-center group transition-transform active:scale-110"
                  title="Chat with seller"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-emerald-600 hover:text-white transition-colors">
                    <MessageCircle size={18} />
                  </span>
                  <span className="mt-1 text-xs font-bold text-white drop-shadow">
                    Chat
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleShare(e, activeClip)}
                  className="flex flex-col items-center group transition-transform active:scale-110"
                  title="Share clip link"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-white hover:text-slate-900 transition-colors">
                    <Share2 size={18} />
                  </span>
                  <span className="mt-1 text-xs font-bold text-white drop-shadow">
                    Share
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
