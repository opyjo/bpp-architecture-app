# HOOPP Interview Mental Model
## Senior Technical Business Systems Analyst — Pension Application Development (PAD) / Digital Services Platform (DISP)

> **How to use this document:** Read Part 1 every day. Drill one section of Parts 2–5 per day on rotation. Recite Part 6 out loud. The goal is that by interview day, every section header triggers instant recall of what's under it — that's the mental model.

---

# PART 1 — THE CORE (read daily, memorize cold)

## 1.1 Your identity in one sentence

> **"I own business-to-technology translation for member portal APIs and data flows — I turn pension rules, workflows, audit needs, and edge cases into precise API contracts an engineer can build and QA can test, and I catch ambiguity, rule conflicts, and data gaps BEFORE they reach engineering or production."**

This is the job description compressed into one sentence. Everything else in this document hangs off it.

## 1.2 The platform in one picture

DISP is an **orchestration / Backend-for-Frontend (BFF)** layer. Memorize this chain — it is the data lineage you'll be asked to reason over:

```text
┌──────────────┐   ┌──────────────┐   ┌───────────────┐   ┌──────────────┐   ┌────────────┐   ┌──────────┐
│ Core pension │ → │ DISP proxy   │ → │ Orchestration │ → │ Cache /      │ → │ Contentful │ → │  React   │
│ systems      │   │ services     │   │ / BFF APIs    │   │ member store │   │ FE config  │   │  portal  │
└──────────────┘   └──────────────┘   └───────────────┘   └──────────────┘   └────────────┘   └──────────┘
   (source of         (anti-              (business-          (fast reads,       (display        (member
    truth)            corruption)          shaped APIs)        needs recon)       rules)          UX)
```

**The BFF's purpose:** expose APIs shaped for the UI's needs and business intent — never simply leak legacy system constraints to the front end. It is also the privacy choke point: it strips a legacy payload down to only what the member portal is allowed to see.

## 1.3 The five anchors — your Bell experience mapped to HOOPP

You are not learning a new job. You are re-pointing a job you already did. Memorize this table:

| # | You did at Bell | It maps to at HOOPP |
|---|---|---|
| 1 | Next.js BFF + AppSync/aggregator over 60+ Go microservices | DISP orchestration/BFF APIs over core pension systems |
| 2 | Field-level mappings: UI → GraphQL → Go field → DB column | Pension data lineage: core system → DISP → React portal |
| 3 | Kafka events + saga orchestration (flow-runner, DLQ, compensation) | Async & workflow-driven operations with reconciliation |
| 4 | audit-api logging on every subscription transaction | Audit-sensitive pension transactions (beneficiary, banking, status) |
| 5 | Subscription qualification/eligibility rules per merchant | Pension entitlement / eligibility / suppression rules per member |

**The one deliberate difference to name:** a pension plan carries a heavier audit, privacy, and regulatory posture than telecom — member trust is the product. Lead with that awareness; it shows domain judgment.

## 1.4 Facts to recall cold

- **HOOPP** = Healthcare of Ontario Pension Plan — a **defined-benefit (DB)** plan for Ontario healthcare workers. DB = the *benefit* is guaranteed by formula (earnings × service), not the contributions. Members' retirement security depends on data being right.
- **Your numbers:** 60+ Go microservices · 9+ OpenAPI spec reviews · 14+ Kafka event types documented · 5 merchant adapters behind one interface · field-level mappings across UI/GraphQL/Go/DB · Given-When-Then acceptance criteria as the standard artifact.
- **The panel's tooling world:** ADO (Azure DevOps) work items, BRD → FDS documentation flow, Contentful for front-end config, React portal.
- **Member lifecycle states:** `ACTIVE | DEFERRED | RETIRED | SUSPENDED`.

## 1.5 Why HOOPP — your 30-second story (memorize like the identity sentence)

> **"I've spent my career making subscription platforms reliable for millions of Bell customers — but a streaming subscription being wrong costs someone a movie night. At HOOPP, the same craft — API contracts, data lineage, edge cases, auditability — protects someone's retirement. These are Ontario's healthcare workers, the people who took care of us; getting their pension data deterministically right is the most meaningful version of the work I already do, and DISP is exactly the kind of orchestration layer I know how to make trustworthy."**

Adjust the wording until it sounds like you — but keep the shape: *same craft → higher stakes → their mission → this platform specifically.* Mission-driven organizations probe motivation; this cannot be improvised well.

---

# PART 2 — THE SIX PILLARS (one per day, rotate)

## Pillar 1 — API contract ownership

A contract you own is **complete** when it specifies all eight of these. Recite the list:

1. **Inputs & outputs** — every payload field, typed
2. **Validation rules** — per field, with the rejection behaviour
3. **Transformations** — source value → displayed value, explicitly
4. **Source-of-truth logic** — which system wins for each field
5. **Error conditions** — timeouts, source-system failure, partial data
6. **Edge cases** — the ELSE branch of every rule; illegal states
7. **Sync/async/cache classification** — with freshness expectations
8. **Acceptance criteria** — testable, Given-When-Then, covering the negative paths

**Mantra:** *an unhandled ELSE is a defect waiting for a member to find it.*

## Pillar 2 — Operation classification (sync / cached / async / workflow-driven)

Every operation on the portal gets classified. The decision follows **business tolerance for latency and consistency**, never engineering convenience:

| Class | Pension example | Must document |
|---|---|---|
| **Synchronous read** | Member profile, entitlements | Latency budget, failure fallback |
| **Cached read** | Reference/config data | Source of truth, TTL/freshness, staleness risk |
| **Async / long-running** | Pension projections, batch calcs | Status contract, timeout, retry behaviour |
| **Workflow-driven** | Beneficiary change (approval steps) | State machine, audit record per step, reconciliation |

For **every** class, the same four questions: *source of truth? freshness expectation? timeout/error state? what must be reconciled?*

## Pillar 3 — Data lineage & source of truth

- Every field on the portal **traces to a system of record**. No exceptions.
- When data is cached or projected, name the **authoritative source** and the **reconciliation path** back to it.
- **Ambiguous ownership is the #1 source of production defects** — two systems both "owning" a field is a rule conflict you surface before build.
- Walk the chain from Part 1.2 for any field on demand: *core system → proxy → orchestration API → cache → Contentful → React component.*

## Pillar 4 — Field-level rules made deterministic

The JD's phrase "translate complex pension rules into deterministic system behaviour" means: **if two people can read the rule differently, you haven't finished writing it.** Your three tools:

1. **Decision table** — every input combination has exactly one output, including the ELSE row
2. **State machine** — states, *allowed* transitions, guards; illegal transitions become un-representable
3. **CASE expression** — the rule as data, runnable and testable

The rule families to expect: **entitlements, member status, eligibility, suppression logic, conditional display, fallback behaviour, timeout/error states, audit-sensitive transactions.**

## Pillar 5 — The traceability chain

```text
BRD → FDS → API requirement → ADO work item → test scenario → defect → release scope → operational acceptance
```

- This chain is your **audit and regulatory story**: "prove this pension rule is implemented and tested" = walk the chain.
- A broken link is an audit finding. Keeping it connected is part of the job, not admin overhead.
- Every requirement you write should let someone ask *"why does this field behave this way?"* and get walked from pension rule → acceptance criterion → passing test.

## Pillar 6 — Regulated-data posture

Six habits of high-trust systems. Recite them:

1. **Append-only audit log** — who / what / when / before / after; INSERT-only, never UPDATE/DELETE an audit row. (Twin of an event-sourced Kafka stream: the log IS the truth; current state is a projection.)
2. **No hard deletes** — soft-delete or temporal versioning; a hard DELETE destroys the audit trail. Call it out in any design that has one.
3. **RBAC + least privilege** — access to roles, not people. Member sees own data; CSR sees a scoped set; admin is tightly limited and logged.
4. **Row & column security** — row-level: a member only reads their own `member_id`. Column-level: mask the SIN (`XXX-XXX-123`) for roles without need. Push controls to the data layer — never rely on the UI to hide what the API still returns.
5. **PII protection** — encrypt in transit and at rest; no PII in URLs or logs; **data minimisation**: the BFF returns only what the screen needs.
6. **Maker-checker** — segregation of duties on high-risk changes (beneficiary, banking): one actor submits, a different actor approves; both audited.

## The API design vocabulary (runtime companion to the pillars)

Five concepts that come up whenever write operations and contract changes are discussed:

1. **Idempotency** — a member double-clicking "submit" on a beneficiary change must not create two requests. Writes carry an idempotency key; the contract states what a retry returns (the original result, not a duplicate). Specify this for every write and every workflow submission.
2. **API versioning** — additive changes (new optional fields) are safe; renames, removals, and semantic changes are breaking. Know the vocabulary: version strategy, deprecation window, consumer notice. "How does a contract change roll out without breaking the portal?" is a question you should be able to answer structurally.
3. **Correlation IDs** — one ID stamped at the BFF and carried through orchestration → proxies → core systems, so a member action can be traced end-to-end in logs. This is the **runtime twin of the traceability chain** (Pillar 5): one traces requirements, the other traces requests. Both serve audit and support.
4. **Error contract** — one consistent error envelope across all DISP APIs: a member-safe message, an internal code, and the correlation ID. Never leak core-system errors (or PII) to the browser.
5. **Non-functional criteria** — latency budgets per operation class, availability expectations, and throughput assumptions are written as acceptance criteria, not left implicit. The JD's "non-functional considerations" bullet means exactly this.

---

# PART 3 — SQL MUSCLE MEMORY (heaviest test area — drill most)

Three tiers: **core mechanics → validation → reconciliation**. Write each pattern from memory on paper; don't just re-read it.

## 3.1 Core mechanics

**Joins — the join type IS the business rule.** State the grain (one row per *what*?) before joining, or you get fan-out and inflated counts.

```sql
-- Members with their (optional) current account: LEFT keeps members with none
SELECT m.member_id, m.status, pa.balance
FROM   member m
LEFT   JOIN pension_account pa
       ON pa.member_id = m.member_id AND pa.is_current = TRUE;
```

**Aggregation — WHERE filters rows before grouping; HAVING filters groups after.**

```sql
SELECT employer_id, COUNT(*) AS rows, SUM(amount) AS total
FROM   contribution
WHERE  posted_date >= '2026-01-01'
GROUP  BY employer_id
HAVING SUM(amount) > 0;
```

**Window functions — compute across rows *without* collapsing them.** The canonical "latest per member":

```sql
WITH ranked AS (
  SELECT c.*, ROW_NUMBER() OVER (
    PARTITION BY member_id ORDER BY posted_date DESC, id DESC) AS rn
  FROM contribution c)
SELECT * FROM ranked WHERE rn = 1;
```

**CTEs — name the steps so logic reads top-to-bottom.** Reaching for a CTE signals you think in clear, auditable steps. Recursive CTEs walk hierarchies (employer → sub-entities).

**CASE — the business rule as a computed column.** Always write the ELSE:

```sql
CASE WHEN status = 'SUSPENDED' THEN 'HIDDEN'
     WHEN balance IS NULL      THEN 'PENDING'
     WHEN balance = 0          THEN 'ZERO_BALANCE'
     ELSE                           'SHOW'
END AS projection_display_state
```

## 3.2 Validation — is the data itself trustworthy?

Four checks, in order. This is the "identify data-quality issues before build" bullet of the JD, as queries:

| Check | Pattern |
|---|---|
| **Completeness** | `COUNT(*) FILTER (WHERE sin IS NULL)` on business-critical columns |
| **Duplicates** | `GROUP BY natural_key HAVING COUNT(*) > 1` |
| **Orphans** | `LEFT JOIN parent ... WHERE parent.id IS NULL` (anti-join) |
| **Domain/range** | `status NOT IN (...)`, `date_of_birth > CURRENT_DATE`, `balance < 0` |

## 3.3 Reconciliation — do two systems agree?

The DISP cache vs core system question. Four patterns from cheapest to most complete:

1. **Checksums first** — compare `COUNT(*)` and per-group `SUM()` side by side; if totals match, systems likely agree; if not, you know where to drill.
2. **Anti-join** — what's in A but missing from B:
```sql
SELECT c.member_id FROM core.member c
LEFT JOIN disp.member d ON d.member_id = c.member_id
WHERE d.member_id IS NULL;
```
3. **EXCEPT** — whole-row set difference; run both directions.
4. **Full-outer diff** — the most complete shape; three problems in one pass:
```sql
SELECT COALESCE(s.member_id, t.member_id) AS member_id,
       CASE WHEN t.member_id IS NULL    THEN 'MISSING_IN_TARGET'
            WHEN s.member_id IS NULL    THEN 'MISSING_IN_SOURCE'
            WHEN s.balance <> t.balance THEN 'BALANCE_MISMATCH'
            ELSE 'OK' END AS diff
FROM source_feed s
FULL OUTER JOIN target_store t ON t.member_id = s.member_id
WHERE t.member_id IS NULL OR s.member_id IS NULL OR s.balance <> t.balance;
```

---

# PART 4 — PYTHON & DATA MODELLING

## 4.1 Python (lighter bar — three moves cover it)

**1. Set difference = a reconciliation in one expression** (the Python twin of the anti-join):
```python
missing_in_target = source_ids - target_ids
```

**2. Validation function that collects errors** (don't fail on the first — you want the full picture of a bad feed):
```python
def validate(member: dict) -> list[str]:
    errors = []
    if not member.get("sin"): errors.append("missing SIN")
    if member.get("status") not in {"ACTIVE","DEFERRED","RETIRED","SUSPENDED"}:
        errors.append(f"bad status: {member.get('status')}")
    if (member.get("balance") or 0) < 0: errors.append("negative balance")
    return errors
```

**3. pandas outer merge with indicator** — the DataFrame FULL OUTER JOIN, for when the panel hands you a CSV, not a database:
```python
diff = src.merge(tgt, on="member_id", how="outer",
                 indicator=True, suffixes=("_src", "_tgt"))
missing  = diff[diff["_merge"] != "both"]
mismatch = diff[(diff["_merge"] == "both") &
                (diff["balance_src"] != diff["balance_tgt"])]
```

## 4.2 Data modelling — the pension domain schema (sketch from memory)

**Entities:** MEMBER — MEMBER_PROFILE (1:1) — BENEFICIARY (1:M) — PENSION_ACCOUNT (1:M) — ENTITLEMENT (per account) — CONTRIBUTION (member + employer FKs) — PLAN (M:N with member, via junction table) — EMPLOYER.

**Key discipline:**
- **Surrogate PK + unique constraint on the natural key** (member_number, SIN). Never a SIN as PK — stable joins, and no PII leaks into URLs or logs.
- **Cardinality is the business rule about "how many"** — getting it wrong is the most common modelling defect; it changes joins, screens, and whether a rule is even expressible. M:N always resolves through a junction table.
- **Normalize the system of record (to 3NF); deliberately denormalize the read side** (the DISP cache) for fast portal reads. Name the trade-off — write-side correctness vs read-side speed — and the reconciliation that keeps them honest. This is the CQRS split you ran at Bell.
- **Pension data is effective-dated.** Rules and records apply *as of* a date (`effective_from` / `effective_to`), and corrections are retroactive events — a new row, never an overwrite of history. Every "what was the member's status on date X?" question depends on this; it shapes both the schema and the API contract (an as-of parameter on reads).

## 4.3 The beneficiary-change state machine (draw from memory)

The exemplar of a **workflow-driven, audit-sensitive** flow:

```text
Draft ──submit──▶ Pending ──approve──▶ Approved ──effective_date──▶ Active
  ▲                  │                                                │
  └────revise────  Rejected                          newer change ──▶ Superseded
```

For **every transition**, four questions: *who can trigger it? what validates it? what's the audit record? what's the rollback?* Illegal transitions are un-representable; each legal one writes who/when/before/after to the append-only log. Sum of `allocation_pct` per member = 100 — a domain rule that belongs in validation, not prose.

## 4.4 Pension vocabulary — ten terms to own

You don't need actuarial depth. You need to not blink when the panel uses these, and to use two or three of them naturally yourself:

| Term | What it means |
|---|---|
| **Defined-benefit (DB) plan** | The *benefit* is guaranteed by formula (earnings × years of service), regardless of investment returns. The plan bears the risk, not the member — which is why data correctness is existential. |
| **Vesting** | The point at which the member's right to a pension is locked in, even if they leave. |
| **Deferred member** | Left their employer but left the pension in the plan; not yet collecting. (One of the four lifecycle states.) |
| **Commuted value** | The lump-sum present value of a future pension — paid out on some terminations. Calculation- and audit-heavy; assumptions matter. |
| **Bridge benefit** | An extra amount paid from early retirement until age 65, bridging until CPP starts. |
| **Survivor / spousal benefits** | Payments to a spouse or beneficiaries after the member's death; spousal rights and consent rules constrain beneficiary designations — a rule set living right inside "your" beneficiary-change flow. |
| **Buyback (purchase of service)** | A member buys past service (e.g., a leave) to increase their pension — a multi-step, quote-then-decide, deadline-bound workflow. A natural "workflow-driven operation" example. |
| **YMPE** | Year's Maximum Pensionable Earnings — the CPP earnings ceiling many pension formulas reference; it changes every year, so it's effective-dated reference data. |
| **Annual pension statement** | The yearly statement of accrued benefit sent to every member — a heavyweight data-lineage and accuracy artifact; errors here become member calls and regulatory attention. |
| **Effective dating** | Everything above applies *as of* a date; corrections are retroactive events, never overwrites (see 4.2). |

---

# PART 5 — POSITIONS TO HOLD (your professional stances)

These are not scripts — they are the *positions* you defend when the conversation goes there. Say each out loud until it sounds like you:

1. **On ambiguity:** name it explicitly, list the concrete interpretations, show the downstream data impact of each, drive to a decision with the PO/SME, and record the decision in the requirement. Better a question in refinement than a defect in QA or an incident in prod.

2. **On challenging designs:** challenge through clarity and evidence, never authority. Frame risk in business terms — "this design hard-deletes, which breaks our audit story"; "this cache TTL risks showing a member stale entitlement data" — and always offer the alternative with its trade-off.

3. **On surfacing risk early:** profile the actual data before build (completeness, duplicates, orphans, domains); map source-of-truth per field; pressure-test failure paths (source down, stale cache, retries, eventual consistency). Risks get named in the requirement with expected behaviour so QA has a negative path and Ops has an acceptance criterion.

4. **On translating rules:** make them deterministic — decision table or state machine, every branch covered including the ELSE, tied to field-level inputs/outputs and testable acceptance criteria. No room for two readings.

5. **On sync vs async:** the classification follows business tolerance for latency and consistency. Live reads stay sync; expensive work goes async with a status contract; approval-bearing changes are workflow-driven with reconciliation. Each documented with source of truth, freshness, timeout/error state, reconciliation needs.

## Your STAR story bank (rehearse the stories, five titles)

Have one real Bell story ready per slot — rehearse the *story*, and know which position above it evidences:

| Story slot | Must demonstrate |
|---|---|
| **The field-map catch** — a mapping/lineage gap you caught before build | Analytical depth, pillar 3 |
| **The design challenge** — a technical design you pushed back on and improved | Influence without authority, position 2 |
| **The failure path** — an async/saga/compensation edge case you specified | Pillar 2, operational thinking |
| **The rule made deterministic** — a messy business rule you turned into a table/state machine | Pillar 4, translation skill |
| **The cross-team alignment** — PO + engineering + QA landed on one reading because of your artifact | Collaboration, traceability |

## Your questions for the panel (pick 3–4, know them cold)

Asking nothing — or asking only about vacation policy — undoes an hour of good answers. These show you already think like the role:

1. *"Where is DISP today — how much of the member portal already runs through it, and what's the next big slice being brought on?"* (shows platform thinking; gives you a map)
2. *"Day to day, how is API contract ownership split between this role and the API integration engineers — where does design authority actually sit?"* (surfaces the working relationship you'll live in)
3. *"Where do requirements most often break down today — ambiguity, source-system knowledge, data quality? What would you want this role to fix first?"* (invites them to describe the pain you're being hired to remove)
4. *"When audit or regulatory review happens, who walks the traceability chain, and how well does it hold up today?"* (proves you take Pillar 5 seriously)
5. *"What does great look like for this role at the six-month mark?"* (classic, still worth it — gets you the real success criteria)

---

# PART 6 — THE DAILY DRILL (print this page)

## The 30-minute daily loop

| Min | Drill |
|---|---|
| 0–5 | Recite Part 1 out loud: the one-sentence identity, the DISP chain, the five anchors |
| 5–15 | Write **one SQL pattern from memory on paper** (rotate: joins → window → anti-join → full-outer diff → checksums) |
| 15–20 | Narrate one flow aloud: a field's full lineage, OR the beneficiary state machine, OR the 8-point contract checklist |
| 20–25 | Sketch the ER model or a decision table from memory |
| 25–30 | Deliver one Position (Part 5) out loud + one STAR story, timed |

## The week plan (from your prep tab's study order)

1. Warm up SQL fundamentals on **SQLZoo** (joins, GROUP BY) — one short session
2. Drill window functions + anomaly-finding on **DataLemur / StrataScratch** — heaviest test area, most reps
3. On **DB Fiddle**, hand-build a 3-table pension schema; write the anti-join, full-outer diff, and checksum reconciliation yourself
4. Sketch the member/beneficiary/account ER model on **dbdiagram.io**, narrating cardinality and keys aloud
5. Rehearse the beneficiary-change state machine — states, guards, audit record per transition
6. One light pandas pass on **Kaggle** (merge/groupby) for the hand-you-a-CSV case
7. Re-read regulated-data posture and Positions last — they're recall, not practice

## Day-of checklist

- [ ] One-sentence identity — word perfect
- [ ] DISP chain — drawn from memory
- [ ] Five Bell → HOOPP anchors — recited
- [ ] 8-point contract checklist — recited
- [ ] Four operation classes + the four questions each — recited
- [ ] Anti-join and full-outer diff — written cold
- [ ] Beneficiary state machine — drawn cold
- [ ] Six regulated-data habits — recited
- [ ] Five positions — one line each
- [ ] Five STAR stories — titles and first sentences ready
- [ ] "Why HOOPP" story — 30 seconds, word perfect
- [ ] Ten pension terms — can define each in one sentence
- [ ] Idempotency, versioning, correlation ID — one line each
- [ ] Your 3–4 questions for the panel — chosen and memorized

---

# PART 7 — VIDEO CHAPTER OUTLINE

If you record this as a video (for your own spaced repetition or to share), the document maps to chapters:

| Ch | Title | Length | On-screen visual |
|---|---|---|---|
| 1 | Who you are in one sentence | 1 min | The identity sentence, full screen |
| 2 | DISP in one picture | 2 min | The six-box lineage chain, animated left to right |
| 3 | Five anchors: Bell → HOOPP | 3 min | The mapping table, one row at a time |
| 4 | The six pillars | 6 min | One slide per pillar, checklist style |
| 5 | SQL: core → validation → reconciliation | 8 min | Live typing of each pattern; end on the full-outer diff |
| 6 | Python & the pension data model | 4 min | ER diagram build-up; state machine animation |
| 7 | Regulated data: the six habits | 3 min | Icons per habit (log, no-delete, roles, mask, minimise, maker-checker) |
| 8 | Positions & story bank | 4 min | Position titles as chapter cards; story slots as a table |
| 9 | Why HOOPP, pension vocabulary & your questions | 3 min | The 30-second story on screen; glossary as flashcards; question list |
| 10 | The daily drill | 1 min | The 30-minute loop table |

Total ≈ 35 minutes — or record each chapter as a standalone short and loop them through the week.

---

*Built from the HOOPP job posting, your HOOPP Prep tab (`src/data/hoopp-prep.ts`), and your Bell Canada BSA background. The Interview Coach tab (HOOPP role selected) is primed with the same material for live practice.*
