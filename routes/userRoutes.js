const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const protect = require("../middleware/auth");

// GET /api/user/me - Récupérer le profil de l'utilisateur connecté
router.get("/me", protect, userController.getProfile);

// GET /api/user/leaderboard - Récupérer le classement global
router.get("/leaderboard", protect, userController.getLeaderboard);

// POST /api/user/addFriend - Ajouter un pote
router.post("/addFriend", protect, userController.addFriend);

module.exports = router;
