"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { SavedAnalysis } from "@/lib/types/saved-analysis";
import type { ChatMessage } from "@/lib/types/chat";

export function useSavedAnalyses() {
  const fetchAnalyses = useCallback(async (): Promise<SavedAnalysis[]> => {
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data as SavedAnalysis[];
  }, []);

  const getAnalysis = useCallback(async (id: string): Promise<SavedAnalysis | null> => {
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as SavedAnalysis;
  }, []);

  const saveAnalysis = useCallback(
    async (payload: {
      title: string;
      ticket_text: string;
      messages: ChatMessage[];
      model_id: string;
    }): Promise<string> => {
      const { data, error } = await supabase
        .from("analyses")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    []
  );

  const updateAnalysis = useCallback(
    async (
      id: string,
      updates: Partial<Pick<SavedAnalysis, "title" | "messages">>
    ) => {
      const { error } = await supabase
        .from("analyses")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    []
  );

  const deleteAnalysis = useCallback(async (id: string) => {
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (error) throw error;
  }, []);

  return { fetchAnalyses, getAnalysis, saveAnalysis, updateAnalysis, deleteAnalysis };
}
