const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const protect  = require("../middleware/auth"); 

// GET /api/user/me - Récupérer le profil de l'utilisateur connecté
router.get("/me", protect, userController.getProfile);

module.exports = router;
