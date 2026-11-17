import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getInbox,
  getOrInitiateConversation,
  getMessages,
  sendMessage,
  togglePin,
  toggleMute,
  toggleArchive,
  markRead,
} from "../controllers/chatController.js";

const router = Router();

router.use(protect);

router.get("/inbox", getInbox);
router.post("/conversations", getOrInitiateConversation);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/messages", sendMessage);
router.patch("/conversations/:conversationId/pin", togglePin);
router.patch("/conversations/:conversationId/mute", toggleMute);
router.patch("/conversations/:conversationId/archive", toggleArchive);
router.patch("/conversations/:conversationId/read", markRead);

export default router;

