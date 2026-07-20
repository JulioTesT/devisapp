const GROQ_API_KEY = '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'; 
const MODELE = 'llama-3.3-70b-versatile';

let historique = [];

function getProfilUtilisateur() {
  return {
    nom: localStorage.getItem('monNom') || '',
    siret: localStorage.getItem('monSiret') || '',
    adresse: localStorage.getItem('monAdresse') || '',
    email: localStorage.getItem('monEmail') || '',
    tel: localStorage.getItem('monTel') || ''
  };
}

function getSystemPrompt() {
  const profil = getProfilUtilisateur();
  return `Tu es un assistant spécialisé pour les auto-entrepreneurs français. Tu as deux rôles :

1. GÉNÉRER DES DEVIS : Quand l'utilisateur décrit une prestation, tu génères les lignes du devis de façon professionnelle avec le bon jargon métier. Tu réponds UNIQUEMENT avec un JSON dans ce format exact :
{"action":"devis","lignes":[{"description":"...","quantite":1,"prixUnitaire":100}]}

2. RÉPONDRE AUX QUESTIONS : Sur la réglementation, le droit, la comptabilité auto-entrepreneur. Tu réponds de façon claire et précise en français.

Informations du prestataire à utiliser dans les devis :
- Nom : ${profil.nom || 'Non renseigné'}
- SIRET : ${profil.siret || 'Non renseigné'}
- Adresse : ${profil.adresse || 'Non renseignée'}

Règles importantes :
- Toujours utiliser un vocabulaire professionnel adapté au métier
- Les prix proposés doivent être cohérents avec le marché français
- Pour les questions juridiques, toujours préciser de consulter un professionnel pour les cas complexes
- Tu réponds TOUJOURS en français`;
}

async function envoyerMessage(messageUtilisateur) {
  historique.push({ role: 'user', content: messageUtilisateur });

  const reponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODELE,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        ...historique
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  const data = await reponse.json();
  const contenu = data.choices[0].message.content;
  historique.push({ role: 'assistant', content: contenu });
  return contenu;
}

function traiterReponse(contenu) {
  try {
    const json = JSON.parse(contenu);
    if (json.action === 'devis') {
      return { type: 'devis', lignes: json.lignes };
    }
  } catch (e) {
    return { type: 'texte', contenu: contenu };
  }
  return { type: 'texte', contenu: contenu };
}