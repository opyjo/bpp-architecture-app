"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import CodeBlock from "@/components/ui/CodeBlock";
import {
  featureFlagSystems,
  flagLifecycleSteps,
  clientSideCodeExamples,
  serverSideCodeExamples,
  flagUseCases,
  flagBestPractices,
  targetingStrategies,
  flagArchitectureMermaid,
  clientEvalMermaid,
  serverEvalMermaid,
  flagDecisionTreeMermaid,
} from "@/data/feature-flags";

const sidebarItems = [
  { id: "ff-overview", label: "Overview" },
  { id: "ff-architecture", label: "Architecture diagram" },
  { id: "ff-decision", label: "Which system to use?" },
];

const sidebarGroups = [
  {
    label: "Systems",
    items: [
      { id: "ff-unleash", label: "Unleash (client-side)" },
      { id: "ff-goff", label: "Go Feature Flags (server)" },
      { id: "ff-comparison", label: "Side-by-side comparison" },
    ],
  },
  {
    label: "How It Works",
    items: [
      { id: "ff-lifecycle", label: "Flag lifecycle" },
      { id: "ff-client-eval", label: "Client-side evaluation" },
      { id: "ff-server-eval", label: "Server-side evaluation" },
      { id: "ff-targeting", label: "Targeting strategies" },
    ],
  },
  {
    label: "Code & Practices",
    items: [
      { id: "ff-code-frontend", label: "Frontend code examples" },
      { id: "ff-code-backend", label: "Backend code examples" },
      { id: "ff-use-cases", label: "Use cases at Bell" },
      { id: "ff-best-practices", label: "Best practices" },
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

const useCaseTypeColors: Record<string, string> = {
  Release: "purple",
  Experiment: "blue",
  Ops: "amber",
  Permission: "teal",
};

const practiceIndicators: Record<string, { color: string; label: string }> = {
  do: { color: "border-l-[#58b87a]", label: "Do" },
  avoid: { color: "border-l-arch-amber", label: "Avoid" },
  tip: { color: "border-l-arch-blue", label: "Tip" },
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

export default function FeatureFlagsTab() {
  return (
    <SectionLayout label="Overview" items={sidebarItems} groups={sidebarGroups}>
      {(activeId) => {
        // ── Overview ──────────────────────────────────────────────
        if (activeId === "ff-overview") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Feature Flags</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-4">
                The subscription management platform uses <strong>two complementary feature flag systems</strong> to control rollouts, experiments, and operational toggles. Client-side flags manage what users see in the browser, while server-side flags gate backend business logic.
              </div>

              {/* System cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {featureFlagSystems.map((sys) => (
                  <div
                    key={sys.name}
                    className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5"
                    style={{ borderLeftWidth: 3, borderLeftColor: sys.color === "purple" ? "rgba(124,111,205,0.5)" : "rgba(62,184,154,0.5)" }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10.5px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[sys.color]}`}>
                        {sys.name}
                      </span>
                      <span className="text-[9.5px] text-arch-text3">{sys.side}-side</span>
                    </div>
                    <div className="text-[11px] text-arch-text2 leading-[1.65]">{sys.description}</div>
                  </div>
                ))}
              </div>

              {/* Use cases bullet list */}
              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Common use cases</div>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2.5 text-[11.5px] text-arch-text2 leading-[1.8] mb-4">
                {flagUseCases.map((u, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`inline-block text-[9px] px-1 py-px rounded border font-medium mt-0.5 shrink-0 ${badgeColors[useCaseTypeColors[u.type]]}`}>
                      {u.type}
                    </span>
                    <span>{u.title}</span>
                  </div>
                ))}
              </div>

              {/* Safe default callout */}
              <div className="bg-[rgba(232,168,58,0.06)] border border-[rgba(232,168,58,0.2)] rounded-lg px-3 py-2.5">
                <div className="text-[10.5px] font-semibold text-arch-amber mb-0.5">Safe defaults</div>
                <div className="text-[11px] text-arch-text2 leading-[1.65]">
                  Both systems are configured to return <code className="font-mono text-[10px] text-arch-teal">false</code> (OFF) when the flag service is unreachable. This means a flag service outage never accidentally enables unfinished features — the application continues running with its existing, stable behavior.
                </div>
              </div>
            </div>
          );
        }

        // ── Architecture Diagram ──────────────────────────────────
        if (activeId === "ff-architecture") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Feature flag architecture</div>
              <div className="text-[11.5px] text-arch-text3 mb-3">
                Bird&apos;s-eye view of both feature flag systems and how they integrate with the subscription management platform.
              </div>
              <MermaidDiagram chart={flagArchitectureMermaid} />
            </div>
          );
        }

        // ── Decision Tree ─────────────────────────────────────────
        if (activeId === "ff-decision") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Which system should I use?</div>
              <div className="text-[11.5px] text-arch-text3 mb-3">
                Follow this decision tree to pick the right feature flag system for your use case.
              </div>
              <MermaidDiagram chart={flagDecisionTreeMermaid} />
              <div className="mt-4">
                <DataTable headers={["Scenario", "System", "Why"]}>
                  <tr>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">Show/hide a UI button</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]"><span className={`text-[10px] px-1 py-px rounded border font-medium ${badgeColors.purple}`}>Unleash</span></td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">Purely visual, no backend impact</td>
                  </tr>
                  <tr>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">Gate a new API integration</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]"><span className={`text-[10px] px-1 py-px rounded border font-medium ${badgeColors.teal}`}>GOFF</span></td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">Business logic in Go services</td>
                  </tr>
                  <tr>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">New subscription type rollout</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]"><span className={`text-[10px] px-1 py-px rounded border font-medium ${badgeColors.amber}`}>Both</span></td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">UI visibility + backend activation logic</td>
                  </tr>
                  <tr>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">Kill switch for external API</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]"><span className={`text-[10px] px-1 py-px rounded border font-medium ${badgeColors.teal}`}>GOFF</span></td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">Ops toggle for server-side behavior</td>
                  </tr>
                </DataTable>
              </div>
            </div>
          );
        }

        // ── Unleash Detail ────────────────────────────────────────
        if (activeId === "ff-unleash") {
          const unleash = featureFlagSystems.find((s) => s.name === "Unleash")!;
          return (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-sm font-semibold text-arch-text">Unleash</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badgeColors.purple}`}>Client-side</span>
              </div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-4">{unleash.description}</div>

              <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 mb-4">
                <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-2">Key details</div>
                {unleash.details.map((d, i) => (
                  <div key={i} className="flex gap-2 text-[11px] leading-[1.8]">
                    <span className="text-arch-text3 shrink-0 w-20">{d.label}</span>
                    <span className="text-arch-text2">{d.value}</span>
                  </div>
                ))}
              </div>

              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">Provider setup</div>
              <CodeBlock comment={clientSideCodeExamples[0].comment}>{clientSideCodeExamples[0].code}</CodeBlock>
            </div>
          );
        }

        // ── GOFF Detail ───────────────────────────────────────────
        if (activeId === "ff-goff") {
          const goff = featureFlagSystems.find((s) => s.name === "Go Feature Flags")!;
          return (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-sm font-semibold text-arch-text">Go Feature Flags</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badgeColors.teal}`}>Server-side</span>
              </div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.7] mb-4">{goff.description}</div>

              <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 mb-4">
                <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-2">Key details</div>
                {goff.details.map((d, i) => (
                  <div key={i} className="flex gap-2 text-[11px] leading-[1.8]">
                    <span className="text-arch-text3 shrink-0 w-20">{d.label}</span>
                    <span className="text-arch-text2">{d.value}</span>
                  </div>
                ))}
              </div>

              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">SDK initialization</div>
              <CodeBlock comment={serverSideCodeExamples[0].comment}>{serverSideCodeExamples[0].code}</CodeBlock>
            </div>
          );
        }

        // ── Comparison Table ──────────────────────────────────────
        if (activeId === "ff-comparison") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Side-by-side comparison</div>
              <div className="text-[11.5px] text-arch-text3 mb-3">How the two feature flag systems differ across key dimensions.</div>
              <DataTable headers={["Feature", "Unleash", "Go Feature Flags"]}>
                {[
                  { feature: "Side", unleash: "Client (browser)", goff: "Server (Go services)" },
                  { feature: "SDK", unleash: "unleash-proxy-client-react", goff: "OpenFeature Go SDK + GOFF provider" },
                  { feature: "Protocol", unleash: "REST (polling ~15s)", goff: "gRPC (primary) / REST (fallback)" },
                  { feature: "Flag storage", unleash: "GitLab feature flags", goff: "YAML config files in Git" },
                  { feature: "Evaluation", unleash: "In browser via SDK", goff: "In Go service via relay proxy" },
                  { feature: "Management UI", unleash: "GitLab → Feature Flags", goff: "YAML files (code review)" },
                  { feature: "Targeting", unleash: "User ID, percentage", goff: "User ID, percentage, account type, region" },
                  { feature: "Safe default", unleash: "OFF when proxy unreachable", goff: "Default value when relay proxy down" },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6]">{row.feature}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{row.unleash}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{row.goff}</td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── Lifecycle ─────────────────────────────────────────────
        if (activeId === "ff-lifecycle") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Flag lifecycle</div>
              <div className="text-[11.5px] text-arch-text3 mb-4">A feature flag goes through six stages from creation to cleanup.</div>
              <div className="space-y-3">
                {flagLifecycleSteps.map((step) => (
                  <div key={step.num} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[rgba(74,143,232,0.12)] border border-arch-blue text-arch-blue text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-arch-text mb-0.5">{step.title}</div>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        <span className="inline-block font-mono text-[9.5px] px-1.5 py-px rounded bg-[rgba(124,111,205,0.12)] border border-[rgba(124,111,205,0.22)] text-arch-purple">{step.who}</span>
                        <span className="inline-block font-mono text-[9.5px] px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-teal">{step.tools}</span>
                      </div>
                      <div className="text-[11.5px] text-arch-text2 leading-[1.65]">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Client Evaluation ─────────────────────────────────────
        if (activeId === "ff-client-eval") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Client-side evaluation flow</div>
              <div className="text-[11.5px] text-arch-text3 mb-3">
                How a feature flag is evaluated in the browser using the Unleash React SDK.
              </div>
              <MermaidDiagram chart={clientEvalMermaid} />
              <div className="mt-4 bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2.5 text-[11.5px] text-arch-text2 leading-[1.7]">
                The Unleash SDK polls the proxy at a configurable interval (~15 seconds). Flag evaluations are <strong>instant</strong> after the first fetch because they read from the local cache. If the proxy is unreachable, the SDK uses cached values or falls back to <code className="font-mono text-[10px] text-arch-teal">false</code>.
              </div>
            </div>
          );
        }

        // ── Server Evaluation ─────────────────────────────────────
        if (activeId === "ff-server-eval") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Server-side evaluation flow</div>
              <div className="text-[11.5px] text-arch-text3 mb-3">
                How a feature flag is evaluated inside Go microservices using the OpenFeature SDK and GOFF relay proxy.
              </div>
              <MermaidDiagram chart={serverEvalMermaid} />
              <div className="mt-4 bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2.5 text-[11.5px] text-arch-text2 leading-[1.7]">
                The Go service passes an <strong>evaluation context</strong> (user ID, account type, region) with each flag check. The GOFF relay proxy applies targeting rules and returns the evaluated value. If the relay proxy is unreachable, the <code className="font-mono text-[10px] text-arch-teal">defaultValue</code> parameter is returned.
              </div>
            </div>
          );
        }

        // ── Targeting Strategies ──────────────────────────────────
        if (activeId === "ff-targeting") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Targeting strategies</div>
              <div className="text-[11.5px] text-arch-text3 mb-3">How to control which users or services see a feature flag as ON.</div>
              <DataTable headers={["Strategy", "Description", "System", "Example"]}>
                {targetingStrategies.map((t, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text font-medium align-top leading-[1.6]">{t.strategy}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{t.description}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]">
                      <span className={`text-[9.5px] px-1 py-px rounded border font-medium ${t.system === "Both" ? badgeColors.amber : t.system === "Unleash" ? badgeColors.purple : badgeColors.teal}`}>
                        {t.system}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{t.example}</td>
                  </tr>
                ))}
              </DataTable>
            </div>
          );
        }

        // ── Frontend Code Examples ────────────────────────────────
        if (activeId === "ff-code-frontend") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Frontend code examples</div>
              <div className="text-[11.5px] text-arch-text3 mb-4">React / TypeScript patterns for using Unleash feature flags in the subscription manager UI.</div>
              {clientSideCodeExamples.map((ex, i) => (
                <div key={i} className="mb-4">
                  <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">{ex.title}</div>
                  <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                </div>
              ))}
            </div>
          );
        }

        // ── Backend Code Examples ─────────────────────────────────
        if (activeId === "ff-code-backend") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Backend code examples</div>
              <div className="text-[11.5px] text-arch-text3 mb-4">Go patterns for using OpenFeature SDK with Go Feature Flags in backend microservices.</div>
              {serverSideCodeExamples.map((ex, i) => (
                <div key={i} className="mb-4">
                  <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mb-1.5">{ex.title}</div>
                  <CodeBlock comment={ex.comment}>{ex.code}</CodeBlock>
                </div>
              ))}
            </div>
          );
        }

        // ── Use Cases ─────────────────────────────────────────────
        if (activeId === "ff-use-cases") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Use cases at Bell</div>
              <div className="text-[11.5px] text-arch-text3 mb-4">Concrete examples of how feature flags are used in the subscription management platform.</div>
              <div className="space-y-2">
                {flagUseCases.map((uc, i) => (
                  <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[useCaseTypeColors[uc.type]]}`}>
                        {uc.type}
                      </span>
                      <span className={`text-[9.5px] px-1 py-px rounded border font-medium ${uc.system === "Both" ? badgeColors.amber : uc.system === "Unleash" ? badgeColors.purple : badgeColors.teal}`}>
                        {uc.system}
                      </span>
                    </div>
                    <div className="text-[12px] font-semibold text-arch-text mb-0.5">{uc.title}</div>
                    <div className="text-[11.5px] text-arch-text2 leading-[1.65]">{uc.description}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // ── Best Practices ────────────────────────────────────────
        if (activeId === "ff-best-practices") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Best practices</div>
              <div className="text-[11.5px] text-arch-text3 mb-4">Guidelines for working with feature flags in the subscription management platform.</div>
              <div className="space-y-2">
                {flagBestPractices.map((bp, i) => {
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

        return null;
      }}
    </SectionLayout>
  );
}
