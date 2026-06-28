"use client";

import dynamic from "next/dynamic";

// Every tab is a client-only dynamic import (ssr: false), matching the app's
// prior behavior where tab content only ever rendered on the client. The route
// (`src/app/[tab]/page.tsx`) is responsible for validating the id before this
// renders, so an unknown id here is treated as a no-op.
const ArchitectureTab = dynamic(() => import("@/components/tabs/ArchitectureTab"), { ssr: false });
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
const CanadaLifeTab = dynamic(() => import("@/components/tabs/CanadaLifeTab"), { ssr: false });
const MockInterviewTab = dynamic(() => import("@/components/tabs/MockInterviewTab"), { ssr: false });
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
const TeleprompterTab = dynamic(() => import("@/components/tabs/TeleprompterTab"), { ssr: false });
const ChangePackageTab = dynamic(() => import("@/components/tabs/ChangePackageTab"), { ssr: false });
const DriftTab = dynamic(() => import("@/components/tabs/DriftTab"), { ssr: false });
const SystemMapTab = dynamic(() => import("@/components/tabs/SystemMapTab"), { ssr: false });
const RepoInsightsTab = dynamic(() => import("@/components/tabs/RepoInsightsTab"), { ssr: false });
const ApoartStoriesTab = dynamic(() => import("@/components/tabs/ApoartStoriesTab"), { ssr: false });
const SubscriptionFlowTab = dynamic(() => import("@/components/tabs/SubscriptionFlowTab"), { ssr: false });

// Tab id → component. Keys must match the non-href ids in `src/lib/tabs.ts`.
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
  canadalife: CanadaLifeTab,
  mock: MockInterviewTab,
  bsa: BsaCheatsheetTab,
  apigee: ApigeeTab,
  openapi: OpenApiTab,
  coach: InterviewCoachTab,
  teleprompter: TeleprompterTab,
  contract: ContractBuilderTab,
  review: CodeReviewTab,
  sequence: SequenceDiagramTab,
  testplan: TestPlanTab,
  impact: ChangeImpactTab,
  runbooks: RunbookManagerTab,
  ai: AiChatTab,
  pipeline: ChangePackageTab,
  drift: DriftTab,
  systemmap: SystemMapTab,
  insights: RepoInsightsTab,
  apoart: ApoartStoriesTab,
  subflow: SubscriptionFlowTab,
};

export default function TabHost({ tab }: { tab: string }) {
  const ActiveComponent = TAB_COMPONENTS[tab];
  if (!ActiveComponent) return null;
  return (
    <div className="flex-1 overflow-hidden">
      {/* `key` gives each route a fresh mount; navigating away unmounts the
          previous tab, so heavy components don't accumulate. */}
      <div key={tab} className="h-full">
        <ActiveComponent />
      </div>
    </div>
  );
}
