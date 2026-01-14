import Anthropic from '@anthropic-ai/sdk';

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

      const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
                return res.status(500).json({ 
                                                    error: 'API key not configured. Please add your Anthropic API key to Vercel environment variables.'
                });
        }

      const client = new Anthropic({ apiKey });

      const message = await client.messages.create({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 1024,
              messages: [
                {
                            role: 'user',
                            content: `Please provide a concise summary of the following transcript. Focus on the main points and key information:\n\n${transcript}`
                }
                      ]
      });

      const summary = message.content[0].type === 'text' ? message.content[0].text : '';

      return res.status(200).json({ summary });
  } catch (error) {
        console.error('Error generating summary:', error);
        return res.status(500).json({ 
                                          error: error.message || 'Failed to generate summary'
        });
  }
}
