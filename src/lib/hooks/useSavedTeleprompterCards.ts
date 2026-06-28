"use client";

import { useCallback } from "react";
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

  // Custom fetch ordered by sort_order ASC instead of the default updated_at DESC.
  const fetchTeleprompterCards = useCallback(async (): Promise<SavedTeleprompterCard[]> => {
    const res = await fetch(`/api/saved/${TABLE}?order=sort_order&dir=asc`);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || "Failed to load teleprompter cards");
    }
    return (await res.json()) as SavedTeleprompterCard[];
  }, []);

  const deleteAllTeleprompterCards = useCallback(async () => {
    const res = await fetch(`/api/saved/${TABLE}?all=true`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || "Failed to clear teleprompter cards");
    }
  }, []);

  const batchUpdateSortOrders = useCallback(
    async (updates: { id: string; sort_order: number }[]) => {
      await Promise.all(
        updates.map(({ id, sort_order }) =>
          updateItem(id, { sort_order } as UpdatePayload)
        )
      );
    },
    [updateItem]
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
