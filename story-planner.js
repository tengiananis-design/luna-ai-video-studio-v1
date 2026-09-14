```javascript
export function planStory({ topic, duration, style }) {
  const seconds = Math.max(10, Number(duration) || 30);
  const cleanTopic = cleanText(topic);

  const narrationTargetWords = Math.max(
    20,
    Math.round(seconds * 2.2)
  );

  const beats = buildStoryBeats(cleanTopic);

  const narration = buildNarration(cleanTopic, beats);

  return {
    title: makeTitle(cleanTopic),
    narrationTargetWords,
    style,

    // Story Engine metadata
    sourceType: "IDEA",
    analysis: analyzeStory(cleanTopic),
    structure: {
      sceneCount: beats.length,
      pacing: getPacing(seconds, beats.length),
      arc: "HOOK → SETUP → ESCALATION → TURNING POINT → CLIMAX → PAYOFF"
    },

    beats,

    narration
  };
}


/*
|--------------------------------------------------------------------------
| STORY ANALYSIS
|--------------------------------------------------------------------------
*/

function analyzeStory(topic) {
  const text = topic.toLowerCase();

  return {
    subject: extractSubject(topic),
    hasCharacter: detectCharacter(text),
    hasLocation: detectLocation(text),
    hasConflict: detectConflict(text),
    hasAction: detectAction(text),
    hasMystery: detectMystery(text),
    emotionalTone: detectTone(text),
    visualPotential: calculateVisualPotential(text)
  };
}


/*
|--------------------------------------------------------------------------
| STORY BEATS
|--------------------------------------------------------------------------
*/

function buildStoryBeats(topic) {
  const text = topic.toLowerCase();

  const hasMystery = detectMystery(text);
  const hasConflict = detectConflict(text);
  const hasAction = detectAction(text);

  const hookPurpose = hasMystery
    ? "Reveal the mystery immediately and create a strong unanswered question."
    : hasConflict
      ? "Introduce the danger immediately and make the audience want to know what happens next."
      : "Present the most visually compelling aspect of the story immediately.";

  const escalationPurpose = hasAction
    ? "Increase the action, danger, or pressure until the protagonist is forced to react."
    : "Increase the pressure and make the situation progressively more difficult.";

  const climaxPurpose = hasConflict
    ? "Deliver the decisive confrontation or most important consequence."
    : "Deliver the strongest emotional and visual moment of the story.";

  return [
    {
      id: 1,
      type: "HOOK",
      purpose: hookPurpose
    },
    {
      id: 2,
      type: "SETUP",
      purpose: "Establish the protagonist, environment, and immediate situation."
    },
    {
      id: 3,
      type: "ESCALATION",
      purpose: escalationPurpose
    },
    {
      id: 4,
      type: "TURNING_POINT",
      purpose: "Introduce the event that changes the direction of the story."
    },
    {
      id: 5,
      type: "CLIMAX",
      purpose: climaxPurpose
    },
    {
      id: 6,
      type: "PAYOFF",
      purpose: "Show the consequence, emotional resolution, or final memorable image."
    }
  ];
}


/*
|--------------------------------------------------------------------------
| NARRATION
|--------------------------------------------------------------------------
*/

function buildNarration(topic, beats) {
  const first = topic.charAt(0).toUpperCase() + topic.slice(1);

  return [
    `Something is about to change.`,
    `${first}.`,
    `At first, the situation appears manageable.`,
    `Then the pressure begins to build.`,
    `Everything changes when the turning point arrives.`,
    `There is no going back.`,
    `The final moment reveals what the story was really about.`
  ].join(" ");
}


/*
|--------------------------------------------------------------------------
| STORY HELPERS
|--------------------------------------------------------------------------
*/

function extractSubject(topic) {
  const words = topic
    .split(/\s+/)
    .filter(Boolean);

  if (words.length <= 8) {
    return topic;
  }

  return words.slice(0, 12).join(" ") + "...";
}


function detectCharacter(text) {
  const characterWords = [
    "man",
    "woman",
    "boy",
    "girl",
    "child",
    "person",
    "hero",
    "heroine",
    "soldier",
    "warrior",
    "king",
    "queen",
    "god",
    "goddess",
    "detective",
    "police",
    "doctor",
    "scientist",
    "father",
    "mother",
    "son",
    "daughter",
    "he",
    "she",
    "they"
  ];

  return characterWords.some(word =>
    text.includes(word)
  );
}


function detectLocation(text) {
  const locationWords = [
    "city",
    "town",
    "village",
    "forest",
    "mountain",
    "castle",
    "palace",
    "house",
    "home",
    "street",
    "road",
    "school",
    "hospital",
    "office",
    "laboratory",
    "planet",
    "space",
    "ocean",
    "sea",
    "island",
    "olympus",
    "temple",
    "desert"
  ];

  return locationWords.some(word =>
    text.includes(word)
  );
}


function detectConflict(text) {
  const conflictWords = [
    "attack",
    "attacked",
    "danger",
    "threat",
    "enemy",
    "fight",
    "fighting",
    "battle",
    "war",
    "kill",
    "killed",
    "death",
    "dead",
    "destroy",
    "destroyed",
    "escape",
    "chase",
    "revenge",
    "betray",
    "betrayal",
    "crisis",
    "dangerous"
  ];

  return conflictWords.some(word =>
    text.includes(word)
  );
}


function detectAction(text) {
  const actionWords = [
    "run",
    "running",
    "jump",
    "jumping",
    "fly",
    "flying",
    "fight",
    "fighting",
    "chase",
    "chasing",
    "explode",
    "explosion",
    "crash",
    "fall",
    "falling",
    "attack",
    "attacking",
    "escape",
    "escape"
  ];

  return actionWords.some(word =>
    text.includes(word)
  );
}


function detectMystery(text) {
  const mysteryWords = [
    "mystery",
    "secret",
    "unknown",
    "strange",
    "mysterious",
    "hidden",
    "disappear",
    "disappeared",
    "vanished",
    "why",
    "discover",
    "discovery",
    "truth",
    "revealed"
  ];

  return mysteryWords.some(word =>
    text.includes(word)
  );
}


function detectTone(text) {
  if (
    text.includes("horror") ||
    text.includes("dead") ||
    text.includes("death") ||
    text.includes("dark")
  ) {
    return "Dark";
  }

  if (
    text.includes("funny") ||
    text.includes("comedy") ||
    text.includes("laugh")
  ) {
    return "Comedic";
  }

  if (
    text.includes("love") ||
    text.includes("romance") ||
    text.includes("romantic")
  ) {
    return "Emotional";
  }

  if (
    text.includes("battle") ||
    text.includes("war") ||
    text.includes("fight") ||
    text.includes("attack")
  ) {
    return "Intense";
  }

  if (
    text.includes("magic") ||
    text.includes("fantasy") ||
    text.includes("dragon") ||
    text.includes("god")
  ) {
    return "Epic";
  }

  return "Cinematic";
}


function calculateVisualPotential(text) {
  let score = 50;

  const visualWords = [
    "fire",
    "water",
    "lightning",
    "storm",
    "explosion",
    "mountain",
    "ocean",
    "city",
    "space",
    "battle",
    "magic",
    "dragon",
    "god",
    "monster",
    "rain",
    "snow",
    "sunset",
    "night",
    "forest"
  ];

  for (const word of visualWords) {
    if (text.includes(word)) {
      score += 3;
    }
  }

  return Math.min(100, score);
}


function getPacing(duration, sceneCount) {
  const average = duration / sceneCount;

  if (average < 3) {
    return "Very Fast";
  }

  if (average < 5) {
    return "Fast";
  }

  if (average < 8) {
    return "Cinematic";
  }

  return "Slow Cinematic";
}


function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}


function makeTitle(topic) {
  const clean = cleanText(topic);

  if (clean.length <= 58) {
    return clean;
  }

  return clean.slice(0, 55).trim() + "...";
}
```
