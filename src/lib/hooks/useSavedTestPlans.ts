"use client";

import { createSavedHook } from "./createSavedHook";
import type { SavedTestPlan } from "@/lib/types/saved-test-plan";

type InsertPayload = {
  title: string;
  requirement: string;
  plan_content: string;
  test_types: string[];
};

type UpdatePayload = Partial<
  Pick<SavedTestPlan, "title" | "requirement" | "plan_content" | "test_types">
>;

const useSavedTestPlansBase = createSavedHook<SavedTestPlan, InsertPayload, UpdatePayload>("test_plans");

export function useSavedTestPlans() {
  const { fetchItems, getItem, saveItem, updateItem, deleteItem } = useSavedTestPlansBase();
  return {
    fetchTestPlans: fetchItems,
    getTestPlan: getItem,
    saveTestPlan: saveItem,
    updateTestPlan: updateItem,
    deleteTestPlan: deleteItem,
  };
}
