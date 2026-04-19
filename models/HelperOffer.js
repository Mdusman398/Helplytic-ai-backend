import mongoose from "mongoose";

const helperOfferSchema = new mongoose.Schema({
  // References
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "helplyticUser",
    required: true,
  },

  // Offer Details
  message: {
    type: String,
    required: true,
    minlength: 5,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "completed"],
    default: "pending",
  },

  // Rating after completion
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  feedback: {
    type: String,
    default: null,
  },

}, {
  timestamps: true,
});

// Indexes
helperOfferSchema.index({ requestId: 1, status: 1 });
helperOfferSchema.index({ userId: 1 });
helperOfferSchema.index({ createdAt: -1 });

export const HelperOffer = mongoose.model("HelperOffer", helperOfferSchema);
