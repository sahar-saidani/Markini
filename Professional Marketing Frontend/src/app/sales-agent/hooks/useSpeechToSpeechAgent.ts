import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DashboardKPIs, ProductKPI } from "../../dashboard/types";
import type { PostResponse } from "../../lib/api";
import type { AIRecommendation, AgentAnswer, QualificationState } from "../types";
import { deriveRecommendation } from "../services/recommendationEngine";
import { answerDashboardQuestion } from "../services/qaEngine";
import { buildAgentContext } from "../services/contextBuilder";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onstart?: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type WindowWithSpeech = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  speechSynthesis: SpeechSynthesis;
};

export function useSpeechToSpeechAgent(
  dashboardKPIs: DashboardKPIs | null,
  currentRecommendation: AIRecommendation | null,
  generatedPost: PostResponse | null,
  priorityProduct: ProductKPI | null,
) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState<AgentAnswer | null>(null);
  const [error, setError] = useState("");
  const [qualification, setQualification] = useState<QualificationState>({ sector: null, objective: null, budget: null });
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const recommendation = useMemo(
    () => currentRecommendation ?? deriveRecommendation(dashboardKPIs, priorityProduct),
    [currentRecommendation, dashboardKPIs, priorityProduct],
  );

  const context = useMemo(
    () => buildAgentContext(dashboardKPIs, recommendation, generatedPost, priorityProduct),
    [dashboardKPIs, recommendation, generatedPost, priorityProduct],
  );

  useEffect(() => {
    const speechWindow = window as WindowWithSpeech;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setSupported(false);
      setError("Reconnaissance vocale non supportee sur ce navigateur.");
      return;
    }
    setSupported(true);
    const recognition = new Recognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setError("");
      setListening(true);
    };
    recognition.onresult = (event) => {
      const nextTranscript = Array.from(event.results)
        .flatMap((result) => Array.from(result))
        .map((item) => item.transcript)
        .join(" ")
        .trim();
      setTranscript(nextTranscript);
      setListening(false);
    };
    recognition.onerror = (event) => {
      setListening(false);
      setError(event.error || "Reconnaissance vocale impossible.");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    const speechWindow = window as WindowWithSpeech;
    if (!speechWindow.speechSynthesis) {
      return;
    }
    speechWindow.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    speechWindow.speechSynthesis.speak(utterance);
  }, []);

  const ask = useCallback((question: string) => {
    const nextAnswer = answerDashboardQuestion(question, dashboardKPIs, recommendation, generatedPost, priorityProduct, qualification);
    if (nextAnswer.nextQualification) {
      setQualification(nextAnswer.nextQualification);
    }
    setAnswer(nextAnswer);
    if (nextAnswer.shouldSpeak) {
      speak(nextAnswer.text);
    }
    return nextAnswer;
  }, [dashboardKPIs, generatedPost, priorityProduct, qualification, recommendation, speak]);

  const startListening = useCallback(() => {
    setError("");
    if (!recognitionRef.current) {
      setError("Reconnaissance vocale non supportee sur ce navigateur.");
      return;
    }
    setTranscript("");
    try {
      recognitionRef.current.start();
    } catch (error) {
      setListening(false);
      setError(error instanceof Error ? error.message : "Impossible de demarrer la reconnaissance vocale.");
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return {
    supported,
    listening,
    speaking,
    transcript,
    answer,
    error,
    recommendation,
    context,
    qualification,
    setTranscript,
    ask,
    speak,
    startListening,
    stopListening,
  };
}
