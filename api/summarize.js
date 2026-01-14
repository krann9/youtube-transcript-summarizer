export default async function handler(req, res) {
      // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      res.setHeader(
              'Access-Control-Allow-Headers',
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
            );

  if (req.method === 'OPTIONS') {
          res.status(200).end();
          return;
  }

  if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
          const { transcript } = req.body;

        if (!transcript) {
                  return res.status(400).json({ error: 'Transcript is required' });
        }

        const apiKey = process.env.PERPLEXITY_API_KEY;
          if (!apiKey) {
                    return res.status(500).json({ 
                                                        error: 'API key not configured. Please add your Perplexity API key to Vercel environment variables.'
                    });
          }

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
                  method: 'POST',
                  headers: {
                              'Authorization': `Bearer ${apiKey}`,
                              'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                              model: 'llama-2-7b-chat',
                              messages: [
                                  {
                                                  role: 'user',
                                                  content: `Please provide a concise summary of the following transcript. Focus on the main points and key information:\n\n${transcript}`
                                  }
                                          ],
                              max_tokens: 500,
                              temperature: 0.7,
                  })
        });

        if (!response.ok) {
                  const error = await response.json();
                  throw new Error(error.error?.message || 'Perplexity API request failed');
        }

        const data = await response.json();
          const summary = data.choices[0].message.content;

        return res.status(200).json({ summary });
  } catch (error) {
          console.error('Error generating summary:', error);
          return res.status(500).json({ 
                                            error: error.message || 'Failed to generate summary'
          });
  }
}
