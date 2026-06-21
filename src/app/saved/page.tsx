"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSavedReviews } from "@/lib/hooks/useSavedReviews";
import { useSavedTestPlans } from "@/lib/hooks/useSavedTestPlans";
import { useSavedSpecs } from "@/lib/hooks/useSavedSpecs";
import { useSavedDiagrams } from "@/lib/hooks/useSavedDiagrams";
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
} from "lucide-react";

type ContentType =
  | "reviews"
  | "testplans"
  | "specs"
  | "diagrams"
  | "analyses"
  | "chats"
  | "runbooks";

interface TypeConfig {
  id: ContentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  tabLink?: string; // link to relevant tab
  detailLink?: (id: string) => string; // link to detail page
}

const TYPES: TypeConfig[] = [
  {
    id: "reviews",
    label: "Code Reviews",
    icon: Code2,
    color: "text-arch-purple",
    tabLink: "/?tab=review",
  },
  {
    id: "testplans",
    label: "Test Plans",
    icon: ClipboardCheck,
    color: "text-arch-green",
    tabLink: "/?tab=testplan",
  },
  {
    id: "specs",
    label: "API Specs",
    icon: FileCode2,
    color: "text-arch-teal",
    tabLink: "/?tab=contract",
  },
  {
    id: "diagrams",
    label: "Diagrams",
    icon: GitBranch,
    color: "text-arch-teal",
    tabLink: "/?tab=sequence",
  },
  {
    id: "analyses",
    label: "Analyses",
    icon: FileText,
    color: "text-arch-amber",
    detailLink: (id) => `/analyses/${id}`,
  },
  {
    id: "chats",
    label: "Chats",
    icon: MessageSquare,
    color: "text-arch-blue",
    detailLink: (id) => `/chats/${id}`,
  },
  {
    id: "runbooks",
    label: "Runbooks",
    icon: BookOpen,
    color: "text-arch-coral",
    tabLink: "/?tab=runbooks",
  },
];

interface SavedItem {
  id: string;
  title: string;
  updated_at: string;
  subtitle?: string;
}

export default function SavedHubPage() {
  const [activeType, setActiveType] = useState<ContentType>("reviews");
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<ContentType, number>>({
    reviews: 0,
    testplans: 0,
    specs: 0,
    diagrams: 0,
    analyses: 0,
    chats: 0,
    runbooks: 0,
  });
  const [search, setSearch] = useState("");

  const { fetchReviews, deleteReview } = useSavedReviews();
  const { fetchTestPlans, deleteTestPlan } = useSavedTestPlans();
  const { fetchSpecs, deleteSpec } = useSavedSpecs();
  const { fetchDiagrams, deleteDiagram } = useSavedDiagrams();
  const { fetchAnalyses, deleteAnalysis } = useSavedAnalyses();
  const { fetchChats, deleteChat } = useSavedChats();
  const { fetchRunbooks, deleteRunbook } = useSavedRunbooks();

  // Load all counts on mount
  useEffect(() => {
    async function loadCounts() {
      const results = await Promise.allSettled([
        fetchReviews(),
        fetchTestPlans(),
        fetchSpecs(),
        fetchDiagrams(),
        fetchAnalyses(),
        fetchChats(),
        fetchRunbooks(),
      ]);

      const keys: ContentType[] = [
        "reviews", "testplans", "specs", "diagrams", "analyses", "chats", "runbooks",
      ];

      const newCounts: Record<string, number> = {};
      keys.forEach((key, i) => {
        const r = results[i];
        newCounts[key] = r.status === "fulfilled" ? r.value.length : 0;
      });
      setCounts(newCounts as Record<ContentType, number>);
    }
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadItems = useCallback(
    async (type: ContentType) => {
      setLoading(true);
      try {
        let fetched: SavedItem[] = [];
        switch (type) {
          case "reviews": {
            const data = await fetchReviews();
            fetched = data.map((r) => ({
              id: r.id,
              title: r.title,
              updated_at: r.updated_at,
              subtitle: r.language,
            }));
            break;
          }
          case "testplans": {
            const data = await fetchTestPlans();
            fetched = data.map((p) => ({
              id: p.id,
              title: p.title,
              updated_at: p.updated_at,
              subtitle: p.test_types?.join(", ") || "all types",
            }));
            break;
          }
          case "specs": {
            const data = await fetchSpecs();
            fetched = data.map((s) => ({
              id: s.id,
              title: s.title,
              updated_at: s.updated_at,
              subtitle: s.service_name,
            }));
            break;
          }
          case "diagrams": {
            const data = await fetchDiagrams();
            fetched = data.map((d) => ({
              id: d.id,
              title: d.title,
              updated_at: d.updated_at,
              subtitle: d.description,
            }));
            break;
          }
          case "analyses": {
            const data = await fetchAnalyses();
            fetched = data.map((a) => ({
              id: a.id,
              title: a.title,
              updated_at: a.updated_at,
              subtitle: `${a.messages.length} messages`,
            }));
            break;
          }
          case "chats": {
            const data = await fetchChats();
            fetched = data.map((c) => ({
              id: c.id,
              title: c.title,
              updated_at: c.updated_at,
              subtitle: `${c.messages.length} messages · ${c.model_id}`,
            }));
            break;
          }
          case "runbooks": {
            const data = await fetchRunbooks();
            fetched = data.map((r) => ({
              id: r.id,
              title: r.title,
              updated_at: r.updated_at,
              subtitle: r.severity,
            }));
            break;
          }
        }
        setItems(fetched);
      } catch {
        toast.error("Failed to load items");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchReviews, fetchTestPlans, fetchSpecs, fetchDiagrams, fetchAnalyses, fetchChats, fetchRunbooks]
  );

  useEffect(() => {
    loadItems(activeType);
  }, [activeType, loadItems]);

  const handleDelete = async (id: string) => {
    try {
      const deleteFns: Record<ContentType, (id: string) => Promise<void>> = {
        reviews: deleteReview,
        testplans: deleteTestPlan,
        specs: deleteSpec,
        diagrams: deleteDiagram,
        analyses: deleteAnalysis,
        chats: deleteChat,
        runbooks: deleteRunbook,
      };
      await deleteFns[activeType](id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setCounts((prev) => ({ ...prev, [activeType]: prev[activeType] - 1 }));
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const config = TYPES.find((t) => t.id === activeType)!;

  const filtered = search
    ? items.filter(
        (item) =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const getItemLink = (item: SavedItem): string | undefined => {
    if (config.detailLink) return config.detailLink(item.id);
    return config.tabLink;
  };

  return (
    <div className="flex-1 bg-arch-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs />
        <h1 className="text-[16px] font-bold text-arch-text mt-2 mb-6">
          All Saved Items
        </h1>

        <div className="flex gap-6">
          {/* Type sidebar */}
          <div className="w-[200px] shrink-0 space-y-1">
            {TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = activeType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveType(type.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-colors ${
                    isActive
                      ? "bg-arch-blue/10 text-arch-blue"
                      : "text-arch-text2 hover:text-arch-text hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-arch-blue" : type.color}`} />
                  <span className="flex-1 text-left">{type.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-arch-blue/20 text-arch-blue"
                        : "bg-arch-bg3 text-arch-text3"
                    }`}
                  >
                    {counts[type.id]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Items list */}
          <div className="flex-1 min-w-0">
            {/* Search bar */}
            {items.length > 3 && (
              <div className="mb-4 flex items-center gap-2 bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2 focus-within:border-arch-blue/40 transition-colors">
                <Search className="w-4 h-4 text-arch-text3 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${config.label.toLowerCase()}...`}
                  className="flex-1 bg-transparent text-[12px] text-arch-text placeholder:text-arch-text3 focus:outline-none"
                />
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-arch-blue" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-arch-text3">
                {React.createElement(config.icon, {
                  className: "w-10 h-10 mb-3 opacity-30",
                })}
                <p className="text-[13px] font-medium">
                  {search ? "No matching items" : `No saved ${config.label.toLowerCase()} yet`}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filtered.map((item) => {
                  const link = getItemLink(item);
                  const content = (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-arch-text truncate">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-arch-text3 mt-0.5 truncate">
                            {item.subtitle}
                          </div>
                        )}
                        <div className="text-[10.5px] text-arch-text3 mt-1">
                          {timeAgo(item.updated_at)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-arch-text3 hover:text-arch-coral hover:bg-arch-coral/10 rounded transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );

                  return link ? (
                    <Link
                      key={item.id}
                      href={link}
                      className="bg-arch-bg2 border border-arch-border rounded-xl p-4 hover:border-arch-blue/30 transition-colors group block"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      key={item.id}
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
      </div>
    </div>
  );
}
