import type {
  DashboardKPIs,
  NormalizedOrder,
  NormalizedProduct,
  NormalizedSalesReport,
  NormalizedTopSeller,
  ProductKPI,
  WeeklyDataPoint,
} from "../types";
import { createEmptyDashboard } from "../config";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isBetween(dateValue: string, start: Date, end: Date) {
  const date = new Date(dateValue);
  return date >= start && date < end;
}

function formatWeekLabel(date: Date) {
  return `Sem. ${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function sumLineItems(order: NormalizedOrder, productId: string) {
  return order.lineItems
    .filter((lineItem) => lineItem.productId === productId)
    .reduce(
      (accumulator, lineItem) => ({
        quantity: accumulator.quantity + lineItem.quantity,
        revenue: accumulator.revenue + lineItem.total,
      }),
      { quantity: 0, revenue: 0 },
    );
}

export function selectPriorityProduct(products: ProductKPI[]): ProductKPI | null {
  return [...products].sort((left, right) => right.scoreMarketing - left.scoreMarketing)[0] ?? null;
}

export function computeKPIs(
  products: NormalizedProduct[],
  orders: NormalizedOrder[],
  salesReport: NormalizedSalesReport | null,
  topSellers: NormalizedTopSeller[],
): DashboardKPIs {
  if (!products.length) {
    return createEmptyDashboard("Aucun produit disponible.");
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const weekStart = addDays(todayStart, -6);
  const monthStart = addDays(todayStart, -29);

  const paidOrders = orders.filter((order) => {
    const status = order.status.toLowerCase();
    return !status || ["completed", "paid"].includes(status);
  });
  const dayRevenue = orders.filter((order) => isBetween(order.dateCreated, todayStart, tomorrowStart)).reduce((sum, order) => sum + order.total, 0);
  const weekOrders = orders.filter((order) => isBetween(order.dateCreated, weekStart, tomorrowStart));
  const weekRevenue = weekOrders.reduce((sum, order) => sum + order.total, 0);
  const monthRevenue = orders.filter((order) => isBetween(order.dateCreated, monthStart, tomorrowStart)).reduce((sum, order) => sum + order.total, 0);
  const weeklyOrderCount = weekOrders.filter((order) => {
    const status = order.status.toLowerCase();
    return !status || ["completed", "paid"].includes(status);
  }).length;
  const averageProductSales = products.reduce((sum, product) => sum + (product.totalSales || 0), 0) / Math.max(products.length, 1);

  const productKPIs = products.map<ProductKPI>((product) => {
    const relatedOrders = orders.filter((order) => order.lineItems.some((lineItem) => lineItem.productId === product.id));
    const revenueProduit = relatedOrders.reduce((sum, order) => sum + sumLineItems(order, product.id).revenue, 0);

    const totalSalesCalcule = product.totalSales ?? relatedOrders.reduce((sum, order) => sum + sumLineItems(order, product.id).quantity, 0);

    const currentWeekStart = addDays(todayStart, -6);
    const previousWeekStart = addDays(todayStart, -13);
    const previousWeekEnd = addDays(todayStart, -6);

    const semaineCourante = orders
      .filter((order) => isBetween(order.dateCreated, currentWeekStart, tomorrowStart))
      .reduce((sum, order) => sum + sumLineItems(order, product.id).quantity, 0);
    const semainePrecedente = orders
      .filter((order) => isBetween(order.dateCreated, previousWeekStart, previousWeekEnd))
      .reduce((sum, order) => sum + sumLineItems(order, product.id).quantity, 0);

    const tendancePercent = ((semaineCourante - semainePrecedente) / (semainePrecedente || 1)) * 100;
    const tendance = tendancePercent > 10 ? "hausse" : tendancePercent < -10 ? "baisse" : "stable";

    const weeklyData: WeeklyDataPoint[] = Array.from({ length: 4 }, (_, index) => {
      const start = addDays(todayStart, -(28 - index * 7));
      const end = addDays(start, 7);
      const bucketOrders = orders.filter((order) => isBetween(order.dateCreated, start, end));
      const bucket = bucketOrders.reduce(
        (accumulator, order) => {
          const current = sumLineItems(order, product.id);
          return {
            sales: accumulator.sales + current.quantity,
            revenue: accumulator.revenue + current.revenue,
          };
        },
        { sales: 0, revenue: 0 },
      );
      return {
        week: `${start.toISOString()}_${end.toISOString()}`,
        weekLabel: formatWeekLabel(start),
        sales: bucket.sales,
        revenue: bucket.revenue,
      };
    });

    const lastSaleDate = [...relatedOrders].sort((left, right) => new Date(right.dateCreated).getTime() - new Date(left.dateCreated).getTime())[0]?.dateCreated ?? null;
    const noSalesLast14Days = !orders.some((order) => isBetween(order.dateCreated, addDays(todayStart, -13), tomorrowStart) && order.lineItems.some((lineItem) => lineItem.productId === product.id));
    const isTopSeller = topSellers.some((seller) => seller.productId === product.id);

    let scoreMarketing = Math.min(40, Math.max(0, Math.round((100 - totalSalesCalcule) / 2)));
    if (product.stock > 10 && totalSalesCalcule === 0) {
      scoreMarketing = 100;
    } else if (tendancePercent < -30) {
      scoreMarketing = 85;
    } else if (isTopSeller && product.stock < 5) {
      scoreMarketing = 70;
    } else if (noSalesLast14Days) {
      scoreMarketing = 60;
    }

    let statusBadge: ProductKPI["statusBadge"] = "normal";
    if (scoreMarketing === 100) {
      statusBadge = "no_customers";
    } else if (scoreMarketing === 85) {
      statusBadge = "declining";
    } else if (scoreMarketing === 70) {
      statusBadge = "low_stock_bestseller";
    } else if (scoreMarketing === 60) {
      statusBadge = "inactive";
    } else if (totalSalesCalcule > averageProductSales * 1.5) {
      statusBadge = "best_seller";
    }

    return {
      id: product.id,
      name: product.name,
      image: product.image,
      category: product.category,
      price: product.price,
      totalSales: totalSalesCalcule,
      stock: product.stock,
      revenueProduit,
      tendance,
      tendancePercent,
      weeklyData,
      scoreMarketing,
      statusBadge,
      lastSaleDate,
    };
  });

  return {
    global: {
      chiffreAffaires: {
        day: dayRevenue,
        week: salesReport?.totalSales && !weekRevenue ? salesReport.totalSales : weekRevenue,
        month: monthRevenue,
      },
      totalCommandes: paidOrders.length || salesReport?.totalOrders || 0,
      panierMoyen: weeklyOrderCount ? weekRevenue / weeklyOrderCount : 0,
    },
    products: productKPIs,
    priorityProduct: selectPriorityProduct(productKPIs),
    lastUpdated: new Date(),
    error: false,
    partial: false,
  };
}
