import type { DashboardKPIs, ProductKPI } from "../../dashboard/types";
import type { AIRecommendation } from "../types";

function badgeReason(product: ProductKPI) {
  switch (product.statusBadge) {
    case "no_customers":
      return "Le produit a du stock mais n'a encore converti aucun client.";
    case "declining":
      return "La demande baisse fortement par rapport a la semaine precedente.";
    case "low_stock_bestseller":
      return "Le produit vend bien mais le stock devient critique.";
    case "inactive":
      return "Le produit n'a pas eu de ventes recentes et risque de sortir du radar.";
    case "best_seller":
      return "Le produit surperforme deja le reste du catalogue.";
    default:
      return "Le produit merite un suivi marketing normal.";
  }
}

function channelForProduct(product: ProductKPI): AIRecommendation["channel"] {
  if (product.statusBadge === "best_seller" || product.statusBadge === "low_stock_bestseller") {
    return "instagram";
  }
  if (product.statusBadge === "declining" || product.statusBadge === "inactive") {
    return "linkedin";
  }
  if (product.statusBadge === "no_customers") {
    return "facebook";
  }
  return "multi_channel";
}

function actionsForProduct(product: ProductKPI): string[] {
  if (product.statusBadge === "low_stock_bestseller") {
    return [
      "Reduire la pression publicitaire large et pousser un message de rarete",
      "Prevoir un restock rapide avant une campagne plus agressive",
      "Mettre en avant les preuves sociales et l'urgence",
    ];
  }
  if (product.statusBadge === "declining") {
    return [
      "Relancer avec un nouvel angle de benefice",
      "Tester un post comparatif avant/apres ou probleme/solution",
      "Faire une campagne courte avec offre limitee",
    ];
  }
  if (product.statusBadge === "no_customers") {
    return [
      "Lancer une campagne decouverte orientee education",
      "Ajouter une preuve de valeur claire dans le message",
      "Tester une offre d'essai ou un incentive simple",
    ];
  }
  if (product.statusBadge === "inactive") {
    return [
      "Reactiver le produit avec une campagne de rappel",
      "Verifier si le prix ou l'offre doivent etre reajustes",
      "Prioriser un canal a forte portee organique",
    ];
  }
  return [
    "Maintenir la visibilite du produit",
    "Tester une variante de ton et un nouveau visuel",
    "Suivre les performances 7 jours apres publication",
  ];
}

export function deriveRecommendation(
  dashboardKPIs: DashboardKPIs | null,
  priorityProduct: ProductKPI | null,
): AIRecommendation | null {
  const product = priorityProduct ?? dashboardKPIs?.priorityProduct ?? null;
  if (!product) {
    return null;
  }

  return {
    title: `Promouvoir ${product.name}`,
    summary: `Produit prioritaire avec score marketing ${product.scoreMarketing}/100 et tendance ${product.tendance}.`,
    reason: badgeReason(product),
    channel: channelForProduct(product),
    priority: product.scoreMarketing >= 80 ? "high" : product.scoreMarketing >= 50 ? "medium" : "low",
    productId: product.id,
    actions: actionsForProduct(product),
  };
}
