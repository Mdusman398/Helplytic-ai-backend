import express from "express";
import {
  getTopHelpers,
  getUserRank,
  getMyRank,
  updateLeaderboards,
} from "../controller/leaderboardController.js";
import { isAuthenticated } from "../middleWare/authMiddleware.js";

const router = express.Router();

// Get Top Helpers
router.get("/top-helpers", getTopHelpers);

// Get User Rank
router.get("/user/:userId", getUserRank);

// Get My Rank
router.get("/my-rank", isAuthenticated, getMyRank);

// Update Leaderboards (Admin or Cron job)
router.post("/update", updateLeaderboards);

export default router;
