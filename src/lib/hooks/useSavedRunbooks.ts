"use client";

import { createSavedHook } from "./createSavedHook";
import type { SavedRunbook } from "@/lib/types/saved-runbook";

type InsertPayload = {
  title: string;
  severity: string;
  content: object;
};

type UpdatePayload = Partial<Pick<SavedRunbook, "title" | "severity" | "content">>;

const useSavedRunbooksBase = createSavedHook<SavedRunbook, InsertPayload, UpdatePayload>("runbooks");

export function useSavedRunbooks() {
  const { fetchItems, getItem, saveItem, updateItem, deleteItem } = useSavedRunbooksBase();
  return {
    fetchRunbooks: fetchItems,
    getRunbook: getItem,
    saveRunbook: saveItem,
    updateRunbook: updateItem,
    deleteRunbook: deleteItem,
  };
}
