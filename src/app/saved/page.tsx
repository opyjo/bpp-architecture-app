"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSavedReviews } from "@/lib/hooks/useSavedReviews";
import { useSavedTestPlans } from "@/lib/hooks/useSavedTestPlans";
import { useSavedSpecs } from "@/lib/hooks/useSavedSpecs";
import { useSavedSequenceDiagrams } from "@/lib/hooks/useSavedSequenceDiagrams";
import { useSavedAnalyses } from "@/lib/hooks/useSavedAnalyses";
import { useSavedChats } from "@/lib/hooks/useSavedChats";
import { useSavedRunbooks } from "@/lib/hooks/useSavedRunbooks";
import { cn, timeAgo, downloadAsMarkdown } from "@/lib/utils";
import { toast } from "sonner";
import {
  Code2,
  ClipboardCheck,
  FileCode2,
  GitBranch,
  FileText,
  MessageSquare,
  BookOpen,
  Loader2,
  Trash2,
  Search,
  LayoutGrid,
  GraduationCap,
  Bot,
  Download,
  Tag as TagIcon,
  Plus,
  X,
  Check,
} from "lucide-react";

const BSA_PREFIX = "[BSA Coach]";

type ContentType =
  | "all"
  | "reviews"
  | "testplans"
  | "specs"
  | "sequence_diagrams"
  | "analyses"
  | "ai_chats"
  | "coach_chats"
  | "runbooks";

interface TypeConfig {
  id: ContentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  detailLink?: (id: string) => string;
}

const TYPES: TypeConfig[] = [
  {
    id: "all",
    label: "All Items",
    icon: LayoutGrid,
    color: "text-arch-blue",
    bgColor: "bg-arch-blue/10",
  },
  {
    id: "sequence_diagrams",
    label: "Sequence Diagrams",
    icon: GitBranch,
    color: "text-arch-green",
    bgColor: "bg-arch-green/10",
    detailLink: (id) => `/sequence-diagrams/${id}`,
  },
  {
    id: "testplans",
    label: "Test Plans",
    icon: ClipboardCheck,
    color: "text-arch-green",
    bgColor: "bg-arch-green/10",
    detailLink: (id) => `/test-plans/${id}`,
  },
  {
    id: "reviews",
    label: "Code Reviews",
    icon: Code2,
    color: "text-arch-purple",
    bgColor: "bg-arch-purple/10",
    detailLink: (id) => `/reviews/${id}`,
  },
  {
    id: "specs",
    label: "API Specs",
    icon: FileCode2,
    color: "text-arch-teal",
    bgColor: "bg-arch-teal/10",
    detailLink: (id) => `/specs/${id}`,
  },
  {
    id: "analyses",
    label: "Analyses",
    icon: FileText,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    detailLink: (id) => `/analyses/${id}`,
  },
  {
    id: "ai_chats",
    label: "AI Assistant",
    icon: Bot,
    color: "text-arch-purple",
    bgColor: "bg-arch-purple/10",
    detailLink: (id) => `/chats/${id}`,
  },
  {
    id: "coach_chats",
    label: "Interview Coach",
    icon: GraduationCap,
    color: "text-arch-teal",
    bgColor: "bg-arch-teal/10",
    detailLink: (id) => `/chats/${id}`,
  },
  {
    id: "runbooks",
    label: "Runbooks",
    icon: BookOpen,
    color: "text-arch-coral",
    bgColor: "bg-arch-coral/10",
    detailLink: (id) => `/runbooks/${id}`,
  },
];

const DATA_TYPES = TYPES.filter((t) => t.id !== "all");

interface SavedItem {
  id: string;
  title: string;
  updated_at: string;
  subtitle?: string;
  type: ContentType;
}

const TAGS_STORAGE_KEY = "saved-tags";

type TagMap = Record<string, string[]>;

const tagKey = (type: ContentType, id: string) => `${type}:${id}`;

function loadTagMap(): TagMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TAGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as TagMap;
  } catch {
    return {};
  }
}

function persistTagMap(map: TagMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / serialization errors
  }
}

export default function SavedHubPage() {
  const [activeType, setActiveType] = useState<ContentType>("all");
  const [allItems, setAllItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<ContentType, number>>({
    all: 0,
    reviews: 0,
    testplans: 0,
    specs: 0,
    sequence_diagrams: 0,
    analyses: 0,
    ai_chats: 0,
    coach_chats: 0,
    runbooks: 0,
  });
  const [search, setSearch] = useState("");
  // Lazy initializer is SSR-safe: loadTagMap guards on `typeof window`,
  // returning {} on the server and reading localStorage on the client.
  const [tagMap, setTagMap] = useState<TagMap>(() => loadTagMap());
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tagEditingFor, setTagEditingFor] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState("");

  const { fetchReviews, deleteReview } = useSavedReviews();
  const { fetchTestPlans, deleteTestPlan } = useSavedTestPlans();
  const { fetchSpecs, deleteSpec } = useSavedSpecs();
  const { fetchSequenceDiagrams, deleteSequenceDiagram } =
    useSavedSequenceDiagrams();
  const { fetchAnalyses, deleteAnalysis } = useSavedAnalyses();
  const { fetchChats, deleteChat } = useSavedChats();
  const { fetchRunbooks, deleteRunbook } = useSavedRunbooks();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchReviews(),
        fetchTestPlans(),
        fetchSpecs(),
        fetchSequenceDiagrams(),
        fetchAnalyses(),
        fetchChats(),
        fetchRunbooks(),
      ]);

      const newCounts: Record<string, number> = {
        all: 0,
        reviews: 0,
        testplans: 0,
        specs: 0,
        sequence_diagrams: 0,
        analyses: 0,
        ai_chats: 0,
        coach_chats: 0,
        runbooks: 0,
      };
      const items: SavedItem[] = [];

      // Non-chat types mapped in order
      const simpleKeys: { key: Exclude<ContentType, "all" | "ai_chats" | "coach_chats">; index: number }[] = [
        { key: "reviews", index: 0 },
        { key: "testplans", index: 1 },
        { key: "specs", index: 2 },
        { key: "sequence_diagrams", index: 3 },
        { key: "analyses", index: 4 },
        // chats at index 5 — handled separately
        { key: "runbooks", index: 6 },
      ];

      simpleKeys.forEach(({ key, index }) => {
        const r = results[index];
        if (r.status !== "fulfilled") {
          newCounts[key] = 0;
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = r.value as any[];
        newCounts[key] = data.length;
        newCounts.all += data.length;

        data.forEach((row) => {
          let subtitle = "";
          switch (key) {
            case "reviews":
              subtitle = (row.language as string) || "";
              break;
            case "testplans":
              subtitle =
                (row.test_types as string[])?.join(", ") || "all types";
              break;
            case "specs":
              subtitle = (row.service_name as string) || "";
              break;
            case "sequence_diagrams":
              subtitle = (row.participants as string[])?.length
                ? `${(row.participants as string[]).length} participants`
                : (row.description as string) || "";
              break;
            case "analyses":
              subtitle = `${(row.messages as unknown[])?.length || 0} messages`;
              break;
            case "runbooks":
              subtitle = (row.severity as string) || "";
              break;
          }
          items.push({
            id: row.id,
            title: row.title,
            updated_at: row.updated_at,
            subtitle,
            type: key,
          });
        });
      });

      // Split chats into AI Assistant vs Interview Coach
      const chatsResult = results[5];
      if (chatsResult.status === "fulfilled") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chats = chatsResult.value as any[];
        chats.forEach((row) => {
          const isCoach = (row.title as string)?.startsWith(BSA_PREFIX);
          const type: ContentType = isCoach ? "coach_chats" : "ai_chats";
          newCounts[type] += 1;
          newCounts.all += 1;
          items.push({
            id: row.id,
            title: row.title,
            updated_at: row.updated_at,
            subtitle: `${(row.messages as unknown[])?.length || 0} messages · ${row.model_id}`,
            type,
          });
        });
      }

      items.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setCounts(newCounts as Record<ContentType, number>);
      setAllItems(items);
    } catch {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const deleteFns: Record<
    Exclude<ContentType, "all">,
    (id: string) => Promise<void>
  > = {
    reviews: deleteReview,
    testplans: deleteTestPlan,
    specs: deleteSpec,
    sequence_diagrams: deleteSequenceDiagram,
    analyses: deleteAnalysis,
    ai_chats: deleteChat,
    coach_chats: deleteChat,
    runbooks: deleteRunbook,
  };

  const handleDelete = async (item: SavedItem) => {
    try {
      await deleteFns[item.type as Exclude<ContentType, "all">](item.id);
      setAllItems((prev) => prev.filter((i) => i.id !== item.id));
      setCounts((prev) => ({
        ...prev,
        [item.type]: prev[item.type] - 1,
        all: prev.all - 1,
      }));
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const getItemLink = (item: SavedItem): string | undefined => {
    const config = DATA_TYPES.find((t) => t.id === item.type);
    if (!config?.detailLink) return undefined;
    return config.detailLink(item.id);
  };

  const getItemTypeConfig = (type: ContentType) =>
    DATA_TYPES.find((t) => t.id === type);

  // --- Tags -----------------------------------------------------------------
  const getTags = (item: SavedItem): string[] =>
    tagMap[tagKey(item.type, item.id)] ?? [];

  const updateTags = (item: SavedItem, next: string[]) => {
    setTagMap((prev) => {
      const key = tagKey(item.type, item.id);
      const updated: TagMap = { ...prev };
      if (next.length === 0) {
        delete updated[key];
      } else {
        updated[key] = next;
      }
      persistTagMap(updated);
      return updated;
    });
  };

  const addTag = (item: SavedItem, raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    const current = getTags(item);
    if (current.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    updateTags(item, [...current, tag]);
  };

  const removeTag = (item: SavedItem, tag: string) => {
    const next = getTags(item).filter((t) => t !== tag);
    updateTags(item, next);
    if (activeTag === tag && !Object.values(tagMap).some((arr) => arr.includes(tag))) {
      setActiveTag(null);
    }
  };

  const commitTagDraft = (item: SavedItem) => {
    addTag(item, tagDraft);
    setTagDraft("");
    setTagEditingFor(null);
  };

  // All distinct tags currently in use, for the tag-filter row.
  const allTags = Array.from(
    new Set(Object.values(tagMap).flat())
  ).sort((a, b) => a.localeCompare(b));

  // --- Export ---------------------------------------------------------------
  const handleExportAll = () => {
    if (displayItems.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const payload = displayItems.map((item) => ({
      id: item.id,
      type: item.type,
      typeLabel: getItemTypeConfig(item.type)?.label ?? item.type,
      title: item.title,
      subtitle: item.subtitle ?? "",
      updated_at: item.updated_at,
      tags: getTags(item),
    }));
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `saved-items-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${payload.length} item${payload.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Failed to export");
    }
  };

  const handleExportItem = (item: SavedItem) => {
    const config = getItemTypeConfig(item.type);
    const tags = getTags(item);
    const lines = [
      `# ${item.title}`,
      "",
      `- **Type:** ${config?.label ?? item.type}`,
      `- **Saved:** ${new Date(item.updated_at).toLocaleString()}`,
      `- **Tags:** ${tags.length ? tags.join(", ") : "—"}`,
    ];
    if (item.subtitle) lines.push(`- **Details:** ${item.subtitle}`);
    const slug =
      item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "item";
    downloadAsMarkdown(lines.join("\n") + "\n", `${slug}.md`);
    toast.success("Exported .md");
  };

  const displayItems = allItems
    .filter((item) => activeType === "all" || item.type === activeType)
    .filter(
      (item) =>
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
        (getItemTypeConfig(item.type)?.label
          .toLowerCase()
          .includes(search.toLowerCase()) ??
          false)
    )
    .filter((item) => !activeTag || getTags(item).includes(activeTag));

  const activeConfig = TYPES.find((t) => t.id === activeType)!;

  return (
    <div className="flex-1 bg-arch-bg">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[16px] font-bold text-arch-text">
            All Saved Items
          </h1>
          <div className="flex items-center gap-3">
            {!loading && (
              <span className="text-[11px] text-arch-text3">
                {counts.all} total
              </span>
            )}
            {!loading && (
              <button
                onClick={handleExportAll}
                className="flex items-center gap-1.5 text-[11px] font-medium text-arch-text2 hover:text-arch-blue bg-arch-bg2 hover:bg-arch-blue/10 border border-arch-border hover:border-arch-blue/30 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export all (JSON)
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-arch-blue" />
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="w-52 shrink-0 sticky top-4 self-start">
              <nav className="flex flex-col gap-0.5">
                {TYPES.map((type) => {
                  const isActive = activeType === type.id;
                  const count = counts[type.id];
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setActiveType(type.id);
                        setSearch("");
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12px] font-medium transition-all cursor-pointer ${
                        isActive
                          ? `${type.bgColor} ${type.color}`
                          : "text-arch-text2 hover:text-arch-text hover:bg-white/[0.03]"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? type.color : "text-arch-text3"}`} />
                      <span className="flex-1 truncate">{type.label}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? "bg-white/20"
                              : "bg-arch-bg3 text-arch-text3"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 min-w-0">
              {/* Search bar */}
              <div className="mb-4 flex items-center gap-2 bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2 focus-within:border-arch-blue/40 transition-colors">
                <Search className="w-4 h-4 text-arch-text3 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeType === "all" ? "all items" : activeConfig.label.toLowerCase()}...`}
                  className="flex-1 bg-transparent text-[12px] text-arch-text placeholder:text-arch-text3 focus:outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-[10px] text-arch-text3 hover:text-arch-text px-1.5 py-0.5 rounded hover:bg-white/[0.06] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Tag filter row */}
              {allTags.length > 0 && (
                <div className="mb-4 flex items-center gap-1.5 flex-wrap">
                  <TagIcon className="w-3.5 h-3.5 text-arch-text3 shrink-0" />
                  {allTags.map((tag) => {
                    const isActive = activeTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() =>
                          setActiveTag((prev) => (prev === tag ? null : tag))
                        }
                        className={cn(
                          "text-[10.5px] font-medium px-2 py-0.5 rounded-full border transition-colors cursor-pointer",
                          isActive
                            ? "bg-arch-purple/15 text-arch-purple border-arch-purple/40"
                            : "bg-arch-bg2 text-arch-text2 border-arch-border hover:text-arch-text hover:border-arch-purple/30"
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                  {activeTag && (
                    <button
                      onClick={() => setActiveTag(null)}
                      className="text-[10px] text-arch-text3 hover:text-arch-text px-1.5 py-0.5 rounded hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      Clear tag
                    </button>
                  )}
                </div>
              )}

              {displayItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-arch-text3">
                  {React.createElement(activeConfig.icon, {
                    className: "w-10 h-10 mb-3 opacity-30",
                  })}
                  <p className="text-[13px] font-medium">
                    {search
                      ? "No matching items"
                      : `No saved ${activeType === "all" ? "items" : activeConfig.label.toLowerCase()} yet`}
                  </p>
                </div>
              ) : (
                <div className="grid gap-2.5">
                  {displayItems.map((item) => {
                    const link = getItemLink(item);
                    const typeConfig = getItemTypeConfig(item.type);
                    const TypeIcon = typeConfig?.icon;
                    const itemTags = getTags(item);
                    const isEditingTag =
                      tagEditingFor === tagKey(item.type, item.id);
                    // Buttons inside a card that is a <Link> must not trigger navigation.
                    const stop = (e: React.SyntheticEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                    };
                    const content = (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          {/* Type icon */}
                          {TypeIcon && (
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeConfig?.bgColor} ${typeConfig?.color}`}
                            >
                              <TypeIcon className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-arch-text truncate">
                              {item.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {typeConfig && (
                                <span
                                  className={`text-[10px] font-medium ${typeConfig.color}`}
                                >
                                  {typeConfig.label}
                                </span>
                              )}
                              {item.subtitle && (
                                <span className="text-[11px] text-arch-text3 truncate">
                                  · {item.subtitle}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10.5px] text-arch-text3 whitespace-nowrap shrink-0">
                            {timeAgo(item.updated_at)}
                          </span>
                          <button
                            onClick={(e) => {
                              stop(e);
                              handleExportItem(item);
                            }}
                            title="Export as Markdown"
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-arch-text3 hover:text-arch-blue hover:bg-arch-blue/10 rounded transition-all shrink-0 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              stop(e);
                              handleDelete(item);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-arch-text3 hover:text-arch-coral hover:bg-arch-coral/10 rounded transition-all shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Tags row */}
                        <div className="flex items-center gap-1.5 flex-wrap pl-11">
                          {itemTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-arch-purple bg-arch-purple/10 border border-arch-purple/20 rounded-full pl-2 pr-1 py-0.5"
                            >
                              {tag}
                              <button
                                onClick={(e) => {
                                  stop(e);
                                  removeTag(item, tag);
                                }}
                                className="text-arch-purple/70 hover:text-arch-coral rounded-full p-0.5 cursor-pointer"
                                aria-label={`Remove tag ${tag}`}
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}

                          {isEditingTag ? (
                            <span
                              className="inline-flex items-center gap-1 bg-arch-bg3 border border-arch-purple/40 rounded-full pl-2 pr-1 py-0.5"
                              onClick={stop}
                            >
                              <input
                                autoFocus
                                value={tagDraft}
                                onClick={stop}
                                onChange={(e) => setTagDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    stop(e);
                                    commitTagDraft(item);
                                  } else if (e.key === "Escape") {
                                    stop(e);
                                    setTagDraft("");
                                    setTagEditingFor(null);
                                  }
                                }}
                                placeholder="tag"
                                className="w-16 bg-transparent text-[10px] text-arch-text placeholder:text-arch-text3 focus:outline-none"
                              />
                              <button
                                onClick={(e) => {
                                  stop(e);
                                  commitTagDraft(item);
                                }}
                                className="text-arch-green hover:text-arch-green rounded-full p-0.5 cursor-pointer"
                                aria-label="Add tag"
                              >
                                <Check className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                stop(e);
                                setTagDraft("");
                                setTagEditingFor(tagKey(item.type, item.id));
                              }}
                              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-arch-text3 hover:text-arch-purple border border-dashed border-arch-border hover:border-arch-purple/40 rounded-full px-1.5 py-0.5 transition-colors cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              tag
                            </button>
                          )}
                        </div>
                      </div>
                    );

                    return link ? (
                      <Link
                        key={`${item.type}-${item.id}`}
                        href={link}
                        className="bg-arch-bg2 border border-arch-border rounded-xl px-4 py-3 hover:border-arch-blue/30 transition-colors group block"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="bg-arch-bg2 border border-arch-border rounded-xl px-4 py-3 group"
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
