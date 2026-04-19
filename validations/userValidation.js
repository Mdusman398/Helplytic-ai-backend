import * as yup from "yup";

// User Registration Schema
export const registerSchema = yup.object().shape({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("password")], "Passwords must match"),
  role: yup
    .string()
    .required("Role is required")
    .oneOf(
      ["need_help", "can_help", "both"],
      "Invalid role"
    ),
});

// User Login Schema
export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email format"),
  password: yup
    .string()
    .required("Password is required"),
});

// Update Profile Schema
export const updateProfileSchema = yup.object().shape({
  name: yup
    .string()
    .min(2, "Name must be at least 2 characters"),
  bio: yup
    .string()
    .max(500, "Bio must be less than 500 characters"),
  skills: yup
    .array()
    .of(yup.string()),
  interests: yup
    .array()
    .of(yup.string()),
  location: yup
    .string(),
});
