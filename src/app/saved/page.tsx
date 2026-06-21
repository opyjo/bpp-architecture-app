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
import { timeAgo } from "@/lib/utils";
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
  },
  {
    id: "testplans",
    label: "Test Plans",
    icon: ClipboardCheck,
    color: "text-arch-green",
    bgColor: "bg-arch-green/10",
  },
  {
    id: "reviews",
    label: "Code Reviews",
    icon: Code2,
    color: "text-arch-purple",
    bgColor: "bg-arch-purple/10",
  },
  {
    id: "specs",
    label: "API Specs",
    icon: FileCode2,
    color: "text-arch-teal",
    bgColor: "bg-arch-teal/10",
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

  const displayItems = allItems
    .filter((item) => activeType === "all" || item.type === activeType)
    .filter(
      (item) =>
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(search.toLowerCase())
    );

  const activeConfig = TYPES.find((t) => t.id === activeType)!;

  return (
    <div className="flex-1 bg-arch-bg">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[16px] font-bold text-arch-text">
            All Saved Items
          </h1>
          {!loading && (
            <span className="text-[11px] text-arch-text3">
              {counts.all} total
            </span>
          )}
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
                    const content = (
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
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(item);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-arch-text3 hover:text-arch-coral hover:bg-arch-coral/10 rounded transition-all shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
