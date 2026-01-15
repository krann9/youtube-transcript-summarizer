import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import cors from "cors";
import { getTranscript } from "youtube-transcript-api";
import axios from "axios";
import xml2js from "xml2js";

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

// Get captions using YouTube API
async function getCaptions(videoId) {
      try {
              // Get video captions list using YouTube API
        const response = await axios.get(
                  "https://www.googleapis.com/youtube/v3/captions",
            {
                        params: {
                                      videoId: videoId,
                                      part: "snippet",
                                      key: process.env.YOUTUBE_API_KEY,
                        },
            }
                );

        const captions = response.data.items;
              if (!captions || captions.length === 0) {
                        throw new Error("No captions found for this video");
              }

        // Prefer English captions, fallback to any available caption
        let selectedCaption = captions.find(
                  (c) => c.snippet.language === "en" || c.snippet.language.startsWith("en")
                ) || captions[0];

        // Download the caption track
        const captionUrl = `https://www.googleapis.com/youtube/v3/captions/${selectedCaption.id}`;
              const captionResponse = await axios.get(captionUrl, {
                        params: {
                                    key: process.env.YOUTUBE_API_KEY,
                                    tfmt: "vtt",
                        },
                        headers: {
                                    "Accept-Encoding": "gzip, deflate",
                        },
              });

        // Parse VTT format and extract text
        const vttContent = captionResponse.data;
              const lines = vttContent.split("\n");
              const transcript = lines
                .filter((line) => {
                            return (
                                          line.trim() &&
                                          !line.includes("-->") &&
                                          !line.includes("WEBVTT") &&
                                          !line.includes("NOTE")
                                        );
                })
                .join(" ");

        return transcript;
      } catch (error) {
              console.log(
                        "⚠️ YouTube API captions not available, falling back to youtube-transcript-api..."
                      );
              throw error;
      }
}

// Transcript endpoint with YouTube API + fallback
app.post("/api/transcript", async (req, res) => {
      const { url } = req.body;

           if (!url) {
                   return res.status(400).json({ error: "URL is required" });
           }

           const videoId = extractVideoId(url);
      if (!videoId) {
              return res.status(400).json({ error: "Invalid YouTube URL" });
      }

           let transcript = null;

           try {
                   // Try YouTube API first (gets auto-generated captions)
        try {
                  console.log("📡 Attempting to get captions via YouTube API...");
                  transcript = await getCaptions(videoId);
                  console.log("✅ Transcript retrieved from YouTube API");
        } catch (apiError) {
                  console.log("⚠️ YouTube API method failed, trying youtube-transcript-api...");

                     // Fallback: Use youtube-transcript-api library
                     try {
                                 const transcriptData = await getTranscript(videoId);
                                 transcript = transcriptData.map((item) => item.text).join(" ");
                                 console.log("✅ Transcript retrieved from youtube-transcript-api");
                     } catch (fallbackError) {
                                 // Check if transcript is disabled
                    if (
                                  fallbackError.name === "YoutubeTranscriptDisabledError" ||
                                  fallbackError.message.includes("Transcript is disabled") ||
                                  fallbackError.message.includes("Could not retrieve")
                                ) {
                                  console.log(
                                                  "⚠️ YouTube transcript disabled for this video"
                                                );
                                  return res.status(403).json({
                                                  error: "Transcript not available",
                                                  message:
                                                                    "The creator of this video has disabled transcripts and auto-generated captions are not available. Please contact them to enable captions.",
                                                  videoId: videoId,
                                  });
                    }
                                 throw fallbackError;
                     }
        }

        if (!transcript) {
                  return res.status(500).json({
                              error: "Failed to retrieve transcript",
                              message: "Could not extract transcript content",
                  });
        }

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
