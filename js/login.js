document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const error = document.getElementById("login-error");
  const redirect = getQueryParam("redirect");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    const user = authenticate(email, password);
    if (!user) {
      if (error) {
        error.textContent = "Invalid credentials. Please use the demo accounts.";
      }
      return;
    }

    if (error) {
      error.textContent = "";
    }

    if (redirect) {
      window.location.href = redirect;
      return;
    }

    window.location.href = user.role === "admin" ? "admin.html" : "dashboard.html";
  });
});
