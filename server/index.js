import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import cors from "cors";
import { getTranscript } from "youtube-transcript-api";

const app = express();

// Initialize Perplexity client
const client = new Anthropic({
    apiKey: process.env.PERPLEXITY_API_KEY,
    baseURL: "https://api.perplexity.ai",
});

app.use(cors());
app.use(express.json());

// Extract video ID from YouTube URL
function extractVideoId(url) {
    const regex =
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Transcript endpoint with simple error handling
app.post("/api/transcript", async (req, res) => {
    const { url } = req.body;

           if (!url) {
                 return res.status(400).json({ error: "URL is required" });
           }

           const videoId = extractVideoId(url);
    if (!videoId) {
          return res.status(400).json({ error: "Invalid YouTube URL" });
    }

           try {
                 // Try to get transcript using youtube-transcript-api
      const transcriptData = await getTranscript(videoId);
                 const transcript = transcriptData.map((item) => item.text).join(" ");

      console.log("✅ Transcript retrieved from YouTube API");

      // Send to Perplexity for summarization
      console.log("📝 Sending to Perplexity for summarization...");
                 const response = await client.messages.create({
                         model: "sonar",
                         max_tokens: 1024,
                         messages: [
                           {
                                       role: "user",
                                       content: `Please provide a concise summary of this YouTube video transcript:\n\n${transcript}`,
                           },
                                 ],
                 });

      const summary =
              response.content[0].type === "text" ? response.content[0].text : "";

      return res.json({
              transcript,
              summary,
              videoId,
      });
           } catch (error) {
                 // Check if transcript is disabled
      if (
              error.name === "YoutubeTranscriptDisabledError" ||
              error.message.includes("Transcript is disabled") ||
              error.message.includes("Could not retrieve")
            ) {
              console.log(
                        "⚠️ YouTube transcript disabled for this video"
                      );
              return res.status(403).json({
                        error: "Transcript not available",
                        message:
                                    "The creator of this video has disabled transcripts. Please contact them to enable transcripts, or try another video.",
                        videoId: videoId,
              });
      }

      // Handle other errors
      console.error("Error processing transcript:", error);
                 return res.status(500).json({
                         error: "Failed to process transcript",
                         details: error.message,
                 });
           }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
