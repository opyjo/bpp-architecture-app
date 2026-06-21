"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSavedReviews } from "@/lib/hooks/useSavedReviews";
import { useSavedTestPlans } from "@/lib/hooks/useSavedTestPlans";
import { useSavedSpecs } from "@/lib/hooks/useSavedSpecs";
import { useSavedDiagrams } from "@/lib/hooks/useSavedDiagrams";
import { useSavedSequenceDiagrams } from "@/lib/hooks/useSavedSequenceDiagrams";
import { useSavedAnalyses } from "@/lib/hooks/useSavedAnalyses";
import { useSavedChats } from "@/lib/hooks/useSavedChats";
import { useSavedRunbooks } from "@/lib/hooks/useSavedRunbooks";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
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
} from "lucide-react";

type ContentType =
  | "all"
  | "reviews"
  | "testplans"
  | "specs"
  | "diagrams"
  | "sequence_diagrams"
  | "analyses"
  | "chats"
  | "runbooks";

interface TypeConfig {
  id: ContentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeColor: string;
  tabLink?: string;
  detailLink?: (id: string) => string;
}

const TYPES: TypeConfig[] = [
  {
    id: "all",
    label: "All",
    icon: LayoutGrid,
    color: "text-arch-text3",
    activeColor: "bg-arch-blue/15 text-arch-blue",
  },
  {
    id: "sequence_diagrams",
    label: "Sequence Diagrams",
    icon: GitBranch,
    color: "text-arch-green",
    activeColor: "bg-arch-green/15 text-arch-green",
    tabLink: "/?tab=sequence",
  },
  {
    id: "testplans",
    label: "Test Plans",
    icon: ClipboardCheck,
    color: "text-arch-green",
    activeColor: "bg-arch-green/15 text-arch-green",
    tabLink: "/?tab=testplan",
  },
  {
    id: "reviews",
    label: "Code Reviews",
    icon: Code2,
    color: "text-arch-purple",
    activeColor: "bg-arch-purple/15 text-arch-purple",
    tabLink: "/?tab=review",
  },
  {
    id: "specs",
    label: "API Specs",
    icon: FileCode2,
    color: "text-arch-teal",
    activeColor: "bg-arch-teal/15 text-arch-teal",
    tabLink: "/?tab=contract",
  },
  {
    id: "diagrams",
    label: "Diagrams",
    icon: GitBranch,
    color: "text-arch-teal",
    activeColor: "bg-arch-teal/15 text-arch-teal",
    tabLink: "/?tab=sequence",
  },
  {
    id: "analyses",
    label: "Analyses",
    icon: FileText,
    color: "text-arch-amber",
    activeColor: "bg-amber-500/15 text-amber-500",
    detailLink: (id) => `/analyses/${id}`,
  },
  {
    id: "chats",
    label: "Chats",
    icon: MessageSquare,
    color: "text-arch-blue",
    activeColor: "bg-arch-blue/15 text-arch-blue",
    detailLink: (id) => `/chats/${id}`,
  },
  {
    id: "runbooks",
    label: "Runbooks",
    icon: BookOpen,
    color: "text-arch-coral",
    activeColor: "bg-arch-coral/15 text-arch-coral",
    tabLink: "/?tab=runbooks",
  },
];

// All types except "all"
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
    diagrams: 0,
    sequence_diagrams: 0,
    analyses: 0,
    chats: 0,
    runbooks: 0,
  });
  const [search, setSearch] = useState("");

  const { fetchReviews, deleteReview } = useSavedReviews();
  const { fetchTestPlans, deleteTestPlan } = useSavedTestPlans();
  const { fetchSpecs, deleteSpec } = useSavedSpecs();
  const { fetchDiagrams, deleteDiagram } = useSavedDiagrams();
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
        fetchDiagrams(),
        fetchSequenceDiagrams(),
        fetchAnalyses(),
        fetchChats(),
        fetchRunbooks(),
      ]);

      const keys: ContentType[] = [
        "reviews",
        "testplans",
        "specs",
        "diagrams",
        "sequence_diagrams",
        "analyses",
        "chats",
        "runbooks",
      ];

      const newCounts: Record<string, number> = { all: 0 };
      const items: SavedItem[] = [];

      keys.forEach((key, i) => {
        const r = results[i];
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
            case "diagrams":
              subtitle = (row.description as string) || "";
              break;
            case "sequence_diagrams":
              subtitle = (row.participants as string[])?.length
                ? `${(row.participants as string[]).length} participants`
                : (row.description as string) || "";
              break;
            case "analyses":
              subtitle = `${(row.messages as unknown[])?.length || 0} messages`;
              break;
            case "chats":
              subtitle = `${(row.messages as unknown[])?.length || 0} messages · ${row.model_id}`;
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

      // Sort all items by updated_at descending
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
    diagrams: deleteDiagram,
    sequence_diagrams: deleteSequenceDiagram,
    analyses: deleteAnalysis,
    chats: deleteChat,
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
    if (!config) return undefined;
    if (config.detailLink) return config.detailLink(item.id);
    return config.tabLink;
  };

  const getItemTypeConfig = (type: ContentType) =>
    DATA_TYPES.find((t) => t.id === type);

  // Filter items by active tab + search
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        <div className="flex items-center justify-between mb-4 mt-2">
          <h1 className="text-[16px] font-bold text-arch-text">
            All Saved Items
          </h1>
          {!loading && (
            <span className="text-[11px] text-arch-text3">
              {counts.all} total
            </span>
          )}
        </div>

        {/* Filter tabs */}
        {!loading && counts.all > 0 && (
          <div className="flex items-center gap-1 mb-6 bg-arch-bg2 border border-arch-border rounded-lg p-1 overflow-x-auto">
            {TYPES.map((type) => {
              const isActive = activeType === type.id;
              const count = counts[type.id];
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setActiveType(type.id);
                    setSearch("");
                  }}
                  className={`px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? activeConfig.id === type.id
                        ? type.activeColor
                        : type.activeColor
                      : "text-arch-text3 hover:text-arch-text hover:bg-white/[0.04]"
                  }`}
                >
                  {type.label}
                  {count > 0 && (
                    <span
                      className={`text-[9.5px] px-1.5 py-0.5 rounded-full ${
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
          </div>
        )}

        {/* Search bar */}
        {!loading && displayItems.length > 3 && (
          <div className="mb-4 flex items-center gap-2 bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2 focus-within:border-arch-blue/40 transition-colors">
            <Search className="w-4 h-4 text-arch-text3 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeType === "all" ? "all items" : activeConfig.label.toLowerCase()}...`}
              className="flex-1 bg-transparent text-[12px] text-arch-text placeholder:text-arch-text3 focus:outline-none"
            />
          </div>
        )}

        {/* Items */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-arch-blue" />
          </div>
        ) : displayItems.length === 0 ? (
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
          <div className="grid gap-3">
            {displayItems.map((item) => {
              const link = getItemLink(item);
              const typeConfig = getItemTypeConfig(item.type);
              const TypeIcon = typeConfig?.icon;
              const content = (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Type badge on "All" tab */}
                    {activeType === "all" && TypeIcon && (
                      <div
                        className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${typeConfig?.color} bg-white/[0.04]`}
                      >
                        <TypeIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-arch-text truncate">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {activeType === "all" && typeConfig && (
                          <span
                            className={`text-[10px] font-medium ${typeConfig.color}`}
                          >
                            {typeConfig.label}
                          </span>
                        )}
                        {item.subtitle && (
                          <span className="text-[11px] text-arch-text3 truncate">
                            {activeType === "all" ? "·" : ""} {item.subtitle}
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-arch-text3 mt-1">
                        {timeAgo(item.updated_at)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-arch-text3 hover:text-arch-coral hover:bg-arch-coral/10 rounded transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );

              return link ? (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={link}
                  className="bg-arch-bg2 border border-arch-border rounded-xl p-4 hover:border-arch-blue/30 transition-colors group block"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={`${item.type}-${item.id}`}
                  className="bg-arch-bg2 border border-arch-border rounded-xl p-4 group"
                >
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
