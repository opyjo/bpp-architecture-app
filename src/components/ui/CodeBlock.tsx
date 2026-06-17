"use client";

import SyntaxHighlighter, { detectLanguage } from "./SyntaxHighlighter";

interface CodeBlockProps {
  children: string;
  comment?: string;
  language?: string;
}

export default function CodeBlock({ children, comment, language }: CodeBlockProps) {
  const lang = language || detectLanguage(children, comment);

  return (
    <div className="rounded-lg border border-arch-border overflow-hidden my-1.5 bg-[#282c34]">
      {comment && (
        <div className="px-3.5 pt-2.5 pb-0 font-mono text-[11px] text-[#5c6370] select-none">
          {comment}
        </div>
      )}
      <SyntaxHighlighter code={children} language={lang} />
    </div>
  );
}
