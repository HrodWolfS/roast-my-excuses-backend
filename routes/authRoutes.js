const express = require('express');
const router = express.Router();
const { register } = require('../controllers/authController');

// Route POST d'inscription => /api/auth/register
router.post('/register', register);


module.exports = router;