"use client";

import { createSavedHook } from "./createSavedHook";
import type { SavedReview } from "@/lib/types/saved-review";

type InsertPayload = {
  title: string;
  code_snippet: string;
  review_content: string;
  focus_areas: string[];
  language: string;
};

type UpdatePayload = Partial<
  Pick<SavedReview, "title" | "code_snippet" | "review_content" | "focus_areas" | "language">
>;

const useSavedReviewsBase = createSavedHook<SavedReview, InsertPayload, UpdatePayload>("reviews");

export function useSavedReviews() {
  const { fetchItems, getItem, saveItem, updateItem, deleteItem } = useSavedReviewsBase();
  return {
    fetchReviews: fetchItems,
    getReview: getItem,
    saveReview: saveItem,
    updateReview: updateItem,
    deleteReview: deleteItem,
  };
}
