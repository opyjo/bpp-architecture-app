export type CardCategory =
  | "Opening"
  | "STAR"
  | "Technical"
  | "Behavioral"
  | "Closing"
  | "Scenario";

export type HighlightColor =
  | "blue"
  | "purple"
  | "teal"
  | "amber"
  | "green"
  | "coral";

export interface HighlightedPhrase {
  text: string;
  color: HighlightColor;
}

export interface CardSection {
  id: string;
  name: string;
  bullets: HighlightedPhrase[];
}

export interface TeleprompterCard {
  id: string;
  title: string;
  category: CardCategory;
  bullets: HighlightedPhrase[];
  sections?: CardSection[];
  fullText?: string;
}

export function getAllBullets(card: TeleprompterCard): HighlightedPhrase[] {
  if (card.sections && card.sections.length > 0) {
    return card.sections.flatMap((s) => s.bullets);
  }
  return card.bullets;
}

export const CATEGORY_COLORS: Record<CardCategory, string> = {
  Opening: "bg-arch-blue/15 text-arch-blue border-arch-blue/30",
  STAR: "bg-arch-purple/15 text-arch-purple border-arch-purple/30",
  Technical: "bg-arch-teal/15 text-arch-teal border-arch-teal/30",
  Behavioral: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  Closing: "bg-arch-green/15 text-arch-green border-arch-green/30",
  Scenario: "bg-arch-coral/15 text-arch-coral border-arch-coral/30",
};

export const TEMPLATE_CARDS: Omit<TeleprompterCard, "id">[] = [
  {
    title: "STAR: Leadership & Conflict Resolution",
    category: "STAR",
    bullets: [
      { text: "**Situation**: Two teams disagreed on the **integration approach** for a critical release", color: "blue" },
      { text: "**Task**: Align both sides on a single strategy without delaying the **launch deadline**", color: "purple" },
      { text: "**Action**: Facilitated a **design review session**, presented data-driven tradeoffs, proposed a **hybrid approach**", color: "teal" },
      { text: "**Result**: Teams aligned within one sprint, delivered on time with **zero regressions** and improved cross-team trust", color: "green" },
    ],
  },
  {
    title: "STAR: Technical Problem Solving",
    category: "STAR",
    bullets: [
      { text: "**Situation**: Production system experienced **intermittent failures** during peak load — no clear root cause", color: "blue" },
      { text: "**Task**: Diagnose the issue and implement a fix before the next **high-traffic window**", color: "purple" },
      { text: "**Action**: Added **distributed tracing**, identified a **connection pool bottleneck**, implemented **circuit breaker** pattern", color: "teal" },
      { text: "**Result**: **99.9% uptime** restored, response times improved by **35%**, pattern adopted as a team standard", color: "green" },
    ],
  },
  {
    title: "Behavioral: Teamwork & Collaboration",
    category: "Behavioral",
    bullets: [
      { text: "Believe in **psychological safety** — every voice matters, especially during design discussions", color: "amber" },
      { text: "Practice **pair programming** and **code reviews** as learning opportunities, not gatekeeping", color: "blue" },
      { text: "Run **retrospectives** focused on process improvement — celebrate wins and address friction openly", color: "purple" },
      { text: "Example: mentored a **junior developer** through their first production feature — shipped successfully in 2 sprints", color: "green" },
    ],
  },
  {
    title: "Technical: System Design Overview",
    category: "Technical",
    sections: [
      {
        id: "tmpl-sd-1",
        name: "Requirements & Constraints",
        bullets: [
          { text: "Clarify **functional requirements** — what the system must do (core use cases)", color: "blue" },
          { text: "Define **non-functional requirements** — latency, throughput, availability targets", color: "purple" },
        ],
      },
      {
        id: "tmpl-sd-2",
        name: "High-Level Architecture",
        bullets: [
          { text: "Choose between **monolith vs. microservices** based on team size and operational maturity", color: "teal" },
          { text: "Identify **data flow** — synchronous (REST/gRPC) vs. asynchronous (events/queues)", color: "amber" },
        ],
      },
      {
        id: "tmpl-sd-3",
        name: "Deep Dives & Tradeoffs",
        bullets: [
          { text: "**Database selection** — SQL vs. NoSQL, read/write patterns, sharding strategy", color: "green" },
          { text: "**Caching layer** — where to cache, invalidation strategy, TTL policies", color: "coral" },
        ],
      },
    ],
    bullets: [],
  },
  {
    title: "Opening: Elevator Pitch",
    category: "Opening",
    bullets: [
      { text: "**[Your role]** with **[X years]** of experience in **[domain/stack]**", color: "blue" },
      { text: "Currently working on **[current project]** — [one-sentence impact summary]", color: "purple" },
      { text: "Specialize in **[your differentiator]** — what sets you apart from other candidates", color: "teal" },
      { text: "Excited about this role because **[specific reason tied to the company/team]**", color: "green" },
    ],
  },
  {
    title: "Closing: Questions to Ask Interviewer",
    category: "Closing",
    bullets: [
      { text: "What does the **first 90 days** look like for someone in this role?", color: "green" },
      { text: "What are the team's **biggest technical challenges** right now?", color: "blue" },
      { text: "How does the team approach **technical debt** vs. new feature development?", color: "purple" },
      { text: "What does **success look like** for this position in the first year?", color: "teal" },
    ],
  },
  {
    title: "Closing: Questions About Team & Culture",
    category: "Closing",
    bullets: [
      { text: "How is the team **structured** — squads, pods, or cross-functional?", color: "green" },
      { text: "What's the team's approach to **code reviews** and **knowledge sharing**?", color: "blue" },
      { text: "How do you balance **autonomy** vs. **alignment** across engineering teams?", color: "purple" },
      { text: "What does **career growth** look like for someone in this role — IC track vs. management?", color: "teal" },
    ],
  },
  {
    title: "Closing: Questions About Process & Delivery",
    category: "Closing",
    bullets: [
      { text: "What does a typical **sprint cycle** look like — ceremonies, cadence, tooling?", color: "green" },
      { text: "How are **priorities set** — product-driven, engineering-driven, or collaborative?", color: "blue" },
      { text: "What's the **deployment process** — CI/CD maturity, release frequency, feature flags?", color: "purple" },
      { text: "How does the team handle **on-call and incident response**?", color: "teal" },
    ],
  },
  {
    title: "STAR: Mentorship & Growing Others",
    category: "STAR",
    bullets: [
      { text: "**Situation**: Junior developer was struggling with **complex domain logic** and falling behind on deliverables", color: "blue" },
      { text: "**Task**: Help them ramp up quickly without taking over their work or undermining their **confidence**", color: "purple" },
      { text: "**Action**: Set up **weekly pairing sessions**, created a **learning path** with progressive complexity, reviewed PRs with teaching focus", color: "teal" },
      { text: "**Result**: Developer became a **top contributor** within 3 months, later **mentored others** using the same approach", color: "green" },
    ],
  },
  {
    title: "STAR: Delivering Under Pressure",
    category: "STAR",
    bullets: [
      { text: "**Situation**: Critical deadline moved up by **3 weeks** due to regulatory requirement — team morale dropped", color: "blue" },
      { text: "**Task**: Re-scope and deliver a **compliant MVP** without burning out the team", color: "purple" },
      { text: "**Action**: Triaged features with stakeholders, cut **nice-to-haves**, introduced **daily standups** with blockers focus, shielded team from distractions", color: "teal" },
      { text: "**Result**: Delivered on the new deadline with **zero compliance gaps**, team retained — no attrition", color: "green" },
    ],
  },
  {
    title: "Behavioral: Handling Failure",
    category: "Behavioral",
    bullets: [
      { text: "Own mistakes openly — **accountability builds trust** faster than perfection", color: "amber" },
      { text: "Focus on **root cause**, not blame — ask 'what broke' before 'who broke it'", color: "blue" },
      { text: "Run a **blameless post-mortem** — document what happened, timeline, and preventive actions", color: "purple" },
      { text: "Example: deployed a breaking change → rolled back in **8 minutes**, added **automated regression gate** to prevent recurrence", color: "green" },
    ],
  },
  {
    title: "Behavioral: Prioritization & Time Management",
    category: "Behavioral",
    bullets: [
      { text: "Use an **impact/effort matrix** to prioritize — focus on high-impact, low-effort wins first", color: "amber" },
      { text: "Protect **deep work blocks** — batch meetings, minimize context switching", color: "blue" },
      { text: "Say **no with data** — when asked to take on too much, present tradeoffs clearly", color: "purple" },
      { text: "Example: inherited a backlog of **40+ tickets** → categorized, deprioritized 60%, shipped the critical 15 in 2 sprints", color: "green" },
    ],
  },
  {
    title: "Behavioral: Giving & Receiving Feedback",
    category: "Behavioral",
    bullets: [
      { text: "Give feedback that is **specific, timely, and actionable** — not vague or personal", color: "amber" },
      { text: "Use **SBI framework** — Situation, Behavior, Impact — to keep it constructive", color: "blue" },
      { text: "Actively seek feedback from **peers, reports, and managers** — growth requires outside perspective", color: "purple" },
      { text: "Example: received tough feedback on **communication style** → adjusted, saw measurable improvement in **stakeholder satisfaction**", color: "green" },
    ],
  },
  {
    title: "Technical: API Design Principles",
    category: "Technical",
    bullets: [
      { text: "**Contract-first** design — define OpenAPI/GraphQL schemas before writing code", color: "teal" },
      { text: "Design for **backward compatibility** — versioning strategy (URL path, header, or content negotiation)", color: "blue" },
      { text: "Use **pagination, filtering, and field selection** to keep responses lean and performant", color: "purple" },
      { text: "Standardize **error responses** — consistent shape, meaningful codes, actionable messages", color: "coral" },
    ],
  },
  {
    title: "Technical: Cloud & DevOps",
    category: "Technical",
    sections: [
      {
        id: "tmpl-cd-1",
        name: "Infrastructure",
        bullets: [
          { text: "**Infrastructure as Code** — Terraform/CloudFormation for reproducible environments", color: "teal" },
          { text: "**Containerization** — Docker for consistency, Kubernetes for orchestration and scaling", color: "blue" },
        ],
      },
      {
        id: "tmpl-cd-2",
        name: "CI/CD & Observability",
        bullets: [
          { text: "**Pipeline design** — build, test, security scan, deploy stages with automated gates", color: "purple" },
          { text: "**Observability** — structured logging, distributed tracing, dashboards with alerting", color: "green" },
        ],
      },
    ],
    bullets: [],
  },
  {
    title: "Scenario: Disagreeing with Your Manager",
    category: "Scenario",
    bullets: [
      { text: "Listen first — understand their **reasoning and constraints** before pushing back", color: "coral" },
      { text: "Present your case with **data and examples**, not opinions — make it easy to say yes", color: "blue" },
      { text: "Propose a **low-risk experiment** to validate your approach if there's uncertainty", color: "purple" },
      { text: "If overruled, **commit fully** — disagree and commit, don't undermine the decision", color: "green" },
    ],
  },
  {
    title: "Scenario: Joining a New Team",
    category: "Scenario",
    bullets: [
      { text: "First 2 weeks: **listen and learn** — read docs, attend meetings, ask questions without judging", color: "coral" },
      { text: "Map the **people, processes, and pain points** — who owns what, where are the bottlenecks", color: "blue" },
      { text: "Pick a **quick win** — small bug fix or doc improvement to build trust and learn the codebase", color: "purple" },
      { text: "By week 4: share **observations and suggestions** — frame improvements as questions, not mandates", color: "green" },
    ],
  },
  {
    title: "Opening: Why Are You Looking to Leave?",
    category: "Opening",
    bullets: [
      { text: "Focus on what you're **moving toward**, not what you're leaving — growth framing", color: "blue" },
      { text: "Looking for **[larger scale / new domain / more ownership]** that aligns with my career goals", color: "purple" },
      { text: "Current role has been great for **[specific skill]**, and now I'm ready for **[next challenge]**", color: "teal" },
      { text: "This opportunity specifically excites me because **[concrete reason tied to role/company]**", color: "green" },
    ],
  },
  {
    title: "Opening: Walk Me Through Your Resume",
    category: "Opening",
    sections: [
      {
        id: "tmpl-wr-1",
        name: "Early Career",
        bullets: [
          { text: "Started as a **[role]** at **[company]** — built foundation in **[core skills]**", color: "blue" },
          { text: "Key learning: **[insight that shaped your career direction]**", color: "purple" },
        ],
      },
      {
        id: "tmpl-wr-2",
        name: "Growth Phase",
        bullets: [
          { text: "Moved to **[company/role]** — took on **[bigger scope: team lead, architecture, cross-team]**", color: "teal" },
          { text: "Highlight: **[biggest achievement or project in this phase]**", color: "green" },
        ],
      },
      {
        id: "tmpl-wr-3",
        name: "Current & Future",
        bullets: [
          { text: "Currently at **[company]** as **[role]** — focused on **[current impact area]**", color: "amber" },
          { text: "Looking for **[what's next]** — this role is a great fit because **[reason]**", color: "coral" },
        ],
      },
    ],
    bullets: [],
  },
  {
    title: "Scenario: Legacy System Migration",
    category: "Scenario",
    bullets: [
      { text: "Assess **current state** — document dependencies, data flows, and integration points before touching anything", color: "coral" },
      { text: "Use the **strangler fig pattern** — incrementally replace pieces rather than big-bang rewrite", color: "blue" },
      { text: "Run **old and new systems in parallel** with data comparison to validate correctness", color: "purple" },
      { text: "Communicate migration **progress and risk** to stakeholders weekly — no surprises", color: "green" },
    ],
  },
  {
    title: "Behavioral: Leadership Style",
    category: "Behavioral",
    bullets: [
      { text: "Lead by **setting context**, not giving orders — share the 'why' so the team can make good decisions", color: "amber" },
      { text: "Remove **blockers proactively** — my job is to make the team faster, not to be the bottleneck", color: "blue" },
      { text: "Foster **ownership** — assign end-to-end responsibility, not just tasks", color: "purple" },
      { text: "Measure success by **team output and growth**, not individual heroics", color: "green" },
    ],
  },
];

export const DEFAULT_TELEPROMPTER_CARDS: TeleprompterCard[] = [
  {
    id: "default-1",
    title: "Tell Me About Yourself",
    category: "Opening",
    bullets: [
      {
        text: "**10+ years** in enterprise software — Java, TypeScript, cloud-native",
        color: "blue",
      },
      {
        text: "Currently a **BSA / Tech Lead** on a large-scale **insurance platform** migration",
        color: "purple",
      },
      {
        text: "Bridge between **business stakeholders** and **engineering teams** — translate requirements into architecture",
        color: "teal",
      },
      {
        text: "Passionate about **event-driven systems**, **API design**, and **developer experience**",
        color: "green",
      },
    ],
  },
  {
    id: "default-2",
    title: "Complex Integration Challenge",
    category: "STAR",
    bullets: [
      {
        text: "**Situation**: Legacy monolith needed to integrate with **3 downstream systems** simultaneously",
        color: "blue",
      },
      {
        text: "**Task**: Design an **event-driven bridge** that wouldn't disrupt existing consumers",
        color: "purple",
      },
      {
        text: "**Action**: Introduced **Kafka topics** with schema registry, built **idempotent consumers** with retry/DLQ",
        color: "teal",
      },
      {
        text: "**Result**: Zero-downtime migration, **40% reduction** in integration errors, reusable pattern adopted org-wide",
        color: "green",
      },
    ],
  },
  {
    id: "default-3",
    title: "Requirements Gathering Process",
    category: "Behavioral",
    bullets: [
      {
        text: "Start with **stakeholder interviews** — understand the *why* before the *what*",
        color: "amber",
      },
      {
        text: "Create **user journey maps** and **process flows** to visualize current vs. future state",
        color: "blue",
      },
      {
        text: "Use **structured workshops** with cross-functional teams to surface edge cases early",
        color: "purple",
      },
      {
        text: "Document in **living specs** — OpenAPI contracts, acceptance criteria, and **traceability matrices**",
        color: "teal",
      },
    ],
  },
  {
    id: "default-4",
    title: "CQRS and Event-Driven Architecture",
    category: "Technical",
    bullets: [
      {
        text: "**CQRS** separates read/write models — optimized **query views** vs. **command handlers**",
        color: "teal",
      },
      {
        text: "Events as **source of truth** — Kafka topics with **Avro schemas** and versioning",
        color: "blue",
      },
      {
        text: "**Saga orchestration** for distributed transactions — compensating actions on failure",
        color: "purple",
      },
      {
        text: "Practical tradeoffs: **eventual consistency**, **idempotency keys**, **DLQ monitoring**",
        color: "coral",
      },
    ],
  },
  {
    id: "default-5",
    title: "Handling Ambiguity",
    category: "Behavioral",
    bullets: [
      {
        text: "Embrace ambiguity — it's a signal to **ask better questions**, not to freeze",
        color: "amber",
      },
      {
        text: "Break unknowns into **small experiments** — spike, prototype, validate with stakeholders",
        color: "blue",
      },
      {
        text: "Document **assumptions explicitly** and revisit them as new information surfaces",
        color: "purple",
      },
      {
        text: "Example: unclear data mapping → built a **quick POC**, presented options with **tradeoffs matrix**",
        color: "green",
      },
    ],
  },
  {
    id: "default-6",
    title: "Why This Role / Why Canada Life?",
    category: "Closing",
    bullets: [
      {
        text: "Drawn to **large-scale modernization** — transforming legacy systems is where I thrive",
        color: "green",
      },
      {
        text: "Canada Life's investment in **cloud-native architecture** aligns with my expertise",
        color: "blue",
      },
      {
        text: "Opportunity to **shape platform direction** — not just execute, but influence **technical strategy**",
        color: "purple",
      },
      {
        text: "Value the **collaborative culture** and focus on **long-term engineering excellence**",
        color: "teal",
      },
    ],
  },
  {
    id: "default-7",
    title: "Data Mapping Example",
    category: "Technical",
    bullets: [
      {
        text: "Mapped **legacy policy data** (COBOL copybooks) to **modern domain models** (JSON/Avro)",
        color: "teal",
      },
      {
        text: "Built **transformation layer** with validation rules — field-level **type coercion** and **null handling**",
        color: "blue",
      },
      {
        text: "Used **contract-first design** — OpenAPI specs defined before implementation",
        color: "purple",
      },
      {
        text: "Automated **regression testing** with snapshot comparisons across **1000+ policy variants**",
        color: "green",
      },
    ],
  },
  {
    id: "default-8",
    title: "Conflict Between Business and Engineering",
    category: "STAR",
    bullets: [
      {
        text: "**Situation**: Business wanted a **2-week deadline**; engineering said **6 weeks minimum**",
        color: "blue",
      },
      {
        text: "**Task**: Find a path that satisfies **delivery urgency** without accumulating **tech debt**",
        color: "purple",
      },
      {
        text: "**Action**: Proposed **phased delivery** — MVP in 2 weeks, full solution in 4, with **clear scope contracts**",
        color: "teal",
      },
      {
        text: "**Result**: Both sides aligned, MVP shipped on time, **full delivery 1 week early** — built trust across teams",
        color: "green",
      },
    ],
  },
];
