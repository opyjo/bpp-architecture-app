"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";

function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 9)}`);
  const { theme } = useTheme();

  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.2, 3)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.2, 0.2)), []);
  const handleReset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const handleFit = useCallback(() => {
    const container = containerRef.current;
    const wrap = svgWrapRef.current;
    if (!container || !wrap) return;
    const svgEl = wrap.querySelector("svg");
    if (!svgEl) return;
    const naturalW = svgEl.viewBox?.baseVal?.width || svgEl.getBoundingClientRect().width;
    const naturalH = svgEl.viewBox?.baseVal?.height || svgEl.getBoundingClientRect().height;
    const containerW = container.clientWidth - 32;
    const containerH = container.clientHeight - 32;
    const fitZoom = Math.min(containerW / naturalW, containerH / naturalH, 1);
    setZoom(fitZoom);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.min(Math.max(z + delta, 0.2), 3));
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

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
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
          curve: "basis",
        },
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
        fontSize: 14,
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

  // Reset pan/zoom when chart changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [chart]);

  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-arch-bg2/90 backdrop-blur-sm border border-arch-border rounded-lg px-1 py-0.5">
        <button onClick={handleZoomOut} className="px-2 py-1 text-arch-text2 hover:text-arch-text hover:bg-white/10 rounded text-[13px] font-mono" title="Zoom out">−</button>
        <span className="text-[10.5px] text-arch-text3 w-10 text-center select-none">{Math.round(zoom * 100)}%</span>
        <button onClick={handleZoomIn} className="px-2 py-1 text-arch-text2 hover:text-arch-text hover:bg-white/10 rounded text-[13px] font-mono" title="Zoom in">+</button>
        <div className="w-px h-4 bg-arch-border mx-0.5" />
        <button onClick={handleFit} className="px-1.5 py-1 text-arch-text2 hover:text-arch-text hover:bg-white/10 rounded text-[10.5px]" title="Fit to view">Fit</button>
        <button onClick={handleReset} className="px-1.5 py-1 text-arch-text2 hover:text-arch-text hover:bg-white/10 rounded text-[10.5px]" title="Reset zoom">1:1</button>
      </div>
      <div className="text-[9.5px] text-arch-text3 absolute bottom-2 left-3 z-10 select-none pointer-events-none">
        Drag to pan · Ctrl+scroll to zoom
      </div>
      {/* Pannable/zoomable container */}
      <div
        ref={containerRef}
        className="overflow-hidden bg-arch-bg3 border border-arch-border rounded-lg"
        style={{ height: "calc(100vh - 200px)", cursor: isPanning ? "grabbing" : "grab" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={svgWrapRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "top left",
            padding: "16px",
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
