const User = require("../models/User");
const SeniorProfile = require("../models/SeniorProfile");
const VolunteerProfile = require("../models/VolunteerProfile");
const HealthcareProfile = require("../models/HealthcareProfile");
const CommunityProfile = require("../models/CommunityProfile");

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const cookieExpireDays = Number(process.env.JWT_COOKIE_EXPIRE) || 7;
  const options = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, location } = req.body;

    // Validate role
    const validRoles = ["senior", "volunteer", "healthcare", "community"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role specified",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      location,
    });

    // Create profile based on role
    if (role === "senior") {
      await SeniorProfile.create({
        user: user._id,
        dateOfBirth: req.body.dateOfBirth || new Date("1950-01-01"),
        interests: req.body.interests || [],
        assistanceNeeded: req.body.assistanceNeeded || {},
        preferredLanguages: req.body.preferredLanguages || ["English"],
      });
    } else if (role === "volunteer") {
      await VolunteerProfile.create({
        user: user._id,
        skills: req.body.skills || [],
        interests: req.body.interests || [],
        languages: req.body.languages || ["English"],
        availability: req.body.availability || {},
        servicesOffered: req.body.servicesOffered || {},
      });
    } else if (role === "healthcare") {
      await HealthcareProfile.create({
        user: user._id,
        specialty: req.body.specialty || "General",
        credentials: req.body.credentials || [],
        licenseNumber: req.body.licenseNumber || "TBD",
        services: req.body.services || [],
        languages: req.body.languages || ["English"],
      });
    } else if (role === "community") {
      await CommunityProfile.create({
        user: user._id,
        organizationType: req.body.organizationType || "Non-profit",
        services: req.body.services || [],
        contactPerson: req.body.contactPerson || {},
      });
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide an email and password",
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};
