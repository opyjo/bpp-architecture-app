"use client";

import { useState } from "react";
import Link from "next/link";
import type { SavedAnalysis } from "@/lib/types/saved-analysis";
import { FileText, Trash2, Pencil, Check, X, MessageSquare } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface AnalysisListProps {
  analyses: SavedAnalysis[];
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export default function AnalysisList({ analyses, onRename, onDelete }: AnalysisListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-arch-text3">
        <FileText className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-[13px] font-medium">No saved analyses yet</p>
        <p className="text-[11.5px] mt-1">
          Save an analysis from the Ticket Analyzer to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {analyses.map((analysis) => {
        const preview = analysis.ticket_text
          ? analysis.ticket_text.slice(0, 120) + (analysis.ticket_text.length > 120 ? "…" : "")
          : "No ticket text";
        const isEditing = editingId === analysis.id;

        return (
          <div
            key={analysis.id}
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
                          onRename(analysis.id, editTitle.trim() || analysis.title);
                          setEditingId(null);
                        }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 bg-transparent text-[13px] font-semibold text-arch-text outline-none border-b border-arch-purple/50"
                    />
                    <button
                      onClick={() => {
                        onRename(analysis.id, editTitle.trim() || analysis.title);
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
                  <Link
                    href={`/analyses/${analysis.id}`}
                    className="text-[13px] font-semibold text-arch-text hover:text-arch-purple transition-colors block truncate"
                  >
                    {analysis.title}
                  </Link>
                )}
                <p className="text-[11.5px] text-arch-text3 mt-1 line-clamp-2">
                  {preview}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => {
                    setEditingId(analysis.id);
                    setEditTitle(analysis.title);
                  }}
                  className="p-1.5 text-arch-text3 hover:text-arch-text hover:bg-white/5 rounded cursor-pointer"
                  title="Rename"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(analysis.id)}
                  className="p-1.5 text-arch-text3 hover:text-arch-red hover:bg-white/5 rounded cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2.5">
              <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-arch-purple/10 text-arch-purple font-medium">
                {analysis.model_id}
              </span>
              <span className="text-[11px] text-arch-text3 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {analysis.messages.length}
              </span>
              <span className="text-[11px] text-arch-text3">
                {timeAgo(analysis.updated_at)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
