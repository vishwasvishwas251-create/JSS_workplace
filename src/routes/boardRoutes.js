const express = require("express");
const router = express.Router();
const Board = require("../models/Board");
const { protect } = require("../middleware/authMiddleware");

// 1. GET all boards for a workspace (Used by WorkspaceScreen)
router.get("/workspaces/:workspaceId/boards", protect, async (req, res) => {
  try {
    const boards = await Board.find({ workspace: req.params.workspaceId });
    res.status(200).json({ success: true, data: { boards: boards || [] } });
  } catch (err) {
    res.status(200).json({ success: true, data: { boards: [] } });
  }
});

// 2. POST create a new board (Used by WorkspaceScreen)
router.post("/workspaces/:workspaceId/boards", protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const generatedSlug = (name || "board").toLowerCase().replace(/[^a-z0-9]+/g, '-') + "-" + Date.now().toString().slice(-4);

    const board = await Board.create({
      name: name || "New Board",
      description: description || "Created from mobile",
      workspace: req.params.workspaceId,
      slug: generatedSlug,
      columns: [
        { name: "To Do", tasks: [] },
        { name: "In Progress", tasks: [] },
        { name: "Done", tasks: [] }
      ],
      createdBy: req.user.id,
      owner: req.user.id
    });

    res.status(201).json({ success: true, data: { board } });
    
  } catch (err) {
    console.error("!!! CREATE BOARD ERROR !!!:", err.message); 
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. GET a single board by ID (Used by BoardScreen)
router.get("/workspaces/:workspaceId/boards/:boardId", protect, async (req, res) => {
  try {
    // Fetch the board and populate the user details for the task assignees
    const board = await Board.findById(req.params.boardId)
      .populate("columns.tasks.assignees", "name email");

    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    res.status(200).json({ success: true, data: { board } });
  } catch (err) {
    console.error("!!! FETCH SINGLE BOARD ERROR !!!:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. POST create a new task inside a board's column (Used by BoardScreen)
router.post("/workspaces/:workspaceId/boards/:boardId/tasks", protect, async (req, res) => {
  try {
    const { title, columnId, priority } = req.body;
    
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json({ success: false, message: "Board not found" });

    // Find the specific column by its ID
    const column = board.columns.id(columnId);
    if (!column) return res.status(404).json({ success: false, message: "Column not found" });

    // Create the task object
    const newTask = {
      title,
      priority: priority || "medium",
      assignees: [req.user.id],
      createdAt: new Date()
    };

    // Push to column tasks and save to database
    column.tasks.push(newTask);
    await board.save();

    // Fetch the updated board to return the populated data
    const updatedBoard = await Board.findById(req.params.boardId)
      .populate("columns.tasks.assignees", "name email");

    res.status(201).json({ success: true, data: { board: updatedBoard } });
  } catch (err) {
    console.error("!!! CREATE TASK ERROR !!!:", err.message); 
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;