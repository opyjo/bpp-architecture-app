"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { SavedTestPlan } from "@/lib/types/saved-test-plan";

export function useSavedTestPlans() {
  const fetchTestPlans = useCallback(async (): Promise<SavedTestPlan[]> => {
    const { data, error } = await supabase
      .from("test_plans")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data as SavedTestPlan[];
  }, []);

  const getTestPlan = useCallback(
    async (id: string): Promise<SavedTestPlan | null> => {
      const { data, error } = await supabase
        .from("test_plans")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as SavedTestPlan;
    },
    []
  );

  const saveTestPlan = useCallback(
    async (payload: {
      title: string;
      requirement: string;
      plan_content: string;
      test_types: string[];
    }): Promise<string> => {
      const { data, error } = await supabase
        .from("test_plans")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    []
  );

  const updateTestPlan = useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<SavedTestPlan, "title" | "requirement" | "plan_content" | "test_types">
      >
    ) => {
      const { error } = await supabase
        .from("test_plans")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    []
  );

  const deleteTestPlan = useCallback(async (id: string) => {
    const { error } = await supabase.from("test_plans").delete().eq("id", id);
    if (error) throw error;
  }, []);

  return { fetchTestPlans, getTestPlan, saveTestPlan, updateTestPlan, deleteTestPlan };
}
