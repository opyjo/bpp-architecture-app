export type CardCategory =
  | "Opening"
  | "STAR"
  | "Technical"
  | "Behavioral"
  | "Closing"
  | "Scenario";

export type HighlightColor =
  | "blue"
  | "purple"
  | "teal"
  | "amber"
  | "green"
  | "coral";

export interface HighlightedPhrase {
  text: string;
  color: HighlightColor;
}

export interface CardSection {
  id: string;
  name: string;
  bullets: HighlightedPhrase[];
}

export interface TeleprompterCard {
  id: string;
  title: string;
  category: CardCategory;
  bullets: HighlightedPhrase[];
  sections?: CardSection[];
  fullText?: string;
}

export function getAllBullets(card: TeleprompterCard): HighlightedPhrase[] {
  if (card.sections && card.sections.length > 0) {
    return card.sections.flatMap((s) => s.bullets);
  }
  return card.bullets;
}

export const CATEGORY_COLORS: Record<CardCategory, string> = {
  Opening: "bg-arch-blue/15 text-arch-blue border-arch-blue/30",
  STAR: "bg-arch-purple/15 text-arch-purple border-arch-purple/30",
  Technical: "bg-arch-teal/15 text-arch-teal border-arch-teal/30",
  Behavioral: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  Closing: "bg-arch-green/15 text-arch-green border-arch-green/30",
  Scenario: "bg-arch-coral/15 text-arch-coral border-arch-coral/30",
};

export const DEFAULT_TELEPROMPTER_CARDS: TeleprompterCard[] = [
  {
    id: "default-1",
    title: "Tell Me About Yourself",
    category: "Opening",
    bullets: [
      {
        text: "**10+ years** in enterprise software — Java, TypeScript, cloud-native",
        color: "blue",
      },
      {
        text: "Currently a **BSA / Tech Lead** on a large-scale **insurance platform** migration",
        color: "purple",
      },
      {
        text: "Bridge between **business stakeholders** and **engineering teams** — translate requirements into architecture",
        color: "teal",
      },
      {
        text: "Passionate about **event-driven systems**, **API design**, and **developer experience**",
        color: "green",
      },
    ],
  },
  {
    id: "default-2",
    title: "Complex Integration Challenge",
    category: "STAR",
    bullets: [
      {
        text: "**Situation**: Legacy monolith needed to integrate with **3 downstream systems** simultaneously",
        color: "blue",
      },
      {
        text: "**Task**: Design an **event-driven bridge** that wouldn't disrupt existing consumers",
        color: "purple",
      },
      {
        text: "**Action**: Introduced **Kafka topics** with schema registry, built **idempotent consumers** with retry/DLQ",
        color: "teal",
      },
      {
        text: "**Result**: Zero-downtime migration, **40% reduction** in integration errors, reusable pattern adopted org-wide",
        color: "green",
      },
    ],
  },
  {
    id: "default-3",
    title: "Requirements Gathering Process",
    category: "Behavioral",
    bullets: [
      {
        text: "Start with **stakeholder interviews** — understand the *why* before the *what*",
        color: "amber",
      },
      {
        text: "Create **user journey maps** and **process flows** to visualize current vs. future state",
        color: "blue",
      },
      {
        text: "Use **structured workshops** with cross-functional teams to surface edge cases early",
        color: "purple",
      },
      {
        text: "Document in **living specs** — OpenAPI contracts, acceptance criteria, and **traceability matrices**",
        color: "teal",
      },
    ],
  },
  {
    id: "default-4",
    title: "CQRS and Event-Driven Architecture",
    category: "Technical",
    bullets: [
      {
        text: "**CQRS** separates read/write models — optimized **query views** vs. **command handlers**",
        color: "teal",
      },
      {
        text: "Events as **source of truth** — Kafka topics with **Avro schemas** and versioning",
        color: "blue",
      },
      {
        text: "**Saga orchestration** for distributed transactions — compensating actions on failure",
        color: "purple",
      },
      {
        text: "Practical tradeoffs: **eventual consistency**, **idempotency keys**, **DLQ monitoring**",
        color: "coral",
      },
    ],
  },
  {
    id: "default-5",
    title: "Handling Ambiguity",
    category: "Behavioral",
    bullets: [
      {
        text: "Embrace ambiguity — it's a signal to **ask better questions**, not to freeze",
        color: "amber",
      },
      {
        text: "Break unknowns into **small experiments** — spike, prototype, validate with stakeholders",
        color: "blue",
      },
      {
        text: "Document **assumptions explicitly** and revisit them as new information surfaces",
        color: "purple",
      },
      {
        text: "Example: unclear data mapping → built a **quick POC**, presented options with **tradeoffs matrix**",
        color: "green",
      },
    ],
  },
  {
    id: "default-6",
    title: "Why This Role / Why Canada Life?",
    category: "Closing",
    bullets: [
      {
        text: "Drawn to **large-scale modernization** — transforming legacy systems is where I thrive",
        color: "green",
      },
      {
        text: "Canada Life's investment in **cloud-native architecture** aligns with my expertise",
        color: "blue",
      },
      {
        text: "Opportunity to **shape platform direction** — not just execute, but influence **technical strategy**",
        color: "purple",
      },
      {
        text: "Value the **collaborative culture** and focus on **long-term engineering excellence**",
        color: "teal",
      },
    ],
  },
  {
    id: "default-7",
    title: "Data Mapping Example",
    category: "Technical",
    bullets: [
      {
        text: "Mapped **legacy policy data** (COBOL copybooks) to **modern domain models** (JSON/Avro)",
        color: "teal",
      },
      {
        text: "Built **transformation layer** with validation rules — field-level **type coercion** and **null handling**",
        color: "blue",
      },
      {
        text: "Used **contract-first design** — OpenAPI specs defined before implementation",
        color: "purple",
      },
      {
        text: "Automated **regression testing** with snapshot comparisons across **1000+ policy variants**",
        color: "green",
      },
    ],
  },
  {
    id: "default-8",
    title: "Conflict Between Business and Engineering",
    category: "STAR",
    bullets: [
      {
        text: "**Situation**: Business wanted a **2-week deadline**; engineering said **6 weeks minimum**",
        color: "blue",
      },
      {
        text: "**Task**: Find a path that satisfies **delivery urgency** without accumulating **tech debt**",
        color: "purple",
      },
      {
        text: "**Action**: Proposed **phased delivery** — MVP in 2 weeks, full solution in 4, with **clear scope contracts**",
        color: "teal",
      },
      {
        text: "**Result**: Both sides aligned, MVP shipped on time, **full delivery 1 week early** — built trust across teams",
        color: "green",
      },
    ],
  },
];
