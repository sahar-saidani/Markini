import type { DashboardKPIs, ProductKPI } from "../../dashboard/types";
import type { AIRecommendation, GeneratedPost } from "../types";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0);
}

function formatProduct(product: ProductKPI) {
  return [
    `- Nom: ${product.name}`,
    `  Categorie: ${product.category}`,
    `  Prix: ${money(product.price)}`,
    `  Stock: ${product.stock}`,
    `  Ventes totales: ${product.totalSales}`,
    `  CA produit: ${money(product.revenueProduit)}`,
    `  Tendance: ${product.tendance} (${product.tendancePercent.toFixed(1)}%)`,
    `  Score marketing: ${product.scoreMarketing}`,
    `  Badge: ${product.statusBadge}`,
    `  Derniere vente: ${product.lastSaleDate ?? "aucune"}`,
  ].join("\n");
}

export function buildAgentContext(
  dashboardKPIs: DashboardKPIs | null,
  currentRecommendation: AIRecommendation | null,
  generatedPost: GeneratedPost | null,
  priorityProduct: ProductKPI | null,
): string {
  const blocks: string[] = [];

  blocks.push("### CONTEXTE DASHBOARD");
  if (!dashboardKPIs) {
    blocks.push("Aucune donnee dashboard disponible.");
  } else {
    blocks.push(`Derniere mise a jour: ${dashboardKPIs.lastUpdated.toISOString()}`);
    blocks.push(`Erreur: ${dashboardKPIs.error ? "oui" : "non"}`);
    blocks.push(`Partiel: ${dashboardKPIs.partial ? "oui" : "non"}`);
    blocks.push(`CA jour: ${money(dashboardKPIs.global.chiffreAffaires.day)}`);
    blocks.push(`CA semaine: ${money(dashboardKPIs.global.chiffreAffaires.week)}`);
    blocks.push(`CA mois: ${money(dashboardKPIs.global.chiffreAffaires.month)}`);
    blocks.push(`Total commandes: ${dashboardKPIs.global.totalCommandes}`);
    blocks.push(`Panier moyen semaine: ${money(dashboardKPIs.global.panierMoyen)}`);
    blocks.push(`Nombre de produits suivis: ${dashboardKPIs.products.length}`);
  }

  blocks.push("\n### PRODUIT PRIORITAIRE");
  blocks.push(priorityProduct ? formatProduct(priorityProduct) : "Aucun produit prioritaire.");

  blocks.push("\n### RECOMMANDATION IA");
  if (!currentRecommendation) {
    blocks.push("Aucune recommandation active.");
  } else {
    blocks.push(`Titre: ${currentRecommendation.title}`);
    blocks.push(`Resume: ${currentRecommendation.summary}`);
    blocks.push(`Raison: ${currentRecommendation.reason}`);
    blocks.push(`Canal: ${currentRecommendation.channel}`);
    blocks.push(`Priorite: ${currentRecommendation.priority}`);
    blocks.push(`Actions: ${currentRecommendation.actions.join(" | ")}`);
  }

  blocks.push("\n### POST GENERE");
  if (!generatedPost) {
    blocks.push("Aucun post genere.");
  } else {
    blocks.push(`Sujet: ${generatedPost.subject || generatedPost.topic}`);
    blocks.push(`Statut: ${generatedPost.status}`);
    blocks.push(`Longueur: ${generatedPost.word_count} mots, ${generatedPost.char_count} caracteres`);
    blocks.push(`Hashtags: ${(generatedPost.selected_hashtags?.length ? generatedPost.selected_hashtags : generatedPost.hashtags).join(" ")}`);
    blocks.push(`Corps:\n${generatedPost.body}`);
  }

  if (dashboardKPIs?.products?.length) {
    blocks.push("\n### PRODUITS");
    blocks.push(dashboardKPIs.products.slice(0, 12).map(formatProduct).join("\n"));
  }

  return blocks.join("\n");
}
