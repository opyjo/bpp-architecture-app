import type { FlowNode, FlowDiagramStep } from "@/data/flow-diagrams";

export type PrepColor = "blue" | "purple" | "teal" | "amber" | "green" | "coral" | "gray";

export interface PrepCard {
  title: string;
  body: string;
  cue?: string;
  color?: PrepColor;
}

export interface InterviewQuestion {
  key?: string;
  question: string;
  audience: string;
  answer: string;
  cue: string;
  quickPeek?: string[];
}

export interface TechnicalInterviewQuestion extends InterviewQuestion {
  category: string;
  priority: "Must know" | "Useful backup";
  testing: string;
  plainEnglish: string;
  answerPlan: Array<{
    label: string;
    detail: string;
  }>;
  resumeAnchor: string;
  keyTerms: Array<{
    term: string;
    meaning: string;
  }>;
  followUps: string[];
}

export interface InterviewStage {
  stage: string;
  format: string;
  focus: string;
  status: "Complete" | "Upcoming";
}

export interface StoryRoute {
  questionType: string;
  primaryStory: string;
  proof: string;
  guardrail?: string;
}

export interface RoundPlaybook {
  round: string;
  title: string;
  objective: string;
  interviewerFocus: string;
  evidence: string;
  preparation: string;
  color: PrepColor;
}

export type ProductDesignStepId =
  | "clarify"
  | "users"
  | "prioritize"
  | "options"
  | "trade-offs"
  | "roadmap"
  | "summarize";

export interface ProductDesignFrameworkStep {
  id: ProductDesignStepId;
  step: number;
  label: string;
  focus: string;
  output: string;
  color: PrepColor;
}

export interface ProductDesignPrompt {
  title: string;
  prompt: string;
  possibleUsers: string[];
  tensions: string[];
  guardrail: string;
}

export interface ProductDesignAnswerBeat {
  label: string;
  template: string;
}

export interface MastercardTerm {
  term: string;
  meaning: string;
  whyItMatters: string;
}

export interface ReferenceLink {
  label: string;
  href: string;
  note: string;
}

export interface AcquisitionStackItem {
  name: string;
  acquired: string;
  capability: string;
  lifecycle: string;
  safeRelevance: string;
  resumeBridge: string;
  guardrail: string;
  sourceHref: string;
}

export interface ApplicationAlignment {
  requirement: string;
  resumeEvidence: string;
  interviewRoute: string;
}

export interface StarStory {
  title: string;
  useFor: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  managerFrame: string;
}

export type PracticeConfidence = "Weak" | "Developing" | "Ready";

export interface MentalModelNode {
  id: string;
  label: string;
  prompt: string;
  detail: string;
}

export interface MentalModelFollowUp {
  question: string;
  route: string;
}

export interface StarMentalModel {
  storyKey: string;
  storyTitle: string;
  memoryCode: string;
  useFor: string;
  nodes: MentalModelNode[];
  answer30: string;
  answer90: string;
  followUps: MentalModelFollowUp[];
}

export interface InterviewDayPrompterCard {
  title: string;
  subtitle: string;
  sections: Array<{
    heading: string;
    bullets: string[];
  }>;
}

export const interviewStages: InterviewStage[] = [
  { stage: "Recruiter screen", format: "Recruiter conversation", focus: "Background, motivation, compensation, and role fit", status: "Complete" },
  { stage: "Stage 1", format: "Hiring manager chat", focus: "Résumé, past projects, motivations, and behavioural judgment", status: "Complete" },
  { stage: "Stage 2", format: "Confirmed 45-minute Teams interview", focus: "Michael Cacho; Identity Verification product development, fraud/data products, and technical delivery", status: "Upcoming" },
  { stage: "Stage 3", format: "Bar raiser: leadership", focus: "Feature-launch scenario, prioritisation, and cross-functional alignment", status: "Upcoming" },
  { stage: "Stage 4", format: "Bar raiser: program leadership", focus: "Resume depth, capacity, PI planning, metrics, and resilience", status: "Upcoming" },
];

export const focusCards: PrepCard[] = [
  { title: "Stage 1 complete — Stage 2 confirmed", body: "The recruiter screen and Stage 1 hiring-manager chat are done. Stage 2 is confirmed for 28 August 2026, 11:30 a.m.–12:15 p.m. Toronto time with Michael Cacho on Teams. His supplied professional profile makes Identity Verification product development, fraud/data products, microservices, testing, latency, security, and product adoption especially relevant—but the invitation still does not prescribe exact questions.", cue: "Verified interviewer themes; exact interview questions remain unknown", color: "blue" },
  { title: "One résumé, four levels of depth", body: "Do not find a new story for every question. Know the problem, your ownership, stakeholders, trade-offs, technical decisions, measures, and lesson for each anchor story. The bar-raiser stages will probe until the detail either holds up or does not.", cue: "Problem → decision → trade-off → result → lesson", color: "purple" },
  { title: "Keep every answer résumé-true", body: "Use only examples and results you can defend from your submitted résumé and lived experience. Prepare genuine examples for a failure, setback, difficult stakeholder, and difficult manager conversation before the interview; do not turn a success into invented conflict.", cue: "Credibility beats a polished story", color: "coral" },
  { title: "Clarify team-specific Agile language", body: "Agile, Scrum, Kanban, Jira, capacity planning, and PI planning are fair preparation areas. But terms such as “3-3-5” are not universal Agile standards. If asked, clarify the team’s meaning first, then explain the principles and delivery mechanics you use.", cue: "Clarify context before answering a non-standard term", color: "amber" },
];

export const mastercardIntelligenceCards: PrepCard[] = [
  {
    title: "What Mastercard is",
    body: "Mastercard describes itself as a global technology company in payments. It connects people and organisations in more than 210 countries and territories, combining payments with value-added services that help customers manage fraud and risk, improve cybersecurity, and enhance digital-payment experiences.",
    cue: "Payments network + technology + value-added services—not a bank", color: "blue",
  },
  {
    title: "The purpose to connect to the role",
    body: "Its purpose is to power economies and empower people. In an interview, make that concrete: trusted business onboarding, lower fraud, appropriate compliance, and less customer friction enable more businesses to participate safely in digital commerce.",
    cue: "Purpose → trusted participation in the digital economy", color: "green",
  },
  {
    title: "Identity is a growth and risk problem",
    body: "Mastercard Identity positions identity as a way to reduce fraud, improve customer experience, and build trust. Its public materials emphasise making informed decisions with data and protecting genuine users without unnecessary friction. For this role, discuss the trade-off between approval/onboarding speed, fraud loss, manual review, privacy, and regulatory obligations.",
    cue: "Trust + conversion + fraud control; never optimise one in isolation", color: "teal",
  },
  {
    title: "What the culture signals mean in practice",
    body: "The Mastercard Way is Create value, Grow together, and Move fast, grounded in doing the right thing. Demonstrate those principles through choices: build scalable outcomes, bring in different perspectives, prioritise what matters, learn and pivot, own the result, and make customer or fraud risk transparent.",
    cue: "Create value · Grow together · Move fast · Do the right thing", color: "purple",
  },
  {
    title: "What the company says it assesses",
    body: "Mastercard’s interview guidance says every process includes behavioural and problem-solving assessment. It asks candidates to know their résumé in depth, explain why Mastercard, ask questions, and act with integrity. The final bar-raiser preparation should therefore be detailed but strictly factual.",
    cue: "Know the résumé, show your reasoning, ask thoughtful questions", color: "amber",
  },
  {
    title: "Business Identity: keep the claim precise",
    body: "The job description is specifically about business-entity risk assessment and verification: improving onboarding, reducing fraud, and supporting regulatory compliance. You have strong adjacent payments, controls, API, security, and delivery experience—but should not claim direct KYB or formal data-science ownership unless you can substantiate it.",
    cue: "Strong adjacent fit; no invented direct-KYB claim", color: "coral",
  },
];

export const mastercardTerms: MastercardTerm[] = [
  { term: "Business Identity / KYB", meaning: "Verification and risk assessment of a business entity and its relevant attributes before or during a commercial relationship.", whyItMatters: "This is the role’s core domain: secure onboarding and trusted business interactions." },
  { term: "KYC", meaning: "Verification of an individual customer’s identity and risk profile.", whyItMatters: "Use it to distinguish consumer identity from the business-focused scope of this role." },
  { term: "False positive / false negative", meaning: "A false positive wrongly flags a legitimate entity; a false negative misses a risky or fraudulent one.", whyItMatters: "Shows you understand that risk decisioning has customer-experience and loss trade-offs." },
  { term: "Manual review", meaning: "A human decision path for cases that need more evidence or cannot safely be automated.", whyItMatters: "Connects model/rule confidence thresholds with operational design and customer outcomes." },
  { term: "Risk-based decisioning", meaning: "Applying stronger controls where risk is higher while reducing friction for lower-risk interactions.", whyItMatters: "A useful way to discuss fraud prevention without advocating blanket friction." },
  { term: "Audit evidence", meaning: "Traceable records that show what rule, data, decision, approval, or control applied.", whyItMatters: "Directly maps to the job description and your CIBC/CRA controls background." },
  { term: "Acceptance criteria", meaning: "Observable, testable conditions that define whether a requirement is complete and correct.", whyItMatters: "Your strongest bridge from strategy and regulation to engineering-ready delivery." },
];

// ─────────────────────────────────────────────────────────────────────────
// Card network fundamentals — how Mastercard/Visa actually work behind the
// scenes. This is domain background, not job-description-specific research.
// ─────────────────────────────────────────────────────────────────────────

export const cardNetworkFundamentals: PrepCard[] = [
  {
    title: "The one thing to get right: Mastercard is not a bank",
    body: "Mastercard doesn’t hold your money, issue your card, or decide your credit limit — your bank (or a bank-like fintech) does all of that; it’s called the issuer. Mastercard builds and operates the electronic network that lets the issuer and the merchant’s bank talk to each other in about a second, anywhere in the world, using one shared set of rules. Think of Mastercard as the switchboard and the rulebook, not a lender.",
    cue: "Network + rules + brand — not a bank, not a lender",
    color: "blue",
  },
  {
    title: "The four-party model — who’s actually involved",
    body: "Every card transaction has four parties plus the network in the middle. The Cardholder is the person paying. The Merchant is the business getting paid. The Acquirer is the merchant’s bank (or its processor), which gets the merchant’s money into its account. The Issuer is the cardholder’s bank, which owns the lending risk and makes the approve/decline call. Mastercard or Visa sits between the acquirer and the issuer as the neutral switch — most banks in the world are never directly connected to each other, only to the network.",
    cue: "Cardholder → Merchant → Acquirer → NETWORK → Issuer",
    color: "purple",
  },
  {
    title: "Two separate jobs, two separate timelines",
    body: "“Approved” at checkout is not money moving — it’s authorization: the issuer placing a temporary hold on the cardholder’s funds or credit line, confirmed in about a second. The actual movement of money — clearing (agreeing what’s owed) and settlement (the money changing bank accounts) — happens later, usually in an overnight batch, one or two days after the purchase. That’s why a hotel “authorization” hold can disappear from a statement days later without ever becoming a real charge.",
    cue: "Authorization = an instant promise. Settlement = the real money, later.",
    color: "teal",
  },
  {
    title: "How Mastercard actually gets paid",
    body: "Mastercard doesn’t take a cut of the loan or set anyone’s interest rate — that’s the issuer’s business. Mastercard earns a network (assessment) fee, a small percentage of the transaction, for the right to use the brand, the switch, and the fraud and dispute tooling. The bigger slice most people call “the swipe fee” — interchange — flows to the issuer, not to Mastercard; Mastercard sets and publishes interchange rates but doesn’t keep the money. Mastercard’s 2025 reported net revenue was $32.8B, split roughly 59% network / 41% value-added services such as fraud and identity — this role sits in that second bucket.",
    cue: "Network fee → Mastercard. Interchange → the issuer. Mastercard just sets the rate.",
    color: "amber",
  },
  {
    title: "What Mastercard is really selling: trust and speed at global scale",
    body: "The technical product is a message that has to travel from a merchant’s terminal, often across two different countries and banking systems, to the exact bank that issued that card, get a yes-or-no decision, and come all the way back — reliably, in about a second, roughly 175.5 billion times a year. Mastercard calls this routing “switching.” The other half of the business — the part this role sits in — is everything layered on top of that switch to make each decision smarter and safer: fraud signals, identity verification, and dispute rules.",
    cue: "175.5B switched transactions a year — reliability and speed are the product",
    color: "green",
  },
  {
    title: "Card-present vs. card-not-present, and why tokenization matters",
    body: "A chip or tap transaction is “card-present” — the physical card or device proves itself cryptographically to the terminal, which is hard to fake. Typing a card number into a website is “card-not-present” — much easier to attempt fraudulently, since there’s no physical proof. Tokenization — replacing the real card number with a single-use or device-scoped substitute, as with a digital wallet or a saved checkout — is the industry’s main answer: even if the token leaks, it’s useless outside that one device or merchant. It’s the same trade-off Business Identity works on, just for businesses instead of cards.",
    cue: "Physical proof (chip/tap) vs. no proof (typed number) → tokenization closes the gap",
    color: "coral",
  },
  {
    title: "Disputes and chargebacks close the loop",
    body: "If a transaction is disputed as fraudulent, wrong, or undelivered, the cardholder can raise it with their issuer, which can force money back from the merchant under the network’s chargeback rules — the “trust after the transaction” layer that acquisitions like Ethoca support. This is also your own résumé evidence: managing Visa/Mastercard chargeback cases by deadline and recovery value at Skye Bank is a direct, credible bridge into how this network protects trust end-to-end.",
    cue: "Chargebacks are the network’s built-in trust backstop — and your own résumé evidence",
    color: "gray",
  },
];

export const paymentFlowTerms: MastercardTerm[] = [
  { term: "Issuer", meaning: "The cardholder’s own bank (or bank-like fintech) — issues the card, owns the credit/debit risk, and makes the approve/decline call.", whyItMatters: "This is who actually says yes or no on a purchase — not Mastercard." },
  { term: "Acquirer", meaning: "The merchant’s bank or payment processor — sets the merchant up to accept cards and receives the settled funds on the merchant’s behalf.", whyItMatters: "The merchant-side mirror of the issuer; Mastercard connects the two." },
  { term: "Card network / scheme", meaning: "The company — Mastercard, Visa, and similar — that operates the switch connecting every issuer and acquirer, and sets the technical and operating rules everyone must follow.", whyItMatters: "This is Mastercard’s actual role: infrastructure and rules, not banking." },
  { term: "Interchange fee", meaning: "A fee, set as a percentage plus a fixed amount, that the acquirer pays to the issuer on every transaction — the largest component of what merchants pay to accept cards.", whyItMatters: "Mastercard sets and publishes the rate, but the money goes to the issuer, not to Mastercard." },
  { term: "Network / assessment fee", meaning: "A much smaller fee that issuers and acquirers pay directly to the network for using the rails and the brand.", whyItMatters: "This, plus value-added services, is how Mastercard itself actually earns money." },
  { term: "Merchant discount rate (MDR)", meaning: "The total percentage a merchant is charged to accept a card payment — bundles interchange, the network fee, and the acquirer’s own markup.", whyItMatters: "The number a merchant actually sees on their statement; interchange is the biggest piece of it." },
  { term: "Authorization", meaning: "The real-time, roughly one-second check where the issuer approves or declines a transaction and places a hold on funds — no money has moved yet.", whyItMatters: "This is the fast yes/no step everyone experiences at checkout." },
  { term: "Clearing", meaning: "The batch process, usually run once a day, where the acquirer and issuer exchange final transaction details through the network and agree what’s actually owed.", whyItMatters: "This is where an “approved” hold turns into a firm, itemized bill." },
  { term: "Settlement", meaning: "The actual movement of funds between the issuer’s and acquirer’s settlement accounts, completing the transaction — typically one to two days after the purchase.", whyItMatters: "This is when money really moves; the merchant is paid here, not at authorization." },
  { term: "BIN / IIN (Bank Identification Number)", meaning: "The first six to eight digits of a card number, which identify exactly which bank issued the card.", whyItMatters: "This is literally how the network knows where to route an authorization request." },
  { term: "PAN (Primary Account Number)", meaning: "The full card number embossed or printed on the card.", whyItMatters: "The core identifier a transaction carries, and the main thing tokenization is designed to hide." },
  { term: "Chargeback", meaning: "A forced reversal of funds back to the cardholder, initiated through the issuer under network dispute rules, when a transaction is disputed as fraudulent, wrong, or undelivered.", whyItMatters: "Your direct Skye Bank experience — a mechanism you already know from the inside." },
  { term: "Tokenization", meaning: "Replacing a real card number with a substitute value that’s useless if stolen, scoped to one device or merchant.", whyItMatters: "Core to how digital wallets and card-not-present fraud prevention work today." },
];

export const cardNetworkAuthDiagram = `sequenceDiagram
    autonumber
    actor C as Cardholder
    participant M as Merchant (terminal / website)
    participant A as Acquirer (merchant's bank)
    participant N as Card Network (Mastercard / Visa)
    participant I as Issuer (cardholder's bank)

    C->>M: Presents card (tap, chip, or typed online)
    M->>A: Sends authorization request (card number, amount, merchant ID)
    A->>N: Forwards the request to the network
    N->>I: Routes to the exact bank that issued this card (via the BIN)
    I->>I: Checks balance/credit, fraud rules, card status
    I-->>N: Approve or decline
    N-->>A: Relays the decision
    A-->>M: Relays the decision
    M-->>C: "Approved" - receipt printed
    Note over C,I: All of this happens in about one second.
    Note over C,I: No money has moved yet - this is only a hold.
`;

export const cardNetworkSettlementDiagram = `sequenceDiagram
    autonumber
    participant M as Merchant
    participant A as Acquirer
    participant N as Card Network
    participant I as Issuer
    actor C as Cardholder

    Note over M,I: End of day: the merchant's approved transactions are batched
    M->>A: Submits the batch of approved sales for clearing
    A->>N: Sends the clearing file
    N->>N: Calculates the net amount owed between every issuer and acquirer
    N->>I: Tells the issuer the final amount to fund
    I->>N: Transfers settlement funds (minus the interchange it keeps)
    N->>A: Forwards the net settlement funds
    A->>M: Deposits funds to the merchant (minus the merchant discount rate)
    I->>C: Bills the cardholder on their statement
    Note over M,C: This is when money actually moves - typically one to two days after the purchase.
`;

export const cardNetworkFlowNodes: FlowNode[] = [
  { id: "cardholder", label: "Cardholder", subtitle: "Uses the card", color: "#7c6fcd", x: 10, y: 127 },
  { id: "merchant", label: "Merchant", subtitle: "Accepts payment", color: "#3eb89a", x: 160, y: 127 },
  { id: "acquirer", label: "Acquirer", subtitle: "Merchant's bank", color: "#e8a83a", x: 310, y: 127 },
  { id: "network", label: "Network", subtitle: "Mastercard / Visa", color: "#4a8fe8", x: 460, y: 127 },
  { id: "issuer", label: "Issuer", subtitle: "Cardholder's bank", color: "#58b87a", x: 610, y: 127 },
];

export const cardNetworkFlowSteps: FlowDiagramStep[] = [
  {
    label: "1 · Card presented",
    description: "The cardholder taps, dips, or types their card details at checkout. At this exact moment Mastercard has no idea a purchase is happening — the card only has to prove itself to the merchant's terminal.",
    activeNodes: ["cardholder", "merchant"],
    activeEdge: ["cardholder", "merchant"],
    services: ["Card-present: chip / tap", "Card-not-present: typed online"],
  },
  {
    label: "2 · Merchant requests authorization",
    description: "The merchant's terminal or website sends an authorization request — card number, amount, merchant ID — to its own bank, the acquirer.",
    activeNodes: ["merchant", "acquirer"],
    activeEdge: ["merchant", "acquirer"],
    mutation: "Authorization request",
    services: ["Acquirer = the merchant's bank or processor"],
  },
  {
    label: "3 · Acquirer forwards to the network",
    description: "The acquirer has no direct relationship with the cardholder's bank, so it hands the request to Mastercard's switch — the shared infrastructure every issuer and acquirer in the world connects to.",
    activeNodes: ["acquirer", "network"],
    activeEdge: ["acquirer", "network"],
    services: ["This routing step is what Mastercard calls a 'switched transaction'"],
  },
  {
    label: "4 · Network routes to the issuer",
    description: "Mastercard reads the first six to eight digits of the card (the BIN) to identify exactly which bank issued it, then routes the request there — often across countries and completely different banking systems — in milliseconds.",
    activeNodes: ["network", "issuer"],
    activeEdge: ["network", "issuer"],
    services: ["BIN routing", "210+ countries connected"],
  },
  {
    label: "5 · Issuer makes the actual decision",
    description: "The cardholder's own bank checks the account balance or credit limit, runs fraud checks, and confirms the card isn't blocked or reported stolen. This yes/no decision belongs entirely to the issuer — Mastercard has no vote here.",
    activeNodes: ["issuer"],
    activeEdge: ["network", "issuer"],
    services: ["Balance/credit check", "Fraud scoring", "Card status"],
  },
  {
    label: "6 · Decision sent back through the network",
    description: "The issuer's approve or decline travels back the same path it came, through Mastercard's switch to the acquirer.",
    activeNodes: ["issuer", "network"],
    activeEdge: ["issuer", "network"],
    mutation: "Authorization response",
    services: [],
  },
  {
    label: "7 · Acquirer relays it to the merchant",
    description: "The acquirer passes the response on to the merchant's terminal or website, completing the round trip back from the network.",
    activeNodes: ["network", "acquirer"],
    activeEdge: ["network", "acquirer"],
    services: [],
  },
  {
    label: "8 · Sale completes",
    description: "The merchant sees 'Approved,' prints a receipt, and hands over the goods. Total elapsed time: roughly one second. Critically, no money has moved yet — this was only a hold.",
    activeNodes: ["acquirer", "merchant"],
    activeEdge: ["acquirer", "merchant"],
    services: ["End of the authorization phase (real-time)"],
  },
  {
    label: "9 · End of day: merchant batches sales",
    description: "The merchant (or its processor) bundles every approved transaction from the day and submits it to the acquirer for clearing — the process that turns a temporary hold into a firm, itemized bill.",
    activeNodes: ["merchant", "acquirer"],
    activeEdge: ["merchant", "acquirer"],
    mutation: "Clearing batch",
    services: ["Start of clearing & settlement (batched, T+1/T+2)"],
  },
  {
    label: "10 · Acquirer sends the clearing file",
    description: "The acquirer forwards the batch to Mastercard's network, which calculates exactly how much every issuer owes every acquirer across the whole system.",
    activeNodes: ["acquirer", "network"],
    activeEdge: ["acquirer", "network"],
    services: [],
  },
  {
    label: "11 · Network tells the issuer what's owed",
    description: "Mastercard nets out the day's transactions and tells each issuer the final amount to fund for the cards it issued.",
    activeNodes: ["network", "issuer"],
    activeEdge: ["network", "issuer"],
    services: [],
  },
  {
    label: "12 · Issuer funds settlement, keeps interchange",
    description: "The issuer transfers the settlement funds through the network — after deducting interchange, the fee it keeps for having taken on the lending risk and fraud liability.",
    activeNodes: ["issuer", "network"],
    activeEdge: ["issuer", "network"],
    mutation: "Settlement funds",
    services: ["Interchange is deducted here — and stays with the issuer, not Mastercard"],
  },
  {
    label: "13 · Network forwards net funds to the acquirer",
    description: "Mastercard passes the net settlement amount on to the acquirer, after taking its own much smaller network/assessment fee.",
    activeNodes: ["network", "acquirer"],
    activeEdge: ["network", "acquirer"],
    services: ["Mastercard's own fee is taken here — far smaller than interchange"],
  },
  {
    label: "14 · Merchant gets paid, cardholder gets billed",
    description: "The acquirer deposits the remaining funds into the merchant's account, minus its own markup — usually one to two days after the original purchase. Meanwhile the issuer bills the cardholder on their statement, closing the loop.",
    activeNodes: ["acquirer", "merchant"],
    activeEdge: ["acquirer", "merchant"],
    services: ["Merchant discount rate = interchange + network fee + acquirer markup"],
  },
];

export const mastercardQuestionsToAsk: PrepCard[] = [
  { title: "Product direction", body: "Which Business Identity customer problem is most important for this team to solve in the next 6–12 months, and how will you measure whether it is solved?", cue: "Shows outcome orientation", color: "blue" },
  { title: "Decision trade-offs", body: "Which trade-offs are most active today—for example, onboarding speed, data coverage, fraud loss, manual-review capacity, or regulatory requirements?", cue: "Shows mature product judgment", color: "teal" },
  { title: "Operating model", body: "How do product, engineering, data science, legal/compliance, and commercial partners make decisions when a requirement crosses those functions?", cue: "Shows cross-functional readiness", color: "purple" },
  { title: "Success in role", body: "What would distinguish an excellent first six months in this role from an adequate one?", cue: "Shows ownership and standards", color: "green" },
];

export const mastercardReferences: ReferenceLink[] = [
  { label: "2025 Form 10-K · official filing", href: "https://www.sec.gov/Archives/edgar/data/1141391/000114139126000013/ma-20251231.htm", note: "Business model, strategy, revenue mix, metrics, competitors, risks, and regulation." },
  { label: "Q2 2026 earnings review · official", href: "https://www.mastercard.com/global/en/news-and-trends/stories/2026/earnings-review-q2-2026.html", note: "Current signals: agentic commerce, digital assets, and merchant trust." },
  { label: "About Mastercard · official", href: "https://www.mastercard.com/global/en/for-the-world/about-us.html", note: "Purpose, global reach, and the Mastercard Way." },
  { label: "Mastercard Identity · official", href: "https://www.mastercard.com/global/en/business/cybersecurity-fraud-prevention/identity.html", note: "Identity, fraud, customer experience, and trust." },
  { label: "Identity Insights for Transactions · official", href: "https://www.mastercard.com/us/en/business/cybersecurity-fraud-prevention/identity/insights/identity-insights-for-transactions.html", note: "Single-API identity, device, and payment insights for risk decisions." },
  { label: "Identity Review 360 · official", href: "https://www.mastercard.com/us/en/business/cybersecurity-fraud-prevention/identity/solutions/identity-review-360.html", note: "Explainable signals, manual review, false positives, and workflow integration." },
  { label: "Mastercard Developers · official", href: "https://developer.mastercard.com/products", note: "Public product catalogue, API documentation, and sandbox entry points." },
  { label: "Mastercard platform acquisitions · official", href: "https://www.mastercard.com/news/press/2021/november/mastercard-opens-the-door-for-fintech-companies-to-build-launch-and-grow", note: "Mastercard describes organic and acquisition-led expansion across identity, open banking, crypto, disputes, and behavioural security." },
  { label: "2024 Investment Community presentation · official", href: "https://investor.mastercard.com/files/doc_events/2024-Mastercard-Investment-Community-Presentation.pdf", note: "Mastercard’s pre-transaction, transaction, and post-transaction Security Solutions lifecycle." },
  { label: "Ekata acquisition · official", href: "https://investor.mastercard.com/investor-news/investor-news-details/2021/Mastercard-Focuses-on-Digital-Identity-Innovation-with-Close-of-Ekata-Acquisition/default.aspx", note: "Identity verification for account opening, payments, and other digital interactions." },
  { label: "Recorded Future acquisition · official", href: "https://www.mastercard.com/global/en/news-and-trends/press/2024/december/mastercard-finalizes-acquisition-of-recorded-future.html", note: "Threat intelligence added to cybersecurity, identity, fraud prevention, and real-time scoring." },
  { label: "Finicity acquisition · official", href: "https://www.mastercard.com/news/press/press-releases/2020/june/mastercard-to-acquire-finicity-to-advance-open-banking-strategy/", note: "Open-banking data, account-owner verification, and permissioned financial-data connectivity." },
  { label: "NuData acquisition · official", href: "https://investor.mastercard.com/investor-news/investor-news-details/2017/Mastercard-Enhances-Security-of-the-Internet-of-Things-with-the-Acquisition-of-NuData-Security-Inc/default.aspx", note: "Session and behavioural-biometric indicators for near-real-time fraud decisions." },
  { label: "RiskRecon acquisition · official", href: "https://newsroom.mastercard.com/news/press/2019/december/mastercard-acquires-riskrecon-to-enhance-cybersecurity-capabilities/", note: "AI and data analytics for cyber-risk discovery, assessment, and continuous monitoring." },
  { label: "CipherTrace acquisition · official", href: "https://investor.mastercard.com/investor-news/investor-news-details/2021/Mastercard-Strengthens-Digital-Asset-Security-with-Close-of-CipherTrace-Acquisition/default.aspx", note: "Digital-asset security, fraud intelligence, transparency, and compliance support." },
  { label: "Ethoca network · official", href: "https://www.mastercard.com/news/press/press-releases/2020/april/ethoca-to-bring-digital-receipts-to-consumers-through-collaboration-with-microsoft/", note: "Merchant–issuer fraud and dispute information sharing; Mastercard acquired Ethoca in 2019." },
  { label: "Experian + Mastercard Identity · partner source", href: "https://www.experianplc.com/newsroom/press-releases/2025/experian-strengthens-its-fraud-fighting-capabilities-with-master", note: "Mastercard Identity Insights integrated into Experian Ascend for identity and fraud decisions." },
  { label: "Entrust + Mastercard Identity · partner source", href: "https://www.entrust.com/company/newsroom/entrust-and-mastercard-team-to-fight-fraud", note: "Mastercard Identity insights powered by Ekata integrated into adaptive onboarding workflows." },
  { label: "2024 Impact Report · official", href: "https://www.mastercard.com/content/dam/mccom/shared/for-the-world/corporate-impact/pdfs/mastercard-2024-impact-report.pdf", note: "Mastercard Way behaviours and culture expectations." },
  { label: "Brand history · official", href: "https://www.mastercard.com/brandcenter/us/en/brand-history.html", note: "From the 1966 Interbank Card Association to a global technology platform." },
  { label: "Management Committee · official", href: "https://investor.mastercard.com/corporate-governance/management-committee/default.aspx", note: "Current leadership and Michael Miebach’s role in the platform strategy." },
  { label: "Michael Cacho · professional profile", href: "https://ca.linkedin.com/in/mcacho", note: "Interviewer context supplied by the candidate: Director, Product Development; Identity Verification, fraud/data products, microservices, testing, latency, and security." },
  { label: "Glassdoor culture signals · outside source", href: "https://www.glassdoor.ca/Reviews/Mastercard-Reviews-E3677.htm", note: "Anonymous employee reviews; useful as directional evidence, never as universal truth." },
  { label: "Indeed culture signals · outside source", href: "https://www.indeed.com/cmp/Mastercard/reviews?fcountry=ALL&ftopic=culture", note: "Anonymous employee reviews on learning, flexibility, management, and advancement." },
  { label: "Mastercard hiring process", href: "https://careers.mastercard.com/us/en/mastercards-hiring-process", note: "Official interview expectations and stages." },
  { label: "Interview tips", href: "https://careers.mastercard.com/us/en/interview-tips", note: "Official guidance for preparation and interview conduct." },
];

export const mastercardProductResearch: PrepCard[] = [
  {
    title: "Product map: three connected layers",
    body: "1) Payment network: authorisation, clearing, settlement, tokenisation, and related network capabilities. 2) New flows: commercial payments, Mastercard Move, account-to-account and real-time payments. 3) Services and other solutions: identity, cybersecurity, fraud/risk, authentication, data insights, consulting, processing, and gateways. The layers reinforce one another rather than operating as isolated products.",
    cue: "Network → new flows → services", color: "blue",
  },
  {
    title: "Customers and users: do not call Mastercard a bank",
    body: "Mastercard’s direct customers are mainly issuers, acquirers, merchants, governments, fintechs, digital partners, and businesses. Consumers experience Mastercard through those partners. Mastercard generally does not issue cards, set consumer interest rates, or own the cardholder account. For Business Identity, likely users include onboarding, risk, fraud, compliance, operations, and developer teams at customer organisations.",
    cue: "B2B/B2B2C platform; cardholders are usually not the direct customer", color: "teal",
  },
  {
    title: "Revenue model and scale",
    body: "For 2025, Mastercard reported $32.8B in net revenue: $19.5B from its payment network and $13.3B from value-added services and solutions. Network revenue is driven by payment volume, cross-border activity, and switched transactions; services are sold through transaction-based or fixed fees. Mastercard also reported $10.6T in gross dollar volume and 175.5B switched transactions.",
    cue: "$32.8B revenue · 59% network / 41% services · 175.5B switched transactions", color: "green",
  },
  {
    title: "Competitors and differentiation",
    body: "Card-network competitors include Visa, American Express, UnionPay, JCB, and Discover. Broader competition includes domestic debit networks, real-time account-to-account systems, wallets, fintechs, government-backed digital infrastructure, and digital currencies. Mastercard differentiates through global acceptance, trusted infrastructure, multi-rail capabilities, partner distribution, and a data-and-services portfolio that can improve fraud, identity, and approval decisions.",
    cue: "Competes with networks and alternative rails—not only Visa", color: "purple",
  },
  {
    title: "What customers value—and where friction appears",
    body: "The value proposition is global reach, reliability, fraud intelligence, richer decisions, and APIs that augment existing workflows. The recurring product tensions are false declines versus fraud loss, fast onboarding versus sufficient verification, automation versus explainability, and global scale versus local data/regulation. Integration effort, manual-review queues, unclear reason codes, and inconsistent geographic coverage are useful discovery hypotheses—not facts to assert about this product.",
    cue: "Trust, conversion, loss, explainability, integration", color: "amber",
  },
  {
    title: "Use the product before the interview",
    body: "Business Identity is an enterprise product, so a cardholder-style free trial may not exist. Instead: create a Mastercard Developers account, inspect the product catalogue and Identity API documentation, use an available sandbox or Postman collection, trace the request/response and error model, and compare that experience with the public Identity Review 360 workflow. Record one thing that builds developer confidence and one question about onboarding or observability.",
    cue: "Developer portal → API docs → sandbox → evidence-based observation", color: "coral",
  },
  {
    title: "Current news worth knowing · August 2026",
    body: "Mastercard’s current strategic signals include Agent Pay and agentic commerce, Merchant Trust Services, digital assets and stablecoin infrastructure, and continued identity/fraud investment. Your point of view: autonomous agents, machines, and new rails increase the need to verify which business or actor is legitimate, what it is authorised to do, and how a decision can be audited.",
    cue: "New commerce models increase the value of trusted identity", color: "blue",
  },
];

export const acquisitionStackBrief: PrepCard[] = [
  {
    title: "The safe strategic answer",
    body: "Mastercard has expanded its trust and Security Solutions platform through both internal development and acquisitions. Ekata adds identity-verification intelligence; NuData adds session and behavioural signals; Finicity adds permissioned open-banking data; RiskRecon adds cyber-risk assessment; CipherTrace adds digital-asset intelligence; Ethoca adds dispute and fraud collaboration; and Recorded Future adds threat intelligence. Together, these capabilities can support trust before, during, and after an interaction.",
    cue: "Acquired capabilities reinforce a broader trust platform across the lifecycle", color: "blue",
  },
  {
    title: "What this does—and does not—prove",
    body: "Mastercard publicly links acquired capabilities to identity, fraud, cybersecurity, open banking, digital assets, and disputes. Public sources do not establish that Business Identity is simply ‘the Ekata layer,’ that every business onboarding decision uses all seven products, or that one internal team owns the full stack. Present the map as strategic context and ask Michael how the Business Identity product actually consumes or contributes signals.",
    cue: "Confirmed portfolio; internal dependency map must be validated", color: "amber",
  },
  {
    title: "The product tension",
    body: "Approve legitimate people and businesses quickly while detecting bad actors early. A complete metric view therefore pairs onboarding conversion and time-to-decision with fraud capture, false positives, manual-review load, explainability, data coverage, privacy, and API reliability. This is the same target-metric plus guardrail discipline used throughout the role-prep pages.",
    cue: "Speed and conversion + fraud and trust guardrails", color: "teal",
  },
  {
    title: "The API-first implication",
    body: "Mastercard explicitly promotes acquired and internally built capabilities through its developer platform. For this role, the practical PM artifacts are likely APIs, schemas, reason codes, validation rules, non-functional requirements, data lineage, test evidence, and integration guidance. That maps strongly to your Aeroplan, Contingency Management, and Flow Runner experience.",
    cue: "Acquisition value becomes customer value through usable, reliable integration", color: "purple",
  },
  {
    title: "Partner distribution matters too",
    body: "Experian integrated Mastercard Identity Insights into Ascend in 2025, while Entrust integrated Mastercard Identity insights powered by Ekata into an adaptive onboarding platform. These examples show that portfolio value is distributed through partner workflows as well as direct Mastercard products. Your Aeroplan story is relevant because it shows secure contracts, quality gates, and cross-company delivery.",
    cue: "Capability → partner workflow → measurable customer outcome", color: "green",
  },
  {
    title: "Current product naming",
    body: "Use current Mastercard names where possible: Identity Insights for Accounts, Identity Insights for Transactions, and Identity Review 360. Historical Ekata names can help explain acquisition lineage, but do not assume every legacy product name or architecture remains current. Mastercard’s 2026 account-opening material emphasises contextual identity signals, risk-based routing, and approving trusted users with less friction.",
    cue: "Know the lineage; speak in current portfolio language", color: "coral",
  },
];

export const acquisitionLifecycleCards: PrepCard[] = [
  { title: "Before the interaction", body: "Threat intelligence and ecosystem posture can inform which entities, credentials, vendors, or infrastructure deserve additional scrutiny. Relevant capabilities include Recorded Future and RiskRecon; identity and open-finance signals may support onboarding decisions.", cue: "Anticipate and assess", color: "purple" },
  { title: "During onboarding or transaction", body: "Identity, behavioural, device, financial-data, payment, and digital-asset signals can improve risk decisions. Relevant capabilities include Ekata lineage, NuData, Finicity, CipherTrace, and Mastercard network intelligence.", cue: "Verify, authenticate, and decide", color: "blue" },
  { title: "After the transaction", body: "Fraud and dispute collaboration resolves problems and generates learning that can strengthen future controls. Ethoca is the clearest acquired capability in this stage; threat and fraud intelligence also feed continuous improvement.", cue: "Resolve, learn, and strengthen", color: "green" },
];

export const acquisitionStackItems: AcquisitionStackItem[] = [
  {
    name: "NuData",
    acquired: "2017",
    capability: "Session analytics and behavioural-biometric indicators used to distinguish authentic users from higher-risk interactions.",
    lifecycle: "Login, authentication, and transaction context",
    safeRelevance: "Shows Mastercard’s layered identity strategy includes behaviour and device interaction—not only static identity attributes.",
    resumeBridge: "Discuss how post-launch signals and observable behaviour improve product decisions; do not claim behavioural-biometrics delivery experience.",
    guardrail: "It predates the brief’s 2019–2026 range and is not proof of Business Identity’s internal architecture.",
    sourceHref: "https://investor.mastercard.com/investor-news/investor-news-details/2017/Mastercard-Enhances-Security-of-the-Internet-of-Things-with-the-Acquisition-of-NuData-Security-Inc/default.aspx",
  },
  {
    name: "Ethoca",
    acquired: "2019",
    capability: "Near-real-time merchant–issuer collaboration for digital fraud, disputes, transaction clarity, and chargeback avoidance.",
    lifecycle: "Post-transaction dispute and fraud resolution",
    safeRelevance: "Demonstrates that Mastercard creates trust after authorization as well as before it.",
    resumeBridge: "Skye Bank chargeback lifecycle, deadline discipline, dispute evidence, and payment-network operations.",
    guardrail: "Treat Ethoca as adjacent dispute/fraud intelligence—not as a core identity-verification engine.",
    sourceHref: "https://www.mastercard.com/news/press/press-releases/2020/april/ethoca-to-bring-digital-receipts-to-consumers-through-collaboration-with-microsoft/",
  },
  {
    name: "RiskRecon",
    acquired: "Announced 2019",
    capability: "AI and data analytics for non-invasive cyber-risk discovery, assessment, and continuous third-party monitoring.",
    lifecycle: "Before onboarding and ongoing ecosystem monitoring",
    safeRelevance: "Highlights the importance of the cyber posture of vendors, partners, and connected organisations.",
    resumeBridge: "Aeroplan vendor SOW, dependency, security, and delivery-risk management are adjacent product disciplines.",
    guardrail: "Do not claim RiskRecon scores every business joining Mastercard or is automatically part of each Business Identity decision.",
    sourceHref: "https://newsroom.mastercard.com/news/press/2019/december/mastercard-acquires-riskrecon-to-enhance-cybersecurity-capabilities/",
  },
  {
    name: "Finicity",
    acquired: "2020 · $825M + potential earn-out",
    capability: "Permissioned access to financial data, open-banking connectivity, analytics, and account-owner verification capabilities.",
    lifecycle: "Account linking, account opening, lending, and account-to-account flows",
    safeRelevance: "Shows how permissioned financial data can complement identity signals and improve account ownership or fraud decisions.",
    resumeBridge: "Aeroplan secure account linking, API contracts, consent-aware data movement, and partner integration.",
    guardrail: "Open banking and identity can complement one another; do not describe Finicity as an Ekata product or assume a shared implementation path.",
    sourceHref: "https://www.mastercard.com/news/press/press-releases/2020/june/mastercard-to-acquire-finicity-to-advance-open-banking-strategy/",
  },
  {
    name: "Ekata",
    acquired: "2021 · $850M",
    capability: "Identity-verification data and risk intelligence for online account opening, payments, and other digital interactions.",
    lifecycle: "Account opening and transaction risk decisions",
    safeRelevance: "The most directly relevant acquisition lineage for Mastercard’s current Identity Insights portfolio and Michael’s Identity Verification background.",
    resumeBridge: "Aeroplan token exchange and OpenAPI quality gates; Contingency API validation; risk-aware technical product requirements.",
    guardrail: "Say Ekata advanced Mastercard Identity capabilities—not that every Business Identity product ‘sits on Ekata’ unless the interviewer confirms it.",
    sourceHref: "https://investor.mastercard.com/investor-news/investor-news-details/2021/Mastercard-Focuses-on-Digital-Identity-Innovation-with-Close-of-Ekata-Acquisition/default.aspx",
  },
  {
    name: "CipherTrace",
    acquired: "2021",
    capability: "Blockchain analytics, digital-asset security, fraud intelligence, transparency, and regulatory/compliance support.",
    lifecycle: "Digital-asset onboarding, monitoring, and transactions",
    safeRelevance: "Extends Mastercard’s trust proposition to cryptocurrency businesses, wallets, exchanges, and digital-asset flows.",
    resumeBridge: "Use your controls, auditability, and API discipline; present crypto-domain experience only if you genuinely have it.",
    guardrail: "Do not imply CipherTrace verifies the identity of every entity in a crypto transaction; its confirmed focus is intelligence, risk, and compliance.",
    sourceHref: "https://investor.mastercard.com/investor-news/investor-news-details/2021/Mastercard-Strengthens-Digital-Asset-Security-with-Close-of-CipherTrace-Acquisition/default.aspx",
  },
  {
    name: "Recorded Future",
    acquired: "2024 · $2.65B",
    capability: "AI-driven threat intelligence and actionable analytics across cyber threats, with more than 1,900 clients in 75 countries at announcement.",
    lifecycle: "Across the lifecycle: anticipate threats and enrich identity, fraud, scoring, and cyber services",
    safeRelevance: "Signals Mastercard’s move toward earlier, predictive and externally informed trust decisions—not only reactive fraud controls.",
    resumeBridge: "Aeroplan’s security-first decision and audit-ready requirements show the product behaviour needed to operationalise risk intelligence.",
    guardrail: "Ask how threat intelligence is integrated; do not assert that it directly controls Business Identity onboarding today.",
    sourceHref: "https://www.mastercard.com/global/en/news-and-trends/press/2024/december/mastercard-finalizes-acquisition-of-recorded-future.html",
  },
];

export const acquisitionQuestionsToAsk: PrepCard[] = [
  { title: "Integration and roadmap", body: "Mastercard has added identity, behavioural, open-finance, cyber-risk, and threat-intelligence capabilities through acquisitions. How does the Business Identity team decide which signals become shared platform capabilities versus product-specific integrations?", cue: "Shows portfolio thinking without assuming the architecture", color: "blue" },
  { title: "For Michael · product development", body: "Given your experience developing Identity Verification products, where is the hardest integration challenge today: data quality, reason-code consistency, latency, model performance, developer experience, or customer workflow adoption?", cue: "Connects his background to concrete product trade-offs", color: "teal" },
  { title: "Recorded Future direction", body: "Mastercard has said Recorded Future can enhance identity, fraud prevention, real-time scoring, and cybersecurity. Which opportunities are most relevant to Business Identity, and what evidence would the team need before adding a threat-intelligence signal to a customer decision?", cue: "Research-based and appropriately exploratory", color: "purple" },
];

export const mastercardStrategyResearch: PrepCard[] = [
  {
    title: "Purpose and strategic architecture",
    body: "Mastercard’s stated purpose is to power economies and empower people. Its 2025 filing describes three priorities: consumer payments; commercial and new payment flows; and services and other solutions. The corporate strategy is to grow the core, diversify customers and geographies, and build for the future, enabled by technology, Data & AI, brand, people, and franchise trust.",
    cue: "Grow core · diversify · build the future", color: "blue",
  },
  {
    title: "Your interview-ready strategic thesis",
    body: "Mastercard’s moat is not only the card rail. Network scale generates trusted interactions and data; that data improves identity, security, authentication, and insights; those services help win customer relationships and additional volume; and the resulting activity improves the network and services again. Business Identity extends that trust loop from people and transactions to business entities.",
    cue: "Network → data → services → customer value → more network activity", color: "teal",
  },
  {
    title: "Strengths",
    body: "Global network scale and acceptance; a trusted brand and franchise model; large proprietary datasets and AI capabilities; strong partner distribution; resilient infrastructure; and a services business that grew faster than the network in 2025. The combination gives Mastercard several ways to create value around a payment, not only during switching.",
    cue: "Scale + trust + data + distribution + resilient technology", color: "green",
  },
  {
    title: "Weaknesses and internal challenges",
    body: "A large B2B platform can have long sales, integration, and decision cycles; Mastercard has less direct control over the end-user experience than a consumer platform; local data quality and regulation complicate global identity products; acquisitions and product lines must be integrated coherently; and its five largest customers represented 21% of 2025 net revenue. Treat these as structural constraints to manage, not interview criticism.",
    cue: "Complex ecosystem, indirect UX ownership, local variation, concentration", color: "amber",
  },
  {
    title: "Opportunities",
    body: "Digitisation of cash and commercial flows; KYB and business onboarding; AI-assisted and agentic commerce; account-to-account and real-time payments; tokenised deposits, stablecoins, and digital assets; cybersecurity; and services sold beyond Mastercard-card transactions. Business Identity can become reusable trust infrastructure across several of these flows.",
    cue: "Trust layer across cards, accounts, agents, and digital assets", color: "purple",
  },
  {
    title: "Threats",
    body: "Visa and other global networks; domestic and real-time rails such as UPI- or Pix-like systems; wallets and fintech disintermediation; government-backed digital infrastructure or currencies; cyberattacks and outages; privacy and AI regulation; merchant-fee and interchange scrutiny; pricing pressure; and geopolitical or cross-border volatility.",
    cue: "Competition + regulation + resiliency + trust", color: "coral",
  },
  {
    title: "Where the company is heading",
    body: "Expect Mastercard to remain a network while becoming more rail-agnostic and service-led: securing identities and devices, orchestrating movement across cards and accounts, enabling commercial and machine-to-machine flows, and monetising decision intelligence. A sensible product direction is portable, explainable business trust that can be consumed through APIs and operational tools across channels.",
    cue: "From card network to trusted commerce platform", color: "blue",
  },
];

export const mastercardCultureResearch: PrepCard[] = [
  {
    title: "The Mastercard Way",
    body: "Create value: think big and bold, innovate with intention, deliver scalable solutions. Grow together: say what you mean, bring different perspectives, help others be great. Move fast: prioritise what matters, learn and pivot, own the outcome. The foundation is doing the right thing through decency, inclusion, and being a force for good.",
    cue: "Use one behaviour in each story; do not merely recite the labels", color: "blue",
  },
  {
    title: "Culture ↔ strategy connection",
    body: "A global network and identity business depends on partner trust, cross-border collaboration, secure execution, and consistent standards. Grow together fits an ecosystem company; Move fast supports competition with fintechs and new rails; Create value and scalable solutions fit a platform economics model; doing the right thing is foundational when products influence fraud, access, and privacy.",
    cue: "Culture is an operating system for trust and scale", color: "teal",
  },
  {
    title: "Outside perspective · directional, not definitive",
    body: "Recent anonymous Glassdoor and Indeed summaries are broadly positive on colleagues, culture, learning, flexibility, benefits, and work-life balance. Recurring cautions include corporate layers, slower decisions, uneven advancement or management experiences, and team-dependent workload. Reviews are self-selected anecdotes; use them to ask neutral questions, not to state that a problem exists.",
    cue: "Ask: How does this team preserve speed across a large organisation?", color: "amber",
  },
  {
    title: "History in one line",
    body: "The business traces its roots to the Interbank Card Association formed in 1966, evolved through global card and debit-network expansion, became a public company in 2006, and has broadened from a consumer-card network into a multi-rail technology and services platform. That evolution explains today’s emphasis on real-time payments, open banking, cybersecurity, data, and identity.",
    cue: "1966 network → 2006 public company → multi-rail services platform", color: "purple",
  },
  {
    title: "Key leader to know",
    body: "Michael Miebach has been CEO since 2021. His background includes product leadership and expanding Mastercard beyond a card-centric model into real-time payments, open banking, digital identity, and services. In the interview, the useful point is the strategic direction—not biographical trivia.",
    cue: "CEO: Michael Miebach · platform expansion and digital trust", color: "green",
  },
  {
    title: "Your interviewer · Michael Cacho",
    body: "The profile you supplied shows Michael is now Director, Product Development at Mastercard, with skills in data science and fraud detection. His earlier Mastercard roles covered Identity Verification product development plus roadmap and delivery ownership for database microservices and data-visualisation products in Fraud and Identity. His stated outcomes include higher dashboard adoption, lower latency through simpler data structures, and stronger product security.",
    cue: "Expect product craft to be tested through data, architecture, adoption, testing, security, and measurable outcomes", color: "coral",
  },
];

export const michaelCachoProfileCards: PrepCard[] = [
  {
    title: "Verified current context",
    body: "Director, Product Development at Mastercard since December 2025. The supplied profile associates the role with data science and fraud detection. Immediately before that, Michael led new-product-development initiatives for Identity Verification as a Manager, Product Development.",
    cue: "Identity Verification + product development + fraud/data science", color: "blue",
  },
  {
    title: "His strongest product signals",
    body: "Roadmap and delivery ownership; database microservices; data-visualisation products; product testing and prototyping; reducing latency by simplifying data structures; improving security; and doubling a fraud dashboard’s daily active users. These are profile facts. The inference is that he may probe how you connect technical decisions to user adoption and measurable product value.",
    cue: "Technical decision → product outcome → measurable evidence", color: "teal",
  },
  {
    title: "Relevant TELUS background",
    body: "Before Mastercard, Michael managed TELUS SmartHome app work involving an ADT/TELUS monitoring integration, self-install UI, firmware requirements, technician-installation automation, and a regression-testing process. He also held roaming, TV-software, growth, pricing, and referral-platform roles. This suggests a broad product lens spanning customer experience, platform integration, operations, quality, and commercial outcomes.",
    cue: "He understands telecom platforms, integration complexity, and product operations", color: "purple",
  },
  {
    title: "Your strongest common ground",
    body: "Telecom product platforms: Bell Subscription Management maps naturally to his TELUS app and software experience. Microservices and data structures: use Flow Runner and Bell’s 60-plus-service platform. Identity/security: use Aeroplan’s token exchange and API contract. Product testing: use OpenAPI-generated types and UAT. Operations: use Contingency Management. Adoption and metrics: explain how you choose a primary outcome and guardrails without inventing results not present on your résumé.",
    cue: "Bell platform · Flow Runner · Aeroplan · Contingency Management", color: "green",
  },
  {
    title: "Likely evaluation lens · inference",
    body: "Can you own product discovery and delivery, reason credibly about microservices and data, simplify a technical design, build security and testing into the product, partner with data science, and prove adoption or risk outcomes? These are preparation hypotheses derived from his role history—not a claim that he will ask a fixed script.",
    cue: "Discovery · architecture · quality · fraud · adoption", color: "amber",
  },
  {
    title: "How to engage him",
    body: "Answer at product-and-system altitude: user/problem, baseline, decision, architecture or workflow implication, trade-off, validation, metric, and learning. Use technical detail when it explains a product decision. Do not recite his résumé, mention that you researched him, or force similarities; let relevant Bell and TELUS overlap emerge naturally from the work.",
    cue: "Problem → decision → technical implication → measure", color: "coral",
  },
];

export const michaelCachoStageTwoQuestions: InterviewQuestion[] = [
  {
    question: "Walk me through a technical product you took from an ambiguous problem to a production outcome.",
    audience: "Michael Cacho preparation · product development",
    answer: "I would use Contingency Management. Operations agents were manually triaging failed subscription orders across several systems, but the initial ask focused only on displaying failures. I shadowed agents and traced a common root cause to invalid address data from an upstream feed. I reframed the product around resolution: agents needed to correct the address, resubmit the transaction, and retain a complete audit trail. I specified the data mapping, API endpoints, validation rules, acceptance criteria, and an automated Lambda resubmission path with operations and engineering before build. The outcome was a tool that resolved the common failure class directly instead of requiring multi-system escalation. The product lesson was to investigate the real workflow before freezing the solution scope.",
    cue: "Contingency: observe → find root cause → reshape scope → API/workflow → operational outcome",
  },
  {
    question: "How do you decide whether a technical simplification is valuable enough to prioritise?",
    audience: "Michael Cacho preparation · architecture and latency",
    answer: "I start with the user or operating cost of the complexity: inconsistent decisions, latency, defects, change effort, or support burden. In Flow Runner, qualification logic was duplicated across reseller-service, catalog-api, and merchant adapters, so the same promotion could behave differently and every rule change required several deployments. I helped define a central service boundary that executed—but did not own—the rules, supported legacy and new formats, and proved parity against real catalog data before cutover. The value was consistent qualification and faster rule changes without disrupting existing integrations. I would prioritise a simplification when the measurable reduction in risk or recurring cost exceeds the migration cost and the team can validate behaviour safely.",
    cue: "Cost of complexity → clear boundary → safe migration → measurable recurring value",
  },
  {
    question: "How do you build testing and security into product development rather than adding them at the end?",
    audience: "Michael Cacho preparation · product testing and security",
    answer: "For Bell’s Aeroplan integration, the original design placed customer information in URL query parameters. I raised the privacy and fraud risk and aligned engineering and security on a one-time token exchange through an API and BFF. I then made the OpenAPI contract the source for generated TypeScript types, wrote acceptance criteria for every integration flow, and ran UAT across the deployment pipeline. The type generation exposed two contract mismatches before production, and the launch had zero post-launch integration regressions. My approach is to turn security and compatibility expectations into architecture decisions and executable delivery gates.",
    cue: "Aeroplan: threat → safer design → contract quality gate → UAT → zero regressions",
  },
  {
    question: "How would you measure adoption and quality for an internal fraud or identity product?",
    audience: "Michael Cacho preparation · dashboards and metrics",
    answer: "I would first define the job the user is trying to complete and baseline the current workflow. Adoption could include eligible-user activation, weekly or daily active use, repeat use, task completion, and coverage of relevant decisions—but activity alone is not success. I would pair it with time-to-decision, manual-review queue time, decision consistency, false-positive and false-negative rates, fraud or loss prevented, API latency and availability, and user confidence. I would segment by customer, workflow, and geography, then use qualitative sessions to understand why users do or do not act on the signals. The metric set must show both value and risk guardrails.",
    cue: "Adoption + task outcome + decision quality + reliability + user evidence",
  },
  {
    question: "How would you partner with data science on an Identity Verification product?",
    audience: "Michael Cacho preparation · data science and fraud",
    answer: "I would begin with the decision the product must support, the ground-truth label, and the cost of each error. With data science, risk, and operations, I would agree on input availability and freshness, threshold behaviour, explainability, monitoring, drift, privacy, and the human-review path. I would translate that into API contracts, workflows, reason codes, acceptance criteria, and launch guardrails, then validate performance by segment rather than relying only on an aggregate score. I would be candid that my direct experience is stronger in rules, APIs, controls, and technical product delivery than in owning a data-science team, while showing exactly how I would make the partnership effective.",
    cue: "Decision → labels/errors → signals/threshold → product contract → monitoring and review",
  },
  {
    question: "Tell me about a time you improved a product by working directly with its operational users.",
    audience: "Michael Cacho preparation · workflow and operations",
    answer: "I would again use Contingency Management, but emphasise the discovery method. The documented requirement was to help agents see failed orders. By shadowing the real exception-handling workflow, I learned that visibility alone would leave the root cause and manual reprocessing untouched. That evidence led to address correction, API-boundary validation, resubmission, and audit logging. The lesson is that operational users often reveal hidden system states and exception paths that stakeholders or process documents miss.",
    cue: "Shadow real work → expose hidden failure path → change product scope",
  },
];

export const mastercardRoleResearch: PrepCard[] = [
  {
    title: "Role mission",
    body: "Turn Business Identity strategy into engineering-ready product execution: requirements, APIs, non-functional constraints, state and workflow models, acceptance criteria, prioritised backlog, dependency management, demos, launch validation, audit evidence, and post-launch learning. Success is both a correct product decision and a buildable, testable specification.",
    cue: "Strategy → technical clarity → controlled delivery → measured outcome", color: "blue",
  },
  {
    title: "Likely operating model · validate in the interview",
    body: "The strategic direction is likely top-down at portfolio level, while PMs identify customer problems, shape options, test feasibility, and prioritise execution with engineering, data science, commercialisation, legal, and risk. Mastercard’s public materials do not prove the exact team decision model, so ask how discovery, roadmap authority, and technical trade-offs are divided.",
    cue: "Fact: cross-functional remit · inference: decision mechanics", color: "amber",
  },
  {
    title: "Product metrics to discuss",
    body: "Coverage and match rate; verification completion and time-to-decision; good-business approval rate; false-positive and false-negative rates; fraud or loss prevented; manual-review rate and queue time; onboarding conversion and abandonment; API availability, latency, and error rate; geographic/data-source coverage; customer adoption, retention, and revenue. Always name the guardrail metric beside the target metric.",
    cue: "Approval speed + fraud accuracy + operational cost + reliability", color: "teal",
  },
  {
    title: "Why you fit",
    body: "Bell gives you platform, API, backlog, acceptance-criteria, security, vendor, and cross-functional delivery evidence. CIBC and CRA add controls, auditability, and translating standards into testable outcomes. Skye Bank adds direct card-operations and payment-risk context. Your strongest positioning is an experienced technical PM with adjacent identity skills—not a candidate claiming years of direct KYB product ownership.",
    cue: "Technical product craft + payments + controls", color: "green",
  },
  {
    title: "Gaps to address honestly",
    body: "The submitted résumé does not establish direct Business Identity/KYB ownership, formal data-science leadership, or SAFe/PI-planning leadership. Close the gap by showing how you learn a risk domain, partner with specialists, define measurable decision quality, and turn model/rule behaviour into API requirements and acceptance criteria. Ask for the team’s exact vocabulary before claiming equivalence.",
    cue: "Adjacent experience + disciplined ramp plan; no overstatement", color: "coral",
  },
  {
    title: "Improvement hypothesis 1 · explainable decisions",
    body: "Explore a decision API and review experience that returns ordered reason codes, evidence freshness and lineage, confidence, and the policy/model version used. The goal would be faster manual review, easier customer explanation, safer threshold changes, and stronger audit evidence. First validate whether these capabilities already exist and which user struggles most.",
    cue: "Hypothesis, not criticism: evidence → reason → action → audit", color: "purple",
  },
  {
    title: "Improvement hypothesis 2 · adaptive onboarding",
    body: "Explore risk-tiered orchestration: approve low-risk businesses with minimal friction, request only the missing evidence for uncertain cases, and route high-risk cases to specialised review. Test success through conversion, time-to-decision, false positives, fraud capture, and review cost by segment and geography. First ask where customers currently control policy and workflow.",
    cue: "Right friction for the risk; measure both growth and loss", color: "blue",
  },
];

export const mastercardResearchQuestions: PrepCard[] = [
  { title: "Useful · first six months", body: "What customer or product outcome would make you say this hire had an excellent first six months, and what is currently making that outcome difficult?", cue: "Gets success criteria and the real constraint", color: "blue" },
  { title: "Useful · decision rights", body: "When product, engineering, data science, commercialisation, and legal see a risk trade-off differently, how does this team make the decision and who owns the final call?", cue: "Reveals the actual operating model", color: "teal" },
  { title: "Passion · strategy", body: "As Mastercard expands into agentic commerce and new payment flows, how is the Business Identity team thinking about verifying the business or agent behind an interaction, not only the payment credential?", cue: "Connects current strategy to the team", color: "purple" },
  { title: "Expertise · product quality", body: "Which metric is hardest to improve without damaging another—coverage, onboarding conversion, false positives, fraud detection, manual-review load, or decision latency—and how does the team set its guardrails?", cue: "Shows mature decision-quality thinking", color: "green" },
  { title: "Expertise · global scale", body: "How does the product handle differences in business registries, data freshness, and regulatory expectations across markets while keeping the API and customer experience coherent?", cue: "Shows awareness of global identity constraints", color: "amber" },
  { title: "For Michael Cacho · product development", body: "You have worked across Identity Verification, fraud-data products, microservices, and dashboards. In this team, where is the hardest product-development trade-off today: data coverage, decision accuracy, explainability, latency, workflow adoption, or integration effort?", cue: "Uses the supplied professional profile without repeating personal details", color: "coral" },
  { title: "Avoid", body: "Do not ask for facts available on the website, frame ideas as ‘why haven’t you built this?’, interrogate anonymous employee-review complaints, or lead with vacation and benefits. Ask neutral, open questions and let the interviewer teach you how this team works.", cue: "Curious, informed, and non-accusatory", color: "gray" },
];

export const mastercardResearchChecklist: string[] = [
  "Explain Mastercard as a technology and services platform—not a bank or card issuer.",
  "Describe the network → data → services → more-volume strategy in your own words.",
  "Know the 2025 scale anchors: $32.8B revenue, $10.6T GDV, and 175.5B switched transactions.",
  "Name competitors across card networks, local/real-time rails, wallets, fintechs, and public infrastructure.",
  "Connect Business Identity to onboarding, fraud, compliance, new flows, and agentic commerce.",
  "Explain the central product trade-off using one target metric and at least one guardrail metric.",
  "Use one Mastercard Way behaviour naturally in each relevant STAR story.",
  "State one product-improvement hypothesis as a discovery question, not as a claim about a missing feature.",
  "Prepare three questions: one useful, one passion, and one expertise question.",
  "Review the developer portal or sandbox and record one evidence-based observation.",
  "Keep the direct-KYB, data-science, and SAFe gaps honest and explain the ramp plan.",
  "Close this prep app before joining Teams; answer the live interview without AI assistance, as requested by Mastercard.",
];

export const jobDescriptionCards: PrepCard[] = [
  {
    title: "Role and team",
    body: "Manager, Product Management - Technical, within Mastercard Identity's Business Identity team in Security Solutions. The team builds products and services for business-entity verification and risk assessment, supporting trusted digital commerce, onboarding, fraud reduction, and regulatory compliance.",
    cue: "Business identity verification + risk assessment + digital trust", color: "blue",
  },
  {
    title: "Core delivery mandate",
    body: "Translate roadmap strategy into technical requirements, planning, and prioritisation. Turn system requirements into features, user stories, and acceptance criteria; keep a well-prioritised backlog; and carry work through engineering, quality validation, demos, handoffs, and post-launch learning.",
    cue: "Strategy → requirements → backlog → delivery → learning", color: "teal",
  },
  {
    title: "Technical and cross-functional bar",
    body: "The role requires technical analysis, API and non-functional-requirements discipline, prototypes or experiments, feasibility assessment, dependency management, workflow/state-transition documentation, and technical-risk remediation. Key partners include engineering, data science, commercialisation, legal, internal stakeholders, and external customers.",
    cue: "Clear technical requirements and cross-functional execution", color: "purple",
  },
  {
    title: "Risk and operating expectations",
    body: "Mastercard calls out audit evidence, product-risk assessment, vulnerability remediation, Agile experience (SAFe is a plus), globally distributed collaboration, flexible hours, and up to 15% travel. The Toronto posting lists a CAD $121,000-$169,000 pay range.",
    cue: "Compliance, risk, global delivery, and execution rigour", color: "amber",
  },
];

export const resumeCards: PrepCard[] = [
  {
    title: "Submitted positioning",
    body: "Senior Technical Product Manager with 7+ years across SaaS platforms, API integrations, AI-powered workflows, data products, product backlogs, acceptance criteria, vendor SOWs, and production delivery in enterprise environments.",
    cue: "Technical product ownership + platform delivery", color: "blue",
  },
  {
    title: "Bell Canada: strongest delivery evidence",
    body: "Owned Subscription Manager vision, backlog, sprint acceptance criteria, multi-environment delivery, and post-launch analytics. Delivered an Aeroplan integration with a secure token-exchange pattern, vendor SOW/SLA coordination, OpenAPI-derived type contracts, and zero post-launch integration regressions. Also coordinated 6+ workstreams across engineering, billing, operations, marketing, and compliance.",
    cue: "Backlog + API/security + delivery coordination", color: "teal",
  },
  {
    title: "CRA and CIBC: compliance evidence",
    body: "At CRA, authored government-grade security acceptance criteria and embedded Axe-core in CI/CD, achieving WCAG AA compliance with regression prevention. At CIBC, completed a Financial Controls Gap Analysis and delivered a reconciliation tool that reduced the monthly process from two days to half a day.",
    cue: "Controls become testable, continuous product standards", color: "green",
  },
  {
    title: "Skye Bank: direct payments context",
    body: "Managed Visa and Mastercard chargeback cases by deadline proximity and recovery value, with zero missed dispute deadlines. Led operational readiness for a co-branded card launch, including cardholder-data validation standards, and delivered zero issuance errors.",
    cue: "Payments operations + deadlines + data integrity", color: "coral",
  },
  {
    title: "Credentials and accuracy note",
    body: "The submitted résumé lists CPA Ontario and ACCA designations, a Diploma in Computer Programming, and a BSc. Its professional summary contains residual Guidepoint wording; do not mention Guidepoint in the Mastercard interview. Keep all speaking examples aligned to the specific résumé bullets above.",
    cue: "Use the experience; avoid the résumé's target-company typo", color: "amber",
  },
];

export const applicationAlignment: ApplicationAlignment[] = [
  { requirement: "Roadmap, backlog, requirements, acceptance criteria", resumeEvidence: "Bell Subscription Manager backlog and sprint acceptance criteria; multi-workstream Agile delivery.", interviewRoute: "Stage 2: vague need → engineering-ready requirements; backlog prioritisation." },
  { requirement: "Technical APIs, systems, and state/workflow documentation", resumeEvidence: "Bell REST/GraphQL/tRPC experience; Aeroplan token exchange; Contingency Management state-transition validation.", interviewRoute: "Stage 2: explain interfaces, rules, failure paths, quality gates, and trade-offs." },
  { requirement: "Engineering, quality, dependencies, and launch execution", resumeEvidence: "Aeroplan vendor/SLA coordination and zero integration regressions; 6+ concurrent Bell workstreams; CRA release readiness.", interviewRoute: "Stage 1 project examples; Stage 4 pressure-test ownership and metrics." },
  { requirement: "Risk, compliance, audit evidence, and product controls", resumeEvidence: "CPA/ACCA; CIBC controls/reconciliation; CRA security and WCAG CI gate; Bell security token exchange.", interviewRoute: "Stage 2: turn controls into observable acceptance criteria and evidence." },
  { requirement: "Digital payments and security landscape", resumeEvidence: "Visa/Mastercard chargeback lifecycle, settlement/reconciliation, co-branded-card launch, and cardholder-data controls.", interviewRoute: "Stage 1: why Mastercard; Stage 4: payments-risk detail." },
  { requirement: "Data science, legal, external-customer discovery, and SAFe", resumeEvidence: "Adjacent experience with AI governance, vendors, security, compliance, and distributed delivery; no formal titled data-science, legal, or SAFe ownership stated.", interviewRoute: "Be direct about the gap, explain the transferable discipline, and show how you would ramp." },
];

export const roundPlaybooks: RoundPlaybook[] = [
  {
    round: "Stage 1",
    title: "Hiring manager chat",
    objective: "Establish that you are a credible product leader for this specific role and that your career move has a clear purpose.",
    interviewerFocus: "Your résumé, project ownership, why Mastercard, why now, and behavioural judgment such as a delivery challenge or a project that changed course.",
    evidence: "Bell product ownership; CRA compliance work; Aeroplan integration; Visa/Mastercard chargebacks and co-branded-card launch.",
    preparation: "Completed. Keep a short record of the questions asked and any themes the hiring manager emphasised. Reuse that information to sharpen your Stage 2 technical examples without changing the facts of your résumé.",
    color: "blue",
  },
  {
    round: "Stage 2",
    title: "Product-development and technical deep dive",
    objective: "Show how you turn a fraud, identity, data, or platform problem into a technically credible product decision and measurable production outcome.",
    interviewerFocus: "Verified interviewer themes include Identity Verification, data science, fraud detection, product testing and prototyping, database microservices, data visualisation, adoption, latency, and security. Agile/Jira remain possible, but should no longer dominate preparation solely because of the Reddit post.",
    evidence: "Contingency Management for operational discovery and APIs; Flow Runner for microservice simplification; Aeroplan for security, contracts, testing, and UAT; Bell platform metrics and backlog ownership for adoption and delivery.",
    preparation: "Practise the dedicated Michael Cacho question set. For each example, explain the baseline problem, your decision, the technical implication, trade-off, validation method, outcome measure, and lesson. Be candid about adjacent—not direct—data-science ownership.",
    color: "teal",
  },
  {
    round: "Stage 3",
    title: "Bar raiser: leadership scenario",
    objective: "Demonstrate owner-level product judgment in an unfamiliar feature-launch or product-design scenario.",
    interviewerFocus: "Planning a feature from discovery through launch; reconciling conflicting priorities; and aligning engineering, business, risk, and operational stakeholders. A historical Mastercard PM interview guide created in 2019 also describes product-design and product-critique cases as possible formats. It does not assign them to Stage 3 or confirm that they are part of this interview process, so treat them as useful adjacent practice—not a predicted question.",
    evidence: "Subscription Manager, Contingency Management, and Aeroplan show problem framing, risk reduction, cross-functional alignment, and delivery ownership.",
    preparation: "For a launch scenario, use the feature-launch framework. For a design or critique case, clarify the goal, identify and prioritise users and needs, compare options, explain trade-offs and edge cases, propose a roadmap, and summarise. State assumptions aloud and check in with the interviewer as you go.",
    color: "purple",
  },
  {
    round: "Stage 4",
    title: "Bar raiser: program leadership",
    objective: "Prove that your leadership claims survive detailed, pressure-tested follow-up.",
    interviewerFocus: "Capacity planning, PI planning, metrics, workplace frustration, difficult decisions, and deep questions about the exact projects on your résumé.",
    evidence: "Six-plus concurrent Bell workstreams; CRA distributed-team planning; chargeback deadline discipline; CIBC reconciliation improvement.",
    preparation: "Know what you personally decided, why, which trade-off you made, how success was measured, and what you would change. Be candid about formal SAFe/PI-planning experience if it is not on your résumé.",
    color: "coral",
  },
];

export const interviewDayPrompterCards: Record<string, InterviewDayPrompterCard> = {
  "tell-me-about-yourself": {
    title: "Tell me about Yourself",
    subtitle: "MasterCard - PM - Technical",
    sections: [
      {
        heading: "Intro",
        bullets: [
          "I'm a **Senior** **Technical** **Product** **Manager** with 7+ years **translating** **product** **strategy** into well-defined technical requirements and driving execution across cross-functional teams — from ideation through to shipped production systems.",
          "For the past 4 years, I've been The Technical Product Manager **Bell** **Canada's** **subscription** **management** **platform** — a **60-plus** **microservice** **Go** **backend** integrated with a **Next.js** **micro-frontend**.",
          "The SM Platform lets Bell **consumers(residential** **customers)** **subscribe** to **streaming** **services** like **Netflix,** **Disney+,** and **crave** through their Bell accounts.",
        ],
      },
      {
        heading: "Roles",
        bullets: [
          "I **own** the **product** **scope** **end-to-end.**",
          "**Translate** roadmaps into features, user stories and acceptance criteria, **Prioritize** backlogs and decompose epics. **Identify** gaps and manage cross team dependencies, **Evaluate** technical implications of requirements, **Review** demos against acceptance criteria, **Document** using workflows, diagrams, state transition models, **Gather** requirements from stakeholders and partners, **Facilitate** demos, handoffs, post-launch reviews, **Engage** stakeholders continuously to incorporate feedback.",
        ],
      },
      {
        heading: "Value Proposition",
        bullets: [
          "A lot of my **value** came from **sitting** **between** **business** **stakeholders** — product, legal, billing — and engineering teams, asking the **questions** that **exposed** **edge** **cases** before they became **production** **issues.**",
          "I bring that **same** **technical** **requirements** **discipline,** **cross-functional** **delivery,** and **mentoring** **experience** to **Mastercard's** **Business** **Identity** **product** **team.**",
        ],
      },
      {
        heading: "Closing",
        bullets: [
          "What draws me to this role is that the **core** **challenge** is the same one I've been **solving** at **Bell:** **translating** **high-level** **product** **strategy** into **technical** **requirements** and API contracts that engineering can execute **against** — but here it's in service of **business** **identity** **verification** and fraud prevention, where accuracy and auditability carry even higher stakes.",
        ],
      },
    ],
  },
  "why-mastercard": {
    title: "WHY CHOOSE MASTERCARD",
    subtitle: "MasterCard - PM - Technical",
    sections: [
      {
        heading: "Mission, purpose and business values of Mastercard",
        bullets: [
          "**MISSION:** Mastercard Reshapes the digital Economy so that Everyone can realize their Ambitions",
          "**PURPOSE:** To connect and power an inclusive digital Economy",
          "**VALUE** : DECENCY QUOTIENT - Inclusion, trust, Partnership, Innovation",
          "**BUSINESS-SHAPE:** Mastercard has shifted from pure card-network processor to a technology service company",
          "**SUMMARY:** Mastercard is going through the same phase bell is also going through which is moving from just being a TELCO to a TECHCO and I also believe Mastercard is moving from just being a pure card-network to a technology service company",
        ],
      },
      {
        heading: "Why do I want to work for Mastercard?",
        bullets: [
          "**Beat1:** The Project which Business identity team is working on really escites me whiich involves building trust infrastructure - Verifying businesses, reducing onboarding fraud, enabling secure commerce at scale. This is not a generic payment job, This is the later that makes the whole network trustworthy. This problem genuinely interests me.",
          "**Beat2:** At Bell I spent the last 4 years owning exaclty the kind of work at a smaller scale - API contracts, security toekn exchange, vendor onboarding, cross-functional delivery where getting the identity wrong has real downstream cost. This role is the natural next step in scope and stakes.",
          "**Beat3:** It is also the right next step for me - a role where technical product ownership converts into a formal Manager title which is where I am headed",
        ],
      },
    ],
  },
  "contingency-management": {
    title: "CONTINGENCY MANAGEMENT - API requirements, data mapping, technical depth, working with operations",
    subtitle: "MasterCard - PM - Technical",
    sections: [
      {
        heading: "Situation",
        bullets: [
          "Bell's operations teams were **manually** **triaging** **failed** **subscription** **orders** — **\"kickouts\"** — across the back-office systems. It was **slow,** **error-prone,** and **caused** **customer** **delays.** The **Contingency** **Management** **platform** was being built to fix it, but no one **had** **formally** **documented** what the **service** **actually** **needed** to support.",
        ],
      },
      {
        heading: "Task",
        bullets: [
          "Specify the **API** **contract** and the **data** **mapping** **between** the agent-facing views and the backend — order search, transaction management, audit logging — and make sure the solution actually addressed why orders were failing in the first place.",
        ],
      },
      {
        heading: "Action",
        bullets: [
          "I started by **shadowing** **operations** **agents** to understand the real **exception-handling** **workflow,** not the documented one. Through that **analysis** we found the **pattern:** a large share of the kickouts traced back to bad **address** **data** **coming** in from the **upstream** **CPM** feed — orders were failing downstream because the **address** **wouldn't** **validate.** So the requirement wasn't just **\"let** **agents** **see** failed orders,\" it was **\"let** **agents** **fix** the root cause and get the order through.\" I specified two things from that: first, a **capability** for **agents** to edit the **address** directly on the **kicked-out** **transaction** and resubmit it; and **second,** a **Lambda** **function** that **automatically** **resubmits** **failed** **transactions** once the data's corrected. I produced the data-mapping document, the endpoint specs, the validation rules at the API boundary, and acceptance criteria per endpoint — and reviewed all of it with both ops and dev before any backend code was written.",
        ],
      },
      {
        heading: "Result",
        bullets: [
          "Agents could **resolve** the **most** **common** **class** of failure themselves instead of escalating, and the auto-resubmit Lambda cleared failures without manual reprocessing — so resolution went from a **manual,** **multi-system** **effort** to **something** **handled** in the tool. The dev team built directly against the specs with no significant rework, and the audit logging I specified as a compliance requirement gives a full trace of what changed on each transaction.",
        ],
      },
    ],
  },
  "catalog-management": {
    title: "CATALOG MGT STORY - Stakeholder Conflict, Alignment Issues, Complex Requirement, Getting Sign-off",
    subtitle: "MasterCard - PM - Technical",
    sections: [
      {
        heading: "Situation",
        bullets: [
          "**Bell's** **Catalog** **Management** **system** is the **master-data** **layer** for everything Bell sells( products, promotions, prices) Any **error** there **flows** straight into **customer-facing** **pricing** and **billing.** When I picked up the BSA work, **I** **REALISED** the **business** **rules** around **promotion** **eligibility** were **undocumented** and **understood** **differently** by marketing, product, and billing.",
        ],
      },
      {
        heading: "Task",
        bullets: [
          "**Elicit,** **document,** and **get** **stakeholder** **sign-off** on the **complete** **business** **rules** before the **dev** team **built** **the** **admin** **workflows** — specifically the **stackability** **logic** and the **distinction** **between** **expiring** and **cancelling** a promotion, which had materially different downstream effects.",
        ],
      },
      {
        heading: "Action",
        bullets: [
          "I ran **separate** **requirements** **sessions** with **marketing,** **product,** and **billing,** then **brought** **them** **together** to **reconcile** the **differences.** The key conflict was **expire-versus-cancel:** marketing treated them as interchangeable; billing had a hard dependency on which action was taken. I **mapped** the **downstream** **impact** of each **interpretation** and **presented** it to all **three** **groups** **together.** Once they saw the **billing** **dependency** laid out **explicitly,** **alignment** came quickly. I produced a formal **business-rules** **document,** got written sign-off from all three, and the dev team built directly against it.",
        ],
      },
      {
        heading: "Result",
        bullets: [
          "No requirement-driven defects on launch. The billing team noted it was the first time they'd seen a **complete,** **agreed-upon** **rules** **document** before a Catalog feature went to dev. It became the template for how we documented eligibility logic on later features.",
        ],
      },
    ],
  },
  "aeroplan-integration": {
    title: "AEROPLAN LOYALTY INTEGRATION",
    subtitle: "MasterCard - PM - Technical",
    sections: [
      {
        heading: "Situation",
        bullets: [
          "Bell's Aeroplan loyalty integration was a strategically critical commercial partnership with no formal integration spec, no documented security model, and no API contract in place. A vendor SOW was already in place — so requirement ambiguity was both a quality and a commercial risk.",
        ],
      },
      {
        heading: "Task",
        bullets: [
          "Define the full product scope before engineering built anything — security model, API contract, TypeScript type contracts as a compile-time quality gate, acceptance criteria per flow, and vendor delivery against the SOW.",
        ],
      },
      {
        heading: "Action",
        bullets: [
          "The first thing I locked down was the security model. The original plan was to pass customer data as URL query parameters — I flagged this as a privacy and fraud risk and proposed a token-based exchange instead: host platform sends customer payload to a Token API, gets a one-time UUID, MFE retrieves it securely via BFF — no sensitive data in a URL. Got alignment from engineering and security before any code was written. From there I produced the API contract, specified TypeScript types auto-generated from the OpenAPI YAML spec as the quality gate, and wrote acceptance criteria for every integration flow. Tracked vendor delivery against SOW milestones and managed UAT across the full deployment pipeline.",
        ],
      },
      {
        heading: "Result",
        bullets: [
          "Zero post-launch integration regressions. The OpenAPI-driven type generation caught two contract mismatches during UAT — both resolved before production. The multi-program architecture I specified from day one made the platform extensible to future loyalty partners without rearchitecting the integration layer.",
        ],
      },
    ],
  },
};

export const coreQuestions: InterviewQuestion[] = [
  {
    key: "tell-me-about-yourself",
    question: "Tell me about yourself.",
    audience: "All interview rounds",
    answer: "I'm a Senior Technical Product Manager with over seven years of experience translating product strategy into well-defined technical requirements and driving execution across cross-functional teams—from ideation through to production.\n\nFor the past four years, I've been the Technical Product Manager for Bell Canada's Subscription Management platform: a Go-based backend with more than 60 microservices, integrated with a Next.js micro-frontend. The platform enables Bell's residential customers to subscribe to streaming services such as Netflix, Disney+, and Crave through their Bell accounts.\n\nI own the product scope end to end. I translate roadmaps into features, user stories, and acceptance criteria; prioritise backlogs and decompose epics; identify gaps and manage cross-team dependencies; evaluate the technical implications of requirements; and review demos against acceptance criteria. I also document workflows, diagrams, and state-transition models, gather requirements from stakeholders and partners, and facilitate demos, handoffs, and post-launch reviews.\n\nA lot of my value comes from sitting between business stakeholders—such as product, legal, and billing—and engineering teams, and asking the questions that expose edge cases before they become production issues.\n\nWhat draws me to this Mastercard role is that the core challenge is the same one I've been solving at Bell: translating high-level product strategy into technical requirements and API contracts that engineering can execute against—but here it supports business identity verification and fraud prevention, where accuracy and auditability carry even higher stakes. I would bring that same technical-requirements discipline, cross-functional delivery, and mentoring experience to Mastercard's Business Identity product team.",
    cue: "7+ years → Bell's 60+ service platform → end-to-end scope → bridge business and engineering → Business Identity fit",
    quickPeek: [
      "7+ years translating product strategy into technical delivery.",
      "Bell platform: Go backend, 60+ microservices, and a Next.js microfrontend.",
      "Own scope, requirements, backlog, API contracts, dependencies, and launch validation.",
      "Bridge business, engineering, security, billing, and external partners.",
      "Next step: bring that discipline to Business Identity, fraud prevention, and trust.",
    ],
  },
  {
    key: "why-mastercard",
    question: "Why do you want to work for Mastercard?",
    audience: "All interview rounds",
    answer: "MISSION: Mastercard Reshapes the digital Economy so that Everyone can realize their Ambitions. PURPOSE: To connect and power an inclusive digital Economy. VALUE: DECENCY QUOTIENT - Inclusion, trust, Partnership, Innovation. BUSINESS-SHAPE: Mastercard has shifted from pure card-network processor to a technology service company. SUMMARY: Mastercard is going through the same phase bell is also going through which is moving from just being a TELCO to a TECHCO and I also believe Mastercard is moving from just being a pure card-network to a technology service company.\n\nBeat1: The Project which Business identity team is working on really escites me whiich involves building trust infrastructure - Verifying businesses, reducing onboarding fraud, enabling secure commerce at scale. This is not a generic payment job, This is the later that makes the whole network trustworthy. This problem genuinely interests me.\n\nBeat2: At Bell I spent the last 4 years owning exaclty the kind of work at a smaller scale - API contracts, security toekn exchange, vendor onboarding, cross-functional delivery where getting the identity wrong has real downstream cost. This role is the natural next step in scope and stakes.\n\nBeat3: It is also the right next step for me - a role where technical product ownership converts into a formal Manager title which is where I am headed",
    cue: "Mission and purpose → trust infrastructure → Bell experience → next step in scope, stakes, and title",
    quickPeek: [
      "Mastercard has shifted from pure card-network processor to a technology service company.",
      "Business Identity involves building trust infrastructure - Verifying businesses, reducing onboarding fraud, enabling secure commerce at scale.",
      "At Bell I spent the last 4 years owning exaclty the kind of work at a smaller scale.",
      "This role is the natural next step in scope and stakes.",
      "Technical product ownership converts into a formal Manager title which is where I am headed.",
    ],
  },
  {
    key: "cross-functional-team",
    question: "Tell me about a time you worked as part of a cross-functional team.",
    audience: "Hiring manager or panel",
    answer: "For Bell's Aeroplan membership-management integration, I coordinated Bell engineering, an external loyalty vendor, and security stakeholders. I owned the product scope for account linking, made the secure token-exchange approach explicit, tracked vendor SOW and SLA delivery, and used generated type contracts as a quality gate. The result was a production launch with zero post-launch integration regressions. The key was making the risks and handoffs visible early, so each group could make the right decision in its area.",
    cue: "Aeroplan: engineering + vendor + security → clear contracts → zero regressions",
  },
  {
    key: "why-hire-you",
    question: "Why should we hire you?",
    audience: "All interview rounds",
    answer: "I offer three directly relevant strengths. First, I have seven-plus years of technical product ownership, including backlog management, acceptance criteria, platform delivery, and measurable launch outcomes. Second, I bring direct Visa and Mastercard chargeback and card-launch experience, so the payments-risk context is familiar rather than abstract. Third, my CPA and ACCA background, together with controls and compliance work at CIBC and the CRA, helps me build products that are not only useful but also auditable and risk-aware.",
    cue: "Technical PM execution + payments context + compliance rigor",
  },
  {
    key: "closing-value",
    question: "Closing statement: the value I would bring",
    audience: "Final minute of the interview",
    answer: "Before we close, I want to leave you with the value I believe I would bring to this team. I combine three perspectives that are not always found together: technical product leadership across a complex microservices platform, first-hand payments-risk experience, and a strong controls and accounting discipline. That means I can help turn ambiguous identity and fraud problems into clear product decisions, engineering-ready requirements, secure API contracts, and measurable launches.\n\nI would also bring a collaborative working style. I listen to engineering, data science, commercial, risk, and operational partners; make trade-offs and dependencies visible; and keep people aligned on the customer and risk outcomes we are trying to achieve. I know Business Identity has domain depth that I will continue to learn, and I would approach that with curiosity and humility while contributing immediately in discovery, prioritisation, technical delivery, and cross-functional execution.\n\nIf hired, my goal would be not only to ship features, but to help the team move with greater clarity and confidence—from the initial problem through to a secure, measurable production outcome.",
    cue: "Technical execution + payments risk + controls discipline + team clarity + measurable outcomes",
    quickPeek: [
      "Technical product leadership across a complex microservices platform.",
      "First-hand payments-risk experience and strong controls discipline.",
      "Turn ambiguity into clear decisions, requirements, secure contracts, and measurable launches.",
      "Help the team move with greater clarity, alignment, and confidence.",
    ],
  },
];

export const behaviouralQuestions: InterviewQuestion[] = [
  {
    key: "role-suitability",
    question: "Why are you suitable for this role?",
    audience: "Motivation and fit",
    answer: "I am a strong fit because the role needs someone who can translate strategy into technical requirements and carry those requirements through delivery. At Bell, I own backlogs, acceptance criteria, API and platform requirements, dependencies, and launch validation. The Aeroplan integration demonstrates secure API and vendor delivery, while my Skye Bank, CIBC, and CRA experience gives me direct payments, controls, and compliance discipline. Business Identity is a new product domain for me, but the execution, integration, and risk disciplines are established strengths.",
    cue: "Execution + integration + risk/compliance; do not claim direct KYB ownership",
  },
  {
    key: "leaving-bell",
    question: "Why are you leaving Bell?",
    audience: "Motivation and professionalism",
    answer: "Bell has been a strong place to deepen my technical product-management experience, and I am proud of what I have built there. This move is a pull toward a specific opportunity: Mastercard lets me apply the product craft I have developed at Bell to the payments and trust domain where I began my career. It is about the fit and impact of this role, not dissatisfaction with my current employer.",
    cue: "Move toward Mastercard; never move away from Bell",
    quickPeek: [
      "Bell has been a strong place to grow, and I am proud of what I built there.",
      "I am ready to apply that product experience to payments and digital trust.",
      "Mastercard is a specific opportunity for greater fit, growth, and impact.",
      "This is a move toward Mastercard—not a move away from Bell.",
    ],
  },
  {
    key: "significant-challenge",
    question: "Tell me about a significant challenge and how you overcame it.",
    audience: "Resilience and execution",
    answer: "A significant challenge was Bell's manual handling of failed subscription orders. Operations agents worked across several systems, escalated common failures to engineering, and customers waited for resolution. I shadowed agents and found that invalid upstream address data caused a large share of failures. I reframed the product from a screen that displayed failures into a tool that let agents correct the address and resubmit, with automatic resubmission after correction. I then defined the API contract, validation rules, audit logging, and acceptance criteria with operations and engineering. Agents could resolve the common failure without engineering escalation, and corrected transactions no longer required manual reprocessing.",
    cue: "Contingency: observe workflow → find root cause → redefine product → self-service",
  },
  {
    key: "project-off-plan",
    question: "Tell me about a project that did not go according to plan. What did you do?",
    audience: "Judgment and recovery",
    answer: "Contingency Management did not follow the original product assumption. The initial concept focused on giving agents visibility into failed orders, but shadowing operations showed that visibility alone would preserve the same escalation bottleneck. Invalid address data from the upstream feed was a recurring root cause. I paused the requirement direction, brought the evidence back to operations and engineering, and reset the scope around correcting and resubmitting the transaction, including API validation and auditability. That changed the delivery plan, but it prevented us from building a diagnostic screen that did not solve the operational problem. The lesson was to validate the real workflow before locking the solution boundary.",
    cue: "Wrong initial assumption → discovery evidence → reset scope → better product",
  },
  {
    key: "mastercard-values",
    question: "What are Mastercard's values, and how do they align with you?",
    audience: "Culture and values",
    answer: "Mastercard grounds its culture in decency, integrity, and respect, supported by trust, partnership, agility, and initiative. Trust and partnership align particularly strongly with how I work. In the Aeroplan integration, I made the security risk, API contract, vendor milestones, and handoffs visible so engineering, security, and the vendor could make decisions from the same facts. Integrity also means raising an uncomfortable risk early: I challenged the proposal to put customer data in URL parameters and helped the team agree on a token-exchange design before implementation.",
    cue: "Choose two values; prove each with behaviour",
  },
  {
    key: "biggest-weakness",
    question: "What is your biggest weakness?",
    audience: "Self-awareness",
    answer: "I have not yet partnered with a formally titled data-science team, which is relevant to this role. My adjacent experience includes defining AI-governance boundaries, quality signals, business rules, and state transitions at Bell. To close the gap, I would first learn the model's purpose, input signals, decision thresholds, false-positive and false-negative trade-offs, monitoring, and human-review path before translating them into product requirements. I am comfortable being transparent about what I know and systematic about learning what I do not.",
    cue: "Name the gap plainly, then show the learning plan",
  },
  {
    key: "setback",
    question: "Tell me about a setback and how you reacted.",
    audience: "Resilience and self-awareness",
    answer: "During Aeroplan UAT, OpenAPI-generated TypeScript types exposed two contract mismatches between the vendor payload and our implementation. That was a setback because the flows could not safely progress toward production. I treated the generated types as the evidence, brought the vendor and engineering owners together, traced each mismatch to the contract, corrected both sides, and reran the affected UAT flows before release. We launched with zero post-launch integration regressions. The experience reinforced why contracts and automated compatibility checks must be delivery gates, not documentation added after implementation.",
    cue: "UAT mismatch → align owners → correct contract → revalidate → strengthen quality gate",
  },
  {
    key: "take-charge",
    question: "Tell me about a time you stepped in and took charge.",
    audience: "Initiative and ownership",
    answer: "On Bell's subscription platform, qualification logic was duplicated across reseller-service, catalog-api, and merchant adapters. No single team owned solving the inconsistency across the platform, so I stepped in to audit the rules, align product, catalog, billing, and partner engineering, and define a central Flow Runner service. I clarified that the new service would execute rules without owning them, specified the API and declarative flow format, supported both legacy and new rule formats, and required a parity pilot before cutover. The platform gained a clear execution boundary without disrupting existing integrations.",
    cue: "Flow Runner: ambiguous ownership → define boundary → prove parity → platform consistency",
  },
  {
    key: "five-year-direction",
    question: "Where do you see yourself in five years?",
    audience: "Career direction",
    answer: "I want to be a product leader trusted with increasingly complex platform and trust problems: setting product direction, helping cross-functional teams make sound decisions, and developing other product talent. Mastercard is attractive because Business Identity sits at the intersection of technology, risk, and global commerce. I am focused on growing through impact and scope, not on chasing a title on a fixed timetable.",
    cue: "Growth through trusted scope and impact",
  },
  {
    key: "difficult-stakeholder",
    question: "Tell me about a time you influenced a difficult stakeholder.",
    audience: "Influence without authority",
    answer: "In Catalog Management, marketing, product, and billing interpreted promotion rules differently. The hardest conflict was whether expiring and cancelling a promotion were interchangeable: marketing viewed them that way, but billing depended on the distinction. I met each group separately to understand its constraint, then mapped the downstream pricing and billing consequences and brought the groups together around the evidence. Once the impact was visible, we agreed on the rule, documented it, and secured written sign-off. The feature launched without requirement-driven defects, and the rules document became a template for later work.",
    cue: "Catalog: competing interpretations → map downstream impact → joint decision → sign-off",
  },
  {
    key: "three-differentiators",
    question: "What three things set you apart from other candidates?",
    audience: "Differentiation",
    answer: "First, technical product delivery: I can turn ambiguous business problems into backlogs, acceptance criteria, platform requirements, and measured launches. Second, direct payments operations: I have owned Visa/Mastercard chargebacks and supported a co-branded card launch. Third, risk and controls rigor: CPA/ACCA designations plus CIBC and CRA experience help me create products that are usable, secure, and auditable.",
    cue: "Build + payments + controls",
  },
  {
    key: "manager-conversation",
    question: "Tell me about a difficult conversation with your manager.",
    audience: "Maturity and communication",
    answer: "This answer still needs a real manager-specific example from my experience; I would not relabel a stakeholder disagreement as a manager conversation. The answer I prepare will identify our shared objective, explain the difference in view without criticising my manager, show the evidence or options I brought, describe how I listened and reached a decision, and state what improved afterward. The point is respectful candour and accountability, not proving that I won an argument.",
    cue: "Shared goal → differing view → evidence → respectful resolution",
  },
  {
    key: "mastercard-knowledge",
    question: "What do you know about Mastercard?",
    audience: "Company knowledge",
    answer: "Mastercard is a global technology company in payments whose purpose is to connect and power an inclusive digital economy. Its network, partnerships, data, and technology aim to make transactions safe, simple, smart, and accessible. For this role, that purpose becomes practical through Business Identity: creating trusted, verifiable business interactions that can improve onboarding, reduce fraud, and support compliance.",
    cue: "Inclusive digital economy → Business Identity → trust, speed, fraud, compliance",
  },
];

export const mastercardSampleQuestions: InterviewQuestion[] = [
  ...coreQuestions,
  ...behaviouralQuestions,
];

export const technicalFollowUps: TechnicalInterviewQuestion[] = [
  {
    key: "stage2-ambiguous-problem-to-requirements",
    category: "1 · Product definition and requirements",
    priority: "Must know",
    question: "How do you turn an ambiguous business problem into engineering-ready requirements?",
    audience: "Discovery · requirements · acceptance criteria",
    testing: "Whether you can find the real problem, remove ambiguity, and give engineering and quality teams something buildable and testable.",
    plainEnglish: "Do not begin with tickets. First understand who is struggling, what outcome is needed, how the workflow behaves, and where it fails. Then define the rules, data, interfaces, edge cases, quality expectations, and evidence of success.",
    answerPlan: [
      { label: "Frame", detail: "User, problem, baseline, outcome, constraints" },
      { label: "Discover", detail: "Workflow, states, rules, data, exceptions" },
      { label: "Define", detail: "Stories, API needs, acceptance criteria, NFRs" },
      { label: "Align", detail: "Review with engineering, QA, operations, and risk" },
      { label: "Validate", detail: "Demo, UAT, launch measures, and learning" },
    ],
    answer: "I use five steps. First, I frame the user, current problem, baseline, desired outcome, and constraints. Second, I investigate the real workflow—including states, business rules, data, dependencies, and exception paths. Third, I turn that evidence into scoped capabilities, user stories, API or data requirements, non-functional requirements, and testable acceptance criteria. Fourth, I review the proposal with engineering, QA, operations, and risk before build so feasibility and edge cases are resolved early. Finally, I validate through demos, UAT, and post-launch measures.\n\nFor Bell’s Contingency Management product, the initial request was to display failed subscription orders. By shadowing agents, I found that invalid upstream address data caused many failures. That changed the requirement from ‘show the error’ to ‘let an authorised agent correct the address, validate it, resubmit safely, and preserve an audit trail.’ I specified the data mapping, endpoint behaviour, validation rules, automated resubmission, audit logging, and acceptance criteria with operations and engineering. The result addressed the root cause rather than producing another monitoring screen.",
    resumeAnchor: "Primary: Contingency Management. Backup: Catalog Management for reconciling undocumented rules and obtaining sign-off before build.",
    keyTerms: [
      { term: "Acceptance criteria", meaning: "Observable conditions that prove a story works correctly." },
      { term: "State transition", meaning: "A permitted change from one status to another, including the rule that allows it." },
      { term: "NFR", meaning: "A quality requirement such as latency, availability, security, or auditability." },
    ],
    followUps: [
      "What specific artifacts did you produce?",
      "Give an example of an acceptance criterion for the resubmission flow.",
      "How did you resolve disagreement between operations and engineering?",
      "How did you know the product solved the original problem?",
    ],
    cue: "Problem → workflow and exceptions → buildable contract → alignment → validation",
  },
  {
    key: "stage2-api-contract",
    category: "1 · Product definition and requirements",
    priority: "Must know",
    question: "What do you define when shaping an API product or API contract?",
    audience: "APIs · schemas · integration quality",
    testing: "Whether you understand an API as a customer-facing contract, not merely a list of endpoints produced by engineering.",
    plainEnglish: "Explain who calls the API, what they send, what they receive, how errors and repeat requests behave, how access is protected, and how consumers can integrate without surprises.",
    answerPlan: [
      { label: "Consumer", detail: "Who calls it and which job they need to complete" },
      { label: "Contract", detail: "Resources, endpoints, schemas, rules, and reason codes" },
      { label: "Failure", detail: "Validation, errors, retries, duplicate requests" },
      { label: "Quality", detail: "Security, latency, availability, audit, observability" },
      { label: "Change", detail: "Versioning, compatibility, examples, and contract tests" },
    ],
    answer: "I start with the consumer and use case, because the contract should reflect a real job rather than expose internal implementation. I define the resource model, endpoint purpose, required and optional fields, request and response schemas, validation rules, reason codes, and error model. I also make failure behaviour explicit: timeouts, retries, duplicate submissions, partial failure, and whether an operation must be idempotent. Then I cover authentication and authorisation, sensitive-data handling, latency and availability expectations, audit events, observability, versioning, backward compatibility, examples, and contract testing.\n\nIn the Aeroplan integration, I defined the OpenAPI contract and used generated TypeScript types as a compile-time compatibility gate. That exposed two contract mismatches during UAT before production. In Contingency Management, I specified endpoint-level validation, data mapping, audit logging, and acceptance criteria. Those examples show that my role is to make the interface behaviour and quality expectations unambiguous; engineering still owns the implementation design.",
    resumeAnchor: "Aeroplan for OpenAPI, generated types, security, and vendor integration; Contingency Management for endpoint validation, data mapping, and audit logging.",
    keyTerms: [
      { term: "Schema", meaning: "The defined structure and data types of a request or response." },
      { term: "Idempotency", meaning: "Repeating the same request does not create an unintended second result." },
      { term: "Backward compatibility", meaning: "Existing consumers continue to work when the API evolves." },
      { term: "Contract test", meaning: "An automated check that a provider and consumer still agree on the interface." },
    ],
    followUps: [
      "How would you version a breaking API change?",
      "How would you design validation errors so customers can act on them?",
      "What belongs in an OpenAPI specification versus a product requirement?",
      "How would you protect against duplicate submissions?",
    ],
    cue: "Consumer → contract → failure behaviour → quality → safe change",
  },
  {
    key: "stage2-prototype-experiment",
    category: "1 · Product definition and requirements",
    priority: "Must know",
    question: "How do you use a prototype or experiment to reduce technical product risk?",
    audience: "Prototyping · feasibility · evidence-based decisions",
    testing: "Whether you can identify the riskiest assumption and learn cheaply before committing a full engineering team or customer rollout.",
    plainEnglish: "Do not prototype everything. Find the assumption most likely to make the product fail, design the smallest credible test, decide the success threshold in advance, and let the evidence change the plan.",
    answerPlan: [
      { label: "Risk", detail: "Name the assumption that could invalidate the product or design" },
      { label: "Test", detail: "Choose a spike, sandbox, mock, contract test, or limited pilot" },
      { label: "Threshold", detail: "Define what evidence means proceed, change, or stop" },
      { label: "Learn", detail: "Capture technical, user, operational, and risk findings" },
      { label: "Decide", detail: "Update scope, architecture, backlog, or investment" },
    ],
    answer: "I use a prototype to resolve a specific high-risk assumption, not to build a smaller-looking production system. I state the assumption, why it matters, the cheapest credible test, what the prototype intentionally excludes, and the evidence threshold for proceeding, changing direction, or stopping. Depending on the risk, that might be an API sandbox, a data-quality sample, a technical spike, a clickable workflow, a contract test, or a limited pilot.\n\nFlow Runner is a good example of validation before migration. The biggest risk was not whether we could create another service; it was whether central execution would reproduce the established qualification outcomes without disrupting existing consumers. We supported legacy and new rule formats and ran the first flow against real catalog data to compare outcomes before cutover. In Aeroplan, generated types and UAT tested contract compatibility before production. In a Business Identity context, I would similarly test the riskiest area—perhaps data coverage, latency, reason-code usefulness, or integration effort—and use the result to reshape the backlog before scaling.",
    resumeAnchor: "Flow Runner parity pilot is the strongest example; Aeroplan contract validation is supporting evidence.",
    keyTerms: [
      { term: "Technical spike", meaning: "A time-limited investigation used to answer a technical uncertainty." },
      { term: "Prototype", meaning: "A limited representation built to test an assumption, not necessarily production-quality software." },
      { term: "Pilot", meaning: "A controlled real-world use with limited scope or participants." },
      { term: "Exit criterion", meaning: "Evidence agreed in advance that determines whether to proceed, change, or stop." },
    ],
    followUps: [
      "What did your Flow Runner pilot intentionally exclude?",
      "Which result would have stopped or changed the initiative?",
      "How do you prevent a prototype from becoming unsupported production code?",
      "How would you prototype an identity product when real data is sensitive?",
    ],
    cue: "Riskiest assumption → smallest credible test → threshold → evidence → decision",
  },
  {
    key: "stage2-state-failure-workflow",
    category: "1 · Product definition and requirements",
    priority: "Useful backup",
    question: "How would you model the states and failure paths in a business-verification workflow?",
    audience: "State transitions · exceptions · audit evidence",
    testing: "Whether you can make a complex workflow explicit enough for engineering, operations, risk, and QA to agree on its behaviour.",
    plainEnglish: "List every meaningful status, the event that moves a case to the next status, who or what is allowed to trigger it, what happens when it fails or times out, and what evidence must be recorded.",
    answerPlan: [
      { label: "States", detail: "Received, validating, verified, declined, review, expired, closed" },
      { label: "Events", detail: "Submission, evidence result, timeout, reviewer action, resubmission" },
      { label: "Rules", detail: "Authorisation, validation, permitted and forbidden transitions" },
      { label: "Failures", detail: "Retry, duplicate, partial result, stale evidence, dependency outage" },
      { label: "Evidence", detail: "Reason, actor, timestamp, version, audit event, notification" },
    ],
    answer: "I would begin with a simple state model such as Received → Validating → Verified, Not verified, or Manual review, with further transitions for additional evidence, reviewer decisions, expiry, resubmission, and closure. For every transition I would define the triggering event, permitted actor or service, prerequisites, validation, timeout, retry and duplicate behaviour, customer response, downstream side effects, and required audit event. I would also identify terminal versus recoverable states and distinguish a risky result from a result that is uncertain because data is missing.\n\nContingency Management is the closest example from my experience. A failed order was not simply ‘failed’; agents needed to know whether the data could be corrected, whether resubmission was permitted, whether it had already occurred, and what should be logged. I specified address validation, controlled correction, resubmission behaviour, automated retry after correction, status handling, and audit logging. The state model gives product, engineering, QA, and operations one shared language for edge cases.",
    resumeAnchor: "Contingency Management for correction and resubmission states; Catalog Management for the important difference between expiring and cancelling.",
    keyTerms: [
      { term: "Terminal state", meaning: "A status from which no normal workflow transition continues." },
      { term: "Recoverable state", meaning: "A case can proceed after correction, more evidence, or a retry." },
      { term: "Transition guard", meaning: "A condition that must be true before a status change is allowed." },
      { term: "Side effect", meaning: "An additional system change caused by the transition, such as billing or notification." },
    ],
    followUps: [
      "What is the difference between decline and manual review?",
      "How would you prevent the same case from being resubmitted twice?",
      "What happens when evidence expires during review?",
      "How would you test forbidden state transitions?",
    ],
    cue: "State → trigger → guard → failure path → audit evidence",
  },
  {
    key: "stage2-service-boundary",
    category: "2 · Architecture, security, and reliability",
    priority: "Must know",
    question: "How do you decide whether a microservice or technical simplification is worth building?",
    audience: "Architecture · service boundaries · migration risk",
    testing: "Whether you connect architecture to product value and can simplify a platform without creating a risky rewrite.",
    plainEnglish: "A new service is valuable only if it removes a real recurring cost—such as inconsistent decisions, slow changes, failures, or unclear ownership—and the migration can be proven safe.",
    answerPlan: [
      { label: "Cost", detail: "Quantify inconsistency, delay, incidents, or repeated effort" },
      { label: "Boundary", detail: "Decide what the service owns and deliberately does not own" },
      { label: "Contract", detail: "Inputs, outputs, reason codes, and dependencies" },
      { label: "Migration", detail: "Compatibility, pilot, parity, rollback" },
      { label: "Value", detail: "Measure quality, speed, reliability, and reuse" },
    ],
    answer: "I do not start with ‘we need another microservice.’ I start with the recurring cost of the current design: inconsistent behaviour, change effort, latency, incidents, support burden, or unclear ownership. If that cost is material, I work with engineering to define a narrow boundary—what the service owns, what remains in source systems, its contract, dependencies, and failure behaviour. I then compare the expected recurring benefit with build and migration cost and require a safe validation plan.\n\nIn Flow Runner, qualification logic was duplicated across reseller-service, catalog-api, and merchant adapters. The important boundary decision was that Flow Runner would execute rules consistently but would not own the rules; catalog-api and the policy store remained the sources of truth. We supported both legacy and new formats and compared outcomes against real catalog data before cutover. That reduced inconsistency and multi-service deployment effort without forcing every consumer into a big-bang migration.",
    resumeAnchor: "Flow Runner: duplicated logic, explicit service boundary, legacy compatibility, real-data parity, and reusable recipe model.",
    keyTerms: [
      { term: "Service boundary", meaning: "The responsibility and data a service owns—and what it leaves elsewhere." },
      { term: "Parity", meaning: "The new path produces the same expected outcomes as the existing path." },
      { term: "Big-bang migration", meaning: "All consumers switch at once, increasing coordination and rollback risk." },
    ],
    followUps: [
      "Why did Flow Runner not own the rules as well?",
      "How did you prove parity?",
      "What would make you reject a proposed new microservice?",
      "How would you roll back if the new service behaved differently?",
    ],
    cue: "Recurring cost → clear ownership boundary → compatible migration → proven value",
  },
  {
    key: "stage2-non-functional-requirements",
    category: "2 · Architecture, security, and reliability",
    priority: "Must know",
    question: "Which non-functional requirements would you define for an Identity Verification API?",
    audience: "Latency · availability · privacy · observability",
    testing: "Whether you understand the production qualities that make a technically correct API usable and trustworthy at scale.",
    plainEnglish: "The API must not only return the right answer. It must return it quickly enough, remain available, protect sensitive data, fail safely, produce audit evidence, and tell operators when something is wrong.",
    answerPlan: [
      { label: "Outcome", detail: "Customer journey and consequence of delay or failure" },
      { label: "Reliability", detail: "Availability, latency percentiles, throughput, recovery" },
      { label: "Protection", detail: "Authentication, authorisation, encryption, privacy" },
      { label: "Failure", detail: "Timeouts, retries, rate limits, degradation, safe defaults" },
      { label: "Evidence", detail: "Logs, traces, metrics, audit trail, data freshness" },
    ],
    answer: "I would first ask where the API sits in the customer journey and what happens if it is slow, unavailable, or uncertain. From that, I would define measurable requirements with engineering rather than inventing arbitrary targets. The core areas are availability; p95 and p99 latency; throughput and scaling; timeout, retry, and rate-limit behaviour; resilience and recovery; authentication and authorisation; encryption and sensitive-data handling; auditability; observability through logs, metrics, traces, and correlation IDs; data freshness and lineage; and versioning and compatibility.\n\nFor an identity decision, I would also define safe behaviour when a dependency is unavailable or evidence is stale: for example, whether the request fails closed, returns ‘review required,’ or uses an approved degraded path. The correct choice depends on fraud risk, customer friction, and regulation. I would pair every target with monitoring, an owner, and a validation method so the NFR becomes a production control rather than documentation.",
    resumeAnchor: "Aeroplan for sensitive-data design and contract quality; Contingency Management for validation and auditability; Bell platform work for distributed-service dependencies.",
    keyTerms: [
      { term: "p95 latency", meaning: "Ninety-five percent of requests finish within this time; the slowest five percent take longer." },
      { term: "SLO", meaning: "A measurable reliability target such as availability or latency." },
      { term: "Correlation ID", meaning: "An identifier used to trace one request across several services." },
      { term: "Fail closed", meaning: "Deny or stop when safety cannot be established, rather than silently allowing the action." },
    ],
    followUps: [
      "How would you balance a richer fraud check against response latency?",
      "What should happen when a critical data provider is unavailable?",
      "How would you choose an availability or latency target?",
      "Which signals would you put on an operational dashboard?",
    ],
    cue: "Correct answer + speed + availability + protection + safe failure + evidence",
  },
  {
    key: "stage2-security-by-design",
    category: "2 · Architecture, security, and reliability",
    priority: "Must know",
    question: "How do you build security and privacy into product design rather than adding them at the end?",
    audience: "Threats · sensitive data · architecture decisions",
    testing: "Whether you recognise product-level security risk early and translate it into design choices and testable controls.",
    plainEnglish: "Identify what could go wrong before build, reduce the sensitive data exposed, restrict who can do what, define safe failure behaviour, and test the controls throughout delivery.",
    answerPlan: [
      { label: "Threat", detail: "Data, actors, abuse cases, dependencies, and consequences" },
      { label: "Minimise", detail: "Collect, expose, and retain only what the flow needs" },
      { label: "Control", detail: "Authentication, authorisation, validation, and secrets" },
      { label: "Prove", detail: "Acceptance criteria, security review, negative tests, audit" },
      { label: "Monitor", detail: "Detection, response, ownership, and post-launch review" },
    ],
    answer: "I bring security into discovery by identifying sensitive data, actors, trust boundaries, abuse cases, third-party dependencies, and the consequence of compromise. Then I apply data minimisation and work with engineering and security on authentication, authorisation, encryption, validation, secrets handling, audit events, and safe error behaviour. I turn the agreed controls into acceptance criteria and include negative, integration, and security testing before launch, with monitoring and response ownership after launch.\n\nFor Bell’s Aeroplan integration, the proposed design passed customer data in URL query parameters, where it could be exposed through browser history, logs, or copied links. I raised the privacy and fraud risk and aligned engineering and security on a one-time token exchange: the host stored the payload through a Token API, received a UUID, and the microfrontend retrieved the data through the BFF. We then used the API contract, generated types, acceptance criteria, and UAT as delivery gates. The example shows security changing the architecture before code hardened around an unsafe pattern.",
    resumeAnchor: "Aeroplan token exchange is the primary security-design story; CRA security and accessibility criteria demonstrate continuous controls.",
    keyTerms: [
      { term: "Data minimisation", meaning: "Use and expose only the information required for the purpose." },
      { term: "Trust boundary", meaning: "A point where data or control moves between parties with different levels of trust." },
      { term: "Least privilege", meaning: "A user or service receives only the access needed for its task." },
      { term: "Negative test", meaning: "A test proving invalid, unauthorised, or unsafe input is rejected correctly." },
    ],
    followUps: [
      "Why were URL query parameters unsafe in that context?",
      "How was the one-time token protected from replay?",
      "What security acceptance criteria would you write?",
      "How do you handle a security request that significantly delays launch?",
    ],
    cue: "Threat early → minimise data → control access → test → monitor",
  },
  {
    key: "stage2-testing-strategy",
    category: "2 · Architecture, security, and reliability",
    priority: "Must know",
    question: "How would you test an API-based product before and after launch?",
    audience: "Quality strategy · UAT · production confidence",
    testing: "Whether you can design layered product validation instead of treating testing as a final QA phase.",
    plainEnglish: "Different tests catch different failures. Verify the business rules, interface contract, integrations, bad inputs, performance, security, user workflow, and production behaviour.",
    answerPlan: [
      { label: "Rules", detail: "Unit and business-rule tests" },
      { label: "Contract", detail: "Schema, consumer/provider, and compatibility tests" },
      { label: "System", detail: "Integration, end-to-end, negative, and security tests" },
      { label: "Scale", detail: "Performance, resilience, and dependency failure" },
      { label: "Launch", detail: "UAT, telemetry, staged release, rollback, regression" },
    ],
    answer: "I build a risk-based test strategy. Business rules need focused tests; the API schema and consumer/provider agreement need contract tests; service interactions need integration tests; critical customer journeys need end-to-end tests; and invalid, unauthorised, duplicate, stale, and boundary inputs need negative tests. I also define performance, resilience, security, and dependency-failure scenarios. UAT proves the workflow with business or operational users, but it does not replace automated tests.\n\nFor the Aeroplan integration, OpenAPI-generated TypeScript types acted as a compile-time contract check and exposed two mismatches during UAT. Both were fixed before release, and the integration launched with zero post-launch regressions. After launch, I would monitor error rate, latency, availability, business outcomes, and support signals; use a staged release where risk justifies it; maintain rollback criteria; and add every escaped defect to the regression suite.",
    resumeAnchor: "Aeroplan: generated contract types, two UAT mismatches caught, zero post-launch integration regressions. CRA: Axe-core in CI/CD as a continuous regression gate.",
    keyTerms: [
      { term: "Regression test", meaning: "A repeatable test proving a previously working behaviour has not broken." },
      { term: "Integration test", meaning: "A test of how two or more components work together." },
      { term: "UAT", meaning: "Users or business representatives validate that the product supports the intended workflow." },
      { term: "Staged rollout", meaning: "Release to a limited group first so risk can be observed before full exposure." },
    ],
    followUps: [
      "What exactly were the two contract mismatches?",
      "What would you automate versus leave for UAT?",
      "What are your launch and rollback criteria?",
      "How would you test a third-party dependency failure?",
    ],
    cue: "Rules → contract → system → scale/security → UAT and production monitoring",
  },
  {
    key: "stage2-data-science-partnership",
    category: "3 · Identity, fraud, and data",
    priority: "Must know",
    question: "How would you partner with data science on a Business Identity or fraud model?",
    audience: "Model productisation · thresholds · human review",
    testing: "Whether you can turn a statistical model into a usable, governed product while being honest about the boundary of your experience.",
    plainEnglish: "Agree on the decision, the cost of being wrong, the available evidence, and how the model will be used. Then define the API, explanations, review workflow, monitoring, and change controls around it.",
    answerPlan: [
      { label: "Decision", detail: "User, action, outcome, and ground truth" },
      { label: "Errors", detail: "Cost of false positives and false negatives" },
      { label: "Evidence", detail: "Signals, consent, quality, freshness, coverage" },
      { label: "Product", detail: "Threshold, reason codes, API, review, fallback" },
      { label: "Operate", detail: "Segment testing, drift, versions, feedback, governance" },
    ],
    answer: "I would start with the product decision: who uses the output, what action it supports, what ground-truth outcome is available, and what a false positive or false negative costs. With data science, risk, legal/privacy, and operations, I would agree on signal availability, consent, quality, freshness, coverage, threshold behaviour, explainability, and the human-review path. I would then translate that into an API contract, ordered reason codes, workflows, acceptance criteria, launch guardrails, and customer documentation.\n\nBefore launch, I would evaluate performance by meaningful segments rather than only an aggregate score—for example geography, business type, data coverage, or customer workflow. After launch, I would monitor decision distribution, error outcomes when labels mature, drift, overrides, review outcomes, and model or policy versions. I would be candid that I have not formally owned a data-science team; my strength is productising complex rules and decisions through APIs, controls, testing, and operational workflows while partnering closely with the specialists who own the model.",
    resumeAnchor: "Adjacent evidence: Catalog eligibility rules, Flow Runner decision execution, Contingency validation/audit, and Aeroplan API quality. Do not claim direct model ownership.",
    keyTerms: [
      { term: "False positive", meaning: "A legitimate business is incorrectly flagged as risky." },
      { term: "False negative", meaning: "A risky or fraudulent business is incorrectly allowed." },
      { term: "Threshold", meaning: "The score or rule boundary that changes the decision or route." },
      { term: "Drift", meaning: "Production data or model behaviour changes over time, reducing expected performance." },
    ],
    followUps: [
      "How would you choose or change a decision threshold?",
      "What if the model performs well overall but poorly in one geography?",
      "How would human-review outcomes improve the product?",
      "How would you explain your lack of direct data-science ownership?",
    ],
    cue: "Decision → cost of errors → evidence → product workflow → monitoring and governance",
  },
  {
    key: "stage2-identity-metrics",
    category: "3 · Identity, fraud, and data",
    priority: "Must know",
    question: "How would you measure whether a Business Identity product is successful?",
    audience: "Outcome metrics · decision quality · adoption",
    testing: "Whether you can balance growth, fraud protection, operations, and technical reliability instead of optimising one attractive metric.",
    plainEnglish: "A good identity product approves trustworthy businesses quickly, catches risk, avoids unnecessary manual work, integrates reliably, and creates enough value that customers keep using it.",
    answerPlan: [
      { label: "Customer", detail: "Completion, conversion, time-to-decision, abandonment" },
      { label: "Risk", detail: "Fraud capture, false positives, false negatives, loss" },
      { label: "Operations", detail: "Manual-review rate, queue time, overrides, cost" },
      { label: "Technology", detail: "Availability, latency, errors, data coverage/freshness" },
      { label: "Business", detail: "Activation, repeat usage, retention, revenue, expansion" },
    ],
    answer: "I would begin with the specific customer job and baseline, then choose one primary outcome and a small set of guardrails. For business onboarding, the primary outcome might be the percentage of legitimate businesses completing verification within an acceptable time. Guardrails would include fraud or risky-entity capture, false-positive and false-negative rates, manual-review rate and queue time, abandonment, data coverage and freshness, API availability, latency, and error rate. Customer activation, repeat usage, retention, and revenue show whether the capability creates sustained value.\n\nI would segment the metrics by customer, geography, workflow, business type, and data-coverage level because a healthy average can hide a serious weak spot. I would also combine telemetry with customer and reviewer research to learn why users ignore, override, or trust a result. I would never claim success from API volume alone: more calls can coexist with poor decisions or more friction.",
    resumeAnchor: "Use your Bell product/adoption experience for measurement discipline, while clearly presenting the Identity metrics as the framework you would apply rather than historical results you personally achieved.",
    keyTerms: [
      { term: "Primary metric", meaning: "The main outcome that shows the product is creating value." },
      { term: "Guardrail", meaning: "A metric that prevents improvement in one area from causing unacceptable harm elsewhere." },
      { term: "Manual-review rate", meaning: "The share of cases that cannot be decided automatically and require a person." },
      { term: "Coverage", meaning: "The proportion of target cases for which sufficient data or capability is available." },
    ],
    followUps: [
      "Choose one primary metric for account opening and defend it.",
      "What would you do if conversion improves but fraud also increases?",
      "How would you measure a case when final fraud labels arrive months later?",
      "Which metrics belong on the customer dashboard versus the internal dashboard?",
    ],
    cue: "Customer outcome + fraud guardrails + operational cost + reliability + adoption",
  },
  {
    key: "stage2-explainable-decision",
    category: "3 · Identity, fraud, and data",
    priority: "Must know",
    question: "What should an identity decision API return besides ‘approve’ or ‘decline’?",
    audience: "Explainability · auditability · review workflow",
    testing: "Whether you understand that a risk decision must be actionable, traceable, and usable by both automated systems and human reviewers.",
    plainEnglish: "The customer needs to know what happened, why it happened, how certain and current the evidence is, what to do next, and how to trace the decision later.",
    answerPlan: [
      { label: "Decision", detail: "Outcome and recommended next action" },
      { label: "Reason", detail: "Ordered, stable reason codes and safe explanations" },
      { label: "Evidence", detail: "Relevant signals, source, freshness, and coverage" },
      { label: "Version", detail: "Policy/model version, timestamp, and threshold context" },
      { label: "Trace", detail: "Decision ID, correlation ID, audit events, review path" },
    ],
    answer: "The response should first provide a clear outcome and next action—for example approve, decline, request more evidence, or send to review. It should include stable reason codes in priority order so the consuming workflow can act consistently, plus an explanation that reveals enough to support review without exposing controls in a way that helps fraudsters. Where appropriate, it should include evidence availability, freshness, coverage, confidence or score context, and missing-data indicators.\n\nFor auditability and reproducibility, I would include a decision ID, timestamp, relevant policy or model version, and correlation ID, with detailed lineage and events available to authorised operators. The schema should distinguish ‘risky’ from ‘insufficient evidence’ because those cases require different customer experiences. This maps to my Catalog work, where explicit reasons and downstream impacts resolved conflicting rule interpretations, and to Contingency Management, where audit logging made every correction and resubmission traceable.",
    resumeAnchor: "Catalog Management for explicit decision rules and consequences; Contingency Management for audit logging and actionable exception handling.",
    keyTerms: [
      { term: "Reason code", meaning: "A stable machine-readable explanation for why a decision or route occurred." },
      { term: "Lineage", meaning: "Where evidence came from and how it contributed to the result." },
      { term: "Reproducibility", meaning: "The ability to reconstruct why a past decision occurred using its evidence and versions." },
      { term: "Step-up", meaning: "Requesting additional evidence or verification when current confidence is insufficient." },
    ],
    followUps: [
      "How do you explain a decision without teaching fraudsters how to evade it?",
      "What is the difference between high risk and insufficient evidence?",
      "How would reason codes change without breaking customers?",
      "What information should only an internal reviewer see?",
    ],
    cue: "Outcome → reasons → evidence → version → trace and next action",
  },
  {
    key: "stage2-production-degradation",
    category: "3 · Identity, fraud, and data",
    priority: "Useful backup",
    question: "What would you do if an identity or fraud product suddenly produced worse decisions in production?",
    audience: "Incident response · data quality · product judgment",
    testing: "Whether you can protect customers, investigate systematically, make reversible decisions, and turn an incident into a stronger product.",
    plainEnglish: "First limit harm. Then confirm what changed, find the affected segment and cause, choose the safest temporary path, verify the fix, and prevent recurrence.",
    answerPlan: [
      { label: "Detect", detail: "Confirm the signal, baseline, scope, and severity" },
      { label: "Contain", detail: "Pause, roll back, route to review, or reduce exposure" },
      { label: "Diagnose", detail: "Data, model/rule, code, dependency, configuration, segment" },
      { label: "Recover", detail: "Test fix, reconcile affected cases, communicate" },
      { label: "Learn", detail: "Monitoring, regression test, runbook, owner, postmortem" },
    ],
    answer: "I would treat it as both a product-risk and technical incident. First, I would verify the signal against a baseline, identify the affected decisions and segments, and agree on severity and ownership. If customer or fraud harm is material, I would use the safest reversible containment available: pause a rule or release, roll back, reduce traffic, or route uncertain cases to manual review. In parallel, the team would compare recent changes across input data, data freshness, rules or model versions, code, configuration, and external dependencies.\n\nAfter identifying the cause, we would test the fix against representative and affected cases, restore gradually, reconcile decisions that may need correction, and communicate with impacted customers or operators. Finally, I would add a monitor, regression test, runbook, and clear owner for the failure mode. My Contingency Management example is relevant: direct workflow observation and failure analysis traced repeated kickouts to invalid upstream address data, leading to validation, controlled correction, resubmission, and auditability rather than repeated manual escalation.",
    resumeAnchor: "Contingency Management for root-cause analysis, upstream data validation, controlled recovery, and audit logging. Do not present it as a machine-learning incident.",
    keyTerms: [
      { term: "Containment", meaning: "A temporary action that limits harm before the final fix is ready." },
      { term: "Rollback", meaning: "Return to a known earlier version or configuration." },
      { term: "Reconciliation", meaning: "Identify and correct records or decisions affected during the incident." },
      { term: "Postmortem", meaning: "A blameless review of cause, response, and prevention actions." },
    ],
    followUps: [
      "Who decides whether to roll back?",
      "When would you fail closed versus route to manual review?",
      "How would you find whether the issue affects only one segment?",
      "How would you communicate during the incident?",
    ],
    cue: "Detect → contain → diagnose → recover → prevent recurrence",
  },
  {
    key: "stage2-prioritization-tech-debt",
    category: "4 · Delivery and prioritisation",
    priority: "Must know",
    question: "How do you prioritise customer features, risk work, and technical debt in one backlog?",
    audience: "Backlog judgment · risk · cost of delay",
    testing: "Whether you can make transparent trade-offs instead of treating technical work as automatically lower priority or accepting the loudest stakeholder request.",
    plainEnglish: "Compare every item using the same evidence: customer value, risk, urgency, dependencies, recurring cost, effort, and what happens if you delay it.",
    answerPlan: [
      { label: "Outcome", detail: "Customer, business, risk, or operational value" },
      { label: "Urgency", detail: "Deadline, exposure, cost of delay, and reversibility" },
      { label: "Leverage", detail: "Dependencies removed and future work accelerated" },
      { label: "Cost", detail: "Effort, capacity, migration, and opportunity cost" },
      { label: "Commit", detail: "Decision, evidence, owner, milestone, and re-evaluation" },
    ],
    answer: "I use common decision criteria across all work: customer and business outcome, fraud/security/compliance exposure, urgency and cost of delay, operational burden, dependencies, recurring engineering cost, effort, and confidence in the evidence. Mandatory risk work can set a non-negotiable boundary, but even then I make scope and timing explicit. Technical debt becomes a product priority when it causes incidents, inconsistent outcomes, slow change, excessive support, or blocks important roadmap work.\n\nFlow Runner is a good example. Centralising rule execution was not valuable because ‘microservices are cleaner’; it addressed inconsistent qualification, repeated deployments, and unclear decision paths. We narrowed the boundary, supported legacy formats, and proved parity so the recurring benefit justified the migration risk. I would communicate the priority decision and what is displaced, reserve capacity where recurring risk warrants it, and revisit assumptions as evidence changes.",
    resumeAnchor: "Flow Runner for technical-debt leverage; chargeback queue for deadline and recovery-value prioritisation; Bell backlog for cross-functional trade-offs.",
    keyTerms: [
      { term: "Cost of delay", meaning: "The value or risk lost for each period an item is postponed." },
      { term: "Technical debt", meaning: "A design or implementation compromise that creates future cost or risk." },
      { term: "Opportunity cost", meaning: "The valuable work not done because capacity is used elsewhere." },
      { term: "Reversibility", meaning: "How easily a decision can be changed if new evidence appears." },
    ],
    followUps: [
      "What if engineering and commercial stakeholders strongly disagree?",
      "How much capacity would you reserve for technical debt?",
      "Give an example of work you would explicitly defer.",
      "How do you prioritise an urgent vulnerability against a committed launch?",
    ],
    cue: "Value and risk + cost of delay + leverage + effort → transparent trade-off",
  },
  {
    key: "stage2-cross-team-dependencies",
    category: "4 · Delivery and prioritisation",
    priority: "Must know",
    question: "How do you manage technical dependencies across engineering, security, operations, and an external partner?",
    audience: "Dependency management · vendor delivery · launch readiness",
    testing: "Whether you can turn a cross-company plan into explicit interfaces, owners, decision dates, evidence, and escalation paths.",
    plainEnglish: "A dependency is manageable when everyone knows the deliverable, owner, due date, acceptance evidence, impact of delay, and who makes the decision when it slips.",
    answerPlan: [
      { label: "Map", detail: "Deliverable, interface, owner, consumer, milestone, critical path" },
      { label: "Contract", detail: "Schema, acceptance criteria, SOW/SLA, and quality evidence" },
      { label: "Cadence", detail: "Decision log, risk review, integration checkpoints, demos" },
      { label: "Protect", detail: "Early test, mock/stub, contingency, escalation, rollback" },
      { label: "Launch", detail: "End-to-end UAT, readiness checklist, owner and sign-off" },
    ],
    answer: "I make each dependency concrete: what must be delivered, the providing and consuming owners, interface or artifact, milestone, acceptance evidence, critical-path impact, and decision date. I connect that to a shared delivery plan and risk log, then create integration checkpoints before the final UAT window. For an external partner, I link delivery expectations to the SOW or SLA and define an escalation path and contingency rather than relying on status meetings alone.\n\nFor the Aeroplan integration, the absence of a formal security model and API contract made the vendor SOW risky. I aligned Bell engineering and security on the token exchange, documented the OpenAPI contract and flow acceptance criteria, tracked vendor milestones against the SOW, and managed UAT across the deployment pipeline. Generated types caught two mismatches before production. The broader lesson is to make the interface and acceptance evidence the centre of dependency management, because ‘team A is 80% done’ does not prove team B can integrate safely.",
    resumeAnchor: "Aeroplan vendor integration, SOW/SLA tracking, OpenAPI quality gate, security alignment, and UAT.",
    keyTerms: [
      { term: "Critical path", meaning: "The dependent sequence that determines the earliest possible delivery date." },
      { term: "Integration checkpoint", meaning: "An early scheduled test that proves two parties can work together before final UAT." },
      { term: "SOW", meaning: "Statement of Work defining agreed vendor scope, deliverables, and responsibilities." },
      { term: "Readiness criterion", meaning: "Evidence that must be present before launch or the next delivery stage." },
    ],
    followUps: [
      "What do you do when the vendor misses a milestone?",
      "How do you manage a dependency when you do not control the other team’s backlog?",
      "What did the generated types catch in UAT?",
      "Who had final launch sign-off?",
    ],
    cue: "Explicit interface + owner + milestone + acceptance evidence + contingency",
  },
  {
    key: "stage2-agile-vs-waterfall",
    category: "5 · Agile delivery and Jira",
    priority: "Must know",
    question: "When would you use Agile rather than Waterfall, and when would a hybrid be better?",
    audience: "Delivery approach · uncertainty · governance",
    testing: "Whether you choose a delivery approach from the nature of the problem instead of treating Agile as automatically good and sequential delivery as automatically bad.",
    plainEnglish: "Use short learning cycles when the solution is uncertain and feedback can change it. Use more sequential planning when scope, approvals, or handoffs are stable. Combine them deliberately when product learning and formal controls must coexist.",
    answerPlan: [
      { label: "Assess", detail: "Uncertainty, feedback speed, risk, and cost of change" },
      { label: "Map", detail: "Dependencies, approvals, contracts, and fixed dates" },
      { label: "Choose", detail: "Adaptive, sequential, or an explicit hybrid" },
      { label: "Control", detail: "Quality gates, owners, evidence, and change decisions" },
      { label: "Learn", detail: "Inspect outcomes and adjust the operating model" },
    ],
    answer: "I choose the delivery approach by looking at uncertainty, feedback speed, risk, dependencies, and the cost of changing direction. An adaptive approach is strongest when the problem is clear but the best solution needs to be learned through small increments, demos, and user feedback. More sequential planning is useful when the work has stable requirements, formal approvals, contractual handoffs, or a change that cannot be released safely in pieces. In a large enterprise, the practical answer is often a deliberate hybrid rather than one label.\n\nAt Bell, product scope and acceptance criteria could be refined iteratively with engineering, while an integration such as Aeroplan still required a defined security model, vendor milestones, contract compatibility, UAT, and launch gates. I would keep learning and backlog decisions adaptive, but make non-negotiable security, quality, and partner evidence explicit. I would not claim one framework solves every situation, and I would not claim formal SAFe or PI Planning experience that is not on my résumé.",
    resumeAnchor: "Bell backlog ownership, sprint acceptance criteria, demos, vendor integration, security alignment, UAT, and release readiness; CRA distributed delivery and continuous quality gates.",
    keyTerms: [
      { term: "Adaptive delivery", meaning: "Delivering and learning in small increments so evidence can change the plan." },
      { term: "Sequential delivery", meaning: "Completing defined phases or approvals in an ordered sequence before progressing." },
      { term: "Hybrid", meaning: "A deliberate combination of adaptive product learning and necessary sequential controls or handoffs." },
      { term: "Empiricism", meaning: "Making decisions from observed evidence through transparency, inspection, and adaptation." },
    ],
    followUps: [
      "Give an example of work you would not deliver incrementally.",
      "How do you stop a hybrid model from becoming slow and bureaucratic?",
      "What evidence would make you change the delivery approach?",
      "How did the Aeroplan integration combine iteration with formal gates?",
    ],
    cue: "Uncertainty and feedback → dependencies and controls → deliberate delivery model",
  },
  {
    key: "stage2-scrum-vs-kanban",
    category: "5 · Agile delivery and Jira",
    priority: "Must know",
    question: "What is the difference between Scrum and Kanban, and when would you use each?",
    audience: "Scrum · Kanban · flow of work",
    testing: "Whether you understand the operating mechanics behind the labels and can match a framework to planned product work or continuously arriving demand.",
    plainEnglish: "Scrum organises work around a Sprint Goal and a fixed-length Sprint. Kanban manages a continuous flow and limits how much work is active. Choose based on how work arrives and how often the team needs to plan and learn.",
    answerPlan: [
      { label: "Demand", detail: "Planned product increments or continuous incoming work" },
      { label: "Cadence", detail: "Fixed-length Sprint or continuous pull flow" },
      { label: "Control", detail: "Sprint Goal and forecast or explicit WIP limits" },
      { label: "Measure", detail: "Goal achievement, cycle time, throughput, and quality" },
      { label: "Adapt", detail: "Review evidence and adjust rules without mixing blindly" },
    ],
    answer: "Scrum is a lightweight framework for complex work organised around a fixed-length Sprint. The Product Owner orders the Product Backlog, Developers select and plan work that supports a Sprint Goal, and the Scrum Team inspects the Increment and adapts. Kanban focuses on continuous flow: work is pulled when capacity is available, work-in-progress limits expose bottlenecks, and cycle time and throughput help the team improve the system. Kanban can still use regular planning and review cadences; it is not the absence of structure.\n\nI would favour Scrum when a stable product team benefits from a shared Sprint Goal, stakeholder review, and a regular learning rhythm. I would favour Kanban for production support, operational requests, or other work that arrives unpredictably and needs rapid flow. A team can borrow complementary flow practices, but I would make its rules explicit. My documented experience is strongest in Bell’s sprint-based backlog and acceptance-criteria delivery, so I would describe Kanban as how I would manage continuous demand rather than claim a formal Kanban implementation I did not run.",
    resumeAnchor: "Bell product backlog, sprint acceptance criteria, demos, and multi-workstream delivery. Contingency Management provides an example of operational demand, without claiming that its team formally used Kanban.",
    keyTerms: [
      { term: "Sprint Goal", meaning: "The single objective for a Sprint and the commitment associated with the Sprint Backlog." },
      { term: "WIP limit", meaning: "A cap on active work that encourages finishing and reveals bottlenecks." },
      { term: "Cycle time", meaning: "The elapsed time from starting a work item until it is finished." },
      { term: "Throughput", meaning: "The number of work items completed during a period." },
    ],
    followUps: [
      "Can a Scrum team use Kanban practices?",
      "When would you move production support out of a Sprint backlog?",
      "What problem does a WIP limit solve?",
      "How would you know that the chosen approach is not working?",
    ],
    cue: "Scrum = Sprint Goal and inspect/adapt rhythm; Kanban = continuous pull and WIP control",
  },
  {
    key: "stage2-scrum-335",
    category: "5 · Agile delivery and Jira",
    priority: "Must know",
    question: "What does ‘3-3-5’ mean in Scrum?",
    audience: "Scrum fundamentals · precise terminology",
    testing: "Whether you know Scrum’s core structure, use the current terminology, and clarify an informal phrase instead of bluffing.",
    plainEnglish: "The phrase is probably a memory aid for three accountabilities, three artifacts, and five events. ‘3-3-5’ itself is not an official Scrum Guide term, so confirm what the interviewer means before answering.",
    answerPlan: [
      { label: "Clarify", detail: "Confirm that they mean Scrum’s core structure" },
      { label: "People", detail: "Product Owner, Scrum Master, and Developers" },
      { label: "Artifacts", detail: "Product Backlog, Sprint Backlog, and Increment" },
      { label: "Events", detail: "Sprint plus Planning, Daily Scrum, Review, Retrospective" },
      { label: "Connect", detail: "Name each artifact commitment and its purpose" },
    ],
    answer: "I would first clarify the phrase because ‘3-3-5’ is not wording used by the official Scrum Guide. The likely meaning is three accountabilities, three artifacts, and five events. The accountabilities are Product Owner, Scrum Master, and Developers. The artifacts are the Product Backlog, Sprint Backlog, and Increment. The five events are the Sprint—which contains the other events—Sprint Planning, Daily Scrum, Sprint Review, and Sprint Retrospective.\n\nI would add the commitments because they make the artifacts useful: the Product Goal is the commitment for the Product Backlog, the Sprint Goal for the Sprint Backlog, and the Definition of Done for the Increment. Some sources arrange the same numbers as ‘3-5-3,’ so I would not argue over the order; I would show that I understand the structure and how it supports transparency, inspection, and adaptation. I would also say ‘accountabilities’ and ‘events,’ which are the current Scrum Guide terms, rather than relying only on ‘roles’ and ‘ceremonies.’",
    resumeAnchor: "Bell backlog ownership, sprint acceptance criteria, demos, and delivery coordination show practical experience. Do not imply that the résumé proves a formally titled Scrum accountability, SAFe certification, or PI Planning ownership.",
    keyTerms: [
      { term: "Accountability", meaning: "A defined area of responsibility in the Scrum Team: Product Owner, Scrum Master, or Developers." },
      { term: "Artifact", meaning: "Work or value made transparent for inspection: Product Backlog, Sprint Backlog, or Increment." },
      { term: "Event", meaning: "A formal opportunity to inspect and adapt; the Sprint contains the other four events." },
      { term: "Commitment", meaning: "The Product Goal, Sprint Goal, or Definition of Done attached to an artifact." },
    ],
    followUps: [
      "What is the commitment for each artifact?",
      "Why is the Sprint counted as an event?",
      "What changed from ‘roles’ to ‘accountabilities’ in current language?",
      "Is backlog refinement one of the five Scrum events?",
    ],
    cue: "Likely shorthand: 3 accountabilities + 3 artifacts + 5 events; clarify, then explain",
  },
  {
    key: "stage2-sprint-events",
    category: "5 · Agile delivery and Jira",
    priority: "Must know",
    question: "Walk me through a Sprint and explain the purpose of each Scrum event.",
    audience: "Sprint lifecycle · Scrum events · inspect and adapt",
    testing: "Whether you understand how Scrum turns a Product Goal into a usable Increment and how each event creates a distinct inspection and adaptation point.",
    plainEnglish: "Planning sets the goal and plan, the Daily Scrum adjusts the Developers’ plan, the Review inspects the product outcome with stakeholders, and the Retrospective improves how the team works. The Sprint contains all of them.",
    answerPlan: [
      { label: "Plan", detail: "Why valuable, what can be done, and how work will be created" },
      { label: "Build", detail: "Developers create a usable Increment during the Sprint" },
      { label: "Inspect", detail: "Daily Scrum checks progress toward the Sprint Goal" },
      { label: "Review", detail: "Stakeholders inspect outcome and adapt future direction" },
      { label: "Improve", detail: "Retrospective selects ways to raise quality and effectiveness" },
    ],
    answer: "The Sprint is the fixed-length container for all Scrum work and events. Sprint Planning starts it by addressing why the Sprint is valuable, what can be done, and how the selected work will be completed. Together, the Sprint Goal, selected Product Backlog items, and delivery plan form the Sprint Backlog. During the Sprint, Developers hold a 15-minute Daily Scrum to inspect progress toward the Sprint Goal and adapt their plan; it is not primarily a status meeting for a manager.\n\nThe Sprint Review is a working session with stakeholders to inspect the outcome, discuss what changed, and adapt the Product Backlog. It should be more than a demo or approval gate. The Sprint Retrospective inspects people, interactions, processes, tools, and the Definition of Done, then identifies improvements to quality and effectiveness. At Bell, my contribution included maintaining buildable priorities and acceptance criteria, making dependencies visible, reviewing demos against expected behaviour, and incorporating feedback into later backlog decisions. I would not claim that every Bell meeting followed textbook Scrum if it did not.",
    resumeAnchor: "Bell backlog ownership, sprint acceptance criteria, dependency coordination, demos, handoffs, and post-launch reviews; CRA distributed-team delivery and release readiness.",
    keyTerms: [
      { term: "Sprint", meaning: "A fixed-length event of one month or less that contains all other Scrum events." },
      { term: "Daily Scrum", meaning: "A 15-minute event for Developers to inspect progress toward the Sprint Goal and adapt the Sprint Backlog." },
      { term: "Sprint Review", meaning: "A stakeholder working session to inspect the outcome and decide future adaptations." },
      { term: "Sprint Retrospective", meaning: "The Scrum Team’s event for improving quality and effectiveness." },
    ],
    followUps: [
      "What are the three topics addressed in Sprint Planning?",
      "How is a Sprint Review different from a demo?",
      "Who is the Daily Scrum for?",
      "What happens to unfinished work at the end of the Sprint?",
    ],
    cue: "Plan value and work → build and adapt daily → review outcome → improve the system",
  },
  {
    key: "stage2-backlog-refinement",
    category: "5 · Agile delivery and Jira",
    priority: "Must know",
    question: "How do you run effective backlog refinement and decide that work is ready for Sprint Planning?",
    audience: "Product Backlog · refinement · requirement quality",
    testing: "Whether you continuously turn product direction into ordered, understood, testable work without using refinement as a last-minute ticket-writing meeting.",
    plainEnglish: "Bring the most important future work into focus early. Clarify its value, users, rules, dependencies, acceptance evidence, and size until the team understands enough to make a responsible forecast.",
    answerPlan: [
      { label: "Order", detail: "Start with Product Goal, value, risk, and dependencies" },
      { label: "Explain", detail: "User, outcome, workflow, rules, and boundaries" },
      { label: "Explore", detail: "Engineering, QA, data, security, and operations questions" },
      { label: "Split", detail: "Create smaller valuable items with testable acceptance criteria" },
      { label: "Confirm", detail: "Shared understanding, dependencies, estimate, and evidence needs" },
    ],
    answer: "Backlog refinement is an ongoing activity, not one of Scrum’s five formal events. I start from the Product Goal and bring forward the highest-value, highest-risk, or dependency-sensitive items early enough for the right people to shape them. For each item, I make the user and outcome clear, then work through workflow, business rules, data, interfaces, exception paths, non-functional needs, dependencies, and testable acceptance criteria with engineering and quality partners. Large or uncertain items are split around valuable behaviour rather than technical tasks alone.\n\nI treat ‘ready’ as a practical team agreement, not an official Scrum artifact. The team should understand the purpose, boundaries, key acceptance evidence, dependencies, and enough of the work to make a responsible Sprint forecast. At Bell, Catalog Management required separate stakeholder sessions and a reconciled rules document before engineering could safely build promotion workflows. Contingency Management similarly became buildable only after operations discovery exposed address correction, resubmission, validation, and audit needs. Refinement reduces avoidable ambiguity; it should not eliminate all learning before development begins.",
    resumeAnchor: "Bell backlog ownership and sprint acceptance criteria; Catalog Management rules/sign-off; Contingency Management workflow discovery, endpoint requirements, validation, and auditability.",
    keyTerms: [
      { term: "Product Backlog", meaning: "The emergent, ordered list of what is needed to improve the product." },
      { term: "Refinement", meaning: "The ongoing activity of breaking down and adding detail, order, and size to Product Backlog items." },
      { term: "Product Goal", meaning: "The long-term objective and commitment associated with the Product Backlog." },
      { term: "Definition of Ready", meaning: "An optional team working agreement; it is not an official Scrum artifact or commitment." },
    ],
    followUps: [
      "Who should attend refinement?",
      "How far ahead should a team refine?",
      "How do you split an API or platform story vertically?",
      "What do you do when engineering says an item is not ready?",
    ],
    cue: "Order by goal and risk → clarify behaviour → expose dependencies → split → shared readiness",
  },
  {
    key: "stage2-practical-jira",
    category: "5 · Agile delivery and Jira",
    priority: "Must know",
    question: "How do you use Jira to run delivery rather than merely store tickets?",
    audience: "Jira · traceability · delivery visibility",
    testing: "Whether the tool helps your team make decisions, expose dependencies, and learn—or simply creates administrative activity and misleading status reports.",
    plainEnglish: "Jira should connect the goal to the work, show who depends on whom, make blocked or changing scope visible, preserve acceptance evidence, and support useful team-level forecasts.",
    answerPlan: [
      { label: "Connect", detail: "Goal and roadmap → epic → story, defect, or risk item" },
      { label: "Clarify", detail: "Outcome, acceptance criteria, owner, links, and evidence" },
      { label: "Flow", detail: "Board states, blockers, dependencies, WIP, and ageing work" },
      { label: "Release", detail: "Versions, readiness, test status, and unresolved risks" },
      { label: "Improve", detail: "Use reports as signals, then discuss causes and actions" },
    ],
    answer: "I use Jira as a shared delivery model, not as a substitute for product judgment. I connect roadmap outcomes to epics and then to stories, defects, risk work, and dependencies. Each work item should make the expected behaviour, acceptance criteria, owner, linked dependency, and evidence of completion visible. During delivery, the board should expose blocked work, scope changes, ageing items, and handoffs. For release readiness, I want a clear view of completed acceptance evidence, unresolved defects or risks, and which dependency could still prevent launch.\n\nReports such as burndown, sprint reports, velocity, control charts, or cumulative flow can support a question, but the chart is not the answer. I would use velocity only for the same team’s forecasting, never to rank people or teams, and I would investigate why cycle time or blocked work changed. My documented Bell and CRA evidence is backlog coordination, acceptance criteria, distributed dependencies, demos, and release readiness. In the interview I would name only Jira configurations and reports I personally used, rather than implying I administered every feature.",
    resumeAnchor: "Bell backlog ownership, sprint acceptance criteria, 6+ coordinated workstreams, demos, and release readiness; CRA distributed delivery and quality gates. Keep specific Jira-report claims aligned to actual use.",
    keyTerms: [
      { term: "Traceability", meaning: "A visible link from product goal and requirement through implementation, test evidence, and release." },
      { term: "Burndown", meaning: "A Scrum-board report showing work remaining during a Sprint and changes that may affect the Sprint Goal." },
      { term: "Control chart", meaning: "A report showing cycle time so the team can inspect predictability and variation." },
      { term: "Version", meaning: "Jira’s grouping for work intended for a particular release." },
    ],
    followUps: [
      "Which Jira fields do you consider essential?",
      "Which reports have you personally used and what decision did they change?",
      "How do you represent cross-team dependencies?",
      "How do you stop Jira hygiene from becoming administrative theatre?",
    ],
    cue: "Goal-to-work traceability + visible flow and dependencies + evidence-based release decisions",
  },
  {
    key: "stage2-delivery-metrics",
    category: "5 · Agile delivery and Jira",
    priority: "Must know",
    question: "Which Agile delivery metrics matter, and how do they change your decisions?",
    audience: "Delivery health · forecasting · continuous improvement",
    testing: "Whether you distinguish product outcomes from delivery signals, interpret metrics in context, and avoid using velocity as an individual or cross-team performance score.",
    plainEnglish: "Measure whether the team achieved a valuable goal, how smoothly work flowed, whether quality held, and how reliable forecasts were. Every metric should trigger a conversation or decision.",
    answerPlan: [
      { label: "Outcome", detail: "Sprint or product goal and customer/business evidence" },
      { label: "Flow", detail: "Cycle time, throughput, ageing work, and blocked time" },
      { label: "Forecast", detail: "Goal achievement, planned versus completed, scope change" },
      { label: "Quality", detail: "Defects, regressions, rework, and release readiness" },
      { label: "Act", detail: "Segment the signal, find the cause, and change the system" },
    ],
    answer: "I use a balanced set of outcome, flow, forecasting, and quality measures. First, did the Sprint or release achieve the intended user or business outcome? For flow, cycle time, throughput, ageing work, and blocked time can expose bottlenecks. For forecasting, I look at Sprint Goal achievement, planned versus completed work, and scope change. For quality, I look at defects, rework, regressions, and readiness evidence. Velocity can help one stable team forecast future capacity, but it should not be used to compare teams or judge individual productivity.\n\nThe metric matters only if it changes a decision. Rising cycle time might lead us to inspect a dependency or oversized stories; repeated scope change might mean weak discovery or unstable priorities; more completed work with more regressions is not success. I would not claim that I personally tracked every metric in this list. My defensible evidence includes Bell acceptance and release validation, Aeroplan’s two UAT contract mismatches and zero post-launch integration regressions, and CRA’s continuous accessibility regression gate. I would clearly separate metrics I used from those I would introduce for a new team.",
    resumeAnchor: "Bell demos, acceptance validation, post-launch analytics, and Aeroplan integration quality; CRA Axe-core CI/CD gate and WCAG AA delivery. Do not invent velocity, cycle-time, or burndown results.",
    keyTerms: [
      { term: "Velocity", meaning: "Completed estimates per Sprint, used cautiously by the same team for forecasting." },
      { term: "Cycle time", meaning: "Elapsed time from beginning work until it is finished." },
      { term: "Scope change", meaning: "Work added, removed, or re-estimated after a Sprint begins." },
      { term: "Escaped defect", meaning: "A defect discovered after the work passed its intended validation stage or reached production." },
    ],
    followUps: [
      "Which metric would you put on a leadership dashboard?",
      "What would you do if velocity rises but defects also rise?",
      "How do you measure predictability without pressuring estimates?",
      "Which of these metrics have you personally used?",
    ],
    cue: "Outcome + flow + forecast + quality; every metric must change a decision",
  },
  {
    key: "stage2-slipping-sprint",
    category: "5 · Agile delivery and Jira",
    priority: "Must know",
    question: "What do you do when a Sprint is slipping and the team may not meet the Sprint Goal?",
    audience: "Sprint Goal · scope negotiation · delivery recovery",
    testing: "Whether you respond early, protect quality, preserve the Sprint Goal where possible, and make a transparent trade-off instead of hiding delay or forcing overtime.",
    plainEnglish: "Find the cause and impact early. Protect the goal, remove or split lower-value scope with the right people, resolve blockers, communicate the forecast, and never lower the Definition of Done to make the chart look better.",
    answerPlan: [
      { label: "Detect", detail: "Inspect goal progress, blockers, scope change, and quality" },
      { label: "Diagnose", detail: "Dependency, ambiguity, capacity, incident, or oversized work" },
      { label: "Protect", detail: "Preserve Sprint Goal and Definition of Done" },
      { label: "Renegotiate", detail: "Developers and Product Owner adjust scope and forecast" },
      { label: "Learn", detail: "Communicate impact, re-order unfinished work, improve system" },
    ],
    answer: "I would surface the risk as soon as evidence shows the Sprint Goal is threatened. The team should inspect whether the cause is an unresolved dependency, unclear requirement, unplanned production work, capacity change, oversized item, or quality problem. I would help remove blockers and clarify decisions, then work with the Developers and Product Owner to protect the Sprint Goal. Scope can be clarified and renegotiated as more is learned, but quality should not fall and changes should not endanger the goal.\n\nThe practical options might be to split an item around the valuable behaviour, remove lower-priority scope, use an agreed dependency contingency, or revise the release forecast. I would communicate the downstream impact and evidence, not report a false percentage complete or push the team into unsustainable overtime. Work that does not meet the Definition of Done is not part of the Increment and should be re-ordered in the Product Backlog. At Bell, coordinating multiple workstreams required making dependencies and priority choices visible; I would use that experience without claiming a formal Sprint-recovery metric that is not documented.",
    resumeAnchor: "Bell coordination across 6+ workstreams, backlog prioritisation, sprint acceptance criteria, dependency management, demos, and release readiness. Do not invent a missed-Sprint statistic.",
    keyTerms: [
      { term: "Sprint Goal", meaning: "The objective that gives the Sprint coherence while allowing flexibility in the exact work." },
      { term: "Definition of Done", meaning: "The formal quality description an Increment must satisfy before it is considered complete." },
      { term: "Forecast", meaning: "The Developers’ current expectation of what can be completed; it can change as evidence changes." },
      { term: "Scope renegotiation", meaning: "Product Owner and Developers adjust selected work without endangering the Sprint Goal." },
    ],
    followUps: [
      "Who decides what leaves the Sprint?",
      "Would you ever extend the Sprint?",
      "What if the Sprint Goal itself is no longer valuable?",
      "How do you communicate the slip to dependent teams?",
    ],
    cue: "Detect early → diagnose cause → protect goal and quality → renegotiate transparently → learn",
  },
  {
    key: "stage2-dependencies-production-work",
    category: "5 · Agile delivery and Jira",
    priority: "Must know",
    question: "How do you handle cross-team dependencies and urgent production work during a Sprint?",
    audience: "Dependencies · production incidents · Sprint adaptation",
    testing: "Whether you can protect customers, coordinate work you do not directly control, and adapt the Sprint transparently without treating the original plan as more important than value and risk.",
    plainEnglish: "Make dependencies explicit before the Sprint. When urgent production work arrives, assess severity, contain harm, name the owner, and renegotiate the plan around the Sprint Goal instead of quietly adding work.",
    answerPlan: [
      { label: "Prepare", detail: "Interface, owner, milestone, evidence, contingency, and escalation" },
      { label: "Triage", detail: "Customer harm, security, compliance, severity, and urgency" },
      { label: "Contain", detail: "Restore safety or service through the smallest reversible action" },
      { label: "Replan", detail: "Adapt Sprint Backlog, scope, owners, and downstream forecast" },
      { label: "Prevent", detail: "Root cause, follow-up backlog, monitoring, and working agreement" },
    ],
    answer: "Before a Sprint, I make a dependency concrete: provider, consumer, interface or deliverable, milestone, acceptance evidence, impact of delay, contingency, and escalation owner. During the Sprint, I track the dependency against the Sprint Goal rather than waiting for a status meeting to reveal that it slipped. If urgent production work arrives, I first assess customer, security, compliance, and operational impact and contain harm through the smallest safe, reversible action.\n\nThe Developers and Product Owner can then adapt the Sprint Backlog and renegotiate scope while preserving the Sprint Goal where possible. I would not quietly add urgent work and still hold the team to the same forecast. If the event makes the Sprint Goal obsolete, only the Product Owner can cancel the Sprint; that is different from changing selected scope. At Bell, the Aeroplan integration required explicit vendor milestones, interface acceptance, security alignment, and UAT, while Contingency Management required controlled correction, resubmission, and auditability. I would use those facts to explain dependency and recovery discipline without claiming a formal incident framework or reserved capacity percentage I did not own.",
    resumeAnchor: "Bell Aeroplan vendor/SOW dependencies, OpenAPI contract, security alignment, and UAT; Contingency Management root-cause correction, controlled resubmission, validation, and audit logging.",
    keyTerms: [
      { term: "Dependency", meaning: "Work, evidence, or a decision another party must provide before an outcome can be completed." },
      { term: "Containment", meaning: "A temporary, reversible action that limits customer or operational harm." },
      { term: "Sprint cancellation", meaning: "A Product Owner decision used when the Sprint Goal becomes obsolete, not simply when work is difficult." },
      { term: "Escalation path", meaning: "The agreed route and decision owner when a dependency or incident cannot be resolved at team level." },
    ],
    followUps: [
      "How do you decide whether production work is truly urgent?",
      "What if you do not control the dependent team’s backlog?",
      "Would you reserve Sprint capacity for incidents?",
      "When would a Product Owner cancel a Sprint?",
    ],
    cue: "Prepare dependencies → triage harm → contain → adapt scope and forecast → prevent recurrence",
  },
  {
    key: "stage2-technical-debt-roadmap",
    category: "5 · Agile delivery and Jira",
    priority: "Must know",
    question: "How do you balance technical debt with customer-facing roadmap work?",
    audience: "Technical debt · prioritisation · sustainable delivery",
    testing: "Whether you can translate technical debt into customer, risk, and delivery consequences and make transparent backlog trade-offs without promising an arbitrary capacity percentage.",
    plainEnglish: "Do not prioritise debt merely because engineering dislikes the code. Show the recurring cost or risk, compare it with roadmap value, choose the smallest useful intervention, and measure whether it removed the constraint.",
    answerPlan: [
      { label: "Translate", detail: "Incidents, delay, inconsistency, security, support, or blocked roadmap" },
      { label: "Compare", detail: "Value, risk, cost of delay, effort, confidence, and reversibility" },
      { label: "Shape", detail: "Prevent, contain, or remove the debt in a valuable increment" },
      { label: "Commit", detail: "Order backlog, name displaced work, owner, and success evidence" },
      { label: "Verify", detail: "Measure changed outcome and strengthen Definition of Done" },
    ],
    answer: "I ask engineering to translate technical debt into observable product consequences: incidents, inconsistent decisions, slow changes, security exposure, support burden, dependency risk, or blocked roadmap outcomes. I compare that evidence with customer-facing work using the same criteria—value, risk, urgency, cost of delay, effort, confidence, and reversibility. I do not use a fixed capacity percentage unless the team has evidence that it fits its operating context. Sometimes the right answer is prevention through the Definition of Done; sometimes it is a focused remediation or a platform change that unlocks several roadmap items.\n\nFlow Runner is my strongest Bell example. Qualification logic was duplicated across several services, which created inconsistent outcomes and required multiple deployments for rule changes. I helped define a central execution boundary, support legacy and new formats, and prove parity with real data before cutover. That work was justified by product consistency and change leverage, not by an abstract desire to refactor. I would make the decision and displaced roadmap work visible, then verify that the expected recurring cost or risk actually decreased.",
    resumeAnchor: "Bell Flow Runner: duplicated qualification logic, explicit execution boundary, legacy compatibility, real-data parity, fewer multi-service rule-change deployments, and reusable recipes.",
    keyTerms: [
      { term: "Technical debt", meaning: "A design or implementation compromise that creates future cost, risk, or reduced ability to change." },
      { term: "Cost of delay", meaning: "The value or risk lost for each period that work is postponed." },
      { term: "Definition of Done", meaning: "A shared quality standard that helps prevent new debt from being treated as completed work." },
      { term: "Enabler", meaning: "Technical work that makes a valuable product outcome or future delivery possible." },
    ],
    followUps: [
      "How much capacity should a team reserve for technical debt?",
      "What if commercial stakeholders refuse to prioritise it?",
      "How do you distinguish debt from an engineering preference?",
      "How did you prove that Flow Runner was safer than leaving the logic in place?",
    ],
    cue: "Translate debt into impact → compare fairly → choose smallest leverage point → verify value",
  },
];

export const featureLaunchFramework: PrepCard[] = [
  { title: "1. Clarify the problem", body: "State the target user, the customer or business problem, desired outcome, constraints, and decision owner. Identify what is known, what is assumed, and the first information you need.", cue: "User → problem → outcome → constraints", color: "blue" },
  { title: "2. Define success and guardrails", body: "Choose a primary outcome metric and a small set of guardrails such as quality, fraud/risk, accessibility, cost, or operational load. Set the baseline before deciding whether the feature worked.", cue: "Outcome metric + risk guardrails", color: "teal" },
  { title: "3. Shape the MVP", body: "Prioritise the smallest valuable release. Separate must-haves from later improvements using customer impact, risk, dependency, effort, and cost of delay—not the loudest stakeholder request.", cue: "MVP first; show the prioritisation logic", color: "amber" },
  { title: "4. Align the delivery system", body: "Bring engineering, design, data, operations, security, legal/compliance, and commercial partners in early as applicable. Make workflows, acceptance criteria, interfaces, dependencies, and decision rights explicit.", cue: "Early alignment prevents late surprises", color: "purple" },
  { title: "5. Deliver, launch, learn", body: "Run the delivery cadence, manage risks and scope changes, validate against acceptance criteria, prepare rollout and support, then compare launch metrics with the baseline. Turn the learning into backlog decisions.", cue: "Build → validate → launch → measure → iterate", color: "green" },
];

export const productDesignFramework: ProductDesignFrameworkStep[] = [
  {
    id: "clarify",
    step: 1,
    label: "Clarify",
    focus: "Confirm the goal, context, constraints, scope, and what success means before proposing features.",
    output: "A one-sentence problem statement plus the assumptions you still need to test.",
    color: "blue",
  },
  {
    id: "users",
    step: 2,
    label: "Users",
    focus: "Name the people in the workflow and the job, pain, or risk each one needs the product to address.",
    output: "A short user-and-needs map expressed as outcomes rather than preselected features.",
    color: "teal",
  },
  {
    id: "prioritize",
    step: 3,
    label: "Prioritize",
    focus: "Choose the primary user and highest-value need using the stated goal, customer impact, risk, and evidence.",
    output: "One explicit priority and the reason lower-priority needs can wait.",
    color: "amber",
  },
  {
    id: "options",
    step: 4,
    label: "Options",
    focus: "Generate two or three meaningfully different approaches, then connect each capability to a prioritised need.",
    output: "A small option set and a recommended direction—not a feature list produced too early.",
    color: "purple",
  },
  {
    id: "trade-offs",
    step: 5,
    label: "Trade-offs",
    focus: "Compare user value, accuracy, friction, privacy, explainability, operational load, feasibility, and important edge cases.",
    output: "A defensible choice with risks, guardrails, and what would change the decision.",
    color: "coral",
  },
  {
    id: "roadmap",
    step: 6,
    label: "Roadmap",
    focus: "Define the smallest useful test or MVP, its success measure, and what evidence unlocks V1 and V2.",
    output: "A sequenced MVP → V1 → V2 plan tied to learning rather than a wish list.",
    color: "green",
  },
  {
    id: "summarize",
    step: 7,
    label: "Summarize",
    focus: "Restate the user, need, selected approach, rationale, success measure, and largest unresolved risk.",
    output: "A concise final recommendation the interviewer can easily challenge or extend.",
    color: "gray",
  },
];

export const productDesignPrompts: ProductDesignPrompt[] = [
  {
    title: "Small-business onboarding",
    prompt: "Design a low-friction identity-verification experience for a small business opening a new digital financial-services account.",
    possibleUsers: ["Small-business applicant", "Risk or compliance analyst", "Customer-support agent", "Integration developer"],
    tensions: ["Completion and time to decision versus fraud loss", "Automation versus explainability and manual review", "Data collection versus privacy and accessibility"],
    guardrail: "Treat this as a hypothetical workflow; do not claim knowledge of Mastercard's confidential product design or decision rules.",
  },
  {
    title: "Manual-review workspace",
    prompt: "Critique and improve a hypothetical dashboard that fraud analysts use to review uncertain business-identity decisions.",
    possibleUsers: ["Fraud analyst", "Review-operations manager", "Compliance or audit partner", "Customer affected by the decision"],
    tensions: ["Decision speed versus investigation quality", "More signals versus cognitive load", "Automation versus accountable human judgment"],
    guardrail: "Start by asking what the current dashboard, baseline, and failure modes are; do not invent a Mastercard interface and then critique it as fact.",
  },
  {
    title: "Identity API developer experience",
    prompt: "Design the onboarding and integration experience for a developer adding business-identity verification to an existing customer journey.",
    possibleUsers: ["Customer developer", "Product or risk owner", "Security reviewer", "Implementation-support team"],
    tensions: ["Fast integration versus configurable controls", "Simple responses versus useful reason codes", "Sandbox realism versus privacy and test-data safety"],
    guardrail: "Use public API-product principles and your own integration experience; keep any Mastercard-specific architecture as a question to validate.",
  },
];

export const productDesignCheckIns: string[] = [
  "I will use a simple seven-step approach: clarify, users, prioritise, options, trade-offs, roadmap, and summary. Does that direction work for you?",
  "Before I prioritise, does this user-and-needs map match the problem you want me to solve?",
  "I am prioritising this user and need because it best supports the stated goal. Would you like me to explore a different segment?",
  "I see a few viable approaches. I will compare them briefly before recommending one—does that level of depth make sense?",
  "This feedback changes one of my assumptions, so I will update the recommendation rather than defend the original path.",
  "Unless you would like a deeper technical dive, I will close with the MVP, success measures, and the largest remaining risk.",
];

export const productDesignAnswerSkeleton: ProductDesignAnswerBeat[] = [
  { label: "Frame", template: "We are solving [problem] for [primary user], within [constraint], and success means [outcome]." },
  { label: "Choose", template: "I prioritised [need] and compared [options]; I recommend [choice] because [reason]." },
  { label: "Protect", template: "The main trade-off is [trade-off], managed through [guardrail], with [edge case] requiring special handling." },
  { label: "Sequence", template: "The MVP tests [assumption] using [metric]; V1 and V2 follow only if the evidence supports them." },
  { label: "Close", template: "In summary: [user], [need], [solution], [measure], and the largest open risk is [risk]." },
];

export const roundFourQuestions: InterviewQuestion[] = [
  {
    question: "Walk me through one program on your résumé in depth.",
    audience: "Stage 4: résumé pressure test",
    answer: "Choose the Bell–Aeroplan integration or Subscription Manager. Start with the business problem and your specific ownership, then cover stakeholders, key requirements, risks, decision points, dependencies, validation, outcome, and what you learned. Expect follow-ups on each claim, so use only details you personally observed and can explain.",
    cue: "Problem → ownership → decisions → risks → validation → result → lesson",
  },
  {
    question: "How do you approach capacity planning?",
    audience: "Stage 4: delivery leadership",
    answer: "Start from available capacity, not a wish list: team availability, historical throughput, planned leave, operational load, dependencies, and the uncertainty in the work. Reserve capacity for defects and risk, expose the trade-off between scope, date, and quality, then re-plan as evidence changes. At Bell, coordinating six-plus workstreams required making dependencies and priority choices explicit; do not claim a formal capacity model you did not run.",
    cue: "Capacity → uncertainty → dependencies → trade-offs → re-plan",
  },
  {
    question: "How would you contribute to PI Planning?",
    audience: "Stage 4: SAFe / planning cadence",
    answer: "Be candid that formal SAFe PI Planning is not stated on your résumé. Explain how you would contribute: bring the product vision and measurable objectives, prepare prioritised features and dependencies, work with teams on feasibility and sequencing, identify risks, agree on commitments, and keep the plan visible through the increment. Connect this to your existing sprint planning, dependency mapping, and multi-team coordination experience.",
    cue: "Vision → objectives → features → dependencies → risks → commitments",
  },
  {
    question: "Which metrics do you track, and how do they change your decisions?",
    audience: "Stage 4: measurable leadership",
    answer: "Use a balanced set: customer or business outcome, delivery health, quality, and risk. Examples from your résumé include Subscription Manager adoption and call-centre deflection, SLA performance and post-launch integration regressions for Aeroplan, accessibility compliance at the CRA, and reconciliation cycle time at CIBC. Explain the baseline, threshold, owner, review cadence, and the decision the metric would trigger.",
    cue: "Outcome + delivery + quality + risk; each metric changes a decision",
  },
  {
    question: "How do you handle workplace frustration or conflict?",
    audience: "Stage 4: resilience and maturity",
    answer: "Prepare a real example before the interview. In the answer, separate the person from the problem, name the impact, listen for the underlying constraint, make options and trade-offs visible, agree on an action, and follow through. Do not invent conflict from an otherwise successful project or describe a colleague as difficult simply for disagreeing.",
    cue: "Impact → listen → options → agreement → follow-through",
  },
];

export const roundOneQuestions: InterviewQuestion[] = [
  ...coreQuestions,
  ...behaviouralQuestions.filter((item) => [
    "Why are you suitable for this role?",
    "Why are you leaving Bell?",
    "Tell me about a significant challenge and how you overcame it.",
    "Tell me about a project that did not go according to plan. What did you do?",
  ].includes(item.question)),
];

export const roundThreeQuestions: InterviewQuestion[] = [
  {
    question: "How would you plan the launch of a new Business Identity feature from start to finish?",
    audience: "Stage 3: product-leadership scenario",
    answer: "I would begin by clarifying the user segment, problem, desired outcome, constraints, and decision owner. Next I would define the success metric and guardrails such as fraud loss, false-positive rate, privacy, manual-review capacity, or regulatory requirements. I would then shape the MVP, align engineering, data, legal/compliance, operations, and commercial partners on requirements and dependencies, and make the rollout and support plan explicit. Finally, I would validate against acceptance criteria, monitor the launch against the baseline, and turn the learning into backlog decisions. The key is to show the trade-offs, not jump straight to a solution.",
    cue: "Problem → measures/guardrails → MVP → align → deliver → launch → learn",
  },
  {
    question: "How do you handle conflicting priorities across teams during a feature launch?",
    audience: "Stage 3: alignment and influence",
    answer: "First make the conflict concrete: which customer outcome, risk, dependency, or date is each group protecting? Then show the downstream effects and evaluate options against agreed criteria such as customer impact, regulatory exposure, fraud risk, effort, and cost of delay. I would document the decision, owner, and any follow-up risk. This is the same approach I used in Bell Catalog Management when marketing, product, and billing interpreted promotion rules differently: map the consequences, bring the decision-makers together, and secure written agreement before build.",
    cue: "Surface the real conflict → show impacts → decide and document",
  },
  ...behaviouralQuestions.filter((item) => [
    "Tell me about a setback and how you reacted.",
    "Tell me about a time you stepped in and took charge.",
    "Tell me about a time you influenced a difficult stakeholder.",
    "Tell me about a difficult conversation with your manager.",
    "What are Mastercard's values, and how do they align with you?",
  ].includes(item.question)),
];

export const starStories: StarStory[] = [
  {
    title: "Catalog Management - promotion-rule conflict and sign-off",
    useFor: "Stakeholder conflict, complex requirements, influence without authority, getting alignment before delivery",
    situation: "Bell's Catalog Management system is the master-data layer for products, promotions, and prices, so an error can reach customer-facing pricing and billing. Promotion-eligibility rules were undocumented and interpreted differently by marketing, product, and billing.",
    task: "Elicit, document, and obtain sign-off on the complete business rules before the development team built the admin workflows, especially promotion stackability and the materially different effects of expiring versus cancelling a promotion.",
    action: "I ran separate requirement sessions with marketing, product, and billing, then brought the groups together to reconcile the differences. Marketing treated expire and cancel as interchangeable, while billing depended on the exact action. I mapped the downstream impacts of each interpretation, made the billing dependency visible to every group, produced a formal rules document, and obtained written sign-off before build.",
    result: "The feature launched without requirement-driven defects. Billing said it was the first time a complete, agreed rules document had existed before a Catalog feature entered development, and the document became the template for later eligibility-logic work.",
    managerFrame: "Lead with the conflict and the decision mechanism. This demonstrates that requirements documentation is a tool for alignment and risk reduction—not an administrative deliverable.",
  },
  {
    title: "Contingency Management - API requirements and root-cause resolution",
    useFor: "Technical depth, API contracts, data mapping, operations discovery, root-cause thinking, auditability",
    situation: "Bell operations teams manually triaged failed subscription orders, or kickouts, across back-office systems. The process was slow, error-prone, and delayed customers, while the new Contingency Management platform lacked a formal definition of what the service needed to support.",
    task: "Specify the API contract and data mapping between agent views and backend services for order search, transaction management, and audit logging—while ensuring the product addressed why orders failed rather than simply exposing them.",
    action: "I shadowed operations agents to understand the actual exception workflow and found that many failures originated in invalid address data from the upstream CPM feed. I reframed the requirement from showing failed orders to enabling agents to correct address data and resubmit the transaction. I specified the edit-and-resubmit capability, an automatic-resubmit Lambda after correction, data mapping, endpoint specifications, API-boundary validation rules, audit logging, and endpoint-level acceptance criteria. I reviewed the work with operations and engineering before backend implementation.",
    result: "Agents could resolve the most common failure class without escalating to engineering, and automatic resubmission removed manual reprocessing for corrected records. Engineering built from the specifications without significant rework, while the audit trail made each transaction change traceable.",
    managerFrame: "Emphasise how direct observation changed the product boundary: self-service root-cause correction, not another diagnostic screen.",
  },
  {
    title: "Aeroplan loyalty integration - secure contract and vendor delivery",
    useFor: "Security judgment, APIs, vendor management, UAT, technical risk, cross-functional delivery",
    situation: "Bell's Aeroplan loyalty integration was a strategically important commercial partnership, but it began without a formal integration specification, documented security model, or API contract. A vendor SOW already existed, making ambiguity both a quality and commercial risk.",
    task: "Define the product scope before implementation: the security model, API contract, compile-time type checks, acceptance criteria, and vendor delivery against the SOW.",
    action: "I flagged the original proposal to pass customer data through URL query parameters as a privacy and fraud risk, and proposed a token exchange: the host platform sends the payload to a Token API, receives a one-time UUID, and the microfrontend retrieves it securely through a BFF. After aligning engineering and security, I defined the API contract, OpenAPI-driven TypeScript type generation as a quality gate, acceptance criteria for each flow, vendor SOW milestones, and UAT across the deployment pipeline.",
    result: "The production launch had zero post-launch integration regressions. OpenAPI-driven type generation found two contract mismatches in UAT, both resolved before production. The multi-program architecture also created a reusable path for future loyalty partners.",
    managerFrame: "Show the decision before the artifact: you stopped an unsafe data-flow pattern, aligned the right partners, and made quality measurable before launch.",
  },
  {
    title: "Flow Runner - centralising duplicated qualification logic",
    useFor: "Platform product strategy, service boundaries, technical architecture, migration risk, proving parity",
    situation: "On Bell's subscription platform, offer-qualification logic was duplicated across reseller-service, catalog-api, and merchant adapters. That caused inconsistent eligibility outcomes, required multiple deployments for rule changes, and left no clear end-to-end explanation of how a customer qualified for an offer.",
    task: "Define a central service that executes qualification rules consistently without owning the rules themselves, then prove that it produced the same outcomes as the scattered legacy logic before any cutover.",
    action: "I audited the existing patterns—account type, household eligibility, existing subscriptions, and promotion stacking—and spoke with product, catalog, billing, and partner engineering about rule-change needs and the cost of bad rules. I defined the boundary: Flow Runner executes rules while catalog-api and the policy store own them. With engineering, I modelled a declarative JSON flow that loads product and promotion rules, evaluates the request profile, and returns a qualification outcome with reasons. I specified the OpenAPI contract for /api/v2/flows/:flowId/execute, supported legacy and new rule formats, and validated a pilot against real catalog data to prove parity before cutover.",
    result: "The platform gained one execution point instead of scattered logic, rule changes no longer required redeploying every service, and existing integrations were not disrupted. The reusable recipe model later supported additional validation scenarios.",
    managerFrame: "Frame it as a product-boundary decision: centralise execution for consistency and agility, but leave rule ownership with the systems and people best positioned to manage it.",
  },
];

export const starMentalModels: StarMentalModel[] = [
  {
    storyKey: "catalog-management",
    storyTitle: "Catalog Management - promotion-rule conflict and sign-off",
    memoryCode: "Rules → Conflict → Impact map → Sign-off → Zero defects",
    useFor: "Stakeholder conflict · influence · complex requirements · alignment",
    nodes: [
      { id: "context", label: "Context", prompt: "What system and stakes?", detail: "Bell Catalog Management was the master-data layer for products, promotions, and prices. Incorrect rules could flow directly into customer pricing and billing." },
      { id: "tension", label: "Tension", prompt: "What was broken?", detail: "Promotion-eligibility rules were undocumented, and marketing, product, and billing interpreted them differently." },
      { id: "mandate", label: "My mandate", prompt: "What did I own?", detail: "Elicit the complete rules and obtain stakeholder sign-off before engineering built the admin workflows." },
      { id: "diagnosis", label: "Diagnosis", prompt: "What did I discover?", detail: "Separate sessions exposed the critical disagreement: marketing treated expire and cancel as interchangeable, while billing had a hard dependency on the distinction." },
      { id: "decision", label: "Key decision", prompt: "What choice did I make?", detail: "Use the downstream pricing and billing impact—not stakeholder seniority or volume—as the evidence for resolving the rule." },
      { id: "execution", label: "Execution", prompt: "How did I deliver?", detail: "I mapped both interpretations, brought all three groups together, documented the agreed stackability and lifecycle rules, and secured written sign-off." },
      { id: "evidence", label: "Evidence", prompt: "What proved it worked?", detail: "The feature launched with no requirement-driven defects, and the rules document became the template for later eligibility work." },
      { id: "lesson", label: "Lesson", prompt: "What is reusable?", detail: "A requirements artifact creates value when it makes consequences visible and becomes a decision and risk-control mechanism." },
    ],
    answer30: "Bell’s Catalog platform had undocumented promotion rules that marketing, product, and billing interpreted differently. I mapped the downstream impact—especially the billing dependency between expiring and cancelling a promotion—aligned the groups on the evidence, and obtained written sign-off before build. The feature launched with no requirement-driven defects, and the document became a reusable template.",
    answer90: "Bell’s Catalog Management system was the master-data layer for products, promotions, and prices, so a rule error could reach customer pricing and billing. I discovered that promotion eligibility was undocumented and understood differently by marketing, product, and billing. My responsibility was to define the complete rules and obtain agreement before engineering built the admin workflows. I met each group separately and found that the central conflict was expiring versus cancelling a promotion: marketing treated them as equivalent, while billing depended on the exact action. I mapped the downstream consequences of both interpretations and used that evidence in a joint decision session. I then documented stackability and lifecycle behaviour and obtained written sign-off. The feature launched without requirement-driven defects, and billing adopted the document as a template for later eligibility work. The lesson was that good requirements are not administrative output; they are a mechanism for alignment and risk reduction.",
    followUps: [
      { question: "Why did you meet stakeholders separately first?", route: "Diagnosis → psychological safety and complete constraints" },
      { question: "What alternative did you consider?", route: "Decision → defer to one owner versus reconcile downstream evidence" },
      { question: "What was specifically yours?", route: "Mandate → sessions, impact map, rules document, sign-off" },
      { question: "How did you measure success?", route: "Evidence → defects, rework, and reuse of the template" },
    ],
  },
  {
    storyKey: "contingency-management",
    storyTitle: "Contingency Management - API requirements and root-cause resolution",
    memoryCode: "Observe → Root cause → Correct → Resubmit → Audit",
    useFor: "Technical depth · operations discovery · APIs · root-cause thinking",
    nodes: [
      { id: "context", label: "Context", prompt: "What system and stakes?", detail: "Bell operations manually triaged failed subscription orders—kickouts—across several back-office systems, creating errors and customer delays." },
      { id: "tension", label: "Tension", prompt: "What was broken?", detail: "The proposed platform lacked a formal service definition, and simply displaying failures would preserve the manual recovery problem." },
      { id: "mandate", label: "My mandate", prompt: "What did I own?", detail: "Define the API contract and data mapping for search, transaction management, and audit logging while ensuring the product solved the real failure." },
      { id: "diagnosis", label: "Diagnosis", prompt: "What did I discover?", detail: "Shadowing agents showed that many kickouts came from invalid address data in the upstream CPM feed." },
      { id: "decision", label: "Key decision", prompt: "What choice did I make?", detail: "Reframe the product from a diagnostic screen into a resolution workflow where agents correct the root cause and safely resubmit." },
      { id: "execution", label: "Execution", prompt: "How did I deliver?", detail: "I specified address editing, API-boundary validation, resubmission, an automatic-resubmit Lambda, data mapping, endpoint acceptance criteria, and audit logging with ops and engineering." },
      { id: "evidence", label: "Evidence", prompt: "What proved it worked?", detail: "Agents resolved the common failure class without engineering escalation; corrected transactions no longer required manual reprocessing; engineering built without significant rework." },
      { id: "lesson", label: "Lesson", prompt: "What is reusable?", detail: "Observe the real workflow before freezing scope: operational users expose hidden states and root causes that process documents miss." },
    ],
    answer30: "Bell agents were manually triaging failed subscription orders across several systems. By shadowing them, I found that invalid upstream address data caused many failures, so I reframed the product from showing kickouts to correcting and resubmitting them. I defined the APIs, validation, automated resubmission, and audit trail. Agents could resolve the common failure without engineering escalation or manual reprocessing.",
    answer90: "Bell’s operations teams manually triaged failed subscription orders across multiple back-office systems, which was slow, error-prone, and delayed customers. The initial platform idea focused on showing those failures, but the service had no formal requirements. I owned the API contract and data mapping and wanted to ensure the tool addressed the actual failure. I shadowed operations agents and found that many kickouts originated in invalid address data from the upstream CPM feed. That changed the product boundary: instead of another diagnostic screen, agents needed to correct the address and resubmit safely. I specified the edit-and-resubmit workflow, API-boundary validation, an automatic-resubmit Lambda, endpoint contracts, acceptance criteria, and audit logging, and reviewed them with operations and engineering before build. Agents could resolve the common failure class without escalation, corrected records no longer needed manual reprocessing, and engineering built from the specification without significant rework. The lesson was to investigate the lived workflow before committing to the requested solution.",
    followUps: [
      { question: "Why was a screen not enough?", route: "Tension → visibility did not remove the root cause or reprocessing" },
      { question: "How did you find the address problem?", route: "Diagnosis → direct observation and failure-pattern analysis" },
      { question: "What made the API safe?", route: "Execution → validation, controlled resubmission, and audit trail" },
      { question: "What was the measurable value?", route: "Evidence → fewer escalations, less reprocessing, less rework" },
    ],
  },
  {
    storyKey: "aeroplan-integration",
    storyTitle: "Aeroplan loyalty integration - secure contract and vendor delivery",
    memoryCode: "Privacy risk → Token exchange → Contract gate → Zero regressions",
    useFor: "Security judgment · APIs · vendor management · UAT · technical risk",
    nodes: [
      { id: "context", label: "Context", prompt: "What system and stakes?", detail: "Bell’s Aeroplan integration was a strategically important partnership with a vendor SOW already in place." },
      { id: "tension", label: "Tension", prompt: "What was broken?", detail: "There was no formal integration specification, security model, or API contract, and the proposed URL parameters exposed customer information." },
      { id: "mandate", label: "My mandate", prompt: "What did I own?", detail: "Define the product and integration scope before implementation and control delivery against the SOW." },
      { id: "diagnosis", label: "Diagnosis", prompt: "What did I discover?", detail: "Passing customer payloads through URLs created privacy, leakage, and fraud risk while ambiguous contracts created commercial and quality risk." },
      { id: "decision", label: "Key decision", prompt: "What choice did I make?", detail: "Replace the URL data flow with a one-time token exchange and make the OpenAPI contract an executable compatibility gate." },
      { id: "execution", label: "Execution", prompt: "How did I deliver?", detail: "I aligned engineering and security, specified Token API → UUID → BFF retrieval, generated TypeScript types from OpenAPI, wrote flow acceptance criteria, tracked SOW milestones, and led UAT." },
      { id: "evidence", label: "Evidence", prompt: "What proved it worked?", detail: "Generated types caught two contract mismatches in UAT; both were fixed before production; the launch had zero post-launch integration regressions." },
      { id: "lesson", label: "Lesson", prompt: "What is reusable?", detail: "Turn security and compatibility expectations into architecture decisions and automated quality gates before code and contract ambiguity harden." },
    ],
    answer30: "Bell’s Aeroplan integration began without a security model or API contract, and the proposed design put customer data in URL parameters. I stopped that pattern, aligned teams on a one-time token exchange, and made OpenAPI-generated TypeScript types a compatibility gate. The types caught two mismatches during UAT, both were fixed before release, and production launched with zero integration regressions.",
    answer90: "Bell’s Aeroplan integration was a strategically important partnership, but a vendor SOW was already in place before the security model and API contract were defined. The original proposal passed customer data in URL query parameters, creating privacy and fraud risk. I owned defining the integration scope and raised the unsafe flow before implementation. I proposed a token exchange where the host sends the payload to a Token API, receives a one-time UUID, and the microfrontend retrieves the data securely through a BFF. After aligning engineering and security, I defined the OpenAPI contract, generated TypeScript types from it as a compile-time quality gate, wrote acceptance criteria for each integration flow, tracked vendor milestones, and led UAT. The generated types caught two contract mismatches before production, and the launch had zero post-launch integration regressions. The architecture also supported future loyalty partners. The lesson was to make security and compatibility executable parts of delivery rather than end-stage reviews.",
    followUps: [
      { question: "Why was the URL approach unsafe?", route: "Diagnosis → leakage, logs/history, privacy, and fraud exposure" },
      { question: "Why a token exchange?", route: "Decision → minimise exposed data and constrain retrieval" },
      { question: "How did you manage the vendor?", route: "Execution → contract, SOW milestones, acceptance criteria, UAT" },
      { question: "What did the quality gate prove?", route: "Evidence → two mismatches prevented and zero regressions" },
    ],
  },
  {
    storyKey: "flow-runner",
    storyTitle: "Flow Runner - centralising duplicated qualification logic",
    memoryCode: "Duplication → Boundary → Declarative flow → Parity → Reuse",
    useFor: "Platform strategy · service boundaries · architecture · migration risk",
    nodes: [
      { id: "context", label: "Context", prompt: "What system and stakes?", detail: "Bell’s subscription platform qualified offers across reseller-service, catalog-api, and merchant adapters." },
      { id: "tension", label: "Tension", prompt: "What was broken?", detail: "Duplicated logic produced inconsistent outcomes, required multiple deployments for rule changes, and obscured the end-to-end decision path." },
      { id: "mandate", label: "My mandate", prompt: "What did I own?", detail: "Define a central execution service and prove behavioural parity before any consumer cut over." },
      { id: "diagnosis", label: "Diagnosis", prompt: "What did I discover?", detail: "The services repeated common checks, but rule authorship and rule execution were different responsibilities and should not be centralised together." },
      { id: "decision", label: "Key decision", prompt: "What choice did I make?", detail: "Flow Runner would own execution only; catalog-api and the policy store would continue owning the rules." },
      { id: "execution", label: "Execution", prompt: "How did I deliver?", detail: "I audited patterns, aligned product/catalog/billing/partners, modelled reusable JSON recipes, specified the execute API, supported legacy and new formats, and ran a real-data parity pilot." },
      { id: "evidence", label: "Evidence", prompt: "What proved it worked?", detail: "The platform gained one execution point, rule changes avoided multi-service deployments, existing integrations stayed intact, and the recipe model supported later validation flows." },
      { id: "lesson", label: "Lesson", prompt: "What is reusable?", detail: "A strong platform boundary centralises the responsibility that needs consistency while leaving domain ownership with the right system and team." },
    ],
    answer30: "Bell had offer-qualification logic duplicated across several services, causing inconsistent outcomes and multiple deployments for each rule change. I defined Flow Runner as the central execution layer while leaving rule ownership in catalog and policy systems. We supported old and new formats and proved parity with real data before cutover. The result was consistent execution, safer migration, and a reusable engine for later validation flows.",
    answer90: "On Bell’s subscription platform, offer-qualification logic was duplicated across reseller-service, catalog-api, and merchant adapters. That created inconsistent decisions, forced several deployments for each rule change, and made the end-to-end qualification path difficult to explain. I owned defining a central execution service and proving it matched legacy behaviour before cutover. I audited the duplicated patterns and spoke with product, catalog, billing, and partner engineering. The key product-boundary decision was that Flow Runner would execute rules but would not own them; catalog-api and the policy store remained the sources of truth. With engineering, I modelled reusable declarative JSON flows, specified the execute endpoint, supported legacy and new formats, and ran a pilot against real catalog data to prove parity. The platform gained one consistent execution point without disrupting existing integrations, rule changes no longer required redeploying every service, and the recipe model later supported additional validation scenarios. The lesson was to centralise the responsibility that needs consistency without absorbing domain ownership unnecessarily.",
    followUps: [
      { question: "Why not move the rules too?", route: "Decision → execution consistency versus domain ownership" },
      { question: "How did you control migration risk?", route: "Execution → dual-format support and real-data parity" },
      { question: "What was your product contribution?", route: "Mandate → boundary, requirements, stakeholders, contract, validation" },
      { question: "How did the platform create leverage?", route: "Evidence → one engine, fewer deployments, reusable recipes" },
    ],
  },
];

export const storyRoutes: StoryRoute[] = [
  { questionType: "Cross-functional delivery, security, vendor management", primaryStory: "Bell–Aeroplan membership integration", proof: "Engineering, vendor, and security coordination; token-exchange approach; SOW/SLA tracking; zero post-launch integration regressions." },
  { questionType: "Taking ownership, root cause, operational improvement", primaryStory: "Contingency Management", proof: "Turned recurring engineering escalations into a self-serve diagnostic tool; prioritised data integrity and state validation." },
  { questionType: "Challenge, risk, quality, compliance", primaryStory: "CRA WCAG 2.1 AA work", proof: "Prioritised remediation by severity and user impact; embedded Axe-core into CI/CD; achieved WCAG AA with regression prevention." },
  { questionType: "Hard deadlines, payments risk, attention to detail", primaryStory: "Skye Bank chargeback lifecycle", proof: "Managed Visa/Mastercard dispute cases by deadline and recovery value; no missed dispute deadlines during tenure." },
  { questionType: "Controls, audit evidence, measurable process improvement", primaryStory: "CIBC Regulatory Reconciliation Tool", proof: "Reduced the monthly reconciliation cycle from two days to half a day and eliminated the targeted error class." },
  { questionType: "Failure, setback, difficult manager conversation", primaryStory: "Choose a real lived example before the interview", proof: "The submitted résumé does not provide a safe, detailed example for this question type.", guardrail: "Do not manufacture conflict or failure from a successful project." },
];

export const rehearsalChecklist = [
  "Say the four core answers aloud in 60–90 seconds each. They should sound conversational, not memorised.",
  "Choose and verify one real project-recovery or setback example, one difficult-stakeholder example, and one difficult-manager conversation.",
  "Practise the four technical follow-ups using a 90-second product-level answer and a deeper follow-up layer.",
  "Pick two Mastercard culture values and connect each to a specific behaviour from your experience.",
  "Review the story map and metrics you can defend. Do not introduce facts that were not in your submitted résumé or lived experience.",
  "Prepare two questions for the interviewer about the team's immediate Business Identity priorities, decision rights, and what success looks like in the first six months.",
];
