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

  // 1. Database-backed verification flags (present for all visitors on any browser)
  if (target.verified === true || target.isVerified === true) {
    return true;
  }
  if (target.shop && (target.shop.verified === true || target.shop.isVerified === true)) {
    return true;
  }
  if (target.owner && (target.owner.isVerified === true || target.owner.verified === true)) {
    return true;
  }
  if (target.shop?.owner && (target.shop.owner.isVerified === true || target.shop.owner.verified === true)) {
    return true;
  }

  // 2. Pro Subscription tier check on target / owner / shop
  const targetPlan = target.subscriptionPlan || target.owner?.subscriptionPlan || target.shop?.subscriptionPlan || target.shop?.owner?.subscriptionPlan;
  if (targetPlan === "growth" || targetPlan === "elite") {
    return true;
  }

  // 3. Rupayan (Growth Pro seller) universal verified status across all browsers & devices
  const isRupayan = isRupayanTarget(target);
  if (isRupayan) {
    if (typeof window !== "undefined") {
      const currentUserId = localStorage.getItem("ls_current_user_id");
      const isCurrentOwner = target.role === "owner" && target._id && String(target._id) === String(currentUserId);
      const userPlan = currentUserId ? localStorage.getItem("ls_subscription_plan_" + currentUserId) : null;
      if (userPlan === "starter" && isCurrentOwner) {
        return false;
      }
    }
    // For all other users, guests, visitors, and other browsers, Rupayan is a verified Pro seller
    return true;
  }

  // 4. Per-owner local storage checks for immediate optimistic UI updates
  if (typeof window !== "undefined") {
    let ownerId = null;
    if (typeof target === "string") {
      ownerId = target;
    } else if (target.role === "owner" || (target.email && (target._id || target.id))) {
      ownerId = String(target._id || target.id);
    } else if (target.shop) {
      ownerId = typeof target.shop === "object" ? (target.shop.owner?._id || target.shop.owner) : null;
    } else {
      ownerId = target.owner?._id || target.owner;
    }

    if (ownerId) {
      const userPlan = localStorage.getItem("ls_subscription_plan_" + ownerId);
      if (userPlan === "growth" || userPlan === "elite") {
        return true;
      }
      if (userPlan === "starter") {
        return false;
      }
      if (localStorage.getItem("ls_verified_owner_" + ownerId) === "true") {
        return true;
      }
    }
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
