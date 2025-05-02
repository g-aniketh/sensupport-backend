const express = require("express");
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelEventRegistration,
  getOrganizedEvents,
  getRegisteredEvents,
} = require("../controllers/eventController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.route("/").get(getEvents).post(createEvent);
router.get("/organized", getOrganizedEvents);
router.get("/registered", getRegisteredEvents);
router.route("/:id").get(getEvent).put(updateEvent).delete(deleteEvent);
router
  .route("/:id/register")
  .post(registerForEvent)
  .delete(cancelEventRegistration);

module.exports = router;
