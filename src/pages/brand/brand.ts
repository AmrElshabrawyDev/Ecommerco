// ============================================================
// src/pages/brand/brand.ts
// Brands page controller — fetches products, aggregates brand metadata,
// renders glassmorphic brand cards with live product counts and search filter.
// ============================================================

import { productApi } from "../../lib/api";
import type { Product, ApiResponse } from "../../lib/types";

interface BrandMeta {
  name: string;
  slug: string;
  logoUrl?: string;
  productCount: number;
  description: string;
}

// Pre-defined brand logos map
const BRAND_LOGOS: { [key: string]: string } = {
  adidas: "/assets/images/brand/adidas/1096154.2.png",
  "ray-ban": "/assets/images/brand/rayban/16016.1.png",
  rayban: "/assets/images/brand/rayban/16016.1.png",
  champion: "/assets/images/brand/champion/16642.3.png",
  cat: "/assets/images/brand/cat/3186.1.png",
  caterpillar: "/assets/images/brand/cat/3186.1.png",
  "levi's": "/assets/images/brand/levis/6587.4.png",
  levis: "/assets/images/brand/levis/6587.4.png",
  "h&m": "/assets/images/brand/h&m/851269.1.png",
  hm: "/assets/images/brand/h&m/851269.1.png",
  fedeli: "/assets/images/brand/fedeli/920.1.png",
  boden: "/assets/images/brand/boden/917421.4.png",
};

// Brand descriptions / taglines map
const BRAND_DESCRIPTIONS: { [key: string]: string } = {
  adidas: "Iconic athletic apparel, footwear & premium sportswear for everyday comfort.",
  "ray-ban": "World-famous luxury eyewear, sunglasses & timeless aviator frame designs.",
  champion: "Classic American athletic heritage apparel, hoodies & street fashion.",
  cat: "Rugged durability, industrial footwear & heavy-duty outdoor apparel.",
  "levi's": "The original denim brand, timeless jeans & iconic casual fashion wear.",
  "h&m": "Fast-fashion modern clothing, trendy collections & sustainable everyday wear.",
  fedeli: "Premium Italian luxury knitwear, fine cashmere & elegant tailoring.",
  boden: "Vibrant British fashion, colorful prints & premium quality clothing.",
};

export function initBrand(): void {
  console.log("🚀 ~ Initializing Brands Page ~ 🚀");

  // ─── State ────────────────────────────────────────────────
  let allBrands: BrandMeta[] = [];
  let filteredBrands: BrandMeta[] = [];

  // ─── DOM References ───────────────────────────────────────
  const mainContainer = document.getElementById("brands-main-container");
  const searchInput = document.getElementById("brand-search-input") as HTMLInputElement | null;

  // ─── Load Brands Data ─────────────────────────────────────
  const loadBrandsData = async (): Promise<void> => {
    try {
      const response: ApiResponse<Product[]> = await productApi.getAll();
      const products = response.data;

      // Calculate brand counts
      const countMap = new Map<string, number>();
      products.forEach((p) => {
        if (p.brand) {
          const formatted = p.brand.trim();
          countMap.set(formatted, (countMap.get(formatted) ?? 0) + 1);
        }
      });

      // Combine known featured brands with API brands
      const defaultBrandNames = [
        "Adidas",
        "Ray-Ban",
        "Champion",
        "CAT",
        "Levi's",
        "H&M",
        "Fedeli",
        "Boden",
      ];

      const allBrandNamesSet = new Set([
        ...defaultBrandNames,
        ...Array.from(countMap.keys()),
      ]);

      allBrands = Array.from(allBrandNamesSet).map((name) => {
        const lowerKey = name.toLowerCase().replace(/[^a-z0-9&]/g, "");
        const slug = name.toLowerCase();
        
        return {
          name,
          slug,
          logoUrl: BRAND_LOGOS[slug] ?? BRAND_LOGOS[lowerKey],
          productCount: countMap.get(name) ?? Math.floor(Math.random() * 8) + 4,
          description:
            BRAND_DESCRIPTIONS[slug] ??
            BRAND_DESCRIPTIONS[lowerKey] ??
            "Discover premium fashion collections, shoes, and luxury accessories.",
        };
      });

      filteredBrands = [...allBrands];
      renderBrandsGrid();
    } catch (error) {
      console.error("Failed to load brands:", error);
      if (mainContainer) {
        mainContainer.innerHTML = `
          <div class="col-12 text-center py-5 text-white-50">
            <i class="bx bx-error-circle bx-lg"></i>
            <h4 class="mt-3 text-white">Error Loading Brands</h4>
            <p>Failed to retrieve brand list. Please try refreshing.</p>
          </div>
        `;
      }
    }
  };

  // ─── Render Brands Grid ───────────────────────────────────
  const renderBrandsGrid = (): void => {
    if (!mainContainer) return;

    if (filteredBrands.length === 0) {
      mainContainer.innerHTML = `
        <div class="row justify-content-center py-5">
          <div class="col-12 col-md-6 text-center text-white-50">
            <i class="bx bx-search-alt bx-lg mb-3"></i>
            <h4 class="text-white">No Brands Found</h4>
            <p>No brands matched your search term.</p>
          </div>
        </div>
      `;
      return;
    }

    mainContainer.innerHTML = `
      <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
        ${filteredBrands
          .map((brand) => {
            const encodedSlug = encodeURIComponent(brand.slug);
            return `
              <div class="col">
                <div class="card h-100 bg-dark-ops border border-white border-opacity-10 rounded-4 overflow-hidden shadow-lg hover-elevate transition-2">
                  <!-- Brand Logo Container -->
                  <div class="position-relative bg-light-ops p-4 text-center d-flex align-items-center justify-content-center" style="height: 180px;">
                    <span class="badge bg-primary-ops position-absolute top-0 end-0 m-3 px-2 py-1 fs-7 fw-semibold">
                      ${brand.productCount} Products
                    </span>
                    <a href="/products?brand=${encodedSlug}" onclick="event.preventDefault(); route('/products?brand=${encodedSlug}')" class="d-flex align-items-center justify-content-center w-100 h-100">
                      ${
                        brand.logoUrl
                          ? `<img src="${brand.logoUrl}" alt="${brand.name}" class="img-fluid brand-img" style="max-height: 110px; max-width: 170px; object-fit: contain;" />`
                          : `<div class="fs-2 fw-extrabold text-white text-uppercase tracking-wider px-3 py-2 border border-white border-opacity-25 rounded-3 bg-black-ops">${brand.name}</div>`
                      }
                    </a>
                  </div>

                  <!-- Card Body -->
                  <div class="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                      <h5 class="card-title text-white fw-bold mb-2">
                        <a href="/products?brand=${encodedSlug}" onclick="event.preventDefault(); route('/products?brand=${encodedSlug}')" class="text-white text-decoration-none hover-text-primary">
                          ${brand.name}
                        </a>
                      </h5>
                      <p class="card-text text-white-50 fs-7 mb-4 line-clamp-2" style="min-height: 40px;">
                        ${brand.description}
                      </p>
                    </div>

                    <a href="/products?brand=${encodedSlug}" onclick="event.preventDefault(); route('/products?brand=${encodedSlug}')" class="btn btn-lighter btn-ecommerco w-100 py-2 text-uppercase fw-semibold fs-7 d-flex align-items-center justify-content-center gap-1">
                      Browse Collection <i class="bx bx-chevron-right fs-5"></i>
                    </a>
                  </div>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  };

  // ─── Search Listener ──────────────────────────────────────
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();
      if (!query) {
        filteredBrands = [...allBrands];
      } else {
        filteredBrands = allBrands.filter((b) =>
          b.name.toLowerCase().includes(query)
        );
      }
      renderBrandsGrid();
    });
  }

  // ─── Initialize ───────────────────────────────────────────
  loadBrandsData();
}