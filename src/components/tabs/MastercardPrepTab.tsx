"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Target } from "lucide-react";
import { toast } from "sonner";
import MentalModelPractice from "@/components/mastercard/MentalModelPractice";
import SectionLayout from "@/components/ui/SectionLayout";
import FlowDiagram from "@/components/ui/FlowDiagram";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import { useQuestionPractice } from "@/lib/hooks/useQuestionPractice";
import {
  acquisitionLifecycleCards,
  acquisitionQuestionsToAsk,
  acquisitionStackBrief,
  acquisitionStackItems,
  applicationAlignment,
  cardNetworkAuthDiagram,
  cardNetworkFlowNodes,
  cardNetworkFlowSteps,
  cardNetworkFundamentals,
  cardNetworkSettlementDiagram,
  featureLaunchFramework,
  focusCards,
  interviewStages,
  jobDescriptionCards,
  michaelCachoProfileCards,
  michaelCachoStageTwoQuestions,
  mastercardIntelligenceCards,
  mastercardCultureResearch,
  mastercardProductResearch,
  mastercardQuestionsToAsk,
  mastercardReferences,
  mastercardResearchChecklist,
  mastercardResearchQuestions,
  mastercardRoleResearch,
  mastercardSampleQuestions,
  mastercardStrategyResearch,
  mastercardTerms,
  paymentFlowTerms,
  rehearsalChecklist,
  roundFourQuestions,
  roundOneQuestions,
  roundPlaybooks,
  roundThreeQuestions,
  resumeCards,
  starStories,
  storyRoutes,
  technicalFollowUps,
  type InterviewQuestion,
  type AcquisitionStackItem,
  type ApplicationAlignment,
  type MastercardTerm,
  type PracticeConfidence,
  type PrepCard,
  type PrepColor,
  type TechnicalInterviewQuestion,
} from "@/data/mastercard-prep";

const sidebarItems = [{ id: "mc-focus", label: "Four-stage overview" }];
const sidebarGroups = [
  { label: "Process", items: [{ id: "mc-rounds", label: "Four-stage roadmap" }] },
  { label: "Card network 101", items: [
    { id: "mc-network-basics", label: "How the network works" },
    { id: "mc-network-flow", label: "Payment flow (click-through)" },
  ] },
  { label: "Sample questions", items: [{ id: "mc-sample-questions", label: "17 questions & answers" }] },
  { label: "Company research", items: [
    { id: "mc-intelligence", label: "Research overview" },
    { id: "mc-research-product", label: "1 · Product & market" },
    { id: "mc-research-acquisitions", label: "Identity acquisition stack" },
    { id: "mc-research-strategy", label: "2 · Strategy & SWOT" },
    { id: "mc-research-culture", label: "3 · Culture & people" },
    { id: "mc-research-role", label: "4 · Role & fit" },
    { id: "mc-research-questions", label: "5 · Questions & checklist" },
    { id: "mc-research-sources", label: "Sources" },
  ] },
  { label: "Application materials", items: [{ id: "mc-jd", label: "Job description" }, { id: "mc-resume", label: "Résumé used to apply" }, { id: "mc-alignment", label: "JD → résumé evidence" }] },
  { label: "✓ Stage 1 · Done", items: [{ id: "mc-round-1", label: "Completed · Hiring manager" }] },
  { label: "Stage 2 · Technical", items: [{ id: "mc-interviewer", label: "Michael Cacho prep" }, { id: "mc-round-2", label: "Detailed technical bank" }] },
  { label: "Stage 3 · Bar raiser", items: [{ id: "mc-round-3", label: "Leadership scenario" }] },
  { label: "Stage 4 · Bar raiser", items: [{ id: "mc-round-4", label: "Program-leadership gauntlet" }] },
  { label: "Practice", items: [{ id: "mc-mental-models", label: "Simple story flow" }, { id: "mc-stars", label: "Your STAR stories" }, { id: "mc-stories", label: "Story map" }, { id: "mc-rehearse", label: "Rehearsal checklist" }] },
];

const colorClasses: Record<PrepColor, string> = {
  blue: "border-l-arch-blue",
  purple: "border-l-arch-purple",
  teal: "border-l-arch-teal",
  amber: "border-l-arch-amber",
  green: "border-l-arch-green",
  coral: "border-l-arch-coral",
  gray: "border-l-arch-gray",
};

function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-1.5 text-xl font-semibold tracking-tight text-arch-text">{children}</h1>;
}

function Intro({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 max-w-4xl text-[12px] leading-7 text-arch-text2">{children}</p>;
}

function Cards({ cards, columns = 2 }: { cards: PrepCard[]; columns?: 1 | 2 }) {
  const grid = columns === 2 ? "md:grid-cols-2" : "grid-cols-1";

  return <div className={`grid grid-cols-1 ${grid} gap-3`}>{cards.map((card) => (
    <article key={card.title} className={`rounded-xl border border-arch-border border-l-[3px] ${colorClasses[card.color ?? "blue"]} bg-arch-bg2 p-4`}>
      <h2 className="mb-1.5 text-[12.5px] font-semibold text-arch-text">{card.title}</h2>
      <p className="whitespace-pre-line text-[11px] leading-[1.75] text-arch-text2">{card.body}</p>
      {card.cue && <div className="mt-3 rounded-md bg-arch-bg px-2.5 py-2 text-[10.5px] font-medium text-arch-amber"><span className="text-arch-text3">Recall cue:</span> {card.cue}</div>}
    </article>
  ))}</div>;
}

interface SavedInterviewAnswer {
  question_key: string;
  answer: string;
}

const CONFIDENCE_LEVELS: PracticeConfidence[] = ["Weak", "Developing", "Ready"];
const confidenceActiveClass: Record<PracticeConfidence, string> = {
  Weak: "border-arch-coral bg-arch-coral/15 text-arch-coral",
  Developing: "border-arch-amber bg-arch-amber/15 text-arch-amber",
  Ready: "border-arch-green bg-arch-green/15 text-arch-green",
};

function ConfidencePicker({ value, onChange }: { value: PracticeConfidence; onChange: (confidence: PracticeConfidence) => void }) {
  return <div className="flex gap-1.5">{CONFIDENCE_LEVELS.map((level) => <button key={level} type="button" aria-pressed={value === level} onClick={() => onChange(level)} className={`rounded-md border px-2 py-1 text-[9.5px] font-semibold transition-colors ${value === level ? confidenceActiveClass[level] : "border-arch-border text-arch-text3 hover:border-arch-blue/30"}`}>{level}</button>)}</div>;
}

type ConfidenceFilter = "All" | PracticeConfidence;

function ConfidenceFilterBar({ filter, onChange, statuses, questionKeys }: { filter: ConfidenceFilter; onChange: (filter: ConfidenceFilter) => void; statuses: Record<string, PracticeConfidence>; questionKeys: string[] }) {
  const counts: Record<ConfidenceFilter, number> = { All: questionKeys.length, Weak: 0, Developing: 0, Ready: 0 };
  questionKeys.forEach((key) => { counts[statuses[key] ?? "Developing"] += 1; });
  const levels: ConfidenceFilter[] = ["All", ...CONFIDENCE_LEVELS];

  return <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-lg border border-arch-border bg-arch-bg2 p-2">
    <span className="mr-1 text-[9.5px] font-semibold uppercase tracking-wider text-arch-text3">Filter by confidence</span>
    {levels.map((level) => <button key={level} type="button" aria-pressed={filter === level} onClick={() => onChange(level)} className={`rounded-md border px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${filter === level ? (level === "All" ? "border-arch-blue bg-arch-blue/15 text-arch-blue" : confidenceActiveClass[level]) : "border-arch-border text-arch-text2 hover:border-arch-blue/30"}`}>{level} ({counts[level]})</button>)}
  </div>;
}

function QuestionBank({ questions, title, intro, answersHidden = false, answersEditable = false, confidenceTracking = false }: { questions: InterviewQuestion[]; title: string; intro: string; answersHidden?: boolean; answersEditable?: boolean; confidenceTracking?: boolean }) {
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(() => new Set());
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});
  const [answersLoading, setAnswersLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("All");
  const { statuses: confidenceStatuses, syncNote: confidenceSyncNote, setConfidence } = useQuestionPractice(confidenceTracking);

  useEffect(() => {
    if (!answersEditable) return;

    const controller = new AbortController();
    const loadSavedAnswers = async () => {
      setAnswersLoading(true);
      setLoadError(null);
      try {
        const response = await fetch("/api/interview-answers", { signal: controller.signal });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error || "Failed to load saved answers");

        const overrides = Object.fromEntries(
          (body as SavedInterviewAnswer[]).map((item) => [item.question_key, item.answer])
        );
        setSavedAnswers(overrides);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "Failed to load saved answers");
      } finally {
        if (!controller.signal.aborted) setAnswersLoading(false);
      }
    };

    void loadSavedAnswers();
    return () => controller.abort();
  }, [answersEditable]);

  const toggleAnswer = (index: number) => {
    setRevealedAnswers((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const beginEditing = (questionKey: string, answer: string) => {
    setEditingKey(questionKey);
    setDraftAnswer(answer);
  };

  const saveAnswer = async (item: InterviewQuestion, questionKey: string) => {
    const answer = draftAnswer.trim();
    if (!answer) {
      toast.error("The answer cannot be empty.");
      return;
    }

    setSavingKey(questionKey);
    try {
      const response = await fetch("/api/interview-answers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionKey, question: item.question, answer }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Failed to save answer");

      setSavedAnswers((current) => ({ ...current, [questionKey]: body.answer as string }));
      setEditingKey(null);
      toast.success("Answer saved to Supabase.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save answer");
    } finally {
      setSavingKey(null);
    }
  };

  const questionKeys = questions.map((item, index) => item.key ?? `question-${index + 1}`);

  return <div>
    <Title>{title}</Title>
    <Intro>{intro}</Intro>
    {answersEditable && answersLoading && <div className="mb-3 text-[10.5px] text-arch-text3">Loading saved answers…</div>}
    {answersEditable && loadError && <div className="mb-3 rounded-md border border-arch-coral/30 bg-arch-coral/10 px-3 py-2 text-[10.5px] text-arch-coral">Saved answers could not be loaded: {loadError}</div>}
    {confidenceTracking && <ConfidenceFilterBar filter={confidenceFilter} onChange={setConfidenceFilter} statuses={confidenceStatuses} questionKeys={questionKeys} />}
    {confidenceTracking && confidenceSyncNote && <p className="mb-3 text-[10px] leading-5 text-arch-amber">{confidenceSyncNote}</p>}
    <div className={answersHidden ? "space-y-2" : "space-y-3"}>{questions.map((item, index) => {
      const questionKey = questionKeys[index];
      const confidence = confidenceStatuses[questionKey] ?? "Developing";
      if (confidenceTracking && confidenceFilter !== "All" && confidence !== confidenceFilter) return null;
      const isRevealed = revealedAnswers.has(index);
      const hasSavedAnswer = Object.prototype.hasOwnProperty.call(savedAnswers, questionKey);
      const displayedAnswer = savedAnswers[questionKey] ?? item.answer;
      const isEditing = editingKey === questionKey;
      const isSaving = savingKey === questionKey;

      return <article key={questionKey} className={`rounded-xl border border-arch-border bg-arch-bg2 ${answersHidden ? "p-3" : "p-4"}`}>
        <div className={`flex items-start ${answersHidden ? "gap-2" : "gap-3"}`}>
          <span className={`flex shrink-0 items-center justify-center rounded-full bg-arch-coral/10 font-bold text-arch-coral ${answersHidden ? "h-5 w-5 text-[9px]" : "h-6 w-6 text-[10px]"}`}>{index + 1}</span>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
            <div className="min-w-0"><h2 className="text-[12.5px] font-semibold leading-5 text-arch-text">{item.question}</h2><div className={`${answersHidden ? "mt-0.5" : "mt-1"} text-[9.5px] uppercase tracking-wider text-arch-text3`}>{item.audience}</div></div>
            {answersHidden && <button type="button" aria-expanded={isRevealed} aria-controls={`sample-answer-${index}`} onClick={() => { if (isRevealed && isEditing) setEditingKey(null); toggleAnswer(index); }} className="shrink-0 rounded-md border border-arch-blue/30 bg-arch-blue/10 px-2.5 py-1.5 text-[10px] font-semibold leading-none text-arch-blue transition-colors hover:bg-arch-blue/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-blue/50">{isRevealed ? "Hide answer" : "Reveal answer"}</button>}
          </div>
        </div>
        {confidenceTracking && <div className={`flex items-center gap-2 ${answersHidden ? "mt-2 pl-7" : "mt-2 pl-9"}`}>
          <span className="text-[9.5px] font-semibold uppercase tracking-wider text-arch-text3">Confidence</span>
          <ConfidencePicker value={confidence} onChange={(next) => void setConfidence(questionKey, next)} />
        </div>}
        {(!answersHidden || isRevealed) && <div id={answersHidden ? `sample-answer-${index}` : undefined}>
          {answersEditable && <div className="mt-2 flex items-center justify-between gap-2">
            <span className={`text-[9.5px] font-medium ${hasSavedAnswer ? "text-arch-green" : "text-arch-text3"}`}>{hasSavedAnswer ? "Saved in Supabase" : "Default answer"}</span>
            {!isEditing && <button type="button" onClick={() => beginEditing(questionKey, displayedAnswer)} className="rounded-md border border-arch-border px-2 py-1 text-[9.5px] font-semibold text-arch-text2 transition-colors hover:border-arch-blue/40 hover:text-arch-blue">Edit answer</button>}
          </div>}
          {isEditing ? <div className="mt-2">
            <textarea value={draftAnswer} onChange={(event) => setDraftAnswer(event.target.value)} maxLength={20_000} rows={10} aria-label={`Answer for ${item.question}`} className="w-full resize-y rounded-lg border border-arch-border bg-arch-bg px-3 py-2 text-[11px] leading-[1.7] text-arch-text outline-none transition-colors focus:border-arch-blue/60 focus:ring-2 focus:ring-arch-blue/15" />
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" disabled={isSaving} onClick={() => setEditingKey(null)} className="rounded-md border border-arch-border px-2.5 py-1.5 text-[10px] font-semibold text-arch-text2 disabled:opacity-50">Cancel</button>
              <button type="button" disabled={isSaving} onClick={() => void saveAnswer(item, questionKey)} className="rounded-md bg-arch-blue px-2.5 py-1.5 text-[10px] font-semibold text-white transition-opacity disabled:opacity-50">{isSaving ? "Saving…" : "Save answer"}</button>
            </div>
          </div> : <p className={`${answersHidden ? "mt-2" : "mt-3"} whitespace-pre-line text-[11px] leading-[1.7] text-arch-text2`}>{displayedAnswer}</p>}
          <div className={`${answersHidden ? "mt-2 py-1.5" : "mt-3 py-2"} rounded-md bg-arch-bg px-2.5 text-[10.5px] font-medium text-arch-amber`}>Recall cue: {item.cue}</div>
        </div>}
      </article>;
    })}</div>
  </div>;
}

function InterviewRoadmap() {
  return <div><Title>Four-stage interview roadmap</Title><Intro>Your recruiter’s process description aligns with this four-stage preparation plan. Stage 1 and the recruiter screen are done; concentrate your practice on Stages 2–4 while staying adaptable to each interviewer’s exact questions.</Intro><div className="overflow-x-auto rounded-xl border border-arch-border"><table className="w-full min-w-[680px] text-left"><thead className="bg-arch-bg2 text-[10px] uppercase tracking-wider text-arch-text3"><tr>{["Stage", "Format", "Focus", "Status"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{interviewStages.map((stage) => <tr key={stage.stage} className="border-t border-arch-border text-[11px] text-arch-text2"><td className="px-4 py-3 font-semibold text-arch-text">{stage.stage}</td><td className="px-4 py-3">{stage.format}</td><td className="px-4 py-3">{stage.focus}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[9.5px] font-semibold ${stage.status === "Complete" ? "bg-arch-green/10 text-arch-green" : "bg-arch-amber/10 text-arch-amber"}`}>{stage.stage === "Stage 1" ? "Done ✓" : stage.status}</span></td></tr>)}</tbody></table></div></div>;
}

function RoundPage({ round, questions, framework }: { round: 1 | 3 | 4; questions: InterviewQuestion[]; framework?: PrepCard[] }) {
  const playbook = roundPlaybooks[round - 1];
  return <div>
    <Title>{playbook.round}: {playbook.title}{round === 1 ? " — Done ✓" : ""}</Title>
    <Intro>{round === 1 ? "Completed. Keep this as a record of the conversation and use its themes to prepare for the remaining stages." : playbook.objective}</Intro>
    <Cards cards={[
      { title: "What they are testing", body: playbook.interviewerFocus, cue: "Answer the actual signal—not only the surface question", color: playbook.color },
      { title: "Your strongest evidence", body: playbook.evidence, cue: "Use résumé-backed facts you can explain under follow-up", color: "green" },
      { title: "How to prepare", body: playbook.preparation, cue: "Practise out loud; do not memorise a script", color: "amber" },
    ]} columns={1} />
    {framework && <div className="mt-7"><Title>Feature-launch framework</Title><Intro>For the leadership scenario, narrate your reasoning in this sequence. State assumptions aloud and explain how you would validate them.</Intro><Cards cards={framework} /></div>}
    <div className="mt-7"><QuestionBank questions={questions} title={round === 4 ? "Stage 4 pressure-test questions" : "Questions to rehearse"} intro={round === 4 ? "Expect detailed follow-ups. The answer must survive questions about your personal ownership, trade-offs, measures, and learning." : "Use these as adaptable speaking models. Lead with the answer, support it with a résumé-backed example, and pause for the follow-up."} /></div>
  </div>;
}

function AnswerPlanFlow({ steps }: { steps: TechnicalInterviewQuestion["answerPlan"] }) {
  return <div className="flex flex-wrap items-center gap-1.5">
    {steps.map((step, i) => <div key={step.label} className="flex items-center gap-1.5">
      <div className="rounded-lg border border-arch-border bg-arch-bg px-2.5 py-1.5">
        <div className="text-[8.5px] font-bold uppercase tracking-wider text-arch-blue">{step.label}</div>
        <div className="mt-0.5 max-w-[150px] text-[9.5px] leading-4 text-arch-text2">{step.detail}</div>
      </div>
      {i < steps.length - 1 && <ArrowRight className="h-3 w-3 shrink-0 text-arch-text3" />}
    </div>)}
  </div>;
}

function TechnicalQuestionCard({ item, index, confidence, onConfidenceChange }: { item: TechnicalInterviewQuestion; index: number; confidence: PracticeConfidence; onConfidenceChange: (confidence: PracticeConfidence) => void }) {
  const [revealed, setRevealed] = useState(false);
  const priorityStyle = item.priority === "Must know" ? "bg-arch-coral/10 text-arch-coral" : "bg-arch-text3/10 text-arch-text3";

  return <article className="rounded-xl border border-arch-border bg-arch-bg2 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arch-coral/10 text-[10px] font-bold text-arch-coral">{index + 1}</span>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${priorityStyle}`}>{item.priority}</span>
        </div>
        <h2 className="mt-2 text-[12.5px] font-semibold leading-5 text-arch-text">{item.question}</h2>
        <div className="mt-1 text-[9.5px] uppercase tracking-wider text-arch-text3">{item.audience}</div>
      </div>
      <button type="button" aria-expanded={revealed} onClick={() => setRevealed((v) => !v)} className="flex shrink-0 items-center gap-1 rounded-md border border-arch-blue/30 bg-arch-blue/10 px-2.5 py-1.5 text-[10px] font-semibold leading-none text-arch-blue transition-colors hover:bg-arch-blue/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-blue/50">
        {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        {revealed ? "Hide full answer" : "Reveal full answer"}
      </button>
    </div>

    <div className="mt-2 flex items-center gap-2">
      <span className="text-[9.5px] font-semibold uppercase tracking-wider text-arch-text3">Confidence</span>
      <ConfidencePicker value={confidence} onChange={onConfidenceChange} />
    </div>

    <div className="mt-3 rounded-lg bg-arch-bg px-3 py-2.5">
      <div className="text-[9px] font-bold uppercase tracking-wider text-arch-purple">What this is really testing</div>
      <p className="mt-1 text-[10.5px] leading-[1.7] text-arch-text2">{item.testing}</p>
    </div>
    <div className="mt-2 rounded-lg border border-arch-teal/20 bg-arch-teal/5 px-3 py-2.5">
      <div className="text-[9px] font-bold uppercase tracking-wider text-arch-teal">In plain English</div>
      <p className="mt-1 text-[10.5px] leading-[1.7] text-arch-text2">{item.plainEnglish}</p>
    </div>

    <div className="mt-3">
      <div className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-arch-text3">Answer structure</div>
      <AnswerPlanFlow steps={item.answerPlan} />
    </div>

    {revealed && <div className="mt-3 space-y-3 border-t border-arch-border pt-3">
      <p className="whitespace-pre-line text-[11px] leading-[1.75] text-arch-text2">{item.answer}</p>
      <div className="rounded-md bg-arch-green/10 px-2.5 py-2 text-[10.5px] leading-5 text-arch-green"><span className="font-semibold">Résumé anchor:</span> {item.resumeAnchor}</div>
      {item.keyTerms.length > 0 && <div>
        <div className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-arch-text3">Key terms</div>
        <div className="grid gap-1.5 sm:grid-cols-2">{item.keyTerms.map((term) => <div key={term.term} className="rounded-md border border-arch-border bg-arch-bg px-2.5 py-2 text-[10px] leading-5 text-arch-text2"><span className="font-semibold text-arch-text">{term.term}:</span> {term.meaning}</div>)}</div>
      </div>}
      {item.followUps.length > 0 && <div>
        <div className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-arch-text3">Likely follow-ups</div>
        <ul className="space-y-1">{item.followUps.map((question) => <li key={question} className="flex gap-1.5 text-[10.5px] leading-5 text-arch-text2"><span className="text-arch-amber">→</span>{question}</li>)}</ul>
      </div>}
      <div className="rounded-md bg-arch-bg px-2.5 py-2 text-[10.5px] font-medium text-arch-amber"><span className="text-arch-text3">Recall cue:</span> {item.cue}</div>
    </div>}
  </article>;
}

function TechnicalQuestionBank({ questions }: { questions: TechnicalInterviewQuestion[] }) {
  const categories = Array.from(new Set(questions.map((question) => question.category)));
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("All");
  const { statuses: confidenceStatuses, syncNote: confidenceSyncNote, setConfidence } = useQuestionPractice(true);
  const questionKeys = questions.map((question, index) => question.key ?? `question-${index + 1}`);

  return <div>
    <Title>Stage 2 detailed technical question bank</Title>
    <Intro>Grouped by theme, hardest-hitting first within each group. Every card shows what the question actually tests and a plain-English translation up front; reveal the full spoken answer to see the résumé anchor, key terms to use precisely, and the follow-ups Michael is likely to ask next.</Intro>
    <ConfidenceFilterBar filter={confidenceFilter} onChange={setConfidenceFilter} statuses={confidenceStatuses} questionKeys={questionKeys} />
    {confidenceSyncNote && <p className="mb-3 text-[10px] leading-5 text-arch-amber">{confidenceSyncNote}</p>}
    <div className="space-y-7">{categories.map((category) => {
      const items = questions
        .map((question, index) => ({ question, questionKey: questionKeys[index] }))
        .filter(({ question }) => question.category === category)
        .filter(({ questionKey }) => confidenceFilter === "All" || (confidenceStatuses[questionKey] ?? "Developing") === confidenceFilter);
      if (items.length === 0) return null;

      return <div key={category}>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-arch-blue">{category}</h2>
        <div className="space-y-3">{items.map(({ question, questionKey }, index) => <TechnicalQuestionCard key={questionKey} item={question} index={index} confidence={confidenceStatuses[questionKey] ?? "Developing"} onConfidenceChange={(next) => void setConfidence(questionKey, next)} />)}</div>
      </div>;
    })}</div>
  </div>;
}

function TechnicalRoundPage({ questions }: { questions: TechnicalInterviewQuestion[] }) {
  const playbook = roundPlaybooks[1];
  return <div>
    <Title>{playbook.round}: {playbook.title}</Title>
    <Intro>{playbook.objective}</Intro>
    <Cards cards={[
      { title: "What they are testing", body: playbook.interviewerFocus, cue: "Answer the actual signal—not only the surface question", color: playbook.color },
      { title: "Your strongest evidence", body: playbook.evidence, cue: "Use résumé-backed facts you can explain under follow-up", color: "green" },
      { title: "How to prepare", body: playbook.preparation, cue: "Practise out loud; do not memorise a script", color: "amber" },
    ]} columns={1} />
    <div className="mt-7"><TechnicalQuestionBank questions={questions} /></div>
  </div>;
}

function TermTable({ terms }: { terms: MastercardTerm[] }) {
  return <div className="overflow-x-auto rounded-xl border border-arch-border"><table className="w-full min-w-[720px] text-left"><thead className="bg-arch-bg2 text-[10px] uppercase tracking-wider text-arch-text3"><tr>{["Term", "What it means", "Why it matters here"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{terms.map((item) => <tr key={item.term} className="border-t border-arch-border text-[10.5px] leading-5 text-arch-text2"><td className="px-4 py-3 font-semibold text-arch-text">{item.term}</td><td className="px-4 py-3">{item.meaning}</td><td className="px-4 py-3">{item.whyItMatters}</td></tr>)}</tbody></table></div>;
}

function CardNetworkBasics() {
  return <div>
    <Title>How the card network actually works</Title>
    <Intro>Domain background, not job-specific research: the mental model behind every card swipe. Get this right and the Business Identity role reads as a natural extension of the same trust problem — verifying a business instead of a card.</Intro>
    <Cards cards={cardNetworkFundamentals} />
    <div className="mt-7"><Title>Payment-flow terms to use precisely</Title><Intro>The vocabulary a bar raiser expects you to use correctly if you claim payments-adjacent experience.</Intro><TermTable terms={paymentFlowTerms} /></div>
  </div>;
}

function CardNetworkFlowPage() {
  return <div>
    <Title>The payment flow, step by step</Title>
    <Intro>Two diagrams of the same journey. The sequence diagrams below show the full message trail; the click-through diagram underneath lets you step through each hop one at a time — same interaction pattern as Platform → UI pages &amp; flows.</Intro>

    <div className="mb-2 text-[11px] font-semibold text-arch-text">1 · Authorization — real time, about one second</div>
    <MermaidDiagram chart={cardNetworkAuthDiagram} />

    <div className="mb-2 mt-6 text-[11px] font-semibold text-arch-text">2 · Clearing &amp; settlement — batched, one to two days later</div>
    <MermaidDiagram chart={cardNetworkSettlementDiagram} />

    <div className="mt-7">
      <Title>Click through the whole journey</Title>
      <Intro>Use Prev / Next or the dots to walk all 14 steps, from the card being presented to the merchant finally getting paid. The active leg of the journey highlights on the diagram; the panel explains what actually happens and who is involved.</Intro>
      <FlowDiagram nodes={cardNetworkFlowNodes} steps={cardNetworkFlowSteps} />
    </div>
  </div>;
}

function MastercardIntelligence() {
  return <div>
    <Title>Mastercard company research</Title>
    <Intro>Research snapshot updated 25 August 2026. Start with the point of view below, then use the five focused pages for Product, Strategy, Culture, Role, and Questions. Facts come primarily from Mastercard and SEC sources; inferences and product hypotheses are explicitly labelled.</Intro>
    <Cards cards={mastercardIntelligenceCards} />
    <div className="mt-7"><Title>Terms to use precisely</Title><Intro>These are interview-relevant concepts, not claims that you have worked in every one of them. Use them to explain your thinking clearly and identify where you would need to learn the team’s specific implementation.</Intro><TermTable terms={mastercardTerms} /></div>
    <div className="mt-7"><Title>Questions worth asking</Title><Intro>Choose one or two that genuinely help you understand the job. Do not ask all four as a checklist.</Intro><Cards cards={mastercardQuestionsToAsk} /></div>
  </div>;
}

function CompanyResearchPage({ title, intro, cards }: { title: string; intro: string; cards: PrepCard[] }) {
  return <div>
    <Title>{title}</Title>
    <Intro>{intro}</Intro>
    <Cards cards={cards} />
  </div>;
}

function AcquisitionStackTable({ items }: { items: AcquisitionStackItem[] }) {
  return <div className="overflow-x-auto rounded-xl border border-arch-border">
    <table className="w-full min-w-[1180px] text-left">
      <thead className="bg-arch-bg2 text-[9.5px] uppercase tracking-wider text-arch-text3">
        <tr>{["Acquisition", "Capability & lifecycle", "Interview-safe relevance", "Your evidence bridge", "Do not overclaim"].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr>
      </thead>
      <tbody>{items.map((item) => <tr key={item.name} className="border-t border-arch-border align-top text-[10.5px] leading-5 text-arch-text2">
        <td className="w-[130px] px-3 py-3">
          <a href={item.sourceHref} target="_blank" rel="noreferrer" className="font-semibold text-arch-blue hover:underline">{item.name} ↗</a>
          <span className="mt-1 block text-[9.5px] text-arch-text3">{item.acquired}</span>
        </td>
        <td className="w-[255px] px-3 py-3"><span className="text-arch-text">{item.capability}</span><span className="mt-1 block text-[9.5px] font-medium text-arch-purple">{item.lifecycle}</span></td>
        <td className="w-[250px] px-3 py-3">{item.safeRelevance}</td>
        <td className="w-[245px] px-3 py-3 text-arch-green">{item.resumeBridge}</td>
        <td className="w-[260px] px-3 py-3 text-arch-coral">{item.guardrail}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function AcquisitionStackPage() {
  return <div>
    <Title>Mastercard Identity acquisition stack</Title>
    <Intro>This is a source-checked map of capabilities Mastercard has added across the trust lifecycle—not a claim about Mastercard&apos;s internal architecture. Use it to show portfolio awareness, connect the role to your own delivery evidence, and ask informed questions where public information stops.</Intro>
    <div className="mb-5 grid gap-2 md:grid-cols-3">
      <div className="rounded-lg border border-arch-green/25 bg-arch-green/5 p-3 text-[10.5px] leading-5 text-arch-text2"><span className="font-semibold text-arch-green">Confirmed fact</span><br />Acquisition, capability, timing, and public product positioning backed by the linked source.</div>
      <div className="rounded-lg border border-arch-amber/25 bg-arch-amber/5 p-3 text-[10.5px] leading-5 text-arch-text2"><span className="font-semibold text-arch-amber">Strategic interpretation</span><br />A defensible point of view to frame as an inference, then validate with the interviewer.</div>
      <div className="rounded-lg border border-arch-coral/25 bg-arch-coral/5 p-3 text-[10.5px] leading-5 text-arch-text2"><span className="font-semibold text-arch-coral">Avoid claiming</span><br />Internal dependencies, universal product usage, or direct experience that neither public evidence nor your résumé proves.</div>
    </div>
    <Cards cards={acquisitionStackBrief} />
    <div className="mt-7"><Title>Lifecycle mental model</Title><Intro>Mastercard publicly frames Security Solutions across pre-transaction, transaction, and post-transaction stages. This simplified view helps you remember how the acquired capabilities can complement one another without implying a fixed internal system diagram.</Intro><Cards cards={acquisitionLifecycleCards} /></div>
    <div className="mt-7"><Title>Acquisition-by-acquisition interview map</Title><Intro>Each linked company name opens the supporting source. The final two columns turn research into a credible answer while protecting you from claims that a bar raiser could challenge.</Intro><AcquisitionStackTable items={acquisitionStackItems} /></div>
    <div className="mt-7"><Title>Questions this research unlocks</Title><Intro>Choose one question that fits the conversation. These are deliberately exploratory: they demonstrate preparation without pretending to know confidential architecture or roadmap details.</Intro><Cards cards={acquisitionQuestionsToAsk} /></div>
  </div>;
}

function ResearchQuestionsPage() {
  return <div>
    <Title>Questions and final research checklist</Title>
    <Intro>Bring three questions, not a long list: one that gives you useful team information, one that shows informed passion, and one that demonstrates product expertise. Adapt the wording to the conversation.</Intro>
    <Cards cards={mastercardResearchQuestions} />
    <div className="mt-7">
      <Title>Before Stage 2</Title>
      <Intro>Use this as a readiness test. You should be able to explain every checked item naturally without reading a script.</Intro>
      <div className="grid gap-2 md:grid-cols-2">{mastercardResearchChecklist.map((item) => <div key={item} className="flex gap-2 rounded-lg border border-arch-border bg-arch-bg2 p-3 text-[11px] leading-5 text-arch-text2"><Target className="mt-0.5 h-4 w-4 shrink-0 text-arch-green" />{item}</div>)}</div>
    </div>
  </div>;
}

function ResearchSources() {
  return <div>
    <Title>Research sources</Title>
    <Intro>Primary sources are the source of truth for company facts. The two employee-review sources are deliberately labelled as outside, anonymous, and directional. Recheck fast-moving news and metrics before a later interview round.</Intro>
    <div className="grid gap-2 md:grid-cols-2">{mastercardReferences.map((reference) => <a key={reference.href} href={reference.href} target="_blank" rel="noreferrer" className="rounded-lg border border-arch-border bg-arch-bg2 p-3 transition-colors hover:border-arch-blue/40"><div className="text-[11px] font-semibold text-arch-blue">{reference.label} ↗</div><div className="mt-1 text-[10.5px] leading-5 text-arch-text2">{reference.note}</div></a>)}</div>
  </div>;
}

function MichaelCachoPrep() {
  return <div>
    <Title>Stage 2 · Michael Cacho preparation</Title>
    <Intro>This briefing uses the professional profile you supplied. It separates verified experience from likely interview themes and excludes personal or irrelevant details. Use the overlap to choose strong examples—not to demonstrate that you researched the interviewer.</Intro>
    <Cards cards={michaelCachoProfileCards} />
    <div className="mt-7">
      <QuestionBank questions={michaelCachoStageTwoQuestions} title="Questions his background makes more likely" intro="These are preparation hypotheses, not leaked or confirmed questions. Rehearse the structure and evidence, then answer the wording you actually receive." />
    </div>
  </div>;
}

function ApplicationAlignmentTable({ rows }: { rows: ApplicationAlignment[] }) {
  return <div className="overflow-x-auto rounded-xl border border-arch-border"><table className="w-full min-w-[900px] text-left"><thead className="bg-arch-bg2 text-[10px] uppercase tracking-wider text-arch-text3"><tr>{["Job requirement", "Résumé evidence", "Where to use it"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.requirement} className="border-t border-arch-border text-[10.5px] leading-5 text-arch-text2"><td className="px-4 py-3 font-semibold text-arch-text">{row.requirement}</td><td className="px-4 py-3">{row.resumeEvidence}</td><td className="px-4 py-3 text-arch-blue">{row.interviewRoute}</td></tr>)}</tbody></table></div>;
}

function ApplicationMaterials({ type }: { type: "jd" | "resume" | "alignment" }) {
  if (type === "jd") return <div><Title>Job description: working brief</Title><Intro>Mastercard Manager, Product Management - Technical · Business Identity, Security Solutions · Toronto hybrid · Req R-281813. This is the job description used for your application, distilled into the parts that should guide interview preparation.</Intro><Cards cards={jobDescriptionCards} /></div>;
  if (type === "resume") return <div><Title>Résumé used to apply: working brief</Title><Intro>Use this as the single source of truth for your interview examples. A bar raiser may ask for the detail behind any ownership claim, technical term, result, or credential shown here.</Intro><Cards cards={resumeCards} /></div>;
  return <div><Title>Job description → résumé evidence</Title><Intro>This map shows where your submitted résumé directly supports the role and where you should be candid about an adjacent—not direct—match. It is a preparation tool, not a reason to overstate experience.</Intro><ApplicationAlignmentTable rows={applicationAlignment} /></div>;
}

function StoryMap() {
  return <div><Title>Question-to-story map</Title><Intro>Use the same résumé-backed examples repeatedly, but change the emphasis to answer the question. A strong interview is a conversation, not a sequence of unrelated scripts.</Intro><div className="overflow-x-auto rounded-xl border border-arch-border"><table className="w-full min-w-[760px] text-left"><thead className="bg-arch-bg2 text-[10px] uppercase tracking-wider text-arch-text3"><tr>{["Question type", "Best story", "Proof to surface"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{storyRoutes.map((route) => <tr key={route.questionType} className="border-t border-arch-border text-[10.5px] leading-5 text-arch-text2"><td className="px-4 py-3 font-semibold text-arch-text">{route.questionType}</td><td className="px-4 py-3 text-arch-blue">{route.primaryStory}</td><td className="px-4 py-3">{route.proof}{route.guardrail && <span className="mt-1 block text-arch-coral">{route.guardrail}</span>}</td></tr>)}</tbody></table></div></div>;
}

function StarBank() {
  return <div><Title>Your STAR story bank</Title><Intro>These are your supplied stories. Keep each answer to about two minutes, lead with the tension or decision, and be ready to go deeper on your personal ownership. Use only details you can substantiate under follow-up.</Intro><div className="space-y-4">{starStories.map((story) => <article key={story.title} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="text-[13px] font-semibold text-arch-text">{story.title}</h2><span className="rounded-full bg-arch-purple/10 px-2 py-1 text-[9.5px] text-arch-purple">{story.useFor}</span></div><div className="grid gap-2 md:grid-cols-2">{[["Situation", story.situation], ["Task", story.task], ["Action", story.action], ["Result", story.result]].map(([label, value]) => <div key={label} className="rounded-lg bg-arch-bg p-3"><div className="text-[9px] font-bold uppercase tracking-wider text-arch-amber">{label}</div><p className="mt-1 text-[10.5px] leading-5 text-arch-text2">{value}</p></div>)}</div><div className="mt-3 text-[10.5px] leading-5 text-arch-green"><strong>Manager framing:</strong> {story.managerFrame}</div></article>)}</div></div>;
}

function RehearsalChecklist() {
  return <div><Title>Rehearsal checklist</Title><Intro>Prepare enough to be specific, then leave space to listen and adapt. The goal is a credible conversation, not perfect recitation.</Intro><div className="grid gap-2 md:grid-cols-2">{rehearsalChecklist.map((item) => <div key={item} className="flex gap-2 rounded-lg border border-arch-border bg-arch-bg2 p-3 text-[11px] leading-5 text-arch-text2"><Target className="mt-0.5 h-4 w-4 shrink-0 text-arch-green" />{item}</div>)}</div></div>;
}

export default function MastercardPrepTab() {
  return <SectionLayout label="Interview guide" items={sidebarItems} groups={sidebarGroups}>{(activeId) => {
    if (activeId === "mc-focus") return <div><Title>Mastercard interview hack</Title><Intro>This page is built around the four-stage virtual process that matches the information from your recruiter. Every answer is anchored to the résumé used in this application, so the later bar-raiser stages can probe without exposing inflated claims.</Intro><Cards cards={focusCards} /></div>;
    if (activeId === "mc-rounds") return <InterviewRoadmap />;
    if (activeId === "mc-network-basics") return <CardNetworkBasics />;
    if (activeId === "mc-network-flow") return <CardNetworkFlowPage />;
    if (activeId === "mc-sample-questions") return <QuestionBank questions={mastercardSampleQuestions} title="17 Mastercard sample questions" intro="Test yourself before reading the suggested response. Reveal one answer at a time, edit it into your own words, save your version, and rate your confidence so you can filter down to what still needs work." answersHidden answersEditable confidenceTracking />;
    if (activeId === "mc-intelligence") return <MastercardIntelligence />;
    if (activeId === "mc-research-product") return <CompanyResearchPage title="1 · Product and market" intro="Know what Mastercard sells, who pays for it, how the pieces reinforce one another, and where customer value conflicts with risk or friction. The ‘love and hate’ section is framed as product tensions and discovery hypotheses because this is an enterprise platform—not a consumer app with one universal user experience." cards={mastercardProductResearch} />;
    if (activeId === "mc-research-acquisitions") return <AcquisitionStackPage />;
    if (activeId === "mc-research-strategy") return <CompanyResearchPage title="2 · Strategy and SWOT" intro="Use this page to form a coherent view, not to memorise a fact list. The central thesis is that Mastercard is using its network, data, and partner distribution to become a broader trusted-commerce platform across payment rails and services." cards={mastercardStrategyResearch} />;
    if (activeId === "mc-research-culture") return <CompanyResearchPage title="3 · Culture, history, and people" intro="Connect the stated culture to how a global trust platform must operate. Outside reviews are included only as directional evidence, and interviewer research is limited to public professional context." cards={mastercardCultureResearch} />;
    if (activeId === "mc-research-role") return <CompanyResearchPage title="4 · The role and your fit" intro="This section combines the submitted job description and résumé with current company context. It separates known role requirements from operating-model inferences and presents improvement ideas as hypotheses to validate—not criticisms of capabilities you have not seen." cards={mastercardRoleResearch} />;
    if (activeId === "mc-research-questions") return <ResearchQuestionsPage />;
    if (activeId === "mc-research-sources") return <ResearchSources />;
    if (activeId === "mc-jd") return <ApplicationMaterials type="jd" />;
    if (activeId === "mc-resume") return <ApplicationMaterials type="resume" />;
    if (activeId === "mc-alignment") return <ApplicationMaterials type="alignment" />;
    if (activeId === "mc-round-1") return <RoundPage round={1} questions={roundOneQuestions} />;
    if (activeId === "mc-interviewer") return <MichaelCachoPrep />;
    if (activeId === "mc-round-2") return <TechnicalRoundPage questions={technicalFollowUps} />;
    if (activeId === "mc-round-3") return <RoundPage round={3} questions={roundThreeQuestions} framework={featureLaunchFramework} />;
    if (activeId === "mc-round-4") return <RoundPage round={4} questions={roundFourQuestions} />;
    if (activeId === "mc-mental-models") return <MentalModelPractice />;
    if (activeId === "mc-stars") return <StarBank />;
    if (activeId === "mc-stories") return <StoryMap />;
    if (activeId === "mc-rehearse") return <RehearsalChecklist />;
    return <div className="flex items-center gap-2 text-arch-text2"><Target className="h-4 w-4" />Select an interview-preparation section.</div>;
  }}</SectionLayout>;
}
