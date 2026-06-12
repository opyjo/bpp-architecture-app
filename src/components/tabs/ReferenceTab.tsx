"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import CodeBlock from "@/components/ui/CodeBlock";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import {
  uiEnvironments, goServicePatterns, bilingualRouting,
  authContexts, tokenFlow, accountIsolation,
  featureFlags, featureFlagUseCases,
  designDecisions, glossary, changelog,
  onboardingChecklist, happyPathTrace,
} from "@/data/reference";

const sidebarItems = [
  { id: "r-onboarding", label: "Onboarding checklist" },
  { id: "r-happypath", label: "Happy path trace" },
  { id: "r-env", label: "Environments" },
  { id: "r-auth", label: "Auth & security" },
  { id: "r-flags", label: "Feature flags" },
  { id: "r-decisions", label: "Design decisions" },
  { id: "r-glossary", label: "Glossary" },
  { id: "r-changelog", label: "Changelog" },
];

const badgeColors: Record<string, string> = {
  blue: "bg-[rgba(74,143,232,0.12)] text-arch-blue border-[rgba(74,143,232,0.22)]",
  teal: "bg-[rgba(62,184,154,0.12)] text-arch-teal border-[rgba(62,184,154,0.22)]",
  amber: "bg-[rgba(232,168,58,0.12)] text-arch-amber border-[rgba(232,168,58,0.22)]",
  purple: "bg-[rgba(124,111,205,0.14)] text-arch-purple border-[rgba(124,111,205,0.22)]",
};

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full border-collapse text-[11px] mb-3.5">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} className="text-left px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export default function ReferenceTab() {
  return (
    <SectionLayout label="Sections" items={sidebarItems}>
      {(activeId) => {
        if (activeId === "r-onboarding") {
          return <MarkdownRenderer content={onboardingChecklist} />;
        }

        if (activeId === "r-happypath") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Happy path trace — &quot;Add Netflix&quot;</div>
              <div className="text-[11.5px] text-arch-text3 mb-4">Follow a complete Add Netflix request from login to activation across every service.</div>
              <div className="space-y-3">
                {happyPathTrace.map((step) => (
                  <div key={step.num} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-[rgba(74,143,232,0.12)] border border-arch-blue text-arch-blue text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-arch-text mb-0.5">{step.title}</div>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        <span className="inline-block font-mono text-[9px] px-1.5 py-px rounded bg-[rgba(124,111,205,0.12)] border border-[rgba(124,111,205,0.22)] text-arch-purple">{step.service}</span>
                        <span className="inline-block font-mono text-[9px] px-1.5 py-px rounded bg-arch-bg3 border border-arch-border text-arch-teal">{step.apiCall}</span>
                      </div>
                      <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-1.5">{step.description}</div>
                      <div className="text-[10px] text-arch-text3 font-mono leading-[1.5] bg-arch-bg3 border border-arch-border rounded px-2 py-1.5">{step.dataFlow}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (activeId === "r-env") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">{"Environments & deployment"}</div>
              <div className="text-[9.5px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">UI environments</div>
              <DataTable headers={["Environment", "URL"]}>
                {uiEnvironments.map((r, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]"><span className="inline-block bg-arch-bg3 border border-arch-border rounded px-1.5 py-px text-[9.5px] text-arch-text3">{r.env}</span></td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{r.url}</td>
                  </tr>
                ))}
              </DataTable>
              <div className="text-[9.5px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Go services URL pattern</div>
              <DataTable headers={["Environment", "Pattern"]}>
                {goServicePatterns.map((r, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]"><span className="inline-block bg-arch-bg3 border border-arch-border rounded px-1.5 py-px text-[9.5px] text-arch-text3">{r.env}</span></td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{r.pattern}</td>
                  </tr>
                ))}
              </DataTable>
              <div className="text-[9.5px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Bilingual routing</div>
              <DataTable headers={["Language", "URL path", "Notes"]}>
                {bilingualRouting.map((r, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.lang}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[10px] text-arch-teal align-top leading-[1.6]">{r.path}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.notes}</td>
                  </tr>
                ))}
              </DataTable>
              <div className="text-[11px] text-arch-text3 mt-1">Translations from <code className="font-mono text-[9.5px] text-arch-teal">UXP.Services/Common/localization</code> CMS with local JSON fallback.</div>
            </div>
          );
        }

        if (activeId === "r-auth") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">{"Authentication & security"}</div>
              <div className="text-[9.5px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Auth contexts</div>
              <DataTable headers={["Context", "Method", "Who uses it"]}>
                {authContexts.map((r, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10px] align-top leading-[1.6]">{r.context}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.method}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.who}</td>
                  </tr>
                ))}
              </DataTable>
              <div className="text-[9.5px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Token flow</div>
              <CodeBlock>{tokenFlow}</CodeBlock>
              <div className="text-[9.5px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Account isolation</div>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2.5 text-[11.5px] text-arch-text2 leading-[1.7]">{accountIsolation}</div>
            </div>
          );
        }

        if (activeId === "r-flags") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">{"Feature flags & configuration"}</div>
              <DataTable headers={["System", "Endpoint", "Evaluated by", "Used for"]}>
                {featureFlags.map((r, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10px] align-top leading-[1.6]">{r.system}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] font-mono text-[9.5px] text-arch-teal align-top leading-[1.6]">{r.endpoint}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.evaluatedBy}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.usedFor}</td>
                  </tr>
                ))}
              </DataTable>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2.5 text-[11.5px] text-arch-text2 leading-[1.8]">
                {featureFlagUseCases.map((u, i) => (
                  <div key={i}>• {u}</div>
                ))}
              </div>
            </div>
          );
        }

        if (activeId === "r-decisions") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Key design decisions</div>
              {designDecisions.map((d, i) => (
                <div key={i} className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 mb-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badgeColors[d.color]}`}>{d.badge}</span>
                  <div className="text-[11.5px] text-arch-text2 leading-[1.65] mt-1.5">{d.body}</div>
                </div>
              ))}
            </div>
          );
        }

        if (activeId === "r-glossary") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Glossary</div>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[80px_160px_1fr]">
                  <div className="px-2 py-1 text-[9px] font-semibold tracking-[0.09em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Term</div>
                  <div className="px-2 py-1 text-[9px] font-semibold tracking-[0.09em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Full name</div>
                  <div className="px-2 py-1 text-[9px] font-semibold tracking-[0.09em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">What it means here</div>
                </div>
                {glossary.map((g, i) => (
                  <div key={i} className="grid grid-cols-[80px_160px_1fr] border-b border-white/[0.04] last:border-b-0 text-[10.5px] leading-[1.6]">
                    <div className="px-2 py-1.5 text-arch-amber font-mono text-[10px] font-semibold border-r border-white/[0.04]">{g.term}</div>
                    <div className="px-2 py-1.5 text-arch-text3 text-[10px] border-r border-white/[0.04]">{g.full}</div>
                    <div className="px-2 py-1.5 text-arch-text2">{g.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (activeId === "r-changelog") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Changelog</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">
                Fill in dates from <code className="font-mono text-[9.5px] text-arch-teal">git log --oneline --all</code> across go-repo-new and the subscription-manager repo.
              </div>
              <DataTable headers={["Date", "Change", "Reason"]}>
                {changelog.map((c, i) => (
                  <tr key={i}>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10px] align-top leading-[1.6]">{c.date}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{c.change}</td>
                    <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{c.reason}</td>
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
