"use client";

import { useState, useEffect, useCallback } from "react";
import { useSavedAnalyses } from "@/lib/hooks/useSavedAnalyses";
import AnalysisList from "@/components/analyses/AnalysisList";
import type { SavedAnalysis } from "@/lib/types/saved-analysis";
import Breadcrumbs from "@/components/nav/Breadcrumbs";

export default function AnalysesPage() {
  const { fetchAnalyses, updateAnalysis, deleteAnalysis } = useSavedAnalyses();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchAnalyses();
      setAnalyses(data);
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [fetchAnalyses]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRename = async (id: string, title: string) => {
    await updateAnalysis(id, { title });
    setAnalyses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, title } : a))
    );
  };

  const handleDelete = async (id: string) => {
    await deleteAnalysis(id);
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="flex-1 bg-arch-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Breadcrumbs />
        <div className="flex items-center justify-between mb-6 mt-2">
          <h1 className="text-[18px] font-bold text-arch-text">
            Saved Analyses
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-arch-purple/30 border-t-arch-purple rounded-full animate-spin" />
          </div>
        ) : (
          <AnalysisList
            analyses={analyses}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
