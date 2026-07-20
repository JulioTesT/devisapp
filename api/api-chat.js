export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, systemPrompt } = req.body;

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'Clé GROQ_API_KEY manquante' });
  }

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
        max_tokens: 1024,
      })
    });

    const text = await response.text();

    if (!text) {
      return res.status(500).json({ error: 'Réponse vide de Groq' });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      return res.status(500).json({ error: 'Réponse Groq non-JSON : ' + text.substring(0, 200) });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erreur Groq ' + response.status });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}