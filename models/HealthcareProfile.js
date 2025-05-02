const mongoose = require("mongoose");

const HealthcareProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    specialty: {
      type: String,
      required: [true, "Please add specialty"],
    },
    credentials: [String],
    licenseNumber: {
      type: String,
      required: [true, "Please add license number"],
    },
    availability: {
      monday: [String],
      tuesday: [String],
      wednesday: [String],
      thursday: [String],
      friday: [String],
      saturday: [String],
      sunday: [String],
    },
    services: [String],
    acceptedInsurance: [String],
    telemedOffered: {
      type: Boolean,
      default: false,
    },
    languages: [String],
    bio: String,
    yearsOfExperience: Number,
    maxDistance: Number,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("HealthcareProfile", HealthcareProfileSchema);
