// Canada Life — Senior IT BSA mock-interview question bank.
//
// Source: Canada_Life_Mock_Interview_Questions.pdf (Johnson Ojo, panel round).
// Each entry pairs the panel question with:
//   - `probe`  — the italic "what they're testing / which story to reach for" line
//   - `answer` — a full, first-person rehearsal answer grounded in the real
//                Bell Subscription Platform projects (Catalog, Contingency, UPCM,
//                Membership, Monorepo, Performance/a11y audit, Bilingual routing).
//
// The answers are deliberately spoken-length (~90 sec – 2 min) and end on a
// Result for the behavioural ones. They are practice scaffolding, not a script.

export type MockCategory =
  | "Opening & Career Narrative"
  | "Motivation & Fit"
  | "Behavioural (STAR)"
  | "Technical & Data-Mapping Depth"
  | "Domain & Regulatory"
  | "Situational"
  | "Questions for the Panel";

export interface MockQA {
  /** Stable id, e.g. "q1". */
  id: string;
  /** Display number from the sheet (1–38). Undefined for the panel questions. */
  num?: number;
  category: MockCategory;
  question: string;
  /** The italic coaching line: what the panel is probing + which story to use. */
  probe: string;
  /** Full rehearsal answer (supports line breaks via \n). */
  answer: string;
  /** Story tags this answer leans on — drives the filter chips. */
  stories?: string[];
}

export interface MockSection {
  category: MockCategory;
  /** Section number on the sheet (1–7). */
  index: number;
  /** One-line description of what the section drills. */
  blurb: string;
  /** Accent color token (arch-*) for the section. */
  accent: "blue" | "purple" | "teal" | "amber" | "green" | "coral" | "red";
}

export const mockSections: MockSection[] = [
  {
    category: "Opening & Career Narrative",
    index: 1,
    blurb: "Your 2-minute narrative — one foot in software, one in finance.",
    accent: "blue",
  },
  {
    category: "Motivation & Fit",
    index: 2,
    blurb: "Why Canada Life, why this role, and closing the title gap.",
    accent: "purple",
  },
  {
    category: "Behavioural (STAR)",
    index: 3,
    blurb: "STAR stories — keep to ~2 min, end on the Result.",
    accent: "teal",
  },
  {
    category: "Technical & Data-Mapping Depth",
    index: 4,
    blurb: "Data mapping, OpenAPI, JDL, state machines, acceptance criteria.",
    accent: "amber",
  },
  {
    category: "Domain & Regulatory",
    index: 5,
    blurb: "Group benefits, where APIs live, compliance constraints.",
    accent: "green",
  },
  {
    category: "Situational",
    index: 6,
    blurb: "On-the-spot judgement — ambiguity, conflict, accountability.",
    accent: "coral",
  },
  {
    category: "Questions for the Panel",
    index: 7,
    blurb: "Pick 2–3 to ask back at the end.",
    accent: "red",
  },
];

// Three phrases to keep dropping in (from the sheet's "How to use this"):
export const anchorPhrases = [
  "before any development work commenced",
  "I produced the data mapping between the front-end and the back-end",
  "the dev team built directly against it",
];

export const mockQuestions: MockQA[] = [
  // ── 1 · Opening & Career Narrative ─────────────────────────────────
  {
    id: "q1",
    num: 1,
    category: "Opening & Career Narrative",
    question: "Walk us through your background and what brings you to this role.",
    probe:
      "Your 2-minute narrative. One foot in software, one in finance — land on: the WB&R domain is financial and regulated, exactly where the CPA + banking background pays off alongside the BSA work.",
    answer:
      "I sit at the intersection of two disciplines that don't usually meet in one person. On the software side, I work on Bell's subscription-management platform — a microfrontend and API platform spanning 18 products — where I own the requirements: data-mapping documents, acceptance criteria, state machines, and the API contracts the dev team builds against.\n\nOn the finance side, I'm a CPA, and I spent time in banking and at the CRA handling Protected B data. So I don't read financial regulation as a compliance checkbox — I read it as a business constraint that shapes how the product has to behave.\n\nWhat brings me here is that Workplace Benefits & Retirement is exactly where those two halves combine. It's a financial, regulated domain where the data is plan members' retirement savings, and the work is getting API contracts right at the foundational layer. That's the work I already do — I just want to do it where the domain rewards the finance background as much as the BSA discipline.",
    stories: ["Membership", "CPA / CRA"],
  },
  {
    id: "q2",
    num: 2,
    category: "Opening & Career Narrative",
    question: "Tell us about the platform you work on at Bell and your role on it.",
    probe:
      "Describe the microfrontend + API platform crisply (18 products). Name Contingency, Catalog, UPCM, Membership so it sounds lived-in, not rehearsed.",
    answer:
      "It's a microfrontend and API platform for Bell's residential subscription business — streaming bundles like Crave, Netflix, and Disney+ tied to Bell services. It's a monorepo of around 18 products with a Go microservice backend behind it.\n\nMy work cuts across several of them. On Contingency Management — the back-office tool agents use to look up subscribers and orders — I specified the API contract, the data mapping, and the state machine for status transitions. On Catalog Management I ran the requirements for how products expire versus cancel, reconciling marketing, product, and billing. On UPCM I reverse-engineered an export pipeline that had no documentation and produced the domain model and export-status state machine. And on Membership Management I worked OpenAPI-first, with the YAML spec as the source of truth and TypeScript types generated from it.\n\nAcross all of them my role is the same: I own building the right thing before any development work commences. The developers own the implementation; I own the requirements they build against.",
    stories: ["Contingency", "Catalog", "UPCM", "Membership"],
  },
  {
    id: "q3",
    num: 3,
    category: "Opening & Career Narrative",
    question: "In your own words, what does a Business Systems Analyst actually do?",
    probe:
      "You own building the right thing before code is written — requirements, data mapping, AC, post-delivery review. Not implementation.",
    answer:
      "A BSA owns building the right thing before any code is written. Concretely, that's four things for me.\n\nFirst, requirements — turning a business need into something unambiguous: the rules, the edge cases, the failure paths. Second, data mapping — tracing every field from the front-end through the API to the back-end data store, so the contract is validated end-to-end, not assumed. Third, acceptance criteria — written per story, concrete enough that a reviewer can check pass or fail without coming back to ask me what I meant. And fourth, post-delivery review — checking the build against the AC once it's done, raising defects, and feeding that back.\n\nWhat I don't do is implementation. The developer reads my specs and builds against them. If the meaning of a requirement is ever in question mid-sprint, they come to me — I'm the source of truth for what it's supposed to do.",
  },
  {
    id: "q4",
    num: 4,
    category: "Opening & Career Narrative",
    question: "What's the difference between your role and a developer's on your team?",
    probe:
      '"Developers own the implementation. I own the requirements. A developer joining the team reads my specs and builds against them; if a requirement\'s meaning is in question mid-sprint, they come to me."',
    answer:
      "It's a clean split. Developers own the implementation — the code, the architecture choices, how it's built. I own the requirements — what's being built, why, and the rules it has to satisfy.\n\nThe practical test is this: a developer joining the team reads my specs — the requirement docs, the data mapping, the acceptance criteria, the state machine — and builds directly against them. They shouldn't need me to write code. But if a requirement's meaning comes into question mid-sprint, an edge case nobody pinned down, they come to me, and I resolve it against the business intent and update the AC so it's closed for good.\n\nSo we're not doing the same job at different seniorities. They're answerable for the implementation being correct; I'm answerable for the requirement being right in the first place.",
  },

  // ── 2 · Motivation & Fit ───────────────────────────────────────────
  {
    id: "q5",
    num: 5,
    category: "Motivation & Fit",
    question: "Why Canada Life, and why this role specifically?",
    probe:
      "The API Integration team builds the foundation the digital member experience sits on. You want to get the contracts right at that foundational layer — errors there ripple across millions of member accounts. Tie to the live transformation (CDO, TCS deal, hiring surge).",
    answer:
      "The API Integration team builds the foundation the whole digital member experience sits on. Every member portal interaction, every claim, every administration lookup crosses an integration point with a data contract behind it. Getting those contracts right is the highest-leverage place I can work, because an error at that layer doesn't stay local — it ripples across millions of member accounts and compounds.\n\nThat's exactly the work I want to own: the contract at the foundational layer, where precision matters most. And the timing is part of it — Canada Life is in the middle of a real transformation, the CDO mandate, the TCS partnership, a serious hiring push. That tells me the requirements and integration practice is being actively built out, and a senior BSA can have real influence on how it matures rather than inheriting something frozen.\n\nSo it's the right layer, the right domain, and the right moment.",
  },
  {
    id: "q6",
    num: 6,
    category: "Motivation & Fit",
    question: "Why are you looking to leave Bell?",
    probe:
      "Keep it forward-looking: title and domain alignment, regulated-financial fit. Do NOT bash Bell or lead with layoffs — that's your private calculus, not your answer.",
    answer:
      "It's a forward-looking move, not a move away from anything. Bell's been a strong place to build the BSA discipline — the platform's complex, the stakeholders are real, and I've produced the full set of artifacts a senior analyst should.\n\nWhat's pulling me is alignment on two fronts. One is the role itself — I want the work I've been doing to be recognised as BSA work, on a team built around requirements and integration. The other is domain. My background is CPA and regulated finance, and I want to apply it where it actually shapes the product — a financial, regulated space like Workplace Benefits & Retirement, where the data is members' retirement savings. Bell's domain is telecom subscriptions; the discipline transfers, but the domain fit is much stronger here.\n\nSo it's about putting the finance background and the BSA work in the same place.",
  },
  {
    id: "q7",
    num: 7,
    category: "Motivation & Fit",
    question:
      "Your resume shows a Software / Front-End Engineer title, but this is a BSA role. Help us understand.",
    probe:
      "Recovery line: the title reflects how you entered Bell's graduate program; the work has been BSA-oriented throughout. Point to deliverables — requirement specs, data-mapping docs, AC, state machines. That's what this role asks for and what you've produced.",
    answer:
      "Fair question, and the short version is the title reflects how I entered Bell, not what I've been doing. I came in through the graduate engineering program, so the badge says Software / Front-End Engineer — but the work has been BSA-oriented throughout.\n\nThe way to judge it is by the deliverables, and mine are BSA deliverables. On Contingency I produced the API contract, the data-mapping document between the front-end and the back-end, and a state machine for status transitions. On UPCM I produced a domain model and an export-status state machine from scratch. Across stories I write the per-story acceptance criteria the dev team builds against, and I run the post-delivery review against those criteria.\n\nThose are requirement specs, data-mapping docs, acceptance criteria, and state machines — which is exactly what this role asks for. The title undersells it; the artifacts are the real evidence.",
    stories: ["Contingency", "UPCM"],
  },
  {
    id: "q8",
    num: 8,
    category: "Motivation & Fit",
    question: "You hold a CPA. Why not a finance role — and how does it help you here?",
    probe:
      "CPA as a differentiator, not a detour. You understand financial regulation as a business constraint that shapes product design, not a compliance checkbox — and here the data is plan members' retirement savings.",
    answer:
      "I see the CPA as a differentiator for this role, not a detour away from it. I'm not looking to do accounting — I'm looking to do requirements work in a domain where understanding the finance is an advantage.\n\nWhat the CPA gives me is the ability to read financial regulation as a business constraint that shapes product design, not as a compliance checkbox somebody bolts on at the end. When a rule about how money or member data has to be handled exists, I can trace it into what the API actually has to do — the validation, the audit trail, the failure path — instead of treating it as someone else's problem.\n\nAnd here the stakes make that matter. The data is plan members' retirement savings. A BSA who genuinely understands why the regulation exists, and what a data error costs downstream, is going to write tighter contracts than one who's just told to be compliant. That's where the CPA pays off.",
    stories: ["CPA / CRA"],
  },
  {
    id: "q9",
    num: 9,
    category: "Motivation & Fit",
    question:
      "You don't have direct group-benefits product experience. How fast can you get productive?",
    probe:
      "Honest + confident: the domain is financial and regulated — exactly where your CPA and banking background applies. Productive in 60–90 days.",
    answer:
      "I'll be honest — I haven't shipped a group-benefits product. But the gap is narrower than the job title suggests, and I'd expect to be productive in 60 to 90 days.\n\nHere's why I'm confident. The domain is financial and regulated, and that's exactly where my CPA and banking background already lives — I don't have to learn how to think about regulated financial data, I have to learn this specific product's rules. And the core BSA skill transfers directly: reverse-engineering an undocumented system, mapping the real behaviour, building the domain model, and getting stakeholder sign-off. I did exactly that on UPCM, where no formal requirements existed and I made my model the reference for everything built after.\n\nSo my first 60–90 days look like that UPCM pattern applied here: learn the benefits domain and the existing contracts, map what's really happening, and start producing requirements people can build against. The financial fluency is already there.",
    stories: ["UPCM", "CPA / CRA"],
  },
  {
    id: "q10",
    num: 10,
    category: "Motivation & Fit",
    question:
      "This role is hybrid, three days a week in the Toronto office. Workable for you?",
    probe:
      "Confirm cleanly. PR, no sponsorship, two-week notice, comfortable with the Reliability Status process. Don't over-explain.",
    answer:
      "Yes, that works for me, no concerns. Three days a week in the Toronto office is fine.\n\nTo get the logistics out of the way: I'm a permanent resident, so there's no sponsorship needed, I'd give two weeks' notice, and I'm comfortable with the Reliability Status process — I've held a security clearance before at the CRA handling Protected B data.\n\nSo nothing on my side that would slow this down.",
    stories: ["CPA / CRA"],
  },

  // ── 3 · Behavioural (STAR) ─────────────────────────────────────────
  {
    id: "q11",
    num: 11,
    category: "Behavioural (STAR)",
    question:
      "Tell us about a time you handled complex requirements with multiple, conflicting stakeholders.",
    probe:
      "→ Catalog Management. Marketing / product / billing, the expire-vs-cancel distinction, separate sessions then reconcile in one room, written sign-off from all three.",
    answer:
      "On Catalog Management, the requirement was how a product should behave when it's retired — and three groups wanted three different things. Marketing cared about how it looked to the customer, product cared about the catalog lifecycle, and billing cared about when charges stopped. The crux was a distinction they were all using loosely: expire versus cancel. Those are different states with different downstream effects, and everyone assumed their own meaning.\n\nWhat I did first was run separate sessions with each group, so I could draw out what each one actually needed without them arguing past each other. I mapped expire and cancel as two distinct states and traced what each one meant for their area. Then I brought all three into one room with that mapping in front of them, so the trade-offs were visible to everybody at once instead of me carrying separate promises between them.\n\nThe Result was a single agreed definition of expire versus cancel, with written sign-off from all three groups. The dev team built directly against that, and we didn't get the rework cycle that ambiguity would otherwise have caused.",
    stories: ["Catalog"],
  },
  {
    id: "q12",
    num: 12,
    category: "Behavioural (STAR)",
    question:
      "Describe a time you disagreed with a technical or product decision. How did you handle it?",
    probe:
      "→ Catalog expire-vs-cancel, or the PM / Core Web Vitals story. Pattern: evidence first, raise it privately, bring a solution in hand.",
    answer:
      "We had a PM who wanted to defer a chunk of performance work — the page's Core Web Vitals were poor, and the call was to ship features first and clean it up later. I disagreed, but I didn't want to make it a debate of opinions.\n\nSo I led with evidence. I ran the audit myself, pulled the actual metrics, and tied the slow load and layout shift to behaviours that affect real users on the journeys we cared about. Then I raised it privately with the PM first, not in a group setting where it becomes a confrontation. And I came with a solution in hand, not just a complaint — a prioritised fix list, ordered by impact versus effort, so the conversation was 'here's the 80% of the value at 20% of the cost,' not 'you're wrong.'\n\nThe Result was the PM agreed to sequence the high-impact fixes in, we measured the improvement afterward, and it set the pattern I use whenever I disagree: evidence first, raise it privately, bring a solution.",
    stories: ["Performance / a11y audit"],
  },
  {
    id: "q13",
    num: 13,
    category: "Behavioural (STAR)",
    question: "What project are you most proud of, and why?",
    probe:
      "→ Contingency Management. API contract, state machine for legal status transitions, data-mapping doc; the audit log you specified has since been used in two internal investigations.",
    answer:
      "Contingency Management — the back-office tool agents use to look up subscribers and orders. I'm proud of it because it's the clearest example of BSA work creating durable value.\n\nBefore any development work commenced, I produced three things: the API contract for how the tool talks to the back end, a state machine for the status transitions an order moves through, and the data-mapping document between the front-end views and the back-end data — agent views to REST endpoints to the underlying schema. I also specified an audit log as a formal requirement: every consequential action recorded, who did it and when.\n\nThe dev team built directly against those specs. The Result that makes me proudest isn't the launch — it's that the audit log I specified has since been used in two separate internal investigations. A requirement I wrote, that nobody asked for as a headline feature, turned out to be the thing that let the business reconstruct what happened. That's requirements work paying off long after delivery.",
    stories: ["Contingency"],
  },
  {
    id: "q14",
    num: 14,
    category: "Behavioural (STAR)",
    question:
      "Give an example of operating in ambiguity with no documentation to work from.",
    probe:
      "→ UPCM. No formal requirements existed; you mapped existing behaviour, produced the domain model and export-status state machine, got sign-off from three groups, and it became the reference for all later development.",
    answer:
      "UPCM is the clearest one. I was handed an export pipeline that was already running in production but had no formal requirements anywhere — no spec, no domain model, just behaviour in the code and tribal knowledge in a few people's heads.\n\nMy first move was to map what was actually happening rather than what anyone said was happening. I traced the existing behaviour end to end and turned it into two artifacts: a domain model in the language the business actually used, and a state machine for export status — READY_TO_EXPORT moving to EXPORTED, FAILED, or CANCELLED, with the trigger events and error-handling rules made explicit. Then I took that back to the three groups that touched the pipeline and got sign-off that yes, this is the real model.\n\nThe Result is that my model became the reference for all later development on that pipeline. Work that used to depend on whoever remembered how it behaved now had a written source of truth, and new changes were specced against it. I turned undocumented behaviour into the contract.",
    stories: ["UPCM"],
  },
  {
    id: "q15",
    num: 15,
    category: "Behavioural (STAR)",
    question: "Tell us about a time you juggled multiple competing priorities.",
    probe:
      "→ Monorepo, 17 concurrent projects. Mapped the dependency chain, prioritised the upstream shared-package update, communicated the sequencing before anyone noticed a slowdown.",
    answer:
      "Our platform is a monorepo with around 17 concurrent projects, and at one point a shared upstream package needed updating — the kind of thing where every downstream product depends on it but no single team owns the consequence.\n\nThe risk was that teams would keep building in parallel, and then collide when the shared package changed underneath them. So instead of treating the projects as a flat list, I mapped the dependency chain — which products consumed the shared package, and what would break and in what order if it moved. That made the real priority obvious: the upstream shared-package update had to be sequenced first, because everything else was downstream of it.\n\nThen the important part was communication. I laid out the sequencing — this goes first, here's why, here's when your piece can safely land — and I did it before anyone hit a problem.\n\nThe Result was that we updated the shared package and the 17 projects stayed unblocked. Nobody experienced a slowdown, because the sequencing was communicated ahead of the collision instead of after it.",
    stories: ["Monorepo"],
  },
  {
    id: "q16",
    num: 16,
    category: "Behavioural (STAR)",
    question:
      "Describe a time you caught a problem before it reached production or a customer.",
    probe:
      "→ Contingency state machine preventing a class of data-integrity errors, or the bilingual-routing dependency you surfaced before the sprint began.",
    answer:
      "On a bilingual feature, I caught a dependency before the sprint even started. The team had scoped the work as a straightforward build, but when I walked the requirements I realised the routing logic depended on the user's language — English and French users would need to be routed differently downstream, and the upstream service the team planned to call didn't carry that context the way they assumed.\n\nIf that had gone into the sprint as scoped, French-language users would have hit a broken path, and we'd have found out in testing at best or in production at worst. Because I'm the one who owns the requirements end to end, I surfaced it during grooming — flagged the language-routing dependency, showed where the context got dropped, and got it added to scope before anyone committed story points to the wrong design.\n\nThe Result was that the dependency became part of the requirement up front, the team built it correctly the first time, and we avoided a bilingual defect reaching customers — which in a regulated bilingual market isn't just a bug, it's a compliance miss.",
    stories: ["Bilingual routing"],
  },
  {
    id: "q17",
    num: 17,
    category: "Behavioural (STAR)",
    question:
      "Tell us about a time you took ownership of something no one asked you to fix.",
    probe:
      "→ The performance / accessibility audit you ran on your own time — spotted it, investigated, built a prioritised fix doc, presented it, measured the result.",
    answer:
      "Nobody asked me to do this one — I noticed the product felt slow and that some of the accessibility wasn't right, and it was bothering me enough that I ran an audit on my own time.\n\nI spotted it, then I investigated properly instead of just complaining: I measured the performance metrics and the Core Web Vitals, and I went through the accessibility issues — keyboard navigation, contrast, the things that actually lock people out. Then I turned it into something actionable — a prioritised fix document, ordered by user impact against effort, so it wasn't a wall of problems, it was a plan. I presented that to the team and the PM.\n\nThe Result was that the high-impact items got picked up and scheduled, and I measured the improvement afterward so we knew it actually moved — better load and layout-stability numbers, and accessibility gaps closed. The part I value is that it started from ownership: I saw something degrading the product, took it from observation to a measured fix, and brought it to people ready to act on.",
    stories: ["Performance / a11y audit"],
  },
  {
    id: "q18",
    num: 18,
    category: "Behavioural (STAR)",
    question: "Tell us about a mistake you made and how you handled it.",
    probe:
      "Have an honest one ready: full accountability in the moment + a fix to the system, not just the incident. Don't pick a fake \"weakness.\"",
    answer:
      "Early on, I signed off acceptance criteria on a change without nailing down one edge case — what should happen when a particular field came back empty from an upstream service. It wasn't in the AC, so the dev built the reasonable-looking path, and it produced wrong behaviour in that case. It got caught in testing, but it was my gap — I'd left the failure path implicit.\n\nI handled it in two parts. In the moment, I owned it directly — I didn't frame it as the developer missing something, because the requirement was mine and the ambiguity was mine. I worked with them to define the correct behaviour for the empty case and we corrected it.\n\nBut the part I care about is that I fixed the system, not just the incident. I changed how I write AC: every story now has to make the failure paths and source-of-truth logic explicit — empty, timeout, conflicting values — before it goes to dev. So the Result wasn't just that one bug fixed; it was that a whole class of 'we never specified the edge case' defects got designed out of my work. That's the mistake that made me a better analyst.",
  },

  // ── 4 · Technical & Data-Mapping Depth ─────────────────────────────
  {
    id: "q19",
    num: 19,
    category: "Technical & Data-Mapping Depth",
    question:
      "Walk us through how you produce a data-mapping document between an API and a front-end.",
    probe:
      "→ Contingency: agent views → REST endpoints → DB schema. Frame it as actively validating the contract end-to-end against the data — not passive review.",
    answer:
      "I'll use Contingency as the concrete example. The deliverable is a document that traces every field across three layers: the agent-facing view, the REST endpoints behind it, and the database schema underneath that.\n\nI work it column by column. For each field the agent sees — say a subscriber's status or customer name — I record where it surfaces in the UI, which endpoint and which field in the payload supplies it, and which table and column it ultimately comes from, plus any transformation in between. So you can read one row and follow a single piece of data from screen to storage.\n\nThe part I'm deliberate about is that this is active validation, not passive review. I don't just transcribe what the API doc claims — I check the contract end-to-end against the actual data. I query the database to confirm the payload really matches the source of truth, that the field is populated where it's supposed to be, that a 'name' coming back as null is handled rather than crashing the page. That's where I catch the mismatches — a field the API promises but the data doesn't reliably hold.\n\nThe output is a document the dev team builds directly against, and because I've validated it against real data, the contract holds up when it ships.",
    stories: ["Contingency"],
  },
  {
    id: "q20",
    num: 20,
    category: "Technical & Data-Mapping Depth",
    question: "We work heavily with OpenAPI specs. Talk us through your experience.",
    probe:
      "→ Membership Management. OpenAPI YAML as the formal contract; openapi-typescript generated TS types from the spec, so any contract change is a compile error, not a runtime surprise. The spec is the source of truth.",
    answer:
      "On Membership Management, the OpenAPI spec was the formal contract, and I treated it as the single source of truth — not documentation written after the fact, but the thing everyone builds from.\n\nConcretely, the contract lived as an OpenAPI YAML file: every endpoint, request and response schema, the field types, the required versus optional fields, the error responses. I worked in that spec directly when defining what the API had to expose. Then we generated the TypeScript types straight from the spec using openapi-typescript, so the front-end consumed types that came from the contract itself.\n\nThe payoff is that it changes where errors surface. If the contract changes — a field is renamed, a type changes, something becomes nullable — it's a compile error in the front-end immediately, not a runtime surprise a customer hits later. The spec and the code can't silently drift, because the types are derived from the spec.\n\nSo my experience is using OpenAPI as the actual governing contract: define it precisely, make it the source of truth, and wire the toolchain so any drift fails loud and early.",
    stories: ["Membership"],
  },
  {
    id: "q21",
    num: 21,
    category: "Technical & Data-Mapping Depth",
    question: "The JD mentions JDL files. Have you used them?",
    probe:
      "Honest: not JDL specifically, but the discipline is identical — JHipster Domain Language is schema-first modelling that generates API scaffolding and DB schemas; contract drives implementation, exactly how you've worked.",
    answer:
      "I'll be straight — not JDL specifically. But the discipline behind it is exactly how I already work, so it's a notation gap, not a skills gap.\n\nJDL is the JHipster Domain Language — you define your entities, their fields, and the relationships between them in a schema, and the tooling generates the API scaffolding and the database schema from that definition. The point is that the contract drives the implementation: you model the domain first, and the code follows the model.\n\nThat's the same principle as everything I've done. On UPCM I built the domain model first and the build followed it. On Membership the OpenAPI spec drove the generated types. JDL is that idea applied to entities and persistence — nouns become entities, verbs become relationships, and the schema is the source of truth.\n\nSo I'd pick up the JDL syntax quickly, because I already think schema-first. What JDL formalises is the way I already approach domain modelling.",
    stories: ["UPCM", "Membership"],
  },
  {
    id: "q22",
    num: 22,
    category: "Technical & Data-Mapping Depth",
    question: "What's a southbound orchestration spec to you, and have you written one?",
    probe:
      "→ UPCM export pipeline. The state machine: READY_TO_EXPORT → EXPORTED / FAILED / CANCELLED, trigger events, payload shape, error-handling rules. Same discipline, their notation.",
    answer:
      "A southbound orchestration spec, to me, is the document that defines how a system calls out to downstream services to get something done — the sequence of calls, what triggers each step, the payload shape at each hop, and crucially what happens when a step fails. It's the contract for a multi-step flow, not a single request.\n\nYes, I've written one — the UPCM export pipeline is exactly this. The heart of it is a state machine: an item starts at READY_TO_EXPORT and moves to EXPORTED on success, or to FAILED or CANCELLED depending on what happened. Around that I specified the trigger events that move an item between states, the payload shape going downstream, and the error-handling rules — what's retried, what's terminal, what alerts someone.\n\nThe value of writing it that way is that the failure paths are part of the spec, not an afterthought. The dev team isn't guessing what to do when the downstream call times out; it's defined. So I've written southbound orchestration specs — just in my notation. The discipline maps directly onto yours.",
    stories: ["UPCM"],
  },
  {
    id: "q23",
    num: 23,
    category: "Technical & Data-Mapping Depth",
    question: "How do you approach domain modelling?",
    probe:
      "Start with the language the business uses, not the technical schema. Nouns = entities, verbs = relationships. → UPCM data model drove the build, it didn't document it after the fact.",
    answer:
      "I start with the language the business actually uses, not the technical schema. The fastest way to build a model nobody trusts is to start from database tables and back-fill the business meaning. So I listen for how the people who run the process talk about it — the nouns they use become candidate entities, the verbs become the relationships and the actions.\n\nThen I make that explicit: entities, their attributes, how they relate, and the states they move through. I take it back to the business and confirm it reflects how they actually think, because if the model matches their language, ambiguity drops — we're all describing the same thing.\n\nThe UPCM data model is the example I point to, and the thing I'm proud of there is the sequencing: the model drove the build, it didn't document it after the fact. It existed before development, the dev team built against it, and it stayed the reference. That's the test of good domain modelling for me — it's the thing the system is built from, not a diagram drawn afterward to explain code that already exists.",
    stories: ["UPCM"],
  },
  {
    id: "q24",
    num: 24,
    category: "Technical & Data-Mapping Depth",
    question: "How do you write acceptance criteria, and how do you keep them testable?",
    probe:
      "Per-story AC, no story to dev without written AC. Concrete and verifiable — a reviewer can check pass/fail without asking you.",
    answer:
      "My rule is simple: no story goes to a developer without written acceptance criteria. AC is per-story, and it's a gate, not a nice-to-have.\n\nThe standard I hold them to is that they're concrete and verifiable — a reviewer can pick up the story and check pass or fail without coming back to ask me what I meant. So instead of 'the page handles errors gracefully,' it's 'when the customer-name lookup returns empty, the field shows N/A and the page still loads.' That's checkable. Anyone can run it and agree on the outcome.\n\nI also make sure the failure paths and edge cases are in the AC, not just the happy path — empty values, timeouts, conflicting inputs. That's where ambiguity hides, and an AC that only covers the happy path is the one that produces a defect later.\n\nKeeping them testable is really the same thing as keeping them unambiguous: if I can't write the criterion as something with a clear pass or fail, that's a signal the requirement itself isn't pinned down yet, and I go close that before the story moves.",
  },
  {
    id: "q25",
    num: 25,
    category: "Technical & Data-Mapping Depth",
    question: "How do you use SQL in your work?",
    probe:
      "Active validation: you check the API's data contract end-to-end against the database — confirming the payload matches the source of truth. Frame as validation, not auditing or passive review.",
    answer:
      "I use SQL to actively validate the data contract — to confirm that what the API claims to return is what the database actually holds.\n\nWhen I'm producing a data-mapping document, I don't take the API spec on faith. I go to the database and check: is this field actually populated where the contract says it is? Does the value match the source of truth? What does it really do when there's no value — null, empty, a default? On Contingency, for instance, I queried the underlying data to confirm the payload the front-end consumed genuinely matched what was stored, and that's how I caught the cases where a field could come back missing and needed handling.\n\nI'd frame it as validation, not auditing or passive review. I'm not running reports for their own sake — I'm using SQL as the tool that closes the loop on the contract end to end, so that when the dev team builds against my mapping, it holds up against the real data. It's how I make sure the spec and the source of truth agree before anyone ships.",
    stories: ["Contingency"],
  },
  {
    id: "q26",
    num: 26,
    category: "Technical & Data-Mapping Depth",
    question:
      "How do you handle error states, timeouts, and edge cases in an API contract?",
    probe:
      "Your job is to catch ambiguity, rule conflicts, validation gaps, and error/timeout states before they reach engineering. Source-of-truth logic and failure paths are part of the spec, not an afterthought.",
    answer:
      "I treat the failure paths as part of the spec, not an afterthought — because that's exactly where requirements work earns its keep. My job is to catch the ambiguity, the rule conflicts, the validation gaps, and the error and timeout states before they reach engineering, not after a developer has guessed.\n\nSo when I define a contract, I work through the unhappy paths deliberately. What's the source-of-truth logic — which system wins when two disagree? What happens on a timeout downstream — retry, fail, or degrade? What does an empty or malformed field do? What's the precedence when validation rules conflict? Each of those gets an answer in the spec, with the error responses defined as explicitly as the success ones.\n\nA concrete example: on Contingency I specified that when the customer name wasn't available from the upstream profile service, the field shows N/A and the page still loads — a soft failure, defined up front, rather than a crash discovered later. That's the discipline: every failure path named and decided in the contract, so engineering builds the right behaviour the first time instead of inventing one under pressure.",
    stories: ["Contingency"],
  },
  {
    id: "q27",
    num: 27,
    category: "Technical & Data-Mapping Depth",
    question: "How do you lead story grooming and pointing with a development team?",
    probe:
      "Walk the requirements, surface ambiguity, point alongside engineers. The grooming session is where you confirm the team and the spec agree before anyone commits.",
    answer:
      "I treat grooming as the checkpoint where the team and the spec confirm they agree, before anyone commits to building. So I come in having done the work — the requirements, the AC, the data mapping are already drafted — and grooming is where we pressure-test them together.\n\nI walk the team through the requirements story by story, and my main job in the room is to surface ambiguity actively — to ask the questions that expose where the spec is thin or where two people are picturing different things. That's often where I catch a dependency, like the bilingual-routing one I flagged in grooming before that sprint started. Better it comes out here than mid-build.\n\nThen I point alongside the engineers, not over them. They own the implementation estimate; my contribution to pointing is making sure the complexity they're sizing is the real complexity — that nobody's pointing a story that still has an open question hiding in it. The Result of a good grooming session is that when the story is committed, the team and I genuinely agree on what's being built, and the meaning of the requirement isn't going to come back up mid-sprint.",
    stories: ["Bilingual routing"],
  },
  {
    id: "q28",
    num: 28,
    category: "Technical & Data-Mapping Depth",
    question:
      "Once a build is done, how do you make sure it actually meets the requirements?",
    probe:
      "→ Catalog: post-delivery review against the AC, raise defects, and you turned it into a repeatable review standard.",
    answer:
      "I run a post-delivery review against the acceptance criteria — the same AC I wrote before the build started, used now as the checklist. Because the criteria were written to be concrete and verifiable, this is a clean exercise: I go through each one and confirm pass or fail against the actual delivered behaviour, including the edge cases, not just the happy path.\n\nWhere something doesn't match, I raise it as a defect, specifically tied back to the AC it violates — so it's not 'this feels off,' it's 'AC-4 says empty name shows N/A, the build throws an error.' That makes it unambiguous for the developer to action.\n\nOn Catalog I did this and then went a step further — I turned it into a repeatable review standard rather than a one-off. So post-delivery review against the AC became a defined step in how we close out work, not something that happened only when I remembered to. The Result is that 'done' actually means 'meets the requirement,' and the check is consistent across stories instead of depending on who's looking.",
    stories: ["Catalog"],
  },

  // ── 5 · Domain & Regulatory ────────────────────────────────────────
  {
    id: "q29",
    num: 29,
    category: "Domain & Regulatory",
    question: "What do you understand about how group benefits work?",
    probe:
      "Plan sponsor (employer) holds the contract; employees/dependants are members. Claims hit the adjudication engine; renewal pricing is driven by the group's actual claims experience.",
    answer:
      "The way I understand it, the structure starts with the plan sponsor — usually the employer — who holds the contract with the insurer. The employees, and their dependants, are the members covered under that contract. So there's an important distinction: the buyer and the beneficiary aren't the same party, and the data model has to reflect that.\n\nOperationally, when a member incurs an eligible expense, the claim hits the adjudication engine, which decides what's covered and what's paid based on the plan's rules. That's the high-volume, rules-driven heart of the system.\n\nAnd the part I find most interesting from a finance angle is the feedback loop: renewal pricing is driven by the group's actual claims experience. The more the group claims, the more the premium tends to move at renewal. That's why data integrity matters so much — the claims data isn't just operational, it directly feeds what the employer pays next year. So a benefits system isn't just processing transactions; it's generating the data that prices the contract.",
  },
  {
    id: "q30",
    num: 30,
    category: "Domain & Regulatory",
    question: "Where do APIs live in the claims / benefits flow?",
    probe:
      "Between member portal ↔ adjudication ↔ plan administration ↔ payment. Every handoff is an integration point with a data contract — exactly what a BSA specifies.",
    answer:
      "APIs live at every handoff between the major systems in the flow. If you trace a claim, it moves from the member portal, to the adjudication engine, to plan administration, to payment — and each of those arrows is an integration point with a data contract behind it.\n\nThe member submits or checks something in the portal; that calls into adjudication to determine coverage; adjudication coordinates with plan administration for the member's eligibility and plan rules; and an approved claim flows out to payment. None of those systems share a database — they talk through APIs, and each API is a contract about what data crosses, in what shape, with what validation and what failure behaviour.\n\nThat's exactly where a BSA on an API integration team adds value. Every one of those handoffs is something I specify — the contract, the data mapping, the error and timeout handling. And because it's a chain, an error in an early contract doesn't stay put; it propagates downstream into pricing and payment. So getting the contracts right at those boundaries is the whole game, and it's the work this team owns.",
  },
  {
    id: "q31",
    num: 31,
    category: "Domain & Regulatory",
    question:
      "This domain is heavily regulated. What compliance constraints would shape your API requirements?",
    probe:
      "OSFI auditability, PIPEDA / Privacy Act on sensitive health + financial data, CAPSA Guideline No. 3 for capital accumulation plans, and bilingual (EN/FR) obligations as a recurring non-functional requirement.",
    answer:
      "A few stand out, and I'd treat each as a constraint that shapes the contract, not a checkbox at the end.\n\nFirst, OSFI auditability — as a federally regulated insurer, actions and changes need to be reconstructable. That pushes me toward audit logging as a formal requirement in the API, the way I specified the audit log on Contingency that ended up being used in real investigations.\n\nSecond, privacy — PIPEDA and the Privacy Act, because we're handling sensitive health and financial data. That shapes access controls, what data a given endpoint is allowed to return, data minimisation, and RBAC as an explicit requirement.\n\nThird, for the retirement side, CAPSA Guideline No. 3 on capital accumulation plans — governance over how members' accumulation-plan data and choices are handled.\n\nAnd fourth, bilingual obligations — English and French. I treat EN/FR as a recurring non-functional requirement on basically everything, which is exactly why I flagged that language-routing dependency before the sprint; in a regulated bilingual market, a French-language gap isn't just a bug, it's a compliance miss.\n\nThe common thread is that I bake these into the contract up front rather than auditing for them later.",
    stories: ["Contingency", "Bilingual routing", "CPA / CRA"],
  },
  {
    id: "q32",
    num: 32,
    category: "Domain & Regulatory",
    question: "How does your CRA and Protected B background apply here?",
    probe:
      "Reliability Status process is straightforward for you. At the CRA you handled Protected B data; at Bell you designed audit trails and RBAC as formal requirements. Same discipline — here the data is members' retirement savings.",
    answer:
      "It applies pretty directly. At the CRA I handled Protected B data, so the Reliability Status process is familiar territory — I've worked under that kind of clearance and data-handling discipline before, and it's straightforward for me.\n\nMore importantly, it shaped how I write requirements. Handling sensitive government data taught me to treat access control and traceability as first-class requirements, not afterthoughts — and I carried that into Bell, where I designed audit trails and role-based access control as formal parts of the spec. The audit log on Contingency and the RBAC thinking are the direct lineage of that CRA experience.\n\nSo it's the same discipline, just a different dataset. At the CRA it was taxpayer information; at Bell it was subscriber data; here it's plan members' retirement savings. In every case the question I'm asking is the same: who's allowed to see and do what, and can we prove after the fact what happened? That instinct is exactly what a regulated benefits domain needs from a BSA.",
    stories: ["Contingency", "CPA / CRA"],
  },
  {
    id: "q33",
    num: 33,
    category: "Domain & Regulatory",
    question: "Why does data integrity matter so much in this business?",
    probe:
      "Claims experience drives renewal pricing — a data error in claims or administration directly affects what an employer pays the following year. Getting the contract right prevents errors compounding across millions of accounts.",
    answer:
      "Because in this business a data error doesn't just create a support ticket — it has a financial consequence that lands on a real customer. The mechanism is the renewal loop: a group's claims experience drives its renewal pricing. So a data error in claims or administration — a claim attributed wrong, an amount off, a member miscoded — directly affects what that employer pays the following year. The data isn't just operational; it's an input to the price.\n\nAnd it compounds. At the contract layer, where I work, an error doesn't stay local. A wrong field in an early API contract propagates downstream through adjudication, administration, and payment, and it can replicate across millions of member accounts before anyone notices. The cost of getting it wrong scales with the system.\n\nThat's the whole argument for the BSA role being foundational here. Getting the contract right up front — the validation, the source-of-truth logic, the failure paths — is what stops a single error from compounding across the book. It's cheaper and safer to be precise at the contract than to reconcile millions of accounts after the fact.",
  },

  // ── 6 · Situational ────────────────────────────────────────────────
  {
    id: "q34",
    num: 34,
    category: "Situational",
    question:
      "A developer comes to you mid-sprint saying a requirement is ambiguous. What do you do?",
    probe:
      "Show you're the source of truth: clarify against the spec and the business intent, decide quickly, and update the AC so the ambiguity is closed for good.",
    answer:
      "This is exactly the moment the BSA role exists for, so I treat it as a feature, not an interruption — the developer coming to me is the system working.\n\nFirst I clarify it against two things: the spec as written, and the business intent behind it. Usually the ambiguity is a case we didn't pin down — an edge case, a precedence question — and the right answer falls out of what the business actually needs the system to do. I make the call quickly, because a developer blocked mid-sprint is a cost; I don't sit on it waiting for a meeting if I can resolve it from the intent.\n\nThen the part that matters most: I update the acceptance criteria so the ambiguity is closed for good. It's not enough to give that one developer a verbal answer — I write the decision back into the AC so the next person who reads the story, or QA reviewing it, gets the resolved version. That way the same question can't resurface, and the spec stays the source of truth instead of my memory being the source of truth.",
  },
  {
    id: "q35",
    num: 35,
    category: "Situational",
    question:
      "An architect says a requirement isn't feasible in the timeline. How do you respond?",
    probe:
      "Treat it as a requirements problem, not a negotiation. Find the 80% of the value at 20% of the complexity and present the trade-off explicitly.",
    answer:
      "I treat that as a requirements problem to solve together, not a negotiation to win. The architect is giving me real information about cost, and my job is to use it to reshape the requirement, not to push back on the estimate.\n\nSo I'd go back into the requirement and look for where the value actually concentrates — the 80% of the value that sits in maybe 20% of the complexity. Usually the part that's blowing the timeline is an edge case or a gold-plated piece that isn't where the real benefit is. I'd work with the architect to separate the must-have core from the expensive tail.\n\nThen I present the trade-off explicitly to the stakeholders — here's the version that fits the timeline and captures most of the value, here's what we're deferring and the consequence of deferring it. I make the decision visible rather than quietly cutting scope or quietly blowing the date. That way the business chooses with full information, the architect's constraint is respected, and we ship something real on time instead of something perfect late.",
  },
  {
    id: "q36",
    num: 36,
    category: "Situational",
    question:
      "Two stakeholder groups want contradictory things and both are escalating. How do you resolve it?",
    probe:
      "Make the prioritisation criteria explicit up front, then resolve it in one room where the trade-off is visible to everyone — not in separate bilateral promises.",
    answer:
      "The trap here is resolving it through separate bilateral promises — telling each group privately what they want to hear — because that just defers the collision and destroys trust when it surfaces. So I do the opposite.\n\nFirst, I make the prioritisation criteria explicit up front: what are we actually optimising for — member impact, regulatory requirement, cost, risk? If everyone agrees on the criteria before we argue about the answer, the disagreement often resolves itself, because we're now measuring against a shared yardstick instead of trading opinions.\n\nThen I get both groups in one room, together, with the trade-off visible to everyone. Not me shuttling between them — the same picture in front of both, so each group sees what the other is asking for and what it costs. The decision gets made out in the open against the agreed criteria.\n\nThat's exactly the pattern I used on Catalog with marketing, product, and billing on the expire-versus-cancel question — separate sessions to understand each, then one room to reconcile, with written sign-off. The Result there was a single agreed definition everyone had committed to in front of each other, which is what makes it stick.",
    stories: ["Catalog"],
  },
  {
    id: "q37",
    num: 37,
    category: "Situational",
    question:
      "You inherit a system with no documentation and a tight deadline. What are your first moves?",
    probe:
      "→ The UPCM pattern: map the existing behaviour, build the domain model / state machine, get stakeholder sign-off, make it the reference.",
    answer:
      "I've literally done this — it's the UPCM pattern — so I'd run the same playbook.\n\nFirst move is to map the existing behaviour rather than trust anyone's description of it. With no docs, the system's real behaviour is the only reliable source of truth, so I trace what it actually does end to end. Second, I turn that into artifacts fast — a domain model in the business's own language, and a state machine for the key transitions, with the trigger events and failure paths. That converts scattered tribal knowledge into something concrete people can react to.\n\nThird, and I don't skip this even under deadline pressure, I get stakeholder sign-off — I take the model back to the groups who touch the system and confirm it's correct. That's what turns my reconstruction into the agreed reference instead of just my interpretation. On UPCM, that sign-off from three groups is what made the model the thing everything else got built against.\n\nThe deadline doesn't change the sequence — it just means I work the highest-risk path first. Mapping reality, modelling it, and getting it ratified is actually the fastest way to stop the team guessing, which is what really eats a tight timeline.",
    stories: ["UPCM"],
  },
  {
    id: "q38",
    num: 38,
    category: "Situational",
    question: "A spec you signed off on caused a production issue. What now?",
    probe:
      "Own it without calculation, fix the immediate issue, then fix the process that let it through. Accountability + systemic fix.",
    answer:
      "Three moves, in order. First, I own it without calculation — it was my spec, so I don't go looking for whose implementation choice technically did it. In the moment, accountability has to be unambiguous, because the priority is fixing the problem, not allocating blame.\n\nSecond, I fix the immediate issue — work with the team to stabilise production, define the correct behaviour, and get the fix out. That's the bleeding-stops step.\n\nThird, and this is the part that actually matters long-term, I fix the process that let it through, not just the incident. I ask how a gap in the spec got past sign-off — was it a class of edge case I don't reliably cover? Then I change how I work so that whole class is designed out. That's exactly what I did after I once signed off AC that left an empty-field case implicit: I didn't just fix that bug, I made failure paths and source-of-truth logic a mandatory part of every AC I write.\n\nSo the answer is accountability plus a systemic fix. A production issue is expensive; the least I can do is convert it into a permanent improvement in how the requirements get written.",
  },

  // ── 7 · Questions for the Panel ────────────────────────────────────
  {
    id: "ask1",
    category: "Questions for the Panel",
    question:
      "What does a typical API integration project look like from a BSA perspective on this team?",
    probe:
      "Shows you're already picturing the day-to-day and where your artifacts fit. Listen for where requirements/data-mapping ownership actually sits.",
    answer:
      "Ask this early in your two-to-three. It signals you're thinking about the actual work, and the answer tells you how much of the requirements/data-mapping ownership genuinely sits with the BSA versus the architects or POs — which is the thing you most need to know.",
  },
  {
    id: "ask2",
    category: "Questions for the Panel",
    question:
      "Where do the most significant stakeholder-alignment challenges usually come from?",
    probe:
      "Lets you connect their answer back to your Catalog multi-stakeholder reconciliation story.",
    answer:
      "Good because their answer gives you an opening to reference how you've handled exactly that — the Catalog expire-vs-cancel reconciliation, separate sessions then one room with written sign-off — without forcing it.",
    stories: ["Catalog"],
  },
  {
    id: "ask3",
    category: "Questions for the Panel",
    question:
      "How mature is the requirements and documentation practice today — what would you want a senior BSA to improve?",
    probe:
      "Positions you as someone who raises the standard (repeatable review, AC discipline), tied to the live transformation.",
    answer:
      "This one positions you as a level-setter. Whatever they say, you can connect it to things you've actually built — the repeatable post-delivery review standard on Catalog, AC discipline, turning undocumented systems into the reference like UPCM. Ties neatly to the transformation they're in the middle of.",
    stories: ["Catalog", "UPCM"],
  },
  {
    id: "ask4",
    category: "Questions for the Panel",
    question: "What does success look like at six months in this role?",
    probe: "Standard but strong — shows you're outcome-oriented and planning to deliver.",
    answer:
      "A safe, strong closer. It shows you're thinking in outcomes and gives you their definition of success to aim at. Pairs well with your '60–90 days to productive' answer from earlier.",
  },
  {
    id: "ask5",
    category: "Questions for the Panel",
    question:
      "How does the API Integration team collaborate with product owners and architects across WB&R?",
    probe:
      "Probes the operating model — where your contract/data-mapping work hands off, and who owns what.",
    answer:
      "Use this to understand the operating model — where your contract and data-mapping work hands off to architects and POs, and where the boundaries are. Their answer tells you how the role really functions day to day.",
  },
  {
    id: "ask6",
    category: "Questions for the Panel",
    question:
      "Julia McGillis joined as EVP in 2025 — how has that shaped the team's priorities?",
    probe:
      "Signals you've done your homework on the org. Use sparingly — only if rapport is good.",
    answer:
      "A homework-signal question — naming the EVP shows you've researched the org and the transformation. Use it only if the rapport is there and time allows; it's a nice-to-have, not one of your core two.",
  },
];
