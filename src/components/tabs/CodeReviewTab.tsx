"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useCodeReview } from "@/lib/hooks/useCodeReview";
import { useSavedReviews } from "@/lib/hooks/useSavedReviews";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import SavedItemsPanel from "@/components/ui/SavedItemsPanel";
import ModelSelector from "@/components/ai/ModelSelector";
import { downloadAsMarkdown } from "@/lib/utils";
import { toast } from "sonner";
import type { SavedReview } from "@/lib/types/saved-review";
import {
  Code2,
  Copy,
  Save,
  Loader2,
  RotateCcw,
  Check,
  BookOpen,
  ArrowLeft,
  Square,
  Download,
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
  const { reviewOutput, isReviewing, error, review, stop, reset } = useCodeReview();
  const { fetchReviews, saveReview, deleteReview } = useSavedReviews();

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("go");
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
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
      toast.error("Failed to load saved reviews");
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
    review(code, focusAreas, language, modelId);
  };

  const handleCopy = async () => {
    const content = loadedReview?.review_content || reviewOutput;
    try {
      await navigator.clipboard.writeText(content);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
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
      toast.success("Review saved");
      await loadSavedReviews();
    } catch {
      toast.error("Failed to save review");
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
      toast.success("Review deleted");
    } catch {
      toast.error("Failed to delete review");
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
          <ModelSelector value={modelId} onChange={setModelId} disabled={isReviewing} />
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
          {isReviewing && (
            <button
              onClick={stop}
              className="text-[11px] text-arch-coral hover:text-arch-coral/80 transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
            >
              <Square className="w-3 h-3 fill-current" />
              Stop
            </button>
          )}
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
                onClick={() => downloadAsMarkdown(displayContent, "code-review.md")}
                className="text-[11px] text-arch-text3 hover:text-arch-teal transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                .md
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
          <SavedItemsPanel<SavedReview>
            items={savedReviews}
            isLoading={isLoadingReviews}
            activeId={loadedReview?.id}
            onSelect={handleLoadReview}
            onDelete={handleDeleteReview}
            emptyMessage="No saved reviews yet"
            headerTitle="Saved Reviews"
            renderTitle={(r) => r.title}
            renderSubtitle={(r) => r.language}
            searchable
            searchFn={(r, q) =>
              r.title.toLowerCase().includes(q) ||
              r.language.toLowerCase().includes(q)
            }
          />
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

              {/* Char count */}
              <div className={`text-[10px] font-mono ${code.length > 10000 ? "text-arch-coral" : "text-arch-text3"}`}>
                {code.length.toLocaleString()} chars
              </div>

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
