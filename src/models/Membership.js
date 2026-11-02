const mongoose = require("mongoose");

// All roles supported by the platform (must match config/permissions.js)
const ROLES = [
  "super_admin",
  "hod",
  "faculty",
  "club_president",
  "placement_officer",
  "lab_incharge",
  "student_lead",
  "student",
  "viewer",
];

const membershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace is required"],
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: "{VALUE} is not a valid role",
      },
      default: "student",
    },
    status: {
      type: String,
      enum: ["active", "invited", "suspended"],
      default: "active",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// A user can have only ONE membership per workspace
membershipSchema.index({ user: 1, workspace: 1 }, { unique: true });

// Fast lookup: "get all members of a workspace"
membershipSchema.index({ workspace: 1, status: 1 });

// Fast lookup: "get all workspaces of a user"
membershipSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Membership", membershipSchema);
module.exports.ROLES = ROLES;