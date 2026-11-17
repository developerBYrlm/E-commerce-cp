import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Search, ShoppingBag, MessageSquare, MapPin } from "lucide-react";
import api from "../../api/client";
import { getImageUrl } from "../../utils/imageUrl";

export default function NewChatModal({ isOpen, onClose, onSelectOwner }) {
  const [search, setSearch] = useState("");

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ["/shops/chat-available", search],
    queryFn: async () => {
      const res = await api.get("/shops", {
        params: { status: "active", q: search || undefined, limit: 30 },
      });
      return res.data.items || [];
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1d3329] p-5 shadow-2xl border border-slate-200/80 dark:border-forest/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-forest/10 pb-3">
            <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-lime/20 dark:text-lime">
                  <ShoppingBag size={16} />
                </div>
                <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-cream text-base">
                      Message a Shop
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Choose a neighborhood shop to start chatting
                    </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#263c31] hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="mt-3 relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shops by name…"
                className="w-full rounded-2xl border border-slate-200/80 dark:border-forest/15 bg-slate-50 dark:bg-[#263c31] py-2 pl-9 pr-3 text-xs text-slate-800 dark:text-cream placeholder-slate-400 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {/* Shop List */}
              <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-forest/5 no-scrollbar">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="h-10 w-10 rounded-2xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                          <div className="h-2 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : shops.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    No matching active shops found.
                  </p>
                ) : (
                  shops.map((shop) => {
                    const ownerId = shop.owner?._id || shop.owner;
                    return (
                      <div
                        key={shop._id}
                        className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 dark:hover:bg-[#263c31]/50 rounded-2xl transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-[#263c31] border border-slate-200/80 flex items-center justify-center font-bold text-emerald-800 dark:text-lime">
                              {shop.logo ? (
                                <img
                                  src={getImageUrl(shop.logo, "owners")}
                                  alt={shop.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                shop.name?.slice(0, 1)
                              )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="truncate font-bold text-slate-900 dark:text-cream text-xs">
                                  {shop.name}
                                </h4>
                                <p className="truncate text-[11px] text-slate-500 flex items-center gap-1">
                                  <MapPin size={10} className="shrink-0" />
                                  {[shop.district, shop.area].filter(Boolean).join(", ") || "Neighborhood"}
                                </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onSelectOwner(ownerId);
                              onClose();
                            }}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-bold shadow-xs hover:scale-105 active:scale-95 transition"
                          >
                            <MessageSquare size={12} />
                            <span>Chat</span>
                          </button>
                        </div>
                        );
            })
          )}
                      </div>
      </div>
            </div>
            );
}
