export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export function buildBreadcrumbs(
  pathname: string,
  dynamicLabel?: string
): BreadcrumbSegment[] {
  if (pathname === "/") return [];

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
  } else if (pathname === "/chats") {
    crumbs.push({ label: "Saved Chats" });
  } else if (pathname.startsWith("/chats/")) {
    crumbs.push({ label: "Saved Chats", href: "/chats" });
    crumbs.push({ label: dynamicLabel || "Detail" });
  }

  return crumbs;
}
