// ============================================================
// src/pages/cart/cart.ts
// Shopping Cart controller — manages items loaded from localStorage,
// quantity adjustments, promo coupons, order summary calculations,
// item removal, clear cart, and navbar badge sync.
// ============================================================

import { productApi } from "../../lib/api";
import type { Product, ApiResponse } from "../../lib/types";

interface CartLineItem {
  product: Product;
  quantity: number;
}

export function initCart(): void {
  console.log("🚀 ~ Initializing Shopping Cart Page ~ 🚀");

  // ─── State ────────────────────────────────────────────────
  let cartLineItems: CartLineItem[] = [];
  let appliedDiscountPercent = 0;
  let appliedCouponCode = "";

  // ─── DOM References ───────────────────────────────────────
  const mainContainer = document.getElementById("cart-main-container");
  const headerCount = document.getElementById("cart-header-count");

  // ─── Load Cart Data ───────────────────────────────────────
  const loadCartData = async (): Promise<void> => {
    const rawCart: string[] = JSON.parse(localStorage.getItem("cart") ?? "[]");

    if (rawCart.length === 0) {
      cartLineItems = [];
      updateNavbarBadge(0);
      renderEmptyCart();
      return;
    }

    // Update navbar badge with total count of items
    updateNavbarBadge(rawCart.length);

    // Map frequency of product IDs
    const idCountMap = new Map<number, number>();
    rawCart.forEach((idStr) => {
      const id = parseInt(idStr, 10);
      if (!isNaN(id)) {
        idCountMap.set(id, (idCountMap.get(id) ?? 0) + 1);
      }
    });

    try {
      const promises = Array.from(idCountMap.keys()).map((id) =>
        productApi.getById(id),
      );
      const responses: ApiResponse<Product>[] = await Promise.all(promises);

      cartLineItems = responses.map((res) => ({
        product: res.data,
        quantity: idCountMap.get(res.data.id) ?? 1,
      }));

      renderCartView();
    } catch (error) {
      console.error("Failed to load cart items:", error);
      if (mainContainer) {
        mainContainer.innerHTML = `
          <div class="col-12 text-center py-5 text-white-50">
            <i class="bx bx-error-circle bx-lg"></i>
            <h4 class="mt-3 text-white">Error Loading Cart</h4>
            <p>Failed to retrieve cart products. Please try refreshing.</p>
            <a href="/products" class="btn btn-lighter btn-ecommerco mt-2" onclick="event.preventDefault(); route('/products')">Back to Products</a>
          </div>
        `;
      }
    }
  };

  // ─── Save Cart State to LocalStorage ──────────────────────
  const saveCartState = (): void => {
    const newRawCart: string[] = [];
    cartLineItems.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        newRawCart.push(String(item.product.id));
      }
    });

    localStorage.setItem("cart", JSON.stringify(newRawCart));
    updateNavbarBadge(newRawCart.length);

    if (headerCount) {
      const totalCount = cartLineItems.reduce(
        (acc, curr) => acc + curr.quantity,
        0,
      );
      headerCount.textContent = `${totalCount} item${totalCount === 1 ? "" : "s"} in your cart`;
    }
  };

  // ─── Update Navbar Badge Count ───────────────────────────
  const updateNavbarBadge = (count: number): void => {
    const badge = document.querySelector<HTMLElement>(".badge-notification");
    if (badge) {
      badge.textContent = String(count);
    }
  };

  // ─── Render Empty Cart State ─────────────────────────────
  const renderEmptyCart = (): void => {
    if (!mainContainer) return;
    if (headerCount) headerCount.textContent = "0 items in your cart";

    mainContainer.innerHTML = `
      <div class="row justify-content-center py-4">
        <div class="col-12 col-md-8 col-lg-6 text-center">
          <div class="p-5 rounded-4 bg-dark-ops border border-white border-opacity-10 shadow-lg">
            <div class="mb-4">
              <i class="bx bx-shopping-bag text-primary-ops" style="font-size: 5.5rem;"></i>
            </div>
            <h3 class="text-white mb-2 fw-bold">Your Cart is Empty</h3>
            <p class="text-white-50 mb-4">Looks like you haven't added any items to your shopping cart yet.</p>
            <a href="/products" class="btn btn-lighter btn-ecommerco px-4 py-2 text-uppercase fw-semibold" onclick="event.preventDefault(); route('/products')">
              <i class="bx bx-store me-2"></i>Explore Catalog
            </a>
          </div>
        </div>
      </div>
    `;
  };

  // ─── Render Active Cart View ──────────────────────────────
  const renderCartView = (): void => {
    if (!mainContainer) return;

    if (cartLineItems.length === 0) {
      renderEmptyCart();
      return;
    }

    const totalCount = cartLineItems.reduce(
      (acc, curr) => acc + curr.quantity,
      0,
    );
    if (headerCount) {
      headerCount.textContent = `${totalCount} item${totalCount === 1 ? "" : "s"} in your cart`;
    }

    // Calculate Financials
    const rawSubtotal = cartLineItems.reduce((acc, item) => {
      const discountedPrice =
        item.product.price -
        (item.product.price * item.product.discountPercentage) / 100;
      return acc + discountedPrice * item.quantity;
    }, 0);

    const discountAmount = (rawSubtotal * appliedDiscountPercent) / 100;
    const finalTotal = Math.max(0, rawSubtotal - discountAmount);

    mainContainer.innerHTML = `
      <div class="row g-4">
        <!-- Left Column: Cart Table & Actions -->
        <div class="col-lg-8">
          <div class="bg-dark-ops rounded-4 p-4 border border-white border-opacity-10 shadow-lg">
            <!-- Table for Large Screens -->
            <div class="table-responsive">
              <table class="table align-middle text-white mb-0 bg-transparent" style="--bs-table-bg: transparent; --bs-table-color: #fff; --bs-table-hover-bg: rgba(255,255,255,0.05); background-color: transparent !important; border-color: rgba(255,255,255,0.1);">
                <thead>
                  <tr class="text-white-50 border-bottom border-white border-opacity-10 text-uppercase fs-7" style="--bs-table-bg: transparent; background-color: transparent !important;">
                    <th scope="col" style="min-width: 260px; background-color: transparent !important;">Product</th>
                    <th scope="col" style="background-color: transparent !important;">Price</th>
                    <th scope="col" class="text-center" style="background-color: transparent !important;">Quantity</th>
                    <th scope="col" class="text-end" style="background-color: transparent !important;">Subtotal</th>
                    <th scope="col" class="text-center" style="background-color: transparent !important;"><i class="bx bx-trash"></i></th>
                  </tr>
                </thead>
                <tbody style="background-color: transparent !important;">
                  ${cartLineItems
                    .map((item) => {
                      const unitPrice = (
                        item.product.price -
                        (item.product.price * item.product.discountPercentage) /
                          100
                      ).toFixed(2);
                      const lineSubtotal = (
                        parseFloat(unitPrice) * item.quantity
                      ).toFixed(2);

                      return `
                        <tr data-cart-id="${item.product.id}" style="--bs-table-bg: transparent; background-color: transparent !important;">
                          <td style="background-color: transparent !important;">
                            <div class="d-flex align-items-center gap-3">
                              <a href="/product-details?id=${item.product.id}" onclick="event.preventDefault(); route('/product-details?id=${item.product.id}')" class="d-inline-block bg-light-ops p-2 rounded-3 border border-white border-opacity-10 shrink-0" style="width: 70px; height: 70px;">
                                <img src="${item.product.images[0]}" alt="${item.product.title}" class="img-fluid w-100 h-100" style="object-fit: contain;" />
                              </a>
                              <div>
                                <a href="/product-details?id=${item.product.id}" onclick="event.preventDefault(); route('/product-details?id=${item.product.id}')" class="text-white text-decoration-none fw-semibold product-title-link">
                                  ${item.product.title}
                                </a>
                                <div class="text-white-50 small text-capitalize mt-1">
                                  ${item.product.brand} | <span class="badge bg-black-ops text-white border border-white border-opacity-10">${item.product.category}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td class="fw-semibold" style="background-color: transparent !important;">$${unitPrice}</td>
                          <td style="background-color: transparent !important;">
                            <div class="d-flex align-items-center justify-content-center gap-1 bg-light-ops border border-white border-opacity-10 rounded-3 p-1 mx-auto" style="max-width: 120px;">
                              <button class="btn btn-sm btn-link text-white p-0 js-qty-minus" data-id="${item.product.id}" title="Decrease quantity">
                                <i class="bx bx-minus fs-6"></i>
                              </button>
                              <input type="text" class="form-control form-control-sm bg-transparent border-0 text-white text-center p-0 fw-bold js-qty-input" data-id="${item.product.id}" value="${item.quantity}" readonly style="width: 35px;" />
                              <button class="btn btn-sm btn-link text-white p-0 js-qty-plus" data-id="${item.product.id}" title="Increase quantity">
                                <i class="bx bx-plus fs-6"></i>
                              </button>
                            </div>
                          </td>
                          <td class="text-end fw-bold text-primary-ops fs-6" style="background-color: transparent !important;">$${lineSubtotal}</td>
                          <td class="text-center" style="background-color: transparent !important;">
                            <button class="btn btn-sm rounded-circle js-remove-item" style="width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; background: rgba(255, 77, 77, 0.2); border: 1px solid rgba(255, 107, 107, 0.4);" data-id="${item.product.id}" title="Remove item">
                              <i class="bx bx-trash fs-6 m-0 p-0" style="color: #ff6b6b;"></i>
                            </button>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>

            <!-- Cart Table Actions Footer -->
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-4 pt-3 border-top border-white border-opacity-10">
              <a href="/products" class="btn btn-lighter btn-ecommerco text-uppercase px-4 py-2" onclick="event.preventDefault(); route('/products')">
                <i class="bx bx-left-arrow-alt me-1"></i> Continue Shopping
              </a>
              <button id="btn-clear-cart" class="btn btn-lighter text-uppercase px-4 py-2 fw-semibold" style="background: rgba(255, 77, 77, 0.2); color: #ff6b6b; border: 1px solid rgba(255, 107, 107, 0.4);">
                <i class="bx bx-trash-alt me-1"></i> Clear Cart
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column: Order Summary & Checkout -->
        <div class="col-lg-4">
          <div class="bg-dark-ops rounded-4 p-4 border border-white border-opacity-10 shadow-lg sticky-top" style="top: 100px;">
            <h5 class="text-white fw-bold border-bottom border-white border-opacity-10 pb-3 mb-3">Order Summary</h5>
            
            <div class="d-flex justify-content-between text-white-50 mb-2">
              <span>Subtotal (${totalCount} item${totalCount === 1 ? "" : "s"})</span>
              <span class="text-white fw-semibold">$${rawSubtotal.toFixed(2)}</span>
            </div>

            <div class="d-flex justify-content-between text-white-50 mb-2">
              <span>Estimated Shipping</span>
              <span class="text-success fw-semibold">${rawSubtotal > 49 ? "FREE" : "$9.99"}</span>
            </div>

            ${
              appliedDiscountPercent > 0
                ? `
              <div class="d-flex justify-content-between text-success mb-2 small">
                <span>Discount (${appliedCouponCode} - ${appliedDiscountPercent}%)</span>
                <span>-$${discountAmount.toFixed(2)}</span>
              </div>
            `
                : ""
            }

            <hr class="border-white border-opacity-10 my-3" />

            <!-- Coupon Code Section -->
            <div class="mb-3">
              <label for="coupon-input" class="form-label text-white-50 small">Have a promo code?</label>
              <div class="input-group">
                <input type="text" id="coupon-input" class="form-control form-control-sm bg-light-ops text-white border-white border-opacity-25 shadow-none text-uppercase" placeholder="e.g. SAVE10" value="${appliedCouponCode}" />
                <button id="btn-apply-coupon" class="btn btn-sm btn-lighter btn-ecommerco text-uppercase px-3" type="button">Apply</button>
              </div>
              <div id="coupon-feedback" class="form-text small mt-1">
                ${
                  appliedDiscountPercent > 0
                    ? `<span class="text-success"><i class="bx bx-check-circle me-1"></i>Coupon "${appliedCouponCode}" applied (${appliedDiscountPercent}% OFF)!</span>`
                    : '<span class="text-white-50">Try code <strong class="text-white">SAVE10</strong> or <strong class="text-white">ECOM20</strong></span>'
                }
              </div>
            </div>

            <hr class="border-white border-opacity-10 my-3" />

            <div class="d-flex justify-content-between align-items-center mb-4">
              <span class="text-white fw-bold fs-5">Grand Total</span>
              <span class="text-white fw-extrabold fs-4">$${(finalTotal + (rawSubtotal > 49 ? 0 : 9.99)).toFixed(2)}</span>
            </div>

            <button id="btn-checkout" class="btn btn-lighter btn-ecommerco w-100 py-3 text-uppercase fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
              <i class="bx bx-lock-alt fs-5"></i> Proceed to Checkout
            </button>

            <div class="text-center mt-3 text-white-50 fs-7">
              <i class="bx bx-shield-quarter me-1"></i> Guaranteed 100% Secure Checkout
            </div>
          </div>
        </div>
      </div>
    `;

    setupCartEventListeners();
  };

  // ─── Cart Action Event Listeners ──────────────────────────
  const setupCartEventListeners = (): void => {
    if (!mainContainer) return;

    // 1. Quantity Plus & Minus
    mainContainer
      .querySelectorAll<HTMLButtonElement>(".js-qty-plus")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = parseInt(btn.dataset.id ?? "0", 10);
          const line = cartLineItems.find((item) => item.product.id === id);
          if (line && line.quantity < line.product.stock) {
            line.quantity++;
            saveCartState();
            renderCartView();
          }
        });
      });

    mainContainer
      .querySelectorAll<HTMLButtonElement>(".js-qty-minus")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = parseInt(btn.dataset.id ?? "0", 10);
          const line = cartLineItems.find((item) => item.product.id === id);
          if (line) {
            if (line.quantity > 1) {
              line.quantity--;
            } else {
              // Remove item if quantity goes to 0
              cartLineItems = cartLineItems.filter(
                (item) => item.product.id !== id,
              );
            }
            saveCartState();
            renderCartView();
          }
        });
      });

    // 2. Remove Line Item
    mainContainer
      .querySelectorAll<HTMLButtonElement>(".js-remove-item")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = parseInt(btn.dataset.id ?? "0", 10);
          cartLineItems = cartLineItems.filter(
            (item) => item.product.id !== id,
          );
          saveCartState();
          renderCartView();
        });
      });

    // 3. Clear Cart
    const btnClearCart = document.getElementById("btn-clear-cart");
    if (btnClearCart) {
      btnClearCart.addEventListener("click", () => {
        if (
          confirm("Are you sure you want to clear all items from your cart?")
        ) {
          cartLineItems = [];
          appliedDiscountPercent = 0;
          appliedCouponCode = "";
          saveCartState();
          renderEmptyCart();
        }
      });
    }

    // 4. Apply Coupon Code
    const btnApplyCoupon = document.getElementById("btn-apply-coupon");
    const couponInput = document.getElementById(
      "coupon-input",
    ) as HTMLInputElement | null;
    const couponFeedback = document.getElementById("coupon-feedback");

    if (btnApplyCoupon && couponInput) {
      btnApplyCoupon.addEventListener("click", () => {
        const code = couponInput.value.trim().toUpperCase();
        if (!code) {
          if (couponFeedback) {
            couponFeedback.innerHTML = `<span class="text-warning">Please enter a promo code.</span>`;
          }
          return;
        }

        if (code === "SAVE10") {
          appliedDiscountPercent = 10;
          appliedCouponCode = code;
          renderCartView();
        } else if (code === "ECOM20" || code === "SUMMER20") {
          appliedDiscountPercent = 20;
          appliedCouponCode = code;
          renderCartView();
        } else if (code === "ECOM15" || code === "SUMMER15") {
          appliedDiscountPercent = 15;
          appliedCouponCode = code;
          renderCartView();
        } else {
          appliedDiscountPercent = 0;
          appliedCouponCode = "";
          if (couponFeedback) {
            couponFeedback.innerHTML = `<span class="text-danger"><i class="bx bx-x-circle me-1"></i>Invalid promo code. Try SAVE10 or ECOM20</span>`;
          }
        }
      });
    }

    // 5. Proceed to Checkout Simulation
    const btnCheckout = document.getElementById("btn-checkout");
    if (btnCheckout) {
      btnCheckout.addEventListener("click", () => {
        // Show success modal/alert and clear cart
        if (mainContainer) {
          mainContainer.innerHTML = `
            <div class="row justify-content-center py-5">
              <div class="col-12 col-md-8 col-lg-6 text-center">
                <div class="p-5 rounded-4 bg-dark-ops border border-success border-opacity-25 shadow-lg">
                  <div class="mb-3 text-success">
                    <i class="bx bx-check-circle" style="font-size: 5rem;"></i>
                  </div>
                  <h3 class="text-white fw-bold mb-2">Order Placed Successfully!</h3>
                  <p class="text-white-50 mb-4">Thank you for your order. We have received your payment request and will begin processing your items immediately.</p>
                  <div class="d-flex justify-content-center gap-3">
                    <a href="/products" class="btn btn-lighter btn-ecommerco px-4 py-2 text-uppercase fw-semibold" onclick="event.preventDefault(); route('/products')">
                      Continue Shopping
                    </a>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
        // Clear cart from storage
        cartLineItems = [];
        saveCartState();
        renderEmptyCart();
      });
    }
  };

  // ─── Initialize ───────────────────────────────────────────
  loadCartData();
}
