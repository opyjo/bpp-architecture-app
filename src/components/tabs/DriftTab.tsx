"use client";

import { useCallback, useState } from "react";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileWarning,
  Boxes,
  Radio,
  Zap,
  Database,
  GitCompareArrows,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn, timeAgo } from "@/lib/utils";

interface DriftCounts {
  codeServices: number;
  docServices: number;
  events: number;
  lambdas: number;
}

interface DriftServices {
  matched: string[];
  inCodeOnly: string[];
  inDocsOnly: string[];
}

interface DriftResult {
  repo: string;
  generatedAt: string;
  services: DriftServices;
  counts: DriftCounts;
}

interface SummaryStat {
  label: string;
  value: number;
  hint: string;
  icon: typeof Boxes;
  tint: string;
}

function StatCard({ stat }: { stat: SummaryStat }) {
  const Icon = stat.icon;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-arch-border bg-arch-bg2 px-4 py-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          stat.tint
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-semibold leading-none text-arch-text">
          {stat.value}
        </div>
        <div className="mt-1 truncate text-xs text-arch-text3">{stat.hint}</div>
      </div>
    </div>
  );
}

interface ColumnConfig {
  title: string;
  subtitle: string;
  items: string[];
  icon: typeof CheckCircle2;
  accent: "green" | "amber" | "coral";
}

const ACCENTS: Record<
  ColumnConfig["accent"],
  {
    ring: string;
    headerBg: string;
    iconText: string;
    chip: string;
    countBg: string;
    bar: string;
  }
> = {
  green: {
    ring: "ring-arch-green/30",
    headerBg: "bg-arch-green/10",
    iconText: "text-arch-green",
    chip: "border-arch-green/30 bg-arch-green/10 text-arch-green",
    countBg: "bg-arch-green/15 text-arch-green",
    bar: "bg-arch-green",
  },
  amber: {
    ring: "ring-arch-amber/30",
    headerBg: "bg-arch-amber/10",
    iconText: "text-arch-amber",
    chip: "border-arch-amber/30 bg-arch-amber/10 text-arch-amber",
    countBg: "bg-arch-amber/15 text-arch-amber",
    bar: "bg-arch-amber",
  },
  coral: {
    ring: "ring-arch-coral/30",
    headerBg: "bg-arch-coral/10",
    iconText: "text-arch-coral",
    chip: "border-arch-coral/30 bg-arch-coral/10 text-arch-coral",
    countBg: "bg-arch-coral/15 text-arch-coral",
    bar: "bg-arch-coral",
  },
};

function DriftColumn({ col }: { col: ColumnConfig }) {
  const a = ACCENTS[col.accent];
  const Icon = col.icon;
  return (
    <Card className={cn("ring-1", a.ring)}>
      <CardHeader className={cn("rounded-t-xl border-b border-arch-border", a.headerBg)}>
        <div className="flex items-center gap-2">
          <Icon className={cn("size-4", a.iconText)} />
          <CardTitle className="text-sm text-arch-text">{col.title}</CardTitle>
          <span
            className={cn(
              "ml-auto rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
              a.countBg
            )}
          >
            {col.items.length}
          </span>
        </div>
        <CardDescription className="text-xs text-arch-text3">
          {col.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={cn("mb-3 h-1 w-full rounded-full", "bg-arch-bg3")}>
          <div
            className={cn("h-1 rounded-full", a.bar)}
            style={{
              width: col.items.length === 0 ? "0%" : "100%",
              opacity: col.items.length === 0 ? 0 : 1,
            }}
          />
        </div>
        {col.items.length === 0 ? (
          <p className="py-6 text-center text-xs text-arch-text3">
            Nothing here — all clear.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {col.items.map((name) => (
              <span
                key={name}
                className={cn(
                  "rounded-md border px-2 py-1 font-mono text-xs",
                  a.chip
                )}
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DriftTab() {
  const [result, setResult] = useState<DriftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDrift = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/drift");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      setResult(data as DriftResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check drift");
    } finally {
      setLoading(false);
    }
  }, []);

  const stats: SummaryStat[] = result
    ? [
        {
          label: "code",
          value: result.counts.codeServices,
          hint: "services in code",
          icon: Boxes,
          tint: "bg-arch-blue/10 text-arch-blue",
        },
        {
          label: "docs",
          value: result.counts.docServices,
          hint: "documented services",
          icon: Database,
          tint: "bg-arch-purple/10 text-arch-purple",
        },
        {
          label: "events",
          value: result.counts.events,
          hint: "documented events",
          icon: Radio,
          tint: "bg-arch-teal/10 text-arch-teal",
        },
        {
          label: "lambdas",
          value: result.counts.lambdas,
          hint: "documented lambdas",
          icon: Zap,
          tint: "bg-arch-amber/10 text-arch-amber",
        },
      ]
    : [];

  const columns: ColumnConfig[] = result
    ? [
        {
          title: "In sync",
          subtitle: "Documented and present in code",
          items: result.services.matched,
          icon: CheckCircle2,
          accent: "green",
        },
        {
          title: "In code, not documented",
          subtitle: "Docs to add — discovered in the repo",
          items: result.services.inCodeOnly,
          icon: AlertTriangle,
          accent: "amber",
        },
        {
          title: "Documented, not in code",
          subtitle: "Possibly stale — no matching service dir",
          items: result.services.inDocsOnly,
          icon: FileWarning,
          accent: "coral",
        },
      ]
    : [];

  const syncRatio =
    result && result.counts.docServices > 0
      ? Math.round(
          (result.services.matched.length / result.counts.docServices) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-arch-border bg-arch-bg2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-arch-blue/10 text-arch-blue">
            <GitCompareArrows className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-arch-blue">
              Freshness
            </p>
            <h2 className="text-lg font-semibold text-arch-text">
              Doc vs. code drift
            </h2>
            <p className="mt-0.5 text-sm text-arch-text2">
              Compare curated service docs against the live{" "}
              <span className="font-mono text-arch-text">services/</span>{" "}
              directory in the Go repo.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Button
            onClick={checkDrift}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            {loading ? "Checking…" : "Check drift"}
          </Button>
          {result && (
            <span className="flex items-center gap-1.5 text-xs text-arch-text3">
              <Clock className="size-3.5" />
              Last checked {timeAgo(result.generatedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-arch-red/30 bg-arch-red/10 p-4 text-sm text-arch-red">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Couldn&apos;t check drift</p>
            <p className="mt-0.5 text-arch-red/90">{error}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !error && (
        <Card className="ring-1 ring-arch-border">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-arch-bg3 text-arch-text3">
              <GitCompareArrows className="size-7" />
            </div>
            <div>
              <p className="font-medium text-arch-text">No drift report yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-arch-text3">
                Run a check to compare the documented services against the
                repo&apos;s live service directories and surface anything stale
                or undocumented.
              </p>
            </div>
            <Button onClick={checkDrift} disabled={loading} className="mt-1 gap-2">
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Check drift
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-arch-text3">
                Summary
              </p>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  syncRatio === 100
                    ? "bg-arch-green/15 text-arch-green"
                    : syncRatio >= 60
                    ? "bg-arch-amber/15 text-arch-amber"
                    : "bg-arch-coral/15 text-arch-coral"
                )}
              >
                {syncRatio}% docs in sync
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((s) => (
                <StatCard key={s.label} stat={s} />
              ))}
            </div>
          </div>

          {/* Columns */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-arch-text3">
              Service drift
            </p>
            <div className="grid gap-4 lg:grid-cols-3">
              {columns.map((col) => (
                <DriftColumn key={col.title} col={col} />
              ))}
            </div>
          </div>

          <p className="text-xs text-arch-text3">
            Comparing against{" "}
            <span className="font-mono text-arch-text2">{result.repo}</span>.
            Names are matched case-insensitively with{" "}
            <span className="font-mono">-api</span>/
            <span className="font-mono">-service</span> suffixes normalized.
          </p>
        </div>
      )}
    </div>
  );
}
