const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate friendCode (Format: "B4N1E7")
const generateFriendCode = () => {
    const caracters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += caracters.charAt(Math.floor(Math.random() * caracters.length));
    }
    return code;
};

// Register a new user
exports.register = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check l'existance de l'email et la longueur du mot de passe
        if (!email || !password) {
            return res.status(400).json({ message: `L'email et le mot de passe sont obligatoires` });
        }
        else if (password.length < 8) {
            return res.status(400).json({ message: `Le mot de passe doit contenir au moins 8 caractères` });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: `L'email ${email} est déjà utilisé` });
        }

        // (Hashage du mot de passe)
        const hashPassword = await bcrypt.hash(password);

        // Génération d'un friendCode unique
        const friendCode = generateFriendCode();
        const codeExists = await User.findOne({ friendCode });  
        while (codeExists) {
            friendCode = generateFriendCode();
            codeExists = await User.findOne({ friendCode });
        }

        // Création de l'utilisateur 
        const user = User.create({
            email,
            password: hashPassword,
            friendCode,
        });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        }  catch (error) {
        return res.status(500).json({ message: 'Erreur du serveur' });
    }
    res.status(201).json({ message: 'Utilisateur créé avec succès' });
};