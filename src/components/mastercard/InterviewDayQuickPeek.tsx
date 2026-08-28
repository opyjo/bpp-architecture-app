"use client";

import { useEffect, useState } from "react";
import { Maximize2, Minimize2, Printer, Target } from "lucide-react";
import {
  behaviouralQuestions,
  coreQuestions,
  starMentalModels,
  type InterviewQuestion,
  type StarMentalModel,
} from "@/data/mastercard-prep";

const answerKeys = ["tell-me-about-yourself", "why-mastercard", "leaving-bell"];
const storyKeys = ["contingency-management", "aeroplan-integration", "flow-runner"];

const quickAnswers = answerKeys
  .map((key) => [...coreQuestions, ...behaviouralQuestions].find((question) => question.key === key))
  .filter((question): question is InterviewQuestion => Boolean(question));

const quickStories = storyKeys
  .map((key) => starMentalModels.find((story) => story.storyKey === key))
  .filter((story): story is StarMentalModel => Boolean(story));

const answerAccents: Record<string, string> = {
  "tell-me-about-yourself": "border-t-arch-blue",
  "why-mastercard": "border-t-arch-purple",
  "leaving-bell": "border-t-arch-teal",
};

const storyAccents: Record<string, { border: string; text: string; bg: string }> = {
  "contingency-management": {
    border: "border-l-arch-teal",
    text: "text-arch-teal",
    bg: "bg-arch-teal/10",
  },
  "aeroplan-integration": {
    border: "border-l-arch-coral",
    text: "text-arch-coral",
    bg: "bg-arch-coral/10",
  },
  "flow-runner": {
    border: "border-l-arch-purple",
    text: "text-arch-purple",
    bg: "bg-arch-purple/10",
  },
};

function AnswerCard({ question }: { question: InterviewQuestion }) {
  return (
    <article className={`rounded-xl border border-arch-border border-t-[3px] ${answerAccents[question.key ?? ""] ?? "border-t-arch-blue"} bg-arch-bg2 p-3.5`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h2 className="text-[13px] font-semibold leading-5 text-arch-text">{question.question}</h2>
        <span className="shrink-0 rounded-full bg-arch-bg3 px-2 py-1 text-[8.5px] font-semibold uppercase tracking-wider text-arch-text3">60–90 sec</span>
      </div>
      <ul className="space-y-1.5">
        {question.quickPeek?.map((point) => (
          <li key={point} className="flex gap-2 text-[10.5px] leading-[1.45] text-arch-text2">
            <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-arch-blue" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 border-t border-arch-border pt-2 text-[9.5px] font-medium leading-4 text-arch-amber">
        <span className="text-arch-text3">Recall:</span> {question.cue}
      </p>
    </article>
  );
}

function StoryCard({ story, number }: { story: StarMentalModel; number: number }) {
  const accent = storyAccents[story.storyKey] ?? storyAccents["contingency-management"];
  const evidence = story.nodes.find((node) => node.id === "evidence")?.detail;

  return (
    <article className={`flex min-h-0 flex-col rounded-xl border border-arch-border border-l-[3px] ${accent.border} bg-arch-bg2 p-3.5`}>
      <div className="flex items-start gap-2.5">
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${accent.bg} text-[9px] font-bold ${accent.text}`}>{number}</span>
        <div className="min-w-0">
          <h2 className="text-[12px] font-semibold leading-[1.35] text-arch-text">{story.storyTitle}</h2>
          <p className="mt-1 text-[9px] leading-4 text-arch-text3">{story.useFor}</p>
        </div>
      </div>
      <div className={`mt-2.5 rounded-lg ${accent.bg} px-2.5 py-2 text-[10px] font-semibold leading-4 ${accent.text}`}>
        {story.memoryCode}
      </div>
      <p className="mt-2.5 text-[10.5px] leading-[1.55] text-arch-text2">{story.answer30}</p>
      {evidence && (
        <div className="mt-auto pt-2.5">
          <p className="rounded-lg bg-arch-bg px-2.5 py-2 text-[9.5px] leading-[1.45] text-arch-green">
            <strong className="text-arch-text3">Result to land:</strong> {evidence}
          </p>
        </div>
      )}
    </article>
  );
}

export default function InterviewDayQuickPeek() {
  const [focusMode, setFocusMode] = useState(false);

  const printQuickPeek = () => {
    const finishPrinting = () => {
      delete document.body.dataset.printInterviewQuickPeek;
      window.removeEventListener("afterprint", finishPrinting);
    };

    document.body.dataset.printInterviewQuickPeek = "true";
    window.addEventListener("afterprint", finishPrinting, { once: true });
    window.print();
    window.setTimeout(finishPrinting, 1_000);
  };

  useEffect(() => {
    if (!focusMode) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusMode(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [focusMode]);

  return (
    <section
      data-interview-quick-peek
      className={focusMode
        ? "fixed inset-0 z-[100] overflow-y-auto bg-arch-bg p-4 lg:p-5"
        : "min-h-[calc(100vh-150px)]"
      }
    >
      <div className="mx-auto flex min-h-full max-w-[1500px] flex-col gap-2.5">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <div>
            <div className="mb-0.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-arch-coral">
              <span className="h-1.5 w-1.5 rounded-full bg-arch-coral" />
              Interview day
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-arch-text">Mastercard quick peek</h1>
            <p className="text-[10px] text-arch-text3">Technical product leadership · Payments and risk · Trusted digital commerce</p>
          </div>
          <div data-no-print className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={printQuickPeek}
              className="flex items-center gap-1.5 rounded-lg border border-arch-border bg-arch-bg2 px-2.5 py-2 text-[10px] font-semibold text-arch-text2 transition-colors hover:border-arch-blue/40 hover:text-arch-blue"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <button
              type="button"
              onClick={() => setFocusMode((current) => !current)}
              className="flex items-center gap-1.5 rounded-lg bg-arch-blue px-2.5 py-2 text-[10px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              {focusMode ? "Exit focus" : "Focus mode"}
            </button>
          </div>
        </header>

        <div className="grid shrink-0 grid-cols-1 gap-2.5 lg:grid-cols-3">
          {quickAnswers.map((question) => <AnswerCard key={question.key} question={question} />)}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="h-px flex-1 bg-arch-border" />
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-arch-text3">Three stories to reach for</span>
          <div className="h-px flex-1 bg-arch-border" />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 lg:grid-cols-3">
          {quickStories.map((story, index) => <StoryCard key={story.storyKey} story={story} number={index + 1} />)}
        </div>

        <footer className="grid shrink-0 gap-2 rounded-xl border border-arch-border bg-arch-bg2 px-3 py-2.5 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex items-start gap-2">
            <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-arch-green" />
            <p className="text-[9.5px] font-medium leading-4 text-arch-text2">
              <span className="text-arch-text">Listen</span> → answer the question → state my ownership → explain the decision → give the result → stop.
            </p>
          </div>
          <p className="text-[9.5px] leading-4 text-arch-text3 lg:text-right">
            Security/vendor: <span className="text-arch-coral">Aeroplan</span> · Discovery/root cause: <span className="text-arch-teal">Contingency</span> · Architecture/platform: <span className="text-arch-purple">Flow Runner</span> · Stakeholder conflict: <span className="text-arch-amber">Catalog backup</span>
          </p>
        </footer>
      </div>
    </section>
  );
}
