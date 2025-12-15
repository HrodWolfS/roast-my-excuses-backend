const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const protect = require("../middleware/auth");
const authController = require("../controllers/authController");

// Route POST d'inscription / login
router.post("/register", authController.register);
router.post("/login", login);

module.exports = router;
