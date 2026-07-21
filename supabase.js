const SUPABASE_URL = 'https://zxqhhghxplwvggvxsaza.supabase.co';
const SUPABASE_KEY = 'sb_publishable_I5Mb273YBQEs8H6aV3MZnA_wwKhvNGd';
 
async function supabaseFetch(endpoint, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    },
    ...options
  });
  return res.json();
}
 
async function sauvegarderDevis(devisData) {
  const existants = await supabaseFetch(`devis?numero=eq.${encodeURIComponent(devisData.numero)}`);
  if (existants && existants.length > 0) {
    const confirme = await afficherConfirmation(
      '⚠️ Devis existant',
      `Le devis <b>${devisData.numero}</b> existe déjà.<br><br>La version actuelle sera <b>remplacée définitivement</b>. Continuer ?`,
      'Remplacer', 'Annuler'
    );
    if (!confirme) return null;
    return await supabaseFetch(`devis?numero=eq.${encodeURIComponent(devisData.numero)}`, {
      method: 'PATCH',
      body: JSON.stringify(devisData)
    });
  }
  return await supabaseFetch('devis', {
    method: 'POST',
    body: JSON.stringify(devisData)
  });
}
 
async function chargerDevis() {
  return await supabaseFetch('devis?order=created_at.desc');
}
 
async function supprimerDevis(id) {
  return await supabaseFetch(`devis?id=eq.${id}`, { method: 'DELETE' });
}
 
function afficherConfirmation(titre, message, btnOui, btnNon) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    `;
    overlay.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 28px;
        max-width: 360px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">
        <h3 style="font-size: 16px; color: #1a1a2e; margin-bottom: 12px;">${titre}</h3>
        <p style="font-size: 14px; color: #555; margin-bottom: 24px; line-height: 1.6;">${message}</p>
        <div style="display: flex; gap: 8px;">
          <button id="btn-non" style="flex:1; padding: 11px; background: #f0f2f5;
            color: #1a1a2e; border: 1px solid #ddd; border-radius: 8px;
            font-size: 14px; cursor: pointer;">${btnNon}</button>
          <button id="btn-oui" style="flex:1; padding: 11px; background: #e05252;
            color: white; border: none; border-radius: 8px;
            font-size: 14px; cursor: pointer; font-weight: bold;">${btnOui}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('btn-oui').onclick = () => { document.body.removeChild(overlay); resolve(true); };
    document.getElementById('btn-non').onclick = () => { document.body.removeChild(overlay); resolve(false); };
  });
}