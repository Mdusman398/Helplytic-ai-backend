import { sendOtpMail } from "../emailVerifications/sendOtpMail.js";
import { verifyMail } from "../emailVerifications/verifyMail.js";
import { Session } from "../models/sessionModel.js";
import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signUp = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).send({ success: false, message: "all fields are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).send({ success: false, message: "user already exists" });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPass,
    });

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    newUser.token = token;
    await newUser.save();

  const verifyLink = `http://localhost:5173/verify/${token}`;

   await verifyMail(token, email);

    return res.status(201).send({
      success: true,
      message: "user created successfully",
      data: newUser,
    });

  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "server error",
      error: error.message,
    });
  }
};

export const verification = async (req, res) => {
  try {
    const token = req.params.token;

    if (!token) {
      return res.status(401).send({ success: false, message: "invalid or missing token" });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).send({ success: false, message: "token expired" });
      }
      return res.status(403).send({ success: false, message: "invalid token" });
    }

    const user = await User.findById(decoded.id);
       
        
        if (!user) {
          return res.status(404).send({ success: false, message: "user not found" });
        }
    

    if (user.token !== token) {
      return res.status(403).send({ success: false, message: "invalid verification token" });
    }

    user.token = null;
    user.isVerified = true;

    await user.save();

    return res.status(200).send({
      success: true,
      message: "email verified successfully",
    });

  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({
      success: false,
      message: "all fields are required",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).send({
      success: false,
      message: "unauthorized access user not found"
    });
  }

  const matchPass = await bcrypt.compare(password, user.password);

  if (!matchPass) {
    return res.status(401).send({ success: false, message: "invalid credentials" });
  }

  if (user.isVerified !== true) {
    return res.status(403).send({ success: false, message: "please verify your account" });
  }

  const existingSession = await Session.findOne({ userId: user._id });

  if (existingSession) {
    await Session.deleteOne({ userId: user._id });
  }

  await Session.create({ userId: user._id });

  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  user.isLoggedIn = true;
  await user.save();

  return res.status(200).send({
    success: true,
    message: `welcome back ${user.username}`,
    user
  });
};

export const logOut = async(req, res) => {
  try {
    const userId = req.userId;

    await Session.deleteMany({ userId });

    await User.findByIdAndUpdate(userId, { isLoggedIn: false });

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).send({
      success: true,
      message : "logout successfully"
    });

  } catch (error) {
    return res.status(500).send({
      success: false,
      message : error.message
    });
  }
};

export const forgotPassword = async(req,res) => {
  try {
    const {email} = req.body;

    const user = await User.findOne({email});
    if(!user){
      return res.status(400).send({ success: false, message: "user not found" });
    }

    const Otp = Math.floor(100000 + Math.random()*900000).toString();
    const expiry = new Date(Date.now() +10*60*1000);
    user.otp = Otp;
    user.otpExpiry = expiry;
    await user.save();

    await sendOtpMail(email,Otp);

    res.status(200).send({ success: true, message : "otp send Successfully" });

  } catch (error) {
    return res.status(500).send({
      success : false,
      message: error.message
    });
  }
};

export const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const email = req.params.email;

  if (!otp) {
    return res.status(400).send({ success: false, message: "otp is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ success: false, message: "user not found" });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).send({ success: false, message: "otp not generated" });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).send({ success: false, message: "otp has expired request a new one" });
    }

    if (otp !== user.otp) {
      return res.status(400).send({ success: false, message: "invalid OTP" });
    }

    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    return res.status(200).send({ success: true, message: "OTP verified successfully" });

  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

export const changePassword = async(req, res) => {
  const {newPassword , confirmPassword} = req.body;
  const email = req.params.email;
  if(!newPassword || !confirmPassword){
    return res.status(400).send({ success: false, message :"all fields are required" });
  }
  if(newPassword !== confirmPassword){
    return res.status(400).send({ success: false, message : "password do not match" });
  }
  try {
    const user = await User.findOne({email});
    if(!user){
      return res.status(404).send({ success: false, message : "user not found" });
    }
    const hashedPass = await bcrypt.hash(newPassword, 10);
    user.password = hashedPass;
    await user.save();
    return res.status(200).send({
      success: true,
      message : "password change succesfuly "
    });

  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};


export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -token");
    if (!user) return res.status(404).send({ success: false, message: "user not found" });
    return res.status(200).send({ success: true, user });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};