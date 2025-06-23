const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  createNotification,
} = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, getNotifications);
router.post("/", createNotification); // Can be protected if needed
router.patch("/:id/read", verifyToken, markAsRead);
router.get("/dev/all-notifications", async (req, res) => {
  const all = await Notification.find();
  res.json(all);
});

module.exports = router;
