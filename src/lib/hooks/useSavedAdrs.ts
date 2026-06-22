"use client";

import { createSavedHook } from "./createSavedHook";
import type { SavedAdr, AdrStatus } from "@/lib/types/saved-adr";

type InsertPayload = {
  title: string;
  status: AdrStatus;
  context: string;
  decision: string;
  consequences: string;
  alternatives: string;
  tags: string[];
};

type UpdatePayload = Partial<
  Pick<
    SavedAdr,
    | "title"
    | "status"
    | "context"
    | "decision"
    | "consequences"
    | "alternatives"
    | "tags"
  >
>;

const useSavedAdrsBase = createSavedHook<SavedAdr, InsertPayload, UpdatePayload>(
  "adrs"
);

export function useSavedAdrs() {
  const { fetchItems, getItem, saveItem, updateItem, deleteItem } =
    useSavedAdrsBase();
  return {
    fetchAdrs: fetchItems,
    getAdr: getItem,
    saveAdr: saveItem,
    updateAdr: updateItem,
    deleteAdr: deleteItem,
  };
}
