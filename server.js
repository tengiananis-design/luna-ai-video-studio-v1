import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const MEDIA_DIR = path.join(__dirname, "media");

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(MEDIA_DIR, { recursive: true });

app.use(express.json({ limit: "2mb" }));
app.use(express.static(PUBLIC_DIR));
app.use("/media", express.static(MEDIA_DIR));

const jobs = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const makeId = () => crypto.randomUUID();

function need(name) {
  if (!process.env[name]) {
    throw new Error(`${name} is not configured`);
  }
}

/* =========================================================
   MAGIC HOUR
   ========================================================= */

async function magicHourCreate(prompt, seconds = 5) {
  need("MAGIC_HOUR_API_KEY");

  const response = await fetch(
    "https://api.magichour.ai/v1/text-to-video",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MAGIC_HOUR_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        end_seconds: seconds,
        aspect_ratio: "16:9",
        resolution: "480p",
        model: "ltx-2.3",
        style: {
          prompt
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `Magic Hour create ${response.status}: ${await response.text()}`
    );
  }

  return response.json();
}

async function magicHourWait(projectId, scene) {
  need("MAGIC_HOUR_API_KEY");

  for (let attempt = 0; attempt < 120; attempt++) {
    const response = await fetch(
      `https://api.magichour.ai/v1/video-projects/${projectId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MAGIC_HOUR_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Magic Hour status ${response.status}: ${await response.text()}`
      );
    }

    const data = await response.json();

    scene.providerStatus = data.status;

    if (data.status === "complete") {
      const url = data.downloads?.[0]?.url;

      if (!url) {
        throw new Error(
          "Magic Hour completed but returned no download URL"
        );
      }

      return url;
    }

    if (["error", "canceled"].includes(data.status)) {
      throw new Error(`Magic Hour ${data.status}`);
    }

    await sleep(15000);
  }

  throw new Error("Magic Hour timed out after 30 minutes");
}

async function downloadFile(url, outputPath) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Download failed ${response.status}`);
  }

  fs.writeFileSync(
    outputPath,
    Buffer.from(await response.arrayBuffer())
  );
}

/* =========================================================
   ELEVENLABS
   ========================================================= */

async function elevenTTS(text, outputPath) {
  if (!text) return null;

  need("ELEVENLABS_API_KEY");

  const voice =
    process.env.ELEVENLABS_VOICE_ID ||
    "pNInz6obpgDQGcFmaJgB";

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2"
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `ElevenLabs TTS ${response.status}: ${await response.text()}`
    );
  }

  fs.writeFileSync(
    outputPath,
    Buffer.from(await response.arrayBuffer())
  );

  return outputPath;
}

async function elevenSFX(prompt, outputPath) {
  need("ELEVENLABS_API_KEY");

  const response = await fetch(
    "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128",
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: prompt,
        model_id: "eleven_text_to_sound_v2"
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `ElevenLabs SFX ${response.status}: ${await response.text()}`
    );
  }

  fs.writeFileSync(
    outputPath,
    Buffer.from(await response.arrayBuffer())
  );

  return outputPath;
}

async function elevenMusic(
  prompt,
  outputPath,
  durationMs = 30000
) {
  need("ELEVENLABS_API_KEY");

  const response = await fetch(
    "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        music_length_ms: durationMs,
        model_id: "music_v2",
        force_instrumental: true
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `ElevenLabs Music ${response.status}: ${await response.text()}`
    );
  }

  fs.writeFileSync(
    outputPath,
    Buffer.from(await response.arrayBuffer())
  );

  return outputPath;
}

/* =========================================================
   FFMPEG
   ========================================================= */

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const process = spawn("ffmpeg", args, {
      stdio: ["ignore", "ignore", "pipe"]
    });

    let errorOutput = "";

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    process.on("error", (error) => {
      reject(
        new Error(
          `Unable to start ffmpeg. Make sure ffmpeg is installed. ${error.message}`
        )
      );
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(errorOutput.slice(-4000))
        );
      }
    });
  });
}

async function mixVideo(
  video,
  voice,
  sfx,
  music,
  output
) {
  const inputs = ["-i", video];
  const filters = [];
  const audioStreams = [];

  if (voice) inputs.push("-i", voice);
  if (sfx) inputs.push("-i", sfx);
  if (music) inputs.push("-i", music);

  let inputIndex = 0;

  if (voice) {
    inputIndex++;

    filters.push(
      `[${inputIndex}:a]volume=1.0[voice]`
    );

    audioStreams.push("[voice]");
  }

  if (sfx) {
    inputIndex++;

    filters.push(
      `[${inputIndex}:a]volume=0.45[sfx]`
    );

    audioStreams.push("[sfx]");
  }

  if (music) {
    inputIndex++;

    filters.push(
      `[${inputIndex}:a]volume=0.16[music]`
    );

    audioStreams.push("[music]");
  }

  const args = [...inputs];

  if (audioStreams.length > 0) {
    filters.push(
      `${audioStreams.join("")}amix=inputs=${audioStreams.length}:duration=first:dropout_transition=2[aout]`
    );

    args.push(
      "-filter_complex",
      filters.join(";"),
      "-map",
      "0:v",
      "-map",
      "[aout]",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-shortest"
    );
  } else {
    args.push(
      "-map",
      "0:v",
      "-c:v",
      "copy",
      "-an"
    );
  }

  args.push(
    "-y",
    output
  );

  await runFFmpeg(args);
}

async function concatVideos(files, output) {
  const listFile = path.join(
    MEDIA_DIR,
    `concat-${makeId()}.txt`
  );

  const listContent = files
    .map(
      (file) =>
        `file '${file.replace(/'/g, "'\\''")}'`
    )
    .join("\n");

  fs.writeFileSync(
    listFile,
    listContent
  );

  try {
    await runFFmpeg([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listFile,
      "-c",
      "copy",
      "-y",
      output
    ]);
  } finally {
    try {
      fs.unlinkSync(listFile);
    } catch {}
  }
}

/* =========================================================
   FALLBACK DEMO SCENES
   ========================================================= */

const fallbackScenes = [
  {
    title: "Mount Olympus",
    prompt:
      "Cinematic ancient Greek Mount Olympus above the clouds at dawn, enormous golden temples, divine mist, distant lightning, epic fantasy film, realistic live-action, sweeping camera movement, dramatic volumetric light.",
    sfx:
      "distant thunder and deep divine rumble"
  },

  {
    title: "Zeus Appears",
    prompt:
      "A majestic Zeus appears on a colossal marble throne high on Mount Olympus, powerful older Greek god with white beard, flowing white and gold robes, glowing lightning around him, cinematic close-up, realistic live-action fantasy film.",
    sfx:
      "powerful thunder crack and electric energy"
  },

  {
    title: "The Declaration",
    prompt:
      "Zeus rises and looks across Olympus with absolute authority, lightning forming in his hand, cinematic realistic live-action Greek mythology film, intense eyes, dramatic clouds and wind.",
    voice:
      "I am Zeus, king of Olympus. The heavens answer to my will."
  },

  {
    title: "The Storm",
    prompt:
      "Zeus raises his arm and unleashes a colossal storm over the ancient world, bolts of lightning across black clouds, mountains illuminated by thunder, epic cinematic realism, enormous scale, dynamic camera.",
    sfx:
      "massive thunderstorm, multiple lightning strikes, roaring wind"
  },

  {
    title: "The Mortal World",
    prompt:
      "Ancient Greek city below as storm clouds gather, mortals look toward the heavens in awe and fear, temples and torches in the rain, cinematic realistic live-action, dramatic lightning in the distance."
  },

  {
    title: "The Final Shot",
    prompt:
      "Zeus stands on Olympus above a sea of clouds holding a blazing lightning bolt, storm slowly calming behind him, golden sunrise breaking through, epic final cinematic shot, realistic live-action fantasy.",
    sfx:
      "final thunder roll fading into wind"
  }
];

/* =========================================================
   PLANNER → PRODUCTION BRIDGE
   ========================================================= */

function normalizeScenes(inputScenes) {
  if (!Array.isArray(inputScenes) || inputScenes.length === 0) {
    return fallbackScenes.map((scene) => ({
      ...scene
    }));
  }

  return inputScenes
    .map((scene, index) => {
      const title =
        scene.title ||
        scene.name ||
        `Scene ${index + 1}`;

      const prompt =
        scene.prompt ||
        scene.visualPrompt ||
        scene.generation?.prompt ||
        scene.description ||
        scene.action ||
        scene.text;

      if (!prompt) {
        return null;
      }

      return {
        id: scene.id || `scene-${index + 1}`,
        title,
        prompt: String(prompt),
        voice:
          scene.voice ||
          scene.narration ||
          scene.narrationText ||
          null,
        sfx:
          scene.sfx ||
          scene.soundEffect ||
          null,
        duration:
          Number(scene.duration) || 5,
        status: "queued",
        provider: null,
        providerStatus: null,
        projectId: null,
        file: null
      };
    })
    .filter(Boolean);
}

/* =========================================================
   PRODUCTION ENGINE
   ========================================================= */

async function runJob(job) {
  try {
    job.status = "running";
    job.startedAt = new Date().toISOString();

    const musicPath = path.join(
      MEDIA_DIR,
      `music-${job.id}.mp3`
    );

    /*
     * Music is optional.
     * If ElevenLabs music fails, video generation
     * continues exactly like the old engine.
     */

    try {
      job.music = "generating";

      await elevenMusic(
        "Epic cinematic ancient Greek mythology score, majestic and mysterious, deep orchestral drums, male choir texture without lyrics, brass, strings, divine thunder atmosphere, building tension and triumphant ending, instrumental only.",
        musicPath,
        Math.max(
          30000,
          job.scenes.length * 5000
        )
      );

      job.music = "ready";
    } catch (error) {
      job.music = "skipped";
      job.musicError = error.message;
    }

    const rendered = [];

    for (let i = 0; i < job.scenes.length; i++) {
      const scene = job.scenes[i];

      scene.status = "generating";
      scene.index = i + 1;
      scene.total = job.scenes.length;

      /*
       * The old working engine uses 5-second
       * Magic Hour clips. Preserve that behavior.
       */

      const seconds = 5;

      const project = await magicHourCreate(
        scene.prompt,
        seconds
      );

      scene.provider = "magic-hour";

      scene.projectId =
        project.id ||
        project.video_project_id ||
        project.project_id;

      if (!scene.projectId) {
        throw new Error(
          "Magic Hour returned no project ID"
        );
      }

      const videoUrl = await magicHourWait(
        scene.projectId,
        scene
      );

      const rawVideo = path.join(
        MEDIA_DIR,
        `${job.id}-scene-${i + 1}-raw.mp4`
      );

      await downloadFile(
        videoUrl,
        rawVideo
      );

      scene.status = "audio";

      let voice = null;
      let sfx = null;

      if (scene.voice) {
        voice = await elevenTTS(
          scene.voice,
          path.join(
            MEDIA_DIR,
            `${job.id}-scene-${i + 1}-voice.mp3`
          )
        );
      }

      if (scene.sfx) {
        sfx = await elevenSFX(
          scene.sfx,
          path.join(
            MEDIA_DIR,
            `${job.id}-scene-${i + 1}-sfx.mp3`
          )
        );
      }

      scene.status = "mixing";

      const finalVideo = path.join(
        MEDIA_DIR,
        `${job.id}-scene-${i + 1}.mp4`
      );

      await mixVideo(
        rawVideo,
        voice,
        sfx,
        job.music === "ready"
          ? musicPath
          : null,
        finalVideo
      );

      scene.status = "complete";

      scene.file =
        `/media/${path.basename(finalVideo)}`;

      rendered.push(finalVideo);
    }

    job.status = "assembling";

    const finalOutput = path.join(
      MEDIA_DIR,
      `${job.id}-final.mp4`
    );

    await concatVideos(
      rendered,
      finalOutput
    );

    job.status = "complete";

    job.final =
      `/media/${path.basename(finalOutput)}`;

    job.finishedAt =
      new Date().toISOString();

  } catch (error) {
    job.status = "error";

    job.error =
      error instanceof Error
        ? error.message
        : String(error);

    job.finishedAt =
      new Date().toISOString();

    console.error(
      `Job ${job.id} failed:`,
      error
    );
  }
}

/* =========================================================
   API
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    version: "11.0",
    service: "Luna AI Video Studio",
    engine: "v10-production",
    plannerBridge: true,
    providers: {
      magicHour: Boolean(
        process.env.MAGIC_HOUR_API_KEY
      ),
      elevenLabs: Boolean(
        process.env.ELEVENLABS_API_KEY
      ),
      ffmpeg: "required"
    }
  });
});

/*
 * Start production.
 *
 * The frontend can now send:
 *
 * {
 *   "scenes": [
 *     {
 *       "title": "Scene 1",
 *       "prompt": "...",
 *       "voice": "...",
 *       "sfx": "..."
 *     }
 *   ]
 * }
 *
 * If no scenes are supplied, the original
 * six-scene Zeus production is used.
 */

app.post(
  "/api/production/start",
  (req, res) => {
    try {
      const productionScenes =
        normalizeScenes(
          req.body?.scenes
        );

      if (
        !productionScenes.length
      ) {
        return res.status(400).json({
          error:
            "No production scenes available."
        });
      }

      const job = {
        id: makeId(),

        status: "queued",

        createdAt:
          new Date().toISOString(),

        music: "queued",

        scenes: productionScenes.map(
          (scene) => ({
            ...scene,
            status: "queued"
          })
        )
      };

      jobs.set(
        job.id,
        job
      );

      runJob(job);

      res.status(202).json({
        id: job.id,
        status: job.status,
        scenes: job.scenes.length
      });

    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : String(error)
      });
    }
  }
);

app.get(
  "/api/production/:id",
  (req, res) => {
    const job =
      jobs.get(
        req.params.id
      );

    if (!job) {
      return res.status(404).json({
        error: "Job not found"
      });
    }

    res.json(job);
  }
);

/* =========================================================
   SPA FALLBACK
   ========================================================= */

app.get("*", (req, res) => {
  const indexFile =
    path.join(
      PUBLIC_DIR,
      "index.html"
    );

  if (fs.existsSync(indexFile)) {
    return res.sendFile(
      indexFile
    );
  }

  res.status(404).send(
    "Luna AI Video Studio is running, but public/index.html is missing."
  );
});

/* =========================================================
   START
   ========================================================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Luna AI Video Studio v11 running on port ${PORT}`
    );
  }
);
