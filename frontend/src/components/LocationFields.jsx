import { useMemo, useState } from "react";
import {
  BANGLADESH_DIVISIONS,
  BANGLADESH_ADMINISTRATIVE_DATA,
  getAllDistricts,
  getDistrictsByDivision,
  getSubDistrictsByDistrict,
  getSuggestedAreas,
} from "../../../shared/bangladeshAdministrativeData.js";
import { MapPin, Sparkles } from "lucide-react";

export default function LocationFields({
  value = {},
  onChange,
  includeAddress = true,
  required = true,
  addressRequired = false,
  compact = false,
}) {
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState("");

  // Determine current division from value or filter
  const currentDivision =
    value.division ||
    (value.district ? BANGLADESH_ADMINISTRATIVE_DATA[value.district]?.division : "") ||
    selectedDivisionFilter;

  // Districts list based on division filter or all
  const filteredDistricts = useMemo(() => {
    if (selectedDivisionFilter) {
      return getDistrictsByDivision(selectedDivisionFilter);
    }
    return getAllDistricts();
  }, [selectedDivisionFilter]);

  // Sub-districts (upazilas + metropolitan thanas + additional thanas)
  const subDistricts = useMemo(() => {
    return value.district ? getSubDistrictsByDistrict(value.district) : [];
  }, [value.district]);

  // Suggested areas / elakas for the selected district & sub-district
  const suggestedAreas = useMemo(() => {
    return value.district ? getSuggestedAreas(value.district, value.subDistrict) : [];
  }, [value.district, value.subDistrict]);

  function setField(field, next) {
    const nextValue = {
      ...value,
      [field]: next,
    };

    if (field === "district") {
      nextValue.subDistrict = "";
      nextValue.area = "";
      if (next && BANGLADESH_ADMINISTRATIVE_DATA[next]) {
        nextValue.division = BANGLADESH_ADMINISTRATIVE_DATA[next].division;
      }
    }

    if (field === "subDistrict") {
      // Keep area if typed or clear if switching
      if (!suggestedAreas.includes(value.area)) {
        // user can keep custom area
      }
    }

    onChange(nextValue);
  }

  function handleDivisionFilterChange(div) {
    setSelectedDivisionFilter(div);
    if (div && value.district && BANGLADESH_ADMINISTRATIVE_DATA[value.district]?.division !== div) {
      setField("district", "");
    }
  }

  return (
    <div className="space-y-3">
      {/* Optional Division Quick Pill Filter */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        <span className="text-[11px] font-bold text-forest uppercase tracking-wider flex items-center gap-1 mr-1">
          <MapPin size={12} className="text-forest/70" /> Division:
        </span>
        <button
          type="button"
          onClick={() => handleDivisionFilterChange("")}
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition ${!selectedDivisionFilter
            ? "bg-forest text-white shadow-2xs"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
        >
          All (8)
        </button>
        {BANGLADESH_DIVISIONS.map((div) => (
          <button
            key={div}
            type="button"
            onClick={() => handleDivisionFilterChange(selectedDivisionFilter === div ? "" : div)}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition ${selectedDivisionFilter === div
              ? "bg-forest text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            {div}
          </button>
        ))}
      </div>

      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        {/* District Select */}
        <label className="form-control gap-1.5">
            <span className="text-xs font-semibold text-forest flex items-center justify-between min-h-[20px]">
              <span className="whitespace-nowrap">District / জেলা {required && <span className="text-red-500">*</span>}</span>
              {currentDivision && (
              <span className="text-[10px] font-normal text-slate-400 whitespace-nowrap ml-1">
                {currentDivision} Division
              </span>
            )}
          </span>
          <select
            name="district"
            required={required}
            value={value.district || ""}
            onChange={(e) => setField("district", e.target.value)}
            className="select select-bordered rounded-xl bg-cream text-sm focus:border-forest"
          >
            <option value="">
              {selectedDivisionFilter
                ? `Choose a district in ${selectedDivisionFilter}`
                : "Choose a district (64 districts)"}
            </option>
            {selectedDivisionFilter ? (
              filteredDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))
            ) : (
              BANGLADESH_DIVISIONS.map((div) => {
                const dists = getDistrictsByDivision(div);
                return (
                  <optgroup key={div} label={`${div} Division (${dists.length} Districts)`}>
                    {dists.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </optgroup>
                );
              })
            )}
          </select>
        </label>

            {/* Sub-district / Upazila / Thana Select */}
            <label className="form-control gap-1.5">
                  <span className="text-xs font-semibold text-forest flex items-center justify-between min-h-[20px]">
                    <span className="whitespace-nowrap" title="Sub-district / Upazila / Thana / উপজেলা বা থানা">
                      Upazila / Thana (উপজেলা বা থানা){" "}
                      {required && <span className="text-red-500">*</span>}
                    </span>
                    {value.district && (
              <span className="text-[10px] font-normal text-slate-400 whitespace-nowrap ml-1">
                {subDistricts.length} available
              </span>
            )}
          </span>
          <select
            name="subDistrict"
            required={required}
            disabled={!value.district}
            value={value.subDistrict || ""}
            onChange={(e) => setField("subDistrict", e.target.value)}
            className="select select-bordered rounded-xl bg-cream text-sm focus:border-forest disabled:opacity-60"
          >
            <option value="">
              {value.district
                ? `Choose Upazila or Thana in ${value.district}`
                : "Select district first"}
            </option>
            {subDistricts.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </label>

                  {/* Area / Neighborhood / Elaka Input with DataList & Suggestions */}
                  <label className="form-control gap-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-forest">
                        Area / Neighborhood / Elaka / এলাকা বা পাড়া{" "}
                        {required && <span className="text-red-500">*</span>}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Type or select from suggestions
                      </span>
                    </div>
                    <input
                      name="area"
                      required={required}
                      maxLength={100}
                      list="area-datalist-options"
                      value={value.area || ""}
                      onChange={(e) => setField("area", e.target.value)}
                      placeholder={
                        value.subDistrict
                          ? `e.g. ${suggestedAreas[0] || value.subDistrict + " Center"}`
                          : "e.g. Dhanmondi 27, Banasree, GEC Circle, Mirpur 10..."
                      }
                      className="input input-bordered rounded-xl bg-cream text-sm focus:border-forest"
                    />
                    <datalist id="area-datalist-options">
                      {suggestedAreas.map((areaName) => (
                        <option key={areaName} value={areaName} />
                      ))}
                    </datalist>

                    {/* Quick clickable area suggestion pills */}
                    {suggestedAreas.length > 0 && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Sparkles size={10} className="text-forest/70" /> Popular:
                        </span>
                        {suggestedAreas.slice(0, 8).map((area) => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => setField("area", area)}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition ${value.area === area
                              ? "border-forest bg-forest text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    )}
                  </label>

                  {/* Street Address */}
                  {includeAddress && (
                    <label className="form-control gap-1.5">
                        <span className="text-xs font-semibold text-forest flex items-center min-h-[20px]">
                          <span className="whitespace-nowrap">
                            Address / Street (সড়ক বা রোড){" "}
                            {addressRequired && <span className="text-red-500">*</span>}
                          </span>
                        </span>
                        <input
                          name="address"
                          required={addressRequired}
                          maxLength={300}
                          value={value.address || ""}
                          onChange={(e) => setField("address", e.target.value)}
                          placeholder="Street name, road number, or local market"
                          className="input input-bordered rounded-xl bg-cream text-sm focus:border-forest"
                        />
                    </label>
                  )}

                  {/* Extended Address */}
                  {includeAddress && (
                    <label className="form-control gap-1.5">
                        <span className="text-xs font-semibold text-forest flex items-center min-h-[20px]">
                          <span className="whitespace-nowrap" title="Extended Address / বাড়ি, হোল্ডিং বা ল্যান্ডমার্ক">
                            Extended Address (বাড়ি বা ল্যান্ডমার্ক)
                          </span>
                        </span>
                        <input
                          name="extendedAddress"
                          maxLength={300}
                          value={value.extendedAddress || ""}
                          onChange={(e) => setField("extendedAddress", e.target.value)}
                          placeholder="House #, Flat #, Floor, Building name, or landmark"
                          className="input input-bordered rounded-xl bg-cream text-sm focus:border-forest"
                        />
                    </label>
                  )}
                </div>
              </div>
              );
}
