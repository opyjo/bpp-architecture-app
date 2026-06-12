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
}

export default function SectionLayout({ label, items, children, extraItems }: SectionLayoutProps) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  return (
    <div className="grid grid-cols-[196px_1fr] min-h-[calc(100vh-108px)]">
      <aside className="bg-arch-bg2 border-r border-arch-border py-4 overflow-y-auto">
        <div className="text-[9.5px] font-semibold tracking-[0.1em] text-arch-text3 uppercase px-3.5 pb-1.5">
          {label}
        </div>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`flex items-center gap-2 px-3.5 py-2 w-full text-left border-l-2 transition-all select-none ${
              active === item.id
                ? "bg-white/5 border-l-arch-blue"
                : "border-l-transparent hover:bg-white/[0.03]"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                active === item.id
                  ? "bg-arch-blue shadow-[0_0_5px_rgba(74,143,232,0.5)]"
                  : "bg-arch-text3"
              }`}
            />
            <span
              className={`text-[11.5px] ${
                active === item.id ? "text-arch-text" : "text-arch-text2"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
        {extraItems && (
          <>
            <div className="h-px bg-arch-border mx-3.5 my-1.5" />
            <div className="text-[9.5px] font-semibold tracking-[0.1em] text-arch-text3 uppercase px-3.5 pb-1.5 pt-1">
              {extraItems.label}
            </div>
            {extraItems.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 w-full text-left border-l-2 transition-all select-none ${
                  active === item.id
                    ? "bg-white/5 border-l-arch-blue"
                    : "border-l-transparent hover:bg-white/[0.03]"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                    active === item.id
                      ? "bg-arch-blue shadow-[0_0_5px_rgba(74,143,232,0.5)]"
                      : "bg-arch-text3"
                  }`}
                />
                <span
                  className={`text-[11.5px] ${
                    active === item.id ? "text-arch-text" : "text-arch-text2"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </>
        )}
      </aside>
      <div className="overflow-y-auto py-5 px-6">{children(active)}</div>
    </div>
  );
}
