"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import ArchitectureTab from "@/components/tabs/ArchitectureTab";
import { ALL_TAB_IDS } from "@/lib/tabs";

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

function HomeContent() {
  const searchParams = useSearchParams();

  const initialTab = searchParams.get("tab") || "arch";
  const activeTab = ALL_TAB_IDS.includes(initialTab) ? initialTab : "arch";

  // Track visited tabs — once visited, stay mounted (preserves state)
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () => new Set([activeTab])
  );

  // Keep visitedTabs in sync when URL changes
  if (!visitedTabs.has(activeTab)) {
    setVisitedTabs((prev) => new Set(prev).add(activeTab));
  }

  return (
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
