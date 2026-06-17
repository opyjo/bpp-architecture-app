// ── Feature Flag Systems ────────────────────────────────────────────

export interface FeatureFlagSystem {
  name: string;
  side: "client" | "server";
  sdk: string;
  protocol: string;
  storage: string;
  endpoint: string;
  color: "purple" | "teal";
  description: string;
  details: { label: string; value: string }[];
}

export const featureFlagSystems: FeatureFlagSystem[] = [
  {
    name: "Unleash",
    side: "client",
    sdk: "Unleash Proxy Client (React SDK)",
    protocol: "REST (polling)",
    storage: "GitLab feature flags (backed by Unleash)",
    endpoint: "https://...gitlab.../feature_flags/unleash/46450",
    color: "purple",
    description:
      "Client-side feature flags evaluated in the browser. The React SDK polls the Unleash proxy for flag state and caches results locally. Used to show/hide UI elements, toggle experimental flows, and control what the user sees without a redeploy.",
    details: [
      { label: "SDK", value: "unleash-proxy-client-react" },
      { label: "Protocol", value: "REST with polling interval (~15s)" },
      { label: "Storage", value: "GitLab → Unleash server → Proxy" },
      { label: "Evaluation", value: "Client-side (browser)" },
      { label: "Fallback", value: "Flags default to OFF when proxy is unreachable" },
    ],
  },
  {
    name: "Go Feature Flags",
    side: "server",
    sdk: "OpenFeature Go SDK + GOFF provider",
    protocol: "gRPC / REST",
    storage: "YAML/JSON config files (Git-managed)",
    endpoint: "feature-flag.app-gateway.hts-dev.cac1.aws.int.bell.ca",
    color: "teal",
    description:
      "Server-side feature flags evaluated inside Go microservices using the OpenFeature standard SDK. The GOFF relay proxy reads flag definitions from Git-managed config files and exposes them via gRPC. Used for business logic gating, gradual rollouts, and ops toggles.",
    details: [
      { label: "SDK", value: "OpenFeature Go SDK + go-feature-flag provider" },
      { label: "Protocol", value: "gRPC (primary) / REST (fallback)" },
      { label: "Storage", value: "YAML config in Git → GOFF relay proxy" },
      { label: "Evaluation", value: "Server-side (Go services)" },
      { label: "Fallback", value: "Default value returned when relay proxy is down" },
    ],
  },
];

// ── Flag Lifecycle ──────────────────────────────────────────────────

export interface LifecycleStep {
  num: number;
  title: string;
  description: string;
  who: string;
  tools: string;
}

export const flagLifecycleSteps: LifecycleStep[] = [
  {
    num: 1,
    title: "Create flag",
    description: "Define the flag name, type (boolean/string/number), and default value in the flag management system (GitLab for Unleash, YAML for GOFF).",
    who: "Developer",
    tools: "GitLab UI / YAML config",
  },
  {
    num: 2,
    title: "Configure targeting",
    description: "Set up targeting rules: percentage rollouts, user segments, account types, regions, or environments.",
    who: "Developer / PM",
    tools: "GitLab UI / YAML rules",
  },
  {
    num: 3,
    title: "Deploy code",
    description: "Ship application code that checks the flag value. The flag starts OFF in production, so the new code path is safely hidden.",
    who: "Developer",
    tools: "Git / CI pipeline",
  },
  {
    num: 4,
    title: "Evaluate at runtime",
    description: "The SDK evaluates the flag at runtime. Client-side: Unleash proxy polls for state. Server-side: OpenFeature SDK queries the GOFF relay proxy.",
    who: "System",
    tools: "Unleash SDK / OpenFeature SDK",
  },
  {
    num: 5,
    title: "Roll out gradually",
    description: "Increase the rollout percentage over time (e.g., 5% → 25% → 50% → 100%). Monitor error rates and user feedback at each stage.",
    who: "Developer / PM",
    tools: "GitLab UI / YAML config",
  },
  {
    num: 6,
    title: "Clean up",
    description: "Once fully rolled out and stable, remove the flag check from code and delete the flag definition. This prevents flag debt accumulation.",
    who: "Developer",
    tools: "Code review / PR",
  },
];

// ── Code Examples ───────────────────────────────────────────────────

export interface CodeExample {
  title: string;
  language: string;
  comment: string;
  code: string;
}

export const clientSideCodeExamples: CodeExample[] = [
  {
    title: "Unleash Provider Setup",
    language: "tsx",
    comment: "// app/providers.tsx — wrap the app with the Unleash provider",
    code: `import { FlagProvider } from "@unleash/proxy-client-react";

const config = {
  url: "https://...gitlab.../feature_flags/unleash/46450",
  clientKey: process.env.NEXT_PUBLIC_UNLEASH_CLIENT_KEY!,
  refreshInterval: 15,   // seconds
  appName: "subscription-manager",
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FlagProvider config={config}>
      {children}
    </FlagProvider>
  );
}`,
  },
  {
    title: "useFlag Hook",
    language: "tsx",
    comment: "// hooks/useFeatureFlag.ts — typed wrapper around useFlag",
    code: `import { useFlag } from "@unleash/proxy-client-react";

export function useFeatureFlag(flagName: string): boolean {
  return useFlag(flagName);
}

// Usage in a component:
// const showNewCheckout = useFeatureFlag("new-checkout-flow");`,
  },
  {
    title: "Conditional Rendering",
    language: "tsx",
    comment: "// components/SubscriptionCard.tsx — render based on flag",
    code: `import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export function SubscriptionCard({ sub }: { sub: Subscription }) {
  const showBundleOption = useFeatureFlag("bundle-subscription-ui");

  return (
    <div className="card">
      <h3>{sub.name}</h3>
      <p>{sub.description}</p>
      {showBundleOption && (
        <button onClick={handleBundle}>
          Bundle with other services
        </button>
      )}
    </div>
  );
}`,
  },
];

export const serverSideCodeExamples: CodeExample[] = [
  {
    title: "OpenFeature SDK Init",
    language: "go",
    comment: "// cmd/main.go — initialize OpenFeature with GOFF provider",
    code: `import (
    "github.com/open-feature/go-sdk/openfeature"
    gofeatureflag "github.com/open-feature/go-sdk-contrib/providers/go-feature-flag/pkg"
)

func initFeatureFlags() {
    provider, _ := gofeatureflag.NewProvider(
        gofeatureflag.ProviderOptions{
            Endpoint: "feature-flag.app-gateway.hts-dev.cac1.aws.int.bell.ca",
        },
    )
    openfeature.SetProvider(provider)
}`,
  },
  {
    title: "Boolean Flag Evaluation",
    language: "go",
    comment: "// internal/service/subscription.go — evaluate a flag",
    code: `func (s *SubscriptionService) ProcessActivation(ctx context.Context, req ActivationReq) error {
    client := openfeature.NewClient("subscription-service")

    newFlowEnabled, _ := client.BooleanValue(
        ctx,
        "new-activation-flow",
        false, // default when flag service is unreachable
        openfeature.NewEvaluationContext("", map[string]interface{}{
            "accountType": req.AccountType,
            "region":      req.Region,
        }),
    )

    if newFlowEnabled {
        return s.activateV2(ctx, req)
    }
    return s.activateV1(ctx, req)
}`,
  },
  {
    title: "String Flag (Multi-variant)",
    language: "go",
    comment: "// internal/handler/review.go — multi-variant flag",
    code: `func (h *ReviewHandler) GetReviewLayout(ctx context.Context, userID string) string {
    client := openfeature.NewClient("review-handler")

    layout, _ := client.StringValue(
        ctx,
        "review-page-layout",
        "classic", // default layout
        openfeature.NewEvaluationContext(userID, nil),
    )

    // layout = "classic" | "compact" | "modern"
    return layout
}`,
  },
];

// ── Use Cases ───────────────────────────────────────────────────────

export interface FlagUseCase {
  title: string;
  type: "Release" | "Experiment" | "Ops" | "Permission";
  description: string;
  system: "Unleash" | "GOFF" | "Both";
}

export const flagUseCases: FlagUseCase[] = [
  {
    title: "New subscription type rollout",
    type: "Release",
    description: "Gradually enable a new streaming subscription (e.g., Disney+) for a percentage of users before making it available to everyone.",
    system: "Both",
  },
  {
    title: "New provider integration",
    type: "Release",
    description: "Gate a new merchant-api-* integration behind a flag so it can be tested in production with select accounts before full rollout.",
    system: "GOFF",
  },
  {
    title: "A/B test checkout flow",
    type: "Experiment",
    description: "Show different review screen layouts to different user cohorts and measure conversion rates to pick the winning design.",
    system: "Unleash",
  },
  {
    title: "Kill switch for external API",
    type: "Ops",
    description: "Instantly disable calls to an unstable third-party API and fall back to cached data, without redeploying.",
    system: "GOFF",
  },
  {
    title: "Account-type gating",
    type: "Permission",
    description: "Only show business-tier features (bulk management, usage reports) to accounts flagged as 'business' in the system.",
    system: "Both",
  },
  {
    title: "Regional feature availability",
    type: "Permission",
    description: "Enable French-language-only features in Quebec or restrict certain offerings to specific provinces based on regulatory requirements.",
    system: "GOFF",
  },
];

// ── Best Practices ──────────────────────────────────────────────────

export interface FlagBestPractice {
  type: "do" | "avoid" | "tip";
  title: string;
  description: string;
}

export const flagBestPractices: FlagBestPractice[] = [
  {
    type: "do",
    title: "Use descriptive kebab-case names",
    description: "Name flags like 'new-checkout-flow' or 'enable-disney-plus-integration' so the purpose is obvious from the name alone.",
  },
  {
    type: "do",
    title: "Always set safe defaults",
    description: "Default to OFF (false) for new features. When the flag service is unreachable, the application should continue working with existing behavior.",
  },
  {
    type: "do",
    title: "Test both flag states",
    description: "Write tests that exercise the code with the flag both ON and OFF. This catches bugs before the rollout and ensures safe rollback.",
  },
  {
    type: "do",
    title: "Clean up after full rollout",
    description: "Once a flag is at 100% and stable for a sprint, remove the flag check from code and delete the flag definition to prevent flag debt.",
  },
  {
    type: "avoid",
    title: "Avoid nested flag dependencies",
    description: "Don't make flag B depend on flag A being enabled. This creates complex state that's hard to reason about and test.",
  },
  {
    type: "avoid",
    title: "Avoid long-lived flags",
    description: "Flags that stay in the codebase for months become tech debt. Track flag age and set calendar reminders for cleanup.",
  },
  {
    type: "tip",
    title: "Use evaluation context for targeting",
    description: "Pass user attributes (accountType, region, userId) in the evaluation context to enable precise targeting without hardcoding user lists.",
  },
  {
    type: "tip",
    title: "Monitor flag evaluations",
    description: "Log flag evaluation results to catch unexpected states. A flag that should be ON for 50% but shows 0% evaluations indicates a misconfiguration.",
  },
];

// ── Targeting Strategies ────────────────────────────────────────────

export interface TargetingStrategy {
  strategy: string;
  description: string;
  system: "Unleash" | "GOFF" | "Both";
  example: string;
}

export const targetingStrategies: TargetingStrategy[] = [
  {
    strategy: "Percentage rollout",
    description: "Enable the flag for a percentage of all evaluations, using consistent hashing so users get the same result on each visit.",
    system: "Both",
    example: "10% → 25% → 50% → 100%",
  },
  {
    strategy: "User ID",
    description: "Target specific users by their unique identifier for internal testing or beta programs.",
    system: "Both",
    example: 'userIds: ["dev-user-1", "beta-tester-42"]',
  },
  {
    strategy: "Account type",
    description: "Enable features based on the customer's account classification (residential, business, enterprise).",
    system: "GOFF",
    example: 'accountType in ["business", "enterprise"]',
  },
  {
    strategy: "Region",
    description: "Gate features by geographic region for regulatory compliance or regional rollouts.",
    system: "GOFF",
    example: 'region == "QC" → enable French-only features',
  },
  {
    strategy: "Environment",
    description: "Enable flags in dev/staging first, then production. Useful for testing integrations before going live.",
    system: "Both",
    example: "ON in dev + staging, OFF in production",
  },
];

// ── Mermaid Diagrams ────────────────────────────────────────────────

export const flagArchitectureMermaid = `flowchart LR
  subgraph Client["Browser (Next.js)"]
    UI["React Components"]
    SDK1["Unleash React SDK"]
  end

  subgraph Unleash["Unleash (Client-Side Flags)"]
    PROXY["Unleash Proxy"]
    GL["GitLab Feature Flags"]
  end

  subgraph GoServices["Go Microservices"]
    SVC["Go Service"]
    OF["OpenFeature SDK"]
  end

  subgraph GOFF["Go Feature Flags (Server-Side)"]
    RELAY["GOFF Relay Proxy"]
    YAML["YAML Config (Git)"]
  end

  UI -->|"useFlag()"| SDK1
  SDK1 -->|"REST poll ~15s"| PROXY
  PROXY -->|"reads flags"| GL

  SVC -->|"BooleanValue()"| OF
  OF -->|"gRPC"| RELAY
  RELAY -->|"reads config"| YAML

  style Client fill:#1a1a2e,stroke:#7c6fcd,color:#e8e8f0
  style Unleash fill:#1a1a2e,stroke:#7c6fcd,color:#e8e8f0
  style GoServices fill:#1a1a2e,stroke:#3eb89a,color:#e8e8f0
  style GOFF fill:#1a1a2e,stroke:#3eb89a,color:#e8e8f0`;

export const clientEvalMermaid = `sequenceDiagram
  participant Browser as React App
  participant SDK as Unleash SDK
  participant Proxy as Unleash Proxy
  participant GL as GitLab Flags

  Browser->>SDK: useFlag("new-checkout")
  Note over SDK: Check local cache

  alt Cache miss or stale
    SDK->>Proxy: GET /proxy/client/features
    Proxy->>GL: Fetch flag definitions
    GL-->>Proxy: Flag configs + rules
    Proxy-->>SDK: Evaluated flag values
    Note over SDK: Update local cache
  end

  SDK-->>Browser: true / false
  Note over Browser: Render conditionally`;

export const serverEvalMermaid = `sequenceDiagram
  participant SVC as Go Service
  participant OF as OpenFeature SDK
  participant RELAY as GOFF Relay Proxy
  participant CFG as YAML Config (Git)

  SVC->>OF: BooleanValue(ctx, "new-flow", false, evalCtx)
  OF->>RELAY: gRPC: evaluate flag
  RELAY->>CFG: Read flag definition
  Note over RELAY: Apply targeting rules<br/>(percentage, user, region)
  CFG-->>RELAY: Flag config
  RELAY-->>OF: {value: true, variant: "enabled"}
  OF-->>SVC: true

  Note over SVC: Execute new code path`;

export const flagDecisionTreeMermaid = `flowchart TD
  START["Need a feature flag?"] --> Q1{"Where does the flag<br/>control behavior?"}

  Q1 -->|"UI / Browser"| Q2{"Is it purely visual?"}
  Q1 -->|"Backend / API"| GOFF_RESULT["Use Go Feature Flags"]
  Q1 -->|"Both"| BOTH["Use both systems"]

  Q2 -->|"Yes — show/hide elements"| UNLEASH_RESULT["Use Unleash"]
  Q2 -->|"No — affects data fetching"| Q3{"Does the BFF handle it?"}

  Q3 -->|"Yes — API route logic"| GOFF_RESULT
  Q3 -->|"No — client-side only"| UNLEASH_RESULT

  style START fill:#1a1a2e,stroke:#4a8fe8,color:#e8e8f0
  style UNLEASH_RESULT fill:#1a1a2e,stroke:#7c6fcd,color:#c4bfef
  style GOFF_RESULT fill:#1a1a2e,stroke:#3eb89a,color:#a8e0d0
  style BOTH fill:#1a1a2e,stroke:#e8a83a,color:#f0ddb0
  style Q1 fill:#1a1a2e,stroke:#6b7590,color:#e8e8f0
  style Q2 fill:#1a1a2e,stroke:#6b7590,color:#e8e8f0
  style Q3 fill:#1a1a2e,stroke:#6b7590,color:#e8e8f0`;
