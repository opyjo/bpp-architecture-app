// ─────────────────────────────────────────────────────────────────────────────
// HOOPP — Senior Technical Business Systems Analyst (DISP) interview prep.
//
// Quick, summarised concepts to master for the technical panel, weighted the way
// the recruiter framed it: SQL (data-flow validation & reconciliation) and data
// modelling go deep; Python and regulated-data handling are lighter. Each concept
// carries an `anchor` — a one-line tie-back to a system already documented in this
// app (Bell subscription platform / go-repo, Kafka events, service deep-dives) so
// abstract answers land on concrete ground.
//
// Everything here is static reference content — no runtime, no persistence.
// ─────────────────────────────────────────────────────────────────────────────

export type ConceptColor =
  | "blue"
  | "purple"
  | "teal"
  | "amber"
  | "green"
  | "coral";

/** A single scannable concept card. */
export interface ConceptCard {
  id: string;
  title: string;
  /** Plain-language summary. `\n` renders as line breaks (whitespace-pre-line). */
  summary: string;
  /** Optional code snippet rendered in a syntax-highlighted CodeBlock. */
  code?: string;
  /** Language for the code block (sql | python | ...). */
  lang?: string;
  /** Optional header shown above the code block. */
  codeComment?: string;
  /** "In your codebase" tie-back — grounds the concept in a real platform piece. */
  anchor?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOPP / DISP FRAMING
// ═══════════════════════════════════════════════════════════════════════════

export const dispFraming: ConceptCard[] = [
  {
    id: "disp-role",
    title: "The role in one sentence",
    summary:
      "You own business-to-technology translation for the Member portal APIs and data flows: turning pension rules, workflows, audit needs, and edge cases into precise API contracts an engineer can build and a QA can test.\n\nYou are the person who catches ambiguity, rule conflicts, data gaps, and downstream impacts BEFORE they reach engineering or production.",
    anchor:
      "Same job you did framing the Add-Subscription flow into field-level contracts — just pension data instead of streaming subscriptions.",
  },
  {
    id: "disp-bff",
    title: "DISP = orchestration / Backend-for-Frontend (BFF)",
    summary:
      "DISP is an abstraction layer between the React member portal and the core pension systems. A BFF exposes APIs shaped for the UI's needs — not raw legacy system contracts.\n\nYour job: make sure the API reflects business intent and user-experience needs, rather than simply leaking legacy system constraints to the front end.",
    anchor:
      "Directly analogous to the GraphQL/aggregator layer in the subscription-manager MFE that fans out to 60+ Go microservices.",
  },
  {
    id: "disp-sync-async",
    title: "Sync vs async vs cached vs workflow-driven",
    summary:
      "Classify every operation and document it explicitly:\n• Synchronous read — member profile, entitlements (fast, live).\n• Cached read — reference/config data, tolerant of slight staleness.\n• Asynchronous / long-running — pension projections, batch calculations.\n• Workflow-driven — beneficiary change, requiring approval steps and reconciliation.\n\nFor each, define the source of truth, freshness expectations, timeout/error states, and what must be reconciled.",
    anchor:
      "Maps to the Kafka event-driven flows + saga orchestration you documented — some reads are live, some are projections off an event stream.",
  },
  {
    id: "disp-sor",
    title: "Source of truth & data lineage",
    summary:
      "Every field on the portal must trace to a system of record. Map end-to-end lineage: core system → DISP proxy → orchestration API → cache/member store → Contentful/front-end config → React UI.\n\nWhen data is cached or projected, name the authoritative source and the reconciliation path back to it. Ambiguous ownership is the #1 source of production defects.",
    anchor:
      "This is the 'Systems of Record' + field-level data-mapping artifact (UI → GraphQL → Go → DB) from the BSA cheatsheet, re-pointed at pension data.",
  },
  {
    id: "disp-trace",
    title: "Traceability: BRD → FDS → ADO → tests → defects",
    summary:
      "Maintain an unbroken chain: business requirement (BRD) → functional spec (FDS) → API requirement → ADO work item → test scenario → defect → release scope.\n\nIf someone asks 'why does this field behave this way?', you can walk it from the pension rule to the acceptance criterion to the passing test. That chain is also your audit and regulatory story.",
    anchor:
      "The requirement → user story → acceptance-criteria → test tracing you already practice; ADO is just the tool of record here.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SQL — CORE (the mechanics you must be fluent in)
// ═══════════════════════════════════════════════════════════════════════════

export const sqlCore: ConceptCard[] = [
  {
    id: "sql-joins",
    title: "Joins — pick the right one deliberately",
    summary:
      "INNER = rows matching in both. LEFT = all left rows + matches (NULLs where none). FULL OUTER = everything from both sides. The join type IS the business rule — a LEFT vs INNER join silently changes which members appear.\n\nAlways state the grain (one row per what?) before you join, or you get fan-out and inflated counts.",
    lang: "sql",
    codeComment: "Members with their (optional) latest pension account",
    code: `SELECT m.member_id,
       m.status,
       pa.account_id,
       pa.balance
FROM   member m
LEFT   JOIN pension_account pa
       ON pa.member_id = m.member_id
      AND pa.is_current = TRUE;   -- keep members even with no account`,
    anchor:
      "The same join discipline behind your UI → GraphQL → Go → DB field maps: one wrong join type = wrong data on the member's dashboard.",
  },
  {
    id: "sql-aggregate",
    title: "Aggregation: GROUP BY + HAVING",
    summary:
      "GROUP BY collapses rows into buckets; aggregate functions (COUNT/SUM/AVG/MIN/MAX) summarise each bucket. WHERE filters rows BEFORE grouping; HAVING filters groups AFTER aggregation.\n\nClassic reconciliation use: totals per employer/plan to compare against another system.",
    lang: "sql",
    codeComment: "Contribution totals per employer, only material ones",
    code: `SELECT employer_id,
       COUNT(*)              AS contribution_rows,
       SUM(amount)           AS total_contributions
FROM   contribution
WHERE  posted_date >= '2026-01-01'   -- filter rows first
GROUP  BY employer_id
HAVING SUM(amount) > 0;              -- then filter groups`,
    anchor:
      "How you'd validate a batch load: per-group totals are the cheapest reconciliation check between a feed and the store.",
  },
  {
    id: "sql-window",
    title: "Window functions — rank, dedup, running totals",
    summary:
      "Window functions compute across a set of rows WITHOUT collapsing them (unlike GROUP BY). ROW_NUMBER()/RANK() for 'latest per group' and de-duplication; LAG()/LEAD() to compare a row to its neighbour; SUM() OVER for running totals.\n\nThe canonical 'keep only the newest record per member' pattern:",
    lang: "sql",
    codeComment: "Latest contribution per member (dedup keeping newest)",
    code: `WITH ranked AS (
  SELECT c.*,
         ROW_NUMBER() OVER (
           PARTITION BY member_id
           ORDER BY posted_date DESC, c.id DESC
         ) AS rn
  FROM   contribution c
)
SELECT * FROM ranked WHERE rn = 1;`,
    anchor:
      "Exactly how a projection/read-model off a Kafka stream picks the current state from an append-only event log.",
  },
  {
    id: "sql-cte",
    title: "CTEs — readable, composable, sometimes recursive",
    summary:
      "A CTE (WITH ...) names a subquery so complex logic reads top-to-bottom instead of nesting inside-out. Chain several to model a data flow step by step. Recursive CTEs walk hierarchies (org charts, plan → sub-plan trees).\n\nFor an interview, reaching for a CTE signals you think in clear, auditable steps — which is the whole job.",
    lang: "sql",
    codeComment: "Recursive walk of an employer → sub-entity hierarchy",
    code: `WITH RECURSIVE org AS (
  SELECT employer_id, parent_id, name, 1 AS depth
  FROM   employer WHERE parent_id IS NULL
  UNION ALL
  SELECT e.employer_id, e.parent_id, e.name, o.depth + 1
  FROM   employer e
  JOIN   org o ON e.parent_id = o.employer_id
)
SELECT * FROM org ORDER BY depth;`,
    anchor:
      "The step-by-step CTE style mirrors how you decompose an orchestration flow (Order → Activation → Saga) into named, testable stages.",
  },
  {
    id: "sql-case",
    title: "CASE — deterministic conditional logic",
    summary:
      "CASE turns a business rule into a computed column: eligibility, suppression, conditional display, fallback values. This is where 'translate complex pension rules into deterministic system behaviour' becomes literal SQL.\n\nBe explicit about the ELSE branch — an unhandled case is an edge case waiting to become a defect.",
    lang: "sql",
    codeComment: "Derive a display-eligibility flag from status + balance",
    code: `SELECT member_id,
       CASE
         WHEN status = 'SUSPENDED'        THEN 'HIDDEN'
         WHEN balance IS NULL             THEN 'PENDING'
         WHEN balance = 0                 THEN 'ZERO_BALANCE'
         ELSE                                  'SHOW'
       END AS projection_display_state
FROM   member m
LEFT   JOIN pension_account pa ON pa.member_id = m.member_id;`,
    anchor:
      "This is your 'field-level suppression / conditional display / fallback' rule set expressed as data, not prose.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SQL — DATA VALIDATION (is the data itself trustworthy?)
// ═══════════════════════════════════════════════════════════════════════════

export const sqlValidation: ConceptCard[] = [
  {
    id: "val-completeness",
    title: "Completeness / NULL checks",
    summary:
      "First question of any data-flow validation: are required fields populated? Count NULLs and blanks on business-critical columns. A field that's mandatory in the requirement but nullable in the data is a gap to raise before build.",
    lang: "sql",
    codeComment: "Required fields missing on active members",
    code: `SELECT
  COUNT(*) FILTER (WHERE sin IS NULL)          AS missing_sin,
  COUNT(*) FILTER (WHERE date_of_birth IS NULL) AS missing_dob,
  COUNT(*) FILTER (WHERE status IS NULL)        AS missing_status
FROM member
WHERE status = 'ACTIVE';`,
    anchor:
      "The pre-design 'data-quality issues / source-system limitations' check you flag before requirements move into build.",
  },
  {
    id: "val-duplicates",
    title: "Duplicate / uniqueness detection",
    summary:
      "A business key that should be unique but isn't breaks reconciliation and inflates totals. Detect with GROUP BY ... HAVING COUNT(*) > 1. Distinguish a true duplicate (same natural key) from legitimate versioned history.",
    lang: "sql",
    codeComment: "Members sharing a SIN (should be unique)",
    code: `SELECT sin, COUNT(*) AS dup_count
FROM   member
WHERE  sin IS NOT NULL
GROUP  BY sin
HAVING COUNT(*) > 1
ORDER  BY dup_count DESC;`,
    anchor:
      "Same integrity concern as a subscription appearing twice after a replayed Kafka event — you validate the key, not just the row.",
  },
  {
    id: "val-referential",
    title: "Referential integrity — orphan rows",
    summary:
      "Every child row should have a valid parent. Find orphans with a LEFT JOIN ... WHERE parent IS NULL (an anti-join). Orphans mean a broken data flow: a load ran out of order, or a delete cascaded incompletely.",
    lang: "sql",
    codeComment: "Beneficiaries pointing at a non-existent member",
    code: `SELECT b.beneficiary_id, b.member_id
FROM   beneficiary b
LEFT   JOIN member m ON m.member_id = b.member_id
WHERE  m.member_id IS NULL;   -- no matching parent = orphan`,
    anchor:
      "The integrity guarantee a foreign key gives you in the JDL domain model — this query proves it held across a real load.",
  },
  {
    id: "val-domain",
    title: "Domain / range / business-rule checks",
    summary:
      "Validate values against allowed domains and sane ranges: status in the permitted set, no negative balances, no future birth dates, effective_date <= end_date. These catch bad transformations and source-system quirks.",
    lang: "sql",
    codeComment: "Rows violating basic business constraints",
    code: `SELECT member_id, status, date_of_birth, balance
FROM   member m
LEFT   JOIN pension_account pa ON pa.member_id = m.member_id
WHERE  status NOT IN ('ACTIVE','DEFERRED','RETIRED','SUSPENDED')
   OR  date_of_birth > CURRENT_DATE
   OR  balance < 0;`,
    anchor:
      "Your 'error conditions & edge cases' acceptance criteria, run as a query instead of read as a doc.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SQL — RECONCILIATION (do two systems agree?)
// ═══════════════════════════════════════════════════════════════════════════

export const sqlReconciliation: ConceptCard[] = [
  {
    id: "rec-antijoin",
    title: "Anti-join — what's in A but missing from B",
    summary:
      "The workhorse of reconciliation. LEFT JOIN the two systems on the business key, keep rows where the other side is NULL. Answers 'which members exist in the core system but never made it into the DISP cache/store?'",
    lang: "sql",
    codeComment: "In core system, missing from DISP member store",
    code: `SELECT c.member_id
FROM   core.member       c
LEFT   JOIN disp.member  d ON d.member_id = c.member_id
WHERE  d.member_id IS NULL;`,
    anchor:
      "Precisely the caching-risk you flag on the BFF: a stale/incomplete read-store silently dropping members from the portal.",
  },
  {
    id: "rec-except",
    title: "EXCEPT / MINUS — set difference",
    summary:
      "EXCEPT (Postgres) / MINUS (Oracle) returns rows in the first query not in the second, comparing WHOLE rows. Great for a fast 'are these two extracts identical?' check. Run it both directions to catch differences on each side.",
    lang: "sql",
    codeComment: "Keys present in source feed but not in target",
    code: `SELECT member_id FROM source_feed
EXCEPT
SELECT member_id FROM target_store;
-- swap the two SELECTs to find target-only keys`,
    anchor:
      "A one-line gate for a migration or nightly feed — the kind of check you'd bake into operational-readiness acceptance.",
  },
  {
    id: "rec-fullouter",
    title: "Full-outer diff — mismatches on both sides at once",
    summary:
      "A FULL OUTER JOIN on the key surfaces three problems in one pass: source-only rows, target-only rows, and rows present in both but with differing values. This is the most complete reconciliation shape.",
    lang: "sql",
    codeComment: "Symmetric reconciliation with a diagnosis column",
    code: `SELECT COALESCE(s.member_id, t.member_id) AS member_id,
       CASE
         WHEN t.member_id IS NULL           THEN 'MISSING_IN_TARGET'
         WHEN s.member_id IS NULL           THEN 'MISSING_IN_SOURCE'
         WHEN s.balance <> t.balance        THEN 'BALANCE_MISMATCH'
         ELSE                                    'OK'
       END AS diff
FROM   source_feed  s
FULL   OUTER JOIN target_store t ON t.member_id = s.member_id
WHERE  t.member_id IS NULL
   OR  s.member_id IS NULL
   OR  s.balance  <> t.balance;`,
    anchor:
      "The reconciliation artifact you'd hand QA to cover 'source-system failure, stale data, cache mismatch' in one test.",
  },
  {
    id: "rec-checksum",
    title: "Count & aggregate checksums",
    summary:
      "Before diffing row-by-row, compare cheap summaries: row counts and per-group SUM/aggregate 'checksums'. If totals match, the systems likely agree; if not, you know where to drill. Fast enough to run continuously as a monitor.",
    lang: "sql",
    codeComment: "Compare totals side by side per employer",
    code: `SELECT s.employer_id,
       s.cnt   AS source_cnt,  t.cnt   AS target_cnt,
       s.total AS source_total, t.total AS target_total
FROM  (SELECT employer_id, COUNT(*) cnt, SUM(amount) total
       FROM source_feed  GROUP BY employer_id) s
FULL  OUTER JOIN
      (SELECT employer_id, COUNT(*) cnt, SUM(amount) total
       FROM target_store GROUP BY employer_id) t
      ON t.employer_id = s.employer_id
WHERE s.cnt <> t.cnt OR s.total <> t.total;`,
    anchor:
      "The lightweight, always-on reconciliation you'd propose for a workflow-driven flow where eventual consistency is expected.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DATA MODELLING
// ═══════════════════════════════════════════════════════════════════════════

export const dmEntities: ConceptCard[] = [
  {
    id: "dm-entity",
    title: "Entities, attributes, keys",
    summary:
      "An entity is a thing the business tracks (Member, Beneficiary, Pension Account). Attributes are its facts. Keys give identity:\n• Primary key — unique identifier of the row.\n• Natural key — a real-world identifier (SIN, member number).\n• Surrogate key — a system-generated id (safer: stable, no PII, no business meaning).\n• Composite key — identity from more than one column together.\n\nPrefer a surrogate PK + a unique constraint on the natural key: stable joins, and you never leak a SIN into URLs or logs.",
    anchor:
      "The entity discipline behind the JDL domain model you documented — member/subscription/account are the same modelling primitives.",
  },
  {
    id: "dm-relationships",
    title: "Relationships & cardinality",
    summary:
      "Cardinality is the business rule about 'how many':\n• 1:1 — a member has one profile.\n• 1:M — a member has many beneficiaries / contributions.\n• M:N — members ↔ plans; resolved with a junction (associative) table holding the two foreign keys.\n\nGetting cardinality wrong is the most common modelling defect — it changes joins, screens, and whether a rule is even expressible.",
    anchor:
      "The M:N 'member ↔ plan' via a junction table is the same shape as subscription ↔ offer mappings in the platform.",
  },
  {
    id: "dm-normal",
    title: "Normalization (1NF→3NF) & when to denormalize",
    summary:
      "Normalize the system of record to remove redundancy and update anomalies:\n• 1NF — atomic values, no repeating groups.\n• 2NF — non-key attributes depend on the WHOLE key.\n• 3NF — no non-key attribute depends on another non-key attribute.\n\nThen deliberately DENORMALIZE the read side (the BFF cache / member store) for fast portal reads. The trade-off — write-side correctness vs read-side speed, and the reconciliation that keeps them honest — is exactly a Technical BSA conversation.",
    anchor:
      "Normalized Go/DB core vs a denormalized read-model for the MFE — the CQRS-style split you already flagged in the cheatsheet.",
  },
];

/** Mermaid ER diagram — member / account / beneficiary / entitlement / contribution. */
export const erDiagramMermaid = `erDiagram
    MEMBER ||--o{ BENEFICIARY : "designates"
    MEMBER ||--|| MEMBER_PROFILE : "has"
    MEMBER ||--o{ PENSION_ACCOUNT : "holds"
    MEMBER }o--o{ PLAN : "enrolled via"
    MEMBER ||--o{ CONTRIBUTION : "makes"
    EMPLOYER ||--o{ CONTRIBUTION : "remits"
    PENSION_ACCOUNT ||--o{ ENTITLEMENT : "grants"

    MEMBER {
        bigint member_id PK "surrogate"
        string member_number UK "natural key"
        string sin UK "PII - encrypted"
        string status "ACTIVE|DEFERRED|RETIRED|SUSPENDED"
        date   date_of_birth
    }
    BENEFICIARY {
        bigint beneficiary_id PK
        bigint member_id FK
        string relationship
        numeric allocation_pct "sum per member = 100"
        string state "DRAFT|PENDING|APPROVED"
    }
    PENSION_ACCOUNT {
        bigint account_id PK
        bigint member_id FK
        numeric balance
        boolean is_current
    }
    ENTITLEMENT {
        bigint entitlement_id PK
        bigint account_id FK
        string type
        boolean is_suppressed "conditional display"
    }
    CONTRIBUTION {
        bigint id PK
        bigint member_id FK
        bigint employer_id FK
        numeric amount
        date   posted_date
    }
    PLAN {
        bigint plan_id PK
        string plan_code UK
    }`;

/** Mermaid state machine — beneficiary-change request lifecycle (audit-sensitive). */
export const stateMachineMermaid = `stateDiagram-v2
    [*] --> Draft : member starts change
    Draft --> Pending : submit
    Draft --> [*] : discard
    Pending --> Approved : reviewer approves
    Pending --> Rejected : fails validation
    Rejected --> Draft : member revises
    Approved --> Active : effective_date reached
    Active --> Superseded : newer change approved
    Superseded --> [*]
    Approved --> [*]

    note right of Pending
      audit-sensitive:
      capture who/when/before/after
    end note`;

export const dmState: ConceptCard[] = [
  {
    id: "dm-state",
    title: "State machines — model the lifecycle explicitly",
    summary:
      "For any entity that moves through stages (beneficiary change, pension application, member status), define the states, the ALLOWED transitions, and the guards on each. An explicit state machine kills a whole class of edge cases: it makes illegal transitions un-representable and tells QA exactly which negative paths to test.\n\nFor each transition ask: who can trigger it, what validates it, what's the audit record, and what's the rollback? The diagram on the right models a beneficiary-change request — a workflow-driven, audit-sensitive flow.",
    anchor:
      "This is the 'state machine' deliverable from the BSA cheatsheet, re-cast onto a pension workflow with approval + audit.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PYTHON (lighter — data validation & reconciliation)
// ═══════════════════════════════════════════════════════════════════════════

export const pythonConcepts: ConceptCard[] = [
  {
    id: "py-structures",
    title: "Core structures & comprehensions",
    summary:
      "Know the four containers and when to reach for each: list (ordered), dict (keyed lookup — your go-to for reconciliation), set (membership/dedup, fast difference), tuple (fixed record). Comprehensions express filter+transform in one readable line.",
    lang: "python",
    code: `members = [
    {"member_id": 1, "status": "ACTIVE",  "balance": 1200.0},
    {"member_id": 2, "status": "SUSPENDED","balance": None},
]

# filter + transform in one line
active_ids = [m["member_id"] for m in members if m["status"] == "ACTIVE"]

# set difference = a reconciliation in one expression
source_ids = {1, 2, 3}
target_ids = {1, 3}
missing_in_target = source_ids - target_ids   # {2}`,
    anchor:
      "The set-difference is the Python twin of the SQL anti-join you'd run against the DISP store.",
  },
  {
    id: "py-validate",
    title: "Assertion-based validation",
    summary:
      "A small, explicit validation function is easy to explain in an interview and mirrors your acceptance criteria. Collect errors rather than failing on the first — you want the full picture of a bad feed, not just its first bad row.",
    lang: "python",
    code: `def validate(member: dict) -> list[str]:
    errors = []
    if not member.get("sin"):
        errors.append("missing SIN")
    if member.get("status") not in {"ACTIVE","DEFERRED","RETIRED","SUSPENDED"}:
        errors.append(f"bad status: {member.get('status')}")
    if (member.get("balance") or 0) < 0:
        errors.append("negative balance")
    return errors

bad = {m["member_id"]: validate(m) for m in members if validate(m)}`,
    anchor:
      "Each rule here is one acceptance criterion — the same rules the SQL validation section checks in-database.",
  },
  {
    id: "py-pandas",
    title: "pandas for reconciliation (the 80% you'll be asked)",
    summary:
      "pandas turns two extracts into a diff in a few lines. merge(..., how='outer', indicator=True) is the DataFrame equivalent of a FULL OUTER JOIN and tags each row with which side it came from. You rarely need more than merge, isnull, duplicated, and groupby.",
    lang: "python",
    code: `import pandas as pd

src = pd.read_csv("source_feed.csv")
tgt = pd.read_csv("target_store.csv")

diff = src.merge(tgt, on="member_id", how="outer",
                 indicator=True, suffixes=("_src", "_tgt"))

# rows not present on both sides
missing = diff[diff["_merge"] != "both"]

# value mismatches among matched rows
both = diff[diff["_merge"] == "both"]
mismatch = both[both["balance_src"] != both["balance_tgt"]]`,
    anchor:
      "Same reconciliation you'd otherwise write as the SQL full-outer diff — good to know both, since a panel may hand you a CSV, not a database.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// REGULATED DATA — AUDITABILITY
// ═══════════════════════════════════════════════════════════════════════════

export const auditConcepts: ConceptCard[] = [
  {
    id: "aud-append",
    title: "Append-only audit log",
    summary:
      "Audit-sensitive changes (beneficiary, banking, status) must be recorded in an immutable, append-only log: never UPDATE or DELETE an audit row. Capture the who / what / when / before / after for every change so the history is reconstructable and tamper-evident.",
    lang: "sql",
    codeComment: "Shape of an audit record — insert-only, never mutated",
    code: `CREATE TABLE beneficiary_audit (
  audit_id     bigint PRIMARY KEY,
  beneficiary_id bigint NOT NULL,
  action       text NOT NULL,          -- CREATE|UPDATE|APPROVE|REJECT
  changed_by   text NOT NULL,          -- actor (never 'system' if a human acted)
  changed_at   timestamptz NOT NULL DEFAULT now(),
  before_state jsonb,                  -- prior values
  after_state  jsonb                   -- new values
);  -- INSERT only; no UPDATE/DELETE grants`,
    anchor:
      "The audit twin of an event-sourced Kafka stream: the log IS the truth, current state is a projection off it.",
  },
  {
    id: "aud-soft",
    title: "Immutability vs soft-delete",
    summary:
      "In regulated systems you rarely hard-delete. Prefer soft-delete (an is_deleted / valid_to flag) or full temporal versioning so history survives and 'as-of' questions are answerable. A hard DELETE destroys the audit trail — call that out as a risk whenever you see it in a design.",
    anchor:
      "A design that hard-deletes a member record is exactly the kind of auditability gap you're paid to catch before build.",
  },
  {
    id: "aud-trace",
    title: "Traceability = audit for requirements",
    summary:
      "Regulatory readiness isn't only runtime logs — it's the requirement chain too. BRD → FDS → API contract → ADO item → test → defect. When an auditor or regulator asks 'prove this pension rule is implemented and tested', you walk that chain. Keep it connected; a broken link is an audit finding.",
    anchor:
      "The same requirement→story→test tracing you already maintain, elevated to a compliance artifact.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// REGULATED DATA — RBAC & PROTECTION
// ═══════════════════════════════════════════════════════════════════════════

export const rbacConcepts: ConceptCard[] = [
  {
    id: "rbac-roles",
    title: "RBAC & least privilege",
    summary:
      "Access is granted to ROLES, not individuals; users get roles. Grant the minimum needed (least privilege). A member sees only their own data; a CSR sees a scoped set; an admin is tightly limited and logged. In API terms this becomes per-endpoint, per-field authorization rules you must specify — including what happens on 'not authorized' (suppress vs error).",
    anchor:
      "The 'entitlements / member status / suppression logic' field rules from the JD are RBAC expressed at field level.",
  },
  {
    id: "rbac-rls",
    title: "Row- & column-level security",
    summary:
      "Row-level security scopes a query to rows the caller may see (a member only ever reads their own member_id). Column-level security / masking hides sensitive columns (show last 3 of SIN) from roles that don't need them. Push these controls down to the data layer where possible — don't rely on the UI to hide what the API still returns.",
    lang: "sql",
    codeComment: "Column masking by role (conceptual)",
    code: `SELECT member_id,
       CASE WHEN current_role_has('VIEW_PII')
            THEN sin
            ELSE 'XXX-XXX-' || RIGHT(sin, 3)   -- masked
       END AS sin
FROM member;`,
    anchor:
      "The 'how member data is secured, validated, audited, and exposed safely' line in the JD, made concrete.",
  },
  {
    id: "rbac-protect",
    title: "PII protection: encryption, masking, minimisation",
    summary:
      "Encrypt sensitive data in transit (TLS) and at rest; tokenize or mask PII (SIN, banking) so it isn't exposed in logs, URLs, or non-prod. Data minimisation: the BFF should return only the fields the screen needs — never pass a full core-system payload to the browser. Segregation of duties / maker-checker on high-risk changes (beneficiary, banking).",
    anchor:
      "Why the BFF matters for privacy: it's the choke point where you strip a legacy payload down to only what the member portal is allowed to see.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PANEL TALKING POINTS
// ═══════════════════════════════════════════════════════════════════════════

export interface TalkingPoint {
  id: string;
  prompt: string;
  approach: string;
}

export const panelPoints: TalkingPoint[] = [
  {
    id: "tp-ambiguity",
    prompt: "How do you handle ambiguity or a missing rule in a requirement?",
    approach:
      "Name the ambiguity explicitly, list the concrete interpretations, show the downstream/data impact of each, then drive to a decision with the Product Owner / SME — and record the decision in the requirement so it's traceable. I'd rather surface it as a question in refinement than let it surface as a defect in QA or an incident in prod.",
  },
  {
    id: "tp-challenge",
    prompt: "Tell me about challenging a technical design.",
    approach:
      "I challenge through clarity and evidence, not authority. I frame the risk in business terms — 'this design hard-deletes, which breaks our audit story' or 'this cache TTL risks showing a member stale entitlement data' — and offer the alternative and its trade-off. The goal is a better, auditable design, not winning the argument.",
  },
  {
    id: "tp-risk",
    prompt: "How do you surface integration / data risk early?",
    approach:
      "I profile the actual data before build (completeness, duplicates, orphans, domains), map source-of-truth and lineage for each field, and pressure-test the failure paths — source-system down, stale cache, retries, eventual consistency. Latency and caching risks get named in the requirement with expected behaviour, so QA has a negative path to test and Ops has an acceptance criterion.",
  },
  {
    id: "tp-translate",
    prompt: "How do you translate a complex business rule for engineers?",
    approach:
      "I make it deterministic: a decision table or state machine with every branch (including the ELSE / illegal-transition case), tied to field-level inputs and outputs, and to testable acceptance criteria. If I can express it as a CASE statement or a state diagram, engineers and QA can both validate it — and there's no room for two people to read the rule differently.",
  },
  {
    id: "tp-sync",
    prompt: "Sync vs async / orchestrated — how do you decide and document?",
    approach:
      "It follows the business tolerance for latency and consistency. Live reads (profile, entitlements) stay synchronous; expensive or long-running work (projections, batch calcs) goes async with a status contract; multi-step, approval-bearing changes are workflow-driven with reconciliation. For each I document source of truth, freshness expectation, timeout/error state, and what must be reconciled.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PRACTICE PLATFORMS
// ═══════════════════════════════════════════════════════════════════════════

export interface PracticePlatform {
  name: string;
  url: string;
  focus: ConceptColor;
  focusLabel: string;
  use: string;
  free: string;
}

export const practicePlatforms: PracticePlatform[] = [
  {
    name: "StrataScratch",
    url: "https://www.stratascratch.com/",
    focus: "blue",
    focusLabel: "SQL",
    use: "Real interview SQL questions from data roles. Best for the joins / window-function / aggregation muscle you'll be tested on.",
    free: "Free tier + paid",
  },
  {
    name: "DataLemur",
    url: "https://datalemur.com/",
    focus: "blue",
    focusLabel: "SQL",
    use: "SQL interview questions graded by difficulty, with clear explanations. Great for window functions and 'find the anomaly' style problems.",
    free: "Mostly free",
  },
  {
    name: "SQLZoo",
    url: "https://sqlzoo.net/",
    focus: "blue",
    focusLabel: "SQL",
    use: "Guided, in-browser SQL from basics to self-joins. Fastest way to warm up fundamentals with zero setup.",
    free: "Free",
  },
  {
    name: "HackerRank — SQL",
    url: "https://www.hackerrank.com/domains/sql",
    focus: "blue",
    focusLabel: "SQL",
    use: "Structured SQL track (Basic → Advanced Join → Aggregation). Good breadth in one place; certificate option.",
    free: "Free",
  },
  {
    name: "DB Fiddle / SQL Fiddle",
    url: "https://www.db-fiddle.com/",
    focus: "teal",
    focusLabel: "Modelling",
    use: "Spin up a schema (Postgres/MySQL), seed rows, and test your OWN reconciliation queries. Practise designing tables + writing the anti-join / full-outer diff live.",
    free: "Free",
  },
  {
    name: "dbdiagram.io",
    url: "https://dbdiagram.io/",
    focus: "teal",
    focusLabel: "Modelling",
    use: "Sketch ER diagrams fast (entities, keys, cardinality). Rehearse modelling a member/beneficiary/account schema out loud.",
    free: "Free",
  },
  {
    name: "HackerRank — Python",
    url: "https://www.hackerrank.com/domains/python",
    focus: "amber",
    focusLabel: "Python",
    use: "Light Python drills — data structures, comprehensions, basic file/CSV handling. Enough for the 'lighter' Python bar.",
    free: "Free",
  },
  {
    name: "Kaggle — pandas",
    url: "https://www.kaggle.com/learn/pandas",
    focus: "amber",
    focusLabel: "Python",
    use: "Short, hands-on pandas micro-course (merge/groupby/filter) — exactly the reconciliation toolkit, in a browser notebook.",
    free: "Free",
  },
];

/** Suggested study order — shown as an ordered checklist. */
export const studyOrder: string[] = [
  "Warm up SQL fundamentals on SQLZoo (joins, GROUP BY) — 1 short session.",
  "Drill window functions + 'find the anomaly' problems on DataLemur / StrataScratch — this is the heaviest test area.",
  "On DB Fiddle, hand-build a 3-table pension schema and write the anti-join, full-outer diff, and checksum reconciliation yourself.",
  "Sketch the member/beneficiary/account ER model on dbdiagram.io and narrate cardinality + keys aloud.",
  "Rehearse the beneficiary-change state machine — states, guards, audit record per transition.",
  "One light pandas pass on Kaggle (merge/groupby) so you can reconcile a CSV if handed one.",
  "Read the Regulated-data and Panel talking-point cards last — they're recall, not practice.",
];
