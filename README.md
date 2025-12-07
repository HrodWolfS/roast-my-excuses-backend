# Roast My Excuses - Backend

Bienvenue sur l'API de Roast My Excuses.
Ce backend est construit avec Node.js, Express et MongoDB.

## Installation Rapide

1. **Cloner le projet**

   ```bash
   git clone https://github.com/HrodWolfS/roast-my-excuses-backend.git
   cd roast-my-excuses-backend
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Configuration (.env)**
   ```bash
   Dupliquez le fichier .env.example et renommez-le en .env
   ```

Demandez la variables secrète (MONGO_URI)

4. Lancer le serveur

   ```bash
   npm run dev
   ```

Le serveur démarrera sur http://localhost:3000

## Structure

server.js : Point d'entrée

config/ : Connexion Database

routes/ : Définition des URLs API

controllers/ : Logique métier (C'est ici qu'on code !)

models/ : Schémas de données (User, Task)
