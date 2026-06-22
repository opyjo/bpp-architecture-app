"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSavedAdrs } from "@/lib/hooks/useSavedAdrs";
import type { SavedAdr, AdrStatus } from "@/lib/types/saved-adr";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import { streamNDJSON } from "@/lib/stream";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { cn, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Save,
  Trash2,
  Sparkles,
  Eye,
  Pencil,
  Loader2,
  X,
  ScrollText,
} from "lucide-react";

const STATUS_OPTIONS: AdrStatus[] = [
  "proposed",
  "accepted",
  "rejected",
  "superseded",
  "deprecated",
];

const STATUS_STYLES: Record<AdrStatus, string> = {
  proposed: "bg-arch-blue/10 text-arch-blue border-arch-blue/30",
  accepted: "bg-arch-green/10 text-arch-green border-arch-green/30",
  rejected: "bg-arch-red/10 text-arch-red border-arch-red/30",
  superseded: "bg-arch-amber/10 text-arch-amber border-arch-amber/30",
  deprecated: "bg-arch-text3/10 text-arch-text3 border-arch-border2",
};

interface FormState {
  title: string;
  status: AdrStatus;
  context: string;
  decision: string;
  consequences: string;
  alternatives: string;
  tags: string[];
}

const EMPTY_FORM: FormState = {
  title: "",
  status: "proposed",
  context: "",
  decision: "",
  consequences: "",
  alternatives: "",
  tags: [],
};

function buildMarkdown(form: FormState): string {
  const tagLine = form.tags.length
    ? form.tags.map((t) => `\`${t}\``).join(" ")
    : "_none_";
  return [
    `# ${form.title || "Untitled ADR"}`,
    "",
    `**Status:** ${form.status}`,
    "",
    `**Tags:** ${tagLine}`,
    "",
    "## Context",
    "",
    form.context || "_No context provided._",
    "",
    "## Decision",
    "",
    form.decision || "_No decision provided._",
    "",
    "## Consequences",
    "",
    form.consequences || "_No consequences provided._",
    "",
    "## Alternatives Considered",
    "",
    form.alternatives || "_No alternatives provided._",
    "",
  ].join("\n");
}

export default function AdrTab() {
  const { fetchAdrs, saveAdr, updateAdr, deleteAdr } = useSavedAdrs();

  const [adrs, setAdrs] = useState<SavedAdr[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [tagDraft, setTagDraft] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // AI drafting state
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiInput, setShowAiInput] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const loadAdrs = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await fetchAdrs();
      setAdrs(rows);
      setTableMissing(false);
    } catch {
      // Table may not exist yet — degrade gracefully instead of crashing.
      setTableMissing(true);
      setAdrs([]);
      toast.error("ADR storage isn't set up yet. Create the 'adrs' table to enable saving.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchAdrs]);

  useEffect(() => {
    loadAdrs();
  }, [loadAdrs]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const resetForm = useCallback(() => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setTagDraft("");
    setShowPreview(false);
    setShowAiInput(false);
    setAiPrompt("");
  }, []);

  const handleSelect = (adr: SavedAdr) => {
    setSelectedId(adr.id);
    setForm({
      title: adr.title,
      status: adr.status,
      context: adr.context,
      decision: adr.decision,
      consequences: adr.consequences,
      alternatives: adr.alternatives,
      tags: adr.tags ?? [],
    });
    setTagDraft("");
    setShowPreview(false);
    setShowAiInput(false);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const commitTag = () => {
    const next = tagDraft.trim().replace(/,$/, "").trim();
    if (!next) return;
    if (!form.tags.includes(next)) {
      setField("tags", [...form.tags, next]);
    }
    setTagDraft("");
  };

  const removeTag = (tag: string) => {
    setField(
      "tags",
      form.tags.filter((t) => t !== tag)
    );
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTag();
    } else if (e.key === "Backspace" && !tagDraft && form.tags.length) {
      removeTag(form.tags[form.tags.length - 1]);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("A title is required");
      return;
    }
    if (tableMissing) {
      toast.error("The 'adrs' table doesn't exist yet");
      return;
    }
    setIsSaving(true);
    try {
      if (selectedId) {
        await updateAdr(selectedId, { ...form });
        toast.success("ADR updated");
      } else {
        const id = await saveAdr({ ...form });
        setSelectedId(id);
        toast.success("ADR saved");
      }
      await loadAdrs();
    } catch {
      toast.error(selectedId ? "Failed to update ADR" : "Failed to save ADR");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteAdr(selectedId);
      toast.success("ADR deleted");
      resetForm();
      await loadAdrs();
    } catch {
      toast.error("Failed to delete ADR");
    }
  };

  const handleDraftWithAi = async () => {
    const problem = aiPrompt.trim();
    if (!problem) {
      toast.error("Describe the decision first");
      return;
    }
    setIsDrafting(true);
    const controller = new AbortController();
    abortRef.current = controller;

    const userPrompt = `Draft an Architecture Decision Record for the following decision/problem:

"${problem}"

Return ONLY a single JSON object (no prose, no markdown fences) with exactly these string keys:
"title", "context", "decision", "consequences", "alternatives".
Each value should be well-written markdown-friendly text. Do not include any other keys.`;

    try {
      const accumulated = await streamNDJSON(
        "/api/chat",
        {
          messages: [{ role: "user", content: userPrompt }],
          modelId: DEFAULT_MODEL_ID,
        },
        controller.signal,
        () => {},
        (message) => toast.error(message)
      );

      const start = accumulated.indexOf("{");
      const end = accumulated.lastIndexOf("}");
      if (start === -1 || end === -1 || end <= start) {
        throw new Error("no-json");
      }

      const parsed = JSON.parse(accumulated.slice(start, end + 1)) as Partial<
        Record<keyof FormState, string>
      >;

      setForm((prev) => ({
        ...prev,
        title: parsed.title?.trim() || prev.title,
        context: parsed.context?.trim() || prev.context,
        decision: parsed.decision?.trim() || prev.decision,
        consequences: parsed.consequences?.trim() || prev.consequences,
        alternatives: parsed.alternatives?.trim() || prev.alternatives,
      }));
      setShowAiInput(false);
      setAiPrompt("");
      toast.success("Draft generated — review and save");
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      toast.error("Couldn't parse the AI draft. Try again.");
    } finally {
      setIsDrafting(false);
      abortRef.current = null;
    }
  };

  const labelCls =
    "text-[10px] font-semibold uppercase tracking-wider text-arch-text3";
  const inputCls =
    "w-full bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2 text-[12px] text-arch-text placeholder:text-arch-text3 focus:outline-none focus:border-arch-blue/50 transition-colors";
  const textareaCls = cn(inputCls, "resize-none font-mono leading-relaxed");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: list */}
      <div className="w-[300px] shrink-0 flex flex-col border-r border-arch-border bg-arch-bg/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-arch-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-blue to-arch-purple text-white flex items-center justify-center shrink-0">
              <ScrollText className="w-3.5 h-3.5" />
            </div>
            <span className="text-[13px] font-semibold text-arch-text">
              Decision Records
            </span>
          </div>
          <button
            onClick={resetForm}
            className="flex items-center gap-1 text-[11px] font-medium text-arch-blue hover:bg-arch-blue/10 px-2 py-1 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-arch-text3">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : adrs.length === 0 ? (
            <div className="text-center px-4 py-10 space-y-2">
              <FileText className="w-6 h-6 text-arch-text3 mx-auto" />
              <p className="text-[11px] text-arch-text3 leading-relaxed">
                {tableMissing
                  ? "ADR storage isn't configured yet. You can still draft below."
                  : "No decision records yet. Create your first one."}
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {adrs.map((adr) => (
                <li key={adr.id}>
                  <button
                    onClick={() => handleSelect(adr)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
                      selectedId === adr.id
                        ? "bg-arch-blue/10 border-arch-blue/30"
                        : "bg-arch-bg2 border-arch-border hover:border-arch-border2"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border",
                          STATUS_STYLES[adr.status]
                        )}
                      >
                        {adr.status}
                      </span>
                    </div>
                    <p className="text-[12px] font-medium text-arch-text truncate">
                      {adr.title}
                    </p>
                    <p className="text-[10px] text-arch-text3 mt-0.5">
                      {timeAgo(adr.updated_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right: editor / preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
          <span className="text-[13px] font-semibold text-arch-text">
            {selectedId ? "Edit ADR" : "New ADR"}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAiInput((v) => !v)}
              disabled={isDrafting}
              className={cn(
                "flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors disabled:opacity-40",
                showAiInput
                  ? "text-arch-purple bg-arch-purple/10"
                  : "text-arch-text3 hover:text-arch-purple hover:bg-arch-purple/10"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Draft with AI
            </button>
            <button
              onClick={() => setShowPreview((v) => !v)}
              className={cn(
                "flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors",
                showPreview
                  ? "text-arch-teal bg-arch-teal/10"
                  : "text-arch-text3 hover:text-arch-teal hover:bg-arch-teal/10"
              )}
            >
              {showPreview ? (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </>
              )}
            </button>
            {selectedId && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-[11px] text-arch-text3 hover:text-arch-red hover:bg-arch-red/10 px-2 py-1 rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-arch-blue to-arch-purple px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {selectedId ? "Update" : "Save"}
            </button>
          </div>
        </div>

        {/* AI draft input */}
        {showAiInput && (
          <div className="px-5 py-3 border-b border-arch-border bg-arch-purple/5">
            <label className={labelCls}>Describe the decision</label>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isDrafting) handleDraftWithAi();
                }}
                disabled={isDrafting}
                placeholder="e.g. Should we adopt event sourcing for the billing service?"
                className={cn(inputCls, "flex-1")}
              />
              <button
                onClick={handleDraftWithAi}
                disabled={isDrafting || !aiPrompt.trim()}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-arch-purple px-3 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
              >
                {isDrafting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Drafting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {showPreview ? (
          <div className="flex-1 overflow-y-auto p-6">
            <MarkdownRenderer content={buildMarkdown(form)} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Title + status */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <label className={labelCls}>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Use a concise, decision-oriented title"
                  className={inputCls}
                />
              </div>
              <div className="w-44 space-y-1.5">
                <label className={labelCls}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setField("status", e.target.value as AdrStatus)
                  }
                  className={cn(inputCls, "capitalize cursor-pointer")}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className={labelCls}>Tags</label>
              <div className="flex flex-wrap items-center gap-1.5 bg-arch-bg2 border border-arch-border rounded-lg px-2 py-1.5 focus-within:border-arch-blue/50 transition-colors">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-[10px] font-medium text-arch-teal bg-arch-teal/10 border border-arch-teal/30 rounded-full pl-2 pr-1 py-0.5"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-arch-red transition-colors"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={commitTag}
                  placeholder={form.tags.length ? "" : "Add tags (comma or enter)"}
                  className="flex-1 min-w-[120px] bg-transparent text-[12px] text-arch-text placeholder:text-arch-text3 focus:outline-none py-0.5"
                />
              </div>
            </div>

            {/* Context / Decision / Consequences / Alternatives */}
            {(
              [
                ["context", "Context", "What is the issue motivating this decision?"],
                ["decision", "Decision", "What is the change we're making?"],
                [
                  "consequences",
                  "Consequences",
                  "What becomes easier or harder as a result?",
                ],
                [
                  "alternatives",
                  "Alternatives Considered",
                  "What other options were weighed, and why were they rejected?",
                ],
              ] as const
            ).map(([key, label, placeholder]) => (
              <div key={key} className="space-y-1.5">
                <label className={labelCls}>{label}</label>
                <textarea
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  placeholder={placeholder}
                  rows={4}
                  className={textareaCls}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
