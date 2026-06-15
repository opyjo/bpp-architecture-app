"use client";

interface CodeBlockProps {
  children: string;
  comment?: string;
}

export default function CodeBlock({ children, comment }: CodeBlockProps) {
  return (
    <pre className="bg-arch-bg3 border border-arch-border rounded-lg px-3.5 py-3 font-mono text-[11px] text-arch-text2 leading-[1.7] overflow-x-auto my-1.5 whitespace-pre">
      {comment && <span className="text-arch-text3">{comment}{"\n"}</span>}
      {children}
    </pre>
  );
}
