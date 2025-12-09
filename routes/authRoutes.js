const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const protect = require('../middleware/auth');

// Route POST d'inscription / login
router.post('/register', register);
router.post('/login', login);

// Route GET pour récupérer les infos de l'utilisateur connecté
router.get('/me', protect, getMe);

module.exports = router;