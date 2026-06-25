"use client";

import dynamic from "next/dynamic";
import {
  Workflow,
  Store,
  ShoppingCart,
  Gavel,
  BookOpen,
  Calculator,
  Truck,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mermaid renders client-side only (reads document/theme on mount).
const MermaidDiagram = dynamic(
  () => import("@/components/ui/MermaidDiagram"),
  { ssr: false }
);

/* ────────────────────────────────────────────────────────────────────────
 * The cast of characters — every term you hear (configurator, aggregator,
 * flow runner, subscription manager …) is just one ROLE in a checkout
 * pipeline for phone-plan subscriptions. Source: docs/PI2.md.
 * ──────────────────────────────────────────────────────────────────────── */

interface Player {
  name: string;
  repo: string;
  role: string;
  metaphor: string;
  icon: React.ReactNode;
  accent: string; // tailwind text color token
  border: string;
  glow: string;
}

const PLAYERS: Player[] = [
  {
    name: "Aggregator",
    repo: "subscriptions-aggregator-api",
    role: "Read side. Gathers a customer's data from many sources into one response — subscriber profile, party / name, what they currently own.",
    metaphor: "The store window — shows who the customer is and what they have.",
    icon: <Store className="w-4 h-4" />,
    accent: "text-arch-teal",
    border: "border-arch-teal/30",
    glow: "from-arch-teal/20",
  },
  {
    name: "Configurator",
    repo: "subscription-configurator-api",
    role: "Write side / orchestrator. Owns the cart lifecycle: open cart, add / remove / undo items, ask what's allowed, convert to an order.",
    metaphor: "The shopping cart + checkout clerk.",
    icon: <ShoppingCart className="w-4 h-4" />,
    accent: "text-arch-blue",
    border: "border-arch-blue/30",
    glow: "from-arch-blue/20",
  },
  {
    name: "Flow Runner",
    repo: "pkg/flow · pkg/flow-v2",
    role: "The rules engine. Given a customer + cart it decides each item is Qualified / Unqualified / Recommended.",
    metaphor: "The eligibility referee.",
    icon: <Gavel className="w-4 h-4" />,
    accent: "text-arch-purple",
    border: "border-arch-purple/30",
    glow: "from-arch-purple/20",
  },
  {
    name: "Policy Rule Configurator",
    repo: "policy-rule-configurator-api",
    role: "Stores the business rules the Flow Runner evaluates. NOT the same thing as the subscription-configurator.",
    metaphor: "The rulebook the referee reads from.",
    icon: <BookOpen className="w-4 h-4" />,
    accent: "text-arch-amber",
    border: "border-arch-amber/30",
    glow: "from-arch-amber/20",
  },
  {
    name: "Subscription Manager",
    repo: "serverless/subscription-manager",
    role: "Translation + math. Turns a finished cart into a proper order and computes totals / discounts (subscriptionToOrder, subscriptionCart, qualification mappers).",
    metaphor: "The accountant / translator.",
    icon: <Calculator className="w-4 h-4" />,
    accent: "text-arch-coral",
    border: "border-arch-coral/30",
    glow: "from-arch-coral/20",
  },
  {
    name: "Fulfillment & Billing",
    repo: "Order API → Billing → Subscriber Manager",
    role: "Actually executes the order, runs billing, and updates the subscriber profile.",
    metaphor: "The warehouse that ships and charges.",
    icon: <Truck className="w-4 h-4" />,
    accent: "text-arch-green",
    border: "border-arch-green/30",
    glow: "from-arch-green/20",
  },
];

const STYLE = `
classDef cfg fill:#3a7dd822,stroke:#3a7dd8,stroke-width:1.5px,color:#3a7dd8;
classDef rule fill:#7c5cff22,stroke:#7c5cff,stroke-width:1.5px,color:#9d86ff;
classDef money fill:#e8865a22,stroke:#e8865a,stroke-width:1.5px,color:#e8865a;
classDef ok fill:#2ea88a22,stroke:#2ea88a,stroke-width:1.5px,color:#2ea88a;
classDef read fill:#2ea88a22,stroke:#2ea88a,stroke-width:1.5px,color:#2ea88a;`;

const READ_PATH = `flowchart LR
  UI["Agent / Customer UI"]
  AGG["subscriptions-aggregator-api<br/>(the Aggregator)"]
  SRC[("subscriber + party data<br/>profile · name · current items")]
  OUT["UI shows the customer<br/>and what they own"]
  UI --> AGG
  AGG --> SRC
  SRC --> AGG
  AGG --> OUT
  class AGG read
  class OUT ok
${STYLE}`;

const WRITE_PATH = `flowchart TD
  UI["Agent UI<br/>cart: Undo offering X, Add promo P"]
  subgraph CFG["subscription-configurator-api · the cart brain"]
    direction TB
    INIT["1 · initialize_cart_mapper<br/>build cart / lock check"]
    QUAL["2 · get_qualification<br/>what can they pick?"]
    APPLY["3 · apply_and_qualify<br/>add items · link promo to offering"]
    CONV["4 · convert_to_order<br/>cart to order"]
  end
  FR["Flow Runner<br/>pkg/flow · rules engine"]
  PR[("Policy Rule<br/>Configurator")]
  SM["subscription-manager<br/>subscriptionToOrder · totals + discounts"]
  ORD["Order API to Billing to Subscriber Profile"]

  UI --> INIT
  INIT --> QUAL
  QUAL -->|"asks"| FR
  FR -->|"reads"| PR
  FR -->|"Qualified / Unqualified / Recommended"| QUAL
  QUAL --> APPLY
  APPLY --> CONV
  CONV --> SM
  SM --> ORD

  class INIT,QUAL,APPLY,CONV cfg
  class FR,PR rule
  class SM money
  class ORD ok
${STYLE}`;

export default function SubscriptionFlowTab() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-blue to-arch-purple text-white flex items-center justify-center shrink-0">
            <Workflow className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-semibold text-arch-text truncate">
            Subscription Flow
          </span>
          <span className="text-[10px] text-arch-text3 hidden sm:inline">
            How the configurator, aggregator, flow runner &amp; subscription
            manager connect
          </span>
        </div>
        <span className="text-[10px] text-arch-text3 shrink-0">
          mental model · from docs/PI2.md
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-8 max-w-5xl mx-auto">
          {/* One-sentence version */}
          <section className="rounded-xl border border-arch-border bg-gradient-to-br from-arch-blue/[0.07] to-arch-purple/[0.07] p-5">
            <h2 className="text-[13px] font-semibold text-arch-text mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-arch-blue" />
              The one-sentence version
            </h2>
            <p className="text-[12.5px] text-arch-text2 leading-relaxed">
              It&apos;s an{" "}
              <strong className="text-arch-text">
                online store for phone-plan subscriptions
              </strong>
              . A customer has offerings, products, and promotions (like Netflix
              as a value-added service). An agent builds a{" "}
              <strong className="text-arch-text">cart of changes</strong>, the
              system checks what&apos;s <em>allowed</em>, prices it, and submits
              it as an order. Every term you hear is just one{" "}
              <strong className="text-arch-text">role in that checkout</strong>.
            </p>
          </section>

          {/* The cast of characters */}
          <section>
            <h2 className="text-[13px] font-semibold text-arch-text mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-arch-purple" />
              The cast of characters
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PLAYERS.map((p) => (
                <div
                  key={p.name}
                  className={cn(
                    "relative overflow-hidden rounded-xl border bg-arch-bg2/50 p-4",
                    p.border
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br to-transparent opacity-60 pointer-events-none",
                      p.glow
                    )}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={cn(
                          "w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 bg-arch-bg",
                          p.border,
                          p.accent
                        )}
                      >
                        {p.icon}
                      </span>
                      <div className="min-w-0">
                        <div
                          className={cn(
                            "text-[12.5px] font-semibold leading-tight",
                            p.accent
                          )}
                        >
                          {p.name}
                        </div>
                        <div className="text-[9.5px] font-mono text-arch-text3 truncate">
                          {p.repo}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11.5px] text-arch-text2 leading-relaxed mb-2">
                      {p.role}
                    </p>
                    <p className="text-[11px] text-arch-text3 italic leading-relaxed">
                      → {p.metaphor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-arch-amber/90 bg-arch-amber/[0.07] border border-arch-amber/20 rounded-lg px-3 py-2 leading-relaxed">
              ⚠️ Easy trap: there are <strong>two &quot;configurators&quot;</strong>{" "}
              and they&apos;re unrelated.{" "}
              <span className="font-mono text-[10.5px]">
                subscription-configurator
              </span>{" "}
              is the cart / checkout brain;{" "}
              <span className="font-mono text-[10.5px]">
                policy-rule-configurator
              </span>{" "}
              is just where rules are stored.
            </p>
          </section>

          {/* Read path */}
          <section>
            <h2 className="text-[13px] font-semibold text-arch-text mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-arch-teal" />
              Read path — &quot;what does this customer have?&quot;
            </h2>
            <p className="text-[11.5px] text-arch-text3 mb-3 leading-relaxed">
              A pure lookup. The Aggregator pulls data together from several
              sources and hands the UI one tidy picture of the customer.
            </p>
            <div className="rounded-xl border border-arch-teal/30 bg-arch-bg2/40 p-3">
              <MermaidDiagram chart={READ_PATH} />
            </div>
          </section>

          {/* Write path */}
          <section>
            <h2 className="text-[13px] font-semibold text-arch-text mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-arch-blue" />
              Write path — &quot;let me change something&quot; (the main
              pipeline)
            </h2>
            <p className="text-[11.5px] text-arch-text3 mb-3 leading-relaxed">
              The Configurator runs the same four steps every time —{" "}
              <strong className="text-arch-text2">
                initialize → qualify → apply → convert
              </strong>{" "}
              — calling the Flow Runner to decide eligibility and handing off to
              the Subscription Manager to price and ship.
            </p>
            <div className="rounded-xl border border-arch-blue/30 bg-arch-bg2/40 p-3">
              <MermaidDiagram chart={WRITE_PATH} />
            </div>
          </section>

          {/* The mental model to lock in */}
          <section className="rounded-xl border border-arch-border bg-arch-bg2/50 p-5">
            <h2 className="text-[13px] font-semibold text-arch-text mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-arch-green" />
              The mental model to lock in
            </h2>
            <p className="text-[12px] text-arch-text2 leading-relaxed mb-4">
              Read it as one sentence: the <Token c="text-arch-teal">Aggregator</Token>{" "}
              <em>shows</em> what a customer has →{" "}
              <Token c="text-arch-blue">Configurator</Token> lets an agent{" "}
              <em>change</em> it → the <Token c="text-arch-purple">Flow Runner</Token>{" "}
              (using <Token c="text-arch-amber">Policy Rules</Token>){" "}
              <em>decides what&apos;s allowed</em> → the{" "}
              <Token c="text-arch-coral">Subscription Manager</Token>{" "}
              <em>prices it and turns it into an order</em> →{" "}
              <Token c="text-arch-green">Order API / Billing</Token>{" "}
              <em>make it real</em>.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {["initialize", "qualify", "apply", "convert"].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-arch-blue/30 bg-arch-blue/10 text-arch-blue">
                    {step}
                  </span>
                  {i < arr.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-arch-text3" />
                  )}
                </div>
              ))}
              <span className="text-[10.5px] text-arch-text3 ml-1">
                ← the Configurator&apos;s recurring four-verb chain
              </span>
            </div>
            <p className="mt-4 text-[11.5px] text-arch-text3 leading-relaxed">
              Almost every feature in the PI2 stories (Undo + Add promo,
              ActiveTerminating promos, Netflix VAS) is just a tweak to{" "}
              <em>one</em> of these boxes — usually the qualification rules (Flow
              Runner) or the totals math (Subscription Manager).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Token({ c, children }: { c: string; children: React.ReactNode }) {
  return <strong className={cn("font-semibold", c)}>{children}</strong>;
}
