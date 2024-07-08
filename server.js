const express = require("express");
const { SpeechClient } = require("@google-cloud/speech");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

const client = new SpeechClient();

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
    res.status(500).send("Error processing audio file");
  } finally {
    // Clean up the uploaded file
    fs.unlinkSync(audioFilePath);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
