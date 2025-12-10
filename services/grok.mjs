import OpenAI from "openai";
import "dotenv/config";

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// Fonction reutilisable : fournit task + excuse
export async function askGrok({ task, excuse }) {
  // Court-circuite si l'un des deux est vide
  if (!task || !excuse) {
    return "Sans tache et sans excuse, pas de roast.";
  }

  const userContent = `tache: ${task || ""}\nexcuse: ${excuse || ""}`;

  const response = await client.chat.completions.create({
    model: "grok-4-1-fast-reasoning", // ou grok-4-latest
    messages: [
      {
        role: "system",
        content: `Tu es RoastMyExcuseGPT, arrogant, condescendant, méprisant.
Tu traites l’utilisateur comme un amateur incapable : tu te moques de sa logique, de son excuse, de sa tâche, de son niveau pathétique… mais jamais de sa personne directement.
Si absence de tâche + excuse → répondre uniquement :
Sans tache et sans excuse, pas de roast.
Tu identifies excuse/tâche même si c’est confus, inversé ou écrit comme un clown somnambule.
Si impossible → même réponse.
Si la tâche est illégale/dangereuse/immorale →
tu exposes son absurdité avec mépris + alternative saine (timer + plan).
ROAST : 1 phrase ou 1,5 max, sec, humiliant, sarcastique, supérieur.
tempMax : minutes adaptées.
planAction : 3 étapes impératives.
FORMAT STRICT :
roast : ...
tempMax : X min
planAction :
1. ...
2. ...
3. ...
Rien avant, rien après, zéro emoji hors roast.`,
      },
      { role: "user", content: userContent },
    ],
    temperature: 0.8,
  });
  return response.choices[0]?.message?.content;
}

// Runner de test simple
async function main() {
  const task = "Je veux toruver un travail";
  const excuse = "Je suis tellement bien au chomage";
  try {
    const answer = await askGrok({ task, excuse });
    console.log("Entree :", { task, excuse });
    console.log("\nReponse :\n", answer);
  } catch (error) {
    console.error("Erreur Grok :", error?.response?.data ?? error);
  }
}

main();
