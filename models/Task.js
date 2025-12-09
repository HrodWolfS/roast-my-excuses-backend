const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    // --- 1. Relation & Propriétaire ---
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Une tâche doit appartenir à un utilisateur"],
      index: true, // Indexé pour récupérer rapidement "Mes Tâches"
    },

    // --- 2. Contenu de la Tâche (Input User) ---
    description: {
      type: String,
      required: [true, "La description est requise"],
      minlength: [10, "La description doit faire au moins 10 caractères"],
      maxlength: [500, "La description ne peut pas dépasser 500 caractères"],
      trim: true,
    },
    excuse: {
      type: String,
      required: [true, "L'excuse est requise"],
      minlength: [5, "L'excuse doit faire au moins 5 caractères"],
      maxlength: [500, "L'excuse ne peut pas dépasser 500 caractères"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["challenge", "roasty"],
      required: [true, "Le type de tâche est requis"],
    },

    // --- 3. Contenu Généré par l'IA ---
    roastContent: {
      type: String,
      required: [true, "Le roast est requis (erreur IA ?)"],
    },
    actionPlan: {
      type: [String], // Un tableau de chaînes de caractères (ex: ["Étape 1", "Étape 2"])
      default: [],
    },

    // --- 4. État & Progression ---
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "abandoned"],
      default: "pending",
      index: true, // Indexé pour filtrer par statut
    },
    timerDuration: {
      type: Number,
      default: 1500, // 25 minutes en secondes (Pomodoro standard)
      min: 300, // 5 min min
      max: 7200, // 2h max
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },

    // --- 5. Social & Feed (Viralité) ---
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Pour éviter qu'un user like 50 fois la même tâche
    votedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true, // Crée createdAt et updatedAt automatiquement
  }
);

// --- 6. Index Composé pour le Feed (PERFORMANCE CRITIQUE) ---
// Permet de trier ultra-vite : "Montre-moi les tâches publiques, les plus likées, les plus récentes"
TaskSchema.index({ isPublic: 1, upvotes: -1, createdAt: -1 });

module.exports = mongoose.model("Task", TaskSchema);
