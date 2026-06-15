import { repoTree, serviceTypePatterns, repoDomains, type RepoNode, type FileEntry } from "@/data/repo-structure";

// ── Cross-Reference Helpers ──────────────────────────────

const PREFIXES = ["svc-", "mdl-", "pkg-", "fn-", "cmd-", "poc-", "test-", "doc-"];

export function baseName(id: string): string {
  for (const p of PREFIXES) {
    if (id.startsWith(p)) return id.slice(p.length);
  }
  return id;
}

export interface CrossRef {
  node: RepoNode;
  parentNode: RepoNode;
  label: string;
}

export function computeCrossRefs(node: RepoNode, parentNode: RepoNode | undefined): {
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

export function typeIcon(type: string): string {
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

export function guessPattern(node: RepoNode) {
  if (node.type === "serverless") return serviceTypePatterns.find((p) => p.type === "Lambda Function");
  if (node.type === "service") {
    if (node.name.includes("merchant-api-") || node.name.includes("reseller-")) {
      return serviceTypePatterns.find((p) => p.type === "Partner API Service");
    }
    if (node.tech?.includes("gRPC") || node.tech?.includes("Protobuf")) {
      return serviceTypePatterns.find((p) => p.type === "Protocol Buffer Service");
    }
    return serviceTypePatterns.find((p) => p.type === "Typical Service");
  }
  return null;
}

export function getFileColor(file: string, _i: number): string {
  if (file === "go.mod" || file === "go.sum") return "var(--arch-teal)";
  if (file.endsWith(".graphql") || file.endsWith(".proto")) return "var(--arch-purple)";
  if (file === "Dockerfile" || file === "template.yaml") return "var(--arch-coral)";
  if (file.includes("test")) return "var(--arch-green)";
  return "var(--arch-text2)";
}

/** Find a node by ID across the tree, returning the node and its parent (if child) */
export function findNode(nodeId: string): { node: RepoNode; parentNode: RepoNode | undefined } | null {
  for (const top of repoTree) {
    if (top.id === nodeId) return { node: top, parentNode: undefined };
    const child = top.children?.find((c) => c.id === nodeId);
    if (child) return { node: child, parentNode: top };
  }
  return null;
}
