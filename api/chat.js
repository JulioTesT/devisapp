
/
DevisApp
DevisApp
Création d'une appli pc/mobile dans le but de faciliter la création et la gestion de devis

Vous avez utilisé 90 % de votre limite de session.
Obtenir plus d'utilisation








Récents
Prévisualisation du devis avant PDF
il y a 7 minutes
Instructions
Tu m'aides à développer DevisApp, une PWA de génération de devis pour auto-entrepreneurs. Stack technique : - HTML/CSS/JS vanilla (pas de framework) - Supabase pour la base de données - Groq API (Llama 3.3) pour l'IA via fonction serverless Vercel - jsPDF pour la génération PDF - Déployé sur Vercel, code sur GitHub (JulioTesT/devisapp) URLs : - Production : devisapp-khaki.vercel.app - GitHub : github.com/JulioTesT/devisapp Architecture : - Version PC : 3 colonnes (Historique | Formulaire+Profil | Chat IA) - Version mobile : 4 onglets (Historique | Devis | Profil | Assistant) - Détection automatique via CSS media query 768px Fonctionnalités existantes : - Profil entrepreneur (localStorage) - Formulaire devis avec multi-lignes - Génération PDF (4 designs : classique, moderne, minimaliste, corporate) - Couleur personnalisable + import logo - Sauvegarde cloud Supabase - Historique avec suppression multi-sélection - Numérotation automatique des devis - Chat IA contextualisé au profil - Clé API sécurisée via Vercel Environment Variables Règles : - Toujours donner le code complet quand on modifie index.html - Procédure de déploiement : upload fichiers sur GitHub → Vercel redéploie automatiquement - Ne jamais mettre de clé API dans le code - Répondre en français, réponses courtes et directes

Mémoire
Vous uniquement
La mémoire du projet s'affichera ici après quelques conversations.

Contexte
2 % de la capacité du projet utilisée

api
1 élément


index.html
1 223 lignes

html



supabase.js
72 lignes

js



chat.js (racine)
66 lignes

text


Contexte
4 éléments

Rechercher des fichiers

api

chat.js

chat.js (racine)

index.html

supabase.js
chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { messages, systemPrompt } = req.body;
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
