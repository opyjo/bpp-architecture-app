"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSavedRunbooks } from "@/lib/hooks/useSavedRunbooks";
import type { SavedRunbook } from "@/lib/types/saved-runbook";
import { severityColors } from "@/data/runbooks";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import RunbookExecution from "@/components/runbooks/RunbookExecution";
import {
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Shield,
  Activity,
} from "lucide-react";

export default function RunbookDetailView({ runbookId }: { runbookId: string }) {
  const { getRunbook } = useSavedRunbooks();
  const [runbook, setRunbook] = useState<SavedRunbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    getRunbook(runbookId)
      .then((data) => setRunbook(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [runbookId, getRunbook]);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 bg-arch-bg">
        <div className="w-5 h-5 border-2 border-arch-coral/30 border-t-arch-coral rounded-full animate-spin" />
      </div>
    );
  }

  if (!runbook) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-arch-bg text-arch-text3 gap-3">
        <p className="text-[13px]">Runbook not found</p>
        <Link href="/saved" className="text-[12px] text-arch-coral hover:underline">
          Back to saved items
        </Link>
      </div>
    );
  }

  const rb = runbook.content;

  if (executing) {
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-arch-bg">
        <Breadcrumbs dynamicLabel={runbook.title} />
        <RunbookExecution runbook={rb} onClose={() => setExecuting(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-arch-bg">
      <Breadcrumbs dynamicLabel={runbook.title} />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-red to-arch-coral text-white flex items-center justify-center shrink-0">
          <Shield className="w-3.5 h-3.5" />
        </div>
        <span className="text-[13px] font-semibold text-arch-text truncate">
          {runbook.title}
        </span>
        <button
          onClick={() => setExecuting(true)}
          className="ml-auto flex items-center gap-1.5 shrink-0 text-[11px] font-semibold text-white px-3 py-1.5 rounded-lg bg-gradient-to-r from-arch-red to-arch-coral hover:opacity-90 active:translate-y-px transition-all shadow-sm"
        >
          <Activity className="w-3.5 h-3.5" />
          Start incident
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-4 max-w-3xl mx-auto">
          {/* Severity + ETA */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded bg-${severityColors[rb.severity]}/15 text-${severityColors[rb.severity]}`}
              >
                {rb.severity}
              </span>
              {rb.estimatedResolutionTime && (
                <span className="flex items-center gap-1 text-[10px] text-arch-text3">
                  <Clock className="w-3 h-3" />
                  {rb.estimatedResolutionTime}
                </span>
              )}
            </div>
            <p className="text-[12px] text-arch-text2 leading-relaxed">
              {rb.description}
            </p>
          </div>

          {/* Affected services */}
          {rb.affectedServices?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {rb.affectedServices.map((s) => (
                <span
                  key={s}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-arch-blue/10 text-arch-blue border border-arch-blue/20"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Symptoms */}
          {rb.symptoms?.length > 0 && (
            <div className="rounded-lg border border-arch-border bg-arch-bg2/60 p-4">
              <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-arch-amber" />
                Symptoms
              </h3>
              <ul className="space-y-1.5">
                {rb.symptoms.map((s, i) => (
                  <li key={i} className="text-[11px] text-arch-text2 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-arch-amber/60 mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resolution steps */}
          {rb.resolutionSteps?.length > 0 && (
            <div className="rounded-lg border border-arch-border bg-arch-bg2/60 p-4">
              <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5 mb-3">
                <ArrowUpRight className="w-3.5 h-3.5 text-arch-green" />
                Resolution Steps ({rb.resolutionSteps.length})
              </h3>
              <ol className="space-y-2">
                {rb.resolutionSteps.map((step, i) => (
                  <li key={i} className="text-[11px] text-arch-text2 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-arch-green/10 text-arch-green text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Rollback steps */}
          {rb.rollbackSteps?.length > 0 && (
            <div className="rounded-lg border border-arch-border bg-arch-bg2/60 p-4">
              <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-arch-coral" />
                Rollback Steps ({rb.rollbackSteps.length})
              </h3>
              <ul className="space-y-1.5">
                {rb.rollbackSteps.map((step, i) => (
                  <li key={i} className="text-[11px] text-arch-text2 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-arch-coral/60 mt-1.5 shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Escalation */}
          {rb.escalationPath && (
            <div className="rounded-lg border border-arch-border bg-arch-bg2/60 p-4">
              <h3 className="text-[12px] font-semibold text-arch-text mb-1.5">
                Escalation Path
              </h3>
              <p className="text-[11px] text-arch-text2">{rb.escalationPath}</p>
            </div>
          )}

          {/* Related Kafka events */}
          {rb.relatedKafkaEvents && rb.relatedKafkaEvents.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-arch-text3 mr-1">Related events:</span>
              {rb.relatedKafkaEvents.map((e) => (
                <span
                  key={e}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-arch-purple/10 text-arch-purple font-mono"
                >
                  {e}
                </span>
              ))}
            </div>
          )}

          {/* Tags */}
          {rb.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {rb.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-arch-bg3 text-arch-text3"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
