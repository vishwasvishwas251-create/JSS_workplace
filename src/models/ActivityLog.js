const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g., "task.created", "task.moved", "member.invited"
    },
    entityType: {
      type: String,
      enum: ["task", "board", "column", "workspace", "membership", "comment"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    metadata: {
      type: Object, // flexible extra data (old value, new value, etc.)
      default: {},
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ workspace: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);