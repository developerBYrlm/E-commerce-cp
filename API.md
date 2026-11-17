# LocalSphere REST API

Base URL: `http://localhost:3320/api`. JSON request and response bodies are used unless the route is an image upload. Authenticated routes use the `httpOnly` `token` cookie. CORS credentials are enabled for the configured `CLIENT_URL` origins.

## Authentication

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create a `customer` or `owner` |
| POST | `/auth/login` | Public | Sign in |
| POST | `/auth/google` | Public | Verify a Google Identity credential |
| POST | `/auth/logout` | Public | Clear the session cookie |
| GET | `/auth/me` | Signed in | Current profile |
| POST | `/auth/verify-email` | Public | Verify an email token |
| POST | `/auth/forgot-password` | Public | Request a reset email (generic response) |
| POST | `/auth/reset-password` | Public | Set a password using a one-hour token |
| PATCH | `/users/me` | Signed in | Update name, avatar, or GeoJSON location |
| PUT | `/users/follow/:shopId` | Signed in | Toggle a shop follow |
| PUT | `/users/wishlist/:productId` | Signed in | Toggle a product wishlist entry |
| GET | `/users` | Admin | List users |
| PATCH | `/users/:id/status` | Admin | Set user status to `active` or `suspended` |

Register:

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{ "name": "Alex Morgan", "email": "alex@example.com", "password": "a-long-unique-password", "role": "customer" }
```

```json
{ "user": { "id": "…", "name": "Alex Morgan", "email": "alex@example.com", "role": "customer", "isVerified": false }, "message": "Account created. Check your email to verify your address." }
```

## Discovery and catalog

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/search` | Public | Multi-resource search |
| GET/POST | `/shops` | Public / owner or admin | List or create shops |
| GET/PATCH/DELETE | `/shops/:id` | Public / owner or admin | Read/update/delete a shop (read accepts ID or slug) |
| GET/POST | `/products` | Public / owner or admin | List or create products |
| GET/PATCH/DELETE | `/products/:id` | Public / owner or admin | Read/update/delete a product |
| GET/POST | `/services` | Public / owner or admin | List or create services |
| GET/PATCH/DELETE | `/services/:id` | Public / owner or admin | Read/update/delete a service |
| GET | `/categories` | Public | List categories |
| POST/PATCH/DELETE | `/categories[/:id]` | Admin | Manage categories |

Catalog list endpoints accept `q`, `shop`, `category`, `status` (admin), `page`, and `limit` (max 50). The response has `items` and `pagination: { page, limit, total, pages }`.

Search filters: `q`, `type=shop,product,service`, `category=<id>`, `location=<city or region>`, `lat`, `lng`, `distance=<meters, max 100000>`, `minRating`, `minPrice`, `maxPrice`, `verified=true`, and `openNow=true`. Coordinates use longitude/latitude GeoJSON order internally. Open-hours objects are keyed by lowercase weekday and contain `open`/`close` 24-hour `HH:mm` strings.

```http
GET /api/search?q=coffee&lat=40.71&lng=-74.00&distance=5000&verified=true
```

```json
{ "results": { "shops": [], "products": [], "services": [] }, "counts": { "shops": 0, "products": 0, "services": 0 } }
```

## Feed and social

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/posts` | Public | Newest feed (`page`, `limit`, optional `following=true`) |
| GET | `/posts/:id` | Public | Read a post |
| POST | `/posts` | Owner | Create an offer/product/service/news post for an owned active shop |
| PUT | `/posts/:id/like` | Customer or owner | Toggle like |
| PUT | `/posts/:id/save` | Customer or owner | Toggle save |
| POST | `/posts/:id/comments` | Signed in | Add a comment (`text`, max 1,000 chars) |
| GET/POST | `/reviews` | Public / signed in | List or create a 1–5 star review |

Example:

```json
{ "shop": "SHOP_ID", "type": "offer", "body": "This weekend only: 10% off." }
```

## Orders and bookings

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/orders` | Signed in | Own orders, orders for owner's shops, or all (admin) |
| GET | `/orders/:id` | Authorized participant/admin | Read an order |
| POST | `/orders` | Customer | Place a COD order or start a bKash checkout |
| PATCH | `/orders/:id` | Order customer, shop owner, or admin | Apply an allowed order transition; cancellation restores inventory |
| POST | `/orders/:id/refund` | Admin | Initiate a full refund for a paid bKash order (`reason`, max 255 characters) |
| POST | `/orders/:id/refund/reconcile` | Admin | Check bKash status for an uncertain/in-progress refund; never issues a second refund |
| GET | `/payments/bkash/callback` | bKash redirect | Verify/execute the payment and redirect to the payment result page |
| GET | `/bookings` | Signed in | Own bookings, shop bookings, or all (admin) |
| POST | `/bookings` | Customer | Request an appointment |
| PATCH | `/bookings/:id` | Customer, shop owner, or admin | Accept/reject/complete/cancel |

Create an order:

```json
{ "items": [{ "product": "PRODUCT_ID", "quantity": 2 }], "fulfillment": "pickup", "paymentMethod": "cod" }
```

```json
{ "item": { "_id": "ORDER_ID", "subtotal": 2400, "status": "placed", "paymentStatus": "pending" }, "message": "Order placed" }
```

`fulfillment` is `delivery` or `pickup`; prices and order totals are BDT. `paymentMethod` is `cod` or `bkash`. bKash checkout requires server credentials and `PUBLIC_API_URL`; successful initiation returns `redirectUrl` and reserves inventory while payment is pending. The callback executes and validates the provider transaction, including amount, currency, invoice, and status, before marking the order paid. A cancelled checkout releases stock only after bKash confirms the payment is still initiated. Delivery requests must include a `deliveryAddress` object with street and city. Customers can cancel only before preparation starts; paid orders require a confirmed admin-issued refund before cancellation.

```json
{ "items": [{ "product": "PRODUCT_ID", "quantity": 1 }], "fulfillment": "pickup", "paymentMethod": "bkash" }
```

```json
{ "item": { "_id": "ORDER_ID", "subtotal": 2400, "paymentMethod": "bkash", "paymentStatus": "processing" }, "redirectUrl": "https://...", "message": "Continue to bKash to complete payment" }
```

The callback is a browser redirect rather than a signed webhook. The server does not trust its status alone: it executes or queries the payment through bKash and compares the returned transaction with the stored order. A background reconciliation runs every minute; orders unpaid for 30 minutes are released only after bKash confirms the payment remains initiated or failed. Unknown statuses, API errors, and completed payments that do not match the order retain the stock reservation and are logged for manual review. Only admins may initiate a full bKash refund. The order is marked refunded only after bKash confirms the full amount; uncertain requests remain locked and must be reconciled using the refund-status endpoint before any manual action.

Create a booking:

```json
{ "service": "SERVICE_ID", "scheduledAt": "2030-05-01T15:00:00.000Z", "notes": "Please call on arrival." }
```

## Messaging, notifications, uploads

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/messages?with=USER_ID` | Signed in | Read a conversation and mark incoming messages seen |
| POST | `/messages` | Signed in | Send a text/attachment URL to an active account |
| GET | `/notifications` | Signed in | List own notifications |
| PATCH | `/notifications/:id/read` | Owner of notification | Mark read |
| POST | `/uploads/image` | Owner or admin | Upload one JPEG, PNG, or WebP image (max 5 MiB) to Cloudinary |
| GET | `/health` | Public | Liveness check |
| GET | `/admin/stats` | Admin | User/shop/product counts |

Socket.IO uses the same JWT session cookie. After connection, a client joins `user:<userId>` automatically. Join a two-person message room with `join:conversation` and the two participant IDs (the authenticated user must be one of them). Server events are `message:new` and `notification:new`. Attachments must first be uploaded; message `attachment` accepts the resulting URL.

## Errors and limits

Errors have `{ "message": "..." }`; validation errors may additionally include `errors`. Standard codes include `400` invalid input, `401` unauthenticated, `403` forbidden, `404` missing resource, `409` uniqueness/stock conflict, `429` rate limit, and `500` unexpected server error. API rate limit: 300 requests per 15 minutes per client IP; auth endpoints add a 30-request limit. Pagination is capped at 50 catalog records and 30 feed posts.

## cURL examples

```sh
curl -i -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"a-long-unique-password"}' \
  http://localhost:3320/api/auth/login

curl -b cookies.txt "http://localhost:3320/api/orders"
```
