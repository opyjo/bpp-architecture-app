"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useCodeReview } from "@/lib/hooks/useCodeReview";
import { useSavedReviews } from "@/lib/hooks/useSavedReviews";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import type { SavedReview } from "@/lib/types/saved-review";
import {
  Code2,
  Copy,
  Save,
  Loader2,
  RotateCcw,
  Check,
  BookOpen,
  Trash2,
  Clock,
  ArrowLeft,
} from "lucide-react";

type FocusArea =
  | "architecture"
  | "error_handling"
  | "testing"
  | "performance"
  | "security";

const FOCUS_OPTIONS: { id: FocusArea; label: string }[] = [
  { id: "architecture", label: "Architecture" },
  { id: "error_handling", label: "Error Handling" },
  { id: "testing", label: "Testing" },
  { id: "performance", label: "Performance" },
  { id: "security", label: "Security" },
];

const LANGUAGES = [
  { id: "go", label: "Go" },
  { id: "typescript", label: "TypeScript" },
  { id: "yaml", label: "YAML" },
];

type ViewMode = "reviewer" | "saved";

export default function CodeReviewTab() {
  const { reviewOutput, isReviewing, error, review, reset } = useCodeReview();
  const { fetchReviews, saveReview, deleteReview } = useSavedReviews();

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("go");
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("reviewer");
  const [savedReviews, setSavedReviews] = useState<SavedReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [loadedReview, setLoadedReview] = useState<SavedReview | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSavedReviews = useCallback(async () => {
    setIsLoadingReviews(true);
    try {
      const reviews = await fetchReviews();
      setSavedReviews(reviews);
    } catch {
      // silently fail
    } finally {
      setIsLoadingReviews(false);
    }
  }, [fetchReviews]);

  useEffect(() => {
    loadSavedReviews();
  }, [loadSavedReviews]);

  const toggleFocus = (area: FocusArea) => {
    setFocusAreas((prev) =>
      prev.includes(area)
        ? prev.filter((a) => a !== area)
        : [...prev, area]
    );
  };

  const handleReview = () => {
    if (!code.trim()) return;
    review(code, focusAreas, language);
  };

  const handleCopy = async () => {
    const content = loadedReview?.review_content || reviewOutput;
    try {
      await navigator.clipboard.writeText(content);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // copy failed
    }
  };

  const handleSave = async () => {
    if (!reviewOutput.trim()) return;
    setIsSaving(true);
    try {
      const title = `Review: ${code.split("\n")[0]?.slice(0, 40) || "Untitled"}`;
      await saveReview({
        title,
        code_snippet: code,
        review_content: reviewOutput,
        focus_areas: focusAreas,
        language,
      });
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
      await loadSavedReviews();
    } catch {
      // save failed
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadReview = (r: SavedReview) => {
    setLoadedReview(r);
    setViewMode("reviewer");
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await deleteReview(id);
      setSavedReviews((prev) => prev.filter((r) => r.id !== id));
      if (loadedReview?.id === id) setLoadedReview(null);
    } catch {
      // delete failed
    }
  };

  const handleBack = () => {
    setLoadedReview(null);
  };

  const displayContent = loadedReview?.review_content || reviewOutput;
  const hasOutput = displayContent.length > 0;
  const isViewingLoaded = loadedReview !== null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          {isViewingLoaded && (
            <button
              onClick={handleBack}
              className="text-arch-text3 hover:text-arch-text transition-colors mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-purple to-arch-blue text-white flex items-center justify-center shrink-0">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-arch-text truncate">
            {isViewingLoaded ? "Saved Review" : "Code Review"}
          </span>
          {isReviewing && (
            <span className="flex items-center gap-1.5 text-[11px] text-arch-purple">
              <Loader2 className="w-3 h-3 animate-spin" />
              Reviewing...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setViewMode(viewMode === "saved" ? "reviewer" : "saved")
            }
            className={`text-[11px] transition-colors px-2 py-1 rounded flex items-center gap-1 ${
              viewMode === "saved"
                ? "text-arch-blue bg-arch-blue/10"
                : "text-arch-text3 hover:text-arch-blue hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            Saved ({savedReviews.length})
          </button>
          {hasOutput && !isViewingLoaded && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="text-[11px] text-arch-text3 hover:text-arch-green transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1 disabled:opacity-40"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : saveFeedback ? (
                  <Check className="w-3 h-3 text-arch-green" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                {saveFeedback ? "Saved!" : "Save"}
              </button>
              <button
                onClick={handleCopy}
                className="text-[11px] text-arch-text3 hover:text-arch-teal transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copyFeedback ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => {
                  reset();
                  handleBack();
                }}
                className="text-[11px] text-arch-text3 hover:text-arch-coral transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </>
          )}
          {hasOutput && isViewingLoaded && (
            <button
              onClick={handleCopy}
              className="text-[11px] text-arch-text3 hover:text-arch-teal transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copyFeedback ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-5 py-2 bg-arch-red/10 border-b border-arch-red/20 text-arch-red text-[12px]">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Saved reviews panel */}
        {viewMode === "saved" && (
          <div className="w-[400px] shrink-0 flex flex-col border-r border-arch-border bg-arch-bg/50">
            <div className="px-4 pt-4 pb-3 border-b border-arch-border">
              <h3 className="text-[13px] font-semibold text-arch-text flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-arch-blue" />
                Saved Reviews
              </h3>
              <p className="text-[11px] text-arch-text3 mt-1">
                {savedReviews.length} saved review
                {savedReviews.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoadingReviews ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-arch-blue" />
                  <span className="text-[13px] text-arch-text3">
                    Loading saved reviews...
                  </span>
                </div>
              ) : savedReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <BookOpen className="w-8 h-8 text-arch-text3" />
                  <span className="text-[13px] text-arch-text3">
                    No saved reviews yet
                  </span>
                </div>
              ) : (
                savedReviews.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleLoadReview(r)}
                    className={`rounded-lg border transition-colors cursor-pointer group ${
                      loadedReview?.id === r.id
                        ? "border-arch-blue/40 bg-arch-blue/5"
                        : "border-arch-border bg-arch-bg2/60 hover:bg-arch-bg2"
                    }`}
                  >
                    <div className="w-full text-left px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium text-arch-text truncate">
                            {r.title}
                          </div>
                          <div className="text-[11px] text-arch-purple font-mono mt-0.5">
                            {r.language}
                          </div>
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-arch-text3">
                            <Clock className="w-3 h-3" />
                            {new Date(r.updated_at).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReview(r.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-arch-text3 hover:text-arch-coral transition-all p-1 rounded hover:bg-arch-coral/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Left panel: input (hidden when viewing saved) */}
        {viewMode === "reviewer" && !isViewingLoaded && (
          <div className="w-[480px] shrink-0 flex flex-col border-r border-arch-border bg-arch-bg/50">
            <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
              {/* Language selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-arch-text2">
                  Language
                </label>
                <div className="flex gap-1.5">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setLanguage(lang.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                        language === lang.id
                          ? "bg-arch-purple/10 text-arch-purple border border-arch-purple/30"
                          : "bg-arch-bg2 text-arch-text3 border border-arch-border hover:text-arch-text2"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus areas */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-arch-text2">
                  Focus Areas
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FOCUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => toggleFocus(opt.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                        focusAreas.includes(opt.id)
                          ? "bg-arch-blue/10 text-arch-blue border border-arch-blue/30"
                          : "bg-arch-bg2 text-arch-text3 border border-arch-border hover:text-arch-text2"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code textarea */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`Paste your ${LANGUAGES.find((l) => l.id === language)?.label || ""} code here...`}
                className="flex-1 min-h-[200px] resize-none bg-arch-bg2 border border-arch-border rounded-lg p-3 text-[12px] font-mono text-arch-text placeholder:text-arch-text3 focus:outline-none focus:border-arch-purple/50 transition-colors"
              />

              {/* Review button */}
              <button
                onClick={handleReview}
                disabled={isReviewing || !code.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-arch-purple to-arch-blue text-white text-[12px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isReviewing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Reviewing Code...
                  </>
                ) : (
                  <>
                    <Code2 className="w-3.5 h-3.5" />
                    Review Code
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Right panel: output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {hasOutput ? (
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
              <MarkdownRenderer content={displayContent} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-arch-purple/20 to-arch-blue/20 flex items-center justify-center mx-auto">
                  <Code2 className="w-6 h-6 text-arch-purple" />
                </div>
                <h3 className="text-[13px] font-semibold text-arch-text">
                  AI-Powered Code Review
                </h3>
                <p className="text-[11px] text-arch-text3 leading-relaxed">
                  Paste Go or TypeScript code to get a detailed review covering
                  architecture, error handling, security, performance, and
                  platform-specific patterns.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
