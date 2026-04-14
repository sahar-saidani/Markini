// // // ============================================================
// // // types.ts — AdVantage AI — v2 avec images par photo
// // // ============================================================

// // export enum BusinessSector {
// //   TECH        = "Technologie & Startups",
// //   FASHION     = "Mode & Luxe",
// //   FOOD        = "Restauration & Boissons",
// //   HEALTH      = "Santé & Bien-être",
// //   REAL_ESTATE = "Immobilier",
// //   SPORTS      = "Sport & Fitness",
// //   BEAUTY      = "Beauté & Cosmétiques",
// //   EDUCATION   = "Éducation & Formation",
// //   FINANCE     = "Finance & Banque",
// //   ENTERTAINMENT = "Divertissement & Médias",
// // }

// // export enum VisualStyle {
// //   MODERN      = "Moderne & Épuré",
// //   LUXURY      = "Luxe & Prestige",
// //   MINIMALIST  = "Minimaliste",
// //   BOLD        = "Bold & Impactant",
// //   VINTAGE     = "Vintage & Rétro",
// //   FUTURISTIC  = "Futuriste & Tech",
// //   ORGANIC     = "Naturel & Bio",
// //   EDITORIAL   = "Editorial & Magazine",
// // }

// // // ─── Rôle d'une image dans la composition ────────────────────────────────────

// // /**
// //  * Rôle visuel de l'image uploadée dans le poster final.
// //  * Chaque image a son propre rôle indépendant.
// //  */
// // export type ImageRole =
// //   | "product"     // Produit principal (centré, mis en valeur)
// //   | "background"  // Arrière-plan (occupe tout le fond)
// //   | "logo"        // Logo de marque (petit, coin de l'image)
// //   | "accent"      // Élément décoratif secondaire
// //   | "ai_decide";  // L'IA choisit le meilleur rôle selon le contexte

// // /**
// //  * Position spatiale de l'image dans le poster.
// //  * Utilisé pour le compositing Canvas + pour guider le prompt.
// //  */
// // export type ImagePosition =
// //   | "center"         // Milieu exact
// //   | "top-left"       // Coin haut gauche
// //   | "top-center"     // Haut centre
// //   | "top-right"      // Coin haut droit
// //   | "middle-left"    // Milieu gauche
// //   | "middle-right"   // Milieu droit
// //   | "bottom-left"    // Coin bas gauche
// //   | "bottom-center"  // Bas centre
// //   | "bottom-right"   // Coin bas droit
// //   | "ai_decide";     // L'IA choisit

// // /**
// //  * Intensité d'influence de l'image sur la génération img2img.
// //  * 0.1 = très proche de l'original | 0.9 = très transformé
// //  */
// // export type ImageStrength = 0.3 | 0.5 | 0.7 | 0.9;

// // // ─── Objet image utilisateur complet ────────────────────────────────────────

// // /**
// //  * Représente UNE image uploadée par l'utilisateur avec TOUTES ses options.
// //  * Chaque image est indépendante et a sa propre configuration.
// //  */
// // export interface UserImage {
// //   /** Identifiant unique généré à l'upload */
// //   id: string;
// //   /** Data URL base64 de l'image (format: "data:image/jpeg;base64,...") */
// //   base64: string;
// //   /** URL de prévisualisation locale (blob URL) */
// //   previewUrl: string;
// //   /** Nom original du fichier */
// //   fileName: string;
// //   /** Rôle de cette image dans la composition */
// //   role: ImageRole;
// //   /** Position spatiale dans le poster */
// //   position: ImagePosition;
// //   /**
// //    * Forcer l'intégration (true) ou laisser l'IA décider de l'intensité (false).
// //    * Si true, l'image est composited directement via Canvas avant envoi à l'API.
// //    */
// //   forceIntegration: boolean;
// //   /**
// //    * Force de transformation img2img (0.3 = très fidèle, 0.9 = très libre).
// //    * Pertinent uniquement quand role = "background" ou "product".
// //    */
// //   strength: ImageStrength;
// // }

// // // ─── Types de personnalisation ────────────────────────────────────────────────

// // export type TextDisplayMode = "show" | "hide" | "ai_decide";
// // export type ColorMode       = "custom" | "ai_decide";
// // export type CompositionMode = "center" | "left" | "right" | "dynamic" | "ai_decide";
// // export type StyleMode       = "custom" | "ai_decide";
// // export type ColorTone       = "light" | "dark" | "vibrant" | "muted" | "ai_decide";

// // export type LightingOption =
// //   | "Cinématique" | "Studio Doux" | "Golden Hour"
// //   | "Néon / Cyberpunk" | "Naturel" | "Dramatique" | "Backlit";

// // export type AngleOption =
// //   | "Niveau des yeux" | "Vue en contre-plongée" | "Vue aérienne (Drone)"
// //   | "Macro / Gros plan" | "Plan large" | "Dutch angle";

// // // ─── Configuration complète ───────────────────────────────────────────────────

// // export interface CustomizationOptions {
// //   // Images — tableau d'objets avec options individuelles par image
// //   userImages: UserImage[];
// //   useUserImages: boolean;  // false = IA génère tout, ignore userImages

// //   // Texte dans l'image
// //   textDisplayMode: TextDisplayMode;
// //   customSlogan: string;
// //   customMarketingText: string;

// //   // Palette
// //   colorMode: ColorMode;
// //   primaryColors: string[];
// //   accentColor: string;
// //   colorTone: ColorTone;

// //   // Style
// //   styleMode: StyleMode;
// //   selectedStyle: VisualStyle | null;

// //   // Composition globale
// //   compositionMode: CompositionMode;

// //   // Pro
// //   lighting: LightingOption;
// //   cameraAngle: AngleOption;
// //   isPro: boolean;
// // }

// // export const DEFAULT_CUSTOMIZATION: CustomizationOptions = {
// //   userImages: [],
// //   useUserImages: false,

// //   textDisplayMode: "ai_decide",
// //   customSlogan: "",
// //   customMarketingText: "",

// //   colorMode: "ai_decide",
// //   primaryColors: [],
// //   accentColor: "",
// //   colorTone: "ai_decide",

// //   styleMode: "ai_decide",
// //   selectedStyle: null,

// //   compositionMode: "ai_decide",

// //   lighting: "Cinématique",
// //   cameraAngle: "Niveau des yeux",
// //   isPro: false,
// // };

// // // ─── Résultats LLM / Poster ───────────────────────────────────────────────────

// // export interface PosterAnalysis {
// //   optimizedPrompt: string;
// //   slogan: string;
// //   marketingCopy: string;
// //   hashtags: string[];
// //   suggestedColors?: string[];
// //   aestheticRationale?: string;
// //   /** Descriptions des images analysées par le LLM vision */
// //   imageDescriptions?: string[];
// // }

// // export interface PosterData {
// //   id: string;
// //   originalPrompt: string;
// //   optimizedPrompt: string;
// //   sector: BusinessSector;
// //   style: VisualStyle | null;
// //   format: string;
// //   imageUrl: string;
// //   slogan: string;
// //   marketingCopy: string;
// //   hashtags: string[];
// //   customization: CustomizationOptions;
// //   createdAt: number;
// // }

// // export interface UserProfile {
// //   firstName: string;
// //   lastName: string;
// //   email: string;
// //   credits: number;
// //   plan: string;
// // }

// // export interface LLMOptions {
// //   useReasoning?: boolean;
// //   language?: "fr" | "en" | "ar";
// //   maxTokens?: number;
// // }


// // ============================================================
// // types.ts — AdVantage AI — v3 avec background options
// // ============================================================

// export enum BusinessSector {
//   TECH        = "Technologie & Startups",
//   FASHION     = "Mode & Luxe",
//   FOOD        = "Restauration & Boissons",
//   HEALTH      = "Santé & Bien-être",
//   REAL_ESTATE = "Immobilier",
//   SPORTS      = "Sport & Fitness",
//   BEAUTY      = "Beauté & Cosmétiques",
//   EDUCATION   = "Éducation & Formation",
//   FINANCE     = "Finance & Banque",
//   ENTERTAINMENT = "Divertissement & Médias",
// }

// export enum VisualStyle {
//   MODERN      = "Moderne & Épuré",
//   LUXURY      = "Luxe & Prestige",
//   MINIMALIST  = "Minimaliste",
//   BOLD        = "Bold & Impactant",
//   VINTAGE     = "Vintage & Rétro",
//   FUTURISTIC  = "Futuriste & Tech",
//   ORGANIC     = "Naturel & Bio",
//   EDITORIAL   = "Editorial & Magazine",
// }

// // ─── Rôle d'une image dans la composition ────────────────────────────────────

// export type ImageRole =
//   | "product"     // Produit principal
//   | "background"  // Arrière-plan fourni par l'utilisateur
//   | "logo"        // Logo de marque
//   | "accent"      // Élément décoratif secondaire
//   | "ai_decide";  // L'IA choisit

// export type ImagePosition =
//   | "center"
//   | "top-left"
//   | "top-center"
//   | "top-right"
//   | "middle-left"
//   | "middle-right"
//   | "bottom-left"
//   | "bottom-center"
//   | "bottom-right"
//   | "ai_decide";

// export type ImageStrength = 0.3 | 0.5 | 0.7 | 0.9;

// export interface UserImage {
//   id: string;
//   base64: string;
//   previewUrl: string;
//   fileName: string;
//   role: ImageRole;
//   position: ImagePosition;
//   forceIntegration: boolean;
//   strength: ImageStrength;
// }

// // ─── Options background ──────────────────────────────────────────────────────

// /**
//  * Mode de gestion du background de l'affiche.
//  * - "transparent"  : fond transparent (PNG sans fond, utile pour print/montage)
//  * - "ai_generate"  : l'IA génère le background optimal
//  * - "user_image"   : utiliser une image uploadée comme fond
//  * - "solid_color"  : couleur unie choisie par l'utilisateur
//  * - "gradient"     : dégradé entre deux couleurs
//  * - "custom_desc"  : description textuelle du fond souhaité
//  */
// export type BackgroundMode =
//   | "transparent"
//   | "ai_generate"
//   | "user_image"
//   | "solid_color"
//   | "gradient"
//   | "custom_desc";

// export interface BackgroundOptions {
//   mode: BackgroundMode;
//   /** URL de l'image choisie comme fond (si mode = "user_image") */
//   userImageId?: string;
//   /** Couleur principale (si mode = "solid_color" ou "gradient") */
//   color1?: string;
//   /** Couleur secondaire pour le dégradé (si mode = "gradient") */
//   color2?: string;
//   /** Direction du dégradé en degrés (si mode = "gradient") */
//   gradientAngle?: number;
//   /** Description libre du fond souhaité (si mode = "custom_desc") */
//   customDescription?: string;
// }

// // ─── Types de personnalisation ────────────────────────────────────────────────

// export type TextDisplayMode = "show" | "hide" | "ai_decide";
// export type ColorMode       = "custom" | "ai_decide";
// export type CompositionMode = "center" | "left" | "right" | "dynamic" | "ai_decide";
// export type StyleMode       = "custom" | "ai_decide";
// export type ColorTone       = "light" | "dark" | "vibrant" | "muted" | "ai_decide";

// export type LightingOption =
//   | "Cinématique" | "Studio Doux" | "Golden Hour"
//   | "Néon / Cyberpunk" | "Naturel" | "Dramatique" | "Backlit";

// export type AngleOption =
//   | "Niveau des yeux" | "Vue en contre-plongée" | "Vue aérienne (Drone)"
//   | "Macro / Gros plan" | "Plan large" | "Dutch angle";

// // ─── Configuration complète ───────────────────────────────────────────────────

// export interface CustomizationOptions {
//   // Images
//   userImages: UserImage[];
//   useUserImages: boolean;

//   // Background — NOUVEAU
//   background: BackgroundOptions;

//   // Texte
//   textDisplayMode: TextDisplayMode;
//   customSlogan: string;
//   customMarketingText: string;

//   // Palette
//   colorMode: ColorMode;
//   primaryColors: string[];
//   accentColor: string;
//   colorTone: ColorTone;

//   // Style
//   styleMode: StyleMode;
//   selectedStyle: VisualStyle | null;

//   // Composition
//   compositionMode: CompositionMode;

//   // Pro
//   lighting: LightingOption;
//   cameraAngle: AngleOption;
//   isPro: boolean;
// }

// export const DEFAULT_CUSTOMIZATION: CustomizationOptions = {
//   userImages: [],
//   useUserImages: false,

//   background: {
//     mode: "ai_generate",
//   },

//   textDisplayMode: "ai_decide",
//   customSlogan: "",
//   customMarketingText: "",

//   colorMode: "ai_decide",
//   primaryColors: [],
//   accentColor: "",
//   colorTone: "ai_decide",

//   styleMode: "ai_decide",
//   selectedStyle: null,

//   compositionMode: "ai_decide",

//   lighting: "Cinématique",
//   cameraAngle: "Niveau des yeux",
//   isPro: false,
// };

// // ─── Résultats LLM / Poster ───────────────────────────────────────────────────

// export interface PosterAnalysis {
//   optimizedPrompt: string;
//   slogan: string;
//   marketingCopy: string;
//   hashtags: string[];
//   suggestedColors?: string[];
//   aestheticRationale?: string;
//   imageDescriptions?: string[];
// }

// export interface PosterData {
//   id: string;
//   originalPrompt: string;
//   optimizedPrompt: string;
//   sector: BusinessSector;
//   style: VisualStyle | null;
//   format: string;
//   imageUrl: string;
//   slogan: string;
//   marketingCopy: string;
//   hashtags: string[];
//   customization: CustomizationOptions;
//   createdAt: number;
// }

// export interface UserProfile {
//   firstName: string;
//   lastName: string;
//   email: string;
//   credits: number;
//   plan: string;
// }

// export interface LLMOptions {
//   useReasoning?: boolean;
//   language?: "fr" | "en" | "ar";
//   maxTokens?: number;
// }


export enum BusinessSector {
  TECH          = "Technologie & Startups",
  FASHION       = "Mode & Luxe",
  FOOD          = "Restauration & Boissons",
  HEALTH        = "Santé & Bien-être",
  REAL_ESTATE   = "Immobilier",
  SPORTS        = "Sport & Fitness",
  BEAUTY        = "Beauté & Cosmétiques",
  EDUCATION     = "Éducation & Formation",
  FINANCE       = "Finance & Banque",
  ENTERTAINMENT = "Divertissement & Médias",
}

export enum VisualStyle {
  MODERN      = "Moderne & Épuré",
  LUXURY      = "Luxe & Prestige",
  MINIMALIST  = "Minimaliste",
  BOLD        = "Bold & Impactant",
  VINTAGE     = "Vintage & Rétro",
  FUTURISTIC  = "Futuriste & Tech",
  ORGANIC     = "Naturel & Bio",
  EDITORIAL   = "Editorial & Magazine",
}

export type ImageRole = "product" | "background" | "logo" | "accent" | "ai_decide";
export type ImagePosition =
  | "center" | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right"
  | "ai_decide";
export type ImageStrength = 0.3 | 0.5 | 0.7 | 0.9;

export interface UserImage {
  id: string;
  base64: string;
  previewUrl: string;
  fileName: string;
  role: ImageRole;
  position: ImagePosition;
  forceIntegration: boolean;
  strength: ImageStrength;
}

export type BackgroundMode =
  | "transparent" | "ai_generate" | "user_image"
  | "solid_color" | "gradient" | "custom_desc";

export interface BackgroundOptions {
  mode: BackgroundMode;
  userImageId?: string;
  color1?: string;
  color2?: string;
  gradientAngle?: number;
  customDescription?: string;
}

export type ElementMode = "user" | "ai" | "disabled";

export interface ElementControl<T = string> {
  mode: ElementMode;
  value: T;
}

export type TextDisplayMode = "show" | "hide" | "ai_decide";
export type ColorMode       = "custom" | "ai_decide";
export type CompositionMode = "center" | "left" | "right" | "dynamic" | "ai_decide";
export type StyleMode       = "custom" | "ai_decide";
export type ColorTone       = "light" | "dark" | "vibrant" | "muted" | "ai_decide";

export type LightingOption =
  | "Cinématique" | "Studio Doux" | "Golden Hour"
  | "Néon / Cyberpunk" | "Naturel" | "Dramatique" | "Backlit";

export type AngleOption =
  | "Niveau des yeux" | "Vue en contre-plongée" | "Vue aérienne (Drone)"
  | "Macro / Gros plan" | "Plan large" | "Dutch angle";

export interface CustomizationOptions {
  userImages: UserImage[];
  useUserImages: boolean;
  background: BackgroundOptions;
  textDisplayMode: TextDisplayMode;
  customSlogan: string;
  customMarketingText: string;
  sloganControl: ElementControl;
  priceControl: ElementControl;
  promoControl: ElementControl;
  ctaControl: ElementControl;
  colorMode: ColorMode;
  primaryColors: string[];
  accentColor: string;
  colorTone: ColorTone;
  styleMode: StyleMode;
  selectedStyle: VisualStyle | null;
  compositionMode: CompositionMode;
  lighting: LightingOption;
  cameraAngle: AngleOption;
  isPro: boolean;
}

export const DEFAULT_CUSTOMIZATION: CustomizationOptions = {
  userImages: [],
  useUserImages: false,
  background: { mode: "ai_generate" },
  textDisplayMode: "ai_decide",
  customSlogan: "",
  customMarketingText: "",
  sloganControl: { mode: "ai", value: "" },
  priceControl:  { mode: "disabled", value: "" },
  promoControl:  { mode: "disabled", value: "" },
  ctaControl:    { mode: "ai", value: "" },
  colorMode: "ai_decide",
  primaryColors: [],
  accentColor: "",
  colorTone: "ai_decide",
  styleMode: "ai_decide",
  selectedStyle: null,
  compositionMode: "ai_decide",
  lighting: "Cinématique",
  cameraAngle: "Niveau des yeux",
  isPro: false,
};

// ─── Post-édition ─────────────────────────────────────────────────────────────

export type TextAlign = "left" | "center" | "right";

export interface TextLayer {
  id: string;
  type: "slogan" | "price" | "promo" | "cta" | "custom";
  content: string;
  x: number;        // % from left
  y: number;        // % from top
  fontSize: number; // px
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  align: TextAlign;
  rotation: number; // degrees
  opacity: number;  // 0-1
  backgroundColor?: string;
  backgroundPadding?: number;
  backgroundRadius?: number;
}

export interface LogoLayer {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;  // % of poster width
  opacity: number;
}

export interface ImageAdjustments {
  brightness: number;  // -100 to 100
  contrast: number;    // -100 to 100
  saturation: number;  // -100 to 100
  blur: number;        // 0 to 20
}

export interface PostEditorState {
  textLayers: TextLayer[];
  logoLayer: LogoLayer | null;
  adjustments: ImageAdjustments;
}

export const DEFAULT_POST_EDITOR: PostEditorState = {
  textLayers: [],
  logoLayer: null,
  adjustments: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
  },
};

// ─── Résultats LLM / Poster ───────────────────────────────────────────────────

export interface PosterAnalysis {
  optimizedPrompt: string;
  slogan: string;
  marketingCopy: string;
  hashtags: string[];
  suggestedColors?: string[];
  aestheticRationale?: string;
  imageDescriptions?: string[];
  generatedPrice?: string;
  generatedPromo?: string;
  generatedCta?: string;
}

export interface PosterData {
  id: string;
  originalPrompt: string;
  optimizedPrompt: string;
  sector: BusinessSector;
  style: VisualStyle | null;
  format: string;
  imageUrl: string;
  slogan: string;
  marketingCopy: string;
  hashtags: string[];
  customization: CustomizationOptions;
  createdAt: number;
  analysis?: PosterAnalysis;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  credits: number;
  plan: string;
}

export interface LLMOptions {
  useReasoning?: boolean;
  language?: "fr" | "en" | "ar";
  maxTokens?: number;
}