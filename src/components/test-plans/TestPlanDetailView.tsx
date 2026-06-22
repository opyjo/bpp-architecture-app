"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSavedTestPlans } from "@/lib/hooks/useSavedTestPlans";
import type { SavedTestPlan } from "@/lib/types/saved-test-plan";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import { downloadAsMarkdown } from "@/lib/utils";
import { toast } from "sonner";
import { ClipboardCheck, Copy, CheckCheck, Download } from "lucide-react";

export default function TestPlanDetailView({ planId }: { planId: string }) {
  const { getTestPlan } = useSavedTestPlans();
  const [plan, setPlan] = useState<SavedTestPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTestPlan(planId)
      .then((data) => setPlan(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [planId, getTestPlan]);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 bg-arch-bg">
        <div className="w-5 h-5 border-2 border-arch-green/30 border-t-arch-green rounded-full animate-spin" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-arch-bg text-arch-text3 gap-3">
        <p className="text-[13px]">Test plan not found</p>
        <Link href="/saved" className="text-[12px] text-arch-green hover:underline">
          Back to saved items
        </Link>
      </div>
    );
  }

  return <TestPlanDetailInner plan={plan} />;
}

function TestPlanDetailInner({ plan }: { plan: SavedTestPlan }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(plan.plan_content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [plan.plan_content]);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-arch-bg">
      <Breadcrumbs dynamicLabel={plan.title} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-green to-arch-teal text-white flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-arch-text truncate">
            {plan.title}
          </span>
          {plan.test_types?.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              {plan.test_types.map((t) => (
                <span
                  key={t}
                  className="text-[9.5px] font-medium px-1.5 py-0.5 rounded-full bg-arch-green/10 text-arch-green border border-arch-green/20"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-arch-text2 hover:text-arch-text bg-arch-bg3 hover:bg-white/[0.08] border border-arch-border rounded-lg transition-colors"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-arch-green" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={() => downloadAsMarkdown(plan.plan_content, "test-plan.md")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-arch-text2 hover:text-arch-text bg-arch-bg3 hover:bg-white/[0.08] border border-arch-border rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            .md
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-5 py-4 space-y-4">
          {plan.requirement && (
            <div className="rounded-lg border border-arch-border bg-arch-bg2/60 p-4">
              <h3 className="text-[11px] font-semibold text-arch-text3 uppercase tracking-wide mb-1.5">
                Requirement
              </h3>
              <p className="text-[11.5px] text-arch-text2 leading-[1.7] whitespace-pre-wrap">
                {plan.requirement}
              </p>
            </div>
          )}
          <MarkdownRenderer content={plan.plan_content} />
        </div>
      </div>
    </div>
  );
}
