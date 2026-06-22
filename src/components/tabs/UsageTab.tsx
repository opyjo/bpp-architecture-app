"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Activity,
  BarChart3,
  Bot,
  Coins,
  Cpu,
  Layers,
  RefreshCw,
  Server,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  clearUsage,
  estimateCost,
  getUsage,
  modelLabel,
  type UsageEntry,
} from "@/lib/ai/usage-log";

type Range = "today" | "7d" | "all";

const RANGES: { id: Range; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "all", label: "All" },
];

// Rotating accent palette for breakdown bars. Class strings are written out in
// full (no template literals) so Tailwind's static scanner keeps them.
const BAR_ACCENTS = [
  { bar: "bg-arch-blue", text: "text-arch-blue" },
  { bar: "bg-arch-purple", text: "text-arch-purple" },
  { bar: "bg-arch-teal", text: "text-arch-teal" },
  { bar: "bg-arch-amber", text: "text-arch-amber" },
  { bar: "bg-arch-green", text: "text-arch-green" },
  { bar: "bg-arch-coral", text: "text-arch-coral" },
] as const;

interface Aggregate {
  key: string;
  label: string;
  calls: number;
  tokens: number;
  cost: number;
}

function rangeStart(range: Range): number {
  if (range === "all") return 0;
  const now = new Date();
  if (range === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return start.getTime();
  }
  // 7d — last 7 days inclusive of today
  return Date.now() - 7 * 24 * 60 * 60 * 1000;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatCost(usd: number): string {
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

function aggregate(
  entries: { entry: UsageEntry; cost: number }[],
  pick: (e: UsageEntry) => string,
  labelOf: (key: string, e: UsageEntry) => string
): Aggregate[] {
  const map = new Map<string, Aggregate>();
  for (const { entry, cost } of entries) {
    const key = pick(entry);
    const existing = map.get(key);
    if (existing) {
      existing.calls += 1;
      existing.tokens += entry.tokensEst;
      existing.cost += cost;
    } else {
      map.set(key, {
        key,
        label: labelOf(key, entry),
        calls: 1,
        tokens: entry.tokensEst,
        cost,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.tokens - a.tokens);
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconClass: string;
}

function StatCard({ icon, label, value, iconClass }: StatCardProps) {
  return (
    <Card className="bg-arch-bg2 ring-arch-border">
      <CardContent className="flex items-center gap-4 py-1">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1",
            iconClass
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-arch-text3">
            {label}
          </div>
          <div className="mt-0.5 truncate text-2xl font-semibold tabular-nums text-arch-text">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BreakdownProps {
  title: string;
  icon: React.ReactNode;
  rows: Aggregate[];
}

function Breakdown({ title, icon, rows }: BreakdownProps) {
  const max = rows.reduce((m, r) => Math.max(m, r.tokens), 0) || 1;
  return (
    <Card className="bg-arch-bg2 ring-arch-border">
      <CardHeader className="border-b border-arch-border pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-arch-text">
          <span className="text-arch-text3">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-3">
        {rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-arch-text3">No data</p>
        ) : (
          rows.map((row, i) => {
            const accent = BAR_ACCENTS[i % BAR_ACCENTS.length];
            const pct = Math.max(2, Math.round((row.tokens / max) * 100));
            return (
              <div key={row.key} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-arch-text2">
                    {row.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-arch-text3">
                    {row.calls} {row.calls === 1 ? "call" : "calls"} ·{" "}
                    {formatNumber(row.tokens)} tok ·{" "}
                    <span className={accent.text}>
                      {formatCost(row.cost)}
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-arch-bg3">
                  <div
                    className={cn("h-full rounded-full", accent.bar)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default function UsageTab() {
  const [range, setRange] = useState<Range>("7d");

  // Read the usage log as an external store via useSyncExternalStore: this
  // hydrates safely (server snapshot is empty) and lets us force a re-read
  // (after refresh / clear) by notifying subscribers. No effects required.
  const subscribersRef = useRef(new Set<() => void>());
  const snapshotRef = useRef<UsageEntry[]>([]);

  const subscribe = useCallback((cb: () => void) => {
    subscribersRef.current.add(cb);
    return () => {
      subscribersRef.current.delete(cb);
    };
  }, []);
  const getSnapshot = useCallback(() => {
    const next = getUsage();
    // Keep a stable reference unless the log actually changed, so React can
    // bail out of unnecessary re-renders.
    const prev = snapshotRef.current;
    if (
      prev.length !== next.length ||
      (next.length > 0 && prev[prev.length - 1]?.id !== next[next.length - 1]?.id)
    ) {
      snapshotRef.current = next;
    }
    return snapshotRef.current;
  }, []);
  const getServerSnapshot = useCallback(() => snapshotRef.current, []);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const refresh = useCallback(() => {
    snapshotRef.current = getUsage();
    subscribersRef.current.forEach((cb) => cb());
  }, []);

  const filtered = useMemo(() => {
    const start = rangeStart(range);
    return raw
      .filter((e) => e.ts >= start)
      .map((entry) => ({ entry, cost: estimateCost(entry) }))
      .sort((a, b) => b.entry.ts - a.entry.ts);
  }, [raw, range]);

  const totals = useMemo(() => {
    let calls = 0;
    let tokens = 0;
    let cost = 0;
    for (const { entry, cost: c } of filtered) {
      calls += 1;
      tokens += entry.tokensEst;
      cost += c;
    }
    return { calls, tokens, cost };
  }, [filtered]);

  const byModel = useMemo(
    () =>
      aggregate(
        filtered,
        (e) => e.modelId,
        (key) => modelLabel(key)
      ),
    [filtered]
  );
  const byProvider = useMemo(
    () =>
      aggregate(
        filtered,
        (e) => e.provider,
        (key) => key.charAt(0).toUpperCase() + key.slice(1)
      ),
    [filtered]
  );
  const byFeature = useMemo(
    () =>
      aggregate(
        filtered,
        (e) => e.feature,
        (key) => key
      ),
    [filtered]
  );

  const recent = filtered.slice(0, 25);

  const handleClear = () => {
    if (
      window.confirm(
        "Clear the entire AI usage log? This cannot be undone."
      )
    ) {
      clearUsage();
      refresh();
    }
  };

  const hasData = raw.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-arch-text">
            <BarChart3 className="size-5 text-arch-blue" />
            AI Usage & Cost
          </h1>
          <p className="mt-1 text-sm text-arch-text2">
            Local estimates of model calls, tokens, and spend across AI tools.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Range toggle */}
          <div className="inline-flex rounded-lg border border-arch-border bg-arch-bg2 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  range === r.id
                    ? "bg-arch-blue/15 text-arch-blue"
                    : "text-arch-text3 hover:text-arch-text2"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClear}
            disabled={!hasData}
          >
            <Trash2 className="size-3.5" />
            Clear log
          </Button>
        </div>
      </div>

      {!hasData ? (
        <Card className="bg-arch-bg2 ring-arch-border">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-arch-blue/10 text-arch-blue ring-1 ring-arch-blue/20">
              <Activity className="size-7" />
            </div>
            <h2 className="text-base font-semibold text-arch-text">
              No usage recorded yet
            </h2>
            <p className="max-w-md text-sm text-arch-text2">
              Once you start using the AI tools (Assistant, Ticket Analyzer,
              Code Review, and others), each model call will be logged here with
              estimated token counts and cost. Come back to track your spend.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={<Activity className="size-5" />}
              label="Total calls"
              value={formatNumber(totals.calls)}
              iconClass="bg-arch-blue/10 text-arch-blue ring-arch-blue/20"
            />
            <StatCard
              icon={<Cpu className="size-5" />}
              label="Est. tokens"
              value={formatNumber(totals.tokens)}
              iconClass="bg-arch-purple/10 text-arch-purple ring-arch-purple/20"
            />
            <StatCard
              icon={<Coins className="size-5" />}
              label="Est. cost"
              value={formatCost(totals.cost)}
              iconClass="bg-arch-green/10 text-arch-green ring-arch-green/20"
            />
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Breakdown
              title="By model"
              icon={<Bot className="size-4" />}
              rows={byModel}
            />
            <Breakdown
              title="By provider"
              icon={<Server className="size-4" />}
              rows={byProvider}
            />
            <Breakdown
              title="By feature"
              icon={<Layers className="size-4" />}
              rows={byFeature}
            />
          </div>

          {/* Recent calls */}
          <Card className="bg-arch-bg2 ring-arch-border">
            <CardHeader className="border-b border-arch-border pb-3">
              <CardTitle className="text-sm font-semibold text-arch-text">
                Recent calls
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {recent.length === 0 ? (
                <p className="py-6 text-center text-xs text-arch-text3">
                  No calls in this range.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-arch-border text-[0.65rem] uppercase tracking-wider text-arch-text3">
                        <th className="py-2 pr-4 font-semibold">Time</th>
                        <th className="py-2 pr-4 font-semibold">Feature</th>
                        <th className="py-2 pr-4 font-semibold">Model</th>
                        <th className="py-2 pr-4 text-right font-semibold">
                          Est. tokens
                        </th>
                        <th className="py-2 text-right font-semibold">
                          Est. cost
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map(({ entry, cost }) => (
                        <tr
                          key={entry.id}
                          className="border-b border-arch-border/50 last:border-0 hover:bg-arch-bg3/50"
                        >
                          <td className="py-2 pr-4 whitespace-nowrap tabular-nums text-arch-text3">
                            {relativeTime(entry.ts)}
                          </td>
                          <td className="py-2 pr-4 text-arch-text2">
                            {entry.feature}
                          </td>
                          <td className="py-2 pr-4 text-arch-text">
                            {modelLabel(entry.modelId)}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums text-arch-text2">
                            {formatNumber(entry.tokensEst)}
                          </td>
                          <td className="py-2 text-right tabular-nums text-arch-green">
                            {formatCost(cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-[0.7rem] text-arch-text3">
            Costs are rough estimates from approximate public list prices and
            character-based token counts. Actual billed amounts will differ.
          </p>
        </>
      )}
    </div>
  );
}
