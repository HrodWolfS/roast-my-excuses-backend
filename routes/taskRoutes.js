const express = require('express');
const router = express.Router();
const { createTask } = require('../controllers/taskController');
const protect = require('../middleware/auth');

// Route POST /api/tasks
router.post('/task', protect, createTask);

module.exports = router;