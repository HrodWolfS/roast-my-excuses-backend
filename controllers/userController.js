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

// Ajouter un pote
exports.addFriend = async (req, res) => {
  const { friendCode } = req.body;
  const currentUserId = req.user._id; 

  try {
    // Validation basique
    if (!friendCode) {
      return res.status(400).json({ message: "Code ami requis." });
    }

    // Trouver l'ami ciblé (Insensible à la casse)
    const friend = await User.findOne({ 
      friendCode: friendCode.toUpperCase() 
    });

    if (!friend) {
      return res.status(404).json({ message: "Ce Code Ami n'existe pas." });
    }

    // Vérif de sécu
    if (friend._id.equals(currentUserId)) {
      return res.status(400).json({ message: "Tu ne peux pas t'ajouter toi-même, narcissique va." });
    }

    const currentUser = await User.findById(currentUserId);

    if (currentUser.friends.includes(friend._id)) {
      return res.status(400).json({ message: "Vous êtes déjà amis !" });
    }

    // L'Ajout Mutuel (Toi + Lui)
    await User.findByIdAndUpdate(currentUserId, { 
      $addToSet: { friends: friend._id } 
    }); // $addToSet pour éviter les doublons
    
    await User.findByIdAndUpdate(friend._id, { 
      $addToSet: { friends: currentUserId } 
    });

    res.status(200).json({
      success: true,
      message: `Boom ! ${friend.userName} est maintenant ton pote de galère.`,
      friend: {
        _id: friend._id,
        userName: friend.userName,
        level: friend.level,
        currentLeague: friend.currentLeague
      }
    });

  } catch (error) {
    console.error("Erreur addFriend:", error);
    res.status(500).json({ message: "Erreur serveur lors de l'ajout de l'ami." });
  }
};