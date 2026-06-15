"use client";

import { useMemo } from "react";
import { repoTree, serviceTypePatterns, repoDomains, type RepoNode } from "@/data/repo-structure";

interface RepoDetailProps {
  nodeId: string;
}

// ── Cross-Reference Helpers ──────────────────────────────

const PREFIXES = ["svc-", "mdl-", "pkg-", "fn-", "cmd-", "poc-", "test-", "doc-"];

function baseName(id: string): string {
  for (const p of PREFIXES) {
    if (id.startsWith(p)) return id.slice(p.length);
  }
  return id;
}

interface CrossRef {
  node: RepoNode;
  parentNode: RepoNode;
  label: string;
}

function computeCrossRefs(node: RepoNode, parentNode: RepoNode | undefined): {
  dependsOn: CrossRef[];
  usedBy: CrossRef[];
  sameDomain: CrossRef[];
} {
  if (!parentNode) return { dependsOn: [], usedBy: [], sameDomain: [] };

  const base = baseName(node.id);
  const dependsOn: CrossRef[] = [];
  const usedBy: CrossRef[] = [];
  const sameDomain: CrossRef[] = [];

  // Find domain for this node
  const domain = repoDomains.find((d) => d.services.includes(node.id));

  for (const dir of repoTree) {
    for (const child of dir.children ?? []) {
      if (child.id === node.id) continue;
      const childBase = baseName(child.id);

      // Direct or partial name match
      const isMatch = childBase === base || childBase.includes(base) || base.includes(childBase);

      if (isMatch) {
        const ref: CrossRef = { node: child, parentNode: dir, label: "name match" };
        // Services depend on models/packages
        if (parentNode.id === "services" || parentNode.id === "serverless" || parentNode.id === "cmd") {
          if (dir.id === "model" || dir.id === "pkg") dependsOn.push({ ...ref, label: "data types" });
        }
        // Models/packages are used by services
        if (parentNode.id === "model" || parentNode.id === "pkg") {
          if (dir.id === "services" || dir.id === "serverless" || dir.id === "cmd") usedBy.push({ ...ref, label: "consumer" });
        }
        // Cross-directory for same-level
        if (parentNode.id === dir.id && dir.id !== parentNode.id) {
          // skip — same directory siblings handled by domain
        } else if (
          !dependsOn.some((d) => d.node.id === child.id) &&
          !usedBy.some((u) => u.node.id === child.id)
        ) {
          // Related in other dirs
          if (dir.id !== parentNode.id) {
            const label =
              dir.id === "serverless" ? "serverless" :
              dir.id === "cmd" ? "CLI tool" :
              dir.id === "model" ? "data types" :
              dir.id === "pkg" ? "package" : "related";
            dependsOn.push({ ...ref, label });
          }
        }
      }
    }
  }

  // Same domain (only for services)
  if (domain && parentNode.id === "services") {
    const svcDir = repoTree.find((d) => d.id === "services");
    for (const svcId of domain.services) {
      if (svcId === node.id) continue;
      const svc = svcDir?.children?.find((c) => c.id === svcId);
      if (svc && !dependsOn.some((d) => d.node.id === svc.id) && !usedBy.some((u) => u.node.id === svc.id)) {
        sameDomain.push({ node: svc, parentNode: svcDir!, label: domain.name });
      }
    }
  }

  // Shared tech (add a few if we don't have many refs yet)
  if (dependsOn.length + usedBy.length < 2 && node.tech && node.tech.length > 0) {
    const nodeTechs = new Set(node.tech);
    for (const dir of repoTree) {
      for (const child of dir.children ?? []) {
        if (child.id === node.id) continue;
        if (dependsOn.some((d) => d.node.id === child.id) || usedBy.some((u) => u.node.id === child.id)) continue;
        if (sameDomain.some((s) => s.node.id === child.id)) continue;
        const shared = child.tech?.filter((t) => nodeTechs.has(t)) ?? [];
        if (shared.length >= 2) {
          const ref: CrossRef = { node: child, parentNode: dir, label: shared.slice(0, 2).join(", ") };
          if (dir.id === "model" || dir.id === "pkg") dependsOn.push(ref);
          else usedBy.push(ref);
          if (dependsOn.length + usedBy.length >= 5) break;
        }
      }
      if (dependsOn.length + usedBy.length >= 5) break;
    }
  }

  return { dependsOn, usedBy, sameDomain };
}

export default function RepoDetail({ nodeId }: RepoDetailProps) {
  // Find the node — could be top-level or a child
  let node: RepoNode | undefined;
  let parentNode: RepoNode | undefined;

  for (const top of repoTree) {
    if (top.id === nodeId) {
      node = top;
      break;
    }
    const child = top.children?.find((c) => c.id === nodeId);
    if (child) {
      node = child;
      parentNode = top;
      break;
    }
  }

  if (!node) {
    return (
      <div className="p-4 text-[11px] text-arch-text3">
        Select a node to see details.
      </div>
    );
  }

  const isTopLevel = !parentNode;
  const childCount = node.children?.length ?? 0;

  // Determine service type pattern for child nodes
  const pattern = !isTopLevel ? guessPattern(node) : null;

  // Find domain membership for services
  const domain = !isTopLevel && parentNode?.id === "services"
    ? repoDomains.find((d) => d.services.includes(node!.id))
    : null;

  // Cross-references
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
            {parentNode ? `${parentNode.name}${node.name}` : node.type}
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
            {pattern.files.map((file, i) => (
              <div
                key={file}
                className="flex items-center gap-1.5 py-0.5"
                style={{ paddingLeft: file.includes(".") ? 12 : 0 }}
              >
                <svg
                  className="w-3 h-3 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={file.endsWith("/") ? "var(--arch-amber)" : "var(--arch-text3)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {file.endsWith("/") ? (
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  ) : (
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  )}
                </svg>
                <span
                  className="font-mono text-[9.5px]"
                  style={{ color: getFileColor(file, i) }}
                >
                  {file}
                </span>
              </div>
            ))}
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
        {ref_.parentNode.name}{ref_.node.name}
      </span>
      <span className="ml-auto text-[8px] text-arch-text3 shrink-0">{ref_.label}</span>
    </div>
  );
}

function typeIcon(type: string): string {
  switch (type) {
    case "dir": return "/";
    case "service": return "S";
    case "serverless": return "F";
    case "package": return "P";
    case "model": return "M";
    case "cli": return ">";
    case "poc": return "?";
    case "test": return "T";
    case "doc": return "D";
    default: return "*";
  }
}

function guessPattern(node: RepoNode) {
  if (node.type === "serverless") return serviceTypePatterns.find((p) => p.type === "Lambda Function");
  if (node.type === "service") {
    // Partner services (Bango, Disney, Netflix, Bell Media, Radio-Canada)
    if (node.name.includes("merchant-api-") || node.name.includes("reseller-")) {
      return serviceTypePatterns.find((p) => p.type === "Partner API Service");
    }
    // Protobuf services
    if (node.tech?.includes("gRPC") || node.tech?.includes("Protobuf")) {
      return serviceTypePatterns.find((p) => p.type === "Protocol Buffer Service");
    }
    // Default: typical service
    return serviceTypePatterns.find((p) => p.type === "Typical Service");
  }
  return null;
}

function getFileColor(file: string, _i: number): string {
  if (file === "go.mod" || file === "go.sum") return "var(--arch-teal)";
  if (file.endsWith(".graphql") || file.endsWith(".proto")) return "var(--arch-purple)";
  if (file === "Dockerfile" || file === "template.yaml") return "var(--arch-coral)";
  if (file.includes("test")) return "var(--arch-green)";
  return "var(--arch-text2)";
}
