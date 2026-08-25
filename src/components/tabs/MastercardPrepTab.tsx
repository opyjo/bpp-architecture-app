"use client";

import { Target } from "lucide-react";
import SectionLayout from "@/components/ui/SectionLayout";
import {
  applicationAlignment,
  featureLaunchFramework,
  focusCards,
  interviewStages,
  jobDescriptionCards,
  mastercardIntelligenceCards,
  mastercardQuestionsToAsk,
  mastercardReferences,
  mastercardTerms,
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
  type ApplicationAlignment,
  type MastercardTerm,
  type PrepCard,
  type PrepColor,
} from "@/data/mastercard-prep";

const sidebarItems = [{ id: "mc-focus", label: "Four-round overview" }];
const sidebarGroups = [
  { label: "Process", items: [{ id: "mc-rounds", label: "Four-stage roadmap" }] },
  { label: "Mastercard intelligence", items: [{ id: "mc-intelligence", label: "Company, identity & culture" }] },
  { label: "Application materials", items: [{ id: "mc-jd", label: "Job description" }, { id: "mc-resume", label: "Résumé used to apply" }, { id: "mc-alignment", label: "JD → résumé evidence" }] },
  { label: "Stage 1 · Hiring manager", items: [{ id: "mc-round-1", label: "Complete · fit & résumé" }] },
  { label: "Stage 2 · Technical", items: [{ id: "mc-round-2", label: "Agile, Jira & delivery" }] },
  { label: "Stage 3 · Bar raiser", items: [{ id: "mc-round-3", label: "Leadership scenario" }] },
  { label: "Stage 4 · Bar raiser", items: [{ id: "mc-round-4", label: "Program-leadership gauntlet" }] },
  { label: "Practice", items: [{ id: "mc-stars", label: "Your STAR stories" }, { id: "mc-stories", label: "Story map" }, { id: "mc-rehearse", label: "Rehearsal checklist" }] },
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

function QuestionBank({ questions, title, intro }: { questions: InterviewQuestion[]; title: string; intro: string }) {
  return <div><Title>{title}</Title><Intro>{intro}</Intro><div className="space-y-3">{questions.map((item, index) => (
    <article key={item.question} className="rounded-xl border border-arch-border bg-arch-bg2 p-4">
      <div className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-arch-coral/10 text-[10px] font-bold text-arch-coral">{index + 1}</span><div><h2 className="text-[12.5px] font-semibold text-arch-text">{item.question}</h2><div className="mt-1 text-[9.5px] uppercase tracking-wider text-arch-text3">{item.audience}</div></div></div>
      <p className="mt-3 text-[11px] leading-[1.75] text-arch-text2">{item.answer}</p>
      <div className="mt-3 rounded-md bg-arch-bg px-2.5 py-2 text-[10.5px] font-medium text-arch-amber">Recall cue: {item.cue}</div>
    </article>
  ))}</div></div>;
}

function InterviewRoadmap() {
  return <div><Title>Four-stage interview roadmap</Title><Intro>Your recruiter’s process description aligns with this four-stage preparation plan. Stages 1 and the recruiter screen are complete; concentrate your practice on Stages 2–4 while staying adaptable to each interviewer’s exact questions.</Intro><div className="overflow-x-auto rounded-xl border border-arch-border"><table className="w-full min-w-[680px] text-left"><thead className="bg-arch-bg2 text-[10px] uppercase tracking-wider text-arch-text3"><tr>{["Stage", "Format", "Focus", "Status"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{interviewStages.map((stage) => <tr key={stage.stage} className="border-t border-arch-border text-[11px] text-arch-text2"><td className="px-4 py-3 font-semibold text-arch-text">{stage.stage}</td><td className="px-4 py-3">{stage.format}</td><td className="px-4 py-3">{stage.focus}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[9.5px] font-semibold ${stage.status === "Complete" ? "bg-arch-green/10 text-arch-green" : "bg-arch-amber/10 text-arch-amber"}`}>{stage.status}</span></td></tr>)}</tbody></table></div></div>;
}

function RoundPage({ round, questions, framework }: { round: 1 | 2 | 3 | 4; questions: InterviewQuestion[]; framework?: PrepCard[] }) {
  const playbook = roundPlaybooks[round - 1];
  return <div>
    <Title>{playbook.round}: {playbook.title}</Title>
    <Intro>{round === 1 ? "Completed. Keep this as a record of the conversation and use its themes to prepare for the remaining stages." : playbook.objective}</Intro>
    <Cards cards={[
      { title: "What they are testing", body: playbook.interviewerFocus, cue: "Answer the actual signal—not only the surface question", color: playbook.color },
      { title: "Your strongest evidence", body: playbook.evidence, cue: "Use résumé-backed facts you can explain under follow-up", color: "green" },
      { title: "How to prepare", body: playbook.preparation, cue: "Practise out loud; do not memorise a script", color: "amber" },
    ]} columns={1} />
    {framework && <div className="mt-7"><Title>Feature-launch framework</Title><Intro>For the leadership scenario, narrate your reasoning in this sequence. State assumptions aloud and explain how you would validate them.</Intro><Cards cards={framework} /></div>}
    <div className="mt-7"><QuestionBank questions={questions} title={round === 2 ? "Stage 2 technical question bank" : round === 4 ? "Stage 4 pressure-test questions" : "Questions to rehearse"} intro={round === 4 ? "Expect detailed follow-ups. The answer must survive questions about your personal ownership, trade-offs, measures, and learning." : "Use these as adaptable speaking models. Lead with the answer, support it with a résumé-backed example, and pause for the follow-up."} /></div>
  </div>;
}

function TermTable({ terms }: { terms: MastercardTerm[] }) {
  return <div className="overflow-x-auto rounded-xl border border-arch-border"><table className="w-full min-w-[720px] text-left"><thead className="bg-arch-bg2 text-[10px] uppercase tracking-wider text-arch-text3"><tr>{["Term", "What it means", "Why it matters here"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{terms.map((item) => <tr key={item.term} className="border-t border-arch-border text-[10.5px] leading-5 text-arch-text2"><td className="px-4 py-3 font-semibold text-arch-text">{item.term}</td><td className="px-4 py-3">{item.meaning}</td><td className="px-4 py-3">{item.whyItMatters}</td></tr>)}</tbody></table></div>;
}

function MastercardIntelligence() {
  return <div>
    <Title>Mastercard intelligence</Title>
    <Intro>A practical, role-relevant briefing for the interview—not a company-history exercise. Use these facts to improve your judgment and questions, then connect them to your own experience.</Intro>
    <Cards cards={mastercardIntelligenceCards} />
    <div className="mt-7"><Title>Terms to use precisely</Title><Intro>These are interview-relevant concepts, not claims that you have worked in every one of them. Use them to explain your thinking clearly and identify where you would need to learn the team’s specific implementation.</Intro><TermTable terms={mastercardTerms} /></div>
    <div className="mt-7"><Title>Questions worth asking</Title><Intro>Choose one or two that genuinely help you understand the job. Do not ask all four as a checklist.</Intro><Cards cards={mastercardQuestionsToAsk} /></div>
    <div className="mt-7"><Title>Official sources</Title><Intro>Refresh these before later rounds; company information and product messaging change.</Intro><div className="grid gap-2 md:grid-cols-2">{mastercardReferences.map((reference) => <a key={reference.href} href={reference.href} target="_blank" rel="noreferrer" className="rounded-lg border border-arch-border bg-arch-bg2 p-3 transition-colors hover:border-arch-blue/40"><div className="text-[11px] font-semibold text-arch-blue">{reference.label} ↗</div><div className="mt-1 text-[10.5px] leading-5 text-arch-text2">{reference.note}</div></a>)}</div></div>
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
    if (activeId === "mc-intelligence") return <MastercardIntelligence />;
    if (activeId === "mc-jd") return <ApplicationMaterials type="jd" />;
    if (activeId === "mc-resume") return <ApplicationMaterials type="resume" />;
    if (activeId === "mc-alignment") return <ApplicationMaterials type="alignment" />;
    if (activeId === "mc-round-1") return <RoundPage round={1} questions={roundOneQuestions} />;
    if (activeId === "mc-round-2") return <RoundPage round={2} questions={technicalFollowUps} />;
    if (activeId === "mc-round-3") return <RoundPage round={3} questions={roundThreeQuestions} framework={featureLaunchFramework} />;
    if (activeId === "mc-round-4") return <RoundPage round={4} questions={roundFourQuestions} />;
    if (activeId === "mc-stars") return <StarBank />;
    if (activeId === "mc-stories") return <StoryMap />;
    if (activeId === "mc-rehearse") return <RehearsalChecklist />;
    return <div className="flex items-center gap-2 text-arch-text2"><Target className="h-4 w-4" />Select an interview-preparation section.</div>;
  }}</SectionLayout>;
}
