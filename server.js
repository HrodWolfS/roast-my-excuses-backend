const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use('/api/auth', authRoutes);

// Routes (à ajouter)

app.post("/register", (req, res) => {
  res.json({ message: "Roast My Excuses API" });
});

// Database connection
connectDB();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Le serveur cours sur le port ${PORT}`));
