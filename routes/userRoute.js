import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  getUserById,
  updateProfile,
  refreshAccessToken,
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
} from "../controller/userController.js";
import { isAuthenticated } from "../middleWare/authMiddleware.js";
import { validateBody } from "../middleWare/validationMiddleware.js";
import { registerSchema, loginSchema, updateProfileSchema } from "../validations/userValidation.js";
import { authRateLimiter } from "../middleWare/rateLimiter.js";

const router = express.Router();

// Auth Routes
router.post("/register", authRateLimiter(5, 60000), validateBody(registerSchema), registerUser);
router.post("/login", authRateLimiter(5, 60000), validateBody(loginSchema), loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", isAuthenticated, logoutUser);

// Email Verification Routes
router.post("/send-verification-email", authRateLimiter(3, 60000), sendVerificationEmail);
router.post("/resend-verification-email", authRateLimiter(3, 60000), resendVerificationEmail);
router.get("/verify-email/:token", verifyEmail);

// Forgot Password Routes
router.post("/forgot-password", authRateLimiter(5, 60000), sendForgotPasswordOTP);
router.post("/verify-otp", authRateLimiter(5, 60000), verifyForgotPasswordOTP);
router.post("/reset-password", authRateLimiter(5, 60000), resetPassword);

// Profile Routes
router.get("/profile", isAuthenticated, getUserProfile);
router.get("/profile/:id", getUserById);
router.put("/profile", isAuthenticated, validateBody(updateProfileSchema), updateProfile);

export default router;
