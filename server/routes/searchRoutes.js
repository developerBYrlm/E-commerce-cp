import { Router } from "express";
import { search, suggestions } from "../controllers/searchController.js";
import { optionalAuth } from "../middlewares/authMiddleware.js";

const router = Router();
router.get("/suggestions", suggestions);
router.get("/", optionalAuth, search);
export default router;
