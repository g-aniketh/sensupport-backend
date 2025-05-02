const mongoose = require("mongoose");

const CommunityProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organizationType: {
      type: String,
      required: [true, "Please add organization type"],
    },
    services: [String],
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    contactPerson: {
      name: String,
      position: String,
      phone: String,
      email: String,
    },
    facilitiesOffered: [String],
    description: String,
    website: String,
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CommunityProfile", CommunityProfileSchema);
