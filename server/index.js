import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import cors from "cors";
import { getTranscript } from "youtube-transcript-api";
import speech from "@google-cloud/speech";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const execAsync = promisify(exec);

// Initialize Perplexity client
const client = new Anthropic({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
});

// Initialize Google Cloud Speech-to-Text client
const speechClient = new speech.SpeechClient();

app.use(cors());
app.use(express.json());

// Extract video ID from YouTube URL
function extractVideoId(url) {
  const regex =
    /(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/|youtube\\.com\\/embed\\/)([^&\\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Function to download and convert audio to base64
async function getAudioAsBase64(videoId) {
  try {
    // Download audio using yt-dlp and convert to WAV
    const audioPath = path.join(__dirname, `temp_audio_${videoId}.wav`);

    // Use yt-dlp to download audio
    const command = `yt-dlp -f bestaudio --audio-format wav --audio-quality 192K -o "${audioPath}" "https://www.youtube.com/watch?v=${videoId}"`;

    await execAsync(command);

    // Read the audio file and convert to base64
    const audioBuffer = fs.readFileSync(audioPath);
    const base64Audio = audioBuffer.toString("base64");

    // Clean up temp file
    fs.unlinkSync(audioPath);

    return base64Audio;
  } catch (error) {
    console.error("Error downloading audio:", error);
    throw new Error("Failed to download audio from video");
  }
}

// Function to transcribe audio using Google Cloud Speech-to-Text
async function transcribeAudio(base64Audio) {
  try {
    const request = {
      audio: {
        content: base64Audio,
      },
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: 16000,
        languageCode: "en-US",
        enableAutomaticPunctuation: true,
        model: "latest_long",
        useEnhanced: true,
      },
    };

    const [operation] = await speechClient.longRunningRecognize(request);
    const [response] = await operation.promise();

    // Extract transcript from response
    const transcript = response.results
      .map((result) =>
        result.alternatives[0]
          ? result.alternatives[0].transcript
          : ""
      )
      .join(" ");

    return transcript;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio");
  }
}

// Transcript endpoint with fallback logic
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
    // Try to get transcript using youtube-transcript-api first
    try {
      const transcriptData = await getTranscript(videoId);
      transcript = transcriptData.map((item) => item.text).join(" ");
      console.log("✅ Transcript retrieved from YouTube API");
    } catch (youtubeError) {
      // Check if transcript is disabled
      if (
        youtubeError.message.includes("Transcript is disabled") ||
        youtubeError.message.includes("Could not retrieve")
      ) {
        console.log(
          "⚠️ YouTube transcript disabled, falling back to Speech-to-Text..."
        );

        // Fallback: Use Google Cloud Speech-to-Text
        console.log("📥 Downloading audio from video...");
        const base64Audio = await getAudioAsBase64(videoId);

        console.log("🎙️ Transcribing audio with Google Cloud Speech-to-Text...");
        transcript = await transcribeAudio(base64Audio);
      } else {
        throw youtubeError;
      }
    }

    if (!transcript) {
      return res
        .status(500)
        .json({ error: "Failed to retrieve or generate transcript" });
    }

    // Send to Perplexity for summarization
    console.log("📝 Sending to Perplexity for summarization...");
    const response = await client.messages.create({
      model: "sonar",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Please provide a concise summary of this YouTube video transcript:\\n\\n${transcript}`,
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
