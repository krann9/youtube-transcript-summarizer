import { YoutubeTranscript } from 'youtube-transcript';

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
        const { url } = req.body;

      if (!url) {
              return res.status(400).json({ error: 'YouTube URL is required' });
      }

      // Extract video ID from YouTube URL
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        if (!videoIdMatch) {
                return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

      const videoId = videoIdMatch[1];

      // Get transcript
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        const transcriptText = transcript.map(entry => entry.text).join(' ');

      return res.status(200).json({ transcript: transcriptText });
  } catch (error) {
        console.error('Error fetching transcript:', error);
        return res.status(500).json({ 
                                          error: error.message || 'Failed to fetch transcript. The video may not have captions available.'
        });
  }
}
