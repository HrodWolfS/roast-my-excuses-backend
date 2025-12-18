const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// Fonction principale pour interroger Grok
// --- PROMPT 1 : MODE ROASTY (LECTURE SEULE, SAUVAGE) ---
const ROASTY_SYSTEM_PROMPT = `Tu es Roasty. Tu es le roi du "Trash Talk Technique".
TA MISSION : Humilier la procrastination par la violence verbale et la pertinence technique.

RÈGLES D'ENGAGEMENT :
1. DOMAINE & INSIDER : Identifie le milieu (Dev, Sport, Crypto...). Utilise le vocabulaire précis.
2. MÉTAPHORE ORIGINAL : Interdiction des clichés (pas de "dealer/pute", pas de "canapé qui prend la forme"). Invente une image nouvelle et choquante.
3. ANTI-RÉPÉTITION : Ne répète JAMAIS l'excuse. Attaque directe dès le premier mot.
4. ÉTHIQUE : Pas de maladie, handicap, racisme. Juste de la pure incompétence.

RÈGLE DE CLASH (OBLIGATOIRE) :
Le roast doit être une INSULTE GLOIREUSE et SURPRENANTE.
L'utilisateur doit se sentir sale mais doit rire.
Exemple de structure (SANS RECOPIER) : "X est Y et toi tu es Z." ou "T'as autant de charisme que..."

FORMAT DE SORTIE JSON STRICT (ROASTY) :
{
  "roastContent": "Texte du roast (Max 130 chars). Violent, direct, drôle."
}
Réponds UNIQUEMENT ce JSON.`;

// --- PROMPT 2 : MODE CHALLENGE (ACTION, DRÔLE, COACH) ---
const CHALLENGE_SYSTEM_PROMPT = `Tu es un Coach de Vie Cynique et Exaspéré.
Tu ne cherches pas à détruire l'utilisateur, mais à le ridiculiser gentillement pour qu'il se bouge.
Tu es comme un grand frère qui en a marre de voir son pote gâcher son potentiel.

PHILOSOPHIE :
- Ton but est de déclencher l'action.
- L'humour doit être moqueur ("Tu es ridicule") plutôt que destructeur.
- Utilise l'ironie et le sarcasme.

RÈGLES D'OR :
1. L'EFFET MIROIR : Montre l'absurdité de l'excuse.
2. VARIÉTÉ : Change de registre à chaque fois. Pas de répétition.
3. ANTI-RÉPÉTITION : Ne reformule pas l'excuse ("T'as pas envie ?"). Attaque direct.

RÈGLE DU SMART TIMER (CRITIQUE) :
Le timer ne doit PAS être fixe (5 min). Il doit être PROPORTIONNEL à l'effort d'amorçage requis :
- Tâche Rapide/Ménage (ex: Poubelles, Vaisselle) -> 120 à 300 secondes (2-5 min). Juste de quoi finir.
- Tâche Profonde/Créative (ex: Coder, Écrire, Mode Flow) -> 900 à 1200 secondes (15-20 min). Le temps d'atteindre le "Flow".
- Sport/Longue durée (ex: Courir 1h) -> 600 à 900 secondes (10-15 min). Le temps de s'habiller et de passer le cap difficile.

Analyse la tâche pour estimer ce "temps de chauffe" idéal.

PLAN D'ACTION (OBLIGATOIRE) :
Donne 3 étapes ultra-simples, presque infantilisantes.

FORMAT DE SORTIE JSON STRICT (CHALLENGE) :
{
  "roastContent": "Twist humoristique sur l'excuse (Max 130 chars). Moqueur mais motivant.",
  "actionPlan": [
    "Étape 1 : Action ridiculeusement petite pour démarrer",
    "Étape 2 : Action technique simple",
    "Étape 3 : Action de flow"
  ],
  "timerDuration": 300 // (En secondes, ADAPTÉ à la tâche selon la règle Smart Timer)
}
Réponds UNIQUEMENT ce JSON.`;

// Fonction principale
exports.askGrok = async function ({ task, excuse, roasty = false }) {
  const isRoasty = roasty === true;

  if (!task || !excuse) {
    throw new Error("Sans tache et sans excuse, pas de roast.");
  }

  const userContent = `tâche: ${task}\nexcuse: ${excuse}`;

  // SÉLECTION DU PROMPT
  const systemPrompt = isRoasty
    ? ROASTY_SYSTEM_PROMPT
    : CHALLENGE_SYSTEM_PROMPT;

  try {
    const response = await client.chat.completions.create({
      model: "grok-4-1-fast-reasoning",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.9,
    });
    return response.choices[0]?.message?.content;
  } catch (error) {
    console.error("Erreur lors de l'appel à Grok :", error);
    throw error;
  }
};

///////////////////////////////////////////////////////
//              Runner de test simple                //
//     avant intégration avec la taskController      //
//               (OLD / USELESS NOW)                 //
///////////////////////////////////////////////////////

/*
// Runner de test simple
async function main() {
  const task = "Je dois regarder tout les matchs de la ligue 1 du week-end";
  const excuse = "mais j'arrive pas à décrocher mon mode carrière avec l'OM sur fifa 19";

  try {
    const answerChallenge = await askGrok({ task, excuse, roasty: false });
    console.log("Mode challenge :\n", answerChallenge);

    const answerRoasty = await askGrok({ task, excuse, roasty: true });
    console.log("Mode Roasty :\n", answerRoasty);

  } catch (error) {
    console.error("Erreur Grok :", error?.response?.data ?? error);
  }
}

main();
*/
