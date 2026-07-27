// ============================================================
// src/pages/product-details/product-details.ts
// Product Details page logic — parses ID, fetches product,
// handles quantity, gallery updates, cart, and related items.
// ============================================================

import { productApi } from "../../lib/api";
import type { Product, ApiResponse } from "../../lib/types";
import { updateNavbarBadges } from "../../router";

export function initProductDetails(): void {
  console.log("🚀 ~ product details initialization ~ 🚀");

  // ─── Query Parameter Extraction ───────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const productIdStr = urlParams.get("id");

  const detailsContainer = document.getElementById("product-details-container");
  const relatedGrid = document.getElementById("related-products-grid");
  const breadcrumbTitle = document.getElementById("detail-breadcrumb-title");

  if (!productIdStr) {
    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <div class="col-12 text-center py-5 text-white-50">
          <i class="bx bx-error-circle bx-lg"></i>
          <h4 class="mt-3">Invalid Product ID</h4>
          <p>Please return to the products catalog and choose a valid product.</p>
          <a href="/products" class="btn btn-lighter btn-ecommerco mt-3" onclick="event.preventDefault(); route('/products')">Back to Products</a>
        </div>
      `;
    }
    return;
  }

  const productId = parseInt(productIdStr, 10);

  // State for quantity selection
  let selectedQty = 1;

  // ─── Fetch Details ─────────────────────────────────────────
  productApi
    .getById(productId)
    .then((response: ApiResponse<Product>) => {
      const product = response.data;

      // Update breadcrumbs
      if (breadcrumbTitle) {
        breadcrumbTitle.textContent = product.title;
      }

      renderProductDetails(product);
      fetchRelatedProducts(product);
    })
    .catch((error: unknown) => {
      console.error("Failed to load product details:", error);
      if (detailsContainer) {
        detailsContainer.innerHTML = `
          <div class="col-12 text-center py-5 text-white-50">
            <i class="bx bx-error-circle bx-lg"></i>
            <h4 class="mt-3">Product Not Found</h4>
            <p>We couldn't retrieve the details for this product. It may no longer exist.</p>
            <a href="/products" class="btn btn-lighter btn-ecommerco mt-3" onclick="event.preventDefault(); route('/products')">Back to Products</a>
          </div>
        `;
      }
    });

  // ─── Render Page Content ──────────────────────────────────
  const renderProductDetails = (product: Product): void => {
    if (!detailsContainer) return;

    const discountedPrice = (
      product.price -
      (product.price * product.discountPercentage) / 100
    ).toFixed(2);
    const ratingWidth = ((product.rating * 100) / 5).toFixed(0);

    // Check if item is already in wishlist
    const wishlist: string[] = JSON.parse(
      localStorage.getItem("wishlist") ?? "[]",
    );
    const isWishlisted = wishlist.includes(String(product.id));

    detailsContainer.innerHTML = `
      <div class="col-lg-6">
        <!-- Main Image Display -->
        <div class="product-detail-gallery p-3 rounded-3 bg-light-ops border border-white border-opacity-10 d-flex justify-content-center align-items-center position-relative overflow-hidden mb-3">
          <img id="main-product-img" class="img-fluid" src="${product.images[0]}" alt="${product.title}" style="max-height: 450px; object-fit: contain; width: 100%;" />
        </div>
        
        <!-- Thumbnail gallery (if multiple images) -->
        ${
          product.images.length > 1
            ? `
        <div class="d-flex gap-2 overflow-auto pb-2 thumbnail-row">
          ${product.images
            .map(
              (imgUrl, index) => `
            <div class="product-detail-thumb rounded-2 bg-light-ops border border-opacity-10 cursor-pointer overflow-hidden p-1 ${index === 0 ? "active" : ""}" style="width: 80px; height: 80px; flex-shrink: 0;" data-index="${index}">
              <img class="img-fluid w-100 h-100" src="${imgUrl}" alt="${product.title} view ${index + 1}" style="object-fit: contain;" />
            </div>
          `,
            )
            .join("")}
        </div>
        `
            : ""
        }
      </div>

      <div class="col-lg-6">
        <div class="ps-lg-4">
          <!-- Brand & Category -->
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-secondary text-uppercase">${product.brand}</span>
            <span class="text-white-50 text-uppercase fs-6">${product.category}</span>
          </div>
          
          <!-- Title -->
          <h1 class="mb-3 text-white fw-bold font-heading text-capitalize" style="font-size: 2.2rem;">${product.title}</h1>
          
          <!-- Ratings -->
          <div class="d-flex align-items-center gap-3 mb-4">
            <div class="product-rating" title="Rating: ${product.rating} / 5" style="font-size: 1.5rem;">
              <div class="rating-star" style="width: ${ratingWidth}%;"></div>
            </div>
            <span class="text-white-50">(${product.rating.toFixed(1)} / 5.0)</span>
          </div>
          
          <!-- Price Block -->
          <div class="mb-4">
            <div class="d-flex align-items-center gap-3">
              <span class="fs-2 fw-bold text-white">$${discountedPrice}</span>
              ${
                product.discountPercentage > 0
                  ? `
                <span class="fs-5 text-decoration-line-through text-white-50">$${product.price}</span>
                <span class="badge bg-danger text-uppercase">${product.discountPercentage.toFixed(0)}% OFF</span>
              `
                  : ""
              }
            </div>
          </div>
          
          <!-- Stock Status -->
          <div class="mb-4 d-flex align-items-center gap-2">
            <span>Stock Status:</span>
            ${
              product.stock > 10
                ? `
              <span class="badge bg-success">In Stock (${product.stock} available)</span>
            `
                : product.stock > 0
                  ? `
              <span class="badge bg-warning text-dark">Low Stock (Only ${product.stock} left!)</span>
            `
                  : `
              <span class="badge bg-danger">Out of Stock</span>
            `
            }
          </div>
          
          <!-- Short Description -->
          <p class="lead mb-4 text-white-50" style="font-size: 1.1rem; line-height: 1.6;">${product.description}</p>
          
          <!-- Actions -->
          <div class="d-flex flex-wrap align-items-center gap-3 mb-5 pt-3 border-top border-white border-opacity-10">
            <!-- Quantity selector -->
            <div class="quantity-selector d-flex align-items-center bg-light-ops border border-white border-opacity-10 rounded-pill p-1">
              <button id="btn-qty-minus" class="btn btn-sm btn-link text-white text-decoration-none px-3" ${product.stock === 0 ? "disabled" : ""}>
                <i class="bx bx-minus"></i>
              </button>
              <input id="input-qty" type="number" class="form-control bg-transparent text-white text-center border-0 p-0 m-0 shadow-none" value="1" min="1" max="${product.stock}" style="width: 50px; font-weight: bold;" ${product.stock === 0 ? "disabled" : ""} readonly />
              <button id="btn-qty-plus" class="btn btn-sm btn-link text-white text-decoration-none px-3" ${product.stock === 0 ? "disabled" : ""}>
                <i class="bx bx-plus"></i>
              </button>
            </div>
            
            <!-- Add to Cart -->
            <button id="btn-add-to-cart" class="btn btn-lighter btn-ecommerco rounded-pill px-5 py-2 flex-grow-1 text-uppercase fw-bold" ${product.stock === 0 ? "disabled" : ""}>
              <i class="bx bx-shopping-bag me-2"></i> Add to Cart
            </button>
            
            <!-- Wishlist -->
            <button id="btn-wishlist" class="btn btn-outline-lighter rounded-circle d-flex align-items-center justify-content-center" style="width: 46px; height: 46px; border: 1px solid rgba(255,255,255,0.15);" data-product-id="${product.id}" title="Add to Wishlist">
              <i class="bx ${isWishlisted ? "bxs-heart text-danger" : "bx-heart"} fs-4 m-0 p-0"></i>
            </button>
          </div>
          
          <!-- Specs -->
          <div class="specs-box p-4 rounded-3 bg-light-ops border border-white border-opacity-10">
            <h5 class="mb-3 font-heading text-uppercase" style="font-size: 1rem;">Specifications</h5>
            <div class="row g-2">
              <div class="col-6 text-white-50">Brand:</div>
              <div class="col-6 fw-bold text-end">${product.brand}</div>
              <div class="col-6 text-white-50">Category:</div>
              <div class="col-6 fw-bold text-end text-capitalize">${product.category}</div>
              <div class="col-6 text-white-50">Collection:</div>
              <div class="col-6 fw-bold text-end text-capitalize">${product.collection}</div>
              <div class="col-6 text-white-50">Availability:</div>
              <div class="col-6 fw-bold text-end">${product.stock > 0 ? "Available" : "Out of Stock"}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // ─── Setup Event Listeners on Rendered HTML ───────────────
    setupInteractionListeners(product);
  };

  // ─── Setup Interactions ───────────────────────────────────
  const setupInteractionListeners = (product: Product): void => {
    const mainImg = document.getElementById(
      "main-product-img",
    ) as HTMLImageElement;
    const thumbs = document.querySelectorAll(".product-detail-thumb");

    const btnMinus = document.getElementById("btn-qty-minus");
    const btnPlus = document.getElementById("btn-qty-plus");
    const inputQty = document.getElementById("input-qty") as HTMLInputElement;

    const btnAddToCart = document.getElementById("btn-add-to-cart");
    const btnWishlist = document.getElementById("btn-wishlist");

    // Gallery navigation
    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        // Toggle active thumbnail styling
        thumbs.forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");

        // Update main image source
        const index = parseInt((thumb as HTMLElement).dataset.index || "0", 10);
        if (mainImg) {
          mainImg.src = `..${product.images[index]}`;
        }
      });
    });

    // Quantity selectors
    if (btnMinus && btnPlus && inputQty) {
      btnMinus.addEventListener("click", () => {
        if (selectedQty > 1) {
          selectedQty--;
          inputQty.value = String(selectedQty);
        }
      });

      btnPlus.addEventListener("click", () => {
        if (selectedQty < product.stock) {
          selectedQty++;
          inputQty.value = String(selectedQty);
        }
      });
    }

    // Add to Cart
    if (btnAddToCart) {
      btnAddToCart.addEventListener("click", () => {
        if (product.stock === 0) return;

        const cart: string[] = JSON.parse(localStorage.getItem("cart") ?? "[]");
        // Push ID multiple times depending on selected quantity
        for (let i = 0; i < selectedQty; i++) {
          cart.push(String(product.id));
        }
        localStorage.setItem("cart", JSON.stringify(cart));

        // Update badge count
        const badge = document.querySelector<HTMLElement>(
          ".badge-notification",
        );
        if (badge) {
          badge.textContent = String(cart.length);
        }

        // Show added feedback on button
        const originalText = btnAddToCart.innerHTML;
        btnAddToCart.innerHTML = `<i class="bx bx-check me-2"></i> Added!`;
        btnAddToCart.classList.add("btn-success");
        btnAddToCart.classList.remove("btn-lighter");
        setTimeout(() => {
          btnAddToCart.innerHTML = originalText;
          btnAddToCart.classList.remove("btn-success");
          btnAddToCart.classList.add("btn-lighter");
        }, 1500);
      });
    }

    // Add to Wishlist
    if (btnWishlist) {
      btnWishlist.addEventListener("click", () => {
        let wishlist: string[] = JSON.parse(
          localStorage.getItem("wishlist") ?? "[]",
        );
        const icon = btnWishlist.querySelector("i");

        if (wishlist.includes(String(product.id))) {
          // Remove
          wishlist = wishlist.filter((id) => id !== String(product.id));
          if (icon) {
            icon.className = "bx bx-heart fs-4";
            icon.classList.remove("text-danger");
          }
        } else {
          // Add
          wishlist.push(String(product.id));
          if (icon) {
            icon.className = "bx bxs-heart fs-4 text-danger";
          }
        }
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        updateNavbarBadges();
      });
    }
  };

  // ─── Fetch & Render Related Products ───────────────────────
  const fetchRelatedProducts = (product: Product): void => {
    productApi
      .getAll({ category: product.category })
      .then((response: ApiResponse<Product[]>) => {
        // Filter out current product
        const filtered = response.data.filter((p) => p.id !== product.id);
        // Limit to 4
        const limit = filtered.slice(0, 4);

        if (!relatedGrid) return;

        if (limit.length === 0) {
          relatedGrid.innerHTML = `
            <div class="col-12 text-white-50 text-center py-4">
              <p>No related products found in this category.</p>
            </div>
          `;
          return;
        }

        relatedGrid.innerHTML = limit.map(buildRelatedCard).join("");
        attachRelatedActionListeners(relatedGrid);
      })
      .catch((error: unknown) => {
        console.error("Failed to load related products:", error);
        if (relatedGrid) {
          relatedGrid.innerHTML = `
            <div class="col-12 text-white-50 text-center py-4">
              <p>Failed to load related products.</p>
            </div>
          `;
        }
      });
  };

  const buildRelatedCard = (data: Product): string => {
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
              src="..${data.images[0]}"
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

  const attachRelatedActionListeners = (container: HTMLElement): void => {
    container.addEventListener("click", (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Wishlist
      const wishlistBtn = target.closest<HTMLButtonElement>(".js-wishlist-btn");
      if (wishlistBtn) {
        handleRelatedWishlist(wishlistBtn);
        return;
      }

      // Cart
      const cartBtn = target.closest<HTMLButtonElement>(".js-cart-btn");
      if (cartBtn) {
        handleRelatedCart(cartBtn);
        return;
      }
    });
  };

  const handleRelatedWishlist = (btn: HTMLButtonElement): void => {
    const icon = btn.querySelector("i");
    if (icon) {
      if (icon.style.color === "red") {
        icon.style.color = "";
        icon.classList.replace("bxs-heart", "bx-heart");
      } else {
        icon.style.color = "red";
        icon.classList.replace("bx-heart", "bxs-heart");
      }
    }

    const productId = btn.dataset.productId;
    if (!productId) return;

    let wishlist: string[] = JSON.parse(
      localStorage.getItem("wishlist") ?? "[]",
    );

    if (wishlist.includes(productId)) {
      wishlist = wishlist.filter((id) => id !== productId);
    } else {
      wishlist.push(productId);
    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  };

  const handleRelatedCart = (btn: HTMLButtonElement): void => {
    const productId = btn.dataset.productId;
    if (!productId) return;

    const cart: string[] = JSON.parse(localStorage.getItem("cart") ?? "[]");
    cart.push(productId);
    localStorage.setItem("cart", JSON.stringify(cart));

    const badge = document.querySelector<HTMLElement>(".badge-notification");
    if (badge) {
      badge.textContent = String(cart.length);
    }
  };
}
