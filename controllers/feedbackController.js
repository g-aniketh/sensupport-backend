const Feedback = require("../models/Feedback");

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private
exports.submitFeedback = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    const feedback = await Feedback.create(req.body);

    res.status(201).json({
      success: true,
      data: feedback,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all feedback (admin only)
// @route   GET /api/feedback
// @access  Private/Admin
exports.getAllFeedback = async (req, res, next) => {
  try {
    // Only allow admins to get all feedback, regular users can only see their own
    let query = {};

    if (req.user.role !== "admin") {
      query.user = req.user.id;
    }

    const feedback = await Feedback.find(query)
      .populate("user", "name avatar role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Private
exports.getFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate(
      "user",
      "name avatar role"
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: "Feedback not found",
      });
    }

    // Only allow admin or feedback owner to access
    if (
      feedback.user._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to access this feedback",
      });
    }

    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update feedback status and response (admin only)
// @route   PUT /api/feedback/:id
// @access  Private/Admin
exports.updateFeedback = async (req, res, next) => {
  try {
    let feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: "Feedback not found",
      });
    }

    // Only allow admin to update feedback status and response
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this feedback",
      });
    }

    feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private
exports.deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: "Feedback not found",
      });
    }

    // Only allow admin or feedback owner to delete
    if (feedback.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this feedback",
      });
    }

    await feedback.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get feedback categories and counts (for dashboard)
// @route   GET /api/feedback/stats
// @access  Private/Admin
exports.getFeedbackStats = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to access feedback statistics",
      });
    }

    const categoryCounts = await Feedback.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const statusCounts = await Feedback.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalCount = await Feedback.countDocuments();
    const avgRating = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          average: { $avg: "$rating" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCount,
        avgRating: avgRating.length > 0 ? avgRating[0].average : 0,
        categoryCounts,
        statusCounts,
      },
    });
  } catch (err) {
    next(err);
  }
};
