import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Leaderboard } from "../models/Leaderboard.js";
import crypto from "crypto";
import { verifyMail } from "../emailVerifications/verifyMail.js";
import { sendOtpMail } from "../emailVerifications/sendOtpMail.js";
import { HTTP_STATUS, TOKEN_EXPIRY } from "../config/constants.js";

// Helper: Generate Tokens
const generateTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY.ACCESS }
  );

  const refreshToken = jwt.sign(
    { id: userId, email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: TOKEN_EXPIRY.REFRESH }
  );

  return { accessToken, refreshToken };
};

// Helper: Hash Password
const hashPassword = async (password) => {
  const salt = await bcryptjs.genSalt(10);
  return await bcryptjs.hash(password, salt);
};

// Helper: Compare Password
const comparePassword = async (password, hashedPassword) => {
  return await bcryptjs.compare(password, hashedPassword);
};

// Helper: Generate OTP
const generateOTP = (length = 6) => {
  return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1))
    .toString()
    .substring(0, length);
};

// Helper: Parse expiry time
const parseExpiry = (expiryStr) => {
  const match = expiryStr.match(/^(\d+)([mh])$/);
  if (!match) return new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [, value, unit] = match;
  const ms = unit === "m" ? parseInt(value) * 60 * 1000 : parseInt(value) * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
};

// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: "Email already registered",
        statusCode: HTTP_STATUS.CONFLICT,
        errors: { email: "This email is already in use" }
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      isVerified: false,
    });

    await user.save();

    // Initialize Leaderboard
    const leaderboard = new Leaderboard({ userId: user._id });
    await leaderboard.save();

    // Send Verification Email (JWT-based token: avoids DB token mismatch issues)
    const emailVerifyToken = jwt.sign(
      { id: user._id, email: user.email, type: "email_verify" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY || "24h" }
    );

    const verifyLink = `${process.env.FRONTEND_URL}/verify-email/${encodeURIComponent(emailVerifyToken)}`;

    if (process.env.NODE_ENV !== "production") {
      console.log("[email-verify][register]", {
        email: user.email,
        tokenPrefix: emailVerifyToken.slice(0, 10),
        expiry: process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY || "24h",
        verifyLink,
      });
    }

    try {
      await verifyMail(verifyLink, user.email);
    } catch (mailError) {
      console.error("Failed to send verification email:", mailError);
      // We still created the user, they can try to resend later
    }

    const responsePayload = {
      success: true,
      message: "Secure account created! Please activate your signal by clicking the link in your email.",
      statusCode: HTTP_STATUS.CREATED,
      data: {
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: false },
      },
    };

    // Dev-only helper: lets you confirm the token/link is correct without relying on email clients
    if (process.env.NODE_ENV !== "production") {
      responsePayload.debugVerifyLink = verifyLink;
      responsePayload.debugTokenPrefix = emailVerifyToken.slice(0, 10);
      responsePayload.debugUserId = user._id;
      responsePayload.debugEmail = user.email;
    }

    res.status(HTTP_STATUS.CREATED).json(responsePayload);
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error during registration",
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error: error.message,
    });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid email or password",
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid email or password",
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Please verify your email to login",
        statusCode: HTTP_STATUS.FORBIDDEN,
        isVerified: false,
        userId: user._id
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.email);
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Login successful",
      statusCode: HTTP_STATUS.OK,
      data: {
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error during login",
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error: error.message,
    });
  }
};

// SEND VERIFICATION EMAIL (JWT-based)
export const sendVerificationEmail = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "User not found" });
    }

    const emailVerifyToken = jwt.sign(
      { id: user._id, email: user.email, type: "email_verify" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY || "24h" }
    );

    const verifyLink = `${process.env.FRONTEND_URL}/verify-email/${encodeURIComponent(emailVerifyToken)}`;
    await verifyMail(verifyLink, user.email);

    const responsePayload = {
      success: true,
      message: "Verification email sent successfully",
      statusCode: HTTP_STATUS.OK,
    };

    // Dev-only helper: lets you confirm the token/link is correct without relying on email clients
    if (process.env.NODE_ENV !== "production") {
      responsePayload.debugVerifyLink = verifyLink;
      responsePayload.debugTokenPrefix = emailVerifyToken.slice(0, 10);
      responsePayload.debugUserId = user._id;
      responsePayload.debugEmail = user.email;
    }

    res.status(HTTP_STATUS.OK).json(responsePayload);
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to send verification email",
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error: error.message,
    });
  }
};

// VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const tokenParam = req.params?.token || req.query?.token;
    if (!tokenParam) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const rawToken = decodeURIComponent(tokenParam.toString()).trim();
    if (!rawToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // 1) JWT-based verification (new flow)
    if (rawToken.includes(".")) {
      try {
        const payload = jwt.verify(rawToken, process.env.JWT_SECRET);

        if (payload?.type !== "email_verify" || !payload?.id) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid verification token",
          });
        }

        const user = await User.findById(payload.id);
        if (!user) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: "Invalid or expired verification token",
          });
        }

        if (!user.isVerified) {
          user.isVerified = true;
          user.verificationToken = null;
          user.verificationTokenExpiry = null;
          await user.save();
        }

        if (process.env.NODE_ENV !== "production") {
          console.log("[email-verify][verify] jwt ok", {
            userId: user._id,
            email: user.email,
          });
        }

        return res.status(HTTP_STATUS.OK).json({
          success: true,
          message: "Email verified successfully",
          data: { user: { _id: user._id, name: user.name, email: user.email, isVerified: user.isVerified } },
        });
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[email-verify][verify] jwt failed", { message: e?.message });
        }
        // Fall through to legacy lookup
      }
    }

    // 2) Legacy hex-token verification (older flow)
    const normalizedToken = rawToken
      .toLowerCase()
      .replace(/[^a-f0-9]/g, "");

    if (!normalizedToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid verification token format",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(normalizedToken)
      .digest("hex");

    let user = await User.findOne({ verificationToken: hashedToken });
    let matchedBy = user ? "hashed" : null;

    if (!user) {
      // Backward compatibility if raw token was stored
      user = await User.findOne({ verificationToken: normalizedToken });
      matchedBy = user ? "raw" : null;
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[email-verify][verify] legacy lookup", {
        tokenPrefix: normalizedToken.slice(0, 10),
        hashPrefix: hashedToken.slice(0, 10),
        matchedBy,
        storedPrefix: user?.verificationToken ? user.verificationToken.slice(0, 10) : null,
        email: user?.email || null,
      });
    }

    if (!user) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    if (user.verificationTokenExpiry && user.verificationTokenExpiry <= Date.now()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Verification token has expired",
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Email verified successfully",
      data: { user: { _id: user._id, name: user.name, email: user.email, isVerified: user.isVerified } },
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Email verification failed",
      error: error.message,
    });
  }
};

// SEND FORGOT PASSWORD OTP
export const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "User not found" });
    }

    const otp = generateOTP(parseInt(process.env.OTP_LENGTH) || 6);
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.otp = hashedOtp;
    user.otpExpiry = parseExpiry(process.env.OTP_EXPIRY || "10m");
    await user.save();

    await sendOtpMail(user.email, otp);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

// VERIFY OTP
export const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "User not found" });
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (user.otp !== hashedOtp || user.otpExpiry < Date.now()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Invalid or expired OTP" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "OTP verified successfully",
      data: { resetToken },
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "OTP verification failed",
      error: error.message,
    });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "User not found" });
    }

    const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    if (user.resetPasswordToken !== hashedResetToken || user.resetPasswordTokenExpiry < Date.now()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = await hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiry = null;
    await user.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Password reset failed",
      error: error.message,
    });
  }
};

// REFRESH TOKEN
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "User not found" });
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY.ACCESS }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.status(HTTP_STATUS.OK).json({ success: true, accessToken });
  } catch (error) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: "Invalid refresh token" });
  }
};

// GET PROFILE
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -refreshTokens");
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "User not found" });
    }
    res.status(HTTP_STATUS.OK).json({ success: true, data: user });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Profile error" });
  }
};

// GET USER BY ID (PUBLIC)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -refreshTokens -email");
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "User not found" });
    }
    res.status(HTTP_STATUS.OK).json({ success: true, data: user });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error" });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true }).select("-password -refreshTokens");
    res.status(HTTP_STATUS.OK).json({ success: true, message: "Profile updated", data: user });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Update error" });
  }
};

// LOGOUT
export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: { token: refreshToken } } });
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(HTTP_STATUS.OK).json({ success: true, message: "Logout successful" });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Logout error" });
  }
};

// RESEND VERIFICATION EMAIL (JWT-based)
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Email is already verified",
      });
    }

    const emailVerifyToken = jwt.sign(
      { id: user._id, email: user.email, type: "email_verify" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY || "24h" }
    );

    const verifyLink = `${process.env.FRONTEND_URL}/verify-email/${encodeURIComponent(emailVerifyToken)}`;
    await verifyMail(verifyLink, user.email);

    const responsePayload = {
      success: true,
      message: "Verification email resent. Please check your inbox.",
    };

    // Dev-only helper: lets you confirm the token/link is correct without relying on email clients
    if (process.env.NODE_ENV !== "production") {
      responsePayload.debugVerifyLink = verifyLink;
      responsePayload.debugTokenPrefix = emailVerifyToken.slice(0, 10);
      responsePayload.debugUserId = user._id;
      responsePayload.debugEmail = user.email;
    }

    res.status(HTTP_STATUS.OK).json(responsePayload);
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to resend verification email",
      error: error.message,
    });
  }
};
