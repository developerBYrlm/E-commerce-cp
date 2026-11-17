import assert from "node:assert/strict";
import test from "node:test";
import { getCompletedBkashRefundTransaction, getStaleBkashPaymentAction, matchesCompletedBkashPayment } from "../server/utils/bkashPaymentValidation.js";
import { createBkashPayment, isBkashConfigured, queryBkashRefundStatus, refundBkashPayment } from "../server/utils/bkash.js";

test("bKash order verification requires completed matching BDT payment details", () => {
  const order = { id: "65a000000000000000000001", subtotal: 2400, paymentMethod: "bkash" };
  const payment = {
    transactionStatus: "Completed",
    trxId: "TX-1",
    amount: "2400.00",
    currency: "BDT",
    intent: "sale",
    merchantInvoiceNumber: `LS-${order.id}`,
  };
  assert.equal(matchesCompletedBkashPayment(payment, order), true);
  assert.equal(matchesCompletedBkashPayment({ ...payment, amount: "2400.01" }, order), false);
  assert.equal(matchesCompletedBkashPayment({ ...payment, currency: "USD" }, order), false);
  assert.equal(matchesCompletedBkashPayment({ ...payment, merchantInvoiceNumber: "another-order" }, order), false);
  assert.equal(matchesCompletedBkashPayment({ ...payment, transactionStatus: "Initiated" }, order), false);
  assert.equal(matchesCompletedBkashPayment({ ...payment, trxId: undefined }, order), false);
});

test("stale bKash orders release inventory only for initiated or failed payments", () => {
  assert.equal(getStaleBkashPaymentAction({ transactionStatus: "Completed" }), "confirm");
  assert.equal(getStaleBkashPaymentAction({ transactionStatus: "Initiated" }), "release");
  assert.equal(getStaleBkashPaymentAction({ transactionStatus: "Failed" }), "release");
  assert.equal(getStaleBkashPaymentAction({ transactionStatus: "Cancelled" }), "retain");
  assert.equal(getStaleBkashPaymentAction({ transactionStatus: "Unknown" }), "retain");
});

test("bKash refund confirmation requires the full matching BDT transaction", () => {
  const order = { subtotal: 2400, bkashTransactionId: "TX-1" };
  const refund = {
    originalTrxId: "TX-1",
    originalTrxAmount: "2400.00",
    refundTransactions: [{ refundTrxId: "RF-1", refundTransactionStatus: "Completed", refundAmount: "2400.00" }],
  };
  assert.equal(getCompletedBkashRefundTransaction(refund, order), "RF-1");
  assert.equal(getCompletedBkashRefundTransaction({ ...refund, originalTrxId: "TX-2" }, order), null);
  assert.equal(getCompletedBkashRefundTransaction({ ...refund, currency: "USD" }, order), null);
  assert.equal(getCompletedBkashRefundTransaction({ ...refund, originalTrxAmount: undefined }, order), null);
  assert.equal(getCompletedBkashRefundTransaction({
    ...refund,
    refundTransactions: [{ refundTrxId: "RF-1", refundTransactionStatus: "Completed", refundAmount: "1200.00" }],
  }, order), null);
});

test("bKash checkout requests use server credentials and validate redirect origin", async () => {
  const envKeys = ["BKASH_USERNAME", "BKASH_PASSWORD", "BKASH_APP_KEY", "BKASH_APP_SECRET", "BKASH_API_BASE_URL", "PUBLIC_API_URL"];
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, {
    BKASH_USERNAME: "sandbox-user",
    BKASH_PASSWORD: "sandbox-password",
    BKASH_APP_KEY: "sandbox-app-key",
    BKASH_APP_SECRET: "sandbox-app-secret",
    BKASH_API_BASE_URL: "https://tokenized.sandbox.bka.sh/v2",
    PUBLIC_API_URL: "https://api.example.test",
  });
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return {
      ok: true,
      json: async () => calls.length === 1
        ? { statusCode: "0000", id_token: "sandbox-token", refresh_token: "sandbox-refresh", expires_in: 3600 }
        : { statusCode: "0000", paymentId: "payment-1", bKashURL: "https://checkout.sandbox.bka.sh/pay/1" },
    };
  };
  try {
    assert.equal(isBkashConfigured(), true);
    const result = await createBkashPayment({ amount: 2400, invoice: "LS-order-1", callbackURL: "https://api.example.test/api/payments/bkash/callback" });
    assert.deepEqual(result, { paymentId: "payment-1", checkoutURL: "https://checkout.sandbox.bka.sh/pay/1" });
    assert.equal(calls[0].url, "https://tokenized.sandbox.bka.sh/v2/tokenized-checkout/auth/grant-token");
    assert.equal(calls[1].url, "https://tokenized.sandbox.bka.sh/v2/tokenized-checkout/payment/create");
    assert.equal(calls[1].options.headers.authorization, "sandbox-token");
    assert.equal(calls[1].options.headers["x-app-key"], "sandbox-app-key");
    assert.deepEqual(JSON.parse(calls[1].options.body), {
      payerReference: "LocalSphere",
      callbackURL: "https://api.example.test/api/payments/bkash/callback",
      amount: "2400.00",
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: "LS-order-1",
    });
    await refundBkashPayment({ paymentId: "payment-1", refundAmount: 2400, sku: "LS-order-1", reason: "Order cancelled", trxId: "TX-1" });
    assert.equal(calls[2].url, "https://tokenized.sandbox.bka.sh/v2/tokenized-checkout/refund/payment/transaction");
    assert.deepEqual(JSON.parse(calls[2].options.body), {
      paymentId: "payment-1",
      refundAmount: "2400.00",
      sku: "LS-order-1",
      reason: "Order cancelled",
      trxId: "TX-1",
    });
    await queryBkashRefundStatus({ paymentId: "payment-1", trxId: "TX-1" });
    assert.equal(calls[3].url, "https://tokenized.sandbox.bka.sh/v2/tokenized-checkout/refund/payment/status");
    assert.deepEqual(JSON.parse(calls[3].options.body), { paymentId: "payment-1", trxId: "TX-1" });
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of envKeys) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  }
});
