const mongoose = require("mongoose");

const SeniorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Please add date of birth"],
    },
    healthConditions: [String],
    medications: [
      {
        name: String,
        dosage: String,
        frequency: String,
        reminderTime: [String],
      },
    ],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },
    interests: [String],
    assistanceNeeded: {
      mobility: Boolean,
      meals: Boolean,
      companionship: Boolean,
      healthcare: Boolean,
      transportation: Boolean,
      housekeeping: Boolean,
    },
    preferredLanguages: [String],
    preferredTimes: {
      morning: Boolean,
      afternoon: Boolean,
      evening: Boolean,
      weekends: Boolean,
    },
    bio: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SeniorProfile", SeniorProfileSchema);
