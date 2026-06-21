"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Factory that creates CRUD hooks for any Supabase table.
 * Eliminates 7 nearly-identical useSaved*.ts hooks.
 */
export function createSavedHook<
  T extends { id: string; updated_at: string },
  InsertPayload extends Record<string, unknown>,
  UpdatePayload extends Record<string, unknown> = Partial<InsertPayload>
>(tableName: string) {
  return function useSaved() {
    const fetchItems = useCallback(
      async (opts?: { limit?: number }): Promise<T[]> => {
        let query = supabase
          .from(tableName)
          .select("*")
          .order("updated_at", { ascending: false });

        if (opts?.limit) {
          query = query.limit(opts.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as T[];
      },
      []
    );

    const getItem = useCallback(
      async (id: string): Promise<T | null> => {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        return data as T;
      },
      []
    );

    const saveItem = useCallback(
      async (payload: InsertPayload): Promise<string> => {
        const { data, error } = await supabase
          .from(tableName)
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;
        return data.id;
      },
      []
    );

    const updateItem = useCallback(
      async (id: string, updates: UpdatePayload) => {
        // Note: updated_at is handled by a DB trigger — no manual setting needed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase
          .from(tableName)
          .update(updates as any)
          .eq("id", id);

        if (error) throw error;
      },
      []
    );

    const deleteItem = useCallback(async (id: string) => {
      const { error } = await supabase.from(tableName).delete().eq("id", id);
      if (error) throw error;
    }, []);

    return { fetchItems, getItem, saveItem, updateItem, deleteItem };
  };
}
