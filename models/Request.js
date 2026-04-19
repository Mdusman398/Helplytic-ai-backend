import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: true,
    minlength: 10,
  },
  description: {
    type: String,
    required: true,
  },

  // Categorization
  category: {
    type: String,
    enum: [
      "academics",
      "technical",
      "career",
      "health",
      "lifestyle",
      "creative",
      "other",
    ],
    required: true,
  },
  tags: [{
    type: String,
  }],

  // AI Fields
  autoCategory: {
    type: String,
    default: null,
  },
  suggestedTags: [{
    type: String,
  }],
  aiSummary: {
    type: String,
    default: null,
  },

  // Status & Urgency
  status: {
    type: String,
    enum: ["open", "in_progress", "solved", "closed"],
    default: "open",
  },
  urgency: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },

  // User Info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "helplyticUser",
    required: true,
  },
  solvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "helplyticUser",
    default: null,
  },

  // Interactions
  helpOffers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "HelperOffer",
  }],
  acceptedHelper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "helplyticUser",
    default: null,
  },

  // Skills Related
  requiredSkills: [{
    type: String,
  }],
  helperLocation: {
    type: String,
    default: "",
  },

  // Metadata
  views: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "helplyticUser",
        required: true,
      },
      userName: String,
      text: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

}, {
  timestamps: true,
});

// Indexes for performance
requestSchema.index({ createdBy: 1, createdAt: -1 });
requestSchema.index({ category: 1, status: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ urgency: 1 });

export const Request = mongoose.model("Request", requestSchema);
