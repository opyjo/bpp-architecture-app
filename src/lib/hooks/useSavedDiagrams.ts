"use client";

import { createSavedHook } from "./createSavedHook";
import type { SavedDiagram } from "@/lib/types/saved-diagram";

type InsertPayload = {
  title: string;
  description: string;
  mermaid_source: string;
  flow_id?: string;
};

type UpdatePayload = Partial<
  Pick<SavedDiagram, "title" | "description" | "mermaid_source" | "flow_id">
>;

const useSavedDiagramsBase = createSavedHook<SavedDiagram, InsertPayload, UpdatePayload>("diagrams");

export function useSavedDiagrams() {
  const { fetchItems, getItem, saveItem, updateItem, deleteItem } = useSavedDiagramsBase();
  return {
    fetchDiagrams: fetchItems,
    getDiagram: getItem,
    saveDiagram: saveItem,
    updateDiagram: updateItem,
    deleteDiagram: deleteItem,
  };
}
