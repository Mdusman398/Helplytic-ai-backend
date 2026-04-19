import express from "express";
import {
  sendMessage,
  getConversations,
  getMessages,
  markMessageAsRead,
  deleteMessage,
} from "../controller/messageController.js";
import { isAuthenticated } from "../middleWare/authMiddleware.js";
import { validateBody } from "../middleWare/validationMiddleware.js";
import { sendMessageSchema } from "../validations/otherValidation.js";
import { userRateLimiter } from "../middleWare/rateLimiter.js";

const router = express.Router();

// Send Message
router.post(
  "/",
  isAuthenticated,
  userRateLimiter(30, 60000),
  validateBody(sendMessageSchema),
  sendMessage
);

// Get Conversations
router.get("/conversations", isAuthenticated, getConversations);

// Get Messages with Specific User
router.get("/:userId", isAuthenticated, getMessages);

// Mark Message as Read
router.put("/:id/read", isAuthenticated, markMessageAsRead);

// Delete Message
router.delete("/:id", isAuthenticated, deleteMessage);

export default router;
