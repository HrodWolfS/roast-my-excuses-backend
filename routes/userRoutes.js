const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

const { protect } = require("../middleware/auth");

// Logs de vérification (tu pourras les supprimer après)
console.log("--- DEBUG ---");
console.log("Protect est-il une fonction ?", typeof protect); // Doit afficher 'function'
console.log("-------------");

// Ta route
router.get("/me", protect, userController.getProfile);

module.exports = router;
