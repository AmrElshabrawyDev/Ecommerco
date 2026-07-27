// ============================================================
// src/pages/contact/contact.ts
// Contact Us page controller — validates contact form inputs,
// displays real-time feedback, and simulates message dispatching.
// ============================================================

export function initContact(): void {
  console.log("🚀 ~ Initializing Contact Page ~ 🚀");

  // ─── DOM References ───────────────────────────────────────
  const form = document.getElementById("contact-form") as HTMLFormElement | null;
  const nameInput = document.getElementById("contact-name") as HTMLInputElement | null;
  const emailInput = document.getElementById("contact-email") as HTMLInputElement | null;
  const subjectInput = document.getElementById("contact-subject") as HTMLInputElement | null;
  const messageInput = document.getElementById("contact-message") as HTMLTextAreaElement | null;
  const alertContainer = document.getElementById("contact-alert-container");

  // ─── Form Submission Handling ─────────────────────────────
  if (form) {
    form.addEventListener("submit", (e: Event) => {
      e.preventDefault();

      const name = nameInput?.value.trim() ?? "";
      const email = emailInput?.value.trim() ?? "";
      const subject = subjectInput?.value.trim() ?? "";
      const message = messageInput?.value.trim() ?? "";

      // Validation
      if (!name || !email || !subject || !message) {
        showAlert("danger", "Please fill in all form fields before submitting.");
        return;
      }

      if (!validateEmail(email)) {
        showAlert("warning", "Please enter a valid email address.");
        return;
      }

      // Show Success Toast
      showAlert(
        "success",
        `Thank you <strong>${name}</strong>! Your message regarding "${subject}" has been received. Our team will contact you shortly.`
      );

      // Disable Submit Button temporarily
      const submitBtn = document.getElementById("btn-contact-submit") as HTMLButtonElement | null;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="bx bx-check-circle me-1"></i> Message Sent!`;
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i class="bx bx-paper-plane fs-5 me-1"></i> Send Message`;
        }, 3000);
      }

      // Reset form
      form.reset();
    });
  }

  // ─── Helper Functions ─────────────────────────────────────
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const showAlert = (type: "danger" | "warning" | "success", msg: string): void => {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-${type} bg-opacity-25 border border-${type} border-opacity-50 text-white rounded-3 p-3 mb-4 fs-7" role="alert">
        <i class="bx ${type === "success" ? "bx-check-circle text-success" : type === "warning" ? "bx-error text-warning" : "bx-x-circle text-danger"} me-2 fs-6"></i>
        ${msg}
      </div>
    `;

    setTimeout(() => {
      alertContainer.innerHTML = "";
    }, 5000);
  };
}