import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { MarketingProgress } from "../components/MarketingProgress";
import { useMarketingWorkflow } from "../lib/marketingWorkflow";
import { posterService } from "../lib/posterStudioService";
import { BusinessSector, DEFAULT_CUSTOMIZATION, type CustomizationOptions, type PosterData, type PosterAnalysis, type VisualStyle } from "../lib/posterStudioTypes";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function inferSector(sectorHint?: string) {
  const hint = (sectorHint || "").toLowerCase();
  if (hint.includes("mode") || hint.includes("luxe")) return BusinessSector.FASHION;
  if (hint.includes("food") || hint.includes("boisson") || hint.includes("restaurant")) return BusinessSector.FOOD;
  if (hint.includes("beaute") || hint.includes("cosmet")) return BusinessSector.BEAUTY;
  if (hint.includes("finance")) return BusinessSector.FINANCE;
  return BusinessSector.TECH;
}

export function PosterAutoGenerator() {
  const navigate = useNavigate();
  const { generatedPost, autoBrief } = useMarketingWorkflow();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!generatedPost) return;

      const customization: CustomizationOptions = {
        ...DEFAULT_CUSTOMIZATION,
        customMarketingText: generatedPost.body,
        selectedStyle: (autoBrief?.styleHint as VisualStyle | undefined) ?? null,
        styleMode: autoBrief?.styleHint ? "custom" : "ai_decide",
        promoControl: { mode: autoBrief?.promotion ? "user" : "disabled", value: autoBrief?.promotion ?? "" },
        ctaControl: { mode: "ai", value: "" },
        sloganControl: { mode: "ai", value: "" },
      };

      const prompt = [
        autoBrief?.description,
        generatedPost.body,
        (generatedPost.selected_hashtags?.length ? generatedPost.selected_hashtags : generatedPost.hashtags).join(" "),
      ]
        .filter(Boolean)
        .join("\n\n");

      try {
        const analysis: PosterAnalysis = await posterService.analyzePrompt(prompt, inferSector(autoBrief?.sectorHint), customization, "fr");
        const imageUrl = await posterService.generatePosterImage(prompt, analysis, customization, "1:1");
        if (cancelled) return;

        const poster: PosterData = {
          id: generateId(),
          originalPrompt: prompt,
          optimizedPrompt: analysis.optimizedPrompt,
          sector: inferSector(autoBrief?.sectorHint),
          style: customization.selectedStyle,
          format: "1:1",
          imageUrl,
          slogan: analysis.slogan,
          marketingCopy: generatedPost.body,
          hashtags: generatedPost.selected_hashtags?.length ? generatedPost.selected_hashtags : generatedPost.hashtags,
          customization: { ...customization, userImages: [] },
          createdAt: Date.now(),
          analysis: {
            ...analysis,
            marketingCopy: generatedPost.body,
            hashtags: generatedPost.selected_hashtags?.length ? generatedPost.selected_hashtags : generatedPost.hashtags,
          },
        };

        navigate(`/poster/studio/results/${poster.id}`, {
          replace: true,
          state: {
            poster,
            analysis: {
              ...analysis,
              marketingCopy: generatedPost.body,
              hashtags: generatedPost.selected_hashtags?.length ? generatedPost.selected_hashtags : generatedPost.hashtags,
            },
          },
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Generation d'affiche impossible.");
        navigate("/generate", { replace: true });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [autoBrief, generatedPost, navigate]);

  if (!generatedPost) {
    return <Navigate to="/generate" replace />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(83,74,183,0.07),_transparent_28%),radial-gradient(circle_at_right_top,_rgba(56,189,248,0.05),_transparent_22%),linear-gradient(180deg,_#FFFFFF_0%,_#FFFFFF_100%)] p-4 md:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <MarketingProgress activeStep={2} />
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[32px] border border-white/10 bg-[#12101C]/90 p-8 text-center">
          <LoaderCircle className="h-12 w-12 animate-spin text-[#8C86D8]" />
          <h1 className="mt-6 text-3xl font-semibold text-white">Generation de l'affiche IA</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            L'affiche est en cours de generation. La page resultat s'ouvrira directement des que le visuel sera pret pour edition.
          </p>
        </div>
      </div>
    </div>
  );
}
