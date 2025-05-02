const express = require("express");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.route("/").get(getNotifications);
router.put("/read-all", markAllAsRead);
router.get("/unread-count", getUnreadCount);
router.route("/:id").put(markAsRead).delete(deleteNotification);

module.exports = router;
