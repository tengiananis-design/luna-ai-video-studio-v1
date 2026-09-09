import { planStory } from "./story-planner.js";
import { planScenes } from "./scene-planner.js";
import { buildContinuity } from "./continuity.js";

export function createProject({ topic, duration, style, mode }) {
  const story = planStory({ topic, duration, style });
  const scenes = planScenes({ story, duration, style });
  const continuity = buildContinuity({ topic, style, scenes });

  return {
    success: true,
    project: {
      title: story.title,
      topic,
      duration,
      style,
      mode,
      status: "PLANNED"
    },
    director: {
      strategy: "Story first → visual beats → continuity → generation",
      priority: [
        "Story accuracy",
        "Audio/visual synchronization",
        "Continuity",
        "Visual quality",
        "Pacing"
      ]
    },
    story,
    scenes,
    continuity,
    timeline: scenes.map((scene) => ({
      sceneId: scene.id,
      start: scene.start,
      end: scene.end,
      duration: scene.duration
    }))
  };
}
