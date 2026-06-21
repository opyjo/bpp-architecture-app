"use client";

import { useState, useMemo } from "react";
import { Loader2, BookOpen, Trash2, Clock, Search } from "lucide-react";

interface SavedItemsPanelProps<T extends { id: string; updated_at: string }> {
  items: T[];
  isLoading: boolean;
  activeId?: string | null;
  onSelect: (item: T) => void;
  onDelete: (id: string) => void;
  emptyMessage?: string;
  headerTitle: string;
  renderTitle: (item: T) => string;
  renderSubtitle?: (item: T) => string;
  searchable?: boolean;
  searchFn?: (item: T, query: string) => boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function SavedItemsPanel<T extends { id: string; updated_at: string }>({
  items,
  isLoading,
  activeId,
  onSelect,
  onDelete,
  emptyMessage = "No saved items yet",
  headerTitle,
  renderTitle,
  renderSubtitle,
  searchable = false,
  searchFn,
  hasMore,
  onLoadMore,
}: SavedItemsPanelProps<T>) {
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return items;
    const q = search.toLowerCase();
    if (searchFn) return items.filter((item) => searchFn(item, q));
    return items.filter((item) => renderTitle(item).toLowerCase().includes(q));
  }, [items, search, searchable, searchFn, renderTitle]);

  return (
    <div className="w-[400px] shrink-0 flex flex-col border-r border-arch-border bg-arch-bg/50">
      <div className="px-4 pt-4 pb-3 border-b border-arch-border">
        <h3 className="text-[13px] font-semibold text-arch-text flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-arch-blue" />
          {headerTitle}
        </h3>
        <p className="text-[11px] text-arch-text3 mt-1">
          {items.length} saved item{items.length !== 1 ? "s" : ""}
        </p>
        {searchable && items.length > 3 && (
          <div className="mt-2 flex items-center gap-2 bg-arch-bg2 border border-arch-border rounded-lg px-2.5 py-1.5 focus-within:border-arch-blue/40 transition-colors">
            <Search className="w-3.5 h-3.5 text-arch-text3 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent text-[11px] text-arch-text placeholder:text-arch-text3 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-arch-text3 hover:text-arch-text2 transition-colors text-[10px]"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-arch-blue" />
            <span className="text-[13px] text-arch-text3">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <BookOpen className="w-8 h-8 text-arch-text3" />
            <span className="text-[13px] text-arch-text3">
              {search ? "No matching items" : emptyMessage}
            </span>
          </div>
        ) : (
          <>
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`rounded-lg border transition-colors cursor-pointer group ${
                  activeId === item.id
                    ? "border-arch-blue/40 bg-arch-blue/5"
                    : "border-arch-border bg-arch-bg2/60 hover:bg-arch-bg2"
                }`}
              >
                <div className="w-full text-left px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-arch-text truncate">
                        {renderTitle(item)}
                      </div>
                      {renderSubtitle && (
                        <div className="text-[11px] text-arch-teal font-mono mt-0.5 truncate">
                          {renderSubtitle(item)}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-arch-text3">
                        <Clock className="w-3 h-3" />
                        {new Date(item.updated_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            onDelete(item.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-[10px] text-arch-coral bg-arch-coral/10 px-2 py-0.5 rounded hover:bg-arch-coral/20 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] text-arch-text3 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-arch-text3 hover:text-arch-coral transition-all p-1 rounded hover:bg-arch-coral/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {hasMore && onLoadMore && (
              <button
                onClick={onLoadMore}
                className="w-full py-2 text-[11px] text-arch-blue hover:text-arch-blue/80 transition-colors"
              >
                Load more...
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
