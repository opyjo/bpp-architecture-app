"use client";

import { createSavedHook } from "./createSavedHook";
import type { SavedChat } from "@/lib/types/saved-chat";
import type { ChatMessage } from "@/lib/types/chat";

type InsertPayload = {
  title: string;
  messages: ChatMessage[];
  model_id: string;
};

type UpdatePayload = Partial<Pick<SavedChat, "title" | "messages">>;

const useSavedChatsBase = createSavedHook<SavedChat, InsertPayload, UpdatePayload>("chats");

export function useSavedChats() {
  const { fetchItems, getItem, saveItem, updateItem, deleteItem } = useSavedChatsBase();
  return {
    fetchChats: fetchItems,
    getChat: getItem,
    saveChat: saveItem,
    updateChat: updateItem,
    deleteChat: deleteItem,
  };
}
