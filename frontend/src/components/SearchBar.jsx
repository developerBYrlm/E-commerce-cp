import { Search, X, Sparkles, Store, Package, Wrench, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import { formatCurrency } from "../utils/currency";
import { getImageUrl } from "../utils/imageUrl";

  export default function SearchBar({
    large = false,
    initialQuery = "",
    placeholder = "Search shops, services, products…",
    onSearch,
    currentKind, // "shops", "products", "services"
  }) {
    const [query, setQuery] = useState(initialQuery);
    const [focused, setFocused] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
    const containerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
      setQuery(initialQuery);
    }, [initialQuery]);

    useEffect(() => {
      const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 200);
      return () => window.clearTimeout(timer);
    }, [query]);

    // Click outside listener to reliably close suggestions dropdown
    useEffect(() => {
      function handleClickOutside(event) {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setFocused(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const suggestions = useQuery({
      queryKey: ["/search/suggestions", debouncedQuery, currentKind],
      queryFn: async () => {
        const response = await api.get("/search/suggestions", {
          params: { q: debouncedQuery, type: currentKind },
        });
        return response.data;
      },
      staleTime: 30_000,
    });

      function executeSearch(searchTerm) {
        const term = (searchTerm ?? query).trim();
        setFocused(false);
        if (onSearch) {
          onSearch(term);
        } else {
          navigate(`/search?q=${encodeURIComponent(term)}`);
        }
      }

        function handleFormSubmit(event) {
          event.preventDefault();
          executeSearch();
        }

        function handleKeywordClick(keyword) {
          setQuery(keyword);
          executeSearch(keyword);
        }

        const data = suggestions.data || {};
        const recommendedKeywords = data.recommendedKeywords || [];
        const shops = data.shops || [];
        const products = data.products || [];
        const services = data.services || [];
        const hasResults =
          recommendedKeywords.length > 0 || shops.length > 0 || products.length > 0 || services.length > 0;

        return (
          <div ref={containerRef} className={`relative w-full ${large ? "max-w-2xl" : ""}`}>
            {/* Search Input Box with Pixel-Perfect Icon & Placeholder Vertical Alignment */}
            <form
              onSubmit={handleFormSubmit}
              className="group relative flex h-12 sm:h-14 w-full items-center rounded-2xl border border-forest/15 bg-white pl-3.5 pr-1.5 sm:pl-4 sm:pr-2 shadow-sm transition-all focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:bg-slate-900/90 dark:border-forest/30"
            >
              {/* Search Icon - Perfectly vertically centered */}
              <Search
                size={19}
                className="shrink-0 text-emerald-800/70 transition group-focus-within:text-emerald-700 mr-2.5 sm:mr-3 dark:text-emerald-400"
              />

              {/* Input Field - Same line-height and vertical center */}
              <input
                type="text"
                value={query}
                onChange={(event) => {
                  const val = event.target.value;
                  setQuery(val);
                  if (onSearch) onSearch(val);
                }}
                onFocus={() => setFocused(true)}
                placeholder={placeholder}
                aria-label="Search listings"
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm sm:text-base text-forest outline-none placeholder:text-slate-400 placeholder:font-normal focus:outline-none dark:text-slate-100"
              />

              {/* Clear Button */}
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    if (onSearch) onSearch("");
                  }}
                  className="mr-2 grid h-6 w-6 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition dark:hover:bg-slate-800"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}

              {/* Modern Search Button */}
              <button
                type="submit"
                className="group/btn relative inline-flex h-9 sm:h-10 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#1b3d30] via-[#244d3d] to-[#2e6e55] px-4 sm:px-5 text-xs sm:text-sm font-bold text-white shadow-md shadow-forest/20 transition-all duration-200 hover:shadow-lg hover:shadow-forest/30 hover:brightness-110 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 select-none cursor-pointer dark:from-emerald-700 dark:via-emerald-600 dark:to-teal-700 dark:shadow-emerald-950/40"
              >
                {/* Subtle shine sweep on hover */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full" />
                <Search size={15} className="shrink-0 transition-transform duration-200 group-hover/btn:scale-110" />
                <span className="tracking-tight">Search</span>
              </button>
            </form>

            {/* Live Suggestions & Recommendations Popover Dropdown */}
            {focused && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[460px] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-3 shadow-2xl backdrop-blur-md">
                {/* Near-match and Related Keyword Recommendations */}
                {recommendedKeywords.length > 0 && (
                  <div className="mb-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                      <Sparkles size={13} className="text-amber-500" />
                      <span>Suggested Keywords &amp; Products (প্রস্তাবিত কিওয়ার্ড ও প্রোডাক্ট)</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 px-1">
                      {recommendedKeywords.map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleKeywordClick(kw)}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100 hover:border-emerald-300 active:scale-95"
                        >
                          #{kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categorized Matches: Shops, Products, Services */}
                {debouncedQuery.length >= 1 ? (
                  <div className="space-y-3">
                    {/* Matching Shops */}
                    {shops.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Store size={13} className="text-forest" /> Matching Shops ({shops.length})
                        </p>
                        <div className="mt-1 space-y-1">
                          {shops.map((shop) => (
                            <div
                              key={shop._id}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setFocused(false);
                                navigate(`/shops/${shop._id}`);
                              }}
                              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2 transition hover:bg-cream/70"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime/40 text-forest font-bold text-xs shrink-0 overflow-hidden">
                                  {shop.logo ? (
                                    <img src={getImageUrl(shop.logo)} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    shop.name?.slice(0, 1)
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-xs sm:text-sm font-bold text-forest">{shop.name}</p>
                                  <p className="truncate text-[11px] text-slate-500">
                                    {[shop.area, shop.district].filter(Boolean).join(", ") || "Local business"}
                                  </p>
                                </div>
                              </div>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 shrink-0 capitalize">
                                {shop.shopType === "service" ? "Service" : "Product"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Products */}
                    {products.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Package size={13} className="text-emerald-700" /> Matching Products ({products.length})
                        </p>
                        <div className="mt-1 space-y-1">
                          {products.map((prod) => (
                            <div
                              key={prod._id}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setFocused(false);
                                navigate(`/products/${prod._id}`);
                              }}
                              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2 transition hover:bg-cream/70"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 text-xs shrink-0 overflow-hidden">
                                  {prod.images?.[0] ? (
                                    <img src={getImageUrl(prod.images[0])} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <Package size={14} />
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-xs sm:text-sm font-bold text-forest">{prod.name}</p>
                                  <p className="truncate text-[11px] text-slate-500">
                                    {prod.shop?.name || "Local Shop"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-forest">
                                  {prod.isNegotiable ? "Negotiable" : formatCurrency(prod.discountPrice || prod.price)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Services */}
                    {services.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Wrench size={13} className="text-sky-700" /> Matching Services ({services.length})
                        </p>
                        <div className="mt-1 space-y-1">
                          {services.map((serv) => (
                            <div
                              key={serv._id}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setFocused(false);
                                navigate(`/services/${serv._id}`);
                              }}
                              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2 transition hover:bg-cream/70"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-50 text-sky-700 text-xs shrink-0 overflow-hidden">
                                  {serv.images?.[0] ? (
                                    <img src={getImageUrl(serv.images[0])} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <Wrench size={14} />
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-xs sm:text-sm font-bold text-forest">{serv.name}</p>
                                  <p className="truncate text-[11px] text-slate-500">
                                    {serv.shop?.name || "Local Professional"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-forest">
                                  {serv.isNegotiable ? "Negotiable" : formatCurrency(serv.price)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No match indicator */}
                    {!hasResults && !suggestions.isLoading && (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No direct matches found. Press Enter to search everywhere for "{query}".
                      </div>
                    )}

                    {/* View all results footer */}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeSearch()}
                      className="mt-2 flex w-full items-center justify-between rounded-xl bg-forest/5 px-3 py-2.5 text-xs font-bold text-forest hover:bg-forest hover:text-white transition"
                    >
                      <span>Press Enter to search for "{query}"</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Type to search across shops, products, and services in your neighborhood.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
