"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import SectionLayout from "@/components/ui/SectionLayout";
import {
  aiStrategy,
  alignmentCards,
  closeCards,
  dashboardChecklist,
  evidenceCards,
  interviewerQuestions,
  interviewQuestions,
  metricCards,
  ninetyDayPlan,
  operatingModel,
  panelCards,
  peopleCards,
  positioningScripts,
  scenarios,
  standardsCards,
  starStories,
  type PrepCard,
  type PrepColor,
} from "@/data/canadian-tire-prep";

const sidebarItems = [{ id: "ct-dashboard", label: "Interview dashboard" }];
const sidebarGroups = [
  { label: "Positioning", items: [{ id: "ct-role", label: "Role & panel map" }, { id: "ct-pitch", label: "Core speaking scripts" }, { id: "ct-evidence", label: "Resume evidence map" }] },
  { label: "Practice Strategy", items: [{ id: "ct-operating", label: "Practice operating model" }, { id: "ct-standards", label: "Standards & guardrails" }, { id: "ct-ai", label: "AI & low-code strategy" }] },
  { label: "People & Outcomes", items: [{ id: "ct-people", label: "People & resourcing" }, { id: "ct-metrics", label: "OKRs & metrics" }, { id: "ct-alignment", label: "Enterprise alignment" }] },
  { label: "Answer Bank", items: [{ id: "ct-stars", label: "Tailored STAR stories" }, { id: "ct-questions", label: "Likely panel questions" }, { id: "ct-scenarios", label: "Case-study scenarios" }] },
  { label: "Interview Close", items: [{ id: "ct-90", label: "30 / 60 / 90 plan" }, { id: "ct-ask", label: "Questions for the panel" }, { id: "ct-close", label: "Compensation & close" }, { id: "ct-drill", label: "Interview-day drill" }] },
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
  return <div><Title>Canadian Tire — Front-End Practice Manager</Title><Intro>Your command center for the conversation with the AVP of Development &amp; QE Practices, Director of Development Practice, and Director of the Solutions Architect Community of Practice.</Intro>
    <div className="grid gap-3 md:grid-cols-3 mb-5">
      {[{ n: "01", title: "Your promise", text: "Make high-quality front-end delivery easier and more consistent across squads." }, { n: "02", title: "Your proof", text: "5+ squads, 3 developers mentored, 40% faster releases, 30% AI efficiency, 95% OKRs." }, { n: "03", title: "Your answer shape", text: "Point of view → mechanism for scale → measure → business outcome." }].map((x) => <div key={x.n} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><span className="text-[10px] font-bold text-arch-coral">{x.n}</span><h2 className="mt-1 text-xs font-semibold text-arch-text">{x.title}</h2><p className="mt-1 text-[10.5px] leading-5 text-arch-text2">{x.text}</p></div>)}
    </div>
    <Callout label="North-star answer">“I combine current front-end technical credibility with the mechanisms to scale it: clear standards, paved roads, mentorship, cross-practice alignment, and balanced measures of adoption, quality, flow, and developer experience.”</Callout>
    <h2 className="text-xs font-semibold text-arch-text mb-3">Before you join the call</h2>
    <div className="grid gap-2 md:grid-cols-2">{dashboardChecklist.map((item) => <div key={item} className="flex gap-2 rounded-lg border border-arch-border bg-arch-bg2 p-3 text-[11px] leading-5 text-arch-text2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-arch-green" />{item}</div>)}</div>
    <Link href="/coach" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-arch-coral px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90">Open Interview Coach <ArrowRight className="h-3.5 w-3.5" /></Link>
  </div>;
}

function StarBank() {
  return <div><Title>Tailored STAR story bank</Title><Intro>Keep each story to roughly two minutes. State the leadership problem, spend most time on your actions, and close with the reported result plus what you learned.</Intro><div className="space-y-4">{starStories.map((story) => <article key={story.title} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="flex flex-wrap items-center gap-2 mb-3"><h2 className="text-[13px] font-semibold text-arch-text">{story.title}</h2><span className="rounded-full bg-arch-purple/10 px-2 py-1 text-[9.5px] text-arch-purple">{story.useFor}</span></div><div className="grid gap-2 md:grid-cols-2">{[["Situation", story.situation], ["Task", story.task], ["Action", story.action], ["Result", story.result]].map(([label, value]) => <div key={label} className="rounded-lg bg-arch-bg p-3"><div className="text-[9px] font-bold uppercase tracking-wider text-arch-amber">{label}</div><p className="mt-1 text-[10.5px] leading-5 text-arch-text2">{value}</p></div>)}</div><div className="mt-3 text-[10.5px] text-arch-green"><strong>Manager framing:</strong> {story.managerFrame}</div></article>)}</div></div>;
}

function QuestionBank() {
  return <div><Title>Likely panel questions</Title><Intro>These are speaking models, not text to memorize. Use the cue to recover the structure, then deliver it in your own voice with one resume example.</Intro><div className="space-y-3">{interviewQuestions.map((item, i) => <article key={item.question} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arch-coral/10 text-[10px] font-bold text-arch-coral">{i + 1}</span><div><h2 className="text-[12.5px] font-semibold text-arch-text">{item.question}</h2><div className="mt-1 text-[9.5px] uppercase tracking-wider text-arch-text3">Best calibrated for: {item.audience}</div></div></div><p className="mt-3 text-[11px] leading-[1.75] text-arch-text2">{item.answer}</p><div className="mt-3 rounded-md bg-arch-bg px-2.5 py-2 text-[10.5px] font-medium text-arch-amber">Recall cue: {item.cue}</div></article>)}</div></div>;
}

function NinetyDays() {
  return <div><Title>Your 30 / 60 / 90-day plan</Title><Intro>Present this as a hypothesis you would refine with the team—not a pre-written transformation imposed before listening.</Intro><div className="space-y-3">{ninetyDayPlan.map((phase, i) => <article key={phase.phase} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-arch-blue/10 text-[10px] font-bold text-arch-blue">{i + 1}</span><h2 className="text-[13px] font-semibold text-arch-text">{phase.phase}</h2></div><ul className="mt-3 space-y-2 pl-9">{phase.items.map(item => <li key={item} className="text-[11px] leading-5 text-arch-text2 list-disc">{item}</li>)}</ul><div className="mt-3 rounded-lg bg-arch-green/5 px-3 py-2 text-[10.5px] text-arch-green"><strong>Outcome:</strong> {phase.outcome}</div></article>)}</div></div>;
}

function QuestionsToAsk() {
  return <div><Title>Questions for your panel</Title><Intro>Choose two or three based on what the conversation has not already answered. Ask follow-ups; a thoughtful dialogue is stronger than reading a list.</Intro><div className="grid gap-3 md:grid-cols-3">{interviewerQuestions.map(group => <article key={group.person} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><h2 className="text-xs font-semibold text-arch-coral">{group.person}</h2><ul className="mt-3 space-y-3">{group.questions.map(q => <li key={q} className="text-[10.5px] leading-5 text-arch-text2">“{q}”</li>)}</ul></article>)}</div></div>;
}

function Drill() {
  const drills = [
    ["15 minutes", "Say the 90-second introduction, Why Canadian Tire, and leadership philosophy without reading."],
    ["20 minutes", "Rehearse three STAR stories: 5+ squad standards, AI adoption, and mentoring. Keep each under two minutes."],
    ["15 minutes", "Answer practice strategy, performance management, developer metrics, and standards-versus-autonomy."],
    ["10 minutes", "Walk the 30/60/90 plan and select three panel questions."],
    ["5 minutes", "Review your numbers, slow your pace, test audio/video, and bring water plus a one-page cue sheet."],
  ];
  return <div><Title>Interview-day drill</Title><Intro>A 65-minute final rehearsal. Stop consuming new material after this; focus on calm recall and conversational delivery.</Intro><div className="space-y-2">{drills.map(([time, task]) => <div key={time} className="flex gap-3 rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="w-20 shrink-0 text-[11px] font-semibold text-arch-amber">{time}</div><div className="text-[11px] leading-5 text-arch-text2">{task}</div></div>)}</div><Callout label="Delivery rule">Pause before answering. Lead with your point of view, give one example, name how you scaled it, and finish with the measure. If you do not know something, state how you would learn or validate it.</Callout></div>;
}

export default function CanadianTirePrepTab() {
  return <SectionLayout label="Start Here" items={sidebarItems} groups={sidebarGroups}>{(activeId) => {
    if (activeId === "ct-dashboard") return <Dashboard />;
    if (activeId === "ct-role") return <div><Title>Role mandate &amp; panel map</Title><Intro>This is a leadership interview, not a React trivia interview. The mandate is to grow people, scale front-end excellence, align enterprise partners, and prove the practice is improving delivery.</Intro><Callout label="Role in one sentence">Build a front-end practice that gives squads skilled people, trusted standards, approved tools, and measurable improvement without taking delivery ownership away from those squads.</Callout><Cards cards={panelCards} columns={3} /></div>;
    if (activeId === "ct-pitch") return <div><Title>Your core speaking scripts</Title><Intro>Practice these aloud until the structure is natural. Preserve the claims and meaning, but use your normal vocabulary.</Intro><Cards cards={positioningScripts} columns={1} /></div>;
    if (activeId === "ct-evidence") return <div><Title>Resume-to-role evidence map</Title><Intro>Use only claims you can explain under follow-up. Be ready to describe the baseline, your contribution, who else was involved, and how each percentage was measured.</Intro><Cards cards={evidenceCards} /></div>;
    if (activeId === "ct-operating") return <div><Title>Front-end practice operating model</Title><Intro>Treat the practice as an internal product: developers and squads are its customers, standards and enablement are its capabilities, and adoption plus delivery outcomes are its evidence.</Intro><Cards cards={operatingModel} /></div>;
    if (activeId === "ct-standards") return <div><Title>Standards, guardrails &amp; paved roads</Title><Intro>Use standards to remove repeated decisions and manage shared risk. Keep mandatory controls small, automate them where possible, and make exceptions explicit.</Intro><Cards cards={standardsCards} /></div>;
    if (activeId === "ct-ai") return <div><Title>AI &amp; low-code adoption strategy</Title><Intro>Your differentiator is hands-on credibility. Pair enthusiasm with disciplined governance and insist that speed only counts when quality, security, and rework remain healthy.</Intro><Cards cards={aiStrategy} /></div>;
    if (activeId === "ct-people") return <div><Title>People development &amp; resourcing</Title><Intro>Do not overstate formal direct-report experience. Show that you already coach, set technical expectations, and gather feedback—and that you understand the added accountability of formal performance management.</Intro><Cards cards={peopleCards} /></div>;
    if (activeId === "ct-metrics") return <div><Title>Practice OKRs &amp; balanced metrics</Title><Intro>Start with a baseline and a small number of outcomes. Use measures to learn and improve the system; never turn activity metrics into individual quotas.</Intro><Cards cards={metricCards} /></div>;
    if (activeId === "ct-alignment") return <div><Title>Enterprise collaboration model</Title><Intro>The practice connects strategy to delivery. It should translate enterprise direction into usable paths while bringing squad evidence back into enterprise decisions.</Intro><Cards cards={alignmentCards} /></div>;
    if (activeId === "ct-stars") return <StarBank />;
    if (activeId === "ct-questions") return <QuestionBank />;
    if (activeId === "ct-scenarios") return <div><Title>Case-study &amp; scenario frameworks</Title><Intro>For any unfamiliar scenario: clarify the outcome, map stakeholders and constraints, establish a baseline, offer options with trade-offs, run the smallest safe experiment, and define measures.</Intro><Cards cards={scenarios} /></div>;
    if (activeId === "ct-90") return <NinetyDays />;
    if (activeId === "ct-ask") return <QuestionsToAsk />;
    if (activeId === "ct-close") return <div><Title>Compensation, close &amp; follow-up</Title><Intro>Finish with confidence and curiosity. Avoid introducing new claims in the closing minutes.</Intro><Cards cards={closeCards} columns={1} /></div>;
    if (activeId === "ct-drill") return <Drill />;
    return <div className="flex items-center gap-2 text-arch-text2"><Target className="h-4 w-4" />Select a preparation section.</div>;
  }}</SectionLayout>;
}
