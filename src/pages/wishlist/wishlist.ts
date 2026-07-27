// ============================================================
// src/pages/wishlist/wishlist.ts
// Wishlist page controller — renders saved items from localStorage,
// handles item removal, single & bulk transfer to shopping cart.
// ============================================================

import { productApi } from "../../lib/api";
import type { Product } from "../../lib/types";
import { updateNavbarBadges } from "../../router";

export function initWishlist(): void {
  console.log("🚀 ~ Initializing Wishlist Page ~ 🚀");

  // ─── State ────────────────────────────────────────────────
  let wishlistProducts: Product[] = [];

  // ─── DOM References ───────────────────────────────────────
  const mainContainer = document.getElementById("wishlist-main-container");
  const headerCount = document.getElementById("wishlist-header-count");
  const btnMoveAllCart = document.getElementById("btn-move-all-cart") as HTMLButtonElement | null;

  // ─── Load Wishlist Data ───────────────────────────────────
  const loadWishlistData = async (): Promise<void> => {
    const rawWishlist: string[] = JSON.parse(localStorage.getItem("wishlist") ?? "[]");

    if (rawWishlist.length === 0) {
      wishlistProducts = [];
      updateNavbarBadges();
      renderEmptyWishlist();
      return;
    }

    // De-duplicate IDs
    const uniqueIds = Array.from(new Set(rawWishlist.map((id) => parseInt(String(id), 10)).filter((id) => !isNaN(id))));

    if (uniqueIds.length === 0) {
      wishlistProducts = [];
      updateNavbarBadges();
      renderEmptyWishlist();
      return;
    }

    try {
      const promises = uniqueIds.map((id) => productApi.getById(id));
      const responses = await Promise.all(promises);
      wishlistProducts = responses.map((res) => res.data);

      updateNavbarBadges();
      renderWishlistGrid();
    } catch (error) {
      console.error("Failed to load wishlist items:", error);
      if (mainContainer) {
        mainContainer.innerHTML = `
          <div class="col-12 text-center py-5 text-white-50">
            <i class="bx bx-error-circle bx-lg"></i>
            <h4 class="mt-3 text-white">Error Loading Wishlist</h4>
            <p>Failed to retrieve saved products. Please try refreshing.</p>
            <a href="/products" class="btn btn-lighter btn-ecommerco mt-2" onclick="event.preventDefault(); route('/products')">Explore Products</a>
          </div>
        `;
      }
    }
  };

  // ─── Save Wishlist to LocalStorage ────────────────────────
  const saveWishlistState = (): void => {
    const ids = wishlistProducts.map((p) => String(p.id));
    localStorage.setItem("wishlist", JSON.stringify(ids));
    updateNavbarBadges();

    if (headerCount) {
      headerCount.textContent = `${wishlistProducts.length} saved item${wishlistProducts.length === 1 ? "" : "s"}`;
    }
  };

  // ─── Render Empty State ──────────────────────────────────
  const renderEmptyWishlist = (): void => {
    if (!mainContainer) return;
    if (headerCount) headerCount.textContent = "0 saved items";
    if (btnMoveAllCart) btnMoveAllCart.classList.add("d-none");

    mainContainer.innerHTML = `
      <div class="row justify-content-center py-4">
        <div class="col-12 col-md-8 col-lg-6 text-center">
          <div class="p-5 rounded-4 bg-dark-ops border border-white border-opacity-10 shadow-lg">
            <div class="mb-4">
              <i class="bx bx-heart text-danger" style="font-size: 5.5rem;"></i>
            </div>
            <h3 class="text-white mb-2 fw-bold">Your Wishlist is Empty</h3>
            <p class="text-white-50 mb-4">You haven't saved any items to your wishlist yet. Explore our products and tap the heart icon to save items you love!</p>
            <a href="/products" class="btn btn-lighter btn-ecommerco px-4 py-2 text-uppercase fw-semibold" onclick="event.preventDefault(); route('/products')">
              <i class="bx bx-store me-2"></i>Explore Catalog
            </a>
          </div>
        </div>
      </div>
    `;
  };

  // ─── Render Active Wishlist Grid ─────────────────────────
  const renderWishlistGrid = (): void => {
    if (!mainContainer) return;

    if (wishlistProducts.length === 0) {
      renderEmptyWishlist();
      return;
    }

    if (headerCount) {
      headerCount.textContent = `${wishlistProducts.length} saved item${wishlistProducts.length === 1 ? "" : "s"}`;
    }

    if (btnMoveAllCart) {
      btnMoveAllCart.classList.remove("d-none");
    }

    mainContainer.innerHTML = `
      <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
        ${wishlistProducts
          .map((product) => {
            const discountedPrice = (
              product.price -
              (product.price * product.discountPercentage) / 100
            ).toFixed(2);

            return `
              <div class="col" data-wishlist-id="${product.id}">
                <div class="card h-100 bg-dark-ops border border-white border-opacity-10 rounded-4 overflow-hidden shadow-lg hover-elevate transition-2">
                  <!-- Product Thumbnail -->
                  <div class="position-relative bg-light-ops p-3 text-center" style="height: 220px;">
                    ${
                      product.discountPercentage > 0
                        ? `<span class="badge bg-danger position-absolute top-0 start-0 m-3 px-2 py-1 fs-7 fw-bold">-${Math.round(product.discountPercentage)}%</span>`
                        : ""
                    }
                    <a href="/product-details?id=${product.id}" onclick="event.preventDefault(); route('/product-details?id=${product.id}')" class="d-block w-100 h-100">
                      <img src="${product.images[0]}" alt="${product.title}" class="img-fluid w-100 h-100" style="object-fit: contain;" />
                    </a>
                  </div>

                  <!-- Card Body -->
                  <div class="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                      <div class="text-white-50 small text-capitalize mb-1">
                        ${product.brand} | <span class="text-white">${product.category}</span>
                      </div>
                      <h6 class="card-title text-white fw-bold mb-2 text-truncate">
                        <a href="/product-details?id=${product.id}" onclick="event.preventDefault(); route('/product-details?id=${product.id}')" class="text-white text-decoration-none hover-text-primary">
                          ${product.title}
                        </a>
                      </h6>
                      
                      <!-- Rating & Stock -->
                      <div class="d-flex align-items-center gap-2 mb-3">
                        <div class="text-warning small">
                          <i class="bx bxs-star"></i>
                          <span>${product.rating.toFixed(1)}</span>
                        </div>
                        <span class="text-white-50 fs-7">•</span>
                        <span class="fs-7 ${product.stock > 0 ? "text-success" : "text-danger"}">
                          ${product.stock > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <!-- Price Row -->
                      <div class="d-flex align-items-baseline gap-2 mb-3">
                        <span class="text-white fw-bold fs-5">$${discountedPrice}</span>
                        ${
                          product.discountPercentage > 0
                            ? `<span class="text-white-50 text-decoration-line-through small">$${product.price.toFixed(2)}</span>`
                            : ""
                        }
                      </div>

                      <!-- Action Buttons -->
                      <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-lighter btn-ecommerco flex-grow-1 py-2 text-uppercase fw-semibold fs-7 d-flex align-items-center justify-content-center gap-1 js-add-to-cart" data-id="${product.id}">
                          <i class="bx bx-shopping-bag fs-6"></i> Add to Cart
                        </button>
                        <button class="btn btn-sm rounded-circle js-remove-wishlist" style="width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; background: rgba(255, 77, 77, 0.2); border: 1px solid rgba(255, 107, 107, 0.4);" data-id="${product.id}" title="Remove from wishlist">
                          <i class="bx bx-trash fs-6 m-0 p-0" style="color: #ff6b6b;"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;

    setupWishlistEventListeners();
  };

  // ─── Event Listeners ─────────────────────────────────────
  const setupWishlistEventListeners = (): void => {
    if (!mainContainer) return;

    // 1. Add to Cart (Single Product)
    mainContainer.querySelectorAll<HTMLButtonElement>(".js-add-to-cart").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idStr = btn.dataset.id;
        if (!idStr) return;

        const cart: string[] = JSON.parse(localStorage.getItem("cart") ?? "[]");
        cart.push(idStr);
        localStorage.setItem("cart", JSON.stringify(cart));

        // Update Navbar Badge
        const badge = document.querySelector<HTMLElement>(".badge-notification");
        if (badge) {
          badge.textContent = String(cart.length);
        }

        // Feedback
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="bx bx-check fs-6"></i> Added!`;
        btn.classList.add("btn-success");
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.classList.remove("btn-success");
        }, 1500);
      });
    });

    // 2. Remove Single Item from Wishlist
    mainContainer.querySelectorAll<HTMLButtonElement>(".js-remove-wishlist").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id ?? "0", 10);
        wishlistProducts = wishlistProducts.filter((p) => p.id !== id);
        saveWishlistState();
        renderWishlistGrid();
      });
    });

    // 3. Move All to Cart
    if (btnMoveAllCart) {
      btnMoveAllCart.addEventListener("click", () => {
        if (wishlistProducts.length === 0) return;

        const cart: string[] = JSON.parse(localStorage.getItem("cart") ?? "[]");
        wishlistProducts.forEach((p) => {
          cart.push(String(p.id));
        });

        localStorage.setItem("cart", JSON.stringify(cart));

        // Update Navbar Badge
        const badge = document.querySelector<HTMLElement>(".badge-notification");
        if (badge) {
          badge.textContent = String(cart.length);
        }

        // Clear Wishlist
        wishlistProducts = [];
        saveWishlistState();
        renderEmptyWishlist();
      });
    }
  };

  // ─── Initialize ───────────────────────────────────────────
  loadWishlistData();
}