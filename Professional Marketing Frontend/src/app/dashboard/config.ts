import type { ApiConfig, DashboardKPIs } from "./types";

export const DASHBOARD_STORAGE_KEY = import.meta.env.VITE_ECOMMERCE_CONFIG_KEY || "ecommerce_config";
export const DASHBOARD_DATA_KEY = `${DASHBOARD_STORAGE_KEY}_latest_data`;
export const DASHBOARD_REFRESH_MS = Number(import.meta.env.VITE_DASHBOARD_REFRESH_MS || 60000);
export const DASHBOARD_REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_DASHBOARD_REQUEST_TIMEOUT_MS || 15000);

export function loadStoredConfig(): ApiConfig | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as ApiConfig;
  } catch {
    return null;
  }
}

export function saveStoredConfig(config: ApiConfig) {
  window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(config));
}

export function clearStoredConfig() {
  window.localStorage.removeItem(DASHBOARD_STORAGE_KEY);
}

export function saveLatestDashboardData(data: DashboardKPIs) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(DASHBOARD_DATA_KEY, JSON.stringify(data));
}

export function loadLatestDashboardData(): DashboardKPIs | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(DASHBOARD_DATA_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as DashboardKPIs & { lastUpdated?: string };
    return {
      ...parsed,
      lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : new Date(),
    };
  } catch {
    return null;
  }
}

export function createEmptyDashboard(errorMessage?: string): DashboardKPIs {
  return {
    global: {
      chiffreAffaires: { day: 0, week: 0, month: 0 },
      totalCommandes: 0,
      panierMoyen: 0,
    },
    products: [],
    priorityProduct: null,
    lastUpdated: new Date(),
    error: Boolean(errorMessage),
    errorMessage,
    partial: false,
  };
}
