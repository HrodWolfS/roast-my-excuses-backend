const express = require("express");
const router = express.Router();
const { getFeed, createRoast, toggleLike } = require("../controllers/feedControllers");
const protect = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware d'auth optionnelle : si un token est présent et valide, on remplit req.user, sinon on laisse passer.
const optionalAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer")) {
    return next();
  }
  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-passwordHash");
  } catch (e) {
    // token invalide : on ignore et on continue sans utilisateur
    req.user = null;
  }
  return next();
};

router.get("/", optionalAuth, getFeed);
router.post("/", createRoast);
router.post("/:id/like", protect, toggleLike);

module.exports = router;
