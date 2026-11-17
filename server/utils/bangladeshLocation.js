import geography from "bangladesh-districts-upazilas";
import {
  isValidDistrictName,
  isValidSubDistrictName,
  getAllDistricts,
  getSubDistrictsByDistrict,
  getSuggestedAreas,
  getAllDivisions,
  getDistrictsByDivision,
} from "../../shared/bangladeshAdministrativeData.js";

export function isValidBangladeshLocation({ district, subDistrict, area } = {}) {
  if (typeof district !== "string" || typeof subDistrict !== "string") return false;
  const distTrimmed = district.trim();
  const subTrimmed = subDistrict.trim();

  // Check comprehensive administrative dataset (64 districts, 495 upazilas + metropolitan and additional thanas)
  const isValidInAdminData =
    isValidDistrictName(distTrimmed) && isValidSubDistrictName(distTrimmed, subTrimmed);

  // Fallback to geography package for any alternate spellings
  let isValidInGeography = false;
  if (!isValidInAdminData && geography.isValidDistrict(distTrimmed) && geography.isValidUpazila(subTrimmed)) {
    const upazila = geography.getUpazilaByName(subTrimmed);
    if (upazila?.district?.toLowerCase() === distTrimmed.toLowerCase()) {
      isValidInGeography = true;
    }
  }

  if (!isValidInAdminData && !isValidInGeography) return false;

  return typeof area === "string" && area.trim().length > 0 && area.trim().length <= 100;
}

export function getLocationFields(body) {
  return ["district", "subDistrict", "area", "address", "extendedAddress"]
    .filter((key) => body[key] !== undefined)
    .map((key) => [key, body[key]]);
}

export {
  getAllDistricts,
  getSubDistrictsByDistrict,
  getSuggestedAreas,
  getAllDivisions,
  getDistrictsByDivision,
  isValidDistrictName,
  isValidSubDistrictName,
};
