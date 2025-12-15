const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

// Route POST d'inscription / login
router.post("/register", register); 
router.post("/login", login);

module.exports = router;