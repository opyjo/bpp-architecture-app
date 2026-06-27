// ─────────────────────────────────────────────────────────────────────────────
// STAR stories rebuilt as *mental models*.
//
// A teleprompter script is hard to follow live — too many words to track while
// speaking. A mental model is the opposite: one fallback "spine" sentence you can
// fall back on if you blank, plus a handful of *named, emotional beats* (STAKES →
// MESS → THE CONFLICT → THE MOVE → LANDED). Each beat is a punchy hook word and a
// one-line "what you say" prompt that you improvise aloud — you remember the shape
// of the story, not the sentences.
//
// `key` matches the story tags on questions in `mock-interview.ts` (the `stories`
// field) so both the Mock Interview tab and the Teleprompter can look a model up.
//
// EDIT FREELY: the wording here is meant to be tuned by hand. Keep beats to 4–6,
// hooks short and vivid, and mark the single pivotal beat with `crux: true`.
// ─────────────────────────────────────────────────────────────────────────────

export interface StarBeat {
  /** Punchy label for the beat, e.g. "STAKES", "THE CONFLICT". */
  hook: string;
  /** One-line "what you say" prompt — improvised aloud, not read verbatim. */
  say: string;
  /** Marks the single pivotal beat (rendered with a ⭐ and a stronger accent). */
  crux?: boolean;
}

export interface StarMentalModel {
  /** Matches a `stories` tag in mock-interview.ts, e.g. "Catalog". */
  key: string;
  /** Short display title, e.g. "Catalog — expire vs cancel". */
  title: string;
  /** Fallback sentence to say if you blank — the whole story in one breath. */
  spine: string;
  /** 4–6 named beats, in telling order. */
  beats: StarBeat[];
}

export const STAR_MENTAL_MODELS: StarMentalModel[] = [
  {
    key: "Catalog",
    title: "Catalog — expire vs cancel",
    spine:
      "Three teams understood the promotion rules differently and nothing was written down — I got them in a room, exposed the billing dependency, and turned a verbal mess into a signed rules doc the devs built against.",
    beats: [
      {
        hook: "STAKES",
        say: "Catalog is master data — errors flow straight into pricing and billing.",
      },
      {
        hook: "MESS",
        say: "Promotion eligibility rules were undocumented; marketing, product, and billing each understood them differently.",
      },
      {
        hook: "THE CONFLICT",
        say: "Expire vs. cancel. Marketing treated them as interchangeable; billing had a hard dependency on which one.",
        crux: true,
      },
      {
        hook: "THE MOVE",
        say: "Separate sessions, then I mapped the downstream impact of each and put it in front of all three together. Once they saw the billing dependency laid out, alignment came fast.",
      },
      {
        hook: "LANDED",
        say: "Formal rules doc, written sign-off from all three, devs built directly against it. → Zero requirement-driven defects; it became the template.",
      },
    ],
  },

  {
    key: "Contingency",
    title: "Contingency — back-office tool & audit log",
    spine:
      "The agent lookup process was manual and untraceable — before any code I specified the contract, the state machine, the data mapping, and an audit log nobody asked for; that audit log has since cracked two internal investigations.",
    beats: [
      {
        hook: "STAKES",
        say: "Back-office tool agents use to look up subscribers and orders — the process was manual, scattered, and left no record of what was checked or changed.",
      },
      {
        hook: "WHAT I BUILT",
        say: "Before any development: the API contract, a state machine for order-status transitions, and a field-level data-mapping doc — agent views → REST endpoints → DB schema.",
      },
      {
        hook: "THE EXTRA MILE",
        say: "I specified an audit log as a formal requirement — every consequential action recorded, who did it and when. Nobody asked for it as a headline feature.",
        crux: true,
      },
      {
        hook: "LANDED",
        say: "Devs built directly against the specs. → The audit log has since been used in two separate internal investigations — the business could reconstruct exactly what happened.",
      },
    ],
  },

  {
    key: "UPCM",
    title: "UPCM — undocumented export pipeline",
    spine:
      "A live export pipeline was running in production with zero documentation — I mapped what it actually did, modelled it, and got three groups to sign off, turning tribal knowledge into the contract everything was built against.",
    beats: [
      {
        hook: "STAKES",
        say: "A production export pipeline with no spec, no domain model — just behaviour in the code and knowledge in a few people's heads.",
      },
      {
        hook: "TRUST THE SYSTEM",
        say: "I stopped relying on anyone's description and mapped the actual behaviour end to end — with no docs, the system itself is the only reliable source of truth.",
        crux: true,
      },
      {
        hook: "MODELLED IT",
        say: "Turned it into two artifacts: a domain model in the business's own language, and a state machine — READY_TO_EXPORT → EXPORTED / FAILED / CANCELLED, with triggers and error rules explicit.",
      },
      {
        hook: "RATIFIED",
        say: "Took it back to the three groups who touched the pipeline and got written sign-off that this is the real model.",
      },
      {
        hook: "LANDED",
        say: "→ My reconstruction became the reference for every later change. Undocumented behaviour became the contract.",
      },
    ],
  },

  {
    key: "Monorepo",
    title: "Monorepo — 17 projects, one shared package",
    spine:
      "Seventeen projects depended on a shared package that needed updating — instead of treating them as a flat list I mapped the dependency chain, sequenced the upstream update first, and communicated it before anyone hit the collision.",
    beats: [
      {
        hook: "STAKES",
        say: "A monorepo of ~17 concurrent projects, and a shared upstream package needed updating — every downstream product depended on it, no single team owned the fallout.",
      },
      {
        hook: "THE RISK",
        say: "Teams building in parallel would collide when the shared package changed underneath them.",
      },
      {
        hook: "THE MOVE",
        say: "I mapped the dependency chain — who consumed the package, what breaks and in what order — which made the real priority obvious: the upstream update goes first.",
        crux: true,
      },
      {
        hook: "COMMUNICATE AHEAD",
        say: "Laid out the sequencing — this first, here's why, here's when your piece can safely land — before anyone hit a problem.",
      },
      {
        hook: "LANDED",
        say: "→ Shared package updated, all 17 projects stayed unblocked, nobody felt a slowdown.",
      },
    ],
  },

  {
    key: "Bilingual routing",
    title: "Bilingual routing — caught before the sprint",
    spine:
      "A bilingual feature was scoped as a simple build, but I spotted that the routing depended on language and the upstream service didn't carry it — I flagged it in grooming before the sprint, so we built it right instead of shipping a French-language break.",
    beats: [
      {
        hook: "STAKES",
        say: "A bilingual feature the team had scoped as a straightforward build.",
      },
      {
        hook: "THE CATCH",
        say: "Walking the requirements, I saw the routing logic depended on the user's language — and the upstream service the team planned to call didn't carry that context the way they assumed.",
        crux: true,
      },
      {
        hook: "THE COST",
        say: "As scoped, French-language users would hit a broken path — found in testing at best, production at worst. In a regulated bilingual market that's a compliance miss, not just a bug.",
      },
      {
        hook: "SURFACED EARLY",
        say: "Flagged it in grooming before story points were committed — showed where the context got dropped, got the dependency added to scope.",
      },
      {
        hook: "LANDED",
        say: "→ The dependency became part of the requirement up front, the team built it right the first time, no bilingual defect reached customers.",
      },
    ],
  },

  {
    key: "Performance / a11y audit",
    title: "Performance & a11y audit — owned it unasked",
    spine:
      "Nobody asked me to — the product felt slow and the accessibility was off, so I ran an audit on my own time, turned it into a prioritized fix plan, and got the high-impact items scheduled and measured.",
    beats: [
      {
        hook: "NOTICED",
        say: "The product felt slow and some accessibility was wrong — and it bothered me enough to run an audit on my own time. Nobody asked.",
        crux: true,
      },
      {
        hook: "EVIDENCE, NOT OPINION",
        say: "Measured the real numbers — Core Web Vitals, load, layout shift — and went through the a11y gaps: keyboard nav, contrast, the things that lock people out.",
      },
      {
        hook: "MADE IT ACTIONABLE",
        say: "Turned it into a prioritized fix doc, ordered by user impact vs effort — a plan, not a wall of problems.",
      },
      {
        hook: "RAISED IT RIGHT",
        say: "Brought it to the PM and team with a solution in hand. When the call was to defer perf work, I raised it privately, evidence first — '80% of the value at 20% of the cost,' not 'you're wrong.'",
      },
      {
        hook: "LANDED",
        say: "→ High-impact items got scheduled, and I measured the improvement afterward — better load and stability numbers, a11y gaps closed.",
      },
    ],
  },

  {
    key: "Membership",
    title: "Membership — OpenAPI as the source of truth",
    spine:
      "On Membership the OpenAPI spec was the contract and the single source of truth — I generated the front-end types straight from it, so any drift is a compile error, not a runtime surprise a member hits.",
    beats: [
      {
        hook: "STAKES",
        say: "Membership Management — the API contract is what front-end and back-end both build on. Silent drift between them becomes runtime bugs hitting members.",
      },
      {
        hook: "SPEC FIRST",
        say: "I worked OpenAPI-first — the YAML spec as the single source of truth: every endpoint, schema, type, required-vs-optional, error response, defined up front.",
      },
      {
        hook: "WIRE THE TOOLCHAIN",
        say: "Generated the TypeScript types straight from the spec with openapi-typescript — the front-end consumes types derived from the contract itself.",
        crux: true,
      },
      {
        hook: "LANDED",
        say: "→ Spec and code can't silently drift. Rename a field or change a type and it's a compile error immediately, not a customer-facing surprise later.",
      },
    ],
  },

  {
    key: "CPA / CRA",
    title: "CPA / CRA — regulation as a design constraint",
    spine:
      "I'm a CPA who handled Protected B data at the CRA, so I read financial regulation as a design constraint, not a checkbox — I bake audit trails and access control into the contract, which is how the Contingency audit log ended up cracking real investigations.",
    beats: [
      {
        hook: "THE STAKES",
        say: "Here the data is plan members' retirement savings — an error or a leak isn't a ticket, it's a financial and compliance consequence.",
      },
      {
        hook: "THE BACKGROUND",
        say: "CPA, plus banking and the CRA handling Protected B data under security clearance — the Reliability Status process is familiar ground.",
      },
      {
        hook: "THE EDGE",
        say: "I read regulation as something that shapes the contract — audit trails, RBAC, data minimization as formal requirements, not bolt-ons at the end.",
        crux: true,
      },
      {
        hook: "LANDED",
        say: "→ Tighter contracts than someone just told to 'be compliant.' Same instinct everywhere: who can see and do what, and can we prove what happened? — e.g. the Contingency audit log, used in two investigations.",
      },
    ],
  },
];

const BY_KEY: Record<string, StarMentalModel> = Object.fromEntries(
  STAR_MENTAL_MODELS.map((m) => [m.key, m])
);

/** Look up a mental model by story key (e.g. a mock-interview `stories` tag). */
export function getMentalModel(key: string | undefined): StarMentalModel | undefined {
  return key ? BY_KEY[key] : undefined;
}
