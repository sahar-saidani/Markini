import type { DashboardKPIs, ProductKPI } from "../../dashboard/types";
import type { AIRecommendation, AgentAnswer, GeneratedPost, QualificationState } from "../types";
import { deriveRecommendation } from "./recommendationEngine";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0);
}

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

const GREETINGS = ["salut", "bonjour", "bonsoir", "coucou", "hello", "hi"];

const SECTOR_KEYWORDS: Record<string, string[]> = {
  restaurant: ["restaurant", "restauration", "cafe", "food", "snack", "pizzeria", "boulangerie"],
  beaute: ["beaute", "coiffure", "salon", "spa", "esthetique", "cosmetique"],
  mode: ["mode", "vetement", "fashion", "pret a porter", "boutique"],
  immobilier: ["immobilier", "agence immobiliere", "location", "promoteur"],
  sante: ["sante", "clinique", "cabinet", "medecin", "dentaire"],
  education: ["education", "formation", "ecole", "cours", "academie"],
  services_digitaux: ["agence", "marketing", "digitale", "seo", "publicite", "social media", "web"],
};

const OBJECTIVE_KEYWORDS: Record<string, string[]> = {
  visibilite: ["presence en ligne", "visibilite", "notoriete", "reseaux sociaux", "audience"],
  leads: ["lead", "prospect", "rdv", "rendez vous", "contact", "prise de contact"],
  ventes: ["vente", "ventes", "conversion", "commandes", "clients", "booster"],
  reservation: ["reservation", "reservations", "table", "booking"],
};

function buildAnswer(
  text: string,
  recommendation: AIRecommendation | null,
  product: ProductKPI | null,
  nextQualification: QualificationState,
  options?: { shouldSpeak?: boolean; suggestedReplies?: string[] },
): AgentAnswer {
  return {
    text,
    shouldSpeak: options?.shouldSpeak ?? false,
    recommendation,
    referencedProduct: product,
    suggestedReplies: options?.suggestedReplies ?? [],
    nextQualification,
  };
}

function hasWord(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function extractSector(q: string) {
  const entry = Object.entries(SECTOR_KEYWORDS).find(([, keywords]) => hasWord(q, keywords));
  return entry?.[0] ?? null;
}

function extractObjective(q: string) {
  const entry = Object.entries(OBJECTIVE_KEYWORDS).find(([, keywords]) => hasWord(q, keywords));
  return entry?.[0] ?? null;
}

function extractBudget(rawQuestion: string) {
  const q = normalize(rawQuestion);
  const match = q.match(/(\d[\d\s.,]*)\s*(€|euros?|k)?/);
  if (!match) return null;
  const value = match[1].replace(/\s/g, "");
  const suffix = match[2] ?? "";
  return `${value}${suffix ? ` ${suffix}` : ""}`.trim();
}

function mergeQualification(question: string, current: QualificationState): QualificationState {
  return {
    sector: current.sector ?? extractSector(question),
    objective: current.objective ?? extractObjective(question),
    budget: current.budget ?? extractBudget(question),
  };
}

function scoreProduct(question: string, product: ProductKPI) {
  const q = normalize(question);
  const name = normalize(product.name);
  const category = normalize(product.category);
  const nameTokens = name.split(" ").filter((token) => token.length > 2);
  const categoryTokens = category.split(" ").filter((token) => token.length > 2);
  const promptTokens = q.split(" ").filter((token) => token.length > 2);

  let score = product.scoreMarketing;
  if (q.includes(name)) score += 1000;
  if (q.includes(category)) score += 150;

  for (const token of promptTokens) {
    if (name.includes(token)) score += 5;
    else if (category.includes(token)) score += 3;
    else if (nameTokens.some((entry) => entry.startsWith(token) || token.startsWith(entry))) score += 2;
    else if (categoryTokens.some((entry) => entry.startsWith(token) || token.startsWith(entry))) score += 1;
  }
  return score;
}

function findProduct(products: ProductKPI[], question: string) {
  return [...products]
    .map((product) => ({ product, score: scoreProduct(question, product) }))
    .sort((left, right) => right.score - left.score)[0]?.product ?? null;
}

function bestSellingProduct(products: ProductKPI[]) {
  return [...products].sort((a, b) => b.totalSales - a.totalSales || b.revenueProduit - a.revenueProduit)[0] ?? null;
}

function explainProduct(product: ProductKPI) {
  return `${product.name} est dans la categorie ${product.category}. Il a ${product.totalSales} ventes, ${product.stock} en stock, ${money(product.revenueProduit)} de chiffre d'affaires et une tendance ${product.tendance} de ${product.tendancePercent.toFixed(1)}%.`;
}

function buildProspectPitch(profile: QualificationState, recommendation: AIRecommendation | null, product: ProductKPI | null) {
  const sectorText = profile.sector ? `dans le secteur ${profile.sector}` : "dans votre secteur";
  const objectiveText = profile.objective ? `avec un objectif de ${profile.objective}` : "avec un objectif de croissance";
  const budgetText = profile.budget ? `et un budget estime a ${profile.budget}` : "et un budget a preciser";
  const productText = product ? `Je recommande de mettre en avant ${product.name} en priorite.` : "";
  const channelText = recommendation ? `Le canal prioritaire est ${recommendation.channel}.` : "";
  return `Je comprends que vous etes ${sectorText}, ${objectiveText}, ${budgetText}. ${productText} ${channelText} Je peux vous proposer un pitch, une recommandation concrete ou preparer une prise de contact.`.replace(/\s+/g, " ").trim();
}

export function answerDashboardQuestion(
  question: string,
  dashboardKPIs: DashboardKPIs | null,
  currentRecommendation: AIRecommendation | null,
  generatedPost: GeneratedPost | null,
  priorityProduct: ProductKPI | null,
  qualification: QualificationState,
): AgentAnswer {
  const q = normalize(question);
  const products = dashboardKPIs?.products ?? [];
  const nextQualification = mergeQualification(question, qualification);
  const namedProduct = products.length ? findProduct(products, question) : null;
  const activeProduct = namedProduct ?? priorityProduct ?? dashboardKPIs?.priorityProduct ?? null;
  const fallbackRecommendation = currentRecommendation ?? deriveRecommendation(dashboardKPIs, priorityProduct);

  if (!q) {
    return buildAnswer(
      "Precisez votre besoin, un produit, ou demandez une recommandation.",
      fallbackRecommendation,
      activeProduct,
      nextQualification,
      { suggestedReplies: ["Je cherche plus de clients", "Je veux une recommandation", "Donne-moi des infos produit"] },
    );
  }

  if (GREETINGS.some((greeting) => q === greeting || q.startsWith(`${greeting} `))) {
    return buildAnswer(
      "Quel est votre besoin principal : plus de visibilite, plus de leads, plus de ventes ou une information sur un produit ?",
      fallbackRecommendation,
      activeProduct,
      nextQualification,
      { suggestedReplies: ["Plus de visibilite", "Plus de leads", "Infos sur un produit"] },
    );
  }

  if (!dashboardKPIs) {
    return buildAnswer(
      "Je n'ai pas encore acces aux donnees du dashboard. Connectez ou chargez les donnees e-commerce pour que je puisse repondre precisement sur les produits et recommandations.",
      fallbackRecommendation,
      activeProduct,
      nextQualification,
      { shouldSpeak: true },
    );
  }

  if (q.includes("produit") || q.includes("prix") || q.includes("stock") || q.includes("categorie") || q.includes("parle moi de")) {
    if (activeProduct) {
      return buildAnswer(
        `${explainProduct(activeProduct)} ${activeProduct.stock < 8 ? "Le stock devient sensible." : ""} ${activeProduct.tendance === "hausse" ? "La dynamique est bonne pour une mise en avant marketing." : ""}`.trim(),
        fallbackRecommendation,
        activeProduct,
        nextQualification,
        { shouldSpeak: true, suggestedReplies: ["Recommande-moi une action", "Pourquoi ce produit ?", "Genere un pitch pour ce produit"] },
      );
    }
    return buildAnswer(
      "Je n'ai pas reussi a identifier le produit. Donnez-moi son nom ou sa categorie et je vais analyser ses donnees.",
      fallbackRecommendation,
      activeProduct,
      nextQualification,
      { suggestedReplies: products.slice(0, 3).map((product) => product.name) },
    );
  }

  if (q.includes("recommand") || q.includes("pitch") || q.includes("strategie") || q.includes("que faire")) {
    const pitch = buildProspectPitch(nextQualification, fallbackRecommendation, activeProduct);
    const actions = fallbackRecommendation?.actions.join(", ");
    return buildAnswer(
      `${pitch}${actions ? ` Actions conseillees : ${actions}.` : ""}`,
      fallbackRecommendation,
      activeProduct,
      nextQualification,
      { shouldSpeak: true, suggestedReplies: ["Propose un rendez-vous", "Resume par email", "Quel produit pousser ?"] },
    );
  }

  if (q.includes("rendez") || q.includes("rdv") || q.includes("contact") || q.includes("email")) {
    return buildAnswer(
      "Je peux preparer une prise de contact avec un resume clair du besoin, du secteur, du budget et de la recommandation prioritaire. Confirmez si vous voulez un message court ou un pitch plus commercial.",
      fallbackRecommendation,
      activeProduct,
      nextQualification,
      { suggestedReplies: ["Message court", "Pitch commercial", "Resume du besoin"] },
    );
  }

  if (q.includes("dashboard") || q.includes("kpi") || q.includes("ventes") || q.includes("chiffre d affaires") || q.includes("panier moyen")) {
    return buildAnswer(
      `Le dashboard suit ${dashboardKPIs.products.length} produits. Le chiffre d'affaires du jour est ${money(dashboardKPIs.global.chiffreAffaires.day)}, celui de la semaine est ${money(dashboardKPIs.global.chiffreAffaires.week)}, avec ${dashboardKPIs.global.totalCommandes} commandes et un panier moyen de ${money(dashboardKPIs.global.panierMoyen)}.`,
      fallbackRecommendation,
      activeProduct,
      nextQualification,
      { shouldSpeak: true, suggestedReplies: ["Quel produit pousse le plus ?", "Quel stock est critique ?", "Donne-moi une recommandation"] },
    );
  }

  if (q.includes("meilleur produit") || q.includes("top produit")) {
    const product = bestSellingProduct(products);
    return buildAnswer(
      product ? `${product.name} est le produit le plus performant avec ${product.totalSales} ventes et ${money(product.revenueProduit)} de chiffre d'affaires.` : "Je n'ai pas trouve de produit dominant pour le moment.",
      fallbackRecommendation,
      product,
      nextQualification,
      { shouldSpeak: true, suggestedReplies: ["Pourquoi lui ?", "Quelle action lancer ?", "Genere un pitch pour ce produit"] },
    );
  }

  if (q.includes("post") && generatedPost) {
    return buildAnswer(
      `Le post actuel contient ${generatedPost.word_count} mots. Il met en avant ${activeProduct?.name ?? "le produit prioritaire"} avec les hashtags ${(generatedPost.selected_hashtags?.length ? generatedPost.selected_hashtags : generatedPost.hashtags).join(" ")}.`,
      fallbackRecommendation,
      activeProduct,
      nextQualification,
      { shouldSpeak: true, suggestedReplies: ["Explique le ton", "Regenerer une version plus directe", "Quel produit viser ?"] },
    );
  }

  if (!nextQualification.sector || !nextQualification.objective || !nextQualification.budget) {
    const missing = [
      !nextQualification.sector ? "votre secteur" : null,
      !nextQualification.objective ? "votre objectif" : null,
      !nextQualification.budget ? "votre budget mensuel" : null,
    ].filter(Boolean).join(", ");
    return buildAnswer(
      `J'ai besoin de ${missing} pour affiner la recommandation. Vous pouvez aussi me demander une information sur un produit precis.`,
      fallbackRecommendation,
      activeProduct,
      nextQualification,
      { suggestedReplies: ["Je suis dans la restauration", "Je veux plus de ventes", "Budget 1000 euros"] },
    );
  }

  return buildAnswer(
    buildProspectPitch(nextQualification, fallbackRecommendation, activeProduct),
    fallbackRecommendation,
    activeProduct,
    nextQualification,
    { shouldSpeak: true, suggestedReplies: ["Donne-moi un pitch", "Propose une action", "Infos sur le produit prioritaire"] },
  );
}
