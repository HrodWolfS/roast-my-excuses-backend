const Task = require("../models/Task"); //
// Pas besoin d'importer User, car le middleware nous le donne déjà !

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
        email: user.email,
        friendCode: user.friendCode,

        // Gamification Stats
        points: user.points,
        level: user.level,
        streak: user.streak,
        currentLeague: user.currentLeague,

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
