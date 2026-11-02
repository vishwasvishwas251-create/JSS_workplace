const express = require("express");
const router = express.Router();

// Temporary empty route just to satisfy the server
router.get("/", (req, res) => {
  res.json({ message: "Notice routes are working!" });
});

module.exports = router;