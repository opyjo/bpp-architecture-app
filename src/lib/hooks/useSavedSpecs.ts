"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { SavedSpec } from "@/lib/types/saved-spec";

export function useSavedSpecs() {
  const fetchSpecs = useCallback(async (): Promise<SavedSpec[]> => {
    const { data, error } = await supabase
      .from("specs")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data as SavedSpec[];
  }, []);

  const getSpec = useCallback(async (id: string): Promise<SavedSpec | null> => {
    const { data, error } = await supabase
      .from("specs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as SavedSpec;
  }, []);

  const saveSpec = useCallback(
    async (payload: {
      title: string;
      service_name: string;
      yaml_content: string;
    }): Promise<string> => {
      const { data, error } = await supabase
        .from("specs")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    []
  );

  const updateSpec = useCallback(
    async (
      id: string,
      updates: Partial<Pick<SavedSpec, "title" | "service_name" | "yaml_content">>
    ) => {
      const { error } = await supabase
        .from("specs")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    []
  );

  const deleteSpec = useCallback(async (id: string) => {
    const { error } = await supabase.from("specs").delete().eq("id", id);
    if (error) throw error;
  }, []);

  return { fetchSpecs, getSpec, saveSpec, updateSpec, deleteSpec };
}
