const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema(
  {
    senior: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    providerType: {
      type: String,
      enum: ["volunteer", "healthcare", "community"],
      required: true,
    },
    services: [String],
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    notes: String,
    schedules: [
      {
        day: String,
        startTime: String,
        endTime: String,
      },
    ],
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      createdAt: Date,
    },
    lastInteractionDate: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Match", MatchSchema);
