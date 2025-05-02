const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Please provide feedback content"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    category: {
      type: String,
      enum: [
        "general",
        "matching",
        "events",
        "usability",
        "feature",
        "bug",
        "other",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-review", "resolved", "rejected"],
      default: "pending",
    },
    response: String,
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    screenshot: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
