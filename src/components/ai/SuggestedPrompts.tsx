"use client";

const prompts = [
  "Explain the end-to-end subscription flow",
  "Walk me through the reseller-service subscribe handler",
  "What changes are needed to add Paramount+ as a provider?",
  "How does auth & session management work in the BFF?",
];

export default function SuggestedPrompts({
  onSelect,
}: {
  onSelect: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {prompts.map((p) => (
        <button
          key={p}
          onClick={() => onSelect(p)}
          className="px-2.5 py-1 rounded-full text-[10.5px] text-arch-text3 border border-arch-border hover:border-arch-purple/40 hover:text-arch-purple transition-colors cursor-pointer"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
