// ============================================================
// src/lib/api.ts
// Centralized API layer — all HTTP calls go through here
// ============================================================

import axios, { AxiosError } from "axios";
import type { Product, ProductQueryParams, ApiResponse } from "./types";
import localDb from "../../server/db.json";

// ─── Base Config ─────────────────────────────────────────────

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isLocalhost
    ? "http://localhost:3000"
    : "https://my-json-server.typicode.com/AmrElshabrawyDev/Ecommerco");

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Fallback Helper ─────────────────────────────────────────

function getFallbackData(url: string, params: Record<string, any> = {}): ApiResponse<any> {
  console.info(`API: Serving fallback dataset for endpoint: ${url}`);
  const products: Product[] = (localDb as any).product || [];
  const categories: string[] = (localDb as any).categories || [];

  if (url === "/categories") {
    return { data: categories, status: 200, statusText: "OK" };
  }

  const matchSingle = url.match(/^\/product\/(\d+)$/);
  if (matchSingle) {
    const id = Number(matchSingle[1]);
    const found = products.find((p) => p.id === id);
    if (found) {
      return { data: found, status: 200, statusText: "OK" };
    }
    throw new Error(`Product with ID ${id} not found`);
  }

  let result = [...products];

  if (params.brand) {
    result = result.filter(
      (p) => p.brand.toLowerCase() === String(params.brand).toLowerCase()
    );
  }
  if (params.category) {
    result = result.filter(
      (p) => p.category.toLowerCase() === String(params.category).toLowerCase()
    );
  }
  if (params.collection) {
    result = result.filter(
      (p) => p.collection.toLowerCase() === String(params.collection).toLowerCase()
    );
  }
  if (params.q) {
    const q = String(params.q).toLowerCase();
    result = result.filter(
      (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  if (params._sort) {
    const sortKey = params._sort as keyof Product;
    const order = params._order === "desc" ? -1 : 1;
    result.sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return -1 * order;
      if (a[sortKey] > b[sortKey]) return 1 * order;
      return 0;
    });
  }

  if (params._page && params._limit) {
    const page = Number(params._page) || 1;
    const limit = Number(params._limit) || 8;
    const start = (page - 1) * limit;
    result = result.slice(start, start + limit);
  } else if (params._limit) {
    result = result.slice(0, Number(params._limit));
  }

  return { data: result, status: 200, statusText: "OK" };
}

// ─── Interceptors ────────────────────────────────────────────

// Request interceptor — can add auth tokens here in the future
client.interceptors.request.use(
  (config) => {
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor — centralized error handling
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 404) {
      console.warn("API: Resource not found →", error.config?.url);
    } else if (error.response?.status && error.response.status >= 500) {
      console.error("API: Server error →", error.message);
    } else if (!error.response) {
      console.error(
        "API: Network error — Using fallback dataset.",
      );
    }
    return Promise.reject(error);
  },
);

// ─── Products ────────────────────────────────────────────────

export const productApi = {
  /**
   * Get a paginated + filtered list of products
   * @example productApi.getAll({ _sort: "rating", _order: "desc", _page: 1, _limit: 8 })
   */
  getAll: (
    params: ProductQueryParams = {},
  ): Promise<ApiResponse<Product[]>> => {
    return client
      .get("/product", { params })
      .catch(() => getFallbackData("/product", params));
  },

  /**
   * Get a single product by ID
   * @example productApi.getById(1)
   */
  getById: (id: number): Promise<ApiResponse<Product>> => {
    return client
      .get(`/product/${id}`)
      .catch(() => getFallbackData(`/product/${id}`));
  },

  /**
   * Get products filtered by brand name
   * @example productApi.getByBrand("adidas")
   */
  getByBrand: (
    brand: string,
    params: Omit<ProductQueryParams, "brand"> = {},
  ): Promise<ApiResponse<Product[]>> => {
    return client
      .get("/product", { params: { ...params, brand } })
      .catch(() => getFallbackData("/product", { ...params, brand }));
  },

  /**
   * Get products filtered by category
   * @example productApi.getByCategory("shoes")
   */
  getByCategory: (
    category: string,
    params: Omit<ProductQueryParams, "category"> = {},
  ): Promise<ApiResponse<Product[]>> => {
    return client
      .get("/product", { params: { ...params, category } })
      .catch(() => getFallbackData("/product", { ...params, category }));
  },

  /**
   * Get products filtered by collection (men | women | accessories)
   * @example productApi.getByCollection("men")
   */
  getByCollection: (
    collection: string,
    params: Omit<ProductQueryParams, "collection"> = {},
  ): Promise<ApiResponse<Product[]>> => {
    return client
      .get("/product", { params: { ...params, collection } })
      .catch(() => getFallbackData("/product", { ...params, collection }));
  },

  /**
   * Full-text search across products (json-server `q` param)
   * @example productApi.search("adidas shoes")
   */
  search: (
    query: string,
    params: Omit<ProductQueryParams, "q"> = {},
  ): Promise<ApiResponse<Product[]>> => {
    return client
      .get("/product", { params: { ...params, q: query } })
      .catch(() => getFallbackData("/product", { ...params, q: query }));
  },

  /**
   * Get highest-rated products (convenience wrapper)
   * @example productApi.getTopRated(8)
   */
  getTopRated: (limit = 8): Promise<ApiResponse<Product[]>> => {
    return productApi.getAll({
      _sort: "rating",
      _order: "desc",
      _page: 1,
      _limit: limit,
    });
  },
};

// ─── Categories ──────────────────────────────────────────────

export const categoryApi = {
  /**
   * Get all available categories (returns a string array from db.json)
   * @example categoryApi.getAll()
   */
  getAll: (): Promise<ApiResponse<string[]>> => {
    return client
      .get("/categories")
      .catch(() => getFallbackData("/categories"));
  },
};

// ─── Re-export client for one-off requests ───────────────────

export { client };
