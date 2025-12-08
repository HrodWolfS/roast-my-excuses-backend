const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // --- 1. Authentification ---
    userName: {
      type: String,
      required: [true, "Un nom est necessaire"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /(?:[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+(?:\.[a-z0-9!#$%&'*+\x2f=?^_`\x7b-\x7d~\x2d]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9\x2d]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
        "Le format de l'email est invalide",
      ],
    },
    passwordHash: {
      type: String,
      required: [true, "Le mot de passe est requis"],
      minlength: 32, // On s'assure qu'on stocke bien un hash bcrypt et pas un mdp en clair
    },

    // --- 2. Progression & Gamification (Le cœur du PLG) ---
    points: {
      type: Number,
      default: 0,
      min: 0,
      index: -1, // Indexé pour trier le leaderboard RAPIDEMENT
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentLeague: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Diamond"],
      default: "Bronze",
    },

    // --- 3. Social & Viralité ---
    friendsList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendCode: {
      type: String,
      unique: true,
      uppercase: true,
      match: [
        /^[A-Z0-9]{6}$/,
        "Le code ami doit faire 6 caractères alphanumériques",
      ],
      index: true, // Indexé pour les recherches d'amis instantanées
    },

    // --- 4. Monétisation & Quotas ---
    subscriptionStatus: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    dailyTasksUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastTaskResetDate: {
      type: Date,
      default: Date.now,
    },
    adCredits: {
      type: Number,
      default: 0,
      min: 0, // Crédits gagnés en regardant des pubs
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

// Export du modèle
module.exports = mongoose.model("User", UserSchema);
