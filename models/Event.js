const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add event title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please add event description"],
    },
    date: {
      type: Date,
      required: [true, "Please add event date"],
    },
    startTime: {
      type: String,
      required: [true, "Please add start time"],
    },
    endTime: {
      type: String,
      required: [true, "Please add end time"],
    },
    location: {
      address: String,
      city: String,
      state: String,
      zip: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      virtual: Boolean,
      meetingLink: String,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: [true, "Please add event category"],
      enum: [
        "health",
        "social",
        "educational",
        "recreational",
        "support",
        "other",
      ],
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["registered", "attended", "cancelled"],
          default: "registered",
        },
      },
    ],
    maxCapacity: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    image: String,
    tags: [String],
    costInfo: {
      isFree: {
        type: Boolean,
        default: true,
      },
      cost: Number,
      currency: {
        type: String,
        default: "USD",
      },
    },
    accessibility: {
      wheelchairAccessible: Boolean,
      hearingAssistance: Boolean,
      visualAssistance: Boolean,
      other: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property to get participant count
EventSchema.virtual("participantCount").get(function () {
  return this.participants.length;
});

// Virtual property to check if event is at capacity
EventSchema.virtual("isAtCapacity").get(function () {
  return this.maxCapacity > 0 && this.participants.length >= this.maxCapacity;
});

module.exports = mongoose.model("Event", EventSchema);
