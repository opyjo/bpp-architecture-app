"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  Dices,
  Eye,
  EyeOff,
  Pencil,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import {
  starMentalModels,
  starStories,
  type PracticeConfidence,
  type StarMentalModel,
} from "@/data/mastercard-prep";

type AnswerDepth = "30" | "90" | "deep";
type PracticeMode = "recall" | "study";

interface PracticeStatus {
  confidence: PracticeConfidence;
  practiceCount: number;
  lastPracticedAt: string | null;
}

interface SavedPracticeRow {
  story_key: string;
  model: StarMentalModel;
  confidence: PracticeConfidence;
  practice_count: number;
  last_practiced_at: string | null;
}

interface LocalPracticePayload {
  models: Record<string, StarMentalModel>;
  statuses: Record<string, PracticeStatus>;
}

const LOCAL_STORAGE_KEY = "mastercard-star-story-practice-v1";
const defaultModels = Object.fromEntries(
  starMentalModels.map((model) => [model.storyKey, model])
) as Record<string, StarMentalModel>;
const defaultStatuses = Object.fromEntries(
  starMentalModels.map((model) => [model.storyKey, {
    confidence: "Developing" as PracticeConfidence,
    practiceCount: 0,
    lastPracticedAt: null,
  }])
) as Record<string, PracticeStatus>;

function cloneModel(model: StarMentalModel) {
  return JSON.parse(JSON.stringify(model)) as StarMentalModel;
}

function storyShortName(model: StarMentalModel) {
  return model.storyTitle.split(" - ")[0];
}

function formatPracticeDate(value: string | null) {
  if (!value) return "Not practised yet";
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function MentalModelDiagram({
  model,
  mode,
  revealed,
  editing,
  onReveal,
  onNodeChange,
}: {
  model: StarMentalModel;
  mode: PracticeMode;
  revealed: Set<string>;
  editing: boolean;
  onReveal: (nodeId: string) => void;
  onNodeChange: (nodeId: string, detail: string) => void;
}) {
  return <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    {model.nodes.map((node, index) => {
      const isVisible = mode === "study" || revealed.has(node.id) || editing;
      const detailId = `mental-model-${model.storyKey}-${node.id}`;

      return <li key={node.id} className="relative min-w-0">
        <button
          type="button"
          aria-expanded={isVisible}
          aria-controls={detailId}
          onClick={() => onReveal(node.id)}
          className={`h-full w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-blue/50 ${isVisible ? "border-arch-blue/40 bg-arch-blue/10" : "border-arch-border bg-arch-bg2 hover:border-arch-blue/35"}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arch-blue/15 text-[10px] font-bold text-arch-blue">{index + 1}</span>
              <div className="min-w-0">
                <div className="text-[11.5px] font-semibold text-arch-text">{node.label}</div>
                <div className="mt-0.5 text-[9.5px] leading-4 text-arch-text3">{node.prompt}</div>
              </div>
            </div>
            {index < model.nodes.length - 1 && <>
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-arch-text3 xl:block" aria-hidden="true" />
              <ChevronDown className="h-4 w-4 shrink-0 text-arch-text3 xl:hidden" aria-hidden="true" />
            </>}
          </div>
          {!isVisible && <div className="mt-3 flex items-center gap-1.5 text-[9.5px] font-medium text-arch-amber"><Eye className="h-3.5 w-3.5" aria-hidden="true" />Reveal</div>}
        </button>
        {isVisible && <div id={detailId} className="mt-2 rounded-lg border border-arch-border bg-arch-bg p-3" aria-live="polite">
          {editing
            ? <textarea
                value={node.detail}
                onChange={(event) => onNodeChange(node.id, event.target.value)}
                rows={6}
                maxLength={4_000}
                aria-label={`${node.label} detail`}
                className="w-full resize-y rounded-md border border-arch-border bg-arch-bg2 px-2.5 py-2 text-[10.5px] leading-5 text-arch-text outline-none focus:border-arch-blue/60 focus:ring-2 focus:ring-arch-blue/15"
              />
            : <p className="text-[10.5px] leading-5 text-arch-text2">{node.detail}</p>}
        </div>}
      </li>;
    })}
  </ol>;
}

export default function MentalModelPractice() {
  const [selectedStoryKey, setSelectedStoryKey] = useState(starMentalModels[0].storyKey);
  const [models, setModels] = useState<Record<string, StarMentalModel>>(defaultModels);
  const [statuses, setStatuses] = useState<Record<string, PracticeStatus>>(defaultStatuses);
  const [mode, setMode] = useState<PracticeMode>("recall");
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [answerDepth, setAnswerDepth] = useState<AnswerDepth>("90");
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [draft, setDraft] = useState<StarMentalModel | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const currentModel = draft ?? models[selectedStoryKey] ?? starMentalModels[0];
  const currentStatus = statuses[selectedStoryKey] ?? defaultStatuses[selectedStoryKey];
  const sourceStory = starStories.find((story) => story.title === currentModel.storyTitle);
  const allRevealed = currentModel.nodes.every((node) => revealed.has(node.id));

  useEffect(() => {
    const controller = new AbortController();

    const loadPractice = async () => {
      const savedLocal = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal) as LocalPracticePayload;
          if (parsed.models) setModels((current) => ({ ...current, ...parsed.models }));
          if (parsed.statuses) setStatuses((current) => ({ ...current, ...parsed.statuses }));
        } catch {
          window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }

      try {
        const response = await fetch("/api/star-story-practice", { signal: controller.signal });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error || "Failed to load practice data");

        const rows = body as SavedPracticeRow[];
        setModels((current) => ({
          ...current,
          ...Object.fromEntries(rows.map((row) => [row.story_key, row.model])),
        }));
        setStatuses((current) => ({
          ...current,
          ...Object.fromEntries(rows.map((row) => [row.story_key, {
            confidence: row.confidence,
            practiceCount: row.practice_count,
            lastPracticedAt: row.last_practiced_at,
          }])),
        }));
        setSyncNote(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSyncNote("Using this browser’s saved practice data; Supabase sync is unavailable until the migration is applied.");
      }
    };

    void loadPractice();
    return () => controller.abort();
  }, []);

  const writeLocal = (nextModels: Record<string, StarMentalModel>, nextStatuses: Record<string, PracticeStatus>) => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ models: nextModels, statuses: nextStatuses }));
  };

  const selectStory = (storyKey: string) => {
    setSelectedStoryKey(storyKey);
    setMode("recall");
    setRevealed(new Set());
    setAnswerRevealed(false);
    setDraft(null);
  };

  const persistPractice = async ({
    model,
    confidence,
    incrementPractice,
    successMessage,
  }: {
    model: StarMentalModel;
    confidence: PracticeConfidence;
    incrementPractice: boolean;
    successMessage: string;
  }) => {
    const now = incrementPractice ? new Date().toISOString() : currentStatus.lastPracticedAt;
    const nextStatus: PracticeStatus = {
      confidence,
      practiceCount: currentStatus.practiceCount + (incrementPractice ? 1 : 0),
      lastPracticedAt: now,
    };
    const nextModels = { ...models, [model.storyKey]: model };
    const nextStatuses = { ...statuses, [model.storyKey]: nextStatus };

    setModels(nextModels);
    setStatuses(nextStatuses);
    writeLocal(nextModels, nextStatuses);
    setSaving(true);

    try {
      const response = await fetch("/api/star-story-practice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyKey: model.storyKey,
          model,
          confidence,
          incrementPractice,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Failed to sync practice data");

      const row = body as SavedPracticeRow;
      const confirmedStatus: PracticeStatus = {
        confidence: row.confidence,
        practiceCount: row.practice_count,
        lastPracticedAt: row.last_practiced_at,
      };
      const confirmedStatuses = { ...nextStatuses, [model.storyKey]: confirmedStatus };
      setStatuses(confirmedStatuses);
      writeLocal(nextModels, confirmedStatuses);
      setSyncNote(null);
      toast.success(successMessage);
    } catch {
      setSyncNote("Saved in this browser. Apply the Supabase migration to sync practice data across sessions and devices.");
      toast.warning("Saved in this browser; Supabase sync is not available yet.");
    } finally {
      setSaving(false);
    }
  };

  const revealNode = (nodeId: string) => {
    if (mode === "study" || draft) return;
    setRevealed((current) => new Set(current).add(nodeId));
  };

  const revealNext = () => {
    const nextNode = currentModel.nodes.find((node) => !revealed.has(node.id));
    if (nextNode) revealNode(nextNode.id);
  };

  const randomStory = () => {
    const candidates = starMentalModels.filter((model) => model.storyKey !== selectedStoryKey);
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    selectStory(next.storyKey);
  };

  const beginEditing = () => {
    setMode("study");
    setDraft(cloneModel(models[selectedStoryKey] ?? currentModel));
  };

  const updateNode = (nodeId: string, detail: string) => {
    setDraft((current) => current ? {
      ...current,
      nodes: current.nodes.map((node) => node.id === nodeId ? { ...node, detail } : node),
    } : current);
  };

  const saveDraft = async () => {
    if (!draft) return;
    const hasEmptyField = !draft.memoryCode.trim()
      || !draft.answer30.trim()
      || !draft.answer90.trim()
      || draft.nodes.some((node) => !node.detail.trim());
    if (hasEmptyField) {
      toast.error("Memory code, answers, and diagram nodes cannot be empty.");
      return;
    }

    await persistPractice({
      model: draft,
      confidence: currentStatus.confidence,
      incrementPractice: false,
      successMessage: "Mental model saved to Supabase.",
    });
    setDraft(null);
  };

  const setConfidence = async (confidence: PracticeConfidence) => {
    await persistPractice({
      model: models[selectedStoryKey] ?? currentModel,
      confidence,
      incrementPractice: false,
      successMessage: `Confidence set to ${confidence}.`,
    });
  };

  const markPractised = async () => {
    await persistPractice({
      model: models[selectedStoryKey] ?? currentModel,
      confidence: currentStatus.confidence,
      incrementPractice: true,
      successMessage: "Practice repetition recorded.",
    });
  };

  return <div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-arch-text">STAR mental-model practice</h1>
        <p className="mt-1 max-w-4xl text-[11px] leading-5 text-arch-text2">Build retrieval muscle through one fixed path: Context → Tension → Mandate → Diagnosis → Decision → Execution → Evidence → Lesson.</p>
      </div>
      <button type="button" onClick={randomStory} className="flex items-center gap-1.5 rounded-md border border-arch-border bg-arch-bg2 px-2.5 py-2 text-[10px] font-semibold text-arch-text2 transition-colors hover:border-arch-purple/40 hover:text-arch-purple"><Dices className="h-3.5 w-3.5" aria-hidden="true" />Random story</button>
    </div>

    <div className="mb-4 flex flex-wrap gap-2" aria-label="Choose a STAR story">
      {starMentalModels.map((model) => <button
        key={model.storyKey}
        type="button"
        aria-pressed={selectedStoryKey === model.storyKey}
        onClick={() => selectStory(model.storyKey)}
        className={`rounded-md border px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${selectedStoryKey === model.storyKey ? "border-arch-blue bg-arch-blue text-white" : "border-arch-border bg-arch-bg2 text-arch-text2 hover:border-arch-blue/40 hover:text-arch-blue"}`}
      >{storyShortName(model)}</button>)}
    </div>

    <section className="rounded-xl border border-arch-border bg-arch-bg2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-wider text-arch-purple"><Brain className="h-4 w-4" aria-hidden="true" />Mental spine</div>
          <h2 className="mt-1 text-[14px] font-semibold text-arch-text">{currentModel.storyTitle}</h2>
          <p className="mt-1 text-[10px] leading-5 text-arch-text3">Use for: {currentModel.useFor}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={mode === "recall"} onClick={() => { setMode("recall"); setRevealed(new Set()); setAnswerRevealed(false); setDraft(null); }} className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-semibold ${mode === "recall" ? "border-arch-amber/50 bg-arch-amber/10 text-arch-amber" : "border-arch-border text-arch-text2"}`}><EyeOff className="h-3.5 w-3.5" aria-hidden="true" />Recall</button>
          <button type="button" aria-pressed={mode === "study"} onClick={() => { setMode("study"); setRevealed(new Set(currentModel.nodes.map((node) => node.id))); }} className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-semibold ${mode === "study" ? "border-arch-green/50 bg-arch-green/10 text-arch-green" : "border-arch-border text-arch-text2"}`}><Eye className="h-3.5 w-3.5" aria-hidden="true" />Study</button>
          {!draft && <button type="button" onClick={beginEditing} className="flex items-center gap-1.5 rounded-md border border-arch-border px-2.5 py-1.5 text-[10px] font-semibold text-arch-text2 hover:border-arch-blue/40 hover:text-arch-blue"><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Edit wording</button>}
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-arch-bg px-3 py-2 text-[11px] font-semibold text-arch-amber">
        {draft
          ? <input value={draft.memoryCode} onChange={(event) => setDraft({ ...draft, memoryCode: event.target.value })} maxLength={500} aria-label="Memory code" className="w-full rounded-md border border-arch-border bg-arch-bg2 px-2.5 py-2 text-[11px] text-arch-text outline-none focus:border-arch-blue/60" />
          : currentModel.memoryCode}
      </div>

      <div className="mt-4">
        <MentalModelDiagram model={currentModel} mode={mode} revealed={revealed} editing={Boolean(draft)} onReveal={revealNode} onNodeChange={updateNode} />
      </div>

      {mode === "recall" && !draft && <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" disabled={allRevealed} onClick={revealNext} className="rounded-md bg-arch-blue px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{allRevealed ? "All nodes revealed" : "Reveal next node"}</button>
        <button type="button" onClick={() => setRevealed(new Set())} className="flex items-center gap-1.5 rounded-md border border-arch-border px-2.5 py-1.5 text-[10px] font-semibold text-arch-text2"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Reset recall</button>
        <span className="text-[10px] text-arch-text3">{revealed.size} / {currentModel.nodes.length} recalled</span>
      </div>}
    </section>

    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
      <section className="rounded-xl border border-arch-border bg-arch-bg2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[12.5px] font-semibold text-arch-text">Answer-length drill</h2>
          <div className="flex gap-1" aria-label="Answer length">
            {(["30", "90", "deep"] as AnswerDepth[]).map((depth) => <button key={depth} type="button" aria-pressed={answerDepth === depth} onClick={() => { setAnswerDepth(depth); setAnswerRevealed(false); }} className={`rounded-md border px-2 py-1 text-[9.5px] font-semibold ${answerDepth === depth ? "border-arch-purple/50 bg-arch-purple/10 text-arch-purple" : "border-arch-border text-arch-text3"}`}>{depth === "deep" ? "Deep dive" : `${depth} sec`}</button>)}
          </div>
        </div>

        {draft && answerDepth !== "deep" ? <textarea
          value={answerDepth === "30" ? draft.answer30 : draft.answer90}
          onChange={(event) => setDraft({ ...draft, [answerDepth === "30" ? "answer30" : "answer90"]: event.target.value })}
          rows={answerDepth === "30" ? 6 : 10}
          maxLength={answerDepth === "30" ? 5_000 : 12_000}
          aria-label={`${answerDepth} second answer`}
          className="mt-3 w-full resize-y rounded-lg border border-arch-border bg-arch-bg px-3 py-2 text-[10.5px] leading-5 text-arch-text outline-none focus:border-arch-blue/60"
        /> : <div className="mt-3">
          {!answerRevealed
            ? <button type="button" onClick={() => setAnswerRevealed(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-arch-purple/40 bg-arch-purple/5 px-3 py-6 text-[10.5px] font-semibold text-arch-purple"><Eye className="h-4 w-4" aria-hidden="true" />Reveal model answer after speaking</button>
            : answerDepth === "deep" && sourceStory
              ? <div className="grid gap-2 md:grid-cols-2">{[
                  ["Situation", sourceStory.situation],
                  ["Task", sourceStory.task],
                  ["Action", sourceStory.action],
                  ["Result", sourceStory.result],
                ].map(([label, value]) => <div key={label} className="rounded-lg bg-arch-bg p-3"><div className="text-[9px] font-bold uppercase tracking-wider text-arch-amber">{label}</div><p className="mt-1 text-[10.5px] leading-5 text-arch-text2">{value}</p></div>)}</div>
              : <p className="whitespace-pre-line rounded-lg bg-arch-bg p-3 text-[10.5px] leading-5 text-arch-text2">{answerDepth === "30" ? currentModel.answer30 : currentModel.answer90}</p>}
        </div>}
      </section>

      <section className="rounded-xl border border-arch-border bg-arch-bg2 p-4">
        <h2 className="text-[12.5px] font-semibold text-arch-text">Confidence and repetition</h2>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {(["Weak", "Developing", "Ready"] as PracticeConfidence[]).map((confidence) => <button key={confidence} type="button" disabled={saving} aria-pressed={currentStatus.confidence === confidence} onClick={() => void setConfidence(confidence)} className={`rounded-md border px-2 py-2 text-[9.5px] font-semibold disabled:opacity-50 ${currentStatus.confidence === confidence ? "border-arch-green bg-arch-green/15 text-arch-green" : "border-arch-border text-arch-text3"}`}>{confidence}</button>)}
        </div>
        <div className="mt-3 rounded-lg bg-arch-bg p-3 text-[10px] leading-5 text-arch-text2">
          <div><span className="text-arch-text3">Repetitions:</span> {currentStatus.practiceCount}</div>
          <div><span className="text-arch-text3">Last practice:</span> {formatPracticeDate(currentStatus.lastPracticedAt)}</div>
        </div>
        <button type="button" disabled={saving} onClick={() => void markPractised()} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-arch-green px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-50"><Check className="h-4 w-4" aria-hidden="true" />Mark repetition complete</button>
        {syncNote && <p className="mt-2 text-[9.5px] leading-4 text-arch-amber">{syncNote}</p>}
      </section>
    </div>

    <section className="mt-4 rounded-xl border border-arch-border bg-arch-bg2 p-4">
      <h2 className="text-[12.5px] font-semibold text-arch-text">Pressure-test branches</h2>
      <p className="mt-1 text-[10px] leading-5 text-arch-text3">Answer the question before opening the route back into the diagram.</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">{currentModel.followUps.map((followUp) => <details key={followUp.question} className="rounded-lg border border-arch-border bg-arch-bg p-3"><summary className="cursor-pointer text-[10.5px] font-semibold text-arch-text">{followUp.question}</summary><p className="mt-2 text-[10px] leading-5 text-arch-purple">{followUp.route}</p></details>)}</div>
    </section>

    {draft && <div className="sticky bottom-3 mt-4 flex justify-end gap-2 rounded-xl border border-arch-blue/30 bg-arch-bg2/95 p-3 shadow-lg backdrop-blur">
      <button type="button" disabled={saving} onClick={() => setDraft(null)} className="rounded-md border border-arch-border px-3 py-2 text-[10px] font-semibold text-arch-text2 disabled:opacity-50">Cancel edits</button>
      <button type="button" disabled={saving} onClick={() => void saveDraft()} className="flex items-center gap-1.5 rounded-md bg-arch-blue px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" aria-hidden="true" />{saving ? "Saving…" : "Save model"}</button>
    </div>}
  </div>;
}
