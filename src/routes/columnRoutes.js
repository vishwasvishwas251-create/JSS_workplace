const express = require("express");
const router = express.Router({ mergeParams: true });

const columnCtrl = require("../controllers/columnController");
const { protect } = require("../middleware/authMiddleware");
const {
  requireWorkspaceMember,
  requireRole,
} = require("../middleware/rbacMiddleware");

router.use(protect);
router.use(requireWorkspaceMember);

["createColumn", "updateColumn", "reorderColumns", "deleteColumn"].forEach((fn) => {
  if (typeof columnCtrl[fn] !== "function") {
    console.error(`❌ columnController.${fn} is ${typeof columnCtrl[fn]}`);
    console.error(`   Available: ${Object.keys(columnCtrl).join(", ")}`);
    process.exit(1);
  }
});

router.post("/", requireRole("admin", "member"), columnCtrl.createColumn);
router.patch("/reorder", requireRole("admin", "member"), columnCtrl.reorderColumns);

router
  .route("/:columnId")
  .put(requireRole("admin", "member"), columnCtrl.updateColumn)
  .delete(requireRole("admin"), columnCtrl.deleteColumn);

module.exports = router;