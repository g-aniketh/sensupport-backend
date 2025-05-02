const express = require("express");
const {
  submitFeedback,
  getAllFeedback,
  getFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats,
} = require("../controllers/feedbackController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.route("/").get(getAllFeedback).post(submitFeedback);
router.get("/stats", getFeedbackStats);
router
  .route("/:id")
  .get(getFeedback)
  .put(updateFeedback)
  .delete(deleteFeedback);

module.exports = router;
