const $ = (id) => document.getElementById(id);

async function checkHealth() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    $("health").textContent = data.ok ? "● ONLINE" : "● OFFLINE";
  } catch {
    $("health").textContent = "● OFFLINE";
  }
}

$("create").addEventListener("click", async () => {
  $("error").textContent = "";

  const topic = $("topic").value.trim();
  if (!topic) {
    $("error").textContent = "Enter a video idea first.";
    return;
  }

  $("create").disabled = true;
  $("create").textContent = "DIRECTING...";

  try {
    const response = await fetch("/api/create-project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        duration: $("duration").value,
        style: $("style").value,
        mode: $("mode").value
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Creation failed.");

    render(data);
  } catch (error) {
    $("error").textContent = error.message;
  } finally {
    $("create").disabled = false;
    $("create").textContent = "CREATE PROJECT";
  }
});

function render(data) {
  $("results").classList.remove("hidden");

  $("projectTitle").textContent = data.project.title;
  $("projectMeta").textContent =
    `${data.project.duration}s • ${data.project.style} • ${data.project.mode}`;

  $("strategy").textContent = data.director.strategy;
  $("priorities").innerHTML = data.director.priority
    .map(x => `<span class="chip">${escapeHtml(x)}</span>`).join("");

  $("beats").innerHTML = data.story.beats.map(beat => `
    <div class="beat">
      <strong>${escapeHtml(beat.type)}</strong>
      <span>${escapeHtml(beat.purpose)}</span>
    </div>
  `).join("");

  $("scenes").innerHTML = data.scenes.map(scene => `
    <div class="scene">
      <strong>${escapeHtml(scene.id)} — ${escapeHtml(scene.purpose)}</strong>
      <small>${scene.start}s → ${scene.end}s • ${scene.duration}s</small>
      <p>${escapeHtml(scene.visual)}</p>
      <small>Camera: ${escapeHtml(scene.camera)}</small><br>
      <small>Movement: ${escapeHtml(scene.movement)}</small>
    </div>
  `).join("");

  fillList("hard", data.continuity.hardContinuity);
  fillList("soft", data.continuity.softContinuity);
  fillList("creative", data.continuity.creativeFreedom);

  $("timeline").innerHTML = `
    <div class="timeline-bar">
      ${data.timeline.map(item => `
        <div class="timeline-segment">
          ${escapeHtml(item.sceneId)}
        </div>
      `).join("")}
    </div>
  `;

  $("results").scrollIntoView({ behavior: "smooth" });
}

function fillList(id, items) {
  $(id).innerHTML = items.map(item => `<li>${escapeHtml(item)}</li>`).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

checkHealth();
