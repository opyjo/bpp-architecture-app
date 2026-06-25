"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  apoartStories,
  categoryMeta,
  storyToMarkdown,
  type ApoartStory,
  type ApoartCategory,
} from "@/data/apoart-stories";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { useChat } from "@/lib/hooks/useChat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import ModelSelector from "@/components/ai/ModelSelector";
import MessageBubble from "@/components/ai/MessageBubble";
import ChatInput from "@/components/ai/ChatInput";
import { cn } from "@/lib/utils";
import {
  Layers,
  Search,
  ArrowRightLeft,
  GitBranch,
  Lightbulb,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Link2,
  ChevronDown,
  ChevronRight,
  Hash,
  Copy,
  Check,
  FileText,
  MessageSquare,
  Sparkles,
} from "lucide-react";

// Mermaid renders client-side only (reads document/theme on mount).
const MermaidDiagram = dynamic(
  () => import("@/components/ui/MermaidDiagram"),
  { ssr: false }
);

// Stable category order for the filter chips.
const CATEGORY_ORDER: ApoartCategory[] = [
  "VAS APR",
  "PROMO ENHANCE",
  "ANNIVERSARY",
  "MSP",
  "TECH DEBT",
  "Exploration",
  "Contingency",
];

type DetailView = "details" | "chat";

export default function ApoartStoriesTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ApoartCategory | "">(
    ""
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    apoartStories[0]?.id ?? null
  );
  const [detailView, setDetailView] = useState<DetailView>("details");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const categoriesPresent = useMemo(
    () =>
      CATEGORY_ORDER.filter((c) =>
        apoartStories.some((s) => s.category === c)
      ),
    []
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return apoartStories.filter((s) => {
      if (selectedCategory && s.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        s.id.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        (s.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

  const selected: ApoartStory | undefined = useMemo(
    () => apoartStories.find((s) => s.id === selectedId),
    [selectedId]
  );

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-blue to-arch-purple text-white flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-arch-text truncate">
            APOART Stories
          </span>
          <span className="text-[10px] text-arch-text3 hidden sm:inline">
            PI2 — plain-language explainers with current (CMO) vs future (FMO)
            flows
          </span>
        </div>
        <span className="text-[10px] text-arch-text3 shrink-0">
          {apoartStories.length} stories
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: story list */}
        <div className="w-[340px] shrink-0 flex flex-col border-r border-arch-border bg-arch-bg/50">
          <div className="p-3 space-y-2 border-b border-arch-border">
            <div className="flex items-center gap-2 bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2 focus-within:border-arch-blue/40 transition-colors">
              <Search className="w-3.5 h-3.5 text-arch-text3 shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className="flex-1 bg-transparent text-[12px] text-arch-text placeholder:text-arch-text3 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedCategory("")}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                  selectedCategory === ""
                    ? "bg-arch-blue/10 text-arch-blue border-arch-blue/30"
                    : "text-arch-text3 border-arch-border hover:text-arch-text2"
                )}
              >
                All
              </button>
              {categoriesPresent.map((c) => (
                <button
                  key={c}
                  onClick={() =>
                    setSelectedCategory((prev) => (prev === c ? "" : c))
                  }
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                    selectedCategory === c
                      ? categoryMeta[c].badge
                      : "text-arch-text3 border-arch-border hover:text-arch-text2"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-arch-text3">
              {filtered.length} of {apoartStories.length} stories
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
                  selectedId === s.id
                    ? "bg-arch-blue/10 border-arch-blue/30"
                    : "border-transparent hover:bg-arch-bg2"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-mono font-bold text-arch-text3">
                    {s.ticket}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full border",
                      categoryMeta[s.category].badge
                    )}
                  >
                    {s.category}
                  </span>
                </div>
                <div className="text-[12px] font-medium text-arch-text leading-snug">
                  {s.title}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-[11px] text-arch-text3 text-center py-8">
                No stories match your search.
              </div>
            )}
          </div>
        </div>

        {/* Right: detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Toolbar: identity + copy + view toggle */}
              <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-arch-border bg-arch-bg2/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-arch-text2 shrink-0">
                    <Hash className="w-3 h-3 text-arch-text3" />
                    {selected.id}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border shrink-0",
                      categoryMeta[selected.category].badge
                    )}
                  >
                    {selected.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <CopyMarkdownButton story={selected} />
                  <div className="flex items-center rounded-lg border border-arch-border overflow-hidden">
                    <ViewTab
                      active={detailView === "details"}
                      onClick={() => setDetailView("details")}
                      icon={<FileText className="w-3 h-3" />}
                      label="Details"
                    />
                    <ViewTab
                      active={detailView === "chat"}
                      onClick={() => setDetailView("chat")}
                      icon={<MessageSquare className="w-3 h-3" />}
                      label="Ask AI"
                    />
                  </div>
                </div>
              </div>

              {detailView === "details" ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="p-5 space-y-5 max-w-4xl">
                    {/* Title + tags */}
                    <div>
                      <h2 className="text-[16px] font-semibold text-arch-text">
                        {selected.title}
                      </h2>
                      {selected.tags && selected.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selected.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-arch-bg3 text-arch-text3 font-mono"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* What it is */}
                    <Section
                      icon={<Lightbulb className="w-3.5 h-3.5 text-arch-amber" />}
                      title="What it is"
                    >
                      <MarkdownRenderer content={selected.summary} />
                    </Section>

                    {/* Technical idea */}
                    <Section
                      icon={<GitBranch className="w-3.5 h-3.5 text-arch-blue" />}
                      title="Technical idea"
                    >
                      <MarkdownRenderer content={selected.technical} />
                    </Section>

                    {/* CMO + FMO flows */}
                    <div className="space-y-4">
                      <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-arch-teal" />
                        Flow — current (CMO) vs future (FMO)
                      </h3>

                      <FlowBlock
                        label="CMO"
                        sublabel="Current Mode of Operation · as-is"
                        accent="text-arch-coral"
                        border="border-arch-coral/30"
                        caption={selected.cmo.caption}
                        mermaid={selected.cmo.mermaid}
                      />
                      <FlowBlock
                        label="FMO"
                        sublabel="Future Mode of Operation · to-be"
                        accent="text-arch-green"
                        border="border-arch-green/30"
                        caption={selected.fmo.caption}
                        mermaid={selected.fmo.mermaid}
                      />
                    </div>

                    {/* Implementation */}
                    <Section
                      icon={<Wrench className="w-3.5 h-3.5 text-arch-purple" />}
                      title="Implementation"
                    >
                      <MarkdownRenderer content={selected.implementation} />
                    </Section>

                    {/* Collapsible lists */}
                    {selected.acceptanceCriteria &&
                      selected.acceptanceCriteria.length > 0 && (
                        <Collapsible
                          open={expanded.has("ac")}
                          onToggle={() => toggle("ac")}
                          icon={
                            <CheckCircle2 className="w-3.5 h-3.5 text-arch-green" />
                          }
                          title={`Acceptance criteria (${selected.acceptanceCriteria.length})`}
                        >
                          <ul className="space-y-1.5 mt-3">
                            {selected.acceptanceCriteria.map((c, i) => (
                              <li
                                key={i}
                                className="text-[11px] text-arch-text2 flex items-start gap-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-arch-green/60 mt-1.5 shrink-0" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </Collapsible>
                      )}

                    {selected.risks && selected.risks.length > 0 && (
                      <Collapsible
                        open={expanded.has("risks")}
                        onToggle={() => toggle("risks")}
                        icon={
                          <AlertTriangle className="w-3.5 h-3.5 text-arch-amber" />
                        }
                        title={`Risks & edge cases (${selected.risks.length})`}
                      >
                        <ul className="space-y-1.5 mt-3">
                          {selected.risks.map((r, i) => (
                            <li
                              key={i}
                              className="text-[11px] text-arch-text2 flex items-start gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-arch-amber/60 mt-1.5 shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </Collapsible>
                    )}

                    {selected.references && selected.references.length > 0 && (
                      <Collapsible
                        open={expanded.has("refs")}
                        onToggle={() => toggle("refs")}
                        icon={<Link2 className="w-3.5 h-3.5 text-arch-blue" />}
                        title={`References (${selected.references.length})`}
                      >
                        <ul className="space-y-1 mt-3">
                          {selected.references.map((r, i) => (
                            <li
                              key={i}
                              className="text-[11px] text-arch-text2 font-mono"
                            >
                              {r}
                            </li>
                          ))}
                        </ul>
                      </Collapsible>
                    )}
                  </div>
                </div>
              ) : (
                // Remount per story so the chat loads that story's own history.
                <StoryChat key={selected.id} story={selected} />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-arch-blue/20 to-arch-purple/20 flex items-center justify-center mx-auto">
                  <Layers className="w-6 h-6 text-arch-blue" />
                </div>
                <h3 className="text-[13px] font-semibold text-arch-text">
                  APOART Stories
                </h3>
                <p className="text-[11px] text-arch-text3 leading-relaxed">
                  Select a story to read its plain-language explanation and see
                  the current (CMO) vs future (FMO) implementation flow.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Copy as Markdown ── */
function CopyMarkdownButton({ story }: { story: ApoartStory }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storyToMarkdown(story));
      setCopied(true);
      toast.success(`${story.id} copied as Markdown`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border border-arch-border text-arch-text2 hover:text-arch-text hover:bg-white/5 transition-colors"
      title="Copy this story as Markdown"
    >
      {copied ? (
        <Check className="w-3 h-3 text-arch-green" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
      {copied ? "Copied" : "Copy Markdown"}
    </button>
  );
}

/* ── View toggle tab ── */
function ViewTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 text-[11px] px-2.5 py-1 transition-colors",
        active
          ? "bg-arch-blue/10 text-arch-blue"
          : "text-arch-text3 hover:text-arch-text2 hover:bg-white/5"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ── Per-story AI chat ── */
function StoryChat({ story }: { story: ApoartStory }) {
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory } =
    useChat(modelId, {
      storageKey: `apoart-chat-${story.id}`,
      feature: "APOART Story Chat",
      systemContext: `You are a helpful business/systems analyst assistant. Answer the user's questions about the following APOART story using ONLY the documentation below. Be concise and practical. If the answer isn't covered by the documentation, say so plainly rather than guessing.\n\n----- STORY DOCUMENTATION -----\n\n${storyToMarkdown(story)}`,
    });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const isEmpty = messages.length === 0;
  const suggestions = [
    `Explain ${story.id} in simple terms`,
    "What changes between the CMO and FMO flow?",
    "Which components or files need to change?",
    "What are the main risks and edge cases?",
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chat sub-toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-arch-border bg-arch-bg/40">
        <span className="text-[10.5px] text-arch-text3 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-arch-purple" />
          Grounded in {story.id}
        </span>
        <div className="flex items-center gap-1.5">
          <ModelSelector value={modelId} onChange={setModelId} disabled={isStreaming} />
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-[11px] text-arch-text3 hover:text-arch-red transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-arch-red/10 border border-arch-red/30 text-arch-red text-[11.5px]">
          {error}
        </div>
      )}

      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden px-4 py-4",
          isEmpty && "flex flex-col items-center justify-center"
        )}
      >
        {isEmpty ? (
          <div className="w-full max-w-xl mx-auto flex flex-col gap-3">
            <div className="text-center space-y-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-arch-purple/20 to-arch-blue/20 flex items-center justify-center mx-auto">
                <MessageSquare className="w-5 h-5 text-arch-purple" />
              </div>
              <h3 className="text-[13px] font-semibold text-arch-text">
                Ask about {story.id}
              </h3>
              <p className="text-[11px] text-arch-text3">
                This chat answers using only this story&apos;s documentation —
                summary, CMO/FMO flows, implementation, criteria and risks.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {suggestions.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full text-[10.5px] text-arch-text3 border border-arch-border hover:border-arch-purple/40 hover:text-arch-purple transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <ChatInput
              onSend={sendMessage}
              onStop={stopStreaming}
              isStreaming={isStreaming}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </div>

      {!isEmpty && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-4 pt-2">
          <ChatInput
            onSend={sendMessage}
            onStop={stopStreaming}
            isStreaming={isStreaming}
          />
        </div>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5 mb-1">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function FlowBlock({
  label,
  sublabel,
  accent,
  border,
  caption,
  mermaid,
}: {
  label: string;
  sublabel: string;
  accent: string;
  border: string;
  caption: string;
  mermaid: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-arch-bg2/40 overflow-hidden", border)}>
      <div className="flex items-baseline gap-2 px-4 pt-3 pb-2">
        <span className={cn("text-[13px] font-bold", accent)}>{label}</span>
        <span className="text-[10px] text-arch-text3">{sublabel}</span>
      </div>
      {caption && (
        <p className="px-4 pb-3 text-[11px] text-arch-text2 leading-relaxed">
          {caption}
        </p>
      )}
      <div className="px-3 pb-3">
        <MermaidDiagram chart={mermaid} />
      </div>
    </div>
  );
}

function Collapsible({
  open,
  onToggle,
  icon,
  title,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-arch-border bg-arch-bg2/60 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-arch-bg3/30 transition-colors"
      >
        <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5">
          {icon}
          {title}
        </h3>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-arch-text3" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-arch-text3" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-arch-border">{children}</div>
      )}
    </div>
  );
}
