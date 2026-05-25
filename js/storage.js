const StorageKeys = {
  courses: "lms_courses",
  units: "lms_units",
  users: "lms_users",
  enrollments: "lms_enrollments",
  progress: "lms_progress",
  session: "lms_session",
};

const DEFAULT_USERS = [
  {
    id: "user_admin",
    email: "admin@gmail.com",
    password: "password",
    role: "admin",
    name: "Admin",
  },
  {
    id: "user_student",
    email: "user@gmail.com",
    password: "password",
    role: "user",
    name: "Student",
  },
];

const DEFAULT_COURSES = [
  {
    id: "course_web",
    title: "Web Fundamentals",
    description:
      "Learn the building blocks of the web: HTML, CSS, and JavaScript. Perfect for beginners who want to start shipping polished pages.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    units: ["unit_web_1", "unit_web_2", "unit_web_3"],
    createdAt: "2024-01-05T12:00:00Z",
    updatedAt: "2024-01-05T12:00:00Z",
  },
  {
    id: "course_product",
    title: "Product Design Essentials",
    description:
      "Understand the product design workflow, from user research to prototyping. Build a user-first mindset.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80",
    units: ["unit_product_1", "unit_product_2"],
    createdAt: "2024-01-10T12:00:00Z",
    updatedAt: "2024-01-10T12:00:00Z",
  },
];

const DEFAULT_UNITS = [
  {
    id: "unit_web_1",
    courseId: "course_web",
    title: "Welcome to the Web",
    youtubeId: "M7lc1UVf-VE",
    order: 1,
    createdAt: "2024-01-05T12:00:00Z",
    updatedAt: "2024-01-05T12:00:00Z",
  },
  {
    id: "unit_web_2",
    courseId: "course_web",
    title: "HTML & Structure",
    youtubeId: "ysz5S6PUM-U",
    order: 2,
    createdAt: "2024-01-05T12:00:00Z",
    updatedAt: "2024-01-05T12:00:00Z",
  },
  {
    id: "unit_web_3",
    courseId: "course_web",
    title: "CSS & Layout",
    youtubeId: "jV8B24rSN5o",
    order: 3,
    createdAt: "2024-01-05T12:00:00Z",
    updatedAt: "2024-01-05T12:00:00Z",
  },
  {
    id: "unit_product_1",
    courseId: "course_product",
    title: "Design Thinking Overview",
    youtubeId: "_r0VX-aU_T8",
    order: 1,
    createdAt: "2024-01-10T12:00:00Z",
    updatedAt: "2024-01-10T12:00:00Z",
  },
  {
    id: "unit_product_2",
    courseId: "course_product",
    title: "Wireframes & Prototypes",
    youtubeId: "9B7teD0YQGI",
    order: 2,
    createdAt: "2024-01-10T12:00:00Z",
    updatedAt: "2024-01-10T12:00:00Z",
  },
];

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Unable to access localStorage.", error);
  }
}

function seedData() {
  const users = loadJSON(StorageKeys.users, null);
  if (!Array.isArray(users) || users.length === 0) {
    saveJSON(StorageKeys.users, DEFAULT_USERS);
  }

  const courses = loadJSON(StorageKeys.courses, null);
  if (!Array.isArray(courses) || courses.length === 0) {
    saveJSON(StorageKeys.courses, DEFAULT_COURSES);
  }

  const units = loadJSON(StorageKeys.units, null);
  if (!Array.isArray(units) || units.length === 0) {
    saveJSON(StorageKeys.units, DEFAULT_UNITS);
  }

  const enrollments = loadJSON(StorageKeys.enrollments, null);
  if (!Array.isArray(enrollments)) {
    saveJSON(StorageKeys.enrollments, []);
  }

  const progress = loadJSON(StorageKeys.progress, null);
  if (!Array.isArray(progress)) {
    saveJSON(StorageKeys.progress, []);
  }
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function getCourses() {
  return loadJSON(StorageKeys.courses, []);
}

function setCourses(courses) {
  saveJSON(StorageKeys.courses, courses);
}

function getCourseById(courseId) {
  return getCourses().find((course) => course.id === courseId) || null;
}

function getUnits() {
  return loadJSON(StorageKeys.units, []);
}

function setUnits(units) {
  saveJSON(StorageKeys.units, units);
}

function getUnitsByCourse(courseId) {
  return getUnits()
    .filter((unit) => unit.courseId === courseId)
    .sort((a, b) => a.order - b.order);
}

function getUnitById(unitId) {
  return getUnits().find((unit) => unit.id === unitId) || null;
}

function addCourse(course) {
  const courses = getCourses();
  courses.push(course);
  setCourses(courses);
}

function updateCourse(courseId, updates) {
  const courses = getCourses();
  const index = courses.findIndex((course) => course.id === courseId);
  if (index === -1) return;
  courses[index] = {
    ...courses[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  setCourses(courses);
}

function deleteCourse(courseId) {
  const courses = getCourses().filter((course) => course.id !== courseId);
  setCourses(courses);

  const remainingUnits = getUnits().filter((unit) => unit.courseId !== courseId);
  setUnits(remainingUnits);

  const enrollments = getEnrollments().filter(
    (enrollment) => enrollment.courseId !== courseId
  );
  setEnrollments(enrollments);

  const progress = getProgress().filter(
    (entry) => entry.courseId !== courseId
  );
  setProgress(progress);
}

function syncCourseUnits(courseId) {
  const courses = getCourses();
  const course = courses.find((item) => item.id === courseId);
  if (!course) return;
  const units = getUnitsByCourse(courseId);
  course.units = units.map((unit) => unit.id);
  course.updatedAt = new Date().toISOString();
  setCourses(courses);
}

function addUnit(unit) {
  const units = getUnits();
  units.push(unit);
  setUnits(units);
  syncCourseUnits(unit.courseId);
}

function updateUnit(unitId, updates) {
  const units = getUnits();
  const index = units.findIndex((unit) => unit.id === unitId);
  if (index === -1) return;
  units[index] = {
    ...units[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  setUnits(units);
  syncCourseUnits(units[index].courseId);
}

function deleteUnit(unitId) {
  const units = getUnits();
  const unit = units.find((item) => item.id === unitId);
  if (!unit) return;
  const remainingUnits = units.filter((item) => item.id !== unitId);
  setUnits(remainingUnits);

  const progress = getProgress().filter((entry) => entry.unitId !== unitId);
  setProgress(progress);

  syncCourseUnits(unit.courseId);
}

function getUsers() {
  return loadJSON(StorageKeys.users, []);
}

function getUserByEmail(email) {
  return getUsers().find((user) => user.email === email) || null;
}

function getUserById(userId) {
  return getUsers().find((user) => user.id === userId) || null;
}

function getSession() {
  return loadJSON(StorageKeys.session, null);
}

function setSession(session) {
  saveJSON(StorageKeys.session, session);
}

function clearSession() {
  localStorage.removeItem(StorageKeys.session);
}

function getEnrollments() {
  return loadJSON(StorageKeys.enrollments, []);
}

function setEnrollments(enrollments) {
  saveJSON(StorageKeys.enrollments, enrollments);
}

function getEnrollment(userId, courseId) {
  return getEnrollments().find(
    (item) => item.userId === userId && item.courseId === courseId
  );
}

function getUserEnrollments(userId) {
  return getEnrollments().filter((item) => item.userId === userId);
}

function enrollUser(userId, courseId) {
  const enrollments = getEnrollments();
  const exists = enrollments.some(
    (item) => item.userId === userId && item.courseId === courseId
  );
  if (exists) return;
  enrollments.push({
    userId,
    courseId,
    enrolledAt: new Date().toISOString(),
  });
  setEnrollments(enrollments);
}

function getProgress() {
  return loadJSON(StorageKeys.progress, []);
}

function setProgress(progress) {
  saveJSON(StorageKeys.progress, progress);
}

function getProgressEntry(userId, unitId) {
  return getProgress().find(
    (entry) => entry.userId === userId && entry.unitId === unitId
  );
}

function upsertProgress({
  userId,
  courseId,
  unitId,
  lastWatchedSeconds,
  completed,
  completedAt,
}) {
  const progress = getProgress();
  const index = progress.findIndex(
    (entry) => entry.userId === userId && entry.unitId === unitId
  );
  const payload = {
    userId,
    courseId,
    unitId,
    lastWatchedSeconds,
    completed,
    completedAt: completed ? completedAt || new Date().toISOString() : null,
  };

  if (index === -1) {
    progress.push(payload);
  } else {
    progress[index] = { ...progress[index], ...payload };
  }
  setProgress(progress);
}

function getCourseProgressForUser(userId, courseId) {
  const units = getUnitsByCourse(courseId);
  const progress = getProgress().filter(
    (entry) => entry.userId === userId && entry.courseId === courseId
  );
  const completedCount = progress.filter((entry) => entry.completed).length;
  const percent = units.length
    ? Math.round((completedCount / units.length) * 100)
    : 0;
  return {
    completedCount,
    totalUnits: units.length,
    percent,
  };
}
