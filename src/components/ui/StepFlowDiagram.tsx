"use client";

import { useState, useMemo } from "react";
import type { FlowStep } from "@/data/flows";

interface StepFlowDiagramProps {
  steps: FlowStep[];
  route: string;
}

const NODE_W = 140;
const NODE_H = 50;
const GAP = 40;
const PAD_X = 25;
const PAD_Y = 30;

export default function StepFlowDiagram({ steps, route }: StepFlowDiagramProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Extract unique screens preserving order
  const uniqueScreens = useMemo(() => {
    const seen = new Set<string>();
    const screens: string[] = [];
    for (const s of steps) {
      if (!seen.has(s.screen)) {
        seen.add(s.screen);
        screens.push(s.screen);
      }
    }
    return screens;
  }, [steps]);

  // Compute node positions — horizontal layout, wrapping after 4 per row
  const cols = Math.min(uniqueScreens.length, 4);
  const rows = Math.ceil(uniqueScreens.length / 4);

  const nodePositions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    uniqueScreens.forEach((screen, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      // Reverse direction on odd rows for a snake layout
      const actualCol = row % 2 === 0 ? col : Math.min(uniqueScreens.length - 1, 3) - col;
      map[screen] = {
        x: PAD_X + actualCol * (NODE_W + GAP),
        y: PAD_Y + row * (NODE_H + 60),
      };
    });
    return map;
  }, [uniqueScreens]);

  const svgW = PAD_X * 2 + cols * NODE_W + (cols - 1) * GAP;
  const svgH = PAD_Y * 2 + rows * NODE_H + (rows - 1) * 60;

  const step = steps[currentStep];
  const activeScreen = step.screen;

  // Compute edges between consecutive unique screens
  const edges = useMemo(() => {
    const result: { from: string; to: string }[] = [];
    for (let i = 0; i < uniqueScreens.length - 1; i++) {
      result.push({ from: uniqueScreens[i], to: uniqueScreens[i + 1] });
    }
    return result;
  }, [uniqueScreens]);

  // Group steps by screen to show count badges
  const stepsPerScreen = useMemo(() => {
    const map: Record<string, number> = {};
    steps.forEach((s) => {
      map[s.screen] = (map[s.screen] || 0) + 1;
    });
    return map;
  }, [steps]);

  // Which screens have been "visited" up to and including current step
  const visitedScreens = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i <= currentStep; i++) {
      set.add(steps[i].screen);
    }
    return set;
  }, [steps, currentStep]);

  // Strip HTML from mutation for plain-text display
  const plainMutation = step.mutation.replace(/<[^>]+>/g, "");

  return (
    <div className="bg-arch-bg2 border border-arch-border rounded-lg overflow-hidden">
      {/* SVG diagram */}
      <div className="overflow-x-auto p-3">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto"
          style={{ minWidth: 400, maxWidth: 730 }}
        >
          <defs>
            <marker
              id="step-arrow"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="var(--arch-purple)" />
            </marker>
            <marker
              id="step-arrow-dim"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="var(--arch-text3)" opacity="0.35" />
            </marker>
            <filter id="screen-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {edges.map(({ from, to }, i) => {
            const f = nodePositions[from];
            const t = nodePositions[to];
            const fromRow = Math.floor(uniqueScreens.indexOf(from) / 4);
            const toRow = Math.floor(uniqueScreens.indexOf(to) / 4);
            const isVisited = visitedScreens.has(from) && visitedScreens.has(to);

            if (fromRow === toRow) {
              // Same row — horizontal arrow
              const x1 = f.x < t.x ? f.x + NODE_W : f.x;
              const x2 = f.x < t.x ? t.x : t.x + NODE_W;
              return (
                <line
                  key={i}
                  x1={x1} y1={f.y + NODE_H / 2}
                  x2={x2} y2={t.y + NODE_H / 2}
                  stroke={isVisited ? "var(--arch-purple)" : "var(--arch-text3)"}
                  strokeWidth={isVisited ? 1.5 : 1}
                  strokeDasharray={isVisited ? undefined : "4 3"}
                  opacity={isVisited ? 0.8 : 0.25}
                  markerEnd={isVisited ? "url(#step-arrow)" : "url(#step-arrow-dim)"}
                />
              );
            } else {
              // Row wrap — draw a U-bend
              const midY = f.y + NODE_H + 20;
              const x1 = f.x + NODE_W / 2;
              const x2 = t.x + NODE_W / 2;
              return (
                <polyline
                  key={i}
                  points={`${x1},${f.y + NODE_H} ${x1},${midY} ${x2},${midY} ${x2},${t.y}`}
                  fill="none"
                  stroke={isVisited ? "var(--arch-purple)" : "var(--arch-text3)"}
                  strokeWidth={isVisited ? 1.5 : 1}
                  strokeDasharray={isVisited ? undefined : "4 3"}
                  opacity={isVisited ? 0.8 : 0.25}
                  markerEnd={isVisited ? "url(#step-arrow)" : "url(#step-arrow-dim)"}
                />
              );
            }
          })}

          {/* Screen nodes */}
          {uniqueScreens.map((screen) => {
            const pos = nodePositions[screen];
            const isActive = screen === activeScreen;
            const isVisited = visitedScreens.has(screen);
            const stepCount = stepsPerScreen[screen];

            return (
              <g key={screen} opacity={isActive ? 1 : isVisited ? 0.75 : 0.3}>
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={isActive ? "rgba(124,111,205,0.18)" : isVisited ? "rgba(124,111,205,0.07)" : "var(--arch-bg3)"}
                  stroke={isActive ? "#7c6fcd" : isVisited ? "rgba(124,111,205,0.3)" : "var(--arch-border)"}
                  strokeWidth={isActive ? 2 : 1}
                  filter={isActive ? "url(#screen-glow)" : undefined}
                />
                {/* Screen name */}
                <text
                  x={pos.x + NODE_W / 2}
                  y={pos.y + NODE_H / 2 - (stepCount > 1 ? 3 : 0)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isActive ? "var(--arch-text)" : isVisited ? "var(--arch-text2)" : "var(--arch-text3)"}
                  fontSize={10}
                  fontWeight={isActive ? 700 : 500}
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                >
                  {screen.length > 20 ? screen.slice(0, 18) + "…" : screen}
                </text>
                {/* Step count badge */}
                {stepCount > 1 && (
                  <>
                    <rect
                      x={pos.x + NODE_W / 2 - 16}
                      y={pos.y + NODE_H / 2 + 7}
                      width={32}
                      height={14}
                      rx={7}
                      fill={isActive ? "rgba(124,111,205,0.25)" : "rgba(124,111,205,0.1)"}
                    />
                    <text
                      x={pos.x + NODE_W / 2}
                      y={pos.y + NODE_H / 2 + 14}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isActive ? "#a99de8" : "var(--arch-text3)"}
                      fontSize={8}
                      fontWeight={600}
                    >
                      {stepCount} steps
                    </text>
                  </>
                )}
                {/* Active ring pulse */}
                {isActive && (
                  <rect
                    x={pos.x - 2}
                    y={pos.y - 2}
                    width={NODE_W + 4}
                    height={NODE_H + 4}
                    rx={10}
                    fill="none"
                    stroke="#7c6fcd"
                    strokeWidth={1}
                    opacity={0.3}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Description + navigation */}
      <div className="border-t border-arch-border px-3.5 py-3 flex gap-3">
        <div className="flex-1 min-w-0">
          {/* Step label */}
          <div className="text-[11px] font-semibold text-arch-purple mb-1">
            Step {currentStep + 1}: {step.screen}
          </div>
          {/* Action */}
          <div className="text-[11px] text-arch-text2 leading-[1.65] mb-1.5">
            <span className="text-arch-text font-medium">Action:</span> {step.action}
          </div>
          {/* Mutation */}
          <div className="text-[11px] text-arch-text2 leading-[1.65] mb-1.5">
            <span className="text-arch-text font-medium">Mutation → services:</span>
          </div>
          <div className="text-[10px] font-mono text-arch-teal leading-[1.7] bg-arch-bg3 rounded px-2 py-1.5 border border-arch-border">
            {plainMutation}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col items-center justify-center gap-1.5 shrink-0">
          <div className="text-[9.5px] text-arch-text3 font-medium">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="px-2 py-1 text-[10.5px] font-medium rounded bg-arch-bg3 border border-arch-border text-arch-text2 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={currentStep === steps.length - 1}
              className="px-2 py-1 text-[10.5px] font-medium rounded bg-arch-bg3 border border-arch-border text-arch-text2 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentStep
                    ? "bg-arch-purple shadow-[0_0_4px_rgba(124,111,205,0.5)]"
                    : i <= currentStep
                    ? "bg-arch-purple/40"
                    : "bg-arch-text3 hover:bg-arch-text2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
