"use client";

const prompts = [
  {
    title: "Subscription flow",
    description: "Explain the end-to-end subscription flow from UI click to partner provisioning",
  },
  {
    title: "Reseller service",
    description: "How does reseller-service work? Walk me through the subscribe handler",
  },
  {
    title: "Analyze a ticket",
    description:
      "I have a ticket to add Paramount+ as a new provider. What services need changes and what files should I modify?",
  },
  {
    title: "Auth & middleware",
    description: "Where is authentication enforced in the BFF and how does session management work?",
  },
];

export default function SuggestedPrompts({
  onSelect,
}: {
  onSelect: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12 px-4">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-arch-purple to-arch-blue text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">
          AI
        </div>
        <h2 className="text-sm font-semibold text-arch-text">
          Architecture Assistant
        </h2>
        <p className="text-[12px] text-arch-text3 mt-1.5 max-w-md">
          Ask questions about the go-repo and node-mono codebases. I can read
          files, search code, and analyze Jira tickets.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {prompts.map((p) => (
          <button
            key={p.title}
            onClick={() => onSelect(p.description)}
            className="text-left p-3.5 rounded-xl bg-arch-bg2 border border-arch-border hover:border-arch-purple/40 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="text-[12.5px] font-medium text-arch-text group-hover:text-arch-purple transition-colors">
              {p.title}
            </div>
            <div className="text-[11.5px] text-arch-text3 mt-1 line-clamp-2">
              {p.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
