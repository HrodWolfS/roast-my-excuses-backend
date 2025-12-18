# 🔥 Roast My Excuses - Backend API (MVP)

> **"Le cerveau sadique derrière l'application."**

Ceci est l'API REST de **Roast My Excuses**, construite avec Node.js, Express & MongoDB. Elle gère l'authentification, le stockage des excuses et surtout... la génération des roast via l'IA.

---

## 🧠 Intelligence Artificielle (Grok Engine V4)

Le cœur du système repose sur un double prompt (`services/grok.js`) :

### 1. **Mode Roasty (💀 Sauvage)**

- **Objectif** : Humilier l'utilisateur par la pertinence technique.
- **Règles** : Zéro répétition, attaque directe, métaphores crues mais variées (anti-cliché).
- **Sortie** : Une punchline violente et technique.

### 2. **Mode Challenge (🏋️‍♂️ Coach)**

- **Objectif** : Ridiculiser l'excuse pour déclencher l'action.
- **Rules Smart Timer** :
  - _Deep Work_ : 15-20 min.
  - _Sport_ : 10-15 min.
  - _Corvées_ : 2-5 min.
- **Sortie** : Une moquerie bienveillante + un plan d'action en 3 étapes + un chrono adapté.

---

## 🛠 Stack Technique

- **Runtime** : Node.js
- **Framework** : Express.js
- **Database** : MongoDB (Mongoose)
- **AI Provider** : xAI (Grok-beta)
- **Auth** : JWT (JSON Web Tokens)

---

## 🔌 Endpoints Principaux

### **Authentification** (`/api/auth`)

- `POST /register` : Créer un compte.
- `POST /login` : Se connecter.

### **Tâches & Roasts** (`/api/tasks`)

- `POST /` : Envoyer une excuse → **Génère un Roast AI**.
- `GET /my-tasks` : Historique perso.
- `PATCH /:id/toggle-visibility` : Cacher/Montrer une tâche spécifique.

### **Feed & Social** (`/api/users`)

- `GET /feed` : Récupère le **Top Roast** (Gold) + le flux chronologique.
- `GET /leaderboard` : Classement (Global ou Amis).
- `PATCH /profile` : Mettre à jour le profil (Avatar, Privacy global).

---

## 🚀 Installation & Lancement

### 1. Pré-requis

- **Node.js** (v18+)
- **MongoDB** (Local ou Atlas)
- Une clé API pour l'IA (xAI).

### 2. Setup

```bash
# Cloner le repo
git clone https://github.com/HrodWolfS/roast-my-excuses-backend.git
cd roast-my-excuses-backend

# Installer les dépendances
npm install
```

### 3. Configuration Env

Crée un fichier `.env` à la racine :

```env
PORT=3000
MONGO_URI=mongodb+srv://... (Ton lien Mongo)
JWT_SECRET=ton_secret_super_securise
XAI_API_KEY=xai-... (Ta clé API)
```

### 4. Démarrage

```bash
# Mode Développement (avec Nodemon)
npm run dev

# Mode Production
npm start
```

---

## 📂 Structure du Projet

```
/
├── config/       # Connexion DB
├── controllers/  # Logique métier (Task, User, Auth)
├── models/       # Schémas Mongoose
├── routes/       # Définition des endpoints API
├── services/     # Intégration IA (grok.js)
└── server.js     # Point d'entrée
```

---

_Backend codé avec cruauté et efficacité pour aider n'importe qui à faire n'importe quoi._
