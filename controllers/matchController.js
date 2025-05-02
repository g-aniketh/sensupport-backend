const Match = require("../models/Match");
const User = require("../models/User");
const SeniorProfile = require("../models/SeniorProfile");
const VolunteerProfile = require("../models/VolunteerProfile");
const HealthcareProfile = require("../models/HealthcareProfile");
const CommunityProfile = require("../models/CommunityProfile");
const Notification = require("../models/Notification");
const matchAlgorithm = require("../utils/matchAlgorithm");

// @desc    Get match recommendations for a senior
// @route   GET /api/matches/recommendations
// @access  Private (Seniors only)
exports.getRecommendations = async (req, res, next) => {
  try {
    if (req.user.role !== "senior") {
      return res.status(403).json({
        success: false,
        error: "Only seniors can request match recommendations",
      });
    }

    const seniorProfile = await SeniorProfile.findOne({ user: req.user.id });
    if (!seniorProfile) {
      return res.status(404).json({
        success: false,
        error: "Senior profile not found",
      });
    }

    // Get match recommendations using algorithm
    const recommendations = await matchAlgorithm.getRecommendationsForSenior(
      req.user.id,
      seniorProfile
    );

    res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request a match
// @route   POST /api/matches/request
// @access  Private
exports.requestMatch = async (req, res, next) => {
  try {
    const { providerId, services = [], notes = "" } = req.body;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        error: "Provider ID is required",
      });
    }

    // Check if senior
    if (req.user.role !== "senior") {
      return res.status(403).json({
        success: false,
        error: "Only seniors can request matches",
      });
    }

    // Check if provider exists
    const provider = await User.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: "Provider not found",
      });
    }

    // Validate provider type
    if (!["volunteer", "healthcare", "community"].includes(provider.role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid provider type",
      });
    }

    // Check if match already exists
    const existingMatch = await Match.findOne({
      senior: req.user.id,
      provider: providerId,
      status: { $in: ["pending", "accepted"] },
    });

    if (existingMatch) {
      return res.status(400).json({
        success: false,
        error: "Match request already exists with this provider",
      });
    }

    // Create match request
    const match = await Match.create({
      senior: req.user.id,
      provider: providerId,
      providerType: provider.role,
      services,
      notes,
      status: "pending",
      matchScore: req.body.matchScore || null,
    });

    // Create notification for provider
    await Notification.create({
      recipient: providerId,
      sender: req.user.id,
      title: "New Match Request",
      message: `You have received a new match request from ${req.user.name}`,
      type: "match",
      relatedTo: {
        model: "Match",
        id: match._id,
      },
      action: {
        text: "View Request",
        url: `/matches/${match._id}`,
      },
      importance: "medium",
    });

    res.status(201).json({
      success: true,
      data: match,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update match status
// @route   PUT /api/matches/:id
// @access  Private
exports.updateMatchStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (
      !status ||
      !["accepted", "rejected", "completed", "cancelled"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        error: "Valid status is required",
      });
    }

    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        error: "Match not found",
      });
    }

    // Verify user is part of the match
    if (
      match.provider.toString() !== req.user.id &&
      match.senior.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this match",
      });
    }

    // If senior is cancelling or provider is rejecting, validate
    if (
      (status === "cancelled" && match.senior.toString() !== req.user.id) ||
      (status === "rejected" && match.provider.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to perform this action",
      });
    }

    // Update match
    match.status = status;
    if (req.body.schedules) match.schedules = req.body.schedules;
    if (req.body.notes) match.notes = req.body.notes;

    await match.save();

    // Send notification to the other party
    const recipientId =
      match.senior.toString() === req.user.id ? match.provider : match.senior;

    let title, message;
    switch (status) {
      case "accepted":
        title = "Match Accepted";
        message = "Your match request has been accepted!";
        break;
      case "rejected":
        title = "Match Declined";
        message = "Your match request has been declined.";
        break;
      case "completed":
        title = "Match Completed";
        message = "Your match has been marked as completed.";
        break;
      case "cancelled":
        title = "Match Cancelled";
        message = "Your match has been cancelled.";
        break;
    }

    await Notification.create({
      recipient: recipientId,
      sender: req.user.id,
      title,
      message,
      type: "match",
      relatedTo: {
        model: "Match",
        id: match._id,
      },
      action: {
        text: "View Match",
        url: `/matches/${match._id}`,
      },
      importance: "medium",
    });

    res.status(200).json({
      success: true,
      data: match,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all matches for current user
// @route   GET /api/matches
// @access  Private
exports.getMyMatches = async (req, res, next) => {
  try {
    let matches;

    if (req.user.role === "senior") {
      matches = await Match.find({ senior: req.user.id })
        .populate("provider", "name avatar role")
        .populate("senior", "name avatar");
    } else {
      matches = await Match.find({ provider: req.user.id })
        .populate("senior", "name avatar")
        .populate("provider", "name avatar role");
    }

    res.status(200).json({
      success: true,
      count: matches.length,
      data: matches,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get a single match
// @route   GET /api/matches/:id
// @access  Private
exports.getMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("senior", "name avatar")
      .populate("provider", "name avatar role");

    if (!match) {
      return res.status(404).json({
        success: false,
        error: "Match not found",
      });
    }

    // Check if user is part of the match
    if (
      match.senior._id.toString() !== req.user.id &&
      match.provider._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this match",
      });
    }

    res.status(200).json({
      success: true,
      data: match,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add feedback to a match
// @route   POST /api/matches/:id/feedback
// @access  Private
exports.addFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating is required and must be between 1 and 5",
      });
    }

    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        error: "Match not found",
      });
    }

    // Verify user is part of the match
    if (
      match.provider.toString() !== req.user.id &&
      match.senior.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to add feedback to this match",
      });
    }

    // Update match with feedback
    match.feedback = {
      rating,
      comment: comment || "",
      createdAt: Date.now(),
    };

    await match.save();

    res.status(200).json({
      success: true,
      data: match,
    });
  } catch (err) {
    next(err);
  }
};
