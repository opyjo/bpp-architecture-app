export type PrepColor = "blue" | "purple" | "teal" | "amber" | "green" | "coral" | "gray";

export interface PrepCard {
  title: string;
  body: string;
  cue?: string;
  color?: PrepColor;
}

export interface InterviewQuestion {
  question: string;
  audience: string;
  answer: string;
  cue: string;
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

export const interviewStages: InterviewStage[] = [
  { stage: "Recruiter screen", format: "Recruiter conversation", focus: "Background, motivation, compensation, and role fit", status: "Complete" },
  { stage: "Stage 1", format: "Hiring manager chat", focus: "Résumé, past projects, motivations, and behavioural judgment", status: "Complete" },
  { stage: "Stage 2", format: "Techno-managerial deep dive", focus: "Agile methods, Jira, product delivery, and technical fluency", status: "Upcoming" },
  { stage: "Stage 3", format: "Bar raiser: leadership", focus: "Feature-launch scenario, prioritisation, and cross-functional alignment", status: "Upcoming" },
  { stage: "Stage 4", format: "Bar raiser: program leadership", focus: "Resume depth, capacity, PI planning, metrics, and resilience", status: "Upcoming" },
];

export const focusCards: PrepCard[] = [
  { title: "Current interview position", body: "The recruiter screen and Stage 1 hiring-manager chat are complete. The remaining virtual stages are the techno-managerial deep dive, leadership bar raiser, and program-leadership bar raiser. Expect the same résumé stories to be tested at greater depth each time.", cue: "Next: Stage 2 technical craft → Stage 3 leadership → Stage 4 depth", color: "blue" },
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
    body: "Mastercard grounds ethical operations in decency, integrity, and respect, supported by trust, partnership, agility, and initiative. Demonstrate them through behaviour: make risks transparent, share credit, listen to constraints, move with evidence, and protect customers even when it creates delivery friction.",
    cue: "Show values through choices, not a memorised list", color: "purple",
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

export const mastercardQuestionsToAsk: PrepCard[] = [
  { title: "Product direction", body: "Which Business Identity customer problem is most important for this team to solve in the next 6–12 months, and how will you measure whether it is solved?", cue: "Shows outcome orientation", color: "blue" },
  { title: "Decision trade-offs", body: "Which trade-offs are most active today—for example, onboarding speed, data coverage, fraud loss, manual-review capacity, or regulatory requirements?", cue: "Shows mature product judgment", color: "teal" },
  { title: "Operating model", body: "How do product, engineering, data science, legal/compliance, and commercial partners make decisions when a requirement crosses those functions?", cue: "Shows cross-functional readiness", color: "purple" },
  { title: "Success in role", body: "What would distinguish an excellent first six months in this role from an adequate one?", cue: "Shows ownership and standards", color: "green" },
];

export const mastercardReferences: ReferenceLink[] = [
  { label: "About Mastercard", href: "https://www.mastercard.com/global/en/for-the-world/about-us.html", note: "Purpose, global reach, payments, and value-added services." },
  { label: "Mastercard Identity", href: "https://www.mastercard.com/global/en/business/cybersecurity-fraud-prevention/identity.html", note: "Identity, fraud, customer experience, and trust." },
  { label: "Mastercard hiring process", href: "https://careers.mastercard.com/us/en/mastercards-hiring-process", note: "Official interview expectations and stages." },
  { label: "Interview tips", href: "https://careers.mastercard.com/us/en/interview-tips", note: "Official guidance for preparation and interview conduct." },
  { label: "Culture and values", href: "https://www.mastercard.com/global/en/for-the-world/about-us/mastercard-human-rights-statement.html", note: "Decency, integrity, respect, trust, partnership, agility, and initiative." },
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
    title: "Techno-managerial deep dive",
    objective: "Show product-manager technical fluency: how you turn ambiguity into a delivery plan and work credibly with engineering.",
    interviewerFocus: "Agile versus Waterfall; Scrum and Kanban; Jira; requirements, backlog prioritisation, dependencies, quality, risk, and technical trade-offs.",
    evidence: "Bell backlog and acceptance-criteria ownership; API and state-transition scope; multi-environment delivery; CRA CI/CD accessibility control.",
    preparation: "Practise concise answers first, then a deeper example. Explain systems at product altitude: workflow, rules, interfaces, failure paths, acceptance criteria, and measures—not implementation trivia.",
    color: "teal",
  },
  {
    round: "Stage 3",
    title: "Bar raiser: leadership scenario",
    objective: "Demonstrate owner-level product judgment in an unfamiliar feature-launch scenario.",
    interviewerFocus: "Planning a feature from discovery through launch; reconciling conflicting priorities; aligning engineering, business, risk, and operational stakeholders.",
    evidence: "Subscription Manager, Contingency Management, and Aeroplan show problem framing, risk reduction, cross-functional alignment, and delivery ownership.",
    preparation: "Use the feature-launch framework. State assumptions, identify users and success measures, prioritise an MVP, surface risks and dependencies, define the delivery loop, then describe launch and learning.",
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

export const coreQuestions: InterviewQuestion[] = [
  {
    question: "Tell me about yourself.",
    audience: "All interview rounds",
    answer: "I am a Senior Technical Product Manager at Bell, where I own products from problem definition through backlog, acceptance criteria, delivery, and post-launch measurement. Before that, at the CRA, I worked on security and accessibility standards for public-facing platforms. Earlier, at Skye Bank, I managed the Visa and Mastercard chargeback lifecycle and supported a co-branded card launch. That combination of technical product delivery, compliance discipline, and direct payments operations is why this Business Identity role is a strong fit.",
    cue: "Bell product ownership → CRA compliance → Visa/Mastercard operations → role fit",
  },
  {
    question: "Why do you want to work for Mastercard?",
    audience: "All interview rounds",
    answer: "Mastercard brings together two parts of my background that have usually been separate: technical product ownership and payments-risk operations. I started in Visa and Mastercard chargeback and card-issuance work, where accuracy, deadlines, and auditability mattered every day. Since then, I have built products at Bell and the CRA by turning complex requirements into secure, measurable delivery. Business Identity is compelling because it applies that same discipline to trust, onboarding, fraud prevention, and compliance at a global scale.",
    cue: "Payments foundation + technical product craft + digital trust",
  },
  {
    question: "Tell me about a time you worked as part of a cross-functional team.",
    audience: "Hiring manager or panel",
    answer: "For Bell's Aeroplan membership-management integration, I coordinated Bell engineering, an external loyalty vendor, and security stakeholders. I owned the product scope for account linking, made the secure token-exchange approach explicit, tracked vendor SOW and SLA delivery, and used generated type contracts as a quality gate. The result was a production launch with zero post-launch integration regressions. The key was making the risks and handoffs visible early, so each group could make the right decision in its area.",
    cue: "Aeroplan: engineering + vendor + security → clear contracts → zero regressions",
  },
  {
    question: "Why should we hire you?",
    audience: "All interview rounds",
    answer: "I offer three directly relevant strengths. First, I have seven-plus years of technical product ownership, including backlog management, acceptance criteria, platform delivery, and measurable launch outcomes. Second, I bring direct Visa and Mastercard chargeback and card-launch experience, so the payments-risk context is familiar rather than abstract. Third, my CPA and ACCA background, together with controls and compliance work at CIBC and the CRA, helps me build products that are not only useful but also auditable and risk-aware.",
    cue: "Technical PM execution + payments context + compliance rigor",
  },
];

export const behaviouralQuestions: InterviewQuestion[] = [
  {
    question: "Why are you suitable for this role?",
    audience: "Motivation and fit",
    answer: "Connect the job's requirements to three examples: Bell for roadmap-to-delivery and cross-functional execution; Aeroplan for secure API and vendor integration; and Skye Bank, CIBC, and the CRA for payments, controls, and compliance. Be candid that Business Identity is a new product domain for you, while the core execution and risk disciplines are established strengths.",
    cue: "Execution + integration + risk/compliance; do not claim direct KYB ownership",
  },
  {
    question: "Why are you leaving Bell?",
    audience: "Motivation and professionalism",
    answer: "Bell has been a strong place to deepen my technical product-management experience, and I am proud of what I have built there. This move is a pull toward a specific opportunity: Mastercard lets me apply the product craft I have developed at Bell to the payments and trust domain where I began my career. It is about the fit and impact of this role, not dissatisfaction with my current employer.",
    cue: "Move toward Mastercard; never move away from Bell",
  },
  {
    question: "Tell me about a significant challenge and how you overcame it.",
    audience: "Resilience and execution",
    answer: "Use the CRA accessibility example. The challenge was treating WCAG gaps as a recurring product and user-impact issue, rather than a one-time compliance exercise. You defined the audit scope, prioritised remediation by severity and user impact, wrote acceptance criteria, and embedded Axe-core into CI/CD. The outcome was WCAG AA compliance with regression prevention built into the delivery process.",
    cue: "CRA: recurring risk → prioritised remediation → CI gate",
  },
  {
    question: "Tell me about a project that did not go according to plan. What did you do?",
    audience: "Judgment and recovery",
    answer: "Prepare a real example before using this answer. State what changed, the impact, the signal you missed or constraint that emerged, how you reset scope or the delivery plan, and the operating change you made afterward. Do not reuse a successful project unless there was a genuine, defensible recovery moment within it.",
    cue: "Real miss → ownership → recovery → changed behaviour",
  },
  {
    question: "What are Mastercard's values, and how do they align with you?",
    audience: "Culture and values",
    answer: "Mastercard describes a culture of decency, integrity, and respect, supported by trust, partnership, agility, and initiative. Choose two values and make them concrete. For trust, discuss the documentation and deadline discipline behind Visa/Mastercard chargebacks or the security controls in the Aeroplan integration. For partnership, describe how you made engineering, vendor, and security handoffs explicit. Avoid reciting values without a lived example.",
    cue: "Choose two values; prove each with behaviour",
  },
  {
    question: "What is your biggest weakness?",
    audience: "Self-awareness",
    answer: "A precise answer is that you have not yet partnered with a formally titled data-science team. Your relevant foundation is working through rules, state transitions, quality signals, and AI-governance boundaries at Bell. Explain that you would close the gap by learning the team's model, decision thresholds, error trade-offs, and monitoring metrics before translating them into requirements. Keep it narrow, factual, and paired with an action.",
    cue: "Name the gap plainly, then show the learning plan",
  },
  {
    question: "Tell me about a setback and how you reacted.",
    audience: "Resilience and self-awareness",
    answer: "Prepare a different genuine example from the project-off-track answer if possible. Describe the setback without minimising it, your immediate response, the support or information you sought, the corrected action, and the lesson that changed how you work. Never invent a setback from a successful launch.",
    cue: "Setback → response → correction → learning",
  },
  {
    question: "Tell me about a time you stepped in and took charge.",
    audience: "Initiative and ownership",
    answer: "Use Contingency Management at Bell. Operations depended on engineering whenever a subscription order failed. You framed that as a structural product problem, defined a self-serve diagnostic platform, owned the front-end and API scope, prioritised data-integrity edge cases, and set state-transition validation as the quality standard. Operations could then investigate and resolve failures without developer involvement.",
    cue: "Contingency: recurring escalation → self-serve product → operational independence",
  },
  {
    question: "Where do you see yourself in five years?",
    audience: "Career direction",
    answer: "I want to be a product leader trusted with increasingly complex platform and trust problems: setting product direction, helping cross-functional teams make sound decisions, and developing other product talent. Mastercard is attractive because Business Identity sits at the intersection of technology, risk, and global commerce. I am focused on growing through impact and scope, not on chasing a title on a fixed timetable.",
    cue: "Growth through trusted scope and impact",
  },
  {
    question: "Tell me about a time you influenced a difficult stakeholder.",
    audience: "Influence without authority",
    answer: "Use a real example in which a stakeholder initially disagreed or had competing constraints. Aeroplan may work only if you can truthfully describe the disagreement. Explain their concern fairly, make the trade-offs visible, use evidence or a risk framing to align on the decision, document the agreement, and state the result. Do not label someone difficult merely because they asked questions.",
    cue: "Fairly describe the concern → surface trade-offs → agree and document",
  },
  {
    question: "What three things set you apart from other candidates?",
    audience: "Differentiation",
    answer: "First, technical product delivery: I can turn ambiguous business problems into backlogs, acceptance criteria, platform requirements, and measured launches. Second, direct payments operations: I have owned Visa/Mastercard chargebacks and supported a co-branded card launch. Third, risk and controls rigor: CPA/ACCA designations plus CIBC and CRA experience help me create products that are usable, secure, and auditable.",
    cue: "Build + payments + controls",
  },
  {
    question: "Tell me about a difficult conversation with your manager.",
    audience: "Maturity and communication",
    answer: "Prepare a real, low-drama example. State the shared objective, describe the difference in view without judging your manager, show the facts or options you brought, explain how you listened and reached a decision, and name what improved afterward. The signal is respectful candour and accountability—not winning an argument.",
    cue: "Shared goal → differing view → evidence → respectful resolution",
  },
  {
    question: "What do you know about Mastercard?",
    audience: "Company knowledge",
    answer: "Mastercard is a global technology company in payments whose purpose is to connect and power an inclusive digital economy. Its network, partnerships, data, and technology aim to make transactions safe, simple, smart, and accessible. For this role, that purpose becomes practical through Business Identity: creating trusted, verifiable business interactions that can improve onboarding, reduce fraud, and support compliance.",
    cue: "Inclusive digital economy → Business Identity → trust, speed, fraud, compliance",
  },
];

export const technicalFollowUps: InterviewQuestion[] = [
  {
    question: "When would you use Agile rather than Waterfall?",
    audience: "Stage 2: delivery methods",
    answer: "Choose the delivery approach based on uncertainty, feedback needs, dependency structure, and risk. Agile fits when the team can learn through incremental delivery and customer feedback; a more sequential plan can fit stable, heavily constrained work with clear handoffs. In either case, make scope, decision rights, dependencies, quality gates, and measures visible. Avoid presenting Agile as the automatic answer to every problem.",
    cue: "Choose the method to fit uncertainty and risk—not a label",
  },
  {
    question: "How do Scrum and Kanban differ, and when would you use each?",
    audience: "Stage 2: Agile fluency",
    answer: "Scrum uses time-boxed sprints, a planned sprint goal, and regular ceremonies to create a predictable delivery rhythm. Kanban manages a continuous flow of work, limits work in progress, and focuses on cycle time and bottlenecks. I would use Scrum when a team benefits from planning and review cadence; I would use Kanban for continuous operational or support demand. A hybrid can work if the rules are explicit.",
    cue: "Scrum = sprint cadence; Kanban = flow and WIP",
  },
  {
    question: "How do you use Jira to run delivery rather than just track tickets?",
    audience: "Stage 2: tools and operating rhythm",
    answer: "Use Jira to make the product decision trail visible: a prioritised backlog, clear epics and stories, acceptance criteria, owners, dependencies, risks, and release status. At Bell and the CRA, Jira supported sprint planning, delivery coordination, and release readiness. The tool is useful only when it helps the team make and communicate decisions; it should not become administrative theatre.",
    cue: "Backlog + decision trail + dependencies + release visibility",
  },
  {
    question: "What does “3-3-5” mean in Agile?",
    audience: "Stage 2: team-specific terminology",
    answer: "There is no universal Agile standard called “3-3-5.” I would first clarify what the interviewer’s team means by it rather than confidently inventing an answer. Then I would relate my response to the underlying delivery mechanics: planning cadence, roles, work-item quality, flow or sprint metrics, risk management, and continuous improvement.",
    cue: "Clarify the local definition; do not guess",
  },
  {
    question: "How do you turn a vague business need into engineering-ready requirements?",
    audience: "Stage 1 technical follow-up",
    answer: "Start with the user and business problem, then make the workflow, rules, states, data, success measures, and risks explicit. At Bell, you applied this discipline to the Subscription Manager and Contingency Management products through backlog ownership, acceptance criteria, API scope, and state-transition validation. Validate the proposal with engineering and QA before build, then confirm the result after launch.",
    cue: "Problem → workflow/rules → acceptance criteria → validate → measure",
  },
  {
    question: "How do you prioritise a backlog when there are competing needs?",
    audience: "Stage 1 technical follow-up",
    answer: "Make the decision criteria visible: customer impact, risk, regulatory obligation, dependency, effort, and the consequence of delay. The chargeback queue is a clear example of using deadline proximity and recovery value under non-negotiable response windows. At Bell, use the same logic across marketing, operations, engineering, and compliance rather than allowing the loudest request to determine priority.",
    cue: "Impact + risk + dependency + cost of delay",
  },
  {
    question: "How do you build compliance and quality into a product?",
    audience: "Stage 1 technical follow-up",
    answer: "Translate the requirement into observable, testable behaviour rather than leaving it as a review-stage aspiration. At the CRA, you embedded Axe-core in CI/CD so accessibility regression was prevented continuously. At CIBC, you delivered a reconciliation tool that cross-checked data and cut the monthly cycle from two days to half a day. In this role, I would apply the same approach to requirements, evidence, controls, and release validation.",
    cue: "Make compliance testable and continuous",
  },
  {
    question: "How would you work with data science on a fraud or risk model?",
    audience: "Stage 1 technical follow-up",
    answer: "I would first learn the model's purpose, input signals, decision thresholds, false-positive and false-negative trade-offs, monitoring, and human-review path. Then I would convert the agreed decision logic into clear product requirements, workflows, controls, and measures. I would be direct that my experience is adjacent rather than formal data-science partnership, while showing that I already work comfortably with rules, quality gates, and risk-based decisions.",
    cue: "Learn model → agree trade-offs → turn logic into testable requirements",
  },
];

export const featureLaunchFramework: PrepCard[] = [
  { title: "1. Clarify the problem", body: "State the target user, the customer or business problem, desired outcome, constraints, and decision owner. Identify what is known, what is assumed, and the first information you need.", cue: "User → problem → outcome → constraints", color: "blue" },
  { title: "2. Define success and guardrails", body: "Choose a primary outcome metric and a small set of guardrails such as quality, fraud/risk, accessibility, cost, or operational load. Set the baseline before deciding whether the feature worked.", cue: "Outcome metric + risk guardrails", color: "teal" },
  { title: "3. Shape the MVP", body: "Prioritise the smallest valuable release. Separate must-haves from later improvements using customer impact, risk, dependency, effort, and cost of delay—not the loudest stakeholder request.", cue: "MVP first; show the prioritisation logic", color: "amber" },
  { title: "4. Align the delivery system", body: "Bring engineering, design, data, operations, security, legal/compliance, and commercial partners in early as applicable. Make workflows, acceptance criteria, interfaces, dependencies, and decision rights explicit.", cue: "Early alignment prevents late surprises", color: "purple" },
  { title: "5. Deliver, launch, learn", body: "Run the delivery cadence, manage risks and scope changes, validate against acceptance criteria, prepare rollout and support, then compare launch metrics with the baseline. Turn the learning into backlog decisions.", cue: "Build → validate → launch → measure → iterate", color: "green" },
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
