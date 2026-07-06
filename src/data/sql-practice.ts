// Seed data + reference metadata for the SQL Practice tab.
//
// The tab runs a real Postgres engine (PGlite / WASM) entirely in the browser,
// so this is the exact dialect you'd hit against Supabase or in a Postgres
// interview: window functions, CTEs, LATERAL, generate_series, etc.
//
// ─── Framed for the HOOPP DISP / Member-portal BSA role ──────────────────────
// This is a Technical Business Systems Analyst dataset, not a toy store. It
// models the member-portal domain that team owns — members, beneficiaries,
// contributions, pension projections, and an audit log — and it deliberately
// contains the kinds of DATA GAPS and RULE CONFLICTS a BSA is expected to catch
// before they reach engineering:
//
//   • beneficiary allocations that don't total 100%  (rule conflict)
//   • members with no beneficiary on file            (suppression / fallback)
//   • active members with no pension projection       (data gap)
//   • terminated/retired members with NULL salary     (source-system gap)
//   • a beneficiary change trail w/ self-service vs admin actors (auditability)
//
// The example queries turn each JD skill ("define eligibility rules", "identify
// data-quality issues", "reconstruct audit-sensitive transactions") into a SQL
// exercise.

/**
 * Idempotent schema + seed. Re-running it (the "Reset" button) drops and
 * rebuilds everything, so the sandbox always returns to a known state — planted
 * edge cases included.
 */
export const SEED_SQL = /* sql */ `
DROP TABLE IF EXISTS audit_log, projections, beneficiaries, contributions, members CASCADE;

-- HOOPP members (a defined-benefit plan for Ontario healthcare workers)
CREATE TABLE members (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('active','deferred','retired','terminated')),
  employer       TEXT NOT NULL,
  province       TEXT NOT NULL,
  date_of_birth  DATE NOT NULL,
  enrolled_at    DATE NOT NULL,
  salary         NUMERIC(10,2),          -- NULL for some retired/terminated: a data gap
  email_verified BOOLEAN NOT NULL DEFAULT true
);

-- Named beneficiaries + their payout allocation (business rule: must total 100%)
CREATE TABLE beneficiaries (
  id             SERIAL PRIMARY KEY,
  member_id      INT NOT NULL REFERENCES members(id),
  name           TEXT NOT NULL,
  relationship   TEXT NOT NULL,          -- Spouse | Child | Estate | Other
  allocation_pct NUMERIC(5,2) NOT NULL,
  is_primary     BOOLEAN NOT NULL DEFAULT false,
  effective_at   DATE NOT NULL
);

-- Regular member contributions into the plan
CREATE TABLE contributions (
  id             SERIAL PRIMARY KEY,
  member_id      INT NOT NULL REFERENCES members(id),
  amount         NUMERIC(10,2) NOT NULL,
  contributed_at DATE NOT NULL
);

-- Pension projections surfaced by the member-portal projection API
CREATE TABLE projections (
  id               SERIAL PRIMARY KEY,
  member_id        INT NOT NULL REFERENCES members(id),
  projected_annual NUMERIC(12,2) NOT NULL,
  as_of            DATE NOT NULL,
  assumptions      TEXT
);

-- Audit trail for member-data changes (who changed what, self-service vs admin)
CREATE TABLE audit_log (
  id         SERIAL PRIMARY KEY,
  member_id  INT REFERENCES members(id),
  entity     TEXT NOT NULL,             -- member | beneficiary | projection
  action     TEXT NOT NULL,             -- create | update | delete
  field      TEXT,
  old_value  TEXT,
  new_value  TEXT,
  changed_by TEXT NOT NULL,             -- 'member-self-service' | 'admin:<user>'
  changed_at TIMESTAMP NOT NULL
);

-- Members. Ages are relative to ~2026 so eligibility rules have near-misses.
INSERT INTO members (name, status, employer, province, date_of_birth, enrolled_at, salary) VALUES
  ('Amara Okafor',    'active',     'Toronto General Hospital',      'ON', '1969-04-12', '2001-03-01', 98000),
  ('Liam Chen',       'active',     'Sunnybrook Health Sciences',    'ON', '1990-08-22', '2016-07-15', 82000),
  ('Priya Nair',      'deferred',   'London Health Sciences',        'ON', '1978-11-05', '2005-02-10', 105000),
  ('Noah Tremblay',   'active',     'The Ottawa Hospital',           'ON', '1985-06-18', '2012-09-01', 76000),
  ('Sofia Rossi',     'active',     'Hamilton Health Sciences',      'ON', '1996-01-30', '2020-05-20', 64000),
  ('Kwame Mensah',    'retired',    'Toronto General Hospital',      'ON', '1958-02-14', '1995-11-01', NULL),
  ('Emma Larsson',    'active',     'Kingston Health Sciences',      'ON', '1972-09-09', '2003-04-01', 91000),
  ('Diego Alvarez',   'terminated', 'Trillium Health Partners',      'ON', '1988-03-27', '2015-06-30', NULL),
  ('Hana Suzuki',     'active',     'Sinai Health',                  'ON', '1965-07-03', '1998-08-01', 99000),
  ('Oliver Brown',    'active',     'Grand River Hospital',          'ON', '1993-12-11', '2019-03-15', 61000),
  ('Fatima Al-Sayed', 'retired',    'Windsor Regional Hospital',     'ON', '1955-05-19', '1990-04-01', NULL),
  ('Grace Kim',       'active',     'Providence Care',               'ON', '1999-10-25', '2022-01-11', 58000);

-- Beneficiaries. Allocation totals are hand-tuned to plant rule conflicts:
--   Priya (id 3) → 75%   Hana (id 9) → 80%   both VIOLATE the "must total 100%" rule
--   Noah (id 4) & Oliver (id 10) → no beneficiary rows at all (fallback to estate)
INSERT INTO beneficiaries (member_id, name, relationship, allocation_pct, is_primary, effective_at) VALUES
  (1,  'Kofi Okafor',      'Spouse', 100.00, true,  '2001-03-15'),
  (2,  'Wei Chen',         'Spouse',  60.00, true,  '2016-08-01'),
  (2,  'Mia Chen',         'Child',   40.00, false, '2018-05-01'),
  (3,  'Arjun Nair',       'Spouse',  50.00, true,  '2023-02-11'),   -- 50 + 25 = 75 (bad)
  (3,  'Anaya Nair',       'Child',   25.00, false, '2023-02-11'),
  (5,  'Estate of Member', 'Estate', 100.00, true,  '2020-06-01'),
  (6,  'Ama Mensah',       'Spouse',  70.00, true,  '1996-01-01'),
  (6,  'Kojo Mensah',      'Child',   30.00, false, '2000-03-01'),
  (7,  'Olof Larsson',     'Child',   50.00, true,  '2003-05-01'),
  (7,  'Freja Larsson',    'Child',   50.00, false, '2005-09-01'),
  (8,  'Lucia Alvarez',    'Spouse', 100.00, true,  '2015-07-01'),
  (9,  'Ren Suzuki',       'Spouse',  40.00, true,  '1998-09-01'),   -- 40 + 40 = 80 (bad)
  (9,  'Yuki Suzuki',      'Child',   40.00, false, '2002-04-01'),
  (11, 'Nadia Al-Sayed',   'Spouse', 100.00, true,  '1990-05-01'),
  (12, 'Estate of Member', 'Estate', 100.00, true,  '2022-02-01');

-- Pension projections — deliberately absent for Sofia (5) & Grace (12): active
-- members with NO projection on file (a data gap the projection API must handle)
INSERT INTO projections (member_id, projected_annual, as_of, assumptions) VALUES
  (1,  62000, '2026-01-15', 'retire at 60, 2% accrual'),
  (2,  48000, '2026-01-15', 'retire at 65, 2% accrual'),
  (4,  41000, '2026-01-15', 'retire at 65'),
  (7,  57000, '2026-01-15', 'retire at 60'),
  (9,  64000, '2026-01-15', 'retire at 62'),
  (10, 33000, '2026-01-15', 'retire at 65');

-- Audit trail: mixed member-self-service and admin actors on sensitive fields
INSERT INTO audit_log (member_id, entity, action, field, old_value, new_value, changed_by, changed_at) VALUES
  (3, 'beneficiary', 'create', NULL,             NULL,            'Spouse 50%',    'member-self-service', '2023-02-11 09:14:00'),
  (3, 'beneficiary', 'create', NULL,             NULL,            'Child 25%',     'member-self-service', '2023-02-11 09:15:00'),
  (3, 'beneficiary', 'update', 'allocation_pct', '60',            '50',            'admin:jkaur',         '2024-06-01 14:02:00'),
  (1, 'member',      'update', 'email',          'a.okafor@old.ca','a.okafor@thg.ca','member-self-service','2025-11-03 18:40:00'),
  (1, 'beneficiary', 'update', 'allocation_pct', '80',            '100',           'admin:rlee',          '2025-11-04 10:22:00'),
  (9, 'beneficiary', 'update', 'allocation_pct', '50',            '40',            'member-self-service', '2026-03-19 21:05:00'),
  (5, 'member',      'update', 'email_verified', 'false',         'true',          'admin:jkaur',         '2026-04-02 11:30:00');

SELECT setseed(0.42);

-- Monthly contributions (~9% of salary) for members who are still contributing
INSERT INTO contributions (member_id, amount, contributed_at)
SELECT m.id,
       ROUND((m.salary * 0.09 / 12)::numeric, 2),
       gs::date
FROM members m,
     LATERAL generate_series(m.enrolled_at, DATE '2025-12-01', INTERVAL '1 month') gs
WHERE m.salary IS NOT NULL
  AND m.status IN ('active', 'deferred');
`;

/** Table/column reference rendered in the schema sidebar. */
export interface SchemaTable {
  name: string;
  columns: { name: string; type: string; note?: string }[];
}

export const SCHEMA_TABLES: SchemaTable[] = [
  {
    name: "members",
    columns: [
      { name: "id", type: "serial", note: "PK" },
      { name: "name", type: "text" },
      { name: "status", type: "text", note: "active|deferred|retired|terminated" },
      { name: "employer", type: "text" },
      { name: "province", type: "text" },
      { name: "date_of_birth", type: "date" },
      { name: "enrolled_at", type: "date" },
      { name: "salary", type: "numeric", note: "nullable" },
      { name: "email_verified", type: "bool" },
    ],
  },
  {
    name: "beneficiaries",
    columns: [
      { name: "id", type: "serial", note: "PK" },
      { name: "member_id", type: "int", note: "→ members.id" },
      { name: "name", type: "text" },
      { name: "relationship", type: "text", note: "Spouse|Child|Estate" },
      { name: "allocation_pct", type: "numeric", note: "must total 100" },
      { name: "is_primary", type: "bool" },
      { name: "effective_at", type: "date" },
    ],
  },
  {
    name: "contributions",
    columns: [
      { name: "id", type: "serial", note: "PK" },
      { name: "member_id", type: "int", note: "→ members.id" },
      { name: "amount", type: "numeric" },
      { name: "contributed_at", type: "date" },
    ],
  },
  {
    name: "projections",
    columns: [
      { name: "id", type: "serial", note: "PK" },
      { name: "member_id", type: "int", note: "→ members.id" },
      { name: "projected_annual", type: "numeric" },
      { name: "as_of", type: "date" },
      { name: "assumptions", type: "text" },
    ],
  },
  {
    name: "audit_log",
    columns: [
      { name: "id", type: "serial", note: "PK" },
      { name: "member_id", type: "int", note: "→ members.id" },
      { name: "entity", type: "text", note: "member|beneficiary" },
      { name: "action", type: "text", note: "create|update|delete" },
      { name: "field", type: "text" },
      { name: "old_value", type: "text" },
      { name: "new_value", type: "text" },
      { name: "changed_by", type: "text", note: "self-service|admin:*" },
      { name: "changed_at", type: "timestamp" },
    ],
  },
];

/**
 * Starter queries — each maps a HOOPP BSA responsibility to a SQL exercise.
 * `concept` names the analyst skill it drills. Click to load into the editor.
 */
export interface ExampleQuery {
  label: string;
  concept: string;
  sql: string;
}

export const EXAMPLE_QUERIES: ExampleQuery[] = [
  {
    label: "Member roster",
    concept: "warm-up · SELECT",
    sql: `SELECT id, name, status, employer, salary
FROM members
ORDER BY status, name;`,
  },
  {
    label: "Beneficiary allocations ≠ 100%",
    concept: "data quality · rule conflict",
    sql: `-- Business rule: a member's beneficiary allocations MUST total 100%.
-- Surface every member who violates it before it becomes a payout defect.
SELECT m.id,
       m.name,
       SUM(b.allocation_pct) AS total_pct
FROM members m
JOIN beneficiaries b ON b.member_id = m.id
GROUP BY m.id, m.name
HAVING SUM(b.allocation_pct) <> 100
ORDER BY total_pct;`,
  },
  {
    label: "Members with no beneficiary",
    concept: "suppression / fallback logic",
    sql: `-- No beneficiary on file → the portal must fall back to 'Estate'.
-- Which members trigger that path?
SELECT m.id, m.name, m.status
FROM members m
LEFT JOIN beneficiaries b ON b.member_id = m.id
WHERE b.id IS NULL
ORDER BY m.name;`,
  },
  {
    label: "Retirement-eligibility rule",
    concept: "deterministic eligibility rule",
    sql: `-- Rule: active members aged 55+ are retirement-eligible.
-- Note the near-miss (age 54) that the rule must NOT include.
SELECT name,
       status,
       date_part('year', age(date_of_birth))::int AS age
FROM members
WHERE status = 'active'
  AND age(date_of_birth) >= INTERVAL '55 years'
ORDER BY age DESC;`,
  },
  {
    label: "Active members missing a projection",
    concept: "data gap · downstream impact",
    sql: `-- The projection API must handle active members with no projection row.
-- Find them (a gap Product/QA needs to know about).
SELECT m.id, m.name, m.status, m.enrolled_at
FROM members m
LEFT JOIN projections p ON p.member_id = m.id
WHERE m.status = 'active'
  AND p.id IS NULL
ORDER BY m.enrolled_at;`,
  },
  {
    label: "Source-system data gaps",
    concept: "source limitation · nullability",
    sql: `-- Which members have a NULL salary, and does status explain it?
-- (Terminated/retired may legitimately lack a current salary.)
SELECT status,
       COUNT(*)                                    AS members,
       COUNT(*) FILTER (WHERE salary IS NULL)      AS missing_salary
FROM members
GROUP BY status
ORDER BY missing_salary DESC;`,
  },
  {
    label: "Audit trail for one member",
    concept: "auditability · sensitive txns",
    sql: `-- Reconstruct every change to member #3's data, in order.
SELECT changed_at,
       entity,
       action,
       field,
       old_value,
       new_value,
       changed_by
FROM audit_log
WHERE member_id = 3
ORDER BY changed_at;`,
  },
  {
    label: "Self-service vs admin changes",
    concept: "audit segmentation · privacy",
    sql: `-- Split audit activity by actor type — member self-service vs admin.
-- Relevant to privacy, data stewardship, and access review.
SELECT split_part(changed_by, ':', 1) AS actor_type,
       entity,
       COUNT(*)                        AS changes
FROM audit_log
GROUP BY actor_type, entity
ORDER BY changes DESC;`,
  },
  {
    label: "Contribution reconciliation",
    concept: "aggregation + window",
    sql: `-- Per-member contribution totals, ranked — the kind of reconciliation
-- number a BSA validates against a source system.
SELECT m.name,
       m.status,
       COUNT(c.id)                                       AS n_contributions,
       SUM(c.amount)                                     AS total_contributed,
       RANK() OVER (ORDER BY SUM(c.amount) DESC)         AS rank
FROM members m
JOIN contributions c ON c.member_id = m.id
GROUP BY m.id, m.name, m.status
ORDER BY total_contributed DESC;`,
  },
];

// ─── Data modelling ──────────────────────────────────────────────────────────

/** Mermaid ER diagram of the seed schema, rendered in the Modelling view. */
export const ER_DIAGRAM = `erDiagram
    members {
        int id PK
        text name
        text status
        text employer
        text province
        date date_of_birth
        date enrolled_at
        numeric salary "nullable"
        bool email_verified
    }
    beneficiaries {
        int id PK
        int member_id FK
        text name
        text relationship
        numeric allocation_pct
        bool is_primary
        date effective_at
    }
    contributions {
        int id PK
        int member_id FK
        numeric amount
        date contributed_at
    }
    projections {
        int id PK
        int member_id FK
        numeric projected_annual
        date as_of
        text assumptions
    }
    audit_log {
        int id PK
        int member_id FK
        text entity
        text action
        text field
        text old_value
        text new_value
        text changed_by
        timestamp changed_at
    }
    members ||--o{ beneficiaries : "names"
    members ||--o{ contributions : "makes"
    members ||--o{ projections : "has"
    members ||--o{ audit_log : "tracked by"`;

/**
 * Data-modelling exercises framed for the DISP / member-portal BSA role. Each
 * `solution` is real, runnable DDL against the sandbox (safe to re-run; Reset
 * restores the base schema). `interviewNote` is the one-liner you'd say to
 * justify the modelling choice in the interview.
 */
export interface ModellingChallenge {
  title: string;
  concept: string;
  prompt: string;
  solution: string;
  interviewNote: string;
}

export const MODELLING_CHALLENGES: ModellingChallenge[] = [
  {
    title: "Model beneficiary allocation history",
    concept: "temporal modelling · SCD Type 2 · auditability",
    prompt:
      "Today `beneficiaries.allocation_pct` stores only the CURRENT value. The audit team needs to answer: “what was this member’s beneficiary split on any given past date?” Redesign so every change is preserved and any point-in-time state is reconstructable.",
    solution: `-- Version every allocation with a validity window (valid_to = NULL = current).
-- Point-in-time reads become deterministic — no reconstructing from the audit log.
DROP TABLE IF EXISTS beneficiary_versions CASCADE;
CREATE TABLE beneficiary_versions (
  id             SERIAL PRIMARY KEY,
  member_id      INT  NOT NULL REFERENCES members(id),
  name           TEXT NOT NULL,
  allocation_pct NUMERIC(5,2) NOT NULL,
  valid_from     DATE NOT NULL,
  valid_to       DATE            -- NULL = current version
);

INSERT INTO beneficiary_versions (member_id, name, allocation_pct, valid_from, valid_to) VALUES
  (3, 'Arjun Nair', 60, '2023-02-11', '2024-06-01'),  -- superseded
  (3, 'Arjun Nair', 50, '2024-06-01', NULL),           -- current
  (3, 'Anaya Nair', 25, '2023-02-11', NULL);

-- What was member 3's split on 2023-08-01?
SELECT name, allocation_pct
FROM beneficiary_versions
WHERE member_id = 3
  AND valid_from <= DATE '2023-08-01'
  AND (valid_to IS NULL OR valid_to > DATE '2023-08-01');`,
    interviewNote:
      "History belongs in the model, not reconstructed after the fact. A valid_from/valid_to version table (SCD Type 2) gives the projection and audit APIs deterministic point-in-time reads.",
  },
  {
    title: "Enforce “allocations must total 100%” in the schema",
    concept: "invariant enforcement · CHECK vs trigger",
    prompt:
      "The rule “a member’s allocations must total 100%” is currently only catchable by a query AFTER bad data lands. Move enforcement as close to the data as possible so an invalid split can’t persist — and notice what happens to the members who already violate it.",
    solution: `-- A per-row CHECK can't sum across rows. A cross-row invariant needs a trigger.
CREATE OR REPLACE FUNCTION assert_allocations_total_100()
RETURNS TRIGGER AS $$
DECLARE
  total NUMERIC;
  mid   INT := COALESCE(NEW.member_id, OLD.member_id);
BEGIN
  SELECT SUM(allocation_pct) INTO total
  FROM beneficiaries WHERE member_id = mid;
  IF total IS DISTINCT FROM 100 THEN
    RAISE EXCEPTION 'Member % allocations total %, must be 100', mid, total;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alloc_100 ON beneficiaries;
CREATE CONSTRAINT TRIGGER trg_alloc_100
  AFTER INSERT OR UPDATE OR DELETE ON beneficiaries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_allocations_total_100();

-- Try to touch member 3 (who totals 75) — the write is now REJECTED:
UPDATE beneficiaries SET allocation_pct = allocation_pct WHERE member_id = 3;`,
    interviewNote:
      "A CHECK is per-row; this invariant spans rows, so it needs a trigger (or a summary table with a constraint). The real BSA point: name WHERE the rule lives — DB, orchestration API, or UI — because that defines what “guaranteed” means downstream. And enforcement instantly surfaces the data already in violation.",
  },
  {
    title: "Model members ↔ funds (many-to-many)",
    concept: "many-to-many · junction table",
    prompt:
      "Members can hold many investment funds, and a fund is held by many members — with a units balance for each member/fund pair. Model this cleanly.",
    solution: `-- The relationship itself carries data (units), so it becomes its own table.
-- Never a comma-separated list or repeated fund_1/fund_2 columns.
DROP TABLE IF EXISTS holdings CASCADE;
DROP TABLE IF EXISTS funds CASCADE;
CREATE TABLE funds (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  asset_class TEXT NOT NULL
);
CREATE TABLE holdings (
  member_id INT NOT NULL REFERENCES members(id),
  fund_id   INT NOT NULL REFERENCES funds(id),
  units     NUMERIC(12,4) NOT NULL,
  PRIMARY KEY (member_id, fund_id)   -- one row per member/fund pair
);

INSERT INTO funds (name, asset_class) VALUES
  ('Canadian Equity', 'Equity'), ('Long Bond', 'Fixed Income');
INSERT INTO holdings (member_id, fund_id, units) VALUES
  (1, 1, 320.5), (1, 2, 110.0), (2, 1, 90.0);

SELECT m.name, f.name AS fund, h.units
FROM holdings h
JOIN members m ON m.id = h.member_id
JOIN funds   f ON f.id = h.fund_id
ORDER BY m.name;`,
    interviewNote:
      "A composite-key junction table keeps the relationship queryable and lets attributes (units, cost basis) live on the relationship rather than being crammed into either entity.",
  },
  {
    title: "Design tables from a requirements blurb",
    concept: "requirements → schema · cardinality decisions",
    prompt:
      "Requirements: members receive secure documents (statements, tax slips) — each has a type and an issued date. Some documents are broadcast to MANY members. Read/unread state is tracked PER member. Design the tables.",
    solution: `-- The tell: 'broadcast to many' + 'read state per member' means the DOCUMENT
-- and its DELIVERY to a member are separate entities. Collapsing them would
-- duplicate a document row per recipient.
DROP TABLE IF EXISTS member_documents CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
CREATE TABLE documents (
  id        SERIAL PRIMARY KEY,
  doc_type  TEXT NOT NULL,          -- statement | tax_slip | notice
  title     TEXT NOT NULL,
  issued_on DATE NOT NULL
);
CREATE TABLE member_documents (
  member_id INT NOT NULL REFERENCES members(id),
  doc_id    INT NOT NULL REFERENCES documents(id),
  read_at   TIMESTAMP,             -- NULL = unread
  PRIMARY KEY (member_id, doc_id)
);

INSERT INTO documents (doc_type, title, issued_on) VALUES
  ('tax_slip',  '2025 T4A',          '2026-02-28'),   -- broadcast
  ('statement', 'Q1 2026 Statement', '2026-04-01');
INSERT INTO member_documents (member_id, doc_id, read_at) VALUES
  (1, 1, NULL), (2, 1, '2026-03-02 10:00'), (1, 2, NULL);

-- Unread documents per member:
SELECT m.name, d.title, d.doc_type
FROM member_documents md
JOIN members   m ON m.id = md.member_id
JOIN documents d ON d.id = md.doc_id
WHERE md.read_at IS NULL
ORDER BY m.name;`,
    interviewNote:
      "Spotting that 'broadcast' + 'per-member read state' forces two entities (document + delivery) is exactly the ambiguity a BSA surfaces before build — the wrong model here means duplicated documents and no clean unread count.",
  },
];
