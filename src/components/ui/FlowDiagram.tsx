"use client";

import { useState } from "react";
import { FlowDiagramStep, flowNodes } from "@/data/flow-diagrams";

interface FlowDiagramProps {
  steps: FlowDiagramStep[];
}

const NODE_W = 110;
const NODE_H = 46;
const SVG_W = 730;
const SVG_H = 300;

function getNodeCenter(id: string): { x: number; y: number } | null {
  const node = flowNodes.find((n) => n.id === id);
  if (!node) return null;
  return { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 };
}

export default function FlowDiagram({ steps }: FlowDiagramProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];

  const edgeFrom = getNodeCenter(step.activeEdge[0]);
  const edgeTo = getNodeCenter(step.activeEdge[1]);

  return (
    <div className="bg-arch-bg2 border border-arch-border rounded-lg overflow-hidden mb-3.5">
      {/* SVG Diagram */}
      <div className="overflow-x-auto p-3">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full max-w-[730px] h-auto"
          style={{ minWidth: 500 }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="var(--arch-blue)" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Render nodes */}
          {flowNodes.map((node) => {
            const isActive = step.activeNodes.includes(node.id);
            return (
              <g
                key={node.id}
                opacity={isActive ? 1 : 0.25}
                className={isActive ? "flow-node-active" : ""}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  fill={isActive ? `${node.color}22` : "var(--arch-bg3)"}
                  stroke={isActive ? node.color : "var(--arch-border)"}
                  strokeWidth={isActive ? 1.5 : 0.5}
                  filter={isActive ? "url(#glow)" : undefined}
                />
                <text
                  x={node.x + NODE_W / 2}
                  y={node.y + 18}
                  textAnchor="middle"
                  fill={isActive ? "var(--arch-text)" : "var(--arch-text3)"}
                  fontSize={10.5}
                  fontWeight={600}
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                >
                  {node.label}
                </text>
                <text
                  x={node.x + NODE_W / 2}
                  y={node.y + 33}
                  textAnchor="middle"
                  fill={isActive ? "var(--arch-text2)" : "var(--arch-text3)"}
                  fontSize={9}
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                >
                  {node.subtitle}
                </text>
              </g>
            );
          })}

          {/* Animated edge */}
          {edgeFrom && edgeTo && (
            <line
              x1={edgeFrom.x}
              y1={edgeFrom.y}
              x2={edgeTo.x}
              y2={edgeTo.y}
              stroke="var(--arch-blue)"
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
              className="fe-anim"
              opacity={0.9}
            />
          )}
        </svg>
      </div>

      {/* Controls + Description */}
      <div className="border-t border-arch-border px-3.5 py-3 flex gap-3">
        {/* Description panel */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-arch-blue mb-1">
            {step.label}
          </div>
          <div className="text-[11px] text-arch-text2 leading-[1.65] mb-1.5">
            {step.description}
          </div>
          {step.mutation && (
            <div className="inline-block font-mono text-[10px] px-1.5 py-0.5 rounded bg-[rgba(232,168,58,0.1)] border border-[rgba(232,168,58,0.2)] text-arch-amber mb-1">
              {step.mutation}
            </div>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            {step.services.map((s) => (
              <span
                key={s}
                className="inline-block font-mono text-[9px] px-1 py-px rounded bg-arch-bg3 border border-arch-border text-arch-text3"
              >
                {s}
              </span>
            ))}
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
              onClick={() =>
                setCurrentStep((s) => Math.min(steps.length - 1, s + 1))
              }
              disabled={currentStep === steps.length - 1}
              className="px-2 py-1 text-[10.5px] font-medium rounded bg-arch-bg3 border border-arch-border text-arch-text2 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
          {/* Step dots */}
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentStep
                    ? "bg-arch-blue shadow-[0_0_4px_rgba(74,143,232,0.5)]"
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
