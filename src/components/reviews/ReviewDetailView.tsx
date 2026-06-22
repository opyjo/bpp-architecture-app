"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSavedReviews } from "@/lib/hooks/useSavedReviews";
import type { SavedReview } from "@/lib/types/saved-review";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import SyntaxHighlighter from "@/components/ui/SyntaxHighlighter";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import { downloadAsMarkdown } from "@/lib/utils";
import { toast } from "sonner";
import {
  Code2,
  Copy,
  CheckCheck,
  Download,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default function ReviewDetailView({ reviewId }: { reviewId: string }) {
  const { getReview } = useSavedReviews();
  const [review, setReview] = useState<SavedReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReview(reviewId)
      .then((data) => setReview(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reviewId, getReview]);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 bg-arch-bg">
        <div className="w-5 h-5 border-2 border-arch-purple/30 border-t-arch-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-arch-bg text-arch-text3 gap-3">
        <p className="text-[13px]">Code review not found</p>
        <Link href="/saved" className="text-[12px] text-arch-purple hover:underline">
          Back to saved items
        </Link>
      </div>
    );
  }

  return <ReviewDetailInner review={review} />;
}

function ReviewDetailInner({ review }: { review: SavedReview }) {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(review.review_content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [review.review_content]);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-arch-bg">
      <Breadcrumbs dynamicLabel={review.title} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-purple to-arch-blue text-white flex items-center justify-center shrink-0">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-arch-text truncate">
            {review.title}
          </span>
          {review.language && (
            <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-arch-purple/10 border border-arch-purple/20 text-arch-purple shrink-0">
              {review.language}
            </span>
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
            onClick={() => downloadAsMarkdown(review.review_content, "code-review.md")}
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
          {review.focus_areas?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {review.focus_areas.map((area) => (
                <span
                  key={area}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-arch-purple/10 text-arch-purple border border-arch-purple/20"
                >
                  {area}
                </span>
              ))}
            </div>
          )}

          {review.code_snippet && (
            <div className="rounded-lg border border-arch-border bg-arch-bg2/60 overflow-hidden">
              <button
                onClick={() => setShowCode((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-arch-bg3/30 transition-colors"
              >
                <h3 className="text-[12px] font-semibold text-arch-text flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-arch-purple" />
                  Reviewed Code
                </h3>
                {showCode ? (
                  <ChevronDown className="w-3.5 h-3.5 text-arch-text3" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-arch-text3" />
                )}
              </button>
              {showCode && (
                <div className="px-4 pb-4 border-t border-arch-border pt-3">
                  <SyntaxHighlighter
                    code={review.code_snippet}
                    language={review.language}
                  />
                </div>
              )}
            </div>
          )}

          <MarkdownRenderer content={review.review_content} />
        </div>
      </div>
    </div>
  );
}
