"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { SavedChat } from "@/lib/types/saved-chat";
import type { ChatMessage } from "@/lib/types/chat";

export function useSavedChats() {
  const fetchChats = useCallback(async (): Promise<SavedChat[]> => {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data as SavedChat[];
  }, []);

  const getChat = useCallback(async (id: string): Promise<SavedChat | null> => {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as SavedChat;
  }, []);

  const saveChat = useCallback(
    async (payload: {
      title: string;
      messages: ChatMessage[];
      model_id: string;
    }): Promise<string> => {
      const { data, error } = await supabase
        .from("chats")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    []
  );

  const updateChat = useCallback(
    async (
      id: string,
      updates: Partial<Pick<SavedChat, "title" | "messages">>
    ) => {
      const { error } = await supabase
        .from("chats")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    []
  );

  const deleteChat = useCallback(async (id: string) => {
    const { error } = await supabase.from("chats").delete().eq("id", id);
    if (error) throw error;
  }, []);

  return { fetchChats, getChat, saveChat, updateChat, deleteChat };
}
