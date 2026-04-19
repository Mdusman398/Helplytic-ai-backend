import express from "express";
import "dotenv/config";
import connectDb from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import requestRoutes from "./routes/requestRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import dns from "node:dns";
import { requestLogger, errorLogger } from "./middleWare/logger.js";
import { rateLimiter } from "./middleWare/rateLimiter.js";
import { errorHandler, notFound } from "./middleWare/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: process.env.Frontend_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Middleware Stack
app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// Logging middleware
app.use(requestLogger);

// Rate limiter (general)
app.use(rateLimiter(100, 60000));

// Database Connection
connectDb();

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Helplytics AI Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/users", userRouter);
app.use("/api/requests", requestRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// 404 Handler
app.use(notFound);

// Error Logging
app.use(errorLogger);

// Global Error Handler
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`📌 Environment: ${process.env.NODE_ENV}`);
  });
}

export default app;