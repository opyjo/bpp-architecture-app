"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Grid2X2, Maximize2, Minimize2, Printer, Target } from "lucide-react";
import {
  behaviouralQuestions,
  coreQuestions,
  starMentalModels,
  type InterviewQuestion,
  type StarMentalModel,
} from "@/data/mastercard-prep";

const answerKeys = ["tell-me-about-yourself", "why-mastercard", "leaving-bell", "closing-value"];
const storyKeys = ["contingency-management", "aeroplan-integration", "flow-runner"];

const quickAnswers = answerKeys
  .map((key) => [...coreQuestions, ...behaviouralQuestions].find((question) => question.key === key))
  .filter((question): question is InterviewQuestion => Boolean(question));

const quickStories = storyKeys
  .map((key) => starMentalModels.find((story) => story.storyKey === key))
  .filter((story): story is StarMentalModel => Boolean(story));

interface CardAccent {
  border: string;
  text: string;
  bg: string;
  dot: string;
  active: string;
}

interface AnswerInterviewCard {
  id: string;
  kind: "answer";
  label: string;
  title: string;
  question: InterviewQuestion;
  accent: CardAccent;
}

interface StoryInterviewCard {
  id: string;
  kind: "story";
  label: string;
  title: string;
  story: StarMentalModel;
  accent: CardAccent;
}

type InterviewCard = AnswerInterviewCard | StoryInterviewCard;

const accents: CardAccent[] = [
  { border: "border-arch-blue", text: "text-arch-blue", bg: "bg-arch-blue/10", dot: "bg-arch-blue", active: "border-arch-blue bg-arch-blue/10" },
  { border: "border-arch-purple", text: "text-arch-purple", bg: "bg-arch-purple/10", dot: "bg-arch-purple", active: "border-arch-purple bg-arch-purple/10" },
  { border: "border-arch-teal", text: "text-arch-teal", bg: "bg-arch-teal/10", dot: "bg-arch-teal", active: "border-arch-teal bg-arch-teal/10" },
  { border: "border-arch-green", text: "text-arch-green", bg: "bg-arch-green/10", dot: "bg-arch-green", active: "border-arch-green bg-arch-green/10" },
  { border: "border-arch-coral", text: "text-arch-coral", bg: "bg-arch-coral/10", dot: "bg-arch-coral", active: "border-arch-coral bg-arch-coral/10" },
  { border: "border-arch-amber", text: "text-arch-amber", bg: "bg-arch-amber/10", dot: "bg-arch-amber", active: "border-arch-amber bg-arch-amber/10" },
  { border: "border-arch-gray", text: "text-arch-gray", bg: "bg-arch-gray/10", dot: "bg-arch-gray", active: "border-arch-gray bg-arch-gray/10" },
];

const interviewCards: InterviewCard[] = [
  ...quickAnswers.map((question, index): AnswerInterviewCard => ({
    id: question.key ?? `answer-${index}`,
    kind: "answer",
    label: "Core answer",
    title: question.question,
    question,
    accent: accents[index],
  })),
  ...quickStories.map((story, index): StoryInterviewCard => ({
    id: story.storyKey,
    kind: "story",
    label: "STAR story",
    title: story.storyTitle,
    story,
    accent: accents[index + quickAnswers.length],
  })),
];

const PROMPTER_KEYWORDS = [
  "zero post-launch integration regressions",
  "features, user stories, and acceptance criteria",
  "discovery, prioritisation, technical delivery, and cross-functional execution",
  "trust, onboarding, fraud prevention, and compliance",
  "technical product leadership",
  "first-hand payments-risk experience",
  "controls and accounting discipline",
  "engineering-ready requirements",
  "secure, measurable production outcome",
  "clear product decisions",
  "secure API contracts",
  "measurable launches",
  "greater clarity and confidence",
  "collaborative working style",
  "customer and risk outcomes",
  "trade-offs and dependencies",
  "curiosity and humility",
  "complex microservices platform",
  "payments-risk operations",
  "accuracy and auditability",
  "secure, measurable delivery",
  "pull toward a specific opportunity",
  "payments and trust domain",
  "fit and impact",
  "Senior Technical Product Manager",
  "more than 60 microservices",
  "60+ microservices",
  "Go-based backend",
  "Go backend",
  "Next.js micro-frontend",
  "Next.js microfrontend",
  "product strategy",
  "technical requirements",
  "cross-functional teams",
  "cross-functional execution",
  "API contracts",
  "launch validation",
  "external partners",
  "post-launch reviews",
  "edge cases",
  "Business Identity",
  "fraud prevention",
  "global scale",
  "Visa and Mastercard",
  "Visa/Mastercard",
  "chargeback and card-issuance",
  "chargebacks and card-launch operations",
  "technical product craft",
  "digital trust",
  "safer onboarding",
  "lower fraud",
  "trusted digital commerce",
  "technical product ownership",
  "payments-risk experience",
  "controls discipline",
  "measurable outcomes",
  "root cause",
  "invalid address data",
  "correct the address and resubmit",
  "automatic resubmission",
  "API-boundary validation",
  "audit logging",
  "engineering escalation",
  "manual reprocessing",
  "one-time token exchange",
  "token exchange",
  "URL query parameters",
  "privacy and fraud risk",
  "Token API",
  "one-time UUID",
  "OpenAPI contract",
  "OpenAPI-generated TypeScript types",
  "compile-time quality gate",
  "two contract mismatches",
  "UAT",
  "duplicated logic",
  "inconsistent outcomes",
  "central execution service",
  "rule ownership",
  "declarative JSON flows",
  "execute endpoint",
  "legacy and new formats",
  "real catalog data",
  "behavioural parity",
  "one execution point",
  "fewer deployments",
  "reusable engine",
  "seven-plus years",
  "over seven years",
  "7+ years",
  "CPA and ACCA",
  "Mastercard",
  "Bell",
] as const;

const prompterKeywordSet = new Set<string>(PROMPTER_KEYWORDS.map((keyword) => keyword.toLowerCase()));
const prompterKeywordPattern = new RegExp(
  `(${[...PROMPTER_KEYWORDS]
    .sort((left, right) => right.length - left.length)
    .map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})`,
  "gi",
);

function HighlightedText({ text }: { text: string }) {
  return <>{text.split(prompterKeywordPattern).map((part, index) => (
    prompterKeywordSet.has(part.toLowerCase())
      ? <mark key={`${part}-${index}`} className="box-decoration-clone rounded-sm bg-arch-amber/20 px-0.5 font-semibold text-arch-text ring-1 ring-arch-amber/15">{part}</mark>
      : part
  ))}</>;
}

function SummaryCard({ card, number, onOpen }: { card: InterviewCard; number: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open full version of ${card.title}`}
      className={`group flex h-full flex-col rounded-xl border border-arch-border border-t-[3px] ${card.accent.border} bg-arch-bg2 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-arch-border2 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-arch-blue/50`}
    >
      <div className="mb-3 flex items-start gap-3">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${card.accent.bg} text-xs font-bold ${card.accent.text}`}>{number}</span>
        <div className="min-w-0">
          <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${card.accent.text}`}>{card.label}</span>
          <h2 className="mt-1 text-[15px] font-semibold leading-5 text-arch-text">{card.title}</h2>
        </div>
      </div>

      {card.kind === "answer" ? (
        <ul className="space-y-2">
          {card.question.quickPeek?.map((point) => (
            <li key={point} className="flex gap-2.5 text-[12.5px] leading-[1.55] text-arch-text2">
              <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${card.accent.dot}`} />
              <span><HighlightedText text={point} /></span>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className={`mb-3 rounded-lg ${card.accent.bg} px-3 py-2.5 text-[11.5px] font-semibold leading-5 ${card.accent.text}`}>{card.story.memoryCode}</div>
          <p className="text-[12.5px] leading-[1.65] text-arch-text2"><HighlightedText text={card.story.answer30} /></p>
        </>
      )}

      <div className={`mt-auto flex items-center justify-end gap-1.5 pt-4 text-[11px] font-semibold ${card.accent.text}`}>
        Read full version <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function CardNavigator({ selectedIndex, onSelect }: { selectedIndex: number; onSelect: (index: number) => void }) {
  return (
    <nav data-no-print aria-label="Interview card navigation" className="sticky top-0 z-20 -mx-1 overflow-x-auto bg-arch-bg/95 px-1 py-2 backdrop-blur">
      <div className="flex min-w-max gap-2">
        {interviewCards.map((card, index) => {
          const selected = index === selectedIndex;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(index)}
              aria-current={selected ? "page" : undefined}
              className={`flex w-[165px] items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors ${selected ? card.accent.active : "border-arch-border bg-arch-bg2 hover:border-arch-border2"}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${selected ? card.accent.bg : "bg-arch-bg3"} text-[9px] font-bold ${selected ? card.accent.text : "text-arch-text3"}`}>{index + 1}</span>
              <span className={`line-clamp-2 text-[10.5px] font-semibold leading-4 ${selected ? "text-arch-text" : "text-arch-text2"}`}>{card.title}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function FullAnswer({ card }: { card: AnswerInterviewCard }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.7fr)]">
      <article className={`rounded-2xl border border-arch-border border-t-[4px] ${card.accent.border} bg-arch-bg2 p-5 sm:p-7`}>
        <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${card.accent.text}`}>Complete answer</span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-arch-text">{card.title}</h1>
        <div className="mt-5 space-y-4">
          {card.question.answer.split("\n\n").map((paragraph) => (
            <p key={paragraph} className="text-[15px] leading-7 text-arch-text2 sm:text-base sm:leading-8"><HighlightedText text={paragraph} /></p>
          ))}
        </div>
      </article>

      <aside className="space-y-3 xl:sticky xl:top-[86px]">
        <section className="rounded-xl border border-arch-border bg-arch-bg2 p-4">
          <h2 className="text-sm font-semibold text-arch-text">Quick memory guide</h2>
          <ul className="mt-3 space-y-2.5">
            {card.question.quickPeek?.map((point) => (
              <li key={point} className="flex gap-2.5 text-[13px] leading-5 text-arch-text2">
                <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${card.accent.dot}`} />
                <span><HighlightedText text={point} /></span>
              </li>
            ))}
          </ul>
        </section>
        <section className={`rounded-xl ${card.accent.bg} p-4`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-arch-text3">Recall cue</div>
          <p className={`mt-1.5 text-[13px] font-semibold leading-5 ${card.accent.text}`}><HighlightedText text={card.question.cue} /></p>
        </section>
      </aside>
    </div>
  );
}

function FullStory({ card }: { card: StoryInterviewCard }) {
  return (
    <div className="space-y-5">
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.7fr)]">
        <article className={`rounded-2xl border border-arch-border border-t-[4px] ${card.accent.border} bg-arch-bg2 p-5 sm:p-7`}>
          <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${card.accent.text}`}>Complete 90-second story</span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-arch-text">{card.title}</h1>
          <p className="mt-5 text-[15px] leading-7 text-arch-text2 sm:text-base sm:leading-8"><HighlightedText text={card.story.answer90} /></p>
        </article>

        <aside className="space-y-3 xl:sticky xl:top-[86px]">
          <section className={`rounded-xl ${card.accent.bg} p-4`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-arch-text3">Memory path</div>
            <p className={`mt-1.5 text-sm font-semibold leading-6 ${card.accent.text}`}><HighlightedText text={card.story.memoryCode} /></p>
          </section>
          <section className="rounded-xl border border-arch-border bg-arch-bg2 p-4">
            <h2 className="text-sm font-semibold text-arch-text">30-second version</h2>
            <p className="mt-2 text-[13px] leading-6 text-arch-text2"><HighlightedText text={card.story.answer30} /></p>
          </section>
          <section className="rounded-xl border border-arch-border bg-arch-bg2 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-arch-text3">Best used for</div>
            <p className="mt-1.5 text-[13px] leading-5 text-arch-text2"><HighlightedText text={card.story.useFor} /></p>
          </section>
        </aside>
      </div>

      <section className="rounded-2xl border border-arch-border bg-arch-bg2 p-5 sm:p-6">
        <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${card.accent.text}`}>Story walkthrough</span>
        <h2 className="mt-1 text-lg font-semibold text-arch-text">The complete sequence behind the answer</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {card.story.nodes.map((node, index) => (
            <article key={node.id} className="rounded-xl border border-arch-border bg-arch-bg p-4">
              <div className="flex items-center gap-2">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${card.accent.bg} text-[9px] font-bold ${card.accent.text}`}>{index + 1}</span>
                <h3 className="text-[12px] font-semibold text-arch-text">{node.label}</h3>
              </div>
              <p className="mt-2 text-[12.5px] leading-5 text-arch-text2"><HighlightedText text={node.detail} /></p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function BottomPager({ selectedIndex, onSelect }: { selectedIndex: number; onSelect: (index: number) => void }) {
  const previousIndex = (selectedIndex - 1 + interviewCards.length) % interviewCards.length;
  const nextIndex = (selectedIndex + 1) % interviewCards.length;

  return (
    <div data-no-print className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => onSelect(previousIndex)} className="group rounded-xl border border-arch-border bg-arch-bg2 p-4 text-left transition-colors hover:border-arch-blue/40">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-arch-text3"><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Previous</span>
        <span className="mt-1.5 block text-sm font-semibold text-arch-text group-hover:text-arch-blue">{interviewCards[previousIndex].title}</span>
      </button>
      <button type="button" onClick={() => onSelect(nextIndex)} className="group rounded-xl border border-arch-border bg-arch-bg2 p-4 text-right transition-colors hover:border-arch-blue/40">
        <span className="flex items-center justify-end gap-1.5 text-[10px] font-bold uppercase tracking-wider text-arch-text3">Next <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></span>
        <span className="mt-1.5 block text-sm font-semibold text-arch-text group-hover:text-arch-blue">{interviewCards[nextIndex].title}</span>
      </button>
    </div>
  );
}

export default function InterviewDayQuickPeek() {
  const [focusMode, setFocusMode] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const scrollToTop = () => {
    window.requestAnimationFrame(() => {
      if (focusMode) sectionRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      else sectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

  const selectCard = (index: number) => {
    setSelectedCardIndex(index);
    scrollToTop();
  };

  const showOverview = () => {
    setSelectedCardIndex(null);
    scrollToTop();
  };

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
    const bodyWasLocked = document.body.classList.contains("overflow-hidden");
    if (focusMode && !bodyWasLocked) document.body.classList.add("overflow-hidden");

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;

      const resetCardPosition = () => {
        window.requestAnimationFrame(() => {
          if (focusMode) sectionRef.current?.scrollTo({ top: 0 });
          else sectionRef.current?.scrollIntoView({ block: "start" });
        });
      };

      if (event.key === "Escape") {
        if (selectedCardIndex !== null) setSelectedCardIndex(null);
        else if (focusMode) setFocusMode(false);
        resetCardPosition();
        return;
      }

      const numericIndex = Number(event.key) - 1;
      if (numericIndex >= 0 && numericIndex < interviewCards.length) {
        setSelectedCardIndex(numericIndex);
        resetCardPosition();
        return;
      }

      if (selectedCardIndex === null) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSelectedCardIndex((selectedCardIndex - 1 + interviewCards.length) % interviewCards.length);
        resetCardPosition();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setSelectedCardIndex((selectedCardIndex + 1) % interviewCards.length);
        resetCardPosition();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      if (focusMode && !bodyWasLocked) document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [focusMode, selectedCardIndex]);

  const selectedCard = selectedCardIndex === null ? null : interviewCards[selectedCardIndex];

  return (
    <section ref={sectionRef} data-interview-quick-peek className={focusMode ? "fixed inset-0 z-[100] overflow-y-auto bg-arch-bg p-4 lg:p-6" : "min-h-[calc(100vh-150px)]"}>
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-arch-coral"><span className="h-1.5 w-1.5 rounded-full bg-arch-coral" /> Interview day</div>
            <h1 className="text-xl font-semibold tracking-tight text-arch-text">Mastercard quick peek</h1>
            <p className="mt-1 text-xs text-arch-text3">Choose a card for the complete, easy-to-read version.</p>
          </div>
          <div data-no-print className="flex flex-wrap items-center gap-2">
            {selectedCard && (
              <button type="button" onClick={showOverview} className="flex items-center gap-1.5 rounded-lg border border-arch-border bg-arch-bg2 px-3 py-2 text-xs font-semibold text-arch-text2 transition-colors hover:border-arch-blue/40 hover:text-arch-blue"><Grid2X2 aria-hidden="true" className="h-4 w-4" /> All cards</button>
            )}
            <button type="button" onClick={printQuickPeek} className="flex items-center gap-1.5 rounded-lg border border-arch-border bg-arch-bg2 px-3 py-2 text-xs font-semibold text-arch-text2 transition-colors hover:border-arch-blue/40 hover:text-arch-blue"><Printer aria-hidden="true" className="h-4 w-4" /> Print</button>
            <button type="button" onClick={() => setFocusMode((current) => !current)} className="flex items-center gap-1.5 rounded-lg bg-arch-blue px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90">
              {focusMode ? <Minimize2 aria-hidden="true" className="h-4 w-4" /> : <Maximize2 aria-hidden="true" className="h-4 w-4" />}{focusMode ? "Exit focus" : "Focus mode"}
            </button>
          </div>
        </header>

        {selectedCard && selectedCardIndex !== null ? (
          <>
            <CardNavigator selectedIndex={selectedCardIndex} onSelect={selectCard} />
            <div className="flex items-center justify-between gap-3 text-xs text-arch-text3">
              <button data-no-print type="button" onClick={showOverview} className="flex items-center gap-1.5 font-semibold text-arch-blue hover:underline"><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Back to overview</button>
              <span>Card {selectedCardIndex + 1} of {interviewCards.length}</span>
            </div>
            {selectedCard.kind === "answer" ? <FullAnswer card={selectedCard} /> : <FullStory card={selectedCard} />}
            <BottomPager selectedIndex={selectedCardIndex} onSelect={selectCard} />
            <p data-no-print className="text-center text-[11px] text-arch-text3">Use ← and → to move between cards · Press 1–7 to jump directly · Esc returns to the overview</p>
          </>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              {interviewCards.map((card, index) => <SummaryCard key={card.id} card={card} number={index + 1} onOpen={() => selectCard(index)} />)}
            </div>
            <footer className="grid gap-3 rounded-xl border border-arch-border bg-arch-bg2 px-4 py-3 lg:grid-cols-[1.1fr_1fr]">
              <div className="flex items-start gap-2"><Target aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-arch-green" /><p className="text-xs font-medium leading-5 text-arch-text2"><span className="text-arch-text">Listen</span> → answer the question → state my ownership → explain the decision → give the result → stop.</p></div>
              <p className="text-xs leading-5 text-arch-text3 lg:text-right">Security/vendor: <span className="text-arch-coral">Aeroplan</span> · Discovery: <span className="text-arch-green">Contingency</span> · Architecture: <span className="text-arch-amber">Flow Runner</span> · Stakeholder conflict: <span className="text-arch-purple">Catalog backup</span></p>
            </footer>
          </>
        )}
      </div>
    </section>
  );
}
