"use client";

import { useMemo } from "react";
import { repoTree, repoDomains } from "@/data/repo-structure";
import {
  findNode,
  computeCrossRefs,
  typeIcon,
  guessPattern,
  getFileColor,
  type CrossRef,
} from "./repo-detail-utils";

interface RepoDetailWideProps {
  nodeId: string;
  onClose: () => void;
  onNavigate: (nodeId: string) => void;
}

export default function RepoDetailWide({ nodeId, onClose, onNavigate }: RepoDetailWideProps) {
  const result = findNode(nodeId);

  if (!result) {
    return (
      <div className="bg-arch-bg2 border border-arch-border rounded-lg p-4 text-[11px] text-arch-text3">
        Select a node to see details.
      </div>
    );
  }

  const { node, parentNode } = result;
  const isTopLevel = !parentNode;
  const childCount = node.children?.length ?? 0;
  const pattern = !isTopLevel ? guessPattern(node) : null;

  const domain = !isTopLevel && parentNode?.id === "services"
    ? repoDomains.find((d) => d.services.includes(node.id))
    : null;

  const crossRefs = useMemo(
    () => (node && !isTopLevel ? computeCrossRefs(node, parentNode) : null),
    [node, isTopLevel, parentNode],
  );

  const hasCrossRefs = crossRefs && (crossRefs.dependsOn.length > 0 || crossRefs.usedBy.length > 0 || crossRefs.sameDomain.length > 0);

  return (
    <div
      className="bg-arch-bg2 border border-arch-border rounded-lg overflow-y-auto h-full"
      style={{ animation: "messageSlideIn 0.25s ease-out" }}
    >
      {/* ── Sticky Header ──────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-arch-bg2 border-b border-arch-border px-4 py-2.5 flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ background: `${node.color}18`, border: `1px solid ${node.color}30` }}
        >
          <span className="text-[12px] font-bold" style={{ color: node.color }}>
            {typeIcon(node.type)}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-mono text-[13px] font-bold text-arch-text truncate">{node.name}</span>
          <span className="text-[10px] text-arch-text3 truncate shrink-0">
            {parentNode ? `${parentNode.name}/` : node.type}
          </span>
        </div>
        {domain && (
          <span
            className="inline-block text-[9.5px] font-medium px-2 py-0.5 rounded-full border shrink-0"
            style={{
              background: `${domain.color}15`,
              borderColor: `${domain.color}30`,
              color: domain.color,
            }}
          >
            {domain.name}
          </span>
        )}
        <button
          onClick={onClose}
          className="ml-auto shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-arch-bg3 text-arch-text3 hover:text-arch-text transition-colors"
          title="Close details"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Body: 2-column layout ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Left Column: Description + Analogy */}
        <div className="space-y-3 min-w-0">
          <div>
            <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold mb-1">Description</div>
            <div className="text-[11.5px] text-arch-text2 leading-[1.7]">{node.description}</div>
          </div>

          {/* Analogy callout */}
          <div className="analogy-callout flex gap-2 items-start px-3 py-2 rounded-md border">
            <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-arch-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0" />
            </svg>
            <span className="text-[11px] text-arch-amber leading-[1.6]">{node.analogy}</span>
          </div>

          {/* Child count for top-level dirs */}
          {isTopLevel && childCount > 0 && (
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold mb-1">Contains</div>
              <span className="text-[11px] text-arch-text2">
                {childCount} {node.type === "dir" ? "modules" : "items"}
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Technologies + File Structure */}
        <div className="space-y-3 min-w-0">
          {/* Technology tags */}
          {node.tech && node.tech.length > 0 && (
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold mb-1.5">Technologies</div>
              <div className="flex flex-wrap gap-1">
                {node.tech.map((t) => (
                  <span
                    key={t}
                    className="inline-block font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-arch-bg3 border border-arch-border text-arch-text2"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* File structure */}
          {pattern && (
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold mb-1.5">
                File Structure — {pattern.type}
              </div>
              <div className="bg-arch-bg rounded-md border border-arch-border p-2 space-y-0.5">
                {pattern.files.map((file, i) => {
                  const fileName = typeof file === "string" ? file : file.name;
                  const fileDesc = typeof file === "string" ? null : file.description;
                  return (
                    <div
                      key={fileName}
                      className="group rounded px-1.5 py-1 hover:bg-arch-bg2 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <svg
                          className="w-3 h-3 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={fileName.endsWith("/") ? "var(--arch-amber)" : "var(--arch-text3)"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {fileName.endsWith("/") ? (
                            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                          ) : (
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          )}
                        </svg>
                        <span
                          className="font-mono text-[9.5px] font-medium"
                          style={{ color: getFileColor(fileName, i) }}
                        >
                          {fileName}
                        </span>
                      </div>
                      {fileDesc && (
                        <div className="text-[9px] text-arch-text3 leading-[1.5] mt-0.5 ml-[18px]">
                          {fileDesc}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-arch-text3 mt-1.5 leading-[1.5]">{pattern.description}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Cross-References (full width, 3-column grid) ──── */}
      {hasCrossRefs && (
        <div className="border-t border-arch-border px-4 py-3">
          <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold mb-2">Cross-References</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {crossRefs.dependsOn.length > 0 && (
              <div>
                <div className="text-[10px] font-medium text-arch-text2 mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-arch-coral" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  Depends On
                </div>
                <div className="space-y-1">
                  {crossRefs.dependsOn.map((ref) => (
                    <CrossRefRow key={ref.node.id} ref_={ref} onNavigate={onNavigate} />
                  ))}
                </div>
              </div>
            )}
            {crossRefs.usedBy.length > 0 && (
              <div>
                <div className="text-[10px] font-medium text-arch-text2 mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-arch-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 7l-9.2 9.2M7 7v10h10" />
                  </svg>
                  Used By
                </div>
                <div className="space-y-1">
                  {crossRefs.usedBy.map((ref) => (
                    <CrossRefRow key={ref.node.id} ref_={ref} onNavigate={onNavigate} />
                  ))}
                </div>
              </div>
            )}
            {crossRefs.sameDomain.length > 0 && (
              <div>
                <div className="text-[10px] font-medium text-arch-text2 mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-arch-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  Same Domain
                </div>
                <div className="space-y-1">
                  {crossRefs.sameDomain.map((ref) => (
                    <CrossRefRow key={ref.node.id} ref_={ref} onNavigate={onNavigate} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CrossRefRow({ ref_, onNavigate }: { ref_: CrossRef; onNavigate: (nodeId: string) => void }) {
  return (
    <button
      onClick={() => onNavigate(ref_.node.id)}
      className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded bg-arch-bg border border-arch-border hover:border-arch-blue/40 hover:bg-arch-blue/5 transition-colors text-left group"
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ref_.parentNode.color }} />
      <span className="font-mono text-[9.5px] text-arch-text2 group-hover:text-arch-text truncate">
        {ref_.parentNode.name}/{ref_.node.name}
      </span>
      <span className="ml-auto text-[8px] text-arch-text3 shrink-0">{ref_.label}</span>
    </button>
  );
}
