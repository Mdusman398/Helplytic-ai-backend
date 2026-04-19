import express from "express";
import {
  offerHelp,
  getOffersForRequest,
  getMyOffers,
  acceptOffer,
  rejectOffer,
} from "../controller/helperOfferController.js";
import { isAuthenticated } from "../middleWare/authMiddleware.js";
import { canHelp } from "../middleWare/roleMiddleware.js";
import { validateBody } from "../middleWare/validationMiddleware.js";
import { helperOfferSchema } from "../validations/otherValidation.js";
import { userRateLimiter } from "../middleWare/rateLimiter.js";

const router = express.Router();

// Offer Help
router.post(
  "/request/:requestId/offer",
  isAuthenticated,
  canHelp,
  userRateLimiter(20, 60000),
  validateBody(helperOfferSchema),
  offerHelp
);

// Get Offers for Specific Request
router.get("/request/:requestId", getOffersForRequest);

// Get My Pending Offers
router.get("/my-offers", isAuthenticated, getMyOffers);

// Accept Offer
router.put("/:offerId/accept", isAuthenticated, acceptOffer);

// Reject Offer
router.put("/:offerId/reject", isAuthenticated, rejectOffer);

export default router;
