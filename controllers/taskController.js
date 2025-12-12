const User = require('../models/User');
const Task = require('../models/Task');
const { DAILY_FREE_LIMIT } = require('../config/constants'); 
const { askGrok } = require('../services/grok');
require("dotenv").config();

///////////////////////////////////////////////////////
//            FALLBACK DATA (AKA Le Plan B)          //
//     ROAST en dur pour remplacer le fetch API      //
//           (Dans le cas ou l'API est KO)           //
///////////////////////////////////////////////////////

const FALLBACK_DATA = {
   roastContent: "Je suis en pause café (ou ton wifi est cramé), mais t'as pas besoin de moi pour savoir que tu procrastines. Bouge-toi.",
   actionPlan: [
     "Étape 1 (1 min) : Arrête de chercher des excuses.",
     "Étape 2 (2 min) : Ouvre ton outil de travail.",
     "Étape 3 (20 min) : Fais le strict minimum, c'est mieux que rien."
   ],
   timerDuration: 1500 // 25 minutes
};


///////////////////////////////////////////////////////
//              Création de la tâche.                //
//              Vérification du token                //
//           Création en base de donnée              //
///////////////////////////////////////////////////////

exports.createTask = async (req, res) => {
  try {
    const { description, excuse, type } = req.body;
    
    // 1. Récupération user
    const user = await User.findById(req.user.id); 

    if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable en base." });
    }
    // Validation des champs
    if (!description || !excuse || !type) {
      return res.status(400).json({ message: "Champs requis manquants (description, excuse, type)." });
    }

    // 2. Vérif'
    if (!user.canCreateTask()) {
        return res.status(403).json({ 
            message: "Quota dépassé ! Reviens demain ou regarde une pub pour un crédit." 
        });
    }

   // 3. Update compteurs utilisateur
   if (user.subscriptionStatus !== 'premium') {
        if (user.dailyTasksUsed < DAILY_FREE_LIMIT) {
            user.dailyTasksUsed += 1;
        } else if (user.adCredits > 0) {
            user.adCredits -= 1;
        }
        await user.save(); // Save les compteurs modif
    }

    const isRoastMode = type === 'roasty';

    // 4. Appel à l'API Grok
    let aiData;
    console.log(`Appel Grok pour : "${description}"...`);

    try {
        
        const rawGrokResponse = await askGrok({ 
            task: description, 
            excuse: excuse, 
            roasty: isRoastMode 
        });

        // Parsing du JSON reçu
        const cleanJson = rawGrokResponse.replace(/```json|```/g, '').trim();
        aiData = JSON.parse(cleanJson);
        
        // Ajustement timer en secondes si besoin
        if (aiData.timerDuration && aiData.timerDuration < 100) {
             aiData.timerDuration = aiData.timerDuration * 60;
        }

    } catch (err) {
        console.error(" GROK FAILURE : passage en mode FALLBACK :", err.message);
        if (err.response) {
            console.error("Détail :", err.response.data);
        }
        
        aiData = {
            ...FALLBACK_DATA,
            timerDuration: FALLBACK_DATA.timerDuration
        };
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
        status: 'pending'
    });

    // 6. Réponse de DB
    res.status(201).json({
        success: true,
        data: task,
        userQuota: { 
            dailyTasksUsed: user.dailyTasksUsed,
            adCredits: user.adCredits,
            limit: DAILY_FREE_LIMIT
        }
    });

  } catch (error) {
    console.error("Controller Error :", error); 
    res.status(500).json({ message: "Erreur serveur" });
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
    //////////////////////////////
    // --- TASK (Démarrage) --- //
    //////////////////////////////

    if (status === 'in_progress') {
      if (task.status !== 'pending') {
        return res.status(400).json({ message: "Tâche déjà commencée ou terminée" });
      }
      task.status = 'in_progress';
      task.startedAt = new Date();
      await task.save();
      return res.status(200).json({ success: true, data: task });
    }
    //////////////////////////
    // --- ABANDON TASK --- //
    //////////////////////////

    if (status === 'abandoned') {
        if (task.status === 'completed') {
            return res.status(400).json({ message: "Trop tard, elle est déjà finie !" });
        }
        
        task.status = 'abandoned'; // Abandonnée = 0pts
        await task.save();

        return res.status(200).json({ 
            success: true, 
            data: task, 
            message: "Tâche abandonnée. Dommage, ce sera pour la prochaine fois !" 
        });
    }
    ////////////////////////////
    // ---  COMPLETE TASK --- //
    ////////////////////////////

    if (status === 'completed') {
      if (task.status !== 'in_progress') {
        return res.status(400).json({ message: "Il faut démarrer la tâche avant de la finir." });
      }

      const now = new Date(); 
      task.status = 'completed';
      task.completedAt = now;


      ///////////////////////////////
      // --- CALCUL DES POINTS --- //
      ///////////////////////////////

      let pointsEarned = 0; 

      // Calcul du temps réel passé (en secondes)
      const taskDuration = (now - new Date(task.startedAt)) / 1000;

      ///////////////////////////////
      //  ANTI-TRICHE / ANTI-SPAM  //
      ///////////////////////////////

      const MINIMUM_EFFORT_SECONDS = 300; // 5 minutes minimum

      if (taskDuration > MINIMUM_EFFORT_SECONDS) {
          pointsEarned = 10; // Points de base validés

          // Bonus Streak
          if (user.streak >= 7) pointsEarned += 10;
          if (user.streak >= 15) pointsEarned += 20;
          if (user.streak >= 30) pointsEarned += 50;

      }

      // Mise à jour Task
      task.pointsEarned = pointsEarned;
      await task.save();


      //////////////////////////////
      // --- LOGIQUE LEVEL UP --- //
      //////////////////////////////

      user.points += pointsEarned;

      // Level Up (Exponentielle 1.5)
      let pointsForNextLevel = Math.floor(100 * Math.pow(1.5, user.level));
      while (user.points >= pointsForNextLevel) {
        user.level += 1;
        pointsForNextLevel = Math.floor(100 * Math.pow(1.5, user.level));
      }

      // League Update (en fonction du level user)
      if (user.level >= 75) user.currentLeague = 'Diamond';
      else if (user.level >= 50) user.currentLeague = 'Gold';
      else if (user.level >= 25) user.currentLeague = 'Silver';
      else user.currentLeague = 'Bronze';


      ////////////////////////////
      // --- LOGIQUE STREAK --- //
      ////////////////////////////

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Vérifie si l'utilisateur a déjà complété une tâche aujourd'hui
      const hasCompletedTaskToday = await Task.findOne({
          userId: user._id,
          status: 'completed',
          completedAt: { $gte: today },
          _id: { $ne: task._id }
      });

      // Si pas encore de tâche complétée aujourd'hui, on peut update le streak
      if (!hasCompletedTaskToday) {
          const hasTaskYesterday = await Task.findOne({
              userId: user._id,
              status: 'completed',
              completedAt: { $gte: yesterday, $lt: today }
          });

          if (hasTaskYesterday) {
              user.streak += 1; // Continue le streak
          } else {
              user.streak = 1; // Reset
          }
      }

      await user.save();

      return res.json({
          success: true,
          data: task,
          gamification: {
              pointsEarned: pointsEarned,
              newTotalPoints: user.points,
              newLevel: user.level,
              newLeague: user.currentLeague,
              streak: user.streak,
              message: pointsEarned === 0 ? "Même pour faire ta tâche ta la flemme ! Pas de points." : `Bravo tu as gagné ${pointsEarned} !`
          }
      });
    }

    return res.status(400).json({ message: "Statut invalide" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};