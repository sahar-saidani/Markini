import { useEffect, useRef, useState } from "react";
import { Bot, Mic, MicOff, Send, Volume2, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { loadLatestDashboardData } from "../../dashboard/config";
import type { DashboardKPIs, ProductKPI } from "../../dashboard/types";
import type { PostResponse } from "../../lib/api";
import type { AIRecommendation } from "../types";
import { useSpeechToSpeechAgent } from "../hooks/useSpeechToSpeechAgent";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

type SalesAssistantBubbleProps = {
  dashboardKPIs?: DashboardKPIs | null;
  generatedPost?: PostResponse | null;
  currentRecommendation?: AIRecommendation | null;
  priorityProduct?: ProductKPI | null;
};

export function SalesAssistantBubble({
  dashboardKPIs,
  generatedPost = null,
  currentRecommendation = null,
  priorityProduct = null,
}: SalesAssistantBubbleProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [fallbackDashboard, setFallbackDashboard] = useState<DashboardKPIs | null>(dashboardKPIs ?? null);
  const lastHandledTranscriptRef = useRef("");

  useEffect(() => {
    if (dashboardKPIs) {
      setFallbackDashboard(dashboardKPIs);
      return;
    }
    setFallbackDashboard(loadLatestDashboardData());
  }, [dashboardKPIs]);

  const effectiveDashboard = dashboardKPIs ?? fallbackDashboard;
  const effectivePriority = priorityProduct ?? effectiveDashboard?.priorityProduct ?? null;
  const agent = useSpeechToSpeechAgent(
    effectiveDashboard,
    currentRecommendation,
    generatedPost,
    effectivePriority,
  );

  useEffect(() => {
    if (!agent.transcript) return;
    if (agent.transcript === lastHandledTranscriptRef.current) return;
    lastHandledTranscriptRef.current = agent.transcript;
    const answer = agent.ask(agent.transcript);
    setMessages((current) => [...current, { role: "user", text: agent.transcript }, { role: "assistant", text: answer.text }]);
    setQuestion("");
  }, [agent.ask, agent.transcript]);

  const handleAsk = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const answer = agent.ask(trimmed);
    setMessages((current) => [...current, { role: "user", text: trimmed }, { role: "assistant", text: answer.text }]);
    setQuestion("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3">
      {open ? (
        <div className="h-[560px] w-[420px] overflow-hidden rounded-[26px] border border-slate-800 bg-[linear-gradient(180deg,#111827_0%,#0B1220_100%)] shadow-[0_28px_80px_rgba(2,6,23,0.55)]">
          <div className="border-b border-slate-800 bg-[linear-gradient(90deg,rgba(99,102,241,0.18),rgba(56,189,248,0.08))] px-5 py-3">
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-500/15 text-indigo-200 shadow-[0_10px_30px_rgba(99,102,241,0.18)]">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Markini</h3>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-700 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex h-[220px] flex-col space-y-3 overflow-y-auto px-5 py-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === "assistant"
                  ? "max-w-[88%] rounded-2xl rounded-tl-md border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm leading-6 text-slate-100 shadow-[0_10px_24px_rgba(2,6,23,0.22)]"
                  : "ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-[linear-gradient(135deg,#6366F1_0%,#7C3AED_100%)] px-4 py-3 text-sm leading-6 text-white shadow-[0_12px_28px_rgba(99,102,241,0.28)]"}
              >
                {message.text}
              </div>
            ))}
          </div>

          {!messages.length ? (
            <div className="mx-5 mt-1 flex flex-wrap gap-2">
              {[
                "Je cherche plus de clients",
                "Donne-moi une recommandation",
                "Parle-moi d'un produit",
                "Quel produit pousser ?",
              ].map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => handleAsk(reply)}
                  className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-indigo-400/40 hover:bg-indigo-500/10 hover:text-indigo-100"
                >
                  {reply}
                </button>
              ))}
            </div>
          ) : null}

          {agent.error ? (
            <div className="mx-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {agent.error}
            </div>
          ) : null}

          {agent.answer?.suggestedReplies?.length ? (
            <div className="mx-5 mt-2 flex flex-wrap gap-2">
              {agent.answer.suggestedReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => handleAsk(reply)}
                  className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-indigo-400/40 hover:bg-indigo-500/10 hover:text-indigo-100"
                >
                  {reply}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-3 border-t border-slate-800 bg-slate-950/70 p-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="flex items-end gap-2">
                <Input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    handleAsk(question);
                  }}
                  placeholder="Ex: Je suis un restaurant, budget 1000 euros"
                  className="h-11 flex-1 border-0 bg-transparent text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!agent.supported}
                  onClick={() => (agent.listening ? agent.stopListening() : agent.startListening())}
                  className="h-11 rounded-xl border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                >
                  {agent.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleAsk(question)}
                  className="h-11 rounded-xl bg-[linear-gradient(135deg,#6366F1_0%,#7C3AED_100%)] px-4 text-white hover:opacity-95"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative mt-2 flex items-center justify-center">
              <div className="text-xs text-slate-500 text-center">
                {agent.listening ? "Ecoute active" : agent.speaking ? "Lecture en cours" : ""}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => agent.answer?.text && agent.speak(agent.answer.text)}
                className="absolute right-4 h-9 rounded-xl px-3 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Volume2 className="mr-2 h-4 w-4" />
                Rejouer
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-[linear-gradient(135deg,#0F172A_0%,#111827_100%)] text-indigo-200 shadow-[0_18px_40px_rgba(2,6,23,0.35)] transition hover:scale-[1.02] hover:text-white"
        aria-label="Ouvrir l'assistant vocal"
      >
        <Bot className="h-7 w-7" />
      </button>
    </div>
  );
}
