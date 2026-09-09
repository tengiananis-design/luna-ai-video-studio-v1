export function planScenes({ story, duration, style }) {
  const total = Math.max(10, Number(duration) || 30);

  const proportions = [0.14, 0.18, 0.18, 0.18, 0.20, 0.12];
  let cursor = 0;

  return story.beats.map((beat, index) => {
    const isLast = index === story.beats.length - 1;
    const sceneDuration = isLast
      ? Number((total - cursor).toFixed(2))
      : Number((total * proportions[index]).toFixed(2));

    const scene = {
      id: `scene-${String(index + 1).padStart(2, "0")}`,
      purpose: beat.type,
      start: Number(cursor.toFixed(2)),
      end: Number((cursor + sceneDuration).toFixed(2)),
      duration: sceneDuration,
      visual: visualFor(beat.type),
      camera: cameraFor(beat.type),
      movement: movementFor(beat.type),
      lighting: lightingFor(beat.type),
      mood: moodFor(beat.type),
      style,
      generation: {
        method: "AUTO",
        status: "READY",
        attempts: 0
      }
    };

    cursor += sceneDuration;
    return scene;
  });
}

function visualFor(type) {
  const map = {
    HOOK: "A striking visual that immediately communicates the central mystery.",
    SETUP: "Establish the main subject and environment.",
    ESCALATION: "Show the threat or conflict becoming more intense.",
    TURNING_POINT: "Reveal the major change in the situation.",
    CLIMAX: "The largest and most emotionally powerful visual moment.",
    PAYOFF: "A final memorable image that gives the story closure."
  };
  return map[type];
}

function cameraFor(type) {
  if (type === "HOOK") return "Fast cinematic push-in or dramatic reveal.";
  if (type === "CLIMAX") return "Dynamic low-angle or sweeping cinematic movement.";
  if (type === "PAYOFF") return "Slow controlled camera movement.";
  return "Cinematic medium or wide composition chosen for story clarity.";
}

function movementFor(type) {
  if (type === "ESCALATION" || type === "CLIMAX") return "Strong purposeful motion.";
  if (type === "PAYOFF") return "Slow restrained motion.";
  return "Natural controlled movement.";
}

function lightingFor(type) {
  if (type === "CLIMAX") return "Dramatic high-contrast cinematic lighting.";
  return "Lighting appropriate to the environment and story mood.";
}

function moodFor(type) {
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
