/**
 * Verification utility for LocalSphere.
 * Determines verified badge eligibility:
 * - Paid subscribers (Growth Pro, Business Elite) get the blue verified checkmark.
 * - Starter tier (৳0 free tier) gets NO badge.
 */

/**
 * Verification utility for LocalSphere.
 * Determines verified badge eligibility:
 * - Paid subscribers (Growth Pro, Business Elite) get the blue verified checkmark across shops, products, and services.
 * - Starter tier (৳0 free tier) gets NO badge.
 */

function isRupayanTarget(target) {
  if (!target) return false;
  if (typeof target === "string") {
    return /rupayan|rupayen/i.test(target);
  }
  const name = target.name || target.shopName || target.targetTitle || target.username || "";
  const shopName = target.shop?.name || (typeof target.shop === "string" ? target.shop : "");
  const ownerName = target.ownerName || target.owner?.name || target.owner?.username || "";
  return (
    /rupayan|rupayen/i.test(name) ||
    /rupayan|rupayen/i.test(shopName) ||
    /rupayan|rupayen/i.test(ownerName)
  );
}

export function isVerified(target) {
  if (!target) return false;
  if (typeof window === "undefined") return false;

  const currentPlan = localStorage.getItem("ls_subscription_plan") || "starter";
  const isPaid = currentPlan !== "starter" && (currentPlan === "growth" || currentPlan === "elite");

  const isRupayan = isRupayanTarget(target);

  // If user is on Starter plan (৳0 free tier), Rupayan/subscriber gets NO badge!
  if (!isPaid) {
    if (isRupayan) return false;
    // Only return true if strictly verified from DB and not the current owner
    return Boolean(target.verified === true && target.role !== "owner");
  }

  // When Pro mode (Growth Pro / Business Elite) is active:
  // 1. Any target associated with Rupayan / Rupayen gets the blue verified badge
  if (isRupayan) {
    return true;
  }

  // 2. Check if target or target's owner has verified flag in localStorage
  const currentUserId = localStorage.getItem("ls_current_user_id");
  let ownerId = null;
  if (typeof target === "string") {
    ownerId = target;
  } else if (target.role === "owner" || (target.email && target._id)) {
    ownerId = String(target._id);
  } else if (target.shop) {
    ownerId = typeof target.shop === "object" ? (target.shop.owner?._id || target.shop.owner) : null;
  } else {
    ownerId = target.owner?._id || target.owner;
  }

  if (
    ownerId &&
    (String(ownerId) === String(currentUserId) ||
      localStorage.getItem("ls_verified_owner_" + ownerId) === "true")
  ) {
    return true;
  }

  // 3. Database verified field
  if (target.verified === true || target.shop?.verified === true) {
    return true;
  }

  return false;
}

export function VerifiedBadge({ size = 16, className = "", title = "Verified Business" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 align-middle ${className}`}
      title={title}
    >
      <path
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        fill="#3B82F6"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
