# 🧪 Guide des Tests Backend

Salut l'équipe ! Pour garder le projet propre, nous suivons une règle simple : **Un fichier de code = Un fichier de test**.

Il n'y a pas de dossier personnel. Tout le monde contribue au même endroit.

## 📂 Où créer vos tests ?

Tous les tests se trouvent dans le dossier `tests/`. Nous suivons la structure du code source.

### Si vous testez un Contrôleur (Logique métier)
Rangez votre fichier dans : `tests/controllers/`

**Exemples :**
* Pierre a codé l'Auth 👉 Il bosse dans `authController.test.js`
* Enzo code openAiService 👉 Il crée `grok.test.mjs`
* Rodolphe code le Feed 👉 Il crée `feedController.test.js`

> **Convention de nommage :** Le nom du fichier de test doit être exactement le nom du fichier testé + `.test.js`.

---

## 🚀 Comment lancer les tests ?

### 1. Lancer tous les tests (Pour vérifier avant de push)
```bash
npm test