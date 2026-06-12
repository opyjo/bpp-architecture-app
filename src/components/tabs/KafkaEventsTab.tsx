"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import CodeBlock from "@/components/ui/CodeBlock";
import { kafkaConsumers, supportingInfra, kafkaEvents } from "@/data/events";

const sidebarItems = [
  { id: "ev-overview", label: "Overview" },
  ...kafkaEvents.map((e) => ({ id: e.id, label: e.title })),
];

export default function KafkaEventsTab() {
  return (
    <SectionLayout label="Events" items={sidebarItems}>
      {(activeId) => {
        if (activeId === "ev-overview") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Kafka event overview</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">
                Published by <code className="font-mono text-[10px] bg-arch-bg3 border border-arch-border rounded px-1 py-px text-arch-teal">reseller-service</code> on every subscription change. Consumers react asynchronously — the UI never touches Kafka directly.
              </div>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 mb-3">
                <div className="text-[11px] font-semibold text-arch-amber font-mono mb-2.5">
                  reseller-service publishes → Kafka
                </div>
                <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-[rgba(232,168,58,0.2)]">
                  {kafkaConsumers.map((c) => (
                    <div key={c.title} className="bg-arch-bg3 border border-arch-border rounded-md px-3 py-2">
                      <div className="text-[11px] font-semibold text-arch-text font-mono">{c.title}</div>
                      <div className="text-[10.5px] text-arch-text2 mt-0.5">{c.body}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-[9.5px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Supporting infrastructure</div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="text-left px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Service</th>
                    <th className="text-left px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {supportingInfra.map((r, i) => (
                    <tr key={i}>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10px] align-top leading-[1.6]">{r.service}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        const event = kafkaEvents.find((e) => e.id === activeId);
        if (event) {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">{event.title}</div>
              <div className="bg-arch-bg2 border border-arch-border rounded-lg p-3.5 mb-2.5">
                <div className="text-[10px] font-mono text-arch-teal mb-1.5">Topic: {event.topic}</div>
                <CodeBlock>{event.payload}</CodeBlock>
              </div>
            </div>
          );
        }

        return null;
      }}
    </SectionLayout>
  );
}
