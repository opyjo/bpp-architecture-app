"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSavedSpecs } from "@/lib/hooks/useSavedSpecs";
import type { SavedSpec } from "@/lib/types/saved-spec";
import { Pencil, Check, Copy, CheckCheck, Download } from "lucide-react";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import { toast } from "sonner";

export default function SpecDetailView({ specId }: { specId: string }) {
  const { getSpec } = useSavedSpecs();
  const [spec, setSpec] = useState<SavedSpec | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSpec(specId)
      .then((data) => setSpec(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [specId, getSpec]);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 bg-arch-bg">
        <div className="w-5 h-5 border-2 border-arch-teal/30 border-t-arch-teal rounded-full animate-spin" />
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-arch-bg text-arch-text3 gap-3">
        <p className="text-[13px]">API Spec not found</p>
        <Link href="/saved" className="text-[12px] text-arch-teal hover:underline">
          Back to saved items
        </Link>
      </div>
    );
  }

  return <SpecDetailInner spec={spec} />;
}

function SpecDetailInner({ spec }: { spec: SavedSpec }) {
  const { updateSpec } = useSavedSpecs();
  const [title, setTitle] = useState(spec.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTitleSave = async () => {
    const trimmed = title.trim() || "Untitled Spec";
    setTitle(trimmed);
    setEditingTitle(false);
    await updateSpec(spec.id, { title: trimmed }).catch(() => {});
  };

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(spec.yaml_content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [spec.yaml_content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([spec.yaml_content], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${spec.service_name || spec.title || "api-spec"}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  }, [spec]);

  // Basic YAML syntax highlighting
  const highlightYaml = (yaml: string) => {
    return yaml.split("\n").map((line, i) => {
      // Comments
      if (line.trimStart().startsWith("#")) {
        return <span key={i} className="text-arch-text3 italic">{line}{"\n"}</span>;
      }
      // Key: value pairs
      const keyMatch = line.match(/^(\s*)([\w-]+)(\s*:\s*)(.*)/);
      if (keyMatch) {
        const [, indent, key, colon, value] = keyMatch;
        return (
          <span key={i}>
            {indent}
            <span className="text-arch-purple font-medium">{key}</span>
            <span className="text-arch-text3">{colon}</span>
            {highlightValue(value)}
            {"\n"}
          </span>
        );
      }
      // List items
      const listMatch = line.match(/^(\s*)(- )(.*)/);
      if (listMatch) {
        const [, indent, dash, value] = listMatch;
        return (
          <span key={i}>
            {indent}
            <span className="text-arch-coral">{dash}</span>
            {highlightValue(value)}
            {"\n"}
          </span>
        );
      }
      return <span key={i} className="text-arch-text2">{line}{"\n"}</span>;
    });
  };

  const highlightValue = (val: string) => {
    if (!val) return null;
    // Quoted strings
    if (/^['"].*['"]$/.test(val)) {
      return <span className="text-arch-green">{val}</span>;
    }
    // Numbers
    if (/^\d+(\.\d+)?$/.test(val.trim())) {
      return <span className="text-arch-amber">{val}</span>;
    }
    // Booleans
    if (/^(true|false)$/i.test(val.trim())) {
      return <span className="text-arch-coral">{val}</span>;
    }
    // URLs or $refs
    if (val.includes("$ref") || val.includes("http")) {
      return <span className="text-arch-blue">{val}</span>;
    }
    return <span className="text-arch-teal">{val}</span>;
  };

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
                  if (e.key === "Escape") { setTitle(spec.title); setEditingTitle(false); }
                }}
                autoFocus
                className="flex-1 bg-transparent text-[13px] font-semibold text-arch-text outline-none border-b border-arch-teal/50 min-w-0"
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

          {spec.service_name && (
            <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-arch-teal/10 border border-arch-teal/20 text-arch-teal shrink-0">
              {spec.service_name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-arch-text2 hover:text-arch-text bg-arch-bg3 hover:bg-white/[0.08] border border-arch-border rounded-lg transition-colors"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-arch-green" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-arch-text2 hover:text-arch-text bg-arch-bg3 hover:bg-white/[0.08] border border-arch-border rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* YAML content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-5 py-4">
          <pre className="text-[11.5px] font-mono leading-[1.7] bg-arch-bg2 border border-arch-border rounded-lg p-4 overflow-x-auto whitespace-pre">
            {highlightYaml(spec.yaml_content)}
          </pre>
        </div>
      </div>
    </div>
  );
}
