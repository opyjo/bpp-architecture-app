"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTestPlanGenerator } from "@/lib/hooks/useTestPlanGenerator";
import { useSavedTestPlans } from "@/lib/hooks/useSavedTestPlans";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import SavedItemsPanel from "@/components/ui/SavedItemsPanel";
import ModelSelector from "@/components/ai/ModelSelector";
import { downloadAsMarkdown } from "@/lib/utils";
import { toast } from "sonner";
import type { SavedTestPlan } from "@/lib/types/saved-test-plan";
import {
  ClipboardCheck,
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

type TestType =
  | "functional"
  | "integration"
  | "edge_cases"
  | "performance"
  | "security";

const TEST_TYPE_OPTIONS: { id: TestType; label: string }[] = [
  { id: "functional", label: "Functional" },
  { id: "integration", label: "Integration" },
  { id: "edge_cases", label: "Edge Cases" },
  { id: "performance", label: "Performance" },
  { id: "security", label: "Security" },
];

type ViewMode = "generator" | "saved";

export default function TestPlanTab() {
  const { planOutput, isGenerating, error, generate, stop, reset } =
    useTestPlanGenerator();
  const { fetchTestPlans, saveTestPlan, deleteTestPlan } =
    useSavedTestPlans();

  const [requirement, setRequirement] = useState("");
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("generator");
  const [savedPlans, setSavedPlans] = useState<SavedTestPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [loadedPlan, setLoadedPlan] = useState<SavedTestPlan | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSavedPlans = useCallback(async () => {
    setIsLoadingPlans(true);
    try {
      const plans = await fetchTestPlans();
      setSavedPlans(plans);
    } catch {
      toast.error("Failed to load saved test plans");
    } finally {
      setIsLoadingPlans(false);
    }
  }, [fetchTestPlans]);

  useEffect(() => {
    loadSavedPlans();
  }, [loadSavedPlans]);

  const toggleTestType = (type: TestType) => {
    setTestTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleGenerate = () => {
    if (!requirement.trim()) return;
    generate(requirement, testTypes, modelId);
  };

  const handleCopy = async () => {
    const content = loadedPlan?.plan_content || planOutput;
    try {
      await navigator.clipboard.writeText(content);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleSave = async () => {
    if (!planOutput.trim()) return;
    setIsSaving(true);
    try {
      const title = `Test Plan: ${requirement.split("\n")[0]?.slice(0, 40) || "Untitled"}`;
      await saveTestPlan({
        title,
        requirement,
        plan_content: planOutput,
        test_types: testTypes,
      });
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
      toast.success("Test plan saved");
      await loadSavedPlans();
    } catch {
      toast.error("Failed to save test plan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadPlan = (p: SavedTestPlan) => {
    setLoadedPlan(p);
    setViewMode("generator");
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await deleteTestPlan(id);
      setSavedPlans((prev) => prev.filter((p) => p.id !== id));
      if (loadedPlan?.id === id) setLoadedPlan(null);
      toast.success("Test plan deleted");
    } catch {
      toast.error("Failed to delete test plan");
    }
  };

  const handleBack = () => {
    setLoadedPlan(null);
  };

  const displayContent = loadedPlan?.plan_content || planOutput;
  const hasOutput = displayContent.length > 0;
  const isViewingLoaded = loadedPlan !== null;

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
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-green to-arch-teal text-white flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-arch-text truncate">
            {isViewingLoaded ? "Saved Test Plan" : "Test Plan Generator"}
          </span>
          <ModelSelector value={modelId} onChange={setModelId} disabled={isGenerating} />
          {isGenerating && (
            <span className="flex items-center gap-1.5 text-[11px] text-arch-green">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setViewMode(viewMode === "saved" ? "generator" : "saved")
            }
            className={`text-[11px] transition-colors px-2 py-1 rounded flex items-center gap-1 ${
              viewMode === "saved"
                ? "text-arch-blue bg-arch-blue/10"
                : "text-arch-text3 hover:text-arch-blue hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            Saved ({savedPlans.length})
          </button>
          {isGenerating && (
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
                onClick={() => downloadAsMarkdown(displayContent, "test-plan.md")}
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
        {/* Saved plans panel */}
        {viewMode === "saved" && (
          <SavedItemsPanel<SavedTestPlan>
            items={savedPlans}
            isLoading={isLoadingPlans}
            activeId={loadedPlan?.id}
            onSelect={handleLoadPlan}
            onDelete={handleDeletePlan}
            emptyMessage="No saved test plans yet"
            headerTitle="Saved Test Plans"
            renderTitle={(p) => p.title}
            renderSubtitle={(p) => p.test_types?.join(", ") || "all types"}
            searchable
            searchFn={(p, q) =>
              p.title.toLowerCase().includes(q) ||
              (p.test_types?.join(", ") || "").toLowerCase().includes(q)
            }
          />
        )}

        {/* Left panel: input (hidden when viewing saved) */}
        {viewMode === "generator" && !isViewingLoaded && (
          <div className="w-[480px] shrink-0 flex flex-col border-r border-arch-border bg-arch-bg/50 overflow-hidden">
            <div className="flex flex-col p-4 gap-3 overflow-y-auto">
              {/* Test type selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-arch-text2">
                  Test Types
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TEST_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => toggleTestType(opt.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                        testTypes.includes(opt.id)
                          ? "bg-arch-green/10 text-arch-green border border-arch-green/30"
                          : "bg-arch-bg2 text-arch-text3 border border-arch-border hover:text-arch-text2"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Requirement textarea */}
              <textarea
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="Paste your requirement, user story, or specification here..."
                className="h-[200px] resize-none bg-arch-bg2 border border-arch-border rounded-lg p-3 text-[12px] font-mono text-arch-text placeholder:text-arch-text3 focus:outline-none focus:border-arch-green/50 transition-colors"
              />

              {/* Char count */}
              <div className={`text-[10px] font-mono ${requirement.length > 10000 ? "text-arch-coral" : "text-arch-text3"}`}>
                {requirement.length.toLocaleString()} chars
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !requirement.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-arch-green to-arch-teal text-white text-[12px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating Test Plan...
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    Generate Test Plan
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
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-arch-green/20 to-arch-teal/20 flex items-center justify-center mx-auto">
                  <ClipboardCheck className="w-6 h-6 text-arch-green" />
                </div>
                <h3 className="text-[13px] font-semibold text-arch-text">
                  AI Test Plan Generator
                </h3>
                <p className="text-[11px] text-arch-text3 leading-relaxed">
                  Paste a requirement, user story, or specification to generate
                  a comprehensive test plan with test scenarios, execution
                  matrix, and edge cases.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
