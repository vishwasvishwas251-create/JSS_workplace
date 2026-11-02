const Task = require("../models/Task");
const Column = require("../models/Column");
const Board = require("../models/Board");
const Membership = require("../models/Membership");
const { emitToWorkspace, emitToUser } = require("../sockets/socketServer");

// @desc    Create task
// @route   POST /api/workspaces/:workspaceId/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, boardId, columnId, assignees, priority, dueDate, labels, subtasks } = req.body;

    if (!title || !boardId || !columnId) {
      return res.status(400).json({ message: "title, boardId, columnId are required" });
    }

    const board = await Board.findOne({ _id: boardId, workspace: req.workspace._id });
    if (!board) return res.status(404).json({ message: "Board not found in this workspace" });

    const column = await Column.findOne({ _id: columnId, board: boardId });
    if (!column) return res.status(404).json({ message: "Column not found in this board" });

    // Validate assignees are workspace members
    let validAssignees = [];
    if (Array.isArray(assignees) && assignees.length > 0) {
      const memberships = await Membership.find({
        workspace: req.workspace._id,
        user: { $in: assignees },
        status: "active",
      }).select("user");
      validAssignees = memberships.map((m) => m.user);

      if (validAssignees.length !== assignees.length) {
        return res.status(400).json({ message: "Some assignees are not workspace members" });
      }
    }

    const lastTask = await Task.findOne({ column: columnId }).sort({ order: -1 });
    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await Task.create({
      title,
      description: description || "",
      board: boardId,
      column: columnId,
      workspace: req.workspace._id,
      assignees: validAssignees,
      priority: priority || "medium",
      dueDate: dueDate || null,
      labels: labels || [],
      subtasks: subtasks || [],
      order,
      createdBy: req.user._id,
    });

    await task.populate([
      { path: "assignees", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]);

    // 🔌 Broadcast
    emitToWorkspace(req.workspace._id, "task:created", {
      task,
      columnId: column._id,
      actor: { _id: req.user._id, name: req.user.name },
    });

    // Personal notifications
    validAssignees.forEach((userId) => {
      if (userId.toString() !== req.user._id.toString()) {
        emitToUser(userId, "notification", {
          type: "task_assigned",
          message: `You were assigned to "${task.title}"`,
          taskId: task._id,
          workspaceId: req.workspace._id,
        });
      }
    });

    res.status(201).json({ message: "Task created successfully", task });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all tasks in a board
// @route   GET /api/workspaces/:workspaceId/tasks?boardId=...
exports.getTasks = async (req, res, next) => {
  try {
    const { boardId } = req.query;
    if (!boardId) return res.status(400).json({ message: "boardId query param is required" });

    const tasks = await Task.find({ board: boardId, workspace: req.workspace._id })
      .populate("assignees", "name email")
      .populate("createdBy", "name email")
      .sort({ order: 1 });

    res.status(200).json({ count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single task
// @route   GET /api/workspaces/:workspaceId/tasks/:taskId
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id })
      .populate("assignees", "name email")
      .populate("createdBy", "name email");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json({ task });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task
// @route   PUT /api/workspaces/:workspaceId/tasks/:taskId
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const allowed = ["title", "description", "priority", "dueDate", "labels", "subtasks", "assignees"];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) task[key] = req.body[key];
    });

    await task.save();
    await task.populate([
      { path: "assignees", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]);

    emitToWorkspace(req.workspace._id, "task:updated", {
      task,
      actor: { _id: req.user._id, name: req.user.name },
    });

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (err) {
    next(err);
  }
};

// @desc    Move task between columns
// @route   PATCH /api/workspaces/:workspaceId/tasks/:taskId/move
exports.moveTask = async (req, res, next) => {
  try {
    const { toColumnId, newOrder } = req.body;
    if (!toColumnId) return res.status(400).json({ message: "toColumnId is required" });

    const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const targetColumn = await Column.findOne({ _id: toColumnId, workspace: req.workspace._id });
    if (!targetColumn) return res.status(404).json({ message: "Target column not found" });

    const oldColumnId = task.column.toString();
    task.column = targetColumn._id;
    task.order = newOrder !== undefined ? newOrder : 0;
    await task.save();

    await task.populate([
      { path: "assignees", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]);

    emitToWorkspace(req.workspace._id, "task:moved", {
      taskId: task._id,
      fromColumnId: oldColumnId,
      toColumnId: targetColumn._id.toString(),
      newOrder: task.order,
      task,
      actor: { _id: req.user._id, name: req.user.name },
    });

    res.status(200).json({ message: "Task moved successfully", task });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete task
// @route   DELETE /api/workspaces/:workspaceId/tasks/:taskId
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    await task.deleteOne();

    emitToWorkspace(req.workspace._id, "task:deleted", {
      taskId: task._id,
      actor: { _id: req.user._id, name: req.user.name },
    });

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle subtask completion
// @route   PATCH /api/workspaces/:workspaceId/tasks/:taskId/subtasks/:subtaskId
exports.toggleSubtask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, workspace: req.workspace._id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ message: "Subtask not found" });

    subtask.completed = !subtask.completed;
    await task.save();

    emitToWorkspace(req.workspace._id, "task:updated", {
      task,
      actor: { _id: req.user._id, name: req.user.name },
    });

    res.status(200).json({ message: "Subtask toggled", task });
  } catch (err) {
    next(err);
  }
};