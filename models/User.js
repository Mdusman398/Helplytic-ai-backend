import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: null,
  },

  // Role & Status
  role: {
    type: String,
    enum: ["need_help", "can_help", "both"],
    default: "need_help",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },

  // Profile Info
  bio: {
    type: String,
    default: "",
  },
  skills: [{
    type: String,
  }],
  interests: [{
    type: String,
  }],
  location: {
    type: String,
    default: "",
  },

  // Stats
  helpCount: {
    type: Number,
    default: 0,
  },
  requestCount: {
    type: Number,
    default: 0,
  },
  trustScore: {
    type: Number,
    default: 0,
  },
  badges: [{
    name: String,
    icon: String,
    awardedAt: Date,
  }],

  // Preferences
  notificationsEnabled: {
    type: Boolean,
    default: true,
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },

  // Auth Tokens
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800, // 7 days
    },
  }],

  // Email Verification
  verificationToken: {
    type: String,
    default: null,
  },
  verificationTokenExpiry: {
    type: Date,
    default: null,
  },

  // Password Reset
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordTokenExpiry: {
    type: Date,
    default: null,
  },

  // OTP for Password Reset
  otp: {
    type: String,
    default: null,
  },
  otpExpiry: {
    type: Date,
    default: null,
  },

  // Relations (for quick access)
  createdRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
  }],
  helpedRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
  }],

}, {
  timestamps: true,
});

// Indexes for quick lookups
userSchema.index({ createdAt: -1 });
userSchema.index({ trustScore: -1 });

export const User = mongoose.model("helplyticUser", userSchema);
