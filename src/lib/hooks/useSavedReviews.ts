"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { SavedReview } from "@/lib/types/saved-review";

export function useSavedReviews() {
  const fetchReviews = useCallback(async (): Promise<SavedReview[]> => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data as SavedReview[];
  }, []);

  const getReview = useCallback(
    async (id: string): Promise<SavedReview | null> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as SavedReview;
    },
    []
  );

  const saveReview = useCallback(
    async (payload: {
      title: string;
      code_snippet: string;
      review_content: string;
      focus_areas: string[];
      language: string;
    }): Promise<string> => {
      const { data, error } = await supabase
        .from("reviews")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    []
  );

  const updateReview = useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<SavedReview, "title" | "code_snippet" | "review_content" | "focus_areas" | "language">
      >
    ) => {
      const { error } = await supabase
        .from("reviews")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    []
  );

  const deleteReview = useCallback(async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw error;
  }, []);

  return { fetchReviews, getReview, saveReview, updateReview, deleteReview };
}
