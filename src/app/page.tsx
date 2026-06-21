"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ArchitectureTab from "@/components/tabs/ArchitectureTab";

// Dynamic imports for all tabs except ArchitectureTab (default tab, loaded eagerly)
const UiPagesTab = dynamic(() => import("@/components/tabs/UiPagesTab"), { ssr: false });
const KafkaEventsTab = dynamic(() => import("@/components/tabs/KafkaEventsTab"), { ssr: false });
const ReferenceTab = dynamic(() => import("@/components/tabs/ReferenceTab"), { ssr: false });
const AiChatTab = dynamic(() => import("@/components/tabs/AiChatTab"), { ssr: false });
const LambdaFunctionsTab = dynamic(() => import("@/components/tabs/LambdaFunctionsTab"), { ssr: false });
const RepoExplorerTab = dynamic(() => import("@/components/tabs/RepoExplorerTab"), { ssr: false });
const FeatureFlagsTab = dynamic(() => import("@/components/tabs/FeatureFlagsTab"), { ssr: false });
const LearningsTab = dynamic(() => import("@/components/tabs/LearningsTab"), { ssr: false });
const ServicesTab = dynamic(() => import("@/components/tabs/ServicesTab"), { ssr: false });
const BsaCheatsheetTab = dynamic(() => import("@/components/tabs/BsaCheatsheetTab"), { ssr: false });
const InterviewCoachTab = dynamic(() => import("@/components/tabs/InterviewCoachTab"), { ssr: false });
const MicrofrontendsTab = dynamic(() => import("@/components/tabs/MicrofrontendsTab"), { ssr: false });
const ApigeeTab = dynamic(() => import("@/components/tabs/ApigeeTab"), { ssr: false });
const OpenApiTab = dynamic(() => import("@/components/tabs/OpenApiTab"), { ssr: false });
const ContractBuilderTab = dynamic(() => import("@/components/tabs/ContractBuilderTab"), { ssr: false });
const ChangeImpactTab = dynamic(() => import("@/components/tabs/ChangeImpactTab"), { ssr: false });
const RunbookManagerTab = dynamic(() => import("@/components/tabs/RunbookManagerTab"), { ssr: false });
const CodeReviewTab = dynamic(() => import("@/components/tabs/CodeReviewTab"), { ssr: false });
const SequenceDiagramTab = dynamic(() => import("@/components/tabs/SequenceDiagramTab"), { ssr: false });
const TestPlanTab = dynamic(() => import("@/components/tabs/TestPlanTab"), { ssr: false });

interface TabItem {
  id: string;
  label: string;
  href?: string;
}

interface TabGroup {
  label: string;
  tintClass: string;
  tabs: TabItem[];
}

const tabGroups: TabGroup[] = [
  {
    label: "Platform",
    tintClass: "tab-group-platform",
    tabs: [
      { id: "arch", label: "Architecture" },
      { id: "pages", label: "UI pages & flows" },
      { id: "events", label: "Kafka events" },
      { id: "lambdas", label: "Lambda functions" },
      { id: "services", label: "Services" },
      { id: "mfe", label: "Microfrontends" },
    ],
  },
  {
    label: "Reference",
    tintClass: "tab-group-reference",
    tabs: [
      { id: "repo", label: "Repo" },
      { id: "ref", label: "Reference" },
      { id: "flags", label: "Feature Flags" },
      { id: "learnings", label: "Learnings" },
    ],
  },
  {
    label: "Interview Prep",
    tintClass: "tab-group-interview",
    tabs: [
      { id: "bsa", label: "BSA Cheatsheet" },
      { id: "apigee", label: "Apigee" },
      { id: "openapi", label: "OpenAPI 3.0" },
      { id: "coach", label: "Interview Coach" },
    ],
  },
  {
    label: "Operations",
    tintClass: "tab-group-ops",
    tabs: [
      { id: "impact", label: "Change Impact" },
      { id: "runbooks", label: "Incident Runbooks" },
    ],
  },
  {
    label: "AI Tools",
    tintClass: "tab-group-ai",
    tabs: [
      { id: "analyze", label: "Ticket Analyzer", href: "/analyze" },
      { id: "contract", label: "API Contract Builder" },
      { id: "review", label: "Code Review" },
      { id: "sequence", label: "Sequence Diagrams" },
      { id: "testplan", label: "Test Plan" },
      { id: "ai", label: "AI Assistant" },
    ],
  },
  {
    label: "Saved",
    tintClass: "tab-group-reference",
    tabs: [
      { id: "saved-hub", label: "All Saved", href: "/saved" },
      { id: "analyses", label: "Saved Analyses", href: "/analyses" },
      { id: "chats", label: "Saved Chats", href: "/chats" },
    ],
  },
];

// All valid tab IDs (non-href tabs)
const ALL_TAB_IDS = tabGroups
  .flatMap((g) => g.tabs)
  .filter((t) => !t.href)
  .map((t) => t.id);

// Tab component mapping
const TAB_COMPONENTS: Record<string, React.ComponentType> = {
  arch: ArchitectureTab,
  pages: UiPagesTab,
  events: KafkaEventsTab,
  lambdas: LambdaFunctionsTab,
  repo: RepoExplorerTab,
  ref: ReferenceTab,
  flags: FeatureFlagsTab,
  learnings: LearningsTab,
  services: ServicesTab,
  mfe: MicrofrontendsTab,
  bsa: BsaCheatsheetTab,
  apigee: ApigeeTab,
  openapi: OpenApiTab,
  coach: InterviewCoachTab,
  contract: ContractBuilderTab,
  review: CodeReviewTab,
  sequence: SequenceDiagramTab,
  testplan: TestPlanTab,
  impact: ChangeImpactTab,
  runbooks: RunbookManagerTab,
  ai: AiChatTab,
};

function TabDropdown({
  group,
  activeTab,
  setActiveTab,
  animIndex,
}: {
  group: TabGroup;
  activeTab: string;
  setActiveTab: (id: string) => void;
  animIndex: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeChild = group.tabs.find((t) => !t.href && t.id === activeTab);
  const isGroupActive = !!activeChild;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        style={{ animationDelay: `${animIndex * 40}ms` }}
        className={`tab-item px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-0 flex items-center gap-1.5 transition-all duration-200 ${group.tintClass} ${
          isGroupActive
            ? "tab-item-active tab-group-active text-arch-blue"
            : "text-arch-text2 hover:text-arch-text"
        }`}
      >
        {isGroupActive ? `${group.label}: ${activeChild.label}` : group.label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="dropdown-panel absolute top-full left-0 mt-1 z-50 min-w-[210px] py-2 px-0.5 bg-arch-bg2/95 border border-arch-border rounded-lg shadow-lg shadow-black/20">
          {group.tabs.map((tab, i) =>
            tab.href ? (
              <Link
                key={tab.id}
                href={tab.href}
                className="dropdown-item block w-full text-left px-3.5 py-2 text-xs font-medium text-arch-text2 hover:text-arch-text hover:bg-arch-blue/[0.08] transition-colors duration-150"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => setOpen(false)}
              >
                {tab.label}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="inline-block ml-1.5 opacity-40"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </Link>
            ) : (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setOpen(false);
                }}
                className={`dropdown-item w-full text-left px-3.5 py-2 text-xs font-medium transition-colors duration-150 ${
                  activeTab === tab.id
                    ? "text-arch-blue bg-arch-blue/10"
                    : "text-arch-text2 hover:text-arch-text hover:bg-arch-blue/[0.08]"
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {tab.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize from URL param or default to "arch"
  const initialTab = searchParams.get("tab") || "arch";
  const [activeTab, setActiveTab] = useState(
    ALL_TAB_IDS.includes(initialTab) ? initialTab : "arch"
  );

  // Track visited tabs — once visited, stay mounted (preserves state)
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () => new Set([ALL_TAB_IDS.includes(initialTab) ? initialTab : "arch"])
  );

  const handleSetActiveTab = useCallback(
    (id: string) => {
      setActiveTab(id);
      setVisitedTabs((prev) => {
        if (prev.has(id)) return prev;
        return new Set(prev).add(id);
      });
      // Update URL without scroll
      router.replace(`/?tab=${id}`, { scroll: false });
    },
    [router]
  );

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex bg-arch-bg3 border-b border-arch-border tab-bar-enter">
        {tabGroups.map((group, i) => (
          <TabDropdown
            key={group.label}
            group={group}
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            animIndex={i}
          />
        ))}
        <div className="ml-auto flex items-center pr-3">
          <a
            href="https://go.dev/tour"
            target="_blank"
            rel="noopener noreferrer"
            className="tab-item flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-arch-blue/15 text-arch-blue border border-arch-blue/30 hover:bg-arch-blue/25 transition-colors whitespace-nowrap"
          >
            A Tour of Go
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {ALL_TAB_IDS.map((tabId) => {
          if (!visitedTabs.has(tabId)) return null;
          const Component = TAB_COMPONENTS[tabId];
          if (!Component) return null;
          return (
            <div
              key={tabId}
              className={activeTab === tabId ? "h-full" : "hidden"}
            >
              <Component />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-arch-blue/30 border-t-arch-blue rounded-full animate-spin" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
