"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, ArrowRight } from "lucide-react";
import { tabGroups } from "@/lib/tabs";

// Short, human descriptions keyed by tab id — gives each card context.
const TAB_DESCRIPTIONS: Record<string, string> = {
  arch: "System architecture diagram & overview",
  pages: "UI page inventory and user flows",
  events: "Kafka topics, producers & consumers",
  lambdas: "AWS Lambda function catalog",
  services: "Backend microservice directory",
  mfe: "Microfrontend modules & ownership",
  repo: "Browse the source repository",
  ref: "Reference docs & quick links",
  flags: "Feature flag inventory & states",
  learnings: "Captured lessons & notes",
  subflow: "Configurator, aggregator & flow runner map",
  canadalife: "Visual Canada Life interview cheat sheet",
  mock: "Canada Life BSA mock interview Q&A",
  bsa: "Business analyst cheatsheet",
  apigee: "Apigee gateway concepts",
  openapi: "OpenAPI 3.0 spec reference",
  coach: "Interview practice coach",
  teleprompter: "Scrolling talking-point cards",
  impact: "Assess a change's blast radius",
  systemmap: "Interactive dependency map",
  drift: "Detect docs vs. code drift",
  insights: "Business, Go & SaaS lenses on your repo",
  analyze: "AI ticket analyzer",
  pipeline: "Generate change packages",
  contract: "Build API contracts from code",
  sequence: "Generate sequence diagrams",
  testplan: "Generate test plans",
  ai: "Chat with the AI assistant",
  "saved-hub": "Everything you've saved",
};

// Accent color per group. Class names are FULL literals (incl. group-hover:*)
// so Tailwind's scanner keeps them — interpolating partial class names won't work.
const GROUP_ACCENT: Record<
  string,
  { dot: string; groupHoverText: string; hoverBorder: string }
> = {
  Platform: { dot: "bg-arch-blue", groupHoverText: "group-hover:text-arch-blue", hoverBorder: "hover:border-arch-blue/40" },
  Reference: { dot: "bg-arch-purple", groupHoverText: "group-hover:text-arch-purple", hoverBorder: "hover:border-arch-purple/40" },
  "Interview Prep": { dot: "bg-arch-amber", groupHoverText: "group-hover:text-arch-amber", hoverBorder: "hover:border-arch-amber/40" },
  Operations: { dot: "bg-arch-coral", groupHoverText: "group-hover:text-arch-coral", hoverBorder: "hover:border-arch-coral/40" },
  "AI Tools": { dot: "bg-arch-green", groupHoverText: "group-hover:text-arch-green", hoverBorder: "hover:border-arch-green/40" },
  Saved: { dot: "bg-arch-purple", groupHoverText: "group-hover:text-arch-purple", hoverBorder: "hover:border-arch-purple/40" },
};

const DEFAULT_ACCENT = GROUP_ACCENT.Platform;

function hrefFor(tab: { id: string; href?: string }): string {
  return tab.href ?? `/${tab.id}`;
}

export default function HomeHub() {
  const [query, setQuery] = useState("");

  const totalTools = useMemo(
    () => tabGroups.reduce((n, g) => n + g.tabs.length, 0),
    []
  );

  // Filter tabs by label or description; drop empty groups.
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tabGroups;
    return tabGroups
      .map((g) => ({
        ...g,
        tabs: g.tabs.filter(
          (t) =>
            t.label.toLowerCase().includes(q) ||
            (TAB_DESCRIPTIONS[t.id] ?? "").toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.tabs.length > 0);
  }, [query]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wider text-arch-blue">
            Workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-arch-text">
            Where would you like to go?
          </h1>
          <p className="mt-1.5 text-sm text-arch-text2">
            {totalTools} tools across {tabGroups.length} areas. Jump straight in,
            or search below.
          </p>

          {/* Search */}
          <div className="relative mt-5 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-arch-text3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools…"
              autoFocus
              className="h-10 w-full rounded-lg border border-arch-border bg-arch-bg2 pl-9 pr-3 text-sm text-arch-text outline-none transition-colors placeholder:text-arch-text3 focus:border-arch-blue focus:ring-2 focus:ring-arch-blue/30"
            />
          </div>
        </div>

        {/* Groups */}
        {filteredGroups.length === 0 ? (
          <p className="text-sm text-arch-text3">
            No tools match “{query}”.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {filteredGroups.map((group) => {
              const accent = GROUP_ACCENT[group.label] ?? DEFAULT_ACCENT;
              return (
                <section key={group.label}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`size-1.5 rounded-full ${accent.dot}`} />
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-arch-text2">
                      {group.label}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.tabs.map((tab) => {
                      const external = !!tab.href;
                      return (
                        <Link
                          key={tab.id}
                          href={hrefFor(tab)}
                          className={`group flex items-start justify-between gap-3 rounded-xl border border-arch-border bg-arch-bg2 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${accent.hoverBorder}`}
                        >
                          <div className="min-w-0">
                            <div
                              className={`truncate text-sm font-medium text-arch-text transition-colors ${accent.groupHoverText}`}
                            >
                              {tab.label}
                            </div>
                            <div className="mt-0.5 text-xs text-arch-text3">
                              {TAB_DESCRIPTIONS[tab.id] ?? ""}
                            </div>
                          </div>
                          {external ? (
                            <ArrowUpRight
                              className={`size-4 shrink-0 text-arch-text3 transition-colors ${accent.groupHoverText}`}
                            />
                          ) : (
                            <ArrowRight
                              className={`size-4 shrink-0 -translate-x-1 text-arch-text3 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 ${accent.groupHoverText}`}
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
