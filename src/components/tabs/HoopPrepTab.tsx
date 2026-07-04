"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import CodeBlock from "@/components/ui/CodeBlock";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { hooppMentalModelMd } from "@/data/hoopp-mental-model";
import {
  FlowDiagram,
  BranchDiagram,
  StackDiagram,
  MatrixDiagram,
  JoinVenn,
  ReconVenn,
  CardinalityLegend,
} from "@/components/tabs/hoopp-diagrams";
import {
  dispFraming,
  sqlCore,
  sqlValidation,
  sqlReconciliation,
  dmEntities,
  dmState,
  erDiagramMermaid,
  stateMachineMermaid,
  pythonConcepts,
  auditConcepts,
  rbacConcepts,
  panelPoints,
  practicePlatforms,
  studyOrder,
  questionGroups,
  quickChecks,
  type ConceptCard,
  type ConceptColor,
  type QuestionGroup,
} from "@/data/hoopp-prep";

// ─── Sidebar Definition ──────────────────────────────────────────────────────

const sidebarItems = [{ id: "hoopp-overview", label: "Overview & Role" }];

const sidebarGroups = [
  {
    label: "Mental Model",
    items: [{ id: "hoopp-mental-model", label: "Daily drill — full model" }],
  },
  {
    label: "HOOPP / DISP Context",
    items: [{ id: "hoopp-disp", label: "Role, BFF & data flow" }],
  },
  {
    label: "SQL — Validation & Reconciliation",
    items: [
      { id: "hoopp-sql-core", label: "Core SQL you must know" },
      { id: "hoopp-sql-validate", label: "Data validation" },
      { id: "hoopp-sql-reconcile", label: "System reconciliation" },
    ],
  },
  {
    label: "Data Modelling",
    items: [
      { id: "hoopp-dm-concepts", label: "Entities, keys & relationships" },
      { id: "hoopp-dm-er", label: "ER diagram (pension domain)" },
      { id: "hoopp-dm-state", label: "State machines" },
    ],
  },
  {
    label: "Python (lighter)",
    items: [{ id: "hoopp-py", label: "Validation & reconciliation" }],
  },
  {
    label: "Regulated Data",
    items: [
      { id: "hoopp-audit", label: "Auditability" },
      { id: "hoopp-rbac", label: "RBAC & PII protection" },
    ],
  },
  {
    label: "Mock Interview Questions",
    items: [
      { id: "hoopp-q-sql", label: "SQL questions" },
      { id: "hoopp-q-dm", label: "Data modelling questions" },
      { id: "hoopp-q-api", label: "Data-flow & API questions" },
      { id: "hoopp-q-py", label: "Python questions" },
      { id: "hoopp-q-rapid", label: "Rapid-fire concept checks" },
    ],
  },
  {
    label: "Panel Talking Points",
    items: [{ id: "hoopp-panel", label: "How to answer" }],
  },
  {
    label: "Practice Platforms",
    items: [{ id: "hoopp-practice", label: "Where to drill" }],
  },
];

// ─── Shared Styles (mirrors BsaCheatsheetTab / CanadaLifeTab helpers) ─────────

const badgeColors: Record<string, string> = {
  purple: "bg-[rgba(124,111,205,0.12)] text-arch-purple border-[rgba(124,111,205,0.22)]",
  teal: "bg-[rgba(62,184,154,0.12)] text-arch-teal border-[rgba(62,184,154,0.22)]",
  blue: "bg-[rgba(74,143,232,0.12)] text-arch-blue border-[rgba(74,143,232,0.22)]",
  amber: "bg-[rgba(232,168,58,0.12)] text-arch-amber border-[rgba(232,168,58,0.22)]",
  green: "bg-[rgba(88,184,122,0.12)] text-[#58b87a] border-[rgba(88,184,122,0.22)]",
  coral: "bg-[rgba(232,112,90,0.12)] text-[#e8705a] border-[rgba(232,112,90,0.22)]",
};

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${badgeColors[color] ?? badgeColors.blue}`}>
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold text-arch-text mb-1">{children}</div>;
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return <div className="text-[11.5px] text-arch-text2 mb-4 leading-relaxed">{children}</div>;
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] font-semibold text-arch-text mt-5 mb-2">{children}</div>;
}

function Callout({ color = "blue", label, children }: { color?: string; label?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-3 my-3 text-[12px] leading-relaxed"
      style={{
        background: `color-mix(in srgb, var(--arch-${color}) 9%, transparent)`,
        border: `1px solid color-mix(in srgb, var(--arch-${color}) 30%, transparent)`,
        color: "var(--arch-text2)",
      }}
    >
      {label && (
        <div className="text-[9.5px] font-bold uppercase tracking-wider mb-1" style={{ color: `var(--arch-${color})` }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Concept Card Renderer ───────────────────────────────────────────────────

function ConceptCardView({ card, accent }: { card: ConceptCard; accent: string }) {
  return (
    <div
      className="bg-arch-bg2 border border-arch-border rounded-lg p-4 mb-3.5"
      style={{ borderLeft: `3px solid var(--arch-${accent})` }}
    >
      <div className="text-[13px] font-semibold text-arch-text mb-1.5">{card.title}</div>
      <div className="text-[11.5px] text-arch-text2 leading-[1.7] whitespace-pre-line">{card.summary}</div>
      {card.code && (
        <div className="mt-3">
          <CodeBlock language={card.lang} comment={card.codeComment}>
            {card.code}
          </CodeBlock>
        </div>
      )}
      {card.anchor && (
        <Callout color="teal" label="In your codebase">
          {card.anchor}
        </Callout>
      )}
    </div>
  );
}

function ConceptList({ cards, accent }: { cards: ConceptCard[]; accent: string }) {
  return (
    <>
      {cards.map((c) => (
        <ConceptCardView key={c.id} card={c} accent={accent} />
      ))}
    </>
  );
}

// ─── Mock Question Renderer ──────────────────────────────────────────────────

function QuestionGroupView({ group }: { group: QuestionGroup }) {
  return (
    <div>
      <SectionTitle>{group.title}</SectionTitle>
      <SectionDesc>{group.intro}</SectionDesc>
      {group.questions.map((item, i) => (
        <div
          key={item.id}
          className="bg-arch-bg2 border border-arch-border rounded-lg p-4 mb-3.5"
          style={{ borderLeft: `3px solid var(--arch-${group.color})` }}
        >
          <div className="flex items-start gap-2.5 mb-2">
            <span
              className="shrink-0 mt-0.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{
                background: `color-mix(in srgb, var(--arch-${group.color}) 15%, transparent)`,
                color: `var(--arch-${group.color})`,
              }}
            >
              {i + 1}
            </span>
            <div className="text-[12.5px] font-semibold text-arch-text leading-snug">{item.q}</div>
          </div>

          <div className="text-[10.5px] text-arch-text3 leading-relaxed mb-2.5 pl-7.5">
            <span className="font-semibold uppercase tracking-wider text-[9px]" style={{ color: `var(--arch-${group.color})` }}>
              What they&apos;re testing ·{" "}
            </span>
            {item.tests}
          </div>

          <div className="text-[11.5px] text-arch-text2 leading-[1.7] whitespace-pre-line">{item.answer}</div>

          {item.code && (
            <div className="mt-3">
              <CodeBlock language={item.lang} comment={item.codeComment}>
                {item.code}
              </CodeBlock>
            </div>
          )}

          {item.followups && item.followups.length > 0 && (
            <div className="mt-3">
              <div className="text-[9.5px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--arch-amber)" }}>
                Likely follow-ups
              </div>
              <ul className="space-y-1">
                {item.followups.map((f, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-[11px] text-arch-text2 leading-relaxed">
                    <span className="text-arch-amber mt-px">↳</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HoopPrepTab() {
  return (
    <SectionLayout label="Overview" items={sidebarItems} groups={sidebarGroups}>
      {(activeId) => {
        // ── Overview ──────────────────────────────────────────────
        if (activeId === "hoopp-overview") {
          const sections: { label: string; desc: string; color: ConceptColor }[] = [
            { label: "Mental Model", desc: "The full printable daily-drill doc: identity, pillars, SQL, vocab, drill", color: "coral" },
            { label: "DISP Context", desc: "Role, BFF, sync/async, source-of-truth, traceability", color: "blue" },
            { label: "SQL", desc: "Joins, windows, CTEs — validation & reconciliation", color: "blue" },
            { label: "Data Modelling", desc: "Entities, keys, cardinality, ER + state machines", color: "teal" },
            { label: "Python", desc: "Comprehensions, validation, pandas reconciliation", color: "amber" },
            { label: "Regulated Data", desc: "Audit logs, immutability, RBAC, PII protection", color: "purple" },
            { label: "Mock Questions", desc: "Real questions + model answers: SQL, modelling, API, Python, rapid-fire", color: "coral" },
            { label: "Panel Points", desc: "How to answer ambiguity/risk/challenge prompts", color: "green" },
            { label: "Practice", desc: "Curated SQL / modelling / Python drill sites + order", color: "coral" },
          ];
          return (
            <div>
              <SectionTitle>HOOPP — Senior Technical BSA (DISP) prep</SectionTitle>
              <SectionDesc>
                Quick, scannable concepts for the technical panel, weighted the way the recruiter framed it: SQL
                (validate data flows &amp; reconcile systems) and data modelling go deepest; Python and regulated-data
                handling are lighter. Every card ends with an <em>&ldquo;In your codebase&rdquo;</em> tie-back so you can
                answer with concrete examples from the platform you already know.
              </SectionDesc>

              <Callout color="blue" label="How to use this">
                Work the sidebar top-to-bottom the day before. Spend most of your time in <strong>SQL</strong> and{" "}
                <strong>Data Modelling</strong> — open <strong>Practice Platforms</strong> and actually write the
                anti-join and full-outer diff by hand. Read Regulated Data &amp; Panel Points last; they&apos;re recall,
                not practice.
              </Callout>

              <SubHeading>What&apos;s inside</SubHeading>
              <div className="grid grid-cols-2 gap-2">
                {sections.map((s) => (
                  <div key={s.label} className="bg-arch-bg2 border border-arch-border rounded-lg p-3">
                    <div className="mb-1">
                      <Badge color={s.color}>{s.label}</Badge>
                    </div>
                    <div className="text-[10.5px] text-arch-text2 leading-relaxed">{s.desc}</div>
                  </div>
                ))}
              </div>

              <SubHeading>The recruiter&apos;s technical focus</SubHeading>
              <div className="text-[11.5px] text-arch-text2 leading-[1.7]">
                Panel &middot; in-person &middot; technical. Emphasis:{" "}
                <strong className="text-arch-text">SQL</strong> — validate data flows &amp; reconcile systems;{" "}
                <strong className="text-arch-text">Data modelling</strong> — entities, relationships, state machines;{" "}
                <strong className="text-arch-text">Python</strong> (lighter);{" "}
                <strong className="text-arch-text">Regulated data handling</strong> — auditability, RBAC.
              </div>
            </div>
          );
        }

        // ── Mental model (full markdown doc) ──────────────────────
        if (activeId === "hoopp-mental-model") {
          return (
            <div>
              <SectionTitle>Interview mental model — daily drill</SectionTitle>
              <SectionDesc>
                The complete prep document: identity sentence, DISP picture, six pillars, SQL muscle memory, pension
                vocabulary, positions, and the 30-minute daily loop. A printable copy lives at{" "}
                <code className="text-arch-teal">HOOPP-INTERVIEW-MENTAL-MODEL.md</code> in the repo root.
              </SectionDesc>
              <Callout color="coral" label="How to drill">
                Read Part 1 every day. Rotate one section of Parts 2–5 per day. Recite Part 6 out loud. By interview
                day, every section header should trigger instant recall of what&apos;s under it.
              </Callout>
              <MarkdownRenderer content={hooppMentalModelMd} />
            </div>
          );
        }

        // ── DISP framing ──────────────────────────────────────────
        if (activeId === "hoopp-disp") {
          return (
            <div>
              <SectionTitle>HOOPP / DISP context</SectionTitle>
              <SectionDesc>
                The framing the whole job description is built around: what the role is, what DISP is, and the
                data-flow vocabulary you&apos;ll be expected to speak fluently.
              </SectionDesc>
              <BranchDiagram
                source={{ label: "React Member Portal", sub: "the UI", color: "blue" }}
                branches={[
                  { label: "Core Pension Systems", sub: "source of truth (live)", color: "purple" },
                  { label: "Cache / Member Store", sub: "fast reads (may be stale)", color: "teal" },
                ]}
                caption="Mental model: DISP is the BFF in the middle — it shapes data for the UI and hides legacy contracts. Portal never talks to core systems directly."
              />
              <div className="text-[11px] text-arch-text3 text-center my-2">
                React Portal → <span className="text-arch-blue font-semibold">DISP (BFF / Orchestration)</span> → Core + Cache
              </div>
              <MatrixDiagram
                headers={["Operation", "Example", "Source of truth", "Freshness"]}
                rows={[
                  { cells: ["Sync read", "profile, entitlements", "core (live)", "immediate"], color: "blue" },
                  { cells: ["Cached read", "reference / config", "cache off core", "may be stale"], color: "teal" },
                  { cells: ["Async / long-run", "projections, calcs", "computed", "eventual"], color: "amber" },
                  { cells: ["Workflow-driven", "beneficiary change", "core + approval", "reconciled"], color: "purple" },
                ]}
                caption="For every operation, know its source of truth + freshness. This table is the answer to 'walk me through your data flows.'"
              />
              <ConceptList cards={dispFraming} accent="blue" />
            </div>
          );
        }

        // ── SQL: core ─────────────────────────────────────────────
        if (activeId === "hoopp-sql-core") {
          return (
            <div>
              <SectionTitle>Core SQL you must know</SectionTitle>
              <SectionDesc>
                The mechanics you need to be fluent in before you can validate a flow or reconcile two systems. This is
                the heaviest-weighted area — be able to write these, not just recognise them.
              </SectionDesc>
              <JoinVenn caption="The join mental model: shaded = rows returned. A LEFT join keeps every left row; an INNER join keeps only matches. Picture this before you write the query." />
              <ConceptList cards={sqlCore} accent="blue" />
            </div>
          );
        }

        // ── SQL: validation ───────────────────────────────────────
        if (activeId === "hoopp-sql-validate") {
          return (
            <div>
              <SectionTitle>Data validation — is the data trustworthy?</SectionTitle>
              <SectionDesc>
                The checks you run to catch data-quality issues and source-system limitations <em>before</em>{" "}
                requirements move into build.
              </SectionDesc>
              <FlowDiagram
                nodes={[
                  { label: "Incoming feed", color: "gray" },
                  { label: "Completeness", sub: "NULLs?", color: "blue" },
                  { label: "Uniqueness", sub: "dupes?", color: "teal" },
                  { label: "Referential", sub: "orphans?", color: "amber" },
                  { label: "Domain", sub: "valid values?", color: "purple" },
                  { label: "Trusted store", color: "green" },
                ]}
                caption="Validation is a gauntlet of gates. Anything that fails a gate is quarantined, not loaded — that's your data-quality gate before build."
              />
              <ConceptList cards={sqlValidation} accent="teal" />
            </div>
          );
        }

        // ── SQL: reconciliation ───────────────────────────────────
        if (activeId === "hoopp-sql-reconcile") {
          return (
            <div>
              <SectionTitle>System reconciliation — do two systems agree?</SectionTitle>
              <SectionDesc>
                The core of &ldquo;validate data flows &amp; reconcile systems.&rdquo; Know the anti-join cold; the
                full-outer diff is the most complete single check.
              </SectionDesc>
              <ReconVenn caption="Reconciliation = these three regions. Anti-join finds the two crescents (missing rows); the full-outer diff finds all three at once, including value mismatches in the overlap." />
              <ConceptList cards={sqlReconciliation} accent="purple" />
            </div>
          );
        }

        // ── Data modelling: concepts ──────────────────────────────
        if (activeId === "hoopp-dm-concepts") {
          return (
            <div>
              <SectionTitle>Entities, keys &amp; relationships</SectionTitle>
              <SectionDesc>
                Second-deepest area. Be crisp on keys (surrogate vs natural), cardinality, and the normalize-then-
                denormalize trade-off between the system of record and the read-side cache.
              </SectionDesc>
              <CardinalityLegend caption="Cardinality = the crow's foot. A single bar means 'one'; the fork means 'many'. M:N always resolves to a junction table holding both foreign keys." />
              <FlowDiagram
                nodes={[
                  { label: "Write model", sub: "normalized (3NF)", color: "blue" },
                  { label: "sync / project", color: "gray" },
                  { label: "Read model", sub: "denormalized, fast", color: "teal" },
                ]}
                caption="Normalize the core for correct writes; denormalize the read-side (BFF store) for fast portal reads. Reconciliation is what keeps the two honest — that's the CQRS trade-off."
              />
              <ConceptList cards={dmEntities} accent="teal" />
            </div>
          );
        }

        // ── Data modelling: ER diagram ────────────────────────────
        if (activeId === "hoopp-dm-er") {
          return (
            <div>
              <SectionTitle>ER diagram — pension domain</SectionTitle>
              <SectionDesc>
                A worked member / beneficiary / pension-account / entitlement / contribution model. Note the surrogate
                PKs, the unique natural keys, the M:N via a junction, and the audit-sensitive fields. Drag to pan,
                Ctrl+scroll to zoom.
              </SectionDesc>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3 mb-3">
                <MermaidDiagram chart={erDiagramMermaid} />
              </div>
              <Callout color="teal" label="In your codebase">
                Same modelling primitives as the JDL domain model you documented — member/account/subscription are just
                entities with keys, attributes, and cardinality.
              </Callout>
            </div>
          );
        }

        // ── Data modelling: state machines ────────────────────────
        if (activeId === "hoopp-dm-state") {
          return (
            <div>
              <SectionTitle>State machines</SectionTitle>
              <SectionDesc>
                For any entity with a lifecycle, model states + allowed transitions + guards. It makes illegal
                transitions un-representable and hands QA the exact negative paths to test.
              </SectionDesc>
              <ConceptList cards={dmState} accent="amber" />
              <SubHeading>Beneficiary-change request lifecycle</SubHeading>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3 mb-3">
                <MermaidDiagram chart={stateMachineMermaid} />
              </div>
            </div>
          );
        }

        // ── Python ────────────────────────────────────────────────
        if (activeId === "hoopp-py") {
          return (
            <div>
              <SectionTitle>Python — validation &amp; reconciliation</SectionTitle>
              <SectionDesc>
                Listed but lighter. Aim to read/write small validation and reconciliation scripts confidently — the
                panel may hand you a CSV rather than a database.
              </SectionDesc>
              <FlowDiagram
                nodes={[
                  { label: "source.csv", color: "blue" },
                  { label: "target.csv", color: "teal" },
                  { label: "merge(how='outer', indicator=True)", sub: "pandas", color: "amber" },
                  { label: "3 buckets", sub: "left_only / both / right_only", color: "purple" },
                ]}
                caption="pandas merge(how='outer', indicator=True) IS the reconciliation Venn in code — the _merge column tags each row's region."
              />
              <ConceptList cards={pythonConcepts} accent="amber" />
            </div>
          );
        }

        // ── Regulated data: audit ─────────────────────────────────
        if (activeId === "hoopp-audit") {
          return (
            <div>
              <SectionTitle>Auditability</SectionTitle>
              <SectionDesc>
                In a regulated pension platform, history is sacred. Append-only, immutable, reconstructable — for both
                runtime data and the requirement chain.
              </SectionDesc>
              <FlowDiagram
                nodes={[
                  { label: "Change commands", sub: "create / approve", color: "blue" },
                  { label: "Append-only log", sub: "immutable = truth", color: "coral" },
                  { label: "Current state", sub: "a projection", color: "teal" },
                ]}
                caption="The audit mental model: the append-only log is the truth; current state is just a projection off it. Never UPDATE/DELETE the log — replay it. Capture who/when/before/after."
              />
              <ConceptList cards={auditConcepts} accent="coral" />
            </div>
          );
        }

        // ── Regulated data: RBAC ──────────────────────────────────
        if (activeId === "hoopp-rbac") {
          return (
            <div>
              <SectionTitle>RBAC &amp; PII protection</SectionTitle>
              <SectionDesc>
                How member data is secured, validated, audited, and exposed safely through a digital channel — pushed
                down to the data/API layer, not left to the UI.
              </SectionDesc>
              <StackDiagram
                layers={[
                  { label: "User", sub: "a person / service", color: "gray" },
                  { label: "Role", sub: "member · CSR · admin", color: "blue" },
                  { label: "Permissions", sub: "least privilege", color: "purple" },
                  { label: "Row + column filter", sub: "own data only · mask PII", color: "teal" },
                  { label: "Data", sub: "encrypted at rest / in transit", color: "green" },
                ]}
                caption="RBAC is layered: users get roles, roles carry permissions, and the data layer still filters rows and masks columns. Never rely on the UI to hide what the API returns."
              />
              <ConceptList cards={rbacConcepts} accent="purple" />
            </div>
          );
        }

        // ── Mock questions (SQL / DM / API / Python) ──────────────
        {
          const group = questionGroups.find((g) => g.id === activeId);
          if (group) {
            return (
              <div>
                <Callout color={group.color} label="How to use these">
                  Each card is a question the panel could ask, what they&apos;re really assessing, a model answer, and the
                  code that earns points. Cover the answer, attempt it out loud, then check yourself — don&apos;t just read.
                </Callout>
                <QuestionGroupView group={group} />
              </div>
            );
          }
        }

        // ── Rapid-fire concept checks ─────────────────────────────
        if (activeId === "hoopp-q-rapid") {
          return (
            <div>
              <SectionTitle>Rapid-fire concept checks</SectionTitle>
              <SectionDesc>
                One-line questions with one-line answers — the &ldquo;can you say it fast and correctly?&rdquo; layer.
                Read the question, answer in your head, then reveal. Great for the final pass on interview morning.
              </SectionDesc>
              <div className="grid grid-cols-1 gap-2">
                {quickChecks.map((c, i) => (
                  <div
                    key={i}
                    className="bg-arch-bg2 border border-arch-border rounded-lg p-3"
                    style={{ borderLeft: `3px solid var(--arch-${c.color})` }}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <Badge color={c.color}>Q</Badge>
                      <div className="text-[12px] font-semibold text-arch-text leading-snug">{c.q}</div>
                    </div>
                    <div className="text-[11px] text-arch-text2 leading-[1.6] pl-0.5">{c.a}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Panel talking points ──────────────────────────────────
        if (activeId === "hoopp-panel") {
          return (
            <div>
              <SectionTitle>Panel talking points</SectionTitle>
              <SectionDesc>
                Concise &ldquo;how to answer&rdquo; framings for the scenario/behavioural side — challenging
                assumptions, surfacing data risk, translating rules. Not scripts; skeletons you fill with your own
                examples.
              </SectionDesc>
              <FlowDiagram
                nodes={[
                  { label: "Ambiguity", sub: "spotted early", color: "coral" },
                  { label: "Interpretations", sub: "name the options", color: "amber" },
                  { label: "Impact", sub: "data / downstream", color: "blue" },
                  { label: "Decision", sub: "recorded, traceable", color: "green" },
                ]}
                caption="Your reusable answer skeleton: surface ambiguity → lay out interpretations → show impact → drive a recorded decision. It works for almost every scenario prompt."
              />
              {panelPoints.map((tp) => (
                <div key={tp.id} className="bg-arch-bg2 border border-arch-border rounded-lg p-4 mb-3.5" style={{ borderLeft: "3px solid var(--arch-green)" }}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="shrink-0 mt-0.5 text-[10px] font-semibold text-arch-green uppercase tracking-wider">Q</span>
                    <div className="text-[12.5px] font-semibold text-arch-text leading-snug">{tp.prompt}</div>
                  </div>
                  <div className="text-[11.5px] text-arch-text2 leading-[1.7]">{tp.approach}</div>
                </div>
              ))}
            </div>
          );
        }

        // ── Practice platforms ────────────────────────────────────
        if (activeId === "hoopp-practice") {
          return (
            <div>
              <SectionTitle>Practice platforms</SectionTitle>
              <SectionDesc>
                Hands-on sites to drill each area. Do more than read — write the queries. Suggested order at the bottom.
              </SectionDesc>
              <div className="grid grid-cols-1 gap-2 mb-4">
                {practicePlatforms.map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-arch-bg2 border border-arch-border rounded-lg p-3 hover:border-arch-border2 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12.5px] font-semibold text-arch-blue">{p.name}</span>
                      <Badge color={p.focus}>{p.focusLabel}</Badge>
                      <span className="ml-auto text-[9.5px] text-arch-text3 uppercase tracking-wider">{p.free}</span>
                    </div>
                    <div className="text-[11px] text-arch-text2 leading-relaxed">{p.use}</div>
                  </a>
                ))}
              </div>

              <SubHeading>Suggested study order</SubHeading>
              <ol className="space-y-2">
                {studyOrder.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-arch-coral/15 text-arch-coral text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[11.5px] text-arch-text2 leading-[1.6]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        return null;
      }}
    </SectionLayout>
  );
}
