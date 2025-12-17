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
      // On filtre sur les IDs des amis
      query.userId = { $in: req.user.friends };
    }

    const tasks = await Task.find(query)
      .sort({ upvotes: -1, createdAt: -1 })
      .limit(50)
      .select("description roastContent upvotes userId votedBy")
      .populate({
        path: "userId",
        select: "pseudo email userName isPublic",
      });

    const formatted = tasks
      // ignore tasks from users who are not public
      .filter((t) => t.userId?.isPublic !== false)
      .map((t) => ({
        id: t._id.toString(),
        user: t.userId?.userName,
        task: t.description,
        roast: t.roastContent,
        upvotes: t.upvotes ?? 0,
        isLiked: req.user
          ? t.votedBy?.some((v) => v.toString() === req.user._id.toString())
          : false,
      }));

    res.json(formatted);
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
