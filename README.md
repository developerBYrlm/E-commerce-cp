# LocalSphere

LocalSphere is a MERN hyperlocal marketplace starter: discover local shops, browse products and services, follow shop posts, place pickup/delivery orders, request appointments, and manage a business dashboard.

**Live :** `https://e-commerce-cp.onrender.com`  

## Requirements

- Node.js 20 or newer
- MongoDB Atlas (or a MongoDB replica set; checkout uses a transaction)
- Google OAuth, SMTP, Cloudinary, and bKash sandbox accounts for the corresponding integrations

## Run locally

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and a unique `JWT_SECRET` of at least 32 characters. Never commit `.env`.
2. Install dependencies with `npm install`.
3. Start both applications with `npm run project` (or `npm run dev`).
4. Open `http://localhost:5173`. The Express API listens on port `3320`; Vite proxies `/api` and Socket.IO to it.

Build the frontend with `npm run build`. Start the API in production with `npm start`. Production hosting should serve the compiled `dist/` app and API under the same origin (or configure `CLIENT_URL` to the exact allowed frontend origin). Set `COOKIE_SECURE=true` behind HTTPS.

## Configuration

| Variable | Required | Purpose |
|---|---:|---|
| `PORT` | No | API port (defaults to `3320`) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `MONGODB_DNS_SERVERS` | No | Comma-separated DNS resolver IPs used for MongoDB SRV lookups when the system resolver is unavailable |
| `JWT_SECRET` | Yes | At least 32 characters; signs HTTP and Socket.IO sessions |
| `JWT_EXPIRES_IN` | No | JWT lifetime (defaults to `7d`) |
| `CLIENT_URL` | No | Comma-separated exact CORS origins; defaults to Vite's local origin |
| `CLIENT_APP_URL` | No | Single frontend URL used for email verification, password reset, and payment result links |
| `PUBLIC_API_URL` | bKash | Public HTTPS API origin used for bKash callbacks |
| `COOKIE_SECURE` | No | Set to `true` when served over HTTPS |
| `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID` | No | Set both to the same Google OAuth web client ID to enable Google sign-in |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | No | Delivers verification and password-reset emails |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | No | Enables authenticated image uploads |
| `BKASH_API_BASE_URL` | bKash | Defaults to the bKash sandbox API base |
| `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_APP_KEY`, `BKASH_APP_SECRET` | bKash | Server-only merchant credentials; never expose them to the frontend |

Email, Google sign-in, image upload, and bKash checkout require provider credentials. bKash sandbox checkout needs a public HTTPS callback URL; payment is marked paid only after the server executes and verifies the provider response. Cash-on-delivery remains available. Product and service prices are denominated in BDT. Build the frontend before production start to serve the app and API from one origin.

## Roles and access

- Public visitors can discover active shops, products, services, and posts.
- Customers can follow shops, save/like posts, comment, review, order, and book.
- Owners can register, create pending shop profiles, then manage listings and bookings for shops they own. Only an admin can activate/verify a shop.
- Admin accounts are intentionally not self-registered. Provision the initial administrator through a secure, one-time database operation, then manage the account using admin-only APIs.
- Protected API requests use the `httpOnly` JWT cookie. The frontend never stores JWTs in local storage.

## Project map

- `frontend/`: React 18 app (`src/`), Vite config, Tailwind, router, React Query, auth context, responsive UI, search/map/feed/dashboard.
- `server/`: Express API server, routes, controllers, middlewares, models, and utility services.
- `API.md`: endpoint catalog and cURL request/response examples.

## Operational notes

- Set a strong, private JWT secret and keep database/provider credentials in a secret manager in production.
- Use HTTPS, configure exact frontend CORS origins, restrict MongoDB network access, and configure SMTP/provider quotas.
- MongoDB Atlas transactions are required for atomic inventory reservation during checkout.
- Store only trusted Cloudinary URLs in public records; image uploads are capped at 5 MiB and JPEG/PNG/WebP.
- bKash uses tokenized checkout with server-side token caching and payment verification. Unpaid orders are checked every minute and release reserved stock after 30 minutes only when bKash confirms the payment is still initiated or failed. Admins can initiate a full refund and reconcile uncertain responses without retrying a potentially completed refund. Production merchant approval and public callback access still require operational setup.
- Configure the same Google web client ID in both `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`; the frontend loads Google Identity Services from Google's origin.
