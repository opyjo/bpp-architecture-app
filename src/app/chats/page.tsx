"use client";

import { useState, useEffect, useCallback } from "react";
import { useSavedChats } from "@/lib/hooks/useSavedChats";
import ChatList from "@/components/chats/ChatList";
import type { SavedChat } from "@/lib/types/saved-chat";

import { toast } from "sonner";

const BSA_PREFIX = "[BSA Coach]";

type ChatFilter = "all" | "assistant" | "coach";

const FILTERS: { id: ChatFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "assistant", label: "AI Assistant" },
  { id: "coach", label: "Interview Coach" },
];

function isBsaCoachChat(chat: SavedChat): boolean {
  return chat.title.startsWith(BSA_PREFIX);
}

export default function ChatsPage() {
  const { fetchChats, updateChat, deleteChat } = useSavedChats();
  const [chats, setChats] = useState<SavedChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ChatFilter>("all");

  const load = useCallback(async () => {
    try {
      const data = await fetchChats();
      setChats(data);
    } catch {
      toast.error("Failed to load chats");
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

  const assistantChats = chats.filter((c) => !isBsaCoachChat(c));
  const coachChats = chats.filter(isBsaCoachChat);

  const filteredChats =
    filter === "assistant"
      ? assistantChats
      : filter === "coach"
        ? coachChats
        : chats;

  return (
    <div className="flex-1 bg-arch-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[14.5px] font-bold text-arch-text">
            Saved Chats
          </h1>
          {!loading && chats.length > 0 && (
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-arch-text3 mr-1">{chats.length} total</span>
              <span className="text-arch-text3">
                ({assistantChats.length} assistant, {coachChats.length} coach)
              </span>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        {!loading && chats.length > 0 && (
          <div className="flex items-center gap-1 mb-5 bg-arch-bg2 border border-arch-border rounded-lg p-1 w-fit">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-colors cursor-pointer ${
                  filter === f.id
                    ? f.id === "coach"
                      ? "bg-arch-teal/15 text-arch-teal"
                      : f.id === "assistant"
                        ? "bg-arch-purple/15 text-arch-purple"
                        : "bg-arch-blue/15 text-arch-blue"
                    : "text-arch-text3 hover:text-arch-text hover:bg-white/[0.04]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-arch-purple/30 border-t-arch-purple rounded-full animate-spin" />
          </div>
        ) : filter === "all" ? (
          /* Grouped view when "All" is selected */
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-arch-purple to-arch-blue text-white flex items-center justify-center text-[8px] font-bold">
                  AI
                </div>
                <span className="text-[12px] font-semibold text-arch-text">AI Assistant</span>
                <span className="text-[10.5px] text-arch-text3">{assistantChats.length}</span>
              </div>
              {assistantChats.length > 0 ? (
                <ChatList chats={assistantChats} onRename={handleRename} onDelete={handleDelete} />
              ) : (
                <p className="text-[11.5px] text-arch-text3 pl-7">No assistant chats yet</p>
              )}
            </div>
            <div className="border-t border-arch-border pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-arch-teal to-arch-blue text-white flex items-center justify-center text-[7px] font-bold">
                  BSA
                </div>
                <span className="text-[12px] font-semibold text-arch-text">Interview Coach</span>
                <span className="text-[10.5px] text-arch-text3">{coachChats.length}</span>
              </div>
              {coachChats.length > 0 ? (
                <ChatList chats={coachChats} onRename={handleRename} onDelete={handleDelete} />
              ) : (
                <p className="text-[11.5px] text-arch-text3 pl-7">No coach chats yet</p>
              )}
            </div>
          </div>
        ) : (
          <ChatList chats={filteredChats} onRename={handleRename} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
