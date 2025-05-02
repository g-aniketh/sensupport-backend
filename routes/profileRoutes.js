// routes/profileRoutes.js
const express = require("express");
const {
  getProfile,
  updateProfile,
  getProfilesByRole,
} = require("../controllers/profileController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/me", getProfile);
router.get("/:userId", getProfile);
router.put("/:userId", updateProfile);

router.get("/role/:role", getProfilesByRole);

module.exports = router;
