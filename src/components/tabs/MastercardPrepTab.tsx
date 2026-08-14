"use client";

import { Target } from "lucide-react";
import SectionLayout from "@/components/ui/SectionLayout";
import {
  callDrill,
  closeCards,
  dashboardChecklist,
  domainPrimer,
  evidenceCards,
  keyNumbers,
  numbersCaution,
  positioningScripts,
  recruiterCallLogistics,
  roleCards,
  screeningQuestions,
  starStories,
  technicalPmQuestions,
  type PrepCard,
  type PrepColor,
} from "@/data/mastercard-prep";

const sidebarItems = [{ id: "mc-dashboard", label: "Call dashboard" }];
const sidebarGroups = [
  { label: "The Role", items: [{ id: "mc-role", label: "Role & JD breakdown" }, { id: "mc-domain", label: "Business Identity primer" }] },
  { label: "Positioning", items: [{ id: "mc-pitch", label: "Core speaking scripts" }, { id: "mc-evidence", label: "Resume evidence map" }] },
  { label: "Answer Bank", items: [{ id: "mc-stars", label: "STAR stories" }, { id: "mc-screen", label: "Screening-call Q&A" }, { id: "mc-numbers", label: "Numbers cheat-sheet" }, { id: "mc-technical", label: "If it advances" }] },
  { label: "The Call", items: [{ id: "mc-logistics", label: "Call logistics & reply" }, { id: "mc-drill", label: "Final rehearsal drill" }, { id: "mc-close", label: "Compensation & close" }] },
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
  return <div><Title>Mastercard — Manager, Product Management (Technical)</Title><Intro>Your command center for the 30-minute recruiter screen with Shashi on the Business Identity team.</Intro>
    <div className="grid gap-3 md:grid-cols-3 mb-5">
      {[{ n: "01", title: "Your promise", text: "Card-network fraud/dispute domain fluency plus 7+ years of technical product ownership — a direct match, not a stretch narrative." }, { n: "02", title: "Your proof", text: "Zero missed Visa/Mastercard chargeback deadlines, zero-error card issuance recognized at the Mastercard Dubai conference, CPA/ACCA-backed audit tooling." }, { n: "03", title: "Your answer shape", text: "Claim → one concrete example (Bell, CRA, or Skye Bank) → the transferable mechanism → tie back to Business Identity." }].map((x) => <div key={x.n} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><span className="text-[10px] font-bold text-arch-coral">{x.n}</span><h2 className="mt-1 text-xs font-semibold text-arch-text">{x.title}</h2><p className="mt-1 text-[10.5px] leading-5 text-arch-text2">{x.text}</p></div>)}
    </div>
    <Callout label="North-star answer">“I started my career inside Visa/Mastercard chargeback and card-issuance operations, and I&apos;ve since built seven-plus years of technical product ownership turning strategy into shipped, auditable, compliant features. Business Identity is the first role I&apos;ve seen that asks for both halves of that background at once.”</Callout>
    <h2 className="text-xs font-semibold text-arch-text mb-3">Before you join the call</h2>
    <div className="grid gap-2 md:grid-cols-2">{dashboardChecklist.map((item) => <div key={item} className="flex gap-2 rounded-lg border border-arch-border bg-arch-bg2 p-3 text-[11px] leading-5 text-arch-text2"><Target className="mt-0.5 h-4 w-4 shrink-0 text-arch-green" />{item}</div>)}</div>
  </div>;
}

function StarBank() {
  return <div><Title>STAR story bank</Title><Intro>Keep each story to about 90 seconds on a screening call. State the situation fast, spend most of the time on your action, and close with the result plus how it maps to this role.</Intro><div className="space-y-4">{starStories.map((story) => <article key={story.title} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="flex flex-wrap items-center gap-2 mb-3"><h2 className="text-[13px] font-semibold text-arch-text">{story.title}</h2><span className="rounded-full bg-arch-purple/10 px-2 py-1 text-[9.5px] text-arch-purple">{story.useFor}</span></div><div className="grid gap-2 md:grid-cols-2">{[["Situation", story.situation], ["Task", story.task], ["Action", story.action], ["Result", story.result]].map(([label, value]) => <div key={label} className="rounded-lg bg-arch-bg p-3"><div className="text-[9px] font-bold uppercase tracking-wider text-arch-amber">{label}</div><p className="mt-1 text-[10.5px] leading-5 text-arch-text2">{value}</p></div>)}</div><div className="mt-3 text-[10.5px] text-arch-green"><strong>PM framing:</strong> {story.pmFrame}</div></article>)}</div></div>;
}

function ScreeningBank() {
  return <div><Title>Screening-call Q&amp;A</Title><Intro>What Shashi is likely to actually ask on a 30-minute recruiter screen. These are speaking models — deliver them in your own voice.</Intro><div className="space-y-3">{screeningQuestions.map((item, i) => <article key={item.question} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arch-coral/10 text-[10px] font-bold text-arch-coral">{i + 1}</span><div><h2 className="text-[12.5px] font-semibold text-arch-text">{item.question}</h2><div className="mt-1 text-[9.5px] uppercase tracking-wider text-arch-text3">{item.audience}</div></div></div><p className="mt-3 text-[11px] leading-[1.75] text-arch-text2">{item.answer}</p><div className="mt-3 rounded-md bg-arch-bg px-2.5 py-2 text-[10.5px] font-medium text-arch-amber">Recall cue: {item.cue}</div></article>)}</div></div>;
}

function TechnicalBank() {
  return <div><Title>If this advances — deeper technical-PM questions</Title><Intro>Unlikely on the 30-minute screen, but worth having ready for a hiring-manager or panel round.</Intro><div className="space-y-3">{technicalPmQuestions.map((item, i) => <article key={item.question} className="rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arch-blue/10 text-[10px] font-bold text-arch-blue">{i + 1}</span><div><h2 className="text-[12.5px] font-semibold text-arch-text">{item.question}</h2><div className="mt-1 text-[9.5px] uppercase tracking-wider text-arch-text3">{item.audience}</div></div></div><p className="mt-3 text-[11px] leading-[1.75] text-arch-text2">{item.answer}</p><div className="mt-3 rounded-md bg-arch-bg px-2.5 py-2 text-[10.5px] font-medium text-arch-amber">Recall cue: {item.cue}</div></article>)}</div></div>;
}

function NumbersSheet() {
  return <div><Title>Numbers cheat-sheet</Title><Intro>Every quantified claim across your career, in one place, for a last-second scan before the call.</Intro><Cards cards={numbersCaution} columns={1} /><div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">{keyNumbers.map((n) => <div key={n.metric + n.source} className="rounded-lg border border-arch-border bg-arch-bg2 p-3"><div className="text-[11.5px] font-semibold text-arch-text">{n.metric}</div><div className="mt-1 text-[10.5px] leading-5 text-arch-text3">{n.source}</div></div>)}</div></div>;
}

function Drill() {
  return <div><Title>Final rehearsal drill</Title><Intro>A ~30-minute run-through, sized to match the length of the actual call. Do this once, then stop consuming new material.</Intro><div className="space-y-2">{callDrill.map((d) => <div key={d.task} className="flex gap-3 rounded-xl border border-arch-border bg-arch-bg2 p-4"><div className="w-20 shrink-0 text-[11px] font-semibold text-arch-amber">{d.time}</div><div className="text-[11px] leading-5 text-arch-text2">{d.task}</div></div>)}</div><Callout label="Delivery rule">Pause before answering. Lead with the claim, give one concrete example, and land the result. If asked something you don&apos;t know, say how you&apos;d find out — don&apos;t guess.</Callout></div>;
}

export default function MastercardPrepTab() {
  return <SectionLayout label="Start Here" items={sidebarItems} groups={sidebarGroups}>{(activeId) => {
    if (activeId === "mc-dashboard") return <Dashboard />;
    if (activeId === "mc-role") return <div><Title>Role &amp; JD breakdown</Title><Intro>Read the JD as: technical requirements ownership, cross-functional delivery, and compliance rigor — pointed at a KYB/fraud product.</Intro><Cards cards={roleCards} columns={2} /></div>;
    if (activeId === "mc-domain") return <div><Title>Business Identity primer</Title><Intro>A fast crash course on the domain so you&apos;re not hearing &quot;KYB&quot; for the first time on the call.</Intro><Cards cards={domainPrimer} /></div>;
    if (activeId === "mc-pitch") return <div><Title>Your core speaking scripts</Title><Intro>Practice these aloud until the structure is natural. Preserve the claims and meaning, use your normal vocabulary.</Intro><Cards cards={positioningScripts} columns={1} /></div>;
    if (activeId === "mc-evidence") return <div><Title>Resume-to-role evidence map</Title><Intro>Every claim traces back to something real on the Bell platform. Be ready to go one level deeper if asked.</Intro><Cards cards={evidenceCards} /></div>;
    if (activeId === "mc-stars") return <StarBank />;
    if (activeId === "mc-screen") return <ScreeningBank />;
    if (activeId === "mc-numbers") return <NumbersSheet />;
    if (activeId === "mc-technical") return <TechnicalBank />;
    if (activeId === "mc-logistics") return <div><Title>Call logistics &amp; draft reply</Title><Intro>What to expect from a recruiter screen, questions worth asking Shashi, and a reply template — fill in real availability before sending.</Intro><Cards cards={recruiterCallLogistics} columns={1} /></div>;
    if (activeId === "mc-drill") return <Drill />;
    if (activeId === "mc-close") return <div><Title>Compensation &amp; close</Title><Intro>Finish with confidence and curiosity. Anchor on the posted range if comp comes up.</Intro><Cards cards={closeCards} columns={1} /></div>;
    return <div className="flex items-center gap-2 text-arch-text2"><Target className="h-4 w-4" />Select a preparation section.</div>;
  }}</SectionLayout>;
}
