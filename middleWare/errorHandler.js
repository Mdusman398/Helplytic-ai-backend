// Global Error Handler Middleware

export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Default error
  let status = err.status || 500;
  let message = err.message || "Internal Server Error";
  let errors = {};

  // Mongoose validation error
  if (err.name === "ValidationError") {
    status = 400;
    message = "Validation Error";
    Object.keys(err.errors).forEach((field) => {
      errors[field] = err.errors[field].message;
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    status = 409;
    message = "Resource already exists";
    const field = Object.keys(err.keyPattern)[0];
    errors[field] = `${field} already exists`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Token expired";
  }

  // Cast error
  if (err.name === "CastError") {
    status = 400;
    message = "Invalid ID format";
  }

  res.status(status).json({
    success: false,
    message,
    statusCode: status,
    ...(Object.keys(errors).length > 0 && { errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Async error wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    statusCode: 404,
    path: req.originalUrl,
  });
};
