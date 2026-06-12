"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSavedChats } from "@/lib/hooks/useSavedChats";
import ChatList from "@/components/chats/ChatList";
import type { SavedChat } from "@/lib/types/saved-chat";
import { ArrowLeft } from "lucide-react";

export default function ChatsPage() {
  const { fetchChats, updateChat, deleteChat } = useSavedChats();
  const [chats, setChats] = useState<SavedChat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchChats();
      setChats(data);
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [fetchChats]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRename = async (id: string, title: string) => {
    await updateChat(id, { title });
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  };

  const handleDelete = async (id: string) => {
    await deleteChat(id);
    setChats((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-arch-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-arch-text3 hover:text-arch-text hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-[18px] font-bold text-arch-text">
              Saved Chats
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-arch-purple/30 border-t-arch-purple rounded-full animate-spin" />
          </div>
        ) : (
          <ChatList
            chats={chats}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
