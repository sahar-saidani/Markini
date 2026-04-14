import type { DashboardKPIs, ProductKPI } from "../dashboard/types";

export type AutoMarketingBrief = {
  productName: string;
  targetAudience: string;
  tone: string;
  promotion: string;
  platform: string;
  description: string;
  sectorHint: string;
  styleHint: "Moderne & epure" | "Luxe & prestige" | "Minimaliste" | "Bold & impactant";
};

function inferAudience(product: ProductKPI) {
  const category = product.category.toLowerCase();
  if (category.includes("beaute") || category.includes("cosmet")) return "Personnes interessees par la beaute, le soin et les produits premium";
  if (category.includes("mode") || category.includes("luxe")) return "Clients sensibles au style, a la qualite et a l'image premium";
  if (category.includes("food") || category.includes("boisson")) return "Consommateurs gourmands et clients sensibles aux offres immediates";
  if (category.includes("tech")) return "Utilisateurs connectes a la recherche d'innovation utile";
  return "Clients potentiels pertinents pour ce produit e-commerce";
}

function inferTone(product: ProductKPI) {
  switch (product.statusBadge) {
    case "low_stock_bestseller":
      return "direct et urgent";
    case "best_seller":
      return "confiant et dynamique";
    case "declining":
      return "persuasif et relance commerciale";
    case "no_customers":
      return "pedagogique et rassurant";
    case "inactive":
      return "impactant et orientee reactivation";
    default:
      return "professionnel et engageant";
  }
}

function inferPromotion(product: ProductKPI) {
  if (product.statusBadge === "low_stock_bestseller") {
    return `Mettre en avant la rarete: plus que ${product.stock} en stock`;
  }
  if (product.statusBadge === "declining") {
    return "Proposer une offre limitee pour relancer les ventes";
  }
  if (product.statusBadge === "no_customers") {
    return "Insister sur la decouverte du produit et sa proposition de valeur";
  }
  return product.price > 0 ? `Prix indicatif: ${product.price} EUR` : "Mettre en avant le benefice principal du produit";
}

function inferStyle(product: ProductKPI): AutoMarketingBrief["styleHint"] {
  const category = product.category.toLowerCase();
  if (category.includes("mode") || category.includes("luxe") || category.includes("beaute")) return "Luxe & prestige";
  if (product.statusBadge === "declining" || product.statusBadge === "low_stock_bestseller") return "Bold & impactant";
  if (category.includes("tech")) return "Moderne & epure";
  return "Minimaliste";
}

export function buildAutoMarketingBrief(snapshot: DashboardKPIs | null): AutoMarketingBrief | null {
  const product = snapshot?.priorityProduct;
  if (!product) {
    return null;
  }
  return {
    productName: product.name,
    targetAudience: inferAudience(product),
    tone: inferTone(product),
    promotion: inferPromotion(product),
    platform: "Instagram et Facebook",
    sectorHint: product.category || "E-commerce",
    styleHint: inferStyle(product),
    description: [
      `Analyse KPI du dashboard e-commerce: prioriser le produit ${product.name}.`,
      `Categorie: ${product.category || "Sans categorie"}.`,
      `Score marketing: ${product.scoreMarketing}/100.`,
      `Ventes totales: ${product.totalSales}.`,
      `Revenu produit: ${Math.round(product.revenueProduit)} EUR.`,
      `Tendance: ${product.tendance} (${product.tendancePercent.toFixed(0)}%).`,
      `Stock disponible: ${product.stock}.`,
      "Generer une publication marketing qui transforme ces signaux KPI en angle commercial clair.",
    ].join(" "),
  };
}
