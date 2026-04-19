import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";

// SEND MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, requestId, attachments } = req.body;

    const message = new Message({
      senderId: req.user._id,
      receiverId,
      requestId: requestId || null,
      content,
      attachments: attachments || [],
    });

    await message.save();

    // Create notification
    await Notification.create({
      userId: receiverId,
      type: "message_received",
      title: "New Message",
      message: `${req.user.name} sent you a message`,
      relatedUserId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      statusCode: 201,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      statusCode: 500,
      error: error.message,
    });
  }
};

// GET CONVERSATIONS
export const getConversations = async (req, res) => {
  try {
    const userCollection = User.collection.name;

    // Get all unique users we've had conversations with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user._id },
            { receiverId: req.user._id },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", req.user._id] },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessage: { $first: "$content" },
          lastMessageTime: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", req.user._id] },
                    { $eq: ["$status", "delivered"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
      {
        $lookup: {
          from: userCollection,
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Conversations retrieved",
      statusCode: 200,
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve conversations",
      statusCode: 500,
    });
  }
};

// GET MESSAGES WITH SPECIFIC USER
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id },
      ],
    })
      .populate("senderId", "name avatar")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        receiverId: req.user._id,
        senderId: userId,
        status: { $ne: "read" },
      },
      {
        status: "read",
        readAt: new Date(),
      }
    );

    const total = await Message.countDocuments({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Messages retrieved",
      statusCode: 200,
      data: {
        messages: messages.reverse(),
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
      message: "Failed to retrieve messages",
      statusCode: 500,
    });
  }
};

// MARK MESSAGE AS READ
export const markMessageAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
        statusCode: 404,
      });
    }

    // Check if user is receiver
    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this message",
        statusCode: 403,
      });
    }

    message.status = "read";
    message.readAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: "Message marked as read",
      statusCode: 200,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update message",
      statusCode: 500,
    });
  }
};

// DELETE MESSAGE
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
        statusCode: 404,
      });
    }

    // Check if user is sender or receiver
    if (
      message.senderId.toString() !== req.user._id.toString() &&
      message.receiverId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this message",
        statusCode: 403,
      });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      statusCode: 500,
    });
  }
};
