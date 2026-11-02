const express = require("express");
const router = express.Router();
const Workspace = require("../models/Workspace");
const { protect } = require("../middleware/authMiddleware");

// GET all workspaces for the logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const workspaces = await Workspace.find({ "members.user": req.user.id });
    res.status(200).json({ success: true, data: { workspaces } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create a new workspace
router.post("/", protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // ✅ Generate a unique slug automatically
    const generatedSlug = (name || "workspace").toLowerCase().replace(/[^a-z0-9]+/g, '-') + "-" + Date.now().toString().slice(-4);

    const workspace = await Workspace.create({
      name,
      description: description || "Created from mobile app",
      slug: generatedSlug,
      owner: req.user.id,
      members: [{ user: req.user.id, role: "admin" }]
    });

    res.status(201).json({ success: true, data: { workspace } });
  } catch (err) {
    console.error("Create Workspace Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;