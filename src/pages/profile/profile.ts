// ============================================================
// src/pages/profile/profile.ts
// User Profile page controller — manages session auth state,
// tabbed dashboard (Profile, Orders, Security), profile editing, and logout.
// ============================================================

import { updateNavbarBadges } from "../../router";

interface UserSession {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  loggedIn: boolean;
  joinedDate?: string;
}

export function initProfile(): void {
  console.log("🚀 ~ Initializing Profile Page ~ 🚀");

  // ─── DOM References ───────────────────────────────────────
  const mainContainer = document.getElementById("profile-main-container");

  // ─── Check Session ────────────────────────────────────────
  const rawUser = localStorage.getItem("user");
  if (!rawUser) {
    renderGuestState();
    return;
  }

  let user: UserSession;
  try {
    user = JSON.parse(rawUser);
    if (!user || !user.email) {
      renderGuestState();
      return;
    }
  } catch (error) {
    renderGuestState();
    return;
  }

  // ─── Render Logged-in Dashboard ───────────────────────────
  renderDashboard(user);

  // ─── Render Guest View ────────────────────────────────────
  function renderGuestState(): void {
    if (!mainContainer) return;
    mainContainer.innerHTML = `
      <div class="row justify-content-center py-4">
        <div class="col-12 col-md-8 col-lg-6 text-center">
          <div class="p-5 rounded-4 bg-dark-ops border border-white border-opacity-10 shadow-lg">
            <div class="mb-4">
              <i class="bx bx-user-circle text-primary-ops" style="font-size: 5.5rem;"></i>
            </div>
            <h3 class="text-white mb-2 fw-bold">Sign In Required</h3>
            <p class="text-white-50 mb-4">You are currently browsing as a guest. Please sign in or create an account to manage your profile, orders, and addresses.</p>
            <div class="d-flex justify-content-center gap-3 flex-wrap">
              <a href="/signin" class="btn btn-lighter btn-ecommerco px-4 py-2 text-uppercase fw-semibold" onclick="event.preventDefault(); route('/signin')">
                <i class="bx bx-log-in me-1"></i> Sign In
              </a>
              <a href="/signup" class="btn btn-outline-light px-4 py-2 text-uppercase fw-semibold border-white border-opacity-25" onclick="event.preventDefault(); route('/signup')">
                <i class="bx bx-user-plus me-1"></i> Create Account
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ─── Render Dashboard ─────────────────────────────────────
  function renderDashboard(userData: UserSession): void {
    if (!mainContainer) return;

    // Get live counts
    const wishlist: string[] = JSON.parse(localStorage.getItem("wishlist") ?? "[]");
    const cart: string[] = JSON.parse(localStorage.getItem("cart") ?? "[]");

    // Extract initials
    const nameParts = userData.name.trim().split(" ");
    const initials =
      nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : (nameParts[0]?.[0] ?? "U").toUpperCase();

    mainContainer.innerHTML = `
      <!-- User Banner Card -->
      <div class="card bg-dark-ops border border-white border-opacity-10 rounded-4 shadow-lg p-4 mb-4">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="d-flex align-items-center gap-3">
            <!-- Avatar Initials Circle -->
            <div class="rounded-circle bg-primary-ops text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0" style="width: 70px; height: 70px; font-size: 1.6rem; border: 2px solid rgba(255,255,255,0.2);">
              ${initials}
            </div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <h4 class="text-white fw-bold mb-0">${userData.name}</h4>
                <span class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 fs-7">Active Member</span>
              </div>
              <p class="text-white-50 mb-0 fs-7 mt-1">${userData.email}</p>
            </div>
          </div>

          <button id="btn-logout" class="btn btn-outline-danger btn-sm text-uppercase px-3 py-2 border-opacity-25 d-flex align-items-center gap-1">
            <i class="bx bx-log-out fs-5"></i> Log Out
          </button>
        </div>

        <!-- Quick Stats Row -->
        <div class="row row-cols-1 row-cols-sm-3 g-3 mt-4 pt-3 border-top border-white border-opacity-10">
          <div class="col">
            <div class="bg-light-ops p-3 rounded-3 border border-white border-opacity-10 text-center">
              <div class="fs-4 fw-bold text-white">${cart.length}</div>
              <div class="text-white-50 fs-7 text-uppercase">Items in Cart</div>
            </div>
          </div>
          <div class="col">
            <div class="bg-light-ops p-3 rounded-3 border border-white border-opacity-10 text-center">
              <div class="fs-4 fw-bold text-white">${wishlist.length}</div>
              <div class="text-white-50 fs-7 text-uppercase">Saved Wishlist</div>
            </div>
          </div>
          <div class="col">
            <div class="bg-light-ops p-3 rounded-3 border border-white border-opacity-10 text-center">
              <div class="fs-4 fw-bold text-white">2</div>
              <div class="text-white-50 fs-7 text-uppercase">Completed Orders</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard Tabs Grid -->
      <div class="row g-4">
        <!-- Tab Controls (Sidebar) -->
        <div class="col-lg-3">
          <div class="bg-dark-ops rounded-4 p-3 border border-white border-opacity-10 shadow-lg nav flex-column nav-pills gap-2">
            <button class="nav-link text-start text-white active p-3 rounded-3 d-flex align-items-center gap-2 js-tab-btn" data-tab="info">
              <i class="bx bx-user fs-5"></i> Personal Information
            </button>
            <button class="nav-link text-start text-white p-3 rounded-3 d-flex align-items-center gap-2 js-tab-btn" data-tab="orders">
              <i class="bx bx-package fs-5"></i> Recent Orders
            </button>
            <button class="nav-link text-start text-white p-3 rounded-3 d-flex align-items-center gap-2 js-tab-btn" data-tab="security">
              <i class="bx bx-shield-quarter fs-5"></i> Account Security
            </button>
          </div>
        </div>

        <!-- Tab Content View -->
        <div class="col-lg-9">
          <div class="bg-dark-ops rounded-4 p-4 border border-white border-opacity-10 shadow-lg min-vh-50">
            <!-- Alert Feedback -->
            <div id="profile-alert"></div>

            <!-- TAB 1: Personal Information -->
            <div id="tab-content-info" class="js-tab-pane">
              <h5 class="text-white fw-bold mb-4 pb-2 border-bottom border-white border-opacity-10">Personal Details</h5>
              <form id="form-update-profile">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label for="prof-name" class="form-label text-white-50 fs-7">Full Name</label>
                    <input type="text" id="prof-name" class="form-control bg-light-ops text-white border-white border-opacity-25 shadow-none" value="${userData.name}" required />
                  </div>
                  <div class="col-md-6">
                    <label for="prof-email" class="form-label text-white-50 fs-7">Email Address</label>
                    <input type="email" id="prof-email" class="form-control bg-light-ops text-white border-white border-opacity-25 shadow-none" value="${userData.email}" required />
                  </div>
                  <div class="col-md-6">
                    <label for="prof-phone" class="form-label text-white-50 fs-7">Phone Number</label>
                    <input type="text" id="prof-phone" class="form-control bg-light-ops text-white border-white border-opacity-25 shadow-none" value="${userData.phone ?? "+20 100 123 4567"}" />
                  </div>
                  <div class="col-md-6">
                    <label for="prof-address" class="form-label text-white-50 fs-7">Default Shipping Address</label>
                    <input type="text" id="prof-address" class="form-control bg-light-ops text-white border-white border-opacity-25 shadow-none" value="${userData.address ?? "Cairo, Egypt"}" />
                  </div>
                </div>

                <div class="mt-4 pt-3 border-top border-white border-opacity-10">
                  <button type="submit" class="btn btn-lighter btn-ecommerco px-4 py-2 text-uppercase fw-semibold">
                    <i class="bx bx-save me-1"></i> Save Changes
                  </button>
                </div>
              </form>
            </div>

            <!-- TAB 2: Recent Orders -->
            <div id="tab-content-orders" class="js-tab-pane d-none">
              <h5 class="text-white fw-bold mb-4 pb-2 border-bottom border-white border-opacity-10">Recent Order History</h5>
              <div class="table-responsive">
                <table class="table table-dark align-middle text-white mb-0 bg-transparent" style="--bs-table-bg: transparent; background-color: transparent !important;">
                  <thead>
                    <tr class="text-white-50 border-bottom border-white border-opacity-10 fs-7 text-uppercase" style="background-color: transparent !important;">
                      <th scope="col" style="background-color: transparent !important;">Order ID</th>
                      <th scope="col" style="background-color: transparent !important;">Date</th>
                      <th scope="col" style="background-color: transparent !important;">Status</th>
                      <th scope="col" style="background-color: transparent !important;" class="text-end">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody style="background-color: transparent !important;">
                    <tr style="background-color: transparent !important;">
                      <td class="fw-bold" style="background-color: transparent !important;">#ORD-98421</td>
                      <td class="text-white-50" style="background-color: transparent !important;">July 24, 2026</td>
                      <td style="background-color: transparent !important;"><span class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50">Delivered</span></td>
                      <td class="text-end fw-bold text-primary-ops" style="background-color: transparent !important;">$149.99</td>
                    </tr>
                    <tr style="background-color: transparent !important;">
                      <td class="fw-bold" style="background-color: transparent !important;">#ORD-97105</td>
                      <td class="text-white-50" style="background-color: transparent !important;">June 18, 2026</td>
                      <td style="background-color: transparent !important;"><span class="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50">Completed</span></td>
                      <td class="text-end fw-bold text-primary-ops" style="background-color: transparent !important;">$289.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- TAB 3: Security Settings -->
            <div id="tab-content-security" class="js-tab-pane d-none">
              <h5 class="text-white fw-bold mb-4 pb-2 border-bottom border-white border-opacity-10">Account Security</h5>
              <form id="form-update-password">
                <div class="mb-3">
                  <label for="sec-current-pass" class="form-label text-white-50 fs-7">Current Password</label>
                  <input type="password" id="sec-current-pass" class="form-control bg-light-ops text-white border-white border-opacity-25 shadow-none" placeholder="••••••••" required />
                </div>
                <div class="mb-3">
                  <label for="sec-new-pass" class="form-label text-white-50 fs-7">New Password</label>
                  <input type="password" id="sec-new-pass" class="form-control bg-light-ops text-white border-white border-opacity-25 shadow-none" placeholder="At least 6 characters" required />
                </div>
                <div class="mb-4">
                  <label for="sec-confirm-pass" class="form-label text-white-50 fs-7">Confirm New Password</label>
                  <input type="password" id="sec-confirm-pass" class="form-control bg-light-ops text-white border-white border-opacity-25 shadow-none" placeholder="Re-enter new password" required />
                </div>

                <button type="submit" class="btn btn-lighter btn-ecommerco px-4 py-2 text-uppercase fw-semibold">
                  <i class="bx bx-lock-alt me-1"></i> Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    setupDashboardEvents(userData);
  }

  // ─── Setup Dashboard Events ───────────────────────────────
  function setupDashboardEvents(userData: UserSession): void {
    if (!mainContainer) return;

    // 1. Tab Switching
    const tabBtns = mainContainer.querySelectorAll<HTMLButtonElement>(".js-tab-btn");
    const tabPanes = mainContainer.querySelectorAll<HTMLElement>(".js-tab-pane");

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.dataset.tab;
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        tabPanes.forEach((pane) => {
          if (pane.id === `tab-content-${targetTab}`) {
            pane.classList.remove("d-none");
          } else {
            pane.classList.add("d-none");
          }
        });
      });
    });

    // 2. Profile Info Form Submit
    const infoForm = document.getElementById("form-update-profile");
    if (infoForm) {
      infoForm.addEventListener("submit", (e: Event) => {
        e.preventDefault();
        const nameInput = document.getElementById("prof-name") as HTMLInputElement;
        const emailInput = document.getElementById("prof-email") as HTMLInputElement;
        const phoneInput = document.getElementById("prof-phone") as HTMLInputElement;
        const addressInput = document.getElementById("prof-address") as HTMLInputElement;

        const updatedUser: UserSession = {
          ...userData,
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          phone: phoneInput.value.trim(),
          address: addressInput.value.trim(),
        };

        localStorage.setItem("user", JSON.stringify(updatedUser));
        showProfileAlert("success", "Profile details updated successfully!");
        renderDashboard(updatedUser);
      });
    }

    // 3. Password Update Form Submit
    const passwordForm = document.getElementById("form-update-password");
    if (passwordForm) {
      passwordForm.addEventListener("submit", (e: Event) => {
        e.preventDefault();
        const newPass = (document.getElementById("sec-new-pass") as HTMLInputElement).value;
        const confirmPass = (document.getElementById("sec-confirm-pass") as HTMLInputElement).value;

        if (newPass.length < 6) {
          showProfileAlert("warning", "New password must be at least 6 characters.");
          return;
        }

        if (newPass !== confirmPass) {
          showProfileAlert("danger", "New passwords do not match.");
          return;
        }

        showProfileAlert("success", "Your password has been changed successfully!");
        (passwordForm as HTMLFormElement).reset();
      });
    }

    // 4. Logout Handling
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        if (confirm("Are you sure you want to log out?")) {
          localStorage.removeItem("user");
          updateNavbarBadges();
          if (typeof (window as any).route === "function") {
            (window as any).route("/signin");
          } else {
            window.location.href = "/signin";
          }
        }
      });
    }
  }

  // ─── Helper Alert ─────────────────────────────────────────
  function showProfileAlert(type: "danger" | "warning" | "success", msg: string): void {
    const alertBox = document.getElementById("profile-alert");
    if (!alertBox) return;

    alertBox.innerHTML = `
      <div class="alert alert-${type} bg-opacity-25 border border-${type} border-opacity-50 text-white rounded-3 p-3 mb-4 fs-7" role="alert">
        <i class="bx ${type === "success" ? "bx-check-circle text-success" : type === "warning" ? "bx-error text-warning" : "bx-x-circle text-danger"} me-2 fs-6"></i>
        ${msg}
      </div>
    `;

    setTimeout(() => {
      alertBox.innerHTML = "";
    }, 4000);
  }
}