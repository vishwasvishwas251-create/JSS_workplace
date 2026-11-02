const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Access denied. Admin only." });
  }
};

// 1. GET all PENDING users
router.get("/pending-users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ status: "pending" }).select("-password");
    res.status(200).json({ success: true, data: { users } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. GET APPROVAL HISTORY (Approved or Rejected users)
router.get("/history", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ status: { $in: ["approved", "rejected"] } })
      .select("-password")
      .sort({ updatedAt: -1 }); // Newest first
    res.status(200).json({ success: true, data: { users } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. PUT approve or reject a user
router.put("/approve/:userId", protect, adminOnly, async (req, res) => {
  try {
    const { action } = req.body; 
    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId, 
      { status: action }, 
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;