"use client";

import { useState } from "react";
import { serviceGroups, groupConnections } from "@/data/system-overview";

export default function SystemOverview() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["core"]));
  const [highlighted, setHighlighted] = useState<string | null>(null);

  function toggleGroup(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function getConnected(id: string): string[] {
    return groupConnections
      .filter(([a, b]) => a === id || b === id)
      .map(([a, b]) => (a === id ? b : a));
  }

  const connectedGroups = highlighted ? new Set([highlighted, ...getConnected(highlighted)]) : null;

  const totalServices = serviceGroups.reduce((sum, g) => sum + g.services.length, 0);

  return (
    <div>
      <div className="text-sm font-semibold text-arch-text mb-1">System overview</div>
      <div className="text-[11.5px] text-arch-text2 leading-[1.65] mb-3">
        All {totalServices} go-repo services grouped by domain. Click a group header to expand. Hover to see connections.
      </div>

      <div className="grid grid-cols-2 gap-2">
        {serviceGroups.map((group) => {
          const isExpanded = expanded.has(group.id);
          const isDimmed = connectedGroups && !connectedGroups.has(group.id);

          return (
            <div
              key={group.id}
              className={`bg-arch-bg2 border rounded-lg overflow-hidden transition-opacity ${
                isDimmed ? "opacity-30 border-arch-border" : "border-arch-border"
              }`}
              onMouseEnter={() => setHighlighted(group.id)}
              onMouseLeave={() => setHighlighted(null)}
            >
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors text-left"
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: group.color }}
                />
                <span className="text-[11.5px] font-semibold text-arch-text flex-1">
                  {group.name}
                </span>
                <span className="text-[9.5px] font-mono text-arch-text3 bg-arch-bg3 px-1.5 py-0.5 rounded">
                  {group.services.length}
                </span>
                <svg
                  className={`w-3 h-3 text-arch-text3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded services */}
              {isExpanded && (
                <div className="border-t border-arch-border">
                  {group.services.map((svc) => (
                    <div
                      key={svc.name}
                      className="px-3 py-1.5 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02]"
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[10px] text-arch-text" style={{ color: group.color }}>
                          {svc.name}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-arch-text3 leading-[1.5] mt-0.5">
                        {svc.description}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {svc.tech.split(", ").map((t) => (
                          <span
                            key={t}
                            className="inline-block text-[9px] font-mono px-1 py-px rounded bg-arch-bg3 border border-arch-border text-arch-text3"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
