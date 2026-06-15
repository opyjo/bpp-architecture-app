"use client";

import { repoTourSteps } from "@/data/repo-structure";
import { useEffect, useRef, useState } from "react";

interface RepoTourProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

export default function RepoTour({ currentStep, onStepChange }: RepoTourProps) {
  const step = repoTourSteps[currentStep];
  const [autoPlay, setAutoPlay] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoPlay) {
      timerRef.current = setInterval(() => {
        onStepChange(currentStep < repoTourSteps.length - 1 ? currentStep + 1 : 0);
      }, 5000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, currentStep, onStepChange]);

  return (
    <div className="px-3.5 py-2.5">
      {/* Top row: step badge + title + nav controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2" key={step.id} style={{ animation: "messageSlideIn 0.25s ease-out" }}>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-arch-blue/20 text-arch-blue text-[9.5px] font-bold shrink-0">
            {currentStep + 1}
          </span>
          <span className="text-[12.5px] font-semibold text-arch-text">{step.title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onStepChange(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-2 py-1 text-[10.5px] font-medium rounded bg-arch-bg3 border border-arch-border text-arch-text hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <button
            onClick={() => onStepChange(Math.min(repoTourSteps.length - 1, currentStep + 1))}
            disabled={currentStep === repoTourSteps.length - 1}
            className="px-2 py-1 text-[10.5px] font-medium rounded bg-arch-bg3 border border-arch-border text-arch-text hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`px-2 py-1 text-[10.5px] font-medium rounded border transition-colors ${
              autoPlay
                ? "bg-arch-blue/15 border-arch-blue/30 text-arch-blue"
                : "bg-arch-bg3 border-arch-border text-arch-text3 hover:text-arch-text2"
            }`}
          >
            {autoPlay ? "Pause" : "Auto"}
          </button>
          <div className="flex gap-0.5 ml-1">
            {repoTourSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => onStepChange(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentStep
                    ? "bg-arch-blue shadow-[0_0_4px_rgba(74,143,232,0.5)]"
                    : i < currentStep
                    ? "bg-arch-blue/40"
                    : "bg-arch-text3/40 hover:bg-arch-text2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Narration */}
      <div
        key={`narr-${step.id}`}
        className="text-[11.5px] text-arch-text leading-[1.65] mb-2"
        style={{ animation: "messageSlideIn 0.25s ease-out 0.05s both" }}
      >
        {step.narration}
      </div>

      {/* Analogy callout */}
      <div
        key={`ana-${step.id}`}
        className="analogy-callout flex gap-2 items-start mb-2 px-2.5 py-1.5 rounded-md border"
        style={{ animation: "messageSlideIn 0.25s ease-out 0.08s both" }}
      >
        <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-arch-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0" />
        </svg>
        <span className="text-[11px] text-arch-amber leading-[1.55]">{step.analogy}</span>
      </div>

      {/* What's inside — compact tag row */}
      {step.whatsInside && (
        <div
          key={`inside-${step.id}`}
          style={{ animation: "messageSlideIn 0.25s ease-out 0.1s both" }}
        >
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[9.5px] uppercase tracking-wider text-arch-text2 font-semibold mr-0.5">Inside:</span>
            {step.whatsInside.map((item, i) => (
              <span
                key={i}
                className="inline-block font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-arch-bg3 border border-arch-border text-arch-text"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
