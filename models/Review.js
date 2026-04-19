import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  // User who gives review
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "helplyticUser",
    required: true,
  },
  // User who receives review
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "helplyticUser",
    required: true,
  },

  // Related Request & Offer
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
    required: true,
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HelperOffer",
    default: null,
  },

  // Review Details
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    minlength: 5,
  },

  // Categories
  categories: {
    communication: Number, // 1-5
    helpfulness: Number,   // 1-5
    timeliness: Number,    // 1-5
    professionalism: Number, // 1-5
  },

  // Flags
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  flagged: {
    type: Boolean,
    default: false,
  },
  flagReason: {
    type: String,
    default: null,
  },

}, {
  timestamps: true,
});

// Indexes
reviewSchema.index({ from: 1, to: 1 });
reviewSchema.index({ to: 1 });
reviewSchema.index({ requestId: 1 });
reviewSchema.index({ createdAt: -1 });

export const Review = mongoose.model("Review", reviewSchema);
