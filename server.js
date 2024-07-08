const express = require("express");
const { SpeechClient } = require("@google-cloud/speech");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Parse the credentials JSON from the environment variable
let CREDENTIALS;

try {
  CREDENTIALS = JSON.parse(process.env.CREDENTIALS);
} catch (error) {
  console.error("Error parsing CREDENTIALS:", error);
  process.exit(1); // Exit the process if credentials are invalid
}

const client = new SpeechClient({
  credentials: CREDENTIALS,
});

// Enable CORS
app.use(cors());

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });

app.use(express.json());

app.post("/speech-to-text", upload.single("audio"), async (req, res) => {
  const audioFilePath = path.join(__dirname, req.file.path);

  const audio = {
    content: fs.readFileSync(audioFilePath).toString("base64"),
  };

  const config = {
    encoding: "LINEAR16",
    sampleRateHertz: 16000,
    languageCode: "en-US",
  };

  const request = {
    audio: audio,
    config: config,
  };

  try {
    const [response] = await client.recognize(request);
    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join("\n");
    res.json({ transcription: transcription });
  } catch (error) {
    console.error("Error during speech recognition:", error); // Log the error details
    res.status(500).send("Error processing audio file");
  } finally {
    // Clean up the uploaded file
    fs.unlinkSync(audioFilePath);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
