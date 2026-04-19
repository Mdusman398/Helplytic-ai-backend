import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controller/notificationController.js";
import { isAuthenticated } from "../middleWare/authMiddleware.js";

const router = express.Router();

// Get Notifications
router.get("/", isAuthenticated, getNotifications);

// Get Unread Count
router.get("/unread-count", isAuthenticated, getUnreadCount);

// Mark Notification as Read
router.put("/:id/read", isAuthenticated, markNotificationAsRead);

// Mark All as Read
router.put("/read/all", isAuthenticated, markAllAsRead);

// Delete Notification
router.delete("/:id", isAuthenticated, deleteNotification);

// Clear All Notifications
router.delete("/", isAuthenticated, clearAllNotifications);

export default router;
