"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/navigation";

export default function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex bg-arch-bg2 border-b border-arch-border overflow-x-auto">
      {navItems.map((item) => {
        const active = item.matchExact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`tab-item flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 border-b-0 ${
              active
                ? "tab-item-active text-arch-blue"
                : "text-arch-text2 hover:text-arch-text hover:bg-white/[0.03]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
