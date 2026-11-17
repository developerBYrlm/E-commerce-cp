export function matchesCompletedBkashPayment(payment, order) {
  return payment?.transactionStatus === "Completed"
    && Boolean(payment.trxId)
    && payment.currency === "BDT"
    && payment.intent === "sale"
    && Math.round(Number(payment.amount) * 100) === Math.round(order.subtotal * 100)
    && String(payment.merchantInvoiceNumber || payment.merchantInvoice) === `LS-${order.id}`;
}

export function getStaleBkashPaymentAction(payment) {
  if (payment?.transactionStatus === "Completed") return "confirm";
  if (payment?.transactionStatus === "Initiated" || payment?.transactionStatus === "Failed") return "release";
  return "retain";
}

export function getCompletedBkashRefundTransaction(refund, order) {
  if (String(refund?.originalTrxId || "") !== String(order.bkashTransactionId || "")) return null;
  if (!Number.isFinite(Number(refund.originalTrxAmount))
    || Math.round(Number(refund.originalTrxAmount) * 100) !== Math.round(order.subtotal * 100)) return null;
  if (refund.currency !== undefined && refund.currency !== "BDT") return null;

  const transactions = Array.isArray(refund.refundTransactions) ? refund.refundTransactions : [refund];
  const completed = transactions.find((transaction) => transaction.refundTransactionStatus === "Completed"
    && Math.round(Number(transaction.refundAmount) * 100) === Math.round(order.subtotal * 100)
    && Boolean(transaction.refundTrxId));
  return completed?.refundTrxId || null;
}
