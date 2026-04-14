import type { PostResponse } from "../lib/api";
import type { DashboardKPIs, ProductKPI } from "../dashboard/types";

export type GeneratedPost = PostResponse;

export interface AIRecommendation {
  title: string;
  summary: string;
  reason: string;
  channel: "linkedin" | "instagram" | "facebook" | "email" | "multi_channel";
  priority: "high" | "medium" | "low";
  productId?: string;
  actions: string[];
}

export interface QualificationState {
  sector: string | null;
  objective: string | null;
  budget: string | null;
}

export interface AgentAnswer {
  text: string;
  shouldSpeak: boolean;
  recommendation: AIRecommendation | null;
  referencedProduct: ProductKPI | null;
  suggestedReplies?: string[];
  nextQualification?: QualificationState;
}

export interface SalesAgentState {
  dashboardKPIs: DashboardKPIs | null;
  currentRecommendation: AIRecommendation | null;
  generatedPost: GeneratedPost | null;
  priorityProduct: ProductKPI | null;
}
