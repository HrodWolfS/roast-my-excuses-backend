const authController = require('../../controllers/authController');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


jest.mock('../../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Controller - Login', () => {
   
    it('400 champs manquants', async () => {
        //console.log(">>> Début du test 1 : Champs manquants");

        const req = { body: { password: 'password123' } }; 
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await authController.login(req, res);

        //console.log("Status reçu :", res.status.mock.calls[0][0]); 
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Identifiant et mot de passe requis" });
    });

    it('401 si utilisateur inconnu', async () => {
        //console.log(">>> Début du test 2 : User fantôme");

        const req = { body: { identifier: 'fantome', password: '123' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        User.findOne.mockResolvedValue(null);

        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401); 
    });

    it('401 si mauvais mot de passe', async () => {
        //console.log(">>> Début du test 3 : Mauvais mdp");

        const req = { body: { identifier: 'pierre', password: 'faux' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        
        // Fake user
        const mockUser = { _id: '1', passwordHash: 'hash' };
        User.findOne.mockResolvedValue(mockUser);
        
        bcrypt.compare.mockResolvedValue(false);

        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('200 All is good', async () => {
        //console.log(">>> Début du test 4 : Succès login");

        const req = { body: { identifier: 'pierre@test.com', password: 'vrai' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        const mockUser = { 
            _id: '123', 
            userName: 'Pierre', 
            email: 'pierre@test.com',
            friendCode: 'ABCD',
            passwordHash: 'hash' 
        };

        User.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('fake_token_jwt');

        await authController.login(req, res);

        //console.log("Token généré :", 'fake_token_jwt'); 

        expect(res.status).toHaveBeenCalledWith(200);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            token: 'fake_token_jwt',
            userName: 'Pierre'
        }));
        
        //console.log(">>> Fin des tests !");
    });
});