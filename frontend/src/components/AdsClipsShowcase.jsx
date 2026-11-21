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
  BadgeCheck,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Store,
  Flame,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../utils/imageUrl";
import { VerifiedBadge } from "../utils/verification";

// 4 High Quality Sample Video Clips (using reliable verified 200 OK HTML5 streaming video assets)
const DEFAULT_CLIPS = [
  {
    id: "clip-1",
    shopName: "Rupayan Artisan Bakery",
    shopId: "shop-bakery-1",
    ownerId: "owner-bakery",
    shopLogo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80",
    verified: true,
    title: "ক্রিস্পি ফ্রেশ ফ্রেঞ্চ বাটার ক্রসাঁ ও এক্সপ্রেসো কম্বো 🥐☕",
    caption: "আজকের স্পেশাল অফারে যেকোনো কফির সাথে ক্রসাঁ মাত্র ৳১২০! হোম ডেলিভারি এভেইলেবল।",
    productName: "French Butter Croissant",
    productLink: "/shops",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    poster: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
    likes: 1420,
    shares: 312,
    views: 18400,
    status: "active",
  },
  {
    id: "clip-2",
    shopName: "Dhaka Royal Heritage",
    shopId: "shop-fashion-2",
    ownerId: "owner-fashion",
    shopLogo: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=150&auto=format&fit=crop&q=80",
    verified: true,
    title: "প্রিমিয়াম হ্যান্ডক্রাফটেড শেরওয়ানি ও এক্সক্লুসিভ পাঞ্জাবি কালেকশন ✨",
    caption: "সম্পূর্ণ খাঁটি সুতি ও সিল্কের কারুকাজ করা নতুন কালেকশন। বিয়ের সিজনের জন্য প্রি-অর্ডার চলছে।",
    productName: "Royal Heritage Panjabi",
    productLink: "/shops",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    poster: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80",
    likes: 2850,
    shares: 640,
    views: 34200,
    status: "active",
  },
  {
    id: "clip-3",
    shopName: "Badda Tech & Gadget Zone",
    shopId: "shop-tech-3",
    ownerId: "owner-tech",
    shopLogo: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=150&auto=format&fit=crop&q=80",
    verified: true,
    title: "আল্ট্রা ক্লিয়ার সাউন্ড ANC ওয়্যারলেস ইয়ারবাডস আনবক্সিং 🎧🔥",
    caption: "অ্যাক্টিভ নয়েজ ক্যান্সেলেশন ও ৪০ ঘণ্টা ব্যাটারি লাইফ। সীমিত সময়ের জন্য ফ্ল্যাট ২৫% ডিসকাউন্ট!",
    productName: "ANC Pro Wireless Earbuds",
    productLink: "/shops",
    videoUrl: "https://www.w3schools.com/tags/movie.mp4",
    poster: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    likes: 980,
    shares: 245,
    views: 12500,
    status: "active",
  },
  {
    id: "clip-4",
    shopName: "Green Life Bonsai & Plants",
    shopId: "shop-plants-4",
    ownerId: "owner-plants",
    shopLogo: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=150&auto=format&fit=crop&q=80",
    verified: true,
    title: "ইনডোর এয়ার পিউরিফাইং এক্সোটিক বনসাই ও ডেকোরেশন প্ল্যান্টস 🌿",
    caption: "ঘরের সৌন্দর্য বৃদ্ধি ও ফ্রেশ বাতাসের জন্য জীবন্ত মিনি ফাইকাস বনসাই। সাথে পাচ্ছেন সিরামিক পট ফ্রি।",
    productName: "Miniature Ficus Bonsai",
    productLink: "/shops",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
    poster: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600&auto=format&fit=crop&q=80",
    likes: 1140,
    shares: 198,
    views: 15300,
    status: "active",
  },
];

export default function AdsClipsShowcase() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load clips from default + any active owner campaign clips
  const [clips, setClips] = useState(() => {
    try {
      const saved = localStorage.getItem("ls_ad_campaigns");
      if (saved) {
        const campaigns = JSON.parse(saved);
        // Find campaigns that have video or are active
        const campaignClips = campaigns
          .filter((c) => c.status === "active" && (c.videoUrl || c.isClip || (c.placement && c.placement.includes("3d_spotlight"))))
          .map((c, idx) => ({
            id: c.id || `camp-clip-${idx}`,
            shopName: c.targetTitle || "Local Business",
            shopId: c.targetId || "shop-custom",
            ownerId: c.ownerId || user?._id || "owner-demo",
            shopLogo: c.shopLogo || "",
            verified: true,
            title: c.name || "Exclusive Local Offer",
            caption: c.caption || "Special neighborhood sponsored ad clip. Contact seller for instant booking.",
            productName: c.targetTitle || "Featured Product",
            productLink: "/shops",
            videoUrl: c.videoUrl || DEFAULT_CLIPS[idx % DEFAULT_CLIPS.length].videoUrl,
            poster: c.poster || DEFAULT_CLIPS[idx % DEFAULT_CLIPS.length].poster,
            likes: c.likes || 120 + idx * 45,
            shares: c.shares || 35 + idx * 12,
            views: c.impressions || 1500,
            status: "active",
          }));

        if (campaignClips.length > 0) {
          // Merge custom campaign clips first, filling up to 4 with defaults
          const merged = [...campaignClips];
          for (const d of DEFAULT_CLIPS) {
            if (merged.length < 4 && !merged.some((m) => m.id === d.id)) {
              merged.push(d);
            }
          }
          return merged.slice(0, 4);
        }
      }
    } catch (e) {}
    return DEFAULT_CLIPS;
  });

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

  // Full-screen Shorts/Reels Modal state
  const [activeModalClipIndex, setActiveModalClipIndex] = useState(null);

  // Handle Like Button click
  const handleToggleLike = (e, clipId) => {
    e.stopPropagation();
    const isCurrentlyLiked = Boolean(likedMap[clipId]);
    const updatedMap = { ...likedMap, [clipId]: !isCurrentlyLiked };
    setLikedMap(updatedMap);
    localStorage.setItem("ls_clips_liked_map", JSON.stringify(updatedMap));

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
      }
    } catch (err) {}

    if (!isCurrentlyLiked) {
      toast.success("❤️ অ্যাড ক্লিপসটিতে লাইক দেওয়া হয়েছে!", { id: "clip-like" });
    }
  };

  // Handle Share Button click
  const handleShare = (e, clip) => {
    e.stopPropagation();
    const shareUrl = window.location.origin + `?clip=${clip.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("🔗 অ্যাড ক্লিপস লিঙ্ক কপি করা হয়েছে!", { id: "clip-share" });
    } else {
      toast.success("অ্যাড ক্লিপস শেয়ার করা হয়েছে!");
    }

    setClips((prev) =>
      prev.map((c) => (c.id === clip.id ? { ...c, shares: c.shares + 1 } : c))
    );

    // Sync share count to campaign in localStorage
    try {
      const saved = localStorage.getItem("ls_ad_campaigns");
      if (saved) {
        const camps = JSON.parse(saved);
        const updatedCamps = camps.map((camp) => {
          if (camp.id === clip.id) {
            return { ...camp, shares: (camp.shares || 0) + 1 };
          }
          return camp;
        });
        localStorage.setItem("ls_ad_campaigns", JSON.stringify(updatedCamps));
      }
    } catch (err) {}
  };

  // Handle Direct Message to Owner
  const handleDirectMessage = (e, clip) => {
    e.stopPropagation();
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
      {/* Section Header (Reels / Shorts Style) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 text-white shadow-md shadow-pink-500/25">
            <Flame size={20} className="animate-pulse" />
            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-forest dark:text-white sm:text-2xl">
                ক্লিপস অ্যাডস (Ads Clips)
              </h2>
              <span className="rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-xs">
                REELS 🔥
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              আপনার আশেপাশের ভেরিফাইড দোকান ও প্রোডাক্টের আকর্ষণীয় শর্ট ভিডিও ও স্পেশাল অফার
            </p>
          </div>
        </div>

        {/* Global Sound & Controls */}
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
      </div>

      {/* Exactly 4 Vertical Reels / Shorts Cards Grid */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-4 sm:gap-5">
        {clips.map((clip, index) => {
          const isLiked = Boolean(likedMap[clip.id]);

          return (
            <div
              key={clip.id}
              onClick={() => setActiveModalClipIndex(index)}
              className="group relative flex aspect-[9/16] cursor-pointer flex-col justify-between overflow-hidden rounded-3xl bg-slate-900 p-3 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/25 sm:p-4"
            >
              {/* HTML5 Autoplay Looping Video */}
              <video
                src={clip.videoUrl}
                poster={clip.poster}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradient overlays for contrast & modern aesthetic */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/60" />

              {/* Top Header Row on Card */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 backdrop-blur-md">
                  <Sparkles size={11} className="text-amber-400" />
                  <span>Sponsored</span>
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white/90 backdrop-blur-md">
                  <Eye size={11} />
                  <span>{(clip.views / 1000).toFixed(1)}k</span>
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
                {/* Shop & Product Details */}
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

                {/* Vertical Reels Action Column (Instagram/FB style) */}
                <div className="flex flex-col items-center gap-2.5 shrink-0">
                  {/* Like Button */}
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

                  {/* Message to Owner Button */}
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

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={(e) => handleShare(e, clip)}
                    className="group/btn flex flex-col items-center transition-transform active:scale-110"
                    title="ক্লিপস শেয়ার করুন"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-blue-600 hover:text-white transition-colors">
                      <Share2 size={15} />
                    </span>
                    <span className="mt-0.5 text-[9px] font-bold text-white drop-shadow-md">
                      {clip.shares}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================== FULL-SCREEN REELS / SHORTS VIEWER MODAL ===================== */}
      {activeClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-md animate-fadeIn">
          {/* Close Modal Button */}
          <button
            type="button"
            onClick={() => setActiveModalClipIndex(null)}
            className="absolute right-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Previous Clip Button */}
          {activeModalClipIndex > 0 && (
            <button
              type="button"
              onClick={() => setActiveModalClipIndex((prev) => prev - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 hidden sm:grid h-12 w-12 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 transition"
              title="পূর্ববর্তী ক্লিপ"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Next Clip Button */}
          {activeModalClipIndex < clips.length - 1 && (
            <button
              type="button"
              onClick={() => setActiveModalClipIndex((prev) => prev + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 hidden sm:grid h-12 w-12 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 transition"
              title="পরবর্তী ক্লিপ"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* 9:16 Full Shorts / Reels Frame */}
          <div className="relative flex h-[85vh] max-h-[780px] w-full max-w-[420px] flex-col justify-between overflow-hidden rounded-[32px] bg-slate-950 shadow-2xl">
            {/* Modal Video Player with Sound */}
            <video
              src={activeClip.videoUrl}
              autoPlay
              loop
              controls
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Gradient Mask for Overlay Content */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/60" />

            {/* Top Bar inside Modal */}
            <div className="relative z-10 flex items-center justify-between p-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-black uppercase text-amber-300 backdrop-blur-md">
                <Sparkles size={12} className="text-amber-400" />
                <span>Ads Clips · Reels</span>
              </span>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
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
                <p className="mt-1 line-clamp-2 text-xs text-white/80">
                  {activeClip.caption}
                </p>

                {/* Direct Shop Link Button */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDirectMessage(e, activeClip)}
                    className="btn btn-sm rounded-full border-0 bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 shadow-md"
                  >
                    <MessageCircle size={14} />
                    <span>ম্যাসেজ পাঠান</span>
                  </button>
                  <Link
                    to="/shops"
                    onClick={() => setActiveModalClipIndex(null)}
                    className="btn btn-sm rounded-full border border-white/20 bg-white/10 px-3.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20"
                  >
                    <Store size={14} />
                    <span>শপ দেখুন</span>
                  </Link>
                </div>
              </div>

              {/* Modal Right Column Actions */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleToggleLike(e, activeClip.id)}
                  className="flex flex-col items-center transition-transform active:scale-125"
                >
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-full backdrop-blur-md ${
                      likedMap[activeClip.id]
                        ? "bg-rose-600 text-white shadow-lg shadow-rose-600/50"
                        : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                  >
                    <Heart size={20} className={likedMap[activeClip.id] ? "fill-white" : ""} />
                  </span>
                  <span className="mt-1 text-xs font-black text-white">
                    {activeClip.likes >= 1000 ? `${(activeClip.likes / 1000).toFixed(1)}k` : activeClip.likes}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDirectMessage(e, activeClip)}
                  className="flex flex-col items-center transition-transform active:scale-110"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-emerald-600 transition-colors">
                    <MessageCircle size={19} />
                  </span>
                  <span className="mt-1 text-xs font-bold text-white">চ্যাট</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleShare(e, activeClip)}
                  className="flex flex-col items-center transition-transform active:scale-110"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-blue-600 transition-colors">
                    <Share2 size={19} />
                  </span>
                  <span className="mt-1 text-xs font-bold text-white">{activeClip.shares}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
