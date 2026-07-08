"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  kickoutSections,
  sectionToMarkdown,
  allSectionsToMarkdown,
  type KickoutSection,
  type StatusTone,
} from "@/data/kickout";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { useChat } from "@/lib/hooks/useChat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import ModelSelector from "@/components/ai/ModelSelector";
import MessageBubble from "@/components/ai/MessageBubble";
import ChatInput from "@/components/ai/ChatInput";
import { cn } from "@/lib/utils";
import {
  Unplug,
  Lightbulb,
  GitBranch,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  ListTodo,
  HelpCircle,
  Link2,
  Hash,
  Copy,
  Check,
  FileText,
  MessageSquare,
  Sparkles,
  Layers,
  Ticket,
  Network,
  Route,
  GraduationCap,
} from "lucide-react";

// Mermaid renders client-side only (reads document/theme on mount).
const MermaidDiagram = dynamic(() => import("@/components/ui/MermaidDiagram"), {
  ssr: false,
});

type DetailView = "details" | "chat";

const STATUS_STYLES: Record<StatusTone, string> = {
  done: "bg-arch-green/10 text-arch-green border-arch-green/30",
  partial: "bg-arch-amber/10 text-arch-amber border-arch-amber/30",
  blocked: "bg-arch-coral/10 text-arch-coral border-arch-coral/30",
  info: "bg-arch-blue/10 text-arch-blue border-arch-blue/30",
};

const KIND_ICON: Record<KickoutSection["kind"], typeof Ticket> = {
  overview: Layers,
  ticket: Ticket,
  architecture: Network,
  strategy: Route,
  interview: GraduationCap,
};

const DIAGRAM_TONE: Record<
  NonNullable<KickoutSection["diagrams"]>[number]["tone"],
  { accent: string; border: string }
> = {
  neutral: { accent: "text-arch-text2", border: "border-arch-border" },
  bad: { accent: "text-arch-coral", border: "border-arch-coral/30" },
  good: { accent: "text-arch-green", border: "border-arch-green/30" },
  change: { accent: "text-arch-blue", border: "border-arch-blue/30" },
};

export default function KickoutTab() {
  const [selectedId, setSelectedId] = useState<string>(
    kickoutSections[0]?.id ?? "overview"
  );
  const [detailView, setDetailView] = useState<DetailView>("details");

  const selected: KickoutSection | undefined = useMemo(
    () => kickoutSections.find((s) => s.id === selectedId),
    [selectedId]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-coral to-arch-amber text-white flex items-center justify-center shrink-0">
            <Unplug className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-arch-text truncate">
            Billing Kickout Status
          </span>
          <span className="text-[10px] text-arch-text3 hidden sm:inline">
            Contingency Management — business + technical status, next phase &amp;
            interview prep
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CopyAllButton />
          <span className="text-[10px] text-arch-text3">
            {kickoutSections.length} sections
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: section nav */}
        <div className="w-[300px] shrink-0 flex flex-col border-r border-arch-border bg-arch-bg/50">
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {kickoutSections.map((s) => {
              const Icon = KIND_ICON[s.kind];
              const active = selectedId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
                    active
                      ? "bg-arch-coral/10 border-arch-coral/30"
                      : "border-transparent hover:bg-arch-bg2"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        active ? "text-arch-coral" : "text-arch-text3"
                      )}
                    />
                    <span className="text-[12px] font-medium text-arch-text leading-snug">
                      {s.nav}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pl-[22px]">
                    {s.status && (
                      <span
                        className={cn(
                          "text-[8.5px] px-1.5 py-0.5 rounded-full border",
                          STATUS_STYLES[s.status.tone]
                        )}
                      >
                        {s.status.label}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-arch-text3 mt-1 pl-[22px] leading-snug">
                    {s.teaser}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="px-3 py-2 border-t border-arch-border text-[9.5px] text-arch-text3 leading-relaxed">
            Source: docs/kickout-implemntation.md + walk of the contingency MFE,
            API &amp; Go billing repos.
          </div>
        </div>

        {/* Right: detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-arch-border bg-arch-bg2/60">
                <div className="flex items-center gap-2 min-w-0">
                  {selected.ticket ? (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-arch-text2 shrink-0">
                      <Hash className="w-3 h-3 text-arch-text3" />
                      {selected.ticket}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-arch-text2 shrink-0">
                      <Unplug className="w-3 h-3 text-arch-text3" />
                      Kickout
                    </span>
                  )}
                  {selected.status && (
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border shrink-0",
                        STATUS_STYLES[selected.status.tone]
                      )}
                    >
                      {selected.status.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <CopySectionButton section={selected} />
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

                    {/* Business summary */}
                    <Section
                      icon={
                        <Lightbulb className="w-3.5 h-3.5 text-arch-amber" />
                      }
                      title="In plain business terms"
                    >
                      <MarkdownRenderer content={selected.summary} />
                    </Section>

                    {/* Technical */}
                    {selected.technical && (
                      <Section
                        icon={
                          <GitBranch className="w-3.5 h-3.5 text-arch-blue" />
                        }
                        title="Technical detail"
                      >
                        <MarkdownRenderer content={selected.technical} />
                      </Section>
                    )}

                    {/* Diagrams */}
                    {selected.diagrams && selected.diagrams.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-arch-teal" />
                          Flows
                        </h3>
                        {selected.diagrams.map((d, i) => {
                          const tone = DIAGRAM_TONE[d.tone];
                          return (
                            <div
                              key={i}
                              className={cn(
                                "rounded-lg border bg-arch-bg2/40 overflow-hidden",
                                tone.border
                              )}
                            >
                              <div className="flex items-baseline gap-2 px-4 pt-3 pb-1">
                                <span
                                  className={cn(
                                    "text-[12px] font-bold",
                                    tone.accent
                                  )}
                                >
                                  {d.label}
                                </span>
                              </div>
                              {d.caption && (
                                <p className="px-4 pb-3 text-[11px] text-arch-text2 leading-relaxed">
                                  {d.caption}
                                </p>
                              )}
                              <div className="px-3 pb-3">
                                <MermaidDiagram chart={d.mermaid} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Done / Gaps / Next */}
                    {selected.done && selected.done.length > 0 && (
                      <BulletCard
                        icon={
                          <CheckCircle2 className="w-3.5 h-3.5 text-arch-green" />
                        }
                        title={`Done & verified (${selected.done.length})`}
                        dot="bg-arch-green/60"
                        items={selected.done}
                      />
                    )}
                    {selected.gaps && selected.gaps.length > 0 && (
                      <BulletCard
                        icon={
                          <AlertTriangle className="w-3.5 h-3.5 text-arch-amber" />
                        }
                        title={`Gaps / outstanding (${selected.gaps.length})`}
                        dot="bg-arch-amber/60"
                        items={selected.gaps}
                      />
                    )}
                    {selected.next && selected.next.length > 0 && (
                      <BulletCard
                        icon={
                          <ListTodo className="w-3.5 h-3.5 text-arch-blue" />
                        }
                        title={`Next phase (${selected.next.length})`}
                        dot="bg-arch-blue/60"
                        items={selected.next}
                      />
                    )}

                    {/* Interview Q&A */}
                    {selected.qa && selected.qa.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-arch-purple" />
                          Likely questions ({selected.qa.length})
                        </h3>
                        <div className="space-y-2">
                          {selected.qa.map((qa, i) => (
                            <QaCard key={i} q={qa.q} a={qa.a} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* References */}
                    {selected.references &&
                      selected.references.length > 0 && (
                        <div className="rounded-lg border border-arch-border bg-arch-bg2/60 p-4">
                          <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5 mb-3">
                            <Link2 className="w-3.5 h-3.5 text-arch-blue" />
                            References ({selected.references.length})
                          </h3>
                          <ul className="space-y-1">
                            {selected.references.map((r, i) => (
                              <li
                                key={i}
                                className="text-[10.5px] text-arch-text2 font-mono leading-relaxed"
                              >
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                // Remount per section so the chat loads that section's history.
                <SectionChat key={selected.id} section={selected} />
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── Copy whole deck ── */
function CopyAllButton() {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(allSectionsToMarkdown());
      setCopied(true);
      toast.success("Full kickout brief copied as Markdown");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border border-arch-border text-arch-text2 hover:text-arch-text hover:bg-white/5 transition-colors"
      title="Copy the entire brief as Markdown"
    >
      {copied ? (
        <Check className="w-3 h-3 text-arch-green" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
      Copy all
    </button>
  );
}

/* ── Copy one section ── */
function CopySectionButton({ section }: { section: KickoutSection }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sectionToMarkdown(section));
      setCopied(true);
      toast.success(`${section.nav} copied as Markdown`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border border-arch-border text-arch-text2 hover:text-arch-text hover:bg-white/5 transition-colors"
      title="Copy this section as Markdown"
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
          ? "bg-arch-coral/10 text-arch-coral"
          : "text-arch-text3 hover:text-arch-text2 hover:bg-white/5"
      )}
    >
      {icon}
      {label}
    </button>
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

/** Lightweight inline markdown for bullet items: **bold** and `code`. */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-arch-text font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="font-mono text-[10px] text-arch-coral bg-arch-bg3 px-1 py-0.5 rounded"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function BulletCard({
  icon,
  title,
  dot,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  dot: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-arch-border bg-arch-bg2/60 p-4">
      <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5 mb-3">
        {icon}
        {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li
            key={i}
            className="text-[11px] text-arch-text2 flex items-start gap-2 leading-relaxed"
          >
            <span
              className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", dot)}
            />
            <span className="text-arch-text2">{renderInline(it)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QaCard({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-lg border border-arch-border bg-arch-bg2/60 p-4">
      <p className="text-[12px] font-semibold text-arch-text mb-1.5 flex items-start gap-1.5">
        <span className="text-arch-purple shrink-0">Q</span>
        {q}
      </p>
      <p className="text-[11px] text-arch-text2 leading-relaxed pl-4">{a}</p>
    </div>
  );
}

/* ── Per-section AI chat (grounded) ── */
function SectionChat({ section }: { section: KickoutSection }) {
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory } =
    useChat(modelId, {
      storageKey: `kickout-chat-${section.id}`,
      feature: "Kickout Status Chat",
      systemContext: `You are a senior business/systems analyst and staff engineer helping the user prepare for a status meeting and for job interviews. Answer using ONLY the documentation below about the billing kickout / Contingency Management work. Be concise, concrete, and practical. When asked about interviews, give crisp talking points and STAR-style framing. If the answer isn't covered by the documentation, say so plainly.\n\n----- SECTION DOCUMENTATION -----\n\n${sectionToMarkdown(section)}\n\n----- FULL BRIEF (all sections, for cross-reference) -----\n\n${allSectionsToMarkdown()}`,
    });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const isEmpty = messages.length === 0;
  const suggestions =
    section.kind === "interview"
      ? [
          "Give me a 60-second elevator pitch for this project",
          "Turn this into a STAR story about system design",
          "What follow-up questions would an interviewer ask?",
          "Explain the BFF vs service decision simply",
        ]
      : [
          `Explain ${section.nav} in simple terms`,
          "What is done vs still outstanding here?",
          "What should I say about this in the meeting?",
          "How would this come up in an interview?",
        ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-arch-border bg-arch-bg/40">
        <span className="text-[10.5px] text-arch-text3 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-arch-purple" />
          Grounded in this brief
        </span>
        <div className="flex items-center gap-1.5">
          <ModelSelector
            value={modelId}
            onChange={setModelId}
            disabled={isStreaming}
          />
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-arch-coral/20 to-arch-amber/20 flex items-center justify-center mx-auto">
                <MessageSquare className="w-5 h-5 text-arch-coral" />
              </div>
              <h3 className="text-[13px] font-semibold text-arch-text">
                Ask about {section.nav}
              </h3>
              <p className="text-[11px] text-arch-text3">
                Grounded in this brief — great for rehearsing the meeting or an
                interview answer.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {suggestions.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full text-[10.5px] text-arch-text3 border border-arch-border hover:border-arch-coral/40 hover:text-arch-coral transition-colors"
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
