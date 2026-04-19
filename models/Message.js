import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  // References
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "helplyticUser",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "helplyticUser",
    required: true,
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
    default: null,
  },

  // Message Content
  content: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 5000,
  },
  attachments: [{
    url: String,
    type: String, // image, document, etc
  }],

  // Status
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent",
  },

  // Timestamps
  readAt: {
    type: Date,
    default: null,
  },
  deliveredAt: {
    type: Date,
    default: Date.now,
  },

}, {
  timestamps: true,
});

// Indexes
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, status: 1 });
messageSchema.index({ requestId: 1 });

export const Message = mongoose.model("Message", messageSchema);
