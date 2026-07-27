// ============================================================
// src/pages/signup/signup.ts
// Sign Up page controller — validates full name, email, password match,
// agreement check, creates user session, and redirects to profile.
// ============================================================

export function initSignup(): void {
  console.log("🚀 ~ Initializing Sign Up Page ~ 🚀");

  // ─── DOM References ───────────────────────────────────────
  const form = document.getElementById("signup-form") as HTMLFormElement | null;
  const fullNameInput = document.getElementById("signup-fullname") as HTMLInputElement | null;
  const emailInput = document.getElementById("signup-email") as HTMLInputElement | null;
  const passwordInput = document.getElementById("signup-password") as HTMLInputElement | null;
  const confirmPasswordInput = document.getElementById("signup-confirm-password") as HTMLInputElement | null;
  const agreeTermsCheck = document.getElementById("agree-terms") as HTMLInputElement | null;
  const togglePasswordBtn = document.getElementById("btn-toggle-signup-password");
  const alertContainer = document.getElementById("signup-alert-container");

  // ─── Password Show / Hide Toggle ─────────────────────────
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      if (confirmPasswordInput) {
        confirmPasswordInput.type = isPassword ? "text" : "password";
      }
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

      const fullName = fullNameInput?.value.trim() ?? "";
      const email = emailInput?.value.trim() ?? "";
      const password = passwordInput?.value.trim() ?? "";
      const confirmPassword = confirmPasswordInput?.value.trim() ?? "";
      const isAgreed = agreeTermsCheck?.checked ?? false;

      // Validation
      if (!fullName || !email || !password || !confirmPassword) {
        showAlert("danger", "Please fill in all required fields.");
        return;
      }

      if (!validateEmail(email)) {
        showAlert("warning", "Please enter a valid email address.");
        return;
      }

      if (password.length < 6) {
        showAlert("warning", "Password must be at least 6 characters long.");
        return;
      }

      if (password !== confirmPassword) {
        showAlert("danger", "Passwords do not match. Please verify and try again.");
        return;
      }

      if (!isAgreed) {
        showAlert("warning", "You must agree to the Terms of Service to create an account.");
        return;
      }

      // Simulate Sign Up Success
      const userData = {
        name: fullName,
        email: email,
        loggedIn: true,
        joinedDate: new Date().toISOString(),
      };

      localStorage.setItem("user", JSON.stringify(userData));

      showAlert(
        "success",
        `Account created successfully for <strong>${userData.name}</strong>! Redirecting...`
      );

      // Disable form submit button
      const submitBtn = document.getElementById("btn-signup-submit") as HTMLButtonElement | null;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Creating Account...`;
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