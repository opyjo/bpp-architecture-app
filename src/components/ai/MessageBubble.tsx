"use client";

import { useState, type ReactNode } from "react";
import type { ChatMessage } from "@/lib/types/chat";

/* ── Thinking indicator ── */
function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-arch-purple"
            style={{
              animation: "thinkingBounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <span className="text-[11.5px] text-arch-text3 italic">Thinking...</span>
    </div>
  );
}

/* ── Inline markdown renderer ── */
function renderInlineMarkdown(text: string): ReactNode[] {
  // Single regex pass: inline code > links > bold > italic
  const inlineRegex = /(`[^`]+`)|(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
  const result: ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = inlineRegex.exec(text)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Inline code
      result.push(
        <code
          key={key++}
          className="bg-arch-bg3 text-arch-coral px-1.5 py-0.5 rounded text-[11.5px] font-mono"
        >
          {match[1].slice(1, -1)}
        </code>
      );
    } else if (match[2]) {
      // Link
      result.push(
        <a
          key={key++}
          href={match[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-arch-blue hover:underline"
        >
          {match[3]}
        </a>
      );
    } else if (match[5]) {
      // Bold
      result.push(<strong key={key++}>{match[6]}</strong>);
    } else if (match[7]) {
      // Italic
      result.push(<em key={key++}>{match[8]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}

/* ── Block-level markdown renderer ── */
function formatMarkdown(text: string) {
  const parts: (
    | string
    | { type: "code"; lang: string; code: string }
  )[] = [];

  // Split on fenced code blocks
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push({ type: "code", lang: match[1] || "text", code: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.map((part, i) => {
    if (typeof part !== "string") {
      // Fenced code block
      return (
        <pre
          key={i}
          className="bg-[#0d1017] text-[#e8eaf0] border border-arch-border rounded-md p-3 my-2 overflow-x-auto text-[11.5px] leading-relaxed font-mono"
        >
          <div className="text-[10.5px] text-[#5c6278] mb-1.5 uppercase tracking-wide">
            {part.lang}
          </div>
          <code className="text-[#e8eaf0]">{part.code}</code>
        </pre>
      );
    }

    // Split text into paragraphs by double newline
    const paragraphs = part.split(/\n\n+/);

    return paragraphs.map((para, pi) => {
      const trimmed = para.trim();
      if (!trimmed) return null;

      // --- Horizontal rule
      if (/^-{3,}$/.test(trimmed)) {
        return <hr key={`${i}-${pi}`} className="my-3 border-arch-border" />;
      }

      // # / ## / ### / #### Headers
      const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)$/m);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const sizes: Record<number, string> = {
          1: "text-[13px]",
          2: "text-[11px]",
          3: "text-[13px]",
          4: "text-[12.5px]",
        };
        return (
          <div
            key={`${i}-${pi}`}
            className={`font-semibold text-arch-text mt-3 mb-1.5 ${sizes[level] || "text-[13px]"}`}
          >
            {renderInlineMarkdown(headerMatch[2])}
          </div>
        );
      }

      // Markdown table
      const tableLines = trimmed.split("\n").filter((l) => l.trim());
      if (
        tableLines.length >= 2 &&
        tableLines[0].includes("|") &&
        /^[\s|:-]+$/.test(tableLines[1])
      ) {
        const parseRow = (row: string) =>
          row
            .split("|")
            .map((c) => c.trim())
            .filter((c) => c !== "");
        const headers = parseRow(tableLines[0]);
        const rows = tableLines.slice(2).map(parseRow);

        return (
          <div key={`${i}-${pi}`} className="my-2 overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr>
                  {headers.map((h, hi) => (
                    <th
                      key={hi}
                      className="text-left px-2.5 py-1.5 border-b border-arch-border text-arch-text font-semibold bg-arch-bg3/50"
                    >
                      {renderInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-arch-border/50 last:border-b-0">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2.5 py-1.5 text-arch-text2">
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      // > Blockquote
      if (trimmed.startsWith("> ")) {
        const quoteText = trimmed
          .split("\n")
          .map((l) => l.replace(/^>\s?/, ""))
          .join("\n");
        return (
          <div
            key={`${i}-${pi}`}
            className="border-l-2 border-arch-purple/50 pl-3 my-2 italic text-arch-text2"
          >
            {renderInlineMarkdown(quoteText)}
          </div>
        );
      }

      // - Bullet list
      const bulletLines = trimmed.split("\n").filter((l) => /^\s*[-*]\s/.test(l));
      if (bulletLines.length > 0 && bulletLines.length === trimmed.split("\n").length) {
        return (
          <ul key={`${i}-${pi}`} className="my-1.5 flex flex-col gap-1">
            {bulletLines.map((line, li) => (
              <li key={li} className="flex items-start gap-2 text-[13px]">
                <span className="w-1.5 h-1.5 rounded-full bg-arch-purple/60 mt-[7px] shrink-0" />
                <span>{renderInlineMarkdown(line.replace(/^\s*[-*]\s+/, ""))}</span>
              </li>
            ))}
          </ul>
        );
      }

      // 1. Numbered list (must have 2+ items to be a list)
      const allLines = trimmed.split("\n");
      const numberedLines = allLines.filter((l) => /^\s*\d+\.\s/.test(l));
      if (numberedLines.length >= 2 && numberedLines.length === allLines.length) {
        return (
          <ol key={`${i}-${pi}`} className="my-1.5 flex flex-col gap-1">
            {numberedLines.map((line, li) => {
              const num = line.match(/^\s*(\d+)\./)?.[1];
              return (
                <li key={li} className="flex items-start gap-2 text-[13px]">
                  <span className="text-arch-blue font-semibold text-[12px] mt-[1px] shrink-0 min-w-[16px]">
                    {num}.
                  </span>
                  <span>{renderInlineMarkdown(line.replace(/^\s*\d+\.\s+/, ""))}</span>
                </li>
              );
            })}
          </ol>
        );
      }

      // Regular paragraph — handle single newlines as <br />
      const lines = trimmed.split("\n");
      return (
        <p key={`${i}-${pi}`} className="my-1">
          {lines.map((line, li) => (
            <span key={li}>
              {li > 0 && <br />}
              {renderInlineMarkdown(line)}
            </span>
          ))}
        </p>
      );
    });
  });
}

/* ── Message bubble ── */
export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isThinking = !isUser && !message.content;

  return (
    <div
      className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
      style={{ animation: "messageSlideIn 0.3s ease-out" }}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-arch-purple to-arch-blue text-white flex items-center justify-center text-[10.5px] font-bold shrink-0 mt-0.5">
          AI
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
          isUser
            ? "bg-arch-blue/10 text-arch-text border border-arch-blue/20 rounded-2xl rounded-br-md"
            : "bg-arch-bg2 text-arch-text border border-arch-border rounded-2xl rounded-bl-md"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">
          {isUser ? message.content : isThinking ? <ThinkingIndicator /> : formatMarkdown(message.content)}
        </div>

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {message.toolCalls.map((tc, i) => (
              <ToolCallBadge key={i} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Tool call badge ── */
function ToolCallBadge({
  toolCall,
}: {
  toolCall: { toolName: string; input: Record<string, unknown>; output: string; durationMs: number };
}) {
  const [expanded, setExpanded] = useState(false);

  const icon =
    toolCall.toolName === "read_file"
      ? "📄"
      : toolCall.toolName === "search_files"
        ? "🔍"
        : "📁";

  const label =
    toolCall.toolName === "read_file"
      ? (toolCall.input.path as string)
      : toolCall.toolName === "search_files"
        ? `search: ${toolCall.input.pattern}`
        : (toolCall.input.path as string);

  return (
    <div className="text-[11px]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-arch-border hover:bg-white/10 transition-colors text-arch-text2 cursor-pointer"
      >
        <span>{icon}</span>
        <span className="font-mono truncate max-w-[300px]">{label}</span>
        {toolCall.durationMs > 0 && (
          <span className="text-arch-text3 ml-1">
            {toolCall.durationMs}ms
          </span>
        )}
        <span className="text-arch-text3 ml-0.5">
          {expanded ? "▲" : "▼"}
        </span>
      </button>
      {expanded && toolCall.output && (
        <pre className="mt-1 p-2 bg-[#0d1017] border border-arch-border rounded text-[11px] text-arch-text3 overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
          {toolCall.output}
        </pre>
      )}
    </div>
  );
}
