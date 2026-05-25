function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderCourseHero(course, unitsCount, role, enrollment) {
  const hero = document.getElementById("course-hero");
  if (!hero) return;

  const enrollmentBadge = enrollment
    ? `<span class="badge success">Enrolled</span>`
    : role === "user"
      ? `<span class="badge warning">Not enrolled</span>`
      : "";

  hero.innerHTML = `
    <div>
      <p class="badge">${unitsCount} unit${unitsCount === 1 ? "" : "s"}</p>
      <h1 class="section-title">${escapeHtml(course.title)}</h1>
      <p class="subtle">${escapeHtml(course.description)}</p>
      <div class="card-actions">
        ${enrollmentBadge}
        <a class="button secondary" href="index.html">Back to catalog</a>
      </div>
    </div>
    <div class="hero-card">
      <img src="${escapeHtml(course.thumbnailUrl)}" alt="${escapeHtml(
        course.title
      )}" />
    </div>
  `;
}

function renderEnrollAction(courseId, role, enrollment) {
  const hero = document.getElementById("course-hero");
  if (!hero) return;
  const actions = hero.querySelector(".card-actions");
  if (!actions) return;

  if (role === "public") {
    actions.insertAdjacentHTML(
      "afterbegin",
      `<a class="button" href="login.html?redirect=${encodeURIComponent(
        `course.html?courseId=${courseId}`
      )}">Log in to enroll</a>`
    );
    return;
  }

  if (role === "admin") {
    actions.insertAdjacentHTML(
      "afterbegin",
      `<a class="button" href="admin.html">Edit in admin</a>`
    );
    return;
  }

  if (role === "user" && !enrollment) {
    actions.insertAdjacentHTML(
      "afterbegin",
      `<button class="button" id="enroll-btn">Enroll for free</button>`
    );
  }
}

function renderUnits(units, role, enrollment, userId) {
  const list = document.getElementById("unit-list");
  if (!list) return;

  if (!units.length) {
    list.innerHTML = `<div class="notice">No units available yet.</div>`;
    return;
  }

  const canAccess = role === "admin" || (role === "user" && enrollment);

  list.innerHTML = units
    .map((unit) => {
      const progressEntry = userId ? getProgressEntry(userId, unit.id) : null;
      let badge = `<span class="badge">Not started</span>`;
      if (progressEntry && progressEntry.completed) {
        badge = `<span class="badge success">Completed</span>`;
      } else if (progressEntry && progressEntry.lastWatchedSeconds) {
        badge = `<span class="badge warning">In progress</span>`;
      }

      const action = canAccess
        ? `<a class="button" href="unit.html?unitId=${encodeURIComponent(
            unit.id
          )}">Play unit</a>`
        : `<span class="subtle">Enroll to unlock</span>`;

      return `
        <div class="list-item">
          <div>
            <h4>${escapeHtml(unit.title)}</h4>
            ${badge}
          </div>
          ${action}
        </div>
      `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const courseId = getQueryParam("courseId");
  const message = document.getElementById("page-message");

  if (!courseId) {
    if (message) {
      message.innerHTML = `<div class="notice danger">Course not found.</div>`;
    }
    return;
  }

  const course = getCourseById(courseId);
  if (!course) {
    if (message) {
      message.innerHTML = `<div class="notice danger">Course not found.</div>`;
    }
    return;
  }

  const units = getUnitsByCourse(courseId);
  const user = getCurrentUser();
  const role = getCurrentRole();
  const enrollment =
    role === "user" && user ? getEnrollment(user.id, courseId) : null;

  renderCourseHero(course, units.length, role, enrollment);
  renderEnrollAction(courseId, role, enrollment);
  renderUnits(units, role, enrollment, user ? user.id : null);

  const progressLabel = document.getElementById("course-progress");
  if (progressLabel && role === "user" && enrollment && user) {
    const progress = getCourseProgressForUser(user.id, courseId);
    progressLabel.textContent = `${progress.completedCount} of ${progress.totalUnits} units completed (${formatPercent(
      progress.percent
    )})`;
  }

  const enrollBtn = document.getElementById("enroll-btn");
  if (enrollBtn && user) {
    enrollBtn.addEventListener("click", () => {
      enrollUser(user.id, courseId);
      window.location.reload();
    });
  }
});
