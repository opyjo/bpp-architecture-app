"use client";

import { type ReactNode } from "react";

interface TooltipProps {
  /** Text/markup shown in the bubble. When empty, children render untouched. */
  content?: ReactNode;
  /** The trigger element the tooltip is anchored to. */
  children: ReactNode;
  /** Which side of the trigger the bubble appears on. Default "bottom". */
  side?: "top" | "bottom";
  /** Extra classes for the wrapper (e.g. layout control). */
  className?: string;
}

/**
 * Lightweight, dependency-free tooltip. Pure CSS group-hover (plus focus-within
 * for keyboard users) — no JS state, so it adds zero re-renders to the trigger.
 * The bubble is anchored to the wrapper; pick the side that won't clip against a
 * scroll container's edge.
 */
export default function Tooltip({
  content,
  children,
  side = "bottom",
  className = "",
}: TooltipProps) {
  if (!content) return <>{children}</>;

  const onTop = side === "top";

  return (
    <span className={`group/tt relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={[
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2",
          onTop ? "bottom-full mb-2" : "top-full mt-2",
          "w-max max-w-[230px] rounded-lg border border-arch-border bg-arch-bg2 px-3 py-2",
          "text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-arch-text2",
          "shadow-lg shadow-black/30",
          "opacity-0 transition-all duration-150",
          onTop ? "translate-y-1" : "-translate-y-1",
          "group-hover/tt:translate-y-0 group-hover/tt:opacity-100",
          "group-focus-within/tt:translate-y-0 group-focus-within/tt:opacity-100",
        ].join(" ")}
      >
        {content}
        {/* Arrow — a rotated square whose two outer borders form the point. */}
        <span
          className={[
            "absolute left-1/2 size-2 -translate-x-1/2 rotate-45 border bg-arch-bg2",
            onTop
              ? "top-full -mt-1 border-b border-r border-arch-border"
              : "bottom-full -mb-1 border-l border-t border-arch-border",
          ].join(" ")}
        />
      </span>
    </span>
  );
}
