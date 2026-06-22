"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { tabGroups, findActiveGroupForPath, type TabGroup } from "@/lib/tabs";

function TabDropdown({
  group,
  activeTab,
  onTabClick,
  animIndex,
  currentPathname,
}: {
  group: TabGroup;
  activeTab: string;
  onTabClick: (id: string) => void;
  animIndex: number;
  currentPathname: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // A non-href tab is active on the home page
  const activeChild = group.tabs.find((t) => !t.href && t.id === activeTab);
  const isHomeActive = currentPathname === "/" && !!activeChild;

  // An href tab is active when the current path matches
  const match = findActiveGroupForPath(currentPathname);
  const isHrefActive = match?.group === group;

  const isGroupActive = isHomeActive || isHrefActive;
  const activeLabel = isHomeActive
    ? activeChild!.label
    : isHrefActive
      ? match!.tab.label
      : null;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        style={{ animationDelay: `${animIndex * 40}ms` }}
        className={`tab-item px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-0 flex items-center gap-1.5 transition-all duration-200 ${group.tintClass} ${
          isGroupActive
            ? "tab-item-active tab-group-active text-arch-blue"
            : "text-arch-text2 hover:text-arch-text"
        }`}
      >
        {activeLabel ? `${group.label}: ${activeLabel}` : group.label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="dropdown-panel absolute top-full left-0 mt-1 z-50 min-w-[210px] py-2 px-0.5 bg-arch-bg2/95 border border-arch-border rounded-lg shadow-lg shadow-black/20">
          {group.tabs.map((tab, i) => {
            const isTabActive = tab.href
              ? currentPathname.startsWith(tab.href)
              : currentPathname === "/" && activeTab === tab.id;

            return tab.href ? (
              <Link
                key={tab.id}
                href={tab.href}
                className={`dropdown-item block w-full text-left px-3.5 py-2 text-xs font-medium transition-colors duration-150 ${
                  isTabActive
                    ? "text-arch-blue bg-arch-blue/10"
                    : "text-arch-text2 hover:text-arch-text hover:bg-arch-blue/[0.08]"
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => setOpen(false)}
              >
                {tab.label}
                {!isTabActive && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="inline-block ml-1.5 opacity-40"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                )}
              </Link>
            ) : (
              <button
                key={tab.id}
                onClick={() => {
                  onTabClick(tab.id);
                  setOpen(false);
                }}
                className={`dropdown-item w-full text-left px-3.5 py-2 text-xs font-medium transition-colors duration-150 ${
                  isTabActive
                    ? "text-arch-blue bg-arch-blue/10"
                    : "text-arch-text2 hover:text-arch-text hover:bg-arch-blue/[0.08]"
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GlobalNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = searchParams.get("tab") || "arch";

  const handleTabClick = useCallback(
    (id: string) => {
      if (pathname === "/") {
        router.replace(`/?tab=${id}`, { scroll: false });
      } else {
        router.push(`/?tab=${id}`);
      }
    },
    [pathname, router]
  );

  return (
    <div className="flex overflow-x-auto [&>*]:shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-arch-bg3 border-b border-arch-border tab-bar-enter">
      {tabGroups.map((group, i) => {
        // Single href-only tab → render as direct link, no dropdown
        if (group.tabs.length === 1 && group.tabs[0].href) {
          const tab = group.tabs[0];
          const isActive = pathname.startsWith(tab.href!);
          return (
            <Link
              key={group.label}
              href={tab.href!}
              style={{ animationDelay: `${i * 40}ms` }}
              className={`tab-item px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-0 flex items-center gap-1.5 transition-all duration-200 ${group.tintClass} ${
                isActive
                  ? "tab-item-active tab-group-active text-arch-blue"
                  : "text-arch-text2 hover:text-arch-text"
              }`}
            >
              {group.label}
            </Link>
          );
        }

        return (
          <TabDropdown
            key={group.label}
            group={group}
            activeTab={activeTab}
            onTabClick={handleTabClick}
            animIndex={i}
            currentPathname={pathname}
          />
        );
      })}
      <div className="ml-auto flex items-center pr-3">
        <a
          href="https://go.dev/tour"
          target="_blank"
          rel="noopener noreferrer"
          className="tab-item flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-arch-blue/15 text-arch-blue border border-arch-blue/30 hover:bg-arch-blue/25 transition-colors whitespace-nowrap"
        >
          A Tour of Go
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </div>
    </div>
  );
}

export default function GlobalNav() {
  return (
    <Suspense fallback={<div className="h-[41px] bg-arch-bg3 border-b border-arch-border" />}>
      <GlobalNavInner />
    </Suspense>
  );
}
