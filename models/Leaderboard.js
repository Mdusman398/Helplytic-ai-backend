import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema({
  // User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "helplyticUser",
    required: true,
    unique: true,
  },

  // Rankings
  allTimeRank: {
    type: Number,
    default: null,
  },
  monthlyRank: {
    type: Number,
    default: null,
  },
  weeklyRank: {
    type: Number,
    default: null,
  },

  // Stats
  totalHelped: {
    type: Number,
    default: 0,
  },
  monthlyHelped: {
    type: Number,
    default: 0,
  },
  weeklyHelped: {
    type: Number,
    default: 0,
  },

  // Scores
  trustScore: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
  },

  // Engagement
  completionRate: {
    type: Number,
    default: 0,
  },
  responseTime: {
    type: Number, // in hours
    default: 0,
  },

  // Badges
  badges: [{
    name: String,
    icon: String,
    awardedAt: Date,
  }],

  // Last Updated
  lastUpdated: {
    type: Date,
    default: Date.now,
  },

}, {
  timestamps: true,
});

// Indexes
leaderboardSchema.index({ allTimeRank: 1 });
leaderboardSchema.index({ monthlyRank: 1 });
leaderboardSchema.index({ weeklyRank: 1 });
leaderboardSchema.index({ trustScore: -1 });

export const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);
