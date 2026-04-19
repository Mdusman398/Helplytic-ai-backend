import { Leaderboard } from "../models/Leaderboard.js";
import { Review } from "../models/Review.js";

// GET TOP HELPERS
export const getTopHelpers = async (req, res) => {
  try {
    const { period = "allTime", limit = 10 } = req.query;

    let sortField = "allTimeRank";
    switch (period) {
      case "monthly":
        sortField = "monthlyRank";
        break;
      case "weekly":
        sortField = "weeklyRank";
        break;
      default:
        sortField = "allTimeRank";
    }

    const topHelpers = await Leaderboard.find({
      [sortField]: { $ne: null },
    })
      .populate("userId", "name avatar bio skills trustScore")
      .sort({ [sortField]: 1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: `Top helpers (${period})`,
      statusCode: 200,
      data: topHelpers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve leaderboard",
      statusCode: 500,
    });
  }
};

// GET USER RANK
export const getUserRank = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = "allTime" } = req.query;

    const leaderboard = await Leaderboard.findOne({ userId }).populate(
      "userId",
      "name avatar bio skills trustScore"
    );

    if (!leaderboard) {
      return res.status(404).json({
        success: false,
        message: "User not found on leaderboard",
        statusCode: 404,
      });
    }

    let rank;
    switch (period) {
      case "monthly":
        rank = leaderboard.monthlyRank;
        break;
      case "weekly":
        rank = leaderboard.weeklyRank;
        break;
      default:
        rank = leaderboard.allTimeRank;
    }

    res.status(200).json({
      success: true,
      message: "User rank retrieved",
      statusCode: 200,
      data: {
        rank,
        leaderboard,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user rank",
      statusCode: 500,
    });
  }
};

// GET MY RANK
export const getMyRank = async (req, res) => {
  try {
    const { period = "allTime" } = req.query;

    const leaderboard = await Leaderboard.findOne({
      userId: req.user._id,
    }).populate("userId", "name avatar bio skills trustScore");

    if (!leaderboard) {
      return res.status(404).json({
        success: false,
        message: "You are not on the leaderboard yet",
        statusCode: 404,
      });
    }

    let rank;
    switch (period) {
      case "monthly":
        rank = leaderboard.monthlyRank;
        break;
      case "weekly":
        rank = leaderboard.weeklyRank;
        break;
      default:
        rank = leaderboard.allTimeRank;
    }

    res.status(200).json({
      success: true,
      message: "Your rank retrieved",
      statusCode: 200,
      data: {
        rank,
        leaderboard,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve your rank",
      statusCode: 500,
    });
  }
};

// Update leaderboard rankings (should be called periodically or after changes)
export const updateLeaderboards = async (req, res) => {
  try {
    const leaderboards = await Leaderboard.find({});

    // Update all-time rankings
    const allTimeRanked = await Leaderboard.find({})
      .sort({ trustScore: -1 })
      .select("_id");

    for (let i = 0; i < allTimeRanked.length; i++) {
      await Leaderboard.findByIdAndUpdate(allTimeRanked[i]._id, {
        allTimeRank: i + 1,
      });
    }

    res.status(200).json({
      success: true,
      message: "Leaderboards updated successfully",
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update leaderboards",
      statusCode: 500,
    });
  }
};
