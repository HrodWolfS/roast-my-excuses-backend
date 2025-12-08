const { DAILY_LIMIT } = require('../config/constants'); // Import propre

// ... dans ta fonction createTask
if (user.dailyTasksUsed >= DAILY_LIMIT && user.adCredits === 0) {
   return res.status(403).json({ message: "Quota dépassé !" });
}