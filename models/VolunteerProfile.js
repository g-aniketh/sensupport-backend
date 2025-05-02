const mongoose = require("mongoose");

const VolunteerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skills: [String],
    availability: {
      monday: [String],
      tuesday: [String],
      wednesday: [String],
      thursday: [String],
      friday: [String],
      saturday: [String],
      sunday: [String],
    },
    interests: [String],
    languages: [String],
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    backgroundCheck: {
      completed: {
        type: Boolean,
        default: false,
      },
      date: Date,
    },
    experience: String,
    servicesOffered: {
      mobility: Boolean,
      meals: Boolean,
      companionship: Boolean,
      healthcare: Boolean,
      transportation: Boolean,
      housekeeping: Boolean,
    },
    bio: String,
    transportationMethod: String,
    maxDistance: Number,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("VolunteerProfile", VolunteerProfileSchema);
