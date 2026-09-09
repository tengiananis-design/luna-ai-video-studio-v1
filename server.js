import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { createProject } from "./engine/director.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "Luna AI Video Studio", version: "1.0.0" });
});

app.post("/api/create-project", (req, res) => {
  try {
    const { topic, duration, style, mode } = req.body || {};

    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ error: "Please enter a video idea." });
    }

    const project = createProject({
      topic: String(topic).trim(),
      duration: Number(duration) || 30,
      style: style || "Cinematic",
      mode: mode || "Cinematic"
    });

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Project creation failed." });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Luna AI Video Studio v1 running on port ${PORT}`);
});
