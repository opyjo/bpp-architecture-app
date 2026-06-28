import { tabGroups } from "@/lib/tabs";
import { allServiceDeepDives } from "@/data/service-deep-dives";
import { kafkaEvents } from "@/data/events";
import { lambdaFunctions } from "@/data/lambdas";
import { featureFlagSystems } from "@/data/feature-flags";

export type SearchKind =
  | "Tab"
  | "Service"
  | "Event"
  | "Lambda"
  | "Flag";

export interface SearchEntry {
  id: string;
  title: string;
  subtitle?: string;
  kind: SearchKind;
  /** lowercased haystack for matching */
  keywords: string;
  /** navigate to a home-page tab (?tab=) */
  tab?: string;
  /** navigate to an explicit href (overrides tab) */
  href?: string;
}

const KIND_TINT: Record<SearchKind, string> = {
  Tab: "text-arch-blue bg-arch-blue/10 border-arch-blue/25",
  Service: "text-arch-teal bg-arch-teal/10 border-arch-teal/25",
  Event: "text-arch-amber bg-arch-amber/10 border-arch-amber/25",
  Lambda: "text-arch-coral bg-arch-coral/10 border-arch-coral/25",
  Flag: "text-arch-purple bg-arch-purple/10 border-arch-purple/25",
};

export function kindTint(kind: SearchKind): string {
  return KIND_TINT[kind];
}

function truncate(s: string, n = 90): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

let cached: SearchEntry[] | null = null;

/** Build a flat, searchable index across navigation + curated data. Memoized. */
export function buildSearchIndex(): SearchEntry[] {
  if (cached) return cached;

  const entries: SearchEntry[] = [];

  // Navigation tabs
  for (const group of tabGroups) {
    for (const tab of group.tabs) {
      entries.push({
        id: `tab:${tab.id}`,
        title: tab.label,
        subtitle: group.label,
        kind: "Tab",
        keywords: `${tab.label} ${group.label}`.toLowerCase(),
        tab: tab.href ? undefined : tab.id,
        href: tab.href,
      });
    }
  }

  // Services
  for (const s of allServiceDeepDives) {
    entries.push({
      id: `service:${s.id}`,
      title: s.displayName || s.name,
      subtitle: truncate(s.business?.purpose ?? s.name),
      kind: "Service",
      keywords: `${s.displayName} ${s.name} ${s.business?.purpose ?? ""}`.toLowerCase(),
      tab: "services",
    });
  }

  // Kafka events
  for (const e of kafkaEvents) {
    entries.push({
      id: `event:${e.id}`,
      title: e.title,
      subtitle: e.topic,
      kind: "Event",
      keywords: `${e.title} ${e.topic}`.toLowerCase(),
      tab: "events",
    });
  }

  // Lambda functions
  for (const l of lambdaFunctions) {
    entries.push({
      id: `lambda:${l.id}`,
      title: l.name,
      subtitle: truncate(l.description),
      kind: "Lambda",
      keywords: `${l.name} ${l.serviceGroup} ${l.description}`.toLowerCase(),
      tab: "lambdas",
    });
  }

  // Feature flag systems
  for (const f of featureFlagSystems) {
    entries.push({
      id: `flag:${f.name}`,
      title: f.name,
      subtitle: truncate(f.description),
      kind: "Flag",
      keywords: `${f.name} ${f.sdk} ${f.description}`.toLowerCase(),
      tab: "flags",
    });
  }

  cached = entries;
  return entries;
}

/** Rank entries against a query. Empty query → tabs first, then a sample. */
export function searchIndex(query: string, limit = 40): SearchEntry[] {
  const index = buildSearchIndex();
  const q = query.trim().toLowerCase();

  if (!q) {
    return index.filter((e) => e.kind === "Tab").slice(0, limit);
  }

  const terms = q.split(/\s+/).filter(Boolean);
  const scored: { entry: SearchEntry; score: number }[] = [];

  for (const entry of index) {
    const title = entry.title.toLowerCase();
    let score = 0;
    let matchedAll = true;

    for (const t of terms) {
      if (title.startsWith(t)) score += 100;
      else if (title.includes(t)) score += 50;
      else if (entry.keywords.includes(t)) score += 20;
      else {
        matchedAll = false;
        break;
      }
    }
    if (!matchedAll) continue;
    // Tabs get a small boost so navigation stays near the top
    if (entry.kind === "Tab") score += 15;
    scored.push({ entry, score });
  }

  scored.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
  return scored.slice(0, limit).map((s) => s.entry);
}
