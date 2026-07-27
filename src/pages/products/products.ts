// ============================================================
// src/pages/products/products.ts
// Products page initialization — handles URL query params,
// dynamic category & brand filters, custom price filtering,
// search, sorting, grid/list view toggle, wishlist persistence,
// and pagination.
// ============================================================

import { productApi } from "../../lib/api";
import type { Product, ApiResponse } from "../../lib/types";
import { updateNavbarBadges } from "../../router";

export function initProducts(): void {
  console.log("🚀 ~ products page initialization ~ 🚀");

  // ─── State Management ──────────────────────────────────────
  let allProducts: Product[] = [];
  let filteredProducts: Product[] = [];

  let thisPage = 1;
  let itemsPerPage = 9;

  let sortKey = "Default";
  let selectedCollection = "all";
  let selectedPriceRange = "all";
  let customMinPrice: number | null = null;
  let customMaxPrice: number | null = null;

  let selectedCategories: string[] = [];
  let selectedBrands: string[] = [];

  let searchQuery = "";
  let searchByOption = "Default";
  let viewMode: "grid" | "list" = "grid";

  // ─── URL Query Parameter Parsing ─────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const paramCategory = urlParams.get("category");
  const paramBrand = urlParams.get("brand");
  const paramCollection = urlParams.get("collection");
  const paramQuery = urlParams.get("q");

  if (paramCollection) selectedCollection = paramCollection.toLowerCase();
  if (paramBrand) selectedBrands = [paramBrand.toLowerCase()];
  if (paramCategory) selectedCategories = [paramCategory.toLowerCase()];
  if (paramQuery) searchQuery = paramQuery;

  // ─── DOM References ───────────────────────────────────────
  const productDiv = document.querySelector<HTMLElement>("#product-div");
  const formSort = document.querySelector<HTMLSelectElement>("#form-sort");
  const formLimit = document.querySelector<HTMLSelectElement>("#form-limit");
  const searchBox = document.querySelector<HTMLFormElement>("#search-box");
  const searchBy = document.querySelector<HTMLSelectElement>("#search-by");
  const searchInput = document.querySelector<HTMLInputElement>("#search-input");
  const collectionList = document.querySelector<HTMLElement>("#collection-list");
  const priceRadios = document.querySelectorAll<HTMLInputElement>('input[name="priceRange"]');
  const minPriceInput = document.querySelector<HTMLInputElement>("#min-price-input");
  const maxPriceInput = document.querySelector<HTMLInputElement>("#max-price-input");
  const btnApplyPrice = document.querySelector<HTMLButtonElement>("#btn-apply-price");

  const btnGridView = document.querySelector<HTMLAnchorElement>("#btn-grid-view");
  const btnListView = document.querySelector<HTMLAnchorElement>("#btn-list-view");

  const btnPrevPage = document.querySelector<HTMLElement>("#btn-prev-page");
  const btnNextPage = document.querySelector<HTMLElement>("#btn-next-page");
  const paginationListNums = document.querySelector<HTMLElement>("#pagination-list-nums");

  // Pre-fill search input if present in URL
  if (searchInput && searchQuery) {
    searchInput.value = searchQuery;
  }

  // ─── Fetch Data ───────────────────────────────────────────
  const getData = (): void => {
    showLoading();
    productApi
      .getAll()
      .then((response: ApiResponse<Product[]>) => {
        allProducts = response.data;
        updateCollectionCounts();
        renderDynamicFilters();
        applyFilters();
      })
      .catch((error: unknown) => {
        showError();
        console.error("Failed to load products:", error);
      });
  };

  // ─── Collection Counts ────────────────────────────────────
  const updateCollectionCounts = (): void => {
    const countAll = document.querySelector<HTMLElement>('[data-count="all"]');
    const countMen = document.querySelector<HTMLElement>('[data-count="men"]');
    const countWomen = document.querySelector<HTMLElement>('[data-count="women"]');
    const countAccessories = document.querySelector<HTMLElement>('[data-count="accessories"]');

    if (countAll) countAll.textContent = String(allProducts.length);
    if (countMen) countMen.textContent = String(
      allProducts.filter(p => p.collection.toLowerCase() === "men").length
    );
    if (countWomen) countWomen.textContent = String(
      allProducts.filter(p => p.collection.toLowerCase() === "women").length
    );
    if (countAccessories) countAccessories.textContent = String(
      allProducts.filter(p => p.collection.toLowerCase() === "accessories").length
    );

    // Sync active class on collection items
    if (collectionList) {
      const items = collectionList.querySelectorAll(".collection-item");
      items.forEach((item) => {
        const col = (item as HTMLElement).dataset.collection;
        if (col === selectedCollection) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });
    }
  };

  // ─── Dynamic Categories & Brands Filter Rendering ────────
  const renderDynamicFilters = (): void => {
    // 1. Categories
    const categoryListFilters = document.querySelector<HTMLElement>("#category-list-filters");
    if (categoryListFilters) {
      const categoryMap = new Map<string, number>();
      allProducts.forEach((p) => {
        const cat = p.category.toLowerCase();
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });

      categoryListFilters.innerHTML = Array.from(categoryMap.entries())
        .map(
          ([cat, count]) => `
          <li class="py-1">
            <div class="form-check d-flex justify-content-between align-items-center me-3">
              <div>
                <input
                  class="form-check-input transition category-checkbox cursor-pointer"
                  type="checkbox"
                  id="cat-${cat}"
                  value="${cat}"
                  ${selectedCategories.includes(cat) ? "checked" : ""}
                />
                <label class="form-check-label text-capitalize ms-1 cursor-pointer" for="cat-${cat}">
                  ${cat}
                </label>
              </div>
              <small class="text-white-50">(${count})</small>
            </div>
          </li>
        `
        )
        .join("");

      categoryListFilters.querySelectorAll<HTMLInputElement>(".category-checkbox").forEach((cb) => {
        cb.addEventListener("change", () => {
          selectedCategories = Array.from(
            categoryListFilters.querySelectorAll<HTMLInputElement>(".category-checkbox")
          )
            .filter((c) => c.checked)
            .map((c) => c.value.toLowerCase());
          thisPage = 1;
          applyFilters();
        });
      });
    }

    // 2. Brands
    const brandListFilters = document.querySelector<HTMLElement>("#brand-list-filters");
    if (brandListFilters) {
      const brandMap = new Map<string, number>();
      allProducts.forEach((p) => {
        const b = p.brand.toLowerCase();
        brandMap.set(b, (brandMap.get(b) || 0) + 1);
      });

      brandListFilters.innerHTML = Array.from(brandMap.entries())
        .map(
          ([brand, count]) => `
          <li class="py-1">
            <div class="form-check d-flex justify-content-between align-items-center me-3">
              <div>
                <input
                  class="form-check-input transition brand-checkbox cursor-pointer"
                  type="checkbox"
                  id="brand-${brand.replace(/[^a-z0-9]/gi, "_")}"
                  value="${brand}"
                  ${selectedBrands.includes(brand) ? "checked" : ""}
                />
                <label class="form-check-label text-capitalize ms-1 cursor-pointer" for="brand-${brand.replace(/[^a-z0-9]/gi, "_")}">
                  ${brand}
                </label>
              </div>
              <small class="text-white-50">(${count})</small>
            </div>
          </li>
        `
        )
        .join("");

      brandListFilters.querySelectorAll<HTMLInputElement>(".brand-checkbox").forEach((cb) => {
        cb.addEventListener("change", () => {
          selectedBrands = Array.from(
            brandListFilters.querySelectorAll<HTMLInputElement>(".brand-checkbox")
          )
            .filter((c) => c.checked)
            .map((c) => c.value.toLowerCase());
          thisPage = 1;
          applyFilters();
        });
      });
    }
  };

  // ─── Loading / Error States ────────────────────────────────
  const showLoading = (): void => {
    if (!productDiv) return;
    productDiv.innerHTML = `
      <div class="col-12 d-flex justify-content-center py-5">
        <div class="text-center my-5">
          <svg class="amr" viewBox="0 0 502 455" xmlns="http://www.w3.org/2000/svg" version="1.1"
            style="width: 80px;" xmlns:xlink="http://www.w3.org/1999/xlink">
            <path d=" M 5 125, L 5 320, 220 445, 280 445, 495 320, 495 120, 280 10, 220 10, z  " stroke="#fff"
              stroke-width="10" fill="transparent" />
            <path d="M 80 245, L 80 325, 40 300, 40 150, 160 80, 160 370, 120 345, 120 245,z M 80 170, 80 205, 120 205, 120 145,z 
                  M 180 70, L 220 45, 250 145, 280 45, 320 70, 320 380, 280 405, 280 165, 270 200, 230 200, 220 165, 220 405, 180 380, z 
                  M 380 245, L 380 345, 340 370, 340 80, 460 140, 460 210, 440 220, 460 230, 460 300, 420 325, 420 265, 395 245,z
                  M 380 195,L 395 195, 420 175, 420 165, 380 147,z " fill="transparent" stroke="#fff" stroke-width="5" />
          </svg>
        </div>
      </div>
    `;
  };

  const showError = (): void => {
    if (!productDiv) return;
    productDiv.innerHTML = `
      <div class="col-12 text-center py-5 text-white-50">
        <i class="bx bx-error-circle bx-lg"></i>
        <p class="mt-2">Failed to load products. Please try again.</p>
      </div>
    `;
  };

  // ─── Filter & Sort Logic ──────────────────────────────────
  const applyFilters = (): void => {
    let result = [...allProducts];

    // 1. Filter by collection
    if (selectedCollection !== "all") {
      result = result.filter(
        (p) => p.collection.toLowerCase() === selectedCollection.toLowerCase()
      );
    }

    // 2. Filter by categories
    if (selectedCategories.length > 0) {
      result = result.filter((p) =>
        selectedCategories.includes(p.category.toLowerCase())
      );
    }

    // 3. Filter by price range
    if (customMinPrice !== null || customMaxPrice !== null) {
      result = result.filter((p) => {
        const discountedPrice = p.price - (p.price * p.discountPercentage) / 100;
        const minOk = customMinPrice === null || discountedPrice >= customMinPrice;
        const maxOk = customMaxPrice === null || discountedPrice <= customMaxPrice;
        return minOk && maxOk;
      });
    } else if (selectedPriceRange !== "all") {
      const [minStr, maxStr] = selectedPriceRange.split("-");
      const min = parseFloat(minStr);
      const max = parseFloat(maxStr);

      result = result.filter((p) => {
        const discountedPrice = p.price - (p.price * p.discountPercentage) / 100;
        return discountedPrice >= min && discountedPrice <= max;
      });
    }

    // 4. Filter by brand
    if (selectedBrands.length > 0) {
      result = result.filter((p) =>
        selectedBrands.includes(p.brand.toLowerCase())
      );
    }

    // 5. Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (searchByOption === "category") {
        result = result.filter((p) =>
          p.category.toLowerCase().includes(query)
        );
      } else if (searchByOption === "brand") {
        result = result.filter((p) =>
          p.brand.toLowerCase().includes(query)
        );
      } else {
        result = result.filter(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query)
        );
      }
    }

    // 6. Apply sorting
    if (sortKey === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortKey === "price") {
      result.sort((a, b) => {
        const priceA = a.price - (a.price * a.discountPercentage) / 100;
        const priceB = b.price - (b.price * b.discountPercentage) / 100;
        return priceA - priceB;
      });
    } else if (sortKey === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    filteredProducts = result;

    // Reset page index if pages out of bound
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (thisPage > totalPages) {
      thisPage = Math.max(1, totalPages);
    }

    renderProducts();
  };

  // ─── Render Products ──────────────────────────────────────
  const renderProducts = (): void => {
    if (!productDiv) return;

    const totalCount = filteredProducts.length;

    if (totalCount === 0) {
      productDiv.innerHTML = `
        <div class="col-12 text-center py-5">
          <h5 class="text-white-50">No products found matching the criteria.</h5>
          <p class="text-white-50 small mb-0">Try clearing some filters or searching for another term.</p>
        </div>
      `;
      if (paginationListNums) paginationListNums.innerHTML = "";
      updateProductCountSummary(0, 0, 0);
      return;
    }

    // Slice for pagination
    const startIndex = (thisPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredProducts.slice(startIndex, endIndex);

    updateProductCountSummary(totalCount, startIndex, endIndex);

    // Apply grid/list view class to container
    if (viewMode === "list") {
      productDiv.classList.add("list-view");
    } else {
      productDiv.classList.remove("list-view");
    }

    // Render HTML
    productDiv.innerHTML = paginatedItems.map(buildProductCard).join("");

    // Create page buttons
    updatePaginationControls();
  };

  // ─── Product Count Summary ────────────────────────────────
  const updateProductCountSummary = (total: number, start: number, end: number): void => {
    const summary = document.querySelector<HTMLElement>("#product-count-summary");
    if (!summary) return;
    if (total === 0) {
      summary.textContent = "(0 products found)";
    } else {
      summary.textContent = `(Showing ${start + 1}–${Math.min(end, total)} of ${total} products)`;
    }
  };

  // ─── Build Single Product Card ────────────────────────────
  const buildProductCard = (data: Product): string => {
    const discountedPrice = (
      data.price -
      (data.price * data.discountPercentage) / 100
    ).toFixed(2);
    const ratingWidth = ((data.rating * 100) / 5).toFixed(0);

    // Check wishlist state
    const wishlist: string[] = JSON.parse(
      localStorage.getItem("wishlist") ?? "[]"
    );
    const isWishlisted = wishlist.includes(String(data.id));

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
                  <i class="bx ${isWishlisted ? "bxs-heart" : "bx-heart"}" style="${isWishlisted ? "color: red;" : ""}"></i>
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

  // ─── Pagination Controls ──────────────────────────────────
  const updatePaginationControls = (): void => {
    if (!paginationListNums) return;

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    paginationListNums.innerHTML = "";

    if (totalPages <= 1) return;

    // Generate smart page list (e.g. 1 2 3 ... 10)
    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.className = "page-item";

      const span = document.createElement("span");
      span.className = `page-link page-num cursor-pointer ${i === thisPage ? "active" : ""}`;
      span.textContent = String(i);

      span.addEventListener("click", () => {
        thisPage = i;
        applyFilters();
        const headerElement = document.querySelector(".product-header");
        if (headerElement) {
          headerElement.scrollIntoView({ behavior: "smooth" });
        }
      });

      li.appendChild(span);
      paginationListNums.appendChild(li);
    }

    // Toggle prev/next button states
    if (btnPrevPage) {
      if (thisPage === 1) {
        btnPrevPage.classList.add("disabled");
        btnPrevPage.style.pointerEvents = "none";
        btnPrevPage.style.opacity = "0.5";
      } else {
        btnPrevPage.classList.remove("disabled");
        btnPrevPage.style.pointerEvents = "auto";
        btnPrevPage.style.opacity = "1";
      }
    }

    if (btnNextPage) {
      if (thisPage === totalPages || totalPages === 0) {
        btnNextPage.classList.add("disabled");
        btnNextPage.style.pointerEvents = "none";
        btnNextPage.style.opacity = "0.5";
      } else {
        btnNextPage.classList.remove("disabled");
        btnNextPage.style.pointerEvents = "auto";
        btnNextPage.style.opacity = "1";
      }
    }
  };

  // ─── Setup Event Listeners ────────────────────────────────
  const setupEventListeners = (): void => {
    // 1. Sort change
    if (formSort) {
      formSort.addEventListener("change", () => {
        sortKey = formSort.value;
        thisPage = 1;
        applyFilters();
      });
    }

    // 2. Limit change
    if (formLimit) {
      formLimit.addEventListener("change", () => {
        itemsPerPage = parseInt(formLimit.value) || 9;
        thisPage = 1;
        applyFilters();
      });
    }

    // 3. Search submit & input
    if (searchBox) {
      searchBox.addEventListener("submit", (e: Event) => {
        e.preventDefault();
        if (searchInput) searchQuery = searchInput.value;
        if (searchBy) searchByOption = searchBy.value;
        thisPage = 1;
        applyFilters();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value;
        thisPage = 1;
        applyFilters();
      });
    }

    // 4. Collection sidebar filtering
    if (collectionList) {
      const collectionItems = collectionList.querySelectorAll(".collection-item");
      collectionItems.forEach((item) => {
        item.addEventListener("click", () => {
          collectionItems.forEach((el) => el.classList.remove("active"));
          item.classList.add("active");

          selectedCollection = (item as HTMLElement).dataset.collection || "all";
          thisPage = 1;
          applyFilters();
        });
      });
    }

    // 5. Price radio filtering
    priceRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.checked) {
          selectedPriceRange = radio.value;
          customMinPrice = null;
          customMaxPrice = null;
          if (minPriceInput) minPriceInput.value = "";
          if (maxPriceInput) maxPriceInput.value = "";
          thisPage = 1;
          applyFilters();
        }
      });
    });

    // 6. Custom Price Filter button
    if (btnApplyPrice) {
      btnApplyPrice.addEventListener("click", () => {
        const minVal = minPriceInput ? parseFloat(minPriceInput.value) : NaN;
        const maxVal = maxPriceInput ? parseFloat(maxPriceInput.value) : NaN;

        customMinPrice = !isNaN(minVal) ? minVal : null;
        customMaxPrice = !isNaN(maxVal) ? maxVal : null;

        // Uncheck price radios when custom price is applied
        priceRadios.forEach((radio) => (radio.checked = false));
        selectedPriceRange = "all";

        thisPage = 1;
        applyFilters();
      });
    }

    // 7. Grid/List view toggle
    if (btnGridView && btnListView) {
      btnGridView.addEventListener("click", (e: Event) => {
        e.preventDefault();
        viewMode = "grid";
        btnGridView.classList.add("active");
        btnListView.classList.remove("active");
        renderProducts();
      });

      btnListView.addEventListener("click", (e: Event) => {
        e.preventDefault();
        viewMode = "list";
        btnListView.classList.add("active");
        btnGridView.classList.remove("active");
        renderProducts();
      });
    }

    // 8. Pagination prev/next click
    if (btnPrevPage) {
      btnPrevPage.addEventListener("click", (e: Event) => {
        e.preventDefault();
        if (thisPage > 1) {
          thisPage--;
          applyFilters();
          const headerElement = document.querySelector(".product-header");
          if (headerElement) headerElement.scrollIntoView({ behavior: "smooth" });
        }
      });
    }

    if (btnNextPage) {
      btnNextPage.addEventListener("click", (e: Event) => {
        e.preventDefault();
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        if (thisPage < totalPages) {
          thisPage++;
          applyFilters();
          const headerElement = document.querySelector(".product-header");
          if (headerElement) headerElement.scrollIntoView({ behavior: "smooth" });
        }
      });
    }

    // 9. Product Grid click interactions (Wishlist, Cart)
    if (productDiv) {
      productDiv.addEventListener("click", (e: MouseEvent) => {
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
    }
  };

  // ─── Wishlist Handling ────────────────────────────────────
  const handleWishlist = (btn: HTMLButtonElement): void => {
    const icon = btn.querySelector("i");
    const productId = btn.dataset.productId;
    if (!productId) return;

    let wishlist: string[] = JSON.parse(
      localStorage.getItem("wishlist") ?? "[]"
    );

    if (wishlist.includes(productId)) {
      wishlist = wishlist.filter((id) => id !== productId);
      if (icon) {
        icon.style.color = "";
        icon.className = "bx bx-heart";
      }
    } else {
      wishlist.push(productId);
      if (icon) {
        icon.style.color = "red";
        icon.className = "bx bxs-heart";
      }
    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    updateNavbarBadges();
  };

  // ─── Cart Handling ────────────────────────────────────────
  const handleCart = (btn: HTMLButtonElement): void => {
    const productId = btn.dataset.productId;
    if (!productId) return;

    const cart: string[] = JSON.parse(localStorage.getItem("cart") ?? "[]");
    cart.push(productId);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateNavbarBadges();
  };

  // ─── Initialize ───────────────────────────────────────────
  setupEventListeners();
  getData();
}