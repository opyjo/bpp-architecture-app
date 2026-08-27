import {
  acquisitionLifecycleCards,
  acquisitionQuestionsToAsk,
  acquisitionStackBrief,
  acquisitionStackItems,
  applicationAlignment,
  behaviouralQuestions,
  cardNetworkFundamentals,
  coreQuestions,
  featureLaunchFramework,
  focusCards,
  interviewStages,
  jobDescriptionCards,
  michaelCachoProfileCards,
  michaelCachoStageTwoQuestions,
  mastercardCultureResearch,
  mastercardIntelligenceCards,
  mastercardProductResearch,
  mastercardQuestionsToAsk,
  mastercardResearchChecklist,
  mastercardResearchQuestions,
  mastercardRoleResearch,
  mastercardStrategyResearch,
  mastercardTerms,
  paymentFlowTerms,
  productDesignAnswerSkeleton,
  productDesignCheckIns,
  productDesignFramework,
  productDesignPrompts,
  rehearsalChecklist,
  roundFourQuestions,
  roundOneQuestions,
  roundPlaybooks,
  roundThreeQuestions,
  resumeCards,
  starMentalModels,
  starStories,
  storyRoutes,
  technicalFollowUps,
  type AcquisitionStackItem,
  type ApplicationAlignment,
  type InterviewQuestion,
  type InterviewStage,
  type MastercardTerm,
  type PrepCard,
  type RoundPlaybook,
  type StarMentalModel,
  type StarStory,
  type StoryRoute,
  type TechnicalInterviewQuestion,
} from "@/data/mastercard-prep";

function cards(items: PrepCard[]): string {
  return items
    .map((c) => `### ${c.title}\n${c.body}${c.cue ? `\n(Recall cue: ${c.cue})` : ""}`)
    .join("\n\n");
}

function terms(items: MastercardTerm[]): string {
  return items.map((t) => `- **${t.term}** — ${t.meaning} (Why it matters: ${t.whyItMatters})`).join("\n");
}

function questions(items: InterviewQuestion[]): string {
  return items
    .map((q) => `Q (${q.audience}): ${q.question}\nSuggested answer: ${q.answer}\n(Recall cue: ${q.cue})`)
    .join("\n\n");
}

function technicalQuestions(items: TechnicalInterviewQuestion[]): string {
  return items
    .map((q) => {
      const plan = q.answerPlan.map((s) => `${s.label}: ${s.detail}`).join(" → ");
      const kt = q.keyTerms.map((k) => `${k.term} = ${k.meaning}`).join("; ");
      const fu = q.followUps.join(" | ");
      return [
        `#### [${q.category}] (${q.priority}) ${q.question}`,
        `What it tests: ${q.testing}`,
        `Plain English: ${q.plainEnglish}`,
        `Answer structure: ${plan}`,
        `Full answer: ${q.answer}`,
        `Résumé anchor: ${q.resumeAnchor}`,
        `Key terms: ${kt}`,
        `Likely follow-ups: ${fu}`,
        `Recall cue: ${q.cue}`,
      ].join("\n");
    })
    .join("\n\n");
}

function stages(items: InterviewStage[]): string {
  return items.map((s) => `- ${s.stage} (${s.status}) — ${s.format}: ${s.focus}`).join("\n");
}

function playbooks(items: RoundPlaybook[]): string {
  return items
    .map(
      (p) =>
        `### ${p.round}: ${p.title}\nObjective: ${p.objective}\nInterviewer focus: ${p.interviewerFocus}\nYour strongest evidence: ${p.evidence}\nHow to prepare: ${p.preparation}`
    )
    .join("\n\n");
}

function alignment(items: ApplicationAlignment[]): string {
  return items
    .map((a) => `- Requirement: ${a.requirement}\n  Résumé evidence: ${a.resumeEvidence}\n  Interview route: ${a.interviewRoute}`)
    .join("\n");
}

function acquisitions(items: AcquisitionStackItem[]): string {
  return items
    .map(
      (a) =>
        `- **${a.name}** (${a.acquired}) — ${a.capability} | Lifecycle: ${a.lifecycle} | Safe relevance: ${a.safeRelevance} | Your résumé bridge: ${a.resumeBridge} | Guardrail: ${a.guardrail}`
    )
    .join("\n");
}

function stars(items: StarStory[]): string {
  return items
    .map(
      (s) =>
        `### ${s.title} (use for: ${s.useFor})\nSituation: ${s.situation}\nTask: ${s.task}\nAction: ${s.action}\nResult: ${s.result}\nManager framing: ${s.managerFrame}`
    )
    .join("\n\n");
}

function mentalModels(items: StarMentalModel[]): string {
  return items
    .map((m) => {
      const nodes = m.nodes.map((n) => `${n.label}: ${n.detail}`).join(" | ");
      const fu = m.followUps.map((f) => `${f.question} (route: ${f.route})`).join("; ");
      return [
        `### ${m.storyTitle} (use for: ${m.useFor})`,
        `Memory line: ${m.memoryCode}`,
        `Five-step map: ${nodes}`,
        `30-second answer: ${m.answer30}`,
        `90-second answer: ${m.answer90}`,
        `Follow-ups: ${fu}`,
      ].join("\n");
    })
    .join("\n\n");
}

function routes(items: StoryRoute[]): string {
  return items
    .map((r) => `- ${r.questionType} → ${r.primaryStory} (proof: ${r.proof}${r.guardrail ? `; guardrail: ${r.guardrail}` : ""})`)
    .join("\n");
}

function bullets(items: string[]): string {
  return items.map((i) => `- ${i}`).join("\n");
}

/**
 * Flattens every dataset behind the Mastercard prep tab into one grounding
 * document for the chat assistant — same pattern as DiagramChat's
 * buildDiagramContext(), just scoped to interview content instead of the
 * architecture diagram.
 */
export function buildMastercardChatContext(): string {
  return [
    "You are the candidate's private Mastercard interview-prep assistant. Everything below is the candidate's own research, résumé-backed stories, and practice material for a Mastercard 'Manager, Product Management - Technical' (Business Identity) interview — treat it as ground truth about their situation and answer from it first.",
    "You are NOT limited to this material: also answer general knowledge questions (about Mastercard, payments, product management, or anything else) using your own knowledge when the candidate asks something this document doesn't cover. Be direct, concise, and interview-practical — this is prep, not a formal report.",
    "Never fabricate a result, credential, or resume claim that isn't in this material; if asked to invent one, say so and offer the closest real evidence instead.",

    "\n## Interview process & stages",
    stages(interviewStages),

    "\n## Top focus points",
    cards(focusCards),

    "\n## Round-by-round playbook",
    playbooks(roundPlaybooks),

    "\n## Feature-launch framework (for the Stage 3 leadership scenario)",
    cards(featureLaunchFramework),

    "\n## Product-design case practice (possible format; not confirmed for Stage 3)",
    "A historical Mastercard-authored guide created in 2019 describes product-design and critique cases. Treat this as adjacent practice, not proof of the candidate's 2026 interview format.",
    productDesignFramework.map((step) => `${step.step}. ${step.label} — ${step.focus} Output: ${step.output}`).join("\n"),
    "\nPractice prompts:",
    productDesignPrompts.map((prompt) => `- ${prompt.title}: ${prompt.prompt}\n  Possible users: ${prompt.possibleUsers.join(", ")}\n  Tensions: ${prompt.tensions.join("; ")}\n  Guardrail: ${prompt.guardrail}`).join("\n"),
    "\nClosing answer skeleton:",
    productDesignAnswerSkeleton.map((beat) => `- ${beat.label}: ${beat.template}`).join("\n"),
    "\nCollaborative check-ins:",
    bullets(productDesignCheckIns),

    "\n## Card network fundamentals (how Mastercard/Visa work behind the scenes)",
    cards(cardNetworkFundamentals),

    "\n## Payment-flow vocabulary",
    terms(paymentFlowTerms),

    "\n## Mastercard company research — overview",
    cards(mastercardIntelligenceCards),

    "\n## Mastercard interview-relevant terms",
    terms(mastercardTerms),

    "\n## Mastercard product & market research",
    cards(mastercardProductResearch),

    "\n## Mastercard Identity acquisition stack — narrative",
    cards(acquisitionStackBrief),

    "\n## Acquisition lifecycle (before/during/after a transaction)",
    cards(acquisitionLifecycleCards),

    "\n## Acquisition-by-acquisition detail",
    acquisitions(acquisitionStackItems),

    "\n## Questions the acquisition research unlocks",
    cards(acquisitionQuestionsToAsk),

    "\n## Mastercard strategy & SWOT",
    cards(mastercardStrategyResearch),

    "\n## Mastercard culture, history & people",
    cards(mastercardCultureResearch),

    "\n## The role & candidate fit",
    cards(mastercardRoleResearch),

    "\n## Job description, distilled",
    cards(jobDescriptionCards),

    "\n## Candidate's résumé, distilled",
    cards(resumeCards),

    "\n## Job description → résumé evidence map",
    alignment(applicationAlignment),

    "\n## Questions worth asking the interviewer",
    cards(mastercardQuestionsToAsk),

    "\n## Final research questions & checklist",
    cards(mastercardResearchQuestions),
    bullets(mastercardResearchChecklist),

    "\n## Michael Cacho (Stage 2 interviewer) — profile",
    cards(michaelCachoProfileCards),

    "\n## Michael Cacho — likely Stage 2 questions",
    questions(michaelCachoStageTwoQuestions),

    "\n## Stage 1 questions (completed round)",
    questions(roundOneQuestions),

    "\n## Core / behavioural sample questions (17-question bank)",
    questions(coreQuestions),
    questions(behaviouralQuestions),

    "\n## Stage 2 detailed technical question bank",
    technicalQuestions(technicalFollowUps),

    "\n## Stage 3 leadership-scenario questions",
    questions(roundThreeQuestions),

    "\n## Stage 4 program-leadership questions",
    questions(roundFourQuestions),

    "\n## Candidate's STAR stories",
    stars(starStories),

    "\n## Five-step story mental models (Problem → Goal → Insight → Action → Impact)",
    mentalModels(starMentalModels),

    "\n## Question type → best story routing",
    routes(storyRoutes),

    "\n## Final rehearsal checklist",
    bullets(rehearsalChecklist),
  ].join("\n");
}
