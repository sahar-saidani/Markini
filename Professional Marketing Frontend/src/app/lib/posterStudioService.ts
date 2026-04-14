import {
  CustomizationOptions,
  PosterAnalysis,
  LLMOptions,
  VisualStyle,
  TextDisplayMode,
  ColorMode,
  CompositionMode,
  ColorTone,
  ElementMode,
} from "./posterStudioTypes";

// ─── Constantes ──────────────────────────────────────────────────────────────

const NO_TEXT_SUFFIX =
  "no text, no letters, no words, no typography, no logo, no watermark, " +
  "no icons, clean composition, advertising background only";

const QUALITY_SUFFIX =
  "professional advertising photography, sharp focus, high quality, 8k resolution, " +
  "studio lighting, commercial grade";

const PRO_QUALITY_SUFFIX =
  "ultra detailed, 8K resolution, HDR, award-winning commercial photography, " +
  "perfect composition, Hasselblad camera quality, color graded";

const FORMAT_SIZES: Record<string, { width: number; height: number }> = {
  "1:1":  { width: 1024, height: 1024 },
  "9:16": { width: 768,  height: 1344 },
  "16:9": { width: 1344, height: 768  },
  "4:3":  { width: 1024, height: 768  },
  "3:4":  { width: 768,  height: 1024 },
};

const STYLE_TO_PROMPT: Record<VisualStyle, string> = {
  [VisualStyle.MODERN]:      "modern clean design, sleek minimalism, contemporary aesthetics",
  [VisualStyle.LUXURY]:      "luxury premium feel, elegant sophisticated, high-end brand, gold accents",
  [VisualStyle.MINIMALIST]:  "ultra minimalist, negative space, pure simplicity, less is more",
  [VisualStyle.BOLD]:        "bold impactful design, strong contrast, dynamic energy, striking visual",
  [VisualStyle.VINTAGE]:     "vintage retro style, nostalgic feel, warm tones, classic design",
  [VisualStyle.FUTURISTIC]:  "futuristic sci-fi aesthetic, neon glow, digital art, cyberpunk elements",
  [VisualStyle.ORGANIC]:     "natural organic feel, earthy tones, sustainable eco-friendly aesthetic",
  [VisualStyle.EDITORIAL]:   "editorial magazine style, fashion photography, editorial layout",
};

const COMPOSITION_TO_PROMPT: Record<string, string> = {
  center:    "centered composition, subject in the middle, balanced symmetry",
  left:      "left-aligned composition, subject on the left third, right negative space",
  right:     "right-aligned composition, subject on the right third, left negative space",
  dynamic:   "dynamic diagonal composition, rule of thirds, asymmetric balance, visual tension",
  ai_decide: "",
};

const LIGHTING_TO_PROMPT: Record<string, string> = {
  "Cinématique":      "cinematic lighting, dramatic shadows, film-quality illumination",
  "Studio Doux":      "soft studio lighting, diffused light, beauty dish, even illumination",
  "Golden Hour":      "golden hour sunlight, warm orange glow, magic hour photography",
  "Néon / Cyberpunk": "neon lights, cyberpunk glow, colored rim lighting, night scene",
  "Naturel":          "natural daylight, window light, realistic ambient lighting",
  "Dramatique":       "dramatic chiaroscuro lighting, deep shadows, high contrast",
  "Backlit":          "backlit silhouette, rim lighting, halo effect, contre-jour",
};

const ANGLE_TO_PROMPT: Record<string, string> = {
  "Niveau des yeux":        "eye level shot, straight-on perspective",
  "Vue en contre-plongée":  "low angle shot, looking up, powerful perspective",
  "Vue aérienne (Drone)":   "aerial drone shot, bird's eye view, top-down perspective",
  "Macro / Gros plan":      "macro photography, extreme close-up, detailed texture",
  "Plan large":             "wide shot, environmental context, full scene",
  "Dutch angle":            "dutch angle tilt, dynamic tension, angled camera",
};

const COLOR_TONE_TO_PROMPT: Record<ColorTone, string> = {
  light:     "light airy palette, bright whites, pastel tones, clean brightness",
  dark:      "dark moody palette, deep blacks, noir aesthetic, dramatic darkness",
  vibrant:   "vibrant saturated colors, bold hues, rich color palette, eye-catching",
  muted:     "muted desaturated tones, subtle palette, refined color grading",
  ai_decide: "",
};

// ─── Couche LLM ───────────────────────────────────────────────────────────────

interface DeepSeekResponse {
  id: string;
  choices: Array<{ message: { content: string; reasoning_content?: string } }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

async function callDeepSeek(prompt: string, useReasoning = true, maxTokens = 4096): Promise<string> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("VITE_DEEPSEEK_API_KEY manquante");
  const model = useReasoning ? "deepseek-reasoner" : "deepseek-chat";
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model, max_tokens: maxTokens, temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Tu es un expert en marketing publicitaire et en direction artistique. Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data: DeepSeekResponse = await res.json();
  return data.choices[0].message.content;
}

async function callGroq(prompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("VITE_GROQ_API_KEY manquante");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile", max_tokens: maxTokens, temperature: 0.7,
      messages: [
        { role: "system", content: "Tu es un expert en marketing publicitaire. Réponds UNIQUEMENT en JSON valide, sans markdown." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY manquante");
  const wrappedPrompt = "Tu es un expert en marketing publicitaire. Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après le JSON.\n\n" + prompt;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: wrappedPrompt }] }] }) }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function callLLM(prompt: string, options: LLMOptions = {}): Promise<string> {
  const { useReasoning = true, language = "fr", maxTokens = 4096 } = options;
  const langPrefix = language === "ar" ? "باللغة العربية: " : language === "en" ? "In English: " : "";
  const finalPrompt = langPrefix + prompt;
  try {
    return await callDeepSeek(finalPrompt, useReasoning, maxTokens);
  } catch {
    try {
      return await callGroq(finalPrompt, Math.min(maxTokens, 2048));
    } catch {
      return await callGemini(finalPrompt);
    }
  }
}

function parseJSON<T = Record<string, unknown>>(raw: string): T {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  try { return JSON.parse(cleaned) as T; } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as T; } catch {
        return JSON.parse(match[0].replace(/[\x00-\x1F\x7F]/g, " ")) as T;
      }
    }
    throw new Error(`JSON invalide: ${cleaned.slice(0, 200)}`);
  }
}

function resolveElement(mode: ElementMode, userValue: string, aiValue: string | undefined): string | null {
  switch (mode) {
    case "user":     return userValue || null;
    case "ai":       return aiValue || null;
    case "disabled": return null;
  }
}

// ─── Construction prompt image (MODE 2 uniquement) ────────────────────────────

function buildImagePromptSections(
  baseDescription: string,
  customization: CustomizationOptions,
  analysis: Omit<PosterAnalysis, "optimizedPrompt">
): string {
  const parts: string[] = [];

  parts.push(`Professional advertising poster for: ${baseDescription}`);

  if (customization.styleMode === "custom" && customization.selectedStyle && STYLE_TO_PROMPT[customization.selectedStyle]) {
    parts.push(STYLE_TO_PROMPT[customization.selectedStyle]);
  }

  if (customization.colorMode === "custom") {
    if (customization.primaryColors.length > 0) parts.push(`color palette: ${customization.primaryColors.join(", ")}`);
    if (customization.accentColor) parts.push(`accent color: ${customization.accentColor}`);
    if (customization.colorTone !== "ai_decide") parts.push(COLOR_TONE_TO_PROMPT[customization.colorTone]);
  } else if (analysis.suggestedColors?.length) {
    parts.push(`harmonious color palette: ${analysis.suggestedColors.join(", ")}`);
  }

  if (customization.compositionMode !== "ai_decide") {
    const compPrompt = COMPOSITION_TO_PROMPT[customization.compositionMode];
    if (compPrompt) parts.push(compPrompt);
  }

  parts.push(LIGHTING_TO_PROMPT[customization.lighting] || "professional studio lighting");
  parts.push(ANGLE_TO_PROMPT[customization.cameraAngle] || "eye level shot");

  const bg = customization.background;
  if (bg.mode === "transparent") {
    parts.push("pure white background, isolated product, clean studio shot");
  } else if (bg.mode === "solid_color" && bg.color1) {
    parts.push(`solid color background: ${bg.color1}`);
  } else if (bg.mode === "gradient" && bg.color1 && bg.color2) {
    parts.push(`gradient background from ${bg.color1} to ${bg.color2}`);
  } else if (bg.mode === "custom_desc" && bg.customDescription) {
    parts.push(`background: ${bg.customDescription}`);
  }

  // En MODE 2, on génère l'image complète SANS texte (les textes sont ajoutés en post-édition)
  parts.push(NO_TEXT_SUFFIX);
  parts.push(customization.isPro ? PRO_QUALITY_SUFFIX : QUALITY_SUFFIX);

  return parts.filter(Boolean).join(", ");
}

// ─── Génération image ─────────────────────────────────────────────────────────

async function generateWithHuggingFace(prompt: string, format = "1:1", isPro = false): Promise<string> {
  const apiKey = import.meta.env.VITE_HF_API_KEY;
  if (!apiKey) throw new Error("VITE_HF_API_KEY manquante");

  const { width, height } = FORMAT_SIZES[format] ?? FORMAT_SIZES["1:1"];
  const finalWidth  = isPro ? Math.min(width  * 1.5, 1536) : width;
  const finalHeight = isPro ? Math.min(height * 1.5, 1536) : height;

  const models = [
    { id: "black-forest-labs/FLUX.1-schnell", steps: isPro ? 8 : 4, guidance: 0.0 },
    { id: "stabilityai/stable-diffusion-xl-base-1.0", steps: isPro ? 30 : 20, guidance: 7.5 },
  ];

  for (const model of models) {
    try {
      const res = await fetch(`https://router.huggingface.co/hf-inference/models/${model.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "image/png" },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: Math.round(finalWidth), height: Math.round(finalHeight),
            num_inference_steps: model.steps, guidance_scale: model.guidance,
          },
        }),
      });
      if (res.status === 503 || res.status === 429) continue;
      if (!res.ok) continue;
      const blob = await res.blob();
      if (blob.size < 1000) continue;
      return URL.createObjectURL(blob);
    } catch { continue; }
  }
  throw new Error("Tous les modèles ont échoué. Vérifiez votre clé HuggingFace.");
}

// ─── Service principal ────────────────────────────────────────────────────────

export const posterService = {
  /**
   * ══════════════════════════════════════════════════════════════
   * analyzePrompt — Analyse et génération des textes
   *
   * LOGIQUE :
   * - MODE 1 (image fournie) : génère les éléments texte uniquement
   *   L'image sera utilisée telle quelle comme fond en post-édition
   * - MODE 2 (pas d'image)   : génère l'affiche complète
   *
   * LES ÉLÉMENTS (slogan/prix/promo/cta) SONT TOUJOURS TRAITÉS
   * selon leur mode individuel (user/ai/disabled)
   * ══════════════════════════════════════════════════════════════
   */
  async analyzePrompt(
    userInput: string,
    sector: string,
    customization: CustomizationOptions,
    language: "fr" | "en" | "ar" = "fr"
  ): Promise<PosterAnalysis> {
    const hasProductImage = customization.userImages.some(i => i.role === "product");
    const { sloganControl, priceControl, promoControl, ctaControl } = customization;

    const constraints: string[] = [];

    // ── Mode image ──────────────────────────────────────────────────────────
    if (hasProductImage) {
      constraints.push(
        "⚠️ MODE 1 : Image produit fournie par l'utilisateur. " +
        "L'image sera utilisée comme FOND de l'affiche (arrière-plan), SANS modification. " +
        "Génère uniquement les éléments textuels selon les contraintes ci-dessous. " +
        "NE PAS décrire l'image dans le prompt — ce champ sera ignoré pour la génération visuelle."
      );
    } else {
      constraints.push(
        "MODE 2 : Aucune image fournie. " +
        "Génère une affiche complète avec produit, arrière-plan, ambiance visuelle et composition professionnelle. " +
        "L'image ne contiendra PAS de texte (les textes sont ajoutés en post-édition)."
      );
    }

    // ── Slogan ──────────────────────────────────────────────────────────────
    if (sloganControl.mode === "user" && sloganControl.value) {
      constraints.push(`Slogan EXACT imposé (retourner tel quel dans 'slogan'): "${sloganControl.value}"`);
    } else if (sloganControl.mode === "ai") {
      constraints.push("Génère un slogan percutant et mémorable (retourner dans 'slogan')");
    } else {
      constraints.push("Slogan DÉSACTIVÉ — retourner slogan: ''");
    }

    // ── Prix ─────────────────────────────────────────────────────────────────
    if (priceControl.mode === "user" && priceControl.value) {
      constraints.push(`Prix EXACT imposé (retourner tel quel dans 'generatedPrice'): "${priceControl.value}"`);
    } else if (priceControl.mode === "ai") {
      constraints.push("Génère un prix ou fourchette adapté au produit (retourner dans 'generatedPrice')");
    } else {
      constraints.push("Prix DÉSACTIVÉ — retourner generatedPrice: ''");
    }

    // ── Promo ─────────────────────────────────────────────────────────────────
    if (promoControl.mode === "user" && promoControl.value) {
      constraints.push(`Promotion EXACTE imposée (retourner dans 'generatedPromo'): "${promoControl.value}"`);
    } else if (promoControl.mode === "ai") {
      constraints.push("Génère une accroche promotionnelle impactante (retourner dans 'generatedPromo')");
    } else {
      constraints.push("Promotion DÉSACTIVÉE — retourner generatedPromo: ''");
    }

    // ── CTA ───────────────────────────────────────────────────────────────────
    if (ctaControl.mode === "user" && ctaControl.value) {
      constraints.push(`CTA EXACT imposé (retourner dans 'generatedCta'): "${ctaControl.value}"`);
    } else if (ctaControl.mode === "ai") {
      constraints.push("Génère un call-to-action efficace et engageant (retourner dans 'generatedCta')");
    } else {
      constraints.push("CTA DÉSACTIVÉ — retourner generatedCta: ''");
    }

    // ── Texte marketing ───────────────────────────────────────────────────────
    if (customization.customMarketingText) {
      constraints.push(`Texte marketing IMPOSÉ: "${customization.customMarketingText}"`);
    } else {
      constraints.push("Génère un texte marketing court et impactant (2-3 phrases max)");
    }

    // ── Style ─────────────────────────────────────────────────────────────────
    if (customization.styleMode === "custom" && customization.selectedStyle) {
      constraints.push(`Style visuel imposé: ${customization.selectedStyle}`);
    } else {
      constraints.push("Choisis automatiquement le style le plus adapté (luxe → élégant, tech → clean, fun → coloré)");
    }

    // ── Couleurs ──────────────────────────────────────────────────────────────
    if (customization.colorMode === "custom" && customization.primaryColors.length > 0) {
      constraints.push(`Palette couleurs imposée: ${customization.primaryColors.join(", ")}`);
    } else {
      constraints.push("Suggère une palette de 3-4 couleurs harmonieuses (format hex)");
    }

    const llmPrompt = `Analyse cette demande de poster publicitaire :
Description: "${userInput}"
Secteur: ${sector}
Langue cible: ${language === "ar" ? "Arabe" : language === "en" ? "Anglais" : "Français"}
Image produit fournie: ${hasProductImage ? "OUI — utilisée comme fond, générer textes uniquement" : "NON — génération complète"}

CONTRAINTES STRICTES:
${constraints.map((c, i) => `${i + 1}. ${c}`).join("\n")}

RÈGLES ABSOLUES:
- Respecter STRICTEMENT le mode de chaque élément
- Si DÉSACTIVÉ → retourner chaîne vide
- Si USER → retourner la valeur exacte sans modification
- Si IA → générer un contenu adapté et professionnel
- Ne jamais ajouter de contenu non demandé

Réponds UNIQUEMENT en JSON valide:
{
  "optimizedPrompt": "description artistique détaillée EN ANGLAIS pour un modèle de diffusion, produit mis en valeur, composition professionnelle, NO TEXT in image",
  "slogan": "slogan dans la langue cible (vide si DÉSACTIVÉ)",
  "marketingCopy": "texte publicitaire 2-3 phrases",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedColors": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "generatedPrice": "prix ou vide si désactivé",
  "generatedPromo": "promo ou vide si désactivée",
  "generatedCta": "CTA ou vide si désactivé",
  "aestheticRationale": "explication courte des choix"
}`;

    const raw = await callLLM(llmPrompt, { useReasoning: true, language, maxTokens: 4096 });
    const parsed = parseJSON<PosterAnalysis>(raw);

    const resolvedSlogan = resolveElement(sloganControl.mode, sloganControl.value, parsed.slogan) ?? "";

    return {
      optimizedPrompt:    parsed.optimizedPrompt || `advertising poster, ${sector}, professional photography, no text`,
      slogan:             resolvedSlogan,
      marketingCopy:      customization.customMarketingText || parsed.marketingCopy || "",
      hashtags:           Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 8) : [],
      suggestedColors:    parsed.suggestedColors,
      aestheticRationale: parsed.aestheticRationale,
      generatedPrice:     resolveElement(priceControl.mode, priceControl.value, parsed.generatedPrice) ?? undefined,
      generatedPromo:     resolveElement(promoControl.mode, promoControl.value, parsed.generatedPromo) ?? undefined,
      generatedCta:       resolveElement(ctaControl.mode, ctaControl.value, parsed.generatedCta) ?? undefined,
    };
  },

  /**
   * ══════════════════════════════════════════════════════════════
   * generatePosterImage
   *
   * MODE 1 (image fournie) :
   *   → Retourne l'image uploadée TELLE QUELLE comme fond
   *   → Les textes seront superposés EN POST-ÉDITION
   *
   * MODE 2 (pas d'image) :
   *   → Génère via HuggingFace SANS texte dans l'image
   *   → Les textes seront ajoutés EN POST-ÉDITION
   * ══════════════════════════════════════════════════════════════
   */
  async generatePosterImage(
    baseDescription: string,
    analysis: PosterAnalysis,
    customization: CustomizationOptions,
    format = "1:1"
  ): Promise<string> {
    const productImage = customization.userImages.find(i => i.role === "product");

    // MODE 1 : Image fournie → fond direct, sans modification
    if (productImage) {
      console.log("🖼️ MODE 1 : Image produit → utilisée comme fond sans modification");
      return productImage.previewUrl;
    }

    // MODE 2 : Génération complète, sans texte (texte ajouté en post-édition)
    console.log("🎨 MODE 2 : Génération complète de l'affiche (sans texte)");
    const fullPrompt = buildImagePromptSections(analysis.optimizedPrompt, customization, analysis);
    console.log("📝 Prompt final:", fullPrompt.slice(0, 200) + "...");
    return generateWithHuggingFace(fullPrompt, format, customization.isPro);
  },

  async marketingAnalysis(productDescription: string, language: "fr" | "en" | "ar" = "fr"): Promise<string> {
    const prompt = `Analyse en profondeur ce produit/service pour une campagne publicitaire:
"${productDescription}"
Fournis en JSON:
{
  "targetAudience": "description du public cible",
  "uniqueValueProposition": "proposition de valeur unique",
  "messagingStrategy": "stratégie de message clé",
  "channelRecommendations": ["canal1", "canal2"],
  "competitiveAdvantages": ["avantage1", "avantage2"],
  "emotionalTriggers": ["trigger1", "trigger2"]
}`;
    return callLLM(prompt, { useReasoning: true, language });
  },
};
