function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderAdminCourses() {
  const container = document.getElementById("admin-course-list");
  if (!container) return;

  const courses = getCourses();
  if (!courses.length) {
    container.innerHTML = `<div class="notice">No courses yet. Create your first one above.</div>`;
    return;
  }

  container.innerHTML = courses
    .map((course) => {
      const units = getUnitsByCourse(course.id);
      const unitsHtml = units
        .map(
          (unit) => `
            <form class="form unit-form" data-unit-id="${escapeHtml(unit.id)}">
              <div class="row">
                <input name="title" value="${escapeHtml(unit.title)}" required />
                <input name="youtubeId" value="${escapeHtml(
                  unit.youtubeId
                )}" required />
                <input
                  name="order"
                  type="number"
                  min="1"
                  value="${Number(unit.order) || 1}"
                  required
                />
              </div>
              <div class="card-actions">
                <button class="button secondary" type="submit">Save unit</button>
                <button class="button ghost" type="button" data-action="delete-unit">Delete</button>
              </div>
            </form>
          `
        )
        .join("");

      return `
        <div class="card course-card" data-course-id="${escapeHtml(course.id)}">
          <div class="card-body">
            <div class="form">
              <div class="row">
                <input name="title" value="${escapeHtml(
                  course.title
                )}" required />
                <input
                  name="thumbnailUrl"
                  value="${escapeHtml(course.thumbnailUrl)}"
                  required
                />
              </div>
              <textarea name="description" required>${escapeHtml(
                course.description
              )}</textarea>
              <div class="card-actions">
                <button class="button" type="button" data-action="save-course">Save course</button>
                <button class="button secondary" type="button" data-action="delete-course">Delete course</button>
              </div>
            </div>

            <div style="margin-top: 20px;">
              <h3 class="section-title" style="font-size: 1.2rem;">Units</h3>
              <div class="list">${unitsHtml || ""}</div>
              ${
                units.length
                  ? ""
                  : `<div class="notice">No units added yet.</div>`
              }
              <form class="form add-unit-form" data-course-id="${escapeHtml(
                course.id
              )}">
                <div class="row">
                  <input name="title" placeholder="Unit title" required />
                  <input name="youtubeId" placeholder="YouTube video ID" required />
                  <input name="order" type="number" min="1" placeholder="Order" />
                </div>
                <button class="button" type="submit">Add unit</button>
              </form>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  attachAdminHandlers();
}

function attachAdminHandlers() {
  const createForm = document.getElementById("create-course-form");
  if (createForm && !createForm.dataset.bound) {
    createForm.dataset.bound = "true";
    createForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(createForm);
      const title = String(formData.get("title") || "").trim();
      const description = String(formData.get("description") || "").trim();
      const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim();

      if (!title || !description || !thumbnailUrl) return;

      const now = new Date().toISOString();
      addCourse({
        id: generateId("course"),
        title,
        description,
        thumbnailUrl,
        units: [],
        createdAt: now,
        updatedAt: now,
      });

      createForm.reset();
      renderAdminCourses();
    });
  }

  document.querySelectorAll(".course-card").forEach((card) => {
    const courseId = card.dataset.courseId;
    const saveCourseBtn = card.querySelector("[data-action='save-course']");
    const deleteCourseBtn = card.querySelector("[data-action='delete-course']");

    if (saveCourseBtn) {
      saveCourseBtn.addEventListener("click", () => {
        const titleInput = card.querySelector("input[name='title']");
        const descriptionInput = card.querySelector(
          "textarea[name='description']"
        );
        const thumbnailInput = card.querySelector("input[name='thumbnailUrl']");
        const title = titleInput ? titleInput.value.trim() : "";
        const description = descriptionInput ? descriptionInput.value.trim() : "";
        const thumbnailUrl = thumbnailInput ? thumbnailInput.value.trim() : "";

        if (!title || !description || !thumbnailUrl) return;
        updateCourse(courseId, { title, description, thumbnailUrl });
        renderAdminCourses();
      });
    }

    if (deleteCourseBtn) {
      deleteCourseBtn.addEventListener("click", () => {
        const confirmDelete = window.confirm(
          "Delete this course and all its units?"
        );
        if (!confirmDelete) return;
        deleteCourse(courseId);
        renderAdminCourses();
      });
    }

    const addUnitForm = card.querySelector(".add-unit-form");
    if (addUnitForm) {
      addUnitForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(addUnitForm);
        const title = String(formData.get("title") || "").trim();
        const youtubeId = String(formData.get("youtubeId") || "").trim();
        const orderValue = Number(formData.get("order"));
        const units = getUnitsByCourse(courseId);
        const order = Number.isFinite(orderValue) && orderValue > 0
          ? orderValue
          : units.length + 1;

        if (!title || !youtubeId) return;

        const now = new Date().toISOString();
        addUnit({
          id: generateId("unit"),
          courseId,
          title,
          youtubeId,
          order,
          createdAt: now,
          updatedAt: now,
        });

        addUnitForm.reset();
        renderAdminCourses();
      });
    }

    card.querySelectorAll(".unit-form").forEach((form) => {
      const unitId = form.dataset.unitId;
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const titleInput = form.querySelector("input[name='title']");
        const youtubeInput = form.querySelector("input[name='youtubeId']");
        const orderInput = form.querySelector("input[name='order']");
        const title = titleInput ? titleInput.value.trim() : "";
        const youtubeId = youtubeInput ? youtubeInput.value.trim() : "";
        const order = Number(orderInput ? orderInput.value : NaN);

        if (!title || !youtubeId || !Number.isFinite(order)) return;
        updateUnit(unitId, { title, youtubeId, order });
        renderAdminCourses();
      });

      const deleteUnitBtn = form.querySelector("[data-action='delete-unit']");
      if (deleteUnitBtn) {
        deleteUnitBtn.addEventListener("click", () => {
          const confirmDelete = window.confirm("Delete this unit?");
          if (!confirmDelete) return;
          deleteUnit(unitId);
          renderAdminCourses();
        });
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const allowed = requireRole(
    "admin",
    "Admin access only. Redirecting to login...",
    "login.html?redirect=admin.html"
  );
  if (!allowed) return;

  renderAdminCourses();
});
