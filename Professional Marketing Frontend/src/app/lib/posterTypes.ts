export type PosterFormat = "1:1" | "9:16" | "16:9";

export enum VisualStyle {
  MODERN = "Moderne & epure",
  LUXURY = "Luxe & prestige",
  MINIMALIST = "Minimaliste",
  BOLD = "Bold & impactant",
}

export type BackgroundMode = "ai_generate" | "user_image";
export type ElementMode = "user" | "ai" | "disabled";
export type ColorMode = "custom" | "ai_decide";
export type CompositionMode = "center" | "left" | "right" | "dynamic" | "ai_decide";
export type ColorTone = "light" | "dark" | "vibrant" | "muted" | "ai_decide";

export interface UserImage {
  id: string;
  base64: string;
  previewUrl: string;
  fileName: string;
  role: "product";
  position: "center";
  forceIntegration: boolean;
  strength: 0.3 | 0.5 | 0.7 | 0.9;
}

export interface ElementControl {
  mode: ElementMode;
  value: string;
}

export interface CustomizationOptions {
  userImages: UserImage[];
  useUserImages: boolean;
  background: {
    mode: BackgroundMode;
  };
  customMarketingText: string;
  sloganControl: ElementControl;
  priceControl: ElementControl;
  promoControl: ElementControl;
  ctaControl: ElementControl;
  colorMode: ColorMode;
  primaryColors: string[];
  accentColor: string;
  colorTone: ColorTone;
  styleMode: "custom" | "ai_decide";
  selectedStyle: VisualStyle | null;
  compositionMode: CompositionMode;
  lighting: "Cinematique" | "Studio Doux" | "Golden Hour" | "Naturel";
  cameraAngle: "Niveau des yeux" | "Plan large";
  isPro: boolean;
}

export interface PosterAnalysis {
  optimizedPrompt: string;
  slogan: string;
  marketingCopy: string;
  hashtags: string[];
  suggestedColors?: string[];
  aestheticRationale?: string;
  generatedPrice?: string;
  generatedPromo?: string;
  generatedCta?: string;
}

export const DEFAULT_CUSTOMIZATION: CustomizationOptions = {
  userImages: [],
  useUserImages: false,
  background: { mode: "ai_generate" },
  customMarketingText: "",
  sloganControl: { mode: "ai", value: "" },
  priceControl: { mode: "disabled", value: "" },
  promoControl: { mode: "disabled", value: "" },
  ctaControl: { mode: "disabled", value: "" },
  colorMode: "ai_decide",
  primaryColors: [],
  accentColor: "",
  colorTone: "ai_decide",
  styleMode: "ai_decide",
  selectedStyle: null,
  compositionMode: "ai_decide",
  lighting: "Studio Doux",
  cameraAngle: "Niveau des yeux",
  isPro: false,
};
