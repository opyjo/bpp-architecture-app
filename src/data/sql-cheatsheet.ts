// Cheat sheet + drills + interview-prep content for the SQL Practice tab.
//
// Companion to src/data/sql-practice.ts — every snippet and drill solution
// below runs as-is against that file's seed data (PGlite / Postgres dialect),
// so "Load into editor" always produces a runnable query. The drills
// deliberately hunt the data problems planted in the seed: allocations ≠ 100%,
// members with no beneficiary, actives with no projection, NULL salaries.

export interface CheatSnippet {
  sql: string;
}

export interface CheatSection {
  title: string;
  /** Why this topic matters / the mental model, shown under the title. */
  blurb: string;
  snippets: CheatSnippet[];
  /** Green "say this in the interview" callout. */
  tip?: string;
  /** Amber "classic trap" callout. */
  trap?: string;
}

export const CHEAT_SECTIONS: CheatSection[] = [
  {
    title: "Reading rows",
    blurb:
      "The skeleton of every query. Clauses always appear in this order: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT.",
    snippets: [
      {
        sql: `-- Pick columns, filter rows, sort, and cap the result
SELECT name, employer, salary
FROM members
WHERE status = 'active'
ORDER BY salary DESC NULLS LAST
LIMIT 5;`,
      },
      {
        sql: `-- DISTINCT removes duplicate result rows
SELECT DISTINCT employer FROM members ORDER BY employer;

-- Column aliases (AS) rename output; use them in ORDER BY
SELECT name, salary * 0.09 AS annual_contribution
FROM members
WHERE salary IS NOT NULL
ORDER BY annual_contribution DESC;`,
      },
    ],
    tip: "Logical execution order is FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. That's why a WHERE can't see a SELECT alias, but ORDER BY can — a favourite interview probe.",
  },
  {
    title: "Filtering & the truth about NULL",
    blurb:
      "NULL means \"unknown\" — it is never equal to anything, including itself. Comparisons with NULL don't return false, they return NULL, and the row silently drops out of your filter.",
    snippets: [
      {
        sql: `-- Operator toolbox
SELECT name, status, salary FROM members
WHERE status IN ('retired', 'terminated')      -- set membership
  AND date_of_birth BETWEEN '1950-01-01' AND '1969-12-31'
  AND name ILIKE '%al%';                        -- ILIKE = case-insensitive LIKE`,
      },
      {
        sql: `-- NULL demands IS NULL / IS NOT NULL, never = NULL
SELECT name, status FROM members WHERE salary IS NULL;

-- COALESCE substitutes a fallback for NULL
SELECT name, COALESCE(salary, 0) AS salary_or_zero FROM members;

-- Prove the trap to yourself: this returns ZERO rows
SELECT name FROM members WHERE salary = NULL;`,
      },
    ],
    trap: "WHERE salary <> 80000 also excludes NULL salaries — the comparison is unknown, so the row is dropped. If you want \"different or missing\", write WHERE salary <> 80000 OR salary IS NULL, or use the NULL-safe WHERE salary IS DISTINCT FROM 80000.",
  },
  {
    title: "Aggregation: GROUP BY & HAVING",
    blurb:
      "Aggregates collapse many rows into one. WHERE filters rows before grouping; HAVING filters groups after.",
    snippets: [
      {
        sql: `-- One row per status with counts and averages
SELECT status,
       COUNT(*)                    AS members,      -- counts rows
       COUNT(salary)               AS with_salary,  -- skips NULLs!
       ROUND(AVG(salary), 0)       AS avg_salary,
       MIN(enrolled_at)            AS earliest_enrolment
FROM members
GROUP BY status
ORDER BY members DESC;`,
      },
      {
        sql: `-- HAVING: keep only groups that break the 100% rule.
-- This is THE data-quality query for this dataset.
SELECT m.id, m.name, SUM(b.allocation_pct) AS total_pct
FROM members m
JOIN beneficiaries b ON b.member_id = m.id
GROUP BY m.id, m.name
HAVING SUM(b.allocation_pct) <> 100
ORDER BY total_pct;`,
      },
      {
        sql: `-- FILTER: conditional counting without CASE (Postgres nicety)
SELECT status,
       COUNT(*)                               AS members,
       COUNT(*) FILTER (WHERE salary IS NULL) AS missing_salary
FROM members
GROUP BY status;`,
      },
    ],
    tip: "Rule to recite: every column in SELECT must be either aggregated or listed in GROUP BY. Postgres enforces it; interviewers test it.",
  },
  {
    title: "Joins: combining tables",
    blurb:
      "JOIN (inner) keeps only matching rows. LEFT JOIN keeps every row from the left table and fills the right side with NULLs when there's no match — which is exactly how you find missing data.",
    snippets: [
      {
        sql: `-- INNER JOIN: members WITH their beneficiaries (no-beneficiary members vanish)
SELECT m.name AS member, b.name AS beneficiary, b.relationship, b.allocation_pct
FROM members m
JOIN beneficiaries b ON b.member_id = m.id
ORDER BY m.name, b.allocation_pct DESC;`,
      },
      {
        sql: `-- LEFT JOIN + IS NULL = the "anti-join": rows with NO match.
-- Finds members with no beneficiary on file (the estate-fallback path).
SELECT m.id, m.name, m.status
FROM members m
LEFT JOIN beneficiaries b ON b.member_id = m.id
WHERE b.id IS NULL;`,
      },
      {
        sql: `-- Aggregating across a LEFT JOIN: count 0 correctly.
-- COUNT(b.id) skips the NULLs from non-matches; COUNT(*) would wrongly say 1.
SELECT m.name, COUNT(b.id) AS beneficiary_count
FROM members m
LEFT JOIN beneficiaries b ON b.member_id = m.id
GROUP BY m.id, m.name
ORDER BY beneficiary_count, m.name;`,
      },
    ],
    trap: "Join fan-out: joining members to contributions multiplies each member into hundreds of rows. If you then also join beneficiaries and SUM, totals inflate. Aggregate each child table separately (in a CTE or subquery), then join the summaries.",
  },
  {
    title: "Subqueries & CTEs",
    blurb:
      "A CTE (WITH ... AS) names an intermediate result so a query reads top-to-bottom. In interviews, reaching for a CTE instead of a nested subquery signals maturity.",
    snippets: [
      {
        sql: `-- Scalar subquery: compare each member to the overall average
SELECT name, salary
FROM members
WHERE salary > (SELECT AVG(salary) FROM members)
ORDER BY salary DESC;`,
      },
      {
        sql: `-- EXISTS: "has at least one" — stops at the first match
SELECT m.name
FROM members m
WHERE EXISTS (SELECT 1 FROM projections p WHERE p.member_id = m.id);

-- NOT EXISTS: active members with NO projection (a planted data gap)
SELECT m.name, m.status
FROM members m
WHERE m.status = 'active'
  AND NOT EXISTS (SELECT 1 FROM projections p WHERE p.member_id = m.id);`,
      },
      {
        sql: `-- CTE pipeline: summarize first, then join the summaries (no fan-out)
WITH totals AS (
  SELECT member_id, SUM(amount) AS lifetime_contrib
  FROM contributions
  GROUP BY member_id
),
bene AS (
  SELECT member_id, COUNT(*) AS n_beneficiaries
  FROM beneficiaries
  GROUP BY member_id
)
SELECT m.name,
       COALESCE(t.lifetime_contrib, 0) AS lifetime_contrib,
       COALESCE(b.n_beneficiaries, 0)  AS beneficiaries
FROM members m
LEFT JOIN totals t ON t.member_id = m.id
LEFT JOIN bene   b ON b.member_id = m.id
ORDER BY lifetime_contrib DESC;`,
      },
    ],
  },
  {
    title: "Window functions",
    blurb:
      "Aggregates that don't collapse rows: every row keeps its identity and gains a computed column over a \"window\" of related rows. The single highest-leverage topic for interview SQL.",
    snippets: [
      {
        sql: `-- Rank members by lifetime contributions (RANK ties share a number)
SELECT m.name,
       SUM(c.amount)                                   AS total,
       RANK()       OVER (ORDER BY SUM(c.amount) DESC) AS rnk,
       ROW_NUMBER() OVER (ORDER BY SUM(c.amount) DESC) AS row_no
FROM members m
JOIN contributions c ON c.member_id = m.id
GROUP BY m.id, m.name
ORDER BY total DESC;`,
      },
      {
        sql: `-- PARTITION BY: restart the window per group.
-- "Latest contribution per member" — the classic top-1-per-group pattern.
WITH ranked AS (
  SELECT member_id, amount, contributed_at,
         ROW_NUMBER() OVER (PARTITION BY member_id
                            ORDER BY contributed_at DESC) AS rn
  FROM contributions
)
SELECT m.name, r.amount, r.contributed_at
FROM ranked r
JOIN members m ON m.id = r.member_id
WHERE r.rn = 1
ORDER BY r.contributed_at DESC;`,
      },
      {
        sql: `-- LAG + running totals: month-over-month plan inflows for 2025
WITH monthly AS (
  SELECT date_trunc('month', contributed_at)::date AS month,
         SUM(amount) AS inflow
  FROM contributions
  WHERE contributed_at >= '2025-01-01' AND contributed_at < '2026-01-01'
  GROUP BY 1
)
SELECT month,
       inflow,
       inflow - LAG(inflow) OVER (ORDER BY month) AS vs_prev_month,
       SUM(inflow)          OVER (ORDER BY month) AS running_total
FROM monthly
ORDER BY month;`,
      },
    ],
    tip: "One-liner for the interview: \"GROUP BY collapses rows; a window function annotates them.\" Know ROW_NUMBER vs RANK vs DENSE_RANK (gapless), plus LAG/LEAD and running SUM ... OVER.",
  },
  {
    title: "CASE, dates & strings",
    blurb:
      "CASE puts business rules inline; age/date_part/date_trunc cover most date questions; split_part shines on structured text like the audit log's actor format.",
    snippets: [
      {
        sql: `-- CASE: inline business rules (here: the retirement-eligibility rule)
SELECT name,
       date_part('year', age(date_of_birth))::int AS age,
       CASE
         WHEN status <> 'active'                        THEN 'n/a — not active'
         WHEN age(date_of_birth) >= INTERVAL '55 years' THEN 'eligible'
         ELSE 'not yet'
       END AS retirement_eligibility
FROM members
ORDER BY age DESC;`,
      },
      {
        sql: `-- Date toolbox
SELECT name,
       enrolled_at,
       age(enrolled_at)                          AS tenure,        -- interval
       date_part('year', age(enrolled_at))::int  AS years_enrolled,
       date_trunc('month', enrolled_at)::date    AS enrolment_month,
       enrolled_at + INTERVAL '30 years'         AS pension_milestone
FROM members
ORDER BY enrolled_at;`,
      },
      {
        sql: `-- String toolbox (split_part shines on the audit log's 'admin:jkaur' format)
SELECT changed_by,
       split_part(changed_by, ':', 1)        AS actor_type,
       UPPER(entity) || ' / ' || action      AS what,
       changed_at
FROM audit_log
ORDER BY changed_at;`,
      },
    ],
  },
  {
    title: "Changing data & defining tables",
    blurb:
      "Read-only queries win interviews, but you'll be asked to sketch DDL for modelling questions. Practice freely — Reset restores everything.",
    snippets: [
      {
        sql: `-- INSERT / UPDATE / DELETE (run, check, then hit Reset)
INSERT INTO beneficiaries (member_id, name, relationship, allocation_pct, is_primary, effective_at)
VALUES (4, 'Estate of Member', 'Estate', 100, true, CURRENT_DATE);

UPDATE beneficiaries SET allocation_pct = 50
WHERE member_id = 9 AND name = 'Yuki Suzuki';   -- fixes Hana's 80% total

DELETE FROM beneficiaries WHERE member_id = 4;  -- undo the insert above

-- Verify your fix, then Reset:
SELECT member_id, SUM(allocation_pct) FROM beneficiaries GROUP BY member_id;`,
      },
      {
        sql: `-- DDL with constraints = business rules the database enforces
CREATE TABLE service_requests (
  id           SERIAL PRIMARY KEY,
  member_id    INT NOT NULL REFERENCES members(id),      -- FK: must exist
  category     TEXT NOT NULL CHECK (category IN ('address','banking','beneficiary')),
  status       TEXT NOT NULL DEFAULT 'open',
  opened_at    TIMESTAMP NOT NULL DEFAULT now(),
  closed_at    TIMESTAMP,
  CHECK (closed_at IS NULL OR closed_at >= opened_at)    -- cross-column rule
);
DROP TABLE service_requests;  -- clean up`,
      },
    ],
  },
];

// ─── Gotchas ─────────────────────────────────────────────────────────────────

export interface Gotcha {
  trap: string;
  happens: string;
  defense: string;
}

export const GOTCHAS: Gotcha[] = [
  {
    trap: "= NULL",
    happens: "Always unknown → zero rows, no error",
    defense: "IS NULL / IS DISTINCT FROM",
  },
  {
    trap: "COUNT(col) vs COUNT(*)",
    happens: "COUNT(col) silently skips NULLs",
    defense: "Pick deliberately; say why out loud",
  },
  {
    trap: "WHERE vs HAVING",
    happens: "WHERE runs before grouping, HAVING after",
    defense: "Filter rows early in WHERE; groups in HAVING",
  },
  {
    trap: "Join fan-out",
    happens: "1-to-many joins duplicate parent rows; SUMs inflate",
    defense: "Pre-aggregate in CTEs, then join",
  },
  {
    trap: "LEFT JOIN + WHERE on right table",
    happens: "WHERE b.x = ... turns it back into an INNER join",
    defense: "Move the condition into ON",
  },
  {
    trap: "Integer division",
    happens: "7/2 = 3 in Postgres",
    defense: "Cast: 7/2.0 or ::numeric",
  },
  {
    trap: "AVG ignores NULLs",
    happens: "Average of non-NULL only — may overstate",
    defense: "Decide: AVG(COALESCE(salary,0)) or state the caveat",
  },
  {
    trap: "UNION vs UNION ALL",
    happens: "UNION dedupes (slow); UNION ALL keeps all",
    defense: "Default to UNION ALL unless dedupe is the point",
  },
];

// ─── Drills ──────────────────────────────────────────────────────────────────

export interface Drill {
  skill: string;
  task: string;
  solution: string;
  /** What to check / say after solving — expected rows, edge cases. */
  note?: string;
}

export const DRILLS: Drill[] = [
  {
    skill: "SELECT + WHERE",
    task: "List active members earning over $80,000 — name and salary, highest paid first.",
    solution: `SELECT name, salary
FROM members
WHERE status = 'active' AND salary > 80000
ORDER BY salary DESC;`,
    note: "Expect 4 rows: Hana, Amara, Emma, Liam — and check: did you accidentally exclude anyone with a NULL salary? (Here it doesn't matter — actives all have salaries — but say it out loud in an interview.)",
  },
  {
    skill: "GROUP BY",
    task: "How many members are in each status, and what's the average salary per status?",
    solution: `SELECT status, COUNT(*) AS members, ROUND(AVG(salary), 0) AS avg_salary
FROM members
GROUP BY status
ORDER BY members DESC;`,
    note: "Note avg_salary is NULL for retired and terminated — AVG over all-NULL groups is NULL, not 0.",
  },
  {
    skill: "HAVING",
    task: "Which employers have an average active-member salary above $80,000?",
    solution: `SELECT employer, ROUND(AVG(salary), 0) AS avg_salary
FROM members
WHERE status = 'active'
GROUP BY employer
HAVING AVG(salary) > 80000
ORDER BY avg_salary DESC;`,
    note: "The point: status filter belongs in WHERE (row-level), the average threshold in HAVING (group-level).",
  },
  {
    skill: "LEFT JOIN + COUNT",
    task: "Every member with their beneficiary count — including members with zero.",
    solution: `SELECT m.name, COUNT(b.id) AS beneficiaries
FROM members m
LEFT JOIN beneficiaries b ON b.member_id = m.id
GROUP BY m.id, m.name
ORDER BY beneficiaries, m.name;`,
    note: "Noah Tremblay and Oliver Brown should show 0. If they show 1, you counted COUNT(*) instead of COUNT(b.id).",
  },
  {
    skill: "Data quality",
    task: "Find every member whose beneficiary allocations don't total exactly 100%.",
    solution: `SELECT m.id, m.name, SUM(b.allocation_pct) AS total_pct
FROM members m
JOIN beneficiaries b ON b.member_id = m.id
GROUP BY m.id, m.name
HAVING SUM(b.allocation_pct) <> 100;`,
    note: "Priya Nair (75) and Hana Suzuki (80). Bonus interview point: this query misses Noah and Oliver, who have NO rows at all — a complete answer UNIONs in the anti-join, or uses a LEFT JOIN with HAVING COALESCE(SUM(...), 0) <> 100.",
  },
  {
    skill: "Anti-join",
    task: "Which active members have no pension projection on file? (This is a real gap the projection API must handle.)",
    solution: `SELECT m.id, m.name
FROM members m
LEFT JOIN projections p ON p.member_id = m.id
WHERE m.status = 'active' AND p.id IS NULL;

-- Equivalent with NOT EXISTS (say you know both):
SELECT id, name FROM members m
WHERE status = 'active'
  AND NOT EXISTS (SELECT 1 FROM projections p WHERE p.member_id = m.id);`,
    note: "Sofia Rossi and Grace Kim.",
  },
  {
    skill: "Top-1 per group",
    task: "Show each member's single most recent contribution (member, amount, date).",
    solution: `WITH ranked AS (
  SELECT member_id, amount, contributed_at,
         ROW_NUMBER() OVER (PARTITION BY member_id
                            ORDER BY contributed_at DESC) AS rn
  FROM contributions
)
SELECT m.name, r.amount, r.contributed_at
FROM ranked r JOIN members m ON m.id = r.member_id
WHERE r.rn = 1
ORDER BY m.name;`,
  },
  {
    skill: "Percent of total",
    task: "Each member's lifetime contributions and their share of all contributions, as a percentage.",
    solution: `SELECT m.name,
       SUM(c.amount) AS total,
       ROUND(100 * SUM(c.amount) / SUM(SUM(c.amount)) OVER (), 1) AS pct_of_plan
FROM members m
JOIN contributions c ON c.member_id = m.id
GROUP BY m.id, m.name
ORDER BY total DESC;`,
    note: "SUM(SUM(...)) OVER () is a window over the grouped result — the grand total without a second query.",
  },
  {
    skill: "Audit reconstruction",
    task: "For every member who appears in the audit log: their name, number of changes, how many were self-service vs admin, and the date of their latest change.",
    solution: `SELECT m.name,
       COUNT(*)                                                     AS changes,
       COUNT(*) FILTER (WHERE a.changed_by = 'member-self-service') AS self_service,
       COUNT(*) FILTER (WHERE a.changed_by LIKE 'admin:%')          AS admin,
       MAX(a.changed_at)                                            AS latest_change
FROM audit_log a
JOIN members m ON m.id = a.member_id
GROUP BY m.id, m.name
ORDER BY changes DESC;`,
  },
  {
    skill: "Trend with LAG",
    task: "Total contributions per quarter of 2025, with the change versus the previous quarter.",
    solution: `WITH quarterly AS (
  SELECT date_trunc('quarter', contributed_at)::date AS quarter,
         SUM(amount) AS inflow
  FROM contributions
  WHERE contributed_at >= '2025-01-01' AND contributed_at < '2026-01-01'
  GROUP BY 1
)
SELECT quarter, inflow,
       inflow - LAG(inflow) OVER (ORDER BY quarter) AS vs_prev_quarter
FROM quarterly
ORDER BY quarter;`,
  },
];

// ─── Data modelling theory ───────────────────────────────────────────────────

export interface VocabTerm {
  term: string;
  say: string;
}

export const MODELLING_VOCAB: VocabTerm[] = [
  {
    term: "Entity",
    say: "A noun the business tracks → a table (member, beneficiary, contribution).",
  },
  {
    term: "Primary key",
    say: "The column(s) that uniquely identify a row. Surrogate (serial id) vs natural key — surrogate is the safe default; natural keys change.",
  },
  {
    term: "Foreign key",
    say: "A reference that the database enforces — no orphan beneficiaries pointing at deleted members.",
  },
  {
    term: "Cardinality",
    say: "1-to-1, 1-to-many (member→contributions), many-to-many (member↔fund — needs a junction table).",
  },
  {
    term: "Junction table",
    say: "Resolves many-to-many; composite PK of both FKs; relationship attributes (units, read_at) live here.",
  },
  {
    term: "1NF",
    say: "Atomic values — no comma-separated beneficiary lists in one column.",
  },
  {
    term: "2NF",
    say: "No partial dependency on part of a composite key — fund name doesn't belong in the holdings junction table.",
  },
  {
    term: "3NF",
    say: "No transitive dependencies — employer address depends on employer, not on member; give employers their own table.",
  },
  {
    term: "Denormalization",
    say: "Deliberately duplicating for read speed (reporting tables, caches) — a trade-off you name, with a plan to keep it in sync.",
  },
  {
    term: "SCD Type 2",
    say: "Keep history as versioned rows with valid_from/valid_to instead of overwriting — the answer whenever someone says \"what was the value on date X?\"",
  },
  {
    term: "Index",
    say: "Speeds reads on filtered/joined columns, costs writes and space. FKs and frequent WHERE columns are the usual candidates.",
  },
];

export interface FrameworkStep {
  step: string;
  detail: string;
}

/** The order to walk a requirements blurb on a whiteboard — narrate each step. */
export const WHITEBOARD_FRAMEWORK: FrameworkStep[] = [
  {
    step: "Nouns → entities",
    detail: "Underline the nouns; each candidate becomes a table.",
  },
  {
    step: "Verbs → relationships",
    detail:
      "\"A member names beneficiaries\" → 1-to-many. Ask the cardinality question out loud: \"can one X have many Y? Can one Y belong to many X?\"",
  },
  {
    step: "Rules → constraints",
    detail:
      "\"Allocations must total 100%\" — then say where the rule lives: per-row rules become CHECKs, cross-row rules need a trigger or service-layer enforcement. Naming the enforcement point is the senior move.",
  },
  {
    step: "History → versioning",
    detail:
      "Any \"as of date X\" or audit requirement means versioned rows (SCD 2) or an event log — not overwriting in place.",
  },
  {
    step: "Access patterns → keys & indexes",
    detail: "\"How will this be queried?\" justifies indexes and any denormalization.",
  },
];

// ─── Rapid-fire Q&A ──────────────────────────────────────────────────────────

export interface RapidFire {
  q: string;
  a: string;
}

export const RAPID_FIRE: RapidFire[] = [
  {
    q: "WHERE vs HAVING?",
    a: "WHERE filters rows before grouping; HAVING filters groups after aggregation. WHERE can't reference aggregates.",
  },
  {
    q: "INNER vs LEFT JOIN?",
    a: "INNER keeps only matches; LEFT keeps all left-side rows, NULL-padding the right. LEFT + IS NULL finds missing children.",
  },
  {
    q: "PRIMARY KEY vs UNIQUE?",
    a: "Both enforce uniqueness; PK also implies NOT NULL and there's one per table. UNIQUE columns can be NULL and a table can have many.",
  },
  {
    q: "GROUP BY vs window function?",
    a: "GROUP BY collapses rows into one per group; a window function keeps every row and annotates it with the group computation.",
  },
  {
    q: "RANK vs DENSE_RANK vs ROW_NUMBER?",
    a: "ROW_NUMBER: unique 1,2,3. RANK: ties share, then gaps (1,1,3). DENSE_RANK: ties share, no gaps (1,1,2).",
  },
  {
    q: "EXISTS vs IN?",
    a: "Usually equivalent for subqueries; EXISTS short-circuits and behaves sanely with NULLs — NOT IN against a list containing NULL returns nothing, a classic trap.",
  },
  {
    q: "DELETE vs TRUNCATE?",
    a: "DELETE removes rows (filterable, fires triggers, logged per row); TRUNCATE empties the table wholesale — fast, minimal logging, no WHERE.",
  },
  {
    q: "View vs table?",
    a: "A view is a saved query — always current, no storage. A materialized view stores the result and must be refreshed.",
  },
  {
    q: "What's a transaction?",
    a: "A unit of work that commits or rolls back atomically — ACID: atomic, consistent, isolated, durable. \"Move 40% allocation from spouse to child\" must be one transaction.",
  },
  {
    q: "When would you add an index?",
    a: "Columns in frequent WHERE/JOIN/ORDER BY — here, every member_id FK. Trade-off: faster reads, slower writes, more storage.",
  },
  {
    q: "Normalize or denormalize?",
    a: "Normalize for the system of record (integrity); denormalize deliberately for read-heavy reporting, with a sync strategy.",
  },
  {
    q: "How do you find duplicates?",
    a: "GROUP BY the natural key HAVING COUNT(*) > 1 — then dedupe with ROW_NUMBER over the same partition, keeping rn = 1.",
  },
];

/**
 * The closing habit to rehearse before answering any SQL question:
 * restate the business rule, write the query, name one edge case.
 */
export const FINAL_HABIT =
  "Before answering any SQL question, restate it as a business rule (\"so we want every member whose allocations break the 100% rule\"), write the query, then name one edge case NULLs or missing rows could cause. That loop — rule, query, edge case — is the whole BSA interview in miniature.";
