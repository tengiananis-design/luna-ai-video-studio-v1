export function buildContinuity({ topic, style, scenes }) {
  return {
    projectStyle: style,
    storySubject: topic,
    hardContinuity: [
      "Main character identity",
      "Important clothing",
      "Story-critical objects",
      "Major location identity"
    ],
    softContinuity: [
      "Weather",
      "Lighting",
      "Character condition",
      "Environmental damage",
      "Emotional state"
    ],
    creativeFreedom: [
      "Camera angle",
      "Camera movement",
      "Shot composition",
      "Lighting intensity",
      "Visual effects"
    ],
    sceneInheritance: scenes.map((scene, index) => ({
      sceneId: scene.id,
      inheritsFrom: index === 0 ? null : scenes[index - 1].id,
      rule: index === 0
        ? "Establish initial visual state."
        : "Inherit story-critical state; allow deliberate creative changes."
    }))
  };
}
