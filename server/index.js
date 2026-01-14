const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Anthropic = require('@anthropic-ai/sdk').default;
const { getTranscript } = require('youtube-transcript-api');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper function to extract video ID from YouTube URL
function extractVideoId(url) {
    const patterns = [
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
          /([a-zA-Z0-9_-]{11})/
        ];

  for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
  }
    return null;
}

// API endpoint to get transcript
app.post('/api/transcript', async (req, res) => {
    try {
          const { url } = req.body;

      if (!url) {
              return res.status(400).json({ error: 'YouTube URL is required' });
      }

      const videoId = extractVideoId(url);
          if (!videoId) {
                  return res.status(400).json({ error: 'Invalid YouTube URL' });
          }

      const transcript = await getTranscript(videoId);
          const fullText = transcript.map(item => item.text).join(' ');

      res.json({ transcript: fullText, success: true });
    } catch (error) {
          console.error('Transcript error:', error.message);
          res.status(500).json({ error: 'Failed to retrieve transcript' });
    }
});

// API endpoint to summarize transcript
app.post('/api/summarize', async (req, res) => {
    try {
          const { transcript } = req.body;

      if (!transcript) {
              return res.status(400).json({ error: 'Transcript is required' });
      }

      if (!process.env.ANTHROPIC_API_KEY) {
              return res.status(500).json({ error: 'API key not configured' });
      }

      const message = await client.messages.create({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 1024,
              messages: [
                {
                            role: 'user',
                            content: `Please provide a concise summary of the following transcript:\n\n${transcript}`
                }
                      ]
      });

      const summary = message.content[0].type === 'text' ? message.content[0].text : '';
          res.json({ summary, success: true });
    } catch (error) {
          console.error('Summarization error:', error.message);
          res.status(500).json({ error: 'Failed to summarize transcript' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
