function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

document.addEventListener("DOMContentLoaded", () => {
  const heroSection = document.getElementById("hero-section");
  const heroActions = document.getElementById("hero-actions");
  const heroStats = document.getElementById("hero-stats");
  const role = getCurrentRole();

  if (heroSection && role !== "public") {
    heroSection.style.display = "none";
  }

  if (heroActions && role === "public") {
    const primaryLink = `<a class="button" href="login.html">Log in to enroll</a>`;
    heroActions.innerHTML = `${primaryLink}<a class="button secondary" href="#course-grid">Browse courses</a>`;
  }

  const grid = document.getElementById("course-grid");
  const emptyState = document.getElementById("course-empty");
  const countLabel = document.getElementById("course-count");
  if (!grid) return;

  const courses = getCourses();
  if (countLabel) {
    countLabel.textContent = `${courses.length} course${
      courses.length === 1 ? "" : "s"
    }`;
  }

  if (heroStats) {
    const totalUnits = getUnits().length;
    heroStats.innerHTML = `
      <span>${courses.length} course${courses.length === 1 ? "" : "s"}</span>
      <span>${totalUnits} unit${totalUnits === 1 ? "" : "s"}</span>
      <span>100% free</span>
    `;
  }

  if (!courses.length) {
    if (emptyState) {
      emptyState.innerHTML = `<div class="notice">No courses yet. Admins can add one from the admin console.</div>`;
    }
    return;
  }

  grid.innerHTML = courses
    .map((course) => {
      const unitsCount = getUnitsByCourse(course.id).length;
      return `
        <article class="card">
          <img src="${escapeHtml(course.thumbnailUrl)}" alt="${escapeHtml(
            course.title
          )}" />
          <div class="card-body">
            <h3>${escapeHtml(course.title)}</h3>
            <p class="subtle line-clamp-3">${escapeHtml(course.description)}</p>
            <span class="badge">${unitsCount} unit${
              unitsCount === 1 ? "" : "s"
            }</span>
            <div class="card-actions">
              <a class="button" href="course.html?courseId=${encodeURIComponent(
                course.id
              )}">View course</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
});
