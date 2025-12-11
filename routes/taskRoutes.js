const express = require('express');
const router = express.Router();
const { createTask, updateTaskStatus } = require('../controllers/taskController');
const protect = require('../middleware/auth');

// Route POST /api/tasks
router.post('/', protect, createTask);
// Route PATCH /api/tasks/:taskId/status
router.patch('/:id/status', protect, updateTaskStatus);

module.exports = router;