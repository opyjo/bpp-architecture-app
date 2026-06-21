export interface TabItem {
  id: string;
  label: string;
  href?: string;
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
      { id: "flags", label: "Feature Flags" },
      { id: "learnings", label: "Learnings" },
    ],
  },
  {
    label: "Interview Prep",
    tintClass: "tab-group-interview",
    tabs: [
      { id: "bsa", label: "BSA Cheatsheet" },
      { id: "apigee", label: "Apigee" },
      { id: "openapi", label: "OpenAPI 3.0" },
      { id: "coach", label: "Interview Coach" },
    ],
  },
  {
    label: "Operations",
    tintClass: "tab-group-ops",
    tabs: [
      { id: "impact", label: "Change Impact" },
      { id: "runbooks", label: "Incident Runbooks" },
    ],
  },
  {
    label: "AI Tools",
    tintClass: "tab-group-ai",
    tabs: [
      { id: "analyze", label: "Ticket Analyzer", href: "/analyze" },
      { id: "contract", label: "API Contract Builder" },
      { id: "review", label: "Code Review" },
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

/** All valid non-href tab IDs (rendered inline on the home page) */
export const ALL_TAB_IDS = tabGroups
  .flatMap((g) => g.tabs)
  .filter((t) => !t.href)
  .map((t) => t.id);

/**
 * Given a pathname (e.g. "/saved", "/analyses"), return the group whose
 * href-tab matches, or undefined if on the home page / no match.
 */
export function findActiveGroupForPath(
  pathname: string
): { group: TabGroup; tab: TabItem } | undefined {
  for (const group of tabGroups) {
    for (const tab of group.tabs) {
      if (tab.href && pathname.startsWith(tab.href)) {
        return { group, tab };
      }
    }
  }
  return undefined;
}
