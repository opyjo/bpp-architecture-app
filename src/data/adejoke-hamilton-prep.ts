export type QuestionCategory =
  | "Positioning"
  | "Delivery"
  | "People"
  | "Vendors"
  | "Change"
  | "Technology";

export interface PracticeQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  tests: string;
  structure: string[];
  followUp: string;
  watchOut: string;
}

export const questionCategories: Array<"All" | QuestionCategory> = [
  "All",
  "Positioning",
  "Delivery",
  "People",
  "Vendors",
  "Change",
  "Technology",
];

export const practiceQuestions: PracticeQuestion[] = [
  {
    id: "intro",
    category: "Positioning",
    question: "Tell us about yourself and why this Senior Project Manager role interests you.",
    tests: "Executive presence, relevance, motivation and a concise career narrative.",
    structure: [
      "Present: the kind of transformation leader you are today.",
      "Proof: two capabilities that match this role, backed by brief examples.",
      "Purpose: why enterprise time and attendance and public service matter to you.",
      "Close: the value you would bring to Hamilton in this 24-month mandate.",
    ],
    followUp: "Which part of your background will help you create value fastest?",
    watchOut: "Do not walk through the resume year by year. Aim for 90 seconds.",
  },
  {
    id: "enterprise-implementation",
    category: "Delivery",
    question: "Walk us through a complex enterprise software implementation you led end to end.",
    tests: "Scale, ownership, lifecycle discipline and measurable outcomes.",
    structure: [
      "Set the scale: users, teams, locations, timeline, budget and business risk.",
      "Explain your mandate and the governance you established.",
      "Show the critical actions across discovery, design, build, test, cutover and stabilization.",
      "Quantify the result and name one lesson you would apply here.",
    ],
    followUp: "What was the hardest decision you personally made?",
    watchOut: "Use ‘I’ for your decisions and ‘we’ for team delivery. Make your ownership unmistakable.",
  },
  {
    id: "ukg-experience",
    category: "Technology",
    question: "What experience do you have with UKG Pro WFM, time and attendance, or comparable HRIS/HCM platforms?",
    tests: "Domain credibility, honesty and transferability of experience.",
    structure: [
      "State your direct experience accurately—platform, module, role and depth.",
      "Connect adjacent HCM/HRIS experience to time capture, pay rules, scheduling, exceptions and payroll interfaces.",
      "Show how you learn product specifics with SMEs, the integrator and structured discovery.",
      "Name the controls you would prioritize: pay accuracy, privacy, auditability and adoption.",
    ],
    followUp: "How would you close a UKG knowledge gap in your first month?",
    watchOut: "Never imply hands-on UKG experience you do not have. Strong adjacent experience plus a credible learning plan is defensible.",
  },
  {
    id: "governance",
    category: "Delivery",
    question: "How would you establish governance for an organization-wide UKG Pro WFM implementation?",
    tests: "Practical project controls, decision rights and executive transparency.",
    structure: [
      "Define sponsor, steering committee, workstream leads, design authority and escalation path.",
      "Set a decision cadence with RACI, RAID, integrated schedule and change control.",
      "Use stage gates for design, build, test, deployment and operational acceptance.",
      "Report outcomes, decisions and forecast—not activity alone.",
    ],
    followUp: "What would appear on your steering committee dashboard?",
    watchOut: "Avoid listing artifacts without explaining how they accelerate decisions and accountability.",
  },
  {
    id: "constraints",
    category: "Delivery",
    question: "Tell us about a time scope, schedule, cost and quality came into conflict. How did you respond?",
    tests: "Judgment, options analysis, commercial awareness and control under pressure.",
    structure: [
      "Describe the constraint and why it mattered to the organization.",
      "Show the evidence you gathered and the options you developed.",
      "Explain the trade-off recommendation, decision forum and impact on the baseline.",
      "Close with the result, forecast accuracy and prevention lesson.",
    ],
    followUp: "What did you refuse to compromise?",
    watchOut: "Do not claim all four constraints were preserved. Demonstrate a conscious, approved trade-off.",
  },
  {
    id: "cross-functional",
    category: "People",
    question: "How would you align HR, Payroll, IT, business leaders and affiliates when their priorities differ?",
    tests: "Stakeholder strategy, facilitation and enterprise thinking.",
    structure: [
      "Map decision-makers, process owners, impacted groups and sources of resistance.",
      "Create shared outcomes—pay accuracy, employee experience, control and operational continuity.",
      "Use documented design principles and decision criteria to resolve competing preferences.",
      "Escalate only after surfacing options, impacts and a recommendation.",
    ],
    followUp: "How do you prevent the loudest stakeholder from dominating?",
    watchOut: "Consensus is not always possible. Show how you create a fair process and a clear decision.",
  },
  {
    id: "vendor",
    category: "Vendors",
    question: "Describe how you manage an implementation partner or system integrator against a Statement of Work.",
    tests: "Commercial control, partnership and vendor accountability.",
    structure: [
      "Translate the SOW into accepted deliverables, milestones, assumptions and client dependencies.",
      "Run joint planning, quality reviews, dependency tracking and evidence-based acceptance.",
      "Address slippage early with recovery plans, owners and dates.",
      "Use contractual remedies only within a professional, outcome-focused relationship.",
    ],
    followUp: "Tell us about a vendor deliverable you rejected.",
    watchOut: "Avoid either extreme: passive vendor management or an adversarial ‘policing’ posture.",
  },
  {
    id: "requirements",
    category: "Technology",
    question: "How would you lead requirements and solution design for time and attendance across diverse employee groups?",
    tests: "Business analysis discipline, complexity management and traceability.",
    structure: [
      "Start with current-state processes, policies, collective agreements, pain points and controls.",
      "Separate true requirements from historical preferences and unnecessary customization.",
      "Use fit-to-standard workshops, personas and end-to-end scenarios.",
      "Maintain traceability from requirement to configuration, test and business acceptance.",
    ],
    followUp: "How would you resolve requests for heavy customization?",
    watchOut: "Do not frame this as only a technology exercise—pay rules and operational practice are central.",
  },
  {
    id: "risk-escalation",
    category: "Delivery",
    question: "Give an example of a major project risk or issue you escalated. What made the escalation effective?",
    tests: "Courage, timing, executive communication and ownership of resolution.",
    structure: [
      "Define the trigger, probability/impact or actual consequence.",
      "Explain what the team attempted before escalation.",
      "Present the options, recommendation, decision needed and deadline.",
      "Show how you tracked the decision through resolution and updated the plan.",
    ],
    followUp: "What if the sponsor delayed the decision?",
    watchOut: "Escalation is not forwarding a problem upward. Bring a recommendation and stay accountable.",
  },
  {
    id: "change-adoption",
    category: "Change",
    question: "What is your approach to organizational change and adoption for a workforce-management rollout?",
    tests: "Change leadership beyond communications and training.",
    structure: [
      "Assess impacted roles, behavioural changes, readiness and local change capacity.",
      "Build a sponsor network, change champions and two-way communications.",
      "Coordinate role-based learning, manager enablement and in-flow support.",
      "Measure readiness, proficiency, adoption, exceptions and support demand after launch.",
    ],
    followUp: "What would you do if a business unit resisted the new process?",
    watchOut: "Training completion is not adoption. Name operational measures that prove the change is working.",
  },
  {
    id: "testing-cutover",
    category: "Technology",
    question: "How would you govern SIT, UAT, cutover and readiness for a time and attendance go-live?",
    tests: "Quality assurance, payroll-risk awareness and transition discipline.",
    structure: [
      "Use risk-based scenarios covering interfaces, security, pay rules, exceptions and volume.",
      "Define entry/exit criteria, defect severity, ownership and daily triage.",
      "Include payroll parallel validation and reconciliation where appropriate.",
      "Make go/no-go evidence-based with rollback, hypercare and operational acceptance plans.",
    ],
    followUp: "Who should have authority to recommend no-go?",
    watchOut: "Do not treat UAT as a final demonstration. Business owners must execute and accept meaningful scenarios.",
  },
  {
    id: "public-sector",
    category: "Positioning",
    question: "What changes when you manage a technology transformation in a public-sector environment?",
    tests: "Public accountability, procurement awareness and stakeholder sensitivity.",
    structure: [
      "Recognize stewardship of public funds, transparency and formal procurement/contract obligations.",
      "Account for accessibility, privacy, records, policy and complex stakeholder groups.",
      "Balance urgency with durable governance and explainable decisions.",
      "Connect the project outcome to reliable public service and employee trust.",
    ],
    followUp: "How would you keep governance from becoming bureaucracy?",
    watchOut: "Avoid suggesting the public sector is simply slower. Show respect for its accountability context.",
  },
  {
    id: "conflict",
    category: "People",
    question: "Tell us about a conflict between business and technical stakeholders that you helped resolve.",
    tests: "Listening, facilitation, negotiation and repair of working relationships.",
    structure: [
      "Describe the interests beneath the stated positions.",
      "Explain how you created psychological safety and a shared fact base.",
      "Show the options, trade-offs and decision method.",
      "Close with both the delivery outcome and the health of the relationship.",
    ],
    followUp: "What would the other party say about your approach?",
    watchOut: "Do not cast one party as unreasonable. Demonstrate empathy and neutrality without avoiding a decision.",
  },
  {
    id: "pressure",
    category: "Delivery",
    question: "How do you manage multiple complex priorities and keep a large team focused under time pressure?",
    tests: "Operating rhythm, delegation, prioritization and calm leadership.",
    structure: [
      "Anchor priorities to critical path, risk, value and fixed external commitments.",
      "Clarify owners, capacity, dependencies and decisions needed.",
      "Use short feedback loops and visible forecasts—not more meetings by default.",
      "Protect sustainable delivery and intervene early when demand exceeds capacity.",
    ],
    followUp: "What do you stop doing when everything appears urgent?",
    watchOut: "Personal organization tools are not enough; explain how you shape the team system.",
  },
  {
    id: "executive-status",
    category: "People",
    question: "How do you communicate project status and difficult news to senior leaders?",
    tests: "Synthesis, transparency and decision-oriented communication.",
    structure: [
      "Lead with the headline and whether outcomes remain achievable.",
      "Show trend, forecast, top risks/issues and changes since the last update.",
      "Translate detail into business, operational and financial impact.",
      "End with decisions, recommendations, owners and dates.",
    ],
    followUp: "How do you handle a leader who wants the status shown as green?",
    watchOut: "Never surprise leaders late, but do not dilute a red status to make the room comfortable.",
  },
  {
    id: "resources",
    category: "People",
    question: "How do you plan and forecast resources across project workstreams?",
    tests: "Capacity planning, partnership with functional managers and delivery realism.",
    structure: [
      "Build a role- and skill-based demand plan tied to the integrated schedule.",
      "Validate availability and competing commitments with resource managers.",
      "Track actuals, forecast-to-complete, bottlenecks and single points of failure.",
      "Offer sequenced options when the plan is not resource-feasible.",
    ],
    followUp: "How would you address a critical SME who is only 20% available?",
    watchOut: "Named resources are not the same as committed capacity. Show how you validate and reforecast.",
  },
  {
    id: "integrations",
    category: "Technology",
    question: "What should a project manager understand about SaaS integration architecture for UKG Pro WFM?",
    tests: "Enough technical fluency to govern dependencies and risk.",
    structure: [
      "Map systems of record, data owners, interface patterns and critical data flows.",
      "Clarify identity, security, privacy, environments, monitoring and support ownership.",
      "Track API/middleware dependencies, data quality, error handling and reconciliation.",
      "Translate technical choices into delivery, operational and vendor risks.",
    ],
    followUp: "What integration would you consider most business-critical?",
    watchOut: "You do not need to design middleware live. Demonstrate the questions and controls that create delivery confidence.",
  },
  {
    id: "ninety-days",
    category: "Positioning",
    question: "What would your first 90 days look like?",
    tests: "Structured entry, listening and bias toward delivery.",
    structure: [
      "Days 1–30: align mandate, relationships, current state, contract, risks and decision rights.",
      "Days 31–60: validate scope, integrated plan, resourcing, governance and solution approach.",
      "Days 61–90: stabilize workstreams, baseline measures, close priority gaps and demonstrate predictable execution.",
      "Frame this as a hypothesis you would refine with the manager and sponsor.",
    ],
    followUp: "What tangible artifact or decision would you want by day 30?",
    watchOut: "Do not promise a transformation before listening. Balance discovery with early control and momentum.",
  },
  {
    id: "inclusion",
    category: "Change",
    question: "How would you make this implementation inclusive and accessible for a diverse workforce?",
    tests: "Alignment with City values, accessibility and employee-centred design.",
    structure: [
      "Include representative employee groups, work contexts and accessibility needs in discovery.",
      "Test journeys with real users across devices, locations, schedules and levels of digital comfort.",
      "Provide accessible, role-appropriate communications, learning and support channels.",
      "Track experience and adoption by segment to expose barriers early.",
    ],
    followUp: "How would you respond if the standard product created an accessibility barrier?",
    watchOut: "Avoid treating inclusion as a communications paragraph; connect it to design, testing and decisions.",
  },
  {
    id: "lesson",
    category: "Positioning",
    question: "Tell us about a project outcome that did not go as planned and what you learned.",
    tests: "Accountability, self-awareness and evidence of changed behaviour.",
    structure: [
      "Choose a meaningful setback without exposing confidential information.",
      "Own your decision or missed signal directly.",
      "Explain the recovery and stakeholder communication.",
      "Show the specific mechanism you use differently now and its later result.",
    ],
    followUp: "When did you first realize your original approach was wrong?",
    watchOut: "Do not disguise a strength as a failure or blame the team/vendor.",
  },
];

export const competencyPillars = [
  {
    title: "Enterprise delivery",
    signal: "Own the full lifecycle",
    detail: "Scope, integrated plan, budget, RAID, governance, decisions, cutover and stabilization.",
  },
  {
    title: "HR technology",
    signal: "Protect pay and trust",
    detail: "UKG Pro WFM, HCM/HRIS, time rules, payroll interfaces, privacy and auditability.",
  },
  {
    title: "Stakeholder leadership",
    signal: "Create shared decisions",
    detail: "HR, Payroll, IT, leaders, affiliates, SMEs and a diverse 3,000+ user community.",
  },
  {
    title: "Vendor control",
    signal: "Partner with accountability",
    detail: "SOW, acceptance, dependencies, recovery plans, contracts and implementation quality.",
  },
  {
    title: "Change & adoption",
    signal: "Make the change usable",
    detail: "Sponsor network, communications, learning, readiness, adoption and operational support.",
  },
  {
    title: "Quality & integration",
    signal: "Make go-live evidence-based",
    detail: "SIT, UAT, reconciliation, SaaS integrations, readiness, rollback and hypercare.",
  },
];

export const panelQuestions = [
  "What outcomes would define success 12 months into this implementation?",
  "Where is the program today, and which decision or risk needs the most immediate attention?",
  "How are responsibilities divided between the City team, UKG and the implementation partner?",
  "Which employee groups or operational areas will create the greatest design complexity?",
  "How will the City balance fit-to-standard with policy, collective agreement and affiliate needs?",
  "What leadership behaviours distinguish someone who succeeds in this team and culture?",
];

export const invitationChecklist = [
  "Reply within 24 hours with every availability window that works.",
  "Complete and return the reference consent form.",
  "Confirm the final calendar invitation, panel names and video link.",
  "Test camera, microphone, connection and a backup join method.",
];

export const cityValues = [
  "Sensational service",
  "Courageous change",
  "Steadfast integrity",
  "Collective ownership",
  "Engaged, empowered employees",
];

export interface StarStory {
  id: string;
  title: string;
  useFor: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  learning: string;
}

export const defaultStories: StarStory[] = [
  {
    id: "implementation",
    title: "Enterprise implementation",
    useFor: "Lifecycle ownership · scale · governance",
    situation: "",
    task: "",
    action: "",
    result: "",
    learning: "",
  },
  {
    id: "recovery",
    title: "Project recovery",
    useFor: "Schedule pressure · risk · executive decisions",
    situation: "",
    task: "",
    action: "",
    result: "",
    learning: "",
  },
  {
    id: "vendor",
    title: "Vendor accountability",
    useFor: "SOW · quality · negotiation",
    situation: "",
    task: "",
    action: "",
    result: "",
    learning: "",
  },
  {
    id: "conflict",
    title: "Stakeholder conflict",
    useFor: "Facilitation · decision-making · partnership repair",
    situation: "",
    task: "",
    action: "",
    result: "",
    learning: "",
  },
  {
    id: "adoption",
    title: "Change and adoption",
    useFor: "Resistance · communications · learning · outcomes",
    situation: "",
    task: "",
    action: "",
    result: "",
    learning: "",
  },
  {
    id: "quality",
    title: "Testing and go-live",
    useFor: "SIT/UAT · readiness · stabilization",
    situation: "",
    task: "",
    action: "",
    result: "",
    learning: "",
  },
];
