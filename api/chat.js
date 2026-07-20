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
        max_tokens: 1024,
        tools: [{
          type: 'function',
          function: {
            name: 'web_search',
            description: 'Recherche des informations actuelles sur internet',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'La requête de recherche' }
              },
              required: ['query']
            }
          }
        }],
        tool_choice: 'auto'
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}