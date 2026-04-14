import { Check, Minus } from "lucide-react";
import { cn } from "./ui/utils";

type StepId = 1 | 2 | 3;

const steps = [
  { id: 1 as StepId, label: "Contenu", href: "/generate" },
  { id: 2 as StepId, label: "Affiche", href: "/poster" },
  { id: 3 as StepId, label: "Publier", href: "/publish" },
];

export function MarketingProgress({
  activeStep,
  skippedStep,
}: {
  activeStep: StepId;
  skippedStep?: StepId | null;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 px-4 py-5 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        {steps.map((step, index) => {
          const isSkipped = skippedStep === step.id;
          const isCompleted = !isSkipped && step.id < activeStep;
          const isActive = !isSkipped && step.id === activeStep;

          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                    isCompleted && "border-[#1D9E75] bg-[#1D9E75] text-white",
                    isActive && "border-[#534AB7] bg-[#534AB7] text-white",
                    isSkipped && "border-slate-500 text-slate-400",
                    !isCompleted && !isActive && !isSkipped && "border-slate-500 bg-transparent text-slate-300",
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : isSkipped ? <Minus className="h-4 w-4" /> : step.id}
                </span>
                <p
                  className={cn(
                    "truncate text-sm font-semibold",
                    isCompleted && "text-[#0F8A63]",
                    isActive && "text-[#4F46B8]",
                    isSkipped && "text-slate-400",
                    !isCompleted && !isActive && !isSkipped && "text-slate-600",
                  )}
                >
                  {step.label}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 bg-slate-700",
                    step.id < activeStep && !isSkipped && "bg-[#1D9E75]",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
