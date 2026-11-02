const mongoose = require("mongoose");

const columnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    wipLimit: {
      type: Number,
      default: 0, // 0 = no limit
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Column", columnSchema);