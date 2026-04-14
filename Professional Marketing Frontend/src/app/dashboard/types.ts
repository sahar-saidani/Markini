export type Platform = "woocommerce" | "shopify" | "custom";

export interface ApiConfig {
  platform: Platform;
  storeUrl: string;
  consumerKey?: string;
  consumerSecret?: string;
  accessToken?: string;
  shopName?: string;
  apiKey?: string;
  authHeader?: string;
  endpoints?: { products: string; orders: string };
  fieldMapping?: {
    id: string;
    name: string;
    price: string;
    stock: string;
    totalSales: string;
    image: string;
    category: string;
  };
}

export interface NormalizedProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  totalSales: number | null;
  image: string;
  category: string;
  status: "instock" | "outofstock" | "onbackorder";
  dateCreated: string;
}

export interface NormalizedOrder {
  id: string;
  total: number;
  dateCreated: string;
  status: string;
  lineItems: { productId: string; quantity: number; total: number }[];
  paymentMethod: string;
}

export interface NormalizedSalesReport {
  totalSales: number;
  totalOrders: number;
  averageSales: number;
  totalCustomers: number;
  dailyTotals: Record<string, { sales: number; orders: number }>;
}

export interface NormalizedTopSeller {
  productId: string;
  name: string;
  quantity: number;
}

export interface WeeklyDataPoint {
  week: string;
  weekLabel: string;
  sales: number;
  revenue: number;
}

export interface ProductKPI {
  id: string;
  name: string;
  image: string;
  category: string;
  price: number;
  totalSales: number;
  stock: number;
  revenueProduit: number;
  tendance: "hausse" | "baisse" | "stable";
  tendancePercent: number;
  weeklyData: WeeklyDataPoint[];
  scoreMarketing: number;
  statusBadge: "best_seller" | "no_customers" | "declining" | "low_stock_bestseller" | "inactive" | "normal";
  lastSaleDate: string | null;
}

export interface GlobalKPIs {
  chiffreAffaires: { day: number; week: number; month: number };
  totalCommandes: number;
  panierMoyen: number;
}

export interface DashboardKPIs {
  global: GlobalKPIs;
  products: ProductKPI[];
  priorityProduct: ProductKPI | null;
  lastUpdated: Date;
  error: boolean;
  errorMessage?: string;
  partial: boolean;
}

export interface ConnectionResult {
  ok: boolean;
  message: string;
}
