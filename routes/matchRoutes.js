const express = require("express");
const {
  getRecommendations,
  requestMatch,
  updateMatchStatus,
  getMyMatches,
  getMatch,
  addFeedback,
} = require("../controllers/matchController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/recommendations", getRecommendations);
router.post("/request", requestMatch);
router.get("/", getMyMatches);
router.route("/:id").get(getMatch).put(updateMatchStatus);
router.post("/:id/feedback", addFeedback);

module.exports = router;
