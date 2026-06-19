// ─── Microfrontends BSA Analysis Data ─────────────────────────────────────────
// Business Systems Analyst review of all 10 microfrontends in node-mono-real

export interface MfeBsaScreen {
  name: string;
  route: string;
  purpose: string;
}

export interface MfeBsaIntegration {
  name: string;
  type: "GraphQL" | "REST" | "OAuth" | "SAML" | "CMS" | "Analytics" | "Feature Flags" | "Module Federation";
  description: string;
}

export interface MfeBsaOperation {
  operation: string;
  description: string;
  timing?: string;
}

export interface MfeBsaEntity {
  name: string;
  description: string;
  keyFields: string[];
}

export interface MicrofrontendAnalysis {
  id: string;
  name: string;
  displayName: string;
  version: string;
  status: "production" | "active-development" | "internal-tool";
  accentColor: string;
  summary: string;
  businessDomain: string;
  businessValue: string[];
  techStack: { category: string; name: string; color: string }[];
  screens: MfeBsaScreen[];
  integrations: MfeBsaIntegration[];
  operations: MfeBsaOperation[];
  entities: MfeBsaEntity[];
  businessRules: string[];
}

export interface MfeGroup {
  id: string;
  label: string;
  description: string;
  mfeIds: string[];
}

// ─── Group Definitions ────────────────────────────────────────────────────────

export const mfeGroups: MfeGroup[] = [
  {
    id: "customer-facing",
    label: "Customer-Facing Subscription Management",
    description: "Self-service and agent-assisted UIs that customers and support agents interact with directly to manage subscriptions and loyalty memberships.",
    mfeIds: ["subscription-manager", "membership-management"],
  },
  {
    id: "catalog-admin",
    label: "Catalog & Contract Administration",
    description: "Back-office tools for product managers and administrators to configure product catalogs, pricing, promotions, and contract terms.",
    mfeIds: ["catalog-management", "contract-manager"],
  },
  {
    id: "business-rules",
    label: "Business Rules & Configuration",
    description: "Operational tools that allow business analysts and administrators to define rules, configure workflows, and manage partner/reseller channels.",
    mfeIds: ["policy-rules", "flow-configurator", "reseller-management"],
  },
  {
    id: "promotions",
    label: "Promotions & Offers",
    description: "Tools for validating and looking up promotional codes and their associated offers across brands.",
    mfeIds: ["promocode-lookup"],
  },
  {
    id: "contingency-ops",
    label: "Contingency & Operations",
    description: "Fallback/contingency tools for managing subscribers, orders, and transactions when primary systems are unavailable or for specialized support scenarios.",
    mfeIds: ["sm-contingency-container", "contingency-management"],
  },
];

// ─── Microfrontend Analyses ───────────────────────────────────────────────────

export const microfrontends: MicrofrontendAnalysis[] = [
  // ── 1. Subscription Manager ─────────────────────────────────────────────────
  {
    id: "subscription-manager",
    name: "subscription-manager",
    displayName: "Subscription Manager",
    version: "0.1.0",
    status: "production",
    accentColor: "blue",
    summary:
      "The primary subscription lifecycle management UI — a Next.js 14 BFF widget deployed via Module Federation. Supports dual-mode access: customer self-service (MyBell portal) and agent-assisted workflows. Orchestrates multi-stage order workflows for TV, Internet, and Mobile subscriptions with real-time eligibility, promotional offers, and bilingual support (EN/FR).",
    businessDomain: "Customer Subscription Lifecycle Management (B2C Telecom)",
    businessValue: [
      "Self-service empowerment — customers manage subscriptions 24/7 without agent escalation",
      "Reduced call-centre load — UNDO operations enable customer recovery without agent involvement",
      "Upsell / cross-sell — marketing tiles, promotional offers, bundle recommendations",
      "Churn mitigation — retention offers on cancellation, removal upgrade options",
      "Agent productivity — streamlined agent interface for complex order reviews",
      "Compliance & audit — session-based order tracking with confirmation numbers",
      "Localization — French-language support for Canadian market compliance",
    ],
    techStack: [
      { category: "Framework", name: "Next.js 14 (React 18)", color: "blue" },
      { category: "Data Fetching", name: "TanStack Query v5", color: "purple" },
      { category: "Styling", name: "Tailwind CSS", color: "teal" },
      { category: "Auth", name: "NextAuth.js + OAuth2", color: "amber" },
      { category: "Analytics", name: "Adobe Analytics (Omniture)", color: "coral" },
      { category: "i18n", name: "CMS translations + local fallback", color: "green" },
      { category: "Deploy", name: "Module Federation MFE", color: "blue" },
    ],
    screens: [
      { name: "Customer Dashboard", route: "/customer/", purpose: "View active subscriptions, add/change/cancel options" },
      { name: "Add Subscription", route: "/customer/add-subscription/", purpose: "Browse & purchase new services — category browsing, promo display" },
      { name: "Add Review", route: "/customer/add-subscription/review/", purpose: "Order summary with pricing, promotions, legal disclaimers" },
      { name: "Add Confirm", route: "/customer/add-subscription/confirm/", purpose: "Final submission and confirmation number generation" },
      { name: "Change Subscription", route: "/customer/change-subscription/[id]/", purpose: "Upgrade/downgrade to different plans or tiers" },
      { name: "Cancel Subscription", route: "/customer/cancel-subscription/", purpose: "Initiate cancellation with expiry date selection" },
      { name: "Remove Upgrade", route: "/customer/remove-upgrade/", purpose: "Undo a pending upgrade" },
      { name: "Reverse Cancellation", route: "/customer/reverse-cancellation/", purpose: "Reactivate a cancelled subscription" },
      { name: "Reverse Downgrade", route: "/customer/reverse-downgrade/", purpose: "Restore to previous tier after downgrade" },
      { name: "Reverse Bundle Change", route: "/customer/reverse-bundle-change/", purpose: "Revert trio/duo bundle modifications" },
      { name: "Agent Add/View", route: "/agent/", purpose: "View customer orders in progress (agent context)" },
      { name: "Agent Review", route: "/agent/review/", purpose: "Review selections with agent-specific permissions" },
      { name: "Agent Confirm", route: "/agent/review/confirm/", purpose: "Finalize order with confirmation details" },
    ],
    integrations: [
      { name: "Subscription Manager API", type: "GraphQL", description: "AWS AppSync — GenerateSession, SubscriptionQualification, SubmitSubscription, ActivateSubscription, AccountRecovery, CloneSession" },
      { name: "Subscriptions Aggregator API", type: "REST", description: "GET /accountNumber/{id}/subscriptions/status — fetch current subscription status" },
      { name: "NextAuth + OAuth2", type: "OAuth", description: "Session management, token generation from centralized auth server" },
      { name: "CMS Translation API", type: "CMS", description: "Dynamic translations with local JSON fallback — toggle via enable_cms_translations flag" },
      { name: "Adobe Analytics", type: "Analytics", description: "Page views, event tracking — s_oPGN, s_oAPT, s_oLOB, s_oSID, s_oClientID" },
      { name: "OpenFeature", type: "Feature Flags", description: "enableVas, enableUndoActions, enablePromotionalTile, enablePromotionalBanner, enableAgentSelectablePromos" },
    ],
    operations: [
      { operation: "ADD", description: "New subscription activation", timing: "Same day" },
      { operation: "UPGRADE", description: "Tier upgrade (basic to premium)", timing: "Same day" },
      { operation: "CHANGE_ADD", description: "Plan change with service additions", timing: "Same day" },
      { operation: "CANCEL", description: "Full subscription cancellation", timing: "Expiry day" },
      { operation: "DOWNGRADE", description: "Tier downgrade (premium to basic)", timing: "Expiry day" },
      { operation: "CHANGE_REMOVE", description: "Plan change with service removals", timing: "Expiry day" },
      { operation: "VAS_CHANGE", description: "Value-Added Service modification", timing: "Same day" },
      { operation: "UNDO", description: "Reverse any pending action", timing: "Same day" },
    ],
    entities: [
      { name: "Qualification", description: "Master data — available services, subscribers, categories", keyFields: ["sessionId", "customers", "categories", "qualificationItems"] },
      { name: "QualificationItem", description: "Individual service (plan, bundle, add-on)", keyFields: ["productOffering", "prices", "promotions", "bundledItems", "state"] },
      { name: "Session", description: "Order container linked to account", keyFields: ["sessionId", "accountNumber", "clonedSessionId", "orderNumber"] },
      { name: "SubscriptionsContext", description: "React context for session, locale, auth data", keyFields: ["householdAccountNumber", "locale", "widgetHost", "sessionIds"] },
    ],
    businessRules: [
      "Account eligibility — customers must provide valid householdAccountNumber",
      "Subscriber eligibility — TV services tied to specific TV account numbers",
      "Service conflict detection — cannot add if already subscribed",
      "Bundle incompatibility — certain services cannot be combined",
      "Same-day changes — upgrades, additions, undo (immediate effect)",
      "Anniversary changes — cancellations, downgrades (effective at renewal date)",
      "Undo window — only undo pending operations, not historical changes",
      "Agent session cloning — isolated copy for agent changes with audit trail",
      "Agent account verification — must verify customer account number against user token",
    ],
  },

  // ── 2. Membership Management ────────────────────────────────────────────────
  {
    id: "membership-management",
    name: "membership-management",
    displayName: "Membership Management",
    version: "0.1.0",
    status: "production",
    accentColor: "purple",
    summary:
      "Customer-facing widget for linking, managing, and unlinking loyalty/rewards memberships (e.g. Aeroplan) to customer accounts. Operates as a token-based embeddable widget deployed into host platforms like MyBell, OrderMax, and OneView.",
    businessDomain: "Loyalty & Rewards Program Management (CRM)",
    businessValue: [
      "Customer loyalty engagement — link/manage rewards programs from within MyBell",
      "Multi-channel support — embeddable in MyBell, OrderMax, OneView",
      "Secure data exchange — token-based initialization, no sensitive params in URL",
      "Membership number masking — sensitive data masked at API gateway layer",
      "Self-service reduction — fewer agent calls for membership linking/unlinking",
    ],
    techStack: [
      { category: "Framework", name: "Next.js 14 (React 18)", color: "blue" },
      { category: "Data Fetching", name: "TanStack React Query 5", color: "purple" },
      { category: "Styling", name: "Tailwind CSS", color: "teal" },
      { category: "Auth", name: "NextAuth + OAuth2", color: "amber" },
      { category: "Animation", name: "Framer Motion", color: "coral" },
      { category: "Analytics", name: "Adobe Omniture", color: "green" },
    ],
    screens: [
      { name: "Marketing Tile", route: "/", purpose: "Promotional banner highlighting benefits of membership linking" },
      { name: "Memberships List", route: "/", purpose: "Two-section display — My Memberships (linked) and Available Memberships (unlinked)" },
      { name: "Link Membership Popup", route: "/", purpose: "Form to enter 9-digit membership identifier with validation" },
      { name: "Edit Membership Popup", route: "/", purpose: "View masked membership number, change to new identifier" },
      { name: "Unlink Confirmation", route: "/", purpose: "Warning popup before removing membership link" },
      { name: "How to Earn Points", route: "/", purpose: "Program-specific info popup" },
    ],
    integrations: [
      { name: "Membership API", type: "REST", description: "GET /programs, POST /partnerLink, PATCH /partnerLink/{id}, PATCH /partnerLink/{id}/unlink" },
      { name: "Token API", type: "REST", description: "Secure payload retrieval — channel name, order number, owner identifier" },
      { name: "OAuth2 Access Token", type: "OAuth", description: "Server-side token cached in-memory per instance" },
      { name: "Adobe Omniture", type: "Analytics", description: "Platform-aware event tracking for link/unlink/edit actions" },
    ],
    operations: [
      { operation: "Link Membership", description: "Associate loyalty program with customer account (POST /partnerLink)" },
      { operation: "Change Member ID", description: "Update membership identifier after verification (PATCH /partnerLink/{id})" },
      { operation: "Unlink Membership", description: "Remove loyalty program association (PATCH /partnerLink/{id}/unlink)" },
      { operation: "View Programs", description: "Fetch available and linked programs for customer (GET /programs)" },
    ],
    entities: [
      { name: "Program", description: "Loyalty program definition", keyFields: ["id", "name", "description", "imgSrc", "linkHref"] },
      { name: "PartnerLink", description: "Active link between customer and program", keyFields: ["id", "membershipIdentifier (masked)", "ownerIdentifier", "createdAt", "updatedAt"] },
      { name: "Owner", description: "Customer account reference", keyFields: ["identifierType (AccountNumber|OrderNumber|CustomerId)", "identifierValue"] },
    ],
    businessRules: [
      "9-digit numeric membership format validation",
      "Duplicate membership link detection",
      "Membership number masking at API gateway (e.g. ****34)",
      "Path traversal prevention — strict whitelist of allowed API paths",
      "Token-based initialization — no sensitive data in URL parameters",
      "Channel-aware context — different behaviour per host platform (MyBell, OrderMax, OneView)",
    ],
  },

  // ── 3. Catalog Management ──────────────────────────────────────────────────
  {
    id: "catalog-management",
    name: "catalog-management",
    displayName: "Catalog Management",
    version: "0.1.0",
    status: "production",
    accentColor: "teal",
    summary:
      "Comprehensive back-office system for managing all catalog-related business operations. Provides a centralized interface for subscription product offerings, pricing, promotions, categories, specifications, stackability rules, offer key mappings, and NM1 translations. Features 11+ major modules with full CRUD lifecycle management.",
    businessDomain: "Catalog & Product Management (Back-Office)",
    businessValue: [
      "Centralized catalog administration — single interface for all product data",
      "Full product lifecycle — create, edit, clone, expire, cancel with audit trails",
      "Multi-language content — localized names and descriptions (EN-CA, FR-CA)",
      "Time-based validity — future-dated activations and scheduled expiry",
      "Bulk operations — clone and bulk expire/cancel for efficiency",
      "Reporting — Excel export of catalog data for stakeholder review",
      "Standards compliance — EDI/NM1 translation support",
    ],
    techStack: [
      { category: "Framework", name: "Next.js 14 (React 18)", color: "blue" },
      { category: "Data Fetching", name: "TanStack React Query", color: "purple" },
      { category: "Validation", name: "Zod", color: "teal" },
      { category: "Auth", name: "OAuth token-based", color: "amber" },
      { category: "Feature Flags", name: "OpenFeature", color: "green" },
      { category: "Export", name: "XLSX generation", color: "coral" },
    ],
    screens: [
      { name: "Product Offerings", route: "/", purpose: "List, search, create, edit, clone, expire/cancel subscription product offerings" },
      { name: "Prices", route: "/prices", purpose: "Manage recurring and one-time pricing — regular, promotional types" },
      { name: "Promotions", route: "/promotions", purpose: "Manage promotion specifications with pattern-based rules" },
      { name: "Promotion Groups", route: "/promotion-groups", purpose: "Define and manage promotion groupings" },
      { name: "Product Specifications", route: "/product-specifications", purpose: "Define product attributes and technical specifications" },
      { name: "Stackability Rules", route: "/stackability-rules", purpose: "Define which products can be combined/bundled together" },
      { name: "Categories", route: "/categories", purpose: "Organize products into hierarchical categories" },
      { name: "Offer Keys", route: "/offer-key", purpose: "Map business offer identifiers to system IDs" },
      { name: "Enhanced Info", route: "/enhanced-info", purpose: "Manage supplementary product information" },
      { name: "NM1 Translation", route: "/nm1-translation", purpose: "Handle EDI NM1 standard translation mappings" },
      { name: "Group Criteria", route: "/group-criteria", purpose: "Define criteria for product grouping" },
      { name: "Reports", route: "/reports", purpose: "Export catalog data in Excel format (feature-flagged)" },
    ],
    integrations: [
      { name: "Catalog GraphQL API", type: "GraphQL", description: "SubscriptionProductOfferings, SubscriptionProductOfferingPrice, PromotionSpecifications, SubscriptionCategories, OfferKeyMapping" },
      { name: "Export Service", type: "REST", description: "XLSX file generation and download via /api/export" },
      { name: "OAuth Token Service", type: "OAuth", description: "Role-based access control with user tracking" },
      { name: "OpenFeature", type: "Feature Flags", description: "msp-reports flag controls report generation access" },
    ],
    operations: [
      { operation: "Create", description: "New records with initial status (Active or Future Dated)" },
      { operation: "Read / Search", description: "View details, search/list with filters (status, date range, name)" },
      { operation: "Update", description: "Edit existing records with audit trail" },
      { operation: "Clone", description: "Duplicate records for efficient bulk creation" },
      { operation: "Expire", description: "Set end date to mark record inactive" },
      { operation: "Cancel", description: "Immediately disable record" },
      { operation: "Export", description: "Generate XLSX reports of catalog data" },
    ],
    entities: [
      { name: "ProductOffering", description: "Commercial subscription service definition", keyFields: ["id", "primaryKey", "names[]", "status", "validFor", "prices", "specifications"] },
      { name: "Price", description: "Pricing for a product offering", keyFields: ["id", "type (Regular/Promotional)", "recurringChargePeriod", "validFor", "status"] },
      { name: "Promotion", description: "Promotion specification with rules", keyFields: ["id", "name", "pattern", "status", "validFor"] },
      { name: "Category", description: "Hierarchical product category", keyFields: ["id", "names[]", "parentId", "status", "validFor"] },
      { name: "StackabilityRule", description: "Product combination eligibility rule", keyFields: ["id", "name", "productRefs[]", "status", "validFor"] },
    ],
    businessRules: [
      "All entities follow Active / Future Dated / Expired / Cancelled status lifecycle",
      "Validity period — startDateTime and endDateTime (ISO 8601) govern active window",
      "Multilingual — all names stored as locale-string pairs (en-ca, fr-ca)",
      "Audit trail — lastUpdated timestamp and lastUpdatedBy user tracked on every change",
      "Role-based access — userRoles parameter governs available actions",
      "Confirmation modals required for all destructive actions (expire, cancel)",
      "Default pagination — 1000 items per page for search results",
    ],
  },

  // ── 4. Contract Manager ─────────────────────────────────────────────────────
  {
    id: "contract-manager",
    name: "contract-manager",
    displayName: "Contract Manager",
    version: "0.1.0",
    status: "production",
    accentColor: "amber",
    summary:
      "Complete lifecycle management system for wireline service contracts. Manages contracts with business terms (duration, pricing, ETF), disconnect reasons, exclusion rules, and product/offer associations. Supports multi-province operations with bilingual descriptions and full audit trail.",
    businessDomain: "Wireline Services Contract Management (Telecom)",
    businessValue: [
      "Centralized contract configuration — single tool for all wireline contracts",
      "ETF management — configurable early termination fees, caps, calculation methods",
      "Multi-channel sales support — capability and OBA (Offer-Based Access) restrictions",
      "Geographic targeting — province-based market filtering",
      "Compliance audit — comprehensive change tracking with user attribution",
      "Disconnect reason governance — standardized codes from MDM/NM1 with ETF action rules",
    ],
    techStack: [
      { category: "Framework", name: "Next.js 14 (React 18)", color: "blue" },
      { category: "Data Fetching", name: "TanStack React Query", color: "purple" },
      { category: "Styling", name: "Tailwind CSS", color: "teal" },
      { category: "i18n", name: "next-i18next + next-translate", color: "green" },
      { category: "Deploy", name: "Module Federation", color: "amber" },
    ],
    screens: [
      { name: "Contract Summary", route: "/contract-summary", purpose: "View all wireline contracts — paginated table with search/filter" },
      { name: "Create Contract", route: "/create-contract", purpose: "Multi-step form — marketing names, duration, provinces, LOBs, ETF config, product offers" },
      { name: "Edit Contract", route: "/edit-contract/[id]", purpose: "Full modification interface with version tracking" },
      { name: "Contract Details", route: "/contract-details/[id]", purpose: "Read-only detailed view with all attributes" },
      { name: "Contract History", route: "/contract-history-details/[id]", purpose: "Activity log — all modifications with before/after values" },
      { name: "Exclusions List", route: "/contract-exclusion", purpose: "Manage exclusion rules with CSV export" },
      { name: "Create/Edit Exclusion", route: "/contract-exclusion/create-exclusion", purpose: "Link MDM products, configure ETF on migration" },
      { name: "Disconnect Reasons", route: "/disconnect-reason", purpose: "View and manage disconnect reason codes" },
      { name: "Create Disconnect Reason", route: "/disconnect-reason/create", purpose: "Dual source (MDM/NM1), ordering system selection, ETF action config" },
      { name: "Provinces", route: "/provinces", purpose: "Manage geographic/provincial scope" },
    ],
    integrations: [
      { name: "Contracts GraphQL", type: "GraphQL", description: "GET_CONTRACTS, GET_CONTRACT_DETAILS with audit fields" },
      { name: "Catalog API", type: "REST", description: "Product offerings search, market segment filtering, future/expired offer support" },
      { name: "Contracts API", type: "REST", description: "POST /contract-types (create), PUT /contract-types/{id} (update)" },
      { name: "MDM Integration", type: "REST", description: "Reason code search API with partial matching and auto-populated descriptions" },
    ],
    operations: [
      { operation: "Create Contract", description: "Full contract creation with marketing names, ETF, provinces, product offers" },
      { operation: "Modify Contract", description: "Update with change tracking and user attribution" },
      { operation: "Search Contracts", description: "Filter by ID, marketing name, duration, dates, ETF settings, customer types" },
      { operation: "Manage Exclusions", description: "Define products/services excluded from contract with MDM product mapping" },
      { operation: "Configure Disconnect Reasons", description: "Setup codes from MDM/NM1, map to ordering systems (CSM/OrderMAX/SIMPLe)" },
      { operation: "ETF Configuration", description: "Set ETF caps, calculation methods, apply/waive actions on disconnect" },
    ],
    entities: [
      { name: "Contract", description: "Wireline service contract definition", keyFields: ["id", "code", "marketingName", "descriptions[8]", "duration", "goLiveDate", "expiryDate", "provinces", "LOBs", "etfConfig"] },
      { name: "ContractExclusion", description: "Products/services excluded from contract", keyFields: ["id", "code", "etfOnMigration", "mdmProductIds[]"] },
      { name: "ContractCapability", description: "Sales channel capability", keyFields: ["id", "name", "obaTypes[]"] },
      { name: "DisconnectReason", description: "Standardized disconnect code", keyFields: ["id", "code", "descriptionEN", "descriptionFR", "source (MDM/NM1)", "orderingSystem", "etfAction"] },
    ],
    businessRules: [
      "8 description variants per contract — en/fr for short/long/email/invoice",
      "ETF calculation methods — configurable cap, value, and calculation algorithm",
      "ETF on migration — special handling for customer migrations between contracts",
      "Deduplication — prevents duplicate disconnect reason codes",
      "Market segmentation — province-based market filtering for contract applicability",
      "Channel restrictions — OBA restrictions per sales channel",
      "Mandatory bilingual descriptions — enforce EN/FR for Canadian compliance",
      "Date validation — go-live must precede expiry",
    ],
  },

  // ── 5. Policy Rules ─────────────────────────────────────────────────────────
  {
    id: "policy-rules",
    name: "policy-rules",
    displayName: "Policy Rules",
    version: "0.1.0",
    status: "production",
    accentColor: "green",
    summary:
      "Enterprise-grade business rules management system with AI-powered search. Enables administrators to create, manage, and lifecycle-manage policy rules that drive business decisions across telecom offerings (DTH, IPTV, Video, Internet, Home Phone, Wireless). Features criteria groups with AND/OR logic, temporal validity, and natural language search via Langflow AI.",
    businessDomain: "Business Policy & Rules Engine (Telecom Operations)",
    businessValue: [
      "Policy agility — create and deploy business rules without code changes",
      "Temporal control — schedule rules to activate/deactivate at specific dates",
      "AI-powered discovery — natural language search reduces time to find relevant rules",
      "Reusability — define contexts and parameters once, use across multiple rules",
      "Governance — audit trail of all changes with user attribution",
      "Multi-LOB support — rules span DTH, IPTV, Video, Internet, Home Phone, Wireless",
    ],
    techStack: [
      { category: "Framework", name: "Next.js 14 (React 18)", color: "blue" },
      { category: "Data Fetching", name: "TanStack React Query 5", color: "purple" },
      { category: "AI Search", name: "Langflow NLP API", color: "coral" },
      { category: "Feature Flags", name: "OpenFeature + go-feature-flag", color: "green" },
      { category: "i18n", name: "next-i18next + next-translate", color: "amber" },
      { category: "Styling", name: "Tailwind CSS", color: "teal" },
    ],
    screens: [
      { name: "Policy Rules List", route: "/rules", purpose: "View all rules with filtering, AI search, and lifecycle actions" },
      { name: "Create Rule", route: "/rules/create", purpose: "Author new rules with criteria groups, outcomes, validity windows" },
      { name: "Edit Rule", route: "/rules/edit/[id]", purpose: "Modify rule criteria, validity dates, outcomes" },
      { name: "Rule Details", route: "/rules/details/[id]", purpose: "Read-only detailed view of rule configuration" },
      { name: "Rules Context", route: "/context", purpose: "Manage contextual parameters used in rule evaluation" },
      { name: "Create/Edit Context", route: "/context/create", purpose: "Define new rule evaluation contexts" },
      { name: "Rule Parameters", route: "/ruleParameter", purpose: "Manage allowed values for rule criteria parameters" },
      { name: "Create/Edit Parameter", route: "/ruleParameter/create", purpose: "Define parameter constraints and allowed values" },
    ],
    integrations: [
      { name: "Policy Rule Configurator API", type: "REST", description: "CRUD for rules, contexts, parameters — GET/POST/PUT /rules, /criteria-context, /criteria-parameters-list" },
      { name: "Product Catalog API", type: "GraphQL", description: "searchSubscriptionProductOfferings, searchPromotionSpecifications, lobCategory, searchSubscriptionCategories" },
      { name: "Langflow AI", type: "REST", description: "Natural language query to structured filter conversion via /api/ai-search" },
      { name: "OpenFeature", type: "Feature Flags", description: "LOB-specific criteria visibility, UI enhancements gating" },
    ],
    operations: [
      { operation: "Create Rule", description: "Define new rule with bilingual names, criteria groups, validity window" },
      { operation: "Edit Rule", description: "Modify criteria, outcomes, and validity periods" },
      { operation: "Expire Rule", description: "Set valid_to = current date (immediate deactivation)" },
      { operation: "Cancel Rule", description: "Cancel future-dated rules (set valid_to = valid_from)" },
      { operation: "Clone Rule", description: "Duplicate existing rules with modification capability" },
      { operation: "AI Search", description: "Natural language search — e.g. 'active rules updated in last 30 days'" },
      { operation: "Manage Contexts", description: "Define contextual parameters for rule evaluation" },
      { operation: "Manage Parameters", description: "Define allowed values and constraints for rule criteria" },
    ],
    entities: [
      { name: "PolicyRule", description: "Business rule definition with temporal validity", keyFields: ["id", "name_en", "name_fr", "code", "outcome", "criteriaGroups[]", "valid_from", "valid_to"] },
      { name: "CriteriaGroup", description: "Group of conditions with AND/OR logic", keyFields: ["name_en", "name_fr", "logicalRelationship", "criteria[]"] },
      { name: "Criteria", description: "Individual condition in a rule", keyFields: ["parameter", "operator", "value", "externalSourceRef"] },
      { name: "RuleContext", description: "Contextual parameter for evaluation", keyFields: ["id", "name", "description", "valid_from", "valid_to"] },
      { name: "RuleParameter", description: "Allowed values for criteria", keyFields: ["id", "name", "allowedValues[]", "valid_from", "valid_to"] },
    ],
    businessRules: [
      "Status determination — Cancelled (valid_from = valid_to), Future Dated (valid_from > NOW), Expired (valid_to < NOW), Active (valid_from <= NOW <= valid_to)",
      "Criteria group logic — AND/OR relationships between groups, multi-level evaluation",
      "External criteria values — linked to Product Offerings and Promotion Specifications",
      "Timezone handling — all dates converted to EST/EDT for display",
      "Sentinel date 9999-12-31 represents 'no expiry'",
      "Role-based UI — Expire/Cancel/Edit buttons conditional on userRoles",
      "Bilingual names — name_en and name_fr mandatory for all rules",
    ],
  },

  // ── 6. Flow Configurator ────────────────────────────────────────────────────
  {
    id: "flow-configurator",
    name: "flow-configurator",
    displayName: "Flow Configurator",
    version: "0.1.0",
    status: "active-development",
    accentColor: "coral",
    summary:
      "Visual no-code workflow builder using React Flow. Enables business users to design multi-step data processing pipelines by connecting configurable nodes (Input, Conditional, API, Output) in a drag-and-drop canvas. Supports conditional branching, external API integration, and workflow persistence.",
    businessDomain: "Process Orchestration & Workflow Automation",
    businessValue: [
      "No-code workflow design — business analysts can build processes without engineering",
      "Visual process documentation — workflows are self-documenting diagrams",
      "Conditional routing — implement business rules-based if/then/else logic visually",
      "API orchestration — chain API calls (Promocodes, Catalog, Contracts) with logic",
      "Rapid prototyping — quickly model customer journeys and support workflows",
    ],
    techStack: [
      { category: "Framework", name: "Next.js 14 (React 18)", color: "blue" },
      { category: "Visual Engine", name: "@xyflow/react v12 (React Flow)", color: "purple" },
      { category: "Forms", name: "React Hook Form", color: "teal" },
      { category: "UI Components", name: "Radix UI + Tailwind CSS", color: "amber" },
      { category: "Persistence", name: "localStorage", color: "coral" },
    ],
    screens: [
      { name: "Workflow Canvas", route: "/", purpose: "Main visual builder — drag-and-drop node placement, connections, pan/zoom" },
      { name: "Node Catalog (Sidebar)", route: "/", purpose: "Left panel showing draggable Input, Conditional, API, Output node types" },
      { name: "Input Panel", route: "/", purpose: "Configure input fields — name, label, type (text/date/number/password/email), required flag" },
      { name: "Conditional Panel", route: "/", purpose: "Build AND/OR conditions — field, operator (equals/contains/greater than), value" },
      { name: "API Panel", route: "/", purpose: "Configure API calls — endpoint selection, HTTP method, headers, body, params" },
      { name: "Output Panel", route: "/", purpose: "Define result destination — JSON template, content type, label" },
    ],
    integrations: [
      { name: "Promocodes API", type: "REST", description: "Pre-configured endpoint: https://api.promocodes.com/v1" },
      { name: "Catalog API", type: "REST", description: "Pre-configured endpoint: https://api.catalog.com/v2" },
      { name: "Contracts API", type: "REST", description: "Pre-configured endpoint: https://api.contracts.com/v3" },
    ],
    operations: [
      { operation: "Design Workflow", description: "Drag nodes from catalog, connect with edges, configure each node" },
      { operation: "Configure Input Schema", description: "Define field names, types, labels, required constraints" },
      { operation: "Build Conditional Logic", description: "Create if/then/else branches with AND/OR condition groups" },
      { operation: "Configure API Calls", description: "Set endpoint, method (GET/POST/PUT/DELETE), headers, body" },
      { operation: "Save Workflow", description: "Persist full workflow (nodes + edges) to localStorage" },
      { operation: "Load Workflow", description: "Restore previously saved workflow configuration" },
    ],
    entities: [
      { name: "InputNode", description: "Data entry point for workflows", keyFields: ["fields[].name", "fields[].type", "fields[].label", "fields[].required"] },
      { name: "ConditionalNode", description: "Business logic branching node", keyFields: ["conditions[].field", "conditions[].operator", "conditions[].value", "logicalOperator (AND/OR)"] },
      { name: "ApiNode", description: "External system integration node", keyFields: ["apiName", "url", "method", "headers{}", "body", "params{}"] },
      { name: "OutputNode", description: "Result/destination definition", keyFields: ["label", "description", "template (JSON)", "contentType"] },
    ],
    businessRules: [
      "Nodes connect via directional edges — data flows from output handles to input handles",
      "Conditional nodes have dual output — True and False branches",
      "API nodes support GET, POST, PUT, DELETE methods",
      "Input field types — text, date, number, readonly, password, email",
      "Conditional operators — equals, not equals, contains, does not contain, greater than, less than",
      "Workflow persistence — browser localStorage only (not cross-device)",
      "Run button is placeholder — workflow execution not yet implemented",
    ],
  },

  // ── 7. Reseller Management ──────────────────────────────────────────────────
  {
    id: "reseller-management",
    name: "reseller-management",
    displayName: "Reseller Management",
    version: "0.1.0",
    status: "production",
    accentColor: "purple",
    summary:
      "Partner/reseller channel management system for managing reseller authorizations, product entitlements, and availability status. Supports the full reseller lifecycle from creation through expiration/cancellation with multi-language names and product-level authorization control.",
    businessDomain: "Partner Management & Channel Entitlements",
    businessValue: [
      "Reseller onboarding — streamlined authorization creation with product entitlements",
      "Product entitlement control — granular per-reseller, per-product authorization",
      "Availability management — Enabled, StopSold, Suspended status per product",
      "Future-dated authorizations — schedule activations and expirations",
      "Multi-language — reseller names in EN-CA and FR-CA",
      "Export capability — CSV export for reporting and auditing",
    ],
    techStack: [
      { category: "Framework", name: "Next.js 14 (React 18)", color: "blue" },
      { category: "Data Fetching", name: "GraphQL (catalog service)", color: "purple" },
      { category: "Styling", name: "Tailwind CSS", color: "teal" },
      { category: "Export", name: "JSON2CSV", color: "amber" },
      { category: "Backend", name: "Express routing", color: "coral" },
      { category: "Docs", name: "Storybook", color: "green" },
    ],
    screens: [
      { name: "Reseller Summary", route: "/", purpose: "Filter by status, dates, product keys — view all authorizations" },
      { name: "Create Reseller", route: "/create", purpose: "New reseller with multi-language names, validity dates, product list" },
      { name: "Reseller Details", route: "/details/[id]", purpose: "Complete reseller info with nested product authorizations" },
      { name: "Edit Reseller", route: "/edit/[id]", purpose: "Modify metadata, products, validity periods, availability" },
    ],
    integrations: [
      { name: "Catalog GraphQL", type: "GraphQL", description: "SubscriptionResellerAuthorizationData, UpsertProductAuthorization, GetProductKeys" },
      { name: "Module Federation", type: "Module Federation", description: "Deployed as federated microfrontend component" },
    ],
    operations: [
      { operation: "Create Reseller", description: "Onboard new reseller with product authorizations and validity dates" },
      { operation: "Edit Reseller", description: "Modify metadata, add/remove product entitlements" },
      { operation: "Expire Authorization", description: "Set end date to deactivate reseller/product authorization" },
      { operation: "Cancel Authorization", description: "Immediately disable reseller authorization" },
      { operation: "Manage Availability", description: "Toggle Enabled / StopSold / Suspended per product" },
      { operation: "Export Data", description: "CSV export of reseller authorization data" },
    ],
    entities: [
      { name: "ResellerAuthorization", description: "Reseller-level authorization record", keyFields: ["id", "nameEN", "nameFR", "status", "validFrom", "validTo", "productAuthorizations[]"] },
      { name: "ProductAuthorization", description: "Per-product entitlement within reseller", keyFields: ["productKey", "availabilityStatus (Enabled/StopSold/Suspended)", "effectiveFrom", "effectiveTo"] },
    ],
    businessRules: [
      "Reseller status lifecycle — Active, Future Dated, Expired, Cancelled",
      "Product availability — Enabled (sellable), StopSold (no new sales), Suspended (fully inactive)",
      "Future-dated and expired authorization tracking for planning",
      "Timezone-aware date display and submission",
      "Confirmation modals for expire/cancel with audit tracking",
      "Dynamic product repeater — add/remove product authorizations in form",
    ],
  },

  // ── 8. Promocode Lookup ─────────────────────────────────────────────────────
  {
    id: "promocode-lookup",
    name: "promocode-lookup",
    displayName: "Promocode Lookup",
    version: "0.1.0",
    status: "production",
    accentColor: "amber",
    summary:
      "Self-service tool for customers and support agents to search and validate promotional codes. Displays code validity, redemption status, cap limits, expiry dates, and associated product offerings. Supports multi-brand lookups with feature-flagged capabilities.",
    businessDomain: "Promotions & Offers Validation",
    businessValue: [
      "Self-service promo validation — customers verify codes without agent support",
      "Support agent lookup — quick troubleshooting for promotion issues",
      "Redemption tracking — monitor usage against cap limits",
      "Multi-brand support — dynamic brand selection (Bell, etc.)",
      "Expired code detection — clear messaging for invalid/expired codes",
    ],
    techStack: [
      { category: "Framework", name: "Next.js 14 (React 18)", color: "blue" },
      { category: "Data Fetching", name: "React Query", color: "purple" },
      { category: "Feature Flags", name: "OpenFeature", color: "green" },
      { category: "i18n", name: "i18next (EN/FR)", color: "amber" },
      { category: "Theming", name: "ThemeProvider (brand)", color: "coral" },
    ],
    screens: [
      { name: "Promo Search", route: "/", purpose: "Search for promotional codes by code value with regex validation" },
      { name: "Promo Details", route: "/", purpose: "Display code validity, redemption status, cap limits, expiry" },
      { name: "Offers Details", route: "/", purpose: "Show associated product offerings and benefits" },
      { name: "Redeemed View", route: "/", purpose: "Track redemption history and usage counts (feature-flagged)" },
    ],
    integrations: [
      { name: "Catalog API", type: "REST", description: "Fetch offering details for matched promotion codes" },
      { name: "Redemption API", type: "REST", description: "Query redemption history, usage counts, cap limits" },
      { name: "OpenFeature", type: "Feature Flags", description: "capLimitLookupTool flag for redemption cap features" },
    ],
    operations: [
      { operation: "Search Promo Code", description: "Validate code format (A-Z0-9_- up to 64 chars) and search" },
      { operation: "View Code Details", description: "Display validity, status, dates, redemption info" },
      { operation: "View Offers", description: "Fetch and display associated product offerings" },
      { operation: "Check Redemption Cap", description: "Monitor usage count against redemption limits (feature-flagged)" },
    ],
    entities: [
      { name: "PromoCode", description: "Promotional code with validity info", keyFields: ["code", "status", "validFrom", "validTo", "redemptionCap", "usageCount"] },
      { name: "PromoOffer", description: "Product offering linked to promo code", keyFields: ["offeringId", "name", "type", "benefits[]"] },
    ],
    businessRules: [
      "Code format — alphanumeric with underscores and hyphens, max 64 characters",
      "Multi-brand filtering — results scoped to selected brand",
      "Redemption cap tracking — usage count vs. maximum allowed redemptions",
      "Expired promo detection — clear user messaging for invalid/expired codes",
      "Language toggle — EN/FR display for bilingual compliance",
      "Feature-flagged capabilities — redemption cap features behind OpenFeature flags",
    ],
  },

  // ── 9. SM Contingency Container ─────────────────────────────────────────────
  {
    id: "sm-contingency-container",
    name: "sm-contingency-container",
    displayName: "SM Contingency Container",
    version: "0.1.0",
    status: "production",
    accentColor: "coral",
    summary:
      "Shell/host application serving as the orchestration layer and entry point for all contingency management tools. Provides SAML 2.0 SSO authentication, role-based access control, primary navigation, and Module Federation host capabilities to load remote microfrontends (contingency-management and others) on demand.",
    businessDomain: "Application Container & Authentication Gateway",
    businessValue: [
      "Single sign-on — SAML 2.0 SSO via Jackson SAML for enterprise authentication",
      "Role-based access — Super User vs Standard User permissions",
      "Module Federation host — loads contingency MFEs on demand without page reloads",
      "Feature governance — OpenFeature integration for gradual feature rollouts",
      "Centralized navigation — unified access to all contingency tools",
    ],
    techStack: [
      { category: "Framework", name: "Next.js 14 (Pages Router)", color: "blue" },
      { category: "Auth", name: "NextAuth 4 + SAML Jackson", color: "amber" },
      { category: "Feature Flags", name: "OpenFeature", color: "green" },
      { category: "Validation", name: "Zod", color: "teal" },
      { category: "Deploy", name: "Module Federation (Host)", color: "purple" },
    ],
    screens: [
      { name: "Dashboard Home", route: "/", purpose: "Tool card grid showing available contingency apps with role-based visibility" },
      { name: "Login / SignIn", route: "/auth/signin", purpose: "SAML 2.0 SSO authentication page" },
      { name: "Subscribers", route: "/subscribers", purpose: "Router outlet — loads contingency-management MFE subscriber features" },
      { name: "Orders", route: "/orders", purpose: "Router outlet — loads contingency-management MFE order features" },
      { name: "Offerings", route: "/offerings", purpose: "Router outlet — loads contingency-management MFE offering features" },
      { name: "Promotions", route: "/promotions", purpose: "Router outlet — loads contingency-management MFE promotion features" },
      { name: "Subscription Order Import", route: "/import", purpose: "Router outlet — bulk order import (Super User only)" },
    ],
    integrations: [
      { name: "SAML 2.0 SSO", type: "SAML", description: "Enterprise SSO integration via Jackson SAML library" },
      { name: "NextAuth", type: "OAuth", description: "Session and token lifecycle management" },
      { name: "OpenFeature", type: "Feature Flags", description: "Conditional feature access and gradual rollouts" },
      { name: "Module Federation", type: "Module Federation", description: "Host application loading remote contingency-management and other MFEs" },
    ],
    operations: [
      { operation: "Authenticate", description: "SAML 2.0 SSO login with session management" },
      { operation: "Route to MFE", description: "Load federated remote modules based on navigation selection" },
      { operation: "Check Permissions", description: "Role-based tool card visibility (Super User special access)" },
      { operation: "Manage Session", description: "Session lifecycle — create, validate, expire" },
    ],
    entities: [
      { name: "ToolCard", description: "Configurable tool entry point", keyFields: ["title", "description", "route", "requiredRole", "icon"] },
      { name: "MenuItem", description: "Navigation menu configuration", keyFields: ["label", "route", "featureFlag", "requiredRole"] },
      { name: "UserSession", description: "Authenticated user session", keyFields: ["userId", "roles[]", "isSuperUser", "samlToken", "expiresAt"] },
    ],
    businessRules: [
      "Super User role — grants access to premium features (e.g. Subscription Order Import)",
      "SAML authentication required — all routes protected except /auth/signin",
      "Module Federation loading — remote MFEs loaded on demand by route match",
      "Feature flags gate tool availability — gradual rollout support",
      "Session timeout — automatic expiry with re-authentication required",
    ],
  },

  // ── 10. Contingency Management ──────────────────────────────────────────────
  {
    id: "contingency-management",
    name: "contingency-management",
    displayName: "Contingency Management",
    version: "0.1.0",
    status: "production",
    accentColor: "blue",
    summary:
      "Core operational tool for managing subscriber accounts, orders, products, and promotions in contingency/fallback scenarios. Provides search/browse capabilities for subscribers, orders, product offerings, and promotions, plus bulk order import via Excel and pending transaction management (edit, retry, publish).",
    businessDomain: "Subscription Management & Order Operations (Contingency)",
    businessValue: [
      "Business continuity — manage subscriptions when primary systems are unavailable",
      "Order lifecycle management — create, view, edit, retry failed transactions",
      "Bulk operations — Excel-based order import with validation and error reporting",
      "Transaction recovery — edit and retry pending/failed transactions",
      "Product/promo catalog browsing — quick lookup for support scenarios",
    ],
    techStack: [
      { category: "Framework", name: "Next.js 14 (React 18)", color: "blue" },
      { category: "Data Fetching", name: "TanStack React Query + GraphQL", color: "purple" },
      { category: "Styling", name: "Tailwind CSS", color: "teal" },
      { category: "Date Handling", name: "date-fns", color: "amber" },
      { category: "Feature Flags", name: "OpenFeature (enhanced_order_search)", color: "green" },
      { category: "Deploy", name: "Module Federation (Remote)", color: "coral" },
    ],
    screens: [
      { name: "Subscribers Search", route: "/subscribers", purpose: "Search by Subscriber ID or Billing Account Number — view subscriber details" },
      { name: "Orders Search", route: "/orders", purpose: "Search by Order ID — view status, session items, offerings, pricing" },
      { name: "Product Offerings", route: "/offerings", purpose: "Browse and search available products with status filtering and pagination" },
      { name: "Promotions", route: "/promotions", purpose: "View and search active/inactive promotions with effective dates" },
      { name: "Subscription Order Import", route: "/import", purpose: "Bulk upload orders via Excel template with validation and error reporting" },
      { name: "Pending Transactions", route: "/transactions", purpose: "Edit, retry, and publish pending transactions with state management" },
    ],
    integrations: [
      { name: "Subscription Manager GraphQL", type: "GraphQL", description: "GetOrder, GetSubscription, SearchProductOfferings, SearchPromotionSpecifications, EnhanceOrderWithCatalog" },
      { name: "OpenFeature", type: "Feature Flags", description: "enhanced_order_search — expanded search by Subscriber ID and BAN" },
      { name: "Module Federation", type: "Module Federation", description: "Remote module loaded by sm-contingency-container host" },
    ],
    operations: [
      { operation: "Search Subscribers", description: "Lookup by Subscriber ID or BAN with dual-field search" },
      { operation: "Search Orders", description: "Find orders by ID with enhanced search (feature-flagged) for Subscriber ID and BAN" },
      { operation: "Browse Offerings", description: "Sortable/paginated product list with status filtering" },
      { operation: "Search Promotions", description: "Date-aware promotion filtering and sorting" },
      { operation: "Import Orders (Bulk)", description: "Upload Excel file with validation, error aggregation, results display" },
      { operation: "Manage Pending Transactions", description: "Edit, retry, publish pending/failed transactions" },
    ],
    entities: [
      { name: "Subscriber", description: "Customer subscription account", keyFields: ["subscriberId", "billingAccountNumber", "offerings[]", "contacts[]", "promotions[]"] },
      { name: "Order", description: "Subscription order with session items", keyFields: ["orderId", "sessionItems[]", "offerings[]", "pricing[]", "subscribers[]", "parties[]"] },
      { name: "ProductOffering", description: "Available subscription product", keyFields: ["id", "name", "status", "pricing[]", "relationships[]"] },
      { name: "PromotionSpecification", description: "Promotion with validity dates", keyFields: ["id", "name", "status", "effectiveFrom", "effectiveTo"] },
      { name: "PendingTransaction", description: "Transaction awaiting processing", keyFields: ["id", "status", "type", "payload", "errorDetails", "retryCount"] },
    ],
    businessRules: [
      "Session storage preserves search state across page navigation",
      "Enhanced order search (feature-flagged) — supports Subscriber ID and BAN in addition to Order ID",
      "Excel import validation — format checks, error aggregation, per-row reporting",
      "Pending transaction states — editable, retryable, publishable based on current state",
      "Product offering status filtering — Active, Future Dated, Expired",
      "Promotion date-aware filtering — show only within effective date range",
    ],
  },
];

// ─── Helper Functions ──────────────────────────────────────────────────────────

export function getMfeById(id: string): MicrofrontendAnalysis | undefined {
  return microfrontends.find((m) => m.id === id);
}

export function getMfesByGroup(groupId: string): MicrofrontendAnalysis[] {
  const group = mfeGroups.find((g) => g.id === groupId);
  if (!group) return [];
  return group.mfeIds.map((id) => getMfeById(id)).filter(Boolean) as MicrofrontendAnalysis[];
}
