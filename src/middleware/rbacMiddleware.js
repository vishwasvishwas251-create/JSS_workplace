const Workspace = require("../models/Workspace");
const Membership = require("../models/Membership");
const asyncHandler = require("../utils/asyncHandler");

const requireWorkspaceMember = asyncHandler(async (req, res, next) => {
  const workspaceId =
    req.params.workspaceId || req.params.id || req.body.workspaceId;

  if (!workspaceId) {
    return res.status(400).json({ message: "Workspace ID is required" });
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return res.status(404).json({ message: "Workspace not found" });
  }

  const membership = await Membership.findOne({
    user: req.user._id,
    workspace: workspace._id,
    status: "active",
  });

  if (!membership) {
    return res
      .status(403)
      .json({ message: "You are not a member of this workspace" });
  }

  req.workspace = workspace;
  req.membership = membership;
  next();
});

// ✅ Role keys match the Membership model enum
const ROLE_PERMISSIONS = {
  super_admin: ["*"], // wildcard = all permissions
  hod: [
    "workspace:update",
    "member:add",
    "member:remove",
    "member:update_role",
    "board:create",
    "board:update",
    "board:delete",
    "column:create",
    "column:update",
    "column:delete",
    "task:create",
    "task:update",
    "task:delete",
  ],
  faculty: [
    "member:add",
    "board:create",
    "board:update",
    "column:create",
    "column:update",
    "task:create",
    "task:update",
    "task:delete",
  ],
  club_president: [
    "board:create",
    "board:update",
    "column:create",
    "column:update",
    "task:create",
    "task:update",
    "task:delete",
  ],
  placement_officer: [
    "board:create",
    "board:update",
    "column:create",
    "column:update",
    "task:create",
    "task:update",
    "task:delete",
  ],
  lab_incharge: [
    "board:create",
    "board:update",
    "column:create",
    "column:update",
    "task:create",
    "task:update",
    "task:delete",
  ],
  student_lead: [
    "board:create",
    "column:create",
    "column:update",
    "task:create",
    "task:update",
    "task:delete",
  ],
  student: ["task:create", "task:update"],
  viewer: [],
};

const requirePermission = (permission) =>
  asyncHandler(async (req, res, next) => {
    if (!req.membership) {
      return res.status(500).json({
        message: "requireWorkspaceMember must run before requirePermission",
      });
    }

    const allowed = ROLE_PERMISSIONS[req.membership.role] || [];
    const hasWildcard = allowed.includes("*");

    if (!hasWildcard && !allowed.includes(permission)) {
      return res.status(403).json({
        message: `Access denied. Role "${req.membership.role}" lacks "${permission}"`,
      });
    }
    next();
  });

const requireRole = (...allowedRoles) =>
  asyncHandler(async (req, res, next) => {
    if (!req.membership) {
      return res.status(500).json({
        message: "requireWorkspaceMember must run before requireRole",
      });
    }

    if (!allowedRoles.includes(req.membership.role)) {
      return res.status(403).json({
        message: `Access denied. Requires: ${allowedRoles.join(", ")}`,
      });
    }
    next();
  });

module.exports = {
  requireWorkspaceMember,
  requirePermission,
  requireRole,
  loadWorkspace: requireWorkspaceMember,
};