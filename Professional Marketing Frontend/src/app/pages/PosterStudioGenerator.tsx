import React, { useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Check, ChevronRight, Image as ImageIcon, Palette, PenLine, Sparkles,
  TriangleAlert, X, Zap, Tag, Percent, MousePointerClick, Type,
  Bot, User, Ban,
} from "lucide-react";
import { posterService } from "../lib/posterStudioService";
import {
  BusinessSector, VisualStyle, PosterData, CustomizationOptions,
  DEFAULT_CUSTOMIZATION, UserImage, ImageRole, ImagePosition, ImageStrength,
  TextDisplayMode, ColorTone, LightingOption, AngleOption,
  BackgroundMode, BackgroundOptions, ElementMode, ElementControl,
} from "../lib/posterStudioTypes";
import { SECTORS, FORMATS } from "../lib/posterStudioConstants";

// ─── Types locaux ─────────────────────────────────────────────────────────────

type InputMode = "free" | "guided";
type UITab     = "brief" | "image" | "elements" | "background" | "style" | "pro";

interface GuidedInputs { product: string; target: string; vibe: string; }

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror   = () => reject(new Error("Lecture échouée"));
    reader.readAsDataURL(file);
  });
}

function generateId() { return Math.random().toString(36).substr(2, 9); }

// ─── Constantes UI ────────────────────────────────────────────────────────────

const BG_MODES: { value: BackgroundMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "ai_generate",  label: "IA génère",    icon: <Sparkles className="w-5 h-5" />, desc: "Background optimal selon le produit" },
  { value: "transparent",  label: "Sans fond",    icon: <ImageIcon className="w-5 h-5" />, desc: "Fond blanc/transparent" },
  { value: "solid_color",  label: "Couleur unie", icon: <Palette className="w-5 h-5" />, desc: "Choisissez une couleur de fond" },
  { value: "gradient",     label: "Dégradé",      icon: <Palette className="w-5 h-5" />, desc: "Deux couleurs en dégradé" },
  { value: "user_image",   label: "Votre image",  icon: <ImageIcon className="w-5 h-5" />, desc: "Votre photo comme fond" },
  { value: "custom_desc",  label: "Description",  icon: <PenLine className="w-5 h-5" />, desc: "Décrivez le fond en texte" },
];

const LOADING_STEPS = {
  standard: [
    "Analyse du brief...",
    "Direction artistique en cours...",
    "Construction du prompt...",
    "Génération et rendu final...",
  ],
  pro: [
    "Analyse stratégique approfondie (DeepSeek Reasoner)...",
    "Direction artistique premium...",
    "Prompt Ultra HD + setup éclairage studio...",
    "FLUX Kontext Max · Rendu 2K Pro...",
  ],
};

// ─── ElementControlRow ────────────────────────────────────────────────────────

const ElementControlRow: React.FC<{
  icon: React.ReactNode; label: string; placeholder: string;
  control: ElementControl; onChange: (c: ElementControl) => void; aiHint?: string;
}> = ({ icon, label, placeholder, control, onChange, aiHint }) => {
  const modes: { value: ElementMode; icon: React.ReactNode; label: string; color: string }[] = [
    { value: "user",     icon: <User className="w-3 h-3" />,  label: "Manuel",    color: "blue" },
    { value: "ai",       icon: <Bot className="w-3 h-3" />,   label: "IA décide", color: "violet" },
    { value: "disabled", icon: <Ban className="w-3 h-3" />,   label: "Désactivé", color: "slate" },
  ];
  return (
    <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{icon}</span>
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5">
          {modes.map(m => (
            <button key={m.value} onClick={() => onChange({ ...control, mode: m.value })} title={m.label}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                control.mode === m.value
                  ? m.value === "user" ? "bg-blue-600 text-white shadow-sm"
                  : m.value === "ai" ? "bg-violet-600 text-white shadow-sm"
                  : "bg-slate-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}>
              {m.icon}
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
      {control.mode === "user" && (
        <input className="w-full px-3 py-2.5 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none text-sm font-medium bg-blue-50/30"
          placeholder={placeholder} value={control.value} onChange={e => onChange({ ...control, value: e.target.value })} />
      )}
      {control.mode === "ai" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-100 rounded-xl">
          <Bot className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
          <p className="text-[10px] text-violet-600 font-medium">{aiHint || "L'IA génère automatiquement un contenu adapté"}</p>
        </div>
      )}
      {control.mode === "disabled" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <Ban className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <p className="text-[10px] text-slate-400 font-medium">Cet élément n'apparaîtra pas dans l'affiche</p>
        </div>
      )}
    </div>
  );
};

// ─── Tab button ───────────────────────────────────────────────────────────────

const TabBtn: React.FC<{
  label: string; icon: React.ReactNode; active: boolean; badge?: number | string; onClick: () => void; disabled?: boolean;
}> = ({ label, icon, active, badge, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
      disabled ? "opacity-40 cursor-not-allowed text-slate-400"
      : active ? "bg-white shadow text-slate-900"
      : "text-slate-500 hover:text-slate-700"
    }`}>
    <span>{icon}</span>
    <span className="hidden sm:inline">{label}</span>
    {badge !== undefined && (
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{badge}</span>
    )}
  </button>
);

// ─── BackgroundPanel ──────────────────────────────────────────────────────────

const BackgroundPanel: React.FC<{
  background: BackgroundOptions; userImages: UserImage[]; onUpdate: (bg: BackgroundOptions) => void;
}> = ({ background, userImages, onUpdate }) => {
  const bgImages = userImages.filter(img => img.role === "background");
  const set = (updates: Partial<BackgroundOptions>) => onUpdate({ ...background, ...updates });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {BG_MODES.map(mode => (
          <button key={mode.value} onClick={() => set({ mode: mode.value })}
            className={`p-3 rounded-2xl border text-left transition-all ${
              background.mode === mode.value ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
            }`}>
            <div className="text-xl mb-1">{mode.icon}</div>
            <div className="text-xs font-bold">{mode.label}</div>
            <div className={`text-[10px] mt-0.5 leading-snug ${background.mode === mode.value ? "text-white/60" : "text-slate-400"}`}>{mode.desc}</div>
          </button>
        ))}
      </div>

      {background.mode === "solid_color" && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
          <p className="text-xs font-bold text-slate-700">Couleur de fond</p>
          <div className="flex items-center gap-3">
            <input type="color" value={background.color1 || "#f8f8f8"} onChange={e => set({ color1: e.target.value })}
              className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer" />
            <span className="text-sm font-mono font-bold text-slate-700">{background.color1 || "#f8f8f8"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {["#FFFFFF","#F5F5F5","#1A1A1A","#0F172A","#EFF6FF","#FDF2F8","#F0FDF4","#FFFBEB"].map(c => (
              <button key={c} onClick={() => set({ color1: c })}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${background.color1 === c ? "border-blue-500 scale-110 shadow" : "border-slate-200 hover:border-slate-400"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      )}

      {background.mode === "gradient" && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4">
          <p className="text-xs font-bold text-slate-700">Dégradé de fond</p>
          <div className="w-full h-16 rounded-xl border border-slate-100"
            style={{ background: `linear-gradient(${background.gradientAngle ?? 135}deg, ${background.color1 || "#667eea"}, ${background.color2 || "#764ba2"})` }} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 mb-2">Couleur 1</p>
              <div className="flex items-center gap-2">
                <input type="color" value={background.color1 || "#667eea"} onChange={e => set({ color1: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                <span className="text-xs font-mono text-slate-600">{background.color1 || "#667eea"}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 mb-2">Couleur 2</p>
              <div className="flex items-center gap-2">
                <input type="color" value={background.color2 || "#764ba2"} onChange={e => set({ color2: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                <span className="text-xs font-mono text-slate-600">{background.color2 || "#764ba2"}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-500">Direction</p>
              <span className="text-[10px] font-mono text-slate-500">{background.gradientAngle ?? 135}°</span>
            </div>
            <input type="range" min={0} max={360} value={background.gradientAngle ?? 135}
              onChange={e => set({ gradientAngle: parseInt(e.target.value) })} className="w-full accent-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 mb-2">Présets</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { c1: "#667eea", c2: "#764ba2", a: 135 },{ c1: "#f093fb", c2: "#f5576c", a: 135 },
                { c1: "#4facfe", c2: "#00f2fe", a: 135 },{ c1: "#43e97b", c2: "#38f9d7", a: 135 },
                { c1: "#fa709a", c2: "#fee140", a: 135 },{ c1: "#a18cd1", c2: "#fbc2eb", a: 135 },
                { c1: "#ffecd2", c2: "#fcb69f", a: 135 },{ c1: "#2d3436", c2: "#636e72", a: 135 },
              ].map((g, i) => (
                <button key={i} onClick={() => set({ color1: g.c1, color2: g.c2, gradientAngle: g.a })}
                  className="h-8 rounded-lg border border-slate-100 hover:scale-105 transition-transform"
                  style={{ background: `linear-gradient(${g.a}deg, ${g.c1}, ${g.c2})` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {background.mode === "custom_desc" && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
          <p className="text-xs font-bold text-slate-700">Description du fond</p>
          <textarea className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none resize-none text-sm font-medium"
            placeholder="Ex: Plage tropicale au coucher du soleil..."
            value={background.customDescription || ""} onChange={e => set({ customDescription: e.target.value })} />
          <div className="flex flex-wrap gap-1.5">
            {["Studio neutre gris","Mur de béton industriel","Nature forêt verdoyante","Coucher de soleil doré",
              "Fond abstrait géométrique","Marbre blanc luxueux","Nuit étoilée galaxie","Plage tropicale"].map(ex => (
              <button key={ex} onClick={() => set({ customDescription: ex })}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-medium transition-colors">{ex}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────

const GeneratorPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading]         = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [loadingIdx, setLoadingIdx]   = useState(0);
  const [inputMode, setInputMode]     = useState<InputMode>("free");
  const [activeTab, setActiveTab]     = useState<UITab>("brief");

  const [prompt, setPrompt]           = useState("");
  const [sector, setSector]           = useState<BusinessSector>(BusinessSector.TECH);
  const [format, setFormat]           = useState("1:1");
  const [guidedInputs, setGuidedInputs] = useState<GuidedInputs>({ product: "", target: "", vibe: "" });
  const [customization, setCustomization] = useState<CustomizationOptions>(DEFAULT_CUSTOMIZATION);

  React.useEffect(() => {
    const seed = location.state as { prompt?: string; sector?: BusinessSector; format?: string; customization?: Partial<CustomizationOptions> } | null;
    if (!seed) return;
    if (seed.prompt) setPrompt(seed.prompt);
    if (seed.sector) setSector(seed.sector);
    if (seed.format) setFormat(seed.format);
    if (seed.customization) {
      setCustomization((prev) => ({ ...prev, ...seed.customization }));
    }
  }, [location.state]);

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const hasBrief = inputMode === "free" ? prompt.trim() !== "" : guidedInputs.product.trim() !== "";
  const productImage = customization.userImages.find(i => i.role === "product");
  const hasProductImage = !!productImage;
  const activeElements = [
    customization.sloganControl, customization.priceControl,
    customization.promoControl,  customization.ctaControl,
  ].filter(e => e.mode !== "disabled").length;

  // ─── Upload ───────────────────────────────────────────────────────────────

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      const newImage: UserImage = {
        id: generateId(), base64, previewUrl: base64, fileName: file.name,
        role: "product" as ImageRole, position: "ai_decide" as ImagePosition,
        forceIntegration: true, strength: 0.5 as ImageStrength,
      };
      setCustomization(prev => ({
        ...prev,
        userImages: [...prev.userImages.filter(i => i.role !== "product"), newImage],
        useUserImages: true,
      }));
    } catch { alert("Erreur lors du chargement de l'image."); }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleBgImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      const bgImg: UserImage = {
        id: generateId(), base64, previewUrl: base64, fileName: file.name,
        role: "background", position: "center",
        forceIntegration: true, strength: 0.5 as ImageStrength,
      };
      setCustomization(prev => ({
        ...prev,
        userImages: [...prev.userImages.filter(i => i.role !== "background"), bgImg],
        useUserImages: true,
        background: { ...prev.background, mode: "user_image" },
      }));
    } catch { alert("Erreur lors du chargement."); }
    if (bgFileInputRef.current) bgFileInputRef.current.value = "";
  }, []);

  const removeProductImage = useCallback(() => {
    setCustomization(prev => {
      const filtered = prev.userImages.filter(i => i.role !== "product");
      return { ...prev, userImages: filtered, useUserImages: filtered.length > 0 };
    });
  }, []);

  const updateCustomization = useCallback(
    <K extends keyof CustomizationOptions>(key: K, value: CustomizationOptions[K]) =>
      setCustomization(prev => ({ ...prev, [key]: value })), []
  );

  const updateBackground = useCallback((bg: BackgroundOptions) =>
    setCustomization(prev => ({ ...prev, background: bg })), []);

  const updateElement = useCallback(
    (key: "sloganControl" | "priceControl" | "promoControl" | "ctaControl", value: ElementControl) =>
      setCustomization(prev => ({ ...prev, [key]: value })), []
  );

  // ─── Progress ─────────────────────────────────────────────────────────────

  const startProgress = useCallback((isPro: boolean) => {
    const steps = LOADING_STEPS[isPro ? "pro" : "standard"];
    setLoadingIdx(0);
    setLoadingStep(steps[0]);
    let idx = 0;
    const iv = setInterval(() => {
      idx = Math.min(idx + 1, steps.length - 1);
      setLoadingIdx(idx);
      setLoadingStep(steps[idx]);
      if (idx >= steps.length - 1) clearInterval(iv);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  // ─── Génération ───────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!hasBrief) { alert("Veuillez remplir le brief."); return; }
    setLoading(true);
    const stopProgress = startProgress(customization.isPro);
    try {
      let finalInput = inputMode === "guided"
        ? `Poster publicitaire pour ${guidedInputs.product}. Public cible: ${guidedInputs.target || "grand public"}. Ambiance: ${guidedInputs.vibe || "moderne et professionnel"}.`
        : prompt;
      if (customization.isPro) finalInput += ` Éclairage: ${customization.lighting}. Angle: ${customization.cameraAngle}.`;

      // ════════════════════════════════════════════════════════════════
      // RÈGLE CRITIQUE :
      // Si image produit fournie → MODE 1
      //   - L'analyse LLM génère les textes (slogan/prix/promo/cta)
      //   - generatePosterImage retourne l'image telle quelle comme fond
      //   - Les textes sont superposés en post-édition (ResultsPage)
      //
      // Si pas d'image → MODE 2
      //   - Génération complète de l'affiche (sans texte dans l'image)
      //   - Les textes sont superposés en post-édition (ResultsPage)
      //
      // Dans LES DEUX CAS : les éléments (slogan/prix/promo/cta)
      // sont TOUJOURS traités selon leur mode (user/ai/disabled)
      // ════════════════════════════════════════════════════════════════

      const analysis = await posterService.analyzePrompt(finalInput, sector, customization, "fr");
      const imageUrl = await posterService.generatePosterImage(finalInput, analysis, customization, format);

      const newPoster: PosterData = {
        id: generateId(), originalPrompt: finalInput,
        optimizedPrompt: analysis.optimizedPrompt, sector,
        style: customization.selectedStyle, format, imageUrl,
        slogan: analysis.slogan, marketingCopy: analysis.marketingCopy,
        hashtags: analysis.hashtags,
        customization: { ...customization, userImages: [] },
        createdAt: Date.now(),
        analysis,
      };

      const history: PosterData[] = JSON.parse(localStorage.getItem("poster_history") || "[]");
      localStorage.setItem("poster_history", JSON.stringify([{ ...newPoster, imageUrl: "" }, ...history].slice(0, 50)));

      // Naviguer vers la page résultats en passant le poster ET l'analysis
      navigate(`/poster/studio/results/${newPoster.id}`, {
        state: { poster: newPoster, analysis },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Une erreur est survenue.";
      alert(`Erreur : ${msg}`);
    } finally {
      stopProgress();
      setLoading(false);
    }
  };

  // ─── Loading screen ────────────────────────────────────────────────────────

  if (loading) {
    const steps = LOADING_STEPS[customization.isPro ? "pro" : "standard"];
    const pct = Math.round(((loadingIdx + 1) / steps.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="relative mb-10">
          <div className={`w-28 h-28 border-4 border-t-transparent rounded-full animate-spin ${customization.isPro ? "border-purple-500" : "border-blue-500"}`} />
          <div className={`absolute inset-0 flex items-center justify-center text-2xl font-black ${customization.isPro ? "text-purple-600" : "text-blue-600"}`}>AI</div>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3">
          {hasProductImage ? "Analyse de votre image + génération des textes" : customization.isPro ? "Création Ultra HD Pro" : "Création en cours"}
        </h2>
        <p className="text-slate-500 animate-pulse mb-8 text-center max-w-sm">{loadingStep}</p>
        <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${customization.isPro ? "bg-gradient-to-r from-indigo-500 to-purple-600" : "bg-blue-500"}`}
            style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-2">{pct}%</p>
        {hasProductImage && productImage && (
          <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4">
            <img src={productImage.previewUrl} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow" />
            <div>
              <p className="text-xs font-black text-emerald-800">MODE 1 · Image fournie comme fond</p>
              <p className="text-[10px] text-emerald-600">Image utilisée telle quelle · Génération des textes en cours</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Tabs config ──────────────────────────────────────────────────────────

  const tabs: { id: UITab; label: string; icon: React.ReactNode; badge?: number | string; disabled?: boolean }[] = [
    { id: "brief",      label: "Brief",     icon: <PenLine className="w-4 h-4" /> },
    { id: "image",      label: "Image",     icon: <ImageIcon className="w-4 h-4" />, badge: hasProductImage ? "✓" : undefined },
    { id: "elements",   label: "Éléments",  icon: <Type className="w-4 h-4" />, badge: activeElements || undefined },
    { id: "background", label: "Fond",      icon: <Palette className="w-4 h-4" /> },
    { id: "style",      label: "Style",     icon: <Sparkles className="w-4 h-4" /> },
    { id: "pro",        label: "Pro",       icon: <Zap className="w-4 h-4" />, disabled: !customization.isPro },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Studio de Création</h1>
          <p className="text-slate-500 mt-1 text-sm">Visuels publicitaires professionnels · slogan · prix · promo · CTA</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button onClick={() => updateCustomization("isPro", false)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!customization.isPro ? "bg-white shadow text-blue-600" : "text-slate-400"}`}>
            Standard
          </button>
          <button onClick={() => updateCustomization("isPro", true)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${customization.isPro ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow text-white" : "text-slate-400"}`}>
            {customization.isPro && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
            Ultra HD Pro
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ════ TABS ════ */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
            {tabs.map(tab => (
              <TabBtn key={tab.id} label={tab.label} icon={tab.icon} active={activeTab === tab.id}
                badge={tab.badge} disabled={tab.disabled} onClick={() => setActiveTab(tab.id)} />
            ))}
          </div>

          {/* ── BRIEF ── */}
          {activeTab === "brief" && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex gap-3">
                {(["free", "guided"] as InputMode[]).map(mode => (
                  <button key={mode} onClick={() => setInputMode(mode)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${inputMode === mode ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                    <span className="inline-flex items-center gap-1.5">
                      {mode === "free" ? <PenLine className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      {mode === "free" ? "Libre" : "Guidé"}
                    </span>
                  </button>
                ))}
              </div>
              {inputMode === "guided" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Produit / Service *</label>
                      <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none font-medium text-sm"
                        placeholder="Ex: Parfum de luxe Oud" value={guidedInputs.product}
                        onChange={e => setGuidedInputs(p => ({ ...p, product: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Audience Cible</label>
                      <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none font-medium text-sm"
                        placeholder="Ex: Femmes 25-40 ans" value={guidedInputs.target}
                        onChange={e => setGuidedInputs(p => ({ ...p, target: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ambiance</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none font-medium text-sm"
                      placeholder="Ex: Sombre, élégant, mystérieux" value={guidedInputs.vibe}
                      onChange={e => setGuidedInputs(p => ({ ...p, vibe: e.target.value }))} />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description Créative *</label>
                  <textarea className="w-full h-40 px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none resize-none text-base font-medium"
                    placeholder="Décrivez votre produit, l'ambiance souhaitée, votre marque..." value={prompt}
                    onChange={e => setPrompt(e.target.value)} />
                  <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-mono">{prompt.length} car.</div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Secteur</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm text-slate-700 outline-none"
                    value={sector} onChange={e => setSector(e.target.value as BusinessSector)}>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Format</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FORMATS.slice(0, 6).map(f => (
                      <button key={f.value} onClick={() => setFormat(f.value)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${format === f.value ? "bg-blue-600 text-white border-transparent" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                        {f.value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── IMAGE PRODUIT ── */}
          {activeTab === "image" && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-black text-slate-900 inline-flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" /> Image Produit
                </h3>
                <p className="text-xs text-slate-400 mt-1">1 seule image autorisée · Utilisée comme fond de l'affiche · Les textes sont superposés en post-édition.</p>
              </div>

              {/* ══ MODE BADGE — CLARIFICATION IMPORTANTE ══ */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${hasProductImage ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-100"}`}>
                {hasProductImage ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-emerald-800">MODE 1 ACTIF — Image comme fond</p>
                      <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">
                        Votre image sera utilisée <strong>telle quelle comme fond de l'affiche</strong>, sans aucune modification.
                        L'IA génère les textes (slogan, prix, promo, CTA) qui seront superposés en post-édition.
                        La description du brief est ignorée pour la génération visuelle.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-blue-800">MODE 2 ACTIF — Génération complète</p>
                      <p className="text-[10px] text-blue-700 mt-0.5 leading-relaxed">
                        L'IA génère l'affiche complète selon votre brief. Les textes seront superposés en post-édition.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {productImage ? (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                      <img src={productImage.previewUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800 truncate">{productImage.fileName}</p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> Fond de l'affiche · sans modification
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Les textes seront ajoutés par dessus en post-édition.</p>
                    </div>
                    <button onClick={removeProductImage}
                      className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center transition-colors flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full py-10 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl transition-all flex flex-col items-center gap-3 group">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <ImageIcon className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-600 group-hover:text-blue-600">Ajouter votre image produit</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP · 1 image maximum</p>
                    <p className="text-[10px] text-blue-500 font-bold mt-1">Sera utilisée comme fond · sans modification · textes superposés</p>
                  </div>
                </button>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <TriangleAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  <strong>Règle :</strong> Si une image est fournie, la description du brief est ignorée pour la partie visuelle.
                  Seuls les éléments texte (slogan, prix, promo, CTA) de l'onglet <strong>Éléments</strong> sont générés.
                </p>
              </div>
            </div>
          )}

          {/* ── ÉLÉMENTS ── */}
          {activeTab === "elements" && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-black text-slate-900 inline-flex items-center gap-2">
                  <Type className="w-5 h-5" /> Éléments de l'affiche
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ces éléments sont gérés <strong>dans les deux modes</strong> (image fournie ou générée).
                  Ils sont superposés sur l'image en post-édition.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700">
                  <User className="w-3 h-3" /> Manuel = valeur exacte
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-700">
                  <Bot className="w-3 h-3" /> IA = génération automatique
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <Ban className="w-3 h-3" /> Désactivé = pas dans l'affiche
                </div>
              </div>

              <ElementControlRow icon={<Type className="w-4 h-4" />} label="Slogan / Accroche"
                placeholder="Ex: La liberté à portée de main" control={customization.sloganControl}
                onChange={v => updateElement("sloganControl", v)}
                aiHint="L'IA génère un slogan percutant adapté au produit et au secteur" />
              <ElementControlRow icon={<Tag className="w-4 h-4" />} label="Prix"
                placeholder="Ex: 29,99 € · À partir de 99 €" control={customization.priceControl}
                onChange={v => updateElement("priceControl", v)}
                aiHint="L'IA suggère un prix cohérent avec le produit et le secteur" />
              <ElementControlRow icon={<Percent className="w-4 h-4" />} label="Promotion / Offre"
                placeholder="Ex: -50% · Offre limitée · 2 achetés = 1 offert" control={customization.promoControl}
                onChange={v => updateElement("promoControl", v)}
                aiHint="L'IA génère une accroche promotionnelle impactante" />
              <ElementControlRow icon={<MousePointerClick className="w-4 h-4" />} label="Call-to-Action (CTA)"
                placeholder="Ex: Commander maintenant · Découvrir" control={customization.ctaControl}
                onChange={v => updateElement("ctaControl", v)}
                aiHint="L'IA génère un CTA engageant et adapté à l'objectif marketing" />

              {/* Résumé */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Résumé actif</p>
                <div className="space-y-1">
                  {[
                    { key: "sloganControl", label: "Slogan",  icon: <Type className="w-3 h-3" /> },
                    { key: "priceControl",  label: "Prix",    icon: <Tag className="w-3 h-3" /> },
                    { key: "promoControl",  label: "Promo",   icon: <Percent className="w-3 h-3" /> },
                    { key: "ctaControl",    label: "CTA",     icon: <MousePointerClick className="w-3 h-3" /> },
                  ].map(({ key, label, icon }) => {
                    const ctrl = customization[key as keyof CustomizationOptions] as ElementControl;
                    return (
                      <div key={key} className="flex items-center justify-between py-1">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1.5">{icon} {label}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          ctrl.mode === "user" ? "bg-blue-100 text-blue-700"
                          : ctrl.mode === "ai" ? "bg-violet-100 text-violet-700"
                          : "bg-slate-100 text-slate-400"
                        }`}>
                          {ctrl.mode === "user" ? (ctrl.value || "Manuel (vide)") : ctrl.mode === "ai" ? "IA génère" : "Désactivé"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── BACKGROUND ── */}
          {activeTab === "background" && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
              <div className="mb-5">
                <h3 className="text-lg font-black text-slate-900 inline-flex items-center gap-2">
                  <Palette className="w-5 h-5" /> Background de l'affiche
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {hasProductImage
                    ? "Vous avez fourni une image produit (MODE 1) — le fond de l'onglet 'Image' est prioritaire."
                    : "Choisissez le fond de l'affiche générée (MODE 2)."}
                </p>
              </div>
              {hasProductImage && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                  <TriangleAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700">
                    En MODE 1, l'image produit est utilisée comme fond. Ces réglages sont ignorés.
                  </p>
                </div>
              )}
              <BackgroundPanel background={customization.background} userImages={customization.userImages} onUpdate={updateBackground} />
              {customization.background.mode === "user_image" && !customization.userImages.find(i => i.role === "background") && (
                <button onClick={() => bgFileInputRef.current?.click()}
                  className="mt-4 w-full py-6 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-2xl transition-all flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8 text-slate-500" />
                  <span className="text-sm font-bold text-slate-600">Uploader une image de fond</span>
                </button>
              )}
            </div>
          )}

          {/* ── STYLE ── */}
          {activeTab === "style" && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 inline-flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Style & Couleurs
                </h3>
                <p className="text-xs text-slate-400 mt-1">Direction artistique.</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Style Visuel</label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
                    {(["ai_decide", "custom"] as const).map(m => (
                      <button key={m} onClick={() => updateCustomization("styleMode", m)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${customization.styleMode === m ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}>
                        {m === "ai_decide" ? "IA" : "Manuel"}
                      </button>
                    ))}
                  </div>
                </div>
                {customization.styleMode === "custom" ? (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(VisualStyle).map(style => (
                      <button key={style} onClick={() => updateCustomization("selectedStyle", style)}
                        className={`py-3 px-4 rounded-xl text-xs font-bold border text-left transition-all ${customization.selectedStyle === style ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                        {style}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                    <p className="text-sm text-blue-700 font-medium inline-flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Style adapté automatiquement
                    </p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Palette de Couleurs</label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
                    {(["ai_decide", "custom"] as const).map(m => (
                      <button key={m} onClick={() => updateCustomization("colorMode", m)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${customization.colorMode === m ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}>
                        {m === "ai_decide" ? "IA" : "Manuel"}
                      </button>
                    ))}
                  </div>
                </div>
                {customization.colorMode === "custom" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                      {([
                        { value: "light" as ColorTone, label: "Clair",   cls: "bg-slate-50 text-slate-700 border-slate-200" },
                        { value: "dark"  as ColorTone, label: "Sombre",  cls: "bg-slate-900 text-white border-slate-700" },
                        { value: "vibrant" as ColorTone, label: "Vibrant", cls: "bg-gradient-to-r from-pink-500 to-blue-500 text-white border-transparent" },
                        { value: "muted" as ColorTone, label: "Doux",    cls: "bg-slate-400 text-white border-transparent" },
                      ]).map(opt => (
                        <button key={opt.value} onClick={() => updateCustomization("colorTone", opt.value)}
                          className={`py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${opt.cls} ${customization.colorTone === opt.value ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map(idx => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                          <input type="color" value={customization.primaryColors[idx] || "#3b82f6"}
                            onChange={e => { const c = [...customization.primaryColors]; c[idx] = e.target.value; updateCustomization("primaryColors", c.filter(Boolean)); }}
                            className="w-8 h-8 rounded-lg cursor-pointer border-0" />
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold">Coul. {idx + 1}</p>
                            <p className="text-[10px] font-mono text-slate-600">{customization.primaryColors[idx] || "—"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                    <p className="text-sm text-blue-700 font-medium inline-flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Palette optimale sélectionnée par l'IA
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PRO ── */}
          {activeTab === "pro" && customization.isPro && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2rem] border border-purple-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Configuration Pro</h3>
                  <p className="text-xs text-slate-500">Options exclusives Ultra HD</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Éclairage</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-purple-100 bg-white font-bold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-purple-400"
                    value={customization.lighting} onChange={e => updateCustomization("lighting", e.target.value as LightingOption)}>
                    {(["Cinématique","Studio Doux","Golden Hour","Néon / Cyberpunk","Naturel","Dramatique","Backlit"] as LightingOption[]).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Angle de Vue</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-purple-100 bg-white font-bold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-purple-400"
                    value={customization.cameraAngle} onChange={e => updateCustomization("cameraAngle", e.target.value as AngleOption)}>
                    {(["Niveau des yeux","Vue en contre-plongée","Vue aérienne (Drone)","Macro / Gros plan","Plan large","Dutch angle"] as AngleOption[]).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {["FLUX SCHNELL","HAUTE RÉSOLUTION","OMBRES RÉALISTES","2K RESOLUTION","DEEP REASONING","SANS FILIGRANE"].map(l => (
                  <span key={l} className="px-3 py-1.5 bg-white border border-purple-100 rounded-lg text-[10px] font-bold text-purple-700 flex items-center gap-1">
                    <Check className="w-3 h-3" />{l}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ════ RÉSUMÉ + BOUTON ════ */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-5 shadow-sm space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Résumé</p>

            <div className={`p-3 rounded-xl border ${hasProductImage ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-100"}`}>
              <div className="flex items-center gap-2">
                {hasProductImage ? <Check className="w-4 h-4 text-emerald-500" /> : <Sparkles className="w-4 h-4 text-blue-500" />}
                <p className={`text-[10px] font-black ${hasProductImage ? "text-emerald-800" : "text-blue-800"}`}>
                  {hasProductImage ? "MODE 1 · Image comme fond" : "MODE 2 · Génération IA"}
                </p>
              </div>
              {hasProductImage && productImage && (
                <div className="flex items-center gap-2 mt-2">
                  <img src={productImage.previewUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-emerald-200" />
                  <p className="text-[10px] text-emerald-700 font-medium truncate">{productImage.fileName}</p>
                </div>
              )}
            </div>

            {activeElements > 0 && (
              <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl">
                <p className="text-[10px] font-black text-violet-700 mb-1.5">
                  {activeElements} élément{activeElements > 1 ? "s" : ""} actif{activeElements > 1 ? "s" : ""}
                </p>
                <p className="text-[9px] text-violet-600">Superposés sur l'image en post-édition</p>
              </div>
            )}

            <div className="space-y-2">
              {[
                { label: "Format", value: format },
                { label: "Style",  value: customization.styleMode === "ai_decide" ? "IA auto" : customization.selectedStyle ?? "—" },
                { label: "Couleurs", value: customization.colorMode === "ai_decide" ? "IA choisit" : `${customization.primaryColors.length} couleur(s)` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400">{label}</span>
                  <span className={`text-xs font-medium ${String(value).startsWith("IA") ? "text-blue-500 font-black" : "text-slate-700"}`}>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading || !hasBrief}
            className={`w-full py-5 rounded-[1.5rem] text-base font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
              customization.isPro
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-purple-200 hover:scale-[1.01]"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.01]"
            }`}>
            {customization.isPro ? (
              <><span className="w-2 h-2 bg-white rounded-full animate-pulse" /> GÉNÉRER ULTRA HD</>
            ) : hasProductImage ? (
              <span className="inline-flex items-center gap-2"><ImageIcon className="w-4 h-4" /> LANCER AVEC MON IMAGE</span>
            ) : (
              <span className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4" /> LANCER LA CRÉATION</span>
            )}
          </button>

          {!hasBrief && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-xs text-amber-700 font-bold inline-flex items-center gap-1.5">
                <TriangleAlert className="w-3.5 h-3.5" /> Brief requis pour générer
              </p>
              <button onClick={() => setActiveTab("brief")} className="text-[10px] text-amber-600 underline mt-0.5 inline-flex items-center gap-1">
                Remplir le brief <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <p className="text-center text-[10px] text-slate-400 px-4">
            Les options non définies sont optimisées automatiquement par l'IA.
          </p>
        </div>
      </div>

      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
      <input type="file" accept="image/*" ref={bgFileInputRef} className="hidden" onChange={handleBgImageUpload} />
    </div>
  );
};

export default GeneratorPage;
