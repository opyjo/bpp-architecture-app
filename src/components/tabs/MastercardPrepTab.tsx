"use client";

import { useState } from "react";
import { RefreshCcw, Target } from "lucide-react";
import SectionLayout from "@/components/ui/SectionLayout";
import {
  anchorMindset,
  businessIdentityCaseCards,
  callDrill,
  closeCards,
  dashboardChecklist,
  domainPrimer,
  evidenceCards,
  interviewStages,
  keyNumbers,
  l6BehavioralQuestions,
  levelCards,
  numbersCaution,
  positioningScripts,
  questionAnchorMap,
  readinessDimensions,
  recruiterCallLogistics,
  roleCards,
  screeningQuestions,
  stage1AnchorMap,
  stage1TechnicalFocus,
  stageStrategyCards,
  starStories,
  technicalPmQuestions,
  winStrategyCards,
  type PrepCard,
  type PrepColor,
} from "@/data/mastercard-prep";

const sidebarItems = [{ id: "mc-dashboard", label: "Stage 1 dashboard" }];
const sidebarGroups = [
  { label: "Next Steps", items: [{ id: "mc-win", label: "Win strategy" }, { id: "mc-process", label: "Interview roadmap" }, { id: "mc-level", label: "L6 & compensation" }, { id: "mc-stage-strategy", label: "Stage-by-stage focus" }] },
  { label: "Stage 1", items: [{ id: "mc-stage1-tech", label: "Technical focus" }, { id: "mc-anchors", label: "Five core anchors" }, { id: "mc-anchor-map", label: "Question → anchor map" }, { id: "mc-case", label: "Business Identity case" }, { id: "mc-mindset", label: "Anchors over scripts" }, { id: "mc-technical", label: "Technical Q&A" }] },
  { label: "The Role", items: [{ id: "mc-role", label: "Role & JD breakdown" }, { id: "mc-domain", label: "Business Identity primer" }] },
  { label: "Evidence", items: [{ id: "mc-evidence", label: "Resume evidence map" }, { id: "mc-stars", label: "STAR stories" }, { id: "mc-l6-behavior", label: "L6 behavioural bank" }, { id: "mc-numbers", label: "Numbers cheat-sheet" }] },
  { label: "Practice", items: [{ id: "mc-readiness", label: "Readiness scorecard" }, { id: "mc-drill", label: "Stage 1 rehearsal drill" }] },
  { label: "Reference", items: [{ id: "mc-pitch", label: "Answer skeletons" }, { id: "mc-screen", label: "Screening Q&A (complete)" }] },
  { label: "Logistics", items: [{ id: "mc-logistics", label: "Scheduling & role details" }, { id: "mc-close", label: "Compensation & close" }] },
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
  return <h1 className="text-xl font-semibold tracking-tight text-arch-text mb-1.5">{children}</h1>;
}

function Intro({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] leading-7 text-arch-text2 mb-5 max-w-4xl">{children}</p>;
}

function Callout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-xl border border-arch-amber/30 bg-arch-amber/5 p-4">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-arch-amber">{label}</div>
      <div className="text-[11.5px] leading-6 text-arch-text2">{children}</div>
    </div>
  );
}

function Cards({ cards, columns = 2 }: { cards: PrepCard[]; columns?: 1 | 2 | 3 }) {
  const grid = columns === 3 ? "md:grid-cols-3" : columns === 2 ? "md:grid-cols-2" : "grid-cols-1";
  return (
    <div className={`grid grid-cols-1 ${grid} gap-3`}>
      {cards.map((card) => (
        <article key={card.title} className={`rounded-xl border border-arch-border border-l-[3px] ${colorClasses[card.color ?? "blue"]} bg-arch-bg2 p-4`}>
          <h2 className="text-[12.5px] font-semibold text-arch-text mb-1.5">{card.title}</h2>
          <p className="whitespace-pre-line text-[11px] leading-[1.75] text-arch-text2">{card.body}</p>
          {card.cue && <div className="mt-3 rounded-md bg-arch-bg px-2.5 py-2 text-[10.5px] font-medium text-arch-amber"><span className="text-arch-text3">Recall cue:</span> {card.cue}</div>}
        </article>
      ))}
    </div>
  );
}

function Dashboard() {
  return <div><Title>Mastercard — Manager, Product Management (Technical)</Title><Intro>Req R-281813 · Toronto · L6 · Screening complete · Next: Hiring Manager + Technical</Intro>
    <div className="grid gap-3 md:grid-cols-3 mb-5">
      {[{ n: "01", title: "Current status", text: "Recruiter screen passed on August 24. Three stages remain; Stage 1 may be a little technical." }, { n: "02", title: "Stage 1 bar", text: "Show technical fluency and manager-level ownership together: decision, alignment, risk, delivery, outcome." }, { n: "03", title: "Comp position", text: "$145K–$155K CAD target, $140K floor, with bonus/incentive considered on top of base." }].map((x) => <div key={x.n} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><span className="text-[10px] font-bold text-arch-coral">{x.n}</span><h2 className="mt-1 text-xs font-semibold text-arch-text">{x.title}</h2><p className="mt-1 text-[10.5px] leading-5 text-arch-text2">{x.text}</p></div>)}
    </div>
    <Callout label="Standing reminder">Anchors over scripts. Listen to the actual question, pause, choose the strongest lived example, and adapt it to the angle. Do not force a memorized answer.</Callout>
    <h2 className="text-xs font-semibold text-arch-text mb-3">Stage 1 readiness checklist</h2>
    <div className="grid gap-2 md:grid-cols-2">{dashboardChecklist.map((item) => <div key={item} className="flex gap-2 rounded-lg border border-arch-border bg-arch-bg2 p-3 text-[11px] leading-5 text-arch-text2"><Target className="mt-0.5 h-4 w-4 shrink-0 text-arch-green" />{item}</div>)}</div>
  </div>;
}

function InterviewRoadmap() {
  return <div><Title>Confirmed interview process</Title><Intro>Shashi confirmed the process after the successful recruiter screen on August 24, 2026.</Intro><div className="overflow-x-auto rounded-xl border border-arch-border"><table className="w-full min-w-[680px] text-left"><thead className="bg-arch-bg2 text-[10px] uppercase tracking-wider text-arch-text3"><tr>{["Stage", "Format", "Focus", "Status"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{interviewStages.map((stage) => <tr key={stage.stage} className="border-t border-arch-border text-[11px] text-arch-text2"><td className="px-4 py-3 font-semibold text-arch-text">{stage.stage}</td><td className="px-4 py-3">{stage.format}</td><td className="px-4 py-3">{stage.focus}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[9.5px] font-semibold ${stage.status === "Complete" ? "bg-arch-green/10 text-arch-green" : "bg-arch-amber/10 text-arch-amber"}`}>{stage.status}</span></td></tr>)}</tbody></table></div></div>;
}

function QuestionAnchorTable() {
  return <div><Title>Question → anchor map</Title><Intro>Start with the question, then choose the strongest evidence. The final row is intentionally a gap: prepare real failure and coaching examples rather than stretching a success story.</Intro><div className="overflow-x-auto rounded-xl border border-arch-border"><table className="w-full min-w-[820px] text-left"><thead className="bg-arch-bg2 text-[10px] uppercase tracking-wider text-arch-text3"><tr>{["Question type", "Primary anchor", "Backup", "Proof to surface"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{questionAnchorMap.map((route) => <tr key={route.question} className="border-t border-arch-border text-[10.5px] leading-5 text-arch-text2"><td className="px-4 py-3 font-semibold text-arch-text">{route.question}</td><td className="px-4 py-3 text-arch-blue">{route.primary}</td><td className="px-4 py-3">{route.backup}</td><td className="px-4 py-3 text-arch-text3">{route.proof}</td></tr>)}</tbody></table></div></div>;
}

function StarBank() {
  return <div><Title>STAR story bank</Title><Intro>For Stage 1, open with the decision or tension, spend most of the answer on your leadership and technical reasoning, then close with the result. Leave room for the hiring manager to probe.</Intro><div className="space-y-4">{starStories.map((story) => <article key={story.title} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="flex flex-wrap items-center gap-2 mb-3"><h2 className="text-[13px] font-semibold text-arch-text">{story.title}</h2><span className="rounded-full bg-arch-purple/10 px-2 py-1 text-[9.5px] text-arch-purple">{story.useFor}</span></div><div className="grid gap-2 md:grid-cols-2">{[["Situation", story.situation], ["Task", story.task], ["Action", story.action], ["Result", story.result]].map(([label, value]) => <div key={label} className="rounded-lg bg-arch-bg p-3"><div className="text-[9px] font-bold uppercase tracking-wider text-arch-amber">{label}</div><p className="mt-1 text-[10.5px] leading-5 text-arch-text2">{value}</p></div>)}</div><div className="mt-3 text-[10.5px] text-arch-green"><strong>PM framing:</strong> {story.pmFrame}</div></article>)}</div></div>;
}

function ScreeningBank() {
  return <div><Title>Screening-call Q&amp;A</Title><Intro>What Shashi is likely to actually ask on a 30-minute recruiter screen. These are speaking models — deliver them in your own voice.</Intro><div className="space-y-3">{screeningQuestions.map((item, i) => <article key={item.question} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arch-coral/10 text-[10px] font-bold text-arch-coral">{i + 1}</span><div><h2 className="text-[12.5px] font-semibold text-arch-text">{item.question}</h2><div className="mt-1 text-[9.5px] uppercase tracking-wider text-arch-text3">{item.audience}</div></div></div><p className="mt-3 text-[11px] leading-[1.75] text-arch-text2">{item.answer}</p><div className="mt-3 rounded-md bg-arch-bg px-2.5 py-2 text-[10.5px] font-medium text-arch-amber">Recall cue: {item.cue}</div></article>)}</div></div>;
}

function TechnicalBank() {
  return <div><Title>Stage 1 technical-PM questions</Title><Intro>Use these to practise explaining technical decisions with manager-level ownership. Stay at product altitude unless the interviewer asks you to go deeper.</Intro><div className="space-y-3">{technicalPmQuestions.map((item, i) => <article key={item.question} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arch-blue/10 text-[10px] font-bold text-arch-blue">{i + 1}</span><div><h2 className="text-[12.5px] font-semibold text-arch-text">{item.question}</h2><div className="mt-1 text-[9.5px] uppercase tracking-wider text-arch-text3">Stage 1 · Hiring Manager + Technical</div></div></div><p className="mt-3 text-[11px] leading-[1.75] text-arch-text2">{item.answer}</p><div className="mt-3 rounded-md bg-arch-bg px-2.5 py-2 text-[10.5px] font-medium text-arch-amber">Recall cue: {item.cue}</div></article>)}</div></div>;
}

function L6BehaviorBank() {
  return <div><Title>L6 behavioural question bank</Title><Intro>These questions test judgment, influence, self-awareness, and people leadership. “Evidence gap” means preparation is required; it is not permission to manufacture a story.</Intro><div className="space-y-3">{l6BehavioralQuestions.map((item, i) => <article key={item.question} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arch-purple/10 text-[10px] font-bold text-arch-purple">{i + 1}</span><div><h2 className="text-[12.5px] font-semibold text-arch-text">{item.question}</h2><div className="mt-1 text-[9.5px] uppercase tracking-wider text-arch-text3">{item.audience}</div></div></div><p className="mt-3 text-[11px] leading-[1.75] text-arch-text2">{item.answer}</p><div className="mt-3 rounded-md bg-arch-bg px-2.5 py-2 text-[10.5px] font-medium text-arch-amber">Recall cue: {item.cue}</div></article>)}</div></div>;
}

function ReadinessScorecard() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const scoredCount = readinessDimensions.filter((dimension) => scores[dimension.id]).length;
  const total = readinessDimensions.reduce((sum, dimension) => sum + (scores[dimension.id] ?? 0), 0);
  const average = scoredCount ? total / scoredCount : 0;
  const verdict = scoredCount < readinessDimensions.length
    ? `Score all ${readinessDimensions.length} dimensions`
    : average >= 4.5
      ? "Interview-ready"
      : average >= 4
        ? "Ready — tighten weak spots"
        : average >= 3
          ? "Developing — more focused reps"
          : "Needs another practice cycle";

  return <div><Title>Mock-answer readiness scorecard</Title><Intro>Immediately after one recorded answer, score what actually happened—not how prepared you felt. Repeat with the same question after correcting the two lowest dimensions.</Intro>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-arch-border bg-arch-bg2 p-4"><div><div className="text-[10px] font-bold uppercase tracking-widest text-arch-text3">Current average</div><div className="mt-1 text-2xl font-semibold text-arch-text">{scoredCount ? average.toFixed(1) : "—"}<span className="ml-1 text-xs font-normal text-arch-text3">/ 5</span></div><div className="mt-1 text-[10.5px] font-medium text-arch-green">{verdict}</div></div><button type="button" onClick={() => setScores({})} className="flex items-center gap-2 rounded-lg border border-arch-border px-3 py-2 text-[10.5px] font-medium text-arch-text2 transition-colors hover:bg-arch-bg" aria-label="Reset readiness scores"><RefreshCcw className="h-3.5 w-3.5" />Reset</button></div>
    <div className="space-y-2">{readinessDimensions.map((dimension) => <article key={dimension.id} className="grid gap-3 rounded-xl border border-arch-border bg-arch-bg2 p-4 md:grid-cols-[1fr_auto] md:items-center"><div><h2 className="text-[11.5px] font-semibold text-arch-text">{dimension.label}</h2><p className="mt-1 text-[10.5px] leading-5 text-arch-text3">{dimension.description}</p></div><div className="flex gap-1" role="group" aria-label={`Score ${dimension.label}`}>{[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" onClick={() => setScores((current) => ({ ...current, [dimension.id]: score }))} aria-pressed={scores[dimension.id] === score} className={`flex h-8 w-8 items-center justify-center rounded-md border text-[10.5px] font-semibold transition-colors ${scores[dimension.id] === score ? "border-arch-blue bg-arch-blue/15 text-arch-blue" : "border-arch-border bg-arch-bg text-arch-text3 hover:border-arch-blue/50 hover:text-arch-text"}`}>{score}</button>)}</div></article>)}</div>
    <Callout label="Scoring rule">A 5 requires evidence in the recorded answer. If the answer merely implied ownership, trade-off, or impact, score it lower and make that element explicit on the next attempt.</Callout>
  </div>;
}

function NumbersSheet() {
  return <div><Title>Numbers cheat-sheet</Title><Intro>Every quantified claim across your career, in one place, for a last-second scan before the call.</Intro><Cards cards={numbersCaution} columns={1} /><div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">{keyNumbers.map((n) => <div key={n.metric + n.source} className="rounded-lg border border-arch-border bg-arch-bg2 p-3"><div className="text-[11.5px] font-semibold text-arch-text">{n.metric}</div><div className="mt-1 text-[10.5px] leading-5 text-arch-text3">{n.source}</div></div>)}</div></div>;
}

function Drill() {
  return <div><Title>Stage 1 rehearsal drill</Title><Intro>A focused 30-minute run-through for the hiring-manager and technical conversation. Practise the decisions and diagrams, not polished scripts.</Intro><div className="space-y-2">{callDrill.map((d) => <div key={d.task} className="flex gap-3 rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="w-20 shrink-0 text-[11px] font-semibold text-arch-amber">{d.time}</div><div className="text-[11px] leading-5 text-arch-text2">{d.task}</div></div>)}</div><Callout label="Delivery rule">Pause before answering. Lead with the decision, explain the trade-off and your role, then land the delivery outcome. If you do not know something, state how you would resolve it.</Callout></div>;
}

export default function MastercardPrepTab() {
  return <SectionLayout label="Start Here" items={sidebarItems} groups={sidebarGroups}>{(activeId) => {
    if (activeId === "mc-dashboard") return <Dashboard />;
    if (activeId === "mc-win") return <div><Title>Win strategy</Title><Intro>The goal is not to consume more material. It is to demonstrate L6 judgment through a small number of deeply understood examples.</Intro><Cards cards={winStrategyCards} columns={2} /></div>;
    if (activeId === "mc-process") return <InterviewRoadmap />;
    if (activeId === "mc-level") return <div><Title>L6 level &amp; compensation</Title><Intro>The recruiter confirmed the role&apos;s level and base band. Use this to calibrate both your interview posture and compensation position.</Intro><Cards cards={levelCards} columns={1} /></div>;
    if (activeId === "mc-stage-strategy") return <div><Title>Stage-by-stage preparation focus</Title><Intro>Each stage asks a different underlying question. Change the emphasis while keeping the same evidence base.</Intro><Cards cards={stageStrategyCards} columns={2} /></div>;
    if (activeId === "mc-stage1-tech") return <div><Title>What “a little technical” means</Title><Intro>Expect technical product judgment: contracts, flows, requirements, trade-offs, and data movement — not implementation exercises.</Intro><Cards cards={stage1TechnicalFocus} columns={2} /></div>;
    if (activeId === "mc-anchors") return <div><Title>The five core anchors</Title><Intro>Know each as a flexible body of evidence. Aeroplan, Catalog, and Contingency are the Stage 1 leads; Flow Runner and Subscription Manager broaden the panel story.</Intro><Cards cards={stage1AnchorMap} columns={2} /></div>;
    if (activeId === "mc-anchor-map") return <QuestionAnchorTable />;
    if (activeId === "mc-case") return <div><Title>Business Identity practice case</Title><Intro>Use this to practise discovery, high-level design, trade-offs, and success metrics. It is a working hypothesis—not a claim about Mastercard&apos;s internal architecture.</Intro><Cards cards={businessIdentityCaseCards} columns={2} /></div>;
    if (activeId === "mc-mindset") return <div><Title>Anchors over scripts</Title><Intro>Over-rehearsal can make strong experience sound less responsive. Prepare the underlying evidence and reasoning, then answer the question you were actually asked.</Intro><Cards cards={anchorMindset} columns={1} /></div>;
    if (activeId === "mc-role") return <div><Title>Role &amp; JD breakdown</Title><Intro>Read the JD as: technical requirements ownership, cross-functional delivery, and compliance rigor — pointed at a KYB/fraud product.</Intro><Cards cards={roleCards} columns={2} /></div>;
    if (activeId === "mc-domain") return <div><Title>Business Identity primer</Title><Intro>A fast crash course on the domain so you&apos;re not hearing &quot;KYB&quot; for the first time on the call.</Intro><Cards cards={domainPrimer} /></div>;
    if (activeId === "mc-pitch") return <div><Title>Answer skeletons</Title><Intro>Use the long versions only as source material. Practise from the recall cue: opening claim → anchor → decision → result → Mastercard connection. Never memorize the paragraphs.</Intro><Cards cards={positioningScripts} columns={1} /></div>;
    if (activeId === "mc-evidence") return <div><Title>Resume-to-role evidence map</Title><Intro>Every claim traces back to something real on the Bell platform. Be ready to go one level deeper if asked.</Intro><Cards cards={evidenceCards} /></div>;
    if (activeId === "mc-stars") return <StarBank />;
    if (activeId === "mc-l6-behavior") return <L6BehaviorBank />;
    if (activeId === "mc-screen") return <ScreeningBank />;
    if (activeId === "mc-numbers") return <NumbersSheet />;
    if (activeId === "mc-technical") return <TechnicalBank />;
    if (activeId === "mc-readiness") return <ReadinessScorecard />;
    if (activeId === "mc-logistics") return <div><Title>Scheduling &amp; role details</Title><Intro>The recruiter screen is complete. Watch for Stage 1 scheduling and keep the confirmed role details in one place.</Intro><Cards cards={recruiterCallLogistics} columns={1} /></div>;
    if (activeId === "mc-drill") return <Drill />;
    if (activeId === "mc-close") return <div><Title>Compensation &amp; close</Title><Intro>Finish with confidence and curiosity. Anchor on the posted range if comp comes up.</Intro><Cards cards={closeCards} columns={1} /></div>;
    return <div className="flex items-center gap-2 text-arch-text2"><Target className="h-4 w-4" />Select a preparation section.</div>;
  }}</SectionLayout>;
}
