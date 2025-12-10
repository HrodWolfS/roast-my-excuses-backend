const Task = require('../models/Task');
const { DAILY_FREE_LIMIT } = require('../config/constants'); 

const MOCK_ROAST = {
   roast: "Oh là là, tu es vraiment doué pour trouver des excuses ! Si seulement tu mettais autant d'efforts à accomplir tes tâches qu'à les éviter, tu serais déjà PDG d'une entreprise !",
   actionPlan: [
     "Étape 1 : Arrête de chercher des excuses.",
     "Étape 2 : Concentre-toi sur ta tâche.",
     "Étape 3 : Termine-la et savoure la victoire !"
   ]
};

exports.createTask = async (req, res) => {
  try {
    const { description, excuse, type } = req.body;
    const user = req.user; 

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

   // 3. Update compteurs (UNIQUEMENT si non-premium)
   if (user.subscriptionStatus !== 'premium') {
        if (user.dailyTasksUsed < DAILY_FREE_LIMIT) {
            user.dailyTasksUsed += 1;
        } else if (user.adCredits > 0) {
            user.adCredits -= 1;
        }
        await user.save(); // Sauvegarde les compteurs modifiés
    }

    // 4. Mock IA
    const aiResponse = MOCK_ROAST;

    // 5. Création DB
    const task = await Task.create({
        userId: user._id,
        description,
        excuse,
        type,
        roastContent: aiResponse.roast,
        actionPlan: aiResponse.actionPlan,
        timerDuration: 1500, // 25 min par défaut
        status: 'pending'
    });

    // 6. Réponse
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
    console.error(error); 

    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', Au secours !! Je suis enfermé dans une boite !') });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
};