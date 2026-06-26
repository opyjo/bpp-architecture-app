import { createStreamingResponse } from "@/lib/ai/stream";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";

export const runtime = "nodejs";
export const maxDuration = 120;

const PLATFORM_CONTEXT = `This code belongs to a subscription-management platform:
- Go microservices (gorilla/mux, chi, net/http), PostgreSQL, DynamoDB, Redis/ElastiCache
- Kafka for async event-driven communication
- AppSync / GraphQL BFF layer in front of the services
- AWS Lambda + ECS for compute
- Strong emphasis on error handling, retries, and idempotency.`;

const LENS_PROMPTS: Record<string, string> = {
  business: `You are a senior business systems analyst who reverse-engineers the BUSINESS DESIGN from code. Given source code or a topic, explain the business behind it so a product/BSA audience understands it.

Produce Markdown with these sections (omit any that don't apply):
- **Business capability** — the capability this serves (e.g. Plan management, Billing, Entitlements, Notifications) and the outcome it delivers.
- **Domain entities & relationships** — the key business objects and how they relate.
- **Business rules** — concrete rules enforced in the code, in plain English (e.g. "a subscription cannot downgrade mid-cycle").
- **Ubiquitous language** — a short glossary of domain terms used.
- **Where it fits** — how this connects to the rest of the platform (upstream/downstream, events emitted/consumed).
Be specific and cite identifiers from the code. Prefer clarity over jargon.`,

  go: `You are a patient senior Go mentor. Given Go source code (or a topic), teach it from the REAL code so the reader levels up their Go.

Produce Markdown with these sections (omit any that don't apply):
- **What it does** — a 2-3 sentence plain summary.
- **Annotated walkthrough** — step through the important parts, explaining the *why*, not just the *what*.
- **Idiomatic patterns** — name the Go patterns present (error wrapping with %w, context propagation, middleware chains, repository pattern, worker pools, idempotency, table-driven tests) with the exact lines that use them.
- **Gotchas & risks** — concurrency hazards, missing error checks, resource/goroutine leaks, nil traps.
- **Level-up** — 2-3 things to study next, and a tiny self-check question to test understanding.
Use fenced \`go\` code blocks for snippets. Be encouraging and precise.`,

  saas: `You are a pragmatic SaaS product strategist + staff engineer. Given code or a capability, find what is PRODUCTIZABLE and scope a lean SaaS around it.

Produce Markdown with these sections:
- **Productizable capability** — the generic, reusable engine hiding in this code (e.g. a billing engine, feature-flag service, entitlements API, notification hub).
- **SaaS ideas** — 2-3 concrete products, each with target user and the painful problem it solves.
- **MVP scope** — for the strongest idea: the core user flow, a minimal data model, and a small Go service/API skeleton (fenced \`go\`) reusing patterns from the source.
- **Multi-tenancy** — what's needed to go single-tenant → multi-tenant (tenant isolation, Postgres RLS, per-tenant billing).
- **Effort & cost** — a rough build estimate and the main AWS cost drivers.
Be opinionated; pick a winner and justify it briefly.`,
};

export async function POST(request: Request) {
  let body: {
    lens?: string;
    input?: string;
    filePath?: string;
    modelId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const lens = body.lens ?? "business";
  const input = (body.input ?? "").toString();
  const filePath = (body.filePath ?? "").toString().trim();
  const modelId = body.modelId || DEFAULT_MODEL_ID;

  if (!input.trim()) {
    return Response.json(
      { error: "Provide code or a topic to analyze." },
      { status: 400 }
    );
  }

  const systemPrompt = `${LENS_PROMPTS[lens] ?? LENS_PROMPTS.business}\n\n## Platform context\n${PLATFORM_CONTEXT}`;

  const userContent = filePath
    ? `Analyze the following source file: \`${filePath}\`\n\n\`\`\`go\n${input}\n\`\`\``
    : input;

  return createStreamingResponse({
    modelId,
    systemPrompt,
    userContent,
    maxTokens: 8192,
    signal: request.signal,
  });
}
