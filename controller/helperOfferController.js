import { HelperOffer } from "../models/HelperOffer.js";
import { Request } from "../models/Request.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";

// OFFER HELP
export const offerHelp = async (req, res) => {
  try {
    const { message } = req.body;
    const requestId = req.params.requestId;

    // Check if request exists
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
        statusCode: 404,
      });
    }

    // Check if already offered
    const existingOffer = await HelperOffer.findOne({
      requestId,
      userId: req.user._id,
    });

    if (existingOffer) {
      return res.status(409).json({
        success: false,
        message: "You have already offered help on this request",
        statusCode: 409,
      });
    }

    // Create offer
    const offer = new HelperOffer({
      requestId,
      userId: req.user._id,
      message,
    });

    await offer.save();

    // Add to request's helpOffers
    await Request.findByIdAndUpdate(requestId, {
      $push: { helpOffers: offer._id },
    });

    // Create notification for request creator
    await Notification.create({
      userId: request.createdBy,
      type: "helper_offered",
      title: "New Helper Offered",
      message: `Someone offered to help with "${request.title}"`,
      relatedUserId: req.user._id,
      relatedRequestId: requestId,
      relatedOfferId: offer._id,
    });

    res.status(201).json({
      success: true,
      message: "Help offered successfully",
      statusCode: 201,
      data: offer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to offer help",
      statusCode: 500,
      error: error.message,
    });
  }
};

// GET OFFERS FOR REQUEST
export const getOffersForRequest = async (req, res) => {
  try {
    const offers = await HelperOffer.find({
      requestId: req.params.requestId,
    })
      .populate("userId", "name avatar trustScore skills")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      message: "Offers retrieved",
      statusCode: 200,
      data: offers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve offers",
      statusCode: 500,
    });
  }
};

// GET MY PENDING OFFERS
export const getMyOffers = async (req, res) => {
  try {
    const offers = await HelperOffer.find({
      userId: req.user._id,
      status: "pending",
    })
      .populate("requestId", "title description category")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      message: "Your pending offers",
      statusCode: 200,
      data: offers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve offers",
      statusCode: 500,
    });
  }
};

// ACCEPT OFFER
export const acceptOffer = async (req, res) => {
  try {
    const offer = await HelperOffer.findById(req.params.offerId);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
        statusCode: 404,
      });
    }

    const request = await Request.findById(offer.requestId);

    // Check if user is request creator
    if (request.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only request creator can accept offers",
        statusCode: 403,
      });
    }

    // Update offer status
    offer.status = "accepted";
    await offer.save();

    // Update request
    request.status = "in_progress";
    request.acceptedHelper = offer.userId;
    await request.save();

    // Reject other offers
    await HelperOffer.updateMany(
      {
        requestId: offer.requestId,
        _id: { $ne: offer._id },
        status: "pending",
      },
      { status: "rejected" }
    );

    // Create notification
    await Notification.create({
      userId: offer.userId,
      type: "offer_accepted",
      title: "Offer Accepted",
      message: `Your offer to help has been accepted for "${request.title}"`,
      relatedRequestId: offer.requestId,
      relatedOfferId: offer._id,
    });

    res.status(200).json({
      success: true,
      message: "Offer accepted successfully",
      statusCode: 200,
      data: offer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to accept offer",
      statusCode: 500,
    });
  }
};

// REJECT OFFER
export const rejectOffer = async (req, res) => {
  try {
    const offer = await HelperOffer.findById(req.params.offerId);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
        statusCode: 404,
      });
    }

    const request = await Request.findById(offer.requestId);

    // Check if user is request creator
    if (request.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only request creator can reject offers",
        statusCode: 403,
      });
    }

    // Update offer status
    offer.status = "rejected";
    await offer.save();

    // Create notification
    await Notification.create({
      userId: offer.userId,
      type: "offer_rejected",
      title: "Offer Not Selected",
      message: `Your offer for "${request.title}" was not selected`,
      relatedRequestId: offer.requestId,
      relatedOfferId: offer._id,
    });

    res.status(200).json({
      success: true,
      message: "Offer rejected",
      statusCode: 200,
      data: offer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject offer",
      statusCode: 500,
    });
  }
};
