import * as yup from "yup";

// Create Request Schema
export const createRequestSchema = yup.object().shape({
  title: yup
    .string()
    .required("Title is required")
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title must be less than 100 characters"),
  description: yup
    .string()
    .required("Description is required")
    .min(20, "Description must be at least 20 characters"),
  category: yup
    .string()
    .oneOf(
      ["academics", "technical", "career", "health", "lifestyle", "creative", "other"],
      "Invalid category"
    )
    .default("other"),
  tags: yup
    .array()
    .of(yup.string())
    .max(10, "Maximum 10 tags allowed"),
  urgency: yup
    .string()
    .oneOf(["low", "medium", "high", "critical"], "Invalid urgency")
    .default("medium"),
  requiredSkills: yup
    .array()
    .of(yup.string()),
  helperLocation: yup
    .string(),
});

// Update Request Schema
export const updateRequestSchema = yup.object().shape({
  title: yup
    .string()
    .min(10, "Title must be at least 10 characters"),
  description: yup
    .string()
    .min(20, "Description must be at least 20 characters"),
  category: yup
    .string()
    .oneOf(
      ["academics", "technical", "career", "health", "lifestyle", "creative", "other"],
      "Invalid category"
    ),
  tags: yup
    .array()
    .of(yup.string())
    .max(10, "Maximum 10 tags allowed"),
  urgency: yup
    .string()
    .oneOf(["low", "medium", "high", "critical"], "Invalid urgency"),
  status: yup
    .string()
    .oneOf(["open", "in_progress", "solved", "closed"], "Invalid status"),
});

// Filter Query Schema
export const filterRequestSchema = yup.object().shape({
  category: yup.string(),
  urgency: yup.string(),
  status: yup.string(),
  page: yup
    .number()
    .positive()
    .default(1),
  limit: yup
    .number()
    .positive()
    .max(50)
    .default(10),
  sort: yup.string().default("-createdAt"),
});

// Add Comment Schema
export const addCommentSchema = yup.object().shape({
  text: yup
    .string()
    .required("Comment text is required")
    .min(2, "Comment must be at least 2 characters")
    .max(1000, "Comment must be less than 1000 characters"),
});

// AI Analyze Request (suggestions) Schema
export const aiAnalyzeRequestSchema = yup.object().shape({
  title: yup
    .string()
    .required("Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: yup
    .string()
    .required("Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters"),
});
