import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PostResponse } from "./api";
import type { AutoMarketingBrief } from "./kpiMarketing";

export type WorkflowChoice = "generate_poster" | "upload_poster" | "publish_direct" | null;

export type PosterDraft = {
  imageUrl: string;
  format: "1:1" | "9:16" | "16:9";
  mode: "generated" | "uploaded";
  sourceFileName?: string;
};

type MarketingWorkflowContextValue = {
  generatedPost: PostResponse | null;
  acceptedChoice: WorkflowChoice;
  posterDraft: PosterDraft | null;
  isPosterSkipped: boolean;
  autoBrief: AutoMarketingBrief | null;
  setGeneratedPost: (post: PostResponse | null) => void;
  setAcceptedChoice: (choice: WorkflowChoice) => void;
  setPosterDraft: (draft: PosterDraft | null) => void;
  setIsPosterSkipped: (skipped: boolean) => void;
  setAutoBrief: (brief: AutoMarketingBrief | null) => void;
  resetWorkflow: () => void;
};

const MarketingWorkflowContext = createContext<MarketingWorkflowContextValue | null>(null);
const MARKETING_WORKFLOW_STORAGE_KEY = "marketing_workflow_state";

function readStoredWorkflow() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(MARKETING_WORKFLOW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function MarketingWorkflowProvider({ children }: { children: ReactNode }) {
  const stored = readStoredWorkflow();
  const [generatedPost, setGeneratedPost] = useState<PostResponse | null>(stored?.generatedPost ?? null);
  const [acceptedChoice, setAcceptedChoice] = useState<WorkflowChoice>(stored?.acceptedChoice ?? null);
  const [posterDraft, setPosterDraft] = useState<PosterDraft | null>(stored?.posterDraft ?? null);
  const [isPosterSkipped, setIsPosterSkipped] = useState(stored?.isPosterSkipped ?? false);
  const [autoBrief, setAutoBrief] = useState<AutoMarketingBrief | null>(stored?.autoBrief ?? null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.sessionStorage.setItem(MARKETING_WORKFLOW_STORAGE_KEY, JSON.stringify({
      generatedPost,
      acceptedChoice,
      posterDraft,
      isPosterSkipped,
      autoBrief,
    }));
  }, [acceptedChoice, autoBrief, generatedPost, isPosterSkipped, posterDraft]);

  const resetWorkflow = useCallback(() => {
    setGeneratedPost(null);
    setAcceptedChoice(null);
    setPosterDraft(null);
    setIsPosterSkipped(false);
    setAutoBrief(null);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(MARKETING_WORKFLOW_STORAGE_KEY);
    }
  }, []);

  const value = useMemo<MarketingWorkflowContextValue>(() => ({
    generatedPost,
    acceptedChoice,
    posterDraft,
    isPosterSkipped,
    autoBrief,
    setGeneratedPost,
    setAcceptedChoice,
    setPosterDraft,
    setIsPosterSkipped,
    setAutoBrief,
    resetWorkflow,
  }), [acceptedChoice, autoBrief, generatedPost, isPosterSkipped, posterDraft, resetWorkflow]);

  return (
    <MarketingWorkflowContext.Provider value={value}>
      {children}
    </MarketingWorkflowContext.Provider>
  );
}

export function useMarketingWorkflow() {
  const context = useContext(MarketingWorkflowContext);
  if (!context) {
    throw new Error("useMarketingWorkflow must be used within MarketingWorkflowProvider.");
  }
  return context;
}
