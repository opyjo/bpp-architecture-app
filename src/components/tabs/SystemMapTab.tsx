"use client";

import { useMemo, useState } from "react";
import {
  allServiceDeepDives,
  getServiceById,
  type ServiceDeepDive,
} from "@/data/service-deep-dives";
import { getServiceDependencies } from "@/lib/impact-analyzer";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Search,
  Network,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  Database,
  Zap,
  Target,
  Boxes,
} from "lucide-react";

/* ───────────────────────── helpers ───────────────────────── */

type AccentKey =
  | "blue"
  | "purple"
  | "teal"
  | "amber"
  | "green"
  | "coral"
  | "red";

const ACCENT_TEXT: Record<AccentKey, string> = {
  blue: "text-arch-blue",
  purple: "text-arch-purple",
  teal: "text-arch-teal",
  amber: "text-arch-amber",
  green: "text-arch-green",
  coral: "text-arch-coral",
  red: "text-arch-red",
};
const ACCENT_DOT: Record<AccentKey, string> = {
  blue: "bg-arch-blue",
  purple: "bg-arch-purple",
  teal: "bg-arch-teal",
  amber: "bg-arch-amber",
  green: "bg-arch-green",
  coral: "bg-arch-coral",
  red: "bg-arch-red",
};

function accentOf(s: ServiceDeepDive): AccentKey {
  const c = s.accentColor as AccentKey;
  return c in ACCENT_TEXT ? c : "blue";
}

/** Resolve a dependency's `service` string to a real deep-dive, if one exists. */
function resolveService(ref: string): ServiceDeepDive | undefined {
  return allServiceDeepDives.find(
    (s) => s.name === ref || s.displayName === ref || s.id === ref
  );
}

/** Build a centered `graph LR` mermaid string for the selected service. */
function buildCenteredMermaid(service: ServiceDeepDive): string {
  const nodeId = (s: ServiceDeepDive) => s.id.replace(/[^a-zA-Z0-9]/g, "_");
  const refId = (ref: string) => "ext_" + ref.replace(/[^a-zA-Z0-9]/g, "_");
  const esc = (t: string) => t.replace(/["[\]{}]/g, "").replace(/\n/g, " ");

  const lines: string[] = ["graph LR"];
  lines.push("  classDef selected fill:#4a8fe8,stroke:#2f6fc4,color:#fff,stroke-width:2px");
  lines.push("  classDef upstream fill:#9a6ef0,stroke:#7d4fd6,color:#fff");
  lines.push("  classDef downstream fill:#2bb8a6,stroke:#1f9183,color:#fff");

  const src = nodeId(service);
  lines.push(`  ${src}["${esc(service.displayName)}"]`);
  lines.push(`  class ${src} selected`);

  const seen = new Set<string>([src]);

  for (const dep of service.technical.dependencies) {
    const match = resolveService(dep.service);
    const id = match ? nodeId(match) : refId(dep.service);
    const label = match ? match.displayName : dep.service;
    if (!seen.has(id)) {
      lines.push(`  ${id}["${esc(label)}"]`);
      seen.add(id);
    }
    if (dep.direction === "upstream") {
      // upstream = this service calls/depends on it → arrow points away
      lines.push(`  ${src} -->|${esc(dep.protocol)}| ${id}`);
      lines.push(`  class ${id} upstream`);
    } else {
      lines.push(`  ${id} -->|${esc(dep.protocol)}| ${src}`);
      lines.push(`  class ${id} downstream`);
    }
  }

  // Reverse edges: other services that declare a dependency ON this one (downstream dependents).
  for (const other of allServiceDeepDives) {
    if (other.id === service.id) continue;
    const rev = other.technical.dependencies.find(
      (d) =>
        d.service === service.name ||
        d.service === service.displayName ||
        d.service === service.id
    );
    if (!rev) continue;
    const id = nodeId(other);
    if (!seen.has(id)) {
      lines.push(`  ${id}["${esc(other.displayName)}"]`);
      seen.add(id);
    }
    lines.push(`  ${id} -.->|${esc(rev.protocol)}| ${src}`);
    lines.push(`  class ${id} downstream`);
  }

  return lines.join("\n");
}

/* ───────────────────────── small UI atoms ───────────────────────── */

function Chip({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: AccentKey;
}) {
  const ring: Record<AccentKey, string> = {
    blue: "border-arch-blue/30 bg-arch-blue/10 text-arch-blue",
    purple: "border-arch-purple/30 bg-arch-purple/10 text-arch-purple",
    teal: "border-arch-teal/30 bg-arch-teal/10 text-arch-teal",
    amber: "border-arch-amber/30 bg-arch-amber/10 text-arch-amber",
    green: "border-arch-green/30 bg-arch-green/10 text-arch-green",
    coral: "border-arch-coral/30 bg-arch-coral/10 text-arch-coral",
    red: "border-arch-red/30 bg-arch-red/10 text-arch-red",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium",
        ring[accent]
      )}
    >
      {children}
    </span>
  );
}

function Panel({
  title,
  count,
  icon,
  accent,
  children,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  accent: AccentKey;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-arch-bg2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-arch-text2">
          <span className={cn("flex items-center gap-2", ACCENT_TEXT[accent])}>
            {icon}
            {title}
          </span>
          <span className="rounded-md bg-arch-bg3 px-1.5 py-0.5 font-mono text-[10px] text-arch-text3">
            {count}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">{children}</CardContent>
    </Card>
  );
}

/* ───────────────────────── main ───────────────────────── */

export default function SystemMapTab() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const services = useMemo(
    () =>
      [...allServiceDeepDives].sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      ),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.business.purpose.toLowerCase().includes(q)
    );
  }, [services, query]);

  const selected = selectedId ? getServiceById(selectedId) : undefined;

  const chart = useMemo(
    () => (selected ? buildCenteredMermaid(selected) : ""),
    [selected]
  );

  const blastNodes = useMemo(
    () => (selected ? getServiceDependencies(selected.id) : []),
    [selected]
  );

  // Derived, defensive groupings off the real data shapes.
  const groups = useMemo(() => {
    if (!selected)
      return {
        upstream: [] as { service: string; protocol: string; description: string }[],
        downstream: [] as { service: string; protocol: string; description: string }[],
        produced: [] as { topic: string; event: string; description: string }[],
        consumed: [] as { topic: string; event: string; description: string }[],
        tables: [] as { entity: string; description: string }[],
        lambdas: [] as string[],
      };

    const deps = selected.technical.dependencies;
    const events = selected.technical.kafkaEvents;

    // Lambdas: derive from consumers / stakeholders that mention "Lambda".
    const lambdaSet = new Set<string>();
    const mine = [
      ...selected.business.consumers,
      ...selected.business.stakeholders,
    ];
    for (const line of mine) {
      const m = line.match(/([\w-]+)\s+Lambda/gi);
      if (m) m.forEach((x) => lambdaSet.add(x.trim()));
    }

    return {
      upstream: deps
        .filter((d) => d.direction === "upstream")
        .map((d) => ({ service: d.service, protocol: d.protocol, description: d.description })),
      downstream: deps
        .filter((d) => d.direction === "downstream")
        .map((d) => ({ service: d.service, protocol: d.protocol, description: d.description })),
      produced: events
        .filter((e) => e.direction === "publishes")
        .map((e) => ({ topic: e.topic, event: e.event, description: e.description })),
      consumed: events
        .filter((e) => e.direction === "consumes")
        .map((e) => ({ topic: e.topic, event: e.event, description: e.description })),
      tables: (selected.technical.dataModel ?? []).map((d) => ({
        entity: d.entity,
        description: d.description,
      })),
      lambdas: [...lambdaSet],
    };
  }, [selected]);

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* ───── Left: service list ───── */}
      <div className="flex w-72 shrink-0 flex-col rounded-xl border border-arch-border bg-arch-bg2">
        <div className="border-b border-arch-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-arch-text2">
              <Network className="size-3.5 text-arch-blue" />
              Services
            </span>
            <span className="rounded-md bg-arch-bg3 px-1.5 py-0.5 font-mono text-[10px] text-arch-text3">
              {filtered.length}/{services.length}
            </span>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-arch-text3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services…"
              className="w-full rounded-lg border border-arch-border bg-arch-bg3 py-1.5 pl-8 pr-2.5 text-[13px] text-arch-text placeholder:text-arch-text3 focus:border-arch-blue focus:outline-none focus:ring-1 focus:ring-arch-blue/40"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-[12px] text-arch-text3">
              No services match “{query}”.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((s) => {
                const accent = accentOf(s);
                const active = s.id === selectedId;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => setSelectedId(s.id)}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                        active
                          ? "bg-arch-blue/15 ring-1 ring-arch-blue/40"
                          : "hover:bg-arch-bg3"
                      )}
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          ACCENT_DOT[accent]
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-[13px] font-medium",
                            active ? "text-arch-text" : "text-arch-text2"
                          )}
                        >
                          {s.displayName}
                        </span>
                        <span className="block truncate font-mono text-[10px] text-arch-text3">
                          {s.name}
                        </span>
                      </span>
                      {s.status === "decommissioned" && (
                        <span className="shrink-0 rounded bg-arch-red/15 px-1 py-0.5 text-[9px] font-semibold uppercase text-arch-red">
                          EOL
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ───── Right: detail ───── */}
      <div className="flex-1 overflow-y-auto pr-1">
        {!selected ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-arch-border bg-arch-bg2/40 text-center">
            <Boxes className="size-10 text-arch-text3" />
            <p className="text-sm font-medium text-arch-text2">
              Select a service to map its blast radius
            </p>
            <p className="max-w-xs text-[12px] text-arch-text3">
              See upstream dependencies, downstream dependents, events, owned
              data, and an interactive impact graph.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <Card className="bg-arch-bg2">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle
                      className={cn(
                        "flex items-center gap-2 text-lg",
                        ACCENT_TEXT[accentOf(selected)]
                      )}
                    >
                      <Target className="size-5" />
                      {selected.displayName}
                    </CardTitle>
                    <p className="mt-0.5 font-mono text-[11px] text-arch-text3">
                      {selected.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="rounded-lg border border-arch-border bg-arch-bg3 px-3 py-1.5 text-center">
                      <div className="font-mono text-base font-semibold text-arch-amber">
                        {blastNodes.length}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-arch-text3">
                        Blast radius
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-arch-text2">
                  {selected.business.purpose}
                </p>
              </CardHeader>
            </Card>

            {/* Diagram + legend */}
            <Card className="bg-arch-bg2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-arch-text2">
                  <span className="flex items-center gap-2 text-arch-blue">
                    <Network className="size-3.5" />
                    Blast radius map
                  </span>
                  <span className="flex items-center gap-3 normal-case tracking-normal">
                    <LegendDot className="bg-[#4a8fe8]" label="Selected" />
                    <LegendDot className="bg-[#9a6ef0]" label="Upstream" />
                    <LegendDot className="bg-[#2bb8a6]" label="Downstream" />
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MermaidDiagram chart={chart} />
              </CardContent>
            </Card>

            {/* Panels */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {groups.upstream.length > 0 && (
                <Panel
                  title="Upstream dependencies"
                  count={groups.upstream.length}
                  icon={<ArrowUpRight className="size-3.5" />}
                  accent="purple"
                >
                  {groups.upstream.map((d, i) => (
                    <Chip key={i} accent="purple">
                      <span className="font-semibold">{d.service}</span>
                      <span className="text-arch-text3">· {d.protocol}</span>
                    </Chip>
                  ))}
                </Panel>
              )}

              {groups.downstream.length > 0 && (
                <Panel
                  title="Downstream dependents"
                  count={groups.downstream.length}
                  icon={<ArrowDownRight className="size-3.5" />}
                  accent="teal"
                >
                  {groups.downstream.map((d, i) => (
                    <Chip key={i} accent="teal">
                      <span className="font-semibold">{d.service}</span>
                      <span className="text-arch-text3">· {d.protocol}</span>
                    </Chip>
                  ))}
                </Panel>
              )}

              {groups.produced.length > 0 && (
                <Panel
                  title="Events produced"
                  count={groups.produced.length}
                  icon={<Radio className="size-3.5" />}
                  accent="green"
                >
                  {groups.produced.map((e, i) => (
                    <Chip key={i} accent="green">
                      <span className="font-mono text-[10px] text-arch-text3">
                        {e.topic}.
                      </span>
                      <span className="font-semibold">{e.event}</span>
                    </Chip>
                  ))}
                </Panel>
              )}

              {groups.consumed.length > 0 && (
                <Panel
                  title="Events consumed"
                  count={groups.consumed.length}
                  icon={<Radio className="size-3.5" />}
                  accent="amber"
                >
                  {groups.consumed.map((e, i) => (
                    <Chip key={i} accent="amber">
                      <span className="font-mono text-[10px] text-arch-text3">
                        {e.topic}.
                      </span>
                      <span className="font-semibold">{e.event}</span>
                    </Chip>
                  ))}
                </Panel>
              )}

              {groups.lambdas.length > 0 && (
                <Panel
                  title="Lambdas"
                  count={groups.lambdas.length}
                  icon={<Zap className="size-3.5" />}
                  accent="coral"
                >
                  {groups.lambdas.map((l, i) => (
                    <Chip key={i} accent="coral">
                      <span className="font-semibold">{l}</span>
                    </Chip>
                  ))}
                </Panel>
              )}

              {groups.tables.length > 0 && (
                <Panel
                  title="Owned data entities"
                  count={groups.tables.length}
                  icon={<Database className="size-3.5" />}
                  accent="blue"
                >
                  {groups.tables.map((t, i) => (
                    <Chip key={i} accent="blue">
                      <span className="font-semibold">{t.entity}</span>
                    </Chip>
                  ))}
                </Panel>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-arch-text3">
      <span className={cn("size-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}
