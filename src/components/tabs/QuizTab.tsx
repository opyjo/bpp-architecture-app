"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Brain,
  Sparkles,
  RotateCcw,
  Eye,
  Keyboard,
  CheckCircle2,
  Layers,
  GraduationCap,
  Lightbulb,
  Flame,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { quizCards, type QuizCard } from "@/data/quiz";

// ─── SRS types & storage ─────────────────────────────────────────────────────

interface SrsEntry {
  ease: number;
  intervalDays: number;
  dueTs: number;
  reps: number;
}

type SrsState = Record<string, SrsEntry>;

const SRS_KEY = "quiz-srs";
const DAY_MS = 24 * 60 * 60 * 1000;

type Grade = "again" | "hard" | "good" | "easy";

function loadSrs(): SrsState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SRS_KEY);
    return raw ? (JSON.parse(raw) as SrsState) : {};
  } catch {
    return {};
  }
}

function saveSrs(state: SrsState): void {
  try {
    window.localStorage.setItem(SRS_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/** SM-2-lite scheduler. */
function schedule(prev: SrsEntry | undefined, grade: Grade): SrsEntry {
  const now = Date.now();
  const base: SrsEntry = prev ?? {
    ease: 2.5,
    intervalDays: 0,
    dueTs: now,
    reps: 0,
  };

  let { ease, intervalDays, reps } = base;

  switch (grade) {
    case "again":
      ease = Math.max(1.3, ease - 0.2);
      intervalDays = 0; // due again very soon (~10 min)
      reps = 0;
      return { ease, intervalDays, reps, dueTs: now + 10 * 60 * 1000 };
    case "hard":
      ease = Math.max(1.3, ease - 0.15);
      intervalDays = intervalDays < 1 ? 1 : intervalDays * 1.2;
      break;
    case "good":
      intervalDays =
        reps === 0 ? 1 : intervalDays < 1 ? 3 : intervalDays * ease;
      break;
    case "easy":
      ease = ease + 0.15;
      intervalDays =
        reps === 0 ? 3 : intervalDays < 1 ? 5 : intervalDays * ease * 1.3;
      break;
  }

  reps += 1;
  intervalDays = Math.round(intervalDays * 10) / 10;
  return { ease, intervalDays, reps, dueTs: now + intervalDays * DAY_MS };
}

// ─── Category theming ────────────────────────────────────────────────────────

interface CategoryTheme {
  text: string;
  bg: string;
  border: string;
  ring: string;
  dot: string;
}

const CATEGORY_THEME: Record<string, CategoryTheme> = {
  Architecture: {
    text: "text-arch-purple",
    bg: "bg-arch-purple/10",
    border: "border-arch-purple/30",
    ring: "ring-arch-purple/40",
    dot: "bg-arch-purple",
  },
  Services: {
    text: "text-arch-amber",
    bg: "bg-arch-amber/10",
    border: "border-arch-amber/30",
    ring: "ring-arch-amber/40",
    dot: "bg-arch-amber",
  },
  Events: {
    text: "text-arch-blue",
    bg: "bg-arch-blue/10",
    border: "border-arch-blue/30",
    ring: "ring-arch-blue/40",
    dot: "bg-arch-blue",
  },
  Patterns: {
    text: "text-arch-teal",
    bg: "bg-arch-teal/10",
    border: "border-arch-teal/30",
    ring: "ring-arch-teal/40",
    dot: "bg-arch-teal",
  },
  API: {
    text: "text-arch-green",
    bg: "bg-arch-green/10",
    border: "border-arch-green/30",
    ring: "ring-arch-green/40",
    dot: "bg-arch-green",
  },
  BSA: {
    text: "text-arch-coral",
    bg: "bg-arch-coral/10",
    border: "border-arch-coral/30",
    ring: "ring-arch-coral/40",
    dot: "bg-arch-coral",
  },
};

const FALLBACK_THEME: CategoryTheme = {
  text: "text-arch-text",
  bg: "bg-arch-bg3",
  border: "border-arch-border",
  ring: "ring-arch-border",
  dot: "bg-arch-text3",
};

function themeFor(category: string): CategoryTheme {
  return CATEGORY_THEME[category] ?? FALLBACK_THEME;
}

const CATEGORIES = ["All", "Architecture", "Services", "Events", "Patterns", "API", "BSA"];

// ─── Deck stage classification ───────────────────────────────────────────────

type Stage = "new" | "learning" | "mastered";

function stageOf(entry: SrsEntry | undefined): Stage {
  if (!entry || entry.reps === 0) return "new";
  if (entry.intervalDays >= 21 && entry.reps >= 3) return "mastered";
  return "learning";
}

// ─── Grade button config ─────────────────────────────────────────────────────

const GRADE_BUTTONS: {
  grade: Grade;
  label: string;
  key: string;
  classes: string;
  hint: string;
}[] = [
  {
    grade: "again",
    label: "Again",
    key: "1",
    classes:
      "bg-arch-red/10 text-arch-red border-arch-red/30 hover:bg-arch-red/20",
    hint: "< 10 min",
  },
  {
    grade: "hard",
    label: "Hard",
    key: "2",
    classes:
      "bg-arch-amber/10 text-arch-amber border-arch-amber/30 hover:bg-arch-amber/20",
    hint: "short",
  },
  {
    grade: "good",
    label: "Good",
    key: "3",
    classes:
      "bg-arch-blue/10 text-arch-blue border-arch-blue/30 hover:bg-arch-blue/20",
    hint: "grow",
  },
  {
    grade: "easy",
    label: "Easy",
    key: "4",
    classes:
      "bg-arch-green/10 text-arch-green border-arch-green/30 hover:bg-arch-green/20",
    hint: "grow+",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function QuizTab() {
  const [srs, setSrs] = useState<SrsState>({});
  const [hydrated, setHydrated] = useState(false);
  const [category, setCategory] = useState<string>("All");
  const [revealed, setRevealed] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [sessionReviewed, setSessionReviewed] = useState(0);
  // "now" snapshot lives in state so render stays pure; refreshed on mount
  // and after each grade so newly-scheduled cards leave the due queue.
  const [nowTs, setNowTs] = useState(0);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setSrs(loadSrs());
      setNowTs(Date.now());
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCards = useMemo(
    () =>
      category === "All"
        ? quizCards
        : quizCards.filter((c) => c.category === category),
    [category]
  );

  // Build the study queue: due cards first (by dueTs), then unseen, then the rest.
  const queue = useMemo(() => {
    if (!hydrated) return [];
    const now = nowTs;
    const withMeta = filteredCards.map((card) => {
      const entry = srs[card.id];
      const due = !entry || entry.dueTs <= now;
      return { card, entry, due, dueTs: entry?.dueTs ?? 0 };
    });
    const due = withMeta
      .filter((m) => m.due)
      .sort((a, b) => {
        // brand-new (no entry) first, then earliest due
        const aNew = a.entry ? 0 : 1;
        const bNew = b.entry ? 0 : 1;
        if (aNew !== bNew) return bNew - aNew;
        return a.dueTs - b.dueTs;
      });
    return due.map((m) => m.card);
  }, [filteredCards, srs, hydrated, nowTs]);

  const dueCount = queue.length;

  // Pick the active card: keep currentId if still due, else head of queue.
  const currentCard: QuizCard | null = useMemo(() => {
    if (currentId) {
      const stillQueued = queue.find((c) => c.id === currentId);
      if (stillQueued) return stillQueued;
    }
    return queue[0] ?? null;
  }, [queue, currentId]);

  useEffect(() => {
    if (currentCard && currentCard.id !== currentId) {
      const id = requestAnimationFrame(() => {
        setCurrentId(currentCard.id);
        setRevealed(false);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [currentCard, currentId]);

  // Deck progress counts (across the filtered set).
  const counts = useMemo(() => {
    let neu = 0;
    let learning = 0;
    let mastered = 0;
    for (const c of filteredCards) {
      const stage = stageOf(srs[c.id]);
      if (stage === "new") neu++;
      else if (stage === "learning") learning++;
      else mastered++;
    }
    return { neu, learning, mastered, total: filteredCards.length };
  }, [filteredCards, srs]);

  const handleReveal = useCallback(() => setRevealed(true), []);

  const handleGrade = useCallback(
    (grade: Grade) => {
      if (!currentCard || !revealed) return;
      setSrs((prev) => {
        const next = { ...prev, [currentCard.id]: schedule(prev[currentCard.id], grade) };
        saveSrs(next);
        return next;
      });
      setSessionReviewed((n) => n + 1);
      setRevealed(false);
      setCurrentId(null); // force re-pick from queue
      setNowTs(Date.now()); // advance clock so the graded card leaves the queue
    },
    [currentCard, revealed]
  );

  const handleReset = useCallback(() => {
    setSrs({});
    saveSrs({});
    setSessionReviewed(0);
    setRevealed(false);
    setCurrentId(null);
    setNowTs(Date.now());
    setConfirmReset(false);
  }, []);

  // Keyboard shortcuts: Space = reveal, 1-4 = grade.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (confirmReset) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA"))
        return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!revealed) handleReveal();
        return;
      }
      if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        const map: Record<string, Grade> = {
          "1": "again",
          "2": "hard",
          "3": "good",
          "4": "easy",
        };
        handleGrade(map[e.key]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, handleReveal, handleGrade, confirmReset]);

  const theme = currentCard ? themeFor(currentCard.category) : FALLBACK_THEME;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-arch-purple/10 p-2.5 ring-1 ring-arch-purple/30">
            <Brain className="size-6 text-arch-purple" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-arch-text">
              Active Recall
            </h1>
            <p className="mt-0.5 text-sm text-arch-text3">
              Spaced-repetition flashcards for the Subscription Manager platform & BSA prep.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
              dueCount > 0
                ? "border-arch-blue/30 bg-arch-blue/10 text-arch-blue"
                : "border-arch-green/30 bg-arch-green/10 text-arch-green"
            )}
          >
            <Flame className="size-4" />
            {dueCount > 0 ? `${dueCount} due today` : "All caught up"}
          </div>
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 rounded-xl border border-arch-border bg-arch-bg3 px-3 py-2 text-sm font-medium text-arch-text3 transition-colors hover:border-arch-red/40 hover:text-arch-red"
          >
            <RotateCcw className="size-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          const t = cat === "All" ? FALLBACK_THEME : themeFor(cat);
          return (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setCurrentId(null);
                setRevealed(false);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-all",
                active
                  ? cn(t.bg, t.text, t.border, "ring-1", t.ring)
                  : "border-arch-border bg-arch-bg2 text-arch-text3 hover:text-arch-text"
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
        {/* ─── Flashcard column ─── */}
        <div>
          {!hydrated ? (
            <div className="flex h-80 items-center justify-center rounded-xl border border-arch-border bg-arch-bg2 text-sm text-arch-text3">
              Loading deck…
            </div>
          ) : currentCard ? (
            <div className="flex flex-col gap-4">
              <Flashcard
                key={currentCard.id}
                card={currentCard}
                revealed={revealed}
                onReveal={handleReveal}
                theme={theme}
              />

              {/* Grade buttons */}
              {revealed ? (
                <div className="grid grid-cols-4 gap-2">
                  {GRADE_BUTTONS.map((b) => (
                    <button
                      key={b.grade}
                      onClick={() => handleGrade(b.grade)}
                      className={cn(
                        "group flex flex-col items-center gap-0.5 rounded-xl border py-2.5 text-sm font-semibold transition-all active:translate-y-px",
                        b.classes
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <kbd className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold dark:bg-white/10">
                          {b.key}
                        </kbd>
                        {b.label}
                      </span>
                      <span className="text-[10px] font-normal opacity-70">
                        {b.hint}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={handleReveal}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-arch-blue/30 bg-arch-blue/10 py-3 text-sm font-semibold text-arch-blue transition-all hover:bg-arch-blue/20 active:translate-y-px"
                >
                  <Eye className="size-4" />
                  Show answer
                  <kbd className="rounded bg-arch-blue/20 px-1.5 py-0.5 text-[10px] font-bold">
                    Space
                  </kbd>
                </button>
              )}

              {/* Shortcut hint */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-arch-text3">
                <Keyboard className="size-3.5" />
                <span>
                  <kbd className="rounded bg-arch-bg3 px-1 font-semibold">Space</kbd> reveal ·{" "}
                  <kbd className="rounded bg-arch-bg3 px-1 font-semibold">1-4</kbd> rate ·{" "}
                  reviewed <span className="font-semibold text-arch-text2">{sessionReviewed}</span> this session
                </span>
              </div>
            </div>
          ) : (
            <CaughtUp category={category} reviewed={sessionReviewed} />
          )}
        </div>

        {/* ─── Deck / progress panel ─── */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-arch-border bg-arch-bg2 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-arch-text3">
              <Layers className="size-3.5" />
              Deck progress
            </div>

            <ProgressRow
              icon={<Sparkles className="size-4 text-arch-blue" />}
              label="New"
              value={counts.neu}
              total={counts.total}
              bar="bg-arch-blue"
            />
            <ProgressRow
              icon={<Brain className="size-4 text-arch-amber" />}
              label="Learning"
              value={counts.learning}
              total={counts.total}
              bar="bg-arch-amber"
            />
            <ProgressRow
              icon={<GraduationCap className="size-4 text-arch-green" />}
              label="Mastered"
              value={counts.mastered}
              total={counts.total}
              bar="bg-arch-green"
            />

            <div className="mt-3 border-t border-arch-border pt-3 text-[11px] text-arch-text3">
              {counts.total} cards in{" "}
              <span className="font-medium text-arch-text2">
                {category === "All" ? "all categories" : category}
              </span>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="rounded-xl border border-arch-border bg-arch-bg2 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-arch-text3">
              By category
            </div>
            <div className="flex flex-col gap-2">
              {CATEGORIES.filter((c) => c !== "All").map((cat) => {
                const t = themeFor(cat);
                const total = quizCards.filter((c) => c.category === cat).length;
                const due = quizCards.filter(
                  (c) => c.category === cat && (!srs[c.id] || srs[c.id].dueTs <= nowTs)
                ).length;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      setCurrentId(null);
                      setRevealed(false);
                    }}
                    className="flex items-center justify-between rounded-lg px-2 py-1 text-xs transition-colors hover:bg-arch-bg3"
                  >
                    <span className="flex items-center gap-2 text-arch-text2">
                      <span className={cn("size-2 rounded-full", t.dot)} />
                      {cat}
                    </span>
                    <span className="flex items-center gap-1.5 text-arch-text3">
                      {hydrated && due > 0 && (
                        <span className={cn("rounded px-1.5 font-semibold", t.bg, t.text)}>
                          {due}
                        </span>
                      )}
                      <span>{total}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all progress?"
        message="This clears your spaced-repetition schedule and review history for every card. This cannot be undone."
        confirmLabel="Reset progress"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

// ─── Flashcard ───────────────────────────────────────────────────────────────

function Flashcard({
  card,
  revealed,
  onReveal,
  theme,
}: {
  card: QuizCard;
  revealed: boolean;
  onReveal: () => void;
  theme: CategoryTheme;
}) {
  return (
    <div
      onClick={() => !revealed && onReveal()}
      className={cn(
        "relative min-h-[18rem] overflow-hidden rounded-2xl border bg-arch-bg2 p-6 transition-all duration-300",
        theme.border,
        !revealed && "cursor-pointer hover:-translate-y-0.5"
      )}
    >
      {/* accent glow */}
      <div
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-20 blur-3xl",
          theme.dot
        )}
      />

      {/* Category badge */}
      <div className="mb-4 flex items-center justify-between">
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
            theme.bg,
            theme.text,
            theme.border
          )}
        >
          {card.category}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-arch-text3">
          {revealed ? "Answer" : "Question"}
        </span>
      </div>

      {/* Question (always shown) */}
      <p className="relative text-lg font-medium leading-relaxed text-arch-text">
        {card.question}
      </p>

      {/* Hint when not revealed */}
      {!revealed && card.hint && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-arch-border bg-arch-bg3 px-3 py-2 text-xs text-arch-text3">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-arch-amber" />
          <span>{card.hint}</span>
        </div>
      )}

      {/* Answer reveal */}
      {revealed && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="my-4 flex items-center gap-2">
            <div className={cn("h-px flex-1", theme.bg)} />
            <ArrowRight className={cn("size-4", theme.text)} />
            <div className={cn("h-px flex-1", theme.bg)} />
          </div>
          <p className="text-[15px] leading-relaxed text-arch-text2">
            {card.answer}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Progress row ────────────────────────────────────────────────────────────

function ProgressRow({
  icon,
  label,
  value,
  total,
  bar,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  bar: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-arch-text2">
          {icon}
          {label}
        </span>
        <span className="font-semibold text-arch-text">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-arch-bg3">
        <div
          className={cn("h-full rounded-full transition-all duration-500", bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Caught-up state ─────────────────────────────────────────────────────────

function CaughtUp({ category, reviewed }: { category: string; reviewed: number }) {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-2xl border border-arch-green/30 bg-arch-green/5 p-8 text-center">
      <div className="mb-4 rounded-2xl bg-arch-green/10 p-4 ring-1 ring-arch-green/30">
        <CheckCircle2 className="size-10 text-arch-green" />
      </div>
      <h2 className="font-heading text-lg font-semibold text-arch-text">
        You&apos;re caught up!
      </h2>
      <p className="mt-1 max-w-sm text-sm text-arch-text3">
        No cards are due
        {category !== "All" ? ` in ${category}` : ""} right now.
        {reviewed > 0 && (
          <>
            {" "}
            You reviewed{" "}
            <span className="font-semibold text-arch-green">{reviewed}</span>{" "}
            card{reviewed === 1 ? "" : "s"} this session.
          </>
        )}{" "}
        Switch categories or come back later — the schedule will resurface cards as they fall due.
      </p>
    </div>
  );
}
