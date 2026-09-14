const $ = (id) => document.getElementById(id);

let currentProject = null;
let productionTimer = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setStatus(message, type = "") {
  const el = $("status");

  if (!el) return;

  el.textContent = message;
  el.className = `status ${type}`.trim();
}

function getTopic() {
  return (
    $("topic")?.value?.trim() ||
    $("story")?.value?.trim() ||
    ""
  );
}

function getDuration() {
  return (
    $("duration")?.value ||
    "30"
  );
}

function getStyle() {
  return (
    $("style")?.value ||
    "Cinematic"
  );
}

function getMode() {
  return (
    $("mode")?.value ||
    "Cinematic"
  );
}

/* =========================================================
   CREATE PROJECT
   ========================================================= */

async function createProject() {
  const topic = getTopic();

  if (!topic) {
    setStatus(
      "Enter a story or idea first.",
      "error"
    );
    return;
  }

  const button =
    $("createProjectBtn") ||
    document.querySelector(
      "button[onclick*='createProject']"
    ) ||
    document.querySelector(
      "button"
    );

  if (button) {
    button.disabled = true;
    button.dataset.originalText =
      button.textContent;
    button.textContent =
      "DIRECTING...";
  }

  setStatus(
    "Building story, scenes and continuity..."
  );

  try {
    const response = await fetch(
      "/api/create-project",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          topic,
          duration: Number(
            getDuration()
          ),
          style: getStyle(),
          mode: getMode()
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Project creation failed."
      );
    }

    currentProject = data;

    renderProject(data);

    setStatus(
      "Project ready. You can now generate the video.",
      "success"
    );

  } catch (error) {
    console.error(error);

    setStatus(
      error.message ||
      "Unable to create project.",
      "error"
    );

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent =
        button.dataset.originalText ||
        "CREATE PROJECT";
    }
  }
}

/* =========================================================
   RENDER PROJECT
   ========================================================= */

function renderProject(data) {
  const project =
    data.project || {};

  const story =
    data.story || {};

  const scenes =
    Array.isArray(data.scenes)
      ? data.scenes
      : [];

  const continuity =
    data.continuity || {};

  const timeline =
    Array.isArray(data.timeline)
      ? data.timeline
      : [];

  renderDirector(
    data.director || {},
    project
  );

  renderStory(
    story
  );

  renderScenes(
    scenes
  );

  renderContinuity(
    continuity
  );

  renderTimeline(
    timeline
  );

  addGenerateButton(
    scenes
  );
}

/* =========================================================
   DIRECTOR
   ========================================================= */

function renderDirector(
  director,
  project
) {
  const el =
    $("director") ||
    $("directorPanel") ||
    $("directorResult");

  if (!el) return;

  const priorities =
    Array.isArray(
      director.priority
    )
      ? director.priority
      : [];

  el.innerHTML = `
    <h3>Director</h3>

    <div class="director-project">
      <strong>
        ${escapeHtml(
          project.title ||
          "Untitled Project"
        )}
      </strong>

      <span>
        ${escapeHtml(
          project.style ||
          getStyle()
        )}
      </span>
    </div>

    <p>
      ${escapeHtml(
        director.strategy ||
        "Story → scenes → continuity → generation"
      )}
    </p>

    ${
      priorities.length
        ? `
          <div class="chips">
            ${priorities
              .map(
                (item) =>
                  `<span class="chip">${escapeHtml(
                    item
                  )}</span>`
              )
              .join("")}
          </div>
        `
        : ""
    }
  `;
}

/* =========================================================
   STORY
   ========================================================= */

function renderStory(
  story
) {
  const el =
    $("storyBeats") ||
    $("story") ||
    $("storyPanel");

  if (!el) return;

  const beats =
    Array.isArray(
      story.beats
    )
      ? story.beats
      : Array.isArray(
          story.structure
        )
        ? story.structure
        : [];

  el.innerHTML = `
    <h3>
      ${escapeHtml(
        story.title ||
        "Story"
      )}
    </h3>

    ${
      story.analysis
        ? `
          <p class="muted">
            ${escapeHtml(
              story.analysis
            )}
          </p>
        `
        : ""
    }

    ${
      beats.length
        ? `
          <div class="story-beats">
            ${beats
              .map(
                (beat, index) => {
                  const title =
                    beat.title ||
                    beat.name ||
                    `Beat ${index + 1}`;

                  const text =
                    beat.description ||
                    beat.text ||
                    beat.action ||
                    beat.narration ||
                    "";

                  return `
                    <div class="story-beat">
                      <div class="beat-number">
                        ${String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div>
                        <strong>
                          ${escapeHtml(
                            title
                          )}
                        </strong>

                        <p>
                          ${escapeHtml(
                            text
                          )}
                        </p>
                      </div>
                    </div>
                  `;
                }
              )
              .join("")}
          </div>
        `
        : `
          <p class="muted">
            Story structure created.
          </p>
        `
    }
  `;
}

/* =========================================================
   SCENES
   ========================================================= */

function renderScenes(
  scenes
) {
  const el =
    $("sceneCards") ||
    $("scenes") ||
    $("scenePanel");

  if (!el) return;

  el.innerHTML = `
    <h3>Scene Cards</h3>

    ${
      scenes.length
        ? scenes
            .map(
              (scene, index) =>
                renderSceneCard(
                  scene,
                  index
                )
            )
            .join("")
        : `
          <p class="muted">
            No scenes were generated.
          </p>
        `
    }
  `;
}

function renderSceneCard(
  scene,
  index
) {
  const title =
    scene.title ||
    scene.name ||
    `Scene ${index + 1}`;

  const description =
    scene.description ||
    scene.action ||
    scene.text ||
    "";

  const prompt =
    scene.prompt ||
    scene.visualPrompt ||
    scene.generation?.prompt ||
    "";

  const duration =
    scene.duration ||
    5;

  return `
    <div
      class="scene-card"
      data-scene-index="${index}"
    >
      <div class="scene-header">
        <span class="scene-number">
          ${String(
            index + 1
          ).padStart(2, "0")}
        </span>

        <strong>
          ${escapeHtml(
            title
          )}
        </strong>

        <span class="scene-status">
          READY
        </span>
      </div>

      <p>
        ${escapeHtml(
          description
        )}
      </p>

      ${
        prompt
          ? `
            <div class="scene-prompt">
              ${escapeHtml(
                prompt
              )}
            </div>
          `
          : ""
      }

      <div class="scene-meta">
        <span>
          ${escapeHtml(
            duration
          )} sec
        </span>

        <span>
          GENERATION READY
        </span>
      </div>
    </div>
  `;
}

/* =========================================================
   CONTINUITY
   ========================================================= */

function renderContinuity(
  continuity
) {
  const el =
    $("continuity") ||
    $("continuityPanel");

  if (!el) return;

  const hard =
    Array.isArray(
      continuity.hardContinuity
    )
      ? continuity.hardContinuity
      : [];

  const soft =
    Array.isArray(
      continuity.softContinuity
    )
      ? continuity.softContinuity
      : [];

  el.innerHTML = `
    <h3>
      Continuity Engine
    </h3>

    ${
      continuity.projectStyle
        ? `
          <p>
            Style:
            <strong>
              ${escapeHtml(
                continuity.projectStyle
              )}
            </strong>
          </p>
        `
        : ""
    }

    ${
      hard.length
        ? `
          <div class="continuity-group">
            <strong>
              Hard continuity
            </strong>

            <div class="chips">
              ${hard
                .map(
                  (item) =>
                    `<span class="chip">${escapeHtml(
                      item
                    )}</span>`
                )
                .join("")}
            </div>
          </div>
        `
        : ""
    }

    ${
      soft.length
        ? `
          <div class="continuity-group">
            <strong>
              Soft continuity
            </strong>

            <div class="chips">
              ${soft
                .map(
                  (item) =>
                    `<span class="chip">${escapeHtml(
                      item
                    )}</span>`
                )
                .join("")}
            </div>
          </div>
        `
        : ""
    }
  `;
}

/* =========================================================
   TIMELINE
   ========================================================= */

function renderTimeline(
  timeline
) {
  const el =
    $("timeline") ||
    $("timelinePanel");

  if (!el) return;

  el.innerHTML = `
    <h3>Timeline</h3>

    ${
      timeline.length
        ? `
          <div class="timeline-list">
            ${timeline
              .map(
                (item, index) => `
                  <div class="timeline-item">
                    <span>
                      ${String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <div>
                      <strong>
                        ${escapeHtml(
                          item.sceneId ||
                          `Scene ${index + 1}`
                        )}
                      </strong>

                      <small>
                        ${escapeHtml(
                          item.start ??
                          0
                        )}s —
                        ${escapeHtml(
                          item.end ??
                          ""
                        )}s
                      </small>
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>
        `
        : `
          <p class="muted">
            Timeline ready.
          </p>
        `
    }
  `;
}

/* =========================================================
   GENERATE VIDEO BUTTON
   ========================================================= */

function addGenerateButton(
  scenes
) {
  if (!scenes.length) {
    return;
  }

  let container =
    $("productionControls");

  if (!container) {
    container =
      document.createElement(
        "section"
      );

    container.id =
      "productionControls";

    container.className =
      "panel production-panel";

    const target =
      $("timeline") ||
      $("timelinePanel") ||
      $("results") ||
      document.body;

    target.parentNode.insertBefore(
      container,
      target.nextSibling
    );
  }

  container.innerHTML = `
    <div class="production-header">
      <div>
        <h3>
          Video Production
        </h3>

        <p class="muted">
          Your planned scenes are ready
          for the real video engine.
        </p>
      </div>

      <button
        id="generateVideoBtn"
        class="primary"
        type="button"
      >
        GENERATE VIDEO
      </button>
    </div>

    <div
      id="productionStatus"
      class="production-status"
    >
      Ready to generate.
    </div>

    <div
      id="productionScenes"
      class="production-scenes"
    ></div>

    <div
      id="productionOutput"
      class="production-output"
    ></div>
  `;

  $("generateVideoBtn")
    ?.addEventListener(
      "click",
      startProduction
    );
}

/* =========================================================
   CONVERT PLANNER SCENES
   ========================================================= */

function prepareProductionScenes(
  scenes
) {
  return scenes
    .map(
      (scene, index) => {
        const title =
          scene.title ||
          scene.name ||
          `Scene ${index + 1}`;

        let prompt =
          scene.prompt ||
          scene.visualPrompt ||
          scene.generation?.prompt ||
          "";

        const description =
          scene.description ||
          scene.action ||
          scene.text ||
          "";

        /*
         * The production engine requires
         * a real visual prompt.
         *
         * If the planner did not supply
         * one, build one from the scene.
         */

        if (!prompt) {
          prompt =
            `${getStyle()} cinematic scene. ` +
            `Story subject: ${getTopic()}. ` +
            `Scene action: ${description}. ` +
            `Maintain character identity, clothing, ` +
            `location and story continuity. ` +
            `Detailed cinematic lighting, realistic motion, ` +
            `smooth camera movement, coherent environment. ` +
            `No subtitles, no text, no watermark.`;
        }

        const voice =
          scene.voice ||
          scene.narration ||
          scene.narrationText ||
          null;

        const sfx =
          scene.sfx ||
          scene.soundEffect ||
          null;

        return {
          id:
            scene.id ||
            `scene-${index + 1}`,

          title,

          prompt,

          voice,

          sfx,

          duration:
            Number(
              scene.duration
            ) || 5
        };
      }
    );
}

/* =========================================================
   START REAL VIDEO PRODUCTION
   ========================================================= */

async function startProduction() {
  if (
    !currentProject ||
    !Array.isArray(
      currentProject.scenes
    ) ||
    !currentProject.scenes.length
  ) {
    setStatus(
      "Create a project first.",
      "error"
    );

    return;
  }

  const button =
    $("generateVideoBtn");

  if (button) {
    button.disabled = true;
    button.textContent =
      "STARTING...";
  }

  if (productionTimer) {
    clearInterval(
      productionTimer
    );

    productionTimer =
      null;
  }

  renderProductionScenes(
    currentProject.scenes.map(
      (scene) => ({
        ...scene,
        status: "queued"
      })
    )
  );

  setProductionStatus(
    "Starting the production engine..."
  );

  try {
    const scenes =
      prepareProductionScenes(
        currentProject.scenes
      );

    const response =
      await fetch(
        "/api/production/start",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            scenes
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Production could not start."
      );
    }

    setProductionStatus(
      `Production started. Job ${data.id}`
    );

    pollProduction(
      data.id
    );

  } catch (error) {
    console.error(error);

    setProductionStatus(
      error.message ||
      "Production failed to start.",
      true
    );

    setStatus(
      error.message ||
      "Production failed.",
      "error"
    );

    if (button) {
      button.disabled = false;
      button.textContent =
        "GENERATE VIDEO";
    }
  }
}

/* =========================================================
   PRODUCTION POLLING
   ========================================================= */

function pollProduction(
  jobId
) {
  if (productionTimer) {
    clearInterval(
      productionTimer
    );
  }

  checkProduction(
    jobId
  );

  productionTimer =
    setInterval(
      () =>
        checkProduction(
          jobId
        ),
      5000
    );
}

async function checkProduction(
  jobId
) {
  try {
    const response =
      await fetch(
        `/api/production/${encodeURIComponent(
          jobId
        )}`
      );

    const job =
      await response.json();

    if (!response.ok) {
      throw new Error(
        job.error ||
        "Unable to read production status."
      );
    }

    renderProductionScenes(
      job.scenes || []
    );

    updateProductionMessage(
      job
    );

    if (
      job.status === "complete"
    ) {
      stopProductionPolling();

      showFinalVideo(
        job.final
      );

      const button =
        $("generateVideoBtn");

      if (button) {
        button.disabled = false;
        button.textContent =
          "GENERATE VIDEO AGAIN";
      }

      setStatus(
        "Video production complete.",
        "success"
      );

      return;
    }

    if (
      job.status === "error"
    ) {
      stopProductionPolling();

      setProductionStatus(
        job.error ||
        "Video production failed.",
        true
      );

      const button =
        $("generateVideoBtn");

      if (button) {
        button.disabled = false;
        button.textContent =
          "TRY AGAIN";
      }

      setStatus(
        job.error ||
        "Video production failed.",
        "error"
      );
    }

  } catch (error) {
    console.error(
      "Production polling error:",
      error
    );

    /*
     * Do not immediately kill the polling loop.
     * Temporary network errors can happen while
     * the server is still generating the video.
     */
  }
}

function stopProductionPolling() {
  if (productionTimer) {
    clearInterval(
      productionTimer
    );

    productionTimer =
      null;
  }
}

/* =========================================================
   PRODUCTION STATUS
   ========================================================= */

function updateProductionMessage(
  job
) {
  const completed =
    Array.isArray(
      job.scenes
    )
      ? job.scenes.filter(
          (scene) =>
            scene.status ===
            "complete"
        ).length
      : 0;

  const total =
    Array.isArray(
      job.scenes
    )
      ? job.scenes.length
      : 0;

  let message =
    "Production running...";

  if (
    job.status ===
    "queued"
  ) {
    message =
      "Production queued...";
  }

  if (
    job.status ===
    "running"
  ) {
    message =
      `Generating scenes... ${completed}/${total}`;
  }

  if (
    job.status ===
    "assembling"
  ) {
    message =
      "Scenes complete. Assembling final MP4...";
  }

  setProductionStatus(
    message
  );
}

function setProductionStatus(
  message,
  error = false
) {
  const el =
    $("productionStatus");

  if (!el) return;

  el.textContent =
    message;

  el.className =
    `production-status ${
      error
        ? "error"
        : ""
    }`.trim();
}

/* =========================================================
   SCENE PRODUCTION STATUS
   ========================================================= */

function renderProductionScenes(
  scenes
) {
  const el =
    $("productionScenes");

  if (!el) return;

  el.innerHTML =
    scenes
      .map(
        (scene, index) => {
          const status =
            String(
              scene.status ||
              "queued"
            ).toUpperCase();

          let label =
            "WAITING";

          if (
            status ===
            "GENERATING"
          ) {
            label =
              scene.providerStatus
                ? `MAGIC HOUR: ${String(
                    scene.providerStatus
                  ).toUpperCase()}`
                : "GENERATING";
          }

          if (
            status ===
            "AUDIO"
          ) {
            label =
              "AUDIO";
          }

          if (
            status ===
            "MIXING"
          ) {
            label =
              "MIXING";
          }

          if (
            status ===
            "COMPLETE"
          ) {
            label =
              "COMPLETE";
          }

          return `
            <div class="production-scene">
              <div class="production-scene-number">
                ${String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                )}
              </div>

              <div class="production-scene-info">
                <strong>
                  ${escapeHtml(
                    scene.title ||
                    `Scene ${index + 1}`
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    label
                  )}
                </span>
              </div>

              <div
                class="production-scene-state ${status.toLowerCase()}"
              >
                ${escapeHtml(
                  label
                )}
              </div>
            </div>
          `;
        }
      )
      .join("");
}

/* =========================================================
   FINAL VIDEO
   ========================================================= */

function showFinalVideo(
  videoUrl
) {
  const el =
    $("productionOutput");

  if (!el || !videoUrl) {
    return;
  }

  el.innerHTML = `
    <div class="final-video">
      <h3>
        FINAL VIDEO
      </h3>

      <video
        controls
        playsinline
        preload="metadata"
        src="${escapeHtml(
          videoUrl
        )}"
      ></video>

      <div class="final-video-actions">
        <a
          href="${escapeHtml(
            videoUrl
          )}"
          target="_blank"
          rel="noopener"
          class="primary"
        >
          OPEN FINAL MP4
        </a>
      </div>
    </div>
  `;
}

/* =========================================================
   HEALTH CHECK
   ========================================================= */

async function checkHealth() {
  const el =
    $("health") ||
    $("healthStatus");

  if (!el) return;

  try {
    const response =
      await fetch(
        "/api/health"
      );

    const data =
      await response.json();

    if (data.ok) {
      el.textContent =
        "ONLINE";
      el.className =
        "health online";
    } else {
      el.textContent =
        "OFFLINE";
      el.className =
        "health offline";
    }

  } catch {
    el.textContent =
      "OFFLINE";

    el.className =
      "health offline";
  }
}

/* =========================================================
   BUTTON COMPATIBILITY
   ========================================================= */

function bindCreateButton() {
  const candidates = [
    $("createProjectBtn"),
    $("createBtn"),
    $("createProject"),
    ...document.querySelectorAll(
      "button"
    )
  ];

  const button =
    candidates.find(
      (item) =>
        item &&
        /create project/i.test(
          item.textContent ||
          ""
        )
    );

  if (
    button &&
    !button.dataset.bound
  ) {
    button.dataset.bound =
      "true";

    button.addEventListener(
      "click",
      createProject
    );
  }
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    bindCreateButton();
    checkHealth();

    /*
     * Also expose these functions
     * globally for existing HTML
     * onclick handlers.
     */

    window.createProject =
      createProject;

    window.startProduction =
      startProduction;

    window.checkHealth =
      checkHealth;
  }
);
