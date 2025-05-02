const User = require("../models/User");
const SeniorProfile = require("../models/SeniorProfile");
const VolunteerProfile = require("../models/VolunteerProfile");
const HealthcareProfile = require("../models/HealthcareProfile");
const CommunityProfile = require("../models/CommunityProfile");

// Get profile model based on user role
const getProfileModel = role => {
  switch (role) {
    case "senior":
      return SeniorProfile;
    case "volunteer":
      return VolunteerProfile;
    case "healthcare":
      return HealthcareProfile;
    case "community":
      return CommunityProfile;
    default:
      return null;
  }
};

// @desc    Get user profile
// @route   GET /api/profiles/:userId
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const ProfileModel = getProfileModel(user.role);
    const profile = await ProfileModel.findOne({ user: userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          location: user.location,
        },
        profile,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/profiles/:userId
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    // Check if user exists
    const userId = req.params.userId || req.user.id;

    // Check if user is updating their own profile or is an admin
    if (req.user.id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this profile",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Update user data
    if (req.body.name) user.name = req.body.name;
    if (req.body.location) user.location = req.body.location;
    if (req.body.avatar) user.avatar = req.body.avatar;

    await user.save();

    // Update profile data
    const ProfileModel = getProfileModel(user.role);
    const profile = await ProfileModel.findOne({ user: userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    // Filter out user and role fields
    const { user: userField, role, ...profileData } = req.body;

    // Update profile with remaining fields
    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { user: userId },
      { $set: profileData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          location: user.location,
        },
        profile: updatedProfile,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all profiles by role
// @route   GET /api/profiles/role/:role
// @access  Private
exports.getProfilesByRole = async (req, res, next) => {
  try {
    const { role } = req.params;

    if (!["senior", "volunteer", "healthcare", "community"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role specified",
      });
    }

    const users = await User.find({ role });
    const userIds = users.map(user => user._id);

    const ProfileModel = getProfileModel(role);
    const profiles = await ProfileModel.find({ user: { $in: userIds } });

    // Combine user and profile data
    const result = users.map(user => {
      const profile = profiles.find(
        p => p.user.toString() === user._id.toString()
      );
      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          location: user.location,
        },
        profile: profile || {},
      };
    });

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
