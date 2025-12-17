const User = require("../models/User");
const Task = require("../models/Task");
const { DAILY_FREE_LIMIT } = require("../config/constants");
const { askGrok } = require("../services/grok");
require("dotenv").config();

///////////////////////////////////////////////////////
//            FALLBACK DATA (AKA Le Plan B)          //
//     ROAST en dur pour remplacer le fetch API      //
//           (Dans le cas ou l'API est KO)           //
///////////////////////////////////////////////////////

const FALLBACK_DATA = {
  roastContent:
    "Je suis en pause café (ou ton wifi est cramé), mais t'as pas besoin de moi pour savoir que tu procrastines. Bouge-toi.",
  actionPlan: [
    "Étape 1 (1 min) : Arrête de chercher des excuses.",
    "Étape 2 (2 min) : Ouvre ton outil de travail.",
    "Étape 3 (20 min) : Fais le strict minimum, c'est mieux que rien.",
  ],
  timerDuration: 1500, // 25 minutes
};

const SAFETY_FALLBACK_DATA = {
  roastContent: "Ok, désolé mais là je peux pas t'aider. J'ai une éthique.",
  actionPlan: [
    "Étape 1 : Respire un coup.",
    "Étape 2 : Change de sujet.",
    "Étape 3 : Reviens avec un truc légal/safe.",
  ],
  timerDuration: 300, // 5 minutes (punition légère)
};

exports.createTask = async (req, res) => {
  try {
    const { description, excuse, type } = req.body;

    // 1. Récupération user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Utilisateur introuvable en base." });
    }
    // Validation des champs
    if (!description || !excuse || !type) {
      return res.status(400).json({
        message: "Champs requis manquants (description, excuse, type).",
      });
    }

    //////////////////////////////////////////
    // ----- LOGIQUE RESET JOURNALIER ----- //
    //////////////////////////////////////////

    const now = new Date();
    // Sécurité : si l'utilisateur est neuf (pas de date), on met une vieille date (0) pour forcer le reset (Date(0) renvoie au "1er Janvier 1970")
    const lastReset = user.lastTaskResetDate
      ? new Date(user.lastTaskResetDate)
      : new Date(0);

    // Comparaison stricte : jour/mois/année
    const isDifferentDay =
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear();

    if (isDifferentDay) {
      console.log(
        `🔄 Réinitialisation quotidienne des compteurs pour ${
          user.username || "User " + user._id
        }.`
      );
      user.dailyTasksUsed = 0;
      user.lastTaskResetDate = now;
      await user.save(); // On sauvegarde le reset immédiatement
    }

    // 2. Vérif'
    if (!user.canCreateTask()) {
      return res.status(403).json({
        message:
          "Quota dépassé ! Reviens demain ou regarde une pub pour un crédit.",
      });
    }

    // 3. Update compteurs utilisateur
    if (user.subscriptionStatus !== "premium") {
      if (user.dailyTasksUsed < DAILY_FREE_LIMIT) {
        user.dailyTasksUsed += 1;
      } else if (user.adCredits > 0) {
        user.adCredits -= 1;
      }
      await user.save(); // Save les compteurs modif
    }

    const isRoastMode = type === "roasty";

    // 4. Appel à l'API Grok
    let aiData;
    console.log(`Appel Grok pour : "${description}"...`);

    try {
      const rawGrokResponse = await askGrok({
        task: description,
        excuse: excuse,
        roasty: isRoastMode,
      });

      // Parsing robuste
      let cleanJson = rawGrokResponse.replace(/```json|```/g, "").trim();

      // Si Grok met du texte avant/après, on extrait juste le bloc JSON
      const firstBrace = cleanJson.indexOf("{");
      const lastBrace = cleanJson.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        aiData = JSON.parse(cleanJson);
      } else {
        throw new Error(
          "Réponse Grok invalide (Pas de JSON détecté). Probable refus de sécurité."
        );
      }

      // Ajustement timer en secondes si besoin
      if (aiData.timerDuration && aiData.timerDuration < 30) {
        aiData.timerDuration = aiData.timerDuration * 60;
      }
    } catch (err) {
      console.warn(
        "⚠️ Grok n'a pas renvoyé de JSON valide (Refus ou Erreur). Passage en FALLBACK."
      );
      const isVIolation =
        err.message.includes("refus") || err.message.includes("sécurité");

      if (!isVIolation) {
        console.error("Détail erreur Grok :", err.message);
      }

      aiData = isVIolation ? { ...SAFETY_FALLBACK_DATA } : { ...FALLBACK_DATA };

      // Ensure timerDuration exists
      if (!aiData.timerDuration) aiData.timerDuration = 1500;
    }

    // 5. Création en DB
    const task = await Task.create({
      userId: user._id,
      description,
      excuse,
      type,
      roastContent: aiData.roastContent,
      actionPlan: aiData.actionPlan || [],
      timerDuration: aiData.timerDuration || 1500, // 25 minutes par défaut
      status: "pending",
    });

    // 6. Réponse de DB
    res.status(201).json({
      success: true,
      data: task,
      userQuota: {
        dailyTasksUsed: user.dailyTasksUsed,
        adCredits: user.adCredits,
        limit: DAILY_FREE_LIMIT,
      },
    });
  } catch (error) {
    console.error("Controller Error :", error);
    res.status(500).json({ message: error.message });
  }
};

///////////////////////////////////////////////////////
//             Avancement de la tâche                //
//   pending / in_progress / completed / abandoned   //
//                Streak & Level Up                  //
///////////////////////////////////////////////////////

exports.updateTaskStatus = async (req, res) => {
  try {
    console.log("Update status lancé !");
    const taskId = req.params.id;
    const { status } = req.body;
    const user = req.user;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Tâche non trouvée." });
    }

    // Vérification propriétaire
    if (task.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Accès refusé à cette tâche." });
    }
    //////////////////////////////////////////
    // --------- TASK (Démarrage) --------- //
    //////////////////////////////////////////

    if (status === "in_progress") {
      if (task.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Tâche déjà commencée ou terminée" });
      }
      task.status = "in_progress";
      task.startedAt = new Date();
      await task.save();
      return res.status(200).json({ success: true, data: task });
    }

    //////////////////////////////////////////
    // ----------- ABANDON TASK ----------- //
    //////////////////////////////////////////

    if (status === "abandoned") {
      // Prevent double abandonment or abandoning a completed task
      if (task.status !== "in_progress") {
        return res.status(400).json({
          message: "Cette tâche n'est pas en cours (déjà finie ou abandonnée).",
        });
      }

      task.status = "abandoned";

      // LOGIQUE CONSOLATION (Points partiels pondérés)
      let consolationPoints = 0;

      // 1. Points par étape cochée
      if (
        req.body.checkedStepIndices &&
        Array.isArray(req.body.checkedStepIndices)
      ) {
        if (req.body.checkedStepIndices.includes(0)) consolationPoints += 10;
        if (req.body.checkedStepIndices.includes(1)) consolationPoints += 20;
        // L'étape 3 (index 2) vaut 30 mais n'est accessible qu'en validant (donc status completed)
      }

      // 2. Points "Survival" (si timer fini)
      if (req.body.timerFinished === true) {
        consolationPoints += 40;
      }

      task.pointsEarned = consolationPoints;
      await task.save();

      // Update User Points
      if (consolationPoints > 0) {
        user.points += consolationPoints;
        await user.save();
      }

      // On unifie la réponse pour qu'elle ressemble à celle de "completed"
      return res.status(200).json({
        success: true,
        data: task,
        gamification: {
          pointsEarned: consolationPoints,
          newTotalPoints: user.points,
          isLevelUp: false, // Pas de level up en cas d'abandon
          message: `Tâche abandonnée. Tu as quand même gratté ${consolationPoints} points de consolation.`,
        },
      });
    }

    //////////////////////////////////////////
    // ---------- COMPLETE TASK ----------- //
    //////////////////////////////////////////

    if (status === "completed") {
      if (task.status !== "in_progress") {
        return res
          .status(400)
          .json({ message: "Il faut démarrer la tâche avant de la finir." });
      }

      const now = new Date();
      task.status = "completed";
      task.completedAt = now;

      //////////////////////////////////////////
      // -------- CALCUL DES POINTS --------- //
      //////////////////////////////////////////

      let pointsEarned = 100;

      //--- ANTI-TRICHE / ANTI-SPAM ---//

      // Bonus Streak
      if (user.streak >= 7) pointsEarned += 10;
      if (user.streak >= 15) pointsEarned += 20;
      if (user.streak >= 30) pointsEarned += 50;

      // Mise à jour Task
      task.pointsEarned = pointsEarned;
      await task.save();

      //////////////////////////////////////////
      // --------- LOGIQUE LEVEL UP --------- //
      //////////////////////////////////////////

      const initialLevel = user.level;
      user.points += pointsEarned;

      // Level Up (Exponentielle 1.5)
      let pointsForNextLevel = Math.floor(100 * Math.pow(1.5, user.level));
      while (user.points >= pointsForNextLevel) {
        user.level += 1;
        pointsForNextLevel = Math.floor(100 * Math.pow(1.5, user.level));
      }

      const isLevelUp = user.level > initialLevel;
      // League Update (en fonction du level user)
      if (user.level >= 75) user.currentLeague = "Diamond";
      else if (user.level >= 50) user.currentLeague = "Gold";
      else if (user.level >= 25) user.currentLeague = "Silver";
      else user.currentLeague = "Bronze";

      //////////////////////////////////////////
      // ---------- LOGIQUE STREAK ---------- //
      //////////////////////////////////////////

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Vérifie si l'utilisateur a déjà complété une tâche aujourd'hui
      const hasCompletedTaskToday = await Task.findOne({
        userId: user._id,
        status: "completed",
        completedAt: { $gte: today },
        _id: { $ne: task._id },
      });

      // Si pas encore de tâche complétée aujourd'hui, on peut update le streak
      if (!hasCompletedTaskToday) {
        const hasTaskYesterday = await Task.findOne({
          userId: user._id,
          status: "completed",
          completedAt: { $gte: yesterday, $lt: today },
        });

        if (hasTaskYesterday) {
          user.streak += 1; // Continue le streak
        } else {
          user.streak = 1; // Reset
        }
      }

      await user.save();

      const responseTask = task.toObject();
      responseTask.isLevelUp = isLevelUp;

      return res.json({
        success: true,
        data: responseTask,
        gamification: {
          pointsEarned: pointsEarned,
          newTotalPoints: user.points,
          newLevel: user.level,
          newLeague: user.currentLeague,
          isLevelUp,
          streak: user.streak,
          message:
            pointsEarned === 0
              ? "Même pour faire ta tâche ta la flemme ! Pas de points."
              : `Bravo tu as gagné ${pointsEarned} !`,
        },
      });
    }

    return res.status(400).json({ message: "Statut invalide" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

///////////////////////////////////////////////////////
//                                                   //
//           RÉCUPÉRATION DES ACTIVE TASK            //
//       Affiche les tâches eb cours / ou non        //
///////////////////////////////////////////////////////

exports.getActiveTask = async (req, res) => {
  try {
    const activeTask = await Task.findOne({
      userId: req.user._id,
      status: "in_progress",
    });

    if (!activeTask) {
      return res.status(404).json({ message: "Aucune tâche active" });
    }

    return res.status(200).json({
      success: true,
      data: activeTask,
    });
  } catch (error) {
    console.error("Erreur getActiveTask:", error);
    res.status(500).json({ message: error.message });
  }
};

///////////////////////////////////////////////////////
//                                                   //
//          RÉCUPÉRATION DE MES TÂCHES               //
//             (Pour l'écran MyTasks)                //
///////////////////////////////////////////////////////

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({
      createdAt: -1,
    }); // Plus récentes en premier

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error("Erreur getMyTasks:", error);
    res.status(500).json({ message: error.message });
  }
};

///////////////////////////////////////////////////////
//                                                   //
//          TOGGLE VISIBILITY (PUBLIC/PRIVATE)       //
//                                                   //
///////////////////////////////////////////////////////

exports.toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    // Verify ownership
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    // Toggle
    task.isPublic = !task.isPublic;
    await task.save();

    return res.json({
      success: true,
      isPublic: task.isPublic,
      message: task.isPublic ? "Roast rendu public" : "Roast rendu privé",
    });
  } catch (error) {
    console.error("Erreur toggleVisibility:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
