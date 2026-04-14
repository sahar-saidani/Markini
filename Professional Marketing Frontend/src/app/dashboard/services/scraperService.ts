import { useCallback, useEffect, useState } from "react";
import { DASHBOARD_REFRESH_MS, DASHBOARD_REQUEST_TIMEOUT_MS, createEmptyDashboard } from "../config";
import { computeKPIs } from "./kpiEngine";
import type {
  ApiConfig,
  ConnectionResult,
  DashboardKPIs,
  NormalizedOrder,
  NormalizedProduct,
  NormalizedSalesReport,
  NormalizedTopSeller,
} from "../types";

type CustomRecord = Record<string, unknown>;

function normalizeNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function withTimeout<T>(promise: Promise<T>) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("Timeout de requete.")), DASHBOARD_REQUEST_TIMEOUT_MS);
    }),
  ]);
}

function getAuthHeaders(config: ApiConfig) {
  if (config.platform === "shopify" && config.accessToken) {
    return { "X-Shopify-Access-Token": config.accessToken };
  }
  if (config.platform === "custom" && config.authHeader && config.apiKey) {
    return { [config.authHeader]: config.apiKey };
  }
  return {};
}

function buildWooUrl(config: ApiConfig, path: string, params: Record<string, string> = {}) {
  const url = new URL(path, config.storeUrl.endsWith("/") ? config.storeUrl : `${config.storeUrl}/`);
  if (config.consumerKey) url.searchParams.set("consumer_key", config.consumerKey);
  if (config.consumerSecret) url.searchParams.set("consumer_secret", config.consumerSecret);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

function buildShopifyBase(config: ApiConfig) {
  return config.shopName?.includes(".myshopify.com") ? `https://${config.shopName}` : `https://${config.shopName}.myshopify.com`;
}

async function fetchJson<T>(url: string, headers: HeadersInit = {}) {
  const response = await withTimeout(fetch(url, { headers }));
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function unwrapCollectionPayload(raw: unknown, keys: string[]) {
  if (Array.isArray(raw)) {
    return raw as CustomRecord[];
  }
  if (raw && typeof raw === "object") {
    for (const key of keys) {
      const candidate = (raw as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) {
        return candidate as CustomRecord[];
      }
    }
  }
  return [];
}

function normalizeWooProducts(raw: CustomRecord[]): NormalizedProduct[] {
  return raw.map((product) => ({
    id: String(product.id ?? ""),
    name: String(product.name ?? "Produit"),
    price: normalizeNumber(product.price),
    stock: normalizeNumber(product.stock_quantity),
    totalSales: product.total_sales == null ? null : normalizeNumber(product.total_sales),
    image: String((Array.isArray(product.images) ? (product.images[0] as CustomRecord | undefined)?.src : "") ?? ""),
    category: String((Array.isArray(product.categories) ? (product.categories[0] as CustomRecord | undefined)?.name : "") ?? "Sans categorie"),
    status: String(product.stock_status ?? "instock") as NormalizedProduct["status"],
    dateCreated: String(product.date_created ?? new Date().toISOString()),
  }));
}

function normalizeWooOrders(raw: CustomRecord[]): NormalizedOrder[] {
  return raw.map((order) => ({
    id: String(order.id ?? ""),
    total: normalizeNumber(order.total),
    dateCreated: String(order.date_created ?? new Date().toISOString()),
    status: String(order.status ?? ""),
    paymentMethod: String(order.payment_method_title ?? order.payment_method ?? ""),
    lineItems: Array.isArray(order.line_items)
      ? order.line_items.map((item) => {
        const line = item as CustomRecord;
        return {
          productId: String(line.product_id ?? ""),
          quantity: normalizeNumber(line.quantity),
          total: normalizeNumber(line.total),
        };
      })
      : [],
  }));
}

function normalizeShopifyProducts(raw: CustomRecord[]): NormalizedProduct[] {
  return raw.map((product) => {
    const variants = Array.isArray(product.variants) ? (product.variants as CustomRecord[]) : [];
    const firstVariant = variants[0] ?? {};
    const images = Array.isArray(product.images) ? (product.images as CustomRecord[]) : [];
    return {
      id: String(product.id ?? ""),
      name: String(product.title ?? "Produit"),
      price: normalizeNumber(firstVariant.price),
      stock: variants.reduce((sum, variant) => sum + normalizeNumber(variant.inventory_quantity), 0),
      totalSales: null,
      image: String(images[0]?.src ?? ""),
      category: String(product.product_type ?? "Sans categorie"),
      status: variants.some((variant) => normalizeNumber(variant.inventory_quantity) > 0) ? "instock" : "outofstock",
      dateCreated: String(product.created_at ?? new Date().toISOString()),
    };
  });
}

function normalizeShopifyOrders(raw: CustomRecord[]): NormalizedOrder[] {
  return raw.map((order) => ({
    id: String(order.id ?? ""),
    total: normalizeNumber(order.current_total_price ?? order.total_price),
    dateCreated: String(order.created_at ?? new Date().toISOString()),
    status: String(order.financial_status ?? order.fulfillment_status ?? ""),
    paymentMethod: String(Array.isArray(order.payment_gateway_names) ? order.payment_gateway_names.join(", ") : ""),
    lineItems: Array.isArray(order.line_items)
      ? order.line_items.map((item) => {
        const line = item as CustomRecord;
        return {
          productId: String(line.product_id ?? ""),
          quantity: normalizeNumber(line.quantity),
          total: normalizeNumber(line.price) * normalizeNumber(line.quantity),
        };
      })
      : [],
  }));
}

function normalizeCustomProducts(raw: CustomRecord[], config: ApiConfig): NormalizedProduct[] {
  const mapping = {
    id: "id",
    name: "name",
    price: "price",
    stock: "stock",
    totalSales: "totalSales",
    image: "image",
    category: "category",
    ...config.fieldMapping,
  };
  return raw.map((product) => ({
    id: String(product[mapping.id] ?? ""),
    name: String(product[mapping.name] ?? "Produit"),
    price: normalizeNumber(product[mapping.price]),
    stock: normalizeNumber(product[mapping.stock]),
    totalSales: product[mapping.totalSales] == null ? null : normalizeNumber(product[mapping.totalSales]),
    image: String(product[mapping.image] ?? ""),
    category: String(product[mapping.category] ?? "Sans categorie"),
    status: normalizeNumber(product[mapping.stock]) > 0 ? "instock" : "outofstock",
    dateCreated: String(product.dateCreated ?? product.created_at ?? new Date().toISOString()),
  }));
}

function normalizeCustomOrders(raw: CustomRecord[]): NormalizedOrder[] {
  return raw.map((order) => ({
    id: String(order.id ?? ""),
    total: normalizeNumber(order.total ?? order.discountedTotal),
    dateCreated: String(order.dateCreated ?? order.created_at ?? new Date().toISOString()),
    status: String(order.status ?? "completed"),
    paymentMethod: String(order.paymentMethod ?? order.payment_method ?? ""),
    lineItems: Array.isArray(order.lineItems)
      ? (order.lineItems as CustomRecord[]).map((item) => ({
        productId: String(item.productId ?? item.product_id ?? ""),
        quantity: normalizeNumber(item.quantity),
        total: normalizeNumber(item.total ?? item.price),
      }))
      : Array.isArray(order.products)
        ? (order.products as CustomRecord[]).map((item) => ({
          productId: String(item.productId ?? item.product_id ?? item.id ?? ""),
          quantity: normalizeNumber(item.quantity),
          total: normalizeNumber(item.total ?? item.discountedTotal ?? normalizeNumber(item.price) * normalizeNumber(item.quantity)),
        }))
      : [],
  }));
}

export async function fetchProducts(config: ApiConfig): Promise<NormalizedProduct[]> {
  if (config.platform === "woocommerce") {
    const raw = await fetchJson<CustomRecord[]>(buildWooUrl(config, "/wp-json/wc/v3/products", { per_page: "100" }));
    return normalizeWooProducts(raw);
  }
  if (config.platform === "shopify") {
    const raw = await fetchJson<{ products: CustomRecord[] }>(`${buildShopifyBase(config)}/admin/api/2024-10/products.json?limit=100`, getAuthHeaders(config));
    return normalizeShopifyProducts(raw.products || []);
  }
  const raw = await fetchJson<unknown>(config.endpoints?.products || "", getAuthHeaders(config));
  return normalizeCustomProducts(unwrapCollectionPayload(raw, ["products", "items", "data"]), config);
}

export async function fetchOrders(config: ApiConfig): Promise<NormalizedOrder[]> {
  if (config.platform === "woocommerce") {
    const raw = await fetchJson<CustomRecord[]>(buildWooUrl(config, "/wp-json/wc/v3/orders", { per_page: "100" }));
    return normalizeWooOrders(raw);
  }
  if (config.platform === "shopify") {
    const raw = await fetchJson<{ orders: CustomRecord[] }>(`${buildShopifyBase(config)}/admin/api/2024-10/orders.json?status=any&limit=100`, getAuthHeaders(config));
    return normalizeShopifyOrders(raw.orders || []);
  }
  const raw = await fetchJson<unknown>(config.endpoints?.orders || "", getAuthHeaders(config));
  return normalizeCustomOrders(unwrapCollectionPayload(raw, ["orders", "carts", "items", "data"]));
}

export async function fetchSalesReport(config: ApiConfig): Promise<NormalizedSalesReport | null> {
  if (config.platform !== "woocommerce") {
    return null;
  }
  const raw = await fetchJson<CustomRecord[]>(buildWooUrl(config, "/wp-json/wc/v3/reports/sales", { period: "month" }));
  const report = raw[0] ?? {};
  return {
    totalSales: normalizeNumber(report.total_sales),
    totalOrders: normalizeNumber(report.total_orders),
    averageSales: normalizeNumber(report.average_sales),
    totalCustomers: normalizeNumber(report.total_customers),
    dailyTotals: {},
  };
}

export async function fetchTopSellers(config: ApiConfig): Promise<NormalizedTopSeller[]> {
  if (config.platform !== "woocommerce") {
    return [];
  }
  const raw = await fetchJson<CustomRecord[]>(buildWooUrl(config, "/wp-json/wc/v3/reports/top_sellers", { period: "month" }));
  return raw.map((seller) => ({
    productId: String(seller.product_id ?? ""),
    name: String(seller.title ?? seller.name ?? "Produit"),
    quantity: normalizeNumber(seller.quantity),
  }));
}

export async function testConnection(config: ApiConfig): Promise<ConnectionResult> {
  try {
    const products = await fetchProducts(config);
    if (!products.length) {
      return { ok: false, message: "Connexion etablie mais aucun produit recupere." };
    }
    return { ok: true, message: "Connexion reussie." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Connexion impossible.",
    };
  }
}

export async function fetchDashboardData(config: ApiConfig): Promise<DashboardKPIs> {
  const connection = await testConnection(config);
  if (!connection.ok) {
    return createEmptyDashboard(connection.message);
  }

  const [productsResult, ordersResult, salesResult, topSellersResult] = await Promise.allSettled([
    fetchProducts(config),
    fetchOrders(config),
    fetchSalesReport(config),
    fetchTopSellers(config),
  ]);

  if (productsResult.status !== "fulfilled" || !productsResult.value.length) {
    return createEmptyDashboard(productsResult.status === "rejected" ? productsResult.reason instanceof Error ? productsResult.reason.message : "Chargement des produits impossible." : "Aucun produit disponible.");
  }

  const dashboard = computeKPIs(
    productsResult.value,
    ordersResult.status === "fulfilled" ? ordersResult.value : [],
    salesResult.status === "fulfilled" ? salesResult.value : null,
    topSellersResult.status === "fulfilled" ? topSellersResult.value : [],
  );

  dashboard.partial = [ordersResult, salesResult, topSellersResult].some((result) => result.status === "rejected");
  if (dashboard.partial) {
    dashboard.errorMessage = "Certaines sources n'ont pas pu etre chargees.";
  }
  return dashboard;
}

export function useDashboardData(config: ApiConfig | null) {
  const [data, setData] = useState<DashboardKPIs>(createEmptyDashboard());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    if (!config) {
      return;
    }
    setLoading(true);
    const result = await fetchDashboardData(config);
    setData(result);
    setError(result.error ? result.errorMessage || "Erreur dashboard." : null);
    setLastUpdated(result.lastUpdated);
    setLoading(false);
  }, [config]);

  useEffect(() => {
    if (!config) {
      return;
    }
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, DASHBOARD_REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [config, refresh]);

  return { data, loading, error, lastUpdated, refresh };
}
