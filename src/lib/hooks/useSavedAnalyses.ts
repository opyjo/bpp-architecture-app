"use client";

import { createSavedHook } from "./createSavedHook";
import type { SavedAnalysis } from "@/lib/types/saved-analysis";
import type { ChatMessage } from "@/lib/types/chat";

type InsertPayload = {
  title: string;
  ticket_text: string;
  messages: ChatMessage[];
  model_id: string;
};

type UpdatePayload = Partial<Pick<SavedAnalysis, "title" | "messages">>;

const useSavedAnalysesBase = createSavedHook<SavedAnalysis, InsertPayload, UpdatePayload>("analyses");

export function useSavedAnalyses() {
  const { fetchItems, getItem, saveItem, updateItem, deleteItem } = useSavedAnalysesBase();
  return {
    fetchAnalyses: fetchItems,
    getAnalysis: getItem,
    saveAnalysis: saveItem,
    updateAnalysis: updateItem,
    deleteAnalysis: deleteItem,
  };
}
