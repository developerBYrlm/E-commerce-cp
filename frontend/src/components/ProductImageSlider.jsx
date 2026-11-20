import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { getImageUrl } from "../utils/imageUrl";

export default function ProductImageSlider({
  images = [],
  alt = "",
  className = "h-48 w-full",
  imageClassName = "object-cover",
  interval = 3200,
  showControls = true,
  showDots = true,
  showBadge = true,
  rounded = "rounded-2xl",
  currentIndex = null,
  onIndexChange = null,
  fallbackIcon: FallbackIcon = null,
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const validImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const index = currentIndex !== null && currentIndex !== undefined ? currentIndex : internalIndex;

  const setIndex = (newIndex) => {
    const nextIdx = typeof newIndex === "function" ? newIndex(index) : newIndex;
    setInternalIndex(nextIdx);
    if (onIndexChange) {
      onIndexChange(nextIdx);
    }
  };

  useEffect(() => {
    if (validImages.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % validImages.length);
    }, interval);
    return () => clearInterval(timer);
  }, [validImages.length, isHovered, interval]);

  if (!validImages.length) {
    return (
      <div className={`grid place-items-center bg-gradient-to-br from-lime/30 to-emerald-100/70 text-forest/60 select-none ${rounded} ${className}`}>
        {FallbackIcon ? <FallbackIcon size={28} className="opacity-70" /> : <ImageIcon size={28} className="opacity-50" />}
      </div>
    );
  }

  if (validImages.length === 1) {
    return (
      <div className={`relative overflow-hidden select-none ${rounded} ${className}`}>
        <img
          src={getImageUrl(validImages[0])}
          alt={alt}
          className={`h-full w-full ${imageClassName}`}
          loading="lazy"
        />
      </div>
    );
  }

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % validImages.length);
  };

  return (
    <div
      className={`group relative overflow-hidden bg-slate-900 select-none ${rounded} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sliding Strip */}
      <div
        className="flex h-full w-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {validImages.map((img, i) => (
          <div key={i} className="h-full w-full shrink-0 relative bg-slate-950/20 flex items-center justify-center">
            <img
              src={getImageUrl(img)}
              alt={`${alt} ${i + 1}`}
              className={`h-full w-full ${imageClassName}`}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Slide Badge Counter */}
      {showBadge && (
        <span className="absolute top-2 right-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-xs pointer-events-none">
          📷 {index + 1}/{validImages.length}
        </span>
      )}

      {/* Prev / Next Arrows */}
      {showControls && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-forest shadow-md backdrop-blur-xs transition opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110"
            title="Previous image"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-forest shadow-md backdrop-blur-xs transition opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110"
            title="Next image"
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}

      {/* Slide Dots Indicator */}
      {showDots && (
        <div className="absolute bottom-2 inset-x-0 z-10 flex justify-center gap-1 pointer-events-auto">
          {validImages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                index === i ? "w-4 bg-white shadow-sm" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
              title={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
