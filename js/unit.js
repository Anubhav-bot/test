function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let player = null;
let progressTimer = null;

function formatTimestamp(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function updateProgressUI({ current, duration }) {
  const progressText = document.getElementById("unit-progress-text");
  const progressBar = document.getElementById("unit-progress-bar");
  const status = document.getElementById("unit-status");

  if (!duration && current > 0) {
    if (progressText) {
      progressText.textContent = `Resume at ${formatTimestamp(current)}`;
    }
    if (progressBar) {
      progressBar.style.width = "5%";
    }
    if (status) {
      status.innerHTML = `<span class="badge warning">In progress</span>`;
    }
    return;
  }

  const percent = duration ? Math.min(100, Math.round((current / duration) * 100)) : 0;
  if (progressText) {
    progressText.textContent = `Watched ${formatPercent(percent)} of this unit`;
  }
  if (progressBar) {
    progressBar.style.width = `${percent}%`;
  }

  if (status) {
    status.innerHTML =
      percent >= 100
        ? `<span class="badge success">Completed</span>`
        : percent > 0
          ? `<span class="badge warning">In progress</span>`
          : `<span class="badge">Not started</span>`;
  }
}

function stopProgressTimer() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

function saveProgress({ userId, courseId, unitId, current, duration }) {
  const existing = getProgressEntry(userId, unitId);
  const reachedEnd = duration ? current >= duration - 1 : false;
  const completed = (existing && existing.completed) || reachedEnd;
  const completedAt = completed
    ? (existing && existing.completedAt ? existing.completedAt : new Date().toISOString())
    : null;

  upsertProgress({
    userId,
    courseId,
    unitId,
    lastWatchedSeconds: Math.max(0, Math.floor(current)),
    completed,
    completedAt,
  });
  updateProgressUI({ current: completed && duration ? duration : current, duration: duration || 0 });
}

function loadYouTubeApi(onReady) {
  if (window.YT && window.YT.Player) {
    onReady();
    return;
  }

  window.onYouTubeIframeAPIReady = () => {
    onReady();
  };

  const existing = document.querySelector("script[src*='youtube.com/iframe_api']");
  if (!existing) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }
}

function renderUnitHero(course, unit) {
  const hero = document.getElementById("unit-hero");
  if (!hero) return;
  hero.innerHTML = `
    <div>
      <p class="badge">${escapeHtml(course.title)}</p>
      <h1 class="section-title">${escapeHtml(unit.title)}</h1>
      <p class="subtle">Continue where you left off. Progress saves automatically.</p>
    </div>
    <div class="hero-card">
      <h2 class="section-title">Quick actions</h2>
      <div class="card-actions">
        <a class="button secondary" href="course.html?courseId=${encodeURIComponent(
          course.id
        )}">Back to course</a>
      </div>
    </div>
  `;
}

function renderSiblings(courseId, currentUnitId) {
  const list = document.getElementById("unit-siblings");
  if (!list) return;

  const units = getUnitsByCourse(courseId);
  list.innerHTML = units
    .map((unit) => {
      const isCurrent = unit.id === currentUnitId;
      return `
        <div class="list-item">
          <div>
            <h4>${escapeHtml(unit.title)}</h4>
            ${isCurrent ? `<span class="badge">Now playing</span>` : ""}
          </div>
          <a class="button secondary" href="unit.html?unitId=${encodeURIComponent(
            unit.id
          )}">${isCurrent ? "Playing" : "Play"}</a>
        </div>
      `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const unitId = getQueryParam("unitId");
  const message = document.getElementById("page-message");

  if (!unitId) {
    if (message) {
      message.innerHTML = `<div class="notice danger">Unit not found.</div>`;
    }
    return;
  }

  const unit = getUnitById(unitId);
  if (!unit) {
    if (message) {
      message.innerHTML = `<div class="notice danger">Unit not found.</div>`;
    }
    return;
  }

  const course = getCourseById(unit.courseId);
  if (!course) {
    if (message) {
      message.innerHTML = `<div class="notice danger">Course not found.</div>`;
    }
    return;
  }

  const user = getCurrentUser();
  const role = getCurrentRole();
  const isUser = role === "user";

  renderUnitHero(course, unit);
  renderSiblings(course.id, unit.id);

  const backLink = document.getElementById("back-to-course");
  if (backLink) {
    backLink.href = `course.html?courseId=${encodeURIComponent(course.id)}`;
  }

  if (!user) {
    if (message) {
      message.innerHTML = `<div class="notice warning">Log in to view this unit.</div>`;
    }
    return;
  }

  if (isUser && !getEnrollment(user.id, course.id)) {
    if (message) {
      message.innerHTML = `<div class="notice warning">Enroll in this course to unlock the units.</div>`;
    }
    return;
  }

  const progressEntry = getProgressEntry(user.id, unit.id);
  if (progressEntry) {
    const fallbackDuration = progressEntry.completed
      ? Math.max(progressEntry.lastWatchedSeconds || 1, 1)
      : 0;
    const fallbackCurrent = progressEntry.completed
      ? fallbackDuration
      : progressEntry.lastWatchedSeconds || 0;
    updateProgressUI({
      current: fallbackCurrent,
      duration: fallbackDuration,
    });
  }

  loadYouTubeApi(() => {
    player = new YT.Player("player", {
      videoId: unit.youtubeId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event) => {
          const startSeconds = progressEntry ? progressEntry.lastWatchedSeconds || 0 : 0;
          if (startSeconds > 0) {
            event.target.seekTo(startSeconds, true);
          }
          updateProgressUI({
            current: startSeconds,
            duration: event.target.getDuration() || 0,
          });
        },
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) {
            stopProgressTimer();
            progressTimer = setInterval(() => {
              const current = player.getCurrentTime();
              const duration = player.getDuration();
              saveProgress({
                userId: user.id,
                courseId: course.id,
                unitId: unit.id,
                current,
                duration,
              });
            }, 5000);
          }

          if (
            event.data === YT.PlayerState.PAUSED ||
            event.data === YT.PlayerState.ENDED
          ) {
            stopProgressTimer();
            const current = player.getCurrentTime();
            const duration = player.getDuration();
            saveProgress({
              userId: user.id,
              courseId: course.id,
              unitId: unit.id,
              current,
              duration,
            });
          }
        },
      },
    });
  });

  window.addEventListener("beforeunload", () => {
    if (!player) return;
    const current = player.getCurrentTime();
    const duration = player.getDuration();
    saveProgress({
      userId: user.id,
      courseId: course.id,
      unitId: unit.id,
      current,
      duration,
    });
  });
});
