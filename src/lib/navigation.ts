export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

import { ALL_TAB_IDS } from "./tabs";

export function buildBreadcrumbs(
  pathname: string,
  dynamicLabel?: string
): BreadcrumbSegment[] {
  if (pathname === "/") return [];

  // Workspace tab routes (/services, /teleprompter, …) show no breadcrumb — the
  // global nav already highlights the active tab. Matches the old ?tab= behavior.
  if (ALL_TAB_IDS.includes(pathname.slice(1))) return [];

  const crumbs: BreadcrumbSegment[] = [{ label: "Home", href: "/" }];

  if (pathname === "/saved") {
    crumbs.push({ label: "All Saved" });
  } else if (pathname === "/analyze") {
    crumbs.push({ label: "Ticket Analyzer" });
  } else if (pathname === "/analyses") {
    crumbs.push({ label: "Saved Analyses" });
  } else if (pathname.startsWith("/analyses/")) {
    crumbs.push({ label: "Saved Analyses", href: "/analyses" });
    crumbs.push({ label: dynamicLabel || "Detail" });
  } else if (pathname.startsWith("/chats/")) {
    crumbs.push({ label: "All Saved", href: "/saved" });
    crumbs.push({ label: dynamicLabel || "Chat" });
  } else if (pathname.startsWith("/specs/")) {
    crumbs.push({ label: "All Saved", href: "/saved" });
    crumbs.push({ label: dynamicLabel || "API Spec" });
  } else if (pathname.startsWith("/sequence-diagrams/")) {
    crumbs.push({ label: "All Saved", href: "/saved" });
    crumbs.push({ label: dynamicLabel || "Sequence Diagram" });
  } else if (pathname.startsWith("/test-plans/")) {
    crumbs.push({ label: "All Saved", href: "/saved" });
    crumbs.push({ label: dynamicLabel || "Test Plan" });
  } else if (pathname.startsWith("/reviews/")) {
    crumbs.push({ label: "All Saved", href: "/saved" });
    crumbs.push({ label: dynamicLabel || "Code Review" });
  } else if (pathname.startsWith("/runbooks/")) {
    crumbs.push({ label: "All Saved", href: "/saved" });
    crumbs.push({ label: dynamicLabel || "Runbook" });
  }

  return crumbs;
}
