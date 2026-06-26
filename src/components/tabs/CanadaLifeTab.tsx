"use client";

import React from "react";
import SectionLayout from "@/components/ui/SectionLayout";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import {
  systemContextDiagram,
  integrationPatterns,
  systemsOfRecord,
  latencyBudget,
  requirementsReview,
  userStories,
  jdlDomainModel,
} from "@/data/bsa-cheatsheet";

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const sidebarItems = [
  { id: "cl-brief", label: "30-Second Self-Brief" },
  { id: "cl-logistics", label: "Logistics" },
];

const sidebarGroups = [
  {
    label: "Company & Role",
    items: [
      { id: "cl-company", label: "Canada Life — research" },
      { id: "cl-role", label: "The role & why it matters" },
    ],
  },
  {
    label: "This Role — the JD",
    items: [
      { id: "cl-jd", label: "JD at a glance" },
      { id: "cl-jdmap", label: "JD → your evidence" },
      { id: "cl-senior", label: "Senior-level signals" },
      { id: "cl-clearance", label: "Reliability Status" },
    ],
  },
  {
    label: "Your Narrative",
    items: [
      { id: "cl-opener", label: "2-minute opener" },
      { id: "cl-titlegap", label: "Title-gap recovery" },
      { id: "cl-whyleave", label: "Why leaving Bell" },
      { id: "cl-cpa", label: "CPA = differentiator" },
    ],
  },
  {
    label: "Platform Deep-Dive (go-repo)",
    items: [
      { id: "cl-map", label: "Platform map & services" },
      { id: "cl-reqq", label: "Requirements Q&A + review" },
      { id: "cl-e2e", label: "End-to-end order flow" },
      { id: "cl-cqrs", label: "Write vs read (CQRS)" },
      { id: "cl-adapter", label: "Merchant adapter pattern" },
      { id: "cl-saga", label: "flow-runner-api saga" },
      { id: "cl-state", label: "Subscription & order states" },
      { id: "cl-events", label: "Kafka events" },
      { id: "cl-data", label: "Data stores & SOR" },
      { id: "cl-auth", label: "Auth & tokenization" },
      { id: "cl-audit", label: "audit-api (compliance)" },
      { id: "cl-datamap", label: "Field-level data mapping" },
      { id: "cl-jdl", label: "JDL & domain modelling" },
      { id: "cl-patterns", label: "Integration patterns" },
    ],
  },
  {
    label: "BSA Practice",
    items: [
      { id: "cl-bsarole", label: "What a BSA does" },
      { id: "cl-ac", label: "Acceptance criteria" },
      { id: "cl-delivery", label: "Stories · grooming · review" },
      { id: "cl-tools", label: "Tools & why" },
      { id: "cl-situational", label: "How I handle X" },
    ],
  },
  {
    label: "Domain Knowledge",
    items: [
      { id: "cl-benefits", label: "Group benefits structure" },
      { id: "cl-apis", label: "Where APIs live" },
      { id: "cl-integrity", label: "Why data integrity matters" },
    ],
  },
  {
    label: "Regulatory",
    items: [{ id: "cl-reg", label: "Compliance constraints" }],
  },
  {
    label: "Behavioural (go-repo grounded)",
    items: [{ id: "cl-behaviour", label: "Q → real example map" }],
  },
  {
    label: "Panel & Closeout",
    items: [
      { id: "cl-panel", label: "Questions to ask" },
      { id: "cl-curveballs", label: "Curveballs → one-liners" },
      { id: "cl-checklist", label: "Final checklist" },
    ],
  },
];

// ─── Real diagrams (authored from the go-repo) ───────────────────────────────

const dgE2E = `sequenceDiagram
  participant UI as Subscription Manager MFE
  participant ORD as order-api
  participant CFG as configurator-api
  participant CAT as product-catalog-api
  participant RES as reseller-service
  participant MER as merchant adapter
  participant K as Kafka
  participant AUD as audit-api
  UI->>ORD: POST /order {sessionId, parameters}
  ORD->>CFG: ConvertToOrder(sessionId, correlationId)
  CFG-->>ORD: orderId, subscribers, session items
  ORD->>CAT: get product offerings + promotions
  CAT-->>ORD: promotionSpec
  Note over ORD,RES: fulfillment runs async
  ORD->>RES: fulfillmentFlow(...)
  RES->>MER: provision entitlement
  MER-->>RES: externalId / entitlement
  RES->>K: publish SubscriptionActivatedType (topic subscription-fulfillment)
  RES->>AUD: POST /v1/audit ORDER_PLACED
  ORD-->>UI: 200 OK {subscriberId, subscriptions=PENDING, confirmationNumber}`;

const dgAdapter = `flowchart TD
  RES["reseller-service<br/>routes by providerId"] --> IF{{"CatalogClientInterface"}}
  IF --> D["reseller-service-disney"]
  IF --> B["reseller-service-bellmedia"]
  IF --> G["base reseller-service<br/>Bango via BANGO_INTEGRATION flag"]
  D --> DX["Disney auth + entitlement API"]
  B --> BX["Bell Media API"]
  G --> GX["Bango platform"]`;

const dgSubState = `stateDiagram-v2
  [*] --> NEW
  NEW --> PENDING: INITIALIZE / CREATE
  NEW --> ACTIVE: ACTIVATE
  NEW --> REVOKED: REVOKE
  PENDING --> ACTIVE: ACTIVATE
  PENDING --> PENDING: CREATE
  PENDING --> REVOKED: REVOKE
  ACTIVE --> ACTIVE: ACTIVATE
  ACTIVE --> SUSPENDED: SUSPEND
  ACTIVE --> REVOKED: REVOKE
  SUSPENDED --> ACTIVE: RESUME
  REVOKED --> [*]`;

const dgOrderState = `stateDiagram-v2
  [*] --> PENDING
  PENDING --> COMPLETED: success
  PENDING --> FAILED: merchant reject / timeout
  FAILED --> REVERSED: reversal
  COMPLETED --> REVERSED: reversal
  REVERSED --> [*]`;

const dgBenefits = `flowchart TD
  PS["Plan Sponsor — employer<br/>holds the contract"] --> CON["Group Contract"]
  CON --> MEM["Members — employees"]
  MEM --> DEP["Dependants"]
  MEM --> CL["Incurs eligible expense"]
  CL --> ADJ["Adjudication engine<br/>plan rules decide covered & paid"]`;

const dgApis = `flowchart LR
  P["Member Portal"] -->|API| ADJ["Adjudication"]
  ADJ -->|API| ADM["Plan Administration"]
  ADM -->|API| PAY["Payment"]
  ADJ -. "claims experience" .-> PR["Renewal Pricing"]
  PR -. "sets next year premium" .-> PS["Plan Sponsor"]`;

// ─── Real Go snippets (from the go-repo) ─────────────────────────────────────

const codeFlowExecutor = `// flow-runner-api — saga with reverse-order compensation
func (e *FlowExecutor) Execute(ctx context.Context, flow *Flow) error {
    for i, step := range flow.Steps {
        flow.CurrentStep = i
        e.saveState(ctx, flow)                 // checkpoint in DynamoDB
        if err := step.Execute(ctx); err != nil {
            flow.Status = StatusFailed
            e.saveState(ctx, flow)
            return e.compensate(ctx, flow, i)  // roll back what already ran
        }
        step.Status = StepCompleted
    }
    flow.Status = StatusCompleted
    return e.saveState(ctx, flow)
}

func (e *FlowExecutor) compensate(ctx context.Context, flow *Flow, failedAt int) error {
    flow.Status = StatusCompensating
    for i := failedAt - 1; i >= 0; i-- {       // reverse order
        if flow.Steps[i].Compensate != nil {
            flow.Steps[i].Compensate(ctx)
        }
    }
    return nil
}`;

const codeStateTransition = `// model/subscription-core-process/statusManage.go
var StateTransition = StateActionManagement{
    NEW:       { INITIALIZE: {PENDING}, CREATE: {PENDING}, ACTIVATE: {ACTIVE}, REVOKE: {REVOKED} },
    PENDING:   { CREATE: {PENDING}, ACTIVATE: {ACTIVE}, REVOKE: {REVOKED} },
    ACTIVE:    { ACTIVATE: {ACTIVE}, REVOKE: {REVOKED}, SUSPEND: {SUSPENDED} },
    SUSPENDED: { RESUME: {ACTIVE} },
}
// An action that isn't in the map for the current status is rejected —
// the state machine is the guardrail, enforced before any write.`;

const codeAudit = `// audit-api — append-only; no Update or Delete methods exist
func (r *AuditRepo) Write(ctx context.Context, e AuditEntry) error {
    _, err := r.db.ExecContext(ctx, ` + "`" + `
        INSERT INTO audit_entries (
            id, event_type, subscription_id, order_id,
            account_number, agent_id, original_order_number,
            details, source_service, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)` + "`" + `, ...)
    return err
}`;

const codeCpm = `// household-api / aggregator — graceful degradation on CPM timeout
cpmData, cpmErr := s.cpmClient.GetSubscriberInfo(ctx, tvAccountNumber)
partial := cpmErr != nil
// ...subscriptions from PostgreSQL still returned; CPM enrichment skipped...
return &SubscriptionListResponse{
    Subscriptions: merged,
    Partial:       partial,   // <- the requirement: never fail the whole page
    TotalCount:    len(merged),
}, nil`;

// ─── Presentational helpers ──────────────────────────────────────────────────

function H({ children }: { children: React.ReactNode }) {
  return <div className="text-base font-semibold text-arch-text mb-1">{children}</div>;
}
function Desc({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] text-arch-text2 mb-4 leading-relaxed">{children}</div>;
}
function Sub({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] font-semibold text-arch-text mt-5 mb-2">{children}</div>;
}
function Code({ children }: { children: React.ReactNode }) {
  return <code className="text-[10.5px] px-1 py-0.5 rounded bg-arch-bg3 text-arch-teal">{children}</code>;
}
function Path({ children }: { children: React.ReactNode }) {
  return <code className="text-[10px] px-1 py-0.5 rounded bg-arch-bg3 text-arch-amber">{children}</code>;
}

/** Two-line proof cell: a short lead claim + a plain-English explanation. */
function Proof({ lead, children }: { lead: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11.5px] font-medium text-arch-text">{lead}</div>
      <div className="text-[11px] text-arch-text3 mt-0.5 leading-relaxed">{children}</div>
    </div>
  );
}

function Badge({ color = "blue", children }: { color?: string; children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{
        color: `var(--arch-${color})`,
        background: `color-mix(in srgb, var(--arch-${color}) 15%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

function Card({ children, accent, className = "" }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <div
      className={`bg-arch-bg2 border border-arch-border rounded-lg p-4 ${className}`}
      style={accent ? { borderLeft: `3px solid var(--arch-${accent})` } : undefined}
    >
      {children}
    </div>
  );
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

function SayThis({ children }: { children: React.ReactNode }) {
  return (
    <blockquote
      className="rounded-lg p-3.5 my-3 text-[12.5px] leading-[1.7] italic"
      style={{ background: "var(--arch-bg3)", borderLeft: "3px solid var(--arch-teal)", color: "var(--arch-text)" }}
    >
      {children}
    </blockquote>
  );
}

function Diagram({ chart, caption }: { chart: string; caption?: string }) {
  return (
    <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3 my-3">
      <MermaidDiagram chart={chart} />
      {caption && <div className="text-[10.5px] text-arch-text3 mt-2 text-center italic">{caption}</div>}
    </div>
  );
}

function CodeBlock({ children, caption }: { children: string; caption?: string }) {
  return (
    <div className="my-3">
      <pre className="bg-arch-bg3 border border-arch-border rounded-lg p-3 overflow-x-auto text-[10.5px] leading-[1.5] text-arch-text2">
        <code>{children}</code>
      </pre>
      {caption && <div className="text-[10.5px] text-arch-text3 mt-1 italic">{caption}</div>}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <table className="w-full border-collapse text-[11.5px] my-3">
      <thead>
        <tr>
          {headers.map((h) => (
            <th
              key={h}
              className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className="px-2.5 py-2 border-b border-arch-border text-arch-text2 align-top">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function CanadaLifeTab() {
  return (
    <SectionLayout label="Start Here" items={sidebarItems} groups={sidebarGroups}>
      {(activeId) => {
        // ── 30-Second Self-Brief ──────────────────────────────────
        if (activeId === "cl-brief") {
          return (
            <div>
              <H>🎯 Canada Life — Senior IT BSA Cheat Sheet</H>
              <Desc>
                Role: <strong className="text-arch-text">Senior IT Business Systems Analyst</strong> · Team:{" "}
                <strong className="text-arch-text">API Integration</strong> · Domain:{" "}
                <strong className="text-arch-text">Workplace Benefits &amp; Retirement</strong>
              </Desc>
              <Callout color="teal" label="The one-line frame">
                &ldquo;I own building the right thing before any development work commences — and I do it in a financial,
                regulated domain where my CPA background pays off as much as the BSA discipline.&rdquo;
              </Callout>

              <Sub>Who you are</Sub>
              <Card accent="blue">
                <div className="text-[12px] text-arch-text2 leading-relaxed">
                  One foot in software, one in finance. BSA on Bell&apos;s subscription platform — a real{" "}
                  <strong className="text-arch-text">~29-service Go monorepo</strong> integrating Netflix, Disney+, Bell Media,
                  Bango & Radio-Canada — <strong className="text-arch-text">+</strong> a CPA who handled Protected B data at the CRA.
                </div>
              </Card>

              <Sub>The three things you MUST land</Sub>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { n: "1", t: "Your deliverables are BSA deliverables", c: "blue" },
                  { n: "2", t: "The domain is financial & regulated = home turf", c: "purple" },
                  { n: "3", t: "You get contracts right at the foundational layer", c: "teal" },
                ].map((x) => (
                  <Card key={x.n} accent={x.c}>
                    <div className="text-[20px] font-bold mb-1" style={{ color: `var(--arch-${x.c})` }}>
                      {x.n}
                    </div>
                    <div className="text-[11.5px] text-arch-text2 leading-snug">{x.t}</div>
                  </Card>
                ))}
              </div>

              <Sub>Three anchor phrases — drop them repeatedly</Sub>
              <div className="space-y-2">
                {[
                  "before any development work commenced",
                  "I produced the data mapping between the front-end and the back-end",
                  "the dev team built directly against it",
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span
                      className="shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: "color-mix(in srgb, var(--arch-amber) 18%, transparent)", color: "var(--arch-amber)" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[12.5px] italic text-arch-text">&ldquo;{p}&rdquo;</span>
                  </div>
                ))}
              </div>
              <Callout color="amber" label="New in this version">
                Every technical example below is grounded in the actual <Code>go-repo</Code> — real service names, file paths,
                state machines, and Kafka events. The Platform Deep-Dive is your credibility ammo.
              </Callout>
            </div>
          );
        }

        // ── Logistics ─────────────────────────────────────────────
        if (activeId === "cl-logistics") {
          return (
            <div>
              <H>Logistics — get these out of the way cleanly</H>
              <Desc>Confirm cleanly and move on. Don&apos;t over-explain.</Desc>
              <Table
                headers={["Item", "Your answer"]}
                rows={[
                  ["Work status", <span key="1"><strong className="text-arch-text">Permanent resident</strong> — no sponsorship needed</span>],
                  ["Notice period", "Two weeks"],
                  ["Hybrid (3 days, Toronto)", "Yes, no concerns"],
                  ["Reliability Status / clearance", "Comfortable — already held a clearance at the CRA handling Protected B data"],
                  ["Ramp time", <span key="2">Productive in <strong className="text-arch-text">60–90 days</strong></span>],
                ]}
              />
            </div>
          );
        }

        // ── Company research ──────────────────────────────────────
        if (activeId === "cl-company") {
          return (
            <div>
              <H>Canada Life — research talking points</H>
              <Desc>Verify these are current the morning of — transformation details and exec names change.</Desc>
              <div className="space-y-2.5">
                <Card accent="green">
                  <Badge color="green">Regulated</Badge>
                  <div className="text-[12px] text-arch-text2 leading-relaxed mt-2">
                    <strong className="text-arch-text">Federally regulated insurer</strong> → OSFI oversight, auditability is
                    non-negotiable.
                  </div>
                </Card>
                <Card accent="amber">
                  <Badge color="amber">Transformation</Badge>
                  <div className="text-[12px] text-arch-text2 leading-relaxed mt-2">
                    Live moment: new <strong className="text-arch-text">CDO mandate</strong>, the{" "}
                    <strong className="text-arch-text">TCS partnership</strong>, a serious <strong className="text-arch-text">hiring push</strong>.
                    → The requirements & integration practice is being actively built out; a senior BSA can shape how it matures.
                  </div>
                </Card>
                <Card accent="purple">
                  <Badge color="purple">Org</Badge>
                  <div className="text-[12px] text-arch-text2 leading-relaxed mt-2">
                    <strong className="text-arch-text">Julia McGillis</strong> joined as EVP in 2025 — use as a &ldquo;homework
                    signal&rdquo; question only if rapport is good.
                  </div>
                </Card>
                <Card accent="blue">
                  <Badge color="blue">Stakes</Badge>
                  <div className="text-[12px] text-arch-text2 leading-relaxed mt-2">
                    Workplace Benefits & Retirement: the data is <strong className="text-arch-text">plan members&apos; retirement
                    savings</strong>. Data integrity is financial, not cosmetic.
                  </div>
                </Card>
              </div>
            </div>
          );
        }

        // ── The role & why it matters ─────────────────────────────
        if (activeId === "cl-role") {
          return (
            <div>
              <H>The role & why it matters</H>
              <Desc>
                The API Integration team builds the foundation the whole digital member experience sits on. Every handoff between
                systems is a data contract — and an error at that layer doesn&apos;t stay local.
              </Desc>
              <Callout color="blue" label="Say this">
                &ldquo;Getting those contracts right is the highest-leverage place I can work, because an error at that layer
                doesn&apos;t stay local — it ripples across millions of member accounts and compounds. On Bell&apos;s platform I do
                exactly that: I own the contract between the front-end and ~29 Go services before anyone writes code.&rdquo;
              </Callout>
            </div>
          );
        }

        // ── 2-minute opener ───────────────────────────────────────
        if (activeId === "cl-opener") {
          return (
            <div>
              <H>The 2-minute opener</H>
              <Desc>&ldquo;Walk us through your background and what brings you to this role.&rdquo;</Desc>
              <SayThis>
                I sit at the intersection of two disciplines that don&apos;t usually meet in one person. On the{" "}
                <strong>software side</strong>, I work on Bell&apos;s subscription-management platform — a microfrontend front-end
                over a Go microservices backend spanning ~29 services and five external providers — where I own the requirements:
                data-mapping documents, acceptance criteria, state machines, and the API contracts the dev team builds against.
                <br />
                <br />
                On the <strong>finance side</strong>, I&apos;m a CPA, and I spent time in banking and at the CRA handling Protected
                B data. So I don&apos;t read financial regulation as a compliance checkbox — I read it as a business constraint that
                shapes how the product has to behave.
                <br />
                <br />
                What brings me here is that <strong>Workplace Benefits & Retirement</strong> is exactly where those two halves
                combine. It&apos;s a financial, regulated domain where the data is plan members&apos; retirement savings, and the
                work is getting API contracts right at the foundational layer. That&apos;s the work I already do — I just want to do
                it where the domain rewards the finance background as much as the BSA discipline.
              </SayThis>
            </div>
          );
        }

        // ── Title-gap recovery ────────────────────────────────────
        if (activeId === "cl-titlegap") {
          return (
            <div>
              <H>Title-gap recovery</H>
              <Desc>Your resume says &ldquo;Software / Front-End Engineer&rdquo; but this is a BSA role.</Desc>
              <Callout color="coral" label="The line">
                &ldquo;The title reflects how I entered Bell — through the graduate engineering program — not what I&apos;ve been
                doing. Judge it by the deliverables.&rdquo;
              </Callout>
              <Sub>The proof — deliverables ARE BSA deliverables (all from the go-repo)</Sub>
              <Table
                headers={["Artifact", "Concrete example in the platform"]}
                rows={[
                  ["API contract", <span key="1"><Code>order-api</Code> POST /order, <Code>session-api</Code>, <Code>subscriptions-aggregator-api</Code></span>],
                  ["Data-mapping doc", "UI field → GraphQL/REST → Go field → PostgreSQL/DynamoDB column"],
                  ["State machine", <span key="2">subscription lifecycle in <Path>statusManage.go</Path>; order lifecycle in <Code>order-api</Code></span>],
                  ["Acceptance criteria", "per story, incl. failure paths (CPM timeout → partial response)"],
                ]}
              />
              <Callout color="blue">&ldquo;The title undersells it; the artifacts are the real evidence.&rdquo;</Callout>
            </div>
          );
        }

        // ── Why leaving Bell ──────────────────────────────────────
        if (activeId === "cl-whyleave") {
          return (
            <div>
              <H>Why leaving Bell</H>
              <Callout color="red" label="Never">
                Never bash Bell. Never lead with layoffs — that&apos;s your private calculus, not your answer.
              </Callout>
              <Desc>Keep it forward-looking. Two pulls:</Desc>
              <div className="grid grid-cols-2 gap-2">
                <Card accent="blue">
                  <Badge color="blue">Role alignment</Badge>
                  <div className="text-[12px] text-arch-text2 leading-relaxed mt-2">
                    Want the work recognised as BSA work, on a team built around requirements & integration.
                  </div>
                </Card>
                <Card accent="purple">
                  <Badge color="purple">Domain alignment</Badge>
                  <div className="text-[12px] text-arch-text2 leading-relaxed mt-2">
                    CPA + regulated finance applied where it shapes the product.
                  </div>
                </Card>
              </div>
              <Callout color="teal">
                &ldquo;Bell&apos;s domain is telecom subscriptions; the discipline transfers, but the domain fit is much stronger
                here.&rdquo;
              </Callout>
            </div>
          );
        }

        // ── CPA differentiator ────────────────────────────────────
        if (activeId === "cl-cpa") {
          return (
            <div>
              <H>CPA = differentiator, not detour</H>
              <Callout color="blue" label="Say this">
                &ldquo;I&apos;m not looking to do accounting. The CPA lets me read financial regulation as a business constraint that
                shapes product design — trace a rule into what the API actually has to do: the validation, the audit trail, the
                failure path.&rdquo;
              </Callout>
              <div className="text-[12px] text-arch-text2 leading-relaxed mt-2">
                Here the data is <strong className="text-arch-text">plan members&apos; retirement savings</strong> → a BSA who
                understands <em>why</em> the regulation exists writes tighter contracts. On Bell I already designed an{" "}
                <strong className="text-arch-text">immutable, append-only audit log</strong> (<Code>audit-api</Code>) — that
                instinct comes straight from the CRA work.
              </div>
            </div>
          );
        }

        // ════════════════ THIS ROLE — THE JD ════════════════

        // ── JD at a glance ────────────────────────────────────────
        if (activeId === "cl-jd") {
          return (
            <div>
              <H>This role — the JD at a glance</H>
              <Desc>
                &ldquo;Lead the analysis of business problems and develop requirements, API Product specifications, and contribute to
                product design.&rdquo; Every responsibility below maps to something you&apos;ve actually built.
              </Desc>
              <Sub>What you&apos;ll do (9 responsibilities)</Sub>
              <div className="space-y-1.5">
                {[
                  ["Document all Q&A to understand integration requirements", "Integration Q&A log"],
                  ["Review understood requirements before solution design", "Requirements review gate"],
                  ["Create data-mapping docs (API ↔ front-end / back-end)", "UI → API → Go → DB"],
                  ["Contribute to OpenAPI specs and JDL files", "Contract-first + JDL"],
                  ["Create southbound orchestration specs", "flow-runner saga"],
                  ["Document acceptance criteria for each story", "Given / When / Then"],
                  ["Create development stories and tasks", "As-a / I-want / so-that"],
                  ["Lead story grooming and story pointing", "You run the room"],
                  ["Review completed work vs requirements", "Post-delivery review"],
                ].map(([d, e], i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span style={{ color: "var(--arch-green)" }}>✓</span>
                    <span className="text-[12px] text-arch-text2 flex-1">{d}</span>
                    <Badge color="green">{e}</Badge>
                  </div>
                ))}
              </div>
              <Callout color="amber" label="Two you should NOT downplay">
                <strong>JDL files</strong> and the <strong>Q&A / pre-design review</strong> are explicit deliverables in this JD —
                speak to both (see their sections). Don&apos;t wave JDL off as &ldquo;just notation.&rdquo;
              </Callout>
            </div>
          );
        }

        // ── JD → evidence map ─────────────────────────────────────
        if (activeId === "cl-jdmap") {
          return (
            <div>
              <H>JD → your evidence map</H>
              <Desc>For any &ldquo;tell me about your experience with X&rdquo;, point at the concrete artifact. This is your interview index.</Desc>
              <Sub>What you&apos;ll do</Sub>
              <Table
                headers={["JD responsibility", "Your proof — in plain terms"]}
                rows={[
                  ["Document integration Q&A", <Proof key="1" lead="An open-questions log before design">Before anyone designs, I list every unanswered question about how two systems should talk — which system owns this field, what happens if it times out, how we stop duplicate orders — and chase each one to a signed-off answer.</Proof>],
                  ["Review requirements pre-design", <Proof key="2" lead="Stakeholders agree before any code">For each component I write the business problem plus a numbered list of requirements (R1, R2…), then walk stakeholders through it so everyone agrees what we&apos;re building first.</Proof>],
                  ["Data-mapping docs", <Proof key="3" lead="Trace every field end-to-end">I follow each field from the screen, through the API, into the Go service, down to the exact database column — so front-end and back-end can&apos;t disagree about what a field means.</Proof>],
                  ["OpenAPI + JDL", <Proof key="4" lead="Write the contract first">I define the API in OpenAPI/proto and the data shapes in JDL (entities + enums) up front, so the spec is the single source of truth the code is built from.</Proof>],
                  ["Southbound orchestration specs", <Proof key="5" lead="Multi-step flows — and how to undo them">For a flow that calls several downstream systems, I spell out each step, what triggers it, and what to roll back if a later step fails (the saga / compensation).</Proof>],
                  ["Acceptance criteria per story", <Proof key="6" lead="Concrete pass/fail, incl. the unhappy paths">Each story gets clear Given/When/Then rules covering not just success but timeouts, empty values and errors — so &ldquo;done&rdquo; is unambiguous.</Proof>],
                  ["Dev stories & tasks", <Proof key="7" lead="Stories devs can build straight from">I write &ldquo;As a… I want… so that…&rdquo; stories with the acceptance criteria attached, broken into tasks the team can pick up.</Proof>],
                  ["Lead grooming & pointing", <Proof key="8" lead="I run the refinement session">I walk the team through the stories, surface hidden assumptions and dependencies, and size the work alongside the engineers.</Proof>],
                  ["Review completed work", <Proof key="9" lead="Check the build against the same AC">When it&apos;s built I test it back against the acceptance criteria I wrote, line by line, and raise any gap as a defect tied to the exact criterion.</Proof>],
                ]}
              />
              <Sub>What you&apos;ll bring</Sub>
              <Table
                headers={["JD requirement", "Your proof — in plain terms"]}
                rows={[
                  ["5+ yrs, large complex org", <Proof key="1" lead="5+ years in big, regulated organisations">Bell&apos;s subscription platform (~29 connected services), plus earlier banking and CRA work, and a CPA. I&apos;m used to large, complex, rule-heavy environments — not small simple ones.</Proof>],
                  ["Agile team", <Proof key="2" lead="I work in sprints, every day">Two-week sprints: I groom and point stories with developers and deliver in small increments. Agile is how I work, not a buzzword.</Proof>],
                  ["Stakeholder relationships across geographies / functions", <Proof key="3" lead="I get people who disagree to one answer">Marketing, product and billing each wanted a retired product to behave differently — I drove them to one agreed definition. I also got separate provider teams (Disney, Bell Media) to build to one shared contract instead of many.</Proof>],
                  ["Communicate to tech AND business", <Proof key="4" lead="I translate both ways">Precise contracts and data maps for developers; the same idea drawn as a simple diagram in plain words for business, so a non-technical person can read it and sign off.</Proof>],
                  ["Self-starter in ambiguity", <Proof key="5" lead="I create clarity where there&apos;s none">Given an undocumented system, I work out what it actually does, write it down, and turn it into the spec everyone then builds from.</Proof>],
                  ["Value simplicity, challenge constraints", <Proof key="6" lead="Ship the simple 80% first">I push for the smallest thing that delivers most of the value, and when something&apos;s blocked I offer a smaller, phased alternative instead of just accepting &ldquo;no.&rdquo;</Proof>],
                  ["Several integration patterns + deliverables", <Proof key="7" lead="I know how systems talk — and can prove it">I can name and use the common patterns — Saga (multi-step with rollback), Adapter (one interface for many providers), CQRS (separate read/write), Circuit Breaker, Dead-Letter Queue, Anti-Corruption Layer — and point to where each lives in the real code.</Proof>],
                  ["Domain Modelling", <Proof key="8" lead="Model the business in plain language first">The nouns become entities (Subscription, Order), the verbs become the relationships. The model is written before code, and the build follows it.</Proof>],
                  ["Reliability Status clearance", <Proof key="9" lead="I&apos;ve already held this exact clearance">At the CRA I held a Reliability Status handling Protected B data — so it&apos;s no delay and no risk on my side.</Proof>],
                ]}
              />
            </div>
          );
        }

        // ── Senior signals ────────────────────────────────────────
        if (activeId === "cl-senior") {
          return (
            <div>
              <H>Senior-level signals (don&apos;t answer like a junior)</H>
              <Desc>
                The JD: the senior BSA &ldquo;champions and contributes to analysis standards, tools, processes and best
                practices&rdquo; and &ldquo;supports delivery teams by sharing skills and mentoring.&rdquo; Have a concrete answer
                for each.
              </Desc>
              <div className="space-y-2">
                {[
                  { t: "Standards", c: "blue", d: "Turned post-delivery review into a repeatable standard; made failure-paths a mandatory part of every AC; made the adapter contract a reusable merchant-onboarding template." },
                  { t: "Tools & processes", c: "teal", d: "Data-mapping doc template, integration Q&A log, contract-first (OpenAPI / JDL) so the spec drives the build." },
                  { t: "Mentoring / sharing skills", c: "purple", d: "Onboard devs with the spec, not code; pair on writing testable AC; review juniors' data maps against the source of truth." },
                  { t: "Leading complex work", c: "green", d: "Led the order→fulfillment integration spec end-to-end across order-api, configurator, reseller-service and the merchant adapters." },
                ].map((x) => (
                  <Card key={x.t} accent={x.c}>
                    <Badge color={x.c}>{x.t}</Badge>
                    <div className="text-[11.5px] text-arch-text2 leading-relaxed mt-2">{x.d}</div>
                  </Card>
                ))}
              </div>
              <Callout color="amber" label="Likely question">
                &ldquo;How have you raised the standard of analysis on a team?&rdquo; → lead with the repeatable review standard + the
                AC template, then the merchant-onboarding template as a reusable process.
              </Callout>
            </div>
          );
        }

        // ── Reliability Status ────────────────────────────────────
        if (activeId === "cl-clearance") {
          return (
            <div>
              <H>Reliability Status — your quiet edge</H>
              <Desc>
                A condition of employment, completed after an offer, at Canada Life&apos;s cost. It grants access to Protected B
                information. The key fact: you&apos;ve already held one.
              </Desc>
              <Table
                headers={["What the JD says", "Your position"]}
                rows={[
                  ["Required as a condition of employment", "No objection — happy to proceed"],
                  ["Completed only after an offer", "Understood; nothing to do now"],
                  ["Cost covered by Canada Life", "Noted"],
                  ["Grants access to Protected B", "I held a clearance at the CRA handling Protected B data"],
                ]}
              />
              <Callout color="green" label="Say this (once, confidently)">
                &ldquo;I&apos;ve already operated under a Reliability Status handling Protected B data at the CRA, so the clearance and
                the data-handling discipline that comes with it are familiar — it&apos;s not a ramp or a risk on my side.&rdquo;
              </Callout>
              <Callout color="blue">
                Don&apos;t over-explain or raise concerns. It signals you understand regulated-data handling at a level most
                candidates don&apos;t.
              </Callout>
            </div>
          );
        }

        // ── Requirements Q&A + review gate ────────────────────────
        if (activeId === "cl-reqq") {
          return (
            <div>
              <H>Integration requirements Q&A + review gate</H>
              <Desc>
                The first two JD responsibilities. Before any solution design I produce two artifacts: an open-questions log, and a
                requirements review the stakeholders sign off.
              </Desc>
              <Sub>1 · Integration requirements Q&A log</Sub>
              <div className="text-[12px] text-arch-text2 mb-2">
                Every open question per integration point, with owner + resolved answer. Examples on this platform:
              </div>
              <Table
                headers={["Open question", "Why it matters"]}
                rows={[
                  ["Which system is the source of record for this field?", "Decides read vs write path (PostgreSQL vs CPM)"],
                  ["What happens when CPM times out?", "Partial response vs hard fail — the page must still load"],
                  ["What's the idempotency key on submit?", "Duplicate orders must be rejected"],
                  ["Grace-period behaviour per provider?", "Suspend vs cancel; 3–7 days differs by merchant"],
                  ["EN / FR handled where?", "Bilingual is a recurring non-functional requirement"],
                  ["Sync or async — and what's the failure path?", "Retry / DLQ / compensation must be defined up front"],
                ]}
              />
              <Sub>2 · Requirements review (pre-design, with stakeholders)</Sub>
              <div className="text-[12px] text-arch-text2 mb-2">
                Per component: the business problem + numbered requirements, reviewed and signed off before design starts.
              </div>
              {requirementsReview.map((c) => (
                <Card key={c.component} accent="purple" className="mb-2">
                  <div className="text-[12px] font-semibold text-arch-text mb-1">{c.component}</div>
                  <div className="text-[11px] text-arch-text3 italic mb-2">{c.businessProblem}</div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {c.requirements.map((r) => (
                      <li key={r.id} className="text-[11.5px] text-arch-text2">
                        <Code>{r.id}</Code> {r.text}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          );
        }

        // ════════════════ PLATFORM DEEP-DIVE (go-repo) ════════════════

        // ── Platform map & services ───────────────────────────────
        if (activeId === "cl-map") {
          return (
            <div>
              <H>Platform map & services</H>
              <Desc>
                A ~29-service Go monorepo behind a Next.js microfrontend, fronted by an AppSync GraphQL gateway. Reads and writes
                are split (CQRS). Know the handful of services that matter for the flow.
              </Desc>
              <Diagram chart={systemContextDiagram} caption="High-level platform context — actors, services, providers, infrastructure" />
              <Sub>The services you must be able to name</Sub>
              <Table
                headers={["Service", "Role"]}
                rows={[
                  [<Badge key="1" color="blue">order-api</Badge>, <span key="a">Order entry. <Code>PostOrder</Code>, <Code>PlanChange</Code>, <Code>UndoOrder</Code> (Gin REST)</span>],
                  [<Badge key="2" color="blue">subscription-configurator-api</Badge>, <span key="b"><Code>ConvertToOrder</Code> — validates, prices, builds the order</span>],
                  [<Badge key="3" color="amber">product-catalog-api / catalog-api</Badge>, "Offerings & promotions; Redis-cached"],
                  [<Badge key="4" color="green">reseller-service (+ -disney, -bellmedia)</Badge>, "Write orchestrator — fulfillment to merchants"],
                  [<Badge key="5" color="purple">subscriptions-aggregator-api</Badge>, "Read side — merges PostgreSQL + CPM"],
                  [<Badge key="6" color="purple">household-api</Badge>, "Wraps legacy CPM (anti-corruption layer)"],
                  [<Badge key="7" color="teal">flow-runner-api</Badge>, "Saga / workflow engine (JSON recipes, DynamoDB)"],
                  [<Badge key="8" color="coral">audit-api</Badge>, "Immutable compliance log (append-only)"],
                  [<Badge key="9" color="blue">auth-api / token-api / session-api</Badge>, "OAuth2+Auth0 · Redis tokenization · 30-min sessions"],
                ]}
              />
            </div>
          );
        }

        // ── End-to-end order flow ─────────────────────────────────
        if (activeId === "cl-e2e") {
          return (
            <div>
              <H>End-to-end order flow (the money walkthrough)</H>
              <Desc>
                This is the answer to &ldquo;walk me through a transaction end-to-end.&rdquo; Trace it by real service + function
                name. Entry point: <Path>services/order-api/internal/post_order.go</Path>.
              </Desc>
              <Diagram chart={dgE2E} caption="POST /order → ConvertToOrder → async fulfillment → Kafka → audit" />
              <Table
                headers={["#", "Service", "What happens"]}
                rows={[
                  ["1", <Code key="1">order-api</Code>, <span key="a"><Code>PostOrder</Code> receives {"{ sessionId, parameters }"}</span>],
                  ["2", <Code key="2">configurator-api</Code>, <span key="b"><Code>ConvertToOrder(sessionId)</Code> → orderId, subscribers, items</span>],
                  ["3", <Code key="3">product-catalog-api</Code>, "product offerings + promotionSpec"],
                  ["4", <Code key="4">reseller-service</Code>, <span key="c"><Code>fulfillmentFlow(...)</Code> — async; provisions with the merchant</span>],
                  ["5", "Kafka", <span key="d">publish <Code>SubscriptionActivatedType</Code> to <Code>subscription-fulfillment</Code></span>],
                  ["6", <Code key="5">audit-api</Code>, <span key="e">synchronous <Code>ORDER_PLACED</Code> log on the critical path</span>],
                  ["7", <Code key="6">order-api</Code>, "returns 200 OK immediately: subscriberId, subscriptions=PENDING, confirmationNumber"],
                ]}
              />
              <Callout color="teal" label="The BSA point">
                The response returns <strong>200 OK with status PENDING immediately</strong>, while fulfillment, billing, and email
                happen async via Kafka. That async split is a requirements decision — and it&apos;s why the spec must define what
                happens when fulfillment later fails (retry via <Code>PendingTransactionStore</Code>, DLQ, or compensation).
              </Callout>
            </div>
          );
        }

        // ── CQRS ──────────────────────────────────────────────────
        if (activeId === "cl-cqrs") {
          return (
            <div>
              <H>Write vs read — the CQRS split</H>
              <Desc>Different services own writes and reads, on different stores. This is the cleanest architecture talking point.</Desc>
              <div className="grid grid-cols-2 gap-2">
                <Card accent="green">
                  <Badge color="green">Write side</Badge>
                  <div className="text-[12px] text-arch-text2 leading-relaxed mt-2">
                    <Code>reseller-service</Code> orchestrates all mutations → PostgreSQL (<Code>subscription.subscription</Code>,
                    partitioned monthly), provisions merchants, publishes Kafka, logs audit.
                  </div>
                </Card>
                <Card accent="purple">
                  <Badge color="purple">Read side</Badge>
                  <div className="text-[12px] text-arch-text2 leading-relaxed mt-2">
                    <Code>subscriptions-aggregator-api</Code> is <strong>read-only</strong> (read-only DB role) and{" "}
                    <strong>merges PostgreSQL + CPM</strong> into one response.
                  </div>
                </Card>
              </div>
              <Callout color="blue" label="The detail that impresses">
                The aggregator returns <Code>partial: true</Code> when CPM is unavailable instead of failing — so the member still
                sees their subscriptions. That graceful-degradation rule is exactly the kind of failure-path requirement a BSA owns.
              </Callout>
              <CodeBlock caption="subscriptions-aggregator-api — partial response on CPM failure">{codeCpm}</CodeBlock>
            </div>
          );
        }

        // ── Merchant adapter pattern ──────────────────────────────
        if (activeId === "cl-adapter") {
          return (
            <div>
              <H>Merchant adapter pattern (anti-corruption layer)</H>
              <Desc>
                Each external provider is messy in its own way. A common interface keeps that mess out of the core — every merchant
                implements the same contract; <Code>reseller-service</Code> routes by <Code>providerId</Code>.
              </Desc>
              <Diagram chart={dgAdapter} caption="One interface, provider-specific implementations — Disney, Bell Media, Bango" />
              <Table
                headers={["Element", "Real identifier"]}
                rows={[
                  ["Interface", <Code key="1">CatalogClientInterface</Code>],
                  ["Implementations", <span key="2"><Code>reseller-service-disney</Code>, <Code>reseller-service-bellmedia</Code></span>],
                  ["Disney adapter", <span key="3"><Code>DisneyGetUserInfoAdaptor.GetSubjectEmailFromDisney()</Code></span>],
                  ["Feature-flagged provider", <span key="4">Bango via <Code>BANGO_INTEGRATION</Code> flag</span>],
                  ["File", <Path key="5">services/reseller-service-disney/external/catalog_client.go</Path>],
                ]}
              />
              <Callout color="green" label="Why a BSA cares">
                Onboarding a new provider = &ldquo;implement the interface, deploy a new <Code>reseller-service-X</Code>, add a
                routing rule by providerId.&rdquo; That&apos;s the requirements template I&apos;d reuse for a new benefits carrier
                or downstream system at Canada Life.
              </Callout>
            </div>
          );
        }

        // ── Saga ──────────────────────────────────────────────────
        if (activeId === "cl-saga") {
          return (
            <div>
              <H>flow-runner-api — saga &amp; compensation</H>
              <Desc>
                A multi-step flow that books an order can&apos;t half-succeed. <Code>flow-runner-api</Code> executes steps in order,
                checkpoints state in DynamoDB, and on failure runs compensation in <strong>reverse order</strong>.
              </Desc>
              <CodeBlock caption="FlowExecutor.Execute / compensate — the saga loop">{codeFlowExecutor}</CodeBlock>
              <Table
                headers={["Saga step", "Execute", "Compensate"]}
                rows={[
                  ["Validate account", "household-api → CPM check", "— (read-only)"],
                  ["Check eligibility", "catalog-api qualification", "— (read-only)"],
                  ["Provision merchant", "merchant adapter", "Deprovision via same adapter"],
                  ["Write to PostgreSQL", "INSERT subscription + order", "DELETE subscription + order"],
                  ["Publish event", "Kafka OrderCreated", "Publish OrderReversed"],
                  ["Log audit", "audit-api", "Log COMPENSATED entry"],
                ]}
              />
              <Callout color="blue">
                Flows are defined as <strong>JSON recipes</strong> (e.g. <Path>recipes/qualificationv2.json</Path>) — declarative
                steps with a rule-validator. That&apos;s configuration-as-requirements: the flow IS the spec.
              </Callout>
            </div>
          );
        }

        // ── States ────────────────────────────────────────────────
        if (activeId === "cl-state") {
          return (
            <div>
              <H>Subscription &amp; order state machines</H>
              <Desc>
                The state machine is the guardrail. An action that isn&apos;t valid for the current status is rejected before any
                write — straight from <Path>model/subscription-core-process/statusManage.go</Path>.
              </Desc>
              <CodeBlock caption="Real transition map — status → allowed action → next status">{codeStateTransition}</CodeBlock>
              <Sub>Subscription lifecycle</Sub>
              <Diagram chart={dgSubState} caption="NEW → PENDING → ACTIVE → SUSPENDED / REVOKED (enforced by StateTransition)" />
              <div className="text-[11.5px] text-arch-text2 leading-relaxed mb-1">
                Full enum: <Code>NEW</Code> <Code>PENDING</Code> <Code>ACTIVE</Code> <Code>ACTIVE_ENDING</Code> <Code>CANCELLED</Code>{" "}
                <Code>SUSPENDED</Code> <Code>REVOKED</Code> <Code>FAILED</Code>.
              </div>
              <Sub>Order lifecycle (order-api)</Sub>
              <Diagram chart={dgOrderState} caption="PENDING → COMPLETED / FAILED → REVERSED; completed orders are immutable" />
              <Callout color="coral">
                Order immutability + a typed transition table (<Code>validTransitions</Code> with <Code>TransitionTo()</Code>) is
                how the platform prevents illegal edits — a requirement, not an accident.
              </Callout>
            </div>
          );
        }

        // ── Events ────────────────────────────────────────────────
        if (activeId === "cl-events") {
          return (
            <div>
              <H>Kafka events</H>
              <Desc>
                Lifecycle changes are published as domain events on <Code>subscription-fulfillment</Code>. Consumers are{" "}
                <strong>idempotent</strong> (dedupe by <Code>eventId</Code>); ordering per subscription is guaranteed by partition
                key = subscriptionId.
              </Desc>
              <Table
                headers={["Real event type", "Meaning"]}
                rows={[
                  [<Code key="1">SubscriptionActivatedType</Code>, "com.subscription.activated — entitlement live"],
                  [<Code key="2">SubscriptionStateChangeEvent</Code>, "status transition"],
                  [<Code key="3">SubscriptionCreateEvent</Code>, "new subscription created"],
                  [<Code key="4">SubscriptionRevokedType</Code>, "com.subscription.revoked"],
                  [<Code key="5">SubscriptionInitializedType</Code>, "com.subscription.initialized"],
                ]}
              />
              <Sub>The envelope</Sub>
              <Table
                headers={["Wrapper field", "Carries"]}
                rows={[
                  [<Code key="1">eventId</Code>, "idempotency key (UUID)"],
                  [<Code key="2">eventTime / eventType</Code>, "timestamp + discriminator"],
                  [<Code key="3">event.subscription</Code>, "id, status, productKey, reseller, merchant, merchantSubscriberId…"],
                ]}
              />
              <Callout color="blue" label="Consumers">
                <Code>notification-consumer</Code> (→ email-api → SES, EN/FR), <Code>subscription-consumer</Code> (keeps read models
                / CPM in sync), routed via <Code>event-hub</Code> with a DLQ for failures.
              </Callout>
            </div>
          );
        }

        // ── Data stores ───────────────────────────────────────────
        if (activeId === "cl-data") {
          return (
            <div>
              <H>Data stores &amp; systems of record</H>
              <Desc>Right store for the job — and one clear owner per entity. This is the &ldquo;system of record&rdquo; question.</Desc>
              <Table
                headers={["Store", "What lives there"]}
                rows={[
                  [<Badge key="1" color="blue">PostgreSQL</Badge>, <span key="a"><Code>subscription.subscription</Code> (partitioned monthly), <Code>merchant_entitlement</Code>, <Code>subscription_audit</Code>; via sqlc</span>],
                  [<Badge key="2" color="amber">DynamoDB</Badge>, <span key="b">transient <Code>SessionTable</Code>, <Code>OrderTable</Code>, <Code>PendingTransactionStore</Code> (retry queue)</span>],
                  [<Badge key="3" color="coral">Redis</Badge>, <span key="c"><Code>token-api</Code> tokenized data (PCI) + catalog cache</span>],
                  [<Badge key="4" color="purple">CPM (legacy)</Badge>, <span key="d">equipment / account — read via <Code>household-api</Code>, never cached</span>],
                  [<Badge key="5" color="green">Kafka</Badge>, "event backbone (subscription-fulfillment, billing, email)"],
                ]}
              />
              <Sub>Systems of record (read vs write path)</Sub>
              <Table
                headers={["Entity", "System of record", "Read path", "Write path"]}
                rows={systemsOfRecord.slice(0, 6).map((r) => [r.entity, r.systemOfRecord, r.readPath, r.writePath])}
              />
              <Sub>Latency budget (NFR)</Sub>
              <Table
                headers={["Call", "Mode", "P99"]}
                rows={latencyBudget.map((r) => [
                  <Code key={r.call}>{r.call}</Code>,
                  <Badge key={r.call + "m"} color={r.mode === "Sync" ? "blue" : "amber"}>{r.mode}</Badge>,
                  r.p99,
                ])}
              />
            </div>
          );
        }

        // ── Auth ──────────────────────────────────────────────────
        if (activeId === "cl-auth") {
          return (
            <div>
              <H>Auth &amp; tokenization</H>
              <Desc>Three real services. Know which does what — security questions love this.</Desc>
              <Table
                headers={["Service", "Responsibility"]}
                rows={[
                  [<Code key="1">auth-api</Code>, <span key="a">OAuth2 + Auth0 JWT validation; caches JWKS, refreshes every ~60 min (<Code>/oauth2/validate</Code>, <Code>/auth0/validate</Code>)</span>],
                  [<Code key="2">token-api</Code>, <span key="b">stateless tokenization — store sensitive payload in Redis, return a UUID; keeps PII out of logs/events (PCI)</span>],
                  [<Code key="3">session-api</Code>, <span key="c">cart/session state in DynamoDB with a 30-min TTL; <Code>consumed=true</Code> after order submit</span>],
                ]}
              />
              <Callout color="purple" label="Canada Life tie-in">
                Tokenization + JWKS-validated OAuth2 + 30-min session TTL is the same posture a benefits portal needs over sensitive
                health & financial data. The discipline transfers directly.
              </Callout>
            </div>
          );
        }

        // ── Audit ─────────────────────────────────────────────────
        if (activeId === "cl-audit") {
          return (
            <div>
              <H>audit-api — the compliance story</H>
              <Desc>
                Your strongest regulatory artifact. <Code>audit-api</Code> is an <strong>append-only</strong> log — there is no
                Update or Delete method — written <strong>synchronously on the critical path</strong> with agent attribution.
              </Desc>
              <CodeBlock caption="audit-api repo — INSERT only, no mutation methods exist">{codeAudit}</CodeBlock>
              <Table
                headers={["Property", "Detail"]}
                rows={[
                  ["Event types", <span key="1"><Code>ORDER_CREATED</Code> <Code>ACTIVATED</Code> <Code>CANCELLED</Code> <Code>REVERSED</Code> <Code>RECOVERED</Code></span>],
                  ["Immutability", "no UPDATE / DELETE — tamper-evident"],
                  ["Write mode", "synchronous; blocking on every mutation in reseller-service"],
                  ["Attribution", <span key="2"><Code>agentId</Code> + <Code>correlationId</Code> on every entry</span>],
                  ["Retention", "7-year with Glacier archival"],
                ]}
              />
              <Callout color="coral" label="Map to OSFI">
                &ldquo;OSFI needs actions reconstructable. I&apos;d carry this exact pattern into a benefits API — immutable audit
                logging as a first-class requirement, not an afterthought.&rdquo;
              </Callout>
            </div>
          );
        }

        // ── Data mapping ──────────────────────────────────────────
        if (activeId === "cl-datamap") {
          return (
            <div>
              <H>Field-level data mapping</H>
              <Desc>
                Bread-and-butter BSA work: trace every field UI → API → Go → DB column for the add-subscription flow. Active
                validation — confirm the payload matches the source of truth, and define what a missing value does.
              </Desc>
              <Table
                headers={["UI field", "API field", "Go field", "DB column"]}
                rows={[
                  ["Billing account", <Code key="1">customerInfo.billingAccountNumber</Code>, "BillingAccountNumber", "billing_account_number (PG)"],
                  ["TV account", <Code key="2">customerInfo.tvAccountNumber</Code>, "TVAccountNumber", "tv_account_number (PG)"],
                  ["(auto)", <Code key="3">sessionId</Code>, "SessionID", "SESSION#id (DynamoDB, 30-min TTL)"],
                  ["Plan click", <Code key="4">operationType: APPLY_TO_ORDER</Code>, "OperationType", "— (flow logic)"],
                  ["Selected plan", <Code key="5">selectedPlan.productId</Code>, "ProductID", "product_id (PG, FK)"],
                  ["(auto)", <Code key="6">subscriptionId</Code>, "SubscriptionID", "id (PG subscriptions)"],
                  ["(auto)", <Code key="7">status</Code>, "Status", "status (PG) — PENDING → ACTIVE"],
                ]}
              />
              <Callout color="teal" label="The differentiator">
                <strong>Active validation, not passive review.</strong> Query the DB to confirm the field is really populated, and
                define the failure path — e.g. customer name missing from CPM → show <Code>N/A</Code>, page still loads (the real
                soft-failure rule in the platform).
              </Callout>
            </div>
          );
        }

        // ── Integration patterns ──────────────────────────────────
        if (activeId === "cl-patterns") {
          return (
            <div>
              <H>Integration patterns (with code evidence)</H>
              <Desc>Name the pattern, then point at where it lives. This is the &ldquo;how do you think about integration&rdquo; answer.</Desc>
              <Table
                headers={["Pattern", "Where used", "Evidence"]}
                rows={integrationPatterns.map((p) => [
                  <Badge key={p.pattern} color="blue">{p.pattern}</Badge>,
                  p.whereUsed,
                  <span key={p.pattern + "e"} className="text-[10.5px] text-arch-text3">{p.evidence}</span>,
                ])}
              />
            </div>
          );
        }

        // ── JDL & domain modelling ────────────────────────────────
        if (activeId === "cl-jdl") {
          return (
            <div>
              <H>JDL files &amp; domain modelling</H>
              <Desc>
                The JD explicitly asks for JDL files + Domain Modelling. JDL (JHipster Domain Language) is schema-first: define
                entities, fields, relationships and enums, and the tooling generates API scaffolding + DB schema. The contract drives
                the build.
              </Desc>
              <Callout color="blue" label="How to frame it">
                &ldquo;I model the domain in the business&apos;s language first — nouns become entities, verbs become relationships. I
                already work schema-first: on this platform the domain model drove the build, not the other way round. JDL is that
                discipline in a specific notation, and the generated scaffolding keeps the spec and the code from drifting.&rdquo;
              </Callout>
              <Sub>The platform domain model, in JDL</Sub>
              <CodeBlock>{jdlDomainModel}</CodeBlock>
              <Callout color="teal">
                Note the enums — <Code>SubscriptionStatus</Code>, <Code>OperationType</Code>, <Code>OrderStatus</Code> — that&apos;s
                the state machine and the operation set expressed as part of the domain model.
              </Callout>
            </div>
          );
        }

        // ════════════════ BSA PRACTICE ════════════════

        // ── What a BSA does ───────────────────────────────────────
        if (activeId === "cl-bsarole") {
          return (
            <div>
              <H>What a BSA does</H>
              <Desc>Own building the right thing before any code is written. Four pillars — not implementation.</Desc>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[
                  { t: "Requirements", d: "Turn a business need into something unambiguous: rules, edge cases, failure paths.", c: "blue" },
                  { t: "Data mapping", d: "Trace every field front-end → API → back-end store; validate the contract end-to-end.", c: "teal" },
                  { t: "Acceptance criteria", d: "Per story, concrete enough that a reviewer checks pass/fail without asking you.", c: "amber" },
                  { t: "Post-delivery review", d: "Check the build against the AC, raise defects, feed back.", c: "green" },
                ].map((x) => (
                  <Card key={x.t} accent={x.c}>
                    <Badge color={x.c}>{x.t}</Badge>
                    <div className="text-[11.5px] text-arch-text2 leading-relaxed mt-2">{x.d}</div>
                  </Card>
                ))}
              </div>
              <Callout color="blue" label="Say this">
                &ldquo;A developer joining the team reads my specs and builds against them. If a requirement&apos;s meaning is in
                question mid-sprint, they come to me — I&apos;m the source of truth. They&apos;re answerable for the implementation
                being correct; I&apos;m answerable for the requirement being right.&rdquo;
              </Callout>
            </div>
          );
        }

        // ── Acceptance criteria ───────────────────────────────────
        if (activeId === "cl-ac") {
          return (
            <div>
              <H>Acceptance criteria (testable)</H>
              <Callout color="red" label="The rule">No story goes to a developer without written AC. It&apos;s a gate, not a nice-to-have.</Callout>
              <Sub>Concrete &amp; verifiable — a real example from the platform</Sub>
              <div className="grid grid-cols-2 gap-2">
                <Card accent="red">
                  <Badge color="red">✗ Bad</Badge>
                  <div className="text-[12px] text-arch-text2 leading-relaxed mt-2 italic">&ldquo;handles CPM errors gracefully.&rdquo;</div>
                </Card>
                <Card accent="green">
                  <Badge color="green">✓ Good</Badge>
                  <div className="text-[12px] text-arch-text2 leading-relaxed mt-2 italic">
                    &ldquo;when CPM times out, <Code>GET /subscriptions</Code> returns the PostgreSQL rows with{" "}
                    <Code>partial: true</Code> and HTTP 200 — the page still renders.&rdquo;
                  </div>
                </Card>
              </div>
              <Callout color="blue">
                Always cover failure paths & edge cases (empty, timeout, conflicting values). If you can&apos;t write it as a clear
                pass/fail, the requirement isn&apos;t pinned down yet — go close that before the story moves.
              </Callout>
            </div>
          );
        }

        // ── Delivery: stories, grooming, review ───────────────────
        if (activeId === "cl-delivery") {
          const s = userStories[0];
          return (
            <div>
              <H>Stories, grooming, pointing &amp; review</H>
              <Desc>
                JD responsibilities 6–9: write the AC, create the stories/tasks, lead grooming & pointing, then review the build
                against the same AC.
              </Desc>
              <Sub>1 · Story + acceptance criteria (real example)</Sub>
              <Card accent="amber">
                <div className="text-[12px] font-semibold text-arch-text mb-1">{s.title}</div>
                <div className="text-[11.5px] text-arch-text2 mb-2">
                  <strong>As a</strong> {s.asA} <strong>I want to</strong> {s.iWantTo} <strong>so that</strong> {s.soThat}.
                </div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {s.criteria.map((c) => (
                    <li key={c.id} className="text-[11px] text-arch-text2">
                      <Code>{c.id}</Code> {c.text}
                    </li>
                  ))}
                </ul>
              </Card>
              <Sub>2 · Lead grooming &amp; pointing</Sub>
              <div className="text-[12px] text-arch-text2 mb-2 leading-relaxed">
                Come in with reqs / AC / data-map drafted. In the room: walk the stories, surface ambiguity actively (catch
                dependencies before points are committed), and point alongside engineers — they own the estimate, you ensure the
                complexity being sized is the real complexity.
              </div>
              <Sub>3 · Review completed work</Sub>
              <div className="text-[12px] text-arch-text2 leading-relaxed">
                Run the build back against the same AC, line by line, including failure paths. Defects tied to a specific criterion:
                &ldquo;AC-1.5 says merchant fail → status FAILED + retry; the build leaves it PENDING.&rdquo; Make it a repeatable
                standard, not a one-off.
              </div>
            </div>
          );
        }

        // ── Tools ─────────────────────────────────────────────────
        if (activeId === "cl-tools") {
          return (
            <div>
              <H>Tools &amp; why</H>
              <Desc>Pick tools by the job they do — each closes a specific gap.</Desc>
              <Table
                headers={["Tool", "Job it does"]}
                rows={[
                  [<Badge key="1" color="amber">OpenAPI / proto</Badge>, "Define the contract as the source of truth (REST + gRPC in the repo)"],
                  [<Badge key="2" color="teal">SQL (sqlc)</Badge>, "Validate the contract against real PostgreSQL data"],
                  [<Badge key="3" color="purple">Diagramming</Badge>, "State machines / domain models → non-technical sign-off"],
                  [<Badge key="4" color="blue">Jira</Badge>, "Hold per-story AC; gate stories"],
                  [<Badge key="5" color="green">Confluence-style docs</Badge>, "Durable data-mapping docs & domain models"],
                  [<Badge key="6" color="coral">Postman</Badge>, "Exercise endpoints, confirm behaviour"],
                ]}
              />
            </div>
          );
        }

        // ── Situational ───────────────────────────────────────────
        if (activeId === "cl-situational") {
          return (
            <div>
              <H>Repeatable &ldquo;How I handle X&rdquo; patterns</H>
              <Desc>Situational quick-recall — answer with a pattern, not a one-off.</Desc>
              <div className="space-y-2">
                {[
                  { q: "Disagreeing (PM / architect)", a: "Evidence first → raise it privately → bring a solution in hand (a prioritised fix list, not a complaint).", c: "coral" },
                  { q: "Conflicting stakeholders", a: "Separate the stated 'want' from the underlying need → separate sessions → one room with the trade-off visible → shared criteria → written sign-off.", c: "purple" },
                  { q: "Prioritising competing requirements", a: "Make the criteria explicit first (member impact / regulatory / risk / effort) → dependency order → 80% of value in 20% of complexity.", c: "green" },
                  { q: "'Not feasible in the timeline'", a: "Treat as a requirements problem, not a negotiation. Find the 80/20 core, present the trade-off explicitly, let the business choose.", c: "amber" },
                  { q: "Ambiguous requirement mid-sprint", a: "Clarify against spec + business intent → decide quickly → update the AC so it's closed for good. You're the source of truth, not your memory.", c: "blue" },
                  { q: "A spec you signed off caused an incident", a: "Own it without calculation → fix the immediate issue → fix the process that let it through. Accountability + systemic fix.", c: "red" },
                  { q: "Inherit a system, no docs, tight deadline", a: "Map real behaviour → model it (domain model + state machine) → get stakeholder sign-off → make it the reference.", c: "teal" },
                ].map((x) => (
                  <Card key={x.q} accent={x.c}>
                    <div className="text-[12px] font-semibold text-arch-text mb-1">{x.q}</div>
                    <div className="text-[11.5px] text-arch-text2 leading-relaxed">{x.a}</div>
                  </Card>
                ))}
              </div>
            </div>
          );
        }

        // ════════════════ DOMAIN ════════════════

        if (activeId === "cl-benefits") {
          return (
            <div>
              <H>How group benefits work</H>
              <Desc>The buyer and the beneficiary aren&apos;t the same party — and the data model must reflect that.</Desc>
              <Diagram chart={dgBenefits} caption="Plan sponsor holds the contract; members & dependants are covered" />
              <Callout color="green" label="The finance angle that lands">
                Renewal pricing is driven by the group&apos;s actual claims experience. The more the group claims, the more the
                premium moves at renewal. A benefits system isn&apos;t just processing transactions — it&apos;s generating the data
                that <strong>prices the contract</strong>.
              </Callout>
            </div>
          );
        }

        if (activeId === "cl-apis") {
          return (
            <div>
              <H>Where APIs live in the claims / benefits flow</H>
              <Desc>Every handoff is an integration point with a data contract. None of these systems share a database.</Desc>
              <Diagram chart={dgApis} caption="member portal ↔ adjudication ↔ plan administration ↔ payment — every arrow is a contract" />
              <Callout color="blue" label="Why this is the team's whole game">
                It&apos;s a chain — an error in an early contract propagates downstream into pricing and payment. Getting contracts
                right at those boundaries is exactly the work this team owns — the same shape as the Bell order → fulfillment →
                billing chain.
              </Callout>
            </div>
          );
        }

        if (activeId === "cl-integrity") {
          return (
            <div>
              <H>Why data integrity matters so much</H>
              <Desc>A data error here doesn&apos;t create a support ticket — it has a financial consequence on a real customer.</Desc>
              <Callout color="coral">
                It compounds: an error in an early contract propagates through adjudication, administration and payment, and can
                replicate across millions of accounts before anyone notices. It&apos;s cheaper to be precise at the contract than to
                reconcile millions of accounts later. <strong>That&apos;s the whole argument for the BSA role being foundational.</strong>
              </Callout>
            </div>
          );
        }

        // ── Regulatory ────────────────────────────────────────────
        if (activeId === "cl-reg") {
          return (
            <div>
              <H>Regulatory &amp; compliance</H>
              <Desc>Treat each as a product constraint that shapes the contract, not a checkbox at the end.</Desc>
              <Table
                headers={["Constraint", "What it shapes in your contract"]}
                rows={[
                  [<Badge key="1" color="green">OSFI</Badge>, <span key="a">Auditability — actions reconstructable → immutable audit logging (cf. your <Code>audit-api</Code>)</span>],
                  [<Badge key="2" color="blue">PIPEDA / Privacy Act</Badge>, "Sensitive health + financial data → access controls, data minimisation, RBAC, what each endpoint may return"],
                  [<Badge key="3" color="purple">CAPSA Guideline No. 3</Badge>, "Governance over capital accumulation plans (the retirement side)"],
                  [<Badge key="4" color="amber">Bilingual (EN / FR)</Badge>, "Recurring non-functional requirement on everything (the platform already does EN/FR via SES templates)"],
                ]}
              />
              <Callout color="blue">&ldquo;I bake these into the contract up front rather than auditing for them later.&rdquo;</Callout>
            </div>
          );
        }

        // ── Behavioural (go-repo grounded) ────────────────────────
        if (activeId === "cl-behaviour") {
          return (
            <div>
              <H>Behavioural questions → real go-repo example</H>
              <Desc>
                For each classic behavioural prompt, reach for a concrete piece of the platform. Tell it STAR, end on the result.
              </Desc>
              <Table
                headers={["If they ask…", "Use this real example"]}
                rows={[
                  ["Operating in ambiguity / no docs", <span key="1">Reverse-engineered the order→fulfillment flow and the <Code>flow-runner</Code> recipes into a documented spec + state machine that became the reference.</span>],
                  ["Caught a problem before production", <span key="2">Surfaced that the read path must return <Code>partial: true</Code> when CPM times out — otherwise the member&apos;s whole page fails. Made it an AC before the sprint.</span>],
                  ["Most proud of", <span key="3">Specified <Code>audit-api</Code> as immutable, append-only, synchronous with <Code>agentId</Code> attribution — the artifact that makes the platform reconstructable.</span>],
                  ["Conflicting stakeholders", <span key="4">Aligned the <Code>CatalogClientInterface</Code> adapter contract across the Disney and Bell Media integrations so one core didn&apos;t fork per merchant.</span>],
                  ["Competing priorities", <span key="5">Sequenced the <Code>BANGO_INTEGRATION</Code> feature-flag rollout across reseller variants so nothing downstream broke.</span>],
                  ["A mistake you made", <span key="6">An under-specified empty-field case slipped to dev; owned it, then made failure paths mandatory in every AC.</span>],
                  ["Improved a business process", <span key="7">Designed the <Code>PendingTransactionStore</Code> retry path so failed fulfillments auto-recover instead of a manual runbook.</span>],
                ]}
              />
            </div>
          );
        }

        // ── Panel questions ───────────────────────────────────────
        if (activeId === "cl-panel") {
          return (
            <div>
              <H>Questions to ask the panel</H>
              <Desc>Pick 2–3. Each does double duty — signals thinking AND opens a door to your material.</Desc>
              <div className="space-y-2">
                {[
                  { q: "What does a typical API integration project look like from a BSA perspective on this team?", w: "Tells you where requirements/data-mapping ownership actually sits." },
                  { q: "Where do the most significant stakeholder-alignment challenges usually come from?", w: "Opens the door to your adapter / multi-stakeholder example." },
                  { q: "How mature is the requirements & documentation practice — what would you want a senior BSA to improve?", w: "Positions you as a level-setter; ties to the transformation." },
                  { q: "What does success look like at six months in this role?", w: "Outcome-oriented closer; pairs with '60–90 days to productive.'" },
                  { q: "How does the API Integration team collaborate with POs and architects across WB&R?", w: "Reveals the operating model & handoffs." },
                  { q: "Julia McGillis joined as EVP in 2025 — how has that shaped priorities?", w: "Homework signal. Use sparingly, only if rapport is good." },
                ].map((x, i) => (
                  <Card key={i} accent="blue">
                    <div className="text-[12px] font-medium text-arch-text mb-1">{x.q}</div>
                    <div className="text-[11px] text-arch-text3 leading-relaxed">→ {x.w}</div>
                  </Card>
                ))}
              </div>
            </div>
          );
        }

        // ── Curveballs ────────────────────────────────────────────
        if (activeId === "cl-curveballs") {
          return (
            <div>
              <H>Curveballs → one-line answers</H>
              <Table
                headers={["If they ask…", "Land on…"]}
                rows={[
                  ["\"Your title says engineer, not BSA.\"", "Title = how I entered Bell. Judge by the deliverables — contracts, data maps, ACs, state machines."],
                  ["\"No group-benefits experience.\"", "Domain is financial & regulated = where my CPA already lives. Productive in 60–90 days."],
                  ["\"Why leave Bell?\"", "Forward-looking: role + domain alignment. Not a move away — a move toward. (No layoff talk.)"],
                  ["\"Why not a finance role?\"", "CPA is a differentiator, not a detour — I read regulation as a product constraint."],
                  ["\"A tool you haven't used by name (JDL, Apigee).\"", "Notation gap, not a skills gap — here's the identical discipline I already practise (schema-first, gateway-fronted)."],
                  ["\"Tell me about a mistake.\"", "Under-specified empty-field case → owned it → made failure paths mandatory in every AC."],
                ]}
              />
            </div>
          );
        }

        // ── Final checklist ───────────────────────────────────────
        if (activeId === "cl-checklist") {
          return (
            <div>
              <H>Final 10-minute pre-interview checklist</H>
              <div className="space-y-1.5 mt-2">
                {[
                  "Re-read the 30-Second Self-Brief + the three anchor phrases.",
                  "Can name the flow: order-api PostOrder → configurator ConvertToOrder → reseller-service fulfillment → Kafka → audit-api.",
                  "Can name 3 patterns + evidence: Saga (flow-runner), Adapter (CatalogClientInterface), CQRS (reseller vs aggregator).",
                  "Subscription states: NEW → PENDING → ACTIVE → SUSPENDED / REVOKED (statusManage.go).",
                  "2-min opener cold; title-gap line ready.",
                  "One sentence each on OSFI, PIPEDA, CAPSA, bilingual — and the audit-api tie-in.",
                  "Can speak to JDL + domain modelling (entities/enums) and the requirements Q&A + pre-design review gate.",
                  "Reliability Status: I already held one at the CRA (Protected B) — said once, confidently.",
                  "Benefits domain: portal ↔ adjudication ↔ administration ↔ payment, and claims experience → renewal pricing.",
                  "Pick your 2–3 panel questions. VERIFY Canada Life transformation facts (CDO / TCS / EVP).",
                  "Logistics ready: PR, two weeks' notice, hybrid yes, Reliability Status comfortable.",
                ].map((x, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[12px] text-arch-text2">
                    <span
                      className="shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center text-[9px]"
                      style={{ borderColor: "var(--arch-border2)" }}
                    >
                      ☐
                    </span>
                    <span className="leading-relaxed">{x}</span>
                  </div>
                ))}
              </div>
              <Callout color="teal" label="Mantra">
                Get the contract right at the foundational layer — because an error there doesn&apos;t stay local, it compounds
                across millions of member accounts.
              </Callout>
            </div>
          );
        }

        return null;
      }}
    </SectionLayout>
  );
}
