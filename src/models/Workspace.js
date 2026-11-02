const mongoose = require("mongoose");
const crypto = require("crypto");

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Workspace name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    subject: {
      type: String,
      trim: true,
      default: "General",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Invite Code (8-char uppercase) ─────────────
    inviteCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: [
            "super_admin",
            "admin",
            "faculty",
            "student_lead",
            "student",
            "club_head",
            "club_member",
            "lab_assistant",
            "committee_member",
          ],
          default: "student",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    color: {
      type: String,
      default: "#3b82f6",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Auto-generate a unique invite code on creation ──
workspaceSchema.pre("save", function (next) {
  if (!this.inviteCode) {
    // 8-char uppercase alphanumeric code
    this.inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  }
  next();
});

// Indexes for faster lookups
workspaceSchema.index({ "members.user": 1 });
workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ isArchived: 1 });

module.exports = mongoose.model("Workspace", workspaceSchema);