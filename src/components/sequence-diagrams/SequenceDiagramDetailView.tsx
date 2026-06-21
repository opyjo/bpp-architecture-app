"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSavedSequenceDiagrams } from "@/lib/hooks/useSavedSequenceDiagrams";
import type { SavedSequenceDiagram } from "@/lib/types/saved-sequence-diagram";
import { Pencil, Check, Copy, CheckCheck } from "lucide-react";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import { toast } from "sonner";

export default function SequenceDiagramDetailView({ diagramId }: { diagramId: string }) {
  const { getSequenceDiagram } = useSavedSequenceDiagrams();
  const [diagram, setDiagram] = useState<SavedSequenceDiagram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSequenceDiagram(diagramId)
      .then((data) => setDiagram(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [diagramId, getSequenceDiagram]);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 bg-arch-bg">
        <div className="w-5 h-5 border-2 border-arch-green/30 border-t-arch-green rounded-full animate-spin" />
      </div>
    );
  }

  if (!diagram) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-arch-bg text-arch-text3 gap-3">
        <p className="text-[13px]">Sequence diagram not found</p>
        <Link href="/saved" className="text-[12px] text-arch-green hover:underline">
          Back to saved items
        </Link>
      </div>
    );
  }

  return <DiagramDetailInner diagram={diagram} />;
}

function DiagramDetailInner({ diagram }: { diagram: SavedSequenceDiagram }) {
  const { updateSequenceDiagram } = useSavedSequenceDiagrams();
  const [title, setTitle] = useState(diagram.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTitleSave = async () => {
    const trimmed = title.trim() || "Untitled Diagram";
    setTitle(trimmed);
    setEditingTitle(false);
    await updateSequenceDiagram(diagram.id, { title: trimmed }).catch(() => {});
  };

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(diagram.mermaid_source);
    setCopied(true);
    toast.success("Mermaid source copied");
    setTimeout(() => setCopied(false), 2000);
  }, [diagram.mermaid_source]);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-arch-bg">
      <Breadcrumbs dynamicLabel={title} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {editingTitle ? (
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") { setTitle(diagram.title); setEditingTitle(false); }
                }}
                autoFocus
                className="flex-1 bg-transparent text-[13px] font-semibold text-arch-text outline-none border-b border-arch-green/50 min-w-0"
              />
              <button onClick={handleTitleSave} className="p-1 text-arch-green hover:bg-white/5 rounded cursor-pointer shrink-0">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditingTitle(true)} className="flex items-center gap-1.5 min-w-0 group cursor-pointer">
              <span className="text-[13px] font-semibold text-arch-text truncate">{title}</span>
              <Pencil className="w-3 h-3 text-arch-text3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-3">
          <button
            onClick={() => setShowSource(!showSource)}
            className={`px-2.5 py-1.5 text-[11px] border rounded-lg transition-colors ${
              showSource
                ? "text-arch-green bg-arch-green/10 border-arch-green/20"
                : "text-arch-text2 hover:text-arch-text bg-arch-bg3 hover:bg-white/[0.08] border-arch-border"
            }`}
          >
            {showSource ? "Hide Source" : "View Source"}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-arch-text2 hover:text-arch-text bg-arch-bg3 hover:bg-white/[0.08] border border-arch-border rounded-lg transition-colors"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-arch-green" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Description + participants */}
      {(diagram.description || diagram.participants.length > 0) && (
        <div className="px-5 py-3 border-b border-arch-border flex items-start gap-4">
          {diagram.description && (
            <p className="text-[11.5px] text-arch-text2 leading-[1.65] flex-1">{diagram.description}</p>
          )}
          {diagram.participants.length > 0 && (
            <div className="flex flex-wrap gap-1 shrink-0">
              {diagram.participants.map((p) => (
                <span key={p} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-arch-bg3 border border-arch-border text-arch-text3">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Diagram + optional source */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4">
          <MermaidDiagram chart={diagram.mermaid_source} />

          {showSource && (
            <div className="mt-4">
              <div className="text-[9.5px] font-semibold tracking-[0.1em] uppercase text-arch-text3 mb-2">Mermaid Source</div>
              <pre className="text-[11px] font-mono leading-[1.7] bg-arch-bg2 border border-arch-border rounded-lg p-4 overflow-x-auto whitespace-pre text-arch-text2">
                {diagram.mermaid_source}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
