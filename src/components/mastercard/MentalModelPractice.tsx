"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Brain,
  Check,
  Dices,
  Eye,
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
const FLOW_STEPS = [
  {
    id: "problem",
    label: "Problem",
    prompt: "What was happening, and why did it matter?",
    nodeIds: ["context", "tension"],
    fallbackIndexes: [0, 1],
    activeClass: "border-arch-blue bg-arch-blue/10 text-arch-blue",
    numberClass: "bg-arch-blue text-white",
  },
  {
    id: "goal",
    label: "Goal",
    prompt: "What were you responsible for?",
    nodeIds: ["mandate"],
    fallbackIndexes: [2],
    activeClass: "border-arch-purple bg-arch-purple/10 text-arch-purple",
    numberClass: "bg-arch-purple text-white",
  },
  {
    id: "insight",
    label: "Insight",
    prompt: "What did you discover?",
    nodeIds: ["diagnosis"],
    fallbackIndexes: [3],
    activeClass: "border-arch-amber bg-arch-amber/10 text-arch-amber",
    numberClass: "bg-arch-amber text-white",
  },
  {
    id: "action",
    label: "Action",
    prompt: "What decision did you make, and what did you do?",
    nodeIds: ["decision", "execution"],
    fallbackIndexes: [4, 5],
    activeClass: "border-arch-teal bg-arch-teal/10 text-arch-teal",
    numberClass: "bg-arch-teal text-white",
  },
  {
    id: "impact",
    label: "Impact",
    prompt: "What changed, and what did you learn?",
    nodeIds: ["evidence", "lesson"],
    fallbackIndexes: [6, 7],
    activeClass: "border-arch-green bg-arch-green/10 text-arch-green",
    numberClass: "bg-arch-green text-white",
  },
] as const;

type FlowStepId = (typeof FLOW_STEPS)[number]["id"];

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

function nodesForStep(model: StarMentalModel, step: (typeof FLOW_STEPS)[number]) {
  const byId = new Map(model.nodes.map((node) => [node.id, node]));
  const matched = step.nodeIds.flatMap((nodeId) => {
    const node = byId.get(nodeId);
    return node ? [node] : [];
  });

  return matched.length > 0
    ? matched
    : step.fallbackIndexes.flatMap((index) => model.nodes[index] ? [model.nodes[index]] : []);
}

function MentalModelFlow({
  model,
  revealed,
  activeStepId,
  editing,
  onSelect,
  onNodeChange,
}: {
  model: StarMentalModel;
  revealed: Set<string>;
  activeStepId: FlowStepId;
  editing: boolean;
  onSelect: (stepId: FlowStepId) => void;
  onNodeChange: (nodeId: string, detail: string) => void;
}) {
  const activeStep = FLOW_STEPS.find((step) => step.id === activeStepId) ?? FLOW_STEPS[0];
  const activeNodes = nodesForStep(model, activeStep);
  const activeIsVisible = editing || revealed.has(activeStep.id);
  const detailId = `mental-model-${model.storyKey}-${activeStep.id}`;

  return <div>
    <ol className="grid gap-5 lg:grid-cols-5">
      {FLOW_STEPS.map((step, index) => {
        const isVisible = editing || revealed.has(step.id);
        const isActive = activeStepId === step.id;

        return <li key={step.id} className="relative min-w-0">
        <button
          type="button"
          aria-expanded={isVisible}
          aria-controls={isActive ? detailId : undefined}
          onClick={() => onSelect(step.id)}
          className={`h-full min-h-28 w-full rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-blue/50 ${isActive ? step.activeClass : isVisible ? "border-arch-border bg-arch-bg" : "border-arch-border bg-arch-bg2 hover:border-arch-blue/35"}`}
        >
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isVisible ? step.numberClass : "bg-arch-border text-arch-text3"}`}>{index + 1}</span>
            <span className="text-[13px] font-semibold text-arch-text">{step.label}</span>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-arch-text2">{step.prompt}</p>
          <div className={`mt-2 text-[10px] font-semibold ${isVisible ? "text-arch-green" : "text-arch-text3"}`}>{isVisible ? "Revealed" : "Click to reveal"}</div>
        </button>
        {index < FLOW_STEPS.length - 1 && <>
          <ArrowRight className="absolute -right-4 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-arch-text3 lg:block" aria-hidden="true" />
          <ArrowDown className="absolute -bottom-4 left-1/2 h-4 w-4 -translate-x-1/2 text-arch-text3 lg:hidden" aria-hidden="true" />
        </>}
      </li>;
    })}
    </ol>

    <div id={detailId} className="mt-4 rounded-xl border border-arch-border bg-arch-bg p-4" aria-live="polite">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${activeStep.numberClass}`}>{FLOW_STEPS.findIndex((step) => step.id === activeStep.id) + 1}</span>
        <div>
          <h3 className="text-[13px] font-semibold text-arch-text">{activeStep.label}</h3>
          <p className="text-[11px] text-arch-text3">{activeStep.prompt}</p>
        </div>
      </div>

      {activeIsVisible ? <div className={`mt-3 grid gap-2 ${activeNodes.length > 1 ? "md:grid-cols-2" : ""}`}>
        {activeNodes.map((node) => <div key={node.id} className="rounded-lg border border-arch-border bg-arch-bg2 p-3">
          {activeNodes.length > 1 && <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-arch-amber">{node.label}</div>}
          {editing
            ? <textarea
                value={node.detail}
                onChange={(event) => onNodeChange(node.id, event.target.value)}
                rows={5}
                maxLength={4_000}
                aria-label={`${node.label} detail`}
                className="w-full resize-y rounded-md border border-arch-border bg-arch-bg px-3 py-2 text-[12px] leading-6 text-arch-text outline-none focus:border-arch-blue/60 focus:ring-2 focus:ring-arch-blue/15"
              />
            : <p className="text-[12px] leading-6 text-arch-text2">{node.detail}</p>}
        </div>)}
      </div> : <button type="button" onClick={() => onSelect(activeStep.id)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-arch-blue/40 bg-arch-blue/5 px-3 py-5 text-[11px] font-semibold text-arch-blue"><Eye className="h-4 w-4" aria-hidden="true" />Reveal this step</button>}
    </div>
  </div>;
}

export default function MentalModelPractice() {
  const [selectedStoryKey, setSelectedStoryKey] = useState(starMentalModels[0].storyKey);
  const [models, setModels] = useState<Record<string, StarMentalModel>>(defaultModels);
  const [statuses, setStatuses] = useState<Record<string, PracticeStatus>>(defaultStatuses);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set([FLOW_STEPS[0].id]));
  const [activeStepId, setActiveStepId] = useState<FlowStepId>(FLOW_STEPS[0].id);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [draft, setDraft] = useState<StarMentalModel | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const currentModel = draft ?? models[selectedStoryKey] ?? starMentalModels[0];
  const currentStatus = statuses[selectedStoryKey] ?? defaultStatuses[selectedStoryKey];
  const sourceStory = starStories.find((story) => story.title === currentModel.storyTitle);
  const allRevealed = FLOW_STEPS.every((step) => revealed.has(step.id));

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
    setRevealed(new Set([FLOW_STEPS[0].id]));
    setActiveStepId(FLOW_STEPS[0].id);
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

  const selectStep = (stepId: FlowStepId) => {
    setActiveStepId(stepId);
    setRevealed((current) => new Set(current).add(stepId));
  };

  const revealNext = () => {
    const nextStep = FLOW_STEPS.find((step) => !revealed.has(step.id));
    if (nextStep) selectStep(nextStep.id);
  };

  const randomStory = () => {
    const candidates = starMentalModels.filter((model) => model.storyKey !== selectedStoryKey);
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    selectStory(next.storyKey);
  };

  const beginEditing = () => {
    setRevealed(new Set(FLOW_STEPS.map((step) => step.id)));
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
    <div className="mb-5">
      <h1 className="text-xl font-semibold tracking-tight text-arch-text">Story flow practice</h1>
      <p className="mt-1 max-w-3xl text-[12px] leading-6 text-arch-text2">Remember every story in the same five moves: <strong className="text-arch-text">Problem → Goal → Insight → Action → Impact.</strong> Click one box at a time and say that part aloud before revealing it.</p>
    </div>

    <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-arch-border bg-arch-bg2 p-3">
      <label className="min-w-[240px] flex-1 text-[11px] font-semibold text-arch-text2">
        Choose a story
        <select value={selectedStoryKey} onChange={(event) => selectStory(event.target.value)} className="mt-1 block w-full rounded-lg border border-arch-border bg-arch-bg px-3 py-2.5 text-[12px] font-medium text-arch-text outline-none focus:border-arch-blue/60 focus:ring-2 focus:ring-arch-blue/15">
          {starMentalModels.map((model) => <option key={model.storyKey} value={model.storyKey}>{storyShortName(model)}</option>)}
        </select>
      </label>
      <button type="button" onClick={randomStory} className="flex items-center gap-1.5 rounded-lg border border-arch-border bg-arch-bg px-3 py-2.5 text-[11px] font-semibold text-arch-text2 transition-colors hover:border-arch-purple/40 hover:text-arch-purple"><Dices className="h-4 w-4" aria-hidden="true" />Surprise me</button>
    </div>

    <section className="rounded-xl border border-arch-border bg-arch-bg2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-arch-purple"><Brain className="h-4 w-4" aria-hidden="true" />Five-step story map</div>
          <h2 className="mt-1 text-[15px] font-semibold text-arch-text">{currentModel.storyTitle}</h2>
          <p className="mt-1 text-[11px] leading-5 text-arch-text3">Best for: {currentModel.useFor}</p>
        </div>
        {!draft && <button type="button" onClick={beginEditing} className="flex items-center gap-1.5 rounded-lg border border-arch-border px-3 py-2 text-[11px] font-semibold text-arch-text2 hover:border-arch-blue/40 hover:text-arch-blue"><Pencil className="h-4 w-4" aria-hidden="true" />Edit my wording</button>}
      </div>

      <div className="mt-4 rounded-lg border border-arch-amber/20 bg-arch-amber/5 px-3 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-arch-amber">Memory line</div>
        {draft
          ? <input value={draft.memoryCode} onChange={(event) => setDraft({ ...draft, memoryCode: event.target.value })} maxLength={500} aria-label="Memory line" className="mt-1.5 w-full rounded-md border border-arch-border bg-arch-bg2 px-3 py-2 text-[12px] text-arch-text outline-none focus:border-arch-blue/60" />
          : <p className="mt-1 text-[13px] font-semibold leading-6 text-arch-text">{currentModel.memoryCode}</p>}
      </div>

      <div className="mt-4">
        <MentalModelFlow model={currentModel} revealed={revealed} activeStepId={activeStepId} editing={Boolean(draft)} onSelect={selectStep} onNodeChange={updateNode} />
      </div>

      {!draft && <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={allRevealed} onClick={revealNext} className="rounded-lg bg-arch-blue px-3 py-2 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{allRevealed ? "All five steps revealed" : "Reveal next step"}</button>
        <button type="button" onClick={() => setRevealed(new Set(FLOW_STEPS.map((step) => step.id)))} className="flex items-center gap-1.5 rounded-lg border border-arch-border px-3 py-2 text-[11px] font-semibold text-arch-text2"><Eye className="h-4 w-4" aria-hidden="true" />Show all</button>
        <button type="button" onClick={() => { setRevealed(new Set([FLOW_STEPS[0].id])); setActiveStepId(FLOW_STEPS[0].id); setAnswerRevealed(false); }} className="flex items-center gap-1.5 rounded-lg border border-arch-border px-3 py-2 text-[11px] font-semibold text-arch-text2"><RotateCcw className="h-4 w-4" aria-hidden="true" />Start over</button>
        <span className="ml-auto text-[11px] text-arch-text3">{revealed.size} of {FLOW_STEPS.length} steps</span>
      </div>}
    </section>

    <section className="mt-4 rounded-xl border border-arch-border bg-arch-bg2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-arch-text">Say the story out loud</h2>
          <p className="mt-1 text-[11px] text-arch-text3">Aim for 60–90 seconds. Then compare your answer.</p>
        </div>
        {!draft && <button type="button" disabled={saving} onClick={() => void markPractised()} className="flex items-center gap-1.5 rounded-lg bg-arch-green px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-50"><Check className="h-4 w-4" aria-hidden="true" />Mark practice complete</button>}
      </div>

      {draft ? <textarea
        value={draft.answer90}
        onChange={(event) => setDraft({ ...draft, answer90: event.target.value })}
        rows={9}
        maxLength={12_000}
        aria-label="90 second answer"
        className="mt-3 w-full resize-y rounded-lg border border-arch-border bg-arch-bg px-3 py-2 text-[12px] leading-6 text-arch-text outline-none focus:border-arch-blue/60"
      /> : <div className="mt-3">
        {!answerRevealed
          ? <button type="button" onClick={() => setAnswerRevealed(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-arch-purple/40 bg-arch-purple/5 px-3 py-5 text-[11px] font-semibold text-arch-purple"><Eye className="h-4 w-4" aria-hidden="true" />Reveal the 90-second example</button>
          : <p className="whitespace-pre-line rounded-lg bg-arch-bg p-4 text-[12px] leading-6 text-arch-text2">{currentModel.answer90}</p>}
      </div>}
      {syncNote && <p className="mt-2 text-[10px] leading-5 text-arch-amber">{syncNote}</p>}
    </section>

    <details open={draft ? true : undefined} className="mt-4 rounded-xl border border-arch-border bg-arch-bg2 p-4">
      <summary className="cursor-pointer text-[13px] font-semibold text-arch-text">More practice options</summary>
      <p className="mt-1 text-[11px] text-arch-text3">Open only when you want a shorter answer, confidence tracking, or follow-up practice.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-arch-border bg-arch-bg p-3">
          <h3 className="text-[12px] font-semibold text-arch-text">30-second version</h3>
          {draft ? <textarea
            value={draft.answer30}
            onChange={(event) => setDraft({ ...draft, answer30: event.target.value })}
            rows={6}
            maxLength={5_000}
            aria-label="30 second answer"
            className="mt-2 w-full resize-y rounded-lg border border-arch-border bg-arch-bg2 px-3 py-2 text-[12px] leading-6 text-arch-text outline-none focus:border-arch-blue/60"
          /> : <p className="mt-2 text-[11.5px] leading-6 text-arch-text2">{currentModel.answer30}</p>}
        </section>

        <section className="rounded-lg border border-arch-border bg-arch-bg p-3">
          <h3 className="text-[12px] font-semibold text-arch-text">Confidence and repetition</h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["Weak", "Developing", "Ready"] as PracticeConfidence[]).map((confidence) => <button key={confidence} type="button" disabled={saving || Boolean(draft)} aria-pressed={currentStatus.confidence === confidence} onClick={() => void setConfidence(confidence)} className={`rounded-lg border px-2 py-2 text-[10px] font-semibold disabled:opacity-50 ${currentStatus.confidence === confidence ? "border-arch-green bg-arch-green/15 text-arch-green" : "border-arch-border text-arch-text3"}`}>{confidence}</button>)}
          </div>
          <div className="mt-3 text-[11px] leading-6 text-arch-text2">
            <div><span className="text-arch-text3">Completed practices:</span> {currentStatus.practiceCount}</div>
            <div><span className="text-arch-text3">Last practice:</span> {formatPracticeDate(currentStatus.lastPracticedAt)}</div>
          </div>
        </section>
      </div>

      {sourceStory && <section className="mt-4 rounded-lg border border-arch-border bg-arch-bg p-3">
        <h3 className="text-[12px] font-semibold text-arch-text">Full STAR reference</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">{[
          ["Situation", sourceStory.situation],
          ["Task", sourceStory.task],
          ["Action", sourceStory.action],
          ["Result", sourceStory.result],
        ].map(([label, value]) => <div key={label} className="rounded-lg border border-arch-border bg-arch-bg2 p-3"><div className="text-[10px] font-semibold uppercase tracking-wide text-arch-amber">{label}</div><p className="mt-1 text-[11.5px] leading-6 text-arch-text2">{value}</p></div>)}</div>
      </section>}

      <section className="mt-4 rounded-lg border border-arch-border bg-arch-bg p-3">
        <h3 className="text-[12px] font-semibold text-arch-text">Optional follow-up questions</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">{currentModel.followUps.map((followUp) => <details key={followUp.question} className="rounded-lg border border-arch-border bg-arch-bg2 p-3"><summary className="cursor-pointer text-[11px] font-semibold text-arch-text">{followUp.question}</summary><p className="mt-2 text-[11px] leading-5 text-arch-purple">Answer path: {followUp.route.replace(/^Tension|^Diagnosis/, "Problem").replace(/^Mandate/, "Goal").replace(/^Decision|^Execution/, "Action").replace(/^Evidence/, "Impact")}</p></details>)}</div>
      </section>
    </details>

    {draft && <div className="sticky bottom-3 mt-4 flex justify-end gap-2 rounded-xl border border-arch-blue/30 bg-arch-bg2/95 p-3 shadow-lg backdrop-blur">
      <button type="button" disabled={saving} onClick={() => setDraft(null)} className="rounded-lg border border-arch-border px-3 py-2 text-[11px] font-semibold text-arch-text2 disabled:opacity-50">Cancel edits</button>
      <button type="button" disabled={saving} onClick={() => void saveDraft()} className="flex items-center gap-1.5 rounded-lg bg-arch-blue px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" aria-hidden="true" />{saving ? "Saving…" : "Save my wording"}</button>
    </div>}
  </div>;
}
