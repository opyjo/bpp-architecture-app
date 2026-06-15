"use client";

import { useMemo } from "react";
import { repoTree } from "@/data/repo-structure";

// ── Tech Categories ──────────────────────────────────────

const CATEGORIES: Record<string, string[]> = {
  Databases: ["DynamoDB", "Redis", "PostgreSQL", "SQL", "Athena"],
  Messaging: ["Kafka", "SQS", "SNS", "SES", "EventBridge", "Firehose"],
  Protocols: ["REST", "GraphQL", "gRPC", "HTTP", "OpenAPI", "Protobuf"],
  "AWS Services": ["Lambda", "S3", "ALB", "EMR", "Step Function"],
  "Auth & Security": ["JWT", "OAuth2", "mTLS"],
  Observability: ["OpenTelemetry", "Prometheus", "Metrics", "Monitoring"],
  Partners: ["Bango", "Disney", "Netflix", "Bell Media", "Radio-Canada"],
  "Build & Deploy": ["Kubernetes", "Apigee", "GitLab", "Demo"],
  Testing: ["k6", "Karate", "BDD", "Robot Framework", "E2E"],
  "Config & Workflow": ["Flow Engine", "YAML", "Viper", "ENV", "LaunchDarkly", "OpenFeature", "Unleash", "Feature Flags"],
};

const CATEGORY_COLORS: Record<string, string> = {
  Databases: "var(--arch-amber)",
  Messaging: "var(--arch-purple)",
  Protocols: "var(--arch-blue)",
  "AWS Services": "var(--arch-coral)",
  "Auth & Security": "var(--arch-green)",
  Observability: "var(--arch-teal)",
  Partners: "var(--arch-amber)",
  "Build & Deploy": "var(--arch-gray)",
  Testing: "var(--arch-green)",
  "Config & Workflow": "var(--arch-teal)",
};

export default function RepoTechSummary() {
  const { categories, totalUnique } = useMemo(() => {
    const techCounts = new Map<string, number>();

    for (const dir of repoTree) {
      for (const child of dir.children ?? []) {
        for (const t of child.tech ?? []) {
          techCounts.set(t, (techCounts.get(t) ?? 0) + 1);
        }
      }
    }

    const cats: { name: string; techs: { name: string; count: number }[]; color: string }[] = [];
    const categorized = new Set<string>();

    for (const [catName, catTechs] of Object.entries(CATEGORIES)) {
      const matched = catTechs
        .map((t) => ({ name: t, count: techCounts.get(t) ?? 0 }))
        .filter((t) => t.count > 0)
        .sort((a, b) => b.count - a.count);
      if (matched.length > 0) {
        cats.push({ name: catName, techs: matched, color: CATEGORY_COLORS[catName] ?? "var(--arch-text3)" });
        matched.forEach((m) => categorized.add(m.name));
      }
    }

    // Gather uncategorized tech
    const other: { name: string; count: number }[] = [];
    for (const [t, c] of techCounts) {
      if (!categorized.has(t)) other.push({ name: t, count: c });
    }
    if (other.length > 0) {
      cats.push({ name: "Other", techs: other.sort((a, b) => b.count - a.count), color: "var(--arch-text3)" });
    }

    return { categories: cats, totalUnique: techCounts.size };
  }, []);

  const maxCount = useMemo(() => {
    let m = 0;
    for (const cat of categories) {
      for (const t of cat.techs) {
        if (t.count > m) m = t.count;
      }
    }
    return m;
  }, [categories]);

  return (
    <div className="bg-arch-bg2 border border-arch-border rounded-lg overflow-y-auto h-full">
      <div className="px-3 pt-3 pb-2 border-b border-arch-border flex items-center justify-between">
        <span className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold">Tech Stack</span>
        <span className="text-[10px] text-arch-text2 font-medium">{totalUnique} technologies</span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-2">
        {categories.map((cat) => (
          <div key={cat.name} className="bg-arch-bg rounded-md border border-arch-border p-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cat.color }} />
              <span className="text-[10px] font-semibold text-arch-text">{cat.name}</span>
              <span className="text-[9px] text-arch-text3 ml-auto">{cat.techs.length}</span>
            </div>
            <div className="space-y-1">
              {cat.techs.map((t) => (
                <div key={t.name} className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] text-arch-text2 w-[72px] shrink-0 truncate">{t.name}</span>
                  <div className="flex-1 h-[6px] bg-arch-bg3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max((t.count / maxCount) * 100, 4)}%`,
                        background: cat.color,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <span className="text-[8px] text-arch-text3 w-[16px] text-right tabular-nums">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
