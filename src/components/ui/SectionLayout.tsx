"use client";

import { useState, ReactNode } from "react";

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
  { border: "rgba(74, 143, 232, 0.35)", bg: "rgba(74, 143, 232, 0.06)", dot: "rgba(74, 143, 232, 0.6)" },       // blue
  { border: "rgba(124, 111, 205, 0.35)", bg: "rgba(124, 111, 205, 0.06)", dot: "rgba(124, 111, 205, 0.6)" },     // purple
  { border: "rgba(62, 184, 154, 0.35)", bg: "rgba(62, 184, 154, 0.06)", dot: "rgba(62, 184, 154, 0.6)" },        // teal
  { border: "rgba(232, 168, 58, 0.35)", bg: "rgba(232, 168, 58, 0.06)", dot: "rgba(232, 168, 58, 0.6)" },        // amber
  { border: "rgba(88, 184, 122, 0.35)", bg: "rgba(88, 184, 122, 0.06)", dot: "rgba(88, 184, 122, 0.6)" },        // green
  { border: "rgba(232, 112, 90, 0.35)", bg: "rgba(232, 112, 90, 0.06)", dot: "rgba(232, 112, 90, 0.6)" },        // coral
  { border: "rgba(107, 117, 144, 0.35)", bg: "rgba(107, 117, 144, 0.06)", dot: "rgba(107, 117, 144, 0.6)" },     // gray
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

  return (
    <>
      <div className="h-px bg-arch-border mx-3.5 my-1.5" />
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="sidebar-section-header flex items-center justify-between w-full px-3.5 py-1.5 group select-none rounded-sm mx-0"
        style={hasActiveChild ? { background: accent.bg } : undefined}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-1 h-1 rounded-full shrink-0 transition-colors"
            style={{ background: hasActiveChild ? accent.border : "transparent" }}
          />
          <span
            className="text-[9.5px] font-semibold tracking-[0.1em] uppercase transition-colors"
            style={{ color: hasActiveChild ? accent.border.replace("0.35", "1") : undefined }}
          >
            {label}
          </span>
        </div>
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
          className={`text-arch-text3 group-hover:text-arch-text2 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="sidebar-section-items">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{ animationDelay: `${i * 25}ms` }}
              className={`flex items-center gap-2 px-3.5 py-2 w-full text-left border-l-2 transition-all duration-200 select-none ${
                active === item.id
                  ? "bg-white/5 border-l-arch-blue"
                  : "border-l-transparent hover:bg-white/[0.03]"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                  active === item.id
                    ? "sidebar-dot-active bg-arch-blue"
                    : "bg-arch-text3"
                }`}
                style={active === item.id ? { "--dot-glow": accent.dot } as React.CSSProperties : undefined}
              />
              <span
                className={`text-[11.5px] transition-colors duration-200 ${
                  active === item.id ? "text-arch-text" : "text-arch-text2"
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default function SectionLayout({ label, items, children, extraItems, groups }: SectionLayoutProps) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  return (
    <div className="grid grid-cols-[196px_1fr] min-h-[calc(100vh-108px)]">
      <aside className="bg-arch-bg2 border-r border-arch-border py-4 overflow-y-auto">
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
      </aside>
      <div className="overflow-y-auto py-5 px-6">{children(active)}</div>
    </div>
  );
}
