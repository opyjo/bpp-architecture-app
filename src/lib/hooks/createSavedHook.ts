"use client";

import { useCallback } from "react";

/**
 * Factory that creates CRUD hooks for any saved-items table.
 *
 * Access goes through the server route `/api/saved/[table]` (behind the shared
 * password proxy), NOT directly to Supabase — the browser no longer holds a key
 * that can read/write the database. The hook surface is unchanged.
 */
async function readError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.error || fallback;
}

export function createSavedHook<
  T extends { id: string; updated_at: string },
  InsertPayload extends Record<string, unknown>,
  UpdatePayload extends Record<string, unknown> = Partial<InsertPayload>
>(tableName: string) {
  const base = `/api/saved/${tableName}`;

  return function useSaved() {
    const fetchItems = useCallback(
      async (opts?: { limit?: number }): Promise<T[]> => {
        const qs = opts?.limit ? `?limit=${opts.limit}` : "";
        const res = await fetch(`${base}${qs}`);
        if (!res.ok) throw new Error(await readError(res, "Failed to load items"));
        return (await res.json()) as T[];
      },
      []
    );

    const getItem = useCallback(async (id: string): Promise<T | null> => {
      const res = await fetch(`${base}?id=${encodeURIComponent(id)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(await readError(res, "Failed to load item"));
      return (await res.json()) as T;
    }, []);

    const saveItem = useCallback(
      async (payload: InsertPayload): Promise<string> => {
        const res = await fetch(base, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await readError(res, "Failed to save item"));
        const { id } = await res.json();
        return id as string;
      },
      []
    );

    const updateItem = useCallback(
      async (id: string, updates: UpdatePayload) => {
        // updated_at is handled by a DB trigger — no manual setting needed.
        const res = await fetch(base, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, updates }),
        });
        if (!res.ok) throw new Error(await readError(res, "Failed to update item"));
      },
      []
    );

    const deleteItem = useCallback(async (id: string) => {
      const res = await fetch(`${base}?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await readError(res, "Failed to delete item"));
    }, []);

    return { fetchItems, getItem, saveItem, updateItem, deleteItem };
  };
}
