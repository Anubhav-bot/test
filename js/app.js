seedData();

function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

function formatPercent(value) {
  return `${Math.min(100, Math.max(0, value))}%`;
}

function renderNav() {
  const nav = document.getElementById("main-nav");
  if (!nav) return;
  const role = getCurrentRole();
  const links = [{ href: "index.html", label: "Catalog" }];

  if (role === "user") {
    links.push({ href: "dashboard.html", label: "Dashboard" });
  }

  if (role === "admin") {
    links.push({ href: "admin.html", label: "Admin" });
  }

  nav.innerHTML = links
    .map((link) => `<a href="${link.href}">${link.label}</a>`)
    .join("");

  const current = window.location.pathname.split("/").pop();
  [...nav.querySelectorAll("a")].forEach((anchor) => {
    if (anchor.getAttribute("href") === current) {
      anchor.classList.add("active");
    }
  });
}

function renderAuthActions() {
  const container = document.getElementById("auth-actions");
  if (!container) return;
  const user = getCurrentUser();

  if (!user) {
    container.innerHTML = `<a class="button secondary" href="login.html">Log in</a>`;
    return;
  }

  container.innerHTML = `
    <span class="subtle">Hi, ${user.name || user.email}</span>
    <button class="button secondary" id="logout-btn">Log out</button>
  `;

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
      window.location.href = "index.html";
    });
  }
}

function requireRole(role, fallbackMessage, redirectTo) {
  const currentRole = getCurrentRole();
  if (currentRole !== role) {
    if (fallbackMessage) {
      const container = document.getElementById("page-message");
      if (container) {
        container.innerHTML = `<div class="notice danger">${fallbackMessage}</div>`;
      }
    }
    if (redirectTo) {
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 800);
    }
    return false;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  renderNav();
  renderAuthActions();
});
