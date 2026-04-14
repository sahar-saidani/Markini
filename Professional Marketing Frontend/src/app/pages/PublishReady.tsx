import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { ArrowRight, Download, FileImage, Instagram, Link2, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { MarketingProgress } from "../components/MarketingProgress";
import { Button } from "../components/ui/button";
import { publishPost } from "../lib/api";
import { useMarketingWorkflow } from "../lib/marketingWorkflow";

const FACEBOOK_PENDING_PUBLISH_KEY = "facebook_pending_publish";

const downloadImage = (imageUrl: string) => {
  const anchor = document.createElement("a");
  anchor.href = imageUrl;
  anchor.download = "publication-marketing.png";
  anchor.click();
};

async function imageUrlToDataUrl(imageUrl: string) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Conversion de l'image impossible."));
    reader.readAsDataURL(blob);
  });
}

function openPdfPrint(body: string, imageUrl?: string) {
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) throw new Error("Impossible d'ouvrir la fenetre d'impression.");
  popup.document.write(`<html><head><title>Publication marketing</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111}img{max-width:100%;border-radius:18px;margin-bottom:24px}.card{border:1px solid #ddd;border-radius:18px;padding:24px}</style></head><body><div class="card">${imageUrl ? `<img src="${imageUrl}" alt="Affiche" />` : ""}<div>${body.replace(/\n/g, "<br/>")}</div></div></body></html>`);
  popup.document.close();
  popup.focus();
  popup.print();
}

export function PublishReady() {
  const navigate = useNavigate();
  const location = useLocation();
  const { generatedPost, posterDraft, isPosterSkipped, resetWorkflow } = useMarketingWorkflow();
  const [publishing, setPublishing] = useState<false | "linkedin" | "facebook">(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "success" | "error">("idle");
  const [activePlatform, setActivePlatform] = useState<"linkedin" | "facebook" | null>(null);
  const [instagramPreparing, setInstagramPreparing] = useState(false);
  if (!generatedPost) return <Navigate to="/generate" replace />;
  const tags = generatedPost.selected_hashtags?.length ? generatedPost.selected_hashtags : generatedPost.hashtags;

  const shareText = `${generatedPost.body}\n\n${tags.join(" ")}`.trim();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const facebookState = params.get("facebook");
    if (!facebookState) {
      return;
    }

    if (facebookState === "error") {
      const message = params.get("message");
      if (message) {
        toast.error(message);
      }
      navigate("/publish", { replace: true });
      return;
    }

    if (facebookState !== "connected" || publishing) {
      return;
    }

    const raw = window.sessionStorage.getItem(FACEBOOK_PENDING_PUBLISH_KEY);
    if (!raw) {
      navigate("/publish", { replace: true });
      return;
    }

    const pending = JSON.parse(raw) as {
      postId: number;
      body: string;
      selected_hashtags: string[];
      image_url?: string;
      image_data_url?: string;
    };

    const runAutoPublish = async () => {
      setPublishing("facebook");
      setPublishStatus("idle");
      setActivePlatform("facebook");
      try {
        await publishPost(pending.postId, {
          body: pending.body,
          selected_hashtags: pending.selected_hashtags,
          image_url: pending.image_url,
          image_data_url: pending.image_data_url,
          platform: "facebook",
        });
        window.sessionStorage.removeItem(FACEBOOK_PENDING_PUBLISH_KEY);
        setPublishStatus("success");
        toast.success("Publication envoyee automatiquement vers Facebook.");
      } catch (error) {
        setPublishStatus("error");
        toast.error(error instanceof Error ? error.message : "Publication Facebook impossible.");
      } finally {
        setPublishing(false);
        navigate("/publish", { replace: true });
      }
    };

    void runAutoPublish();
  }, [location.search, navigate, publishing]);

  const handleLinkedInPublish = async () => {
    setPublishing("linkedin");
    setPublishStatus("idle");
    setActivePlatform("linkedin");
    try {
      const imageDataUrl = posterDraft?.imageUrl ? await imageUrlToDataUrl(posterDraft.imageUrl) : undefined;
      await publishPost(generatedPost.id, {
        body: generatedPost.body,
        selected_hashtags: tags,
        image_url: posterDraft?.imageUrl,
        image_data_url: imageDataUrl,
        platform: "linkedin",
      });
      setPublishStatus("success");
      toast.success("Publication envoyee vers LinkedIn avec le contenu complet.");
    } catch (error) {
      setPublishStatus("error");
      toast.error(error instanceof Error ? error.message : "Publication LinkedIn impossible.");
    } finally {
      setPublishing(false);
    }
  };

  const handleInstagramAssist = async () => {
    setInstagramPreparing(true);
    try {
      await navigator.clipboard.writeText(shareText);
      if (posterDraft?.imageUrl) {
        downloadImage(posterDraft.imageUrl);
      }
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      toast.success("Contenu copie, visuel telecharge et Instagram ouvert.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preparation Instagram impossible.");
    } finally {
      setInstagramPreparing(false);
    }
  };

  const handleFacebookAssist = async () => {
    setPublishing("facebook");
    setPublishStatus("idle");
    setActivePlatform("facebook");
    try {
      const imageDataUrl = posterDraft?.imageUrl ? await imageUrlToDataUrl(posterDraft.imageUrl) : undefined;
      await publishPost(generatedPost.id, {
        body: generatedPost.body,
        selected_hashtags: tags,
        image_url: posterDraft?.imageUrl,
        image_data_url: imageDataUrl,
        platform: "facebook",
      });
      setPublishStatus("success");
      toast.success("Publication envoyee automatiquement vers Facebook.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Publication Facebook impossible.";
      if (message.includes("Facebook account not connected")) {
        const imageDataUrl = posterDraft?.imageUrl ? await imageUrlToDataUrl(posterDraft.imageUrl) : undefined;
        window.sessionStorage.setItem(FACEBOOK_PENDING_PUBLISH_KEY, JSON.stringify({
          postId: generatedPost.id,
          body: generatedPost.body,
          selected_hashtags: tags,
          image_url: posterDraft?.imageUrl,
          image_data_url: imageDataUrl,
        }));
        window.location.href = "/api/app/facebook/connect/?return_to=/publish";
        return;
      }
      setPublishStatus("error");
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(83,74,183,0.07),_transparent_24%),radial-gradient(circle_at_right_top,_rgba(56,189,248,0.05),_transparent_22%),linear-gradient(180deg,_#FFFFFF_0%,_#FFFFFF_100%)] p-4 md:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <MarketingProgress activeStep={3} skippedStep={isPosterSkipped ? 2 : null} />
        <div className="rounded-[32px] border border-white/10 bg-[#12101C]/90 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.26em] text-[#8C86D8]">Etape 3</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Pret a publier !</h1>
          <div className={`mt-4 rounded-[20px] border px-4 py-3 text-sm ${
            publishStatus === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : publishStatus === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-200"
                : "border-white/10 bg-white/5 text-slate-300"
          }`}>
            {publishing
              ? `Publication ${publishing === "facebook" ? "Facebook" : "LinkedIn"} en cours...`
              : publishStatus === "success"
                ? `Publication ${activePlatform === "facebook" ? "Facebook" : "LinkedIn"} effectuee.`
                : publishStatus === "error"
                  ? `La publication ${activePlatform === "facebook" ? "Facebook" : "LinkedIn"} a echoue. Vous pouvez relancer via la carte correspondante.`
                  : "Choisissez la plateforme a utiliser pour publier ce contenu."}
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-medium text-slate-300">Carte de previsualisation finale</p>
              {posterDraft?.imageUrl ? <img src={posterDraft.imageUrl} alt="Apercu final" className="mt-4 h-[340px] w-full rounded-[24px] object-cover" /> : <div className="mt-4 flex h-[220px] items-center justify-center rounded-[24px] border border-dashed border-white/10 text-slate-500">Aucun visuel ajoute</div>}
              <div className="mt-5 rounded-[22px] border border-white/8 bg-[#171428] p-5">
                <p className="whitespace-pre-wrap text-base leading-7 text-white">{generatedPost.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">{tag}</span>)}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Publier sur</p>
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    disabled={Boolean(publishing)}
                    onClick={() => void handleLinkedInPublish()}
                    className="group flex w-full items-center justify-between rounded-[22px] border border-[#8C86D8]/25 bg-[linear-gradient(135deg,rgba(96,165,250,0.18),rgba(83,74,183,0.14))] px-4 py-4 text-left transition hover:border-[#8C86D8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A66C2] text-white shadow-lg shadow-[#0A66C2]/30">
                        <Linkedin className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">LinkedIn</h3>
                        <p className="mt-1 text-sm text-slate-300">{publishing === "linkedin" ? "Publication en cours..." : "Publier automatiquement avec le contenu et l'affiche"}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    disabled={Boolean(publishing)}
                    onClick={() => void handleFacebookAssist()}
                    className="group flex w-full items-center justify-between rounded-[22px] border border-[#8C86D8]/20 bg-[linear-gradient(135deg,rgba(59,130,246,0.14),rgba(29,78,216,0.10))] px-4 py-4 text-left transition hover:border-[#8C86D8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1877F2] text-lg font-bold text-white shadow-lg shadow-[#1877F2]/30">
                        f
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Facebook</h3>
                        <p className="mt-1 text-sm text-slate-300">{publishing === "facebook" ? "Publication en cours..." : "Publier automatiquement avec le contenu et l'affiche"}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    disabled={instagramPreparing}
                    onClick={() => void handleInstagramAssist()}
                    className="group flex w-full items-center justify-between rounded-[22px] border border-[#8C86D8]/20 bg-[linear-gradient(135deg,rgba(236,72,153,0.16),rgba(249,115,22,0.12))] px-4 py-4 text-left transition hover:border-[#8C86D8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#E1306C,#F77737,#FCAF45)] text-white shadow-lg shadow-pink-500/20">
                        <Instagram className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Instagram</h3>
                        <p className="mt-1 text-sm text-slate-300">{instagramPreparing ? "Preparation en cours..." : "Ouvrir Instagram avec le contenu prepare et le visuel telecharge"}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        if (posterDraft?.imageUrl) downloadImage(posterDraft.imageUrl);
                        else openPdfPrint(generatedPost.body);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Telechargement impossible.");
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300 transition hover:border-[#8C86D8] hover:text-white"
                  >
                    <Download className="h-4 w-4" />
                    Telecharger
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(shareText);
                      toast.success("Texte et hashtags copies.");
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300 transition hover:border-[#8C86D8] hover:text-white"
                  >
                    <Link2 className="h-4 w-4" />
                    Copier le texte
                  </button>
                </div>
              </div>
            </div>
          </div>
          <Button type="button" variant="ghost" className="mt-8 h-12 rounded-full border border-white/10 px-5 text-white hover:bg-white/8" onClick={() => { resetWorkflow(); navigate("/generate"); }}><FileImage className="h-4 w-4" />Creer une nouvelle publication</Button>
        </div>
      </div>
    </div>
  );
}
