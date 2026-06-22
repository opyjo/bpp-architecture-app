/**
 * Maps the active tab/route to a focused system context + suggested prompts
 * so the global AI Assistant sidebar "knows" what the user is looking at.
 */

interface AssistantContext {
  label: string;
  context: string;
  prompts: string[];
}

const PLATFORM_BASE =
  "You are an embedded architecture assistant for the Bell Canada \"Subscription Manager\" platform " +
  "(Microfrontends → Next.js BFF → AppSync/GraphQL → Go microservices → Kafka). " +
  "Answer concisely and concretely, grounded in this platform. Use the codebase tools when a question " +
  "requires reading real source from go-repo-new or node-mono-real.";

const CONTEXTS: Record<string, AssistantContext> = {
  arch: {
    label: "Architecture",
    context: "The user is viewing the high-level architecture diagram and lifecycle flows.",
    prompts: [
      "Explain the end-to-end activation flow",
      "Why a BFF in front of AppSync?",
      "Where does Kafka fit in this design?",
    ],
  },
  services: {
    label: "Services",
    context: "The user is browsing the Go microservice deep-dives (endpoints, data models, dependencies, events).",
    prompts: [
      "Which service owns subscription state?",
      "Summarize reseller-service responsibilities",
      "What depends on catalog-api?",
    ],
  },
  events: {
    label: "Kafka events",
    context: "The user is viewing the Kafka event catalog (topics, payloads, consumers).",
    prompts: [
      "How is idempotency guaranteed for OrderCreated?",
      "Which consumers react to activation events?",
      "What happens on a poison message?",
    ],
  },
  lambdas: {
    label: "Lambda functions",
    context: "The user is viewing AWS Lambda functions grouped by service (triggers, inputs, outputs).",
    prompts: [
      "Which lambdas are triggered by SQS?",
      "Explain the billing-process group",
      "What does the fallout-automation group do?",
    ],
  },
  flags: {
    label: "Feature Flags",
    context: "The user is viewing the feature-flag systems (client + server SDKs, lifecycle, best practices).",
    prompts: [
      "Client-side vs server-side flag trade-offs",
      "How should I retire a stale flag?",
      "Best practices for flag naming",
    ],
  },
  runbooks: {
    label: "Incident Runbooks",
    context: "The user is viewing incident runbooks (symptoms, resolution + rollback steps, escalation).",
    prompts: [
      "Draft a runbook for Kafka consumer lag",
      "First triage steps for merchant provisioning failures",
      "When should I escalate a P1?",
    ],
  },
  impact: {
    label: "Change Impact",
    context: "The user is analyzing the blast radius of a proposed change across services and events.",
    prompts: [
      "What breaks if I change the OrderCreated schema?",
      "Downstream impact of removing an endpoint",
    ],
  },
  systemmap: {
    label: "System Map",
    context: "The user is exploring the interactive service dependency / blast-radius map.",
    prompts: [
      "Trace upstream callers of session-api",
      "Which services have the largest blast radius?",
    ],
  },
  bsa: {
    label: "BSA Cheatsheet",
    context: "The user is studying the Business Systems Analyst cheatsheet and interview material.",
    prompts: [
      "Explain the saga pattern simply",
      "How do I gather integration requirements?",
      "Give me a STAR example for a Bell project",
    ],
  },
  openapi: {
    label: "OpenAPI 3.0",
    context: "The user is studying OpenAPI 3.0 contracts and API design.",
    prompts: [
      "Draft an OpenAPI path for createSubscription",
      "Path vs query vs body params — when to use each?",
    ],
  },
};

export function getAssistantContext(tab: string | null, pathname: string): AssistantContext {
  // Route-based contexts (non-home pages)
  if (pathname.startsWith("/analyze")) {
    return {
      label: "Ticket Analyzer",
      context: "The user is analyzing a Jira ticket against the platform.",
      prompts: ["What services would this ticket touch?", "Draft acceptance criteria"],
    };
  }
  if (pathname.startsWith("/saved")) {
    return {
      label: "Saved",
      context: "The user is browsing their saved artifacts (reviews, test plans, specs, runbooks).",
      prompts: ["Summarize what I've saved", "Suggest a next artifact to create"],
    };
  }

  const ctx = (tab && CONTEXTS[tab]) || null;
  if (ctx) return ctx;

  return {
    label: "Assistant",
    context: "The user is exploring the architecture knowledge base.",
    prompts: [
      "Give me a tour of this system",
      "What are the core services?",
      "Explain the activation flow",
    ],
  };
}

export function buildSystemContext(tab: string | null, pathname: string): string {
  const { context } = getAssistantContext(tab, pathname);
  return `${PLATFORM_BASE}\n\nCURRENT VIEW: ${context}`;
}
