"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { SavedDiagram } from "@/lib/types/saved-diagram";

export function useSavedDiagrams() {
  const fetchDiagrams = useCallback(async (): Promise<SavedDiagram[]> => {
    const { data, error } = await supabase
      .from("diagrams")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data as SavedDiagram[];
  }, []);

  const getDiagram = useCallback(
    async (id: string): Promise<SavedDiagram | null> => {
      const { data, error } = await supabase
        .from("diagrams")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as SavedDiagram;
    },
    []
  );

  const saveDiagram = useCallback(
    async (payload: {
      title: string;
      description: string;
      mermaid_source: string;
      flow_id?: string;
    }): Promise<string> => {
      const { data, error } = await supabase
        .from("diagrams")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    []
  );

  const updateDiagram = useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<SavedDiagram, "title" | "description" | "mermaid_source" | "flow_id">
      >
    ) => {
      const { error } = await supabase
        .from("diagrams")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    []
  );

  const deleteDiagram = useCallback(async (id: string) => {
    const { error } = await supabase.from("diagrams").delete().eq("id", id);
    if (error) throw error;
  }, []);

  return { fetchDiagrams, getDiagram, saveDiagram, updateDiagram, deleteDiagram };
}
