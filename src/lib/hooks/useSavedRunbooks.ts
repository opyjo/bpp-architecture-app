"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { SavedRunbook } from "@/lib/types/saved-runbook";

export function useSavedRunbooks() {
  const fetchRunbooks = useCallback(async (): Promise<SavedRunbook[]> => {
    const { data, error } = await supabase
      .from("runbooks")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data as SavedRunbook[];
  }, []);

  const getRunbook = useCallback(
    async (id: string): Promise<SavedRunbook | null> => {
      const { data, error } = await supabase
        .from("runbooks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as SavedRunbook;
    },
    []
  );

  const saveRunbook = useCallback(
    async (payload: {
      title: string;
      severity: string;
      content: object;
    }): Promise<string> => {
      const { data, error } = await supabase
        .from("runbooks")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    []
  );

  const updateRunbook = useCallback(
    async (
      id: string,
      updates: Partial<Pick<SavedRunbook, "title" | "severity" | "content">>
    ) => {
      const { error } = await supabase
        .from("runbooks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    []
  );

  const deleteRunbook = useCallback(async (id: string) => {
    const { error } = await supabase.from("runbooks").delete().eq("id", id);
    if (error) throw error;
  }, []);

  return { fetchRunbooks, getRunbook, saveRunbook, updateRunbook, deleteRunbook };
}
