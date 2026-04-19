import express from "express";
import {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  getMyRequests,
  getHelpedRequests,
  markRequestSolved,
  addComment,
  analyzeRequestAI,
} from "../controller/requestController.js";
import { isAuthenticated } from "../middleWare/authMiddleware.js";
import { canHelp } from "../middleWare/roleMiddleware.js";
import { validateBody, validateQuery } from "../middleWare/validationMiddleware.js";
import {
  createRequestSchema,
  updateRequestSchema,
  filterRequestSchema,
  addCommentSchema,
  aiAnalyzeRequestSchema,
} from "../validations/requestValidation.js";
import { userRateLimiter } from "../middleWare/rateLimiter.js";

const router = express.Router();

// Create Request
router.post(
  "/",
  isAuthenticated,
  userRateLimiter(10, 60000),
  validateBody(createRequestSchema),
  createRequest
);

// Get All Requests
router.get(
  "/",
  validateQuery(filterRequestSchema),
  getAllRequests
);

// AI Analyze (category/tags/urgency/summary)
router.post(
  "/ai/analyze",
  userRateLimiter(30, 60000),
  validateBody(aiAnalyzeRequestSchema),
  analyzeRequestAI
);

// Get My Requests
router.get("/feed/my-requests", isAuthenticated, getMyRequests);

// Get Requests I Helped With
router.get("/feed/helped-me", isAuthenticated, getHelpedRequests);

// Get Request by ID
router.get("/:id", getRequestById);

// Update Request
router.put(
  "/:id",
  isAuthenticated,
  validateBody(updateRequestSchema),
  updateRequest
);

// Delete Request
router.delete("/:id", isAuthenticated, deleteRequest);

// Mark Request as Solved
router.put("/:id/mark-solved", isAuthenticated, markRequestSolved);

// Add Comment
router.post(
  "/:id/comments",
  isAuthenticated,
  validateBody(addCommentSchema),
  addComment
);

export default router;
