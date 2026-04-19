import * as yup from "yup";

// Send Message Schema
export const sendMessageSchema = yup.object().shape({
  receiverId: yup
    .string()
    .required("Receiver ID is required")
    .matches(/^[0-9a-fA-F]{24}$/, "Invalid receiver ID format"),
  content: yup
    .string()
    .required("Message content is required")
    .min(1, "Message cannot be empty")
    .max(5000, "Message cannot exceed 5000 characters"),
  requestId: yup
    .string()
    .matches(/^[0-9a-fA-F]{24}$/, "Invalid request ID format"),
  attachments: yup
    .array()
    .of(
      yup.object().shape({
        url: yup.string().url("Invalid URL"),
        type: yup.string(),
      })
    ),
});

// Helper Offer Schema
export const helperOfferSchema = yup.object().shape({
  message: yup
    .string()
    .required("Offer message is required")
    .min(5, "Message must be at least 5 characters"),
});

// Accept/Reject Offer Schema
export const offerResponseSchema = yup.object().shape({
  message: yup.string(),
});

// Review/Rating Schema
export const reviewSchema = yup.object().shape({
  rating: yup
    .number()
    .required("Rating is required")
    .min(1, "Minimum rating is 1")
    .max(5, "Maximum rating is 5"),
  comment: yup
    .string()
    .min(5, "Comment must be at least 5 characters"),
  categories: yup.object().shape({
    communication: yup.number().min(1).max(5),
    helpfulness: yup.number().min(1).max(5),
    timeliness: yup.number().min(1).max(5),
    professionalism: yup.number().min(1).max(5),
  }),
});
