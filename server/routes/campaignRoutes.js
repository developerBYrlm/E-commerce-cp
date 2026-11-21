import { Router } from "express";
import {
  listCampaigns,
  createCampaign,
  recordInteraction,
  updateCampaignStatus,
  deleteCampaign,
} from "../controllers/campaignController.js";
import { optionalAuth, protect, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

// Publicly readable for all browsers and users (logged in or logged out/guests)
router.get("/", optionalAuth, listCampaigns);

// Interactions (views, clicks, likes, shares) accessible to all visitors
router.patch("/:id/interaction", optionalAuth, recordInteraction);

// Owner / Admin creation, status toggles, deletion
router.post("/", protect, authorize("owner", "admin"), createCampaign);
router.patch("/:id/status", protect, authorize("owner", "admin"), updateCampaignStatus);
router.delete("/:id", protect, authorize("owner", "admin"), deleteCampaign);

export default router;
