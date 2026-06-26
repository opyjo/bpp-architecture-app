"use client";

import { useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  Eye,
  EyeOff,
  Target,
  CornerDownRight,
  ListChecks,
  X,
} from "lucide-react";
import {
  mockSections,
  mockQuestions,
  type MockQA,
  type MockCategory,
} from "@/data/mock-interview";

// ─── Accent helpers (full literal classes so Tailwind keeps them) ─────────────

type Accent = "blue" | "purple" | "teal" | "amber" | "green" | "coral" | "red";

const accentMap: Record<
  Accent,
  { text: string; bg: string; border: string; dot: string; ring: string }
> = {
  blue: { text: "text-arch-blue", bg: "bg-arch-blue/10", border: "border-arch-blue/25", dot: "bg-arch-blue", ring: "ring-arch-blue/30" },
  purple: { text: "text-arch-purple", bg: "bg-arch-purple/10", border: "border-arch-purple/25", dot: "bg-arch-purple", ring: "ring-arch-purple/30" },
  teal: { text: "text-arch-teal", bg: "bg-arch-teal/10", border: "border-arch-teal/25", dot: "bg-arch-teal", ring: "ring-arch-teal/30" },
  amber: { text: "text-arch-amber", bg: "bg-arch-amber/10", border: "border-arch-amber/25", dot: "bg-arch-amber", ring: "ring-arch-amber/30" },
  green: { text: "text-arch-green", bg: "bg-arch-green/10", border: "border-arch-green/25", dot: "bg-arch-green", ring: "ring-arch-green/30" },
  coral: { text: "text-arch-coral", bg: "bg-arch-coral/10", border: "border-arch-coral/25", dot: "bg-arch-coral", ring: "ring-arch-coral/30" },
  red: { text: "text-arch-red", bg: "bg-arch-red/10", border: "border-arch-red/25", dot: "bg-arch-red", ring: "ring-arch-red/30" },
};

const accentForCategory: Record<MockCategory, Accent> = Object.fromEntries(
  mockSections.map((s) => [s.category, s.accent])
) as Record<MockCategory, Accent>;

// ─── Accordion item ───────────────────────────────────────────────────────────

function QAItem({
  qa,
  open,
  onToggle,
  hideProbe,
}: {
  qa: MockQA;
  open: boolean;
  onToggle: () => void;
  hideProbe: boolean;
}) {
  const accent = accentMap[accentForCategory[qa.category]];
  const isPanel = qa.category === "Questions for the Panel";

  return (
    <div
      className={`rounded-xl border bg-arch-bg2 transition-all duration-200 ${
        open ? `${accent.border} shadow-sm` : "border-arch-border hover:border-arch-border2"
      }`}
    >
      {/* Header / trigger */}
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left select-none"
        aria-expanded={open}
      >
        {/* Number chip */}
        <span
          className={`mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1.5 text-[11px] font-bold ${accent.bg} ${accent.text}`}
        >
          {qa.num ?? "Q"}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium leading-snug text-arch-text">
            {qa.question}
          </span>

          {/* Story reach chips (collapsed preview) */}
          {qa.stories && qa.stories.length > 0 && (
            <span className="mt-1.5 flex flex-wrap gap-1">
              {qa.stories.map((s) => (
                <span
                  key={s}
                  className={`inline-flex items-center rounded-full border px-1.5 py-px text-[9.5px] font-medium ${accent.border} ${accent.bg} ${accent.text}`}
                >
                  {s}
                </span>
              ))}
            </span>
          )}
        </span>

        <ChevronDown
          className={`mt-1 size-4 shrink-0 text-arch-text3 transition-transform duration-250 ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>

      {/* Body */}
      <div
        className="grid overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pb-4 pt-0.5">
            {/* Probe line (cover-first practice) */}
            <div
              className={`relative rounded-lg border px-3 py-2.5 ${accent.border} ${accent.bg}`}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <Target className={`size-3 ${accent.text}`} />
                <span
                  className={`text-[9.5px] font-semibold uppercase tracking-wider ${accent.text}`}
                >
                  {isPanel ? "Why ask it" : "What they're probing"}
                </span>
              </div>
              <p
                className={`text-[11.5px] italic leading-relaxed text-arch-text2 transition-all ${
                  hideProbe ? "select-none blur-[5px]" : "blur-0"
                }`}
              >
                {qa.probe}
              </p>
              {hideProbe && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-medium uppercase tracking-wider text-arch-text3">
                  hidden — answer first
                </span>
              )}
            </div>

            {/* Answer */}
            <div className="mt-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <CornerDownRight className="size-3 text-arch-text3" />
                <span className="text-[9.5px] font-semibold uppercase tracking-wider text-arch-text3">
                  {isPanel ? "How to play it" : "Model answer"}
                </span>
              </div>
              <div className="whitespace-pre-line text-[12.5px] leading-[1.75] text-arch-text2">
                {qa.answer}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function MockInterviewTab() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<MockCategory | "All">("All");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [practiceMode, setPracticeMode] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockQuestions.filter((qa) => {
      if (activeCat !== "All" && qa.category !== activeCat) return false;
      if (!q) return true;
      return (
        qa.question.toLowerCase().includes(q) ||
        qa.answer.toLowerCase().includes(q) ||
        qa.probe.toLowerCase().includes(q) ||
        (qa.stories ?? []).some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [query, activeCat]);

  const sectionsToRender = useMemo(
    () =>
      mockSections.filter((s) =>
        filtered.some((qa) => qa.category === s.category)
      ),
    [filtered]
  );

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allOpen = filtered.length > 0 && filtered.every((qa) => openIds.has(qa.id));
  function toggleAll() {
    if (allOpen) setOpenIds(new Set());
    else setOpenIds(new Set(filtered.map((qa) => qa.id)));
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-wider text-arch-red">
            Mock Interview · Self-test
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-arch-text">
            Canada Life — Senior IT BSA
          </h1>
          <p className="mt-1.5 text-sm text-arch-text2">
            {mockQuestions.filter((q) => q.num).length} questions plus panel
            questions, answered from your real projects. Cover the probe, answer
            out loud, then expand to check.
          </p>
        </div>

        {/* Anchor phrases reminder */}
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-arch-amber/25 bg-arch-amber/10 px-3.5 py-2.5">
          <ListChecks className="mt-px size-3.5 shrink-0 text-arch-amber" />
          <p className="text-[11.5px] leading-relaxed text-arch-text2">
            <span className="font-semibold text-arch-amber">Keep dropping in:</span>{" "}
            “before any development work commenced” · “I produced the data mapping
            between the front-end and the back-end” · “the dev team built directly
            against it.”
          </p>
        </div>

        {/* ── Controls ───────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 -mx-6 mb-4 bg-arch-bg/80 px-6 pb-3 pt-1 backdrop-blur-sm">
          {/* Search + toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-arch-text3" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions, answers, stories…"
                className="h-9 w-full rounded-lg border border-arch-border bg-arch-bg2 pl-9 pr-8 text-[13px] text-arch-text outline-none transition-colors placeholder:text-arch-text3 focus:border-arch-blue focus:ring-2 focus:ring-arch-blue/30"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-arch-text3 hover:text-arch-text"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setPracticeMode((p) => !p)}
              className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-colors ${
                practiceMode
                  ? "border-arch-red/30 bg-arch-red/10 text-arch-red"
                  : "border-arch-border bg-arch-bg2 text-arch-text2 hover:text-arch-text"
              }`}
              title="Blur the probe line so you answer cold"
            >
              {practiceMode ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              Practice
            </button>

            <button
              onClick={toggleAll}
              className="flex h-9 items-center rounded-lg border border-arch-border bg-arch-bg2 px-3 text-[12px] font-medium text-arch-text2 transition-colors hover:text-arch-text"
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>

          {/* Category filter chips */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <FilterChip
              label="All"
              count={mockQuestions.length}
              active={activeCat === "All"}
              accent="gray"
              onClick={() => setActiveCat("All")}
            />
            {mockSections.map((s) => (
              <FilterChip
                key={s.category}
                label={`${s.index}. ${shortLabel(s.category)}`}
                count={mockQuestions.filter((q) => q.category === s.category).length}
                active={activeCat === s.category}
                accent={s.accent}
                onClick={() => setActiveCat(s.category)}
              />
            ))}
          </div>
        </div>

        {/* ── Sections + accordions ──────────────────────────────── */}
        {sectionsToRender.length === 0 ? (
          <p className="py-12 text-center text-sm text-arch-text3">
            No questions match “{query}”.
          </p>
        ) : (
          <div className="flex flex-col gap-7">
            {sectionsToRender.map((section) => {
              const accent = accentMap[section.accent];
              const items = filtered.filter((qa) => qa.category === section.category);
              return (
                <section key={section.category}>
                  <div className="mb-2.5 flex items-baseline gap-2">
                    <span className={`size-1.5 shrink-0 rounded-full ${accent.dot}`} />
                    <h2 className="text-[13px] font-semibold text-arch-text">
                      <span className={accent.text}>{section.index}.</span>{" "}
                      {section.category}
                    </h2>
                    <span className="text-[11px] text-arch-text3">· {section.blurb}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {items.map((qa) => (
                      <QAItem
                        key={qa.id}
                        qa={qa}
                        open={openIds.has(qa.id)}
                        onToggle={() => toggle(qa.id)}
                        hideProbe={practiceMode}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({
  label,
  count,
  active,
  accent,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  accent: Accent | "gray";
  onClick: () => void;
}) {
  const a = accent === "gray" ? null : accentMap[accent];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
        active
          ? a
            ? `${a.border} ${a.bg} ${a.text}`
            : "border-arch-border2 bg-arch-bg3 text-arch-text"
          : "border-arch-border bg-arch-bg2 text-arch-text3 hover:text-arch-text2"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1 text-[9.5px] tabular-nums ${
          active ? "bg-black/5 dark:bg-white/10" : "text-arch-text3"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function shortLabel(cat: MockCategory): string {
  switch (cat) {
    case "Opening & Career Narrative":
      return "Opening";
    case "Motivation & Fit":
      return "Motivation";
    case "Behavioural (STAR)":
      return "Behavioural";
    case "Technical & Data-Mapping Depth":
      return "Technical";
    case "Domain & Regulatory":
      return "Domain";
    case "Situational":
      return "Situational";
    case "Questions for the Panel":
      return "Ask the panel";
  }
}
