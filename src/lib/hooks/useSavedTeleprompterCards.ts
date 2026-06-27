"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { createSavedHook } from "./createSavedHook";
import type { SavedTeleprompterCard } from "@/lib/types/saved-teleprompter-card";
import type {
  HighlightedPhrase,
  CardSection,
  CardMentalModel,
} from "@/data/teleprompter-defaults";

type InsertPayload = {
  title: string;
  category: string;
  bullets: HighlightedPhrase[];
  sections?: CardSection[] | null;
  full_text?: string | null;
  mental_model?: CardMentalModel | null;
  role?: string | null;
  sort_order: number;
};

type UpdatePayload = Partial<InsertPayload>;

const TABLE = "teleprompter_cards";

const useSavedBase = createSavedHook<SavedTeleprompterCard, InsertPayload, UpdatePayload>(TABLE);

export function useSavedTeleprompterCards() {
  const { saveItem, updateItem, deleteItem } = useSavedBase();

  // Custom fetch ordered by sort_order ASC instead of default updated_at DESC
  const fetchTeleprompterCards = useCallback(async (): Promise<SavedTeleprompterCard[]> => {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data as SavedTeleprompterCard[];
  }, []);

  const deleteAllTeleprompterCards = useCallback(async () => {
    const { error } = await supabase.from(TABLE).delete().gte("sort_order", 0);
    if (error) throw error;
  }, []);

  const batchUpdateSortOrders = useCallback(
    async (updates: { id: string; sort_order: number }[]) => {
      await Promise.all(
        updates.map(({ id, sort_order }) =>
          supabase.from(TABLE).update({ sort_order }).eq("id", id)
        )
      );
    },
    []
  );

  return {
    fetchTeleprompterCards,
    saveTeleprompterCard: saveItem,
    updateTeleprompterCard: updateItem,
    deleteTeleprompterCard: deleteItem,
    deleteAllTeleprompterCards,
    batchUpdateSortOrders,
  };
}
