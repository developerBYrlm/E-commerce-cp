const transitions = Object.freeze({
  placed: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
});

export function canTransitionOrder(currentStatus, nextStatus, role) {
  if (role === "customer" && (nextStatus !== "cancelled" || !["placed", "accepted"].includes(currentStatus))) {
    return false;
  }
  return transitions[currentStatus]?.includes(nextStatus) || false;
}

export function allowedOrderTransitions(currentStatus, role, fulfillment) {
  const next = transitions[currentStatus] || [];
  if (role === "customer") return next.filter((status) => status === "cancelled" && ["placed", "accepted"].includes(currentStatus));
  if (role === "owner" && fulfillment === "pickup") return next.filter((status) => status !== "out_for_delivery");
  return next;
}
