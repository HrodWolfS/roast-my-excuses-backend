const express = require("express");
const router = express.Router();
const {
  createTask,
  updateTaskStatus,
  getActiveTask,
  getMyTasks,
  toggleVisibility,
} = require("../controllers/taskController");
const protect = require("../middleware/auth");

// Route GET /api/tasks/active
router.get("/active", protect, getActiveTask);

// Route POST /api/tasks
router.post("/", protect, createTask);
// Route PATCH /api/tasks/:taskId/status
router.patch("/:id/status", protect, updateTaskStatus);
// Route GET /api/tasks/ (My Tasks)
router.get("/", protect, getMyTasks);

// Route PATCH /api/tasks/:id/visibility
router.patch("/:id/visibility", protect, toggleVisibility);

module.exports = router;
