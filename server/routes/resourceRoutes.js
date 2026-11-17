import { Router } from "express";
import { authorize, optionalAuth, protect } from "../middlewares/authMiddleware.js";
import { resourceController } from "../controllers/resourceController.js";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Service from "../models/Service.js";
import Category from "../models/Category.js";
import Post from "../models/Post.js";
import Review from "../models/Review.js";
import { createPost, feed, togglePostInteraction, addComment } from "../controllers/feedController.js";
import { createOrder, getOrder, listOrders, updateOrder } from "../controllers/orderController.js";
import { initiateBkashRefund, reconcileBkashRefund } from "../controllers/bkashRefundController.js";
import { createBooking, listBookings, updateBooking } from "../controllers/bookingController.js";
import { createReview, listReviews } from "../controllers/reviewController.js";
import { listNotifications, markNotificationRead } from "../controllers/notificationController.js";
import { listMessages, sendMessage } from "../controllers/messageController.js";
import { createReport, listReports, updateReport } from "../controllers/reportController.js";

function crudRouter(Model, options, { readRoles = [], writeRoles = ["owner"], ownerField } = {}) {
  const router = Router();
  const controller = resourceController(Model, { ...options, ...(ownerField ? { ownerField } : {}) });
  if (readRoles.length) router.get("/", protect, authorize(...readRoles), controller.list);
  else router.get("/", optionalAuth, controller.list);
  if (readRoles.length) router.get("/:id", protect, authorize(...readRoles), controller.get);
  else router.get("/:id", optionalAuth, controller.get);
  router.post("/", protect, authorize(...writeRoles), controller.create);
  router.patch("/:id", protect, authorize(...writeRoles), controller.update);
  router.delete("/:id", protect, authorize(...writeRoles), controller.remove);
  return router;
}

export const shopRoutes = crudRouter(Shop, { ownerField: "owner", populate: [{ path: "category" }, { path: "categories" }, { path: "products" }, { path: "services" }, { path: "owner", select: "name avatar" }] }, { ownerField: "owner", writeRoles: ["owner", "admin"] });
export const productRoutes = crudRouter(Product, { ownerField: "shop", populate: [{ path: "shop", populate: { path: "owner", select: "name avatar role" } }, { path: "category" }, { path: "owner", select: "name avatar role" }] }, { ownerField: "shop", writeRoles: ["owner", "admin"] });
export const serviceRoutes = crudRouter(Service, { ownerField: "shop", populate: [{ path: "shop", populate: { path: "owner", select: "name avatar role" } }, { path: "category" }, { path: "owner", select: "name avatar role" }] }, { ownerField: "shop", writeRoles: ["owner", "admin"] });
export const categoryRoutes = crudRouter(Category, {}, { writeRoles: ["admin"] });
export const postRoutes = Router();
postRoutes.get("/", optionalAuth, feed);
postRoutes.get("/:id", optionalAuth, resourceController(Post, { populate: "shop author" }).get);
postRoutes.post("/", protect, authorize("owner"), createPost);
postRoutes.put("/:id/:action", protect, authorize("customer", "owner"), (req, res, next) => ["like", "save"].includes(req.params.action) ? togglePostInteraction(req, res, next) : res.status(400).json({ message: "Unknown post action" }));
postRoutes.post("/:id/comments", protect, addComment);

export const orderRoutes = Router();
orderRoutes.get("/", protect, listOrders);
orderRoutes.get("/:id", protect, getOrder);
orderRoutes.post("/", protect, authorize("customer"), createOrder);
orderRoutes.patch("/:id", protect, updateOrder);
orderRoutes.post("/:id/refund", protect, authorize("admin"), initiateBkashRefund);
orderRoutes.post("/:id/refund/reconcile", protect, authorize("admin"), reconcileBkashRefund);

export const bookingRoutes = Router();
bookingRoutes.get("/", protect, listBookings);
bookingRoutes.post("/", protect, authorize("customer"), createBooking);
bookingRoutes.patch("/:id", protect, updateBooking);

export const reviewRoutes = Router();
reviewRoutes.get("/", optionalAuth, listReviews);
reviewRoutes.post("/", protect, createReview);

export const notificationRoutes = Router();
notificationRoutes.get("/", protect, listNotifications);
notificationRoutes.patch("/:id/read", protect, markNotificationRead);

export const messageRoutes = Router();
messageRoutes.get("/", protect, listMessages);
messageRoutes.post("/", protect, sendMessage);

export const reportRoutes = Router();
reportRoutes.get("/", protect, authorize("admin"), listReports);
reportRoutes.post("/", protect, authorize("customer", "owner"), createReport);
reportRoutes.patch("/:id", protect, authorize("admin"), updateReport);
