const Task = require("../models/Task");
const User = require("../models/User");

exports.getProfile = async (req, res) => {
  try {
    // 1. Récupération optimisée : Le user est DÉJÀ là grâce à ton middleware
    const user = req.user;

    // 2. On a juste besoin de compter les tâches (seule requête DB restante)
    // On utilise user._id qui vient du middleware
    const tasksCompleted = await Task.countDocuments({
      userId: user._id,
      status: "completed",
    });

    // 3. Construction de la réponse (identique à avant)
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        userName: user.userName,
        subscriptionStatus: user.subscriptionStatus,
        isPublic: user.isPublic,
        email: user.email,
        friendCode: user.friendCode,

        // Gamification Stats
        points: user.points || 0,
        level: user.level || 1,
        streak: user.streak || 0,
        currentLeague: user.currentLeague || "Bronze", 

        // Calculated fields
        tasksCompleted: tasksCompleted,

        // Meta
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération du profil",
    });
  }
};

// Récupérer le classement global
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const leaderboard = await User.find({})
      .sort({ points: -1 })
      .limit(limit)
      .select("userName points level currentLeague streak");

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error("Error in getLeaderboard:", error);
    res.status(500).json({
      success: false,
      error: "Erreur serveur leaderboard",
    });
  }
};
