import { formatCurrency } from "./currency.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char] || char));
}

function numberToWords(num) {
  const n = Math.floor(Number(num) || 0);
  if (n === 0) return "Zero Taka Only";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function inWords(val) {
    if (val < 20) return a[val];
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? " " + a[val % 10] : "");
    if (val < 1000) return a[Math.floor(val / 100)] + " Hundred" + (val % 100 !== 0 ? " and " + inWords(val % 100) : "");
    if (val < 100000) return inWords(Math.floor(val / 1000)) + " Thousand" + (val % 1000 !== 0 ? " " + inWords(val % 1000) : "");
    if (val < 10000000) return inWords(Math.floor(val / 100000)) + " Lakh" + (val % 100000 !== 0 ? " " + inWords(val % 100000) : "");
    return inWords(Math.floor(val / 10000000)) + " Crore" + (val % 10000000 !== 0 ? " " + inWords(val % 10000000) : "");
  }
  return inWords(n) + " Taka Only";
}

function generateBarcodeSvg(code) {
  const chars = String(code || "LS").toUpperCase().slice(0, 10);
  let bars = "";
  let x = 6;
  for (let i = 0; i < chars.length; i++) {
    const c = chars.charCodeAt(i);
    const pattern = [(c % 3) + 1, ((c >> 1) % 2) + 1, ((c >> 2) % 3) + 1, ((c >> 3) % 2) + 1];
    pattern.forEach((w, idx) => {
      if (idx % 2 === 0) {
        bars += `<rect x="${x}" y="0" width="${w * 1.6}" height="30" fill="#0f172a" />`;
      }
      x += (w * 1.6) + 1.4;
    });
    x += 2.5;
  }
  return `<svg width="${x + 6}" height="32" viewBox="0 0 ${x + 6} 32" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}

function generateStatusSealHtml(status, shortId) {
  const s = String(status || "pending").toLowerCase();
  let color = "#d97706";
  let title = "PENDING";
  let sub = "অপেক্ষমান";

  if (["completed", "delivered"].includes(s)) {
    color = "#047857";
    title = "COMPLETED";
    sub = "সম্পন্ন ও পেইড";
  } else if (["accepted", "preparing", "ready", "out_for_delivery"].includes(s)) {
    color = "#0369a1";
    title = "IN PROCESS";
    sub = "প্রক্রিয়াধীন";
  } else if (["cancelled", "rejected"].includes(s)) {
    color = "#dc2626";
    title = "CANCELLED";
    sub = "বাতিলকৃত";
  }

  const uniqueId = `seal-${shortId || "ls"}-${Date.now()}`;

  return `
    <div class="official-seal" style="position: absolute; right: 38px; top: 110px; z-index: 20; pointer-events: none; transform: rotate(-13deg); opacity: 0.88;">
      <svg width="152" height="152" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <circle cx="80" cy="80" r="75" fill="none" stroke="${color}" stroke-width="3.2" stroke-dasharray="6 3" />
        <circle cx="80" cy="80" r="67" fill="none" stroke="${color}" stroke-width="1.8" />
        <defs>
          <path id="curve-top-${uniqueId}" d="M 22 80 A 58 58 0 0 1 138 80" />
          <path id="curve-bot-${uniqueId}" d="M 138 80 A 58 58 0 0 1 22 80" />
        </defs>
        <text font-size="8.5" font-weight="800" fill="${color}" letter-spacing="2" font-family="Arial, sans-serif">
          <textPath href="#curve-top-${uniqueId}" startOffset="50%" text-anchor="middle">
            ★ LOCALSPHERE OFFICIAL ★
          </textPath>
        </text>
        <rect x="18" y="61" width="124" height="38" fill="${color}" rx="5" />
        <text x="80" y="80" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5" font-family="Arial, sans-serif">
          ${title}
        </text>
        <text x="80" y="93" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif">
          ${sub}
        </text>
        <text font-size="8.5" font-weight="800" fill="${color}" letter-spacing="1.8" font-family="Arial, sans-serif">
          <textPath href="#curve-bot-${uniqueId}" startOffset="50%" text-anchor="middle">
            OFFICIAL STATUS SEAL
          </textPath>
        </text>
      </svg>
    </div>
  `;
}

const COMMON_PRINT_STYLES = `
  @page {
    size: A4 portrait;
    margin: 10mm 12mm 12mm 12mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    margin: 0;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    background: #f8fafc;
    font-size: 13px;
    line-height: 1.5;
  }
  .no-print {
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #0f382c;
    color: #ffffff;
    padding: 12px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(15, 56, 44, 0.15);
  }
  .btn-print {
    background: #10b981;
    color: white;
    border: none;
    padding: 8px 18px;
    font-weight: 700;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-print:hover { background: #059669; }
  .btn-download {
    background: #2563eb;
    color: white;
    border: none;
    padding: 8px 18px;
    font-weight: 700;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s ease;
  }
  .btn-download:hover { background: #1d4ed8; }
  .btn-close {
    background: rgba(255,255,255,0.15);
    color: white;
    border: 1px solid rgba(255,255,255,0.25);
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
  }
  .invoice-container {
    position: relative;
    max-width: 820px;
    margin: 0 auto;
    background: #ffffff;
    padding: 36px 40px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
  }
  .header-table {
    width: 100%;
    border-bottom: 2px solid #0f382c;
    padding-bottom: 18px;
    margin-bottom: 22px;
  }
  .brand-logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .logo-box {
    width: 44px;
    height: 44px;
    background: #0f382c;
    color: #84cc16;
    border-radius: 12px;
    display: grid;
    place-items: center;
    font-size: 24px;
    font-weight: 900;
  }
  .brand-title {
    font-size: 24px;
    font-weight: 900;
    color: #0f382c;
    letter-spacing: -0.5px;
    margin: 0;
  }
  .brand-subtitle {
    font-size: 11px;
    color: #64748b;
    margin: 2px 0 0 0;
    font-weight: 500;
    letter-spacing: 0.3px;
  }
  .doc-title-block {
    text-align: right;
  }
  .doc-type-badge {
    display: inline-block;
    background: #0f382c;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1px;
    padding: 5px 14px;
    border-radius: 6px;
    text-transform: uppercase;
  }
  .doc-type-sub {
    font-size: 11px;
    font-weight: 600;
    color: #0f382c;
    margin-top: 3px;
  }
  .doc-id {
    font-size: 15px;
    font-weight: 800;
    font-family: monospace;
    color: #0f172a;
    margin-top: 5px;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }
  .info-panel {
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 12px;
    padding: 16px;
  }
  .panel-eyebrow {
    font-size: 10px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .panel-title {
    font-size: 15px;
    font-weight: 800;
    color: #0f382c;
    margin: 0 0 4px 0;
  }
  .info-row {
    margin: 4px 0;
    font-size: 12px;
    color: #475569;
    display: flex;
    gap: 6px;
  }
  .info-label {
    font-weight: 700;
    color: #334155;
    min-width: 80px;
    shrink: 0;
  }
  .pill-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .pill-green { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  .pill-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .pill-blue  { background: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }

  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 12px;
  }
  .items-table th {
    background: #0f382c;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 10px 14px;
    letter-spacing: 0.5px;
  }
  .items-table th:first-child { border-top-left-radius: 8px; }
  .items-table th:last-child { border-top-right-radius: 8px; text-align: right; }
  .items-table td {
    padding: 11px 14px;
    border-bottom: 1px solid #e2e8f0;
    color: #1e293b;
    vertical-align: middle;
  }
  .items-table tr:nth-child(even) td { background: #fbfcfe; }
  .items-table td:last-child { text-align: right; font-weight: 700; }

  .summary-wrap {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 24px 0 20px 0;
    gap: 24px;
  }
  .notes-box {
    flex: 1;
    border: 1px dashed #cbd5e1;
    background: #f8fafc;
    padding: 14px 16px;
    border-radius: 10px;
    font-size: 11px;
    color: #475569;
  }
  .notes-title {
    font-weight: 800;
    color: #0f382c;
    margin-bottom: 4px;
    font-size: 11px;
  }
  .calc-box {
    width: 310px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    border-radius: 12px;
    padding: 14px 18px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.02);
  }
  .calc-row {
    display: flex;
    justify-content: space-between;
    margin: 6px 0;
    font-size: 12px;
    color: #64748b;
  }
  .calc-row.total-row {
    border-top: 2px solid #0f382c;
    padding-top: 10px;
    margin-top: 10px;
    font-size: 16px;
    font-weight: 900;
    color: #0f382c;
  }
  .in-words-box {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #065f46;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    margin: 16px 0 24px 0;
  }

  .signatures-section {
    display: flex;
    justify-content: space-between;
    margin-top: 48px;
    padding-top: 16px;
  }
  .signature-box {
    width: 220px;
    text-align: center;
  }
  .sign-line {
    border-top: 1px dashed #64748b;
    margin-bottom: 6px;
  }
  .sign-title {
    font-size: 11px;
    font-weight: 700;
    color: #0f382c;
  }
  .sign-sub {
    font-size: 10px;
    color: #94a3b8;
  }

  .footer-notice {
    border-top: 1px solid #e2e8f0;
    margin-top: 30px;
    padding-top: 14px;
    text-align: center;
    font-size: 10px;
    color: #94a3b8;
  }

  @media print {
    .no-print { display: none !important; }
    body { padding: 0 !important; background: #fff !important; }
    .invoice-container {
      max-width: 100% !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
  }
`;

export function openDocumentInNewTab(html, fileName = "LocalSphere-Document") {
  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);

    // Open standard full new tab without restrictive popup dimensions
    const newTab = window.open(blobUrl, "_blank");

    if (newTab) {
      try {
        newTab.focus();
      } catch (_) { }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 180000);
      return;
    }

    // Fallback if popup blocker intercepted window.open
    const link = document.createElement("a");
    link.href = blobUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 180000);
  } catch (err) {
    console.error("Failed to open document tab via Blob URL:", err);
    try {
      const fallbackTab = window.open("", "_blank");
      if (fallbackTab && fallbackTab.document) {
        fallbackTab.document.open();
        fallbackTab.document.write(html);
        fallbackTab.document.close();
      }
    } catch (e2) {
      console.error("Direct write fallback failed:", e2);
      alert("Please allow pop-ups to view the document in a new tab.");
    }
  }
}

export function printOrderInvoice(order) {
  const shopObj = order.shop || {};
  const customerObj = order.customer || {};
  const deliveryAddress = order.deliveryAddress || {};
  const shortId = (order._id || "").slice(-6).toUpperCase();
  const invoiceNumber = `INV-${shortId}`;

  const isDelivery = order.fulfillment === "delivery";
  const deliveryFee = Number(order.deliveryCharge || (isDelivery ? 70 : 0));
  const subtotal = Number(order.subtotal || 0);
  const grandTotal = Number(order.total || (subtotal + deliveryFee));

  const destinationAddress = [
    deliveryAddress.street,
    deliveryAddress.area,
    deliveryAddress.subDistrict,
    deliveryAddress.district || deliveryAddress.city,
  ].filter(Boolean).join(", ") || [
    customerObj.area,
    customerObj.subDistrict,
    customerObj.district,
  ].filter(Boolean).join(", ") || "Self Pickup at Store";

  const contactPhone = deliveryAddress.phone || customerObj.phone || "Not specified";

  const shopAddress = [
    shopObj.extendedAddress,
    shopObj.address?.street,
    shopObj.area || shopObj.address?.city,
    shopObj.subDistrict || shopObj.address?.region,
    shopObj.district || shopObj.address?.country,
  ].filter(Boolean).join(", ") || "Local Store, Bangladesh";

  const sealHtml = generateStatusSealHtml(order.status, shortId);

  const itemsHtml = (order.items || []).map((line, idx) => {
    const qty = Number(line.quantity || 1);
    const unitPrice = Number(line.unitPrice || 0);
    const lineTotal = qty * unitPrice;
    return `
      <tr>
        <td style="width: 40px; text-align: center; font-weight: 600; color: #64748b;">${idx + 1}</td>
        <td>
          <strong style="color: #0f172a; font-size: 13px;">${escapeHtml(line.name)}</strong>
          ${line.product?.category?.name ? `<br><span style="font-size: 10px; color: #64748b;">Category: ${escapeHtml(line.product.category.name)}</span>` : ""}
        </td>
        <td style="text-align: center; font-weight: 600;">${qty}</td>
        <td style="text-align: right; color: #475569;">${formatCurrency(unitPrice)}</td>
        <td style="text-align: right; font-weight: 800; color: #0f382c;">${formatCurrency(lineTotal)}</td>
      </tr>
    `;
  }).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice #${escapeHtml(shortId)} - LocalSphere</title>
  <style>${COMMON_PRINT_STYLES}</style>
</head>
<body>
  <div class="no-print">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 14px; font-weight: 800; color: #84cc16;">LocalSphere</span>
      <span style="font-size: 13px; font-weight: 600;">Tax Invoice #${escapeHtml(shortId)}</span>
      <span style="font-size: 11px; background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 4px; margin-left: 6px;">
        Status: <strong style="color: #84cc16;">${escapeHtml((order.status || 'Active').toUpperCase())}</strong>
      </span>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <button class="btn-print" onclick="window.print()" title="Print or save as PDF">🖨️ Print / Save PDF (A4)</button>
      <button class="btn-download" onclick="downloadInvoiceHtml()" title="Download invoice file">📥 Download File</button>
      <button class="btn-close" onclick="window.close()" title="Close this tab">✖ Close Tab</button>
    </div>
  </div>

  <div class="invoice-container">
    <!-- Official Current Status Seal Stamp -->
    ${sealHtml}

    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div class="brand-logo">
            <div class="logo-box">LS</div>
            <div>
              <h1 class="brand-title">LocalSphere</h1>
              <p class="brand-subtitle">HYPERLOCAL NEIGHBORHOOD MARKETPLACE</p>
            </div>
          </div>
        </td>
        <td class="doc-title-block" style="vertical-align: top;">
          <div class="doc-type-badge">Tax Invoice / Cash Memo</div>
          <div class="doc-type-sub">ট্যাক্স ইনভয়েস ও ক্যাশ মেমো</div>
          <div class="doc-id">#${escapeHtml(shortId)}</div>
          <div style="margin-top: 6px;">
            ${generateBarcodeSvg(shortId)}
          </div>
        </td>
      </tr>
    </table>

    <!-- Meta Info Strip -->
    <div style="display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 10px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 11px;">
      <div>
        <strong>Invoice Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} at ${new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div>
        <strong>Fulfillment:</strong> <span class="pill-badge pill-blue">${isDelivery ? "🚚 Home Delivery" : "🏪 Store Pickup"}</span>
      </div>
      <div>
        <strong>Payment Status:</strong> 
        <span class="pill-badge ${order.paymentStatus === 'paid' ? 'pill-green' : 'pill-amber'}">
          ${order.paymentMethod === 'bkash' ? `bKash (${order.paymentStatus})` : `COD (${order.paymentStatus || 'Pending'})`}
        </span>
      </div>
      <div>
        <strong>Current Status:</strong> <span class="pill-badge pill-green">${escapeHtml((order.status || 'Active').toUpperCase().replaceAll('_', ' '))}</span>
      </div>
    </div>

    <!-- Merchant & Customer Grid -->
    <div class="meta-grid">
      <!-- Seller Box -->
      <div class="info-panel">
        <div class="panel-eyebrow">
          <span>Seller / Merchant (বিক্রেতা)</span>
          <span class="pill-badge pill-green">Verified Shop</span>
        </div>
        <h3 class="panel-title">${escapeHtml(shopObj.name || "Independent Merchant")}</h3>
        ${shopObj.ownerName ? `<div class="info-row"><span class="info-label">Proprietor:</span> <span>${escapeHtml(shopObj.ownerName)}</span></div>` : ""}
        <div class="info-row"><span class="info-label">Address:</span> <span>${escapeHtml(shopAddress)}</span></div>
        ${shopObj.phone ? `<div class="info-row"><span class="info-label">Phone:</span> <span>${escapeHtml(shopObj.phone)}</span></div>` : ""}
        ${shopObj.email ? `<div class="info-row"><span class="info-label">Email:</span> <span>${escapeHtml(shopObj.email)}</span></div>` : ""}
      </div>

      <!-- Buyer / Delivery Box -->
      <div class="info-panel">
        <div class="panel-eyebrow">
          <span>Customer & Destination (ক্রেতা ও গন্তব্য)</span>
          <span class="pill-badge pill-blue">${isDelivery ? "Deliver To" : "Pickup By"}</span>
        </div>
        <h3 class="panel-title">${escapeHtml(customerObj.name || "Valued Customer")}</h3>
        <div class="info-row"><span class="info-label">Contact:</span> <strong>${escapeHtml(contactPhone)}</strong></div>
        ${customerObj.email ? `<div class="info-row"><span class="info-label">Email:</span> <span>${escapeHtml(customerObj.email)}</span></div>` : ""}
        <div class="info-row">
          <span class="info-label">Destination:</span> 
          <span>${escapeHtml(destinationAddress)}</span>
        </div>
        ${order.deliveryZone ? `
          <div class="info-row">
            <span class="info-label">Zone:</span>
            <span style="font-weight: 700; color: #047857;">
              ${order.deliveryZone === "inside_dhaka" ? "ঢাকা মেট্রো (Inside Dhaka · ৳70)" :
        order.deliveryZone === "dhaka_suburbs" ? "ঢাকার কাছাকাছি (Suburbs · ৳100)" :
          order.deliveryZone === "outside_dhaka" ? "ঢাকার বাইরে (Outside Dhaka · ৳150)" : order.deliveryZone}
            </span>
          </div>
        ` : ""}
      </div>
    </div>

    <!-- Items Table (Charged Amounts) -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">SL</th>
          <th>Item Description (পণ্যের বিবরণ)</th>
          <th style="text-align: center; width: 60px;">Qty</th>
          <th style="text-align: right; width: 120px;">Charged Rate</th>
          <th style="text-align: right; width: 130px;">Amount Charged</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Financial Calculation & Breakdown -->
    <div class="summary-wrap">
      <div class="notes-box">
        <div class="notes-title">Payment & Policy Terms:</div>
        <div>• <strong>Method:</strong> ${escapeHtml(order.paymentMethod === 'bkash' ? 'bKash Digital Payment Gateway' : 'Cash on Delivery (COD)')}</div>
        <div>• <strong>Payment Mode:</strong> ${order.paymentStatus === 'paid' ? 'Payment Verified. No additional charges upon delivery.' : 'Please pay the total amount in cash to the delivery courier upon arrival.'}</div>
        <div>• <strong>Return/Exchange:</strong> Please inspect items in presence of the delivery agent. Report issues within 48h.</div>
        <div style="margin-top: 6px; font-weight: 600; color: #0f382c;">Thank you for shopping local & supporting neighborhood makers!</div>
      </div>

      <div class="calc-box">
        <div class="calc-row">
          <span>Products Subtotal</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        ${isDelivery ? `
          <div class="calc-row">
            <span>Delivery Fee</span>
            <span>+${formatCurrency(deliveryFee)}</span>
          </div>
        ` : ""}
        <div class="calc-row total-row">
          <span>Total Charged</span>
          <span>${formatCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>

    <!-- Total In Words Box -->
    <div class="in-words-box">
      <strong>Amount charged in words:</strong> ${numberToWords(grandTotal)}
    </div>

    <!-- Signatures -->
    <div class="signatures-section">
      <div class="signature-box">
        <div class="sign-line"></div>
        <div class="sign-title">Customer / Receiver Signature</div>
        <div class="sign-sub">Received in satisfactory condition</div>
      </div>
      <div class="signature-box">
        <div class="sign-line"></div>
        <div class="sign-title">Authorized Store Seal & Signature</div>
        <div class="sign-sub">${escapeHtml(shopObj.name || "LocalSphere Merchant")}</div>
      </div>
    </div>

    <!-- System Footer -->
    <div class="footer-notice">
      LocalSphere Hyperlocal Network · Official Digital Invoice Ref #${escapeHtml(shortId)} · Printed on ${new Date().toLocaleString()} · Official Status: ${escapeHtml((order.status || 'Active').toUpperCase())}
    </div>
  </div>

  <script>
    function downloadInvoiceHtml() {
      try {
        var content = '<!doctype html>\\n' + document.documentElement.outerHTML;
        var blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'Invoice-${escapeHtml(shortId)}.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
      } catch (e) {
        alert("Failed to download file. You can use the Print / Save as PDF button.");
      }
    }
  </script>
</body>
</html>`;

  openDocumentInNewTab(html, `Invoice-${shortId}`);
}

export function printBookingVoucher(booking) {
  const shopObj = booking.shop || {};
  const customerObj = booking.customer || {};
  const serviceObj = booking.service || {};
  const shortId = (booking._id || "").slice(-6).toUpperCase();

  const serviceFee = Number(booking.price || serviceObj.price || 0);

  const customerLocation = [
    customerObj.area,
    customerObj.subDistrict,
    customerObj.district,
  ].filter(Boolean).join(", ") || "Client location as communicated via Inbox";

  const shopAddress = [
    shopObj.extendedAddress,
    shopObj.address?.street,
    shopObj.area || shopObj.address?.city,
    shopObj.subDistrict || shopObj.address?.region,
    shopObj.district || shopObj.address?.country,
  ].filter(Boolean).join(", ") || "Local Service Center, Bangladesh";

  const scheduledDate = new Date(booking.scheduledAt || Date.now());
  const sealHtml = generateStatusSealHtml(booking.status, shortId);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Service Voucher #${escapeHtml(shortId)} - LocalSphere</title>
  <style>${COMMON_PRINT_STYLES}</style>
</head>
<body>
  <div class="no-print">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 14px; font-weight: 800; color: #84cc16;">LocalSphere</span>
      <span style="font-size: 13px; font-weight: 600;">Service Voucher #${escapeHtml(shortId)}</span>
      <span style="font-size: 11px; background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 4px; margin-left: 6px;">
        Status: <strong style="color: #84cc16;">${escapeHtml((booking.status || 'Pending').toUpperCase())}</strong>
      </span>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <button class="btn-print" onclick="window.print()" title="Print or save as PDF">🖨️ Print / Save PDF (A4)</button>
      <button class="btn-download" onclick="downloadVoucherHtml()" title="Download voucher file">📥 Download File</button>
      <button class="btn-close" onclick="window.close()" title="Close this tab">✖ Close Tab</button>
    </div>
  </div>

  <div class="invoice-container">
    <!-- Official Current Status Seal Stamp -->
    ${sealHtml}

    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div class="brand-logo">
            <div class="logo-box">LS</div>
            <div>
              <h1 class="brand-title">LocalSphere</h1>
              <p class="brand-subtitle">VERIFIED NEIGHBORHOOD SERVICES &amp; EXPERTS</p>
            </div>
          </div>
        </td>
        <td class="doc-title-block" style="vertical-align: top;">
          <div class="doc-type-badge" style="background: #065f46;">Service Work Order</div>
          <div class="doc-type-sub">সার্ভিস বুকিং ভাউচার ও কার্যাদেশ</div>
          <div class="doc-id">#${escapeHtml(shortId)}</div>
          <div style="margin-top: 6px;">
            ${generateBarcodeSvg(shortId)}
          </div>
        </td>
      </tr>
    </table>

    <!-- Meta Info Strip -->
    <div style="display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 11px;">
      <div>
        <strong>Booking Date:</strong> ${new Date(booking.createdAt || Date.now()).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
      </div>
      <div>
        <strong>Appointment:</strong> <span style="font-weight: 800; color: #166534;">📅 ${scheduledDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div>
        <strong>Current Status:</strong> <span class="pill-badge ${booking.status === 'completed' ? 'pill-green' : booking.status === 'accepted' ? 'pill-blue' : 'pill-amber'}">${escapeHtml((booking.status || 'Pending').toUpperCase())}</span>
      </div>
    </div>

    <!-- Provider & Client Grid -->
    <div class="meta-grid">
      <!-- Provider Box -->
      <div class="info-panel">
        <div class="panel-eyebrow">
          <span>Service Provider (সেবা প্রদানকারী)</span>
          <span class="pill-badge pill-green">Verified Expert</span>
        </div>
        <h3 class="panel-title">${escapeHtml(shopObj.name || "Local Service Professional")}</h3>
        ${shopObj.ownerName ? `<div class="info-row"><span class="info-label">Specialist:</span> <span>${escapeHtml(shopObj.ownerName)}</span></div>` : ""}
        <div class="info-row"><span class="info-label">Workshop:</span> <span>${escapeHtml(shopAddress)}</span></div>
        ${shopObj.phone ? `<div class="info-row"><span class="info-label">Helpline:</span> <strong>${escapeHtml(shopObj.phone)}</strong></div>` : ""}
        ${shopObj.email ? `<div class="info-row"><span class="info-label">Email:</span> <span>${escapeHtml(shopObj.email)}</span></div>` : ""}
      </div>

      <!-- Client Box -->
      <div class="info-panel">
        <div class="panel-eyebrow">
          <span>Client Details (গ্রাহক তথ্য)</span>
          <span class="pill-badge pill-blue">Service Location</span>
        </div>
        <h3 class="panel-title">${escapeHtml(customerObj.name || "Valued Client")}</h3>
        <div class="info-row"><span class="info-label">Phone:</span> <strong>${escapeHtml(customerObj.phone || "Communicate via Inbox")}</strong></div>
        ${customerObj.email ? `<div class="info-row"><span class="info-label">Email:</span> <span>${escapeHtml(customerObj.email)}</span></div>` : ""}
        <div class="info-row"><span class="info-label">Location:</span> <span>${escapeHtml(customerLocation)}</span></div>
      </div>
    </div>

    <!-- Service Scope Table (Charged Amount) -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">SL</th>
          <th>Service Name &amp; Description (সার্ভিস বিবরণ)</th>
          <th style="width: 140px; text-align: center;">Scheduled Timing</th>
          <th style="width: 130px; text-align: right;">Amount Charged</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="width: 40px; text-align: center; font-weight: 600; color: #64748b;">1</td>
          <td>
            <strong style="color: #0f172a; font-size: 14px;">${escapeHtml(serviceObj.name || "General Service")}</strong>
            ${serviceObj.isNegotiable ? `<span style="margin-left: 6px; font-size: 10px; font-weight: 700; color: #b45309; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">Negotiable Service</span>` : ""}
            ${booking.notes ? `
              <div style="margin-top: 6px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; color: #334155;">
                <strong>Client's Request Note:</strong> "${escapeHtml(booking.notes)}"
              </div>
            ` : ""}
          </td>
          <td style="text-align: center; font-weight: 700; color: #047857;">
            ${scheduledDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}<br>
            <span style="font-size: 11px; color: #64748b;">${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </td>
          <td style="text-align: right; font-weight: 900; font-size: 14px; color: #0f382c;">
            ${formatCurrency(serviceFee)}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Service Financial Breakdown -->
    <div class="summary-wrap">
      <div class="notes-box">
        <div class="notes-title">Service Terms &amp; Conditions:</div>
        <div>• <strong>Labor Fee:</strong> The service charge covers standard inspection &amp; technician labor.</div>
        <div>• <strong>Spare Parts:</strong> Any spare parts or materials required will be billed as per actual agreed cost.</div>
        <div>• <strong>Satisfaction:</strong> Client inspects work upon completion before settling final payment.</div>
        <div style="margin-top: 6px; font-weight: 600; color: #065f46;">Thank you for trusting verified local professionals!</div>
      </div>

      <div class="calc-box">
        <div class="calc-row">
          <span>Agreed Service Fee</span>
          <span>${formatCurrency(serviceFee)}</span>
        </div>
        <div class="calc-row">
          <span>Travel / Conveyance</span>
          <span style="color: #047857; font-weight: 600;">Included / Free</span>
        </div>
        <div class="calc-row total-row">
          <span>Total Charged</span>
          <span>${formatCurrency(serviceFee)}</span>
        </div>
      </div>
    </div>

    <!-- Amount in Words -->
    <div class="in-words-box">
      <strong>Amount charged in words:</strong> ${numberToWords(serviceFee)}
    </div>

    <!-- Signatures -->
    <div class="signatures-section">
      <div class="signature-box">
        <div class="sign-line"></div>
        <div class="sign-title">Client Signature &amp; Date</div>
        <div class="sign-sub">Service completed satisfactorily</div>
      </div>
      <div class="signature-box">
        <div class="sign-line"></div>
        <div class="sign-title">Technician / Specialist Signature</div>
        <div class="sign-sub">${escapeHtml(shopObj.name || "LocalSphere Professional")}</div>
      </div>
    </div>

    <!-- System Footer -->
    <div class="footer-notice">
      LocalSphere Services · Digital Work Order Ref #${escapeHtml(shortId)} · Issued on ${new Date().toLocaleString()} · Official Status: ${escapeHtml((booking.status || 'Pending').toUpperCase())}
    </div>
  </div>

  <script>
    function downloadVoucherHtml() {
      try {
        var content = '<!doctype html>\\n' + document.documentElement.outerHTML;
        var blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'ServiceVoucher-${escapeHtml(shortId)}.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
      } catch (e) {
        alert("Failed to download file. You can use the Print / Save as PDF button.");
      }
    }
  </script>
</body>
</html>`;

  openDocumentInNewTab(html, `ServiceVoucher-${shortId}`);
}
