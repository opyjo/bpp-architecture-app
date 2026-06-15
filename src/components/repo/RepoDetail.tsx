"use client";

import { useMemo } from "react";
import { repoDomains } from "@/data/repo-structure";
import {
  findNode,
  computeCrossRefs,
  typeIcon,
  guessPattern,
  getFileColor,
  type CrossRef,
} from "./repo-detail-utils";

interface RepoDetailProps {
  nodeId: string;
}

/** @deprecated Use RepoDetailWide instead for the center panel layout. */
export default function RepoDetail({ nodeId }: RepoDetailProps) {
  const result = findNode(nodeId);

  if (!result) {
    return (
      <div className="p-4 text-[11px] text-arch-text3">
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

  return (
    <div className="p-4 space-y-3" style={{ animation: "messageSlideIn 0.25s ease-out" }}>
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          style={{ background: `${node.color}18`, border: `1px solid ${node.color}30` }}
        >
          <span className="text-[13px]" style={{ color: node.color }}>
            {typeIcon(node.type)}
          </span>
        </div>
        <div>
          <div className="font-mono text-[12.5px] font-bold text-arch-text">{node.name}</div>
          <div className="text-[10px] uppercase tracking-wider text-arch-text3 font-medium mt-0.5">
            {parentNode ? `${parentNode.name}/${node.name}` : node.type}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="text-[11px] text-arch-text2 leading-[1.7]">{node.description}</div>

      {/* Analogy callout */}
      <div className="analogy-callout flex gap-2 items-start px-3 py-2 rounded-md border">
        <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-arch-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0" />
        </svg>
        <span className="text-[11px] text-arch-amber leading-[1.6]">{node.analogy}</span>
      </div>

      {/* Domain badge (for services) */}
      {domain && (
        <div>
          <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold mb-1">Domain</div>
          <span
            className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border"
            style={{
              background: `${domain.color}15`,
              borderColor: `${domain.color}30`,
              color: domain.color,
            }}
          >
            {domain.name}
          </span>
        </div>
      )}

      {/* Child count for top-level dirs */}
      {isTopLevel && childCount > 0 && (
        <div>
          <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold mb-1">Contains</div>
          <span className="text-[11px] text-arch-text2">
            {childCount} {node.type === "dir" ? "modules" : "items"}
          </span>
        </div>
      )}

      {/* Technology tags */}
      {node.tech && node.tech.length > 0 && (
        <div>
          <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold mb-1">Technologies</div>
          <div className="flex flex-wrap gap-1">
            {node.tech.map((t) => (
              <span
                key={t}
                className="inline-block font-mono text-[9px] px-1 py-px rounded bg-arch-bg3 border border-arch-border text-arch-text3"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* File tree for services/serverless */}
      {pattern && (
        <div>
          <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold mb-1.5">
            Typical file structure — {pattern.type}
          </div>
          <div className="bg-arch-bg rounded-md border border-arch-border p-2.5">
            {pattern.files.map((file, i) => {
              const fileName = typeof file === "string" ? file : file.name;
              const fileDesc = typeof file === "string" ? null : file.description;
              return (
                <div
                  key={fileName}
                  className="rounded px-1.5 py-1 hover:bg-arch-bg2 transition-colors"
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

      {/* Cross-references */}
      {crossRefs && (crossRefs.dependsOn.length > 0 || crossRefs.usedBy.length > 0 || crossRefs.sameDomain.length > 0) && (
        <div className="space-y-2.5 pt-1">
          {crossRefs.dependsOn.length > 0 && (
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold mb-1">Depends On</div>
              <div className="space-y-0.5">
                {crossRefs.dependsOn.map((ref) => (
                  <CrossRefRow key={ref.node.id} ref_={ref} />
                ))}
              </div>
            </div>
          )}
          {crossRefs.usedBy.length > 0 && (
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold mb-1">Used By</div>
              <div className="space-y-0.5">
                {crossRefs.usedBy.map((ref) => (
                  <CrossRefRow key={ref.node.id} ref_={ref} />
                ))}
              </div>
            </div>
          )}
          {crossRefs.sameDomain.length > 0 && (
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold mb-1">Same Domain</div>
              <div className="space-y-0.5">
                {crossRefs.sameDomain.map((ref) => (
                  <CrossRefRow key={ref.node.id} ref_={ref} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CrossRefRow({ ref_ }: { ref_: CrossRef }) {
  return (
    <div className="flex items-center gap-1.5 px-1.5 py-1 rounded bg-arch-bg border border-arch-border">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ref_.parentNode.color }} />
      <span className="font-mono text-[9px] text-arch-text2 truncate">
        {ref_.parentNode.name}/{ref_.node.name}
      </span>
      <span className="ml-auto text-[8px] text-arch-text3 shrink-0">{ref_.label}</span>
    </div>
  );
}
