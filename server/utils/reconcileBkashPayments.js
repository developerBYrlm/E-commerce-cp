import Order from "../models/Order.js";
import { confirmBkashOrder } from "./confirmBkashOrder.js";
import { queryBkashPayment } from "./bkash.js";
import { releaseUnpaidBkashOrder } from "./orderInventory.js";
import { getStaleBkashPaymentAction } from "./bkashPaymentValidation.js";

const PAYMENT_EXPIRY_MS = 30 * 60 * 1000;
const RECONCILIATION_INTERVAL_MS = 60 * 1000;
const RECONCILIATION_BATCH_SIZE = 25;

export async function reconcileStaleBkashOrders(io) {
  const cutoff = new Date(Date.now() - PAYMENT_EXPIRY_MS);
  const orders = await Order.find({
    paymentMethod: "bkash",
    paymentStatus: "processing",
    status: "placed",
    createdAt: { $lte: cutoff },
  }).sort({ createdAt: 1 }).limit(RECONCILIATION_BATCH_SIZE);

  for (const order of orders) {
    try {
      const payment = await queryBkashPayment(order.bkashPaymentId);
      const action = getStaleBkashPaymentAction(payment);
      if (action === "confirm") {
        const result = await confirmBkashOrder(order, payment, io);
        if (result === "review") {
          console.error("Completed bKash payment does not match its order; manual review required:", order.id);
        }
      } else if (action === "release") {
        await releaseUnpaidBkashOrder(order._id);
      } else {
        console.warn("Stale bKash payment has an unrecognized status; reservation retained:", order.id, payment.transactionStatus);
      }
    } catch (error) {
      console.error("Unable to reconcile stale bKash payment; reservation retained:", order.id, error);
    }
  }
}

export function startBkashPaymentReconciliation(io) {
  const run = () => {
    reconcileStaleBkashOrders(io).catch((error) => {
      console.error("Unable to scan stale bKash orders:", error);
    });
  };
  const timer = setInterval(run, RECONCILIATION_INTERVAL_MS);
  timer.unref();
  run();
  return timer;
}
