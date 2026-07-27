// ============================================================
// src/pages/signin/signin.ts
// Sign In page controller — validates form, handles show/hide password,
// persists user session to localStorage, and redirects to profile.
// ============================================================

export function initSignin(): void {
  console.log("🚀 ~ Initializing Sign In Page ~ 🚀");

  // ─── DOM References ───────────────────────────────────────
  const form = document.getElementById("signin-form") as HTMLFormElement | null;
  const emailInput = document.getElementById("signin-email") as HTMLInputElement | null;
  const passwordInput = document.getElementById("signin-password") as HTMLInputElement | null;
  const togglePasswordBtn = document.getElementById("btn-toggle-signin-password");
  const alertContainer = document.getElementById("signin-alert-container");

  // ─── Password Show / Hide Toggle ─────────────────────────
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      const icon = togglePasswordBtn.querySelector("i");
      if (icon) {
        icon.className = isPassword ? "bx bx-eye-off" : "bx bx-eye";
      }
    });
  }

  // ─── Form Submission Handling ─────────────────────────────
  if (form) {
    form.addEventListener("submit", (e: Event) => {
      e.preventDefault();

      const email = emailInput?.value.trim() ?? "";
      const password = passwordInput?.value.trim() ?? "";

      // Validation
      if (!email || !password) {
        showAlert("danger", "Please fill in both email and password fields.");
        return;
      }

      if (!validateEmail(email)) {
        showAlert("warning", "Please enter a valid email address.");
        return;
      }

      // Simulate Sign In Success
      const userData = {
        name: email.split("@")[0].toUpperCase(),
        email: email,
        loggedIn: true,
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem("user", JSON.stringify(userData));

      showAlert(
        "success",
        `Welcome back, <strong>${userData.name}</strong>! Redirecting to your profile...`
      );

      // Disable form submit button
      const submitBtn = document.getElementById("btn-signin-submit") as HTMLButtonElement | null;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Signing In...`;
      }

      // SPA Redirect to Profile
      setTimeout(() => {
        if (typeof (window as any).route === "function") {
          (window as any).route("/profile");
        } else {
          window.location.href = "/profile";
        }
      }, 1200);
    });
  }

  // ─── Helper Functions ─────────────────────────────────────
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const showAlert = (type: "danger" | "warning" | "success", message: string): void => {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-${type} bg-opacity-25 border border-${type} border-opacity-50 text-white rounded-3 p-3 mb-3 fs-7" role="alert">
        <i class="bx ${type === "success" ? "bx-check-circle text-success" : type === "warning" ? "bx-error text-warning" : "bx-x-circle text-danger"} me-2 fs-6"></i>
        ${message}
      </div>
    `;
  };
}