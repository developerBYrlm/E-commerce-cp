import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Search, Star, Store, X, SlidersHorizontal } from "lucide-react";
import SearchBar from "../components/SearchBar";
import ShopCard from "../components/ShopCard";
import { useCollection } from "../hooks/useApi";
import { CardSkeleton } from "../components/Loader";
import toast from "react-hot-toast";
import { formatCurrency } from "../utils/currency";
import { getImageUrl } from "../utils/imageUrl";
import { useAuth } from "../contexts/AuthContext";
import {
  BANGLADESH_DIVISIONS,
  getDistrictsByDivision,
  getSubDistrictsByDistrict,
} from "../../../shared/bangladeshAdministrativeData.js";
import { useState } from "react";

export default function SearchPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [showLocationFilter, setShowLocationFilter] = useState(false);

  const activeDistrict = params.get("district") || "";
  const activeSubDistrict = params.get("subDistrict") || "";
  const activeArea = params.get("area") || "";

  const query = useCollection("/search", {
    q: params.get("q") || "",
    location: params.get("location") || undefined,
    lat: params.get("lat") || undefined,
    lng: params.get("lng") || undefined,
    distance: params.get("distance") || undefined,
    verified: params.get("verified") || undefined,
    minRating: params.get("minRating") || undefined,
    district: activeDistrict || undefined,
    subDistrict: activeSubDistrict || undefined,
    area: activeArea || undefined,
  });

  const results = query.data?.results || {};
  const total = Object.values(query.data?.counts || {}).reduce((sum, count) => sum + count, 0);

  function nearMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = new URLSearchParams(params);
        next.set("lat", String(coords.latitude));
        next.set("lng", String(coords.longitude));
        setParams(next);
      },
      () => toast.error("Location is unavailable. Check your browser's location permission."),
      { timeout: 8000, maximumAge: 60_000 }
    );
  }

  function nearby() {
    if (!user?.district || !user?.subDistrict || !user?.area) {
      toast.error("Add your district, sub-district, and area in profile settings first.");
      return;
    }
    const next = new URLSearchParams(params);
    next.delete("lat");
    next.delete("lng");
    next.set("district", user.district);
    next.set("subDistrict", user.subDistrict);
    next.set("area", user.area);
    setParams(next);
  }

  function handleDistrictChange(district) {
    const next = new URLSearchParams(params);
    next.delete("lat");
    next.delete("lng");
    if (district) {
      next.set("district", district);
      next.delete("subDistrict");
      next.delete("area");
    } else {
      next.delete("district");
      next.delete("subDistrict");
      next.delete("area");
    }
    setParams(next);
  }

  function handleSubDistrictChange(subDistrict) {
    const next = new URLSearchParams(params);
    next.delete("lat");
    next.delete("lng");
    if (subDistrict) {
      next.set("subDistrict", subDistrict);
      next.delete("area");
    } else {
      next.delete("subDistrict");
      next.delete("area");
    }
    setParams(next);
  }

  function clearLocation() {
    const next = new URLSearchParams(params);
    next.delete("district");
    next.delete("subDistrict");
    next.delete("area");
    next.delete("lat");
    next.delete("lng");
    setParams(next);
  }

  const subDistricts = activeDistrict ? getSubDistrictsByDistrict(activeDistrict) : [];

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      {/* Search Header Banner */}
      <div className="rounded-[30px] bg-[#eaf0e4] dark:bg-[#12231b] p-7 sm:p-10 shadow-xs">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-700">
          Local discovery
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">
          Good things, found nearby.
        </h1>
        <p className="mt-3 text-slate-600">
          Search local places, makers, products, and helpful services across Bangladesh.
        </p>

        <div className="mt-7 max-w-2xl">
          <SearchBar large initialQuery={params.get("q") || ""} />
        </div>

        {/* Quick Location Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={nearby} className="btn btn-sm rounded-full bg-white text-forest shadow-2xs hover:bg-slate-50 border-0">
            <MapPin size={15} /> My Neighborhood
          </button>
          <button onClick={nearMe} className="btn btn-sm rounded-full bg-white text-forest shadow-2xs hover:bg-slate-50 border-0">
            <MapPin size={15} /> Use GPS
          </button>
          <button
            onClick={() => setShowLocationFilter(!showLocationFilter)}
            className={`btn btn-sm rounded-full border-0 transition ${showLocationFilter || activeDistrict
              ? "bg-forest text-white"
              : "bg-white text-forest shadow-2xs hover:bg-slate-50"
              }`}
          >
            <SlidersHorizontal size={14} /> Select Bangladesh Location
          </button>
        </div>

        {/* Expandable Bangladesh Administrative Location Filter */}
        {(showLocationFilter || activeDistrict) && (
          <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={13} className="text-forest" />
                Filter by Bangladesh Administrative Location (64 Districts & 495+ Upazilas/Thanas)
              </span>
              {(activeDistrict || activeSubDistrict) && (
                <button
                  onClick={clearLocation}
                  className="text-xs text-red-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <X size={12} /> Clear Filter
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* District Dropdown */}
              <label className="form-control gap-1">
                <span className="text-xs font-semibold text-forest">District / জেলা</span>
                <select
                  value={activeDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="select select-bordered select-sm rounded-xl bg-cream text-xs"
                >
                  <option value="">All 64 Districts</option>
                  {BANGLADESH_DIVISIONS.map((div) => {
                    const dists = getDistrictsByDivision(div);
                    return (
                      <optgroup key={div} label={`${div} Division`}>
                        {dists.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </label>

              {/* Sub-district / Upazila / Thana Dropdown */}
              <label className="form-control gap-1">
                <span className="text-xs font-semibold text-forest">
                  Sub-district / Upazila / Thana / উপজেলা বা থানা
                </span>
                <select
                  disabled={!activeDistrict}
                  value={activeSubDistrict}
                  onChange={(e) => handleSubDistrictChange(e.target.value)}
                  className="select select-bordered select-sm rounded-xl bg-cream text-xs disabled:opacity-60"
                >
                  <option value="">
                    {activeDistrict ? `All Upazilas / Thanas in ${activeDistrict}` : "Select district first"}
                  </option>
                  {subDistricts.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Active Location Indicator Pill */}
            {activeDistrict && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-500 font-medium">Filtering in:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <MapPin size={11} className="text-emerald-700" />
                  {[activeArea, activeSubDistrict, activeDistrict].filter(Boolean).join(", ")}
                  <button onClick={clearLocation} className="hover:text-red-700 ml-0.5">
                    <X size={12} />
                  </button>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Result Count */}
      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm font-semibold text-forest">
          {query.isLoading
            ? "Looking around…"
            : `${total} results ${params.get("q")
              ? `for “${params.get("q")}”`
              : activeDistrict
                ? `in ${[activeSubDistrict, activeDistrict].filter(Boolean).join(", ")}`
                : "nearby"
            }`}
        </p>
      </div>

      {query.isLoading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <CardSkeleton key={n} />
          ))}
        </div>
      ) : query.isError ? (
        <div className="mt-5 rounded-2xl bg-red-50 p-5 text-sm text-red-700">
          {query.error.message}
        </div>
      ) : (
        <>
          {!!results.shops?.length && (
            <section className="mt-8">
              <h2 className="mb-4 text-xl font-bold text-forest">Local shops</h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {results.shops.map((shop) => (
                  <ShopCard key={shop._id} shop={shop} />
                ))}
              </div>
            </section>
          )}

          {!!results.products?.length && (
            <section className="mt-9">
              <h2 className="mb-4 text-xl font-bold text-forest">Products</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {results.products.map((product) => (
                  <ResultCard key={product._id} item={product} kind="products" />
                ))}
              </div>
            </section>
          )}

          {!!results.services?.length && (
            <section className="mt-9">
              <h2 className="mb-4 text-xl font-bold text-forest">Services</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {results.services.map((service) => (
                  <ResultCard key={service._id} item={service} kind="services" />
                ))}
              </div>
            </section>
          )}

          {!total && (
            <div className="mt-8 rounded-3xl border border-dashed border-forest/20 bg-white p-12 text-center">
              <Search className="mx-auto text-emerald-700" />
              <h2 className="mt-3 font-bold text-forest">No matches yet</h2>
              <p className="mt-2 text-sm text-slate-500">
                Try selecting a different district, upazila, or searching for other items.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ResultCard({ item, kind }) {
  return (
    <Link
      to={`/${kind}/${item._id}`}
      className="overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      {item.images?.[0] ? (
        <img
          src={getImageUrl(item.images[0])}
          alt={item.name}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="grid h-40 place-items-center bg-gradient-to-br from-lime/40 to-emerald-100">
          <Store className="text-forest" />
        </div>
      )}
      <div className="p-4">
        <p className="truncate text-xs font-semibold text-emerald-700">
          {item.shop?.name || "Independent local"}
        </p>
        <h3 className="mt-1 truncate font-bold text-forest">{item.name}</h3>
        <p className="mt-2 truncate text-xs text-slate-500">
          {item.shop?.ownerName ? `${item.shop.ownerName} · ` : ""}
          {[item.shop?.area, item.shop?.subDistrict, item.shop?.district].filter(Boolean).join(", ") ||
            "Local business"}
          {item.category?.name ? ` · ${item.category.name}` : ""}
        </p>
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} /> Nearby{" "}
          <span className="ml-auto flex items-center gap-1">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {Number(item.rating || 0).toFixed(1)}
          </span>
        </p>
        <p className="mt-3 font-extrabold text-forest">
          {formatCurrency(item.discountPrice || item.price)}
        </p>
      </div>
    </Link>
  );
}
