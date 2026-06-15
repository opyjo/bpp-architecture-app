"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import { lambdaFunctions, serviceGroups, TriggerType } from "@/data/lambdas";

const overviewItem = [{ id: "lf-overview", label: "Overview" }];

const groups = serviceGroups.map((sg) => ({
  label: sg.label,
  items: lambdaFunctions
    .filter((lf) => lf.serviceGroup === sg.id)
    .map((lf) => ({ id: lf.id, label: lf.name })),
}));

const triggerColors: Record<TriggerType, { bg: string; text: string }> = {
  AppSync: { bg: "bg-arch-purple/15 border-arch-purple/30", text: "text-arch-purple" },
  SQS: { bg: "bg-arch-amber/15 border-arch-amber/30", text: "text-arch-amber" },
  EventBridge: { bg: "bg-arch-blue/15 border-arch-blue/30", text: "text-arch-blue" },
  S3: { bg: "bg-arch-green/15 border-arch-green/30", text: "text-arch-green" },
  "Step Function": { bg: "bg-arch-teal/15 border-arch-teal/30", text: "text-arch-teal" },
};

function TriggerBadge({ type }: { type: TriggerType }) {
  const c = triggerColors[type];
  return (
    <span className={`inline-block border rounded px-1.5 py-px text-[10px] font-medium ${c.bg} ${c.text}`}>
      {type}
    </span>
  );
}

function ServiceBadge({ group }: { group: string }) {
  return (
    <span className="inline-block bg-white/[0.06] border border-arch-border rounded px-1.5 py-px text-[10px] text-arch-text2 font-mono">
      {group}
    </span>
  );
}

export default function LambdaFunctionsTab() {
  const triggerCounts = lambdaFunctions.reduce<Record<string, number>>((acc, lf) => {
    acc[lf.triggerType] = (acc[lf.triggerType] || 0) + 1;
    return acc;
  }, {});

  return (
    <SectionLayout label="Overview" items={overviewItem} groups={groups}>
      {(activeId) => {
        if (activeId === "lf-overview") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Lambda functions overview</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">
                {lambdaFunctions.length} Lambda functions deployed across {serviceGroups.length} serverless services in the Go repository.
              </div>

              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Trigger distribution</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(triggerCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <TriggerBadge type={type as TriggerType} />
                    <span className="text-[11px] text-arch-text2">{count}</span>
                  </div>
                ))}
              </div>

              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Service groups</div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Service</th>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Lambdas</th>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceGroups.map((sg) => {
                    const count = lambdaFunctions.filter((lf) => lf.serviceGroup === sg.id).length;
                    return (
                      <tr key={sg.id}>
                        <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10.5px] align-top leading-[1.6]">{sg.label}</td>
                        <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6] text-center">{count}</td>
                        <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{sg.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }

        const lf = lambdaFunctions.find((l) => l.id === activeId);
        if (!lf) return null;

        return (
          <div>
            <div className="text-sm font-semibold text-arch-text mb-2">{lf.name}</div>
            <div className="flex items-center gap-2 mb-3">
              <TriggerBadge type={lf.triggerType} />
              <ServiceBadge group={lf.serviceGroup} />
            </div>
            <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-4">{lf.description}</div>

            {lf.triggerDetail && (
              <>
                <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Trigger</div>
                <div className="text-[11px] text-arch-text2 mb-3">{lf.triggerDetail}</div>
              </>
            )}

            <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">External services</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {lf.externalServices.map((svc) => (
                <span
                  key={svc}
                  className="inline-block bg-arch-bg3 border border-arch-border rounded px-2 py-0.5 text-[10.5px] text-arch-teal font-mono"
                >
                  {svc}
                </span>
              ))}
            </div>

            <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Input</div>
            <div className="bg-arch-bg2 border border-arch-border rounded-md px-3 py-2 text-[11px] text-arch-text2 leading-[1.65] mb-3">
              {lf.input}
            </div>

            <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Output</div>
            <div className="bg-arch-bg2 border border-arch-border rounded-md px-3 py-2 text-[11px] text-arch-text2 leading-[1.65]">
              {lf.output}
            </div>
          </div>
        );
      }}
    </SectionLayout>
  );
}
