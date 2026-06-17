"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import SyntaxHighlighter, { detectLanguage } from "./SyntaxHighlighter";

interface MarkdownRendererProps {
  content: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-sm font-semibold text-arch-text mt-6 mb-3 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[13px] font-semibold text-arch-text mt-6 mb-2 pb-1.5 border-b border-arch-border">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[12.5px] font-semibold text-arch-text mt-4 mb-1.5">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-[11.5px] font-semibold text-arch-text mt-3 mb-1">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-[11.5px] text-arch-text2 leading-[1.7] mb-2">
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-arch-blue hover:underline"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="text-[11.5px] text-arch-text2 leading-[1.7] mb-2 pl-4 list-disc space-y-0.5">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-[11.5px] text-arch-text2 leading-[1.7] mb-2 pl-4 list-decimal space-y-0.5">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="text-arch-text2">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-arch-text">{children}</strong>
  ),
  code: ({ className, children }) => {
    // Fenced code blocks get className="language-xxx" from react-markdown
    const langMatch = className?.match(/language-(\w+)/);
    if (langMatch) {
      const code = String(children).replace(/\n$/, "");
      return (
        <SyntaxHighlighter code={code} language={langMatch[1]} />
      );
    }
    // Inline code
    return (
      <code className="bg-arch-bg3 text-arch-teal text-[11px] px-1 py-0.5 rounded border border-arch-border">
        {children}
      </code>
    );
  },
  pre: ({ children }) => {
    // If the child is already a SyntaxHighlighter (fenced code block), wrap it
    return (
      <div className="rounded-lg border border-arch-border overflow-hidden my-2 bg-[#282c34]">
        {children}
      </div>
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-[11px] border border-arch-border rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-arch-bg3 text-arch-text3 text-[10px] uppercase tracking-wider">
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-arch-border last:border-b-0 hover:bg-white/[0.02]">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-arch-text3">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-arch-text2">{children}</td>
  ),
  hr: () => <hr className="border-arch-border my-4" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-arch-blue pl-3 my-2 text-arch-text2 italic">
      {children}
    </blockquote>
  ),
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="max-w-4xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
