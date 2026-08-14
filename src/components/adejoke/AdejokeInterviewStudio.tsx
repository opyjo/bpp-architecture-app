"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Home,
  Menu,
  MessageSquare,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import {
  cityValues,
  competencyPillars,
  defaultStories,
  invitationChecklist,
  panelQuestions,
  practiceQuestions,
  questionCategories,
  type QuestionCategory,
  type StarStory,
} from "@/data/adejoke-hamilton-prep";

type StudioView = "home" | "practice" | "stories" | "brief";

const progressKey = "adejoke-hamilton-practiced-v1";
const notesKey = "adejoke-hamilton-notes-v1";
const storiesKey = "adejoke-hamilton-stories-v1";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function NavButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Home;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
        active
          ? "bg-[#d9f2ed] text-[#0b5b56]"
          : "text-[#52635f] hover:bg-[#edf4f1] hover:text-[#153f3b]"
      }`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#35837b]">
      {children}
    </div>
  );
}

function Prompter({
  questionIndex,
  notes,
  onClose,
}: {
  questionIndex: number;
  notes: string;
  onClose: () => void;
}) {
  const question = practiceQuestions[questionIndex];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [fontSize, setFontSize] = useState(36);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const element = scrollRef.current;
      if (!element) return;
      element.scrollTop += speed * 0.45;
      if (element.scrollTop + element.clientHeight >= element.scrollHeight - 8) {
        setPlaying(false);
      }
    }, 30);
    return () => window.clearInterval(id);
  }, [playing, speed]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.code === "Space" && event.target === document.body) {
        event.preventDefault();
        setPlaying((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#061a19] text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#efb34b] text-[#173c38]">
            <Mic className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8ccfc5]">
              Focus prompter · {question.category}
            </div>
            <div className="truncate text-sm text-white/70">Answer in your own voice</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-xl border border-white/15 text-white/70 transition hover:bg-white/10 hover:text-white"
          aria-label="Close prompter"
        >
          <X className="size-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth px-5 py-[24vh] sm:px-[12vw]">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-10 font-serif text-[clamp(2rem,5vw,4.75rem)] font-medium leading-[1.12] tracking-[-0.03em] text-white">
            {question.question}
          </p>
          <div className="mx-auto mb-12 h-px w-24 bg-[#efb34b]" />
          <div className="space-y-9 text-left" style={{ fontSize }}>
            {question.structure.map((line, index) => (
              <div key={line} className="flex items-start gap-5 leading-[1.45] text-white/90">
                <span className="mt-[0.35em] flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1f726b] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p>{line}</p>
              </div>
            ))}
            {notes.trim() && (
              <div className="mt-14 rounded-3xl border border-[#efb34b]/40 bg-[#efb34b]/10 p-7">
                <div className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#efc873]">
                  My evidence and words
                </div>
                <p className="whitespace-pre-wrap leading-[1.55] text-white">{notes}</p>
              </div>
            )}
            <div className="h-[45vh]" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#061a19]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setPlaying((value) => !value)}
            className="flex h-11 items-center gap-2 rounded-full bg-[#efb34b] px-5 text-sm font-bold text-[#173c38] transition hover:bg-[#f5c369]"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            {playing ? "Pause" : "Auto-scroll"}
          </button>
          <label className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-xs text-white/70">
            Speed
            <input
              aria-label="Prompter scroll speed"
              type="range"
              min="1"
              max="6"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="w-20 accent-[#efb34b]"
            />
          </label>
          <label className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-xs text-white/70">
            Text
            <input
              aria-label="Prompter text size"
              type="range"
              min="24"
              max="54"
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
              className="w-20 accent-[#efb34b]"
            />
          </label>
          <button
            onClick={() => {
              if (scrollRef.current) scrollRef.current.scrollTop = 0;
              setPlaying(false);
            }}
            className="flex size-11 items-center justify-center rounded-full border border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Restart prompter"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeView({
  practicedCount,
  onStart,
  onNavigate,
}: {
  practicedCount: number;
  onStart: () => void;
  onNavigate: (view: StudioView) => void;
}) {
  const progress = Math.round((practicedCount / practiceQuestions.length) * 100);

  return (
    <div className="pb-16">
      <section className="relative overflow-hidden rounded-[28px] bg-[#0b5b56] px-6 py-8 text-white shadow-[0_24px_70px_rgba(15,65,59,0.2)] sm:px-10 sm:py-11">
        <div className="absolute -right-14 -top-16 size-64 rounded-full border border-white/10" />
        <div className="absolute -bottom-28 right-20 size-72 rounded-full bg-[#147169]" />
        <div className="relative max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#c8eee8]">
            <Sparkles className="size-3.5" />
            Your private interview studio
          </div>
          <h1 className="max-w-2xl font-serif text-[clamp(2.6rem,6vw,5.3rem)] font-medium leading-[0.98] tracking-[-0.045em]">
            Ready, Adejoke.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#d8efeb] sm:text-lg">
            Prepare clear, evidence-led answers for Hamilton&apos;s enterprise Time &amp; Attendance transformation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={onStart}
              className="group flex h-12 items-center gap-2 rounded-full bg-[#efb34b] px-6 text-sm font-bold text-[#173c38] transition hover:bg-[#f7c76b]"
            >
              Start a question drill
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => onNavigate("brief")}
              className="flex h-12 items-center gap-2 rounded-full border border-white/25 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View role brief
              <FileText className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-[#d8e4e0] bg-white p-6 shadow-[0_12px_40px_rgba(34,72,66,0.06)] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SectionLabel>Practice progress</SectionLabel>
              <h2 className="font-serif text-3xl font-medium tracking-tight text-[#153f3b]">
                Build recall, not a script.
              </h2>
            </div>
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#edf7f4] text-lg font-bold text-[#0b5b56]">
              {progress}%
            </div>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#e9efed]">
            <div className="h-full rounded-full bg-[#e3a22e] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#65736f]">
            <span>{practicedCount} of {practiceQuestions.length} questions rehearsed</span>
            <button onClick={() => onNavigate("practice")} className="font-bold text-[#0b5b56] hover:underline">
              Continue
            </button>
          </div>
        </article>

        <article className="rounded-3xl bg-[#f4e8d3] p-6 sm:p-7">
          <SectionLabel>Interview invitation</SectionLabel>
          <div className="flex items-center gap-3 text-[#153f3b]">
            <Clock className="size-5 text-[#a46b17]" />
            <h2 className="font-serif text-2xl font-medium">One-hour virtual panel</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm text-[#5e5545]">
            <div className="flex justify-between gap-4 border-b border-[#ddceb3] pb-3">
              <span>Mon, Aug 10</span><strong>11:30–1:00</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Thu, Aug 13</span><strong>12:00–2:30</strong>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-5 text-[#766954]">Availability windows—not a confirmed appointment.</p>
        </article>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionLabel>What the panel needs to hear</SectionLabel>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-[#153f3b] sm:text-4xl">
              Six signals of fit
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#65736f]">
            Each answer should prove one or two of these themes with a real example and a measurable result.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {competencyPillars.map((pillar, index) => (
            <article key={pillar.title} className="group rounded-2xl border border-[#d8e4e0] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#93c7c0] hover:shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#b4771d]">0{index + 1}</span>
                <Target className="size-4 text-[#8abcb5]" />
              </div>
              <h3 className="mt-5 text-base font-bold text-[#153f3b]">{pillar.title}</h3>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-[#35837b]">{pillar.signal}</p>
              <p className="mt-3 text-sm leading-6 text-[#65736f]">{pillar.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 lg:grid-cols-3">
        <button onClick={() => onNavigate("practice")} className="group rounded-3xl bg-[#d9f2ed] p-6 text-left transition hover:-translate-y-0.5">
          <Mic className="size-6 text-[#0b5b56]" />
          <h3 className="mt-7 font-serif text-2xl font-medium text-[#153f3b]">Question drill</h3>
          <p className="mt-2 text-sm leading-6 text-[#52635f]">Timed practice, tailored coaching cues and a distraction-free teleprompter.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#0b5b56]">Practise now <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
        </button>
        <button onClick={() => onNavigate("stories")} className="group rounded-3xl bg-[#f4e8d3] p-6 text-left transition hover:-translate-y-0.5">
          <BookOpen className="size-6 text-[#9a6518]" />
          <h3 className="mt-7 font-serif text-2xl font-medium text-[#4c402f]">STAR story lab</h3>
          <p className="mt-2 text-sm leading-6 text-[#6e614f]">Shape six reusable examples. Your writing saves automatically on this device.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#8c5a12]">Build evidence <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
        </button>
        <button onClick={() => onNavigate("brief")} className="group rounded-3xl bg-[#153f3b] p-6 text-left text-white transition hover:-translate-y-0.5">
          <FileText className="size-6 text-[#efb34b]" />
          <h3 className="mt-7 font-serif text-2xl font-medium">Role brief</h3>
          <p className="mt-2 text-sm leading-6 text-[#c2d8d4]">The mandate, interview checklist, City values and strong questions for the panel.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#efc873]">Review the role <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
        </button>
      </section>
    </div>
  );
}

function PracticeView({
  practiced,
  setPracticed,
  notes,
  setNotes,
  openPrompter,
}: {
  practiced: string[];
  setPracticed: (value: string[]) => void;
  notes: Record<string, string>;
  setNotes: (value: Record<string, string>) => void;
  openPrompter: (index: number) => void;
}) {
  const [category, setCategory] = useState<"All" | QuestionCategory>("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [seconds, setSeconds] = useState(120);
  const [running, setRunning] = useState(false);
  const timerActive = running && seconds > 0;
  const filtered = useMemo(
    () => practiceQuestions.map((question, index) => ({ question, index })).filter(({ question }) => category === "All" || question.category === category),
    [category]
  );
  const activePosition = Math.max(0, filtered.findIndex(({ index }) => index === activeIndex));
  const current = practiceQuestions[activeIndex];

  useEffect(() => {
    if (!timerActive) return;
    const id = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [timerActive]);

  function selectQuestion(index: number) {
    setActiveIndex(index);
    setRevealed(false);
    setRunning(false);
    setSeconds(120);
  }

  function move(offset: number) {
    const nextPosition = (activePosition + offset + filtered.length) % filtered.length;
    selectQuestion(filtered[nextPosition].index);
  }

  function togglePracticed() {
    const next = practiced.includes(current.id)
      ? practiced.filter((id) => id !== current.id)
      : [...practiced, current.id];
    setPracticed(next);
  }

  return (
    <div className="pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Question drill</SectionLabel>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-[#153f3b] sm:text-5xl">Practise out loud.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#65736f]">Answer first, reveal the cues second. Keep most responses between 90 seconds and two minutes.</p>
        </div>
        <div className="rounded-full bg-[#e7f3f0] px-4 py-2 text-xs font-bold text-[#0b5b56]">
          {practiced.length}/{practiceQuestions.length} rehearsed
        </div>
      </div>

      <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
        {questionCategories.map((item) => (
          <button
            key={item}
            onClick={() => {
              setCategory(item);
              const first = practiceQuestions.findIndex((question) => item === "All" || question.category === item);
              if (first >= 0) selectQuestion(first);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${category === item ? "bg-[#0b5b56] text-white" : "border border-[#d5e1dd] bg-white text-[#5e6e6a] hover:border-[#75afa7]"}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="overflow-hidden rounded-[28px] border border-[#d8e4e0] bg-white shadow-[0_14px_50px_rgba(34,72,66,0.07)]">
          <div className="border-b border-[#e3ebe8] bg-[#f7faf9] px-6 py-4 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-[#d9f2ed] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0b5b56]">{current.category}</span>
              <div className={`font-mono text-2xl font-bold tabular-nums ${seconds <= 20 ? "text-[#b7472f]" : "text-[#153f3b]"}`}>{formatTime(seconds)}</div>
            </div>
          </div>
          <div className="px-6 py-7 sm:px-8 sm:py-9">
            <div className="text-xs font-bold text-[#9c6a20]">Question {activePosition + 1} of {filtered.length}</div>
            <h2 className="mt-3 font-serif text-[clamp(1.9rem,4vw,3.25rem)] font-medium leading-[1.12] tracking-[-0.025em] text-[#153f3b]">{current.question}</h2>
            <p className="mt-5 rounded-2xl bg-[#f3f7f5] px-4 py-3 text-sm leading-6 text-[#60706c]"><strong className="text-[#315a55]">They&apos;re listening for:</strong> {current.tests}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => { if (seconds === 0) setSeconds(120); setRunning((value) => !value || seconds === 0); }} className="flex h-11 items-center gap-2 rounded-full bg-[#0b5b56] px-5 text-sm font-bold text-white hover:bg-[#084d49]">
                {timerActive ? <Pause className="size-4" /> : <Play className="size-4" />}
                {timerActive ? "Pause timer" : seconds < 120 && seconds > 0 ? "Resume timer" : "Start answer"}
              </button>
              <button onClick={() => { setRunning(false); setSeconds(120); }} className="flex size-11 items-center justify-center rounded-full border border-[#cfdbd7] text-[#52635f] hover:bg-[#eff5f2]" aria-label="Reset timer"><RotateCcw className="size-4" /></button>
              <button onClick={() => openPrompter(activeIndex)} className="flex h-11 items-center gap-2 rounded-full border border-[#cfdbd7] px-4 text-sm font-bold text-[#315a55] hover:bg-[#eff5f2]"><Mic className="size-4" /> Focus prompter</button>
            </div>

            <div className="mt-8 border-t border-[#e3ebe8] pt-6">
              <button onClick={() => setRevealed((value) => !value)} className="flex w-full items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#f4e8d3] text-[#9a6518]">{revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</div>
                  <div><div className="text-sm font-bold text-[#153f3b]">Coach cues</div><div className="text-xs text-[#75817e]">Reveal after your first attempt</div></div>
                </div>
                <ChevronDown className={`size-4 text-[#75817e] transition-transform ${revealed ? "rotate-180" : ""}`} />
              </button>
              {revealed && (
                <div className="mt-5 space-y-3">
                  {current.structure.map((item, index) => (
                    <div key={item} className="flex items-start gap-3 rounded-xl bg-[#f7faf9] p-3.5 text-sm leading-6 text-[#52635f]"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d9f2ed] text-[10px] font-bold text-[#0b5b56]">{index + 1}</span>{item}</div>
                  ))}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#cfe4df] bg-[#edf7f4] p-4 text-xs leading-5 text-[#315a55]"><strong className="block text-[#0b5b56]">Likely follow-up</strong>{current.followUp}</div>
                    <div className="rounded-xl border border-[#ead8b8] bg-[#fbf5e9] p-4 text-xs leading-5 text-[#66543a]"><strong className="block text-[#9a6518]">Watch out</strong>{current.watchOut}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-7">
              <label htmlFor="answer-notes" className="text-xs font-bold uppercase tracking-[0.12em] text-[#51716c]">My evidence · numbers · key words</label>
              <textarea
                id="answer-notes"
                value={notes[current.id] ?? ""}
                onChange={(event) => setNotes({ ...notes, [current.id]: event.target.value })}
                placeholder="Add a real example, your action, result and any number you can defend…"
                className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-[#cfdbd7] bg-[#fbfdfc] p-4 text-sm leading-6 text-[#274743] outline-none transition placeholder:text-[#9aa6a3] focus:border-[#4d9b92] focus:ring-4 focus:ring-[#4d9b92]/10"
              />
              <div className="mt-2 text-[11px] text-[#88938f]">Saved automatically on this device. Use only truthful examples you can explain under follow-up.</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e3ebe8] bg-[#f7faf9] px-6 py-4 sm:px-8">
            <button onClick={() => move(-1)} className="flex items-center gap-2 text-sm font-bold text-[#52635f] hover:text-[#0b5b56]"><ArrowLeft className="size-4" /> Previous</button>
            <button onClick={togglePracticed} className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition ${practiced.includes(current.id) ? "bg-[#d9f2ed] text-[#0b5b56]" : "border border-[#cfdbd7] bg-white text-[#52635f] hover:border-[#75afa7]"}`}><Check className="size-4" /> {practiced.includes(current.id) ? "Rehearsed" : "Mark rehearsed"}</button>
            <button onClick={() => move(1)} className="flex items-center gap-2 text-sm font-bold text-[#0b5b56]">Next <ArrowRight className="size-4" /></button>
          </div>
        </article>

        <aside className="max-h-[760px] overflow-y-auto rounded-3xl border border-[#d8e4e0] bg-white p-3">
          <div className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#7b8884]">Question queue</div>
          <div className="space-y-1">
            {filtered.map(({ question, index }, position) => (
              <button key={question.id} onClick={() => selectQuestion(index)} className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${index === activeIndex ? "bg-[#d9f2ed]" : "hover:bg-[#f1f6f4]"}`}>
                <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${practiced.includes(question.id) ? "bg-[#0b5b56] text-white" : index === activeIndex ? "bg-white text-[#0b5b56]" : "bg-[#edf2f0] text-[#7d8986]"}`}>{practiced.includes(question.id) ? <Check className="size-3" /> : position + 1}</span>
                <span className={`line-clamp-3 text-xs font-medium leading-5 ${index === activeIndex ? "text-[#153f3b]" : "text-[#64736f]"}`}>{question.question}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StoriesView({ stories, setStories }: { stories: StarStory[]; setStories: (stories: StarStory[]) => void }) {
  const [activeId, setActiveId] = useState(stories[0].id);
  const active = stories.find((story) => story.id === activeId) ?? stories[0];

  function update(field: keyof StarStory, value: string) {
    setStories(stories.map((story) => story.id === active.id ? { ...story, [field]: value } : story));
  }

  const completedFields = [active.situation, active.task, active.action, active.result, active.learning].filter((value) => value.trim()).length;

  return (
    <div className="pb-16">
      <SectionLabel>STAR story lab</SectionLabel>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-[#153f3b] sm:text-5xl">Turn experience into evidence.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#65736f]">Build a small set of truthful, flexible stories. Aim for roughly 15% situation, 10% task, 55% action and 20% result.</p>

      <div className="mt-7 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-[#d8e4e0] bg-white p-3">
          {stories.map((story) => {
            const count = [story.situation, story.task, story.action, story.result, story.learning].filter((value) => value.trim()).length;
            return (
              <button key={story.id} onClick={() => setActiveId(story.id)} className={`mb-1 w-full rounded-2xl p-3 text-left transition ${active.id === story.id ? "bg-[#d9f2ed]" : "hover:bg-[#f1f6f4]"}`}>
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-[#254d48]">{story.title}</span><span className="text-[10px] font-bold text-[#4f817b]">{count}/5</span></div>
                <div className="mt-1 text-[10px] leading-4 text-[#7b8884]">{story.useFor}</div>
              </button>
            );
          })}
        </aside>

        <article className="rounded-[28px] border border-[#d8e4e0] bg-white p-6 shadow-[0_14px_50px_rgba(34,72,66,0.06)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><div className="text-xs font-bold uppercase tracking-[0.12em] text-[#35837b]">{active.useFor}</div><h2 className="mt-2 font-serif text-3xl font-medium text-[#153f3b]">{active.title}</h2></div>
            <div className="rounded-full bg-[#edf7f4] px-3 py-1.5 text-xs font-bold text-[#0b5b56]">{completedFields}/5 complete</div>
          </div>
          <div className="mt-7 space-y-5">
            {([
              ["situation", "Situation", "Set only the context the panel needs: organization, scale, trigger and stakes."],
              ["task", "Task", "State your accountability and the difficult outcome you had to achieve."],
              ["action", "Action", "Make this the longest section. Show your decisions, leadership, tools and judgment."],
              ["result", "Result", "Quantify delivery, business, people or risk outcomes—and explain how you know."],
              ["learning", "Learning", "Name what changed in your leadership approach and where you applied it next."],
            ] as const).map(([field, label, hint], index) => (
              <label key={field} className="block">
                <div className="flex items-center gap-3"><span className="flex size-7 items-center justify-center rounded-full bg-[#f4e8d3] text-[10px] font-bold text-[#986316]">{index + 1}</span><div><div className="text-sm font-bold text-[#153f3b]">{label}</div><div className="text-[11px] leading-5 text-[#7b8884]">{hint}</div></div></div>
                <textarea value={active[field]} onChange={(event) => update(field, event.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-[#d4dfdc] bg-[#fbfdfc] p-4 text-sm leading-6 text-[#274743] outline-none transition focus:border-[#4d9b92] focus:ring-4 focus:ring-[#4d9b92]/10" placeholder={`Write the ${label.toLowerCase()} in your own words…`} />
              </label>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#fbf5e9] p-4 text-xs leading-5 text-[#66543a]"><Sparkles className="mt-0.5 size-4 shrink-0 text-[#a46b17]" /><p><strong>Proof check:</strong> Could a panel member ask “how was that measured?” or “what did you personally do?” Answer both before you mark the story ready.</p></div>
        </article>
      </div>
    </div>
  );
}

function BriefView() {
  const [copied, setCopied] = useState(false);
  const emailDraft = `Dear [Name],\n\nThank you for inviting me to interview for Job ID #32089, Senior Project Manager – Enterprise Time & Attendance System.\n\nI am available during the following windows:\n• Monday, August 10: [insert available time]\n• Thursday, August 13: [insert available time]\n\nPlease find my completed reference consent form attached. I look forward to speaking with the hiring team.\n\nKind regards,\nAdejoke`;

  async function copyDraft() {
    await navigator.clipboard.writeText(emailDraft);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="pb-16">
      <SectionLabel>Role brief</SectionLabel>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-[#153f3b] sm:text-5xl">Know the mandate.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#65736f]">A concise working brief based on Job ID #32089 and the interview invitation.</p>

      <section className="mt-7 overflow-hidden rounded-[28px] bg-[#153f3b] p-6 text-white sm:p-9">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8ccfc5]">The assignment</div>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight sm:text-4xl">Lead UKG Pro WFM from plan to post-go-live.</h2>
            <p className="mt-5 text-sm leading-7 text-[#c5dcd8]">A temporary, full-time Senior Project Manager mandate of up to 24 months, reporting to the Manager of HR Technology &amp; Analytics. The program spans the City and affiliates and serves 3,000+ users.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["35", "hours / week"], ["24", "months, up to"], ["3,000+", "system users"], ["$105k–$132k", "annual range"]].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="font-serif text-2xl font-medium text-[#efc873]">{value}</div><div className="mt-1 text-[11px] text-[#b8cfcb]">{label}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-[#d8e4e0] bg-white p-6 sm:p-7">
          <div className="flex items-center gap-3"><CheckCircle2 className="size-5 text-[#0b5b56]" /><h2 className="font-serif text-2xl font-medium text-[#153f3b]">Invitation checklist</h2></div>
          <div className="mt-5 space-y-3">
            {invitationChecklist.map((item) => <div key={item} className="flex items-start gap-3 text-sm leading-6 text-[#5d6c68]"><span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#d9f2ed] text-[#0b5b56]"><Check className="size-3" /></span>{item}</div>)}
          </div>
        </article>
        <article className="rounded-3xl border border-[#e6d8bf] bg-[#fbf5e9] p-6 sm:p-7">
          <div className="flex items-center gap-3"><MessageSquare className="size-5 text-[#986316]" /><h2 className="font-serif text-2xl font-medium text-[#4c402f]">Availability reply</h2></div>
          <pre className="mt-5 whitespace-pre-wrap font-sans text-xs leading-6 text-[#665b4b]">{emailDraft}</pre>
          <button onClick={copyDraft} className="mt-5 flex items-center gap-2 rounded-full bg-[#4c402f] px-4 py-2 text-xs font-bold text-white hover:bg-[#382f24]">{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? "Copied" : "Copy draft"}</button>
        </article>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-3xl bg-[#d9f2ed] p-6 sm:p-7">
          <SectionLabel>City culture</SectionLabel>
          <h2 className="font-serif text-3xl font-medium text-[#153f3b]">Values to demonstrate</h2>
          <div className="mt-5 space-y-2">{cityValues.map((value) => <div key={value} className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3 text-sm font-bold text-[#315a55]"><span className="size-1.5 rounded-full bg-[#e3a22e]" />{value}</div>)}</div>
          <p className="mt-5 text-xs leading-5 text-[#526b66]">Use the value naturally when it fits the example. Do not force all five into one answer.</p>
        </article>
        <article className="rounded-3xl border border-[#d8e4e0] bg-white p-6 sm:p-7">
          <SectionLabel>Close with curiosity</SectionLabel>
          <h2 className="font-serif text-3xl font-medium text-[#153f3b]">Questions for the panel</h2>
          <div className="mt-5 space-y-3">{panelQuestions.map((question, index) => <div key={question} className="flex items-start gap-3 border-b border-[#e6ecea] pb-3 last:border-0"><span className="text-xs font-bold text-[#b4771d]">0{index + 1}</span><p className="text-sm leading-6 text-[#52635f]">{question}</p></div>)}</div>
        </article>
      </section>

      <section className="mt-10 rounded-3xl border border-[#d8e4e0] bg-white p-6 sm:p-8">
        <SectionLabel>A sensible one-hour practice shape</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-4">
          {[["0–5", "Welcome & introductions"], ["5–50", "Panel questions"], ["50–57", "Your questions"], ["57–60", "Close & next steps"]].map(([time, label]) => <div key={time} className="rounded-2xl bg-[#f3f7f5] p-4"><div className="font-mono text-sm font-bold text-[#0b5b56]">{time} min</div><div className="mt-2 text-xs leading-5 text-[#61706c]">{label}</div></div>)}
        </div>
        <p className="mt-4 text-[11px] text-[#88938f]">This is a rehearsal model, not an official City agenda.</p>
      </section>
    </div>
  );
}

export default function AdejokeInterviewStudio() {
  const [view, setView] = useState<StudioView>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [practiced, setPracticedState] = useState<string[]>([]);
  const [notes, setNotesState] = useState<Record<string, string>>({});
  const [stories, setStoriesState] = useState<StarStory[]>(defaultStories);
  const [prompterIndex, setPrompterIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadSavedWork = window.setTimeout(() => {
      try {
        const savedProgress = window.localStorage.getItem(progressKey);
        const savedNotes = window.localStorage.getItem(notesKey);
        const savedStories = window.localStorage.getItem(storiesKey);
        if (savedProgress) setPracticedState(JSON.parse(savedProgress));
        if (savedNotes) setNotesState(JSON.parse(savedNotes));
        if (savedStories) setStoriesState(JSON.parse(savedStories));
      } catch {
        // Keep the safe defaults when browser storage is unavailable or malformed.
      }
    }, 0);
    return () => window.clearTimeout(loadSavedWork);
  }, []);

  function setPracticed(value: string[]) {
    setPracticedState(value);
    window.localStorage.setItem(progressKey, JSON.stringify(value));
  }

  function setNotes(value: Record<string, string>) {
    setNotesState(value);
    window.localStorage.setItem(notesKey, JSON.stringify(value));
  }

  function setStories(value: StarStory[]) {
    setStoriesState(value);
    window.localStorage.setItem(storiesKey, JSON.stringify(value));
  }

  function navigate(next: StudioView) {
    setView(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#153f3b] selection:bg-[#efc873] selection:text-[#153f3b]">
      <header className="sticky top-0 z-40 border-b border-[#dce6e2]/90 bg-[#f4f7f5]/90 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <button onClick={() => navigate("home")} className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-[#0b5b56] font-serif text-lg font-bold text-white">A</span><span className="text-sm font-bold text-[#153f3b]">Interview Studio</span></button>
          <button onClick={() => setMenuOpen((value) => !value)} className="flex size-10 items-center justify-center rounded-xl border border-[#d4dfdc] bg-white" aria-label="Toggle navigation">{menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}</button>
        </div>
        {menuOpen && <div className="space-y-1 border-t border-[#dce6e2] bg-white p-3"><NavButton active={view === "home"} icon={Home} label="Home" onClick={() => navigate("home")} /><NavButton active={view === "practice"} icon={Mic} label="Question drill" onClick={() => navigate("practice")} /><NavButton active={view === "stories"} icon={BookOpen} label="STAR story lab" onClick={() => navigate("stories")} /><NavButton active={view === "brief"} icon={FileText} label="Role brief" onClick={() => navigate("brief")} /></div>}
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[#dce6e2] bg-[#fbfdfc] p-5 lg:flex">
        <button onClick={() => navigate("home")} className="flex items-center gap-3 px-1 text-left">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#0b5b56] font-serif text-xl font-bold text-white shadow-lg shadow-[#0b5b56]/20">A</span>
          <span><span className="block text-sm font-bold text-[#153f3b]">Interview Studio</span><span className="block text-[10px] uppercase tracking-[0.12em] text-[#71807c]">Adejoke · Hamilton</span></span>
        </button>
        <nav className="mt-10 space-y-1"><NavButton active={view === "home"} icon={Home} label="Home" onClick={() => navigate("home")} /><NavButton active={view === "practice"} icon={Mic} label="Question drill" onClick={() => navigate("practice")} /><NavButton active={view === "stories"} icon={BookOpen} label="STAR story lab" onClick={() => navigate("stories")} /><NavButton active={view === "brief"} icon={FileText} label="Role brief" onClick={() => navigate("brief")} /></nav>
        <div className="mt-auto rounded-2xl bg-[#edf5f2] p-4"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#35837b]">Job ID #32089</div><div className="mt-2 text-xs font-bold leading-5 text-[#315a55]">Senior Project Manager</div><div className="mt-1 text-[11px] leading-4 text-[#71807c]">Enterprise Time &amp; Attendance System</div></div>
        <Link href="/" className="mt-4 flex items-center gap-2 px-2 text-xs font-bold text-[#71807c] hover:text-[#0b5b56]"><ArrowLeft className="size-3.5" /> Main workspace</Link>
      </aside>

      <main className="lg:pl-[248px]">
        <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
          {view === "home" && <HomeView practicedCount={practiced.length} onStart={() => navigate("practice")} onNavigate={navigate} />}
          {view === "practice" && <PracticeView practiced={practiced} setPracticed={setPracticed} notes={notes} setNotes={setNotes} openPrompter={setPrompterIndex} />}
          {view === "stories" && <StoriesView stories={stories} setStories={setStories} />}
          {view === "brief" && <BriefView />}
        </div>
      </main>

      {prompterIndex !== null && <Prompter questionIndex={prompterIndex} notes={notes[practiceQuestions[prompterIndex].id] ?? ""} onClose={() => setPrompterIndex(null)} />}
    </div>
  );
}
