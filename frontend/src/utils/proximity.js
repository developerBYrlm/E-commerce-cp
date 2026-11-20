/**
 * Calculate proximity score between an item (shop, product, service) and a user
 * - Same Area (neighborhood): 1000 pts
 * - Same SubDistrict (thana): 500 pts
 * - Same District (city): 200 pts
 * - GPS distance: up to 100 pts
 */
export function calculateLocationScore(item, user) {
  if (!user || (!user.area && !user.subDistrict && !user.district && !user.location?.coordinates)) {
    return 0;
  }

  const shopObj = item.shop && typeof item.shop === "object" ? item.shop : item;
  const itemArea = String(shopObj.area || item.area || "").trim().toLowerCase();
  const itemSubDistrict = String(shopObj.subDistrict || item.subDistrict || "").trim().toLowerCase();
  const itemDistrict = String(shopObj.district || item.district || "").trim().toLowerCase();

  const userArea = String(user.area || "").trim().toLowerCase();
  const userSubDistrict = String(user.subDistrict || "").trim().toLowerCase();
  const userDistrict = String(user.district || "").trim().toLowerCase();

  let score = 0;

  // 1. Same Area / Neighborhood (e.g., Mirpur 10, Banani DOHS, Uttara Sector 4)
  if (userArea && itemArea) {
    if (userArea === itemArea || itemArea.includes(userArea) || userArea.includes(itemArea)) {
      score += 1000;
    }
  }

  // 2. Same Sub-district / Thana / Upazila (e.g., Mirpur, Banani, Uttara West, Adabor)
  if (userSubDistrict && itemSubDistrict) {
    if (userSubDistrict === itemSubDistrict || itemSubDistrict.includes(userSubDistrict) || userSubDistrict.includes(itemSubDistrict)) {
      score += 500;
    }
  }

  // 3. Same District / City (e.g., Dhaka, Chattogram)
  if (userDistrict && itemDistrict) {
    if (userDistrict === itemDistrict || itemDistrict.includes(userDistrict) || userDistrict.includes(itemDistrict)) {
      score += 200;
    }
  }

  // 4. Coordinates / Haversine distance
  const uCoords = user.location?.coordinates;
  const iCoords = shopObj.location?.coordinates || item.location?.coordinates;
  if (
    Array.isArray(uCoords) && uCoords.length === 2 && (uCoords[0] || uCoords[1]) &&
    Array.isArray(iCoords) && iCoords.length === 2 && (iCoords[0] || iCoords[1])
  ) {
    const [uLng, uLat] = uCoords;
    const [iLng, iLat] = iCoords;
    const dLat = ((iLat - uLat) * Math.PI) / 180;
    const dLon = ((iLng - uLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((uLat * Math.PI) / 180) * Math.cos((iLat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = 6371 * c;
    if (distKm < 50) {
      score += Math.max(0, 100 - distKm * 2);
    }
  }

  return score;
}

/**
 * Shuffle array randomly (Fisher-Yates)
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Sort items:
 * - If user logged in: by proximity to user's neighborhood (area -> subdistrict -> district -> others)
 * - If guest: random shuffle
 */
export function sortItemsByProximity(items, user) {
  if (!Array.isArray(items) || !items.length) return [];
  if (user && (user.area || user.subDistrict || user.district || user.location?.coordinates)) {
    return [...items].sort((a, b) => {
      const scoreA = calculateLocationScore(a, user);
      const scoreB = calculateLocationScore(b, user);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.rating || 0) - (a.rating || 0);
    });
  }
  return shuffleArray(items);
}
