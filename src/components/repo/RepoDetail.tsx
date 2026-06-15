"use client";

import { repoTree, serviceTypePatterns, repoDomains, type RepoNode } from "@/data/repo-structure";

interface RepoDetailProps {
  nodeId: string;
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
