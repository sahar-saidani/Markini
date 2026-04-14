import { useMemo, useState, type ChangeEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { ImagePlus, LoaderCircle, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { MarketingProgress } from "../components/MarketingProgress";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useMarketingWorkflow } from "../lib/marketingWorkflow";
import { DEFAULT_CUSTOMIZATION, VisualStyle, type PosterFormat, type UserImage } from "../lib/posterTypes";
import { posterService } from "../lib/posterService";

const formats: PosterFormat[] = ["1:1", "9:16", "16:9"];
const styleOptions = [VisualStyle.MODERN, VisualStyle.LUXURY, VisualStyle.MINIMALIST, VisualStyle.BOLD];
const createId = () => Math.random().toString(36).slice(2, 10);

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.readAsDataURL(file);
  });
}

export function PosterCreator() {
  const navigate = useNavigate();
  const { generatedPost, posterDraft, setPosterDraft, isPosterSkipped, autoBrief } = useMarketingWorkflow();
  const [format, setFormat] = useState<PosterFormat>(posterDraft?.format ?? "1:1");
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle>(
    autoBrief?.styleHint === VisualStyle.LUXURY || autoBrief?.styleHint === VisualStyle.MINIMALIST || autoBrief?.styleHint === VisualStyle.BOLD
      ? autoBrief.styleHint
      : VisualStyle.MODERN,
  );
  const [manualSlogan, setManualSlogan] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualPromo, setManualPromo] = useState(autoBrief?.promotion ?? "");
  const [manualCta, setManualCta] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!generatedPost) return <Navigate to="/generate" replace />;
  if (isPosterSkipped) return <Navigate to="/publish" replace />;

  const copySummary = useMemo(() => [generatedPost.body, (generatedPost.selected_hashtags?.length ? generatedPost.selected_hashtags : generatedPost.hashtags).join(" ")].filter(Boolean).join("\n\n"), [generatedPost]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      const userImage: UserImage = { id: createId(), base64, previewUrl: base64, fileName: file.name, role: "product", position: "center", forceIntegration: true, strength: 0.3 };
      setPosterDraft({ imageUrl: userImage.previewUrl, format, mode: "uploaded", sourceFileName: file.name });
      toast.success("Visuel charge. Vous pouvez maintenant valider.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload impossible.");
    }
  };

  const handleGeneratePoster = async () => {
    setIsGenerating(true);
    try {
      const customization = {
        ...DEFAULT_CUSTOMIZATION,
        customMarketingText: generatedPost.body,
        sloganControl: { mode: manualSlogan.trim() ? "user" : "ai", value: manualSlogan.trim() },
        priceControl: { mode: manualPrice.trim() ? "user" : "disabled", value: manualPrice.trim() },
        promoControl: { mode: manualPromo.trim() ? "user" : "disabled", value: manualPromo.trim() },
        ctaControl: { mode: manualCta.trim() ? "user" : "ai", value: manualCta.trim() },
        selectedStyle,
        styleMode: "custom" as const,
        userImages: posterDraft?.mode === "uploaded" && posterDraft.imageUrl ? [{
          id: createId(),
          base64: posterDraft.imageUrl,
          previewUrl: posterDraft.imageUrl,
          fileName: posterDraft.sourceFileName || "upload",
          role: "product" as const,
          position: "center" as const,
          forceIntegration: true,
          strength: 0.3 as const,
        }] : [],
      };
      const analysis = await posterService.analyzePrompt(copySummary, customization);
      const imageUrl = await posterService.generatePosterImage(copySummary, analysis, customization, format);
      setPosterDraft({ imageUrl, format, mode: customization.userImages.length ? "uploaded" : "generated", sourceFileName: customization.userImages[0]?.fileName });
      toast.success("Affiche preparee.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation de l'affiche impossible.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(29,158,117,0.06),_transparent_24%),radial-gradient(circle_at_right_top,_rgba(56,189,248,0.05),_transparent_22%),linear-gradient(180deg,_#FFFFFF_0%,_#FFFFFF_100%)] p-4 md:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <MarketingProgress activeStep={2} />
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="rounded-[28px] border border-white/10 bg-[#12101C]/90 p-6">
            <p className="text-xs uppercase tracking-[0.26em] text-[#65D4B1]">Etape 2</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Creation d'affiche</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">La logique de generation visuelle issue de Marketing-digital est branchee ici. Vous pouvez partir du texte ou d'un visuel upload.</p>
            <div className="mt-6 space-y-6">
              <div>
                <p className="mb-3 text-sm font-medium text-white">Format</p>
                <div className="grid grid-cols-3 gap-2">
                  {formats.map((entry) => (
                    <button key={entry} type="button" onClick={() => setFormat(entry)} className={`rounded-2xl border px-3 py-3 text-sm ${format === entry ? "border-[#1D9E75] bg-[#10362A] text-white" : "border-white/10 bg-white/5 text-slate-300"}`}>{entry}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-white">Direction visuelle</p>
                <div className="grid gap-2">
                  {styleOptions.map((option) => (
                    <button key={option} type="button" onClick={() => setSelectedStyle(option)} className={`rounded-2xl border px-4 py-3 text-left text-sm ${selectedStyle === option ? "border-[#534AB7] bg-[#1C1837] text-white" : "border-white/10 bg-white/5 text-slate-300"}`}>{option}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-white">Remplissage manuel</p>
                <div className="grid gap-3">
                  <input value={manualSlogan} onChange={(event) => setManualSlogan(event.target.value)} placeholder="Slogan manuel (optionnel)" className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 outline-none" />
                  <input value={manualPrice} onChange={(event) => setManualPrice(event.target.value)} placeholder="Prix a afficher (optionnel)" className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 outline-none" />
                  <input value={manualPromo} onChange={(event) => setManualPromo(event.target.value)} placeholder="Promo / angle commercial" className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 outline-none" />
                  <input value={manualCta} onChange={(event) => setManualCta(event.target.value)} placeholder="CTA manuel (optionnel)" className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 outline-none" />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/10 bg-transparent text-white hover:bg-white/8"
                    onClick={() => navigate("/poster/studio", {
                      state: {
                        prompt: [autoBrief?.description, generatedPost.body, manualPromo].filter(Boolean).join("\n\n"),
                        customization: {
                          customMarketingText: generatedPost.body,
                          selectedStyle,
                          styleMode: "custom",
                          sloganControl: { mode: manualSlogan.trim() ? "user" : "ai", value: manualSlogan.trim() },
                          priceControl: { mode: manualPrice.trim() ? "user" : "disabled", value: manualPrice.trim() },
                          promoControl: { mode: manualPromo.trim() ? "user" : "disabled", value: manualPromo.trim() },
                          ctaControl: { mode: manualCta.trim() ? "user" : "ai", value: manualCta.trim() },
                        },
                        format,
                      },
                    })}
                  >
                    Ouvrir le studio avance
                  </Button>
                </div>
              </div>
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-3 text-white"><ImagePlus className="h-5 w-5 text-[#8C86D8]" /><p className="font-medium">Uploader votre affiche ou image produit</p></div>
                <p className="mt-2 text-sm text-slate-400">PNG, JPG ou JPEG. Si une image est fournie, elle sert de fond comme dans Marketing-digital.</p>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/8">
                  <Upload className="h-4 w-4" />Choisir un fichier
                  <input type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} />
                </label>
                {posterDraft?.mode === "uploaded" && <Badge className="mt-3 border-transparent bg-[#1D9E75] text-white">{posterDraft.sourceFileName || "Image chargee"}</Badge>}
              </div>
              <Button type="button" onClick={() => void handleGeneratePoster()} disabled={isGenerating} className="w-full border border-[#C9B8FF] bg-[#7C3AED] text-white hover:bg-[#6D28D9]">
                {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGenerating ? "Generation en cours..." : "Generer l'affiche"}
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#12101C]/90 p-6">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-xs uppercase tracking-[0.26em] text-[#65D4B1]">Preview</p><h2 className="mt-2 text-2xl font-semibold text-white">Apercu de l'affiche</h2></div>
              <Badge className="border-transparent bg-white/10 text-white">{format}</Badge>
            </div>
            {posterDraft?.imageUrl ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black">
                  <div className="relative aspect-square w-full">
                    <img src={posterDraft.imageUrl} alt="Affiche generee" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                      <p className="text-2xl font-semibold text-white">{generatedPost.body.split("\n")[0]}</p>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">{generatedPost.body}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(generatedPost.selected_hashtags?.length ? generatedPost.selected_hashtags : generatedPost.hashtags).map((tag) => (
                          <span key={tag} className="rounded-full bg-white/14 px-3 py-1 text-xs text-white">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <p className="text-sm font-medium text-white">Resume</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{generatedPost.body}</p>
                  <p className="mt-5 text-xs uppercase tracking-[0.22em] text-slate-500">Source</p>
                  <p className="mt-2 text-sm text-slate-300">{posterDraft.mode === "uploaded" ? "Image importee comme fond" : "Image generee par le moteur d'affiche"}</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex min-h-[520px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-black/20 text-center">
                <div><Sparkles className="mx-auto h-10 w-10 text-[#8C86D8]" /><p className="mt-4 text-lg font-medium text-white">Aucune affiche pour le moment</p><p className="mt-2 text-sm text-slate-400">Lancez la generation ou chargez une image pour afficher le visuel final ici.</p></div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end pr-20 pb-2 md:pr-24">
          <Button type="button" onClick={() => navigate("/publish")} disabled={!posterDraft?.imageUrl} className="h-12 bg-[#534AB7] px-6 text-white hover:bg-[#6357D5]">
            Valider et publier
          </Button>
        </div>
      </div>
    </div>
  );
}
