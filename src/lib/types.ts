// ============================================================
// src/lib/types.ts
// Central types file — all shared interfaces & types
// ============================================================

// ─── Product ─────────────────────────────────────────────────

export type ProductCategory =
  | "shoes"
  | "cap"
  | "bag"
  | "t-shirt"
  | "shirt"
  | "pants"
  | "jacket"
  | "dress"
  | "scarf"
  | "cravat"
  | string; // allow future categories

export type ProductCollection = "men" | "women" | "accessories" | string;

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: ProductCategory;
  collection: ProductCollection;
  images: string[];
}

// ─── Cart ────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// ─── Wishlist ────────────────────────────────────────────────

export type WishlistItem = Product;

export interface Wishlist {
  items: WishlistItem[];
}

// ─── API ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface ProductQueryParams {
  _sort?: keyof Product;
  _order?: "asc" | "desc";
  _page?: number;
  _limit?: number;
  brand?: string;
  category?: ProductCategory;
  collection?: ProductCollection;
  q?: string; // full-text search (json-server)
}

// ─── Router ──────────────────────────────────────────────────

export interface Route {
  template: string;
  title: string;
  description: string;
  init?: () => void;
}

export type Routes = Record<string, Route>;

// ─── Theme ───────────────────────────────────────────────────

export interface ThemeColor {
  value: string;
  label: string;
}

export const THEME_COLORS: ThemeColor[] = [
  { value: "#1E88E5", label: "Blue" },
  { value: "#DB577F", label: "Pink" },
  { value: "#15dc0b", label: "Green" },
  { value: "#404756", label: "Dark" },
  { value: "#7978ED", label: "Purple" },
  { value: "#DAA21C", label: "Gold" },
] as const;

// ─── User / Auth ─────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ─── UI State ────────────────────────────────────────────────

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  limit: number;
  totalItems: number;
}
