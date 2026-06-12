"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 9)}`);
  const { theme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    async function render() {
      const mermaid = (await import("mermaid")).default;

      const bg = getCssVar("--arch-bg");
      const bg2 = getCssVar("--arch-bg2");
      const bg3 = getCssVar("--arch-bg3");
      const text = getCssVar("--arch-text");
      const text2 = getCssVar("--arch-text2");
      const blue = getCssVar("--arch-blue");
      const border = getCssVar("--arch-border");
      const border2 = getCssVar("--arch-border2");

      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          background: bg,
          primaryColor: bg3,
          primaryTextColor: text,
          primaryBorderColor: border2,
          lineColor: blue,
          secondaryColor: bg2,
          tertiaryColor: bg3,
          noteBkgColor: bg3,
          noteTextColor: text2,
          noteBorderColor: border,
          actorBkg: bg3,
          actorBorder: border2,
          actorTextColor: text,
          actorLineColor: blue,
          signalColor: text,
          signalTextColor: text,
          labelBoxBkgColor: bg2,
          labelBoxBorderColor: border,
          labelTextColor: text,
          loopTextColor: text2,
          activationBorderColor: blue,
          activationBkgColor: bg3,
          sequenceNumberColor: bg,
        },
        sequence: {
          actorMargin: 60,
          messageMargin: 30,
          mirrorActors: false,
          bottomMarginAdj: 1,
          useMaxWidth: false,
        },
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
        fontSize: 11,
      });

      try {
        const { svg: rendered } = await mermaid.render(
          idRef.current,
          chart
        );
        if (!cancelled) setSvg(rendered);
      } catch {
        if (!cancelled) setSvg(`<pre style="color:#e85a5a;font-size:11px">Failed to render diagram</pre>`);
      }
    }
    render();
    return () => { cancelled = true; };
  }, [chart, theme]);

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto bg-arch-bg3 border border-arch-border rounded-lg p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
