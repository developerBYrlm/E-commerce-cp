import "dotenv/config";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { connectDatabase } from "./config/db.js";
import { protect, authorize } from "./middlewares/authMiddleware.js";
import { sanitizeInput } from "./middlewares/sanitizeInput.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { uploadImage, uploadImages } from "./middlewares/upload.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import {
  bookingRoutes, categoryRoutes, messageRoutes, notificationRoutes, orderRoutes, reportRoutes,
  postRoutes, productRoutes, reviewRoutes, serviceRoutes, shopRoutes,
} from "./routes/resourceRoutes.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import User from "./models/User.js";
import Shop from "./models/Shop.js";
import Product from "./models/Product.js";
import searchRoutes from "./routes/searchRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { registerChatSocketHandlers } from "./sockets/chatSocket.js";
import { bkashCallback } from "./controllers/bkashPaymentController.js";
import { startBkashPaymentReconciliation } from "./utils/reconcileBkashPayments.js";
import { seedShopCategories } from "./utils/seedCategories.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters before starting LocalSphere");
}

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((origin) => origin.trim());
const io = new Server(server, { cors: { origin: allowedOrigins, credentials: true } });

app.set("trust proxy", 1);
app.set("io", io);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "https://accounts.google.com"],
      "frame-src": ["'self'", "https://accounts.google.com"],
      "connect-src": ["'self'", "https://accounts.google.com", "https://accounts.googleapis.com", "ws:", "wss:"],
    },
  },
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Origin is not allowed by CORS"));
  }, credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());
app.use(sanitizeInput);
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50000,
  skip: () => process.env.NODE_ENV !== "production",
  standardHeaders: "draft-7",
  legacyHeaders: false,
}));
app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10000,
  skip: (req) => process.env.NODE_ENV !== "production" || req.method === "GET" || req.path === "/me" || req.path.endsWith("/me"),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again in a few minutes." },
}));

const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads");
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "localsphere-api" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reports", reportRoutes);
app.get("/api/payments/bkash/callback", bkashCallback);
app.post("/api/uploads/image", protect, uploadImage);
app.post("/api/uploads/images", protect, uploadImages);
app.get("/api/admin/stats", protect, authorize("admin"), asyncHandler(async (_req, res) => {
  const [users, shops, products] = await Promise.all([User.countDocuments(), Shop.countDocuments(), Product.countDocuments()]);
  res.json({ users, shops, products });
}));
app.use("/api", notFound);
const frontendDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../frontend/dist");
const clientBuild = existsSync(path.join(frontendDist, "index.html"))
  ? frontendDist
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
if (existsSync(path.join(clientBuild, "index.html"))) {
  app.use(express.static(clientBuild, { index: false }));
  app.get("*", (_req, res) => res.sendFile(path.join(clientBuild, "index.html")));
}
app.use(notFound);
app.use(errorHandler);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers.cookie?.split("; ").find((part) => part.startsWith("token="))?.slice(6);
    if (!token) return next(new Error("Authentication required"));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id status");
    if (!user || user.status !== "active") return next(new Error("Account unavailable"));
    socket.userId = String(user._id);
    next();
  } catch (error) {
    next(error);
  }
});
io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);
  registerChatSocketHandlers(io, socket);
  socket.on("join:conversation", (participants) => {
    if (!Array.isArray(participants) || participants.length !== 2 || !participants.includes(socket.userId)) return;
    socket.join([...participants].sort().join(":"));
  });
});

const port = Number(process.env.PORT || 3320);
connectDatabase().then(() => {
  return seedShopCategories();
}).then(() => {
  startBkashPaymentReconciliation(io);
  server.listen(port, () => console.info(`LocalSphere API listening on port ${port}`));
}).catch((error) => {
  console.error("Unable to start LocalSphere:", error);
  process.exitCode = 1;
});

export { app, server, io };
