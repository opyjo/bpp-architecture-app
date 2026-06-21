"use client";

import { useState } from "react";
import Link from "next/link";
import type { SavedChat } from "@/lib/types/saved-chat";
import { MessageSquare, Trash2, Pencil, Check, X, Bot, GraduationCap } from "lucide-react";
import { timeAgo } from "@/lib/utils";

const BSA_PREFIX = "[BSA Coach]";

function isBsaCoachChat(title: string): boolean {
  return title.startsWith(BSA_PREFIX);
}

function displayTitle(title: string): string {
  if (title.startsWith(BSA_PREFIX)) {
    return title.slice(BSA_PREFIX.length).trim() || "Untitled";
  }
  return title;
}

interface ChatListProps {
  chats: SavedChat[];
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export default function ChatList({ chats, onRename, onDelete }: ChatListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-arch-text3">
        <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-[13px] font-medium">No saved chats yet</p>
        <p className="text-[11.5px] mt-1">
          Save a conversation from the AI Assistant to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {chats.map((chat) => {
        const firstMsg = chat.messages.find((m) => m.role === "user");
        const preview = firstMsg
          ? firstMsg.content.slice(0, 120) + (firstMsg.content.length > 120 ? "…" : "")
          : "No messages";
        const isEditing = editingId === chat.id;

        return (
          <div
            key={chat.id}
            className="bg-arch-bg2 border border-arch-border rounded-xl p-4 hover:border-arch-purple/30 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-1.5 mb-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onRename(chat.id, editTitle.trim() || chat.title);
                          setEditingId(null);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 bg-transparent text-[13px] font-semibold text-arch-text outline-none border-b border-arch-purple/50"
                    />
                    <button
                      onClick={() => {
                        onRename(chat.id, editTitle.trim() || chat.title);
                        setEditingId(null);
                      }}
                      className="p-1 text-arch-green hover:bg-white/5 rounded cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-arch-text3 hover:bg-white/5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {isBsaCoachChat(chat.title) ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[rgba(62,184,154,0.12)] text-arch-teal border border-[rgba(62,184,154,0.22)]">
                        <GraduationCap className="w-3 h-3" />
                        Coach
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[rgba(124,111,205,0.12)] text-arch-purple border border-[rgba(124,111,205,0.22)]">
                        <Bot className="w-3 h-3" />
                        AI
                      </span>
                    )}
                    <Link
                      href={`/chats/${chat.id}`}
                      className="text-[13px] font-semibold text-arch-text hover:text-arch-purple transition-colors block truncate"
                    >
                      {displayTitle(chat.title)}
                    </Link>
                  </div>
                )}
                <p className="text-[11.5px] text-arch-text3 mt-1 line-clamp-2">
                  {preview}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => {
                    setEditingId(chat.id);
                    setEditTitle(chat.title);
                  }}
                  className="p-1.5 text-arch-text3 hover:text-arch-text hover:bg-white/5 rounded cursor-pointer"
                  title="Rename"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(chat.id)}
                  className="p-1.5 text-arch-text3 hover:text-arch-red hover:bg-white/5 rounded cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2.5">
              <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-arch-purple/10 text-arch-purple font-medium">
                {chat.model_id}
              </span>
              <span className="text-[11px] text-arch-text3 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {chat.messages.length}
              </span>
              <span className="text-[11px] text-arch-text3">
                {timeAgo(chat.updated_at)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
