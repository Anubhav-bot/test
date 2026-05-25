function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getNextUnit(courseId, userId) {
  const units = getUnitsByCourse(courseId);
  for (const unit of units) {
    const progress = getProgressEntry(userId, unit.id);
    if (!progress || !progress.completed) {
      return unit;
    }
  }
  return units[0] || null;
}

document.addEventListener("DOMContentLoaded", () => {
  const message = document.getElementById("page-message");
  const user = getCurrentUser();
  const role = getCurrentRole();

  if (role !== "user") {
    if (message) {
      message.innerHTML = `<div class="notice warning">Log in as a user to access the dashboard.</div>`;
    }
    if (role === "public") {
      setTimeout(() => {
        window.location.href = "login.html?redirect=dashboard.html";
      }, 800);
    }
    return;
  }

  const enrollments = getUserEnrollments(user.id);
  const hero = document.getElementById("dashboard-hero");
  if (hero) {
    hero.innerHTML = `
      <div>
        <p class="badge">Welcome back</p>
        <h1 class="section-title">Your learning dashboard</h1>
        <p class="subtle">Track your progress across all enrolled courses.</p>
      </div>
      <div class="hero-card">
        <h2 class="section-title">Enrollment summary</h2>
        <p class="subtle">${enrollments.length} active course${
          enrollments.length === 1 ? "" : "s"
        }</p>
      </div>
    `;
  }

  const container = document.getElementById("enrolled-courses");
  const emptyState = document.getElementById("enrolled-empty");
  if (!container) return;

  if (!enrollments.length) {
    if (emptyState) {
      emptyState.innerHTML = `<div class="notice">You are not enrolled in any courses yet. <a href="index.html">Browse the catalog</a>.</div>`;
    }
    return;
  }

  container.innerHTML = enrollments
    .map((enrollment) => {
      const course = getCourseById(enrollment.courseId);
      if (!course) return "";
      const progress = getCourseProgressForUser(user.id, course.id);
      const nextUnit = getNextUnit(course.id, user.id);
      const continueHref = nextUnit
        ? `unit.html?unitId=${encodeURIComponent(nextUnit.id)}`
        : `course.html?courseId=${encodeURIComponent(course.id)}`;
      const continueLabel = nextUnit ? "Continue" : "View";
      return `
        <article class="card">
          <img src="${escapeHtml(course.thumbnailUrl)}" alt="${escapeHtml(
            course.title
          )}" />
          <div class="card-body">
            <h3>${escapeHtml(course.title)}</h3>
            <p class="subtle">${escapeHtml(course.description)}</p>
            <div class="progress-bar" aria-hidden="true">
              <span style="width: ${progress.percent}%"></span>
            </div>
            <span class="subtle">${progress.completedCount} of ${
              progress.totalUnits
            } units complete</span>
            <div class="card-actions">
              <a class="button" href="course.html?courseId=${encodeURIComponent(
                course.id
              )}">View course</a>
              <a class="button secondary" href="${continueHref}">${continueLabel}</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
});
