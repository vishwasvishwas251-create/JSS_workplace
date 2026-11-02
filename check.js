// backend/check.js
const modules = [
  "./src/sockets/socketServer",
  "./src/sockets/socketAuth",
  "./src/controllers/authController",
  "./src/controllers/workspaceController",
  "./src/controllers/boardController",
  "./src/controllers/columnController",
  "./src/controllers/taskController",
  "./src/controllers/membershipController",
  "./src/routes/authRoutes",
  "./src/routes/workspaceRoutes",
  "./src/routes/boardRoutes",
  "./src/routes/columnRoutes",
  "./src/routes/taskRoutes",
  "./src/models/User",
  "./src/models/Workspace",
  "./src/models/Membership",
  "./src/models/Board",
  "./src/models/Column",
  "./src/models/Task",
  "./src/middleware/authMiddleware",
  "./src/middleware/errorMiddleware",
  "./src/middleware/rbacMiddleware",
  "./src/middleware/roleMiddleware",
];

console.log("\n=== Checking module imports ===\n");
let missing = 0;
modules.forEach((mod) => {
  try {
    require(mod);
    console.log(`✅ ${mod}`);
  } catch (err) {
    console.log(`❌ ${mod}`);
    console.log(`   → ${err.message.split("\n")[0]}`);
    missing++;
  }
});
console.log(`\n=== ${missing} missing/broken module(s) ===\n`);