
Supabase · JS
const SUPABASE_URL = 'https://zxqhhghxplwvggvxsaza.supabase.co';
const SUPABASE_KEY = 'sb_publishable_I5Mb273YBQEs8H6aV3MZnA_wwKhvNGd';
 
// ── TOKEN SESSION ──
let _session = null;
 
function getAuthHeaders() {
  const token = _session?.access_token || SUPABASE_KEY;
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}
 
// ── AUTH ──
async function authSignUp(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || data.msg);
  if (data.access_token) { _session = data; sauvegarderSession(data); }
  return data;
}
 
async function authSignIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || data.msg);
  _session = data;
  sauvegarderSession(data);
  return data;
}
 
async function authSignOut() {
  if (_session?.access_token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${_session.access_token}` }
    });
  }
  _session = null;
  localStorage.removeItem('sb_session');
}
 
async function refreshSession() {
  const saved = localStorage.getItem('sb_session');
  if (!saved) return null;
  const session = JSON.parse(saved);
  if (!session.refresh_token) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    const data = await res.json();
    if (data.access_token) { _session = data; sauvegarderSession(data); return data; }
  } catch(e) {}
  return null;
}
 
function sauvegarderSession(session) {
  localStorage.setItem('sb_session', JSON.stringify(session));
}
 
async function initAuth() {
  const saved = localStorage.getItem('sb_session');
  if (!saved) return null;
  const session = JSON.parse(saved);
  // Vérifier si le token est encore valide (exp en secondes)
  const exp = session.expires_at || 0;
  if (Date.now() / 1000 < exp - 60) {
    _session = session;
    return session;
  }
  // Tenter un refresh
  return await refreshSession();
}
 
function getUser() {
  return _session?.user || null;
}
 
function getUserId() {
  return _session?.user?.id || null;
}
 
// ── FETCH GÉNÉRIQUE ──
async function supabaseFetch(endpoint, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: { ...getAuthHeaders(), ...options.headers },
    ...options
  });
  if (res.status === 204) return [];
  return res.json();
}
 
// ── DEVIS ──
async function sauvegarderDevis(devisData) {
  const userId = getUserId();
  if (!userId) { showToast('❌ Connectez-vous pour sauvegarder'); return null; }
 
  const data = { ...devisData, user_id: userId };
  const existants = await supabaseFetch(
    `devis?numero=eq.${encodeURIComponent(data.numero)}&user_id=eq.${userId}`
  );
 
  if (existants && existants.length > 0) {
    const confirme = await afficherConfirmation(
      '⚠️ Devis existant',
      `Le devis <b>${data.numero}</b> existe déjà.<br><br>La version actuelle sera <b>remplacée définitivement</b>. Continuer ?`,
      'Remplacer', 'Annuler'
    );
    if (!confirme) return null;
    return await supabaseFetch(
      `devis?numero=eq.${encodeURIComponent(data.numero)}&user_id=eq.${userId}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    );
  }
  return await supabaseFetch('devis', { method: 'POST', body: JSON.stringify(data) });
}
 
async function chargerDevis() {
  const userId = getUserId();
  if (!userId) return [];
  return await supabaseFetch(`devis?user_id=eq.${userId}&order=created_at.desc`);
}
 
async function supprimerDevis(id) {
  return await supabaseFetch(`devis?id=eq.${id}`, { method: 'DELETE' });
}
 
// ── PROFIL CLOUD ──
async function sauvegarderProfilCloud(data) {
  const userId = getUserId();
  if (!userId) return;
  return await supabaseFetch('profil', {
    method: 'POST',
    headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ user_id: userId, data, updated_at: new Date().toISOString() })
  });
}
 
async function chargerProfilCloud() {
  const userId = getUserId();
  if (!userId) return null;
  const rows = await supabaseFetch(`profil?user_id=eq.${userId}&limit=1`);
  if (rows && rows.length > 0) return rows[0].data;
  return null;
}
 
// ── CONFIRMATION ──
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