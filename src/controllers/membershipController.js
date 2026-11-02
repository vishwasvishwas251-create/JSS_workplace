const Membership = require("../models/Membership");
const User = require("../models/User");
const Workspace = require("../models/Workspace");
const { emitToWorkspace, emitToUser } = require("../sockets/socketServer");

// @desc    Add member to workspace by email
// @route   POST /api/workspaces/:workspaceId/members
exports.addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    const existing = await Membership.findOne({
      user: user._id,
      workspace: req.workspace._id,
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "User is already a member of this workspace" });
    }

    const membership = await Membership.create({
      user: user._id,
      workspace: req.workspace._id,
      role: role || "member",
      status: "active",
      invitedBy: req.user._id,
    });

    await membership.populate("user", "name email");

    emitToWorkspace(req.workspace._id, "member:added", {
      membership,
      actor: { _id: req.user._id, name: req.user.name },
    });

    emitToUser(user._id, "notification", {
      type: "invite",
      message: `You were added to "${req.workspace.name}" as ${membership.role}`,
      workspaceId: req.workspace._id,
    });

    res.status(201).json({
      message: "Member added successfully",
      membership,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get workspace members
// @route   GET /api/workspaces/:workspaceId/members
exports.getMembers = async (req, res, next) => {
  try {
    const members = await Membership.find({
      workspace: req.workspace._id,
      status: "active",
    })
      .populate("user", "name email")
      .populate("invitedBy", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({ count: members.length, members });
  } catch (err) {
    next(err);
  }
};

// @desc    Update member role
// @route   PATCH /api/workspaces/:workspaceId/members/:membershipId
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["admin", "member", "viewer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const membership = await Membership.findOne({
      _id: req.params.membershipId,
      workspace: req.workspace._id,
    }).populate("user", "name email");

    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    if (membership.user._id.toString() === req.workspace.owner.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot change the workspace owner's role" });
    }

    membership.role = role;
    await membership.save();

    emitToWorkspace(req.workspace._id, "member:role_updated", {
      membership,
      actor: { _id: req.user._id, name: req.user.name },
    });

    emitToUser(membership.user._id, "notification", {
      type: "role_changed",
      message: `Your role in "${req.workspace.name}" is now ${role}`,
      workspaceId: req.workspace._id,
    });

    res.status(200).json({
      message: "Member role updated",
      membership,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove member from workspace (admin action)
// @route   DELETE /api/workspaces/:workspaceId/members/:membershipId
exports.removeMember = async (req, res, next) => {
  try {
    const membership = await Membership.findOne({
      _id: req.params.membershipId,
      workspace: req.workspace._id,
    });

    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    if (membership.user.toString() === req.workspace.owner.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot remove the workspace owner" });
    }

    await membership.deleteOne();

    emitToWorkspace(req.workspace._id, "member:removed", {
      membershipId: membership._id,
      userId: membership.user,
      actor: { _id: req.user._id, name: req.user.name },
    });

    res.status(200).json({ message: "Member removed successfully" });
  } catch (err) {
    next(err);
  }
};

// @desc    Leave a workspace (self-removal)
// @route   DELETE /api/workspaces/:workspaceId/members/leave
exports.leaveWorkspace = async (req, res, next) => {
  try {
    const membership = await Membership.findOne({
      user: req.user._id,
      workspace: req.workspace._id,
    });

    if (!membership) {
      return res
        .status(404)
        .json({ message: "You are not a member of this workspace" });
    }

    if (req.workspace.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message:
          "Owner cannot leave. Transfer ownership or delete the workspace.",
      });
    }

    const membershipId = membership._id;
    await membership.deleteOne();

    emitToWorkspace(req.workspace._id, "member:removed", {
      membershipId,
      userId: req.user._id,
      actor: { _id: req.user._id, name: req.user.name },
    });

    res.status(200).json({ message: "Left workspace successfully" });
  } catch (err) {
    next(err);
  }
};

// ❌ NO module.exports at the bottom — we used exports.X above