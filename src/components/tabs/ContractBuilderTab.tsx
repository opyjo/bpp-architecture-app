"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useContractBuilder } from "@/lib/hooks/useContractBuilder";
import { useSavedSpecs } from "@/lib/hooks/useSavedSpecs";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import SwaggerViewer from "@/components/contract-builder/SwaggerViewer";
import CodeBlock from "@/components/ui/CodeBlock";
import SavedItemsPanel from "@/components/ui/SavedItemsPanel";
import ModelSelector from "@/components/ai/ModelSelector";
import { downloadAsMarkdown } from "@/lib/utils";
import { load as yamlLoad } from "js-yaml";
import { toast } from "sonner";
import type { SavedSpec } from "@/lib/types/saved-spec";
import {
  FileCode2,
  GitBranch,
  Plus,
  Copy,
  Download,
  Loader2,
  RotateCcw,
  Trash2,
  Search,
  FolderOpen,
  Check,
  ChevronRight,
  File,
  Save,
  BookOpen,
  ArrowLeft,
  Square,
} from "lucide-react";

type InputMode = "paste" | "github";
type OutputView = "swagger" | "yaml";
type ViewMode = "builder" | "saved";

interface HandlerFile {
  path: string;
  fileName: string;
  service: string;
  relativePath: string;
}

export default function ContractBuilderTab() {
  const {
    yamlOutput,
    parsedSpec,
    parseError,
    isGenerating,
    error,
    generate,
    stop,
    reset,
  } = useContractBuilder();

  const { fetchSpecs, saveSpec, deleteSpec } = useSavedSpecs();

  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [outputView, setOutputView] = useState<OutputView>("swagger");
  const [goCode, setGoCode] = useState("");
  const [githubPath, setGithubPath] = useState("");
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<string[]>([]);
  const [showAddFile, setShowAddFile] = useState(false);
  const [addFilePath, setAddFilePath] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("builder");
  const [savedSpecs, setSavedSpecs] = useState<SavedSpec[]>([]);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [activeSpecId, setActiveSpecId] = useState<string | null>(null);
  const [loadedSpec, setLoadedSpec] = useState<object | null>(null);
  const [loadedYaml, setLoadedYaml] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handler files state
  const [handlerFiles, setHandlerFiles] = useState<HandlerFile[]>([]);
  const [isLoadingHandlers, setIsLoadingHandlers] = useState(false);
  const [handlersLoaded, setHandlersLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHandler, setSelectedHandler] = useState<HandlerFile | null>(
    null
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set()
  );

  // Load saved specs
  const loadSavedSpecs = useCallback(async () => {
    setIsLoadingSpecs(true);
    try {
      const specs = await fetchSpecs();
      setSavedSpecs(specs);
    } catch {
      toast.error("Failed to load saved specs");
    } finally {
      setIsLoadingSpecs(false);
    }
  }, [fetchSpecs]);

  useEffect(() => {
    loadSavedSpecs();
  }, [loadSavedSpecs]);

  const handleSaveSpec = async () => {
    if (!yamlOutput.trim()) return;
    setIsSaving(true);
    try {
      const serviceName =
        selectedHandler?.service ||
        (githubPath ? githubPath.split("/").pop()?.replace(".go", "") : "") ||
        "manual";
      const title = parsedSpec
        ? (parsedSpec as { info?: { title?: string } }).info?.title ||
          `${serviceName} API`
        : `${serviceName} API`;

      const id = await saveSpec({
        title,
        service_name: serviceName,
        yaml_content: yamlOutput,
      });
      setActiveSpecId(id);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
      toast.success("Spec saved");
      await loadSavedSpecs();
    } catch {
      toast.error("Failed to save spec");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSpec = (spec: SavedSpec) => {
    setLoadedYaml(spec.yaml_content);
    try {
      const parsed = yamlLoad(spec.yaml_content);
      if (parsed && typeof parsed === "object") {
        setLoadedSpec(parsed as object);
      }
    } catch {
      setLoadedSpec(null);
    }
    setActiveSpecId(spec.id);
    setViewMode("builder");
  };

  const handleDeleteSpec = async (id: string) => {
    try {
      await deleteSpec(id);
      setSavedSpecs((prev) => prev.filter((s) => s.id !== id));
      if (activeSpecId === id) {
        setActiveSpecId(null);
        setLoadedSpec(null);
        setLoadedYaml("");
      }
      toast.success("Spec deleted");
    } catch {
      toast.error("Failed to delete spec");
    }
  };

  const handleBackToBuilder = () => {
    setLoadedSpec(null);
    setLoadedYaml("");
    setActiveSpecId(null);
  };

  // Determine what spec/yaml to display
  const displaySpec = loadedSpec || parsedSpec;
  const displayYaml = loadedYaml || yamlOutput;
  const isViewingLoaded = loadedSpec !== null;

  // Fetch handler files when switching to GitHub mode
  const fetchHandlers = useCallback(async () => {
    if (handlersLoaded || isLoadingHandlers) return;
    setIsLoadingHandlers(true);
    try {
      const res = await fetch("/api/github-handlers");
      const data = await res.json();
      if (res.ok && data.handlers) {
        setHandlerFiles(data.handlers);
        setHandlersLoaded(true);
      }
    } catch {
      toast.error("Failed to load handler files");
    } finally {
      setIsLoadingHandlers(false);
    }
  }, [handlersLoaded, isLoadingHandlers]);

  useEffect(() => {
    if (inputMode === "github") {
      fetchHandlers();
    }
  }, [inputMode, fetchHandlers]);

  // Filter handlers by search
  const filteredHandlers = handlerFiles.filter((h) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      h.service.toLowerCase().includes(q) ||
      h.fileName.toLowerCase().includes(q) ||
      h.relativePath.toLowerCase().includes(q)
    );
  });

  // Group by service
  const groupedHandlers = filteredHandlers.reduce<
    Record<string, HandlerFile[]>
  >((acc, h) => {
    const key = h.service || "root";
    if (!acc[key]) acc[key] = [];
    acc[key].push(h);
    return acc;
  }, {});

  const toggleGroup = (service: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(service)) {
        next.delete(service);
      } else {
        next.add(service);
      }
      return next;
    });
  };

  const handleSelectHandler = async (handler: HandlerFile) => {
    setSelectedHandler(handler);
    setGithubPath(handler.path);
    setLoadError(null);
    setIsLoadingFile(true);
    try {
      const res = await fetch("/api/github-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: handler.path }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "Failed to load file");
        return;
      }
      setGoCode(data.content);
    } catch {
      setLoadError("Failed to fetch file from GitHub");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleAddAdditionalFile = async () => {
    if (!addFilePath.trim()) return;
    setIsLoadingFile(true);
    try {
      const res = await fetch("/api/github-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: addFilePath.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdditionalFiles((prev) => [...prev, data.content]);
        setAddFilePath("");
        setShowAddFile(false);
      }
    } catch {
      toast.error("Failed to load additional file");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleGenerate = () => {
    if (!goCode.trim()) return;
    generate(goCode, {
      additionalFiles:
        additionalFiles.length > 0 ? additionalFiles : undefined,
      fileName: githubPath ? githubPath.split("/").pop() : undefined,
      modelId,
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayYaml);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([displayYaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "openapi-spec.yaml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasOutput = displayYaml.length > 0;
  const serviceCount = Object.keys(groupedHandlers).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          {isViewingLoaded && (
            <button
              onClick={handleBackToBuilder}
              className="text-arch-text3 hover:text-arch-text transition-colors mr-1"
              title="Back to builder"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-green to-arch-teal text-white flex items-center justify-center shrink-0">
            <FileCode2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-arch-text truncate">
            {isViewingLoaded ? "Saved Spec" : "API Contract Builder"}
          </span>
          <ModelSelector value={modelId} onChange={setModelId} disabled={isGenerating} />
          {isGenerating && (
            <span className="flex items-center gap-1.5 text-[11px] text-arch-teal">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating spec...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Saved specs toggle */}
          <button
            onClick={() => setViewMode(viewMode === "saved" ? "builder" : "saved")}
            className={`text-[11px] transition-colors px-2 py-1 rounded flex items-center gap-1 ${
              viewMode === "saved"
                ? "text-arch-blue bg-arch-blue/10"
                : "text-arch-text3 hover:text-arch-blue hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            Saved ({savedSpecs.length})
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
                onClick={handleSaveSpec}
                disabled={isSaving || !parsedSpec}
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
                onClick={handleDownload}
                className="text-[11px] text-arch-text3 hover:text-arch-teal transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                .yaml
              </button>
              <button
                onClick={() => downloadAsMarkdown(displayYaml, "api-spec.md")}
                className="text-[11px] text-arch-text3 hover:text-arch-teal transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                .md
              </button>
              <button
                onClick={() => { reset(); handleBackToBuilder(); }}
                className="text-[11px] text-arch-text3 hover:text-arch-coral transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </>
          )}
          {hasOutput && isViewingLoaded && (
            <>
              <button
                onClick={handleCopy}
                className="text-[11px] text-arch-text3 hover:text-arch-teal transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {copyFeedback ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                className="text-[11px] text-arch-text3 hover:text-arch-teal transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                .yaml
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error banner */}
      {(error || parseError) && (
        <div className="px-5 py-2 bg-arch-red/10 border-b border-arch-red/20 text-arch-red text-[12px]">
          {error || parseError}
        </div>
      )}

      {/* Main content: split panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Saved specs panel (overlay when active) */}
        {viewMode === "saved" && (
          <SavedItemsPanel<SavedSpec>
            items={savedSpecs}
            isLoading={isLoadingSpecs}
            activeId={activeSpecId}
            onSelect={handleLoadSpec}
            onDelete={handleDeleteSpec}
            emptyMessage="No saved specs yet"
            headerTitle="Saved API Specs"
            renderTitle={(s) => s.title}
            renderSubtitle={(s) => s.service_name}
            searchable
            searchFn={(s, q) =>
              s.title.toLowerCase().includes(q) ||
              s.service_name.toLowerCase().includes(q)
            }
          />
        )}

        {/* Left panel: input (hidden when viewing saved or loaded spec) */}
        {viewMode === "builder" && !isViewingLoaded && (
        <div className="w-[480px] shrink-0 flex flex-col border-r border-arch-border bg-arch-bg/50">
          {/* Input mode tabs */}
          <div className="flex border-b border-arch-border">
            <button
              onClick={() => setInputMode("paste")}
              className={`flex-1 px-4 py-2.5 text-[12px] font-medium flex items-center justify-center gap-2 transition-colors ${
                inputMode === "paste"
                  ? "text-arch-blue border-b-2 border-arch-blue bg-arch-blue/5"
                  : "text-arch-text3 hover:text-arch-text2"
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              Paste Code
            </button>
            <button
              onClick={() => setInputMode("github")}
              className={`flex-1 px-4 py-2.5 text-[12px] font-medium flex items-center justify-center gap-2 transition-colors ${
                inputMode === "github"
                  ? "text-arch-blue border-b-2 border-arch-blue bg-arch-blue/5"
                  : "text-arch-text3 hover:text-arch-text2"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              From GitHub
            </button>
          </div>

          {inputMode === "paste" ? (
            /* ── Paste mode ── */
            <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
              <textarea
                value={goCode}
                onChange={(e) => setGoCode(e.target.value)}
                placeholder="Paste your Go handler/router code here..."
                className="flex-1 min-h-[200px] resize-none bg-arch-bg2 border border-arch-border rounded-lg p-3 text-[12px] font-mono text-arch-text placeholder:text-arch-text3 focus:outline-none focus:border-arch-blue/50 transition-colors"
              />

              {/* Char count */}
              <div className={`text-[10px] font-mono ${goCode.length > 10000 ? "text-arch-coral" : "text-arch-text3"}`}>
                {goCode.length.toLocaleString()} chars
              </div>

              {/* Additional files */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-arch-text2">
                    Additional files ({additionalFiles.length})
                  </span>
                  <button
                    onClick={() => setShowAddFile(!showAddFile)}
                    className="text-[11px] text-arch-teal hover:text-arch-green flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add file
                  </button>
                </div>
                {showAddFile && (
                  <div className="flex gap-2">
                    <input
                      value={addFilePath}
                      onChange={(e) => setAddFilePath(e.target.value)}
                      placeholder="go-repo-new/.../models.go"
                      className="flex-1 bg-arch-bg2 border border-arch-border rounded-lg px-3 py-1.5 text-[11px] font-mono text-arch-text placeholder:text-arch-text3 focus:outline-none focus:border-arch-teal/50 transition-colors"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddAdditionalFile()
                      }
                    />
                    <button
                      onClick={handleAddAdditionalFile}
                      disabled={isLoadingFile}
                      className="px-2 py-1.5 bg-arch-teal/15 text-arch-teal text-[11px] font-medium rounded-lg border border-arch-teal/30 hover:bg-arch-teal/25 transition-colors disabled:opacity-40"
                    >
                      {isLoadingFile ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Load"
                      )}
                    </button>
                  </div>
                )}
                {additionalFiles.map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2 py-1.5 bg-arch-bg3 rounded text-[11px] text-arch-text2"
                  >
                    <span className="font-mono">Additional file {i + 1}</span>
                    <button
                      onClick={() =>
                        setAdditionalFiles((prev) =>
                          prev.filter((__, idx) => idx !== i)
                        )
                      }
                      className="text-arch-text3 hover:text-arch-coral transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !goCode.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-arch-green to-arch-teal text-white text-[12px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating OpenAPI Spec...
                  </>
                ) : (
                  <>
                    <FileCode2 className="w-3.5 h-3.5" />
                    Generate OpenAPI Spec
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ── GitHub browser mode ── */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search bar */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-2.5 bg-arch-bg2 border border-arch-border rounded-lg px-3 py-2.5 focus-within:border-arch-blue/40 transition-colors">
                  <Search className="w-4 h-4 text-arch-text3 shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search services or files..."
                    className="flex-1 bg-transparent text-[13px] text-arch-text placeholder:text-arch-text3 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-arch-text3 hover:text-arch-text2 transition-colors text-[11px]"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-arch-text3">
                    {isLoadingHandlers
                      ? "Loading..."
                      : `${filteredHandlers.length} handler files across ${serviceCount} services`}
                  </span>
                  {selectedHandler && (
                    <span className="text-[11px] text-arch-teal font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Selected
                    </span>
                  )}
                </div>
              </div>

              {/* File browser list */}
              <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-1">
                {isLoadingHandlers ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-arch-teal" />
                    <span className="text-[13px] text-arch-text3">
                      Loading handler files from repo...
                    </span>
                  </div>
                ) : serviceCount === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <FolderOpen className="w-8 h-8 text-arch-text3" />
                    <span className="text-[13px] text-arch-text3">
                      {searchQuery
                        ? "No matching handlers"
                        : "No handler files found"}
                    </span>
                  </div>
                ) : (
                  Object.entries(groupedHandlers).map(([service, files]) => {
                    const isCollapsed = !expandedGroups.has(service);
                    return (
                      <div
                        key={service}
                        className="rounded-lg border border-arch-border bg-arch-bg2/60 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleGroup(service)}
                          className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-arch-bg3/50 transition-colors"
                        >
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-arch-text3 transition-transform duration-200 ${
                              !isCollapsed ? "rotate-90" : ""
                            }`}
                          />
                          <FolderOpen className="w-4 h-4 text-arch-teal" />
                          <span className="text-[13px] font-semibold text-arch-text flex-1 text-left">
                            {service}
                          </span>
                          <span className="text-[11px] text-arch-text3 bg-arch-bg3 px-2 py-0.5 rounded-full">
                            {files.length}{" "}
                            {files.length === 1 ? "file" : "files"}
                          </span>
                        </button>

                        {!isCollapsed && (
                          <div className="border-t border-arch-border">
                            {files.map((h) => {
                              const isSelected =
                                selectedHandler?.path === h.path;
                              return (
                                <button
                                  key={h.path}
                                  onClick={() => handleSelectHandler(h)}
                                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-arch-border/50 last:border-b-0 ${
                                    isSelected
                                      ? "bg-arch-blue/8"
                                      : "hover:bg-arch-bg3/40"
                                  }`}
                                >
                                  <div
                                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? "bg-arch-teal/15"
                                        : "bg-arch-bg3"
                                    }`}
                                  >
                                    {isSelected ? (
                                      <Check className="w-3.5 h-3.5 text-arch-teal" />
                                    ) : (
                                      <File className="w-3.5 h-3.5 text-arch-text3" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`text-[13px] font-medium font-mono truncate ${
                                        isSelected
                                          ? "text-arch-teal"
                                          : "text-arch-text"
                                      }`}
                                    >
                                      {h.fileName}
                                    </div>
                                    <div className="text-[11px] text-arch-text3 truncate mt-0.5">
                                      {h.relativePath}
                                    </div>
                                  </div>

                                  {isSelected && isLoadingFile && (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-arch-teal shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom bar: selected file + generate */}
              <div className="border-t border-arch-border bg-arch-bg2/80 backdrop-blur-sm px-4 py-3 space-y-3">
                {loadError && (
                  <p className="text-[12px] text-arch-red">{loadError}</p>
                )}

                {selectedHandler && goCode && (
                  <div className="flex items-center gap-2 text-[12px]">
                    <Check className="w-3.5 h-3.5 text-arch-teal shrink-0" />
                    <span className="text-arch-text2 truncate">
                      <span className="text-arch-teal font-medium">
                        {selectedHandler.fileName}
                      </span>
                      <span className="text-arch-text3 mx-1.5">&middot;</span>
                      <span className="text-arch-text3">
                        {goCode.split("\n").length} lines loaded
                      </span>
                    </span>
                  </div>
                )}

                {/* Additional files */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-arch-text3">
                    Additional files ({additionalFiles.length})
                  </span>
                  <button
                    onClick={() => setShowAddFile(!showAddFile)}
                    className="text-[11px] text-arch-teal hover:text-arch-green flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                {showAddFile && (
                  <div className="flex gap-2">
                    <input
                      value={addFilePath}
                      onChange={(e) => setAddFilePath(e.target.value)}
                      placeholder="go-repo-new/.../models.go"
                      className="flex-1 bg-arch-bg3 border border-arch-border rounded-md px-2.5 py-1.5 text-[11px] font-mono text-arch-text placeholder:text-arch-text3 focus:outline-none focus:border-arch-teal/50 transition-colors"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddAdditionalFile()
                      }
                    />
                    <button
                      onClick={handleAddAdditionalFile}
                      disabled={isLoadingFile}
                      className="px-2.5 py-1.5 bg-arch-teal/15 text-arch-teal text-[11px] font-medium rounded-md border border-arch-teal/30 hover:bg-arch-teal/25 transition-colors disabled:opacity-40"
                    >
                      Load
                    </button>
                  </div>
                )}
                {additionalFiles.map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2 py-1 bg-arch-bg3 rounded text-[11px] text-arch-text2"
                  >
                    <span className="font-mono">
                      Additional file {i + 1}
                    </span>
                    <button
                      onClick={() =>
                        setAdditionalFiles((prev) =>
                          prev.filter((__, idx) => idx !== i)
                        )
                      }
                      className="text-arch-text3 hover:text-arch-coral transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !goCode.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-arch-green to-arch-teal text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating OpenAPI Spec...
                    </>
                  ) : (
                    <>
                      <FileCode2 className="w-4 h-4" />
                      Generate OpenAPI Spec
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Right panel: output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {hasOutput ? (
            <>
              {/* Output view tabs */}
              <div className="flex border-b border-arch-border bg-arch-bg/50">
                <button
                  onClick={() => setOutputView("swagger")}
                  className={`px-4 py-2 text-[11px] font-medium transition-colors ${
                    outputView === "swagger"
                      ? "text-arch-blue border-b-2 border-arch-blue bg-arch-blue/5"
                      : "text-arch-text3 hover:text-arch-text2"
                  }`}
                >
                  Swagger UI
                </button>
                <button
                  onClick={() => setOutputView("yaml")}
                  className={`px-4 py-2 text-[11px] font-medium transition-colors ${
                    outputView === "yaml"
                      ? "text-arch-blue border-b-2 border-arch-blue bg-arch-blue/5"
                      : "text-arch-text3 hover:text-arch-text2"
                  }`}
                >
                  Raw YAML
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
                {outputView === "swagger" ? (
                  displaySpec ? (
                    <SwaggerViewer spec={displaySpec} />
                  ) : isGenerating ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[12px] text-arch-text2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-arch-teal" />
                        Swagger UI will render after generation completes.
                        Showing raw YAML preview:
                      </div>
                      <pre className="text-[11px] font-mono text-arch-text2 whitespace-pre-wrap bg-arch-bg2 rounded-lg border border-arch-border p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {yamlOutput}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-[12px] text-arch-text3 text-center py-8">
                      {parseError
                        ? "Could not parse YAML. Switch to Raw YAML view to inspect."
                        : "No spec to display."}
                    </div>
                  )
                ) : (
                  <div className="relative">
                    <button
                      onClick={handleCopy}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                      title="Copy YAML"
                    >
                      {copyFeedback ? (
                        <Check className="w-3.5 h-3.5 text-arch-teal" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-arch-text3 group-hover:text-arch-text" />
                      )}
                    </button>
                    <CodeBlock language="yaml">{displayYaml}</CodeBlock>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-arch-green/20 to-arch-teal/20 flex items-center justify-center mx-auto">
                  <FileCode2 className="w-6 h-6 text-arch-teal" />
                </div>
                <h3 className="text-[13px] font-semibold text-arch-text">
                  Generate OpenAPI Specs from Go Code
                </h3>
                <p className="text-[11px] text-arch-text3 leading-relaxed">
                  Paste Go handler or router code (or load from GitHub), and
                  Claude AI will generate a complete OpenAPI 3.0 YAML
                  specification with interactive Swagger UI preview.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
