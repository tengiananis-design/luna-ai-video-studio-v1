export function planStory({ topic, duration, style }) {
  const seconds = Math.max(10, Number(duration) || 30);
  const words = Math.round(seconds * 2.2);

  const beats = [
    { id: 1, type: "HOOK", purpose: "Immediately create curiosity." },
    { id: 2, type: "SETUP", purpose: "Establish the situation." },
    { id: 3, type: "ESCALATION", purpose: "Raise the stakes." },
    { id: 4, type: "TURNING_POINT", purpose: "Introduce the major change." },
    { id: 5, type: "CLIMAX", purpose: "Deliver the strongest visual moment." },
    { id: 6, type: "PAYOFF", purpose: "Resolve the story with a memorable ending." }
  ];

  return {
    title: makeTitle(topic),
    narrationTargetWords: words,
    style,
    beats,
    narration:
      `Something is about to change. ${topic}. ` +
      `At first, the danger seems distant, but the situation quickly escalates. ` +
      `Then everything changes. The moment arrives when there is no turning back. ` +
      `What happens next becomes the defining moment of the story.`,
  };
}

function makeTitle(topic) {
  const clean = topic.replace(/\s+/g, " ").trim();
  return clean.length > 58 ? clean.slice(0, 55) + "..." : clean;
}
