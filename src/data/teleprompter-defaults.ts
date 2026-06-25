/**
 * Categories are user-editable (add / rename / delete / recolor), so this is an
 * open string rather than a fixed union. Built-ins live in DEFAULT_CATEGORIES.
 */
export type CardCategory = string;

/** Palette a category badge can be tinted with — mirrors HighlightColor. */
export type CategoryColor = HighlightColor;

export interface CategoryDef {
  name: string;
  color: CategoryColor;
}

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
  /**
   * Role this card belongs to. `undefined` (or null in the DB) = shared across
   * ALL roles. A string = only shown when that role is the active role.
   */
  role?: string;
}

/** The default role the teleprompter ships with. */
export const DEFAULT_ROLE = "Business System Analyst";

export function getAllBullets(card: TeleprompterCard): HighlightedPhrase[] {
  if (card.sections && card.sections.length > 0) {
    return card.sections.flatMap((s) => s.bullets);
  }
  return card.bullets;
}

/** Built-in categories the teleprompter ships with, in display order. */
export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { name: "Opening", color: "blue" },
  { name: "STAR", color: "purple" },
  { name: "Technical", color: "teal" },
  { name: "Behavioral", color: "amber" },
  { name: "Closing", color: "green" },
  { name: "Past Roles", color: "coral" },
];

/** Colors a category can be assigned, used by the category manager UI. */
export const CATEGORY_COLOR_OPTIONS: CategoryColor[] = [
  "blue",
  "purple",
  "teal",
  "amber",
  "green",
  "coral",
];

/** Pill (badge) classes — border + translucent bg + text — per color. */
export const CATEGORY_PILL_CLASSES: Record<CategoryColor, string> = {
  blue: "bg-arch-blue/15 text-arch-blue border-arch-blue/30",
  purple: "bg-arch-purple/15 text-arch-purple border-arch-purple/30",
  teal: "bg-arch-teal/15 text-arch-teal border-arch-teal/30",
  amber: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  green: "bg-arch-green/15 text-arch-green border-arch-green/30",
  coral: "bg-arch-coral/15 text-arch-coral border-arch-coral/30",
};

/** Solid dot classes per color — for the small swatch on filter pills. */
export const CATEGORY_DOT_CLASSES: Record<CategoryColor, string> = {
  blue: "bg-arch-blue",
  purple: "bg-arch-purple",
  teal: "bg-arch-teal",
  amber: "bg-amber-500",
  green: "bg-arch-green",
  coral: "bg-arch-coral",
};

/** Badge classes for a category not found in the active set (e.g. legacy). */
export const FALLBACK_CATEGORY_CLASS =
  "bg-arch-text/8 text-arch-text2 border-arch-text/20";

/** Resolve the badge classes for a category name against the active set. */
export function resolveCategoryClass(
  name: string,
  categories: CategoryDef[]
): string {
  const def = categories.find((c) => c.name === name);
  return def ? CATEGORY_PILL_CLASSES[def.color] : FALLBACK_CATEGORY_CLASS;
}

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
    category: "Behavioral",
    bullets: [
      { text: "Listen first — understand their **reasoning and constraints** before pushing back", color: "coral" },
      { text: "Present your case with **data and examples**, not opinions — make it easy to say yes", color: "blue" },
      { text: "Propose a **low-risk experiment** to validate your approach if there's uncertainty", color: "purple" },
      { text: "If overruled, **commit fully** — disagree and commit, don't undermine the decision", color: "green" },
    ],
  },
  {
    title: "Scenario: Joining a New Team",
    category: "Behavioral",
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
    category: "Behavioral",
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
  {
    title: "Technical: Specifying an API Contract & OpenAPI",
    category: "Technical",
    bullets: [
      { text: "Start with **stakeholder workshops** to define the domain model, key resources, and expected consumers", color: "teal" },
      { text: "Draft the **OpenAPI 3.x spec** in YAML — paths, schemas, error models — before writing any code (**contract-first**)", color: "blue" },
      { text: "Use **Swagger Editor** or **Stoplight** for visual review with non-technical stakeholders, generate **mock servers** (Prism/WireMock) so consumers can test before implementation", color: "purple" },
      { text: "Validate with **integration tests** against the spec — any drift between contract and code breaks the build", color: "green" },
    ],
  },
  {
    title: "Technical: API Versioning & Breaking Changes",
    category: "Technical",
    bullets: [
      { text: "Prefer **additive changes** — new optional fields, new endpoints — to avoid version bumps entirely", color: "teal" },
      { text: "Use **semantic versioning** on contracts — major bumps only for breaking changes, communicated via **deprecation headers**", color: "blue" },
      { text: "Run **old and new versions in parallel** with a sunset window — give consumers time to migrate", color: "purple" },
      { text: "Track consumer usage via **API gateway analytics** (Apigee) to know when it's safe to decommission the old version", color: "green" },
    ],
  },
  {
    title: "Technical: Producing a Data Mapping Document",
    category: "Technical",
    bullets: [
      { text: "Start with **source analysis** — extract field inventory from COBOL copybooks, DB schemas, or existing API payloads", color: "teal" },
      { text: "Map each source field to the **target domain model** — define transformations, type coercions, default values, nullable rules", color: "blue" },
      { text: "Document in a **Confluence table** — columns: source field, type, target field, type, transformation rule, notes", color: "purple" },
      { text: "Validate with **automated sample data runs** — compare expected vs. actual output across edge cases and **1000+ data variants**", color: "green" },
    ],
  },
  {
    title: "Technical: Domain Modelling Approach",
    category: "Technical",
    bullets: [
      { text: "Start with **event storming** — sticky notes for domain events, commands, and aggregates with business + tech in the room", color: "teal" },
      { text: "Identify **bounded contexts** — where language and ownership diverge, draw the service boundaries", color: "blue" },
      { text: "Define **aggregate roots** — enforce invariants within a boundary, communicate across boundaries via **domain events**", color: "purple" },
      { text: "Iterate the model with **real user journeys** — walk through scenarios to validate the model holds under edge cases", color: "green" },
    ],
  },
  {
    title: "Technical: State Machine — Policy Lifecycle",
    category: "Technical",
    bullets: [
      { text: "Defined a **policy lifecycle state machine** — states: Draft → Submitted → Underwriting → Approved → Active → Lapsed → Cancelled", color: "teal" },
      { text: "Each transition had **guard conditions** — e.g., Submitted → Underwriting requires all mandatory fields validated", color: "blue" },
      { text: "Implemented as an **event-driven model** — state transitions emitted events to Kafka, downstream systems reacted accordingly", color: "purple" },
      { text: "Visualized in **Confluence with Mermaid diagrams** — both business and engineering could trace and validate the flow", color: "green" },
    ],
  },
  {
    title: "Technical: Integration Patterns",
    category: "Technical",
    bullets: [
      { text: "**Event-driven / async messaging** — Kafka topics with Avro schemas, idempotent consumers, DLQ for failures", color: "teal" },
      { text: "**Request/reply APIs** — REST with OpenAPI contracts, gRPC for internal service-to-service where latency matters", color: "blue" },
      { text: "**Strangler fig pattern** for legacy migration — incrementally route traffic from monolith to new services", color: "purple" },
      { text: "**Anti-corruption layer** — translate between legacy and modern domain models at integration boundaries", color: "coral" },
    ],
  },
  {
    title: "Technical: Data Integrity Across Systems",
    category: "Technical",
    bullets: [
      { text: "**Idempotency keys** on every message and API call — safe retries without duplicate side effects", color: "teal" },
      { text: "**Schema validation** at boundaries — Avro schema registry enforces backward/forward compatibility", color: "blue" },
      { text: "**Reconciliation jobs** — periodic comparison of source and target data stores to catch drift early", color: "purple" },
      { text: "**Compensating transactions** in sagas — if step N fails, automatically roll back steps 1..N-1", color: "coral" },
    ],
  },
  {
    title: "Technical: Writing Acceptance Criteria",
    category: "Technical",
    bullets: [
      { text: "Use **Given/When/Then** (Gherkin) format — forces clarity on preconditions, actions, and expected outcomes", color: "teal" },
      { text: "Each criterion must be **independently testable** — if QA can't write a test from it, it needs more detail", color: "blue" },
      { text: "Always include **edge cases and error paths** — not just the happy path", color: "purple" },
      { text: "Review with **dev, QA, and business** together in refinement — alignment before sprint commitment", color: "green" },
    ],
  },
  {
    title: "Technical: Handling Ambiguous Requirements",
    category: "Technical",
    bullets: [
      { text: "Document **what you know vs. what's unknown** — make gaps visible to stakeholders explicitly", color: "teal" },
      { text: "Propose **two or three options** with tradeoffs — let the business choose rather than guessing", color: "blue" },
      { text: "Build a **thin vertical slice** first — end-to-end proof of concept to flush out unknowns early", color: "purple" },
      { text: "Set up **regular sync cadence** with product — don't wait for perfect requirements, iterate weekly", color: "green" },
    ],
  },
  {
    title: "Technical: Story Grooming & Pointing",
    category: "Technical",
    bullets: [
      { text: "Run **backlog refinement** weekly — PO presents context, team asks clarifying questions, stories get refined", color: "teal" },
      { text: "Use **story points** (Fibonacci) for relative sizing — based on complexity, uncertainty, and effort combined", color: "blue" },
      { text: "Break stories larger than **8 points** into smaller vertical slices — each deployable independently", color: "purple" },
      { text: "Time-box pointing to **2 minutes per story** — no consensus means the story needs more refinement, not more debate", color: "green" },
    ],
  },
  {
    title: "Technical: Business Wants vs. Architecture Constraints",
    category: "Technical",
    bullets: [
      { text: "Never say **\"no\"** — say **\"here's what it costs\"** with concrete tradeoffs: time, tech debt, and risk", color: "teal" },
      { text: "Propose **alternatives** that achieve the business outcome within current architectural constraints", color: "blue" },
      { text: "If the gap is fundamental, suggest a **phased approach** — tactical solution now, strategic refactor later", color: "purple" },
      { text: "Document the **decision and accepted tradeoffs** — make it a conscious choice, not accidental debt", color: "green" },
    ],
  },
  {
    title: "Technical: Apigee & API Gateway Experience",
    category: "Technical",
    bullets: [
      { text: "Used **Apigee Edge** as the gateway layer — rate limiting, OAuth token validation, request/response transformation", color: "teal" },
      { text: "Configured **API products and developer portals** — self-service onboarding for internal and partner consumers", color: "blue" },
      { text: "Set up **analytics and monitoring** — traffic dashboards, error rate alerts, latency tracking per API proxy", color: "purple" },
      { text: "Used **shared flows** for cross-cutting concerns — logging, CORS, security policies applied consistently across APIs", color: "green" },
    ],
  },
  {
    title: "Technical: Documentation — Confluence, Visio & More",
    category: "Technical",
    bullets: [
      { text: "**Confluence** as single source of truth — ADRs, runbooks, data mappings, and onboarding guides", color: "teal" },
      { text: "**Mermaid/PlantUML** for diagrams-as-code — sequence, state, and C4 architecture diagrams versioned in Git", color: "blue" },
      { text: "**Visio/Lucidchart** for stakeholder-facing flows — when business teams need polished, presentable visuals", color: "purple" },
      { text: "**OpenAPI specs** as living API documentation — auto-generated and always in sync with the codebase", color: "green" },
    ],
  },

  // ── Past Roles: CRA — The Digital Filing Migration ──────────────────────
  {
    title: "CRA — Overview & Pitch",
    category: "Past Roles",
    bullets: [
      { text: "Came in around a **system migration** — moving audit file management from **paper-and-spreadsheet** to a new **digital system**", color: "blue" },
      { text: "My job: document how each team actually worked, **standardise it**, and give the migration a **clean baseline** to build on", color: "teal" },
      { text: "The arc: **messy current state** → I standardised it → the migration had a **clean foundation**", color: "green" },
      { text: "Regulated context — where I got comfortable with **Protected B data** and documentation standards", color: "purple" },
    ],
  },
  {
    title: "CRA — Situation & Task",
    category: "Past Roles",
    bullets: [
      { text: "**Situation**: every audit team worked **slightly differently** — no single agreed way to build the new system around", color: "blue" },
      { text: "**Task**: document the **actual current-state** process for each team and find where they **diverged**", color: "purple" },
      { text: "Also asked to run an **audit-readiness review** across active files", color: "teal" },
    ],
  },
  {
    title: "CRA — Action",
    category: "Past Roles",
    bullets: [
      { text: "Documented each team's real workflow — mapped where processes **diverged** and where **manual steps were redundant**", color: "teal" },
      { text: "Produced a **standardised template set** — the baseline the new system was configured against", color: "blue" },
      { text: "Ran a **gap analysis** ranked by **severity**, with a **remediation plan**", color: "purple" },
    ],
  },
  {
    title: "CRA — Result & Takeaway",
    category: "Past Roles",
    bullets: [
      { text: "A **clean, agreed baseline** for the migration to build on", color: "green" },
      { text: "**Two redundant** processing steps eliminated", color: "coral" },
      { text: "Where I got comfortable with **Protected B data** and **regulated documentation** standards", color: "blue" },
    ],
  },

  // ── Past Roles: Genpact / GE — Finance Process Standardisation ───────────
  {
    title: "Genpact / GE — Overview & Pitch",
    category: "Past Roles",
    bullets: [
      { text: "Worked on **GE's finance shared-services** account at Genpact", color: "blue" },
      { text: "Headline project: a **process standardisation** effort across multiple **GE business units**", color: "teal" },
      { text: "The arc: **fragmented processes** → I unified them → unlocked an **automation roadmap** I pitched to leadership", color: "green" },
      { text: "Moved it from \"here's how things work\" to \"**here's what we should automate and why**\"", color: "purple" },
    ],
  },
  {
    title: "Genpact / GE — Situation & Task",
    category: "Past Roles",
    bullets: [
      { text: "**Situation**: each business unit ran finance processes **differently** — inconsistent **automation and reporting**", color: "blue" },
      { text: "**Task**: document the current-state workflows and identify the **variations**", color: "purple" },
    ],
  },
  {
    title: "Genpact / GE — Action",
    category: "Past Roles",
    bullets: [
      { text: "Mapped the current-state workflows and pinpointed the **variations** across units", color: "teal" },
      { text: "Proposed a single **unified process model** — which got **adopted** across the account", color: "blue" },
      { text: "Led into an **accounts-payable automation assessment** — mapped the **end-to-end AP workflow**", color: "purple" },
    ],
  },
  {
    title: "Genpact / GE — Result & Pitch",
    category: "Past Roles",
    bullets: [
      { text: "Unified process model **adopted** across the account", color: "green" },
      { text: "Presented an **AP automation investment proposal** to **finance leadership** — with **effort and value** estimates", color: "teal" },
      { text: "Turned process mapping into an **automation roadmap** the business could act on", color: "blue" },
    ],
  },

  // ── Past Roles: CIBC — Regulatory Reporting Data-Quality ─────────────────
  {
    title: "CIBC — Overview & Pitch",
    category: "Past Roles",
    bullets: [
      { text: "Project tackled **recurring errors** in the **monthly regulatory reports**", color: "blue" },
      { text: "The errors traced back to **data-quality issues** in client account records", color: "teal" },
      { text: "The arc: **reports kept breaking** → I found why and fixed it **at source** → faster, cleaner reporting", color: "green" },
      { text: "A **data-quality and controls** project in a **regulated reporting** context", color: "purple" },
    ],
  },
  {
    title: "CIBC — Situation & Task",
    category: "Past Roles",
    bullets: [
      { text: "**Situation**: monthly regulatory reports had **recurring errors** rooted in bad **account data**", color: "blue" },
      { text: "**Task**: find the **root cause** and stop the errors **at source**", color: "purple" },
    ],
  },
  {
    title: "CIBC — Action",
    category: "Past Roles",
    bullets: [
      { text: "Ran a **root-cause analysis** on the error types", color: "teal" },
      { text: "Proposed a **validation rule set** built into the **CRM** to catch problems **at source**", color: "blue" },
      { text: "Built a **semi-automated reconciliation tool** cross-checking reports against **source data**", color: "purple" },
    ],
  },
  {
    title: "CIBC — Result & Title Note",
    category: "Past Roles",
    bullets: [
      { text: "Cut the reconciliation cycle from **two days to half a day**", color: "coral" },
      { text: "Removed an entire **class of manual error**", color: "green" },
      { text: "If asked about the title: \"It was **Fraud Analyst**, but the work was **data and process analysis** — finding why the data was wrong and building the **controls** to fix it\"", color: "blue" },
    ],
  },

  // ── Past Roles: Skye Bank — Dispute Resolution Redesign ──────────────────
  {
    title: "Skye Bank — Overview & Pitch",
    category: "Past Roles",
    bullets: [
      { text: "Where I did my **first real BSA work**", color: "blue" },
      { text: "Headline: **credit card dispute resolution** times had crept **past regulatory guidance**", color: "teal" },
      { text: "The arc: **disputes were too slow** → I found the bottlenecks → **redesigned the routing** to fix them", color: "green" },
      { text: "**Process redesign** and **operational-readiness** work in a regulated banking environment", color: "purple" },
    ],
  },
  {
    title: "Skye Bank — Situation & Task",
    category: "Past Roles",
    bullets: [
      { text: "**Situation**: dispute resolution times had crept **past regulatory guidance**", color: "blue" },
      { text: "**Task**: map the **end-to-end process** and find what was causing the **delays**", color: "purple" },
    ],
  },
  {
    title: "Skye Bank — Action",
    category: "Past Roles",
    bullets: [
      { text: "Mapped the **end-to-end** dispute process", color: "teal" },
      { text: "Found **three handoff points** that were causing the delays", color: "coral" },
      { text: "Proposed **revised routing logic** to fix them", color: "blue" },
    ],
  },
  {
    title: "Skye Bank — Co-Brand Launch & Readiness",
    category: "Past Roles",
    bullets: [
      { text: "Supported a **co-branded card launch** in parallel", color: "teal" },
      { text: "Documented the **operational procedures** for the new product", color: "blue" },
      { text: "Flagged **gaps** between what the **product design assumed** and what **operations** could actually execute", color: "purple" },
    ],
  },
];

export const DEFAULT_TELEPROMPTER_CARDS: TeleprompterCard[] = [
  {
    id: "default-1",
    title: "Tell Me About Yourself",
    category: "Opening",
    role: DEFAULT_ROLE,
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
  {
    id: "default-9",
    title: "Specifying an API Contract & OpenAPI",
    category: "Technical",
    bullets: [
      {
        text: "Start with **stakeholder workshops** to define the domain model, key resources, and expected consumers",
        color: "teal",
      },
      {
        text: "Draft the **OpenAPI 3.x spec** in YAML — paths, schemas, error models — before writing any code (**contract-first**)",
        color: "blue",
      },
      {
        text: "Use **Swagger Editor** or **Stoplight** for visual review with non-technical stakeholders, generate **mock servers** (Prism/WireMock) so consumers can test before implementation",
        color: "purple",
      },
      {
        text: "Validate with **integration tests** against the spec — any drift between contract and code breaks the build",
        color: "green",
      },
    ],
  },
  {
    id: "default-10",
    title: "API Versioning & Breaking Changes",
    category: "Technical",
    bullets: [
      {
        text: "Prefer **additive changes** — new optional fields, new endpoints — to avoid version bumps entirely",
        color: "teal",
      },
      {
        text: "Use **semantic versioning** on contracts — major bumps only for breaking changes, communicated via **deprecation headers**",
        color: "blue",
      },
      {
        text: "Run **old and new versions in parallel** with a sunset window — give consumers time to migrate",
        color: "purple",
      },
      {
        text: "Track consumer usage via **API gateway analytics** (Apigee) to know when it's safe to decommission the old version",
        color: "green",
      },
    ],
  },
  {
    id: "default-11",
    title: "Producing a Data Mapping Document",
    category: "Technical",
    bullets: [
      {
        text: "Start with **source analysis** — extract field inventory from COBOL copybooks, DB schemas, or existing API payloads",
        color: "teal",
      },
      {
        text: "Map each source field to the **target domain model** — define transformations, type coercions, default values, nullable rules",
        color: "blue",
      },
      {
        text: "Document in a **Confluence table** — columns: source field, type, target field, type, transformation rule, notes",
        color: "purple",
      },
      {
        text: "Validate with **automated sample data runs** — compare expected vs. actual output across edge cases and **1000+ data variants**",
        color: "green",
      },
    ],
  },
  {
    id: "default-12",
    title: "Domain Modelling Approach",
    category: "Technical",
    bullets: [
      {
        text: "Start with **event storming** — sticky notes for domain events, commands, and aggregates with business + tech in the room",
        color: "teal",
      },
      {
        text: "Identify **bounded contexts** — where language and ownership diverge, draw the service boundaries",
        color: "blue",
      },
      {
        text: "Define **aggregate roots** — enforce invariants within a boundary, communicate across boundaries via **domain events**",
        color: "purple",
      },
      {
        text: "Iterate the model with **real user journeys** — walk through scenarios to validate the model holds under edge cases",
        color: "green",
      },
    ],
  },
  {
    id: "default-13",
    title: "State Machine: Policy Lifecycle",
    category: "Technical",
    bullets: [
      {
        text: "Defined a **policy lifecycle state machine** — states: Draft → Submitted → Underwriting → Approved → Active → Lapsed → Cancelled",
        color: "teal",
      },
      {
        text: "Each transition had **guard conditions** — e.g., Submitted → Underwriting requires all mandatory fields validated",
        color: "blue",
      },
      {
        text: "Implemented as an **event-driven model** — state transitions emitted events to Kafka, downstream systems reacted accordingly",
        color: "purple",
      },
      {
        text: "Visualized in **Confluence with Mermaid diagrams** — both business and engineering could trace and validate the flow",
        color: "green",
      },
    ],
  },
  {
    id: "default-14",
    title: "Integration Patterns",
    category: "Technical",
    bullets: [
      {
        text: "**Event-driven / async messaging** — Kafka topics with Avro schemas, idempotent consumers, DLQ for failures",
        color: "teal",
      },
      {
        text: "**Request/reply APIs** — REST with OpenAPI contracts, gRPC for internal service-to-service where latency matters",
        color: "blue",
      },
      {
        text: "**Strangler fig pattern** for legacy migration — incrementally route traffic from monolith to new services",
        color: "purple",
      },
      {
        text: "**Anti-corruption layer** — translate between legacy and modern domain models at integration boundaries",
        color: "coral",
      },
    ],
  },
  {
    id: "default-15",
    title: "Data Integrity Across Systems",
    category: "Technical",
    bullets: [
      {
        text: "**Idempotency keys** on every message and API call — safe retries without duplicate side effects",
        color: "teal",
      },
      {
        text: "**Schema validation** at boundaries — Avro schema registry enforces backward/forward compatibility",
        color: "blue",
      },
      {
        text: "**Reconciliation jobs** — periodic comparison of source and target data stores to catch drift early",
        color: "purple",
      },
      {
        text: "**Compensating transactions** in sagas — if step N fails, automatically roll back steps 1..N-1",
        color: "coral",
      },
    ],
  },
  {
    id: "default-16",
    title: "Writing Acceptance Criteria",
    category: "Technical",
    bullets: [
      {
        text: "Use **Given/When/Then** (Gherkin) format — forces clarity on preconditions, actions, and expected outcomes",
        color: "teal",
      },
      {
        text: "Each criterion must be **independently testable** — if QA can't write a test from it, it needs more detail",
        color: "blue",
      },
      {
        text: "Always include **edge cases and error paths** — not just the happy path",
        color: "purple",
      },
      {
        text: "Review with **dev, QA, and business** together in refinement — alignment before sprint commitment",
        color: "green",
      },
    ],
  },
  {
    id: "default-17",
    title: "Handling Ambiguous or Undocumented Requirements",
    category: "Technical",
    bullets: [
      {
        text: "Document **what you know vs. what's unknown** — make gaps visible to stakeholders explicitly",
        color: "teal",
      },
      {
        text: "Propose **two or three options** with tradeoffs — let the business choose rather than guessing",
        color: "blue",
      },
      {
        text: "Build a **thin vertical slice** first — end-to-end proof of concept to flush out unknowns early",
        color: "purple",
      },
      {
        text: "Set up **regular sync cadence** with product — don't wait for perfect requirements, iterate weekly",
        color: "green",
      },
    ],
  },
  {
    id: "default-18",
    title: "Story Grooming & Pointing",
    category: "Technical",
    bullets: [
      {
        text: "Run **backlog refinement** weekly — PO presents context, team asks clarifying questions, stories get refined",
        color: "teal",
      },
      {
        text: "Use **story points** (Fibonacci) for relative sizing — based on complexity, uncertainty, and effort combined",
        color: "blue",
      },
      {
        text: "Break stories larger than **8 points** into smaller vertical slices — each deployable independently",
        color: "purple",
      },
      {
        text: "Time-box pointing to **2 minutes per story** — no consensus means the story needs more refinement, not more debate",
        color: "green",
      },
    ],
  },
  {
    id: "default-19",
    title: "Business Wants vs. Architecture Constraints",
    category: "Technical",
    bullets: [
      {
        text: "Never say **\"no\"** — say **\"here's what it costs\"** with concrete tradeoffs: time, tech debt, and risk",
        color: "teal",
      },
      {
        text: "Propose **alternatives** that achieve the business outcome within current architectural constraints",
        color: "blue",
      },
      {
        text: "If the gap is fundamental, suggest a **phased approach** — tactical solution now, strategic refactor later",
        color: "purple",
      },
      {
        text: "Document the **decision and accepted tradeoffs** — make it a conscious choice, not accidental debt",
        color: "green",
      },
    ],
  },
  {
    id: "default-20",
    title: "Apigee & API Gateway Experience",
    category: "Technical",
    bullets: [
      {
        text: "Used **Apigee Edge** as the gateway layer — rate limiting, OAuth token validation, request/response transformation",
        color: "teal",
      },
      {
        text: "Configured **API products and developer portals** — self-service onboarding for internal and partner consumers",
        color: "blue",
      },
      {
        text: "Set up **analytics and monitoring** — traffic dashboards, error rate alerts, latency tracking per API proxy",
        color: "purple",
      },
      {
        text: "Used **shared flows** for cross-cutting concerns — logging, CORS, security policies applied consistently across APIs",
        color: "green",
      },
    ],
  },
  {
    id: "default-21",
    title: "Documentation: Confluence, Visio & More",
    category: "Technical",
    bullets: [
      {
        text: "**Confluence** as single source of truth — ADRs, runbooks, data mappings, and onboarding guides",
        color: "teal",
      },
      {
        text: "**Mermaid/PlantUML** for diagrams-as-code — sequence, state, and C4 architecture diagrams versioned in Git",
        color: "blue",
      },
      {
        text: "**Visio/Lucidchart** for stakeholder-facing flows — when business teams need polished, presentable visuals",
        color: "purple",
      },
      {
        text: "**OpenAPI specs** as living API documentation — auto-generated and always in sync with the codebase",
        color: "green",
      },
    ],
  },
];

/**
 * Draft role-specific starter cards seeded when a new role is added.
 * Content is a first-pass scaffold (role woven in, `[bracketed]` placeholders)
 * the user then refines. These are the cards that typically differ per role.
 */
export function makeStarterCardsForRole(
  role: string
): Omit<TeleprompterCard, "id">[] {
  return [
    {
      title: "Tell Me About Yourself",
      category: "Opening",
      role,
      bullets: [
        { text: "**[X]+ years** in software — [your core stack & strengths]", color: "blue" },
        { text: `Targeting a **${role}** role — [what draws you to it]`, color: "purple" },
        { text: "Recent highlight: **[a flagship project or measurable impact]**", color: "teal" },
        { text: "What I bring: **[skill 1]**, **[skill 2]**, **[skill 3]**", color: "green" },
      ],
    },
    {
      title: "Why This Role / Why Me",
      category: "Closing",
      role,
      bullets: [
        { text: `Why **${role}**: [the problem space / mission that excites you]`, color: "blue" },
        { text: "Why me: **[your differentiator]** backed by **[evidence]**", color: "amber" },
        { text: "What I want next: **[the growth or impact you're seeking]**", color: "green" },
      ],
    },
  ];
}
