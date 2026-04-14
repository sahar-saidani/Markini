import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { LoaderCircle, Pencil, Plus, RefreshCw, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { MarketingProgress } from "../components/MarketingProgress";
import { fetchGenerationJob, generatePost, type PostResponse } from "../lib/api";
import { useMarketingWorkflow } from "../lib/marketingWorkflow";
import { loadLatestDashboardData } from "../dashboard/config";
import { buildAutoMarketingBrief } from "../lib/kpiMarketing";
import type { ProductKPI } from "../dashboard/types";

type GenerationContext = {
  productName: string;
  targetAudience: string;
  tone: string;
  promotion: string;
  platform: string;
  description: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreProduct(prompt: string, product: ProductKPI) {
  const promptText = normalize(prompt);
  const nameText = normalize(product.name);
  const categoryText = normalize(product.category);
  const haystack = `${nameText} ${categoryText}`;
  if (!promptText) return product.scoreMarketing;
  if (promptText.includes(nameText)) return 1000 + product.scoreMarketing;

  const promptTokens = promptText.split(" ").filter((token) => token.length > 2);
  const nameTokens = nameText.split(" ").filter((token) => token.length > 2);
  const categoryTokens = categoryText.split(" ").filter((token) => token.length > 2);

  const semanticMatches = promptTokens.reduce((score, token) => {
    if (haystack.includes(token)) return score + 4;
    if (nameTokens.some((entry) => entry.startsWith(token) || token.startsWith(entry))) return score + 3;
    if (categoryTokens.some((entry) => entry.startsWith(token) || token.startsWith(entry))) return score + 2;
    return score;
  }, 0);

  return semanticMatches + product.scoreMarketing;
}

function resolveProductFromPrompt(prompt: string, products: ProductKPI[], fallback: ProductKPI | null) {
  if (!products.length) return fallback;
  const ranked = [...products]
    .map((product) => ({ product, score: scoreProduct(prompt, product) }))
    .sort((left, right) => right.score - left.score || right.product.scoreMarketing - left.product.scoreMarketing);
  return ranked[0]?.product ?? fallback ?? null;
}

function buildContext(prompt: string, product: ProductKPI | null): GenerationContext {
  if (!product) {
    return {
      productName: "",
      targetAudience: "",
      tone: "professionnel et engageant",
      promotion: "",
      platform: "Instagram et Facebook",
      description: prompt.trim(),
    };
  }

  const brief = buildAutoMarketingBrief({
    global: { chiffreAffaires: { day: 0, week: 0, month: 0 }, totalCommandes: 0, panierMoyen: 0 },
    products: [product],
    priorityProduct: product,
    lastUpdated: new Date(),
    error: false,
    partial: false,
  });

  return {
    productName: product.name,
    targetAudience: brief?.targetAudience ?? "",
    tone: brief?.tone ?? "professionnel et engageant",
    promotion: brief?.promotion ?? "",
    platform: brief?.platform ?? "Instagram et Facebook",
    description: [prompt.trim(), brief?.description].filter(Boolean).join("\n\n"),
  };
}

export function PostGenerator() {
  const navigate = useNavigate();
  const location = useLocation();
  const { generatedPost, setGeneratedPost, setPosterDraft, autoBrief, setAutoBrief, resetWorkflow } = useMarketingWorkflow();
  const pollRef = useRef<number | null>(null);
  const editableRef = useRef<HTMLDivElement | null>(null);
  const [prompt, setPrompt] = useState("");
  const [typing, setTyping] = useState(false);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(generatedPost?.selected_hashtags ?? []);
  const [draftBody, setDraftBody] = useState(generatedPost?.body ?? "");
  const [newTag, setNewTag] = useState("");
  const [regenerateFeedback, setRegenerateFeedback] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [lastContext, setLastContext] = useState<GenerationContext | null>(null);
  const [resolvedProductName, setResolvedProductName] = useState("");

  const dashboard = useMemo(() => loadLatestDashboardData(), []);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get("entry") !== "manual" || query.get("source") === "kpi") return;
    resetWorkflow();
    setPrompt("");
    setTyping(false);
    setSelectedHashtags([]);
    setDraftBody("");
    setNewTag("");
    setRegenerateFeedback("");
    setPopoverOpen(false);
    setLastContext(null);
    setResolvedProductName("");
  }, [location.search, resetWorkflow]);

  useEffect(() => {
    if (!generatedPost) return;
    setSelectedHashtags(generatedPost.selected_hashtags?.length ? generatedPost.selected_hashtags : generatedPost.hashtags);
    setDraftBody(generatedPost.body);
  }, [generatedPost]);

  useEffect(() => () => {
    if (pollRef.current) window.clearTimeout(pollRef.current);
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get("source") !== "kpi" || generatedPost) return;

    const brief = autoBrief ?? buildAutoMarketingBrief(dashboard);
    if (!brief) return;

    setAutoBrief(brief);
    setPrompt(`Genere un post performant pour ${brief.productName}`);
    setResolvedProductName(brief.productName);
    const context: GenerationContext = {
      productName: brief.productName,
      targetAudience: brief.targetAudience,
      tone: brief.tone,
      promotion: brief.promotion,
      platform: brief.platform,
      description: brief.description,
    };
    setLastContext(context);
    void runGeneration(context);
  }, [autoBrief, dashboard, generatedPost, location.search, setAutoBrief]);

  const getFallbackContext = () => {
    if (lastContext) return lastContext;
    const fallback = dashboard?.priorityProduct ?? null;
    const referenceText = [prompt, generatedPost?.subject, generatedPost?.topic, draftBody].filter(Boolean).join(" ");
    const product = resolveProductFromPrompt(referenceText, dashboard?.products ?? [], fallback);
    return buildContext(referenceText, product);
  };

  const hashtags = useMemo(() => Array.from(new Set(selectedHashtags.filter(Boolean))), [selectedHashtags]);

  const pollJob = async (jobId: number, context: GenerationContext, feedback = "") => {
    try {
      const response = await fetchGenerationJob(jobId);
      if (response.job.status === "completed" && response.job.post) {
        const post = {
          ...response.job.post,
          selected_hashtags: response.job.post.selected_hashtags?.length
            ? response.job.post.selected_hashtags
            : response.job.post.hashtags.slice(0, 8),
        };
        setGeneratedPost(post);
        setDraftBody(post.body);
        setSelectedHashtags(post.selected_hashtags);
        setLastContext(context);
        setTyping(false);
        if (feedback) toast.success("Contenu regenere.");
        return;
      }
      if (response.job.status === "failed") {
        setTyping(false);
        toast.error(response.job.error_message || "Generation impossible.");
        return;
      }
      pollRef.current = window.setTimeout(() => void pollJob(jobId, context, feedback), 1800);
    } catch (error) {
      setTyping(false);
      toast.error(error instanceof Error ? error.message : "Suivi de generation impossible.");
    }
  };

  const runGeneration = async (context: GenerationContext, feedback = "") => {
    setTyping(true);
    try {
      const response = await generatePost({
        product_name: context.productName,
        target_audience: context.targetAudience,
        brief_description: [context.description, feedback && `Feedback de regeneration: ${feedback}`].filter(Boolean).join("\n\n"),
        tone_override: context.tone,
        source_content: context.platform,
      });
      await pollJob(response.job.id, context, feedback);
    } catch (error) {
      setTyping(false);
      toast.error(error instanceof Error ? error.message : "Generation impossible.");
    }
  };

  const handleGenerate = () => {
    const value = prompt.trim();
    const fallback = dashboard?.priorityProduct ?? null;
    const product = resolveProductFromPrompt(value, dashboard?.products ?? [], fallback);
    const effectivePrompt = value || `Genere un post performant pour ${product?.name ?? "le produit prioritaire"} selon la meilleure recommandation du dashboard`;
    const context = buildContext(effectivePrompt, product);
    setResolvedProductName(product?.name ?? "Recommendation IA du dashboard");
    setLastContext(context);
    void runGeneration(context);
  };

  const handleGenerateAiPoster = () => {
    if (!generatedPost) return;
    setGeneratedPost({
      ...generatedPost,
      body: draftBody || generatedPost.body,
      selected_hashtags: hashtags.length ? hashtags : generatedPost.selected_hashtags,
    });
    setPosterDraft(null);
    navigate("/poster/auto");
  };

  const handleOpenAdvancedPoster = () => {
    if (!generatedPost) return;
    setGeneratedPost({
      ...generatedPost,
      body: draftBody || generatedPost.body,
      selected_hashtags: hashtags.length ? hashtags : generatedPost.selected_hashtags,
    });
    navigate("/poster/studio", {
      state: {
        prompt: [lastContext?.description, draftBody, hashtags.join(" ")].filter(Boolean).join("\n\n"),
      },
    });
  };

  const resultVisible = Boolean(generatedPost);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(83,74,183,0.08),_transparent_30%),radial-gradient(circle_at_right_top,_rgba(56,189,248,0.05),_transparent_24%),linear-gradient(180deg,_#FFFFFF_0%,_#FFFFFF_100%)] p-4 md:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <MarketingProgress activeStep={1} />

        {!resultVisible ? (
          <div className="mx-auto w-full max-w-3xl md:-translate-x-10">
            <div className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.28)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  handleGenerate();
                }}
                placeholder="Ex: Genere un post pour Robe Satin Nuit avec un angle premium et conversion"
                className="h-14 flex-1 border-0 bg-transparent px-4 text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-0"
              />
                <Button
                  type="button"
                  onClick={handleGenerate}
                  className="h-12 rounded-2xl border border-[#C9B8FF] bg-[#7C3AED] px-6 text-white shadow-[0_16px_30px_-18px_rgba(124,58,237,0.9)] hover:bg-[#6D28D9] md:mr-2"
                  disabled={typing}
                >
                  {typing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Generer
                </Button>
              </div>
            </div>

            {resolvedProductName ? <p className="mt-3 pl-2 text-sm text-slate-500">{resolvedProductName}</p> : null}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl">
            <div className="mb-3 flex items-center justify-end">
              <Button type="button" variant="ghost" className="text-slate-700 hover:bg-slate-100" onClick={() => editableRef.current?.focus()}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            <div
              ref={editableRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) => setDraftBody(event.currentTarget.textContent ?? "")}
              className="min-h-[360px] whitespace-pre-wrap rounded-[24px] border border-slate-200 bg-white p-6 text-base leading-7 text-slate-800 outline-none"
            >
              {draftBody}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedHashtags((prev) => prev.filter((entry) => entry !== tag))}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D7D0FF] bg-[#F3F1FF] px-3 py-1.5 text-sm text-[#4F46B8]"
                >
                  <span>{tag}</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input value={newTag} onChange={(event) => setNewTag(event.target.value)} placeholder="Ajouter un hashtag" className="max-w-56 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400" />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const normalized = newTag.trim().replace(/\s+/g, "");
                  if (!normalized) return;
                  setSelectedHashtags((prev) => [...prev, normalized.startsWith("#") ? normalized : `#${normalized}`]);
                  setNewTag("");
                }}
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerer
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 border-slate-200 bg-white text-slate-800">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Que faut-il changer ?</p>
                    <Input value={regenerateFeedback} onChange={(event) => setRegenerateFeedback(event.target.value)} placeholder="Plus court, plus direct, plus premium..." className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400" />
                    <Button
                      type="button"
                      onClick={() => {
                        const context = getFallbackContext();
                        setPopoverOpen(false);
                        setLastContext(context);
                        void runGeneration(context, regenerateFeedback.trim());
                        setRegenerateFeedback("");
                      }}
                      disabled={typing}
                      className="w-full bg-[#534AB7] text-white hover:bg-[#6357D5]"
                    >
                      Relancer
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button type="button" className="border border-[#C9B8FF] bg-[#7C3AED] text-white hover:bg-[#6D28D9]" onClick={handleGenerateAiPoster}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generer affiche AI
              </Button>

              <Button type="button" className="border border-[#C9B8FF] bg-[#7C3AED] text-white hover:bg-[#6D28D9]" onClick={handleOpenAdvancedPoster}>
                <Wand2 className="mr-2 h-4 w-4" />
                Generer affiche avancee
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
