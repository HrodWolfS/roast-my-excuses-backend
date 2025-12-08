const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // On tente la connexion
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Database Name: ${conn.connection.name}`);
  } catch (error) {
    // Si ça plante, on affiche l'erreur et on coupe tout
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
