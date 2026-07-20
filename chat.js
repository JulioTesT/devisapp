const MODELE = 'llama-3.3-70b-versatile';
let historique = [];

function getProfilUtilisateur() {
  return {
    nom: localStorage.getItem('p_nom') || '',
    metier: localStorage.getItem('p_metier') || '',
    siret: localStorage.getItem('p_siret') || '',
    region: localStorage.getItem('p_region') || '',
    adresse: localStorage.getItem('p_adresse') || '',
    email: localStorage.getItem('p_email') || '',
    tel: localStorage.getItem('p_tel') || '',
    urssaf: localStorage.getItem('p_urssaf') || '',
  };
}

function getSystemPrompt() {
  const p = getProfilUtilisateur();
  const profilInfo = p.nom ? `
Informations du prestataire :
- Nom : ${p.nom}
- Métier : ${p.metier || 'Non renseigné'}
- Région : ${p.region || 'Non renseignée'}
- SIRET : ${p.siret}
` : 'Profil non renseigné.';

  return `Tu es un assistant spécialisé pour les auto-entrepreneurs français. Tu as deux rôles :

1. GÉNÉRER DES DEVIS : Quand l'utilisateur décrit une prestation, génère les lignes du devis avec le bon jargon métier adapté à "${p.metier || 'auto-entrepreneur'}". Réponds UNIQUEMENT avec un JSON :
{"action":"devis","lignes":[{"description":"...","quantite":1,"prixUnitaire":100}]}
Les prix doivent être cohérents avec le marché français pour ce métier et cette région.
IMPORTANT : prixUnitaire est toujours un nombre sans zéro initial (ex: 50 pas 050).

2. RÉPONDRE AUX QUESTIONS : Sur la réglementation, le droit, la comptabilité auto-entrepreneur.

${profilInfo}

Règles :
- Vocabulaire professionnel adapté au métier "${p.metier || 'auto-entrepreneur'}"
- Pour les questions juridiques, précise de consulter un professionnel pour les cas complexes
- Réponds TOUJOURS en français
- Si tu détectes une question sur la réglementation locale (${p.region || 'France'}), sois précis sur les spécificités régionales`;
}

async function envoyerMessage(messageUtilisateur) {
  historique.push({ role: 'user', content: messageUtilisateur });

  const reponse = await fetch('/api/api-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: historique,
      systemPrompt: getSystemPrompt()
    })
  });

  const data = await reponse.json();

  if (!reponse.ok) {
    throw new Error(data.error || `Erreur ${reponse.status}`);
  }

  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    throw new Error('Réponse inattendue : ' + JSON.stringify(data));
  }

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