"use client";

import SectionLayout from "@/components/ui/SectionLayout";
import CodeBlock from "@/components/ui/CodeBlock";
import { mutations, restCalls, accountIdentifiers, subscriptionFields, sessionFields } from "@/data/payloads";

const mutationItems = mutations.map((m) => ({ id: m.id, label: m.title }));
const dataItems = [
  { id: "p-rest", label: "REST calls" },
  { id: "p-models", label: "Data models" },
];

export default function PayloadsTab() {
  return (
    <SectionLayout
      label="Mutations"
      items={mutationItems}
      extraItems={{ label: "Data", items: dataItems }}
    >
      {(activeId) => {
        const mutation = mutations.find((m) => m.id === activeId);
        if (mutation) {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">{mutation.title}</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">{mutation.description}</div>
              {mutation.request && (
                <>
                  <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Request</div>
                  <CodeBlock comment={mutation.requestComment}>{mutation.request}</CodeBlock>
                </>
              )}
              {mutation.response && (
                <>
                  <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Response</div>
                  <CodeBlock>{mutation.response}</CodeBlock>
                </>
              )}
            </div>
          );
        }

        if (activeId === "p-rest") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">REST calls</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">Two REST endpoints used by the BFF — one bypasses AppSync entirely.</div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Endpoint</th>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">BFF route</th>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Service</th>
                    <th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {restCalls.map((r, i) => (
                    <tr key={i}>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10.5px] align-top leading-[1.6]">{r.endpoint}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.bffRoute}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.service}</td>
                      <td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.returns}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (activeId === "p-models") {
          return (
            <div>
              <div className="text-sm font-semibold text-arch-text mb-1">Shared data models</div>
              <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3.5">Types that flow between UI GraphQL queries and Go service responses.</div>

              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Account identifiers</div>
              <table className="w-full border-collapse text-[11px] mb-3.5">
                <thead><tr><th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Field</th><th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Description</th></tr></thead>
                <tbody>{accountIdentifiers.map((r, i) => (
                  <tr key={i}><td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10.5px] align-top leading-[1.6]">{r.field}</td><td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.description}</td></tr>
                ))}</tbody>
              </table>

              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Subscription</div>
              <table className="w-full border-collapse text-[11px] mb-3.5">
                <thead><tr><th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Field</th><th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Type</th><th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Values / description</th></tr></thead>
                <tbody>{subscriptionFields.map((r, i) => (
                  <tr key={i}><td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10.5px] align-top leading-[1.6]">{r.field}</td><td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]"><span className="inline-block bg-arch-bg3 border border-arch-border rounded px-1.5 py-px text-[10px] text-arch-text3">{r.type}</span></td><td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.description}</td></tr>
                ))}</tbody>
              </table>

              <div className="text-[10px] font-semibold tracking-[0.09em] uppercase text-arch-text3 mt-4 mb-1.5">Session</div>
              <table className="w-full border-collapse text-[11px]">
                <thead><tr><th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Field</th><th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Type</th><th className="text-left px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.08em] uppercase text-arch-text3 bg-white/[0.02] border-b border-arch-border">Description</th></tr></thead>
                <tbody>{sessionFields.map((r, i) => (
                  <tr key={i}><td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-purple font-mono text-[10.5px] align-top leading-[1.6]">{r.field}</td><td className="px-2.5 py-1.5 border-b border-white/[0.04] align-top leading-[1.6]"><span className="inline-block bg-arch-bg3 border border-arch-border rounded px-1.5 py-px text-[10px] text-arch-text3">{r.type}</span></td><td className="px-2.5 py-1.5 border-b border-white/[0.04] text-arch-text2 align-top leading-[1.6]">{r.description}</td></tr>
                ))}</tbody>
              </table>
            </div>
          );
        }

        return null;
      }}
    </SectionLayout>
  );
}
