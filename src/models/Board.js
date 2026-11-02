const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, default: "medium" },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ✅ Added this!
  createdAt: { type: Date, default: Date.now }
});

const columnSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tasks: [taskSchema] // ✅ Now it uses the taskSchema above
});

const boardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  columns: [columnSchema],
  slug: { type: String, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Board", boardSchema);