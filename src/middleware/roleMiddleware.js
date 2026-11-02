const Membership = require("../models/Membership");
const Workspace = require("../models/Workspace");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Loads the workspace + the current user's membership.
 * Attaches req.workspace and req.membership.
 * Rejects if workspace doesn't exist or user isn't a member.
 */
const loadWorkspace = asyncHandler(async (req, res, next) => {
  const workspaceId = req.params.workspaceId || req.params.id;

  if (!workspaceId) {
    res.status(400);
    throw new Error("Workspace ID is required");
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace || !workspace.isActive) {
    res.status(404);
    throw new Error("Workspace not found");
  }

  // Owners/Admins bypass? No — everyone must have a membership row.
  const membership = await Membership.findOne({
    user: req.user._id,
    workspace: workspace._id,
  });

  if (!membership) {
    res.status(403);
    throw new Error("You are not a member of this workspace");
  }

  req.workspace = workspace;
  req.membership = membership;
  next();
});

/**
 * Restricts access to specific roles.
 * Must be used AFTER loadWorkspace.
 * Usage: requireRole("admin", "owner")
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.membership) {
      res.status(500);
      throw new Error("requireRole used without loadWorkspace");
    }

    if (!allowedRoles.includes(req.membership.role)) {
      res.status(403);
      throw new Error(
        `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${req.membership.role}`
      );
    }

    next();
  };
};

module.exports = { loadWorkspace, requireRole };