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

///////////////////////////////////////////////////////
//                                                   //
//                REGISTER USER                      //
//                                                   //
///////////////////////////////////////////////////////

exports.register = async (req, res) => {
    const { userName, email, password } = req.body;

    try {
        // Check l'existance des input et la longueur du mot de passe
        if (!userName || !email || !password) {
            return res.status(400).json({ message: `Email, mot de passe et nom d'utilisateur requis` });
        }
        else if (password.length < 8) {
            return res.status(400).json({ message: `Le mot de passe doit contenir au moins 8 caractères` });
        }

        // Vérifier si l'email est déjà utilisé
        const userEmailExists = await User.findOne({ email });
        if (userEmailExists) {
            return res.status(400).json({ message: `L'email ${email} est déjà utilisé` });
        }
        const userNameExists = await User.findOne({ userName });
        if (userNameExists) {
            return res.status(400).json({ message: `Le nom d'utilisateur ${userName} est déjà utilisé` });
        }

        // Hashage et salt(10) du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // Génération d'un friendCode unique
        let friendCode = generateFriendCode();
        let codeExists = await User.findOne({ friendCode });  
        while (codeExists) {
            friendCode = generateFriendCode();
            codeExists = await User.findOne({ friendCode });
        }

        // Création de l'utilisateur 
        const user = await User.create({
            userName,
            email,
            passwordHash: hashPassword,
            friendCode,
        });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({
            _id: user._id,
            userName: user.userName,
            email: user.email,
            friendCode: user.friendCode,
            token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur du serveur / Woaaaa il fait chaud frère !' });
    } 
};

///////////////////////////////////////////////////////
//                                                   //
//                   LOGIN USER                      //
//                                                   //
///////////////////////////////////////////////////////

exports.login = async (req, res) => {

    let { identifier, email, userName, password } = req.body;
    identifier = identifier || email || userName;

    try {
        // Validation des champs
        if (!identifier || !password) {
            return res.status(400).json({ message: "Identifiant et mot de passe requis" });
        }

        // Vérifier si l'email ou le userName existe avec ($or) 
        const user = await User.findOne({ 
          $or: [
            { email: identifier },
            { userName: identifier }
          ]   
        });

        if (!user) {
            return res.status(401).json({ message: `Identifiant ou mot de passe incorrect` });
        }

        // Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }

        // Générer un token JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(200).json({
            _id: user._id,
            userName: user.userName,
            email: user.email,
            friendCode: user.friendCode,
            token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur du serveur / Woaaaa il fait chaud frère !' });
    }
};
