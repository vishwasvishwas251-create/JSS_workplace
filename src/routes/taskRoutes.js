const express = require("express");
const router = express.Router({ mergeParams: true });

const taskCtrl = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const {
  requireWorkspaceMember,
  requireRole,
} = require("../middleware/rbacMiddleware");

router.use(protect);
router.use(requireWorkspaceMember);

["createTask", "getTasks", "getTask", "updateTask", "moveTask", "deleteTask", "toggleSubtask"].forEach((fn) => {
  if (typeof taskCtrl[fn] !== "function") {
    console.error(`❌ taskController.${fn} is ${typeof taskCtrl[fn]}`);
    console.error(`   Available: ${Object.keys(taskCtrl).join(", ")}`);
    process.exit(1);
  }
});

router
  .route("/")
  .post(requireRole("admin", "member"), taskCtrl.createTask)
  .get(taskCtrl.getTasks);

router.patch("/:taskId/move", requireRole("admin", "member"), taskCtrl.moveTask);
router.patch("/:taskId/subtasks/:subtaskId", requireRole("admin", "member"), taskCtrl.toggleSubtask);

router
  .route("/:taskId")
  .get(taskCtrl.getTask)
  .put(requireRole("admin", "member"), taskCtrl.updateTask)
  .delete(requireRole("admin", "member"), taskCtrl.deleteTask);

module.exports = router;