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
  isStreaming: boolean;
  modelId: string;
  onModelChange: (id: string) => void;
  ticketText: string;
  onTicketTextChange: (text: string) => void;
}

export default function TicketInput({
  onAnalyze,
  isStreaming,
  modelId,
  onModelChange,
  ticketText,
  onTicketTextChange,
}: TicketInputProps) {
  return (
    <div className="w-full md:w-[35%] md:min-w-[340px] md:max-w-[480px] border-b md:border-b-0 md:border-r border-arch-border flex flex-col overflow-y-auto p-5 max-h-[50vh] md:max-h-none">
      <p className="text-xs text-arch-text2 mb-4">
        Paste a Jira ticket or requirement below for AI-powered analysis.
      </p>

      {/* Textarea + controls */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ticketText.trim()) {
            onAnalyze(ticketText);
          }
        }}
        className="space-y-4"
      >
        <textarea
          name="ticket"
          rows={8}
          placeholder="Paste your Jira ticket, user story, or requirement here..."
          className="w-full bg-arch-bg3 border border-arch-border rounded-lg px-4 py-3 text-sm text-arch-text placeholder:text-arch-text2/50 focus:outline-none focus:border-arch-blue/50 focus:ring-1 focus:ring-arch-blue/30 resize-y max-h-60"
          value={ticketText}
          onChange={(e) => onTicketTextChange(e.target.value)}
        />

        <div className="flex items-center justify-between">
          <ModelSelector
            value={modelId}
            onChange={onModelChange}
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={isStreaming || !ticketText.trim()}
            className="px-5 py-2 bg-arch-blue text-white text-sm font-medium rounded-lg hover:bg-arch-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Analyze Ticket
          </button>
        </div>
      </form>

      {/* Example tickets */}
      <div className="space-y-2 mt-4">
        <p className="text-xs text-arch-text2 font-medium">
          Or try an example:
        </p>
        <div className="grid grid-cols-1 gap-2">
          {EXAMPLE_TICKETS.map((example) => (
            <button
              key={example.title}
              onClick={() => {
                onTicketTextChange(example.text);
                onAnalyze(example.text);
              }}
              disabled={isStreaming}
              className="text-left px-3 py-2.5 bg-arch-bg2 border border-arch-border rounded-lg text-xs text-arch-text2 hover:text-arch-text hover:border-arch-blue/30 hover:bg-arch-bg3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {example.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
