"use client";

import { createSavedHook } from "./createSavedHook";
import type { SavedSequenceDiagram } from "@/lib/types/saved-sequence-diagram";

type InsertPayload = {
  title: string;
  description: string;
  mermaid_source: string;
  flow_id?: string;
  participants: string[];
};

type UpdatePayload = Partial<
  Pick<SavedSequenceDiagram, "title" | "description" | "mermaid_source" | "flow_id" | "participants">
>;

const useSavedSequenceDiagramsBase = createSavedHook<
  SavedSequenceDiagram,
  InsertPayload,
  UpdatePayload
>("sequence_diagrams");

export function useSavedSequenceDiagrams() {
  const { fetchItems, getItem, saveItem, updateItem, deleteItem } =
    useSavedSequenceDiagramsBase();
  return {
    fetchSequenceDiagrams: fetchItems,
    getSequenceDiagram: getItem,
    saveSequenceDiagram: saveItem,
    updateSequenceDiagram: updateItem,
    deleteSequenceDiagram: deleteItem,
  };
}
