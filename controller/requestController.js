import { Request } from "../models/Request.js";
import { User } from "../models/User.js";
import { HelperOffer } from "../models/HelperOffer.js";
import { Notification } from "../models/Notification.js";
import { aiCategorize, aiSuggestTags, detectUrgency, generateSummary } from "../config/aiService.js";

// CREATE REQUEST
export const createRequest = async (req, res) => {
  try {
    const { title, description, category, tags, urgency, requiredSkills, helperLocation } = req.body;

    // AI Features: Auto-categorize and suggest tags
    const autoCategory = await aiCategorize(title, description);
    const suggestedTags = await aiSuggestTags(title, description);
    const aiSummary = await generateSummary(description);
    const aiUrgency = urgency || (await detectUrgency(title, description));

    const finalCategory = category || autoCategory || "other";

    const normalizeTags = (arr, max = 10) => {
      const seen = new Set();
      return (Array.isArray(arr) ? arr : [])
        .map((t) => String(t || "").trim())
        .filter((t) => t.length > 0)
        .filter((t) => {
          const key = t.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, max);
    };

    const finalTags = normalizeTags(
      Array.isArray(tags) && tags.length > 0 ? tags : suggestedTags,
      10
    );
    const finalSuggestedTags = normalizeTags(suggestedTags, 5);

    const newRequest = new Request({
      title,
      description,
      category: finalCategory,
      tags: finalTags,
      urgency: aiUrgency || "medium",
      createdBy: req.user._id,
      autoCategory,
      suggestedTags: finalSuggestedTags,
      aiSummary,
      requiredSkills: requiredSkills || [],
      helperLocation: helperLocation || "",
    });

    await newRequest.save();

    // Update user's request count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { requestCount: 1 },
      $push: { createdRequests: newRequest._id },
    });

    // Create notifications for relevant helpers (simple matching logic)
    try {
      const helperFilter = {
        _id: { $ne: req.user._id },
        notificationsEnabled: true,
        role: { $in: ["can_help", "both"] },
      };

      const or = [];
      if (Array.isArray(requiredSkills) && requiredSkills.length > 0) {
        or.push({ skills: { $in: requiredSkills } });
      }
      const interestCats = [finalCategory, autoCategory].filter(Boolean);
      if (interestCats.length > 0) {
        or.push({ interests: { $in: interestCats } });
      }
      if (or.length > 0) helperFilter.$or = or;

      const helpers = await User.find(helperFilter).select("_id").limit(50);
      if (helpers.length > 0) {
        await Notification.insertMany(
          helpers.map((h) => ({
            userId: h._id,
            type: "request_created",
            title: "New Help Request",
            message: `${req.user.name} posted: \"${newRequest.title}\"`,
            relatedUserId: req.user._id,
            relatedRequestId: newRequest._id,
          }))
        );
      }
    } catch (notifyErr) {
      console.error("Request helper notification error:", notifyErr);
    }

    res.status(201).json({
      success: true,
      message: "Request created successfully",
      statusCode: 201,
      data: newRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create request",
      statusCode: 500,
      error: error.message,
    });
  }
};

// GET ALL REQUESTS WITH FILTERS
export const getAllRequests = async (req, res) => {
  try {
    const { category, urgency, status, page = 1, limit = 10, sort = "-createdAt" } = req.query;

    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (urgency) filter.urgency = urgency;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await Request.find(filter)
      .populate("createdBy", "name avatar trustScore")
      .populate("acceptedHelper", "name avatar")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Request.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Requests retrieved",
      statusCode: 200,
      data: {
        requests,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve requests",
      statusCode: 500,
    });
  }
};

// GET REQUEST BY ID
export const getRequestById = async (req, res) => {
  try {
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("createdBy", "name avatar bio trustScore skills")
      .populate("acceptedHelper", "name avatar")
      .populate("helpOffers")
      .populate("comments.user", "name avatar");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
        statusCode: 404,
      });
    }

    res.status(200).json({
      success: true,
      message: "Request retrieved",
      statusCode: 200,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve request",
      statusCode: 500,
    });
  }
};

// UPDATE REQUEST
export const updateRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
        statusCode: 404,
      });
    }

    // Check ownership
    if (request.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this request",
        statusCode: 403,
      });
    }

    const { title, description, category, tags, urgency, status } = req.body;

    if (title) request.title = title;
    if (description) request.description = description;
    if (category) request.category = category;
    if (tags) request.tags = tags;
    if (urgency) request.urgency = urgency;
    if (status) request.status = status;

    await request.save();

    res.status(200).json({
      success: true,
      message: "Request updated successfully",
      statusCode: 200,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update request",
      statusCode: 500,
    });
  }
};

// DELETE REQUEST
export const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
        statusCode: 404,
      });
    }

    // Check ownership
    if (request.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this request",
        statusCode: 403,
      });
    }

    await Request.findByIdAndDelete(req.params.id);

    // Update user's request count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { requestCount: -1 },
      $pull: { createdRequests: req.params.id },
    });

    res.status(200).json({
      success: true,
      message: "Request deleted successfully",
      statusCode: 200,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete request",
      statusCode: 500,
    });
  }
};

// GET MY REQUESTS
export const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ createdBy: req.user._id })
      .populate("acceptedHelper", "name avatar")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      message: "Your requests retrieved",
      statusCode: 200,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve requests",
      statusCode: 500,
    });
  }
};

// GET REQUESTS I HELPED WITH
export const getHelpedRequests = async (req, res) => {
  try {
    const requests = await Request.find({ acceptedHelper: req.user._id })
      .populate("createdBy", "name avatar")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      message: "Requests you helped with",
      statusCode: 200,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve requests",
      statusCode: 500,
    });
  }
};

// MARK REQUEST AS SOLVED
export const markRequestSolved = async (req, res) => {
  try {
    const { helperId } = req.body;

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
        statusCode: 404,
      });
    }

    // Check if user is the request creator or admin
    if (request.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only request creator can mark as solved",
        statusCode: 403,
      });
    }

    request.status = "solved";
    request.solvedBy = helperId;
    await request.save();

    // Update helper's helpCount
    await User.findByIdAndUpdate(helperId, {
      $inc: { helpCount: 1 },
      $push: { helpedRequests: req.params.id },
    });

    // Create notification
    await Notification.create({
      userId: helperId,
      type: "request_solved",
      title: "Request Solved",
      message: `Your help was marked as solved for "${request.title}"`,
      relatedRequestId: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: "Request marked as solved",
      statusCode: 200,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark request as solved",
      statusCode: 500,
    });
  }
};
// ADD COMMENT
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
        statusCode: 404,
      });
    }

    const newComment = {
      user: req.user._id,
      userName: req.user.name,
      text,
      createdAt: new Date(),
    };

    request.comments.push(newComment);
    await request.save();

    // Notify request owner if someone else comments
    if (request.createdBy.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: request.createdBy,
        type: "comment_on_request",
        title: "New Comment",
        message: `${req.user.name} commented on your request: "${request.title}"`,
        relatedRequestId: request._id,
        relatedUserId: req.user._id,
      });
    }

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      statusCode: 201,
      data: newComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      statusCode: 500,
    });
  }
};

// AI ANALYZE (category/tags/urgency/summary)
export const analyzeRequestAI = async (req, res) => {
  try {
    const { title, description } = req.body;

    const normalizeTags = (arr, max = 10) => {
      const seen = new Set();
      return (Array.isArray(arr) ? arr : [])
        .map((t) => String(t || "").trim())
        .filter((t) => t.length > 0)
        .filter((t) => {
          const key = t.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, max);
    };

    const [autoCategory, suggestedTagsRaw, aiSummary, urgency] = await Promise.all([
      aiCategorize(title, description),
      aiSuggestTags(title, description),
      generateSummary(description),
      detectUrgency(title, description),
    ]);

    const suggestedTags = normalizeTags(suggestedTagsRaw, 5);

    res.status(200).json({
      success: true,
      message: "AI analysis completed",
      statusCode: 200,
      data: {
        autoCategory,
        suggestedTags,
        aiSummary,
        urgency,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to analyze request",
      statusCode: 500,
      error: error.message,
    });
  }
};
