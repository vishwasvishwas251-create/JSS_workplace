const Workspace = require("../models/Workspace");
const Membership = require("../models/Membership");

// Loads req.workspace + req.membership
const loadWorkspace = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.params.id;

    if (!workspaceId) {
      return res.status(400).json({ message: "Workspace ID is required" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const membership = await Membership.findOne({
      workspace: workspace._id,
      user: req.user._id,
      status: "active",
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not a member of this workspace",
      });
    }

    req.workspace = workspace;
    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

// Role gate — use AFTER loadWorkspace
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.membership) {
      return res.status(500).json({ message: "Membership not loaded" });
    }
    if (!allowedRoles.includes(req.membership.role)) {
      return res.status(403).json({
        message: `Access denied. Required: ${allowedRoles.join(" or ")}`,
      });
    }
    next();
  };
};

module.exports = { loadWorkspace, requireRole };