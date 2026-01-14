import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [url, setUrl] = useState('');
    const [transcript, setTranscript] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

  const handleGetTranscript = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setTranscript('');
        setSummary('');

        try {
                const response = await axios.post('/api/transcript', { url });
                setTranscript(response.data.transcript);
        } catch (err) {
                setError(err.response?.data?.error || 'Failed to get transcript');
        } finally {
                setLoading(false);
        }
  };

  const handleSummarize = async () => {
        setLoading(true);
        setError('');

        try {
                const response = await axios.post('/api/summarize', { transcript });
                setSummary(response.data.summary);
        } catch (err) {
                setError(err.response?.data?.error || 'Failed to summarize');
        } finally {
                setLoading(false);
        }
  };

  return (
        <div className="App">
          <div className="container">
            <header className="header">
              <h1>🎬 YouTube Transcript Summarizer</h1>
            <p>Paste a YouTube URL and get instant transcripts and AI summaries</p>
    </header>

        <form onSubmit={handleGetTranscript} className="form">
              <div className="input-group">
                <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube URL..."
                className="url-input"
                disabled={loading}
              />
                              <button type="submit" className="btn btn-primary" disabled={loading || !url}>
{loading ? 'Loading...' : 'Get Transcript'}
</button>
  </div>
  </form>

{error && <div className="error-message">{error}</div>}

 {transcript && (
             <div className="content-area">
               <div className="section">
                 <div className="section-header">
                   <h2>📝 Transcript</h2>
   </div>
                <div className="transcript-box">
                   <p>{transcript}</p>
   </div>
                <button onClick={handleSummarize} className="btn btn-secondary" disabled={loading}>
 {loading ? 'Summarizing...' : 'Generate Summary'}
 </button>
   </div>

 {summary && (
                 <div className="section">
                   <div className="section-header">
                     <h2>✨ AI Summary</h2>
   </div>
                  <div className="summary-box">
                     <p>{summary}</p>
   </div>
   </div>
              )}
 </div>
         )}

{!transcript && !error && (
            <div className="empty-state">
              <p>👆 Start by pasting a YouTube URL</p>
  </div>
         )}
</div>
  </div>
  );
}

export default App;
