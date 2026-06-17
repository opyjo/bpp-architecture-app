"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import CodeBlock from "@/components/ui/CodeBlock";
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

const sidebarItems = [
  { id: "gt-overview", label: "Overview" },
  { id: "gt-pyramid", label: "Testing pyramid" },
  { id: "gt-file-map", label: "Where tests live" },
];

const sidebarGroups = [
  {
    label: "Unit Testing",
    items: [
      { id: "gt-first-test", label: "Your first Go test" },
      { id: "gt-testify", label: "testify assertions" },
      { id: "gt-table-driven", label: "Table-driven tests" },
      { id: "gt-httptest", label: "httptest patterns" },
    ],
  },
  {
    label: "Mocking",
    items: [
      { id: "gt-connector", label: "Connector pattern" },
      { id: "gt-mockery", label: "mockery code generation" },
      { id: "gt-mock-example", label: "Mocking in practice" },
    ],
  },
  {
    label: "Integration & E2E",
    items: [
      { id: "gt-karate", label: "Karate BDD tests" },
      { id: "gt-k6", label: "k6 load tests" },
    ],
  },
  {
    label: "Running & CI",
    items: [
      { id: "gt-commands", label: "Test commands" },
      { id: "gt-ci-pipeline", label: "CI pipeline stages" },
      { id: "gt-best-practices", label: "Best practices" },
      { id: "gt-glossary", label: "Testing glossary" },
    ],
  },
];

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

export default function GoTestingTab() {
  return (
    <SectionLayout label="Overview" items={sidebarItems} groups={sidebarGroups}>
      {(activeId) => {
        // ── Overview ──────────────────────────────────────────────
        if (activeId === "gt-overview") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Go Testing</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-4">
                The subscription management platform uses a <strong>layered testing strategy</strong> combining Go&apos;s built-in testing with testify assertions, mockery-generated mocks, Karate BDD tests, and k6 load tests. Unit tests provide fast feedback on every commit, while integration and load tests validate the system as a whole.
              </div>

              {/* Concept cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {testingConcepts.map((concept) => (
                  <div
                    key={concept.title}
                    className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5"
                    style={{ borderLeftWidth: 3, borderLeftColor: concept.color === "green" ? "rgba(88,184,122,0.5)" : "rgba(232,168,58,0.5)" }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10.5px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[concept.color]}`}>
                        {concept.title}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {concept.tools.map((tool) => (
                        <span key={tool} className="font-mono text-[9.5px] px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-teal">{tool}</span>
                      ))}
                    </div>
                    <div className="text-[11px] text-arch-text2 leading-[1.65]">{concept.description}</div>
                  </div>
                ))}
              </div>

              {/* Coming from JS callout */}
              <div className="bg-[rgba(232,168,58,0.06)] border border-[rgba(232,168,58,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-amber mb-0.5">Coming from JavaScript?</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  Go testing feels different from Jest/Vitest. There&apos;s no <code className="font-mono text-[10px] text-arch-teal">describe</code>/<code className="font-mono text-[10px] text-arch-teal">it</code> — just functions named <code className="font-mono text-[10px] text-arch-teal">TestXxx(t *testing.T)</code>. Instead of <code className="font-mono text-[10px] text-arch-teal">expect().toBe()</code>, you use <code className="font-mono text-[10px] text-arch-teal">assert.Equal(t, want, got)</code>. Mocks are generated from interfaces (not monkey-patched), and test files live next to the code they test with a <code className="font-mono text-[10px] text-arch-teal">_test.go</code> suffix.
                </div>
              </div>
            </div>
          );
        }

        // ── Testing Pyramid ───────────────────────────────────────
        if (activeId === "gt-pyramid") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Testing pyramid</div>
              <div className="text-[11.5px] text-arch-text3 mb-3">
                The testing strategy follows the classic pyramid — many fast unit tests at the base, fewer integration tests in the middle, and a small number of E2E/load tests at the top.
              </div>
              <MermaidDiagram chart={testingPyramidMermaid} />

              <div className="mt-4 space-y-2">
                {pyramidLayers.map((layer) => (
                  <div
                    key={layer.name}
                    className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5"
                    style={{ borderLeftWidth: 3, borderLeftColor: pyramidColors[layer.color] }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10.5px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[layer.color]}`}>
                        {layer.name}
                      </span>
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

        // ── Where Tests Live ──────────────────────────────────────
        if (activeId === "gt-file-map") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Where tests live</div>
              <div className="text-[11.5px] text-arch-text3 mb-3">
                Test file locations follow Go conventions and project structure.
              </div>
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
              <div className="mt-3 bg-[rgba(74,143,232,0.06)] border border-[rgba(74,143,232,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-blue mb-0.5">Go convention: _test.go</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  Go test files always end with <code className="font-mono text-[10px] text-arch-teal">_test.go</code> and live in the <strong>same directory</strong> as the code they test. The Go compiler automatically excludes <code className="font-mono text-[10px] text-arch-teal">_test.go</code> files from production builds — no build config needed.
                </div>
              </div>
            </div>
          );
        }

        // ── Your First Go Test ────────────────────────────────────
        if (activeId === "gt-first-test") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Your first Go test</div>
              <div className="text-[11.5px] text-arch-text3 mb-4">Four steps from zero to a passing test.</div>
              <div className="space-y-3">
                {[
                  { num: 1, title: "Create the test file", desc: "Create a file ending in _test.go next to the code you want to test.", example: unitTestExamples[0] },
                  { num: 2, title: "Write a test function", desc: "Name it TestXxx and accept *testing.T. The function name must start with 'Test'.", example: unitTestExamples[0] },
                  { num: 3, title: "Add testify assertions", desc: "Use assert.Equal or require.NoError instead of manual if/t.Errorf checks.", example: unitTestExamples[1] },
                  { num: 4, title: "Run the test", desc: "Use go test ./... to run all tests, or go test -v ./internal/service/... for a specific package.", example: null },
                ].map((step) => (
                  <div key={step.num} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[rgba(62,184,154,0.12)] border border-arch-teal text-arch-teal text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-arch-text mb-0.5">{step.title}</div>
                      <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-2">{step.desc}</div>
                      {step.example && (
                        <CodeBlock comment={step.example.comment}>{step.example.code}</CodeBlock>
                      )}
                      {step.num === 4 && (
                        <CodeBlock comment="# Run from project root">{`go test ./...
# Or run a specific package with verbose output:
go test -v ./internal/service/...`}</CodeBlock>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── testify Assertions ────────────────────────────────────
        if (activeId === "gt-testify") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">testify assertions</div>
              <div className="text-[11.5px] text-arch-text3 mb-4">testify provides three packages for different testing needs.</div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { name: "assert", color: "green", desc: "Continues on failure. Reports all failures at end of test." },
                  { name: "require", color: "coral", desc: "Stops immediately on failure. Use for preconditions (e.g., no error)." },
                  { name: "suite", color: "blue", desc: "Groups tests with shared SetupTest/TearDownTest lifecycle hooks." },
                ].map((pkg) => (
                  <div key={pkg.name} className="bg-arch-bg2 border border-arch-border rounded-lg p-3" style={{ borderTopWidth: 2, borderTopColor: pkg.color === "green" ? "rgba(88,184,122,0.5)" : pkg.color === "coral" ? "rgba(232,112,90,0.5)" : "rgba(74,143,232,0.5)" }}>
                    <div className={`text-[10.5px] px-1.5 py-0.5 rounded border font-medium inline-block mb-1.5 ${badgeColors[pkg.color]}`}>{pkg.name}</div>
                    <div className="text-[11px] text-arch-text2 leading-[1.65]">{pkg.desc}</div>
                  </div>
                ))}
              </div>

              {unitTestExamples.slice(1).map((ex, i) => (
                <div key={i} className="mb-4">
                  <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">{ex.title}</div>
                  <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                </div>
              ))}
            </div>
          );
        }

        // ── Table-Driven Tests ────────────────────────────────────
        if (activeId === "gt-table-driven") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Table-driven tests</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-4">
                Table-driven tests are the <strong>idiomatic Go pattern</strong> for testing multiple inputs and expected outputs. Define test cases as a slice of structs, then loop over them with <code className="font-mono text-[10px] text-arch-teal">t.Run(tt.name, ...)</code>. Each sub-test is named, so you can run individual cases with <code className="font-mono text-[10px] text-arch-teal">go test -run TestValidate/valid_Canadian</code>.
              </div>

              {tableDrivenExamples.map((ex, i) => (
                <div key={i} className="mb-4">
                  <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">{ex.title}</div>
                  <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                </div>
              ))}
            </div>
          );
        }

        // ── httptest Patterns ─────────────────────────────────────
        if (activeId === "gt-httptest") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">httptest patterns</div>
              <div className="text-[11.5px] text-arch-text3 mb-4">
                Go&apos;s standard library includes <code className="font-mono text-[10px] text-arch-teal">net/http/httptest</code> for testing HTTP handlers — no external dependency needed.
              </div>

              {httpTestExamples.map((ex, i) => (
                <div key={i} className="mb-4">
                  <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">{ex.title}</div>
                  <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                </div>
              ))}

              <div className="bg-[rgba(62,184,154,0.06)] border border-[rgba(62,184,154,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-teal mb-0.5">stdlib — no external dependency</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  Unlike JS where you need supertest or similar, Go&apos;s <code className="font-mono text-[10px] text-arch-teal">httptest</code> is part of the standard library. <code className="font-mono text-[10px] text-arch-teal">NewRecorder</code> tests handlers in-process (fast, no network), while <code className="font-mono text-[10px] text-arch-teal">NewServer</code> starts a real HTTP server on localhost for integration-style tests.
                </div>
              </div>
            </div>
          );
        }

        // ── Connector Pattern ─────────────────────────────────────
        if (activeId === "gt-connector") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Connector pattern</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-3">
                The connector pattern is how the codebase achieves <strong>dependency injection</strong>. Services accept interfaces, and production code wires in real implementations while tests wire in mocks. This is the foundation of all unit testing in the project.
              </div>
              <MermaidDiagram chart={connectorPatternMermaid} />

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

        // ── mockery Code Generation ───────────────────────────────
        if (activeId === "gt-mockery") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">mockery code generation</div>
              <div className="text-[11.5px] text-arch-text3 mb-3">
                mockery reads Go interfaces and auto-generates mock implementations with type-safe <code className="font-mono text-[10px] text-arch-teal">.EXPECT()</code> methods.
              </div>
              <MermaidDiagram chart={mockGenerationFlowMermaid} />

              <div className="mt-4 space-y-3">
                {mockeryExamples.map((ex, i) => (
                  <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[rgba(232,168,58,0.12)] border border-arch-amber text-arch-amber text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-arch-text mb-1">{ex.title}</div>
                      <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Mocking in Practice ───────────────────────────────────
        if (activeId === "gt-mock-example") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Mocking in practice</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-4">
                A complete, realistic test showing the full pattern: <strong>create mocks → set expectations → call service → assert results → verify mocks</strong>. This is how most service-layer tests in the codebase look.
              </div>

              <CodeBlock comment={fullMockExample.comment}>{fullMockExample.code}</CodeBlock>

              <div className="mt-4 bg-[rgba(74,143,232,0.06)] border border-[rgba(74,143,232,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-blue mb-0.5">Pattern breakdown</div>
                <div className="text-[11px] text-arch-text2 leading-[1.8]">
                  <strong>Arrange:</strong> Create mock instances with <code className="font-mono text-[10px] text-arch-teal">mocks.NewMock...(t)</code> and set expectations with <code className="font-mono text-[10px] text-arch-teal">.EXPECT()</code><br/>
                  <strong>Act:</strong> Call the service method under test<br/>
                  <strong>Assert:</strong> Check the return values with <code className="font-mono text-[10px] text-arch-teal">require</code>/<code className="font-mono text-[10px] text-arch-teal">assert</code>, then verify mocks with <code className="font-mono text-[10px] text-arch-teal">.AssertExpectations(t)</code>
                </div>
              </div>
            </div>
          );
        }

        // ── Karate BDD Tests ──────────────────────────────────────
        if (activeId === "gt-karate") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Karate BDD tests</div>
              <div className="text-[11.5px] text-arch-text3 mb-4">
                Karate uses Gherkin syntax (Given/When/Then) to write API integration tests as human-readable feature files.
              </div>

              {karateExamples.map((ex, i) => (
                <div key={i} className="mb-4">
                  <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">{ex.title}</div>
                  <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                </div>
              ))}

              <DataTable headers={["Scenario Type", "Description", "Example"]}>
                {[
                  { type: "Happy path", desc: "Validate correct behavior with valid inputs", example: "Activate subscription → 200 + active status" },
                  { type: "Error handling", desc: "Verify proper error responses for invalid inputs", example: "Invalid merchant ID → 400 + error message" },
                  { type: "Auth", desc: "Ensure endpoints require proper authentication", example: "Missing token → 401 Unauthorized" },
                  { type: "Contract", desc: "Validate response structure matches API spec", example: "Response has required fields: id, status, createdAt" },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6]">{row.type}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{row.desc}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{row.example}</td>
                  </tr>
                ))}
              </DataTable>

              <div className="mt-3 bg-[rgba(232,168,58,0.06)] border border-[rgba(232,168,58,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-amber mb-0.5">Not Go — Java/Gherkin</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  Karate tests are written in Gherkin syntax and run on the JVM. You don&apos;t need to know Java — the .feature files are self-contained. These tests run against deployed services, not in-process.
                </div>
              </div>
            </div>
          );
        }

        // ── k6 Load Tests ─────────────────────────────────────────
        if (activeId === "gt-k6") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">k6 load tests</div>
              <div className="text-[11.5px] text-arch-text3 mb-4">
                k6 simulates concurrent users hitting API endpoints to validate performance and find bottlenecks before production.
              </div>

              {k6Examples.map((ex, i) => (
                <div key={i} className="mb-4">
                  <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">{ex.title}</div>
                  <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                </div>
              ))}

              <DataTable headers={["Metric", "Target", "What It Means"]}>
                {[
                  { metric: "p(95) response time", target: "< 300ms", meaning: "95% of requests complete under 300ms" },
                  { metric: "p(99) response time", target: "< 500ms", meaning: "99% of requests complete under 500ms" },
                  { metric: "Error rate", target: "< 1%", meaning: "Less than 1% of requests return errors" },
                  { metric: "Throughput", target: "> 100 req/s", meaning: "System handles at least 100 requests per second" },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6]">{row.metric}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{row.target}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{row.meaning}</td>
                  </tr>
                ))}
              </DataTable>

              <div className="mt-3 bg-[rgba(232,168,58,0.06)] border border-[rgba(232,168,58,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-amber mb-0.5">Not Go — JavaScript</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  k6 test scripts are written in JavaScript (ES6). If you know JS, you already know how to write k6 tests. The k6 binary is a Go application, but the scripts themselves are JS.
                </div>
              </div>
            </div>
          );
        }

        // ── Test Commands ─────────────────────────────────────────
        if (activeId === "gt-commands") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Test commands</div>
              <div className="text-[11.5px] text-arch-text3 mb-3">Common commands for running Go tests locally and in CI.</div>
              <DataTable headers={["Command", "Description", "When to Use"]}>
                {testCommands.map((cmd, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6] whitespace-nowrap">{cmd.command}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{cmd.description}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{cmd.whenToUse}</td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── CI Pipeline Stages ────────────────────────────────────
        if (activeId === "gt-ci-pipeline") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">CI pipeline stages</div>
              <div className="text-[11.5px] text-arch-text3 mb-3">
                Every merge request passes through six stages before code reaches production.
              </div>
              <MermaidDiagram chart={ciPipelineMermaid} />

              <div className="mt-4 space-y-3">
                {ciPipelineStages.map((stage) => (
                  <div key={stage.num} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[rgba(74,143,232,0.12)] border border-arch-blue text-arch-blue text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {stage.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12.5px] font-semibold text-arch-text">{stage.title}</span>
                        <span className={`text-[9px] px-1 py-px rounded border font-medium ${badgeColors[pipelineBadgeColors[stage.badge]]}`}>{stage.badge}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        <span className="inline-block font-mono text-[9.5px] px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-teal">{stage.tools}</span>
                      </div>
                      <div className="text-[11.5px] text-arch-text2 leading-[1.65]">{stage.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Best Practices ────────────────────────────────────────
        if (activeId === "gt-best-practices") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Best practices</div>
              <div className="text-[11.5px] text-arch-text3 mb-4">Guidelines for writing effective Go tests in the subscription management platform.</div>
              <div className="space-y-2">
                {testBestPractices.map((bp, i) => {
                  const indicator = practiceIndicators[bp.type];
                  return (
                    <div
                      key={i}
                      className={`bg-arch-bg2 border border-arch-border rounded-lg p-3.5 border-l-[3px] ${indicator.color}`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9.5px] px-1.5 py-0.5 rounded border font-medium ${
                          bp.type === "do" ? badgeColors.green : bp.type === "avoid" ? badgeColors.amber : badgeColors.blue
                        }`}>
                          {indicator.label}
                        </span>
                        <span className="text-[12px] font-semibold text-arch-text">{bp.title}</span>
                      </div>
                      <div className="text-[11.5px] text-arch-text2 leading-[1.65]">{bp.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // ── Testing Glossary ──────────────────────────────────────
        if (activeId === "gt-glossary") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Testing glossary</div>
              <div className="text-[11.5px] text-arch-text3 mb-3">Go testing tools mapped to their JavaScript equivalents.</div>
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
          );
        }

        return null;
      }}
    </SectionLayout>
  );
}
