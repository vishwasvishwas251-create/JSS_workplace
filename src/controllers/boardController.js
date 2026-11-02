const Board = require("../models/Board");
const Column = require("../models/Column");
const Task = require("../models/Task");
const { emitToWorkspace } = require("../sockets/socketServer");

const DEFAULT_COLUMNS = [
  { name: "To Do", order: 0 },
  { name: "In Progress", order: 1 },
  { name: "Done", order: 2 },
];

// @desc    Create board (with default columns)
// @route   POST /api/workspaces/:workspaceId/boards
exports.createBoard = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Board name is required" });

    const board = await Board.create({
      name,
      description: description || "",
      workspace: req.workspace._id,
      createdBy: req.user._id,
    });

    const columns = await Column.insertMany(
      DEFAULT_COLUMNS.map((c) => ({
        ...c,
        board: board._id,
        workspace: req.workspace._id,
      }))
    );

    emitToWorkspace(req.workspace._id, "board:created", {
      board,
      columns,
      actor: { _id: req.user._id, name: req.user.name },
    });

    res.status(201).json({ message: "Board created successfully", board, columns });
  } catch (err) {
    next(err);
  }
};

// @desc    Get boards in workspace
// @route   GET /api/workspaces/:workspaceId/boards
exports.getBoards = async (req, res, next) => {
  try {
    const boards = await Board.find({ workspace: req.workspace._id, isArchived: false })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: boards.length, boards });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single board with columns + tasks
// @route   GET /api/workspaces/:workspaceId/boards/:boardId
exports.getBoard = async (req, res, next) => {
  try {
    const board = await Board.findOne({ _id: req.params.boardId, workspace: req.workspace._id })
      .populate("createdBy", "name email");
    if (!board) return res.status(404).json({ message: "Board not found" });

    const columns = await Column.find({ board: board._id }).sort({ order: 1 });
    const tasks = await Task.find({ board: board._id })
      .populate("assignees", "name email")
      .populate("createdBy", "name email")
      .sort({ order: 1 });

    res.status(200).json({ board, columns, tasks });
  } catch (err) {
    next(err);
  }
};

// @desc    Update board
// @route   PUT /api/workspaces/:workspaceId/boards/:boardId
exports.updateBoard = async (req, res, next) => {
  try {
    const board = await Board.findOne({ _id: req.params.boardId, workspace: req.workspace._id });
    if (!board) return res.status(404).json({ message: "Board not found" });

    if (req.body.name !== undefined) board.name = req.body.name;
    if (req.body.description !== undefined) board.description = req.body.description;

    await board.save();

    emitToWorkspace(req.workspace._id, "board:updated", {
      board,
      actor: { _id: req.user._id, name: req.user.name },
    });

    res.status(200).json({ message: "Board updated successfully", board });
  } catch (err) {
    next(err);
  }
};

// @desc    Archive board
// @route   DELETE /api/workspaces/:workspaceId/boards/:boardId
exports.deleteBoard = async (req, res, next) => {
  try {
    const board = await Board.findOne({ _id: req.params.boardId, workspace: req.workspace._id });
    if (!board) return res.status(404).json({ message: "Board not found" });

    board.isArchived = true;
    await board.save();

    emitToWorkspace(req.workspace._id, "board:archived", {
      boardId: board._id,
      actor: { _id: req.user._id, name: req.user.name },
    });

    res.status(200).json({ message: "Board archived successfully" });
  } catch (err) {
    next(err);
  }
};