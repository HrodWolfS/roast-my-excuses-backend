const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const protect = require("../middleware/auth");

// GET /api/user/me - Récupérer le profil de l'utilisateur connecté
router.get("/me", protect, userController.getProfile);

// PATCH /api/user/me - Mettre à jour le profil (ex: isPublic)
router.patch("/me", protect, userController.updateUserProfile);

// GET /api/user/leaderboard - Récupérer le classement global
router.get("/leaderboard", protect, userController.getLeaderboard);

// POST /api/user/addFriend - Ajouter un pote
router.post("/friends", protect, userController.addFriend);

module.exports = router;
