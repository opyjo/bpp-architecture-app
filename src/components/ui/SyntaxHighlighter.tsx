"use client";

import { memo } from "react";
import { Prism as PrismHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface SyntaxHighlighterProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

/** Map common aliases/labels to Prism language identifiers */
function normalizeLanguage(lang?: string): string {
  if (!lang) return "text";
  const l = lang.toLowerCase().trim();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    go: "go",
    golang: "go",
    graphql: "graphql",
    gql: "graphql",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    bash: "bash",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    sql: "sql",
    css: "css",
    html: "markup",
    xml: "markup",
    markdown: "markdown",
    md: "markdown",
    python: "python",
    py: "python",
    rust: "rust",
    rs: "rust",
    docker: "docker",
    dockerfile: "docker",
    text: "text",
    plaintext: "text",
  };
  return map[l] || l;
}

/** Try to guess language from code content */
export function detectLanguage(code: string, comment?: string): string {
  // Check comment for language hints
  if (comment) {
    const c = comment.toLowerCase();
    if (c.includes("# go") || c.includes("// go")) return "go";
    if (c.includes("# run") || c.includes("$ ")) return "bash";
    if (c.includes("// typescript") || c.includes("// ts")) return "typescript";
    if (c.includes("// javascript") || c.includes("// js")) return "javascript";
  }

  const trimmed = code.trim();

  // Go patterns
  if (/^(package |func |import \(|type \w+ (struct|interface))/.test(trimmed)) return "go";
  if (/\b(func|:=|go\s+func|chan\s|select\s*\{)/.test(trimmed)) return "go";

  // GraphQL
  if (/^(mutation|query|subscription|fragment)\s/.test(trimmed)) return "graphql";

  // TypeScript/JavaScript/TSX/JSX
  if (/^(import |export |const |let |var |interface |type )/.test(trimmed)) return "typescript";
  if (/<[A-Z]\w+/.test(trimmed) && /className=/.test(trimmed)) return "tsx";

  // JSON
  if (/^\s*[\[{]/.test(trimmed) && /[\]}]\s*$/.test(trimmed)) return "json";

  // Bash/shell
  if (/^(\$|#!\/bin|curl |wget |npm |go |docker |git )/.test(trimmed)) return "bash";

  // SQL
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(trimmed)) return "sql";

  // YAML
  if (/^\w+:\s/.test(trimmed) && !trimmed.includes("{")) return "yaml";

  return "go"; // Default for this architecture app
}

function SyntaxHighlighter({
  code,
  language = "text",
  showLineNumbers = false,
}: SyntaxHighlighterProps) {
  const lang = normalizeLanguage(language);

  return (
    <PrismHighlighter
      language={lang}
      style={oneDark}
      showLineNumbers={showLineNumbers}
      wrapLines
      customStyle={{
        margin: 0,
        padding: "12px 14px",
        borderRadius: "8px",
        fontSize: "11.5px",
        lineHeight: "1.7",
        fontFamily:
          '"JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontVariantLigatures: "none",
        fontFeatureSettings: "'calt' 0, 'liga' 0",
        background: "transparent",
      }}
      codeTagProps={{
        style: {
          fontFamily: "inherit",
          fontSize: "inherit",
          lineHeight: "inherit",
        },
      }}
    >
      {code}
    </PrismHighlighter>
  );
}

// Prism tokenization is expensive; re-highlight only when code/language change.
export default memo(SyntaxHighlighter);

export { normalizeLanguage };
