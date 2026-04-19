import { Notification } from "../models/Notification.js";

// GET NOTIFICATIONS
export const getNotifications = async (req, res) => {
  try {
    const { unreadOnly = false, page = 1, limit = 20 } = req.query;

    const filter = { userId: req.user._id };
    if (unreadOnly === "true") {
      filter.read = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(filter)
      .populate("relatedUserId", "name avatar")
      .populate("relatedRequestId", "title")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      message: "Notifications retrieved",
      statusCode: 200,
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve notifications",
      statusCode: 500,
    });
  }
};

// GET UNREAD COUNT
export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      message: "Unread count retrieved",
      statusCode: 200,
      data: { unreadCount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve unread count",
      statusCode: 500,
    });
  }
};

// MARK NOTIFICATION AS READ
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
        statusCode: 404,
      });
    }

    // Check if user is owner
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this notification",
        statusCode: 403,
      });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      statusCode: 200,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update notification",
      statusCode: 500,
    });
  }
};

// MARK ALL AS READ
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user._id,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      statusCode: 500,
    });
  }
};

// DELETE NOTIFICATION
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
        statusCode: 404,
      });
    }

    // Check if user is owner
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this notification",
        statusCode: 403,
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      statusCode: 500,
    });
  }
};

// CLEAR ALL NOTIFICATIONS
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });

    res.status(200).json({
      success: true,
      message: "All notifications cleared",
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to clear notifications",
      statusCode: 500,
    });
  }
};
