import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import "dotenv/config";

// Main authentication middleware with refresh token support
export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access - no token provided",
        statusCode: 401,
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Access token expired",
          statusCode: 401,
          errorCode: "TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Access token invalid",
        statusCode: 401,
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User not found",
        statusCode: 403,
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please verify your email to access this resource.",
        statusCode: 403,
        errorCode: "EMAIL_NOT_VERIFIED",
        user: { _id: user._id, email: user.email, name: user.name, isVerified: false }
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication error",
      statusCode: 500,
      error: error.message,
    });
  }
};

// Refresh token verification
export const verifyRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
        statusCode: 401,
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
      statusCode: 401,
    });
  }
};

// Optional authentication (for public endpoints that can be personalized for logged-in users)
export const checkAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      req.user = user;
      req.userId = user?._id;
    }
    next();
  } catch (error) {
    next(); // Continue even if token is invalid for optional auth
  }
};