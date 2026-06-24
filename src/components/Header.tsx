"use client";

import Link from "next/link";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import LogoutButton from "./LogoutButton";

const badges = [
  { label: "MFE", color: "bg-[rgba(124,111,205,0.14)] text-arch-purple border-[rgba(124,111,205,0.22)]" },
  { label: "BFF", color: "bg-[rgba(62,184,154,0.12)] text-arch-teal border-[rgba(62,184,154,0.22)]" },
  { label: "Gateways", color: "bg-[rgba(74,143,232,0.12)] text-arch-blue border-[rgba(74,143,232,0.22)]" },
  { label: "Core services", color: "bg-[rgba(232,168,58,0.12)] text-arch-amber border-[rgba(232,168,58,0.22)]" },
  { label: "Support", color: "bg-[rgba(88,184,122,0.12)] text-arch-green border-[rgba(88,184,122,0.22)]" },
  { label: "Auth", color: "bg-[rgba(232,112,90,0.12)] text-arch-coral border-[rgba(232,112,90,0.22)]" },
  { label: "Errors", color: "bg-[rgba(232,90,90,0.12)] text-arch-red border-[rgba(232,90,90,0.22)]" },
];

export default function Header() {
  return (
    <header className="bg-arch-bg2 border-b border-arch-border px-6 py-3.5 flex items-center justify-between gap-2.5 flex-wrap">
      <Link
        href="/"
        className="group flex items-center gap-2.5"
        aria-label="conduit-architecture — home"
      >
        <Logo />
        <div className="flex flex-col leading-none">
          <span className="brand-gradient-text text-[15px] font-bold tracking-tight">
            conduit-architecture
          </span>
          <span className="hidden sm:block mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-arch-text3">
            architecture workspace
          </span>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex gap-1 flex-wrap">
          {badges.map((b) => (
            <span
              key={b.label}
              className={`text-[10.5px] px-1.5 py-0.5 rounded border font-medium ${b.color}`}
            >
              {b.label}
            </span>
          ))}
        </div>
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
