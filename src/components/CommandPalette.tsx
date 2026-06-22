"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, ArrowUp, ArrowDown, Command } from "lucide-react";
import { searchIndex, kindTint, type SearchEntry } from "@/lib/search-index";
import { cn } from "@/lib/utils";

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchIndex(query), [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const go = useCallback(
    (entry: SearchEntry | undefined) => {
      if (!entry) return;
      if (entry.href) router.push(entry.href);
      else if (entry.tab) router.push(`/?tab=${entry.tab}`);
      close();
    },
    [router, close]
  );

  // Global ⌘K / Ctrl+K toggle
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // Keep the active row in view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
      onMouseDown={close}
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-150" />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-arch-border2 bg-arch-bg2 shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-150"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onListKey}
      >
        {/* Search field */}
        <div className="flex items-center gap-2.5 border-b border-arch-border px-4 py-3">
          <Search className="size-4 shrink-0 text-arch-text3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search services, events, lambdas, runbooks, tabs…"
            className="flex-1 bg-transparent text-sm text-arch-text placeholder:text-arch-text3 focus:outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 rounded border border-arch-border px-1.5 py-0.5 text-[10px] font-medium text-arch-text3">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-arch-text3">
              No matches for <span className="text-arch-text2">“{query}”</span>
            </div>
          ) : (
            results.map((entry, i) => (
              <button
                key={entry.id}
                data-idx={i}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(entry)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
                  i === active ? "bg-arch-blue/10" : "hover:bg-arch-bg3"
                )}
              >
                <span
                  className={cn(
                    "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    kindTint(entry.kind)
                  )}
                >
                  {entry.kind}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-arch-text">
                    {entry.title}
                  </span>
                  {entry.subtitle && (
                    <span className="block truncate text-[11px] text-arch-text3">
                      {entry.subtitle}
                    </span>
                  )}
                </span>
                {i === active && (
                  <CornerDownLeft className="size-3.5 shrink-0 text-arch-text3" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between border-t border-arch-border bg-arch-bg3/60 px-4 py-2 text-[11px] text-arch-text3">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowUp className="size-3" />
              <ArrowDown className="size-3" />
              navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="size-3" />
              open
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Command className="size-3" />K to toggle · {results.length} results
          </span>
        </div>
      </div>
    </div>
  );
}
