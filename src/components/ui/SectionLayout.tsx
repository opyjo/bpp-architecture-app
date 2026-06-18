"use client";

import { useState, ReactNode, useRef, useEffect } from "react";

interface SidebarItem {
  id: string;
  label: string;
}

interface SectionLayoutProps {
  label: string;
  items: SidebarItem[];
  children: (activeId: string) => ReactNode;
  extraItems?: { label: string; items: SidebarItem[] };
  groups?: { label: string; items: SidebarItem[] }[];
}

const sectionAccents = [
  { color: "var(--arch-blue)",   bg: "var(--arch-blue)",   name: "blue" },
  { color: "var(--arch-purple)", bg: "var(--arch-purple)", name: "purple" },
  { color: "var(--arch-teal)",   bg: "var(--arch-teal)",   name: "teal" },
  { color: "var(--arch-amber)",  bg: "var(--arch-amber)",  name: "amber" },
  { color: "var(--arch-green)",  bg: "var(--arch-green)",  name: "green" },
  { color: "var(--arch-coral)",  bg: "var(--arch-coral)",  name: "coral" },
  { color: "var(--arch-gray)",   bg: "var(--arch-gray)",   name: "gray" },
];

function CollapsibleSection({
  label,
  items,
  active,
  defaultOpen,
  onSelect,
  accentIndex = 0,
}: {
  label: string;
  items: SidebarItem[];
  active: string;
  defaultOpen: boolean;
  onSelect: (id: string) => void;
  accentIndex?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasActiveChild = items.some((item) => item.id === active);
  const accent = sectionAccents[accentIndex % sectionAccents.length];
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [items, open]);

  return (
    <div className="sidebar-group">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="sidebar-section-header group flex items-center w-full px-4 py-2 select-none"
      >
        {/* Accent bar */}
        <div
          className="w-[3px] h-3.5 rounded-full mr-2.5 shrink-0 transition-all duration-300"
          style={{
            background: hasActiveChild ? accent.color : "var(--arch-border2)",
            boxShadow: hasActiveChild ? `0 0 8px color-mix(in srgb, ${accent.color} 40%, transparent)` : "none",
          }}
        />
        <span
          className="text-[10.5px] font-semibold tracking-[0.08em] uppercase transition-colors duration-200 flex-1 text-left"
          style={{ color: hasActiveChild ? accent.color : undefined }}
        >
          {label}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-arch-text3 group-hover:text-arch-text2 transition-transform duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? "" : "-rotate-90"}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Animated collapsible content */}
      <div
        className="overflow-hidden transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          maxHeight: open ? (contentHeight ?? 2000) + "px" : "0px",
          opacity: open ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="pb-1">
          {items.map((item, i) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                style={{
                  animationDelay: open ? `${i * 20}ms` : "0ms",
                }}
                className={`sidebar-nav-item flex items-center gap-2.5 w-full text-left mx-2 rounded-lg transition-all duration-200 select-none ${
                  open ? "sidebar-item-enter" : ""
                } ${
                  isActive
                    ? "sidebar-nav-active"
                    : "hover:bg-[var(--sidebar-hover)]"
                }`}
                {...(isActive ? { "data-accent": accent.name } : {})}
              >
                {/* Active indicator dot */}
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300"
                  style={
                    isActive
                      ? {
                          background: accent.color,
                          boxShadow: `0 0 6px color-mix(in srgb, ${accent.color} 50%, transparent)`,
                        }
                      : { background: "var(--arch-border2)" }
                  }
                />
                <span
                  className={`text-[11.5px] leading-tight transition-colors duration-200 ${
                    isActive
                      ? "font-medium text-arch-text"
                      : "text-arch-text2"
                  }`}
                >
                  {item.label}
                </span>
                {/* Active accent right edge */}
                {isActive && (
                  <div
                    className="ml-auto w-1 h-4 rounded-full shrink-0 sidebar-active-bar"
                    style={{ background: accent.color, opacity: 0.5 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SectionLayout({ label, items, children, extraItems, groups }: SectionLayoutProps) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const sidebarRef = useRef<HTMLElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    const check = () => {
      setCanScrollUp(el.scrollTop > 8);
      setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="grid grid-cols-[220px_1fr] min-h-[calc(100vh-108px)]">
      {/* Sidebar */}
      <aside className="relative flex flex-col bg-arch-bg2 border-r border-arch-border">
        {/* Scroll fade indicators */}
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-6 z-10 transition-opacity duration-300"
          style={{
            background: "linear-gradient(to bottom, var(--arch-bg2), transparent)",
            opacity: canScrollUp ? 1 : 0,
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 z-10 transition-opacity duration-300"
          style={{
            background: "linear-gradient(to top, var(--arch-bg2), transparent)",
            opacity: canScrollDown ? 1 : 0,
          }}
        />

        {/* Scrollable content */}
        <nav ref={sidebarRef} className="flex-1 overflow-y-auto py-3 sidebar-scroll">
          <CollapsibleSection
            label={label}
            items={items}
            active={active}
            defaultOpen={false}
            onSelect={setActive}
            accentIndex={0}
          />
          {extraItems && (
            <CollapsibleSection
              label={extraItems.label}
              items={extraItems.items}
              active={active}
              defaultOpen={false}
              onSelect={setActive}
              accentIndex={1}
            />
          )}
          {groups?.map((group, i) => (
            <CollapsibleSection
              key={group.label}
              label={group.label}
              items={group.items}
              active={active}
              defaultOpen={false}
              onSelect={setActive}
              accentIndex={(i + 2) % sectionAccents.length}
            />
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="overflow-y-auto py-5 px-6">{children(active)}</div>
    </div>
  );
}
