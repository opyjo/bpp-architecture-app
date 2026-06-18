"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import CodeBlock from "@/components/ui/CodeBlock";
import {
  integrationQA,
  requirementsReview,
  addSubscriptionMapping,
  kafkaEventPayload,
  openApiSpecs,
  grpcProtoFiles,
  jdlDomainModel,
  orderSubmissionFlow,
  activationFlow,
  sagaSteps,
  userStories,
  systemsOfRecord,
  integrationPatterns,
  assessmentQA,
  latencyBudget,
  systemContextDiagram,
  e2eSequenceDiagram,
  stateMachineDiagram,
  erDiagram,
} from "@/data/bsa-cheatsheet";

// ─── Sidebar Definition ──────────────────────────────────────────────────────

const sidebarItems = [
  { id: "bsa-overview", label: "Overview & Context" },
  { id: "bsa-latency", label: "Quick-Ref: Latency Budget" },
];

const sidebarGroups = [
  {
    label: "Integration Q&A",
    items: [{ id: "bsa-qa", label: "10 BSA Questions" }],
  },
  {
    label: "Requirements Review",
    items: [
      { id: "bsa-req-reseller", label: "reseller-service" },
      { id: "bsa-req-merchant", label: "Merchant Adapter Layer" },
      { id: "bsa-req-session", label: "Session & Qualification" },
    ],
  },
  {
    label: "Data Mapping",
    items: [
      { id: "bsa-map-subscription", label: "Add Subscription flow" },
      { id: "bsa-map-kafka", label: "Kafka event payload" },
    ],
  },
  {
    label: "API Specs & Domain",
    items: [
      { id: "bsa-api-openapi", label: "OpenAPI specs" },
      { id: "bsa-api-grpc", label: "gRPC proto files" },
      { id: "bsa-api-jdl", label: "JDL domain model" },
    ],
  },
  {
    label: "Orchestration Specs",
    items: [
      { id: "bsa-orch-order", label: "Flow A: Order Submission" },
      { id: "bsa-orch-activation", label: "Flow B: Activation" },
      { id: "bsa-orch-saga", label: "Flow C: Saga Pattern" },
    ],
  },
  {
    label: "Acceptance Criteria",
    items: [
      { id: "bsa-ac-add", label: "Story 1: Add Subscription" },
      { id: "bsa-ac-cancel", label: "Story 2: Cancel" },
      { id: "bsa-ac-onboard", label: "Story 3: Onboard Merchant" },
    ],
  },
  {
    label: "Domain & Patterns",
    items: [
      { id: "bsa-domain-sor", label: "Systems of Record" },
      { id: "bsa-domain-patterns", label: "Integration Patterns" },
    ],
  },
  {
    label: "Diagrams",
    items: [
      { id: "bsa-diag-context", label: "System Context" },
      { id: "bsa-diag-sequence", label: "E2E Sequence" },
      { id: "bsa-diag-state", label: "State Machine" },
      { id: "bsa-diag-er", label: "ER Diagram" },
    ],
  },
  {
    label: "Assessment Q&A",
    items: [
      { id: "bsa-exam-1", label: "Q1: E2E walkthrough" },
      { id: "bsa-exam-2", label: "Q2: Onboard partner" },
      { id: "bsa-exam-3", label: "Q3: Failure handling" },
      { id: "bsa-exam-4", label: "Q4: Data consistency" },
      { id: "bsa-exam-5", label: "Q5: Requirements gathering" },
      { id: "bsa-exam-6", label: "Q6: API versioning" },
      { id: "bsa-exam-7", label: "Q7: CQRS pattern" },
      { id: "bsa-exam-8", label: "Q8: Non-functional reqs" },
    ],
  },
];

// ─── Shared Styles ───────────────────────────────────────────────────────────

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

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full border-collapse text-[11px] mb-3.5">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-2.5 py-2 border-b border-arch-border text-arch-text2 align-top ${className}`}>
      {children}
    </td>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] font-semibold text-arch-text mt-5 mb-2">{children}</div>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BsaCheatsheetTab() {
  return (
    <SectionLayout label="Overview" items={sidebarItems} groups={sidebarGroups}>
      {(activeId) => {
        // ── Overview ──────────────────────────────────────────────
        if (activeId === "bsa-overview") {
          return (
            <div>
              <SectionTitle>Canada Life Senior BSA Assessment Cheatsheet</SectionTitle>
              <SectionDesc>
                Grounded in Bell Canada Subscription Management Platform (go-repo + subscription-manager MFE).
                The platform manages streaming subscriptions (Netflix, Disney+, Bell Media, Radio Canada) for Bell residential customers.
              </SectionDesc>

              <div className="bg-arch-bg3 border border-arch-border rounded-lg p-4 mb-4">
                <div className="text-[11px] font-semibold text-arch-blue mb-2">Context</div>
                <div className="text-[11px] text-arch-text2 leading-relaxed">
                  This cheatsheet is derived from your actual Bell Canada codebase: a 60+ microservice Go backend (go-repo) and a Next.js subscription management MFE.
                  The deliverables below are framed as BSA artifacts you&apos;d produce on a Canada Life API Integration team (Workplace Benefits &amp; Retirement), using your real code as evidence.
                </div>
              </div>

              <SubHeading>Sections Overview</SubHeading>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Integration Q&A", desc: "10 BSA questions answered from code", color: "blue" },
                  { label: "Requirements Review", desc: "Pre-design requirements for 3 components", color: "purple" },
                  { label: "Data Mapping", desc: "Field-level UI → GraphQL → Go → DB", color: "teal" },
                  { label: "API Specs & Domain", desc: "OpenAPI, gRPC, JDL domain model", color: "amber" },
                  { label: "Orchestration Specs", desc: "3 southbound flows with error handling", color: "green" },
                  { label: "Acceptance Criteria", desc: "3 user stories with testable ACs", color: "coral" },
                  { label: "Domain & Patterns", desc: "Systems of record + 11 integration patterns", color: "purple" },
                  { label: "Diagrams", desc: "4 Mermaid diagrams (context, sequence, state, ER)", color: "blue" },
                  { label: "Assessment Q&A", desc: "8 exam-ready answers with code evidence", color: "teal" },
                ].map((s) => (
                  <div key={s.label} className="bg-arch-bg2 border border-arch-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge color={s.color}>{s.label}</Badge>
                    </div>
                    <div className="text-[10.5px] text-arch-text2">{s.desc}</div>
                  </div>
                ))}
              </div>

              <SubHeading>Source Files Analyzed</SubHeading>
              <div className="space-y-1">
                {[
                  { file: "src/data/architecture.ts", desc: "19 flows, node details, service dependency diagram" },
                  { file: "src/data/payloads.ts", desc: "GraphQL mutations, REST calls, field definitions" },
                  { file: "src/data/events.ts", desc: "14 Kafka event definitions with full payloads" },
                  { file: "src/data/flows.ts", desc: "5 customer/agent flows with step-by-step mutations" },
                  { file: "src/data/errors.ts", desc: "17 error scenarios with UI handling" },
                  { file: "src/data/service-deep-dives/core-subscription.ts", desc: "reseller-service deep dive" },
                  { file: "src/data/service-deep-dives/merchants.ts", desc: "5 merchant adapters, MerchantProvider interface" },
                  { file: "src/data/service-deep-dives/flow-orchestration.ts", desc: "flow-runner-api, saga pattern, household-api" },
                  { file: "src/data/service-deep-dives/events-messaging.ts", desc: "event-hub, event-publisher, notification-consumer" },
                ].map((f) => (
                  <div key={f.file} className="flex items-baseline gap-2 text-[10.5px]">
                    <code className="text-arch-teal bg-arch-bg3 px-1 py-0.5 rounded text-[10px]">{f.file}</code>
                    <span className="text-arch-text3">{f.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Quick-Reference: Latency Budget ───────────────────────
        if (activeId === "bsa-latency") {
          return (
            <div>
              <SectionTitle>Quick-Reference: Latency Budget</SectionTitle>
              <SectionDesc>P99 latency targets for each hop in the request chain.</SectionDesc>
              <DataTable headers={["Call", "Mode", "P99 Latency"]}>
                {latencyBudget.map((row) => (
                  <tr key={row.call}>
                    <Td><code className="text-arch-blue text-[10.5px]">{row.call}</code></Td>
                    <Td>
                      <Badge color={row.mode === "Sync" ? "blue" : "amber"}>{row.mode}</Badge>
                    </Td>
                    <Td className="font-mono text-[10.5px]">{row.p99}</Td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── Integration Q&A ───────────────────────────────────────
        if (activeId === "bsa-qa") {
          return (
            <div>
              <SectionTitle>Integration Q&A</SectionTitle>
              <SectionDesc>10 BSA questions answered directly from codebase evidence.</SectionDesc>
              <div className="space-y-3">
                {integrationQA.map((qa) => (
                  <div key={qa.num} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5">
                    <div className="flex items-start gap-2.5 mb-2">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-arch-blue/15 text-arch-blue text-[10px] font-bold flex items-center justify-center">
                        {qa.num}
                      </span>
                      <div className="text-[11.5px] font-semibold text-arch-text leading-snug">{qa.question}</div>
                    </div>
                    <div className="text-[11px] text-arch-text2 leading-relaxed ml-7.5 mb-2">{qa.answer}</div>
                    <div className="ml-7.5 flex items-center gap-1">
                      <span className="text-[9.5px] text-arch-text3 uppercase tracking-wider font-semibold">Source:</span>
                      <code className="text-[10px] text-arch-teal">{qa.source}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Requirements Review ───────────────────────────────────
        if (activeId === "bsa-req-reseller" || activeId === "bsa-req-merchant" || activeId === "bsa-req-session") {
          const idx = activeId === "bsa-req-reseller" ? 0 : activeId === "bsa-req-merchant" ? 1 : 2;
          const comp = requirementsReview[idx];
          const accentColors = ["blue", "purple", "teal"];
          return (
            <div>
              <SectionTitle>{comp.component}</SectionTitle>
              <div className="bg-arch-bg3 border border-arch-border rounded-lg p-3.5 mb-4">
                <div className="text-[10px] font-semibold text-arch-amber uppercase tracking-wider mb-1">Business Problem</div>
                <div className="text-[11px] text-arch-text2 leading-relaxed">{comp.businessProblem}</div>
              </div>

              <SubHeading>Pre-Design Requirements</SubHeading>
              <div className="space-y-2">
                {comp.requirements.map((req) => (
                  <div key={req.id} className="flex items-start gap-2.5 bg-arch-bg2 border border-arch-border rounded-lg p-3">
                    <Badge color={accentColors[idx]}>{req.id}</Badge>
                    <div className="text-[11px] text-arch-text2 leading-relaxed">{req.text}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Data Mapping: Add Subscription ────────────────────────
        if (activeId === "bsa-map-subscription") {
          return (
            <div>
              <SectionTitle>Data Mapping: Add Subscription (End-to-End)</SectionTitle>
              <SectionDesc>Field-level tracing from UI input through GraphQL, Go backend, to database columns.</SectionDesc>
              <div className="overflow-x-auto">
                <DataTable headers={["UI Field", "GraphQL Variable", "Go Field", "DB Column", "Notes"]}>
                  {addSubscriptionMapping.map((row, i) => (
                    <tr key={i}>
                      <Td className="whitespace-nowrap">{row.uiField}</Td>
                      <Td><code className="text-arch-purple text-[10px]">{row.graphqlVar}</code></Td>
                      <Td><code className="text-arch-teal text-[10px]">{row.goField}</code></Td>
                      <Td><code className="text-arch-amber text-[10px]">{row.dbColumn}</code></Td>
                      <Td className="text-arch-text3 text-[10px]">{row.notes}</Td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          );
        }

        // ── Data Mapping: Kafka Event Payload ─────────────────────
        if (activeId === "bsa-map-kafka") {
          return (
            <div>
              <SectionTitle>Kafka Event Payload Mapping (OrderCreated)</SectionTitle>
              <SectionDesc>Field-level mapping for the OrderCreated domain event published to Kafka.</SectionDesc>
              <DataTable headers={["Event Field", "Source", "Description"]}>
                {kafkaEventPayload.map((row, i) => (
                  <tr key={i}>
                    <Td><code className="text-arch-blue text-[10px]">{row.field}</code></Td>
                    <Td className="text-[10.5px]">{row.source}</Td>
                    <Td className="text-arch-text3 text-[10.5px]">{row.description}</Td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── OpenAPI Specs ─────────────────────────────────────────
        if (activeId === "bsa-api-openapi") {
          return (
            <div>
              <SectionTitle>OpenAPI Specs in Codebase</SectionTitle>
              <SectionDesc>REST API contracts defined via OpenAPI specifications.</SectionDesc>
              <DataTable headers={["Service", "Spec Location", "Protocol"]}>
                {openApiSpecs.map((row) => (
                  <tr key={row.service}>
                    <Td className="font-medium text-arch-text">{row.service}</Td>
                    <Td><code className="text-arch-teal text-[10px]">{row.location}</code></Td>
                    <Td><Badge color={row.protocol.includes("gRPC") ? "purple" : "blue"}>{row.protocol}</Badge></Td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── gRPC Proto Files ──────────────────────────────────────
        if (activeId === "bsa-api-grpc") {
          return (
            <div>
              <SectionTitle>gRPC Proto Files</SectionTitle>
              <SectionDesc>Protocol Buffer definitions for gRPC services.</SectionDesc>
              <DataTable headers={["Service", "Proto Location"]}>
                {grpcProtoFiles.map((row) => (
                  <tr key={row.service}>
                    <Td className="font-medium text-arch-text">{row.service}</Td>
                    <Td><code className="text-arch-teal text-[10px]">{row.location}</code></Td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── JDL Domain Model ──────────────────────────────────────
        if (activeId === "bsa-api-jdl") {
          return (
            <div>
              <SectionTitle>JDL-Style Domain Model</SectionTitle>
              <SectionDesc>Entity definitions, enums, and relationships across the subscription domain.</SectionDesc>
              <CodeBlock language="typescript">{jdlDomainModel}</CodeBlock>
            </div>
          );
        }

        // ── Orchestration: Order Submission ───────────────────────
        if (activeId === "bsa-orch-order") {
          return (
            <div>
              <SectionTitle>Flow A: Order Submission (submitSubscription)</SectionTitle>
              <SectionDesc>Step-by-step orchestration for placing a new subscription order.</SectionDesc>
              <div className="overflow-x-auto">
                <DataTable headers={["Step", "Service", "Action", "Trigger", "Payload", "Error Handling"]}>
                  {orderSubmissionFlow.map((row) => (
                    <tr key={row.step}>
                      <Td className="text-center font-mono text-arch-blue">{row.step}</Td>
                      <Td className="font-medium text-arch-text text-[10.5px] whitespace-nowrap">{row.service}</Td>
                      <Td className="text-[10.5px]">{row.action}</Td>
                      <Td className="text-[10.5px] text-arch-text3">{row.trigger}</Td>
                      <Td><code className="text-[9.5px] text-arch-teal">{row.payload}</code></Td>
                      <Td className="text-[10.5px] text-arch-coral">{row.errorHandling}</Td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          );
        }

        // ── Orchestration: Activation ─────────────────────────────
        if (activeId === "bsa-orch-activation") {
          return (
            <div>
              <SectionTitle>Flow B: Activation (activateSubscription)</SectionTitle>
              <SectionDesc>Step-by-step orchestration for activating a pending subscription.</SectionDesc>
              <div className="overflow-x-auto">
                <DataTable headers={["Step", "Service", "Action", "Trigger", "Payload", "Error Handling"]}>
                  {activationFlow.map((row) => (
                    <tr key={row.step}>
                      <Td className="text-center font-mono text-arch-blue">{row.step}</Td>
                      <Td className="font-medium text-arch-text text-[10.5px] whitespace-nowrap">{row.service}</Td>
                      <Td className="text-[10.5px]">{row.action}</Td>
                      <Td className="text-[10.5px] text-arch-text3">{row.trigger}</Td>
                      <Td><code className="text-[9.5px] text-arch-teal">{row.payload}</code></Td>
                      <Td className="text-[10.5px] text-arch-coral">{row.errorHandling}</Td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          );
        }

        // ── Orchestration: Saga Pattern ───────────────────────────
        if (activeId === "bsa-orch-saga") {
          return (
            <div>
              <SectionTitle>Flow C: Saga Pattern (flow-runner-api)</SectionTitle>
              <SectionDesc>
                Execute steps in order; on failure, compensation runs in reverse. State machine: RUNNING → COMPLETED or RUNNING → FAILED → COMPENSATING → COMPENSATED or COMPENSATING → COMPENSATION_FAILED (alerts ops).
              </SectionDesc>
              <DataTable headers={["Step", "Execute", "Compensate (on failure)"]}>
                {sagaSteps.map((row, i) => (
                  <tr key={i}>
                    <Td className="font-medium text-arch-text text-[10.5px] whitespace-nowrap">{row.step}</Td>
                    <Td className="text-[10.5px]">
                      <code className="text-arch-teal text-[10px]">{row.execute}</code>
                    </Td>
                    <Td className="text-[10.5px]">
                      {row.compensate === "— (read-only, no compensation)" || row.compensate === "— (read-only)" ? (
                        <span className="text-arch-text3 italic">{row.compensate}</span>
                      ) : (
                        <code className="text-arch-coral text-[10px]">{row.compensate}</code>
                      )}
                    </Td>
                  </tr>
                ))}
              </DataTable>

              <div className="bg-arch-bg3 border border-arch-border rounded-lg p-3 mt-4">
                <div className="text-[10px] font-semibold text-arch-amber uppercase tracking-wider mb-1.5">State Machine</div>
                <div className="flex items-center gap-1.5 text-[10.5px] flex-wrap">
                  {["RUNNING", "COMPLETED"].map((s, i) => (
                    <span key={s} className="flex items-center gap-1.5">
                      <Badge color="green">{s}</Badge>
                      {i === 0 && <span className="text-arch-text3">→</span>}
                    </span>
                  ))}
                  <span className="text-arch-text3 mx-1">or</span>
                  {["RUNNING", "FAILED", "COMPENSATING", "COMPENSATED"].map((s, i) => (
                    <span key={s} className="flex items-center gap-1.5">
                      <Badge color={s === "FAILED" || s === "COMPENSATING" ? "coral" : s === "COMPENSATED" ? "amber" : "green"}>{s}</Badge>
                      {i < 3 && <span className="text-arch-text3">→</span>}
                    </span>
                  ))}
                  <span className="text-arch-text3 mx-1">or</span>
                  {["COMPENSATING", "COMPENSATION_FAILED"].map((s, i) => (
                    <span key={`alt-${s}`} className="flex items-center gap-1.5">
                      <Badge color="coral">{s}</Badge>
                      {i === 0 && <span className="text-arch-text3">→</span>}
                    </span>
                  ))}
                  <span className="text-[10px] text-arch-text3 italic ml-1">(alerts ops)</span>
                </div>
              </div>
            </div>
          );
        }

        // ── Acceptance Criteria ───────────────────────────────────
        if (activeId === "bsa-ac-add" || activeId === "bsa-ac-cancel" || activeId === "bsa-ac-onboard") {
          const idx = activeId === "bsa-ac-add" ? 0 : activeId === "bsa-ac-cancel" ? 1 : 2;
          const story = userStories[idx];
          const colors = ["blue", "purple", "teal"];
          return (
            <div>
              <SectionTitle>Story {story.num}: {story.title}</SectionTitle>
              <div className="bg-arch-bg3 border border-arch-border rounded-lg p-3.5 mb-4">
                <div className="text-[11px] text-arch-text2 leading-relaxed">
                  <span className="text-arch-text font-semibold">As a</span> {story.asA},{" "}
                  <span className="text-arch-text font-semibold">I want to</span> {story.iWantTo},{" "}
                  <span className="text-arch-text font-semibold">so that</span> {story.soThat}.
                </div>
              </div>

              <SubHeading>Acceptance Criteria</SubHeading>
              <div className="space-y-2">
                {story.criteria.map((ac) => (
                  <div key={ac.id} className="flex items-start gap-2.5 bg-arch-bg2 border border-arch-border rounded-lg p-3">
                    <Badge color={colors[idx]}>{ac.id}</Badge>
                    <div className="text-[11px] text-arch-text2 leading-relaxed">{ac.text}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Systems of Record ─────────────────────────────────────
        if (activeId === "bsa-domain-sor") {
          return (
            <div>
              <SectionTitle>Systems of Record</SectionTitle>
              <SectionDesc>Which system owns each entity, and how reads/writes are routed.</SectionDesc>
              <DataTable headers={["Entity", "System of Record", "Read Path", "Write Path"]}>
                {systemsOfRecord.map((row) => (
                  <tr key={row.entity}>
                    <Td className="font-medium text-arch-text whitespace-nowrap">{row.entity}</Td>
                    <Td><code className="text-arch-blue text-[10px]">{row.systemOfRecord}</code></Td>
                    <Td className="text-[10.5px]">{row.readPath}</Td>
                    <Td className="text-[10.5px]">{row.writePath}</Td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── Integration Patterns ──────────────────────────────────
        if (activeId === "bsa-domain-patterns") {
          return (
            <div>
              <SectionTitle>Integration Patterns Used (with Code Evidence)</SectionTitle>
              <SectionDesc>11 integration patterns identified in the codebase with traceable evidence.</SectionDesc>
              <div className="space-y-2.5">
                {integrationPatterns.map((row) => (
                  <div key={row.pattern} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge color="blue">{row.pattern}</Badge>
                    </div>
                    <div className="text-[11px] text-arch-text2 mb-1.5">{row.whereUsed}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9.5px] text-arch-text3 uppercase tracking-wider font-semibold">Evidence:</span>
                      <code className="text-[10px] text-arch-teal">{row.evidence}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Diagrams ──────────────────────────────────────────────
        if (activeId === "bsa-diag-context") {
          return (
            <div>
              <SectionTitle>System Context Diagram</SectionTitle>
              <SectionDesc>High-level view of actors, the Bell Subscription Platform, external providers, and infrastructure.</SectionDesc>
              <MermaidDiagram chart={systemContextDiagram} />
            </div>
          );
        }

        if (activeId === "bsa-diag-sequence") {
          return (
            <div>
              <SectionTitle>End-to-End Sequence: Add Subscription</SectionTitle>
              <SectionDesc>Full request flow from browser login through subscription activation and notification delivery.</SectionDesc>
              <MermaidDiagram chart={e2eSequenceDiagram} />
            </div>
          );
        }

        if (activeId === "bsa-diag-state") {
          return (
            <div>
              <SectionTitle>Order/Provisioning State Machine</SectionTitle>
              <SectionDesc>Subscription status transitions including grace periods, failures, and reversals.</SectionDesc>
              <MermaidDiagram chart={stateMachineDiagram} />
            </div>
          );
        }

        if (activeId === "bsa-diag-er") {
          return (
            <div>
              <SectionTitle>ER Diagram of the Core Domain</SectionTitle>
              <SectionDesc>Entity relationships across PostgreSQL, DynamoDB, and Redis stores.</SectionDesc>
              <MermaidDiagram chart={erDiagram} />
            </div>
          );
        }

        // ── Assessment Q&A ────────────────────────────────────────
        const examMatch = activeId.match(/^bsa-exam-(\d+)$/);
        if (examMatch) {
          const qNum = parseInt(examMatch[1], 10);
          const qa = assessmentQA.find((q) => q.num === qNum);
          if (!qa) return null;
          return (
            <div>
              <SectionTitle>Q{qa.num}: {qa.question}</SectionTitle>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg p-4 mt-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-arch-blue/15 text-arch-blue text-[11px] font-bold flex items-center justify-center">
                    A
                  </span>
                  <span className="text-[10px] font-semibold text-arch-text3 uppercase tracking-wider">Model Answer</span>
                </div>
                <div className="text-[11.5px] text-arch-text2 leading-[1.7] whitespace-pre-line">{qa.answer}</div>
              </div>
            </div>
          );
        }

        return null;
      }}
    </SectionLayout>
  );
}
