const Column = require("../models/Column");
const Board = require("../models/Board");
const Task = require("../models/Task");
const { emitToWorkspace } = require("../sockets/socketServer");

// @desc    Create column
// @route   POST /api/workspaces/:workspaceId/columns
exports.createColumn = async (req, res, next) => {
  try {
    const { name, boardId } = req.body;
    if (!name || !boardId) return res.status(400).json({ message: "name and boardId are required" });

    const board = await Board.findOne({ _id: boardId, workspace: req.workspace._id });
    if (!board) return res.status(404).json({ message: "Board not found in this workspace" });

    const lastCol = await Column.findOne({ board: boardId }).sort({ order: -1 });
    const order = lastCol ? lastCol.order + 1 : 0;

    const column = await Column.create({
      name,
      board: boardId,
      workspace: req.workspace._id,
      order,
    });

    emitToWorkspace(req.workspace._id, "column:created", {
      column,
      actor: { _id: req.user._id, name: req.user.name },
    });

    res.status(201).json({ message: "Column created successfully", column });
  } catch (err) {
    next(err);
  }
};

// @desc    Update column
// @route   PUT /api/workspaces/:workspaceId/columns/:columnId
exports.updateColumn = async (req, res, next) => {
  try {
    const column = await Column.findOne({ _id: req.params.columnId, workspace: req.workspace._id });
    if (!column) return res.status(404).json({ message: "Column not found" });

    if (req.body.name !== undefined) column.name = req.body.name;
    await column.save();

    emitToWorkspace(req.workspace._id, "column:updated", {
      column,
      actor: { _id: req.user._id, name: req.user.name },
    });

    res.status(200).json({ message: "Column updated successfully", column });
  } catch (err) {
    next(err);
  }
};

// @desc    Reorder columns
// @route   PATCH /api/workspaces/:workspaceId/columns/reorder
exports.reorderColumns = async (req, res, next) => {
  try {
    const { boardId, orderedColumnIds } = req.body;
    if (!boardId || !Array.isArray(orderedColumnIds)) {
      return res.status(400).json({ message: "boardId and orderedColumnIds[] are required" });
    }

    await Promise.all(
      orderedColumnIds.map((id, index) =>
        Column.updateOne({ _id: id, board: boardId, workspace: req.workspace._id }, { order: index })
      )
    );

    const columns = await Column.find({ board: boardId }).sort({ order: 1 });

    emitToWorkspace(req.workspace._id, "columns:reordered", {
      columns,
      actor: { _id: req.user._id, name: req.user.name },
    });

    res.status(200).json({ message: "Columns reordered", columns });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete column (and its tasks)
// @route   DELETE /api/workspaces/:workspaceId/columns/:columnId
exports.deleteColumn = async (req, res, next) => {
  try {
    const column = await Column.findOne({ _id: req.params.columnId, workspace: req.workspace._id });
    if (!column) return res.status(404).json({ message: "Column not found" });

    await Task.deleteMany({ column: column._id });
    await column.deleteOne();

    emitToWorkspace(req.workspace._id, "column:deleted", {
      columnId: column._id,
      actor: { _id: req.user._id, name: req.user.name },
    });

    res.status(200).json({ message: "Column and its tasks deleted successfully" });
  } catch (err) {
    next(err);
  }
};