"use client";

import { createSavedHook } from "./createSavedHook";
import type { SavedSpec } from "@/lib/types/saved-spec";

type InsertPayload = {
  title: string;
  service_name: string;
  yaml_content: string;
};

type UpdatePayload = Partial<Pick<SavedSpec, "title" | "service_name" | "yaml_content">>;

const useSavedSpecsBase = createSavedHook<SavedSpec, InsertPayload, UpdatePayload>("specs");

export function useSavedSpecs() {
  const { fetchItems, getItem, saveItem, updateItem, deleteItem } = useSavedSpecsBase();
  return {
    fetchSpecs: fetchItems,
    getSpec: getItem,
    saveSpec: saveItem,
    updateSpec: updateItem,
    deleteSpec: deleteItem,
  };
}
