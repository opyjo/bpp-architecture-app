"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { buildBreadcrumbs } from "@/lib/navigation";

export default function Breadcrumbs({ dynamicLabel }: { dynamicLabel?: string }) {
  const pathname = usePathname();

  // Detail routes render their own breadcrumbs with dynamic labels — skip here
  const isDetailRoute =
    !dynamicLabel &&
    (/^\/analyses\/.+/.test(pathname) || /^\/chats\/.+/.test(pathname) || /^\/specs\/.+/.test(pathname) || /^\/sequence-diagrams\/.+/.test(pathname));
  if (isDetailRoute) return null;

  const crumbs = buildBreadcrumbs(pathname, dynamicLabel);

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 px-4 py-2 text-[11px] text-arch-text3">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3" />}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="hover:text-arch-text transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-arch-text2">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
