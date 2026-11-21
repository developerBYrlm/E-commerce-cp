/**
 * Verification utility for LocalSphere.
 * Determines verified badge eligibility:
 * - Paid subscribers (Growth Pro, Business Elite) get the blue verified checkmark.
 * - Starter tier (৳0 free tier) gets NO badge.
 */

export function isVerified(target) {
  if (!target) return false;
  if (typeof window === "undefined") return false;

  const currentPlan = localStorage.getItem("ls_subscription_plan") || "starter";
  const currentUserId = localStorage.getItem("ls_current_user_id");
  const isCurrentOwnerPaid = currentPlan !== "starter" && (currentPlan === "growth" || currentPlan === "elite");

  // If target is an owner user or ID string
  if (typeof target === "string") {
    if (target === currentUserId) return isCurrentOwnerPaid;
    return localStorage.getItem("ls_verified_owner_" + target) === "true";
  }

  // If target is an owner object
  if (target.role === "owner" || (target.email && target._id)) {
    if (String(target._id) === currentUserId) return isCurrentOwnerPaid;
    return localStorage.getItem("ls_verified_owner_" + target._id) === "true";
  }

  // Determine ownerId and shop object if target is a product or service
  let ownerId = null;
  let shopObj = null;

  if (target.shop) {
    // Target is a product or service
    shopObj = typeof target.shop === "object" ? target.shop : null;
    ownerId = shopObj?.owner?._id || shopObj?.owner || target.owner;
  } else {
    // Target is a shop
    shopObj = target;
    ownerId = target.owner?._id || target.owner;
  }

  // If this shop belongs to the currently logged in owner
  if (ownerId && String(ownerId) === String(currentUserId)) {
    return isCurrentOwnerPaid;
  }

  // If we have verified flag for this owner in localStorage
  if (ownerId && localStorage.getItem("ls_verified_owner_" + ownerId) === "true") {
    return true;
  }

  // Check shopObj's verified property from database
  if (shopObj && shopObj.verified === true) {
    // If it belongs to current user, respect currentPlan
    if (ownerId && String(ownerId) === String(currentUserId)) {
      return isCurrentOwnerPaid;
    }
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
