"use client";

import ModelSelector from "@/components/ai/ModelSelector";

const EXAMPLE_TICKETS = [
  {
    title: "Add Paramount+ as a new streaming partner",
    text: "Add Paramount+ as a new streaming partner with monthly billing support. The partner should follow the same merchant adapter pattern as Netflix and Disney+. Include provisioning, subscription lifecycle management, and billing integration.",
  },
  {
    title: "Implement grace period for failed renewals",
    text: "When a subscription renewal payment fails, instead of immediately cancelling, implement a 7-day grace period. During this period, the user retains access but sees a banner. After 7 days, if payment still fails, cancel the subscription and notify the user.",
  },
  {
    title: "Add promo code validation endpoint",
    text: "Create a new endpoint in promocodes-api to validate promo codes before redemption. It should check expiry date, usage limits, eligible products, and customer eligibility. Return detailed validation results including any reasons for rejection.",
  },
  {
    title: "Implement household sharing limits",
    text: "Add enforcement of household sharing limits. Each subscription should allow a maximum number of household members (configurable per product). The household-api needs a new endpoint to check current member count and the reseller-service needs to enforce the limit during subscription creation.",
  },
];

interface TicketInputProps {
  onAnalyze: (text: string) => void;
  isDisabled: boolean;
  modelId: string;
  onModelChange: (id: string) => void;
}

export default function TicketInput({
  onAnalyze,
  isDisabled,
  modelId,
  onModelChange,
}: TicketInputProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-arch-text">
            Ticket Analyzer
          </h1>
          <p className="text-sm text-arch-text2">
            Paste a Jira ticket or requirement below. The AI will explore the Go
            codebase and produce a structured analysis document you can hand to
            any developer or model for implementation.
          </p>
        </div>

        {/* Textarea + controls */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const textarea = form.querySelector("textarea");
            if (textarea?.value.trim()) {
              onAnalyze(textarea.value.trim());
            }
          }}
          className="space-y-4"
        >
          <textarea
            name="ticket"
            rows={10}
            placeholder="Paste your Jira ticket, user story, or requirement here..."
            className="w-full bg-arch-bg3 border border-arch-border rounded-lg px-4 py-3 text-sm text-arch-text placeholder:text-arch-text2/50 focus:outline-none focus:border-arch-blue/50 focus:ring-1 focus:ring-arch-blue/30 resize-y max-h-96"
            disabled={isDisabled}
          />

          <div className="flex items-center justify-between">
            <ModelSelector
              value={modelId}
              onChange={onModelChange}
              disabled={isDisabled}
            />
            <button
              type="submit"
              disabled={isDisabled}
              className="px-5 py-2 bg-arch-blue text-white text-sm font-medium rounded-lg hover:bg-arch-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Analyze Ticket
            </button>
          </div>
        </form>

        {/* Example tickets */}
        <div className="space-y-2">
          <p className="text-xs text-arch-text2 font-medium">
            Or try an example:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXAMPLE_TICKETS.map((example) => (
              <button
                key={example.title}
                onClick={() => onAnalyze(example.text)}
                disabled={isDisabled}
                className="text-left px-3 py-2.5 bg-arch-bg2 border border-arch-border rounded-lg text-xs text-arch-text2 hover:text-arch-text hover:border-arch-blue/30 hover:bg-arch-bg3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {example.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
