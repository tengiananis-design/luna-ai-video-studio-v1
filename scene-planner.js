```javascript
export function planScenes({ story, duration, style }) {
  const total = Math.max(10, Number(duration) || 30);
  const beats = Array.isArray(story?.beats) ? story.beats : [];

  const proportions = buildProportions(beats.length);

  let cursor = 0;

  return beats.map((beat, index) => {
    const isLast = index === beats.length - 1;

    const sceneDuration = isLast
      ? Number(Math.max(0.1, total - cursor).toFixed(2))
      : Number((total * proportions[index]).toFixed(2));

    const analysis = story.analysis || {};

    const scene = {
      id: `scene-${String(index + 1).padStart(2, "0")}`,

      purpose: beat.type,

      start: Number(cursor.toFixed(2)),

      end: Number(
        (cursor + sceneDuration).toFixed(2)
      ),

      duration: sceneDuration,

      visual: buildVisual({
        beat,
        analysis,
        style
      }),

      camera: cameraFor({
        type: beat.type,
        analysis
      }),

      movement: movementFor({
        type: beat.type,
        analysis
      }),

      lighting: lightingFor({
        type: beat.type,
        analysis
      }),

      mood: moodFor({
        type: beat.type,
        analysis
      }),

      style,

      // New Story Engine data
      prompt: buildGenerationPrompt({
        beat,
        analysis,
        style
      }),

      generation: {
        method: "AUTO",
        status: "READY",
        attempts: 0,
        provider: null,
        videoPath: null
      }
    };

    cursor += sceneDuration;

    return scene;
  });
}


/*
|--------------------------------------------------------------------------
| TIMING
|--------------------------------------------------------------------------
*/

function buildProportions(count) {
  const defaults = [0.14, 0.18, 0.18, 0.18, 0.20, 0.12];

  if (count <= 0) {
    return [];
  }

  if (count === 6) {
    return defaults;
  }

  const value = 1 / count;

  return Array.from(
    { length: count },
    () => value
  );
}


/*
|--------------------------------------------------------------------------
| VISUAL DIRECTOR
|--------------------------------------------------------------------------
*/

function buildVisual({ beat, analysis, style }) {
  const subject = analysis.subject || "the main subject";

  const base = {
    HOOK:
      `A striking opening image centered on ${subject}, immediately creating curiosity.`,

    SETUP:
      `A clear establishing shot introducing ${subject}, the environment, and the current situation.`,

    ESCALATION:
      `A progressively more intense visual showing the pressure, danger, or conflict surrounding ${subject}.`,

    TURNING_POINT:
      `A dramatic visual reveal that changes the situation for ${subject}.`,

    CLIMAX:
      `The largest and most emotionally powerful visual moment involving ${subject}.`,

    PAYOFF:
      `A memorable final image showing the consequence or emotional resolution for ${subject}.`
  };

  let visual = base[beat.type] || base.SETUP;

  if (analysis.hasMystery) {
    visual += " Keep an important visual detail partially hidden to preserve mystery.";
  }

  if (analysis.hasConflict) {
    visual += " Emphasize tension and visible consequences of the conflict.";
  }

  if (analysis.hasAction) {
    visual += " Use clear physical action that reads immediately on screen.";
  }

  if (analysis.hasLocation) {
    visual += " Preserve the identity of the established location.";
  }

  visual += ` Render as ${style} cinematic imagery.`;

  return visual;
}


/*
|--------------------------------------------------------------------------
| GENERATION PROMPT
|--------------------------------------------------------------------------
*/

function buildGenerationPrompt({ beat, analysis, style }) {
  const subject = analysis.subject || "the main subject";
  const tone = analysis.emotionalTone || "Cinematic";

  return [
    `${style} cinematic scene.`,
    `Story subject: ${subject}.`,
    `Story beat: ${beat.type}.`,
    `Purpose: ${beat.purpose}.`,
    `Emotional tone: ${tone}.`,
    `Character continuity must remain consistent.`,
    `Important objects and locations must remain consistent.`,
    `Create a visually coherent shot designed for AI video generation.`,
    `Prioritize clear subject identity, cinematic composition, believable motion, and story continuity.`
  ].join(" ");
}


/*
|--------------------------------------------------------------------------
| CAMERA
|--------------------------------------------------------------------------
*/

function cameraFor({ type, analysis }) {
  if (type === "HOOK") {
    return analysis.hasMystery
      ? "Slow dramatic push-in toward the unexplained subject."
      : "Fast cinematic push-in or dramatic reveal.";
  }

  if (type === "CLIMAX") {
    return analysis.hasAction
      ? "Dynamic low-angle tracking shot or sweeping cinematic movement."
      : "Powerful controlled push-in emphasizing the emotional peak.";
  }

  if (type === "PAYOFF") {
    return "Slow controlled camera movement that allows the final image to breathe.";
  }

  if (type === "TURNING_POINT") {
    return "Controlled reveal, orbit, or sudden change in framing.";
  }

  return "Cinematic medium or wide composition chosen for story clarity.";
}


/*
|--------------------------------------------------------------------------
| MOVEMENT
|--------------------------------------------------------------------------
*/

function movementFor({ type, analysis }) {
  if (
    type === "ESCALATION" ||
    type === "CLIMAX"
  ) {
    return analysis.hasAction
      ? "Strong purposeful physical motion with energetic camera movement."
      : "Increasing environmental and character motion.";
  }

  if (type === "TURNING_POINT") {
    return "Deliberate movement leading directly into the story reveal.";
  }

  if (type === "PAYOFF") {
    return "Slow restrained motion with minimal distractions.";
  }

  return "Natural controlled movement.";
}


/*
|--------------------------------------------------------------------------
| LIGHTING
|--------------------------------------------------------------------------
*/

function lightingFor({ type, analysis }) {
  if (analysis.emotionalTone === "Dark") {
    return type === "CLIMAX"
      ? "Dark high-contrast lighting with dramatic highlights and deep shadows."
      : "Moody cinematic lighting with controlled contrast.";
  }

  if (analysis.emotionalTone === "Epic") {
    return type === "CLIMAX"
      ? "Grand dramatic lighting with powerful highlights and atmospheric depth."
      : "Cinematic atmospheric lighting.";
  }

  if (type === "CLIMAX") {
    return "Dramatic high-contrast cinematic lighting.";
  }

  return "Lighting appropriate to the environment and story mood.";
}


/*
|--------------------------------------------------------------------------
| MOOD
|--------------------------------------------------------------------------
*/

function moodFor({ type, analysis }) {
  if (analysis.emotionalTone) {
    if (type === "HOOK") {
      return `${analysis.emotionalTone} intrigue`;
    }

    if (type === "ESCALATION") {
      return `${analysis.emotionalTone} tension`;
    }

    if (type === "CLIMAX") {
      return `${analysis.emotionalTone} intensity`;
    }
  }

  const map = {
    HOOK: "Intriguing",
    SETUP: "Mysterious",
    ESCALATION: "Tense",
    TURNING_POINT: "Shocking",
    CLIMAX: "Epic",
    PAYOFF: "Memorable"
  };

  return map[type] || "Cinematic";
}
```
