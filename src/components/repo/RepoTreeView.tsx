"use client";

import { repoTree, repoDomains } from "@/data/repo-structure";

interface RepoTreeViewProps {
  expandedDirs: Set<string>;
  onToggleDir: (id: string) => void;
  selectedNode: string | null;
  selectedChild: string | null;
  onNodeClick: (id: string) => void;
  onChildClick: (id: string) => void;
  searchQuery: string;
}

export default function RepoTreeView({
  expandedDirs,
  onToggleDir,
  selectedNode,
  selectedChild,
  onNodeClick,
  onChildClick,
  searchQuery,
}: RepoTreeViewProps) {
  const query = searchQuery.trim().toLowerCase();

  // ── Search Mode ──────────────────────────────────────
  if (query) {
    const results: { dirId: string; dirName: string; dirColor: string; children: typeof repoTree[0]["children"] }[] = [];
    let totalMatches = 0;

    for (const dir of repoTree) {
      const matched = dir.children?.filter((c) => c.name.toLowerCase().includes(query)) ?? [];
      if (matched.length > 0) {
        results.push({ dirId: dir.id, dirName: dir.name, dirColor: dir.color, children: matched });
        totalMatches += matched.length;
      }
    }

    return (
      <div className="px-2 pb-3">
        <div className="text-[9.5px] text-arch-text3 font-medium px-1 mb-2 mt-1">
          {totalMatches > 0 ? `${totalMatches} match${totalMatches !== 1 ? "es" : ""}` : "No results"}
        </div>
        {results.map((group) => (
          <div key={group.dirId} className="mb-2">
            <div className="flex items-center gap-1.5 px-1 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: group.dirColor }} />
              <span className="text-[9.5px] font-semibold text-arch-text3">{group.dirName}</span>
            </div>
            {group.children?.map((child) => (
              <button
                key={child.id}
                onClick={() => {
                  onNodeClick(group.dirId);
                  onChildClick(child.id);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-left transition-colors mb-0.5 ml-2 ${
                  selectedChild === child.id
                    ? "bg-arch-blue/10 border-l-2"
                    : "hover:bg-white/[0.03] border-l-2 border-transparent"
                }`}
                style={selectedChild === child.id ? { borderColor: child.color } : undefined}
              >
                <span className="font-mono text-[10px] text-arch-text2 truncate">{child.name}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ── Tree Mode ────────────────────────────────────────
  return (
    <div className="px-2 pb-3">
      <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold px-1 mb-2 mt-1">
        Directories
      </div>
      {repoTree.map((dir) => {
        const isExpanded = expandedDirs.has(dir.id);
        const childCount = dir.children?.length ?? 0;
        return (
          <div key={dir.id}>
            {/* Directory row */}
            <button
              onClick={() => onToggleDir(dir.id)}
              className={`w-full flex items-center gap-1.5 px-1.5 py-1.5 rounded-md text-left transition-colors mb-0.5 ${
                selectedNode === dir.id && !selectedChild
                  ? "bg-arch-blue/10 border-l-2"
                  : "hover:bg-white/[0.03] border-l-2 border-transparent"
              }`}
              style={selectedNode === dir.id && !selectedChild ? { borderColor: dir.color } : undefined}
            >
              {/* Chevron */}
              <svg
                className={`w-3 h-3 shrink-0 text-arch-text3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dir.color }} />
              <span className="font-mono text-[11px] text-arch-text2">{dir.name}</span>
              <span className="ml-auto text-[9.5px] text-arch-text3">{childCount}</span>
            </button>

            {/* Expanded children */}
            {isExpanded && dir.children && (
              <div className="ml-3 border-l border-arch-border pl-1 mb-1">
                {dir.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      onNodeClick(dir.id);
                      onChildClick(child.id);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-left transition-colors mb-0.5 ${
                      selectedChild === child.id
                        ? "bg-arch-blue/10 border-l-2"
                        : "hover:bg-white/[0.03] border-l-2 border-transparent"
                    }`}
                    style={selectedChild === child.id ? { borderColor: child.color } : undefined}
                  >
                    <span className="font-mono text-[10px] text-arch-text2 truncate">{child.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Business Domains */}
      <div className="text-[9.5px] uppercase tracking-wider text-arch-text3 font-semibold px-1 mb-2 mt-4">
        Business Domains
      </div>
      {repoDomains.map((domain) => (
        <div key={domain.id} className="px-2 py-1 mb-0.5">
          <span
            className="inline-block text-[9.5px] font-medium px-1.5 py-px rounded-full border"
            style={{
              background: `${domain.color}12`,
              borderColor: `${domain.color}28`,
              color: domain.color,
            }}
          >
            {domain.name}
          </span>
          <span className="text-[9.5px] text-arch-text3 ml-1.5">
            {domain.services.length} services
          </span>
        </div>
      ))}
    </div>
  );
}
