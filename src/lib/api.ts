// ============================================================
// src/lib/api.ts
// Centralized API layer — all HTTP calls go through here
// ============================================================

import axios, { AxiosError } from "axios";
import type { Product, ProductQueryParams, ApiResponse } from "./types";

// ─── Base Config ─────────────────────────────────────────────

const BASE_URL = "http://localhost:3000";

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Interceptors ────────────────────────────────────────────

// Request interceptor — can add auth tokens here in the future
client.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem("token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;
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
        "API: Network error — Is the JSON server running? (npm run serve)",
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
    return client.get("/product", { params });
  },

  /**
   * Get a single product by ID
   * @example productApi.getById(1)
   */
  getById: (id: number): Promise<ApiResponse<Product>> => {
    return client.get(`/product/${id}`);
  },

  /**
   * Get products filtered by brand name
   * @example productApi.getByBrand("adidas")
   */
  getByBrand: (
    brand: string,
    params: Omit<ProductQueryParams, "brand"> = {},
  ): Promise<ApiResponse<Product[]>> => {
    return client.get("/product", { params: { ...params, brand } });
  },

  /**
   * Get products filtered by category
   * @example productApi.getByCategory("shoes")
   */
  getByCategory: (
    category: string,
    params: Omit<ProductQueryParams, "category"> = {},
  ): Promise<ApiResponse<Product[]>> => {
    return client.get("/product", { params: { ...params, category } });
  },

  /**
   * Get products filtered by collection (men | women | accessories)
   * @example productApi.getByCollection("men")
   */
  getByCollection: (
    collection: string,
    params: Omit<ProductQueryParams, "collection"> = {},
  ): Promise<ApiResponse<Product[]>> => {
    return client.get("/product", { params: { ...params, collection } });
  },

  /**
   * Full-text search across products (json-server `q` param)
   * @example productApi.search("adidas shoes")
   */
  search: (
    query: string,
    params: Omit<ProductQueryParams, "q"> = {},
  ): Promise<ApiResponse<Product[]>> => {
    return client.get("/product", { params: { ...params, q: query } });
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
    return client.get("/categories");
  },
};

// ─── Re-export client for one-off requests ───────────────────

export { client };
