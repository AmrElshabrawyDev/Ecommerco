// ============================================================
// src/pages/products/products.ts
// Products page initialization — handles search, filters,
// sorting, grid/list view toggle, and pagination.
// ============================================================

import { productApi } from "../../lib/api";
import type { Product, ApiResponse } from "../../lib/types";

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
  let selectedBrands: string[] = [];
  
  let searchQuery = "";
  let searchByOption = "Default";
  let viewMode: "grid" | "list" = "grid";

  // ─── DOM References ───────────────────────────────────────
  const productDiv = document.querySelector<HTMLElement>("#product-div");
  const formSort = document.querySelector<HTMLSelectElement>("#form-sort");
  const formLimit = document.querySelector<HTMLSelectElement>("#form-limit");
  const searchBox = document.querySelector<HTMLFormElement>("#search-box");
  const searchBy = document.querySelector<HTMLSelectElement>("#search-by");
  const searchInput = document.querySelector<HTMLInputElement>("#search-input");
  const collectionList = document.querySelector<HTMLElement>("#collection-list");
  const brandListFilters = document.querySelector<HTMLElement>("#brand-list-filters");
  const priceRadios = document.querySelectorAll<HTMLInputElement>('input[name="priceRange"]');
  
  const btnGridView = document.querySelector<HTMLAnchorElement>("#btn-grid-view");
  const btnListView = document.querySelector<HTMLAnchorElement>("#btn-list-view");
  
  const btnPrevPage = document.querySelector<HTMLElement>("#btn-prev-page");
  const btnNextPage = document.querySelector<HTMLElement>("#btn-next-page");
  const paginationListNums = document.querySelector<HTMLElement>("#pagination-list-nums");

  // ─── Fetch Data ───────────────────────────────────────────
  const getData = (): void => {
    showLoading();
    productApi
      .getAll()
      .then((response: ApiResponse<Product[]>) => {
        allProducts = response.data;
        updateCollectionCounts();
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

    // 2. Filter by price range (discounted price)
    if (selectedPriceRange !== "all") {
      const [minStr, maxStr] = selectedPriceRange.split("-");
      const min = parseFloat(minStr);
      const max = parseFloat(maxStr);
      
      result = result.filter((p) => {
        const discountedPrice = p.price - (p.price * p.discountPercentage) / 100;
        return discountedPrice >= min && discountedPrice <= max;
      });
    }

    // 3. Filter by brand
    if (selectedBrands.length > 0) {
      result = result.filter((p) =>
        selectedBrands.includes(p.brand.toLowerCase())
      );
    }

    // 4. Filter by search query
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

    // 5. Apply sorting
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

    if (filteredProducts.length === 0) {
      productDiv.innerHTML = `
        <div class="col-12 text-center py-5">
          <h5 class="text-white-50">No products found matching the criteria.</h5>
        </div>
      `;
      if (paginationListNums) paginationListNums.innerHTML = "";
      return;
    }

    // Slice for pagination
    const startIndex = (thisPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredProducts.slice(startIndex, endIndex);

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

    // Focus search input if search query was submitted
    if (searchInput && searchQuery) {
      searchInput.focus();
    }
  };

  // ─── Build Single Product Card ────────────────────────────
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

          <a href="#" aria-label="View ${data.title}">
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
              <a href="#">
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

    // Generate individual page numbers
    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement("li");
      li.className = "page-item";
      
      const span = document.createElement("span");
      span.className = `page-link page-num ${i === thisPage ? "active" : ""}`;
      span.textContent = String(i);
      
      span.addEventListener("click", () => {
        thisPage = i;
        applyFilters();
        // Scroll smoothly to top of products list
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

    // 3. Search submit
    if (searchBox) {
      searchBox.addEventListener("submit", (e: Event) => {
        e.preventDefault();
        if (searchInput) searchQuery = searchInput.value;
        if (searchBy) searchByOption = searchBy.value;
        thisPage = 1;
        applyFilters();
      });
    }

    // SearchBy change
    if (searchBy) {
      searchBy.addEventListener("change", () => {
        if (searchInput) searchInput.focus();
      });
    }

    // 4. Collection sidebar filtering
    if (collectionList) {
      const collectionItems = collectionList.querySelectorAll(".collection-item");
      collectionItems.forEach((item) => {
        item.addEventListener("click", () => {
          // Remove active class from all
          collectionItems.forEach((el) => el.classList.remove("active"));
          // Add active class to current
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
          thisPage = 1;
          applyFilters();
        }
      });
    });

    // 6. Brand checkbox filtering
    if (brandListFilters) {
      const brandCheckboxes = brandListFilters.querySelectorAll<HTMLInputElement>(".brand-checkbox");
      brandCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
          selectedBrands = Array.from(brandCheckboxes)
            .filter((cb) => cb.checked)
            .map((cb) => cb.value.toLowerCase());
          
          thisPage = 1;
          applyFilters();
        });
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
          // Scroll to top of grid
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
          // Scroll to top of grid
          const headerElement = document.querySelector(".product-header");
          if (headerElement) headerElement.scrollIntoView({ behavior: "smooth" });
        }
      });
    }

    // 9. Product Grid click interactions (Wishlist, Cart, Quick View) via event delegation
    if (productDiv) {
      productDiv.addEventListener("click", (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        // Wishlist
        const wishlistBtn = target.closest<HTMLButtonElement>(".js-wishlist-btn");
        if (wishlistBtn) {
          handleWishlist(wishlistBtn);
          return;
        }

        // Cart
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
    if (icon) {
      // Toggle color & visual indicator
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
      localStorage.getItem("wishlist") ?? "[]"
    );

    if (wishlist.includes(productId)) {
      // Remove if already exists (toggle behavior)
      wishlist = wishlist.filter((id) => id !== productId);
    } else {
      wishlist.push(productId);
    }
    
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  };

  // ─── Cart Handling ────────────────────────────────────────
  const handleCart = (btn: HTMLButtonElement): void => {
    const productId = btn.dataset.productId;
    if (!productId) return;

    const cart: string[] = JSON.parse(localStorage.getItem("cart") ?? "[]");
    cart.push(productId);
    localStorage.setItem("cart", JSON.stringify(cart));

    // Update navbar badge count
    const badge = document.querySelector<HTMLElement>(".badge-notification");
    if (badge) {
      badge.textContent = String(cart.length);
    }
  };

  // ─── Initialize ───────────────────────────────────────────
  setupEventListeners();
  getData();
}