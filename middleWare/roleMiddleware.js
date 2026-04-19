// Role-Based Access Control Middleware

// Check if user has required role
export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          statusCode: 401,
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
          statusCode: 403,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Authorization error",
        statusCode: 500,
      });
    }
  };
};

// Check if user can help (role is can_help or both)
export const canHelp = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        statusCode: 401,
      });
    }

    if (req.user.role !== "can_help" && req.user.role !== "both") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to help others",
        statusCode: 403,
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Authorization error",
      statusCode: 500,
    });
  }
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        statusCode: 401,
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
        statusCode: 403,
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Authorization error",
      statusCode: 500,
    });
  }
};

// Check if user owns the resource
export const checkOwnership = (idField = "_id") => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
          statusCode: 401,
        });
      }

      const resourceOwnerId = req.params.id || req.body[idField];
      
      if (req.user._id.toString() !== resourceOwnerId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to access this resource",
          statusCode: 403,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Authorization error",
        statusCode: 500,
      });
    }
  };
};
