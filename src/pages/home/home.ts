// ============================================================
// src/pages/home/home.ts
// Home page initialization — fetches and renders products
// ============================================================

import { productApi } from "../../lib/api";
import type { Product, ApiResponse } from "../../lib/types";

export function initHome(): void {
  console.log("🚀 ~ Amr Elshabrawy ~ Home Page Init 🚀");

  let pageNum = 1;

  // ─── Fetch & Render ──────────────────────────────────────

  const getData = (): void => {
    showLoading();
    productApi
      .getTopRated(8)
      .then((response: ApiResponse<Product[]>) => {
        renderProducts(response.data);
      })
      .catch((error: unknown) => {
        showError();
        console.error("Failed to load products:", error);
      });
  };

  // ─── Loading State ────────────────────────────────────────

  const showLoading = (): void => {
    const productDiv = getProductDiv();
    if (!productDiv) return;
    productDiv.innerHTML = `
      <div class="col-12 d-flex justify-content-center py-5">
        <img src="assets/images/logos/svg-animation.svg" alt="Loading products..." />
      </div>
    `;
  };

  const showError = (): void => {
    const productDiv = getProductDiv();
    if (!productDiv) return;
    productDiv.innerHTML = `
      <div class="col-12 text-center py-5 text-white-50">
        <i class="bx bx-error-circle bx-lg"></i>
        <p class="mt-2">Failed to load products. Please try again.</p>
      </div>
    `;
  };

  // ─── Render ───────────────────────────────────────────────

  const renderProducts = (products: Product[]): void => {
    const productDiv = getProductDiv();
    if (!productDiv) return;

    // Build all HTML first, then set innerHTML once (performance)
    const html = products.map(buildProductCard).join("");
    productDiv.innerHTML = html;

    // Attach wishlist click events after rendering
    attachWishlistEvents(productDiv);
  };

  // ─── Product Card Builder ─────────────────────────────────

  const buildProductCard = (data: Product): string => {
    const discountedPrice = (
      data.price -
      (data.price * data.discountPercentage) / 100
    ).toFixed(2);
    const ratingWidth = ((data.rating * 100) / 5).toFixed(0);

    return `
      <div class="col">
        <div class="card product-card" data-product-id="${data.id}">

          <div class="card-header bg-transparent border-bottom-0">
            <div class="d-flex align-items-center justify-content-end gap-3 position-relative">
              <div class="product-compare">
                <span>
                  <i class="bx bx-git-compare"></i>
                  compare
                </span>
              </div>
              <div class="position-absolute start-0 top-0 mt-1">
                <button
                  class="product-wishlist cursor-pointer mb-2 border-0 bg-transparent js-wishlist-btn"
                  data-product-id="${data.id}"
                  title="Add to wishlist"
                  aria-label="Add ${data.title} to wishlist"
                >
                  <i class="bx bx-heart"></i>
                </button>
                <button
                  class="product-wishlist cursor-pointer mb-2 border-0 bg-transparent js-cart-btn"
                  data-product-id="${data.id}"
                  title="Add to cart"
                  aria-label="Add ${data.title} to cart"
                >
                  <i class="bx bxs-cart-add"></i>
                </button>
                <button
                  class="product-wishlist cursor-pointer border-0 bg-transparent js-zoom-btn"
                  data-product-id="${data.id}"
                  title="Quick view"
                  aria-label="Quick view ${data.title}"
                >
                  <i class="bx bx-zoom-in"></i>
                </button>
              </div>
            </div>
          </div>

          <a href="/product-details?id=${data.id}" onclick="event.preventDefault(); route('/product-details?id=${data.id}')" aria-label="View ${data.title}">
            <img
              class="card-img-top product-img"
              src="${data.images[0]}"
              alt="${data.title}"
              loading="lazy"
            />
          </a>

          <div class="card-body">
            <div class="product-info px-2">
              <a href="#">
                <p class="product-category">${data.brand}</p>
              </a>
              <a href="/product-details?id=${data.id}" onclick="event.preventDefault(); route('/product-details?id=${data.id}')">
                <h6 class="product-name mb-2">${data.title}</h6>
              </a>
              <div class="d-flex align-items-center">
                <div class="product-price mb-1">
                  <small class="text-decoration-line-through text-white-50 me-1">
                    $${data.price}
                  </small>
                  <small class="fs-5">$${discountedPrice}</small>
                </div>
                <div class="ms-auto">
                  <div class="product-rating" title="Rating: ${data.rating} / 5">
                    <div class="rating-star" style="width: ${ratingWidth}%;"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  };

  // ─── Event Delegation ────────────────────────────────────

  const attachWishlistEvents = (container: HTMLElement): void => {
    container.addEventListener("click", (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const wishlistBtn = target.closest<HTMLButtonElement>(".js-wishlist-btn");
      if (wishlistBtn) {
        handleWishlist(wishlistBtn);
        return;
      }

      const cartBtn = target.closest<HTMLButtonElement>(".js-cart-btn");
      if (cartBtn) {
        handleCart(cartBtn);
        return;
      }
    });
  };

  // ─── Wishlist Logic ───────────────────────────────────────

  const handleWishlist = (btn: HTMLButtonElement): void => {
    const icon = btn.querySelector("i");
    if (icon) icon.style.color = "red";

    const productId = btn.dataset.productId;
    const wishlist: string[] = JSON.parse(
      localStorage.getItem("wishlist") ?? "[]"
    );

    if (!wishlist.includes(productId!)) {
      wishlist.push(productId!);
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }
  };

  // ─── Cart Logic ───────────────────────────────────────────

  const handleCart = (btn: HTMLButtonElement): void => {
    const productId = btn.dataset.productId;
    const cart: string[] = JSON.parse(localStorage.getItem("cart") ?? "[]");

    cart.push(productId!);
    localStorage.setItem("cart", JSON.stringify(cart));

    // Update cart badge count
    const badge = document.querySelector<HTMLElement>(".badge-notification");
    if (badge) badge.textContent = String(cart.length);
  };

  // ─── Helpers ──────────────────────────────────────────────

  const getProductDiv = (): HTMLElement | null => {
    return document.querySelector<HTMLElement>("#product-div");
  };

  // Expose pageNum setter for future pagination (not used yet)
  void pageNum;

  // ─── Init ─────────────────────────────────────────────────
  // Called last — after all const functions are defined above
  getData();
}
