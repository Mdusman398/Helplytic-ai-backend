import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  // User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "helplyticUser",
    required: true,
  },

  // Notification Type & Content
  type: {
    type: String,
    enum: [
      "request_created",
      "helper_offered",
      "request_solved",
      "message_received",
      "offer_accepted",
      "offer_rejected",
      "badge_awarded",
      "rank_changed",
      "comment_on_request",
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },

  // Related IDs
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "helplyticUser",
    default: null,
  },
  relatedRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
    default: null,
  },
  relatedOfferId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HelperOffer",
    default: null,
  },

  // Status
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },

  // Expiration
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },

}, {
  timestamps: true,
});

// TTL index to auto-delete after 30 days
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

export const Notification = mongoose.model(
  "Notification",
  notificationSchema
);
