// Request Logger Middleware

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Capture the response end
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?._id || "anonymous",
      ip: req.ip,
    };

    // Log based on status code
    if (res.statusCode >= 400) {
      console.error("[ERROR]", JSON.stringify(logData, null, 2));
    } else {
      console.log("[REQUEST]", JSON.stringify(logData, null, 2));
    }
  });

  next();
};

// Error logger
export const errorLogger = (err, req, res, next) => {
  console.error({
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?._id || "anonymous",
  });
  next(err);
};
