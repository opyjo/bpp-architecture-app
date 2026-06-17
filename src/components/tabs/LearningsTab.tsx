"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import CodeBlock from "@/components/ui/CodeBlock";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import {
  topicOverviews,
  typesComparisons,
  zeroValuesTable,
  typeInferenceCode,
  functionsCode,
  functionsJsComparison,
  structsCode,
  structsJsComparison,
  pointersCode,
  pointersJsComparison,
  errBasicsCode,
  errBasicsJsCode,
  errWrappingCode,
  errCodebaseCode,
  errorPropagationMermaid,
  goroutinesCode,
  goroutinesJsComparison,
  goroutineLifecycleMermaid,
  patternsCode,
  fanOutFanInMermaid,
  contextCode,
  contextPropagationMermaid,
  syncCode,
  interfacesCode,
  interfacesJsComparison,
  connectorDeepCode,
  compositionCode,
  routerCode,
  middlewareChainMermaid,
  handlersCode,
  encodingCode,
  dataArchDescription,
  dataOwnershipMermaid,
  queriesCode,
  migrationsCode,
  configCode,
  secretsCode,
  loggingCode,
  tracingCode,
  tracePropagationMermaid,
  debuggingScenarios,
  debuggingCode,
  prereqsChecklist,
  runningCode,
  troubleshootTable,
  deployPipelineSteps,
  deploymentPipelineMermaid,
  k8sBasicsCode,
  rollbackCode,
  reviewGoPractices,
  reviewRepoPractices,
  addEndpointSteps,
  addConsumerSteps,
  addConnectorSteps,
  addFlagSteps,
  debugCISteps,
  debugLambdaSteps,
} from "@/data/learnings";
import {
  testingConcepts,
  pyramidLayers,
  testFileLocations,
  unitTestExamples,
  tableDrivenExamples,
  httpTestExamples,
  connectorPatternExamples,
  mockeryExamples,
  fullMockExample,
  karateExamples,
  k6Examples,
  testCommands,
  ciPipelineStages,
  testBestPractices,
  testGlossary,
  testingPyramidMermaid,
  mockGenerationFlowMermaid,
  connectorPatternMermaid,
  ciPipelineMermaid,
} from "@/data/go-testing";
import { guides } from "@/data/guides";

// ── Sidebar ────────────────────────────────────────────────────────

const sidebarItems = [{ id: "lr-overview", label: "Overview" }];

const sidebarGroups = [
  {
    label: "Go Syntax (JS → Go)",
    items: [
      { id: "lr-types", label: "Variables, types & zero values" },
      { id: "lr-functions", label: "Functions & multiple returns" },
      { id: "lr-structs", label: "Structs & composition" },
      { id: "lr-pointers", label: "Pointers, slices & maps" },
    ],
  },
  {
    label: "Error Handling",
    items: [
      { id: "lr-err-basics", label: "if err != nil" },
      { id: "lr-err-wrapping", label: "Wrapping & sentinel errors" },
      { id: "lr-err-codebase", label: "Errors in this codebase" },
    ],
  },
  {
    label: "Concurrency",
    items: [
      { id: "lr-goroutines", label: "Goroutines & channels" },
      { id: "lr-patterns", label: "Fan-out, workers & select" },
      { id: "lr-context", label: "Context & cancellation" },
      { id: "lr-sync", label: "sync primitives & race detection" },
    ],
  },
  {
    label: "Interfaces & DI",
    items: [
      { id: "lr-interfaces", label: "Implicit interfaces" },
      { id: "lr-connector-deep", label: "Connector pattern deep dive" },
      { id: "lr-composition", label: "Interface composition" },
    ],
  },
  {
    label: "Testing",
    items: [
      { id: "lr-test-overview", label: "Overview & pyramid" },
      { id: "lr-test-unit", label: "Unit testing & testify" },
      { id: "lr-test-table", label: "Table-driven tests" },
      { id: "lr-test-http", label: "httptest patterns" },
      { id: "lr-test-mock", label: "Mocking & mockery" },
      { id: "lr-test-integration", label: "Integration & load tests" },
      { id: "lr-test-ci", label: "Commands & CI pipeline" },
      { id: "lr-test-practices", label: "Best practices & glossary" },
    ],
  },
  {
    label: "API & HTTP Patterns",
    items: [
      { id: "lr-router", label: "Router & middleware" },
      { id: "lr-handlers", label: "Handler patterns" },
      { id: "lr-encoding", label: "Request/response encoding" },
    ],
  },
  {
    label: "Database & Data",
    items: [
      { id: "lr-data-arch", label: "Data architecture" },
      { id: "lr-queries", label: "Query & transaction patterns" },
      { id: "lr-migrations", label: "Migrations" },
    ],
  },
  {
    label: "Config & Secrets",
    items: [
      { id: "lr-config", label: "Config loading" },
      { id: "lr-secrets", label: "Secrets management" },
    ],
  },
  {
    label: "Observability",
    items: [
      { id: "lr-logging", label: "Structured logging" },
      { id: "lr-tracing", label: "Distributed tracing" },
      { id: "lr-debugging", label: "Debugging & profiling" },
    ],
  },
  {
    label: "Local Dev Setup",
    items: [
      { id: "lr-prereqs", label: "Prerequisites & install" },
      { id: "lr-running", label: "Running services locally" },
      { id: "lr-troubleshoot", label: "Troubleshooting" },
    ],
  },
  {
    label: "Deployment",
    items: [
      { id: "lr-deploy-pipeline", label: "Pipeline overview" },
      { id: "lr-k8s", label: "Kubernetes basics" },
      { id: "lr-rollback", label: "Rollbacks & health checks" },
    ],
  },
  {
    label: "Code Review",
    items: [
      { id: "lr-review-go", label: "Go review checklist" },
      { id: "lr-review-repo", label: "Repo conventions" },
    ],
  },
  {
    label: "Common Tasks",
    items: [
      { id: "lr-task-endpoints", label: "Adding endpoints & consumers" },
      { id: "lr-task-connectors", label: "Adding connectors & flags" },
      { id: "lr-task-debug", label: "Debugging CI" },
    ],
  },
  {
    label: "Go Guides",
    items: [
      { id: "lr-guide-beginners", label: "Beginner's Guide" },
      { id: "lr-guide-glossary", label: "Glossary & Concepts" },
      { id: "lr-guide-deps", label: "Service Dependency Map" },
      { id: "lr-guide-walkthrough", label: "Code Walkthrough" },
      { id: "lr-guide-onboarding", label: "Repo Onboarding" },
      { id: "lr-guide-polm", label: "PoLM Fix Guide" },
    ],
  },
];

// ── Shared helpers ──────────────────────────────────────────────────

const badgeColors: Record<string, string> = {
  purple: "bg-[rgba(124,111,205,0.12)] text-arch-purple border-[rgba(124,111,205,0.22)]",
  teal: "bg-[rgba(62,184,154,0.12)] text-arch-teal border-[rgba(62,184,154,0.22)]",
  blue: "bg-[rgba(74,143,232,0.12)] text-arch-blue border-[rgba(74,143,232,0.22)]",
  amber: "bg-[rgba(232,168,58,0.12)] text-arch-amber border-[rgba(232,168,58,0.22)]",
  green: "bg-[rgba(88,184,122,0.12)] text-[#58b87a] border-[rgba(88,184,122,0.22)]",
  coral: "bg-[rgba(232,112,90,0.12)] text-[#e8705a] border-[rgba(232,112,90,0.22)]",
};

const practiceIndicators: Record<string, { color: string; label: string }> = {
  do: { color: "border-l-[#58b87a]", label: "Do" },
  avoid: { color: "border-l-arch-amber", label: "Avoid" },
  tip: { color: "border-l-arch-blue", label: "Tip" },
};

const pyramidColors: Record<string, string> = {
  green: "rgba(88,184,122,0.5)",
  amber: "rgba(232,168,58,0.5)",
  coral: "rgba(232,112,90,0.5)",
};

const fileTypeBadge: Record<string, string> = {
  Unit: "green",
  Generated: "purple",
  Integration: "amber",
  Load: "coral",
};

const pipelineBadgeColors: Record<string, string> = {
  quality: "purple",
  test: "green",
  build: "blue",
  deploy: "coral",
};

const topicBorderColors: Record<string, string> = {
  teal: "rgba(62,184,154,0.5)",
  coral: "rgba(232,112,90,0.5)",
  purple: "rgba(124,111,205,0.5)",
  amber: "rgba(232,168,58,0.5)",
  green: "rgba(88,184,122,0.5)",
  blue: "rgba(74,143,232,0.5)",
};

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full border-collapse text-[11px] mb-3.5">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <div className="text-sm font-semibold text-arch-text mb-1">{title}</div>
      {subtitle && <div className="text-[11.5px] text-arch-text3 mb-3">{subtitle}</div>}
    </>
  );
}

function GoJsComparison({ goCode, goComment, jsCode, jsComment }: { goCode: string; goComment: string; jsCode: string; jsComment: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div>
        <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-teal mb-1.5">Go</div>
        <CodeBlock comment={goComment}>{goCode}</CodeBlock>
      </div>
      <div>
        <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-purple mb-1.5">JavaScript / TypeScript</div>
        <CodeBlock comment={jsComment}>{jsCode}</CodeBlock>
      </div>
    </div>
  );
}

function PracticeCards({ practices }: { practices: { type: "do" | "avoid" | "tip"; title: string; description: string }[] }) {
  return (
    <div className="space-y-2">
      {practices.map((bp, i) => {
        const indicator = practiceIndicators[bp.type];
        return (
          <div key={i} className={`bg-arch-bg2 border border-arch-border rounded-lg p-3.5 border-l-[3px] ${indicator.color}`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[9.5px] px-1.5 py-0.5 rounded border font-medium ${bp.type === "do" ? badgeColors.green : bp.type === "avoid" ? badgeColors.amber : badgeColors.blue}`}>
                {indicator.label}
              </span>
              <span className="text-[12px] font-semibold text-arch-text">{bp.title}</span>
            </div>
            <div className="text-[11.5px] text-arch-text2 leading-[1.65]">{bp.description}</div>
          </div>
        );
      })}
    </div>
  );
}

function StepList({ steps, accentColor = "teal" }: { steps: { num: number; title: string; description: string; code?: string; codeComment?: string; files?: string[] }[]; accentColor?: string }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    teal: { bg: "bg-[rgba(62,184,154,0.12)]", border: "border-arch-teal", text: "text-arch-teal" },
    blue: { bg: "bg-[rgba(74,143,232,0.12)]", border: "border-arch-blue", text: "text-arch-blue" },
    amber: { bg: "bg-[rgba(232,168,58,0.12)]", border: "border-arch-amber", text: "text-arch-amber" },
    green: { bg: "bg-[rgba(88,184,122,0.12)]", border: "border-[#58b87a]", text: "text-[#58b87a]" },
    purple: { bg: "bg-[rgba(124,111,205,0.12)]", border: "border-arch-purple", text: "text-arch-purple" },
    coral: { bg: "bg-[rgba(232,112,90,0.12)]", border: "border-[#e8705a]", text: "text-[#e8705a]" },
  };
  const c = colors[accentColor] || colors.teal;

  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div key={step.num} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 flex gap-3">
          <div className={`w-7 h-7 rounded-full ${c.bg} ${c.border} ${c.text} border text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5`}>
            {step.num}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-arch-text mb-0.5">{step.title}</div>
            <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-1.5">{step.description}</div>
            {step.files && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {step.files.map((f) => (
                  <span key={f} className="font-mono text-[9.5px] px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-teal">{f}</span>
                ))}
              </div>
            )}
            {step.code && <CodeBlock comment={step.codeComment}>{step.code}</CodeBlock>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Guide ID mapping ────────────────────────────────────────────────

const guideIdMap: Record<string, string> = {
  "lr-guide-beginners": "beginners-guide",
  "lr-guide-glossary": "glossary",
  "lr-guide-deps": "service-dependency-map",
  "lr-guide-walkthrough": "code-walkthrough",
  "lr-guide-onboarding": "repo-onboarding",
  "lr-guide-polm": "polm-fix-guide",
};

// ── Component ───────────────────────────────────────────────────────

export default function LearningsTab() {
  return (
    <SectionLayout label="Overview" items={sidebarItems} groups={sidebarGroups}>
      {(activeId) => {
        // ── Overview ──────────────────────────────────────────
        if (activeId === "lr-overview") {
          return (
            <div>
              <SectionHeader title="Learnings" subtitle="Everything you need to know about Go, the codebase, and team workflows — all in one place." />
              <div className="grid grid-cols-2 gap-3">
                {topicOverviews.map((topic) => (
                  <div
                    key={topic.group}
                    className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5"
                    style={{ borderLeftWidth: 3, borderLeftColor: topicBorderColors[topic.color] }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10.5px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[topic.color]}`}>{topic.group}</span>
                    </div>
                    <div className="text-[11px] text-arch-text2 leading-[1.65]">{topic.description}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Go Syntax: Variables, Types & Zero Values ─────────
        if (activeId === "lr-types") {
          return (
            <div>
              <SectionHeader title="Variables, types & zero values" subtitle="Go vs JavaScript: declaration, type inference, and the zero-value guarantee." />
              <DataTable headers={["Go", "JavaScript", "Note"]}>
                {typesComparisons.map((row, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6] whitespace-pre">{row.go}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-purple align-top leading-[1.6] whitespace-pre">{row.js}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{row.note}</td>
                  </tr>
                ))}
              </DataTable>

              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5 mt-4">Zero Values</div>
              <DataTable headers={["Type", "Zero Value"]}>
                {zeroValuesTable.map((row, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{row.type}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-text2 align-top leading-[1.6]">{row.zeroValue}</td>
                  </tr>
                ))}
              </DataTable>

              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5 mt-4">Type Inference & Declarations</div>
              <CodeBlock comment="// Go type inference and declaration patterns">{typeInferenceCode}</CodeBlock>

              <div className="mt-3 bg-[rgba(62,184,154,0.06)] border border-[rgba(62,184,154,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-teal mb-0.5">No undefined in Go</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  Every variable in Go has a <strong>zero value</strong> from the moment it&apos;s declared. An <code className="font-mono text-[10px] text-arch-teal">int</code> is <code className="font-mono text-[10px] text-arch-teal">0</code>, a <code className="font-mono text-[10px] text-arch-teal">string</code> is <code className="font-mono text-[10px] text-arch-teal">&quot;&quot;</code>, a <code className="font-mono text-[10px] text-arch-teal">bool</code> is <code className="font-mono text-[10px] text-arch-teal">false</code>. No <code className="font-mono text-[10px] text-arch-teal">undefined</code>, no <code className="font-mono text-[10px] text-arch-teal">null</code> surprises.
                </div>
              </div>
            </div>
          );
        }

        // ── Go Syntax: Functions & Multiple Returns ───────────
        if (activeId === "lr-functions") {
          return (
            <div>
              <SectionHeader title="Functions & multiple returns" subtitle="Go functions can return multiple values — the foundation of error handling." />
              <GoJsComparison
                goCode={functionsCode}
                goComment="// Go functions"
                jsCode={functionsJsComparison}
                jsComment="// JavaScript equivalents"
              />
              <div className="bg-[rgba(232,168,58,0.06)] border border-[rgba(232,168,58,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-amber mb-0.5">Key Difference: Multiple Returns</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  Go functions commonly return <code className="font-mono text-[10px] text-arch-teal">(result, error)</code>. This eliminates try/catch and makes error handling explicit at every call site. You&apos;ll see this pattern thousands of times in the codebase.
                </div>
              </div>
            </div>
          );
        }

        // ── Go Syntax: Structs & Composition ──────────────────
        if (activeId === "lr-structs") {
          return (
            <div>
              <SectionHeader title="Structs & composition" subtitle="Go has no classes. Structs with methods and embedding replace inheritance." />
              <GoJsComparison
                goCode={structsCode}
                goComment="// Go: structs + methods + embedding"
                jsCode={structsJsComparison}
                jsComment="// JS/TS: classes + inheritance"
              />
              <div className="bg-[rgba(62,184,154,0.06)] border border-[rgba(62,184,154,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-teal mb-0.5">Composition over Inheritance</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  Go deliberately has no class inheritance. Instead, you <strong>embed</strong> structs to compose behavior. The <code className="font-mono text-[10px] text-arch-teal">NewXxx</code> constructor pattern replaces <code className="font-mono text-[10px] text-arch-teal">new ClassName()</code>.
                </div>
              </div>
            </div>
          );
        }

        // ── Go Syntax: Pointers, Slices & Maps ───────────────
        if (activeId === "lr-pointers") {
          return (
            <div>
              <SectionHeader title="Pointers, slices & maps" subtitle="Go gives you control over memory. Pointers are explicit, slices are dynamic, maps are hash tables." />
              <GoJsComparison
                goCode={pointersCode}
                goComment="// Go: explicit pointers, slices, maps"
                jsCode={pointersJsComparison}
                jsComment="// JS: implicit reference semantics"
              />
              <div className="bg-[rgba(74,143,232,0.06)] border border-[rgba(74,143,232,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-blue mb-0.5">When to use pointers?</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  Use <code className="font-mono text-[10px] text-arch-teal">*T</code> when: (1) you need to modify the original value, (2) the struct is large and copying is expensive, (3) you need to represent &quot;no value&quot; with nil. Most structs in this codebase are passed as pointers.
                </div>
              </div>
            </div>
          );
        }

        // ── Error Handling: if err != nil ─────────────────────
        if (activeId === "lr-err-basics") {
          return (
            <div>
              <SectionHeader title="if err != nil" subtitle="Go's most distinctive pattern — and the biggest shock for JavaScript developers." />
              <GoJsComparison
                goCode={errBasicsCode}
                goComment="// Go: explicit error checking"
                jsCode={errBasicsJsCode}
                jsComment="// JS: try/catch exception handling"
              />
            </div>
          );
        }

        // ── Error Handling: Wrapping & Sentinel Errors ────────
        if (activeId === "lr-err-wrapping") {
          return (
            <div>
              <SectionHeader title="Wrapping & sentinel errors" subtitle="How to add context to errors and check for specific error types." />
              <CodeBlock comment="// Error wrapping and checking patterns">{errWrappingCode}</CodeBlock>
              <div className="mt-3 bg-[rgba(232,168,58,0.06)] border border-[rgba(232,168,58,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-amber mb-0.5">%w vs %v</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  Use <code className="font-mono text-[10px] text-arch-teal">%w</code> (not <code className="font-mono text-[10px] text-arch-teal">%v</code>) in <code className="font-mono text-[10px] text-arch-teal">fmt.Errorf</code> to <strong>wrap</strong> the original error. This preserves the error chain so <code className="font-mono text-[10px] text-arch-teal">errors.Is()</code> and <code className="font-mono text-[10px] text-arch-teal">errors.As()</code> can inspect it.
                </div>
              </div>
            </div>
          );
        }

        // ── Error Handling: Errors in This Codebase ──────────
        if (activeId === "lr-err-codebase") {
          return (
            <div>
              <SectionHeader title="Errors in this codebase" subtitle="How errors flow from connectors through services to HTTP responses." />
              <MermaidDiagram chart={errorPropagationMermaid} />
              <div className="mt-4">
                <CodeBlock comment="// Real error patterns from the codebase">{errCodebaseCode}</CodeBlock>
              </div>
            </div>
          );
        }

        // ── Concurrency: Goroutines & Channels ───────────────
        if (activeId === "lr-goroutines") {
          return (
            <div>
              <SectionHeader title="Goroutines & channels" subtitle="Go's concurrency primitives — lightweight threads communicating via typed channels." />
              <MermaidDiagram chart={goroutineLifecycleMermaid} />
              <div className="mt-4">
                <GoJsComparison
                  goCode={goroutinesCode}
                  goComment="// Go: goroutines + channels"
                  jsCode={goroutinesJsComparison}
                  jsComment="// JS: Promises (single-threaded)"
                />
              </div>
            </div>
          );
        }

        // ── Concurrency: Fan-out, Workers & Select ───────────
        if (activeId === "lr-patterns") {
          return (
            <div>
              <SectionHeader title="Fan-out, workers & select" subtitle="Common concurrency patterns: worker pools and multiplexing channels." />
              <MermaidDiagram chart={fanOutFanInMermaid} />
              <div className="mt-4">
                <CodeBlock comment="// Worker pool and select patterns">{patternsCode}</CodeBlock>
              </div>
              <div className="mt-3 bg-[rgba(124,111,205,0.06)] border border-[rgba(124,111,205,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-purple mb-0.5">select is like Promise.race</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  The <code className="font-mono text-[10px] text-arch-teal">select</code> statement waits on multiple channels simultaneously and executes the first one that&apos;s ready. It&apos;s the Go equivalent of <code className="font-mono text-[10px] text-arch-teal">Promise.race()</code>, but for channels.
                </div>
              </div>
            </div>
          );
        }

        // ── Concurrency: Context & Cancellation ──────────────
        if (activeId === "lr-context") {
          return (
            <div>
              <SectionHeader title="Context & cancellation" subtitle="Why every Go function takes ctx as its first parameter." />
              <MermaidDiagram chart={contextPropagationMermaid} />
              <div className="mt-4">
                <CodeBlock comment="// Context patterns">{contextCode}</CodeBlock>
              </div>
            </div>
          );
        }

        // ── Concurrency: sync Primitives ─────────────────────
        if (activeId === "lr-sync") {
          return (
            <div>
              <SectionHeader title="sync primitives & race detection" subtitle="WaitGroup, Mutex, Once — and the race detector that catches bugs." />
              <CodeBlock comment="// sync package patterns">{syncCode}</CodeBlock>
              <div className="mt-3 bg-[rgba(232,112,90,0.06)] border border-[rgba(232,112,90,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-[#e8705a] mb-0.5">Always run tests with -race in CI</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  The race detector (<code className="font-mono text-[10px] text-arch-teal">go test -race ./...</code>) finds data races at runtime. It catches bugs that are nearly impossible to find by reading code. Always enable it in CI.
                </div>
              </div>
            </div>
          );
        }

        // ── Interfaces: Implicit Interfaces ──────────────────
        if (activeId === "lr-interfaces") {
          return (
            <div>
              <SectionHeader title="Implicit interfaces" subtitle="Go interfaces are satisfied automatically — no 'implements' keyword needed." />
              <GoJsComparison
                goCode={interfacesCode}
                goComment="// Go: implicit interface satisfaction"
                jsCode={interfacesJsComparison}
                jsComment="// TypeScript: explicit implements"
              />
            </div>
          );
        }

        // ── Interfaces: Connector Pattern Deep Dive ──────────
        if (activeId === "lr-connector-deep") {
          return (
            <div>
              <SectionHeader title="Connector pattern deep dive" subtitle="How the codebase uses interfaces for dependency injection and testability." />
              <MermaidDiagram chart={connectorPatternMermaid} />
              <div className="mt-4">
                <CodeBlock comment="// The connector pattern in detail">{connectorDeepCode}</CodeBlock>
              </div>
            </div>
          );
        }

        // ── Interfaces: Interface Composition ────────────────
        if (activeId === "lr-composition") {
          return (
            <div>
              <SectionHeader title="Interface composition" subtitle="Compose small interfaces into larger ones — Go's alternative to inheritance hierarchies." />
              <CodeBlock comment="// Interface embedding and composition">{compositionCode}</CodeBlock>
              <div className="mt-3 bg-[rgba(232,168,58,0.06)] border border-[rgba(232,168,58,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-amber mb-0.5">Go Proverb: &quot;The bigger the interface, the weaker the abstraction&quot;</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  Keep interfaces small (1-3 methods). A service that only reads data should accept a reader interface, not a full CRUD interface. This makes mocking easier and makes the code&apos;s dependencies explicit.
                </div>
              </div>
            </div>
          );
        }

        // ── Testing: Overview & Pyramid ──────────────────────
        if (activeId === "lr-test-overview") {
          return (
            <div>
              <SectionHeader title="Testing overview & pyramid" subtitle="The testing strategy: fast unit tests at the base, fewer integration and E2E tests at the top." />
              <div className="grid grid-cols-2 gap-3 mb-4">
                {testingConcepts.map((concept) => (
                  <div
                    key={concept.title}
                    className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5"
                    style={{ borderLeftWidth: 3, borderLeftColor: concept.color === "green" ? "rgba(88,184,122,0.5)" : "rgba(232,168,58,0.5)" }}
                  >
                    <span className={`text-[10.5px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[concept.color]}`}>{concept.title}</span>
                    <div className="flex flex-wrap gap-1 my-1.5">
                      {concept.tools.map((tool) => (
                        <span key={tool} className="font-mono text-[9.5px] px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-teal">{tool}</span>
                      ))}
                    </div>
                    <div className="text-[11px] text-arch-text2 leading-[1.65]">{concept.description}</div>
                  </div>
                ))}
              </div>

              <MermaidDiagram chart={testingPyramidMermaid} />

              <div className="mt-4 space-y-2">
                {pyramidLayers.map((layer) => (
                  <div key={layer.name} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5" style={{ borderLeftWidth: 3, borderLeftColor: pyramidColors[layer.color] }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10.5px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[layer.color]}`}>{layer.name}</span>
                      <span className="font-mono text-[9.5px] px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-text3">{layer.percentage}</span>
                      <span className="font-mono text-[9.5px] px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-text3">{layer.speed}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {layer.tools.map((tool) => (
                        <span key={tool} className="font-mono text-[9.5px] px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-teal">{tool}</span>
                      ))}
                    </div>
                    <div className="text-[11px] text-arch-text2 leading-[1.65]">{layer.description}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Testing: Unit testing & testify ──────────────────
        if (activeId === "lr-test-unit") {
          return (
            <div>
              <SectionHeader title="Unit testing & testify" subtitle="Writing your first Go test with testify assertions." />
              <DataTable headers={["Path Pattern", "Type", "Description"]}>
                {testFileLocations.map((loc, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{loc.pattern}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]">
                      <span className={`text-[9.5px] px-1 py-px rounded border font-medium ${badgeColors[fileTypeBadge[loc.type]]}`}>{loc.type}</span>
                    </td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{loc.description}</td>
                  </tr>
                ))}
              </DataTable>
              {unitTestExamples.map((ex, i) => (
                <div key={i} className="mb-4">
                  <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">{ex.title}</div>
                  <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                </div>
              ))}
            </div>
          );
        }

        // ── Testing: Table-driven tests ──────────────────────
        if (activeId === "lr-test-table") {
          return (
            <div>
              <SectionHeader title="Table-driven tests" subtitle="The idiomatic Go pattern for testing multiple inputs and expected outputs." />
              {tableDrivenExamples.map((ex, i) => (
                <div key={i} className="mb-4">
                  <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">{ex.title}</div>
                  <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                </div>
              ))}
            </div>
          );
        }

        // ── Testing: httptest patterns ───────────────────────
        if (activeId === "lr-test-http") {
          return (
            <div>
              <SectionHeader title="httptest patterns" subtitle="Go's standard library for testing HTTP handlers without starting a server." />
              {httpTestExamples.map((ex, i) => (
                <div key={i} className="mb-4">
                  <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">{ex.title}</div>
                  <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                </div>
              ))}
            </div>
          );
        }

        // ── Testing: Mocking & mockery ──────────────────────
        if (activeId === "lr-test-mock") {
          return (
            <div>
              <SectionHeader title="Mocking & mockery" subtitle="Auto-generated mocks from interfaces using the connector pattern." />
              <MermaidDiagram chart={connectorPatternMermaid} />
              <div className="mt-4">
                <MermaidDiagram chart={mockGenerationFlowMermaid} />
              </div>
              <div className="mt-4 space-y-3">
                {mockeryExamples.map((ex, i) => (
                  <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[rgba(232,168,58,0.12)] border border-arch-amber text-arch-amber text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-arch-text mb-1">{ex.title}</div>
                      <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Complete realistic example</div>
                <CodeBlock comment={fullMockExample.comment}>{fullMockExample.code}</CodeBlock>
              </div>
              <div className="mt-4 space-y-4">
                {connectorPatternExamples.map((ex, i) => (
                  <div key={i}>
                    <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">{ex.title}</div>
                    <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Testing: Integration & load tests ────────────────
        if (activeId === "lr-test-integration") {
          return (
            <div>
              <SectionHeader title="Integration & load tests" subtitle="Karate BDD tests and k6 load tests for validating deployed services." />
              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Karate BDD Tests</div>
              {karateExamples.map((ex, i) => (
                <div key={i} className="mb-4">
                  <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                </div>
              ))}
              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5 mt-4">k6 Load Tests</div>
              {k6Examples.map((ex, i) => (
                <div key={i} className="mb-4">
                  <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                </div>
              ))}
            </div>
          );
        }

        // ── Testing: Commands & CI pipeline ──────────────────
        if (activeId === "lr-test-ci") {
          return (
            <div>
              <SectionHeader title="Commands & CI pipeline" subtitle="How to run tests locally and the CI pipeline that runs on every merge request." />
              <DataTable headers={["Command", "Description", "When to Use"]}>
                {testCommands.map((cmd, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6] whitespace-nowrap">{cmd.command}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{cmd.description}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{cmd.whenToUse}</td>
                  </tr>
                ))}
              </DataTable>
              <div className="mt-4">
                <MermaidDiagram chart={ciPipelineMermaid} />
              </div>
              <div className="mt-4 space-y-3">
                {ciPipelineStages.map((stage) => (
                  <div key={stage.num} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[rgba(74,143,232,0.12)] border border-arch-blue text-arch-blue text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">{stage.num}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12.5px] font-semibold text-arch-text">{stage.title}</span>
                        <span className={`text-[9px] px-1 py-px rounded border font-medium ${badgeColors[pipelineBadgeColors[stage.badge]]}`}>{stage.badge}</span>
                      </div>
                      <span className="inline-block font-mono text-[9.5px] px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-teal mb-1.5">{stage.tools}</span>
                      <div className="text-[11.5px] text-arch-text2 leading-[1.65]">{stage.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Testing: Best practices & glossary ───────────────
        if (activeId === "lr-test-practices") {
          return (
            <div>
              <SectionHeader title="Best practices & glossary" />
              <PracticeCards practices={testBestPractices} />
              <div className="mt-6">
                <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-2">Testing Glossary (Go → JS)</div>
                <DataTable headers={["Go Tool", "JS Equivalent", "What It Does"]}>
                  {testGlossary.map((term, i) => (
                    <tr key={i}>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{term.goTool}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-purple align-top leading-[1.6]">{term.jsEquivalent}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{term.whatItDoes}</td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          );
        }

        // ── API: Router & Middleware ──────────────────────────
        if (activeId === "lr-router") {
          return (
            <div>
              <SectionHeader title="Router & middleware" subtitle="How HTTP routes are registered and middleware chains process requests." />
              <MermaidDiagram chart={middlewareChainMermaid} />
              <div className="mt-4">
                <CodeBlock comment="// Router setup with chi">{routerCode}</CodeBlock>
              </div>
            </div>
          );
        }

        // ── API: Handler Patterns ────────────────────────────
        if (activeId === "lr-handlers") {
          return (
            <div>
              <SectionHeader title="Handler patterns" subtitle="Thin handler, fat service — the pattern used throughout the codebase." />
              <CodeBlock comment="// Handler and error handling patterns">{handlersCode}</CodeBlock>
              <div className="mt-3 bg-[rgba(74,143,232,0.06)] border border-[rgba(74,143,232,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-blue mb-0.5">Thin Handler, Fat Service</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  Handlers only parse HTTP requests, call the service, and write HTTP responses. All business logic lives in the service layer. This makes services easy to test without HTTP.
                </div>
              </div>
            </div>
          );
        }

        // ── API: Request/Response Encoding ───────────────────
        if (activeId === "lr-encoding") {
          return (
            <div>
              <SectionHeader title="Request/response encoding" subtitle="JSON marshaling, struct tags, and custom serialization." />
              <CodeBlock comment="// JSON encoding patterns">{encodingCode}</CodeBlock>
            </div>
          );
        }

        // ── Database: Data Architecture ──────────────────────
        if (activeId === "lr-data-arch") {
          return (
            <div>
              <SectionHeader title="Data architecture" subtitle={dataArchDescription} />
              <MermaidDiagram chart={dataOwnershipMermaid} />
            </div>
          );
        }

        // ── Database: Query & Transaction Patterns ───────────
        if (activeId === "lr-queries") {
          return (
            <div>
              <SectionHeader title="Query & transaction patterns" subtitle="Raw SQL, parameterized queries, and database transactions." />
              <CodeBlock comment="// SQL and transaction patterns">{queriesCode}</CodeBlock>
            </div>
          );
        }

        // ── Database: Migrations ─────────────────────────────
        if (activeId === "lr-migrations") {
          return (
            <div>
              <SectionHeader title="Migrations" subtitle="How database schema changes are managed with versioned migration files." />
              <CodeBlock comment="// Migration file patterns">{migrationsCode}</CodeBlock>
            </div>
          );
        }

        // ── Config: Config Loading ───────────────────────────
        if (activeId === "lr-config") {
          return (
            <div>
              <SectionHeader title="Config loading" subtitle="Environment variables mapped to typed config structs, validated at startup." />
              <CodeBlock comment="// Config loading pattern">{configCode}</CodeBlock>
            </div>
          );
        }

        // ── Config: Secrets Management ───────────────────────
        if (activeId === "lr-secrets") {
          return (
            <div>
              <SectionHeader title="Secrets management" subtitle="Where secrets live and how to add new configuration values." />
              <CodeBlock comment="// Secrets and environment management">{secretsCode}</CodeBlock>
            </div>
          );
        }

        // ── Observability: Structured Logging ────────────────
        if (activeId === "lr-logging") {
          return (
            <div>
              <SectionHeader title="Structured logging" subtitle="JSON-formatted logs with typed fields — searchable and parseable." />
              <CodeBlock comment="// Structured logging with slog">{loggingCode}</CodeBlock>
            </div>
          );
        }

        // ── Observability: Distributed Tracing ───────────────
        if (activeId === "lr-tracing") {
          return (
            <div>
              <SectionHeader title="Distributed tracing" subtitle="Follow a request across multiple services using trace IDs." />
              <MermaidDiagram chart={tracePropagationMermaid} />
              <div className="mt-4">
                <CodeBlock comment="// Adding tracing spans">{tracingCode}</CodeBlock>
              </div>
            </div>
          );
        }

        // ── Observability: Debugging & Profiling ─────────────
        if (activeId === "lr-debugging") {
          return (
            <div>
              <SectionHeader title="Debugging & profiling" subtitle="Tools for finding bugs, memory leaks, and performance bottlenecks." />
              <DataTable headers={["Scenario", "Tool", "Command"]}>
                {debuggingScenarios.map((row, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6]">{row.scenario}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{row.tool}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-text2 align-top leading-[1.6]">{row.command}</td>
                  </tr>
                ))}
              </DataTable>
              <div className="mt-3">
                <CodeBlock comment="// Debugging tools">{debuggingCode}</CodeBlock>
              </div>
            </div>
          );
        }

        // ── Local Dev: Prerequisites ─────────────────────────
        if (activeId === "lr-prereqs") {
          return (
            <div>
              <SectionHeader title="Prerequisites & install" subtitle="Everything you need installed before running the project locally." />
              <DataTable headers={["Tool", "Check Command", "Version"]}>
                {prereqsChecklist.map((row, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6]">{row.item}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{row.command}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-text2 align-top leading-[1.6]">{row.version}</td>
                  </tr>
                ))}
              </DataTable>
              <div className="mt-3 bg-[rgba(74,143,232,0.06)] border border-[rgba(74,143,232,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-blue mb-0.5">VS Code Extensions</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  Install the <strong>Go</strong> extension by the Go team. It provides: auto-complete, go to definition, inline error diagnostics, auto-format on save, and integrated test running. Also recommended: <strong>Error Lens</strong> for inline errors.
                </div>
              </div>
            </div>
          );
        }

        // ── Local Dev: Running Services ──────────────────────
        if (activeId === "lr-running") {
          return (
            <div>
              <SectionHeader title="Running services locally" subtitle="From clone to running: all the commands you need." />
              <CodeBlock comment="# Getting started">{runningCode}</CodeBlock>
            </div>
          );
        }

        // ── Local Dev: Troubleshooting ───────────────────────
        if (activeId === "lr-troubleshoot") {
          return (
            <div>
              <SectionHeader title="Troubleshooting" subtitle="Common issues and how to fix them." />
              <DataTable headers={["Problem", "Cause", "Fix"]}>
                {troubleshootTable.map((row, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6]">{row.problem}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{row.cause}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-text2 align-top leading-[1.6]">{row.fix}</td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── Deployment: Pipeline Overview ────────────────────
        if (activeId === "lr-deploy-pipeline") {
          return (
            <div>
              <SectionHeader title="Pipeline overview" subtitle="From git push to production — the deployment pipeline." />
              <MermaidDiagram chart={deploymentPipelineMermaid} />
              <div className="mt-4">
                <StepList steps={deployPipelineSteps} accentColor="purple" />
              </div>
            </div>
          );
        }

        // ── Deployment: Kubernetes Basics ────────────────────
        if (activeId === "lr-k8s") {
          return (
            <div>
              <SectionHeader title="Kubernetes basics" subtitle="Pods, services, and deployments — what you need to know for this project." />
              <CodeBlock comment="# Kubernetes manifests for the service">{k8sBasicsCode}</CodeBlock>
            </div>
          );
        }

        // ── Deployment: Rollbacks & Health Checks ────────────
        if (activeId === "lr-rollback") {
          return (
            <div>
              <SectionHeader title="Rollbacks & health checks" subtitle="How to roll back a bad deployment and how health checks protect uptime." />
              <CodeBlock comment="// Rollback commands and health check implementation">{rollbackCode}</CodeBlock>
            </div>
          );
        }

        // ── Code Review: Go Checklist ────────────────────────
        if (activeId === "lr-review-go") {
          return (
            <div>
              <SectionHeader title="Go review checklist" subtitle="What to look for when reviewing Go code." />
              <PracticeCards practices={reviewGoPractices} />
            </div>
          );
        }

        // ── Code Review: Repo Conventions ────────────────────
        if (activeId === "lr-review-repo") {
          return (
            <div>
              <SectionHeader title="Repo conventions" subtitle="Project-specific conventions for pull requests and code organization." />
              <PracticeCards practices={reviewRepoPractices} />
            </div>
          );
        }

        // ── Common Tasks: Adding Endpoints & Consumers ──────
        if (activeId === "lr-task-endpoints") {
          return (
            <div>
              <SectionHeader title="Adding endpoints & consumers" subtitle="Step-by-step: how to add a new API endpoint or Kafka consumer." />
              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-2">Adding a REST Endpoint</div>
              <StepList steps={addEndpointSteps} accentColor="teal" />
              <div className="mt-6">
                <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-2">Adding a Kafka Consumer</div>
                <StepList steps={addConsumerSteps} accentColor="amber" />
              </div>
            </div>
          );
        }

        // ── Common Tasks: Adding Connectors & Flags ─────────
        if (activeId === "lr-task-connectors") {
          return (
            <div>
              <SectionHeader title="Adding connectors & flags" subtitle="Step-by-step: how to add a new external dependency or feature flag." />
              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-2">Adding a New Connector</div>
              <StepList steps={addConnectorSteps} accentColor="blue" />
              <div className="mt-6">
                <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-2">Adding a Feature Flag</div>
                <StepList steps={addFlagSteps} accentColor="green" />
              </div>
            </div>
          );
        }

        // ── Common Tasks: Debugging CI ───────────────────────
        if (activeId === "lr-task-debug") {
          return (
            <div>
              <SectionHeader title="Debugging CI" subtitle="How to diagnose and fix common CI and Lambda issues." />
              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-2">Debugging Failing CI</div>
              <StepList steps={debugCISteps} accentColor="coral" />
              <div className="mt-6">
                <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-2">Debugging Lambda Timeouts</div>
                <StepList steps={debugLambdaSteps} accentColor="purple" />
              </div>
            </div>
          );
        }

        // ── Go Guides (markdown content) ─────────────────────
        const guideOriginalId = guideIdMap[activeId];
        if (guideOriginalId) {
          const guide = guides.find((g) => g.id === guideOriginalId);
          if (guide) {
            return (
              <div>
                <div className="mb-4">
                  <p className="text-[11px] text-arch-text3">{guide.description}</p>
                </div>
                <MarkdownRenderer content={guide.content} />
              </div>
            );
          }
        }

        return null;
      }}
    </SectionLayout>
  );
}
