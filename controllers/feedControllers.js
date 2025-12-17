const Task = require("../models/Task");

const getFeed = async (req, res) => {
  try {
    const scope = req.query.scope;
    let query = { isPublic: true };

    if (scope === "friends") {
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Connecte-toi pour voir tes amis." });
      }

      // Sécurité : Si pas d'amis, on retourne vide direct (évite le fallback global)
      if (!req.user.friends || req.user.friends.length === 0) {
        return res.json([]);
      }

      query.userId = { $in: req.user.friends };
    }

    // 1. Récupérer le TOP ROAST (Le plus liké)
    const topCandidates = await Task.find(query)
      .sort({ upvotes: -1 })
      .limit(10)
      .select("description roastContent upvotes userId votedBy createdAt")
      .populate({
        path: "userId",
        select: "pseudo email userName isPublic",
      });

    // 2. Récupérer le FEED CHRONOLOGIQUE (Les plus récents)
    const recentCandidates = await Task.find(query)
      .sort({ createdAt: -1 })
      .limit(60)
      .select("description roastContent upvotes userId votedBy createdAt")
      .populate({
        path: "userId",
        select: "pseudo email userName isPublic",
      });

    // Fonction de formatage
    const formatTask = (t) => ({
      id: t._id.toString(),
      user: t.userId?.userName,
      task: t.description,
      roast: t.roastContent,
      upvotes: t.upvotes ?? 0,
      createdAt: t.createdAt, // Utile pour debug
      isTop: false, // Flag par défaut
      isLiked: req.user
        ? t.votedBy?.some((v) => v.toString() === req.user._id.toString())
        : false,
    });

    // Filtre de visibilité utilisateur (Global Privacy)
    const isVisible = (t) => {
      // console.log(`[FEED_DEBUG] Check user ${t.userId?._id}: Public=${t.userId?.isPublic}`);
      return t.userId?.isPublic !== false;
    };

    // Sélection du Top Roast
    const validTopCandidates = topCandidates.filter(isVisible);
    const topRoast =
      validTopCandidates.length > 0 ? validTopCandidates[0] : null;

    // Sélection du Feed Récent (sans doublon avec le Top Roast)
    let validRecentTasks = recentCandidates.filter(isVisible);

    if (topRoast) {
      validRecentTasks = validRecentTasks.filter(
        (t) => t._id.toString() !== topRoast._id.toString()
      );
    }

    // Assemblage final
    let finalFeed = [];
    if (topRoast) {
      const formattedTop = formatTask(topRoast);
      formattedTop.isTop = true; // On marque le top roast pour le frontend (optionnel)
      finalFeed.push(formattedTop);
    }

    finalFeed = [...finalFeed, ...validRecentTasks.map(formatTask)];

    // Limite finale (si on veut garder 50 items max par exemple)
    if (finalFeed.length > 50) {
      finalFeed = finalFeed.slice(0, 50);
    }

    res.json(finalFeed);
  } catch (error) {
    console.error("Erreur getFeed :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// POST /api/feed/:id/like - toggle like pour l'utilisateur courant
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Non autorisé" });
    }

    const task = await Task.findById(id).populate(
      "userId",
      "userName pseudo email"
    );
    if (!task) {
      return res.status(404).json({ message: "Roast introuvable" });
    }

    const hasVoted = task.votedBy.some(
      (v) => v.toString() === userId.toString()
    );

    if (hasVoted) {
      task.votedBy = task.votedBy.filter(
        (v) => v.toString() !== userId.toString()
      );
      task.upvotes = Math.max(0, (task.upvotes || 0) - 1);
    } else {
      task.votedBy.push(userId);
      task.upvotes = (task.upvotes || 0) + 1;
    }

    await task.save();

    return res.json({
      id: task._id.toString(),
      user: task.userId?.userName || task.userId?.pseudo || task.userId?.email,
      task: task.description,
      roast: task.roastContent,
      upvotes: task.upvotes ?? 0,
      isLiked: !hasVoted,
    });
  } catch (error) {
    console.error("Erreur toggleLike :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = { getFeed, toggleLike };
