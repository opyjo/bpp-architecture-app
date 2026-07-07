export interface TabItem {
  id: string;
  label: string;
  href?: string;
  /** Open in a new browser tab (e.g. the SQL playground, used side-by-side). */
  newTab?: boolean;
}

export interface TabGroup {
  label: string;
  tintClass: string;
  tabs: TabItem[];
}

export const tabGroups: TabGroup[] = [
  {
    label: "Platform",
    tintClass: "tab-group-platform",
    tabs: [
      { id: "arch", label: "Architecture" },
      { id: "pages", label: "UI pages & flows" },
      { id: "events", label: "Kafka events" },
      { id: "lambdas", label: "Lambda functions" },
      { id: "services", label: "Services" },
      { id: "mfe", label: "Microfrontends" },
    ],
  },
  {
    label: "Reference",
    tintClass: "tab-group-reference",
    tabs: [
      { id: "repo", label: "Repo" },
      { id: "ref", label: "Reference" },
      { id: "subflow", label: "Subscription Flow" },
      { id: "apoart", label: "APOART Stories" },
      { id: "flags", label: "Feature Flags" },
      { id: "learnings", label: "Learnings" },
    ],
  },
  {
    label: "Interview Prep",
    tintClass: "tab-group-interview",
    tabs: [
      { id: "canadalife", label: "Canada Life Cheatsheet" },
      { id: "mock", label: "Mock Interview" },
      { id: "bsa", label: "BSA Cheatsheet" },
      { id: "hoopp", label: "HOOPP Prep" },
      { id: "apigee", label: "Apigee" },
      { id: "openapi", label: "OpenAPI 3.0" },
      { id: "coach", label: "Interview Coach" },
      { id: "sql", label: "SQL Practice", newTab: true },
      { id: "teleprompter", label: "Teleprompter" },
    ],
  },
  {
    label: "Operations",
    tintClass: "tab-group-ops",
    tabs: [
      { id: "impact", label: "Change Impact" },
      { id: "systemmap", label: "System Map" },
    ],
  },
  {
    label: "AI Tools",
    tintClass: "tab-group-ai",
    tabs: [
      { id: "insights", label: "Repo Insights" },
      { id: "analyze", label: "Ticket Analyzer", href: "/analyze" },
      { id: "pipeline", label: "Change Package" },
      { id: "contract", label: "API Contract Builder" },
      { id: "sequence", label: "Sequence Diagrams" },
      { id: "testplan", label: "Test Plan" },
      { id: "ai", label: "AI Assistant" },
    ],
  },
  {
    label: "Saved",
    tintClass: "tab-group-reference",
    tabs: [
      { id: "saved-hub", label: "All Saved", href: "/saved" },
    ],
  },
];

/** All valid non-href tab IDs (each rendered at its own `/<id>` route) */
export const ALL_TAB_IDS = tabGroups
  .flatMap((g) => g.tabs)
  .filter((t) => !t.href)
  .map((t) => t.id);

/** The path a tab navigates to: an explicit href, else its own `/<id>` route. */
export function tabHref(tab: TabItem): string {
  return tab.href ?? `/${tab.id}`;
}

/**
 * Given a pathname (e.g. "/services", "/saved", "/analyses/123"), return the
 * group + tab whose route matches, or undefined on the home page / no match.
 * Uses exact-or-subpath matching so "/analyze" doesn't match "/analyses".
 */
export function findActiveGroupForPath(
  pathname: string
): { group: TabGroup; tab: TabItem } | undefined {
  for (const group of tabGroups) {
    for (const tab of group.tabs) {
      const href = tabHref(tab);
      if (pathname === href || pathname.startsWith(href + "/")) {
        return { group, tab };
      }
    }
  }
  return undefined;
}
