// Validation Middleware using Yup

export const validateRequest = (schema, source = "body") => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      await schema.validate(dataToValidate, { abortEarly: false });
      next();
    } catch (error) {
      const errors = {};
      if (error.inner && error.inner.length > 0) {
        error.inner.forEach((err) => {
          errors[err.path] = err.message;
        });
      } else if (error.message) {
        // Fallback for other validation errors
        errors.general = error.message;
      }

      res.status(400).json({
        success: false,
        message: "Validation failed",
        statusCode: 400,
        errors,
      });
    }
  };
};

// Validate request body
export const validateBody = (schema) => {
  return validateRequest(schema, "body");
};

// Validate request params
export const validateParams = (schema) => {
  return validateRequest(schema, "params");
};

// Validate request query
export const validateQuery = (schema) => {
  return validateRequest(schema, "query");
};
