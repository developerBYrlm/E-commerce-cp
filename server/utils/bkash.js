const apiBase = () => {
  const value = process.env.BKASH_API_BASE_URL || "https://tokenized.sandbox.bka.sh/v2";
  const url = new URL(value);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".bka.sh")) {
    throw Object.assign(new Error("BKASH_API_BASE_URL must be a trusted HTTPS bKash URL"), { status: 503 });
  }
  return url.toString().replace(/\/$/, "");
};

const credentials = () => {
  const { BKASH_USERNAME, BKASH_PASSWORD, BKASH_APP_KEY, BKASH_APP_SECRET } = process.env;
  if (![BKASH_USERNAME, BKASH_PASSWORD, BKASH_APP_KEY, BKASH_APP_SECRET].every(Boolean)) {
    throw Object.assign(new Error("bKash payments are not configured"), { status: 503 });
  }
  return { username: BKASH_USERNAME, password: BKASH_PASSWORD, app_key: BKASH_APP_KEY, app_secret: BKASH_APP_SECRET };
};

let token;
let tokenRequest;

async function post(path, body, headers = {}) {
  let response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw Object.assign(new Error("Could not reach bKash. Please try again."), { status: 502, cause: error });
  }

  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw Object.assign(new Error("bKash returned an invalid response"), { status: 502, cause: error });
  }
  if (!response.ok) {
    throw Object.assign(new Error("bKash could not process the request"), { status: 502 });
  }
  return result;
}

async function acquireToken() {
  const config = credentials();
  if (token && token.expiresAt > Date.now() + 60_000) return token.idToken;
  if (tokenRequest) return tokenRequest;

  tokenRequest = (async () => {
    const refreshing = token?.refreshToken && token.expiresAt > Date.now();
    const response = await post(
      `/tokenized-checkout/auth/${refreshing ? "refresh-token" : "grant-token"}`,
      refreshing ? { ...config, refresh_token: token.refreshToken } : { app_key: config.app_key, app_secret: config.app_secret },
      { username: config.username, password: config.password },
    );
    if (!response.id_token || (response.statusCode && response.statusCode !== "0000")) {
      throw Object.assign(new Error("bKash authentication failed; verify the merchant credentials"), { status: 503 });
    }
    token = {
      idToken: response.id_token,
      refreshToken: response.refresh_token || token?.refreshToken,
      expiresAt: Date.now() + (Number(response.expires_in) || 3600) * 1000,
    };
    return token.idToken;
  })();

  try {
    return await tokenRequest;
  } finally {
    tokenRequest = undefined;
  }
}

async function authenticatedPost(path, body) {
  const authorization = await acquireToken();
  return post(path, body, { authorization, "x-app-key": credentials().app_key });
}

export function isBkashConfigured() {
  let callbackURL;
  try {
    callbackURL = new URL(process.env.PUBLIC_API_URL);
  } catch {
    return false;
  }
  return callbackURL.protocol === "https:" && Boolean(
    process.env.BKASH_USERNAME
    && process.env.BKASH_PASSWORD
    && process.env.BKASH_APP_KEY
    && process.env.BKASH_APP_SECRET,
  );
}

export async function createBkashPayment({ amount, invoice, callbackURL }) {
  const result = await authenticatedPost("/tokenized-checkout/payment/create", {
    payerReference: "LocalSphere",
    callbackURL,
    amount: Number(amount).toFixed(2),
    currency: "BDT",
    intent: "sale",
    merchantInvoiceNumber: invoice,
  });
  const checkoutURL = result.bKashURL;
  if (!result.paymentId || !checkoutURL || (result.statusCode && result.statusCode !== "0000")) {
    throw Object.assign(new Error("bKash did not create the payment"), { status: 502 });
  }
  const url = new URL(checkoutURL);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".bka.sh")) {
    throw Object.assign(new Error("bKash returned an untrusted checkout URL"), { status: 502 });
  }
  return { paymentId: result.paymentId, checkoutURL };
}

export async function executeBkashPayment(paymentId) {
  return authenticatedPost("/tokenized-checkout/payment/execute", { paymentId });
}

export async function queryBkashPayment(paymentId) {
  return authenticatedPost("/tokenized-checkout/query/payment", { paymentId });
}

export async function refundBkashPayment({ paymentId, refundAmount, sku, reason, trxId }) {
  return authenticatedPost("/tokenized-checkout/refund/payment/transaction", {
    paymentId,
    refundAmount: Number(refundAmount).toFixed(2),
    sku,
    reason,
    trxId,
  });
}

export async function queryBkashRefundStatus({ paymentId, trxId }) {
  return authenticatedPost("/tokenized-checkout/refund/payment/status", { paymentId, trxId });
}
